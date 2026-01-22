import mongoose from "mongoose";

const telegram_user_schema = new mongoose.Schema(
  {
    telegram_id: {
      type: Number,
      required: true,
      unique: true,
    },
    // We can add more fields if needed later, but for now this is the requirement.
    chat_id: {
      type: Number,
    },
    username: {
      type: String,
    },
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    telegram_first_name: {
      type: String,
    },
    created_date: {
      type: String,
    },
    daily_checking_in: {
      morning: {
        type: String,
        default: "Definición de intención estratégica. Foco en Q3.",
      },
      noon: {
        type: String,
        default: "Recalibración de medio día (7 min).",
      },
      night: {
        type: String,
        default: "Diseño del éxito para mañana.",
      },
    },
  },
  {
    timestamps: true,
    collection: "telegram_users", // Explicitly setting the collection name
    strict: false, // Return ALL fields found in the document, regardless of schema
  }
);

export default mongoose.model("TelegramUser", telegram_user_schema);
