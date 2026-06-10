from fastapi import APIRouter, HTTPException
from app.schemas import LandTaxRequest, LandTaxResponse

router = APIRouter(prefix="/api/v1/land-tax", tags=["land_tax"])

# Ставки земельного налога (в процентах от кадастровой стоимости)
LAND_RATES = {
    "agricultural": 0.1,    # сельскохозяйственные земли — 0.1%
    "residential": 0.5,     # земли под жилую застройку — 0.5%
    "industrial": 1.0,      # промышленные земли — 1.0%
    "other": 1.5,           # прочие земли — 1.5%
}

LAND_CATEGORY_LABELS = {
    "agricultural": "Сельскохозяйственные земли",
    "residential": "Земли под жилую застройку",
    "industrial": "Промышленные земли",
    "other": "Прочие земли",
}


@router.post("/calculate", response_model=LandTaxResponse)
async def land_tax(req: LandTaxRequest):
    # Проверка категории земли
    if req.land_category not in LAND_RATES:
        raise HTTPException(
            status_code=400,
            detail=f"Неизвестная категория земли: {req.land_category}. "
                   f"Допустимые: {', '.join(LAND_RATES.keys())}"
        )

    base_rate = LAND_RATES[req.land_category]
    category_label = LAND_CATEGORY_LABELS[req.land_category]

    # Проверка на льготные категории (ст. 234 НК РБ)
    is_exempt = req.is_pensioner or req.is_large_family or req.is_disabled_1_2 or req.is_chernobyl_victim or req.is_veteran

    if is_exempt:
        return LandTaxResponse(
            tax_amount=0.0,
            details=(
                f"Кадастровая стоимость: {req.cadastral_value:,.2f} руб.\n"
                f"Категория земли: {category_label}\n"
                f"Ставка: {base_rate}%\n"
                f"Сумма налога до льгот: {req.cadastral_value * base_rate / 100:,.2f} руб.\n"
                f"Льгота: полное освобождение от земельного налога\n"
                f"Итоговая сумма: 0.00 руб."
            ),
            applied_rate=base_rate,
            is_exempt=True,
        )

    # Расчёт налога: кадастровая стоимость × ставка / 100
    tax = req.cadastral_value * (base_rate / 100)

    return LandTaxResponse(
        tax_amount=round(tax, 2),
        details=(
            f"Кадастровая стоимость: {req.cadastral_value:,.2f} руб.\n"
            f"Категория земли: {category_label}\n"
            f"Ставка: {base_rate}%\n"
            f"Сумма налога до льгот: {tax:,.2f} руб.\n"
            f"Льготы: не применяются\n"
            f"Итоговая сумма: {round(tax, 2):,.2f} руб."
        ),
        applied_rate=base_rate,
        is_exempt=False,
    )
