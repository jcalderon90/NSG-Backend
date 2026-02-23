import mongoose from "mongoose";
import "dotenv/config";

async function checkResourceId() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        console.log("\n--- Searching for 'resource_id' in 'documents' ---");
        const doc = await db
            .collection("documents")
            .findOne({ resource_id: { $exists: true } });
        if (doc) {
            console.log(
                "Found document with resource_id:",
                JSON.stringify(doc, null, 2),
            );
        } else {
            console.log("No document with resource_id found in 'documents'");
        }

        console.log("\n--- Searching for 'contentId' in 'documents' ---");
        const doc2 = await db
            .collection("documents")
            .findOne({ contentId: { $exists: true } });
        if (doc2) {
            console.log(
                "Found document with contentId:",
                JSON.stringify(doc2, null, 2),
            );
        } else {
            console.log("No document with contentId found in 'documents'");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkResourceId();
