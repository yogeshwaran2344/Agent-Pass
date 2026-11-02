# 🏛️ AGENTPASS — Architecture & System Design

## 1. System Topology Overview

AGENTPASS is an intent-governed, non-custodial financial execution rail designed specifically for autonomous AI agents. It operates between the reasoning loops of AI frameworks (e.g., CrewAI, AutoGen, LangChain) and enterprise payment gateways (specifically PayPal Sandbox).

```mermaid
graph TB
    subgraph ClientLayer ["Client & Interface Layer"]
        UI["React 18 + Vite SPA Dashboard"]
        AgentSDK["Autonomous Agent (CrewAI / AutoGen / LangChain)"]
        PayPalWebhooks["PayPal Sandbox Event Webhooks"]
    end

    subgraph SecurityBoundary ["AGENTPASS Security Perimeter"]
        AuthMiddleware["JWT & X-Agent-Key Gateway + Rate Limiter"]
        
        subgraph IntentLayer ["1. Semantic Intent Intelligence"]
            NLPParser["Constraint & Budget Extractor"]
            SemanticComparator["Intent Consistency Evaluator"]
            DriftClassifier["Drift / Hard Conflict Classifier"]
        end

        subgraph PolicyLayer ["2. Microsecond Deterministic Policy"]
            TxLimitCheck["Per-Transaction Limit Gate"]
            VelocityCheck["Daily / Monthly Velocity Gate"]
            MerchantFirewall["Allowlist / Blocklist Firewall"]
            CategoryFirewall["Prohibited Category Interceptor"]
        end

        subgraph ExecutionLayer ["3. Financial Execution & Ledger"]
            TwoPhaseLock["2-Phase Commitment Lock (TTL)"]
            ApprovalEngine["Context-Aware Human-in-the-Loop"]
            KillSwitch["Multi-Scope Emergency Kill Switch"]
            PayPalBridge["PayPal Sandbox REST API Client"]
        end

        subgraph PersistenceLayer ["4. Persistence & Audit Trail"]
            DB[(PostgreSQL 16 / SQLite Engine)]
            AuditLogChain[(Immutable Cryptographic Audit Trail)]
        end
    end

    UI -->|JWT Auth| AuthMiddleware
    AgentSDK -->|X-Agent-Key: agp_live_...| AuthMiddleware
    PayPalWebhooks -->|Webhook Signature & ID| AuthMiddleware

    AuthMiddleware --> PolicyLayer
    PolicyLayer --> IntentLayer
    IntentLayer --> ExecutionLayer
    ExecutionLayer --> PersistenceLayer
    ExecutionLayer -->|REST OAuth2 & Orders| PayPalSandbox["PayPal Sandbox Rails"]
```

---

## 2. Core Execution Lifecycles

### A. Autonomous Transaction Evaluation Flow
```mermaid
sequenceDiagram
    autonumber
    actor Agent as Autonomous AI Agent
    participant GW as AGENTPASS Gateway
    participant PE as Policy Engine (Deterministic)
    participant IE as Intent Engine (Semantic)
    participant CE as Commitment Engine
    participant Human as Master User (HITL)
    participant PP as PayPal Sandbox

    Agent->>GW: POST /transactions (amount, merchant, intent_id)
    GW->>PE: Evaluate deterministic spending & category limits
    alt Policy Limit Exceeded or Merchant Blocked
        PE-->>Agent: 403 Forbidden (Deterministic Rejection)
    else Policy Satisfied
        PE->>IE: Compare proposed item against Master User Intent
        alt Hard Conflict Detected (e.g. Gaming laptop for college)
            IE->>Human: Escalate to Context-Aware Approval Queue
            Human->>GW: POST /approvals/{id}/action (Reject or Modify)
            alt User Rejects
                GW-->>Agent: Transaction Cancelled by User
            else User Approves
                GW->>CE: Reserve Budget Allocation (Phase 1)
            end
        else Strict Semantic Match
            IE->>CE: Reserve Budget Allocation (Phase 1)
        end

        CE->>PP: Create PayPal Order (intent: CAPTURE)
        PP-->>GW: Order Created (PAYPAL-ORDER-ID)
        GW->>PP: Capture PayPal Order (Phase 2)
        PP-->>GW: Settlement Confirmed (Capture ID)
        GW->>CE: Settle Commitment & Record Transaction
        GW-->>Agent: 201 Created (Transaction Settled)
    end
```

---

## 3. Two-Phase Financial Commitments

When multiple autonomous agents operate concurrently under a shared corporate budget, race conditions can cause overspending:
1. **Phase 1: Reserve**: AGENTPASS issues a temporary cryptographic lock against the agent's spending pool with a strict 30-minute Time-To-Live (TTL).
2. **Phase 2: Commit & Settle**: Once the physical order is confirmed on payment rails, the commitment transitions to `settled`. If an order fails or times out, the lock is automatically `released`.

---

## 4. Multi-Agent Delegation Chains

AGENTPASS supports hierarchical agent structures (Root Agent $\rightarrow$ Sub-agent $\rightarrow$ Worker):
- **Invariance Rule**: An agent cannot delegate authority exceeding its own daily limit ($L_{\text{child}} \le L_{\text{parent}}$).
- **Inherited Negative Constraints**: All prohibited categories and merchants are transitively inherited down the delegation graph.
- **Cycle Prevention**: Circular loops ($A \rightarrow B \rightarrow C \rightarrow A$) are rejected with a cycle detection graph check before persistence.
