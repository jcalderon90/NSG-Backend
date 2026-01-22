import { Router } from "express";

//controllers
import {
    login,
    logout,
    register,
    profile,
    verifyToken,
    forgotPasswordTelegram,
    forgotPasswordEmail,
    resetPasswordWithCode,
    updateProfile,
    changePassword,
    assignRole,
    checkTelegramStatus,
} from "../controllers/auth.controller.js";

//middlewares
import {
    auth_required,
    admin_required,
} from "../middlewares/validate_token.js";
import { validate_schema } from "../middlewares/validator_schema.middleware.js";

//schemas
import { register_schema, login_schema } from "../schemas/auth.schema.js";

const auth_router = Router();

auth_router.post("/register", validate_schema(register_schema), register);

auth_router.post("/login", validate_schema(login_schema), login);

auth_router.post("/logout", logout);

auth_router.get("/profile", auth_required, profile);

auth_router.get("/verify-token", verifyToken);

auth_router.post("/forgot-password-telegram", forgotPasswordTelegram);
auth_router.get("/check-telegram/:email", checkTelegramStatus);
auth_router.post("/forgot-password-email", forgotPasswordEmail);
auth_router.post("/reset-password", resetPasswordWithCode);

// Rutas para actualizar perfil
auth_router.patch("/update-profile", auth_required, updateProfile);
auth_router.patch("/change-password", auth_required, changePassword);

// Ruta para asignar roles (solo admin)
auth_router.post("/assign-role", auth_required, admin_required, assignRole);

export default auth_router;
