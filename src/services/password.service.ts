import api from '../api/axios';
import {
  ForgotPasswordReq,
  ForgotPasswordRes,
  ResetPasswordReq,
  ResetPasswordRes,
  ValidateCodeRes,
} from '../types/password';

export const passwordService = {
  async forgotPassword(data: ForgotPasswordReq): Promise<ForgotPasswordRes> {
    const response = await api.post<ForgotPasswordRes>(
      '/forgot-password',
      data
    );
    return response.data;
  },

  async validateResetCode(code: string): Promise<ValidateCodeRes> {
    const response = await api.get<ValidateCodeRes>('/reset-password', {
      params: { code },
    });
    return response.data;
  },

  async resetPassword(
    code: string,
    data: ResetPasswordReq
  ): Promise<ResetPasswordRes> {
    const response = await api.post<ResetPasswordRes>('/reset-password', data, {
      params: { code },
    });
    return response.data;
  },
};
