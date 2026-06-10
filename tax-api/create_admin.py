"""Создать админа напрямую в БД."""
import asyncio
import asyncpg
import bcrypt
import uuid

async def main():
    conn = await asyncpg.connect('postgresql://postgres:Renelo78242001@localhost:5432/tax_calculator')
    
    email = 'akahawes1@mail.ru'
    password = 'AdminPass2025!'
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    await conn.execute("""
        INSERT INTO users (email, hashed_password, role, is_verified, is_active)
        VALUES ($1, $2, 'admin', TRUE, TRUE)
        ON CONFLICT (email) DO UPDATE 
        SET role = 'admin', is_verified = TRUE, hashed_password = $2
    """, email, hashed)
    
    print(f"✅ Админ создан: {email}")
    
    rows = await conn.fetch('SELECT id, email, role, is_verified FROM users')
    for r in rows:
        print(f"  ID: {r['id']}, Email: {r['email']}, Role: {r['role']}, Verified: {r['is_verified']}")
    
    await conn.close()

asyncio.run(main())