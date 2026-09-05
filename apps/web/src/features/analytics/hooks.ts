import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from './api';

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.getDashboard,
  });
};
