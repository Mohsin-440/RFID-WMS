import * as z from "zod"
export const registerValidatorsss = z.object({
    firstName: z.string({ required_error: "First name is required" }).min(1, { message: "First name is required" }),
    lastName: z.string({ required_error: "Last name is required" }).min(1, { message: "Last name is required" }),
    email: z
        .string({ required_error: "Email is required" })
        .min(1, { message: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters"),
    warehouseId: z
        .string({ required_error: "Warehouse is required" })
        .min(1, "Warehouse is required"),
    role: z.enum(["CounterMan", "Manager", "Worker"], {
        required_error: "Role is required",
    }),
});


export type RegisterValidator = z.infer<typeof registerValidatorsss>