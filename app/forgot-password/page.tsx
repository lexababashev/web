'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { usePassword } from '@/src/hooks/usePassword';
import { ForgotPasswordReq } from '@/src/types/password';
import { forgotPasswordSchema } from '@/src/validations/password.schema';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const { forgotPassword, isPending } = usePassword();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError(null);

    // Validate form using zod schema
    const validationResult = forgotPasswordSchema.safeParse({ email });

    if (!validationResult.success) {
      const formattedError = validationResult.error.issues[0].message;
      setError(formattedError);
      return;
    }

    const data: ForgotPasswordReq = { email };
    try {
      await forgotPassword.mutateAsync(data);
      setEmail('');
    } catch (error) {
      // Error handling is managed by React Query in the usePassword hook
      // The UI will automatically update based on forgotPassword.error
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      description="Enter your email address and we'll send you a link to reset your password."
    >
      <AuthFormContainer
        title="Reset Password"
        subtitle="Remember your password?"
        subtitleLink={{
          text: 'Sign In',
          href: '/signin',
        }}
        onSubmit={handleSubmit}
      >
        <div className="relative w-full">
          <label
            htmlFor="email"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            variant="bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isRequired
            isInvalid={!!error || !!forgotPassword.error}
            classNames={{
              base: 'pt-2',
              input: 'outline-none pt-1',
            }}
          />
        </div>

        <Button
          type="submit"
          color="primary"
          className="w-full"
          size="lg"
          isLoading={isPending}
        >
          Send Reset Link
        </Button>

        <div className="h-[60px] flex items-center justify-center w-full">
          {error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {error}
            </div>
          )}

          {forgotPassword.isError && !error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50">
              {forgotPassword.error.response?.data?.message ||
                'An error occurred. Please try again later.'}
            </div>
          )}

          {forgotPassword.isSuccess && (
            <div className="p-3 rounded-md text-sm text-success-700 bg-success-50">
              {forgotPassword.data?.message ||
                'If email exists, you will receive a code.'}
            </div>
          )}
        </div>
      </AuthFormContainer>
    </AuthLayout>
  );
}
