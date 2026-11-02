import api from './api';

export interface DashboardStats {
  total_agents: number;
  active_agents: number;
  suspended_agents: number;
  pending_approvals_count: number;
  total_reserved_usd: number;
  total_settled_usd: number;
  recent_transactions: Array<{
    id: string;
    agent_id: string;
    merchant: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  }>;
  recent_audit_events: Array<{
    id: string;
    action: string;
    actor_type: string;
    description: string;
    created_at: string;
  }>;
  pending_approvals: Array<{
    id: string;
    agent_id: string;
    merchant_name: string;
    amount: number;
    item_description: string;
    reason_for_approval: string;
    policy_conflicts: string[];
    created_at: string;
  }>;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
};
