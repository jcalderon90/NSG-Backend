import mongoose from "mongoose";

const educationContentSchema = new mongoose.Schema(
    {
        user_id: {
            type: String,
            required: true,
            index: true,
        },
        telegram_id: {
            type: Number,
            required: false,
        },
        source_type: {
            type: String,
            enum: ["video", "document", "audio", "text", "pdf", "image"],
            default: "text",
        },
        source_url: {
            type: String,
            required: false,
        },
        extracted_data: {
            type: String,
            required: true,
        },
        question_process: {
            completed: {
                type: Boolean,
                default: false,
            },
            current_step: Number,
        },
        // Mantener data como opcional por compatibilidad o futuros análisis
        data: {
            title: String,
            summary: String,
            strategic_analysis: {
                alignment: String,
                friction_bypass: String,
            },
            key_insights: [
                {
                    icon: String,
                    text: String,
                },
            ],
            action_plan: [
                {
                    task: String,
                    impact: {
                        type: String,
                        enum: ["High", "Medium", "Low"],
                    },
                    time: String,
                },
            ],
            suggested_questions: [String],
        },
    },
    {
        timestamps: true,
        collection: "education_content",
    },
);

// Index for faster queries
educationContentSchema.index({ user_id: 1, createdAt: -1 });

const EducationContent = mongoose.model(
    "EducationContent",
    educationContentSchema,
);

export default EducationContent;
