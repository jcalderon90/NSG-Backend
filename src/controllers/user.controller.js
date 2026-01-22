import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const create_user = async (req, res) => {
    const { username, email, role, password } = req.body;

    try {
        const user_found = await User.findOne({ email });

        if (user_found)
            return res.status(400).json(["Email is already in use"]);

        const password_hash = await bcrypt.hash(password, 10);

        const new_user = new User({
            username,
            email,
            password: password_hash,
            role,
        });

        const user_saved = await new_user.save();

        res.json({
            // Se devuelve una respuesta JSON con los datos del usuario
            id: user_saved._id,
            username: user_saved.username,
            email: user_saved.email,
            role: user_saved.role,
            imgURL: user_saved.imgURL,
            telegram_id: user_saved.telegram_id,
            created_at: user_saved.createdAt,
            updated_at: user_saved.updatedAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const update_user = async (req, res) => {
    const { id } = req.params;

    const user_found = await User.findById(id);

    if (!user_found)
        return res.status(400).json({ message: "Usuario no encontrado" });

    const { username, email, role, password } = req.body;

    if (username) user_found.username = username;
    if (email) user_found.email = email;
    if (role) user_found.role = role;

    // Si se envía una nueva contraseña, hashearla antes de guardar
    if (password) {
        const password_hash = await bcrypt.hash(password, 10);
        user_found.password = password_hash;
    }

    try {
        const user_saved = await user_found.save();

        res.json({
            // Se devuelve una respuesta JSON con los datos del usuario
            id: user_saved._id,
            username: user_saved.username,
            email: user_saved.email,
            role: user_saved.role,
            imgURL: user_saved.imgURL,
            telegram_id: user_saved.telegram_id,
            created_at: user_saved.createdAt,
            updated_at: user_saved.updatedAt,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const get_user = async (req, res) => {
    const { id } = req.params;

    const user_found = await User.findById(id);

    if (!user_found) return res.status(400).json({ message: "User not Found" });

    return res.json({
        // Se devuelve una respuesta JSON con los datos del usuario

        id: user_found._id,
        username: user_found.username,
        email: user_found.email,
        role: user_found.role,
        imgURL: user_found.imgURL,
        telegram_id: user_found.telegram_id,
        createdAt: user_found.createdAt,
        updatedAt: user_found.updatedAt,
    });
};

export const get_all_users = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const delete_user = async (req, res) => {
    try {
        const { id } = req.params;
        const user_deleted = await User.findByIdAndDelete(id);

        if (!user_deleted)
            return res.status(404).json({ message: "User not found" });

        return res.json({
            message: `User ${user_deleted.username} deleted successfully`,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
