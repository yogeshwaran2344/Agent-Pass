import api from './api';
import { UserIntent, IntentEvaluation } from '../types';

export interface CreateIntentPayload {
  raw_prompt: string;
  primary_goal?: string;
  target_category?: string;
  positive_constraints?: string[];
  negative_constraints?: string[];
  max_acceptable_budget?: number;
}

export interface EvaluateIntentPayload {
  intent_id: string;
  agent_id: string;
  proposed_item_name: string;
  proposed_merchant: string;
  proposed_price: number;
  proposed_item_specs?: Record<string, any>;
}

export const intentService = {
  async createIntent(data: CreateIntentPayload): Promise<UserIntent> {
    const res = await api.post('/intents/', data);
    return res.data;
  },

  async listIntents(): Promise<UserIntent[]> {
    const res = await api.get('/intents/');
    return res.data;
  },

  async evaluateIntent(data: EvaluateIntentPayload): Promise<IntentEvaluation> {
    const res = await api.post('/intents/evaluate', data);
    return res.data;
  },
};
