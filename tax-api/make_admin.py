"""
Назначение прав администратора пользователю по email.
Запуск: python make_admin.py akahawes1@mail.ru
"""
import sys
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

if len(sys.argv) < 2:
    print("Использование: python make_admin.py <email>")
    sys.exit(1)

email = sys.argv[1]

DATABASE_URL = os.getenv("DATABASE_URL")
SYNC_URL = DATABASE_URL.replace("+asyncpg", "")

print(f"Подключение к БД...")
conn = psycopg2.connect(SYNC_URL)
conn.autocommit = True
cur = conn.cursor()

# Проверяем, существует ли пользователь
cur.execute("SELECT id, email, role FROM users WHERE email = %s", (email,))
user = cur.fetchone()

if not user:
    print(f"❌ Пользователь с email '{email}' не найден.")
    cur.close()
    conn.close()
    sys.exit(1)

user_id, user_email, current_role = user
print(f"Найден пользователь: id={user_id}, email={user_email}, текущая роль={current_role}")

if current_role == 'admin':
    print(f"⚠️ Пользователь '{email}' уже имеет права администратора.")
else:
    cur.execute("UPDATE users SET role = 'admin' WHERE id = %s", (user_id,))
    print(f"✅ Пользователю '{email}' назначены права администратора!")

# Проверяем результат
cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
new_role = cur.fetchone()[0]
print(f"   Новая роль в БД: {new_role}")

cur.close()
conn.close()