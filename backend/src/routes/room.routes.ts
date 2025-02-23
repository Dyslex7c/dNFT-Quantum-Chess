import express from "express";
import { getRoomData } from "../controllers/room.controller";

const router = express.Router();

router.get("/get-room/:roomId", getRoomData);

export default router;