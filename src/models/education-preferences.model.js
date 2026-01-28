import mongoose from "mongoose";

const education_preferences_schema = new mongoose.Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true, // Un usuario solo puede tener un conjunto de preferencias
            index: true,
        },
        telegram_id: {
            type: Number,
            default: null,
            // Se guarda automáticamente del perfil del usuario
        },
        // Estado del onboarding
        onboarding_completed: {
            type: Boolean,
            default: false,
        },
        completed_at: {
            type: Date,
            default: null,
        },

        // Respuestas del cuestionario (matching StrategyWidget)
        entregable: {
            type: String,
            default: null,
            // Ejemplos: "A) Acciones (3–5 pasos)", "B) Resumen ejecutivo", etc.
        },
        learning_style: {
            type: String,
            default: null,
            // Ejemplos: "A) Verlo claro (esquema)", "B) Escucharlo (podcast)", etc.
        },
        depth: {
            type: String,
            default: null,
            // Ejemplos: "A) Flash (1–2 min)", "B) Práctico (5 min)", etc.
        },
        context: {
            type: String,
            default: null,
            // Ejemplos: "A) Negocio/ventas", "B) Operación/equipo", etc.
        },
        strength: {
            type: String,
            default: null,
            // Ejemplos: "A) Enfoque y ejecución", "B) Comunicación e influencia", etc.
        },
        friction: {
            type: String,
            default: null,
            // Ejemplos: "Me disperso (cambio idea)", "Me cuesta empezar", etc.
        },

        // Opcional: Numerología
        numerology_enabled: {
            type: Boolean,
            default: false,
        },
        birth_date: {
            type: String,
            default: null,
            // Formato: "DD/MM/YYYY"
        },

        // Metadatos útiles
        times_reset: {
            type: Number,
            default: 0,
            // Contador de cuántas veces el usuario reinició el onboarding
        },
        last_reset_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "education_preferences",
    },
);

// Método para marcar como completado
education_preferences_schema.methods.markAsCompleted = function () {
    this.onboarding_completed = true;
    this.completed_at = new Date();
    return this.save();
};

// Método para resetear el onboarding
education_preferences_schema.methods.reset = function () {
    this.onboarding_completed = false;
    this.completed_at = null;
    this.entregable = null;
    this.learning_style = null;
    this.depth = null;
    this.context = null;
    this.strength = null;
    this.friction = null;
    this.numerology_enabled = false;
    this.birth_date = null;
    this.times_reset += 1;
    this.last_reset_at = new Date();
    return this.save();
};

export default mongoose.model(
    "EducationPreferences",
    education_preferences_schema,
);
