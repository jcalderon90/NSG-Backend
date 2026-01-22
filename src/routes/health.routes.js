import { Router } from "express";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const router = Router();

/**
 * GET /health
 * Health check endpoint para monitoreo en producción
 */
router.get("/", async (req, res) => {
    try {
        // Verificar conexión a MongoDB
        const dbStatus =
            mongoose.connection.readyState === 1 ? "connected" : "disconnected";
        const isHealthy = dbStatus === "connected";

        const healthData = {
            status: isHealthy ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            database: {
                status: dbStatus,
                name: mongoose.connection.name || "unknown",
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(
                    process.memoryUsage().heapTotal / 1024 / 1024
                ),
                unit: "MB",
            },
        };

        // Si no está saludable, responder con 503
        if (!isHealthy) {
            logger.warn("Health check failed", healthData);
            return res.status(503).json(healthData);
        }

        res.status(200).json(healthData);
    } catch (error) {
        logger.error("Health check error", { error: error.message });
        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});

/**
 * GET /health/ready
 * Readiness probe - verifica que el servidor esté listo para recibir tráfico
 */
router.get("/ready", async (req, res) => {
    try {
        const isReady = mongoose.connection.readyState === 1;

        if (!isReady) {
            return res.status(503).json({
                ready: false,
                message: "Database not ready",
            });
        }

        res.status(200).json({
            ready: true,
            message: "Server is ready",
        });
    } catch (error) {
        res.status(503).json({
            ready: false,
            error: error.message,
        });
    }
});

/**
 * GET /health/live
 * Liveness probe - verifica que el servidor esté vivo
 */
router.get("/live", (req, res) => {
    res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
    });
});

export default router;
