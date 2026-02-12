import mongoose from "mongoose";
import "dotenv/config";

const educationContentSchema = new mongoose.Schema(
    {
        user_id: mongoose.Schema.Types.Mixed,
        extracted_data: mongoose.Schema.Types.Mixed,
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

        console.log("Checking for invalid types...");
        const allContents = await EducationContent.find({}).lean();

        allContents.forEach((c) => {
            if (c.extracted_data && typeof c.extracted_data !== "string") {
                console.log(
                    `INVALID TYPE for extracted_data: ID ${c._id}, Type ${typeof c.extracted_data}`,
                );
            }
            if (
                c.user_id &&
                typeof c.user_id !== "string" &&
                !(c.user_id instanceof mongoose.Types.ObjectId)
            ) {
                console.log(
                    `WEIRD user_id type: ID ${c._id}, Type ${typeof c.user_id}`,
                );
            }
        });

        console.log("Done.");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

run();
