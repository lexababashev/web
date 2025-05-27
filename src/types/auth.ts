export interface SignInCredentials {
  login: string; // Can be email or username
  password: string;
}

export interface SignUpCredentials {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}
