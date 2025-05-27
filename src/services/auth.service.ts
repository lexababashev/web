import api from '../api/axios';
import {
  AuthResponse,
  SignInCredentials,
  SignUpCredentials,
} from '../types/auth';

export const authService = {
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/signup', credentials);
    return response.data;
  },

  async signOut(): Promise<void> {
    const response = await api.post('/logout');
    if (response.status === 204) {
      localStorage.removeItem('auth_token');
    } else {
      localStorage.removeItem('auth_token');
      throw new Error('Failed to logout');
    }
  },
};
