import mongoose from "mongoose";

const user_model = new mongoose.Schema(
    {
        username: {
            type: String,
            trim: true,
            default: null,
        },

        firstName: {
            type: String,
            trim: true,
            default: null,
        },

        lastName: {
            type: String,
            trim: true,
            default: null,
        },

        address: {
            type: String,
            trim: true,
            default: null,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            unique: true, // que sea unico
        },

        password: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: [
                "user",
                "admin",
                "consultant",
                "psychologist",
                "manager",
                "patient",
            ], // Define los roles posibles
            default: "user", // Establece un valor predeterminado
        },

        imgURL: {
            type: String, // Almacena la URL de la imagen
            default: "", // Valor predeterminado vacío
        },

        fathom_access_token: {
            type: String, // Almacena el access token de Fathom Analytics
            default: "", // Valor predeterminado vacío
        },
        google_calendar_tokens: {
            type: Object, // Almacena access_token, refresh_token, etc.
            default: null,
        },
        telegram_id: {
            type: Number,
            default: null, // "vacío" for a Number field.
        },
        resetPasswordCode: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
        location: {
            type: {
                latitude: Number,
                longitude: Number,
                timezone: String,
                city: String,
                country: String,
            },
            default: null,
        },
        stripe_customer_id: {
            type: String,
            default: null,
        },
        subscription_status: {
            type: String,
            enum: [
                "active",
                "trialing",
                "past_due",
                "canceled",
                "incomplete",
                "none",
            ],
            default: "none",
        },
        subscription_plan: {
            type: String,
            enum: ["free", "estratega", "enterprise"],
            default: "free",
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("User", user_model);
