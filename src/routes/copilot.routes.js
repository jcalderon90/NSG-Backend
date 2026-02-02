import express from "express";
import copilotController from "../controllers/copilotController.js";

const router = express.Router();

/**
 * @route   POST /api/copilot/complete
 * @desc    Mark a protocol as completed for today
 * @access  Private (requires authentication)
 * @body    { userId, protocol, metadata }
 */
router.post("/complete", copilotController.completeProtocol);
router.post("/toggle", copilotController.toggleProtocol);

/**
 * @route   GET /api/copilot/history/:userId
 * @desc    Get completion history for a user
 * @access  Private
 * @query   startDate, endDate, protocol (optional)
 */
router.get("/history/:userId", copilotController.getHistory);

/**
 * @route   GET /api/copilot/metrics/:userId
 * @desc    Get completion metrics for a user
 * @access  Private
 * @query   period (week|month)
 */
router.get("/metrics/:userId", copilotController.getMetrics);

/**
 * @route   GET /api/copilot/streaks/:userId
 * @desc    Get streak information for a user
 * @access  Private
 */
router.get("/streaks/:userId", copilotController.getStreaks);

/**
 * @route   GET /api/copilot/today/:userId
 * @desc    Get today's completed protocols for a user
 * @access  Private
 */
router.get("/today/:userId", copilotController.getTodayCompletions);

/**
 * @route   GET /api/copilot/heatmap/:userId
 * @desc    Get heatmap data for calendar visualization
 * @access  Private
 * @query   months (default: 1)
 */
router.get("/heatmap/:userId", copilotController.getHeatmapData);

export default router;
