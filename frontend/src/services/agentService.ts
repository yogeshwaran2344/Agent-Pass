import api from './api';
import { Agent, AgentCapability } from '../types';

export interface AgentCreatePayload {
  name: string;
  description?: string;
  framework?: string;
  model_name?: string;
  metadata_json?: Record<string, any>;
  capabilities?: Array<{
    capability_name: string;
    scope: string;
    description?: string;
    is_enabled?: boolean;
  }>;
}

export interface AgentRegistrationResult {
  agent: Agent;
  api_key: string;
  message: string;
}

export const agentService = {
  async registerAgent(data: AgentCreatePayload): Promise<AgentRegistrationResult> {
    const res = await api.post('/agents/', data);
    return res.data;
  },

  async listAgents(): Promise<Agent[]> {
    const res = await api.get('/agents/');
    return res.data;
  },

  async getAgent(agentId: string): Promise<Agent> {
    const res = await api.get(`/agents/${agentId}`);
    return res.data;
  },

  async updateAgent(agentId: string, data: Partial<AgentCreatePayload>): Promise<Agent> {
    const res = await api.patch(`/agents/${agentId}`, data);
    return res.data;
  },

  async changeStatus(agentId: string, status: string, reason: string): Promise<Agent> {
    const res = await api.post(`/agents/${agentId}/status`, { status, reason });
    return res.data;
  },

  async addCapability(agentId: string, capability: AgentCapability): Promise<AgentCapability> {
    const res = await api.post(`/agents/${agentId}/capabilities`, capability);
    return res.data;
  },

  async getHistory(agentId: string): Promise<any[]> {
    const res = await api.get(`/agents/${agentId}/history`);
    return res.data;
  },

  async deleteAgent(agentId: string): Promise<{ message: string }> {
    const res = await api.delete(`/agents/${agentId}`);
    return res.data;
  },
};
