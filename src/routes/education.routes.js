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
} from "../controllers/education.controller.js";
import { auth_required } from "../middlewares/validate_token.js";

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

education_router.post("/content/:contentId/update", update_content_data);

// Guardar respuestas a las preguntas del recurso
education_router.post(
    "/content/:contentId/answers",
    auth_required,
    save_answers,
);

// Chat con el contenido
education_router.post("/content/:contentId/chat", auth_required, (req, res) => {
    // Placeholder para el controlador de chat
    res.json({
        message: {
            id: Date.now().toString(),
            role: "bot",
            content:
                "Hola. Estoy analizando este recurso para responderte. Por ahora estoy en modo demo.",
            timestamp: new Date(),
        },
    });
});

export default education_router;
