import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import morgan from "morgan";

import { app, server } from "./socket/socket";
import { client } from "./redis/client";
import connectToMongoDB from "./db/connectToMongoDB";
import userRoutes from "./routes/user.routes";
import roomRoutes from "./routes/room.routes";

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("common"));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.get("/api/v1", (req: Request, res: Response) => {
    res.send("<h1>Server up & running</h1>");
});

app.use("/api/v1/user",  userRoutes);
app.use("/api/v1/room", roomRoutes);

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    connectToMongoDB();
    if (client) {
        console.log("Connected to Redis");
    } else {
        console.log("Error in connecting to Redis");
    }
});