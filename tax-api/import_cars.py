import asyncio
import csv
import re
from app.database import engine, async_session, Base
from app.models import CarReference

# Официальный перечень люксовых марок и моделей (из постановления №194)
LUXURY_RULES = [
    # (марка, модель или префикс, максимальный возраст)
    ("Audi", "A8", 3),
    ("Audi", "Q8", 5),
    ("Audi", "R8", 5),
    ("Audi", "RS6", 3),
    ("Audi", "RS7", 4),
    ("Audi", "RSQ8", 5),
    ("Audi", "S8", 5),
    ("Audi", "SQ8", 5),
    ("Aston Martin", None, 10),
    ("Aurus", None, 5),
    ("Bentley", None, 10),
    ("BMW", "7", 3),
    ("BMW", "8", 3),
    ("BMW", "M5", 3),
    ("BMW", "M6", 4),
    ("BMW", "M7", 4),
    ("BMW", "M8", 4),
    ("BMW", "X6", 3),
    ("BMW", "X7", 5),
    ("BMW", "XM", 4),
    ("Bugatti", None, 10),
    ("Cadillac", "Escalade", 3),
    ("Ferrari", None, 10),
    ("Lamborghini", None, 10),
    ("Land Rover", "Range Rover", 4),
    ("Land Rover", "Range Rover Sport", 4),
    ("Lexus", "LC", 3),
    ("Lexus", "LS", 3),
    ("Lexus", "LX", 5),
    ("Maserati", None, 10),
    ("McLaren", None, 10),
    ("Mercedes-Benz", "AMG E", 3),
    ("Mercedes-Benz", "GLE Coupe", 4),
    ("Mercedes-Benz", "AMG S", 5),
    ("Mercedes-Benz", "AMG SL", 5),
    ("Mercedes-Benz", "AMG G", 5),
    ("Mercedes-Benz", "AMG GT", 5),
    ("Mercedes-Benz", "AMG GLE", 5),
    ("Mercedes-Benz", "AMG GLS", 5),
    ("Mercedes-Benz", "G", 5),
    ("Mercedes-Benz", "GLS", 5),
    ("Mercedes-Benz", "S", 5),
    ("Mercedes-Benz", "SL", 5),
    ("Mercedes-Benz", "Maybach", 10),
    ("Porsche", None, 5),
    ("Rolls-Royce", None, 10),
    ("Toyota", "Land Cruiser 300", 5),
    ("Toyota", "Sequoia", 4),
]


def is_luxury(brand: str, model: str) -> bool:
    """Проверяет, относится ли автомобиль к люксовым."""
    brand_lower = brand.strip().lower()
    model_lower = model.strip().lower()
    for rule_brand, rule_model, _ in LUXURY_RULES:
        if brand_lower == rule_brand.lower():
            if rule_model is None:
                return True
            # Проверяем, начинается ли модель с указанного префикса
            if model_lower.startswith(rule_model.lower()):
                return True
    return False


async def import_cars():
    # Пересоздаём таблицу
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    print("Читаю cars.csv...")
    with open("cars.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Найдено {len(rows)} записей. Загружаю...")

    async with async_session() as session:
        count = 0
        for row in rows:
            try:
                brand = row.get("Manufacturer", "").strip()
                model = row.get("Model", "").strip()
                mass_str = row.get("Curb weight (kg)", "").strip()
                if not brand or not model or not mass_str:
                    continue
                mass = float(mass_str)
                if mass <= 0:
                    continue
                luxury = is_luxury(brand, model)

                session.add(
                    CarReference(
                        brand=brand,
                        model=model,
                        generation=row.get("Generation", "").strip() or None,
                        engine=row.get("Engine (cm3)", "").strip() or None,
                        mass=mass,
                        is_luxury=luxury,
                    )
                )
                count += 1
                if count % 5000 == 0:
                    await session.commit()
                    print(f"  Загружено {count} записей...")
            except Exception:
                continue
        await session.commit()
        print(f"Готово! Загружено {count} автомобилей в справочник.")


if __name__ == "__main__":
    asyncio.run(import_cars())
