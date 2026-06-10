import asyncio
import re
from sqlalchemy import text
from app.database import engine, async_session, Base
from app.models import Settlement

# Областные центры, которые должны быть обязательно
MANDATORY_CITIES = [
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
]


async def load():
    # 1. Убедимся, что таблица существует (на случай первого запуска)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Читаем SQL-файл
    print("Читаю coord_cities_belarus.sql...")
    with open("coord_cities_belarus.sql", "r", encoding="utf-8") as f:
        content = f.read()

    # Убираем обратные кавычки (MySQL-синтаксис)
    content = content.replace("`", "")

    # Ищем все строки с данными: (число, 'название', ...)
    pattern = re.compile(
        r"\(\s*(\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'",
        re.DOTALL,
    )
    records = pattern.findall(content)
    print(f"Найдено {len(records)} записей в SQL-файле.")

    # 3. Загружаем только новые названия
    added = 0
    skipped = 0
    async with async_session() as session:
        for rec in records:
            name = rec[1].strip()
            if not name:
                continue

            # Проверяем, есть ли уже такое название
            existing = await session.execute(
                text("SELECT id FROM settlements WHERE name = :name"), {"name": name}
            )
            if existing.first() is None:
                session.add(
                    Settlement(
                        name=name,
                        region=rec[2].strip(),
                        district=rec[3].strip(),
                        type=rec[5].strip() if rec[5] else None,
                    )
                )
                added += 1
                # Коммит каждые 5000 записей
                if added % 5000 == 0:
                    await session.commit()
                    print(f"  Загружено {added} новых записей...")
            else:
                skipped += 1

        # Финальный коммит
        await session.commit()
        print(
            f"Загрузка завершена: добавлено {added} записей, пропущено {skipped} (уже существовали)."
        )

    # 4. Добавляем обязательные областные центры
    async with async_session() as session:
        added_cities = 0
        for city in MANDATORY_CITIES:
            existing = await session.execute(
                text("SELECT id FROM settlements WHERE name = :name"),
                {"name": city["name"]},
            )
            if existing.first() is None:
                session.add(Settlement(**city))
                added_cities += 1
        if added_cities:
            await session.commit()
            print(f"Добавлено {added_cities} областных центров.")
        else:
            print("Все областные центры уже присутствуют.")

    # 5. Итоговое количество
    async with async_session() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM settlements"))
        count = result.scalar()
        print(f"Готово! Всего записей в таблице: {count}")


if __name__ == "__main__":
    asyncio.run(load())
