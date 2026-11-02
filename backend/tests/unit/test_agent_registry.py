def test_phase_2_complete_agent_registry(client, db_session):
    # 1. Register owner user & get JWT token
    reg_user = client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent.ops@company.com",
            "password": "Password1234!",
            "full_name": "Operations Lead",
            "role": "agent_operator",
        },
    )
    assert reg_user.status_code == 201
    user_id = reg_user.json()["id"]

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "agent.ops@company.com",
            "password": "Password1234!",
        },
    )
    jwt_token = login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {jwt_token}"}

    # 2. Register an autonomous AI Agent
    agent_payload = {
        "name": "ProcurementBot-Alpha",
        "description": "Autonomous purchasing agent for office hardware",
        "agent_type": "autonomous_buyer",
        "framework": "crewai",
        "model_name": "gemini-2.0-flash",
        "metadata_json": {"department": "procurement", "version": "1.2.0"},
        "capabilities": [
            {
                "capability_name": "ecommerce:search",
                "scope": "browsing",
                "description": "Search products",
            },
            {
                "capability_name": "ecommerce:purchase",
                "scope": "financial",
                "description": "Execute purchases",
            },
        ],
    }
    create_res = client.post("/api/v1/agents/", headers=user_headers, json=agent_payload)
    assert create_res.status_code == 201, create_res.text
    create_data = create_res.json()

    assert "api_key" in create_data
    agent_api_key = create_data["api_key"]
    assert agent_api_key.startswith("agp_live_")

    agent_info = create_data["agent"]
    agent_id = agent_info["id"]
    assert agent_id.startswith("ag_")
    assert agent_info["owner_id"] == user_id
    assert agent_info["status"] == "active"
    assert agent_info["framework"] == "crewai"
    assert len(agent_info["capabilities"]) == 2
    assert agent_info["reputation"]["reputation_score"] == 100.0
    assert agent_info["reputation"]["trust_tier"] == "ESTABLISHED"

    # 3. Authenticate agent via X-Agent-Key header (/agents/me)
    agent_headers = {"X-Agent-Key": agent_api_key}
    agent_me_res = client.get("/api/v1/agents/me", headers=agent_headers)
    assert agent_me_res.status_code == 200
    assert agent_me_res.json()["id"] == agent_id

    # 4. Forged/invalid API key rejection
    bad_key_res = client.get(
        "/api/v1/agents/me", headers={"X-Agent-Key": "agp_live_fake_key_1234567890"}
    )
    assert bad_key_res.status_code == 401

    # 5. List agents owned by user
    list_res = client.get("/api/v1/agents/", headers=user_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 6. Update agent metadata
    update_res = client.patch(
        f"/api/v1/agents/{agent_id}",
        headers=user_headers,
        json={"model_name": "gemini-2.5-pro", "description": "Upgraded procurement agent"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["model_name"] == "gemini-2.5-pro"

    # 7. Add extra capability
    cap_res = client.post(
        f"/api/v1/agents/{agent_id}/capabilities",
        headers=user_headers,
        json={
            "capability_name": "travel:flight_booking",
            "scope": "financial",
            "description": "Book corporate flights",
        },
    )
    assert cap_res.status_code == 200
    assert cap_res.json()["capability_name"] == "travel:flight_booking"

    # 8. Suspend the agent (e.g. for anomaly investigation)
    suspend_res = client.post(
        f"/api/v1/agents/{agent_id}/status",
        headers=user_headers,
        json={"status": "suspended", "reason": "Unusual volume of quote requests"},
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "suspended"
    assert suspend_res.json()["suspension_reason"] == "Unusual volume of quote requests"

    # 9. Verify suspended agent cannot authenticate with API key
    suspended_auth_res = client.get("/api/v1/agents/me", headers=agent_headers)
    assert suspended_auth_res.status_code == 403
    assert "suspended" in suspended_auth_res.json()["detail"].lower()

    # 10. Reactivate the agent
    reactivate_res = client.post(
        f"/api/v1/agents/{agent_id}/status",
        headers=user_headers,
        json={"status": "active", "reason": "Anomaly investigated and cleared"},
    )
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["status"] == "active"

    # Key works again
    re_auth_res = client.get("/api/v1/agents/me", headers=agent_headers)
    assert re_auth_res.status_code == 200

    # 11. Check status history log
    history_res = client.get(f"/api/v1/agents/{agent_id}/history", headers=user_headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 3  # initial active -> suspended -> reactivated

    # 12. Soft-delete / deactivate agent
    del_res = client.delete(f"/api/v1/agents/{agent_id}", headers=user_headers)
    assert del_res.status_code == 200

    # Deactivated agent key is blocked
    deact_auth_res = client.get("/api/v1/agents/me", headers=agent_headers)
    assert deact_auth_res.status_code == 403
    assert "deactivated" in deact_auth_res.json()["detail"].lower()
