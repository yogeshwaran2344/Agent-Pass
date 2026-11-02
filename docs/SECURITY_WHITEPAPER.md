# 🔒 AGENTPASS — Security Whitepaper & Threat Model

## 1. Threat Model & Mitigations

| Threat | Attack Vector | AGENTPASS Mitigation |
| :--- | :--- | :--- |
| **Semantic Drift** | Autonomous agent finds cheaper alternative that contradicts master instruction (e.g., gaming PC vs college laptop). | **Intent Consistency Engine**: Continuous semantic comparison against stored master user prompts; flags `HARD_CONFLICT` and routes to human review. |
| **Multi-Agent Race Condition** | Two agents draw concurrently on shared account balance, causing overdraft. | **Two-Phase Commitments**: Atomically locks budget allocations with 30-minute TTL prior to payment dispatch. |
| **Prompt Injection** | Vendor product page contains hidden prompt instructions telling the agent to ignore rules. | **Deterministic Hard Gates**: Product description text cannot override backend regex/keyword constraints or spending ceilings. |
| **Compromised Agent Key** | Agent credentials leaked in client-side logs. | **Scoped Kill Switch**: Operator can instantly terminate a single agent key without stopping other platform workers. |
| **Replay & Double Spending** | Duplicate webhook captures or duplicate payment requests submitted. | **Fintech Idempotency Keys**: Unique request idempotency deduplication on transactions and `provider_event_id` checking on webhooks. |
| **Data Leakage** | Operator sees other organizations' agent or balance data. | **User-to-User Tenant Isolation**: Strict SQLAlchemy query filtering by `owner_id` enforced in API dependencies. |

---

## 2. Cryptographic Security Standards

1. **User Authentication**:
   - Password Hashing: **Argon2id** (`pwdlib[argon2]`) with high-memory work factor.
   - Session Tokens: **JSON Web Tokens (JWT)** signed via HMAC-SHA256 (`HS256`) with 24-hour expiration.
2. **Autonomous Agent Authentication**:
   - High-entropy API keys formatted as `agp_live_<48_hex_chars>`.
   - Raw keys are provided to operators **only once** upon generation.
   - Stored in the database solely as a **SHA-256 cryptographic digest** (`key_hash`).
3. **Audit Trail Integrity**:
   - Every security-relevant event (`PAYMENT_CAPTURED`, `INTENT_CONFLICT`, `KILL_SWITCH_TRIGGERED`) creates an `AuditLog` entry.
   - Each audit record is chained to the previous record hash (`previous_log_hash` $\rightarrow$ `current_log_hash`), providing a tamper-evident event log.
