import { Router } from "express";
import {
    saveFathomToken,
    getFathomStatus,
    deleteFathomToken,
    getFathomMeetings,
    generateFathomAnalysis,
    getRecordingAnalysis,
    updateCheckedSteps
} from "../controllers/fathom.controller.js";
import { auth_required } from "../middlewares/validate_token.js";

const fathom_router = Router();

// Guardar access token de Fathom
fathom_router.post("/token", auth_required, saveFathomToken);

// Obtener estado de conexión de Fathom
fathom_router.get("/status", auth_required, getFathomStatus);

// Obtener lista de reuniones
fathom_router.get("/meetings", auth_required, getFathomMeetings);

// Obtener análisis previo de una grabación
fathom_router.get("/analysis/:recording_id", auth_required, getRecordingAnalysis);

// Generar análisis profundo (Proxy a N8N)
fathom_router.post("/generate-analysis", auth_required, generateFathomAnalysis);

// Actualizar pasos marcados
fathom_router.put("/analysis/:recording_id/steps", auth_required, updateCheckedSteps);

// Eliminar access token de Fathom
fathom_router.delete("/token", auth_required, deleteFathomToken);

export default fathom_router;
