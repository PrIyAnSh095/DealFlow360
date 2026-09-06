import { apiClient } from '@/lib/api-client';
import { LoginCredentials, SignupCredentials, User } from './types';

// The backend returns a Token response
interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const encryptPasswordPayload = (password: string): string => {
  if (!password) return password;
  try {
    return 'enc:' + btoa(password);
  } catch (e) {
    return password;
  }
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const payload = {
      ...credentials,
      password: encryptPasswordPayload(credentials.password)
    };
    const response = await apiClient.post<TokenResponse>('/auth/login', payload);
    localStorage.setItem('dealflow_token', response.data.access_token);
    return response.data.user;
  },

  signup: async (credentials: SignupCredentials): Promise<User> => {
    const payload = {
      ...credentials,
      password: encryptPasswordPayload(credentials.password)
    };
    const response = await apiClient.post<TokenResponse>('/auth/register', payload);
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

  updateMe: async (data: { name?: string; role?: string }): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me', data);
    return response.data;
  },
};
