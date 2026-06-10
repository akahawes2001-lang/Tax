"""
Миграция: добавляет недостающие колонки в таблицу users.
Запускать: python migate_add_columns.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL не найден в .env")
    sys.exit(1)

# Заменяем asyncpg на psycopg2 для синхронного подключения
sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

try:
    import psycopg2
except ImportError:
    print("❌ Установи psycopg2: pip install psycopg2-binary")
    sys.exit(1)

try:
    conn = psycopg2.connect(sync_url)
    cur = conn.cursor()

    # Проверяем, есть ли уже колонка is_verified
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_verified'
    """)
    if cur.fetchone():
        print("✅ Колонка is_verified уже существует, пропускаем")
    else:
        cur.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;")
        print("✅ Добавлена колонка is_verified")

    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='verification_token'
    """)
    if cur.fetchone():
        print("✅ Колонка verification_token уже существует, пропускаем")
    else:
        cur.execute("ALTER TABLE users ADD COLUMN verification_token VARCHAR UNIQUE;")
        print("✅ Добавлена колонка verification_token")

    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='password_reset_token'
    """)
    if cur.fetchone():
        print("✅ Колонка password_reset_token уже существует, пропускаем")
    else:
        cur.execute("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR UNIQUE;")
        print("✅ Добавлена колонка password_reset_token")

    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='password_reset_expires'
    """)
    if cur.fetchone():
        print("✅ Колонка password_reset_expires уже существует, пропускаем")
    else:
        cur.execute("ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP;")
        print("✅ Добавлена колонка password_reset_expires")

    conn.commit()
    print("\n🎉 Миграция завершена успешно!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)