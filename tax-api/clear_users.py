"""
Очистка всех пользователей, истории расчётов и отзывов.
Запуск: python clear_users.py
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# postgresql+asyncpg://postgres:password@localhost:5432/tax_calculator
# -> postgresql://postgres:password@localhost:5432/tax_calculator
SYNC_URL = DATABASE_URL.replace("+asyncpg", "")

print(f"Подключение к БД: {SYNC_URL[:40]}...")

conn = psycopg2.connect(SYNC_URL)
conn.autocommit = True
cur = conn.cursor()

# Получаем количество записей до очистки
cur.execute("SELECT COUNT(*) FROM users")
users_before = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM calculation_history")
history_before = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM reviews")
reviews_before = cur.fetchone()[0]

print(f"\nДо очистки:")
print(f"  Пользователей: {users_before}")
print(f"  Историй расчётов: {history_before}")
print(f"  Отзывов: {reviews_before}")

# Удаляем в правильном порядке (сначала дочерние таблицы)
cur.execute("DELETE FROM calculation_history")
deleted_history = cur.rowcount
cur.execute("DELETE FROM reviews")
deleted_reviews = cur.rowcount
cur.execute("DELETE FROM users")
deleted_users = cur.rowcount

print(f"\nУдалено:")
print(f"  Пользователей: {deleted_users}")
print(f"  Историй расчётов: {deleted_history}")
print(f"  Отзывов: {deleted_reviews}")

# Проверяем, что всё чисто
cur.execute("SELECT COUNT(*) FROM users")
users_after = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM calculation_history")
history_after = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM reviews")
reviews_after = cur.fetchone()[0]

print(f"\nПосле очистки:")
print(f"  Пользователей: {users_after}")
print(f"  Историй расчётов: {history_after}")
print(f"  Отзывов: {reviews_after}")

if users_after == 0 and history_after == 0 and reviews_after == 0:
    print("\n✅ База данных успешно очищена!")
else:
    print("\n⚠️ Некоторые данные не удалились, проверьте вручную.")

cur.close()
conn.close()