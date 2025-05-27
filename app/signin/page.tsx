'use client';

import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useAuth } from '@/src/hooks/useAuth';
import { SignInCredentials } from '@/src/types/auth';
import { useState } from 'react';
import { signinSchema } from '@/src/validations/auth.schema';

export default function SignIn() {
  const { signIn, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const form = event.target as HTMLFormElement;
    const formData = {
      login: form.login.value,
      password: form.password.value,
    };

    // Validate form using zod schema
    const validationResult = signinSchema.safeParse(formData);

    if (!validationResult.success) {
      // Get the first error message
      const formattedError = validationResult.error.issues[0].message;
      setError(formattedError);
      return;
    }

    const credentials: SignInCredentials = {
      login: formData.login,
      password: formData.password,
    };

    try {
      await signIn.mutateAsync(credentials);
    } catch (error) {
      // Error handling is managed by React Query in the useAuth hook
      // The UI will automatically update based on signIn.error
    }
  };

  return (
    <AuthLayout
      title="Welcome back!"
      description="Sign in to continue creating stunning congratulation videos with Celebration."
    >
      <AuthFormContainer
        title="Sign In"
        subtitle="Don't have an account?"
        subtitleLink={{
          text: 'Sign Up',
          href: '/signup',
        }}
        onSubmit={handleSubmit}
      >
        <div className="relative w-full">
          <label
            htmlFor="login"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            Email or Username
          </label>
          <Input
            id="login"
            name="login"
            type="text"
            placeholder="Enter your email or username"
            variant="bordered"
            isRequired
            isInvalid={!!error || !!signIn.error}
            classNames={{
              base: 'pt-2',
              input: 'outline-none pt-1',
            }}
          />
        </div>

        <div className="relative w-full">
          <label
            htmlFor="password"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            variant="bordered"
            isRequired
            isInvalid={!!error || !!signIn.error}
            classNames={{
              base: 'pt-2',
              input: 'outline-none pt-1',
            }}
          />
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-primary-500 text-sm hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          color="primary"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="h-[60px] flex items-center justify-center w-full">
          {error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {error}
            </div>
          )}

          {signIn.error && !error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {signIn.error.response?.data?.message ||
                'An error occurred during sign in'}
            </div>
          )}
        </div>
      </AuthFormContainer>
    </AuthLayout>
  );
}
