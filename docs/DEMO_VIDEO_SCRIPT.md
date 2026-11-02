# 🎥 AGENTPASS — 3-Minute Hackathon Demo Script

> **Target Duration**: 2 minutes 50 seconds  
> **Speaker**: Clear, confident, technical presentation

---

### [0:00 – 0:30] The Hook: Why Existing Agent Payments Fail
- **Visual**: Open on `LandingPage.tsx` showing the AGENTPASS hero banner: *"Intent-Based Financial Governance for Autonomous AI Agents"*.
- **Voiceover**: 
  > *"Autonomous AI agents are beginning to transact on the real web. But today's payment rails only ask one simple question: 'Is this purchase under the dollar limit?'"*
  > *"Imagine telling your AI agent: 'Buy a lightweight laptop for college coursework with great battery life. Do NOT buy gaming laptops.' The agent finds a discounted RTX 4090 gaming laptop for $999. Under a normal credit card or API limit, the payment goes through. But it directly violates your intent. That's why we built AGENTPASS."*

---

### [0:30 – 1:15] Onboarding & The Intent Intelligence Engine
- **Visual**: 
  1. Click **Log In** $\rightarrow$ Navigate to `DashboardPage.tsx`. Show live KPIs, spending velocity chart, and active PayPal Sandbox badge.
  2. Click **AI Agent Registry** (`AgentsPage.tsx`) $\rightarrow$ Click **Register New Agent**. Show modal generating a secure one-time `agp_live_...` key.
  3. Navigate to **Intent Intelligence** (`IntentIntelligencePage.tsx`).
  4. Enter the prompt: *"Buy a laptop for college coursework. Prioritize lightweight design and battery life. Don't buy gaming laptops."* Set budget to `$1,000.00`. Click **Store Master Intent**. Show positive and negative constraints parsed.
- **Voiceover**:
  > *"In AGENTPASS, operators register their autonomous workers and define Master Intents in plain English. Our Intent Engine extracts positive requirements, negative constraints, and budget ceilings."*

---

### [1:15 – 2:00] The Simulation: Semantic Conflict Detection & Human-in-the-Loop
- **Visual**:
  1. On the same screen, run a test purchase simulation:
     - Item: *"ASUS ROG Strix RTX 4080 Gaming Laptop"*
     - Price: `$899.00`
     - Merchant: *"BestBuy"*
  2. Click **Run Intent Consistency Evaluation**.
  3. The UI flashes a red warning: **HARD CONFLICT DETECTED** (Score: 10%). Explanation: *"Violates negative constraint: 'gaming laptops'"*.
  4. Navigate to **Approval Queue** (`ApprovalCenterPage.tsx`).
  5. Show the pending approval card detailing the exact semantic divergence.
  6. Click **Approve with Override** or **Reject**. Show real-time state change.
- **Voiceover**:
  > *"When the agent proposes this $899 gaming laptop, AGENTPASS doesn't just check the $1,000 budget. It evaluates semantic consistency. Because it detects a hard negative constraint conflict, the transaction is intercepted immediately and routed to our Context-Aware Human Approval Queue."*

---

### [2:00 – 2:30] Delegation Hierarchy & Emergency Kill Switch
- **Visual**:
  1. Navigate to **Delegation Chain** (`DelegationPage.tsx`). Show the interactive visual hierarchy (`Root Authority -> Parent Agent -> Sub-agent`).
  2. Click **Delegate Authority**. Explain the budget invariance: sub-agents cannot exceed parent daily limits.
  3. Navigate to **Security Center** (`SecurityCenterPage.tsx`).
  4. Click **Trigger Emergency Kill Switch** $\rightarrow$ Select scope `agent` or `delegation_tree` $\rightarrow$ Enter reason $\rightarrow$ Confirm.
  5. The navbar and dashboard immediately indicate the agent has been revoked, and all payment endpoints reject further actions.
- **Voiceover**:
  > *"For complex workflows, AGENTPASS enforces delegation invariance: child sub-agents can never exceed their parent agent's spending ceilings. And if an anomaly is detected, our Multi-Scope Kill Switch can freeze an individual agent, a sub-tree, or the entire fleet in under 5 milliseconds."*

---

### [2:30 – 2:50] PayPal Sandbox Webhooks & Conclusion
- **Visual**:
  1. Navigate to **Transactions** (`TransactionsPage.tsx`). Show settled PayPal sandbox order IDs and capture statuses.
  2. Navigate to **Audit Trail** (`AuditLogsPage.tsx`). Show the cryptographic chained audit logs.
- **Voiceover**:
  > *"Once cleared, payments execute securely over PayPal Sandbox rails with full idempotency deduplication and an immutable audit trail. AGENTPASS bridges the gap between autonomous AI agency and financial trust. Built with FastAPI, PostgreSQL, and React. Thank you."*
