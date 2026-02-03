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
            enum: ["video", "document", "audio", "text"],
            default: "text",
        },
        source_url: {
            type: String,
            required: false,
        },
        data: {
            title: {
                type: String,
                required: true,
            },
            summary: {
                type: String,
                required: true,
            },
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
