import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const VERIFICATION_DOCUMENT_TYPES = [
  'TEACHER_ID',
  'EMPLOYMENT_LETTER',
  'CERTIFICATE',
  'OTHER',
] as const;

export const MAX_VERIFICATION_DOCUMENTS = 3;
export const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_VERIFICATION_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const VerificationDocumentSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => ACCEPTED_VERIFICATION_MIME_TYPES.includes(file.type),
      'PDF, DOCX, JPG or PNG only.',
    )
    .refine(
      (file) => file.size <= MAX_VERIFICATION_FILE_SIZE,
      'Maximum file size is 5 MB.',
    ),
  documentType: z.enum(VERIFICATION_DOCUMENT_TYPES),
});

export const VerificationDocumentsSchema = z
  .array(VerificationDocumentSchema)
  .min(1, 'Please upload at least one verification document.')
  .max(MAX_VERIFICATION_DOCUMENTS, 'You can upload at most 3 documents.');

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
    teacherIdNumber: z.string().optional(),
    documents: VerificationDocumentsSchema,
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
export type VerificationDocumentValue = z.infer<typeof VerificationDocumentSchema>;
export type VerificationDocumentType = (typeof VERIFICATION_DOCUMENT_TYPES)[number];
