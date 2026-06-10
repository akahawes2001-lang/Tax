from fastapi import APIRouter, HTTPException
from app.schemas import IpTaxRequest, IpTaxResponse

router = APIRouter(prefix="/api/v1/ip-tax", tags=["ip_tax"])

# Справочник видов деятельности и ставок (в рублях в месяц)
ACTIVITY_RATES = {
    "retail_food": {
        "name": "Розничная торговля продовольственными товарами",
        "rates": {"minsk": 350, "regional_city": 250, "large_city": 200, "other": 150},
    },
    "retail_nonfood": {
        "name": "Розничная торговля непродовольственными товарами",
        "rates": {"minsk": 500, "regional_city": 350, "large_city": 250, "other": 200},
    },
    "catering": {
        "name": "Общественное питание (кафе, рестораны)",
        "rates": {"minsk": 800, "regional_city": 600, "large_city": 400, "other": 300},
    },
    "hairdressing": {
        "name": "Парикмахерские и косметические услуги",
        "rates": {"minsk": 200, "regional_city": 150, "large_city": 120, "other": 100},
    },
    "cargo_transport": {
        "name": "Грузоперевозки",
        "rates": {"minsk": 400, "regional_city": 300, "large_city": 250, "other": 200},
    },
    "construction": {
        "name": "Строительные и ремонтные работы",
        "rates": {"minsk": 600, "regional_city": 450, "large_city": 350, "other": 250},
    },
    "it_services": {
        "name": "IT-услуги и разработка ПО",
        "rates": {"minsk": 1000, "regional_city": 800, "large_city": 600, "other": 500},
    },
    "rental": {
        "name": "Аренда недвижимости",
        "rates": {"minsk": 700, "regional_city": 500, "large_city": 400, "other": 300},
    },
    "other": {
        "name": "Прочие виды деятельности",
        "rates": {"minsk": 300, "regional_city": 250, "large_city": 200, "other": 150},
    },
}

CITY_TYPE_LABELS = {
    "minsk": "Минск",
    "regional_city": "Областной центр",
    "large_city": "Крупный город",
    "other": "Прочие населённые пункты",
}


@router.post("/calculate", response_model=IpTaxResponse)
async def calculate_ip_tax(req: IpTaxRequest):
    if req.activity_type not in ACTIVITY_RATES:
        raise HTTPException(
            status_code=400,
            detail=f"Неизвестный вид деятельности: {req.activity_type}. "
                   f"Допустимые значения: {', '.join(ACTIVITY_RATES.keys())}",
        )

    if req.city_type not in CITY_TYPE_LABELS:
        raise HTTPException(
            status_code=400,
            detail=f"Неизвестный тип населённого пункта: {req.city_type}. "
                   f"Допустимые значения: {', '.join(CITY_TYPE_LABELS.keys())}",
        )

    activity = ACTIVITY_RATES[req.activity_type]
    applied_rate = activity["rates"][req.city_type]
    tax_amount = applied_rate

    # Льгота 25% (но не ниже 1 рубля)
    if req.is_preferential:
        discount = applied_rate * 0.25
        tax_amount = applied_rate - discount
        if tax_amount < 1:
            tax_amount = 1.0

    details = (
        f"Вид деятельности: {activity['name']}\n"
        f"Тип населённого пункта: {CITY_TYPE_LABELS[req.city_type]}\n"
        f"Месячная ставка: {applied_rate} руб.\n"
    )

    if req.is_preferential:
        discount = applied_rate * 0.25
        details += (
            f"Льгота (25%): -{min(discount, applied_rate - 1) if applied_rate - discount < 1 else discount:.2f} руб.\n"
        )
        details += f"Итого к уплате: {tax_amount:.2f} руб./мес."
    else:
        details += f"Итого к уплате: {tax_amount:.2f} руб./мес."

    return IpTaxResponse(
        tax_amount=round(tax_amount, 2),
        details=details,
        applied_rate=applied_rate,
    )