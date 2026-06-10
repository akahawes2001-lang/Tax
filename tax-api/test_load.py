"""
Нагрузочный тест: 100 параллельных запросов к /api/v1/calculate-income-tax
Запуск: cd tax-api && python test_load.py
"""
import urllib.request
import urllib.parse
import json
import sys
import time
import threading

BASE_URL = "http://localhost:8000"
NUM_REQUESTS = 100
TIMEOUT = 30
success = 0
fail = 0
errors = []
lock = threading.Lock()

payload = json.dumps({
    "monthly_incomes": [{
        "month": 1, "year": 2025,
        "salary": 5000,
        "dividends": 0, "foreign_income": 0, "personal_income": 0,
        "children_birthdays": [], "is_single_parent": False, "is_large_family": False,
        "disability_deduction": False, "young_specialist_deduction": False,
        "disabled_children_birthdays": [], "education_expenses": 0,
        "insurance_expenses": 0, "medical_expenses": 500, "medicine_expenses": 300,
        "alimony_paid": 2000, "charity_amount": 1000,
        "professional_deduction_category": None,
        "needs_housing_improvement": False, "housing_expenses": 0,
        "is_union_member": False, "pension_contributions": False
    }]
}).encode("utf-8")

def send_request(idx):
    global success, fail
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/api/v1/calculate-income-tax",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        resp = urllib.request.urlopen(req, timeout=TIMEOUT)
        body = json.loads(resp.read().decode("utf-8"))
        with lock:
            if "final_tax" in body:
                success += 1
            else:
                fail += 1
                errors.append(f"#{idx}: no final_tax in response")
        print(f"  ✓ #{idx}: status={resp.status}, tax={body.get('final_tax', '?')}")
    except Exception as e:
        with lock:
            fail += 1
            errors.append(f"#{idx}: {str(e)[:100]}")
        print(f"  ✗ #{idx}: {str(e)[:80]}")

print("=" * 60)
print(f"НАГРУЗОЧНЫЙ ТЕСТ: {NUM_REQUESTS} параллельных запросов")
print(f"URL: {BASE_URL}/api/v1/calculate-income-tax")
print("=" * 60)
print()

start = time.time()
threads = []
for i in range(NUM_REQUESTS):
    t = threading.Thread(target=send_request, args=(i+1,))
    threads.append(t)

for t in threads:
    t.start()

for t in threads:
    t.join()

elapsed = time.time() - start
print()
print("=" * 60)
print("РЕЗУЛЬТАТЫ НАГРУЗОЧНОГО ТЕСТА")
print("=" * 60)
print(f"  Всего запросов: {NUM_REQUESTS}")
print(f"  Успешно: {success}")
print(f"  Ошибок: {fail}")
print(f"  Время выполнения: {elapsed:.2f} сек")
print(f"  Средняя скорость: {NUM_REQUESTS / elapsed:.1f} запр/сек" if elapsed > 0 else "  N/A")

if errors:
    print(f"\nПервые 5 ошибок:")
    for e in errors[:5]:
        print(f"  {e}")

if fail == 0:
    print("\n✅ ВСЕ ЗАПРОСЫ УСПЕШНЫ — СЕРВЕР ВЫДЕРЖИВАЕТ НАГРУЗКУ")
else:
    print(f"\n⚠️ {fail} ошибок — требуется оптимизация")

sys.exit(0 if fail == 0 else 1)