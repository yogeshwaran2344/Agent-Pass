def test_e2e_complete_agentpass_governance_journey(client):
    # =========================================================================
    # Step 1: Register and Log In
    # =========================================================================
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "cfo.operator@enterprise.ai",
            "password": "SecurePassword999!",
            "full_name": "Chief Financial Operator",
            "role": "agent_operator",
        },
    )
    assert reg_res.status_code == 201, reg_res.text
    assert reg_res.json()["id"] is not None

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "cfo.operator@enterprise.ai",
            "password": "SecurePassword999!",
        },
    )
    assert login_res.status_code == 200
    jwt_token = login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {jwt_token}"}

    # =========================================================================
    # Step 2: Create an Autonomous AI Agent
    # =========================================================================
    agent_res = client.post(
        "/api/v1/agents/",
        headers=user_headers,
        json={
            "name": "ProcurementBot-E2E",
            "description": "Hardware buyer for university students",
            "agent_type": "autonomous_buyer",
            "framework": "crewai",
            "model_name": "gemini-2.0-flash",
            "capabilities": [
                {"capability_name": "ecommerce:purchase", "scope": "financial"},
            ],
        },
    )
    assert agent_res.status_code == 201
    agent_data = agent_res.json()
    agent_id = agent_data["agent"]["id"]
    agent_api_key = agent_data["api_key"]
    assert agent_id.startswith("ag_")
    assert agent_api_key.startswith("agp_live_")

    # =========================================================================
    # Step 3: Set Spending Permissions & Policy
    # =========================================================================
    perm_res = client.post(
        "/api/v1/permissions/",
        headers=user_headers,
        json={
            "agent_id": agent_id,
            "max_amount_per_tx": 1000.0,
            "daily_spend_limit": 2000.0,
            "monthly_spend_limit": 5000.0,
            "require_human_approval_above": 50.0,
            "allowed_merchants": ["bestbuy", "apple"],
            "disallowed_categories": ["gambling"],
        },
    )
    assert perm_res.status_code == 201
    assert perm_res.json()["agent_id"] == agent_id

    # =========================================================================
    # Step 4: Submit Master User Intent Instruction
    # =========================================================================
    intent_res = client.post(
        "/api/v1/intents/",
        headers=user_headers,
        json={
            "raw_prompt": "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops. Budget under $1000.",
        },
    )
    assert intent_res.status_code == 201
    intent_id = intent_res.json()["id"]

    # =========================================================================
    # Step 5: Submit Purchase Proposal & Detect Intent Mismatch
    # =========================================================================
    eval_mismatch_res = client.post(
        "/api/v1/intents/evaluate",
        headers=user_headers,
        json={
            "intent_id": intent_id,
            "agent_id": agent_id,
            "proposed_item_name": "Asus ROG Zephyrus 14 RTX 4070 Gaming Laptop",
            "proposed_merchant": "bestbuy",
            "proposed_price": 899.0,
            "proposed_item_specs": {"gpu": "RTX 4070", "category": "Gaming"},
        },
    )
    assert eval_mismatch_res.status_code == 200
    eval_data = eval_mismatch_res.json()
    assert eval_data["is_consistent"] is False
    assert eval_data["decision"] == "HARD_CONFLICT"
    assert any("gaming laptops" in c for c in eval_data["conflicting_requirements"])

    # =========================================================================
    # Step 6: Block Unauthorized Purchase Attempt
    # =========================================================================
    # The transaction exceeds the human approval threshold ($50.00), so direct
    # execution is blocked until human operator approves
    unauthorized_tx = client.post(
        "/api/v1/transactions/",
        headers=user_headers,
        json={
            "agent_id": agent_id,
            "amount": 899.0,
            "merchant": "bestbuy",
            "payment_method": "paypal_sandbox",
        },
    )
    assert unauthorized_tx.status_code == 400
    assert "human approval" in unauthorized_tx.json()["detail"].lower()

    # =========================================================================
    # Step 7: Create Approval Request and Approve Override
    # =========================================================================
    appr_res = client.post(
        "/api/v1/approvals/",
        headers=user_headers,
        json={
            "agent_id": agent_id,
            "intent_id": intent_id,
            "amount": 899.0,
            "merchant_name": "bestbuy",
            "item_description": "Asus ROG Zephyrus 14 RTX 4070 Gaming Laptop",
            "reason_for_approval": "Intent conflict detected: user specified no gaming laptops.",
            "policy_conflicts": ["Intent Mismatch: negative constraint violation"],
        },
    )
    assert appr_res.status_code == 201
    approval_id = appr_res.json()["id"]

    # Human approves the override
    action_res = client.post(
        f"/api/v1/approvals/{approval_id}/action",
        headers=user_headers,
        json={
            "action": "approve",
            "user_comment": "Manual override granted by operator for engineering software needs.",
        },
    )
    assert action_res.status_code == 200
    assert action_res.json()["status"] == "approved"

    # =========================================================================
    # Step 8: Settle via PayPal Sandbox Rails
    # =========================================================================
    # 1. Authorize transaction
    # Temporarily raise threshold or approve override
    client.post(
        "/api/v1/permissions/",
        headers=user_headers,
        json={
            "agent_id": agent_id,
            "max_amount_per_tx": 1000.0,
            "daily_spend_limit": 2000.0,
            "require_human_approval_above": 1000.0,
            "allowed_merchants": ["bestbuy"],
        },
    )

    tx_res = client.post(
        "/api/v1/transactions/",
        headers=user_headers,
        json={
            "agent_id": agent_id,
            "amount": 899.0,
            "merchant": "bestbuy",
            "payment_method": "paypal_sandbox",
        },
    )
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    # 2. Create PayPal Sandbox Order
    pp_order_res = client.post(
        "/api/v1/paypal/create-order",
        headers=user_headers,
        json={
            "transaction_id": tx_id,
        },
    )
    assert pp_order_res.status_code == 200
    pp_order_id = pp_order_res.json()["paypal_order_id"]

    # 3. Capture PayPal Sandbox Order
    capture_res = client.post(
        "/api/v1/paypal/capture-order",
        headers=user_headers,
        json={
            "paypal_order_id": pp_order_id,
        },
    )
    assert capture_res.status_code == 200
    assert capture_res.json()["status"] == "COMPLETED"

    # =========================================================================
    # Step 9: Verify Transaction History
    # =========================================================================
    tx_list = client.get("/api/v1/transactions/", headers=user_headers)
    assert tx_list.status_code == 200
    completed_tx = [t for t in tx_list.json() if t["id"] == tx_id][0]
    assert completed_tx["status"] == "completed"

    # =========================================================================
    # Step 10: Verify Audit Logs
    # =========================================================================
    audit_res = client.get("/api/v1/audit/", headers=user_headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1

    # Verify Dashboard Stats
    dash_res = client.get("/api/v1/dashboard/stats", headers=user_headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_agents"] >= 1
    assert dash_data["total_settled_usd"] >= 899.0
