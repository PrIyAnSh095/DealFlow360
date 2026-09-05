import { apiClient } from '@/lib/api-client';
import { LoginCredentials, SignupCredentials, User } from './types';

// The backend returns a Token response
interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
    localStorage.setItem('dealflow_token', response.data.access_token);
    return response.data.user;
  },

  signup: async (credentials: SignupCredentials): Promise<User> => {
    const response = await apiClient.post<TokenResponse>('/auth/signup', credentials);
    localStorage.setItem('dealflow_token', response.data.access_token);
    return response.data.user;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('dealflow_token');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
