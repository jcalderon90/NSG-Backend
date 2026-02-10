import mongoose from "mongoose";

const educationGeneratedContentSchema = new mongoose.Schema(
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
        resource_id: {
            type: String,
            required: true,
            index: true,
        },
        source_type: {
            type: String,
            required: false,
        },
        question_process_generated: {
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
                    impact: String,
                    time: String,
                },
            ],
            suggested_questions: [String],
        },
    },
    {
        timestamps: true,
        collection: "education_content_generated",
    },
);

const EducationGeneratedContent = mongoose.model(
    "EducationGeneratedContent",
    educationGeneratedContentSchema,
);

export default EducationGeneratedContent;
