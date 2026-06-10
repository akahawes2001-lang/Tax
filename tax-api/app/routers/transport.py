import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import TransportTaxRate
from app.schemas import (
    TransportVehicle,
    TransportTaxRequest,
    TransportTaxResponse,
    VehicleTaxDetail,
)

router = APIRouter(prefix="/api/v1", tags=["transport"])

# Дефолтные ставки (2025/2026) для легковых авто, если в БД пусто
DEFAULT_CAR_RATES = {
    # масса до 1.5 т включительно
    (0, 1500): {"rate_2025": 70, "rate_2026": 75},
    # масса 1.5–1.75 т
    (1501, 1750): {"rate_2025": 92, "rate_2026": 99},
    # масса 1.75–2.0 т
    (1751, 2000): {"rate_2025": 116, "rate_2026": 124},
    # масса 2.0–2.25 т
    (2001, 2250): {"rate_2025": 138, "rate_2026": 148},
    # масса 2.25–2.5 т
    (2251, 2500): {"rate_2025": 161, "rate_2026": 177},
    # масса 2.5–3.0 т
    (2501, 3000): {"rate_2025": 183, "rate_2026": 196},
    # масса > 3.0 т
    (3001, 100000): {"rate_2025": 253, "rate_2026": 270},
}

DEFAULT_TRUCK_RATES = {
    # грузовики до 3.5 т
    (0, 3500): {"rate_2025": 150.0, "rate_2026": 154.0},
    # 3.5–12 т
    (3501, 12000): {"rate_2025": 300.0, "rate_2026": 308.0},
    # > 12 т
    (12001, 100000): {"rate_2025": 500.0, "rate_2026": 513.0},
}

DEFAULT_BUS_RATES = {
    # до 20 мест
    (0, 20): {"rate_2025": 200.0, "rate_2026": 205.0},
    # 21–40 мест
    (21, 40): {"rate_2025": 300.0, "rate_2026": 308.0},
    # > 40 мест
    (41, 1000): {"rate_2025": 400.0, "rate_2026": 410.0},
}

# Ставки для водного транспорта (ст. 307-7 НК РБ)
# Лодки с мотором:
#   - до 30 л.с. включительно: 49 руб./год
#   - свыше 30 л.с.: 100 руб./год
# Яхты и катера: 300 руб./год
# Гидроциклы: 150 руб./год
BOAT_RATE_LOW = 49.0   # лодки ≤ 30 л.с.
BOAT_RATE_HIGH = 100.0  # лодки > 30 л.с.
YACHT_RATE = 300.0       # яхты и катера
JET_SKI_RATE = 150.0     # гидроциклы

# Ставки для воздушного транспорта (ст. 307-8 НК РБ)
# Самолёты: 500 руб./год за каждые 100 кг взлётной массы (округлять вверх)
# Вертолёты: 700 руб./год за каждые 100 кг взлётной массы
AIRPLANE_RATE_PER_100KG = 500.0
HELICOPTER_RATE_PER_100KG = 700.0


def calculate_vehicle_tax(vehicle: TransportVehicle) -> float:
    """Рассчитывает налог для одного транспортного средства."""
    vt = vehicle.vehicle_type

    # --- Водный транспорт ---
    if vt == "boat":
        power = vehicle.power_hp or 0
        if power <= 30:
            return BOAT_RATE_LOW
        else:
            return BOAT_RATE_HIGH

    if vt == "yacht":
        return YACHT_RATE

    if vt == "jet_ski":
        return JET_SKI_RATE

    # --- Воздушный транспорт ---
    if vt == "airplane":
        weight = vehicle.takeoff_weight or 0
        if weight <= 0:
            raise HTTPException(
                status_code=400,
                detail="Для самолёта необходимо указать взлётную массу (takeoff_weight)",
            )
        # округление вверх до сотен кг
        hundreds = math.ceil(weight / 100)
        return hundreds * AIRPLANE_RATE_PER_100KG

    if vt == "helicopter":
        weight = vehicle.takeoff_weight or 0
        if weight <= 0:
            raise HTTPException(
                status_code=400,
                detail="Для вертолёта необходимо указать взлётную массу (takeoff_weight)",
            )
        hundreds = math.ceil(weight / 100)
        return hundreds * HELICOPTER_RATE_PER_100KG

    # --- Электромобили (легковые) – льгота 0 руб. ---
    if vt == "electric_car":
        return 0.0

    # --- Электромотоциклы – особая ставка (x5 для ≤ 5 лет) ---
    if vt == "electric_motorcycle":
        base = 49.0
        age = vehicle.tax_year - vehicle.year_of_manufacture
        if age <= 5:
            base *= 5
        return base

    # --- Мотоциклы (ДВС) ---
    if vt == "motorcycle":
        base = 49.0
        age = vehicle.tax_year - vehicle.year_of_manufacture
        if vehicle.engine_capacity and vehicle.engine_capacity >= 800 and age <= 5:
            base *= 5
        return base

    # --- Прицепы ---
    if vt == "trailer":
        if vehicle.mass <= 0.75:
            return 49.0
        else:
            return 270.0

    # --- Прицеп-дача (караван) – фиксированная ставка 49 руб. ---
    if vt == "trailer_caravan":
        return 49.0

    # Для остальных типов (car, truck, bus) – возвращаем None,
    # чтобы вызывающий код обработал через БД
    return None


@router.post("/calculate-transport-tax", response_model=TransportTaxResponse)
async def transport_tax(req: TransportTaxRequest, db: AsyncSession = Depends(get_db)):
    vehicles_details: list[VehicleTaxDetail] = []
    total_tax = 0.0

    for vehicle in req.vehicles:
        vt = vehicle.vehicle_type

        # Пробуем рассчитать налог по простым правилам
        calculated = calculate_vehicle_tax(vehicle)

        if calculated is not None:
            # Это водный, воздушный, мотоцикл, прицеп, электромобиль и т.д.
            note = None
            if vt in ("boat", "yacht", "jet_ski"):
                note = "Согласно ст. 307-7 НК РБ"
            elif vt in ("airplane", "helicopter"):
                note = "Согласно ст. 307-8 НК РБ"
            elif vt == "electric_car":
                note = "Льгота для электромобилей (0 руб. до 2027 года)"
            elif vt == "electric_motorcycle":
                note = "Для электромотоциклов применяется 5-кратный налог (если возраст ≤ 5 лет)"

            detail = VehicleTaxDetail(
                vehicle_type=vt,
                mass=vehicle.mass,
                power_hp=vehicle.power_hp if vt in ("boat",) else None,
                takeoff_weight=vehicle.takeoff_weight if vt in ("airplane", "helicopter") else None,
                tax_year=vehicle.tax_year,
                calculated_tax=round(calculated, 2),
                note=note,
            )
            total_tax += calculated
            vehicles_details.append(detail)
            continue

        # Для car, truck, bus – ищем в таблице transport_tax_rates
        mass_kg = vehicle.mass * 1000  # переводим тонны в кг для БД
        result = await db.execute(
            select(TransportTaxRate).where(
                TransportTaxRate.vehicle_type == vt,
                TransportTaxRate.min_mass <= mass_kg,
                TransportTaxRate.max_mass >= mass_kg,
            )
        )
        rate = result.scalars().first()

        # Если ставка не найдена – используем дефолтные значения
        if not rate:
            year = vehicle.tax_year
            base_tax = None
            if vt == "car":
                for (min_m, max_m), rates in DEFAULT_CAR_RATES.items():
                    if min_m <= mass_kg <= max_m:
                        base_tax = rates.get(f"rate_{year}", rates.get("rate_2026", 75.0))
                        break
                else:
                    base_tax = 75.0
            elif vt == "truck":
                for (min_m, max_m), rates in DEFAULT_TRUCK_RATES.items():
                    if min_m <= mass_kg <= max_m:
                        base_tax = rates.get(f"rate_{year}", rates.get("rate_2026", 154.0))
                        break
                else:
                    base_tax = 154.0
            elif vt == "bus":
                for (min_m, max_m), rates in DEFAULT_BUS_RATES.items():
                    if min_m <= mass_kg <= max_m:
                        base_tax = rates.get(f"rate_{year}", rates.get("rate_2026", 205.0))
                        break
                else:
                    base_tax = 205.0
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ставка транспортного налога для типа '{vt}' не найдена",
                )
        else:
            year = vehicle.tax_year
            base_tax = rate.rate_2026 if year == 2026 else rate.rate_2025

        # Налог на роскошь для легковых авто
        if (
            vt == "car"
            and vehicle.is_luxury
            and (vehicle.tax_year - vehicle.year_of_manufacture) <= 3
        ):
            luxury_coeff = getattr(rate, "luxury_coefficient", 10) if rate else 10
            base_tax *= luxury_coeff

        # Льготы по транспортному налогу (ст. 307-8 НК РБ)
        note = None
        if vehicle.is_veteran or vehicle.is_large_family or vehicle.is_chernobyl:
            base_tax = 0.0
            note = "Освобождение от налога (ст. 307-8 НК РБ)"
        elif vehicle.is_disabled_3:
            base_tax *= 0.5  # скидка 50% для инвалидов III группы
            note = "Скидка 50% для инвалидов III группы (ст. 307-8 НК РБ)"

        detail = VehicleTaxDetail(
            vehicle_type=vt,
            mass=vehicle.mass,
            tax_year=vehicle.tax_year,
            calculated_tax=round(base_tax, 2),
            note=note,
        )
        total_tax += base_tax
        vehicles_details.append(detail)

    return TransportTaxResponse(
        total_tax=round(total_tax, 2),
        vehicles_details=vehicles_details,
    )