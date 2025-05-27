'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { usePassword } from '@/src/hooks/usePassword';
import { ResetPasswordReq } from '@/src/types/password';
import { resetPasswordSchema } from '@/src/validations/password.schema';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { validateResetCode, resetPassword } = usePassword();
  const {
    data: validationData,
    isLoading: isValidating,
    isError: isValidationError,
    error: validationError,
  } = validateResetCode(code || '');

  const isCodeValid = !isValidationError && validationData !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form using zod schema
    const validationResult = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      // Get the first error message
      const formattedError = validationResult.error.issues[0].message;
      setError(formattedError);
      return;
    }

    if (!code) {
      setError('Missing reset code.');
      return;
    }

    const resetData: ResetPasswordReq = { password };

    try {
      await resetPassword.mutateAsync({ code, data: resetData });
    } catch (err) {
      // Error is managed by the mutation
    }
  };

  // Render loading state while validating code
  if (isValidating) {
    return (
      <AuthLayout
        title="Reset Password"
        description="Please wait while we validate your reset code."
      >
        <div className="flex flex-col items-center justify-center w-full py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-default-600">Validating your reset code...</p>
        </div>
      </AuthLayout>
    );
  }

  // Render error for invalid code
  if (!isCodeValid) {
    return (
      <AuthLayout
        title="Reset Password"
        description="There was a problem with your reset code."
      >
        <AuthFormContainer
          title=""
          subtitle=""
          subtitleLink={{
            text: '',
            href: '',
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="h-[60px] flex items-center justify-center w-full">
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {validationError?.response?.data?.message ||
                'Invalid or expired reset code. Please request a new password reset link.'}
            </div>
          </div>

          <Button
            as="a"
            href="/forgot-password"
            color="primary"
            className="w-full"
            size="lg"
          >
            Request New Link
          </Button>
        </AuthFormContainer>
      </AuthLayout>
    );
  }

  // Render success state
  if (resetPassword.isSuccess) {
    return (
      <AuthLayout
        title="Password Reset Complete"
        description="Your password has been successfully reset."
      >
        <div className="flex flex-col items-center justify-center w-full py-6">
          <div className="p-4 rounded-md text-success-700 bg-success-50 w-full mb-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-success-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <p className="ml-3 text-sm">
                Your password has been reset successfully
              </p>
            </div>
          </div>
          <Button as="a" href="/signin" color="primary" className="w-full">
            Sign In with New Password
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Render the password reset form
  return (
    <AuthLayout
      title="Reset Password"
      description="Create a new secure password for your account."
    >
      <AuthFormContainer
        title="New Password"
        subtitle="Remember your password?"
        subtitleLink={{
          text: 'Sign In',
          href: '/signin',
        }}
        onSubmit={handleSubmit}
      >
        <div className="relative w-full">
          <label
            htmlFor="password"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            New Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your new password"
            variant="bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
            minLength={6}
            isInvalid={!!error}
            classNames={{
              base: 'pt-2',
              input: 'outline-none pt-1',
            }}
          />
        </div>

        <div className="relative w-full">
          <label
            htmlFor="confirmPassword"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            variant="bordered"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
            minLength={6}
            isInvalid={!!error}
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
          isLoading={resetPassword.isPending}
        >
          Reset Password
        </Button>

        <div className="h-[60px] flex items-center justify-center w-full">
          {error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {error}
            </div>
          )}

          {resetPassword.isError && !error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {resetPassword.error.response?.data?.message ||
                'Failed to reset password. Please try again.'}
            </div>
          )}
        </div>
      </AuthFormContainer>
    </AuthLayout>
  );
}
