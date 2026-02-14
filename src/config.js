import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

export const TOKEN_SECRET = process.env.TOKEN_SECRET || "some secret key";

export const CONFIG = {
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGODB_URI: process.env.MONGODB_URI,

    // Dynamic URLs based on environment
    FRONTEND_URL: isProduction
        ? "https://nsgintelligence.com"
        : "http://localhost:3200",

    GOOGLE_REDIRECT_URI:
        process.env.GOOGLE_REDIRECT_URI ||
        (isProduction
            ? "https://api.nsgintelligence.com/google/callback"
            : "http://localhost:4000/google/callback"),

    API_BASE_URL: isProduction
        ? "https://api.nsgintelligence.com"
        : "http://localhost:4000",

    N8N_BASE_URL:
        process.env.N8N_BASE_URL ||
        "https://personal-n8n.suwsiw.easypanel.host",

    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
        : [
              "https://nsgintelligence.com",
              "https://www.nsgintelligence.com",
              "http://localhost:3200",
              "http://127.0.0.1:3200",
          ],

    // Secret compartido para autenticar webhooks entrantes de n8n
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET || "",
};
