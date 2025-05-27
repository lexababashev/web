import api from '../api/axios';
import { User } from '../types/user';

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/me');
    return response.data;
  },
};
