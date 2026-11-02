import uuid
import pytest
from app.models.user import User
from app.models.agent import Agent
from app.models.intent import UserIntent
from app.services.intent_engine import IntentConsistencyEngine


def test_intent_consistency_detects_gaming_laptop_violation(db_session):
    # Setup user and agent
    user = User(id=str(uuid.uuid4()), email="student@university.edu", hashed_password="pw")
    db_session.add(user)
    agent = Agent(id=str(uuid.uuid4()), owner_id=user.id, name="LaptopShopper")
    db_session.add(agent)
    db_session.commit()

    # User's master prompt: "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops."
    intent_data = IntentConsistencyEngine.extract_intent_structure(
        "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops."
    )
    intent = UserIntent(
        id=str(uuid.uuid4()),
        user_id=user.id,
        raw_prompt="I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops.",
        positive_constraints=intent_data["positive_constraints"],
        negative_constraints=intent_data["negative_constraints"],
    )
    db_session.add(intent)
    db_session.commit()

    # Scenario 1: Agent tries to buy a discounted Gaming Laptop (violates intent)
    eval_gaming = IntentConsistencyEngine.evaluate_intent_consistency(
        db=db_session,
        intent_id=intent.id,
        agent_id=agent.id,
        proposed_item_name="Asus ROG Zephyrus Gaming Laptop RTX 4070",
        proposed_merchant="BestBuy",
        proposed_price=899.0,
        proposed_item_specs={"gpu": "RTX 4070", "category": "Gaming"}
    )

    assert eval_gaming.is_consistent is False
    assert eval_gaming.decision == "HARD_CONFLICT"
    assert any("negative constraint" in c for c in eval_gaming.conflicting_requirements)

    # Scenario 2: Agent selects lightweight ultrabook (matches intent)
    eval_ultrabook = IntentConsistencyEngine.evaluate_intent_consistency(
        db=db_session,
        intent_id=intent.id,
        agent_id=agent.id,
        proposed_item_name="Apple MacBook Air 13 M3 16GB",
        proposed_merchant="Apple",
        proposed_price=949.0,
        proposed_item_specs={"battery_hours": 18, "weight": "2.7 lbs"}
    )

    assert eval_ultrabook.is_consistent is True
    assert eval_ultrabook.decision == "MATCH"
    assert len(eval_ultrabook.conflicting_requirements) == 0
