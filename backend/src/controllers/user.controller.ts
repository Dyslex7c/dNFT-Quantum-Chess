import { Request, Response } from "express";
import User from "../models/user.model";
import { RegisterProps } from "../types";

export const register = async (req: Request, res: Response) => {
    try {
        const { userName, metamaskId, pieceNFTs }: RegisterProps = req.body;

        const existingUser = await User.findOne({
            $or: [{ userName }, { metamaskId }]
        });

        if (existingUser) {
            const errorMessage = existingUser.userName === userName
                ? "Username already exists"
                : "Metamask Id already exists";
            res.status(400).json({ error: errorMessage });
            return;
        }

        const newUser = new User({
            userName,
            metamaskId,
            pieceNFTs
        });

        if (newUser) {
            await newUser.save();
            res.status(201).json(newUser);
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getUser = async (req: Request, res: Response) => {
    try {
        const id = req.query.id;
        const user = await User.findOne({ metamaskId: id });
        if (!user) {
            res.status(400).json({ error: "No such user exists" });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUser controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const fetchMyNFTs = async(req: Request, res: Response) =>  {
    try {
        const id = req.query.id;
        const user = await User.findOne({ metamaskId: id });
        if (!user) {
            res.status(400).json({ error: "No such user exists" });
            return;
        }

        res.status(200).json(user.pieceNFTs);
    } catch (error) {
        console.log("Error in fetchMyNFTs controller", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}