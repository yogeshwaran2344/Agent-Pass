from fastapi import APIRouter

from app.api.v1.endpoints import (
    agents,
    approvals,
    audit,
    auth,
    commitments,
    delegations,
    emergency,
    intents,
    notifications,
    paypal,
    permissions,
    risk,
    transactions,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(agents.router)
api_router.include_router(permissions.router)
api_router.include_router(intents.router)
api_router.include_router(delegations.router)
api_router.include_router(approvals.router)
api_router.include_router(commitments.router)
api_router.include_router(transactions.router)
api_router.include_router(paypal.router)
api_router.include_router(emergency.router)
api_router.include_router(audit.router)
api_router.include_router(risk.router)
api_router.include_router(notifications.router)
