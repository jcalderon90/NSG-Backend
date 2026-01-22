import User from "../models/user.model.js";
import FathomData from "../models/fathom.model.js";
import RecordingAnalysisRelation from "../models/recording_analysis_relation.model.js";
import axios from "axios";

// Guardar el access token de Fathom del usuario
export const saveFathomToken = async (req, res) => {
    try {
        const userId = req.user.id; // Del middleware de autenticación
        const { fathom_access_token } = req.body;

        // Validar que se envió el token
        if (!fathom_access_token) {
            return res.status(400).json({
                success: false,
                message: "La API key de Fathom es requerida",
            });
        }

        // Validar que el token no esté vacío
        if (fathom_access_token.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "La API key de Fathom no puede estar vacía",
            });
        }

        // ===== VALIDAR TOKEN CON FATHOM API =====
        try {
            await axios.get("https://api.fathom.ai/external/v1/meetings", {
                params: { limit: 1 },
                headers: {
                    "X-Api-Key": fathom_access_token.trim(),
                },
            });
        } catch (error) {
            const status = error.response?.status;
            const errorMsg = error.response?.data?.error || error.message;

            if (status === 401 || status === 403) {
                return res.status(status).json({
                    success: false,
                    message:
                        "API key inválida. Verifica que sea una API key válida de Fathom Video.",
                    details: errorMsg,
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "No se pudo validar la API key con Fathom. Revisa la conexión o intenta de nuevo.",
                error: errorMsg,
            });
        }

        // Actualizar el usuario con el nuevo token
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fathom_access_token: fathom_access_token.trim() },
            { new: true, select: "-password" }, // Retornar el usuario actualizado sin la contraseña
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        res.status(200).json({
            success: true,
            message: "API key de Fathom validada y guardada exitosamente",
            data: {
                fathom_access_token: updatedUser.fathom_access_token,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error guardando el access token de Fathom",
            error: error.message,
        });
    }
};

// Obtener el estado de conexión de Fathom del usuario
export const getFathomStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select("fathom_access_token");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        const hasToken =
            user.fathom_access_token && user.fathom_access_token.trim() !== "";

        res.status(200).json({
            success: true,
            connected: hasToken,
            data: {
                has_token: hasToken,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error obteniendo el estado de Fathom",
            error: error.message,
        });
    }
};

// Eliminar la API key de Fathom del usuario
export const deleteFathomToken = async (req, res) => {
    try {
        const userId = req.user.id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fathom_access_token: "" },
            { new: true, select: "-password" },
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        res.status(200).json({
            success: true,
            message: "API key de Fathom eliminada exitosamente",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error eliminando la API key de Fathom",
            error: error.message,
        });
    }
};

// Obtener la lista de reuniones: Sincroniza con Fathom y retorna desde MongoDB
export const getFathomMeetings = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Buscar el token del usuario en la BD
        const user = await User.findById(userId).select("fathom_access_token");

        if (!user || !user.fathom_access_token) {
            return res.status(200).json([{ meetings: [] }]);
        }

        // 2. Intentar sincronizar con la API de Fathom
        try {
            const fathomResponse = await axios.get(
                "https://api.fathom.ai/external/v1/meetings",
                {
                    params: {
                        limit: 20,
                        include_transcript: true,
                        include_summary: true,
                    },
                    headers: {
                        "X-Api-Key": user.fathom_access_token.trim(),
                    },
                },
            );

            // 3. Formatear y Sincronizar con la BD
            const meetings = fathomResponse.data.items.map((item) => ({
                meeting_data: {
                    recording_id: item.recording_id,
                    title: item.title || item.meeting_title,
                    meeting_title: item.meeting_title,
                    default_summary:
                        item.default_summary?.markdown_formatted ||
                        "Sin resumen disponible.",
                    created_at: item.created_at,
                    share_url: item.share_url,
                },
                transcription_list: item.transcript || [],
            }));

            await FathomData.findOneAndUpdate(
                { user_id: userId },
                {
                    user_id: userId,
                    string_user_id: String(userId),
                    meetings: meetings,
                },
                { upsert: true, new: true },
            );
        } catch (fathomError) {
            // Si el error es 401, el token no sirve
            if (fathomError.response?.status === 401) {
                return res.status(401).json({
                    success: false,
                    message: "La API Key de Fathom ha expirado o es inválida.",
                });
            }
            // En otros errores (red, API caída), continuamos para intentar devolver lo que haya en la BD
        }

        // 4. Obtener la información FINAL desde la base de datos de Mongo
        const finalData = await FathomData.findOne({ user_id: userId });

        if (!finalData) {
            return res.status(200).json([{ meetings: [] }]);
        }

        // Devolver en el formato que espera el frontend [ { meetings: [...] } ]
        res.status(200).json([
            {
                meetings: finalData.meetings,
                last_sync: finalData.updatedAt,
            },
        ]);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error procesando las reuniones de Fathom",
            error: error.message,
        });
    }
};

// Generar análisis profundo enviando el ID a N8N
export const generateFathomAnalysis = async (req, res) => {
    try {
        const userId = req.user.id;
        const { recording_id } = req.body; // Cambiado de meetingId a recording_id para consistencia con Fathom
        const N8N_WEBHOOK_URL =
            process.env.N8N_FATHOM_ANALYSIS_WEBHOOK ||
            "https://personal-n8n.suwsiw.easypanel.host/webhook/generate-fathom-analysis";

        // 0. Verificar si ya existe un análisis para esta grabación para evitar duplicados y llamadas innecesarias a N8N
        const existingAnalysis = await RecordingAnalysisRelation.findOne({
            recording_id,
        });
        if (existingAnalysis) {
            return res.status(200).json({
                success: true,
                message:
                    "Esta sesión ya cuenta con un análisis previo guardado en la base de datos.",
                exists: true,
            });
        }

        // 1. Buscar el registro de Fathom del usuario en la BD
        const userFathomData = await FathomData.findOne({ user_id: userId });

        if (!userFathomData || !userFathomData.meetings) {
            return res.status(404).json({
                success: false,
                message: "No se encontraron datos de Fathom para este usuario.",
            });
        }

        // 2. Encontrar la reunión específica dentro del array
        const meeting = userFathomData.meetings.find(
            (m) =>
                String(m.meeting_data?.recording_id) === String(recording_id),
        );

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: `No se encontró la reunión con ID ${recording_id} en la base de datos.`,
            });
        }

        // 3. Enviar los datos específicos (meeting_data y transcription_list) al webhook de N8N
        const n8nResponse = await axios.post(N8N_WEBHOOK_URL, {
            userId: userId,
            recording_id: recording_id,
            meeting_data: meeting.meeting_data,
            transcription_list: meeting.transcription_list,
        });

        // 4. Guardar los datos en la colección recording_analysis_relation
        await RecordingAnalysisRelation.findOneAndUpdate(
            { recording_id: recording_id },
            {
                recording_id: recording_id,
                analysis_data: n8nResponse.data,
            },
            { upsert: true, new: true },
        );

        // 5. Retornar solo un mensaje de éxito al frontend
        res.status(200).json({
            success: true,
            message:
                "Análisis generado y guardado correctamente en la base de datos.",
        });
    } catch (error) {
        const status = error.response?.status || 500;
        const message =
            error.response?.data?.message ||
            "Error al procesar el análisis en N8N";

        res.status(status).json({
            success: false,
            message: message,
            error: error.message,
        });
    }
};

// Obtener el análisis guardado de una grabación
export const getRecordingAnalysis = async (req, res) => {
    try {
        const { recording_id } = req.params;

        const analysis = await RecordingAnalysisRelation.findOne({
            recording_id,
        });

        if (!analysis) {
            return res.status(200).json({
                success: false,
                message:
                    "No se encontró un análisis previo para esta grabación.",
            });
        }

        res.status(200).json({
            success: true,
            analysis: analysis.analysis_data,
            checked_steps: analysis.checked_steps || [],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al recuperar el análisis de la base de datos",
            error: error.message,
        });
    }
};

// Actualizar los pasos marcados de una herramienta
export const updateCheckedSteps = async (req, res) => {
    try {
        const { recording_id } = req.params;
        const { checked_steps } = req.body;

        const result = await RecordingAnalysisRelation.findOneAndUpdate(
            { recording_id },
            { $set: { checked_steps } },
            { new: true },
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "No se encontró el análisis para actualizar.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Pasos actualizados correctamente.",
            checked_steps: result.checked_steps,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar los pasos.",
            error: error.message,
        });
    }
};
