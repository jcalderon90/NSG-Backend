import mongoose from "mongoose";
import "dotenv/config";
import News from "./src/models/news.model.js";

async function checkNews() {
    try {
        const uri =
            "mongodb+srv://iagentsnsg_db_user:Nc0lLH0zK6LEFJQP@cluster0.pgbmwuy.mongodb.net/Database?appName=Cluster0";
        await mongoose.connect(uri);
        console.log("Connected to DB");

        const count = await News.countDocuments();
        console.log("Total news count:", count);

        if (count > 0) {
            const lastNews = await News.findOne().sort({ createdAt: -1 });
            console.log("Last news found:", JSON.stringify(lastNews, null, 2));

            const today = new Date().toISOString().split("T")[0];
            console.log("Today's date string (UTC):", today);

            const newsToday = await News.countDocuments({ date: today });
            console.log("News for today:", newsToday);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkNews();
