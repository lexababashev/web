export interface ForgotPasswordReq {
  email: string;
}

export interface ForgotPasswordRes {
  message: string;
}

export interface ValidateCodeRes {
  message: string;
}

export interface ResetPasswordReq {
  password: string;
}

export interface ResetPasswordRes {
  token: string;
}
