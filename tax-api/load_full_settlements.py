import asyncio
import re
import requests
from app.database import engine, async_session, Base
from app.models import Settlement

# Прямая ссылка на raw SQL-файл
SQL_URL = "https://raw.githubusercontent.com/jug-it/geolocation-cities/master/coord_cities_belarus.sql"


async def load():
    # Создаём таблицы, если их ещё нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Скачиваю SQL-файл с полным списком населённых пунктов...")
    response = requests.get(SQL_URL)
    response.encoding = "utf-8"
    sql_content = response.text

    # Извлекаем строки INSERT
    insert_match = re.search(
        r"INSERT INTO `coord_cities_belarus` VALUES\n(.*?);", sql_content, re.DOTALL
    )
    if not insert_match:
        print("Не удалось найти INSERT-запрос в файле.")
        return

    insert_block = insert_match.group(1)
    # Ищем все строки вида (id, 'name', 'obl', 'raion', 'sovet', 'tip', ...)
    pattern = re.compile(
        r"\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'"
    )

    records = pattern.findall(insert_block)
    print(f"Найдено {len(records)} записей. Начинаю загрузку в базу данных...")

    async with async_session() as session:
        for idx, rec in enumerate(records, 1):
            # rec: (id, name, obl, raion, sovet, tip)
            name = rec[1].strip()
            region = rec[2].strip()
            district = rec[3].strip()
            tip = rec[5].strip() if rec[5] else None

            if name:
                session.add(
                    Settlement(name=name, region=region, district=district, type=tip)
                )

            # Коммитим пакетами по 5000 записей, чтобы не перегружать память
            if idx % 5000 == 0:
                await session.commit()
                print(f"  Загружено {idx} записей...")

        # Финальный коммит
        await session.commit()
        print(f"Готово! Всего загружено {len(records)} населённых пунктов.")


if __name__ == "__main__":
    asyncio.run(load())
