import { z } from "zod";

export const baseSchema = z.object({
  name: z.string().min(3, "name must be more than 3 charachters length"),
  email: z.string().email("please write valid email"),
  password: z.string().min(8, "password should has at least 8 characters"),
  passConfirm: z.string().min(8, "password should has at least 8 characters"),
});

export const LoginSchema = baseSchema.pick({ email: true, password: true });

export const RegisterSchema = baseSchema.refine(
  (data) => data.password === data.passConfirm,
  {
    message: "passwords don't match",
    path: ["passConfirm"],
  }
);

export type LoginType = z.infer<typeof LoginSchema>;
export type LoginKeysType = keyof LoginType;

export type RegisterType = z.infer<typeof RegisterSchema>;
export type RegisterKeysType = keyof RegisterType;

export type inputField<keys> = {
  type: "text" | "email" | "password";
  key: keys;
  label?: string;
};
