import mongoose from "mongoose";

const transcription_analysis_schema = new mongoose.Schema(
    {
        transcription_id: {
            type: String,
            required: true,
            unique: true,
        },
        analysis_data: {
            type: Object,
            required: true,
        },
        checked_steps: {
            type: [Number],
            default: [],
        },
    },
    {
        timestamps: true,
        collection: "transcriptions_analysis",
    }
);

export default mongoose.model(
    "TranscriptionAnalysis",
    transcription_analysis_schema
);
