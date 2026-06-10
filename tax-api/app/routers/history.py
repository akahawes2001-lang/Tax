from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from datetime import datetime

from app.database import get_db
from app.models import History
from app.schemas import (
    HistoryCreate,
    HistoryResponse,
    HistoryDetailResponse,
    PaginatedHistoryResponse,
    HistoryUpdate,
)
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1", tags=["history"])


@router.get("/history", response_model=PaginatedHistoryResponse)
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить историю расчётов с пагинацией"""
    # общее количество записей
    count_result = await db.execute(
        select(func.count(History.id)).where(History.user_id == current_user.id)
    )
    total = count_result.scalar_one()

    offset = (page - 1) * limit
    result = await db.execute(
        select(History)
        .where(History.user_id == current_user.id)
        .order_by(History.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = result.scalars().all()

    return {
        "items": [HistoryResponse.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/history/{history_id}", response_model=HistoryDetailResponse)
async def get_history_detail(
    history_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить детальную информацию о конкретном расчёте"""
    result = await db.execute(
        select(History).where(
            History.id == history_id,
            History.user_id == current_user.id,
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return record


@router.post("/history", response_model=HistoryResponse)
async def create_history(
    data: HistoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Сохранить новый расчёт в историю"""
    record = History(
        user_id=current_user.id,
        name=data.name,
        category=data.category,
        tax=data.tax,
        details_json=data.details_json,
        created_at=datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.patch("/history/{history_id}", response_model=HistoryResponse)
async def update_history(
    history_id: int,
    data: HistoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Обновить существующую запись в истории"""
    result = await db.execute(
        select(History).where(
            History.id == history_id,
            History.user_id == current_user.id,
        )
    )
    record = result.scalars().first()
    if not record:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if data.name is not None:
        record.name = data.name
    if data.tax is not None:
        record.tax = data.tax
    if data.details_json is not None:
        record.details_json = data.details_json
    await db.commit()
    await db.refresh(record)
    return record


@router.delete("/history/{history_id}")
async def delete_single_history(
    history_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Удалить одну запись истории по ID"""
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


@router.delete("/history")
async def clear_all_history(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Удалить всю историю текущего пользователя"""
    await db.execute(delete(History).where(History.user_id == current_user.id))
    await db.commit()
    return {"detail": "История очищена"}