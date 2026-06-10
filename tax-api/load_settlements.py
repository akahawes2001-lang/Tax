import asyncio
import requests
from app.database import engine, async_session, Base
from app.models import Settlement

# Прямая ссылка на JSON-файл с городами Беларуси
JSON_URL = "https://raw.githubusercontent.com/jug-it/geolocation-cities/master/data/cities_belarus.json"


async def load():
    # Создаём таблицы, если их ещё нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Скачиваю файл с населёнными пунктами...")
    response = requests.get(JSON_URL)
    response.encoding = "utf-8"
    data = response.json()

    print(f"Загружаю {len(data)} записей в базу данных...")
    async with async_session() as session:
        for item in data:
            session.add(
                Settlement(
                    name=item.get("name"),
                    region=item.get("region"),
                    district=item.get("district"),
                    type=item.get("type"),
                    population=item.get("population"),
                )
            )
        await session.commit()
    print("Готово! Все населённые пункты загружены.")


if __name__ == "__main__":
    asyncio.run(load())
