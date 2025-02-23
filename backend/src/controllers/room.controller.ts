import { Request, Response } from "express";
import { client } from "../redis/client";

export const getRoomData = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            res.status(400).json({ message: "Invalid room ID" });
            return;
        }

        const roomExists = await client.exists(roomId);
        if (!roomExists) {
            res.status(400).json({ message: "Room does not exist" });
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

        res.json(parsedRoomData);
    } catch (error) {
        console.error("Error fetching room data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}