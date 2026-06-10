"""Миграция: добавить колонки totp_secret и is_2fa_enabled в таблицу users."""
import asyncio
import asyncpg
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:Renelo78242001@localhost:5432/tax_calculator")

async def main():
    # Преобразуем URL в формат asyncpg
    url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(url)
    
    # Проверяем, существует ли колонка
    row = await conn.fetchrow(
        "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='totp_secret'"
    )
    if not row:
        await conn.execute("ALTER TABLE users ADD COLUMN totp_secret VARCHAR")
        print("✅ Колонка totp_secret добавлена")
    else:
        print("ℹ️ Колонка totp_secret уже существует")
    
    row = await conn.fetchrow(
        "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='is_2fa_enabled'"
    )
    if not row:
        await conn.execute("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT FALSE")
        print("✅ Колонка is_2fa_enabled добавлена")
    else:
        print("ℹ️ Колонка is_2fa_enabled уже существует")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())