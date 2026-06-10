"""
Миграция: добавляет колонку author_name в таблицу reviews.
Запуск: python migrate_add_author_name.py
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SYNC_URL = DATABASE_URL.replace("+asyncpg", "")

conn = psycopg2.connect(SYNC_URL)
conn.autocommit = True
cur = conn.cursor()

# Проверяем, существует ли колонка
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'author_name'
""")
existing = cur.fetchone()

if existing:
    print("✅ Колонка author_name уже существует в таблице reviews")
else:
    cur.execute("ALTER TABLE reviews ADD COLUMN author_name VARCHAR NOT NULL DEFAULT ''")
    print("✅ Колонка author_name добавлена в таблицу reviews")

cur.close()
conn.close()