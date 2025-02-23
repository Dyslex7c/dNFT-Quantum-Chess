import express from "express";
import { fetchMyNFTs, getUser, register, updateNfts } from "../controllers/user.controller";

const router = express.Router();

router.post("/register", register);
router.get("/account", getUser);
router.get("/my-nfts", fetchMyNFTs);
router.post("/update-nfts", updateNfts);

export default router;