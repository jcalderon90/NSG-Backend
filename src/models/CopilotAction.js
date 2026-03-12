import mongoose from "mongoose";

const copilotActionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        telegramId: {
            type: Number,
            required: false,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
            default: "Medium",
        },
        estimatedTimeMinutes: {
            type: Number,
            required: false,
        },
        definitionOfDone: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "skipped", "in_progress"],
            default: "pending",
            index: true,
        },
        source: {
            type: String,
            enum: ["education", "strategy", "transcription", "manual"],
            default: "manual",
            index: true,
        },
        sourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            index: true,
        },
        actionId: {
            type: String, // ID original del accionable (ej. "A1")
            required: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        reminderActive: {
            type: Boolean,
            default: true,
        },
        lastRemindedAt: {
            type: Date,
            required: false,
        }
    },
    {
        timestamps: true,
    }
);

// Índices para consultas frecuentes
copilotActionSchema.index({ userId: 1, status: 1 });
copilotActionSchema.index({ telegramId: 1, status: 1 });

const CopilotAction = mongoose.model("CopilotAction", copilotActionSchema);

export default CopilotAction;
