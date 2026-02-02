import app from "./app.js";
import { connect_db } from "./db.js";
import { logger } from "./utils/logger.js";

// Conectar a la base de datos
connect_db();

// Escuchar solicitudes en el puerto (Default 4000 para VPS/EasyPanel)
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        port: PORT,
    });
});

// Graceful shutdown
process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });
});

export default app;
