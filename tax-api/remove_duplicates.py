import asyncio
from sqlalchemy import text
from app.database import engine, async_session


async def remove_duplicates():
    async with engine.begin() as conn:
        # Удаляем дубликаты: оставляем запись с минимальным id для каждого name
        await conn.execute(text("""
            DELETE FROM settlements
            WHERE id NOT IN (
                SELECT min(id)
                FROM settlements
                GROUP BY name
            )
        """))
    print("Дубликаты удалены.")


if __name__ == "__main__":
    asyncio.run(remove_duplicates())
