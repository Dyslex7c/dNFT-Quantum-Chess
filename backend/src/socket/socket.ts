import { Server } from "socket.io";
import http from "http";
import express from "express";
import { client } from "../redis/client";

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

    // CREATE ROOM EVENT
    socket.on("createRoom", async ({ p1Id, R1 }) => {
        if (!p1Id || R1 === undefined) {
            socket.emit("error", { message: "Invalid room data" });
            return;
        }

        const activeRooms = await client.smembers("active_rooms");

        for (const roomId of activeRooms) {
            const roomData = await client.hgetall(roomId);

            if (roomData.p2Id === "null") {
                console.log(`Joining existing room: ${roomId}`);

                await client.hset(roomId, { p2Id: p1Id, R2: R1 });
                await client.hset("user_rooms", p1Id, roomId);
                await client.srem("active_rooms", roomId); 

                const p1SocketId = await client.hget("player_sockets", roomData.p1Id);
                const p2SocketId = await client.hget("player_sockets", p1Id);

                if (p1SocketId) io.to(p1SocketId).emit("gameInitialized", { ...roomData, p2Id: p1Id, R2: R1 });
                if (p2SocketId) io.to(p2SocketId).emit("gameInitialized", { ...roomData, p2Id: p1Id, R2: R1 });

                return;
            }
        }

        const newRoomId = `room_${p1Id}`;
        await client.hset(newRoomId, { p1Id, R1, p2Id: "null", R2: "null" });
        await client.sadd("active_rooms", newRoomId);
        await client.hset("user_rooms", p1Id, newRoomId);

        console.log(`New game room created: ${newRoomId}`);
        io.to(socket.id).emit("roomCreated", { roomId: newRoomId, p1Id, R1, p2Id: null, R2: null });

        // Update active rooms list for all clients
        io.emit("activeRooms", await client.smembers("active_rooms"));
    });



    // JOIN ROOM EVENT
    socket.on("joinRoom", async ({ p2Id, R2, roomId }) => {
        if (!p2Id || R2 === undefined || !roomId) {
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

        await client.hset(roomId, { p2Id, R2 });
        await client.hset("user_rooms", p2Id, roomId);
        await client.srem("active_rooms", roomId);

        console.log(`Player ${p2Id} joined room ${roomId}`, roomData);

        const p1SocketId = await client.hget("player_sockets", roomData.p1Id);
        const p2SocketId = await client.hget("player_sockets", p2Id);

        if (p1SocketId) io.to(p1SocketId).emit("gameInitialized", { ...roomData, p2Id, R2 });
        if (p2SocketId) io.to(p2SocketId).emit("gameInitialized", { ...roomData, p2Id, R2 });

        io.emit("activeRooms", await client.smembers("active_rooms"));
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