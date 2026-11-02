# 📡 AGENTPASS — REST API Reference

Base URL: `http://localhost:8000/api/v1` or `https://<render-url>/api/v1`

---

## 1. Authentication (`/auth`)

### Register User
`POST /auth/register`
```json
// Request
{
  "email": "cfo@enterprise.ai",
  "password": "SecurePassword123!",
  "full_name": "Chief Financial Operator",
  "role": "admin"
}
// Response (201 Created)
{
  "id": "usr_7f8c9b2e...",
  "email": "cfo@enterprise.ai",
  "full_name": "Chief Financial Operator",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-11-02T20:00:00Z"
}
```

### Login & Issue JWT
`POST /auth/login`
```json
// Request
{
  "email": "cfo@enterprise.ai",
  "password": "SecurePassword123!"
}
// Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer",
  "user": { ... }
}
```

---

## 2. Agent Registry (`/agents`)
*Requires `Authorization: Bearer <token>`*

### Onboard Autonomous AI Agent
`POST /agents/`
```json
// Request
{
  "name": "ProcurementWorker-Alpha",
  "agent_type": "autonomous_buyer",
  "framework": "crewai",
  "model_name": "gemini-2.0-flash",
  "capabilities": [
    { "capability_name": "checkout", "scope": "hardware" }
  ]
}
// Response (201 Created)
{
  "agent": {
    "id": "ag_1e2d3c4b...",
    "name": "ProcurementWorker-Alpha",
    "status": "active",
    "created_at": "2026-11-02T20:05:00Z"
  },
  "api_key": "agp_live_8f7e6d5c4b3a21..." // Displayed ONCE to operator
}
```

---

## 3. Policy & Permissions (`/permissions`)

### Configure Deterministic Spending Limits
`POST /permissions/`
```json
// Request
{
  "agent_id": "ag_1e2d3c4b...",
  "max_amount_per_tx": 250.00,
  "daily_spend_limit": 1000.00,
  "monthly_spend_limit": 5000.00,
  "require_human_approval_above": 100.00,
  "allowed_merchants": ["bestbuy.com", "apple.com", "github.com"],
  "disallowed_merchants": ["unverified-store.xyz"],
  "disallowed_categories": ["Gaming Hardware", "Crypto", "Gambling"]
}
```

---

## 4. Intent Intelligence (`/intents`)

### Register Master Prompt & Extract Constraints
`POST /intents/`
```json
// Request
{
  "raw_prompt": "Buy a laptop for college coursework. Prioritize lightweight design and battery life. Don't buy gaming laptops.",
  "max_acceptable_budget": 1000.00
}
// Response (201 Created)
{
  "id": "int_99a8b7c6...",
  "primary_goal": "Buy a laptop for college coursework",
  "positive_constraints": ["lightweight design", "battery life"],
  "negative_constraints": ["gaming laptops"],
  "max_acceptable_budget": 1000.00,
  "is_active": true
}
```

### Evaluate Intent Consistency
`POST /intents/{intent_id}/evaluate`
```json
// Request
{
  "agent_id": "ag_1e2d3c4b...",
  "proposed_item_name": "ASUS ROG RTX 4080 Gaming Laptop",
  "proposed_merchant": "BestBuy",
  "proposed_price": 949.00
}
// Response (200 OK)
{
  "evaluation_id": "eval_4a5b6c...",
  "consistency_score": 0.1,
  "is_consistent": false,
  "decision": "HARD_CONFLICT",
  "conflicting_requirements": [
    "Proposed item violates negative constraint: 'gaming laptops'"
  ],
  "reasoning": "The item violates user instruction 'Don't buy gaming laptops'."
}
```

---

## 5. Transactions & Execution (`/transactions`)

### Create & Authorize Transaction
`POST /transactions/`
```json
// Request (Headers: X-Agent-Key: agp_live_...)
{
  "agent_id": "ag_1e2d3c4b...",
  "amount": 89.99,
  "currency": "USD",
  "merchant": "bestbuy.com",
  "payment_method": "paypal_sandbox",
  "idempotency_key": "IDEMP-TX-9988-ABC"
}
```

---

## 6. PayPal Sandbox Rails (`/paypal`)

### Create PayPal Order
`POST /paypal/create-order`
```json
// Request
{
  "transaction_id": "tx_3b4c5d6e..."
}
// Response (200 OK)
{
  "paypal_order_id": "PAYPAL-ORDER-12345ABC",
  "status": "CREATED"
}
```

### Handle PayPal Webhook (Idempotent)
`POST /paypal/webhook`
```json
// Request
{
  "id": "WH-EVENT-ID-998877",
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "custom_id": "tx_3b4c5d6e...",
    "id": "CAPTURE-887766",
    "amount": { "value": "89.99", "currency_code": "USD" }
  }
}
// Response (200 OK)
{
  "status": "PROCESSED",
  "event_id": "WH-EVENT-ID-998877",
  "event_type": "PAYMENT.CAPTURE.COMPLETED"
}
```

---

## 7. Emergency Kill Switch (`/emergency`)

### Terminate Financial Authority
`POST /emergency/kill-switch`
```json
// Request
{
  "scope": "agent", // "global" | "delegation_tree" | "agent"
  "agent_id": "ag_1e2d3c4b...",
  "reason": "Anomalous velocity detected during nocturnal audit"
}
// Response (200 OK)
{
  "status": "TRIGGERED",
  "scope": "agent",
  "terminated_agents_count": 1,
  "terminated_agent_ids": ["ag_1e2d3c4b..."]
}
```
