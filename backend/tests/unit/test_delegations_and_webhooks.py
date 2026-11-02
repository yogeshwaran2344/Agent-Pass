from app.models.agent import Agent
from app.models.permission import AgentPermission
from app.models.transaction import PaymentEvent, Transaction
from app.models.user import User


def test_delegation_cycle_and_invariance(client, db_session):
    # Setup test user and agents
    user = User(
        id="del-test-user-1",
        email="delegator@example.com",
        hashed_password="hash",
        full_name="Delegator Admin",
    )
    db_session.add(user)
    db_session.commit()

    # Agent A (Parent)
    agent_a = Agent(
        id="agent-parent-a",
        owner_id=user.id,
        name="ProcurementBot-A",
        agent_type="autonomous_procurement",
        status="active",
    )
    # Agent B (Child)
    agent_b = Agent(
        id="agent-child-b",
        owner_id=user.id,
        name="ProcurementBot-B",
        agent_type="procurement_child",
        status="active",
    )
    db_session.add_all([agent_a, agent_b])
    db_session.commit()

    # Parent permission: daily limit $500
    perm = AgentPermission(
        id="perm-agent-a",
        agent_id=agent_a.id,
        daily_spend_limit=500.0,
        max_amount_per_tx=200.0,
        is_active=True,
    )
    db_session.add(perm)
    db_session.commit()

    # 1. Test Self-Delegation Prevention
    res = client.post(
        "/api/v1/delegations/",
        json={
            "parent_agent_id": agent_a.id,
            "child_agent_id": agent_a.id,
            "task_description": "Self delegation",
            "delegated_budget_limit": 50.0,
        },
    )
    assert res.status_code == 400
    assert "Self-delegation prohibited" in res.json()["detail"]

    # 2. Test Invariance: Delegating budget higher than parent limit ($500)
    res = client.post(
        "/api/v1/delegations/",
        json={
            "parent_agent_id": agent_a.id,
            "child_agent_id": agent_b.id,
            "task_description": "Exceeding budget delegation",
            "delegated_budget_limit": 1000.0,
        },
    )
    assert res.status_code == 400
    assert "exceeding parent's limit" in res.json()["detail"]

    # 3. Successful Delegation
    res = client.post(
        "/api/v1/delegations/",
        json={
            "parent_agent_id": agent_a.id,
            "child_agent_id": agent_b.id,
            "task_description": "Component price searching",
            "delegated_budget_limit": 150.0,
            "allowed_categories": ["Electronics"],
        },
    )
    assert res.status_code == 201
    delegation_data = res.json()
    assert delegation_data["parent_agent_id"] == agent_a.id
    assert delegation_data["child_agent_id"] == agent_b.id
    assert delegation_data["delegation_depth"] == 1
    assert delegation_data["is_active"] is True
    delegation_id = delegation_data["id"]

    # 4. Test Circular Delegation: B delegating back to A
    res = client.post(
        "/api/v1/delegations/",
        json={
            "parent_agent_id": agent_b.id,
            "child_agent_id": agent_a.id,
            "task_description": "Circular loop",
            "delegated_budget_limit": 50.0,
        },
    )
    assert res.status_code == 400
    assert "Circular delegation detected" in res.json()["detail"]

    # 5. Test Revocation
    res = client.delete(f"/api/v1/delegations/{delegation_id}")
    assert res.status_code == 200
    assert res.json()["is_active"] is False


def test_paypal_webhook_idempotency_and_settlement(client, db_session):
    # Setup test agent & transaction
    user = User(
        id="webhook-test-user",
        email="wh_user@example.com",
        hashed_password="wh_hash",
        full_name="Webhook User",
    )
    db_session.add(user)
    db_session.commit()

    agent = Agent(
        id="webhook-test-agent",
        owner_id=user.id,
        name="WebhookAgent",
        agent_type="webhook_tester",
        status="active",
    )
    db_session.add(agent)
    db_session.commit()

    tx = Transaction(
        id="tx-wh-test-999",
        agent_id=agent.id,
        amount=149.99,
        currency="USD",
        merchant="Apple Store",
        status="authorized",
        payment_method="paypal_sandbox",
    )
    db_session.add(tx)
    db_session.commit()

    webhook_payload = {
        "id": "WH-EVENT-ID-UNIQUE-12345",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "resource": {
            "custom_id": tx.id,
            "id": "PP-CAPTURE-999",
            "amount": {"value": "149.99", "currency_code": "USD"},
        },
    }

    # 1. First Webhook invocation
    res1 = client.post("/api/v1/paypal/webhook", json=webhook_payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] == "PROCESSED"
    assert data1["event_type"] == "PAYMENT.CAPTURE.COMPLETED"

    # Verify transaction status was updated to completed
    db_session.refresh(tx)
    assert tx.status == "completed"
    assert tx.completed_at is not None

    # 2. Duplicate Webhook invocation (Idempotency test)
    res2 = client.post("/api/v1/paypal/webhook", json=webhook_payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "ALREADY_PROCESSED"

    # Ensure duplicate payment event was NOT created
    events = (
        db_session.query(PaymentEvent)
        .filter(PaymentEvent.provider_event_id == "WH-EVENT-ID-UNIQUE-12345")
        .all()
    )
    assert len(events) == 1
