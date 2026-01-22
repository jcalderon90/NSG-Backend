import { Router } from "express";
import {
    getGoogleAuthUrl,
    googleCallback,
    getCalendarEvents,
    disconnectGoogle,
} from "../controllers/google.controller.js";
import { auth_required } from "../middlewares/validate_token.js";

const google_router = Router();

// 1. Obtener URL para redirección a Google
google_router.get("/auth", auth_required, getGoogleAuthUrl);

// 2. Callback de Google (No requiere auth_required aquí porque viene de Google)
google_router.get("/callback", googleCallback);

// 3. Obtener eventos (Requiere auth del usuario en NSG)
google_router.get("/calendar/events", auth_required, getCalendarEvents);

// 4. Desconectar
google_router.delete("/calendar", auth_required, disconnectGoogle);

export default google_router;
