import Stripe from "stripe";
import User from "../models/user.model.js";
import { logger } from "../utils/logger.js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    logger.warn(
        "STRIPE_SECRET_KEY no está configurada. Las funciones de facturación no estarán disponibles.",
    );
}
const stripe = stripeKey ? new Stripe(stripeKey) : null;

/**
 * Crear una sesión de Checkout de Stripe
 * POST /api/billing/create-checkout-session
 */
export const create_checkout_session = async (req, res) => {
    try {
        const { priceId } = req.body;
        const user_id = req.user.id;

        if (!stripe) {
            return res
                .status(503)
                .json({
                    message:
                        "El servicio de pagos no está configurado en el servidor",
                });
        }

        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Si el usuario no tiene customer ID en Stripe, crearlo o buscarlo
        let customerId = user.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: user_id.toString(),
                },
            });
            customerId = customer.id;
            user.stripe_customer_id = customerId;
            await user.save();
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/billing`,
            metadata: {
                userId: user_id.toString(),
            },
        });

        res.json({ url: session.url });
    } catch (error) {
        logger.error("Error al crear sesión de checkout:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Obtener el estado de la suscripción del usuario
 * GET /api/billing/subscription-status
 */
export const get_subscription_status = async (req, res) => {
    try {
        const user_id = req.user.id;
        const user = await User.findById(user_id);

        if (!stripe) {
            return res.json({
                status: "none",
                plan: "free",
                error: "Stripe not configured",
            });
        }

        if (!user || !user.stripe_customer_id) {
            return res.json({ status: "none", plan: "free" });
        }

        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripe_customer_id,
            status: "active",
            limit: 1,
        });

        if (subscriptions.data.length === 0) {
            return res.json({ status: "none", plan: "free" });
        }

        const sub = subscriptions.data[0];
        res.json({
            status: sub.status,
            plan: "estratega", // Simplificado por ahora
            current_period_end: new Date(sub.current_period_end * 1000),
        });
    } catch (error) {
        logger.error("Error al obtener estado de suscripción:", error);
        res.status(500).json({ message: error.message });
    }
};
