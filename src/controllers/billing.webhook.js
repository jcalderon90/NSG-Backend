import Stripe from "stripe";
import User from "../models/user.model.js";
import { logger } from "../utils/logger.js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

/**
 * Stripe Webhook Handler
 * POST /api/billing/webhook
 */
export const handle_webhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    if (!stripe) {
        return res.status(503).send("Servicio de Stripe no configurado");
    }

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
            const subscription = event.data.object;
            await update_user_subscription(subscription);
            break;
        case "customer.subscription.deleted":
            const deletedSub = event.data.object;
            await cancel_user_subscription(deletedSub);
            break;
        default:
            logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

async function update_user_subscription(subscription) {
    const customerId = subscription.customer;
    const status = subscription.status;

    // Aquí podrías mapear el priceId al nombre del plan si tuvieras múltiples planes
    const plan = "estratega";

    await User.findOneAndUpdate(
        { stripe_customer_id: customerId },
        {
            subscription_status: status,
            subscription_plan: plan,
        },
    );
    logger.info(
        `Suscripción actualizada para el cliente ${customerId}: ${status}`,
    );
}

async function cancel_user_subscription(subscription) {
    const customerId = subscription.customer;
    await User.findOneAndUpdate(
        { stripe_customer_id: customerId },
        {
            subscription_status: "none",
            subscription_plan: "free",
        },
    );
    logger.info(`Suscripción cancelada para el cliente ${customerId}`);
}
