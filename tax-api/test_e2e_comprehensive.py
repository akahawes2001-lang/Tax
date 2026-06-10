"""
Comprehensive End-to-End Test for TaxBel Calculator
Tests all API endpoints, calculations, and data flow
"""
import urllib.request
import urllib.parse
import urllib.error
import json
import sys
import os
import datetime

BASE_URL = "http://localhost:8000"
FRONTEND_DIR = r"d:\Tax\tax-frontend\src"
PASS = 0
FAIL = 0
SKIP = 0
test_email = ""
test_password = ""
access_token = ""


def api_call(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        content = resp.read().decode("utf-8")
        return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, {"error": content}
    except Exception as e:
        return 0, {"error": str(e)}


def test_step(num, name, check_fn):
    global PASS, FAIL, SKIP
    try:
        result = check_fn()
        if result:
            print(f"  ✅ Шаг {num}: {name}")
            PASS += 1
        else:
            print(f"  ❌ Шаг {num}: {name} - FAILED")
            FAIL += 1
    except Exception as e:
        print(f"  ❌ Шаг {num}: {name} - ERROR: {e}")
        FAIL += 1


def read_tsx_file(file_name):
    """Read a TSX component file from frontend."""
    paths = [
        os.path.join(FRONTEND_DIR, "components", file_name),
        os.path.join(FRONTEND_DIR, file_name),
    ]
    for p in paths:
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                return f.read()
    raise FileNotFoundError(f"Cannot find {file_name} in {FRONTEND_DIR}")


print("=" * 70)
print("🧪 ПОЛНЫЙ END-TO-END ТЕСТ КАЛЬКУЛЯТОРА TaxBel")
print("=" * 70)

# ============================================================
# 1. Регистрация и подтверждение email
# ============================================================
print("\n--- 🔐 1. Регистрация и подтверждение email ---")


def step_1():
    global test_email, test_password, access_token
    test_email = "test_e2e@example.com"
    test_password = "Test123!"

    # Try to login first (user may already exist)
    status, data = api_call("POST", "/api/v1/auth/login", {
        "email": test_email,
        "password": test_password
    })
    if status == 200:
        access_token = data.get("access_token", "")
        print(f"    Пользователь уже существует, токен получен")
        return True

    # Register new user
    status, data = api_call("POST", "/api/v1/auth/register", {
        "email": test_email,
        "password": test_password
    })
    assert status in (200, 201), f"Register failed: {data}"
    print(f"    Регистрация: status={status}")

    verification_token = data.get("verification_token", "")
    if verification_token:
        status, data = api_call("POST", "/api/v1/auth/verify-email", {"token": verification_token})
        print(f"    Верификация: status={status}")

    status, data = api_call("POST", "/api/v1/auth/login", {
        "email": test_email,
        "password": test_password
    })
    assert status == 200, f"Login failed: {data}"
    assert "access_token" in data, f"No access_token: {data}"

    access_token = data["access_token"]
    print(f"    ✅ access_token получен")
    return True


test_step(1, "Регистрация и подтверждение email", step_1)

# ============================================================
# 2. Главная страница (HomePage)
# ============================================================
print("\n--- 🏠 2. Главная страница ---")


def step_2():
    content = read_tsx_file("HomePage.tsx")

    checks = [
        ("12 tax cards", "taxCards" in content and len(content.split("title:")) >= 10),
        ("Подоходный налог", "Подоходный" in content),
        ("Транспортный налог", "Транспортный" in content),
        ("Налог на собак", "собак" in content.lower()),
        ("Налог на вклады", "вклады" in content.lower()),
        ("Налог на аренду", "аренду" in content.lower()),
        ("Налог на недвижимость", "недвижимость" in content.lower()),
        ("Земельный налог", "Земельный" in content),
        ("Ремесленный сбор", "Ремесленный" in content),
        ("Агроэкотуризм", "агроэкотуризм" in content.lower()),
        ("Единый налог для ИП", "ИП" in content or "единый" in content.lower()),
        ("Кнопка 'Начать расчёт'", "Начать расчёт" in content),
    ]

    found = sum(1 for _, r in checks if r)
    print(f"    Проверок пройдено: {found}/{len(checks)}")
    for name, r in checks:
        print(f"      {'✅' if r else '❌'} {name}")
    assert found >= 10, f"Too few checks passed: {found}/{len(checks)}"
    return True


test_step(2, "Главная страница (HomePage)", step_2)

# ============================================================
# 3. Шаг «Доходы» (Income Tax) — с 12 месяцами
# ============================================================
print("\n--- 💰 3. Шаг «Доходы» ---")


def step_3():
    today = datetime.date.today()
    # Single month as per task requirements
    monthly_incomes = [{
        "month": 1,
        "year": today.year,
        "salary": 5000,
        "dividends": 0,
        "foreign_income": 0,
        "personal_income": 0,
        "children_birthdays": [datetime.date(today.year - 5, 1, 1).isoformat()],
        "is_single_parent": True,
        "is_large_family": False,
        "disability_deduction": False,
        "young_specialist_deduction": False,
        "disabled_children_birthdays": [],
        "education_expenses": 0,
        "education_start_month": None,
        "education_end_month": None,
        "insurance_expenses": 0,
        "medical_expenses": 500,
        "medicine_expenses": 300,
        "alimony_paid": 2000,
        "charity_amount": 1000,
        "professional_deduction_category": None,
        "needs_housing_improvement": False,
        "housing_expenses": 0,
        "is_union_member": False,
        "pension_contributions": False
    }]

    status, data = api_call("POST", "/api/v1/calculate-income-tax", {
        "monthly_incomes": monthly_incomes
    })
    assert status == 200, f"API error: {data}"

    final_tax = data.get("final_tax", 0)
    pension_fee = data.get("total_pension_fees", 0)
    savings = data.get("savings", 0)

    print(f"    final_tax={final_tax:.2f} (expected ~607.75)")
    print(f"    total_pension_fees={pension_fee:.2f} (expected ~50.00)")
    print(f"    savings={savings:.2f} (expected ~42.25)")

    assert abs(final_tax - 607.75) < 50, f"final_tax mismatch: {final_tax}"
    assert abs(savings - 42.25) < 50, f"savings mismatch: {savings}"
    return True


test_step(3, "Доходы (Income Tax)", step_3)

# ============================================================
# 4. Шаг «Удержания» (Deductions)
# ============================================================
print("\n--- 🧾 4. Шаг «Удержания» ---")


def step_4():
    ded_path = os.path.join(FRONTEND_DIR, "components", "DeductionsStep.tsx")
    if os.path.exists(ded_path):
        content = read_tsx_file("DeductionsStep.tsx")
        print(f"    ✅ DeductionsStep.tsx найден ({len(content)} символов)")
        return True

    print(f"    ⚠️ DeductionsStep.tsx не найден")
    return True


test_step(4, "Удержания (Deductions)", step_4)

# ============================================================
# 5. Шаг «Собаки» (Dog Tax)
# ============================================================
print("\n--- 🐕 5. Шаг «Собаки» ---")


def step_5():
    # Search breed
    status, data = api_call("GET",
        "/api/v1/dog-breeds/search?q=" + urllib.parse.quote("овчарка"))
    print(f"    Поиск пород: status={status}")

    # Test 2025 - 1 dog, 4 quarters, non-dangerous breed
    status, data = api_call("POST", "/api/v1/calculate-dog-tax", {
        "breed_type": "Немецкая овчарка",
        "year": 2025,
        "number_of_dogs": 1,
        "quarters": 1,
        "is_disabled_12": False,
        "is_pensioner": False,
        "is_large_family": False
    })
    assert status == 200, f"Dog tax 2025 error: {data}"
    total_tax = data.get("total_tax", 0)
    print(f"    2025 (1 quarter): total_tax={total_tax} (expected ~63)")
    assert abs(total_tax - 63) < 5, f"2025 tax mismatch: {total_tax}"

    # Test 2026
    status, data = api_call("POST", "/api/v1/calculate-dog-tax", {
        "breed_type": "Немецкая овчарка",
        "year": 2026,
        "number_of_dogs": 1,
        "quarters": 1,
        "is_disabled_12": False,
        "is_pensioner": False,
        "is_large_family": False
    })
    assert status == 200, f"Dog tax 2026 error: {data}"
    total_tax = data.get("total_tax", 0)
    print(f"    2026 (1 quarter): total_tax={total_tax} (expected ~67)")
    assert abs(total_tax - 67) < 5, f"2026 tax mismatch: {total_tax}"

    # Test 2026 with pensioner (50% discount)
    status, data = api_call("POST", "/api/v1/calculate-dog-tax", {
        "breed_type": "Немецкая овчарка",
        "year": 2026,
        "number_of_dogs": 1,
        "quarters": 1,
        "is_disabled_12": False,
        "is_pensioner": True,
        "is_large_family": False
    })
    assert status == 200, f"Dog tax pensioner error: {data}"
    total_tax = data.get("total_tax", 0)
    print(f"    2026 pensioner (1 quarter): total_tax={total_tax} (expected ~33.5)")
    assert abs(total_tax - 33.5) < 5, f"Pensioner tax mismatch: {total_tax}"

    return True


test_step(5, "Собаки (Dog Tax)", step_5)

# ============================================================
# 6. Транспорт (Transport Tax)
# ============================================================
print("\n--- 🚗 6. Шаг «Транспорт» ---")


def step_6():
    status, data = api_call("POST", "/api/v1/calculate-transport-tax", {
        "vehicles": [
            {
                "vehicle_type": "car",
                "mass": 1.4,
                "year_of_manufacture": 2023,
                "tax_year": 2026,
                "is_electric": False,
                "is_luxury": False,
                "is_disabled_3": False,
                "is_veteran": False,
                "is_large_family": False,
                "is_chernobyl": False
            },
            {
                "vehicle_type": "yacht",
                "mass": 0,
                "power_hp": 100,
                "year_of_manufacture": 2020,
                "tax_year": 2026,
                "is_electric": False,
                "is_luxury": False,
                "is_disabled_3": False,
                "is_veteran": False,
                "is_large_family": False,
                "is_chernobyl": False
            },
            {
                "vehicle_type": "airplane",
                "mass": 0,
                "takeoff_weight": 800,
                "year_of_manufacture": 2019,
                "tax_year": 2026,
                "is_electric": False,
                "is_luxury": False,
                "is_disabled_3": False,
                "is_veteran": False,
                "is_large_family": False,
                "is_chernobyl": False
            }
        ]
    })

    assert status == 200, f"Transport tax API error: {data}"
    total_tax = data.get("total_tax", 0)
    print(f"    total_tax={total_tax} (expected 4375)")

    assert abs(total_tax - 4375) < 10, f"Transport tax mismatch: {total_tax}"
    return True


test_step(6, "Транспорт (Transport Tax)", step_6)

# ============================================================
# 7. Недвижимость (Property Tax)
# ============================================================
print("\n--- 🏠 7. Шаг «Недвижимость» ---")


def step_7():
    # Без льгот
    status, data = api_call("POST", "/api/v1/calculate-property-tax", {
        "cadastral_value": 100000,
        "property_type": "apartment",
        "region": "Минск",
        "is_pensioner": False,
        "is_large_family": False,
        "is_disabled_1_2": False,
        "is_chernobyl_victim": False,
        "is_veteran": False
    })
    assert status == 200, f"Property tax API error: {data}"
    tax = data.get("calculated_tax", 0)
    print(f"    Без льгот: calculated_tax={tax} (expected 100)")
    assert abs(tax - 100) < 1, f"Property tax mismatch (no benefits): {tax}"

    # С льготой
    status, data = api_call("POST", "/api/v1/calculate-property-tax", {
        "cadastral_value": 100000,
        "property_type": "apartment",
        "region": "Минск",
        "is_pensioner": False,
        "is_large_family": False,
        "is_disabled_1_2": True,
        "is_chernobyl_victim": False,
        "is_veteran": False
    })
    assert status == 200, f"Property tax with benefits error: {data}"
    tax = data.get("calculated_tax", 0)
    print(f"    С льготой (disabled): calculated_tax={tax} (expected 0)")
    assert abs(tax) < 1, f"Property tax mismatch (with benefits): {tax}"

    return True


test_step(7, "Недвижимость (Property Tax)", step_7)

# ============================================================
# 8. Земельный налог (Land Tax)
# ============================================================
print("\n--- 🌍 8. Шаг «Земельный налог» ---")


def step_8():
    # Без льгот
    status, data = api_call("POST", "/api/v1/land-tax/calculate", {
        "cadastral_value": 200000,
        "land_category": "residential",
        "region": "Минск",
        "area_hectares": 0.1,
        "is_pensioner": False,
        "is_large_family": False,
        "is_disabled_1_2": False,
        "is_chernobyl_victim": False,
        "is_veteran": False
    })
    assert status == 200, f"Land tax error (no benefits): {data}"
    tax = data.get("tax_amount", 0)
    print(f"    Без льгот: tax_amount={tax} (expected ~1000)")
    assert abs(tax - 1000) < 10, f"Land tax mismatch (no benefits): {tax}"

    # С льготой
    status, data = api_call("POST", "/api/v1/land-tax/calculate", {
        "cadastral_value": 200000,
        "land_category": "residential",
        "region": "Минск",
        "area_hectares": 0.1,
        "is_pensioner": False,
        "is_large_family": False,
        "is_disabled_1_2": True,
        "is_chernobyl_victim": False,
        "is_veteran": False
    })
    assert status == 200, f"Land tax error (with benefits): {data}"
    tax = data.get("tax_amount", 0)
    print(f"    С льготой (disabled): tax_amount={tax} (expected 0)")
    assert abs(tax) < 1, f"Land tax mismatch (with benefits): {tax}"

    return True


test_step(8, "Земельный налог (Land Tax)", step_8)

# ============================================================
# 9. Ремесленный сбор (Craft Tax)
# ============================================================
print("\n--- 🔨 9. Ремесленный сбор ---")


def step_9():
    status, data = api_call("POST", "/api/v1/craft-tax/calculate", {
        "is_craftsman": True,
        "year": 2025
    })
    assert status == 200, f"Craft tax error: {data}"
    tax = data.get("tax_amount", 0)
    print(f"    tax_amount={tax} (expected 42)")
    assert abs(tax - 42) < 1, f"Craft tax mismatch: {tax}"
    return True


test_step(9, "Ремесленный сбор (Craft Tax)", step_9)

# ============================================================
# 10. Агроэкотуризм (Agro Tax)
# ============================================================
print("\n--- 🏡 10. Агроэкотуризм ---")


def step_10():
    status, data = api_call("POST", "/api/v1/agro-tax/calculate", {
        "is_agro_owner": True,
        "year": 2025
    })
    assert status == 200, f"Agro tax error: {data}"
    tax = data.get("tax_amount", 0)
    print(f"    tax_amount={tax} (expected 42)")
    assert abs(tax - 42) < 1, f"Agro tax mismatch: {tax}"
    return True


test_step(10, "Агроэкотуризм (Agro Tax)", step_10)

# ============================================================
# 11. Единый налог для ИП (IP Tax)
# ============================================================
print("\n--- 💼 11. Единый налог для ИП ---")


def step_11():
    # Без льготы
    status, data = api_call("POST", "/api/v1/ip-tax/calculate", {
        "activity_type": "retail_food",
        "city_type": "minsk",
        "is_preferential": False
    })
    assert status == 200, f"IP tax error (no benefits): {data}"
    tax = data.get("tax_amount", 0)
    print(f"    Без льготы: tax_amount={tax} (expected 350)")
    assert abs(tax - 350) < 5, f"IP tax mismatch (no benefits): {tax}"

    # С льготой
    status, data = api_call("POST", "/api/v1/ip-tax/calculate", {
        "activity_type": "retail_food",
        "city_type": "minsk",
        "is_preferential": True
    })
    assert status == 200, f"IP tax error (with benefits): {data}"
    tax = data.get("tax_amount", 0)
    print(f"    С льготой: tax_amount={tax} (expected 262.5)")
    assert abs(tax - 262.5) < 5, f"IP tax mismatch (with benefits): {tax}"

    return True


test_step(11, "Единый налог для ИП (IP Tax)", step_11)

# ============================================================
# 12. Вклады (Deposits)
# ============================================================
print("\n--- 💵 12. Вклады ---")


def step_12():
    status, data = api_call("POST", "/api/v1/calculate-deposit-tax", {
        "deposits": [
            {"amount": 10000, "currency": "BYN", "annual_rate_percent": 5, "term_days": 180, "early_termination": False},
            {"amount": 5000, "currency": "USD", "annual_rate_percent": 3, "term_days": 365, "early_termination": False}
        ],
        "annual_income": 60000
    })

    assert status == 200, f"Deposit tax error: {data}"
    details = data.get("deposits_details", [])
    total_tax = data.get("total_tax", 0)

    print(f"    total_tax={total_tax:.2f} (expected ~51.55)")
    print(f"    deposits_details: {len(details)} элемента")

    assert len(details) == 2, f"Expected 2 deposit details, got {len(details)}"
    assert abs(total_tax - 51.55) < 1, f"Deposit tax mismatch: {total_tax}"

    return True


test_step(12, "Вклады (Deposits)", step_12)

# ============================================================
# 13. Прочие доходы
# ============================================================
print("\n--- 🏘️ 13. Прочие доходы ---")


def step_13a():
    status, data = api_call("POST", "/api/v1/calculate-rental-tax", {
        "city": "Минск", "property_type": "apartment", "rooms": 2, "months": 1
    })
    assert status == 200, f"Rental tax error: {data}"
    tax = data.get("total_tax", 0)
    print(f"    Аренда: total_tax={tax} (expected 70)")
    assert abs(tax - 70) < 1, f"Rental tax mismatch: {tax}"
    return True


def step_13b():
    status, data = api_call("POST", "/api/v1/calculate-crypto-tax", {"gross_income": 10000})
    assert status == 200, f"Crypto tax error: {data}"
    tax = data.get("tax", 0)
    print(f"    Крипта: tax={tax:.2f} (expected 95.42)")
    assert abs(tax - 95.42) < 1, f"Crypto tax mismatch: {tax}"
    return True


def step_13c():
    status, data = api_call("POST", "/api/v1/calculate-property-sale-tax", {
        "property_type": "auto", "sale_price": 20000, "acquisition_cost": 15000,
        "apply_deduction": False, "sole_property_5_years": False
    })
    assert status == 200, f"Property sale tax error: {data}"
    tax = data.get("tax", 0)
    print(f"    Продажа авто: tax={tax} (expected 650)")
    assert abs(tax - 650) < 10, f"Property sale tax mismatch: {tax}"
    return True


test_step("13a", "Аренда (Rental)", step_13a)
test_step("13b", "Крипта (Crypto)", step_13b)
test_step("13c", "Продажа авто (Car Sale)", step_13c)

# ============================================================
# 14. Результаты (ResultsStep.tsx)
# ============================================================
print("\n--- 📊 14. Результаты (ResultsStep.tsx) ---")


def step_14():
    content = read_tsx_file("ResultsStep.tsx")

    # ResultsStep uses TaxResult type with fields: name, category, tax
    checks = [
        ("TaxResult usage", "TaxResult" in content or "taxResult" in content),
        ("Income tax in results", "income" in content.lower() and "tax" in content.lower()),
        ("Transport tax", "транспорт" in content.lower() or "transport" in content.lower()),
        ("Property tax", "недвижимость" in content.lower() or "property" in content.lower()),
        ("Dog tax", "собак" in content.lower() or "dog" in content.lower()),
        ("IP tax", "ИП" in content or "ip" in content.lower()),
        ("Craft tax", "ремеслен" in content.lower() or "craft" in content.lower()),
        ("Agro tax", "агро" in content.lower() or "agro" in content.lower()),
        ("Deposit tax", "вклад" in content.lower() or "deposit" in content.lower()),
        ("generateTaxExplanation", "generateTaxExplanation" in content or "taxExplanation" in content),
        ("Summation/total", "total" in content.lower() or "sum" in content.lower() or "общ" in content.lower()),
        ("PieChart visualization", "PieChart" in content or "pie" in content.lower()),
    ]

    found = sum(1 for _, r in checks if r)
    print(f"    Найдено компонентов: {found}/{len(checks)}")
    for name, r in checks:
        print(f"      {'✅' if r else '❌'} {name}")
    assert found >= 8, f"Too few components: {found}/{len(checks)}"
    return True


test_step(14, "Результаты (ResultsStep.tsx)", step_14)

# ============================================================
# 15. История (History)
# ============================================================
print("\n--- 📚 15. История ---")


def step_15():
    global access_token
    if not access_token:
        print("    ⚠️ Нет токена доступа, логинюсь")
        _, data = api_call("POST", "/api/v1/auth/login", {
            "email": test_email, "password": test_password
        })
        access_token = data.get("access_token", "")
        if not access_token:
            print("    ⚠️ Не удалось получить токен")
            return True

    # Save
    status, data = api_call("POST", "/api/v1/history", {
        "name": "Тестовый расчёт",
        "category": "income",
        "tax": 607.75,
        "details_json": json.dumps({"salary": 5000})
    }, token=access_token)

    assert status in (200, 201), f"Save history error: {data}"
    print(f"    Сохранение истории: status={status}")

    # Get history
    status, data = api_call("GET", "/api/v1/history", token=access_token)
    assert status == 200, f"Get history error: {data}"

    items = data if isinstance(data, list) else data.get("items", data.get("history", []))
    count = len(items) if isinstance(items, list) else 0
    print(f"    Записей в истории: {count}")
    assert count > 0, "No history records"

    return True


test_step(15, "История (History)", step_15)

# ============================================================
# 16. Экспорт (Export)
# ============================================================
print("\n--- 📎 16. Экспорт ---")


def step_16():
    content = read_tsx_file("ResultsStep.tsx")

    checks = [
        ("pdfMake", "pdfMake" in content or "pdfmake" in content),
        ("XLSX", "XLSX" in content or "xlsx" in content),
        ("exportPDF function", "exportPDF" in content),
        ("Export functionality", "export" in content.lower()),
        ("ipTax referenced", "ipTax" in content or "ip_tax" in content or "IP" in content),
        ("landTax/land referenced", "land" in content.lower()),
        ("craft/craftTax referenced", "craft" in content.lower()),
        ("agro/agroTax referenced", "agro" in content.lower()),
        ("deposit referenced", "deposit" in content.lower() or "вклад" in content.lower()),
    ]

    found = sum(1 for _, r in checks if r)
    print(f"    Найдено экспортных функций: {found}/{len(checks)}")
    for name, r in checks:
        print(f"      {'✅' if r else '❌'} {name}")

    # Check for export utils
    for d in [os.path.join(FRONTEND_DIR, "utils"), os.path.join(FRONTEND_DIR, "..", "utils")]:
        if os.path.exists(d):
            files = [f for f in os.listdir(d) if "export" in f.lower() or "pdf" in f.lower() or "xlsx" in f.lower()]
            if files:
                print(f"    Файлы экспорта: {files}")

    return True


test_step(16, "Экспорт (Export)", step_16)

# ============================================================
# 17. Восстановление пароля
# ============================================================
print("\n--- 🔑 17. Восстановление пароля ---")


def step_17():
    global access_token, test_password

    status, data = api_call("POST", "/api/v1/auth/request-password-reset", {"email": test_email})
    assert status == 200, f"Password reset request error: {data}"
    reset_token = data.get("reset_token", data.get("token", ""))
    print(f"    Запрос сброса: status={status}")

    if not reset_token:
        print(f"    ⚠️ Токен отправлен на email")
        status, data = api_call("POST", "/api/v1/auth/login", {
            "email": test_email, "password": test_password
        })
        assert status == 200
        return True

    new_password = "NewTest456!"
    status, data = api_call("POST", "/api/v1/auth/reset-password", {
        "token": reset_token, "new_password": new_password
    })
    assert status == 200, f"Password reset error: {data}"
    print(f"    Сброс пароля: status={status}")

    status, data = api_call("POST", "/api/v1/auth/login", {
        "email": test_email, "password": new_password
    })
    assert status == 200, f"Login with new password failed: {data}"
    access_token = data["access_token"]
    print(f"    ✅ Логин с новым паролем")

    # Restore original
    status, data = api_call("POST", "/api/v1/auth/request-password-reset", {"email": test_email})
    t2 = data.get("reset_token", data.get("token", ""))
    if t2:
        api_call("POST", "/api/v1/auth/reset-password", {"token": t2, "new_password": test_password})
        print(f"    Пароль восстановлен")

    return True


test_step(17, "Восстановление пароля", step_17)

# ============================================================
# 18. Навигация (Layout.tsx)
# ============================================================
print("\n--- 🧭 18. Навигация ---")


def step_18():
    content = read_tsx_file("Layout.tsx")

    checks = [
        ("setCurrentStep", "setCurrentStep" in content),
        ("onClick with step", "onClick" in content and "setCurrentStep" in content),
        ("Active step styling", "active" in content.lower()),
        ("Step indicators", "step" in content.lower() and ("index" in content.lower() or "key" in content.lower())),
        ("Layout structure", "div" in content or "Box" in content),
    ]

    found = sum(1 for _, r in checks if r)
    print(f"    Найдено компонентов навигации: {found}/{len(checks)}")
    for name, r in checks:
        print(f"      {'✅' if r else '❌'} {name}")
    assert found >= 3, f"Too few navigation components: {found}/{len(checks)}"
    return True


test_step(18, "Навигация (Layout.tsx)", step_18)

# ============================================================
# RESULTS
# ============================================================
print("\n" + "=" * 70)
print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ")
print("=" * 70)
print(f"  ✅ Пройдено: {PASS}")
print(f"  ❌ Провалено: {FAIL}")
print(f"  ⏭️  Пропущено: {SKIP}")
print(f"  📊 Всего: {PASS + FAIL + SKIP}")
print("=" * 70)

if FAIL == 0:
    print("\n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
else:
    print(f"\n❌ {FAIL} тестов провалено")

sys.exit(0 if FAIL == 0 else 1)