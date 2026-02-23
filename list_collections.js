import mongoose from "mongoose";
import "dotenv/config";

async function checkCollections() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        const collections = await mongoose.connection.db
            .listCollections()
            .toArray();
        console.log("Collections in DB:");
        collections.forEach((c) => console.log(`- ${c.name}`));
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkCollections();
