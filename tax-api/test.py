from dotenv import load_dotenv
import os

# Загружаем переменные из .env
load_dotenv()

# Читаем DATABASE_URL
database_url = os.getenv("DATABASE_URL")

if database_url:
    print(f"DATABASE_URL загружена: {database_url}")
else:
    print("DATABASE_URL не найдена в .env файле")
    exit(1)

# Проверяем, можно ли подключиться с помощью этой строки (через синхронный драйвер)
import psycopg2

try:
    # psycopg2 ожидает строку без "asyncpg+", поэтому удалим эту часть
    clean_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg2.connect(clean_url)
    print("Подключение по DATABASE_URL успешно!")
    conn.close()
except Exception as e:
    print(f"Ошибка подключения: {e}")