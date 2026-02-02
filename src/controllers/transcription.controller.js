import Transcription from "../models/transcription.model.js";
import TranscriptionAnalysis from "../models/transcription_analysis.model.js";
import axios from "axios";
import NodeFormData from "form-data";

export const createTranscription = async (req, res) => {
    try {
        const { userId, content, type } = req.body;

        if (!userId || !content) {
            return res
                .status(400)
                .json({ message: "User ID and content are required." });
        }

        const newTranscription = new Transcription({
            user_id: userId,
            content: content,
            type: type || "text",
        });

        const savedTranscription = await newTranscription.save();

        res.status(201).json(savedTranscription);
    } catch (error) {
        console.error("Error creating transcription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTranscriptionsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const transcriptions = await Transcription.find({
            user_id: userId,
        }).sort({
            createdAt: -1,
        });
        res.json(transcriptions);
    } catch (error) {
        console.error("Error fetching transcriptions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const generateTranscriptionAnalysis = async (req, res) => {
    try {
        const { transcription_id } = req.body;
        const N8N_WEBHOOK_URL = process.env.N8N_FATHOM_ANALYSIS_WEBHOOK;
        if (!N8N_WEBHOOK_URL) {
            throw new Error("N8N_FATHOM_ANALYSIS_WEBHOOK is not defined");
        }

        // 0. Verificar si ya existe un análisis
        const existingAnalysis = await TranscriptionAnalysis.findOne({
            transcription_id,
        });
        if (existingAnalysis) {
            return res.status(200).json({
                success: true,
                message: "Esta transcripción ya cuenta con un análisis previo.",
                exists: true,
            });
        }

        // 1. Obtener la transcripción original
        const transcription = await Transcription.findById(transcription_id);
        if (!transcription) {
            return res.status(404).json({
                success: false,
                message: "Transcripción no encontrada.",
            });
        }

        // 2. Construir payload simulando estructura Fathom
        const mockMeetingData = {
            recording_id: transcription._id,
            title: "Análisis de Texto Manual",
            meeting_title: "Manual Transcription Analysis",
            default_summary: transcription.content.substring(0, 200) + "...",
            created_at: transcription.createdAt,
            share_url: "",
        };

        const mockTranscriptionList = [
            {
                speaker: { display_name: "Texto Original" },
                text: transcription.content,
            },
        ];

        // 3. Enviar al webhook
        const n8nResponse = await axios.post(N8N_WEBHOOK_URL, {
            userId: transcription.user_id,
            recording_id: transcription_id,
            meeting_data: mockMeetingData,
            transcription_list: mockTranscriptionList,
        });

        // 4. Guardar en transcriptions_analysis
        await TranscriptionAnalysis.findOneAndUpdate(
            { transcription_id: transcription_id },
            {
                transcription_id: transcription_id,
                analysis_data: n8nResponse.data,
            },
            { upsert: true, new: true },
        );

        res.status(200).json({
            success: true,
            message: "Análisis generado y guardado correctamente.",
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

export const getTranscriptionAnalysis = async (req, res) => {
    try {
        const { transcription_id } = req.params;
        const analysis = await TranscriptionAnalysis.findOne({
            transcription_id,
        });

        if (!analysis) {
            return res.status(200).json({
                success: false,
                message: "No se encontró un análisis previo.",
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
            message: "Error al recuperar el análisis",
            error: error.message,
        });
    }
};

export const updateTranscriptionCheckedSteps = async (req, res) => {
    try {
        const { transcription_id } = req.params;
        const { checked_steps } = req.body;

        const result = await TranscriptionAnalysis.findOneAndUpdate(
            { transcription_id },
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

export const deleteTranscription = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Eliminar la transcripción
        const transcription = await Transcription.findByIdAndDelete(id);

        if (!transcription) {
            return res.status(404).json({
                success: false,
                message: "Transcripción no encontrada.",
            });
        }

        // 2. Eliminar el análisis asociado si existe
        await TranscriptionAnalysis.findOneAndDelete({ transcription_id: id });

        res.status(200).json({
            success: true,
            message: "Transcripción y análisis eliminados correctamente.",
        });
    } catch (error) {
        console.error("Error deleting transcription:", error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar la transcripción.",
            error: error.message,
        });
    }
};

export const saveAudioTranscript = async (req, res) => {
    try {
        const { user_id, userId, transcription, text } = req.body;

        // Soporte para ambos formatos (el de n8n y el genérico)
        const finalUserId = user_id || userId;
        const finalContent = transcription || text;

        if (!finalUserId || !finalContent) {
            return res.status(400).json({
                success: false,
                message:
                    "Se requiere user_id (o userId) y transcription (o text).",
            });
        }

        const newTranscription = new Transcription({
            user_id: finalUserId,
            content: finalContent,
            type: "audio",
        });

        const saved = await newTranscription.save();

        res.status(201).json({
            success: true,
            message: "Transcripción de audio guardada correctamente.",
            data: saved,
        });
    } catch (error) {
        console.error("Error saving audio transcript:", error);
        res.status(500).json({
            success: false,
            message: "Error interno al guardar la transcripción de audio.",
        });
    }
};
export const proxyAudioAnalysis = async (req, res) => {
    try {
        const { userId } = req.body;
        const audioFile = req.file;

        if (!userId || !audioFile) {
            return res.status(400).json({
                success: false,
                message: "User ID and audio file are required.",
            });
        }

        // 1. Enviar el archivo a n8n
        const form = new NodeFormData();
        form.append("audio", audioFile.buffer, {
            filename: audioFile.originalname,
            contentType: audioFile.mimetype,
        });
        form.append("userId", userId);

        const n8nUrl = process.env.N8N_AUDIO_ANALYSIS_WEBHOOK;
        if (!n8nUrl) {
            throw new Error("N8N_AUDIO_ANALYSIS_WEBHOOK is not defined");
        }

        const n8nResponse = await axios.post(n8nUrl, form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        // 2. Extraer datos de la respuesta de n8n
        // Según tu workflow: { transcription: "...", seconds: 37, user_id: "..." }
        const { transcription, user_id } = n8nResponse.data;

        if (!transcription) {
            throw new Error("No se recibió la transcripción de n8n");
        }

        // 3. Guardar en la base de datos
        const newDoc = new Transcription({
            user_id: user_id || userId,
            content: transcription,
            type: "audio",
        });

        const saved = await newDoc.save();

        res.status(200).json({
            success: true,
            message: "Audio procesado y guardado correctamente.",
            data: saved,
        });
    } catch (error) {
        console.error("Error in proxyAudioAnalysis:", error);
        res.status(500).json({
            success: false,
            message: "Error al procesar el audio mediante el proxy.",
            error: error.message,
        });
    }
};
