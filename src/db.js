import mongoose from "mongoose";
import { logger } from "./utils/logger.js";

/**
 * Función para conectar a la base de datos MongoDB.
 */

export const connect_db = async () => {
    try {
        const uri =
            process.env.MONGODB_URI ||
            "mongodb+srv://iagentsnsg_db_user:Nc0lLH0zK6LEFJQP@cluster0.pgbmwuy.mongodb.net/Database?appName=Cluster0";
        await mongoose.connect(uri);
        logger.success("Connected to MongoDB successfully");
    } catch (error) {
        logger.error("MongoDB Connection Error:", {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1); // Salir si no se puede conectar a la DB
    }
};
