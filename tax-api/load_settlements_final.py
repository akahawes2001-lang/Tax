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
        content = f.read()

    # Удаляем обратные кавычки (MySQL-синтаксис)
    content = content.replace("`", "")

    # Ищем все строки, содержащие данные в скобках.
    # Шаблон: (число, 'строка', 'строка', 'строка', 'строка', 'строка', ...)
    # Мы будем искать все совпадения вида ( 123 , 'Название' , 'Область' , 'Район' , ...
    pattern = re.compile(
        r"\(\s*(\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'",
        re.DOTALL,
    )

    records = pattern.findall(content)
    print(f"Найдено {len(records)} записей. Загружаю в базу данных...")

    async with async_session() as session:
        for idx, rec in enumerate(records, 1):
            # rec = (id, name, obl, raion, sovet, tip)
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
