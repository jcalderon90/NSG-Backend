import { Router } from "express";
import { get_user_strategies } from "../controllers/strategy.controller.js";
import {
    auth_required,
    admin_required,
} from "../middlewares/validate_token.js";

const strategy_router = Router();

// Admin only - M&A Pipeline access
strategy_router.get("/get", auth_required, get_user_strategies);

export default strategy_router;
