import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

# Получаем параметры подключения из DATABASE_URL
database_url = os.getenv("DATABASE_URL")
# Преобразуем asyncpg-URL в обычный postgresql-URL для psycopg2
# Формат: postgresql+asyncpg://user:pass@host:port/dbname
if database_url and database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")

if not database_url:
    print("Ошибка: DATABASE_URL не найден в .env")
    exit(1)

print("Подключаюсь к базе данных...")

# Подключаемся к базе
conn = psycopg2.connect(database_url)
conn.autocommit = True
cur = conn.cursor()

# 1. Читаем SQL-файл и выполняем его
print("Читаю coord_cities_belarus.sql...")
with open("coord_cities_belarus.sql", "r", encoding="utf-8") as f:
    sql_content = f.read()

print("Выполняю SQL-запросы (создание таблицы bel_cities и вставка данных)...")
try:
    cur.execute(sql_content)
    print("Таблица bel_cities создана и заполнена.")
except Exception as e:
    print(f"Ошибка при выполнении SQL: {e}")
    conn.close()
    exit(1)

# 2. Переносим данные из bel_cities в settlements
print("Переношу данные в таблицу settlements...")
try:
    cur.execute("""
        INSERT INTO settlements (name, region, district, type)
        SELECT 
            name,
            obl AS region,
            raion AS district,
            tip AS type
        FROM bel_cities
    """)
    conn.commit()
    print("Данные успешно перенесены в таблицу settlements.")
except Exception as e:
    print(f"Ошибка при переносе данных: {e}")
    conn.rollback()

# 3. Проверяем количество записей
cur.execute("SELECT count(*) FROM settlements")
count = cur.fetchone()[0]
print(f"Всего населённых пунктов загружено: {count}")

# 4. Удаляем временную таблицу (опционально)
# cur.execute("DROP TABLE IF EXISTS bel_cities")
# print("Временная таблица удалена.")

cur.close()
conn.close()
print("Готово!")
