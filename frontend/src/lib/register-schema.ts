import { z } from "zod";

export const RegisterSchema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName: z.string().min(2, 'Enter your last name'),
  email: z.string().email('Enter a valid school email'),
  school: z.string().min(2, 'Enter your school'),
  woreda: z.string().min(2, 'Enter your woreda'),
  zone: z.string().min(2, 'Enter your zone'),
  region: z.string().min(2, 'Enter your region'),
  subject: z.string().optional(),
  password: z
    .string()
    .min(12, 'Must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special symbol'),
  agreedToTerms: z.literal(true, 'You must accept the terms to continue'),
});

export type RegisterSchema =
  z.infer<typeof RegisterSchema>;