import asyncio
from sqlalchemy import text
from app.database import engine, async_session, Base
from app.models import Settlement

# Список городов, которые нужно точно добавить
MAJOR_CITIES = [
    # Областные центры
    {"name": "Минск", "region": "Минская", "district": "Минский", "type": "г"},
    {"name": "Брест", "region": "Брестская", "district": "Брестский", "type": "г"},
    {"name": "Витебск", "region": "Витебская", "district": "Витебский", "type": "г"},
    {"name": "Гомель", "region": "Гомельская", "district": "Гомельский", "type": "г"},
    {"name": "Гродно", "region": "Гродненская", "district": "Гродненский", "type": "г"},
    {
        "name": "Могилёв",
        "region": "Могилёвская",
        "district": "Могилёвский",
        "type": "г",
    },
    # Крупные города (можно добавить сколько угодно)
    {
        "name": "Барановичи",
        "region": "Брестская",
        "district": "Барановичский",
        "type": "г",
    },
    {
        "name": "Бобруйск",
        "region": "Могилёвская",
        "district": "Бобруйский",
        "type": "г",
    },
    {"name": "Борисов", "region": "Минская", "district": "Борисовский", "type": "г"},
    {"name": "Пинск", "region": "Брестская", "district": "Пинский", "type": "г"},
    {"name": "Орша", "region": "Витебская", "district": "Оршанский", "type": "г"},
    {
        "name": "Молодечно",
        "region": "Минская",
        "district": "Молодечненский",
        "type": "г",
    },
    {"name": "Лида", "region": "Гродненская", "district": "Лидский", "type": "г"},
    {"name": "Солигорск", "region": "Минская", "district": "Солигорский", "type": "г"},
]


async def add_cities():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        added = 0
        for city in MAJOR_CITIES:
            # Проверяем, есть ли уже такой город
            result = await session.execute(
                text("SELECT id FROM settlements WHERE name = :name"),
                {"name": city["name"]},
            )
            if result.first() is None:
                session.add(
                    Settlement(
                        name=city["name"],
                        region=city.get("region"),
                        district=city.get("district"),
                        type=city.get("type"),
                    )
                )
                added += 1
        await session.commit()
    print(f"Добавлено {added} городов.")


if __name__ == "__main__":
    asyncio.run(add_cities())
