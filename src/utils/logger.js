/**
 * Logger Utility
 * Sistema de logging apropiado para desarrollo y producción
 */

const isDevelopment = process.env.NODE_ENV !== "production";

// Colores para consola en desarrollo
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
};

/**
 * Formatea timestamp
 */
const getTimestamp = () => {
    return new Date().toISOString();
};

/**
 * Logger para desarrollo (con colores)
 */
const devLogger = {
    info: (message, ...args) => {
        console.log(
            `${colors.cyan}[INFO]${colors.reset} ${
                colors.bright
            }${getTimestamp()}${colors.reset}`,
            message,
            ...args
        );
    },
    error: (message, ...args) => {
        console.error(
            `${colors.red}[ERROR]${colors.reset} ${
                colors.bright
            }${getTimestamp()}${colors.reset}`,
            message,
            ...args
        );
    },
    warn: (message, ...args) => {
        console.warn(
            `${colors.yellow}[WARN]${colors.reset} ${
                colors.bright
            }${getTimestamp()}${colors.reset}`,
            message,
            ...args
        );
    },
    debug: (message, ...args) => {
        console.log(
            `${colors.magenta}[DEBUG]${colors.reset} ${
                colors.bright
            }${getTimestamp()}${colors.reset}`,
            message,
            ...args
        );
    },
    success: (message, ...args) => {
        console.log(
            `${colors.green}[SUCCESS]${colors.reset} ${
                colors.bright
            }${getTimestamp()}${colors.reset}`,
            message,
            ...args
        );
    },
};

/**
 * Logger para producción (JSON estructurado)
 */
const prodLogger = {
    info: (message, meta = {}) => {
        console.log(
            JSON.stringify({
                level: "info",
                timestamp: getTimestamp(),
                message:
                    typeof message === "string"
                        ? message
                        : JSON.stringify(message),
                ...meta,
            })
        );
    },
    error: (message, meta = {}) => {
        console.error(
            JSON.stringify({
                level: "error",
                timestamp: getTimestamp(),
                message:
                    typeof message === "string"
                        ? message
                        : JSON.stringify(message),
                ...meta,
            })
        );
    },
    warn: (message, meta = {}) => {
        console.warn(
            JSON.stringify({
                level: "warn",
                timestamp: getTimestamp(),
                message:
                    typeof message === "string"
                        ? message
                        : JSON.stringify(message),
                ...meta,
            })
        );
    },
    debug: (message, meta = {}) => {
        // En producción, debug no hace nada para reducir ruido
        return;
    },
    success: (message, meta = {}) => {
        console.log(
            JSON.stringify({
                level: "success",
                timestamp: getTimestamp(),
                message:
                    typeof message === "string"
                        ? message
                        : JSON.stringify(message),
                ...meta,
            })
        );
    },
};

// Exportar el logger apropiado según el entorno
export const logger = isDevelopment ? devLogger : prodLogger;
