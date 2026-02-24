import { Router } from "express";
import {
    get_onboarding_status,
    get_preferences,
    save_preferences,
    reset_onboarding,
    get_content,
    delete_content,
    get_single_content,
    save_answers,
    update_content_data,
    get_generated_content,
    start_questions,
    content_chat,
} from "../controllers/education.controller.js";
import { auth_required } from "../middlewares/validate_token.js";
import { CONFIG } from "../config.js";

const education_router = Router();

// Verificar estado del onboarding
education_router.get(
    "/onboarding/status",
    auth_required,
    get_onboarding_status,
);

// Obtener preferencias guardadas
education_router.get("/preferences", auth_required, get_preferences);

// Guardar/Actualizar preferencias (completa el onboarding)
education_router.post("/preferences", auth_required, save_preferences);

// Resetear onboarding
education_router.post("/onboarding/reset", auth_required, reset_onboarding);

// Obtener todos los recursos procesados del usuario
education_router.get("/content", auth_required, get_content);

// Obtener un recurso específico
education_router.get("/content/:contentId", auth_required, get_single_content);

// Eliminar un recurso específico
education_router.delete("/content/:contentId", auth_required, delete_content);

// Middleware para validar webhook de n8n (secreto compartido)
const validate_webhook_secret = (req, res, next) => {
    const secret = req.headers["x-webhook-secret"];
    const expectedSecret = CONFIG.N8N_WEBHOOK_SECRET;

    // Si no hay secreto configurado, permitir (desarrollo)
    if (!expectedSecret) {
        return next();
    }

    if (!secret || secret !== expectedSecret) {
        return res.status(401).json({
            success: false,
            message: "Webhook no autorizado",
        });
    }
    next();
};

education_router.post(
    "/content/:contentId/update",
    validate_webhook_secret,
    update_content_data,
);

// Obtener el análisis final generado
education_router.get(
    "/content/:contentId/generated",
    auth_required,
    get_generated_content,
);

// Guardar respuestas a las preguntas del recurso
education_router.post(
    "/content/:contentId/answers",
    auth_required,
    save_answers,
);

// Iniciar o recuperar preguntas de análisis
education_router.post(
    "/content/:contentId/questions",
    auth_required,
    start_questions,
);

// Chat con el contenido
education_router.post("/content/:contentId/chat", auth_required, content_chat);

export default education_router;
