import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalApi } from './api';
import { QuoteMessageCreate } from './types';

export const usePublicQuote = (publicId: string) => {
  return useQuery({
    queryKey: ['portal', 'quote', publicId],
    queryFn: () => portalApi.getPublicQuote(publicId),
    enabled: !!publicId
  });
};

export const useQuoteMessages = (publicId: string) => {
  return useQuery({
    queryKey: ['portal', 'messages', publicId],
    queryFn: () => portalApi.getMessages(publicId),
    enabled: !!publicId,
    refetchInterval: 5000 // Poll every 5s for chat updates
  });
};

export const useSendQuoteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, payload }: { publicId: string; payload: QuoteMessageCreate }) => 
      portalApi.sendMessage(publicId, payload),
    onSuccess: (_, { publicId }) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'messages', publicId] });
    }
  });
};

export const useConfirmQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => portalApi.confirmQuote(publicId),
    onSuccess: (_, publicId) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'quote', publicId] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'messages', publicId] });
    }
  });
};
