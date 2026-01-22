import mongoose from "mongoose";

const transcriptionSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            default: "text", // "audio" or "text"
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "Transcription",
    transcriptionSchema,
    "user_transcriptions"
);
