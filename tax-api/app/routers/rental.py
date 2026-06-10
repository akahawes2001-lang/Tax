from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import RentalTaxRequest

router = APIRouter(prefix="/api/v1", tags=["rental"])

# Ставки налога на аренду (2026) — согласно Приложению 2 НК РБ
# Базовая ставка для жилых помещений (1 комната / без учёта комнат)
RENTAL_RATES = {
    "minsk": 53.0,
    "regional_center": 49.0,
    "large_city": 33.0,
    "other": 20.0,
}

# Ставки в зависимости от количества комнат (для Минска и облцентров)
# Ст. 370-2 НК РБ: для Минска ставка зависит от количества комнат
ROOM_RATES = {
    "minsk": {1: 53.0, 2: 70.0, "3+": 98.0},
    "regional_center": {1: 49.0, 2: 65.0, "3+": 90.0},
}

# Типы объектов, для которых не применяется повышение за комнаты
NON_ROOM_TYPES = {"garage", "parking_spot", "dacha", "garden_house"}

# Ключи – для поиска (нижний регистр), значения – (группа, отображаемое имя)
CITY_REFERENCE = {
    "минск": ("minsk", "Минск"),
    "брест": ("regional_center", "Брест"),
    "витебск": ("regional_center", "Витебск"),
    "гомель": ("regional_center", "Гомель"),
    "гродно": ("regional_center", "Гродно"),
    "могилёв": ("regional_center", "Могилёв"),
    "могилев": ("regional_center", "Могилёв"),
    "барановичи": ("large_city", "Барановичи"),
    "бобруйск": ("large_city", "Бобруйск"),
    "борисов": ("large_city", "Борисов"),
    "волковыск": ("large_city", "Волковыск"),
    "горки": ("large_city", "Горки"),
    "дзержинск": ("large_city", "Дзержинск"),
    "жлобин": ("large_city", "Жлобин"),
    "жодино": ("large_city", "Жодино"),
    "кобрин": ("large_city", "Кобрин"),
    "кричев": ("large_city", "Кричев"),
    "лида": ("large_city", "Лида"),
    "мозырь": ("large_city", "Мозырь"),
    "молодечно": ("large_city", "Молодечно"),
    "новогрудок": ("large_city", "Новогрудок"),
    "новополоцк": ("large_city", "Новополоцк"),
    "орша": ("large_city", "Орша"),
    "осиповичи": ("large_city", "Осиповичи"),
    "пинск": ("large_city", "Пинск"),
    "полоцк": ("large_city", "Полоцк"),
    "речица": ("large_city", "Речица"),
    "светлогорск": ("large_city", "Светлогорск"),
    "слоним": ("large_city", "Слоним"),
    "слуцк": ("large_city", "Слуцк"),
    "смолевичи": ("large_city", "Смолевичи"),
    "сморгонь": ("large_city", "Сморгонь"),
    "солигорск": ("large_city", "Солигорск"),
    "фаниполь": ("large_city", "Фаниполь"),
}

# Отображаемые названия групп городов
GROUP_LABELS = {
    "minsk": "Минск",
    "regional_center": "областной центр",
    "large_city": "крупный город",
    "other": "иные населённые пункты",
}

# Отображаемые названия типов объектов
PROPERTY_LABELS = {
    "room": "жилая комната",
    "apartment": "квартира",
    "house": "дом",
    "garage": "гараж",
    "parking_spot": "машино-место",
    "dacha": "дача",
    "garden_house": "садовый домик",
}


def get_rental_rate(group: str, property_type: str, rooms: int = 1) -> float:
    """Определяет месячную ставку налога на аренду."""
    # Для нежилых типов (гараж, машино-место и т.д.) — базовая ставка
    if property_type in NON_ROOM_TYPES:
        return RENTAL_RATES.get(group, 20.0)

    # Для жилых помещений — учёт количества комнат (только Минск и облцентры)
    if group in ROOM_RATES and property_type in ("room", "apartment", "house"):
        room_scale = ROOM_RATES[group]
        if rooms >= 3:
            return room_scale["3+"]
        return room_scale.get(rooms, room_scale[1])

    # Для остальных (large_city, other) — базовая ставка
    return RENTAL_RATES.get(group, 20.0)


@router.get("/rental-cities")
async def get_rental_cities():
    """Возвращает список городов для автозаполнения с заглавной буквы."""
    cities = [name for _, name in CITY_REFERENCE.values()]
    return {"cities": cities, "other_option": "Другие населённые пункты (20 руб.)"}


@router.post("/calculate-rental-tax")
async def rental_tax(req: RentalTaxRequest, db: AsyncSession = Depends(get_db)):
    city_lower = req.city.lower().strip()

    if city_lower in CITY_REFERENCE:
        group, display_name = CITY_REFERENCE[city_lower]
    else:
        group = "other"
        display_name = "иные населённые пункты"

    # Определяем ставку с учётом количества комнат
    rooms = req.rooms or 1
    rate = get_rental_rate(group, req.property_type, rooms)
    total = rate * req.months

    # Формируем детали
    prop_label = PROPERTY_LABELS.get(req.property_type, req.property_type)
    group_label = GROUP_LABELS.get(group, group)

    if req.property_type in NON_ROOM_TYPES:
        rooms_info = ""
    elif group in ROOM_RATES and req.property_type in ("room", "apartment", "house"):
        rooms_info = f", {rooms} комн."
    else:
        rooms_info = ""

    details = (
        f"Объект: {prop_label}{rooms_info}\n"
        f"Населённый пункт: {display_name} ({group_label})\n"
        f"Месячная ставка: {rate} руб.\n"
        f"Количество месяцев: {req.months}\n"
        f"Итого: {total} руб."
    )

    return {
        "city": req.city,
        "city_group": group,
        "property_type": req.property_type,
        "rooms": rooms,
        "monthly_tax": rate,
        "months": req.months,
        "total_tax": total,
        "details": details,
    }