import asyncio
import re
from app.database import engine, async_session, Base
from app.models import Settlement


async def load():
    # Создаём таблицы, если их ещё нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Читаю локальный файл coord_cities_belarus.sql...")
    with open("coord_cities_belarus.sql", "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Находим строки, начинающиеся с 'INSERT INTO `coord_cities_belarus` VALUES'
    # и извлекаем все значения в скобках
    pattern = re.compile(
        r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'"
    )

    records = []
    for line in lines:
        match = pattern.search(line)
        if match:
            # match.groups() = (id, name, obl, raion, sovet, tip)
            records.append(match.groups())

    print(f"Найдено {len(records)} записей. Загружаю в базу данных...")

    async with async_session() as session:
        for idx, rec in enumerate(records, 1):
            name = rec[1].strip()
            region = rec[2].strip()
            district = rec[3].strip()
            tip = rec[5].strip() if rec[5] else None

            if name:
                session.add(
                    Settlement(name=name, region=region, district=district, type=tip)
                )

            if idx % 5000 == 0:
                await session.commit()
                print(f"  Загружено {idx} записей...")

        await session.commit()
        print(f"Готово! Всего загружено {len(records)} населённых пунктов.")


if __name__ == "__main__":
    asyncio.run(load())
