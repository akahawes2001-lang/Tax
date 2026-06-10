"""
Seed: добавляет ставки налога на собак для 2025 года в существующую БД.
"""
import asyncio
from app.database import async_session
from app.models import DogTaxRate

async def seed():
    async with async_session() as session:
        # Проверяем, есть ли уже 2025
        from sqlalchemy import select
        result = await session.execute(
            select(DogTaxRate).where(DogTaxRate.year == 2025)
        )
        existing = result.scalars().all()
        if existing:
            print(f"Ставки 2025 уже есть ({len(existing)}): {[(r.breed_type, r.rate_per_quarter) for r in existing]}")
        else:
            session.add(DogTaxRate(breed_type="dangerous", year=2025, rate_per_quarter=63))
            session.add(DogTaxRate(breed_type="non_dangerous", year=2025, rate_per_quarter=13))
            await session.commit()
            print("Ставки 2025 добавлены: dangerous=63, non_dangerous=13")

if __name__ == "__main__":
    asyncio.run(seed())