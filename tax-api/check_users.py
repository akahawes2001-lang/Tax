"""Проверка пользователей в БД."""
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:Renelo78242001@localhost:5432/tax_calculator')
    rows = await conn.fetch('SELECT id, email, role, is_verified FROM users')
    if rows:
        for r in rows:
            print(f"ID: {r['id']}, Email: {r['email']}, Role: {r['role']}, Verified: {r['is_verified']}")
    else:
        print("Нет пользователей в БД")
    await conn.close()

asyncio.run(main())