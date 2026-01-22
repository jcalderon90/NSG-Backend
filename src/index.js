import app from "./app.js";
import { connect_db } from "./db.js";
import { logger } from "./utils/logger.js";

// Conectar a la base de datos
connect_db();

// Escuchar solicitudes en el puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || "development",
        port: PORT,
    });
});
