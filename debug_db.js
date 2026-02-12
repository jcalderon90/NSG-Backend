import mongoose from "mongoose";
import "dotenv/config";

// Import model manually since we're in a standalone script
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
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        console.log("Searching for the most recent education content...");
        const contents = await EducationContent.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        if (contents.length === 0) {
            console.log("No content found.");
        } else {
            contents.forEach((c, i) => {
                console.log(`\nItem ${i + 1}:`);
                console.log(`ID: ${c._id}`);
                console.log(`User ID: ${c.user_id}`);
                console.log(`Source Type: ${c.source_type}`);
                console.log(
                    `Extracted Data Size: ${c.extracted_data ? c.extracted_data.length : 0} chars`,
                );
                console.log(
                    `Data Size: ${c.data ? JSON.stringify(c.data).length : 0} chars`,
                );
                console.log(`Created At: ${c.createdAt}`);

                // Try to reproduce the mapping logic
                try {
                    const full_text =
                        c.extracted_data ||
                        (c.data ? c.data.summary : "") ||
                        "";
                    const summary =
                        typeof full_text === "string"
                            ? full_text.length > 120
                                ? full_text.substring(0, 120) + "..."
                                : full_text
                            : "NOT A STRING";
                    console.log(`Generated Summary: ${summary}`);

                    const isoDate =
                        (c.createdAt || new Date()).toISOString?.() ||
                        c.createdAt;
                    console.log(`ISO Date test: ${isoDate}`);
                } catch (e) {
                    console.error(`ERROR in mapping simulation: ${e.message}`);
                }
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
