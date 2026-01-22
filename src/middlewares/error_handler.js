import { logger } from "../utils/logger.js";

/**
 * Error Handler Middleware
 * Maneja todos los errores de la aplicación de forma centralizada
 */
export const errorHandler = (err, req, res, next) => {
    // Log del error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        timestamp: new Date().toISOString(),
    });

    // Determinar el código de estado
    const statusCode = err.statusCode || err.status || 500;

    // Mensaje de error
    const message = err.message || "Internal Server Error";

    // Respuesta de error
    const response = {
        success: false,
        message: message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
            error: err,
        }),
    };

    res.status(statusCode).json(response);
};

/**
 * Not Found Handler
 * Maneja rutas no encontradas
 */
export const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Async Handler Wrapper
 * Envuelve funciones async para capturar errores automáticamente
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
