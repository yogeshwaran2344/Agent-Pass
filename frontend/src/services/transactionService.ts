import api from './api';
import { Transaction } from '../types';

export interface CreateTransactionPayload {
  agent_id: string;
  commitment_id?: string;
  approval_id?: string;
  idempotency_key?: string;
  amount: number;
  merchant: string;
  currency?: string;
  payment_method?: string;
  metadata_json?: Record<string, any>;
}

export const transactionService = {
  async listTransactions(): Promise<Transaction[]> {
    const res = await api.get('/transactions/');
    return res.data;
  },

  async createTransaction(data: CreateTransactionPayload): Promise<Transaction> {
    const res = await api.post('/transactions/', data);
    return res.data;
  },
};
