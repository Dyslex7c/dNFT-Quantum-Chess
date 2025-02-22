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
        const actives = await client.hgetall("player_sockets");
        console.log(actives);
        console.log(`User ${userId} connected with socket ID ${socket.id}`);
    }

    socket.on("disconnect", async () => {
        if (userId) {
            await client.hdel("player_sockets", userId);
            const actives = await client.hgetall("player_sockets");
            console.log(actives);
            console.log(`User ${userId} disconnected`);
        }
    });
})

export { app, io, server };