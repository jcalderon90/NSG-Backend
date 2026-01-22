import mongoose from "mongoose";

const recording_analysis_relation_schema = new mongoose.Schema(
    {
        recording_id: {
            type: String,
            required: true,
            unique: true, // Cada grabación tiene un único análisis relacionado
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
        collection: "recording_analysis_relation",
    }
);

export default mongoose.model("RecordingAnalysisRelation", recording_analysis_relation_schema);
