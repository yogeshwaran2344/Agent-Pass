import api from './api';

export interface KillSwitchPayload {
  agent_id?: string;
  scope: 'agent' | 'delegation_tree' | 'global';
  reason: string;
}

export interface EmergencyStatusResponse {
  global_kill_active: boolean;
  suspended_agents_count: number;
  revoked_agents_count: number;
  pending_approvals_count: number;
}

export const emergencyService = {
  async triggerKillSwitch(data: KillSwitchPayload): Promise<any> {
    const res = await api.post('/emergency/kill-switch', data);
    return res.data;
  },

  async getStatus(): Promise<EmergencyStatusResponse> {
    const res = await api.get('/emergency/status');
    return res.data;
  },
};
