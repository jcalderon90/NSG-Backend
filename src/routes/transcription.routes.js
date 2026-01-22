import { Router } from "express";
import multer from "multer";
import {
    createTranscription,
    getTranscriptionsByUser,
    generateTranscriptionAnalysis,
    getTranscriptionAnalysis,
    updateTranscriptionCheckedSteps,
    deleteTranscription,
    saveAudioTranscript,
    proxyAudioAnalysis,
} from "../controllers/transcription.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/transcription", createTranscription);
router.get("/transcription/user/:userId", getTranscriptionsByUser);
router.delete("/transcription/:id", deleteTranscription);
router.post("/save-audio-transcript", saveAudioTranscript);

// New proxy route
router.post(
    "/proxy-audio-analysis",
    upload.single("audio"),
    proxyAudioAnalysis
);

// Analysis routes
router.post("/generate-analysis", generateTranscriptionAnalysis);
router.get("/analysis/:transcription_id", getTranscriptionAnalysis);
router.put(
    "/analysis/:transcription_id/steps",
    updateTranscriptionCheckedSteps
);

export default router;
