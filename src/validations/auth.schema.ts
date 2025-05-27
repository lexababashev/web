import { z } from 'zod';

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(2, { message: 'Username must be at least 2 characters' })
      .max(32, { message: 'Username cannot exceed 32 characters' })
      .trim(),

    email: z
      .string()
      .email({ message: 'Please enter a valid email address' })
      .trim()
      .toLowerCase(),

    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' })
      .max(32, { message: 'Password cannot exceed 32 characters' }),

    confirmPassword: z.string(),

    terms: z.literal(true, {
      errorMap: () => ({
        message: 'Please accept the terms and privacy policy to continue',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match. Please try again",
    path: ['confirmPassword'],
  });

export const signinSchema = z.object({
  login: z
    .string()
    .min(2, { message: 'Username or email is too short' })
    .max(32, { message: 'Username or email is too long' })
    .trim(),

  password: z
    .string()
    .min(6, { message: 'Password is too short' })
    .max(32, { message: 'Password is too long' }),
});
