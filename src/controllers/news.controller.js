import News from "../models/news.model.js";
import User from "../models/user.model.js";
import axios from "axios";
import { logger } from "../utils/logger.js";

export const getNews = async (req, res) => {
    try {
        const { date, type } = req.query;
        logger.debug(`Fetching news`, { date, type });

        let query = {};

        if (type === "analyzed") {
            query = {
                analysis: { $exists: true, $ne: "" },
            };
        } else {
            const targetDate = date ? new Date(date) : new Date();
            const dateString = targetDate.toISOString().split("T")[0];
            logger.debug(`Target date string: ${dateString}`);

            query = {
                $or: [{ date: dateString }],
            };
        }

        let news = await News.find(query).sort({ date: -1, createdAt: -1 });
        logger.debug(`Initial fetch returned ${news.length} items`);

        // FALLBACK: If "Inteligencia de Mercado" (default tab) is empty, fetch latest 15 regardless of date
        if (news.length === 0 && !date && type !== "analyzed") {
            logger.info(
                `No news found for today. Triggering fallback to latest news`,
            );
            news = await News.find({})
                .sort({ date: -1, createdAt: -1 })
                .limit(15);
            logger.debug(`Fallback returned ${news.length} items`);
        }

        res.json(news);
    } catch (error) {
        logger.error("Error in getNews", {
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const createNews = async (req, res) => {
    try {
        const newNews = new News(req.body);
        const savedNews = await newNews.save();
        logger.info("News created successfully", { newsId: savedNews._id });
        res.status(201).json(savedNews);
    } catch (error) {
        logger.error("Error creating news", { error: error.message });
        res.status(500).json({ message: error.message });
    }
};

export const analyzeNews = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        logger.info("Analyze News triggered", { newsId: id, userId });

        if (!id) {
            return res
                .status(400)
                .json({ message: "El ID de la noticia es requerido" });
        }

        // Fetch user to get telegram_id
        const user = await User.findById(userId);
        logger.debug("User found in DB", { found: !!user });

        const telegramId = user?.telegram_id || null;
        logger.debug("Telegram ID", { telegramId });

        // Forwarding to n8n webhook
        const N8N_BASE_URL = process.env.N8N_BASE_URL;
        if (!N8N_BASE_URL) {
            throw new Error("N8N_BASE_URL is not defined");
        }
        const n8nWebhookUrl = `${N8N_BASE_URL}/webhook/analyze-news`;

        const payload = {
            id,
            telegram_id: telegramId,
        };
        logger.debug("Sending payload to n8n", { payload });

        const response = await axios.post(n8nWebhookUrl, payload);

        logger.info("News analysis sent to n8n successfully", { newsId: id });

        // Just return the n8n response (which is used for notification)
        res.json(response.data);
    } catch (error) {
        logger.error("Error calling n8n", {
            error: error.message,
            responseData: error.response?.data,
        });
        res.status(500).json({
            message: "Error al procesar el análisis estratégico",
            error: error.message,
        });
    }
};
