"""
Финальный аудит TaxBel API v3 — исправленные проверки
Запуск: cd tax-api && python final_audit.py
"""

import requests
import json
import sys
import time
import random

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0
ERRORS = []
REPORT = []

def check(name, condition, expected_desc, actual_str):
    global PASS, FAIL
    if condition:
        PASS += 1
        status = "✓ ПРОЙДЕН"
    else:
        FAIL += 1
        status = "✗ НЕ ПРОЙДЕН"
        ERRORS.append((name, expected_desc, actual_str[:300]))
    line = f"{status}: {name}"
    REPORT.append(line)
    print(f"  {status}")
    print(f"    Ожидалось: {expected_desc}")
    print(f"    Факт: {actual_str[:300]}")
    print()

def api_post(path, data):
    url = f"{BASE}{path}"
    try:
        r = requests.post(url, json=data, timeout=10)
        body = r.json() if r.text else {}
        return r.status_code, body
    except Exception as e:
        return 0, {"error": str(e)}

# ============================================================
print("=" * 60)
print("ФИНАЛЬНЫЙ АУДИТ TAXBEL API")
print("=" * 60)
print()

# ============================================================
print("[1/18] Налог на доходы (income-tax)")
status, body = api_post("/api/v1/calculate-income-tax", {
    "monthly_incomes": [{
        "month": 1, "year": 2024,
        "salary": 5000,
        "medical_expenses": 500,
        "medicine_expenses": 300,
        "alimony_paid": 2000,
        "charity_amount": 1000
    }]
})
cond = isinstance(body, dict) and "final_tax" in body
check("Income Tax", cond, "final_tax в ответе", str(body))

# ============================================================
print("[2/18] Транспортный налог (авто 1400 кг)")
status, body = api_post("/api/v1/calculate-transport-tax", {
    "vehicles": [{
        "vehicle_type": "car",
        "mass": 1.4,
        "year_of_manufacture": 2023,
        "tax_year": 2025
    }]
})
cond = isinstance(body, dict) and "total_tax" in body
check("Transport Tax авто", cond, "total_tax в ответе", str(body))

# ============================================================
print("[3/18] Налог на собак (Немецкая овчарка)")
status, body = api_post("/api/v1/calculate-dog-tax", {
    "breed_type": "Немецкая овчарка",
    "year": 2026,
    "number_of_dogs": 1,
    "quarters": 1
})
# 2026 dangerous rate = 67
cond = isinstance(body, dict) and body.get("total_tax", 0) == 67
check("Dog Tax Немецкая овчарка", cond, "total_tax = 67", str(body))

# ============================================================
print("[4/18] Налог на недвижимость")
status, body = api_post("/api/v1/calculate-property-tax", {
    "property_type": "apartment",
    "cadastral_value": 100000,
    "region": "Минск"
})
cond = isinstance(body, dict) and "calculated_tax" in body
check("Property Tax квартира", cond, "calculated_tax в ответе", str(body))

# ============================================================
print("[5/18] Земельный налог (без льгот)")
status, body = api_post("/api/v1/land-tax/calculate", {
    "cadastral_value": 200000,
    "land_category": "residential",
    "region": "Минская",
    "area_hectares": 0.15
})
cond = isinstance(body, dict) and "tax_amount" in body
check("Land Tax без льгот", cond, "tax_amount в ответе", str(body))

print("[5b/18] Земельный налог (is_disabled=true)")
status, body = api_post("/api/v1/land-tax/calculate", {
    "cadastral_value": 200000,
    "land_category": "residential",
    "region": "Минская",
    "area_hectares": 0.15,
    "is_disabled": True
})
cond = isinstance(body, dict) and body.get("tax_amount", 999) == 0
check("Land Tax льгота", cond, "tax_amount = 0", str(body))

# ============================================================
print("[6/18] Налог на ремесло")
status, body = api_post("/api/v1/craft-tax/calculate", {
    "is_craftsman": True,
    "year": 2025
})
cond = isinstance(body, dict) and "tax_amount" in body
check("Craft Tax", cond, "tax_amount в ответе", str(body))

# ============================================================
print("[7/18] Налог на агро")
status, body = api_post("/api/v1/agro-tax/calculate", {
    "is_agro_owner": True,
    "year": 2025
})
cond = isinstance(body, dict) and "tax_amount" in body
check("Agro Tax", cond, "tax_amount в ответе", str(body))

# ============================================================
print("[8/18] Налог на аренду (Минск, квартира, 1 мес)")
status, body = api_post("/api/v1/calculate-rental-tax", {
    "city": "Минск",
    "property_type": "apartment",
    "months": 1
})
cond = isinstance(body, dict) and "total_tax" in body
check("Rental Tax Минск", cond, "total_tax в ответе", str(body))

# ============================================================
print("[9/18] Налог на криптовалюту")
status, body = api_post("/api/v1/calculate-crypto-tax", {
    "gross_income": 10000
})
cond = isinstance(body, dict) and "tax" in body
check("Crypto Tax", cond, "tax в ответе", str(body))

# ============================================================
print("[10/18] Налог при продаже (авто)")
status, body = api_post("/api/v1/calculate-property-sale-tax", {
    "property_type": "auto",
    "sale_price": 20000,
    "acquisition_cost": 15000
})
cond = isinstance(body, dict) and "tax" in body
check("Property Sale Tax", cond, "tax в ответе", str(body))

# ============================================================
print("[11/18] Единый налог ИП (без льготы)")
status, body = api_post("/api/v1/ip-tax/calculate", {
    "activity_type": "retail_food",
    "city_type": "minsk",
    "is_preferential": False
})
cond = isinstance(body, dict) and body.get("tax_amount", 0) > 0
check("IP Tax без льготы", cond, "tax_amount > 0", str(body))

# ============================================================
print("[12/18] Единый налог ИП (со льготой)")
status, body = api_post("/api/v1/ip-tax/calculate", {
    "activity_type": "retail_food",
    "city_type": "minsk",
    "is_preferential": True
})
cond = isinstance(body, dict) and body.get("tax_amount", 0) > 0
check("IP Tax со льготой", cond, "tax_amount > 0", str(body))

# ============================================================
print("[13/18] Налог на вклады (множественные)")
status, body = api_post("/api/v1/calculate-deposit-tax", {
    "deposits": [
        {"amount": 10000, "currency": "BYN", "annual_rate_percent": 5, "term_days": 180},
        {"amount": 5000, "currency": "USD", "annual_rate_percent": 3, "term_days": 365}
    ],
    "annual_income": 60000
})
cond = isinstance(body, dict) and "deposits_details" in body and "total_tax" in body
check("Deposit Tax множ.вклады", cond, "deposits_details + total_tax", str(body))

# ============================================================
print("[14/18] Транспортный налог (яхта)")
status, body = api_post("/api/v1/calculate-transport-tax", {
    "vehicles": [{
        "vehicle_type": "yacht",
        "power_hp": 100,
        "mass": 0,
        "year_of_manufacture": 2023,
        "tax_year": 2025
    }]
})
cond = isinstance(body, dict) and "total_tax" in body
check("Transport Tax яхта", cond, "total_tax в ответе", str(body))

# ============================================================
print("[15/18] Транспортный налог (самолёт)")
status, body = api_post("/api/v1/calculate-transport-tax", {
    "vehicles": [{
        "vehicle_type": "airplane",
        "takeoff_weight": 800,
        "mass": 0,
        "year_of_manufacture": 2023,
        "tax_year": 2025
    }]
})
cond = isinstance(body, dict) and "total_tax" in body
check("Transport Tax самолёт", cond, "total_tax в ответе", str(body))

# ============================================================
# AUTH FLOW
# ============================================================
print("[16/18] Регистрация нового пользователя")
suffix = random.randint(1000, 9999)
email = f"audit_user{suffix}@test.by"
password = "TestPass123!"

status, body = api_post("/api/v1/auth/register", {
    "email": email, "password": password
})
cond = isinstance(body, dict) and ("message" in body or "verification_token" in body)
check("Register", cond, "message/verification_token", str(body))

verify_token = body.get("verification_token") if isinstance(body, dict) else None
print(f"    verification_token: {'получен' if verify_token else 'НЕ ПОЛУЧЕН'}")

# Verify email
print()
print("[16b/18] Подтверждение email")
if verify_token:
    status, body = api_post("/api/v1/auth/verify-email", {"token": verify_token})
    cond = status == 200
    check("Verify email", cond, "status 200", str(body))
else:
    print("  Пропускаем")

# Login
print()
print("[16c/18] Login")
status, body = api_post("/api/v1/auth/login", {"email": email, "password": password})
cond = isinstance(body, dict) and "access_token" in body
check("Login", cond, "access_token в ответе", str(body))
token = body.get("access_token") if isinstance(body, dict) else None

# Request password reset
print()
print("[17/18] Запрос сброса пароля")
status, body = api_post("/api/v1/auth/request-password-reset", {"email": email})
cond = status == 200
check("Request password reset", cond, "status 200", str(body))
reset_token = body.get("reset_token") if isinstance(body, dict) else None

# Reset password
print()
print("[17b/18] Сброс пароля")
new_password = "NewPass456!"
if reset_token:
    status, body = api_post("/api/v1/auth/reset-password", {
        "token": reset_token, "new_password": new_password
    })
    cond = status == 200
    check("Reset password", cond, "status 200", str(body))
else:
    print("  Пропускаем reset — нет токена")

# Login with new password
print()
print("[17c/18] Login с новым паролем")
if reset_token:
    status, body = api_post("/api/v1/auth/login", {"email": email, "password": new_password})
    cond = isinstance(body, dict) and "access_token" in body
    check("Login с новым паролем", cond, "access_token в ответе", str(body))
    token = body.get("access_token") if isinstance(body, dict) else None

# ============================================================
# History
# ============================================================
print()
print("[18/18] История (GET /api/v1/history)")
if token:
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{BASE}/api/v1/history", headers=headers, timeout=10)
        body2 = r.json() if r.text else {}
        cond = isinstance(body2, dict) and "items" in body2
        check("History GET", cond, "items в ответе", str(body2)[:300])
    except Exception as e:
        check("History GET", False, f"Error: {e}", str(e))
else:
    check("History GET (нет токена)", False, "токен отсутствует", "no token")

# ============================================================
# RESULTS
# ============================================================
print()
print("=" * 60)
print("РЕЗУЛЬТАТЫ АУДИТА")
print("=" * 60)
print(f"Всего тестов: {PASS + FAIL}")
print(f"Пройдено: {PASS}")
print(f"НЕ пройдено: {FAIL}")
print()

if ERRORS:
    print("ОШИБКИ:")
    for name, expected, actual in ERRORS:
        print(f"  ✗ {name}")
        print(f"    Ожидалось: {expected}")
        print(f"    Факт: {actual}")
    print()

if FAIL == 0:
    print("✓ ВСЕ ТЕСТЫ ПРОЙДЕНЫ")
else:
    print(f"✗ {FAIL} тестов не пройдено")

print()
print("Детальный отчёт:")
for line in REPORT:
    print(line)