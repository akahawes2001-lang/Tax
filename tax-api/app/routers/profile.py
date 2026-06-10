from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from typing import List
from app.database import get_db
from app.models import User, History, Review
from app.schemas import (
    ChangeEmailRequest,
    ProfileStatsResponse,
    HistoryResponse,
    ReviewResponse,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


@router.put("/change-email")
async def change_email(
    data: ChangeEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(select(User).where(User.email == data.new_email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Этот email уже используется")
    current_user.email = data.new_email
    await db.commit()
    return {"detail": "Email успешно изменён"}


@router.delete("/delete-account")
async def delete_account(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    await db.execute(delete(History).where(History.user_id == current_user.id))
    await db.execute(delete(Review).where(Review.user_id == current_user.id))
    await db.delete(current_user)
    await db.commit()
    return {"detail": "Аккаунт удалён"}


@router.get("/stats", response_model=ProfileStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    calc_count = await db.scalar(
        select(func.count(History.id)).where(History.user_id == current_user.id)
    )
    total_tax = (
        await db.scalar(
            select(func.sum(History.tax)).where(History.user_id == current_user.id)
        )
        or 0.0
    )
    review_count = await db.scalar(
        select(func.count(Review.id)).where(Review.user_id == current_user.id)
    )
    return ProfileStatsResponse(
        calculations=calc_count or 0,
        total_tax=total_tax or 0.0,
        reviews=review_count or 0,
        registered_at="2026-01-01",
    )


@router.get("/history", response_model=List[HistoryResponse])
async def get_my_history(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(History)
        .where(History.user_id == current_user.id)
        .order_by(History.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.delete("/history/{history_id}")
async def delete_my_history(
    history_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(History).where(
            History.id == history_id, History.user_id == current_user.id
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await db.delete(record)
    await db.commit()
    return {"detail": "Запись удалена"}


@router.get("/reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Review)
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/reviews/{review_id}")
async def delete_my_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.user_id == current_user.id)
    )
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    await db.delete(review)
    await db.commit()
    return {"detail": "Отзыв удалён"}
