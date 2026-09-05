import { apiClient } from '@/lib/api-client';
import { LoginCredentials, SignupCredentials, User } from './types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post<User>('/auth/login', credentials);
    return response.data;
  },

  signup: async (credentials: SignupCredentials): Promise<User> => {
    const response = await apiClient.post<User>('/auth/signup', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
