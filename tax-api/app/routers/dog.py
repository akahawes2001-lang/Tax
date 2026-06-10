from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import DogTaxRate, DogBreed
from app.schemas import DogTaxRequest, DogBreedResponse
from typing import List

router = APIRouter(prefix="/api/v1", tags=["dog"])


@router.get("/dog-breeds/search", response_model=List[DogBreedResponse])
async def search_dog_breeds(
    q: str = Query(
        ..., min_length=2, description="Поисковый запрос (минимум 2 символа)"
    ),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DogBreed)
        .where(DogBreed.name.ilike(f"%{q}%"))
        .order_by(DogBreed.name)
        .limit(20)
    )
    breeds = result.scalars().all()
    return breeds


@router.post("/calculate-dog-tax")
async def dog_tax(req: DogTaxRequest, db: AsyncSession = Depends(get_db)):
    # 1. Ищем породу в справочнике
    breed_result = await db.execute(
        select(DogBreed).where(DogBreed.name == req.breed_type)
    )
    breed = breed_result.scalars().first()

    # 2. Определяем категорию (dangerous / non_dangerous) с учётом статуса регулирования
    if breed:
        if breed.regulation_status == "current" and breed.is_dangerous:
            breed_type = "dangerous"
        else:
            # projected или неопасная – считаем как неопасную
            breed_type = "non_dangerous"
    else:
        # Порода не найдена – по умолчанию неопасная
        breed_type = "non_dangerous"

    # 3. Получаем ставку налога
    result = await db.execute(
        select(DogTaxRate).where(
            DogTaxRate.breed_type == breed_type, DogTaxRate.year == req.year
        )
    )
    rate = result.scalars().first()
    if not rate:
        raise HTTPException(status_code=404, detail="Ставка налога на собак не найдена")

    # 4. Базовый расчёт
    total = req.number_of_dogs * rate.rate_per_quarter * req.quarters

    # 5. Льготы
    if req.is_disabled_12:
        total = 0.0
    else:
        discount = 0.0
        if req.is_pensioner or req.is_large_family:
            discount = rate.rate_per_quarter * 0.5 * req.quarters
        total = max(total - discount, 0.0)

    return {
        "breed_type": breed_type,
        "year": req.year,
        "rate_per_quarter": rate.rate_per_quarter,
        "total_tax": round(total, 2),
    }
