import pyotp
import qrcode
from io import BytesIO
import base64
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/auth/2fa", tags=["2fa"])


@router.post("/enable")
async def enable_2fa(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA уже включена")
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    await db.commit()
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, issuer_name="TaxBel"
    )
    img = qrcode.make(otp_uri)
    buf = BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "manual_key": secret,
    }


@router.post("/verify")
async def verify_2fa(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Сначала запросите включение 2FA")
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Неверный код")
    current_user.is_2fa_enabled = True
    await db.commit()
    return {"detail": "2FA успешно включена"}


@router.post("/disable")
async def disable_2fa(
    code: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA не включена")
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Неверный код")
    current_user.totp_secret = None
    current_user.is_2fa_enabled = False
    await db.commit()
    return {"detail": "2FA отключена"}
