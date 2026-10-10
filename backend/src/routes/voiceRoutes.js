import express from "express";

import { uploadVoice,getVoiceAnalyses,analyzeVoice } from "../controllers/voiceController.js";

import { protect } from "../middleware/authMiddleware.js";

import { upload } from "../config/multer.js";

const router = express.Router();

router.post(
    "/upload",
    protect,
    upload.single("voice"),
    uploadVoice
);

router.get(
    "/analyses",
    protect,
    getVoiceAnalyses
);

router.post(
    "/analyze/:id",
    protect,
    analyzeVoice
);

export default router;