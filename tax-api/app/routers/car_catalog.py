from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct
from app.database import get_db
from app.models import CarReference

router = APIRouter(prefix="/api/v1", tags=["car-catalog"])

@router.get("/car-brands")
async def get_brands(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(distinct(CarReference.brand)).order_by(CarReference.brand))
    return [row[0] for row in result.all()]

@router.get("/car-models")
async def get_models(brand: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(distinct(CarReference.model))
        .where(CarReference.brand == brand)
        .order_by(CarReference.model)
    )
    return [row[0] for row in result.all()]

@router.get("/car-mass")
async def get_mass(brand: str, model: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CarReference).where(
            CarReference.brand == brand,
            CarReference.model == model
        )
    )
    ref = result.scalars().first()
    if not ref:
        return {"mass": None, "is_luxury": False}
    return {
        "mass": ref.mass,           # может быть null
        "is_luxury": ref.is_luxury
    }