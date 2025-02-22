import { Server } from "socket.io";
import http from "http";
import express from "express";
import { client } from "../redis/client";
import { Chess } from "chess.js";
import { PieceProps } from "../types";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

io.on("connection", async (socket) => {
    let userId = socket.handshake.query.userId;
    if (Array.isArray(userId)) {
        userId = userId[0];
    }

    if (userId) {
        await client.hset("player_sockets", userId, socket.id);
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    }

    socket.on("createRoom", async ({ p1Id, R1 }) => {
        if (!p1Id || typeof R1 !== 'number') {
            socket.emit("error", { message: "Invalid room data" });
            return;
        }

        const activeRooms = await client.smembers("active_rooms");

        for (const roomId of activeRooms) {
            const roomData = await client.hgetall(roomId);

            if (roomData.p2Id === "null") {
                console.log(`Joining existing room: ${roomId}`);

                await client.hset(roomId, {
                    p2Id: p1Id,
                    R2: R1
                });
                await client.hset("user_rooms", p1Id, roomId);
                await client.srem("active_rooms", roomId);

                const p1SocketId = await client.hget("player_sockets", roomData.p1Id);
                const p2SocketId = await client.hget("player_sockets", p1Id);

                const parsedRoomData = {
                    ...roomData,
                    R1: Number(roomData.R1),
                    R2: R1,
                    p2Id: p1Id,
                    roomId
                };

                if (p1SocketId) io.to(p1SocketId).emit("gameInitialized", parsedRoomData);
                if (p2SocketId) io.to(p2SocketId).emit("gameInitialized", parsedRoomData);

                return;
            }
        }

        const newRoomId = `room_${p1Id}`;

        await client.hset(newRoomId, {
            p1Id,
            R1,
            p2Id: "null",
            R2: "null",
            roomId: newRoomId
        });
        await client.sadd("active_rooms", newRoomId);
        await client.hset("user_rooms", p1Id, newRoomId);

        console.log(`New game room created: ${newRoomId}`);
        io.to(socket.id).emit("roomCreated", {
            roomId: newRoomId,
            p1Id,
            R1,
            p2Id: null,
            R2: null
        });

        io.emit("activeRooms", await client.smembers("active_rooms"));
    });

    socket.on("joinRoom", async ({ p2Id, R2, roomId }) => {
        if (!p2Id || typeof R2 !== 'number' || !roomId) {
            socket.emit("error", { message: "Invalid room join request" });
            return;
        }

        const roomExists = await client.exists(roomId);
        if (!roomExists) {
            socket.emit("error", { message: "Room does not exist" });
            return;
        }

        const roomData = await client.hgetall(roomId);
        if (roomData.p2Id !== "null") {
            socket.emit("error", { message: "Room is already full" });
            return;
        }

        await client.hset(roomId, {
            p2Id,
            R2
        });
        await client.hset("user_rooms", p2Id, roomId);
        await client.srem("active_rooms", roomId);

        console.log(`Player ${p2Id} joined room ${roomId}`, roomData);

        const p1SocketId = await client.hget("player_sockets", roomData.p1Id);
        const p2SocketId = await client.hget("player_sockets", p2Id);

        const parsedRoomData = {
            ...roomData,
            R1: Number(roomData.R1),
            R2,
            p2Id,
            roomId
        };

        if (p1SocketId) io.to(p1SocketId).emit("gameInitialized", parsedRoomData);
        if (p2SocketId) io.to(p2SocketId).emit("gameInitialized", parsedRoomData);

        io.emit("activeRooms", await client.smembers("active_rooms"));
    });

    socket.on("getRoomData", async (roomId) => {
        if (!roomId) {
            socket.emit("error", { message: "Invalid room ID" });
            return;
        }

        const roomExists = await client.exists(roomId);
        if (!roomExists) {
            socket.emit("error", { message: "Room does not exist" });
            return;
        }

        const roomData = await client.hgetall(roomId);

        const parsedRoomData = {
            ...roomData,
            R1: Number(roomData.R1),
            R2: roomData.R2 === "null" ? null : Number(roomData.R2),
            p2Id: roomData.p2Id === "null" ? null : roomData.p2Id,
            roomId
        };

        const p1SocketId = await client.hget("player_sockets", roomData.p1Id);
        const p2SocketId = roomData.p2Id !== "null" ?
            await client.hget("player_sockets", roomData.p2Id) :
            null;

        if (p1SocketId) io.to(p1SocketId).emit("roomDataUpdate", parsedRoomData);
        if (p2SocketId) io.to(p2SocketId).emit("roomDataUpdate", parsedRoomData);
    });

    //HANDLE MOVE
    socket.on("move", async ({ roomId, ipfsHash, source, destination }) => {
        try {
            if (!roomId || !ipfsHash || !source || !destination) {
                socket.emit("error", { message: "Invalid move data" });
                return;
            }

            const roomExists = await client.exists(roomId);
            if (!roomExists) {
                socket.emit("error", { message: "Room does not exist" });
                return;
            }

            const roomData = await client.hgetall(roomId);
            const chess = new Chess(roomData.fen); // Initialize chess.js with current FEN

            // Verify it's the player's turn
            const currentPlayer = socket.id;
            const isWhiteTurn = chess.turn() === 'w';
            const isPlayerWhite = currentPlayer === await client.hget("player_sockets", roomData.p1Id);
            const isPlayerBlack = currentPlayer === await client.hget("player_sockets", roomData.p2Id);

            if ((isWhiteTurn && !isPlayerWhite) || (!isWhiteTurn && !isPlayerBlack)) {
                socket.emit("error", { message: "Not your turn" });
                return;
            }

            // Attempt to make the move
            const move = chess.move({
                from: source,
                to: destination,
                promotion: 'q' // Always promote to queen for simplicity
            });

            if (!move) {
                socket.emit("error", { message: "Invalid move" });
                return;
            }

            // If move is valid, update the piece weights
            const piecesWhite = JSON.parse(roomData.piecesWhite) as PieceProps[];
            const piecesBlack = JSON.parse(roomData.piecesBlack) as PieceProps[];

            // Find and update the moved piece's weight
            const pieces = isWhiteTurn ? piecesWhite : piecesBlack;
            const pieceIndex = pieces.findIndex((p: PieceProps) => p.ipfsHash === ipfsHash);

            if (pieceIndex !== -1) {
                // Update piece position and potentially its weight based on your game rules
                pieces[pieceIndex].position = destination;

                // Example weight adjustment (modify according to your rules)
                /*const weightChange = calculateWeightChange(source, destination, move.piece);
                pieces[pieceIndex].weight = (pieces[pieceIndex].weight || 0) + weightChange;*/
            }

            // Update Redis with new state
            await client.hset(roomId, {
                fen: chess.fen(),
                piecesWhite: JSON.stringify(piecesWhite),
                piecesBlack: JSON.stringify(piecesBlack),
                lastMove: JSON.stringify({ from: source, to: destination }),
                currentTurn: isWhiteTurn ? "black" : "white"
            });

            // Get socket IDs for both players
            const p1SocketId = await client.hget("player_sockets", roomData.p1Id);
            const p2SocketId = roomData.p2Id !== "null" ?
                await client.hget("player_sockets", roomData.p2Id) :
                null;

            // Prepare update data
            const updatedGameState = {
                ...roomData,
                fen: chess.fen(),
                piecesWhite,
                piecesBlack,
                lastMove: { from: source, to: destination },
                currentTurn: isWhiteTurn ? "black" : "white",
                isCheck: chess.isCheck(),
                isCheckmate: chess.isCheckmate(),
                isStalemate: chess.isStalemate(),
                isDraw: chess.isDraw()
            };

            // Broadcast move to both players
            if (p1SocketId) io.to(p1SocketId).emit("moveUpdate", updatedGameState);
            if (p2SocketId) io.to(p2SocketId).emit("moveUpdate", updatedGameState);

            // If game is over, emit additional event
            if (chess.isGameOver()) {
                const gameOverReason = chess.isCheckmate() ? "checkmate" :
                    chess.isStalemate() ? "stalemate" :
                        chess.isDraw() ? "draw" : "other";

                const gameOverData = {
                    reason: gameOverReason,
                    winner: chess.isCheckmate() ? (isWhiteTurn ? "black" : "white") : "draw"
                };

                if (p1SocketId) io.to(p1SocketId).emit("gameOver", gameOverData);
                if (p2SocketId) io.to(p2SocketId).emit("gameOver", gameOverData);
            }

        } catch (error) {
            console.error("Move error:", error);
            socket.emit("error", { message: "Failed to process move" });
        }
    });

    // DISCONNECT EVENT - Remove Player & Their Room
    socket.on("disconnect", async () => {
        if (userId) {
            await client.hdel("player_sockets", userId);
            console.log(`User ${userId} disconnected`);

            const roomId = await client.hget("user_rooms", userId);
            if (roomId) {
                await client.del(roomId);
                await client.srem("active_rooms", roomId);
                await client.hdel("user_rooms", userId);

                console.log(`Game room ${roomId} removed due to user disconnect`);

                const activeRooms = await client.smembers("active_rooms");
                io.emit("activeRooms", activeRooms);
            }
        }
    });
});

export { app, io, server };