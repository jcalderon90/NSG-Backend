import { Router } from "express";
import { auth_required } from "../middlewares/validate_token.js";
import {
    create_checkout_session,
    get_subscription_status,
} from "../controllers/billing.controller.js";
import { handle_webhook } from "../controllers/billing.webhook.js";
import express from "express";

const router = Router();

/**
 * @route   POST /api/billing/webhook
 * @desc    Maneja eventos de Stripe (requiere raw body)
 * @access  Public
 */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    handle_webhook,
);

/**
 * @route   POST /api/billing/create-checkout-session
 * @desc    Inicia el flujo de pago con Stripe
 * @access  Private
 */
router.post("/create-checkout-session", auth_required, create_checkout_session);

/**
 * @route   GET /api/billing/subscription-status
 * @desc    Obtiene el estado de la suscripción actual del usuario
 * @access  Private
 */
router.get("/subscription-status", auth_required, get_subscription_status);

export default router;
