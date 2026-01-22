import TelegramUser from "../models/telegram_user.model.js";

export const getTelegramUserByTelegramId = async (req, res) => {
  const { id } = req.params;

  try {
    // Since telegram_id is a Number in the schema, and req.params.id is a String,
    // we should convert it to Number.
    const telegramId = Number(id);

    if (isNaN(telegramId)) {
      return res
        .status(400)
        .json({ message: "Invalid Telegram ID. Must be a number." });
    }

    // Flexible search: try telegram_id (number/string) and telegramId (number/string)
    const telegramUser = await TelegramUser.findOne({
      $or: [
        { telegram_id: telegramId },
        { telegram_id: String(telegramId) },
        { telegramId: telegramId },
        { telegramId: String(telegramId) },
        { "user.id": telegramId } // Sometimes stored in nested user object
      ]
    });

    if (!telegramUser) {
      return res.status(404).json({ message: "Telegram user not found" });
    }

    res.status(200).json(telegramUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
