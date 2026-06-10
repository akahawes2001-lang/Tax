from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Settlement

router = APIRouter(prefix="/api/v1", tags=["settlements"])


@router.get("/settlements/search")
async def search_settlements(
    q: str = Query(
        ..., min_length=2, description="Поисковый запрос (минимум 2 символа)"
    ),
    limit: int = Query(20, ge=1, le=50, description="Количество результатов"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Settlement)
        .where(Settlement.name.ilike(f"%{q}%"))
        .order_by(Settlement.name)
        .limit(limit)
    )
    settlements = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "region": s.region,
            "district": s.district,
            "type": s.type,
        }
        for s in settlements
    ]


@router.get("/settlements/popular")
async def get_popular_settlements(db: AsyncSession = Depends(get_db)):
    """Возвращает популярные города для начального отображения."""
    popular = [
        "Минск",
        "Брест",
        "Витебск",
        "Гомель",
        "Гродно",
        "Могилев",
        "Барановичи",
        "Бобруйск",
        "Борисов",
        "Лида",
        "Молодечно",
        "Орша",
        "Пинск",
        "Солигорск",
        "Новополоцк",
    ]
    result = await db.execute(
        select(Settlement).where(Settlement.name.in_(popular)).order_by(Settlement.name)
    )
    return [
        {
            "id": s.id,
            "name": s.name,
            "region": s.region,
            "district": s.district,
            "type": s.type,
        }
        for s in result.scalars().all()
    ]
