import express from "express";
import { assistCode } from "../controllers/aiController";

const router = express.Router();

router.post("/assist", assistCode);

export default router;
