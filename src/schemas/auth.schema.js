import { z } from "zod";

export const register_schema = z.object({
    email: z
        .string({
            required_error: "Email is required",
        })
        .email({
            message: "Invalid email",
        }),

    password: z
        .string({
            required_error: "Password is required",
        })
        .min(6, {
            message: "Password must be at least 6 characters",
        }),
});

export const login_schema = z.object({
    email: z
        .string({
            required_error: "Email is required",
        })
        .email({
            message: "Invalid email",
        }),

    password: z
        .string({
            required_error: "Password is required",
        })
        .min(6, {
            message: "Password must be at least 6 characters",
        }),
});
