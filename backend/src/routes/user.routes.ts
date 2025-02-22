import express from "express";
import { getUser, register } from "../controllers/user.controller";

const router = express.Router();

router.post("/register", register);
router.get("/account", getUser);

export default router;