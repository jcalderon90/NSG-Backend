import EducationPreferences from "../models/education-preferences.model.js";
import EducationContent from "../models/education-content.model.js";
import User from "../models/user.model.js";

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

/**
 * Obtener todos los recursos procesados de Education del usuario
 * GET /education/content
 */
export const get_content = async (req, res) => {
    try {
        const user_id = req.user.id;

        const contents = await EducationContent.find({
            user_id: user_id.toString(),
        })
            .sort({ createdAt: -1 }) // Más recientes primero
            .lean();

        // Mapear a formato frontend
        const mapped = contents.map((item) => ({
            id: item._id.toString(),
            title: item.data.title,
            type: item.source_type || "document",
            status: "ready",
            thumbnailUrl: item.source_url || null,
            createdAt: new Date(item.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
            summary: item.data.summary.substring(0, 120) + "...",
            // Store full data for detail view
            fullData: item.data,
        }));

        res.json({
            success: true,
            data: mapped,
        });
    } catch (error) {
        console.error("[ERROR] get_content:", error);
        res.status(500).json({ message: error.message });
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

        // Buscar contenido que pertenezca al usuario
        const content = await EducationContent.findOne({
            _id: contentId,
            user_id: user_id.toString(),
        });

        if (!content) {
            return res.status(404).json({
                success: false,
                message:
                    "Recurso no encontrado o no tienes permisos para eliminarlo",
            });
        }

        await EducationContent.findByIdAndDelete(contentId);

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
