import express from "express";
import copilotController from "../controllers/copilotController.js";
import { auth_required } from "../middlewares/validate_token.js";

const router = express.Router();

/**
 * @route   POST /api/copilot/complete
 * @desc    Mark a protocol as completed for today
 * @access  Private (requires authentication)
 */
router.post("/complete", auth_required, copilotController.completeProtocol);
router.post("/toggle", auth_required, copilotController.toggleProtocol);

/**
 * @route   GET /api/copilot/history
 * @desc    Get completion history for a user
 * @access  Private
 */
router.get("/history", auth_required, copilotController.getHistory);

/**
 * @route   GET /api/copilot/metrics
 * @desc    Get completion metrics for a user
 * @access  Private
 */
router.get("/metrics", auth_required, copilotController.getMetrics);

/**
 * @route   GET /api/copilot/streaks
 * @desc    Get streak information for a user
 * @access  Private
 */
router.get("/streaks", auth_required, copilotController.getStreaks);

/**
 * @route   GET /api/copilot/today
 * @desc    Get today's completed protocols for a user
 * @access  Private
 */
router.get("/today", auth_required, copilotController.getTodayCompletions);

/**
 * @route   GET /api/copilot/heatmap
 * @desc    Get heatmap data for calendar visualization
 * @access  Private
 */
router.get("/heatmap", auth_required, copilotController.getHeatmapData);

export default router;
