import { Router } from "express";
import { getTelegramUserByTelegramId } from "../controllers/telegram.controller.js";
import { auth_required } from "../middlewares/validate_token.js";

const router = Router();

// Route to get telegram user data by ID
// Matches frontend request: /telegram/user/:id
router.get("/user/:id", auth_required, getTelegramUserByTelegramId);

export default router;
