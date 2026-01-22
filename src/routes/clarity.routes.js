import express from "express";
import clarityController from "../controllers/clarityController.js";

const router = express.Router();

/**
 * @route   POST /api/clarity/complete
 * @desc    Mark a protocol as completed for today
 * @access  Private (requires authentication)
 * @body    { userId, protocol, metadata }
 */
router.post("/complete", clarityController.completeProtocol);
router.post("/toggle", clarityController.toggleProtocol);

/**
 * @route   GET /api/clarity/history/:userId
 * @desc    Get completion history for a user
 * @access  Private
 * @query   startDate, endDate, protocol (optional)
 */
router.get("/history/:userId", clarityController.getHistory);

/**
 * @route   GET /api/clarity/metrics/:userId
 * @desc    Get completion metrics for a user
 * @access  Private
 * @query   period (week|month)
 */
router.get("/metrics/:userId", clarityController.getMetrics);

/**
 * @route   GET /api/clarity/streaks/:userId
 * @desc    Get streak information for a user
 * @access  Private
 */
router.get("/streaks/:userId", clarityController.getStreaks);

/**
 * @route   GET /api/clarity/today/:userId
 * @desc    Get today's completed protocols for a user
 * @access  Private
 */
router.get("/today/:userId", clarityController.getTodayCompletions);

/**
 * @route   GET /api/clarity/heatmap/:userId
 * @desc    Get heatmap data for calendar visualization
 * @access  Private
 * @query   months (default: 1)
 */
router.get("/heatmap/:userId", clarityController.getHeatmapData);

export default router;
