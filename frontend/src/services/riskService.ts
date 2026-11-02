import api from './api';
import { RiskEvaluationRequest, RiskEvaluationResult } from '../types';

export const riskService = {
  async evaluateRisk(req: RiskEvaluationRequest): Promise<RiskEvaluationResult> {
    const res = await api.post<RiskEvaluationResult>('/risk/evaluate', req);
    return res.data;
  },
};
