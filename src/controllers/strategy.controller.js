import Strategy from "../models/strategy.model.js";

export const get_user_strategies = async (req, res) => {
    try {
        const id = req.user.id;
        const strategies = await Strategy.find({ user_id: id.toString() });
        res.json(strategies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
