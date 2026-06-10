import asyncio
import csv
from app.database import engine, async_session, Base
from app.models import DogBreed
from sqlalchemy import text


async def import_breeds():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Открываем с автоматическим удалением BOM
        with open("my_breeds.csv", "r", encoding="utf-8-sig") as f:
            # Считаем первые несколько байт, чтобы вывести заголовки для диагностики
            sample = f.read(1024)
            f.seek(0)
            reader = csv.DictReader(f)
            columns = reader.fieldnames
            print(f"Найдены столбцы: {columns}")

            added = 0
            for row in reader:
                # Пробуем найти имя породы, не привязываясь к точному регистру
                name = None
                for key in row:
                    if key.lower().strip() == "name":
                        name = row[key].strip()
                        break
                if not name:
                    continue

                # То же для признака опасности
                raw_status = "false"
                for key in row:
                    if key.lower().strip() == "is_dangerous":
                        raw_status = row[key].strip().lower()
                        break

                if raw_status == "true":
                    is_dangerous = True
                    regulation_status = "current"
                elif raw_status == "true_new":
                    is_dangerous = True
                    regulation_status = "projected"
                else:
                    is_dangerous = False
                    regulation_status = "current"

                # Проверка на существование
                exists = await session.execute(
                    text("SELECT id FROM dog_breeds WHERE name = :name"), {"name": name}
                )
                if exists.first() is None:
                    session.add(
                        DogBreed(
                            name=name,
                            is_dangerous=is_dangerous,
                            regulation_status=regulation_status,
                        )
                    )
                    added += 1
            await session.commit()
            print(f"Импорт завершён! Добавлено {added} пород.")


if __name__ == "__main__":
    asyncio.run(import_breeds())
