import mongoose from "mongoose";

const news_schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: "",
        },
        cntentHTML: {
            type: String,
            default: "",
        },
        date: {
            type: String, // Matching image format "2026-01-02"
        },
        link: {
            type: String,
        },
        categories: {
            type: [String],
            default: [],
        },
        // Keeping these as legacy/fallback if needed, but the image is the priority
        tag: {
            type: String,
            default: "General",
        },
        source: {
            type: String,
            default: "NSG Intelligence",
        },
        color: {
            type: String,
            default: "blue",
        },
        analysis: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        collection: "news",
    }
);

export default mongoose.model("News", news_schema);
