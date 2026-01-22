import z from "zod";


export const user_schema = z.object({

    username:
        z.string({
            required_error: "Username is required"
        }),



    email:
        z.string({
            required_error: "Email is required"
        })
            .email({
                message: "Invalid email"
            }),


    role:
        z.string({
            required_error: 'Role is required',
            invalid_type_error: 'Invalid Role',
        }),


    password:
        z.string({
            required_error: "Password is required"
        })
            .min(6, {
                message: "Password must be at least 6 characters"
            })

});