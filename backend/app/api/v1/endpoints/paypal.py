from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.transaction import PayPalOrderCapture, PayPalOrderCreate
from app.services.paypal_service import PayPalSandboxService

router = APIRouter(prefix="/paypal", tags=["PayPal Sandbox Gateway"])


@router.post("/create-order")
async def create_paypal_order(req: PayPalOrderCreate, db: Session = Depends(get_db)):
    try:
        res = await PayPalSandboxService.create_order(
            db=db,
            transaction_id=req.transaction_id,
            return_url=req.return_url,
            cancel_url=req.cancel_url
        )
        return res
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal API error: {str(e)}")


@router.post("/capture-order")
async def capture_paypal_order(req: PayPalOrderCapture, db: Session = Depends(get_db)):
    try:
        res = await PayPalSandboxService.capture_order(
            db=db,
            paypal_order_id=req.paypal_order_id
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Capture error: {str(e)}")
