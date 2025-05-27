import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { authService } from '../services/auth.service';
import { SignInCredentials, SignUpCredentials } from '../types/auth';

interface ErrorResponse {
  message: string;
}

export function useAuth() {
  const router = useRouter();

  const signIn = useMutation<
    { token: string },
    AxiosError<ErrorResponse>,
    SignInCredentials
  >({
    mutationFn: (credentials) => authService.signIn(credentials),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    },
  });

  const signUp = useMutation<
    { token: string },
    AxiosError<ErrorResponse>,
    SignUpCredentials
  >({
    mutationFn: (credentials) => authService.signUp(credentials),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    },
  });

  const signOut = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: () => {
      router.push('/signin');
    },
  });

  return {
    signIn,
    signUp,
    signOut,
    isLoading: signIn.isPending || signOut.isPending,
  };
}
