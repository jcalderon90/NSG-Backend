import express from "express";
import morgan from "morgan";
import cookie_parser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

//routers
import auth_routes from "./routes/auth.routes.js";
import user_routes from "./routes/user.routes.js";
import fathom_routes from "./routes/fathom.routes.js";
import google_routes from "./routes/google.routes.js";
import telegram_routes from "./routes/telegram.routes.js";
import news_routes from "./routes/news.routes.js";
import strategy_routes from "./routes/strategy.routes.js";
import transcription_routes from "./routes/transcription.routes.js";
import health_routes from "./routes/health.routes.js";
import copilot_routes from "./routes/copilot.routes.js";
import education_routes from "./routes/education.routes.js";

// middlewares
import { errorHandler, notFoundHandler } from "./middlewares/error_handler.js";
import { CONFIG } from "./config.js";

const app = express();

// Basic Liveness Check (Fast response for EasyPanel/Health Checks)
app.get("/health/live", (req, res) => {
    res.status(200).send("OK");
});

// Root route (also serves as a health check)
app.get("/", (req, res) => {
    res.status(200).send("Bienvenido - Server is live");
});

const allowedOrigins = CONFIG.ALLOWED_ORIGINS;

app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir peticiones sin origen (como apps móviles o curl)
            if (!origin) return callback(null, true);

            const originUrl = origin.replace(/\/$/, "");

            // Verificación: permitir si está en la lista o si es localhost en desarrollo
            const isAllowed =
                allowedOrigins.includes(originUrl) ||
                (process.env.NODE_ENV !== "production" &&
                    /^http:\/\/localhost:\d+$/.test(originUrl));

            if (isAllowed) {
                callback(null, true);
            } else {
                console.warn(`[CORS] Rejected origin: ${origin}`);
                callback(null, false); // No pasar un Error, simplemente denegar
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Cookie",
        ],
        optionsSuccessStatus: 200,
    }),
);

// Configurar morgan para mostrar los registros de las solicitudes en el formato 'dev'
app.use(morgan("dev"));

// Configurar el middleware para parsear solicitudes JSON y aumentar el límite para soportar audios (ej. 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cookie_parser());

// Deshabilitar caché para todas las rutas
app.use((req, res, next) => {
    res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
    });
    next();
});

// Database connection middleware (Ensures DB is connected before processing requests)
import { connect_db } from "./db.js";
app.use(async (req, res, next) => {
    try {
        await connect_db();
        next();
    } catch (error) {
        console.error("Database connection failed:", error.message);
        res.status(500).json({
            message: "Database connection failed",
            error: error.message,
            code: "DB_CONNECTION_ERROR",
        });
    }
});

// Configurar las rutas de autenticación de usuarios con el prefijo '/auth'
app.use("/auth", auth_routes);
// Configurar las rutas de autenticación de usuarios con el prefijo '/user'
app.use("/user", user_routes);
// Configurar las rutas de Fathom Analytics con el prefijo '/fathom'
app.use("/fathom", fathom_routes);
// Configurar las rutas de Google Calendar con el prefijo '/google'
app.use("/google", google_routes);
// Configurar las rutas de Telegram con el prefijo '/telegram'
app.use("/telegram", telegram_routes);
// Configurar las rutas de News con el prefijo '/news'
app.use("/news", news_routes);
// Configurar las rutas de Estrategias con el prefijo '/strategies'
app.use("/strategies", strategy_routes);
// Configurar las rutas de Transcripciones con el prefijo '/transcriptions'
app.use("/transcriptions", transcription_routes);
// Configurar las rutas de Health Check con el prefijo '/health'
app.use("/health", health_routes);
// Configurar las rutas de Copilot con el prefijo '/copilot'
app.use("/copilot", copilot_routes);
// Configurar las rutas de Education con el prefijo '/education'
app.use("/education", education_routes);

// Middleware de manejo de rutas no encontradas (debe estar después de todas las rutas)
app.use(notFoundHandler);

// Middleware de manejo de errores global (debe estar al final)
app.use(errorHandler);

export default app;
