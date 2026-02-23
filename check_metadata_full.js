import mongoose from "mongoose";
import "dotenv/config";

async function checkDocuments() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        console.log("\n--- Full Sample from 'documents' ---");
        const doc = await db.collection("documents").findOne();
        console.log(JSON.stringify(doc, null, 2));

        console.log("\n--- Full Sample from 'dynamic_documents' ---");
        const dynDoc = await db.collection("dynamic_documents").findOne();
        console.log(JSON.stringify(dynDoc, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkDocuments();
