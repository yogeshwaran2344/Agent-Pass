import api from './api';
import { AuditLogItem } from '../types';

export const auditService = {
  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await api.get('/audit/');
    return res.data;
  },
};
