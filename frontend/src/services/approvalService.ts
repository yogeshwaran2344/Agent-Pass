import api from './api';
import { ApprovalRequest } from '../types';

export const approvalService = {
  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    const res = await api.get('/approvals/pending');
    return res.data;
  },

  async takeAction(
    approvalId: string,
    action: 'approve' | 'reject' | 'clarify',
    user_comment?: string
  ): Promise<ApprovalRequest> {
    const res = await api.post(`/approvals/${approvalId}/action`, {
      action,
      user_comment,
    });
    return res.data;
  },
};
