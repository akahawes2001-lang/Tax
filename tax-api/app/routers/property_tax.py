from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import PropertyTaxRequest
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["property_tax"])

# Ставки налога на недвижимость (в процентах от кадастровой стоимости)
PROPERTY_RATES = {
    "apartment": 0.1,       # квартира — 0.1%
    "house": 0.1,           # дом — 0.1%
    "garage": 1.2,          # гараж — до 1.2%
    "outbuilding": 1.2,     # хозпостройка — до 1.2%
    "land": 0.1,            # земельный участок — 0.1%
}

# Льготные категории граждан (освобождены от налога)
BENEFICIARY_CATEGORIES = {
    "pensioner": "пенсионеры",
    "large_family": "многодетные",
    "disabled": "инвалиды",
}

# Региональные коэффициенты (для примера)
REGION_COEFFICIENTS = {
    "Минск": 1.0,
    "Минская": 0.9,
    "Брестская": 0.8,
    "Витебская": 0.7,
    "Гомельская": 0.8,
    "Гродненская": 0.8,
    "Могилёвская": 0.7,
}


@router.post("/calculate-property-tax")
async def property_tax(req: PropertyTaxRequest):
    # 1. Проверка на льготные категории (ст. 228 НК РБ)
    if req.is_pensioner or req.is_large_family or req.is_disabled_1_2 or req.is_chernobyl_victim or req.is_veteran:
        return {
            "cadastral_value": req.cadastral_value,
            "property_type": req.property_type,
            "region": req.region,
            "calculated_tax": 0.0,
            "note": "Льгота: полное освобождение от налога на недвижимость",
            "benefits_applied": True,
        }

    # 2. Проверка типа объекта
    if req.property_type not in PROPERTY_RATES:
        raise HTTPException(
            status_code=400,
            detail=f"Неизвестный тип объекта: {req.property_type}. "
                   f"Допустимые: {', '.join(PROPERTY_RATES.keys())}"
        )

    # 3. Базовая ставка
    base_rate = PROPERTY_RATES[req.property_type]

    # 4. Региональный коэффициент (если регион указан)
    region_coeff = REGION_COEFFICIENTS.get(req.region, 1.0)

    # 5. Расчёт налога
    tax = req.cadastral_value * (base_rate / 100) * region_coeff

    return {
        "cadastral_value": req.cadastral_value,
        "property_type": req.property_type,
        "region": req.region,
        "base_rate": base_rate,
        "region_coefficient": region_coeff,
        "calculated_tax": round(tax, 2),
        "benefits_applied": False,
    }
