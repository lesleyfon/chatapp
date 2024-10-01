import { z } from "zod";

export const RegisterFormSchemaValidation = z.object({
	email: z.string().email("Invalid Email").min(2, {
		message: "Username must be at least 2 characters.",
	}),
	password: z.string().min(6, {
		message: "Password must be of length 6 or greater",
	}),
	name: z.string().min(1, {
		message: "Full name is required",
	}),
});


export const LoginFormSchemaValidation = z.object({
  email: z.string().email("Invalid Email").min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be of length 6 or greater",
  }),
});