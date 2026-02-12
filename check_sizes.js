import mongoose from "mongoose";
import "dotenv/config";

const educationContentSchema = new mongoose.Schema(
    {
        user_id: String,
        extracted_data: String,
        data: mongoose.Schema.Types.Mixed,
    },
    { timestamps: true, collection: "education_content" },
);

const EducationContent = mongoose.model(
    "EducationContent",
    educationContentSchema,
);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Checking document sizes...");
        const allContents = await EducationContent.find(
            {},
            { _id: 1, user_id: 1, extracted_data: 1 },
        ).lean();

        const sortedBySize = allContents
            .map((c) => ({
                id: c._id,
                user_id: c.user_id,
                size: (c.extracted_data || "").length,
            }))
            .sort((a, b) => b.size - a.size);

        console.log("Top 10 largest documents (by extracted_data length):");
        sortedBySize.slice(0, 10).forEach((c) => {
            console.log(
                `ID: ${c.id}, User: ${c.user_id}, Size: ${c.size} bytes (${(c.size / 1024 / 1024).toFixed(2)} MB)`,
            );
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
