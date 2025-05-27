import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .trim()
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .max(32, { message: 'Password cannot exceed 32 characters' }),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match. Please try again",
    path: ['confirmPassword'],
  });
