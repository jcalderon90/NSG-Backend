import User from "../models/user.model.js";
import { CREATE__ACCCESS__TOKEN } from "../libs/jwt.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import crypto from "crypto";
import axios from "axios";

// Función para registrar un nuevo usuario.  Se agregó manejo de errores y se especificó la respuesta JSON.
export const register = async (req, res) => {
    const { email, password, location } = req.body;
    // SECURITY: role is NOT extracted from request body to prevent privilege escalation

    try {
        const user_found = await User.findOne({ email });

        if (user_found)
            return res.status(400).json({ message: "Email is already in use" });

        const password_hash = await bcrypt.hash(password, 10);

        const new_user = new User({
            email,
            password: password_hash,
            role: "user", // SECURITY: Always assign "user" role by default. Admins can change roles later.
            location,
        });

        //CAPTURANDO EL USUARIO QUE SE ACABA DE GUARDAR EN LA BD
        const user_saved = await new_user.save();

        const user = {
            id: user_saved._id,
            email: user_saved.email,
            role: user_saved.role,
            imgURL: user_saved.imgURL,
            firstName: user_saved.firstName,
            lastName: user_saved.lastName,
            address: user_saved.address,
            telegram_id: user_saved.telegram_id,
            location: user_saved.location,
            created_at: user_saved.createdAt,
            updated_at: user_saved.updatedAt,
        };

        const token = await CREATE__ACCCESS__TOKEN({ id: user_saved.id });

        res.status(200).json({
            message: "User successfully created.",
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Función para iniciar sesión de un usuario. Se agregó manejo de errores y se especificó la respuesta JSON.
export const login = async (req, res) => {
    const { email, password, location } = req.body;

    try {
        const user_found = await User.findOne({ email });

        if (!user_found)
            return res.status(400).json({ message: "User not found" });

        const is_match = await bcrypt.compare(password, user_found.password);

        if (!is_match)
            return res.status(400).json({ message: "Incorrect password" });

        // Update location if provided
        if (location) {
            user_found.location = location;
            await user_found.save();
        }

        const user = {
            id: user_found._id,
            email: user_found.email,
            role: user_found.role,
            imgURL: user_found.imgURL,
            firstName: user_found.firstName,
            lastName: user_found.lastName,
            address: user_found.address,
            telegram_id: user_found.telegram_id,
            location: user_found.location,
            created_at: user_found.createdAt,
            updated_at: user_found.updatedAt,
        };

        const token = await CREATE__ACCCESS__TOKEN({ id: user_found._id });

        res.status(200).json({
            message: "User successfully logged in.",
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Función para cerrar sesión de un usuario.
export const logout = (req, res) => {
    res.cookie("token", "", {
        expires: new Date(0),
    });

    return res.sendStatus(200);
};

// Función para obtener el perfil de un usuario. Se agregó manejo de errores y se especificó la respuesta JSON.
export const profile = async (req, res) => {
    const user_found = await User.findById(req.user.id);

    if (!user_found) return res.status(400).json({ message: "User not Found" });

    return res.json({
        id: user_found._id,
        email: user_found.email,
        role: user_found.role,
        imgURL: user_found.imgURL,
        firstName: user_found.firstName,
        lastName: user_found.lastName,
        address: user_found.address,
        telegram_id: user_found.telegram_id,
        location: user_found.location,
        createdAt: user_found.createdAt,
        updatedAt: user_found.updatedAt,
    });
};

export const verifyToken = async (req, res) => {
    // Deshabilitar caché para este endpoint
    res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
    });

    try {
        let token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Remover "Bearer " si está presente
        if (token.startsWith("Bearer ")) {
            token = token.slice(7);
        }

        // Usar promisify para manejar jwt.verify de forma síncrona
        const decoded = jwt.verify(token, TOKEN_SECRET);

        const user_found = await User.findById(decoded.id);

        if (!user_found) {
            return res.status(401).json({ message: "User not found" });
        }

        // Respuesta exitosa con los datos del usuario
        const response = {
            success: true,
            user: {
                id: user_found._id,
                email: user_found.email,
                role: user_found.role,
                imgURL: user_found.imgURL,
                firstName: user_found.firstName,
                lastName: user_found.lastName,
                address: user_found.address,
                telegram_id: user_found.telegram_id,
                location: user_found.location,
                created_at: user_found.createdAt,
                updated_at: user_found.updatedAt,
            },
        };

        return res.status(200).json(response);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(500).json({ message: error.message });
    }
};

export const forgotPasswordTelegram = async (req, res) => {
    const { email } = req.body;

    try {
        console.log(
            `[FORGOT-PASSWORD-TELEGRAM] Buscando usuario con email: ${email}`,
        );

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log(
                `[FORGOT-PASSWORD-TELEGRAM] Usuario NO encontrado con email: ${email}`,
            );
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        console.log(
            `[FORGOT-PASSWORD-TELEGRAM] Usuario encontrado: ${user._id}, telegram_id: ${user.telegram_id}`,
        );

        if (!user.telegram_id) {
            console.log(
                `[FORGOT-PASSWORD-TELEGRAM] Usuario ${user._id} no tiene Telegram vinculado`,
            );
            return res.status(400).json({
                message:
                    "Este usuario no tiene una cuenta de Telegram vinculada.",
            });
        }

        // Generar código de 6 dígitos
        const resetCode = Math.floor(
            100000 + Math.random() * 900000,
        ).toString();
        const expiresIn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = expiresIn;
        await user.save();

        console.log(
            `[FORGOT-PASSWORD-TELEGRAM] Código generado para usuario ${user._id}: ${resetCode}, expira: ${expiresIn}`,
        );

        // Enviar código via n8n/Telegram
        const n8nWebhookUrl = process.env.N8N_TELEGRAM_RESET_WEBHOOK;
        if (!n8nWebhookUrl) {
            throw new Error("N8N_TELEGRAM_RESET_WEBHOOK is not defined");
        }

        try {
            const webhookResponse = await axios.post(n8nWebhookUrl, {
                telegram_id: user.telegram_id,
                reset_code: resetCode,
                username: user.username,
            });
            console.log(
                `[FORGOT-PASSWORD-TELEGRAM] Webhook enviado exitosamente para usuario ${user._id}`,
            );
        } catch (webhookError) {
            console.error(
                `[FORGOT-PASSWORD-TELEGRAM] Error al enviar webhook:`,
                webhookError.message,
            );
            // Continuamos aunque falle el webhook, el código está guardado en BD
        }

        res.json({ message: "Código de recuperación enviado a tu Telegram." });
    } catch (error) {
        console.error("[FORGOT-PASSWORD-TELEGRAM] Error:", error.message);
        console.error(error.stack);
        res.status(500).json({
            message: "Error al enviar el código de recuperación.",
        });
    }
};

// Check if email has telegram linked
export const checkTelegramStatus = async (req, res) => {
    const { email } = req.params;
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res
                .status(404)
                .json({ message: "Usuario no encontrado", hasTelegram: false });
        }
        res.json({ hasTelegram: !!user.telegram_id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Nuevo endpoint para envío por email
export const forgotPasswordEmail = async (req, res) => {
    const { email } = req.body;

    try {
        console.log(
            `[FORGOT-PASSWORD-EMAIL] Buscando usuario con email: ${email}`,
        );

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            console.log(
                `[FORGOT-PASSWORD-EMAIL] Usuario NO encontrado con email: ${email}`,
            );
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        console.log(
            `[FORGOT-PASSWORD-EMAIL] Usuario encontrado: ${user._id}, email: ${user.email}`,
        );

        // Generar código de 6 dígitos
        const resetCode = Math.floor(
            100000 + Math.random() * 900000,
        ).toString();
        const expiresIn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        user.resetPasswordCode = resetCode;
        user.resetPasswordExpires = expiresIn;
        await user.save();

        console.log(
            `[FORGOT-PASSWORD-EMAIL] Código generado para usuario ${user._id}: ${resetCode}, expira: ${expiresIn}`,
        );

        // Enviar código por email directamente (sin n8n)
        try {
            // Importar el servicio de email dinámicamente
            const emailService = await import("../services/emailService.js");
            await emailService.sendPasswordResetEmail(
                user.email,
                user.firstName || user.username || "Usuario",
                resetCode,
            );
            console.log(
                `[FORGOT-PASSWORD-EMAIL] Email enviado exitosamente a ${user.email}`,
            );
        } catch (emailError) {
            console.error(
                `[FORGOT-PASSWORD-EMAIL] Error al enviar email:`,
                emailError.message,
            );
            // Si falla el envío, eliminar el código guardado
            user.resetPasswordCode = null;
            user.resetPasswordExpires = null;
            await user.save();
            return res.status(500).json({
                message:
                    "Error al enviar el email. Por favor verifica la configuración del servidor de correo.",
            });
        }

        res.json({
            message: "Código de recuperación enviado a tu correo electrónico.",
        });
    } catch (error) {
        console.error("[FORGOT-PASSWORD-EMAIL] Error:", error.message);
        console.error(error.stack);
        res.status(500).json({
            message: "Error al enviar el código de recuperación.",
        });
    }
};

export const resetPasswordWithCode = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        console.log(
            `[RESET-PASSWORD] Intentando resetear contraseña para email: ${email}, código: ${code}`,
        );

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            console.log(
                `[RESET-PASSWORD] Usuario NO encontrado o código inválido/expirado para email: ${email}`,
            );
            return res
                .status(400)
                .json({ message: "Código inválido o expirado." });
        }

        console.log(
            `[RESET-PASSWORD] Usuario encontrado: ${user._id}, actualizando contraseña`,
        );

        const password_hash = await bcrypt.hash(newPassword, 10);
        user.password = password_hash;
        user.resetPasswordCode = null;
        user.resetPasswordExpires = null;
        await user.save();

        console.log(
            `[RESET-PASSWORD] Contraseña actualizada exitosamente para usuario ${user._id}`,
        );

        res.json({ message: "Contraseña actualizada exitosamente." });
    } catch (error) {
        console.error("[RESET-PASSWORD] Error:", error.message);
        console.error(error.stack);
        res.status(500).json({ message: error.message });
    }
};

// Actualizar nombre de usuario
export const updateProfile = async (req, res) => {
    const { firstName, lastName, address } = req.body;
    const userId = req.user.id;

    try {
        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (address !== undefined) updateData.address = address;

        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({
            success: true,
            message: "Perfil actualizado exitosamente",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                imgURL: user.imgURL,
                firstName: user.firstName,
                lastName: user.lastName,
                address: user.address,
                telegram_id: user.telegram_id,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Contraseña actual y nueva contraseña son requeridas",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "La nueva contraseña debe tener al menos 6 caracteres",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ message: "La contraseña actual es incorrecta" });
        }

        // Hashear nueva contraseña
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.password = passwordHash;
        await user.save();

        res.json({
            success: true,
            message: "Contraseña actualizada exitosamente",
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Assign role to user (Admin only)
export const assignRole = async (req, res) => {
    const { userId, newRole } = req.body;
    const adminId = req.user.id;

    try {
        // Validate that newRole is valid
        const allowedRoles = [
            "user",
            "patient",
            "consultant",
            "psychologist",
            "manager",
            "admin",
        ];
        if (!allowedRoles.includes(newRole)) {
            return res.status(400).json({
                message: "Rol no válido.",
                allowedRoles,
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const oldRole = user.role;

        // Assign new role
        user.role = newRole;
        await user.save();

        // Audit logging
        console.log(
            `[AUDIT] Admin ${adminId} changed role of user ${userId} from "${oldRole}" to "${newRole}" at ${new Date().toISOString()}`,
        );

        return res.json({
            success: true,
            message: `Rol actualizado exitosamente a ${newRole}`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error("[ERROR] assignRole:", error.message);
        res.status(500).json({ message: error.message });
    }
};
