from typing import Type, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from app.models import SystemParameter


async def get_param(db: AsyncSession, key: str, default=None):
    """Получить значение системного параметра по ключу."""
    result = await db.execute(select(SystemParameter).where(SystemParameter.key == key))
    param = result.scalars().first()
    if param:
        return param.value
    return default


async def get_param_float(db: AsyncSession, key: str, default=0.0):
    val = await get_param(db, key, None)
    if val is None:
        return default
    try:
        return float(val)
    except ValueError:
        return default


async def get_param_int(db: AsyncSession, key: str, default=0):
    val = await get_param(db, key, None)
    if val is None:
        return default
    try:
        return int(val)
    except ValueError:
        return default


async def get_rate_or_404(db: AsyncSession, model: Type, detail: str, *where_clauses):
    """
    Ищет первую запись в model по where_clauses.
    Если запись не найдена — выбрасывает HTTPException(404, detail=detail).
    """
    result = await db.execute(select(model).where(*where_clauses))
    obj = result.scalars().first()
    if not obj:
        raise HTTPException(status_code=404, detail=detail)
    return obj
