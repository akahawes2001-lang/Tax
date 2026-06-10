import asyncio
from sqlalchemy import text
from app.database import engine, async_session
from app.models import TransportTaxRate

TRANSPORT_RATES = [
    # Легковые автомобили (ставки на 2025 и 2026 год)
    {
        "vehicle_type": "car",
        "min_mass": 0,
        "max_mass": 1.5,
        "rate_2025": 70,
        "rate_2026": 75,
    },
    {
        "vehicle_type": "car",
        "min_mass": 1.5,
        "max_mass": 1.75,
        "rate_2025": 92,
        "rate_2026": 99,
    },
    {
        "vehicle_type": "car",
        "min_mass": 1.75,
        "max_mass": 2.0,
        "rate_2025": 116,
        "rate_2026": 124,
    },
    {
        "vehicle_type": "car",
        "min_mass": 2.0,
        "max_mass": 2.25,
        "rate_2025": 138,
        "rate_2026": 148,
    },
    {
        "vehicle_type": "car",
        "min_mass": 2.25,
        "max_mass": 2.5,
        "rate_2025": 161,
        "rate_2026": 177,
    },
    {
        "vehicle_type": "car",
        "min_mass": 2.5,
        "max_mass": 3.0,
        "rate_2025": 183,
        "rate_2026": 196,
    },
    {
        "vehicle_type": "car",
        "min_mass": 3.0,
        "max_mass": 100,
        "rate_2025": 253,
        "rate_2026": 270,
    },
    # Мотоциклы (все, независимо от массы)
    {
        "vehicle_type": "motorcycle",
        "min_mass": 0,
        "max_mass": 100,
        "rate_2025": 46,
        "rate_2026": 49,
    },
    # Прицепы до 0.75 тонн
    {
        "vehicle_type": "trailer",
        "min_mass": 0,
        "max_mass": 0.75,
        "rate_2025": 46,
        "rate_2026": 49,
    },
    # Прицепы более 0.75 тонн
    {
        "vehicle_type": "trailer",
        "min_mass": 0.75,
        "max_mass": 100,
        "rate_2025": 253,
        "rate_2026": 270,
    },
    # Грузовые автомобили (ставки по массе, 2026)
    {
        "vehicle_type": "truck",
        "min_mass": 0,
        "max_mass": 1.5,
        "rate_2025": 77,
        "rate_2026": 82,
    },
    {
        "vehicle_type": "truck",
        "min_mass": 1.5,
        "max_mass": 2.5,
        "rate_2025": 110,
        "rate_2026": 117,
    },
    {
        "vehicle_type": "truck",
        "min_mass": 2.5,
        "max_mass": 3.5,
        "rate_2025": 161,
        "rate_2026": 172,
    },
    {
        "vehicle_type": "truck",
        "min_mass": 3.5,
        "max_mass": 12.0,
        "rate_2025": 250,
        "rate_2026": 267,
    },
    {
        "vehicle_type": "truck",
        "min_mass": 12.0,
        "max_mass": 100,
        "rate_2025": 312,
        "rate_2026": 334,
    },
    # Автобусы (ставки по числу мест, 2026) — используем поле max_mass как "число мест"
    {
        "vehicle_type": "bus",
        "min_mass": 0,
        "max_mass": 5,
        "rate_2025": 82,
        "rate_2026": 87,
    },
    {
        "vehicle_type": "bus",
        "min_mass": 5,
        "max_mass": 20,
        "rate_2025": 134,
        "rate_2026": 143,
    },
    {
        "vehicle_type": "bus",
        "min_mass": 20,
        "max_mass": 100,
        "rate_2025": 155,
        "rate_2026": 166,
    },
]


async def seed():
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM transport_tax_rates"))

    async with async_session() as session:
        for rate in TRANSPORT_RATES:
            session.add(
                TransportTaxRate(
                    vehicle_type=rate["vehicle_type"],
                    min_mass=rate["min_mass"],
                    max_mass=rate["max_mass"],
                    rate_2025=rate["rate_2025"],
                    rate_2026=rate["rate_2026"],
                )
            )
        await session.commit()
        print(f"Готово! Загружено {len(TRANSPORT_RATES)} ставок транспортного налога.")


if __name__ == "__main__":
    asyncio.run(seed())
