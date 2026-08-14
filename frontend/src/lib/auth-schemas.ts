import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z
  .object({
    firstName: z.string().min(2, 'Enter your first name'),
    lastName: z.string().min(2, 'Enter your last name'),
    email: z.string().email('Enter a valid school email'),
    school: z.string().min(2, 'Enter your school'),
    woreda: z.string().min(2, 'Enter your woreda'),
    zone: z.string().min(2, 'Enter your zone'),
    region: z.string().min(2, 'Enter your region'),
    subject: z.string().optional(),
    department: z.string().min(2, 'Enter your department/subject'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
     
    agreedToTerms: z.literal(true, 'You must accept the terms to continue'),
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;
