import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.model.js";

/**
 * Middleware de autenticación mejorado.
 * Acepta token desde:
 * 1. Header 'Authorization' (estándar Bearer)
 * 2. Query param 'token' (opcional, útil para redirecciones OAuth)
 */
export const auth_required = (req, res, next) => {
    try {
        let token = req.header('Authorization') || req.query.token;

        if (!token) return res.status(401).json({ message: "No Token, authorization denied" });

        // Limpiar el prefijo 'Bearer ' si existe
        if (token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        const { id } = jwt.verify(token, TOKEN_SECRET);

        req.user = { id: id };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};

// Mantenemos el nombre flexible como alias para no romper rutas existentes que lo usen
export const auth_required_flexible = auth_required;

export const admin_required = async (req, res, next) => {

    try {

        const id = req.user.id;

        const user_found = await User.findById(id);
        if (!user_found)
            return res.status(404).json({ message: "User not Found" });


        if (user_found.role !== 'admin')
            return res.status(401).json({ message: 'User without necessary privileges.' });

        next();

    }
    catch (error) {

        res.status(500).json({ message: error.message });

    }

};
