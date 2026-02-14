import mongoose from "mongoose";
import EducationPreferences from "../models/education-preferences.model.js";
import EducationContent from "../models/education-content.model.js";
import EducationGeneratedContent from "../models/education-generated-content.model.js";
import User from "../models/user.model.js";
import { CONFIG } from "../config.js";

/**
 * Verificar si el usuario ha completado el onboarding
 * GET /education/onboarding/status
 */
export const get_onboarding_status = async (req, res) => {
    try {
        const user_id = req.user.id;

        let preferences = await EducationPreferences.findOne({
            user_id: user_id.toString(),
        });

        // Si no existe registro, crear uno nuevo (usuario nuevo)
        if (!preferences) {
            // Obtener telegram_id del usuario
            const user = await User.findById(user_id);
            const telegram_id = user?.telegram_id || null;

            preferences = new EducationPreferences({
                user_id: user_id.toString(),
                telegram_id,
                onboarding_completed: false,
            });
            await preferences.save();
        }

        res.json({
            onboarding_completed: preferences.onboarding_completed,
            completed_at: preferences.completed_at,
            has_preferences: preferences.onboarding_completed,
        });
    } catch (error) {
        console.error("[ERROR] get_onboarding_status:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Obtener las preferencias del usuario (si existen)
 * GET /education/preferences
 */
export const get_preferences = async (req, res) => {
    try {
        const user_id = req.user.id;

        const preferences = await EducationPreferences.findOne({
            user_id: user_id.toString(),
        });

        if (!preferences || !preferences.onboarding_completed) {
            return res.status(404).json({
                message: "Onboarding not completed",
                onboarding_completed: false,
            });
        }

        res.json({
            onboarding_completed: true,
            preferences: {
                entregable: preferences.entregable,
                learning_style: preferences.learning_style,
                depth: preferences.depth,
                context: preferences.context,
                strength: preferences.strength,
                friction: preferences.friction,
                numerology_enabled: preferences.numerology_enabled,
                birth_date: preferences.birth_date,
            },
            completed_at: preferences.completed_at,
        });
    } catch (error) {
        console.error("[ERROR] get_preferences:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Guardar/Actualizar las preferencias del usuario
 * POST /education/preferences
 * Body: { entregable, learning_style, depth, context, strength, friction, numerology_enabled?, birth_date? }
 */
export const save_preferences = async (req, res) => {
    try {
        const user_id = req.user.id;
        const {
            entregable,
            learning_style,
            depth,
            context,
            strength,
            friction,
            numerology_enabled,
            birth_date,
        } = req.body;

        // Validar que al menos los campos básicos estén presentes
        if (
            !entregable ||
            !learning_style ||
            !depth ||
            !context ||
            !strength ||
            !friction
        ) {
            return res.status(400).json({
                message: "Faltan campos requeridos",
                required: [
                    "entregable",
                    "learning_style",
                    "depth",
                    "context",
                    "strength",
                    "friction",
                ],
            });
        }

        // Obtener telegram_id del usuario
        const user = await User.findById(user_id);
        const telegram_id = user?.telegram_id || null;

        let preferences = await EducationPreferences.findOne({
            user_id: user_id.toString(),
        });

        if (!preferences) {
            // Crear nuevo registro
            preferences = new EducationPreferences({
                user_id: user_id.toString(),
                telegram_id,
                entregable,
                learning_style,
                depth,
                context,
                strength,
                friction,
                numerology_enabled: numerology_enabled || false,
                birth_date: birth_date || null,
                onboarding_completed: true,
                completed_at: new Date(),
            });
        } else {
            // Actualizar existente
            preferences.telegram_id = telegram_id; // Actualizar telegram_id por si cambió
            preferences.entregable = entregable;
            preferences.learning_style = learning_style;
            preferences.depth = depth;
            preferences.context = context;
            preferences.strength = strength;
            preferences.friction = friction;
            preferences.numerology_enabled = numerology_enabled || false;
            preferences.birth_date = birth_date || null;
            preferences.onboarding_completed = true;
            preferences.completed_at = new Date();
        }

        await preferences.save();

        console.log(`[INFO] Preferencias guardadas para usuario ${user_id}`);

        res.json({
            message: "Preferencias guardadas exitosamente",
            onboarding_completed: true,
            preferences: {
                entregable: preferences.entregable,
                learning_style: preferences.learning_style,
                depth: preferences.depth,
                context: preferences.context,
                strength: preferences.strength,
                friction: preferences.friction,
                numerology_enabled: preferences.numerology_enabled,
                birth_date: preferences.birth_date,
            },
        });
    } catch (error) {
        console.error("[ERROR] save_preferences:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Resetear el onboarding (permite al usuario volver a hacer las preguntas)
 * POST /education/onboarding/reset
 */
export const reset_onboarding = async (req, res) => {
    try {
        const user_id = req.user.id;

        const preferences = await EducationPreferences.findOne({
            user_id: user_id.toString(),
        });

        if (!preferences) {
            return res.status(404).json({
                message: "No se encontraron preferencias para resetear",
            });
        }

        await preferences.reset();

        console.log(
            `[INFO] Onboarding reseteado para usuario ${user_id} (${preferences.times_reset} veces)`,
        );

        res.json({
            message: "Onboarding reseteado exitosamente",
            onboarding_completed: false,
            times_reset: preferences.times_reset,
        });
    } catch (error) {
        console.error("[ERROR] reset_onboarding:", error);
        res.status(500).json({ message: error.message });
    }
};

// mongoose is now imported at the top of the file

/**
 * Obtener todos los recursos procesados de Education del usuario
 * GET /education/content
 */
export const get_content = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log(
            `[Education] Consultando contenido para usuario: ${user_id}`,
        );

        // Búsqueda flexible por si acaso el ID está guardado como ObjectId o String
        // Optimizamos la consulta EXCLUYENDO campos potencialmente pesados para la vista de lista
        const contents = await EducationContent.find(
            {
                $or: [
                    { user_id: user_id.toString() },
                    {
                        user_id: mongoose.Types.ObjectId.isValid(user_id)
                            ? new mongoose.Types.ObjectId(user_id)
                            : user_id,
                    },
                ],
            },
            {
                extracted_data: 0,
                "question_process.question_blocks": 0,
            },
        )
            .sort({ createdAt: -1 }) // Más recientes primero
            .lean();

        console.log(
            `[Education] Registros encontrados en DB: ${contents.length}`,
        );

        // Mapear a formato frontend
        const mapped = contents.map((item) => {
            // Título: Prioridad 1: data.title, Prioridad 2: extracted_data (no disponible aquí), Fallback: Tipo de recurso
            let title = item.data?.title;

            // Si no hay título, intentamos sacar algo del summary o tipo
            if (!title) {
                title = item.source_type
                    ? `Recurso ${item.source_type.toUpperCase()}`
                    : "Recurso de Inteligencia";
            }

            // El resumen ahora viene preferiblemente de item.data.summary si existe
            const summary =
                item.data?.summary ||
                (item.source_type
                    ? `Análisis de recurso ${item.source_type}`
                    : "Analizando contenido estratégico...");

            // Formatear fechas de forma segura
            const formatDate = (date) => {
                if (!date) return new Date().toISOString();
                try {
                    if (typeof date.toISOString === "function")
                        return date.toISOString();
                    const d = new Date(date);
                    return isNaN(d.getTime())
                        ? new Date().toISOString()
                        : d.toISOString();
                } catch (e) {
                    return new Date().toISOString();
                }
            };

            return {
                id: item._id.toString(),
                title: title,
                type: item.source_type || "document",
                status: item.question_process?.completed
                    ? "ready"
                    : "processing",
                thumbnailUrl: item.source_url || null,
                createdAt: formatDate(item.createdAt || item.created_at),
                updatedAt: formatDate(item.updatedAt || item.updated_at),
                summary:
                    typeof summary === "string" && summary.length > 120
                        ? summary.substring(0, 120) + "..."
                        : summary,
                fullData: {
                    ...(item.data || {}),
                    // extracted_data y question_blocks se excluyen para aligerar la carga
                    // el frontend los pedirá por ID cuando sea necesario
                    question_process: {
                        completed: item.question_process?.completed || false,
                    },
                    telegram_id: item.telegram_id,
                },
            };
        });

        res.json({
            success: true,
            data: mapped,
        });
    } catch (error) {
        console.error("[ERROR] get_content:", error);
        res.status(500).json({
            success: false,
            message: "Error al procesar la biblioteca de recursos",
            details: error.message,
        });
    }
};

/**
 * Eliminar un recurso de Education
 * DELETE /education/content/:contentId
 */
export const delete_content = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { contentId } = req.params;

        // Búsqueda flexible por si acaso el ID está guardado como ObjectId o String
        const content = await EducationContent.findOne({
            _id: contentId,
            $or: [
                { user_id: user_id.toString() },
                {
                    user_id: mongoose.Types.ObjectId.isValid(user_id)
                        ? new mongoose.Types.ObjectId(user_id)
                        : user_id,
                },
            ],
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message:
                    "Recurso no encontrado o no tienes permisos para eliminarlo",
            });
        }

        await EducationContent.findByIdAndDelete(contentId);

        // Limpiar contenido generado asociado (evitar datos huérfanos)
        await EducationGeneratedContent.deleteMany({ resource_id: contentId });

        console.log(
            `[INFO] Recurso ${contentId} eliminado por usuario ${user_id}`,
        );

        res.json({
            success: true,
            message: "Recurso eliminado exitosamente",
        });
    } catch (error) {
        console.error("[ERROR] delete_content:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Obtener un solo recurso por ID
 * GET /education/content/:contentId
 */
export const get_single_content = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { contentId } = req.params;

        // Búsqueda flexible por si acaso el ID está guardado como ObjectId o String
        const item = await EducationContent.findOne({
            _id: contentId,
            $or: [
                { user_id: user_id.toString() },
                {
                    user_id: mongoose.Types.ObjectId.isValid(user_id)
                        ? new mongoose.Types.ObjectId(user_id)
                        : user_id,
                },
            ],
        }).lean();

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Recurso no encontrado",
            });
        }

        // Título: Prioridad 1: data.title, Prioridad 2: extracted_data (primeras palabras), Fallback: Tipo de recurso
        let title = item.data?.title;
        if (
            !title &&
            item.extracted_data &&
            typeof item.extracted_data === "string"
        ) {
            title = item.extracted_data.split(/\r?\n/, 1)[0].substring(0, 50);
        }
        if (!title) {
            title = item.source_type
                ? `Recurso ${item.source_type.toUpperCase()}`
                : "Recurso de Inteligencia";
        }

        const full_text =
            item.extracted_data || (item.data ? item.data.summary : "") || "";
        const summary =
            typeof full_text === "string"
                ? full_text.length > 120
                    ? full_text.substring(0, 120) + "..."
                    : full_text
                : "Contenido no disponible";

        // Mapear al mismo formato usado en get_content para consistencia
        const mapped = {
            id: item._id.toString(),
            title: title,
            type: item.source_type || "document",
            status: item.question_process?.completed ? "ready" : "processing",
            thumbnailUrl: item.source_url || null,
            createdAt:
                (
                    item.createdAt ||
                    item.created_at ||
                    new Date()
                ).toISOString?.() ||
                item.createdAt ||
                item.created_at ||
                new Date().toISOString(),
            updatedAt:
                (
                    item.updatedAt ||
                    item.updated_at ||
                    new Date()
                ).toISOString?.() ||
                item.updatedAt ||
                item.updated_at ||
                new Date().toISOString(),
            summary: summary,
            fullData: {
                ...(item.data || {}),
                extracted_data: item.extracted_data,
                question_process: item.question_process,
                telegram_id: item.telegram_id,
            },
        };

        res.json({
            success: true,
            data: mapped,
        });
    } catch (error) {
        console.error("[ERROR] get_single_content:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener el recurso",
            details: error.message,
        });
    }
};

export const save_answers = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { contentId } = req.params;
        const { answers } = req.body;

        const content = await EducationContent.findOne({
            _id: contentId,
            $or: [
                { user_id: user_id.toString() },
                {
                    user_id: mongoose.Types.ObjectId.isValid(user_id)
                        ? new mongoose.Types.ObjectId(user_id)
                        : user_id,
                },
            ],
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Recurso no encontrado",
            });
        }

        // Mapear respuestas en los bloques de preguntas
        if (
            content.question_process &&
            content.question_process.question_blocks
        ) {
            content.question_process.question_blocks =
                content.question_process.question_blocks.map((block) => ({
                    ...block,
                    questions: block.questions.map((q) => ({
                        ...q,
                        answer: answers[q.id] || q.answer || "",
                    })),
                }));

            // Marcar como completado
            content.question_process.completed = true;
            content.markModified("question_process");
        }

        await content.save();

        // Notificar a n8n para generar el contenido final y esperar respuesta
        try {
            const N8N_BASE_URL = CONFIG.N8N_BASE_URL;
            if (!N8N_BASE_URL) {
                throw new Error("N8N_BASE_URL is not defined");
            }

            // NOTA: La URL en n8n tiene un typo ("rescource" en vez de "resource")
            // Se mantiene así para coincidir con el webhook configurado en n8n
            const webhookUrl = `${N8N_BASE_URL}/webhook/generate-rescource-content`;
            console.log(
                `[Education] Notificando a n8n para generar contenido final: ${contentId}`,
                `URL: ${webhookUrl}`,
            );

            const webhookResponse = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contentId: contentId,
                    action: "generate_analysis",
                }),
            });

            if (!webhookResponse.ok) {
                const errorText = await webhookResponse.text().catch(() => "");
                throw new Error(
                    `n8n responded with status: ${webhookResponse.status} - ${errorText}`,
                );
            }

            // Parsear la respuesta de forma segura (n8n puede devolver vacío)
            const responseText = await webhookResponse.text().catch(() => "");
            let webhookData;
            try {
                webhookData = responseText
                    ? JSON.parse(responseText)
                    : { success: true };
            } catch (parseErr) {
                console.warn(
                    "[Education] n8n response was not valid JSON:",
                    responseText,
                );
                webhookData = { success: true, raw: responseText };
            }

            console.log("[Education] n8n response success:", webhookData);

            return res.json({
                success: true,
                message: "Análisis generado exitosamente",
                data: content.question_process,
                generated: true,
            });
        } catch (webhookError) {
            console.error(
                "[ERROR] Failed to trigger final n8n webhook:",
                webhookError.message,
            );
            return res.status(502).json({
                success: false,
                message: "El servidor de análisis no respondió correctamente",
                error: webhookError.message,
            });
        }
    } catch (error) {
        console.error("[ERROR] save_answers:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Endpoint para que n8n actualice los datos del recurso (preguntas o análisis final)
 * POST /education/content/:contentId/update
 */
export const update_content_data = async (req, res) => {
    try {
        const { contentId } = req.params;
        const updateData = req.body;

        console.log(
            `[Education] Recibida actualización desde n8n para: ${contentId}`,
        );

        const content = await EducationContent.findById(contentId);
        if (!content) {
            return res
                .status(404)
                .json({ success: false, message: "Recurso no encontrado" });
        }

        // Si n8n envía bloques de preguntas
        if (updateData.question_blocks) {
            content.question_process = {
                completed: updateData.completed || false,
                current_step: updateData.current_step || 0,
                question_blocks: updateData.question_blocks,
            };
            content.markModified("question_process");
        }

        // Si n8n envía el análisis final
        if (updateData.data) {
            content.data = {
                ...content.data,
                ...updateData.data,
            };

            // Si viene el análisis completo o n8n lo marca, finalizar
            if (
                updateData.completed === true ||
                updateData.data.strategic_analysis
            ) {
                if (!content.question_process) content.question_process = {};
                content.question_process.completed = true;
                content.markModified("question_process");
            }
        }

        await content.save();

        res.json({
            success: true,
            message: "Recurso actualizado correctamente",
            completed: content.question_process?.completed,
        });
    } catch (error) {
        console.error("[ERROR] update_content_data:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * Obtener el contenido generado final desde la tabla education_content_generated
 * GET /education/content/:contentId/generated
 */
export const get_generated_content = async (req, res) => {
    try {
        const { contentId } = req.params;
        const user_id = req.user.id;

        console.log(
            `[Education] Buscando contenido generado para resource_id: ${contentId}`,
        );

        const generated = await EducationGeneratedContent.findOne({
            resource_id: contentId,
            user_id: user_id.toString(),
        }).lean();

        if (!generated) {
            return res.status(404).json({
                success: false,
                message:
                    "Todavía no se ha generado el análisis final. Por favor espera un momento.",
            });
        }

        res.json({
            success: true,
            data: generated,
        });
    } catch (error) {
        console.error("[ERROR] get_generated_content:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
