from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.auth import require_admin
from app.models import (
    DogTaxRate,
    TransportTaxRate,
    DepositTaxRule,
    RentalTaxRate,
    SystemParameter,
    History,          # <-- добавлено
    Review,           # <-- добавлено
)
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ---------- Вспомогательные схемы ----------
class DogRateIn(BaseModel):
    breed_type: str
    year: int
    rate_per_quarter: float


class TransportRateIn(BaseModel):
    vehicle_type: str
    min_mass: float
    max_mass: float
    rate_2025: float
    rate_2026: float
    is_luxury: bool = False
    luxury_coefficient: float = 10.0


class DepositRuleIn(BaseModel):
    currency_type: str
    min_term_months_for_exemption: int
    tax_rate: float


class RentalRateIn(BaseModel):
    city_group: str
    property_type: str
    monthly_tax: float


class SystemParameterIn(BaseModel):
    key: str
    value: str
    description: str = None


class SystemParameterOut(BaseModel):
    id: int
    key: str
    value: str
    description: str = None


# ---------- Статистика ----------
@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    """Общая статистика для панели администратора"""
    pending = await db.scalar(
        select(func.count(Review.id)).where(Review.approved == False)
    )
    approved = await db.scalar(
        select(func.count(Review.id)).where(Review.approved == True)
    )
    total_calc = await db.scalar(select(func.count(History.id)))
    total_tax = await db.scalar(select(func.sum(History.tax))) or 0.0

    return {
        "pending_reviews": pending or 0,
        "approved_reviews": approved or 0,
        "total_calculations": total_calc or 0,
        "total_tax": total_tax,
    }


# ---------- Dog ----------
@router.get("/dog-tax-rates")
async def get_dog_rates(
    db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    result = await db.execute(select(DogTaxRate))
    return result.scalars().all()


@router.post("/dog-tax-rates")
async def create_dog_rate(
    rate: DogRateIn, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    obj = DogTaxRate(**rate.dict())
    db.add(obj)
    await db.commit()
    return obj


# ---------- Transport ----------
@router.get("/transport-tax-rates")
async def get_transport_rates(
    db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    result = await db.execute(select(TransportTaxRate))
    return result.scalars().all()


@router.post("/transport-tax-rates")
async def create_transport_rate(
    rate: TransportRateIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    obj = TransportTaxRate(**rate.dict())
    db.add(obj)
    await db.commit()
    return obj


# ---------- Deposit ----------
@router.get("/deposit-tax-rules")
async def get_deposit_rules(
    db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    result = await db.execute(select(DepositTaxRule))
    return result.scalars().all()


@router.post("/deposit-tax-rules")
async def create_deposit_rule(
    rule: DepositRuleIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    obj = DepositTaxRule(**rule.dict())
    db.add(obj)
    await db.commit()
    return obj


# ---------- Rental ----------
@router.get("/rental-tax-rates")
async def get_rental_rates(
    db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    result = await db.execute(select(RentalTaxRate))
    return result.scalars().all()


@router.post("/rental-tax-rates")
async def create_rental_rate(
    rate: RentalRateIn, db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    obj = RentalTaxRate(**rate.dict())
    db.add(obj)
    await db.commit()
    return obj


# ---------- System Parameters ----------
@router.get("/system-parameters", response_model=list[SystemParameterOut])
async def get_system_parameters(
    db: AsyncSession = Depends(get_db), admin=Depends(require_admin)
):
    result = await db.execute(select(SystemParameter))
    return result.scalars().all()


@router.post("/system-parameters", response_model=SystemParameterOut)
async def create_system_parameter(
    param: SystemParameterIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    existing = await db.execute(
        select(SystemParameter).where(SystemParameter.key == param.key)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400, detail="Параметр с таким ключом уже существует"
        )
    obj = SystemParameter(**param.dict())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.put("/system-parameters/{key}", response_model=SystemParameterOut)
async def update_system_parameter(
    key: str,
    param: SystemParameterIn,
    db: AsyncSession = Depends(get_db),
    admin=Depends(require_admin),
):
    result = await db.execute(select(SystemParameter).where(SystemParameter.key == key))
    obj = result.scalars().first()
    if not obj:
        raise HTTPException(status_code=404, detail="Параметр не найден")
    obj.value = param.value
    if param.description is not None:
        obj.description = param.description
    await db.commit()
    await db.refresh(obj)
    return obj