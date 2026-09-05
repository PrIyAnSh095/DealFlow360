import { apiClient } from '@/lib/api-client';

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
}

export const searchApi = {
  globalSearch: async (q: string): Promise<SearchResult[]> => {
    if (!q || q.length < 2) return [];
    const response = await apiClient.get<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`);
    return response.data;
  }
};
