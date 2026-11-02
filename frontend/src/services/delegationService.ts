import api from './api';
import { Delegation, DelegationCreate } from '../types';

export const delegationService = {
  async listDelegations(isActive?: boolean): Promise<Delegation[]> {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const res = await api.get<Delegation[]>('/delegations/', { params });
    return res.data;
  },

  async createDelegation(data: DelegationCreate): Promise<Delegation> {
    const res = await api.post<Delegation>('/delegations/', data);
    return res.data;
  },

  async getDelegationChain(agentId: string): Promise<Delegation[]> {
    const res = await api.get<Delegation[]>(`/delegations/chain/${agentId}`);
    return res.data;
  },

  async revokeDelegation(delegationId: string, reason = 'Manually revoked by operator'): Promise<Delegation> {
    const res = await api.delete<Delegation>(`/delegations/${delegationId}`, {
      params: { reason },
    });
    return res.data;
  },
};
