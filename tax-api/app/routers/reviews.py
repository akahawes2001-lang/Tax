from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Review, User
from app.schemas import ReviewCreate, ReviewResponse
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/v1", tags=["reviews"])


@router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_review = Review(
        user_id=current_user.id,
        text=review.text,
        rating=review.rating,
        author_name=review.author_name,
        approved=False,
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    return new_review


@router.get("/reviews/public", response_model=list[ReviewResponse])
async def get_public_reviews(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review)
        .where(Review.approved == True)
        .order_by(Review.created_at.desc())
        .limit(10)
    )
    return result.scalars().all()


@router.get("/admin/reviews", response_model=list[ReviewResponse])
async def admin_get_reviews(
    db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(Review).order_by(Review.created_at.desc()))
    return result.scalars().all()


@router.put("/admin/reviews/{review_id}/approve", response_model=ReviewResponse)
async def approve_review(
    review_id: int, db: AsyncSession = Depends(get_db), _: User = Depends(require_admin)
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    review.approved = not review.approved
    await db.commit()
    await db.refresh(review)
    return review


@router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    await db.delete(review)
    await db.commit()
    return {"detail": "Отзыв удалён"}