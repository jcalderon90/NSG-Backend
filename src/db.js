import mongoose from "mongoose";
import { logger } from "./utils/logger.js";

let isConnected = false;

/**
 * Función para conectar a la base de datos MongoDB.
 */
export const connect_db = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error(
                "MONGODB_URI is not defined in environment variables",
            );
        }

        const safeUri = uri.replace(/:([^@]+)@/, ":****@");
        logger.info(`Attempting to connect to MongoDB: ${safeUri}`);

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });

        isConnected = true;
        logger.success("Connected to MongoDB successfully");
    } catch (error) {
        isConnected = false;
        logger.error("MongoDB Connection Error:", {
            message: error.message,
            code: error.code,
        });
        throw error;
    }
};
