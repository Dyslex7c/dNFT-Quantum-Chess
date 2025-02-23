import express from "express";
import { fetchMyNFTs, getUser, register } from "../controllers/user.controller";

const router = express.Router();

router.post("/register", register);
router.get("/account", getUser);
router.get("/my-nfts", fetchMyNFTs);

export default router;