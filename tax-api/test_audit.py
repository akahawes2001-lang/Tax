"""
Полный аудит калькулятора TaxBel.
Запуск: python test_audit.py
"""
import sys
import os
import json
import asyncio
from datetime import date

# Настройка для SQLite
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///test_audit.db"

# Импорты приложения
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, async_session
from app.schemas import (
    AnnualIncomeRequest, MonthlyIncome,
    TransportTaxRequest, DogTaxRequest, DepositTaxRequest,
    PropertyTaxRequest, LandTaxRequest, CraftTaxRequest,
    AgroTaxRequest, RentalTaxRequest, CryptoTaxRequest,
    PropertySaleRequest
)
from app.services import calculate_income_tax
from app.routers.transport import transport_tax
from app.routers.dog import dog_tax
from app.routers.deposit import deposit_tax
from app.routers.property_tax import property_tax
from app.routers.land_tax import land_tax
from app.routers.craft_tax import craft_tax
from app.routers.agro_tax import calculate_agro_tax
from app.routers.rental import rental_tax
from app.routers.crypto import crypto_tax
from app.routers.property_sale import property_sale
from app.utils import get_param_float, get_param_int

# ============================================================
# Вспомогательные функции
# ============================================================

passed = 0
failed = 0
errors = []

def check(name, expected, actual, tolerance=0.02):
    global passed, failed
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        if abs(expected - actual) <= tolerance:
            passed += 1
            print(f"  ✓ {name}: {actual} (ожидалось {expected})")
        else:
            failed += 1
            msg = f"  ✗ {name}: {actual} (ожидалось {expected})"
            print(msg)
            errors.append(msg)
    elif expected == actual:
        passed += 1
        print(f"  ✓ {name}: {actual}")
    else:
        failed += 1
        msg = f"  ✗ {name}: {actual} (ожидалось {expected})"
        print(msg)
        errors.append(msg)

def check_near(name, expected, actual, tolerance=0.02):
    """Проверка с плавающей точкой"""
    check(name, expected, actual, tolerance)

# ============================================================
# Инициализация БД
# ============================================================

async def init_db():
    """Создаём таблицы и заполняем базовые параметры"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Заполняем параметры
    from app.models import SystemParameter
    async with async_session() as session:
        params = [
            SystemParameter(key="base_tax_rate", value="0.13"),
            SystemParameter(key="higher_tax_rate", value="0.25"),
            SystemParameter(key="super_tax_rate", value="0.30"),
            SystemParameter(key="progressive_threshold_1_2026", value="350000"),
            SystemParameter(key="progressive_threshold_2_2026", value="600000"),
            SystemParameter(key="crypto_income_coefficient", value="0.0367"),
            SystemParameter(key="crypto_tax_rate", value="0.26"),
        ]
        for p in params:
            session.add(p)
        await session.commit()
    
    # Заполняем ставки налога на собак
    from app.models import DogTaxRate, DogBreed
    async with async_session() as session:
        session.add(DogTaxRate(breed_type="dangerous", year=2026, rate_per_quarter=67.0))
        session.add(DogTaxRate(breed_type="non_dangerous", year=2026, rate_per_quarter=37.0))
        session.add(DogBreed(name="овчарка", is_dangerous=True, regulation_status="current"))
        await session.commit()
    
    # Заполняем ставки транспортного налога
    from app.models import TransportTaxRate
    async with async_session() as session:
        session.add(TransportTaxRate(vehicle_type="car", min_mass=0, max_mass=1500, rate_2025=73.0, rate_2026=75.0))
        session.add(TransportTaxRate(vehicle_type="car", min_mass=1501, max_mass=2000, rate_2025=146.0, rate_2026=150.0))
        await session.commit()
    
    # Заполняем правила налога на вклады
    from app.models import DepositTaxRule
    async with async_session() as session:
        session.add(DepositTaxRule(currency_type="BYN", min_term_months_for_exemption=12, tax_rate=0.13))
        session.add(DepositTaxRule(currency_type="USD", min_term_months_for_exemption=24, tax_rate=0.13))
        session.add(DepositTaxRule(currency_type="EUR", min_term_months_for_exemption=24, tax_rate=0.13))
        await session.commit()
    
    print("БД инициализирована\n")

# ============================================================
# ТЕСТ 1: Подоходный налог
# ============================================================

async def test_income_tax():
    print("\n" + "="*60)
    print("ТЕСТ 1: Подоходный налог")
    print("="*60)
    
    data = AnnualIncomeRequest(
        monthly_incomes=[
            MonthlyIncome(
                month=1, year=2026, salary=5000,
                children_birthdays=[date(2015, 5, 10)],
                medical_expenses=500,
                medicine_expenses=300,
                alimony_paid=2000,
                charity_amount=1000,
            )
        ]
    )
    
    async with async_session() as db:
        result = await calculate_income_tax(data, db)
    
    print(f"  tax_without_deductions = {result.tax_without_deductions}")
    print(f"  final_tax = {result.final_tax}")
    print(f"  medical_deduction = {result.medical_deduction}")
    print(f"  alimony_deduction = {result.alimony_deduction}")
    print(f"  charity_deduction = {result.charity_deduction}")
    
    # Ожидания:
    # Налог без вычетов: 5000 * 0.13 = 650
    # tax_without_deductions = 650
    check_near("tax_without_deductions", 650.0, result.tax_without_deductions)
    
    # Лимит соцвычетов = 50% от 650 = 325
    # total_social_deduction = 500 + 300 = 800
    # max_social_deduction = 325
    # total_social_deduction = min(800, 325) = 325
    # remaining = 0, alimony_deduction = 0, charity_deduction = 0
    # medical_deduction = 325
    
    check_near("medical_deduction", 325.0, result.medical_deduction)
    check_near("alimony_deduction", 0.0, result.alimony_deduction)
    check_near("charity_deduction", 0.0, result.charity_deduction)
    
    # Итоговый налог:
    # auto_standard = 0 (salary 5000 > 1308)
    # children_deduction = 63
    # limited_deductions = min(0 + 63, 306) = 63
    # medical_deduction_month = 325 * ratio(0.40625) = 325
    # total_deductions = 63 + 325 = 388
    # taxable_salary = 5000 - 388 = 4612
    # final_tax = 4612 * 0.13 = 599.56
    check_near("final_tax", 599.56, result.final_tax)

# ============================================================
# ТЕСТ 2: Транспортный налог
# ============================================================

async def test_transport_tax():
    print("\n" + "="*60)
    print("ТЕСТ 2: Транспортный налог")
    print("="*60)
    
    req = TransportTaxRequest(
        vehicle_type="car",
        mass=1400,
        year_of_manufacture=2023,
        is_electric=False,
        tax_year=2026,
    )
    
    async with async_session() as db:
        result = await transport_tax(req, db)
    
    print(f"  calculated_tax = {result['calculated_tax']}")
    # Ставка для массы 1400 кг (0-1500): 75 руб.
    check_near("transport_tax", 75.0, result["calculated_tax"])

# ============================================================
# ТЕСТ 3: Налог на собак
# ============================================================

async def test_dog_tax():
    print("\n" + "="*60)
    print("ТЕСТ 3: Налог на собак")
    print("="*60)
    
    req = DogTaxRequest(
        breed_type="овчарка",
        year=2026,
        number_of_dogs=1,
        quarters=1,
        is_pensioner=False,
    )
    
    async with async_session() as db:
        result = await dog_tax(req, db)
    
    print(f"  total_tax = {result['total_tax']}")
    # Овчарка - опасная порода, ставка 67 руб./квартал
    check_near("dog_tax", 67.0, result["total_tax"])

# ============================================================
# ТЕСТ 4: Налог на вклады
# ============================================================

async def test_deposit_tax():
    print("\n" + "="*60)
    print("ТЕСТ 4: Налог на вклады")
    print("="*60)
    
    req = DepositTaxRequest(
        amount=10000,
        currency="BYN",
        annual_rate_percent=5,
        term_days=182,  # ~6 месяцев
        annual_income=60000,
    )
    
    async with async_session() as db:
        result = await deposit_tax(req, db)
    
    print(f"  interest_income = {result['interest_income']}")
    print(f"  tax = {result['tax']}")
    
    # Доход: 10000 * 0.05 * 182/365 = 249.32
    # Срок 6 мес < 12 мес (льгота для BYN), налог = 249.32 * 0.13 = 32.41
    check_near("interest_income", 249.32, result["interest_income"])
    check_near("deposit_tax", 32.41, result["tax"])

# ============================================================
# ТЕСТ 5: Налог на недвижимость
# ============================================================

async def test_property_tax():
    print("\n" + "="*60)
    print("ТЕСТ 5: Налог на недвижимость")
    print("="*60)
    
    req = PropertyTaxRequest(
        cadastral_value=100000,
        property_type="apartment",
        region="Минск",
        is_pensioner=False,
        is_large_family=False,
        is_disabled=False,
    )
    
    result = await property_tax(req)
    
    print(f"  calculated_tax = {result['calculated_tax']}")
    # 0.1% от 100000 = 100
    check_near("property_tax", 100.0, result["calculated_tax"])

# ============================================================
# ТЕСТ 6: Земельный налог
# ============================================================

async def test_land_tax():
    print("\n" + "="*60)
    print("ТЕСТ 6: Земельный налог")
    print("="*60)
    
    req = LandTaxRequest(
        cadastral_value=200000,
        land_category="residential",
        region="Минск",
        area_hectares=0.15,
        is_pensioner=False,
        is_large_family=False,
        is_disabled=False,
        is_chernobyl_victim=False,
    )
    
    result = await land_tax(req)
    print(f"  tax_amount (без льгот) = {result.tax_amount}")
    # 0.5% от 200000 = 1000
    check_near("land_tax (без льгот)", 1000.0, result.tax_amount)
    
    # С льготой
    req2 = LandTaxRequest(
        cadastral_value=200000,
        land_category="residential",
        region="Минск",
        area_hectares=0.15,
        is_disabled=True,
    )
    result2 = await land_tax(req2)
    print(f"  tax_amount (с льготой) = {result2.tax_amount}")
    check_near("land_tax (с льготой)", 0.0, result2.tax_amount)

# ============================================================
# ТЕСТ 7: Ремесленный сбор
# ============================================================

async def test_craft_tax():
    print("\n" + "="*60)
    print("ТЕСТ 7: Ремесленный сбор")
    print("="*60)
    
    req = CraftTaxRequest(is_craftsman=True)
    result = await craft_tax(req)
    print(f"  tax_amount = {result.tax_amount}")
    check_near("craft_tax", 42.0, result.tax_amount)

# ============================================================
# ТЕСТ 8: Агроэкотуризм
# ============================================================

async def test_agro_tax():
    print("\n" + "="*60)
    print("ТЕСТ 8: Агроэкотуризм")
    print("="*60)
    
    req = AgroTaxRequest(is_agro_owner=True)
    result = calculate_agro_tax(req)
    print(f"  tax_amount = {result.tax_amount}")
    check_near("agro_tax", 42.0, result.tax_amount)

# ============================================================
# ТЕСТ 9: Аренда
# ============================================================

async def test_rental_tax():
    print("\n" + "="*60)
    print("ТЕСТ 9: Аренда")
    print("="*60)
    
    req = RentalTaxRequest(city="Минск", property_type="apartment", months=1)
    
    async with async_session() as db:
        result = await rental_tax(req, db)
    
    print(f"  total_tax = {result['total_tax']}")
    check_near("rental_tax", 53.0, result["total_tax"])

# ============================================================
# ТЕСТ 10: Криптовалюта
# ============================================================

async def test_crypto_tax():
    print("\n" + "="*60)
    print("ТЕСТ 10: Криптовалюта")
    print("="*60)
    
    req = CryptoTaxRequest(gross_income=10000)
    
    async with async_session() as db:
        result = await crypto_tax(req, db)
    
    print(f"  tax = {result['tax']}")
    # 10000 * 0.0367 * 0.26 = 95.42
    check_near("crypto_tax", 95.42, result["tax"])

# ============================================================
# ТЕСТ 11: Продажа имущества
# ============================================================

async def test_property_sale():
    print("\n" + "="*60)
    print("ТЕСТ 11: Продажа имущества")
    print("="*60)
    
    req = PropertySaleRequest(
        property_type="auto",
        sale_price=20000,
        acquisition_cost=15000,
        apply_deduction=False,
    )
    
    async with async_session() as db:
        result = await property_sale(req, db)
    
    print(f"  tax = {result['tax']}")
    # (20000 - 15000) * 0.13 = 650
    check_near("property_sale_tax", 650.0, result["tax"])

# ============================================================
# ТЕСТ 12: Лимит социальных вычетов (большие суммы)
# ============================================================

async def test_social_deduction_limit():
    print("\n" + "="*60)
    print("ТЕСТ 12: Лимит социальных вычетов (большие суммы)")
    print("="*60)
    
    data = AnnualIncomeRequest(
        monthly_incomes=[
            MonthlyIncome(
                month=1, year=2026, salary=5000,
                medical_expenses=100000,
                medicine_expenses=0,
                alimony_paid=100000,
                charity_amount=100000,
            )
        ]
    )
    
    async with async_session() as db:
        result = await calculate_income_tax(data, db)
    
    print(f"  tax_without_deductions = {result.tax_without_deductions}")
    print(f"  final_tax = {result.final_tax}")
    print(f"  medical_deduction = {result.medical_deduction}")
    print(f"  alimony_deduction = {result.alimony_deduction}")
    print(f"  charity_deduction = {result.charity_deduction}")
    
    # Налог без вычетов: 5000 * 0.13 = 650
    # Лимит соцвычетов: 50% от 650 = 325
    # medical = min(100000, 325) = 325
    # alimony = min(100000, 0) = 0
    # charity = min(100000, 0) = 0
    # Итоговый налог:
    # auto_standard = 0 (salary 5000 > 1308)
    # limited_deductions = min(0, 306) = 0 (нет детей)
    # medical_deduction_month = 325
    # total_deductions = 0 + 325 = 325
    # taxable_salary = 5000 - 325 = 4675
    # final_tax = 4675 * 0.13 = 607.75 (не уходит в минус)
    
    check_near("tax_without_deductions", 650.0, result.tax_without_deductions)
    check_near("medical_deduction", 325.0, result.medical_deduction)
    check_near("alimony_deduction", 0.0, result.alimony_deduction)
    check_near("charity_deduction", 0.0, result.charity_deduction)
    check_near("final_tax", 607.75, result.final_tax)
    assert result.final_tax >= 0, "Налог не должен быть отрицательным!"
    print("  ✓ Налог не отрицательный")

# ============================================================
# ТЕСТ 13: Подоходный налог с удержаниями (ФСЗН)
# ============================================================

async def test_income_with_deductions():
    print("\n" + "="*60)
    print("ТЕСТ 13: Подоходный налог с удержаниями (ФСЗН)")
    print("="*60)
    
    data = AnnualIncomeRequest(
        monthly_incomes=[
            MonthlyIncome(
                month=1, year=2026, salary=5000,
                pension_contributions=True,
            )
        ]
    )
    
    async with async_session() as db:
        result = await calculate_income_tax(data, db)
    
    print(f"  final_tax = {result.final_tax}")
    print(f"  total_pension_fees = {result.total_pension_fees}")
    
    # ФСЗН = 5000 * 0.01 = 50
    # Налог = 5000 * 0.13 = 650 (без вычетов)
    check_near("pension_fees (ФСЗН)", 50.0, result.total_pension_fees)
    check_near("final_tax", 650.0, result.final_tax)

# ============================================================
# Главная функция
# ============================================================

async def main():
    print("="*60)
    print("ПОЛНЫЙ АУДИТ КАЛЬКУЛЯТОРА TaxBel")
    print("="*60)
    
    await init_db()
    
    await test_income_tax()
    await test_transport_tax()
    await test_dog_tax()
    await test_deposit_tax()
    await test_property_tax()
    await test_land_tax()
    await test_craft_tax()
    await test_agro_tax()
    await test_rental_tax()
    await test_crypto_tax()
    await test_property_sale()
    await test_social_deduction_limit()
    await test_income_with_deductions()
    
    print("\n" + "="*60)
    print("РЕЗУЛЬТАТЫ АУДИТА")
    print("="*60)
    print(f"  Пройдено: {passed}")
    print(f"  Провалено: {failed}")
    
    if errors:
        print("\n  Ошибки:")
        for e in errors:
            print(f"    {e}")
    
    print("\n" + "="*60)
    if failed == 0:
        print("  ВСЕ ТЕСТЫ ПРОЙДЕНЫ ✓")
    else:
        print(f"  {failed} ТЕСТОВ ПРОВАЛЕНО ✗")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
