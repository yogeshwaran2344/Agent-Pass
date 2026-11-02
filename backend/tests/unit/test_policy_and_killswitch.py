import uuid

from app.models.agent import Agent
from app.models.permission import AgentPermission
from app.models.user import User
from app.services.emergency_engine import EmergencyKillSwitch
from app.services.policy_engine import PolicyEngine


def test_deterministic_policy_and_kill_switch(db_session):
    user = User(id=str(uuid.uuid4()), email="test@agentpass.local", hashed_password="pw")
    db_session.add(user)
    agent = Agent(id=str(uuid.uuid4()), owner_id=user.id, name="TestBuyer", status="active")
    db_session.add(agent)
    db_session.commit()

    # Create policy: Max $100 per tx, daily limit $300, blocked merchant "SuspiciousMerchant"
    policy = AgentPermission(
        id=str(uuid.uuid4()),
        agent_id=agent.id,
        max_amount_per_tx=100.0,
        daily_spend_limit=300.0,
        require_human_approval_above=50.0,
        disallowed_merchants=["SuspiciousMerchant"],
        is_active=True,
    )
    db_session.add(policy)
    db_session.commit()

    # 1. Test allowed amount below approval threshold ($30)
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db_session, agent_id=agent.id, amount=30.0, merchant="Amazon"
    )
    assert is_auth is True
    assert req_appr is False

    # 2. Test amount requiring human approval ($75)
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db_session, agent_id=agent.id, amount=75.0, merchant="Amazon"
    )
    assert is_auth is True
    assert req_appr is True

    # 3. Test amount exceeding max per transaction ($150)
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db_session, agent_id=agent.id, amount=150.0, merchant="Amazon"
    )
    assert is_auth is False
    assert any("per-transaction limit" in v for v in violations)

    # 4. Test blocked merchant
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db_session, agent_id=agent.id, amount=20.0, merchant="SuspiciousMerchant"
    )
    assert is_auth is False
    assert any("blocked" in v for v in violations)

    # 5. Trigger Emergency Kill Switch
    EmergencyKillSwitch.kill_agent(
        db=db_session, agent_id=agent.id, reason="Rogue behavior detected"
    )

    # 6. Verify subsequent requests are instantly blocked by kill switch
    is_auth, req_appr, reason, violations = PolicyEngine.evaluate_transaction(
        db=db_session, agent_id=agent.id, amount=10.0, merchant="Amazon"
    )
    assert is_auth is False
    assert any("Kill Switch" in reason or "KILL_SWITCH" in v for v in violations)
