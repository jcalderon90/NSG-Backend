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

        // Log safe version of URI for debugging
        const safeUri = uri.replace(/:([^@]+)@/, ":****@");
        logger.info(`Attempting to connect to MongoDB: ${safeUri}`);

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        logger.success("Connected to MongoDB successfully");
    } catch (error) {
        logger.error("MongoDB Connection Error:", {
            message: error.message,
            code: error.code,
        });
        // En Vercel no queremos hacer process.exit(1) porque mataría la función,
        // pero en un server tradicional sí. Para serverless, mejor dejar que ocurra el error.
        if (process.env.NODE_ENV !== "production") {
            // process.exit(1);
        }
    }
};
