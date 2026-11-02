export type UserRole = 'admin' | 'agent_operator' | 'auditor' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type AgentStatus = 'active' | 'suspended' | 'deactivated' | 'revoked' | 'killed';

export interface AgentCapability {
  capability_name: string;
  scope: string;
  description?: string;
  is_enabled: boolean;
}

export interface AgentReputation {
  reputation_score: number;
  trust_tier: 'PROBATIONARY' | 'ESTABLISHED' | 'HIGH_TRUST' | 'UNTRUSTED';
  total_tasks_attempted: number;
  successful_tasks_count: number;
  failed_tasks_count: number;
  policy_violations_count: number;
  rejected_recommendations_count: number;
}

export interface Agent {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  agent_type: string;
  framework?: string;
  model_name?: string;
  status: AgentStatus;
  suspension_reason?: string;
  is_kill_switched: boolean;
  kill_reason?: string;
  capabilities: AgentCapability[];
  reputation?: AgentReputation;
  created_at: string;
  updated_at: string;
}

export interface PermissionPolicy {
  id: string;
  agent_id: string;
  max_amount_per_tx: number;
  daily_spend_limit: number;
  monthly_spend_limit: number;
  require_human_approval_above: number;
  allowed_merchants: string[];
  disallowed_merchants: string[];
  allowed_categories: string[];
  disallowed_categories: string[];
  allowed_countries: string[];
  is_active: boolean;
  valid_until?: string;
  created_at: string;
}

export interface UserIntent {
  id: string;
  user_id: string;
  raw_prompt: string;
  primary_goal?: string;
  target_category?: string;
  positive_constraints: string[];
  negative_constraints: string[];
  max_acceptable_budget?: number;
  is_active: boolean;
  created_at: string;
}

export interface IntentEvaluation {
  evaluation_id: string;
  intent_id: string;
  consistency_score: number;
  is_consistent: boolean;
  decision: 'MATCH' | 'DRIFT' | 'HARD_CONFLICT';
  conflicting_requirements: string[];
  reasoning: string;
}

export interface ApprovalRequest {
  id: string;
  agent_id: string;
  intent_id?: string;
  amount: number;
  currency: string;
  merchant_name: string;
  item_description: string;
  reason_for_approval: string;
  policy_conflicts: string[];
  intent_divergence_summary?: string;
  status: 'pending' | 'approved' | 'rejected' | 'clarification_requested' | 'expired';
  user_comment?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Commitment {
  id: string;
  agent_id: string;
  intent_id?: string;
  amount: number;
  currency: string;
  merchant: string;
  purpose: string;
  status: 'reserved' | 'committed' | 'settled' | 'released' | 'expired';
  reserved_at: string;
  expires_at: string;
  settled_at?: string;
}

export interface Transaction {
  id: string;
  agent_id: string;
  commitment_id?: string;
  amount: number;
  currency: string;
  merchant: string;
  payment_method: string;
  status: 'pending' | 'authorized' | 'completed' | 'failed' | 'refunded';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface AuditLogItem {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  description: string;
  created_at: string;
}

export interface Delegation {
  id: string;
  parent_agent_id: string;
  child_agent_id: string;
  parent_agent_name?: string;
  child_agent_name?: string;
  delegation_depth: number;
  task_description: string | null;
  delegated_budget_limit: number;
  allowed_categories: string[];
  is_active: boolean;
  revocation_reason?: string;
  revoked_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface DelegationCreate {
  parent_agent_id: string;
  child_agent_id: string;
  task_description: string;
  delegated_budget_limit: number;
  allowed_categories?: string[];
  expires_in_hours?: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface RiskEvaluationRequest {
  agent_id: string;
  amount: number;
  merchant: string;
  velocity_tx_count_last_hour?: number;
}

export interface RiskEvaluationResult {
  overall_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggered_rules: string[];
  explanation: string;
}
