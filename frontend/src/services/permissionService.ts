import api from './api';
import { PermissionPolicy } from '../types';

export interface PermissionPolicyCreatePayload {
  agent_id: string;
  max_amount_per_tx: number;
  daily_spend_limit: number;
  monthly_spend_limit: number;
  require_human_approval_above: number;
  allowed_merchants: string[];
  disallowed_merchants: string[];
  allowed_categories: string[];
  disallowed_categories: string[];
  valid_until?: string;
}

export interface PermissionEvaluationRequest {
  agent_id: string;
  amount: number;
  merchant: string;
  category?: string;
}

export interface PermissionEvaluationResponse {
  is_authorized: boolean;
  requires_human_approval: boolean;
  reason: string;
  violations: string[];
}

export const permissionService = {
  async createPolicy(data: PermissionPolicyCreatePayload): Promise<PermissionPolicy> {
    const res = await api.post('/permissions/', data);
    return res.data;
  },

  async getAgentPermissions(agentId: string): Promise<PermissionPolicy[]> {
    const res = await api.get(`/permissions/agent/${agentId}`);
    return res.data;
  },

  async evaluateTransaction(data: PermissionEvaluationRequest): Promise<PermissionEvaluationResponse> {
    const res = await api.post('/permissions/evaluate', data);
    return res.data;
  },
};
