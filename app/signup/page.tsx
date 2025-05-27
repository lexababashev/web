'use client';

import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Input } from '@heroui/input';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { SignUpCredentials } from '@/src/types/auth';
import { useAuth } from '@/src/hooks/useAuth';
import { useState } from 'react';
import { signupSchema } from '@/src/validations/auth.schema';

export default function SignUp() {
  const { signUp } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setError(null);

    const form = event.target as HTMLFormElement;
    const formData = {
      username: form.username.value,
      email: form.email.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value,
      terms: form.terms.checked,
    };

    // Validate form using zod schema
    const validationResult = signupSchema.safeParse(formData);

    if (!validationResult.success) {
      // Get the first error message
      const formattedError = validationResult.error.issues[0].message;
      setError(formattedError);
      return;
    }

    const credentials: SignUpCredentials = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
    };

    try {
      await signUp.mutateAsync(credentials);
    } catch (error) {
      // Error handling is managed by React Query in the useAuth hook
    }
  };

  return (
    <AuthLayout
      title="Bring your celebrations to life"
      description="Start creating stunning congratulation videos in minutes. With Celebration you don't need any video editing skills."
    >
      <AuthFormContainer
        title="Create Account"
        subtitle="Already have an account?"
        subtitleLink={{
          text: 'Sign In',
          href: '/signin',
        }}
        onSubmit={handleSubmit}
      >
        <div className="relative w-full">
          <label
            htmlFor="username"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Enter username"
            variant="bordered"
            isRequired
            classNames={{
              base: 'pt-2',
              input: 'outline-none pt-1',
            }}
          />
        </div>

        <div className="relative w-full">
          <label
            htmlFor="email"
            className="absolute text-xs text-default-500 -top-2 left-2 bg-background px-1"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter email address"
            variant="bordered"
            isRequired
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
            placeholder="Enter password"
            variant="bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
            minLength={8}
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
            placeholder="Enter password again"
            variant="bordered"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
            minLength={8}
            classNames={{
              base: 'pt-2',
              input: 'outline-none pt-1',
            }}
          />
        </div>

        <div className="flex items-center gap-5">
          <Checkbox
            id="terms"
            name="terms"
            isRequired
            size="md"
            classNames={{
              icon: 'hidden',
            }}
          />
          <label htmlFor="terms" className="text-sm text-default-600">
            I agree to the{' '}
            <Link href="/terms" className="text-primary-500 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-500 hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          color="primary"
          className="w-full"
          size="lg"
          isLoading={signUp.isPending}
        >
          Sign Up
        </Button>

        <div className="h-[60px] flex items-center justify-center w-full">
          {error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {error}
            </div>
          )}

          {signUp.isError && !error && (
            <div className="p-3 rounded-md text-sm text-danger-500 bg-danger-50 w-full">
              {signUp.error?.response?.data?.message ||
                'Failed to sign up. Please try again.'}
            </div>
          )}
        </div>
      </AuthFormContainer>
    </AuthLayout>
  );
}
