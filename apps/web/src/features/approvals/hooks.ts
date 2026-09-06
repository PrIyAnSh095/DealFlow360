import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from './api';
import { ApprovalActionRequest } from './types';

export const useApprovals = () => {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: approvalsApi.getApprovals,
  });
};

export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApprovalActionRequest }) =>
      approvalsApi.approve(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApprovalActionRequest }) =>
      approvalsApi.reject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
};
