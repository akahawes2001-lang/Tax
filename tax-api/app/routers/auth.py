import os
import uuid
import httpx
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.schemas import (
    UserCreate,
    UserLogin,
    Token,
    ChangePasswordRequest,
    RequestPasswordReset,
    ResetPassword,
    VerifyEmail,
)
from app.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.email_utils import send_email
from app.limiter_setup import limiter

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


async def verify_recaptcha(captcha_token: str) -> bool:
    """Проверяет reCAPTCHA токен через Google API."""
    secret = os.getenv("RECAPTCHA_SECRET_KEY", "")
    # В режиме разработки пропускаем проверку, если токен не указан
    if not secret or secret == "your-recaptcha-secret-key" or not captcha_token:
        return True
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": captcha_token},
            timeout=10,
        )
        result = resp.json()
        return result.get("success", False)


@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Проверка reCAPTCHA
    if not await verify_recaptcha(user.captcha_token or ""):
        raise HTTPException(
            status_code=400, detail="Не пройдена проверка reCAPTCHA"
        )
    result = await db.execute(select(User).where(User.email == user.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким email уже существует"
        )
    hashed = get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    new_user = User(
        email=user.email,
        hashed_password=hashed,
        verification_token=verification_token,
        is_verified=False,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Отправляем письмо для подтверждения email
    verify_link = f"http://localhost:5173/verify-email?token={verification_token}"
    send_email(
        recipient=user.email,
        subject="Подтверждение email",
        body=(
            f"Здравствуйте!\n\n"
            f"Для подтверждения email перейдите по ссылке:\n{verify_link}\n\n"
            f"Если вы не регистрировались, просто проигнорируйте это письмо.\n"
            f"\nВаш код подтверждения: {verification_token}"
        ),
    )

    return {
        "message": "Пользователь создан. На ваш email отправлено письмо для подтверждения.",
        "verification_token": verification_token,
        "email": user.email,
    }


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Проверка reCAPTCHA
    if not await verify_recaptcha(data.captcha_token or ""):
        raise HTTPException(
            status_code=400, detail="Не пройдена проверка reCAPTCHA"
        )
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not user.is_verified:
        raise HTTPException(
            status_code=403, detail="Подтвердите email перед входом"
        )
    token = create_access_token({"sub": user.email})
    resp = JSONResponse(content={"access_token": token, "token_type": "bearer", "email": user.email})
    is_prod = os.getenv("ENVIRONMENT", "development") == "production"
    resp.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # всегда False: на Render HTTPS терминируется на Cloudflare, до бэкенда идёт HTTP
        samesite="lax",
        max_age=60 * 60 * 24,  # 24 часа
        path="/",
    )
    return resp


@router.post("/verify-email")
async def verify_email(data: VerifyEmail, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.verification_token == data.token)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="Неверный или устаревший токен")
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    return {"message": "Email успешно подтверждён"}


@router.post("/request-password-reset")
@limiter.limit("5/minute")
async def request_password_reset(
    request: Request,
    data: RequestPasswordReset, db: AsyncSession = Depends(get_db)
):
    # Проверка reCAPTCHA
    if not await verify_recaptcha(data.captcha_token or ""):
        raise HTTPException(
            status_code=400, detail="Не пройдена проверка reCAPTCHA"
        )
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    # Не раскрываем, существует ли пользователь (безопасность)
    if not user:
        return {
            "message": "Если пользователь с таким email существует, на него отправлен код сброса пароля"
        }

    reset_token = str(uuid.uuid4())
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    await db.commit()

    send_email(
        recipient=user.email,
        subject="Сброс пароля",
        body=(
            f"Здравствуйте!\n\n"
            f"Вы запросили сброс пароля.\n"
            f"Ваш код для сброса пароля: {reset_token}\n\n"
            f"Ссылка для сброса: http://localhost:5173/reset-password?token={reset_token}\n\n"
            f"Код действителен в течение 1 часа.\n"
            f"Если вы не запрашивали сброс, проигнорируйте это письмо."
        ),
    )

    return {
        "message": "Если пользователь с таким email существует, на него отправлен код сброса пароля",
    }


@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.password_reset_token == data.token)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="Неверный токен")
    if (
        user.password_reset_expires is None
        or user.password_reset_expires < datetime.utcnow()
    ):
        raise HTTPException(status_code=400, detail="Срок действия токена истёк")
    user.hashed_password = get_password_hash(data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await db.commit()
    return {"message": "Пароль успешно изменён"}


@router.put("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return {"detail": "Пароль успешно изменён"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Возвращает информацию о текущем пользователе (проверка токена)"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_verified": current_user.is_verified,
    }


@router.post("/logout")
async def logout():
    """Выход из системы. На стороне клиента удаляется cookie с токеном."""
    resp = JSONResponse(content={"detail": "Вы вышли из системы"})
    resp.delete_cookie(key="access_token", path="/", samesite="lax")
    return resp