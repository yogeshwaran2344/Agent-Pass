from app.models.user import User


def test_module_1_complete_auth_and_user_management(client, db_session):
    # 1. Registration
    reg_payload = {
        "email": "agent.director@enterprise.ai",
        "password": "SecurePassword123!",
        "full_name": "Agent Director",
        "role": "agent_operator",
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201, res.text
    user_data = res.json()
    assert user_data["email"] == "agent.director@enterprise.ai"
    assert user_data["role"] == "agent_operator"
    assert user_data["is_active"] is True
    assert user_data["is_verified"] is False

    # 2. Duplicate registration rejection
    res_dup = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_dup.status_code == 400

    # 3. Email verification flow
    created_user = (
        db_session.query(User).filter(User.email == "agent.director@enterprise.ai").first()
    )
    assert created_user.verification_token is not None
    verif_token = created_user.verification_token

    res_verify = client.post("/api/v1/auth/verify-email", json={"token": verif_token})
    assert res_verify.status_code == 200
    assert res_verify.json()["message"] == "Email verified successfully."

    # 4. Login with valid credentials
    login_payload = {
        "email": "agent.director@enterprise.ai",
        "password": "SecurePassword123!",
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    tokens = res_login.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 5. Invalid password login rejection
    res_bad_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "agent.director@enterprise.ai",
            "password": "WrongPassword999!",
        },
    )
    assert res_bad_login.status_code == 401

    # 6. Authenticated Profile Retrieval (/users/me)
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    res_me = client.get("/api/v1/users/me", headers=auth_headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "agent.director@enterprise.ai"
    assert res_me.json()["is_verified"] is True

    # 7. Profile Update (/users/me)
    res_update = client.patch(
        "/api/v1/users/me", headers=auth_headers, json={"full_name": "Senior Agent Director"}
    )
    assert res_update.status_code == 200
    assert res_update.json()["full_name"] == "Senior Agent Director"

    # 8. Password Change
    res_change_pw = client.post(
        "/api/v1/users/me/change-password",
        headers=auth_headers,
        json={"current_password": "SecurePassword123!", "new_password": "NewSecretPass456!"},
    )
    assert res_change_pw.status_code == 200

    # 9. Token Refresh
    res_refresh = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert res_refresh.status_code == 200
    new_tokens = res_refresh.json()
    assert "access_token" in new_tokens
    new_access_token = new_tokens["access_token"]
    new_auth_headers = {"Authorization": f"Bearer {new_access_token}"}

    # 10. Role-Based Access Control (RBAC):
    # Non-admin user cannot access admin /users/ list
    res_admin_forbidden = client.get("/api/v1/users/", headers=new_auth_headers)
    assert res_admin_forbidden.status_code == 403

    # Upgrade user to admin in DB to test admin access
    db_user = db_session.query(User).filter(User.email == "agent.director@enterprise.ai").first()
    db_user.role = "admin"
    db_session.commit()

    # Re-login to get admin token
    res_admin_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "agent.director@enterprise.ai",
            "password": "NewSecretPass456!",
        },
    )
    admin_token = res_admin_login.json()["access_token"]
    res_admin_ok = client.get("/api/v1/users/", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_ok.status_code == 200
    assert len(res_admin_ok.json()) >= 1

    # 11. Password Reset Flow (Forgot password + Reset)
    res_forgot = client.post(
        "/api/v1/auth/forgot-password", json={"email": "agent.director@enterprise.ai"}
    )
    assert res_forgot.status_code == 200
    db_session.refresh(db_user)
    reset_token = db_user.reset_password_token
    assert reset_token is not None

    res_reset_confirm = client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": "BrandNewPassword789!"},
    )
    assert res_reset_confirm.status_code == 200

    # Verify login with reset password
    res_login_reset = client.post(
        "/api/v1/auth/login",
        json={
            "email": "agent.director@enterprise.ai",
            "password": "BrandNewPassword789!",
        },
    )
    assert res_login_reset.status_code == 200
    post_reset_token = res_login_reset.json()["access_token"]

    # 12. Secure Logout & Token Revocation
    res_logout = client.post(
        "/api/v1/auth/logout", headers={"Authorization": f"Bearer {post_reset_token}"}
    )
    assert res_logout.status_code == 200

    # Verify revoked token is immediately rejected
    res_revoked_try = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {post_reset_token}"}
    )
    assert res_revoked_try.status_code == 401
    assert "revoked" in res_revoked_try.json()["detail"].lower()

    # 13. Account Deactivation
    # Login again, deactivate account, and test that deactivated user cannot login
    res_login_deact = client.post(
        "/api/v1/auth/login",
        json={
            "email": "agent.director@enterprise.ai",
            "password": "BrandNewPassword789!",
        },
    )
    active_token = res_login_deact.json()["access_token"]
    res_deactivate = client.delete(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {active_token}"}
    )
    assert res_deactivate.status_code == 200

    # Login should now fail with 403 Forbidden
    res_login_after_deact = client.post(
        "/api/v1/auth/login",
        json={
            "email": "agent.director@enterprise.ai",
            "password": "BrandNewPassword789!",
        },
    )
    assert res_login_after_deact.status_code == 403
    assert "deactivated" in res_login_after_deact.json()["detail"].lower()
