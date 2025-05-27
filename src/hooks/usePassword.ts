import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { passwordService } from '../services/password.service';
import {
  ForgotPasswordReq,
  ResetPasswordReq,
  ValidateCodeRes,
} from '../types/password';
import { useRouter } from 'next/navigation';

interface ErrorResponse {
  message: string;
}

export function usePassword() {
  const router = useRouter();

  const forgotPassword = useMutation<
    { message: string },
    AxiosError<ErrorResponse>,
    ForgotPasswordReq
  >({
    mutationFn: (data) => passwordService.forgotPassword(data),
  });

  const validateResetCode = (code: string) =>
    useQuery<ValidateCodeRes, AxiosError<ErrorResponse>>({
      queryKey: ['validateResetCode', code],
      queryFn: () => passwordService.validateResetCode(code),
      enabled: !!code,
      retry: false,
    });

  const resetPassword = useMutation<
    { token: string },
    AxiosError<ErrorResponse>,
    { code: string; data: ResetPasswordReq }
  >({
    mutationFn: ({ code, data }) => passwordService.resetPassword(code, data),
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    },
  });

  return {
    forgotPassword,
    isPending: forgotPassword.isPending,
    validateResetCode,
    resetPassword,
  };
}
