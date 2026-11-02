# 🤖 AI & PayPal Integration Disclosures

## 1. AI Disclosure

### A. How AI is Used in AGENTPASS
AGENTPASS uses Large Language Models strictly for **semantic interpretation and natural-language constraint extraction**, NOT for direct financial execution. 

```
┌────────────────────────────────────────────────────────┐
│                   AI HEURISTIC LAYER                   │
│  - Understands human intent ("prioritize battery life")│
│  - Extracts negative constraints ("no gaming laptops") │
│  - Flags semantic drift between proposal and prompt    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│              DETERMINISTIC BACKEND ENGINE              │
│  - Enforces per-transaction, daily, and monthly limits │
│  - Enforces merchant allowlists and blocklists         │
│  - Locks 2-phase commitments                           │
│  - Authorizes or halts PayPal payments                 │
└────────────────────────────────────────────────────────┘
```

> **Core Architectural Rule**: AI provides semantic comprehension and explanations. **Deterministic backend rules authorize or block payments.** An AI model can never approve a purchase that violates deterministic policy boundaries.

### B. Models and Providers
- **Primary LLM**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) via REST API / OpenAI API compatible interface.
- **Deterministic Fallback Engine**: If the LLM provider experiences downtime or network latency, AGENTPASS gracefully degrades to deterministic regex constraint extraction and exact keyword pattern matching. Zero disruption to financial gates.
- **Prompt Injection Defense**: Evaluator prompts separate user input from system reasoning using XML delimiters and strictly prioritize hardcoded negative keyword sets over LLM completion text.

---

## 2. PayPal Sandbox Integration Disclosure

### A. Sandbox Environment Configuration
- **API Base URL**: `https://api-m.sandbox.paypal.com`
- **Supported Payment Rails**: PayPal REST Orders v2 API (`/v2/checkout/orders`).
- **Mode of Operation**: Sandbox test credentials with simulated buyers and business accounts.

### B. Payment Flow
1. **Order Creation (`intent: CAPTURE`)**: Triggered only after both the deterministic policy check and the semantic intent consistency evaluation pass.
2. **Order Capture**: Captured via `POST /v2/checkout/orders/{id}/capture` upon user confirmation or autonomous policy clearance.
3. **Webhook Verification & Idempotency**:
   - Webhook endpoint: `POST /api/v1/paypal/webhook`.
   - Incoming webhook events (`PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`) are validated against `provider_event_id`.
   - Duplicate transmissions are recognized and acknowledged without triggering duplicate settlements.
4. **Credential Isolation**: Client secrets and OAuth2 access tokens are stored in environment variables on the backend container and are never exposed or transmitted to the client frontend.
