import pytest
from httpx import AsyncClient

# =====================================================================
# 1. ДОХОДЫ (подоходный налог с вычетами и прогрессивной шкалой)
# =====================================================================


@pytest.mark.asyncio
async def test_income_standard_deduction_applies(client: AsyncClient):
    payload = {"monthly_incomes": [{"month": 1, "year": 2026, "salary": 1200}]}
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 984.0
    assert data["monthly_details"][0]["tax_withheld"] == 127.92
    assert data["tax_without_deductions"] == 156.0
    assert data["savings"] == 28.08


@pytest.mark.asyncio
async def test_income_standard_deduction_not_applies(client: AsyncClient):
    payload = {"monthly_incomes": [{"month": 1, "year": 2026, "salary": 1500}]}
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 1500.0
    assert data["monthly_details"][0]["tax_withheld"] == 195.0
    assert data["tax_without_deductions"] == 195.0
    assert data["savings"] == 0.0


@pytest.mark.asyncio
async def test_income_child_deduction(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 1500,
                "children_birthdays": ["2021-05-20"],
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 1437.0
    assert data["monthly_details"][0]["tax_withheld"] == 186.81
    assert data["tax_without_deductions"] == 195.0
    assert data["savings"] == 8.19


@pytest.mark.asyncio
async def test_income_enhanced_child_deduction(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 1500,
                "children_birthdays": ["2020-01-01", "2022-01-01"],
                "enhanced_child_deduction": True,
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 1260.0
    assert data["monthly_details"][0]["tax_withheld"] == 163.80
    assert data["tax_without_deductions"] == 195.0
    assert data["savings"] == 31.20


@pytest.mark.asyncio
async def test_income_disability_deduction(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 1500, "disability_deduction": True}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 1194.0
    assert data["monthly_details"][0]["tax_withheld"] == 155.22
    assert data["tax_without_deductions"] == 195.0
    assert data["savings"] == 39.78


@pytest.mark.asyncio
async def test_income_young_specialist_deduction(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 1500,
                "young_specialist_deduction": True,
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 640.0
    assert data["monthly_details"][0]["tax_withheld"] == 83.20
    assert data["tax_without_deductions"] == 195.0
    assert data["savings"] == 111.80


@pytest.mark.asyncio
async def test_income_progressive_25(client: AsyncClient):
    incomes = [{"month": i, "year": 2026, "salary": 40000} for i in range(1, 13)]
    payload = {"monthly_incomes": incomes}
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 78000.0
    assert data["tax_without_deductions"] == 78000.0
    assert data["savings"] == 0.0


@pytest.mark.asyncio
async def test_income_progressive_30(client: AsyncClient):
    incomes = [{"month": i, "year": 2026, "salary": 60000} for i in range(1, 13)]
    payload = {"monthly_incomes": incomes}
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 144000.0
    assert data["tax_without_deductions"] == 144000.0
    assert data["savings"] == 0.0


@pytest.mark.asyncio
async def test_income_deduction_limit_306(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 1000,
                "children_birthdays": [
                    "2020-01-01",
                    "2021-01-01",
                    "2022-01-01",
                    "2023-01-01",
                    "2024-01-01",
                ],
                "enhanced_child_deduction": True,
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 694.0
    assert data["monthly_details"][0]["tax_withheld"] == 90.22
    assert data["tax_without_deductions"] == 130.0
    assert data["savings"] == 39.78


# =====================================================================
# НОВЫЕ ТЕСТЫ ДОХОДОВ
# =====================================================================


@pytest.mark.asyncio
async def test_income_with_dividends_and_salary(client: AsyncClient):
    """Дивиденды и зарплата облагаются раздельно"""
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 2000, "dividends": 5000}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 910.0
    assert data["tax_without_deductions"] == 910.0
    assert data["savings"] == 0.0


@pytest.mark.asyncio
async def test_income_with_foreign_income(client: AsyncClient):
    """Зарубежный доход облагается без вычетов"""
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 2000,
                "foreign_income": 3000,
                "children_birthdays": ["2020-01-01"],
                "enhanced_child_deduction": True,
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 1880.0
    assert data["final_tax"] == 634.4
    assert data["savings"] == pytest.approx(15.6, 0.01)


@pytest.mark.asyncio
async def test_income_education_deduction_without_period(client: AsyncClient):
    """Вычет на обучение без указания периода применяется всегда"""
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 2000, "education_expenses": 500},
            {"month": 2, "year": 2026, "salary": 2000, "education_expenses": 500},
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 1500.0
    assert data["monthly_details"][1]["taxable_income"] == 1500.0
    assert data["final_tax"] == 390.0
    assert data["savings"] == 130.0


@pytest.mark.asyncio
async def test_income_with_all_deductions(client: AsyncClient):
    """Комбинация нескольких вычетов: стандартный + детский + инвалидность + профсоюз"""
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 1200,
                "children_birthdays": ["2021-01-01"],
                "disability_deduction": True,
                "is_union_member": True,
                "pension_contributions": True,
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 615.0
    assert data["monthly_details"][0]["tax_withheld"] == 79.95
    assert data["monthly_details"][0]["union_fee"] == 12.0
    assert data["monthly_details"][0]["pension_fee"] == 12.0
    assert data["total_income"] == 1200.0
    assert data["tax_without_deductions"] == 156.0
    assert data["savings"] == 76.05


# =====================================================================
# 2. ТРАНСПОРТНЫЙ НАЛОГ (подробные сценарии)
# =====================================================================


@pytest.mark.asyncio
async def test_transport_car_mass_below_1_5(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "car",
        "mass": 1.23,
        "year_of_manufacture": 2020,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 75.0


@pytest.mark.asyncio
async def test_transport_car_mass_1_5_1_75(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "car",
        "mass": 1.57,
        "year_of_manufacture": 2020,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 99.0


@pytest.mark.asyncio
async def test_transport_luxury_new(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "car",
        "mass": 2.05,
        "year_of_manufacture": 2024,
        "is_luxury": True,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 1480.0


@pytest.mark.asyncio
async def test_transport_luxury_old(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "car",
        "mass": 2.05,
        "year_of_manufacture": 2020,
        "is_luxury": True,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 148.0


@pytest.mark.asyncio
async def test_transport_motorcycle_low(client: AsyncClient):
    payload = {
        "vehicle_type": "motorcycle",
        "mass": 0,
        "engine_capacity": 600,
        "year_of_manufacture": 2024,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 49.0


@pytest.mark.asyncio
async def test_transport_motorcycle_high_new(client: AsyncClient):
    payload = {
        "vehicle_type": "motorcycle",
        "mass": 0,
        "engine_capacity": 900,
        "year_of_manufacture": 2024,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 245.0


@pytest.mark.asyncio
async def test_transport_motorcycle_high_old(client: AsyncClient):
    payload = {
        "vehicle_type": "motorcycle",
        "mass": 0,
        "engine_capacity": 900,
        "year_of_manufacture": 2019,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 49.0


@pytest.mark.asyncio
async def test_transport_electric_car(client: AsyncClient):
    payload = {
        "vehicle_type": "electric_car",
        "mass": 1.5,
        "year_of_manufacture": 2024,
        "is_luxury": False,
        "is_electric": True,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 0.0


@pytest.mark.asyncio
async def test_transport_electric_motorcycle_new(client: AsyncClient):
    payload = {
        "vehicle_type": "electric_motorcycle",
        "mass": 0,
        "engine_capacity": None,
        "year_of_manufacture": 2025,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 245.0


@pytest.mark.asyncio
async def test_transport_electric_motorcycle_old(client: AsyncClient):
    payload = {
        "vehicle_type": "electric_motorcycle",
        "mass": 0,
        "engine_capacity": None,
        "year_of_manufacture": 2019,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 49.0


@pytest.mark.asyncio
async def test_transport_truck(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "truck",
        "mass": 2.0,
        "year_of_manufacture": 2020,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 117.0


@pytest.mark.asyncio
async def test_transport_bus(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "bus",
        "mass": 15,
        "year_of_manufacture": 2020,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["calculated_tax"] == 143.0


# =====================================================================
# 3. СОБАКИ (проверка ставок, льгот и поиска пород)
# =====================================================================


@pytest.fixture(scope="function")
async def seed_dog_data(db_session):
    from app.models import DogTaxRate, DogBreed

    db_session.add(
        DogTaxRate(breed_type="non_dangerous", year=2026, rate_per_quarter=14)
    )
    db_session.add(DogTaxRate(breed_type="dangerous", year=2026, rate_per_quarter=67))
    db_session.add(
        DogBreed(
            name="Немецкая овчарка", is_dangerous=True, regulation_status="current"
        )
    )
    db_session.add(
        DogBreed(name="Эрдельтерьер", is_dangerous=True, regulation_status="projected")
    )
    db_session.add(
        DogBreed(
            name="Лабрадор-ретривер", is_dangerous=False, regulation_status="current"
        )
    )
    db_session.add(
        DogBreed(name="German Shepherd", is_dangerous=True, regulation_status="current")
    )
    await db_session.commit()


@pytest.mark.asyncio
async def test_dog_non_dangerous(client: AsyncClient, seed_dog_data):
    payload = {
        "breed_type": "Лабрадор-ретривер",
        "year": 2026,
        "number_of_dogs": 1,
        "quarters": 4,
    }
    response = await client.post("/api/v1/calculate-dog-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["total_tax"] == 56.0


@pytest.mark.asyncio
async def test_dog_dangerous(client: AsyncClient, seed_dog_data):
    payload = {
        "breed_type": "Немецкая овчарка",
        "year": 2026,
        "number_of_dogs": 1,
        "quarters": 4,
    }
    response = await client.post("/api/v1/calculate-dog-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["total_tax"] == 268.0


@pytest.mark.asyncio
async def test_dog_projected_treated_as_non_dangerous(
    client: AsyncClient, seed_dog_data
):
    payload = {
        "breed_type": "Эрдельтерьер",
        "year": 2026,
        "number_of_dogs": 1,
        "quarters": 4,
    }
    response = await client.post("/api/v1/calculate-dog-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["total_tax"] == 56.0


@pytest.mark.asyncio
async def test_dog_unknown_breed_treated_as_non_dangerous(
    client: AsyncClient, seed_dog_data
):
    payload = {
        "breed_type": "Мифическая порода",
        "year": 2026,
        "number_of_dogs": 1,
        "quarters": 4,
    }
    response = await client.post("/api/v1/calculate-dog-tax", json=payload)
    assert response.status_code == 200
    assert response.json()["total_tax"] == 56.0


@pytest.mark.asyncio
async def test_dog_two_dogs(client: AsyncClient, seed_dog_data):
    res1 = await client.post(
        "/api/v1/calculate-dog-tax",
        json={
            "breed_type": "Немецкая овчарка",
            "year": 2026,
            "number_of_dogs": 1,
            "quarters": 4,
        },
    )
    res2 = await client.post(
        "/api/v1/calculate-dog-tax",
        json={
            "breed_type": "Лабрадор-ретривер",
            "year": 2026,
            "number_of_dogs": 1,
            "quarters": 4,
        },
    )
    total = res1.json()["total_tax"] + res2.json()["total_tax"]
    assert total == 324.0


@pytest.mark.asyncio
async def test_dog_disabled_exemption(client: AsyncClient, seed_dog_data):
    response = await client.post(
        "/api/v1/calculate-dog-tax",
        json={
            "breed_type": "Немецкая овчарка",
            "year": 2026,
            "number_of_dogs": 2,
            "quarters": 4,
            "is_disabled_12": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 0.0


@pytest.mark.asyncio
async def test_dog_pensioner_discount(client: AsyncClient, seed_dog_data):
    response = await client.post(
        "/api/v1/calculate-dog-tax",
        json={
            "breed_type": "Немецкая овчарка",
            "year": 2026,
            "number_of_dogs": 1,
            "quarters": 4,
            "is_pensioner": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 134.0


@pytest.mark.asyncio
async def test_dog_large_family_discount(client: AsyncClient, seed_dog_data):
    response = await client.post(
        "/api/v1/calculate-dog-tax",
        json={
            "breed_type": "Лабрадор-ретривер",
            "year": 2026,
            "number_of_dogs": 1,
            "quarters": 4,
            "is_large_family": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 28.0


@pytest.mark.asyncio
async def test_dog_breeds_search(client: AsyncClient, seed_dog_data):
    response = await client.get("/api/v1/dog-breeds/search?q=german")
    assert response.status_code == 200
    breeds = response.json()
    assert len(breeds) >= 1
    names = [b["name"] for b in breeds]
    assert "German Shepherd" in names


# =====================================================================
# 4. АРЕНДА (ставки по городам) + НОВЫЕ ТЕСТЫ
# =====================================================================
@pytest.mark.asyncio
async def test_rental_minsk(client: AsyncClient):
    response = await client.post(
        "/api/v1/calculate-rental-tax",
        json={"city": "Минск", "property_type": "room", "months": 1},
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 53.0


@pytest.mark.asyncio
async def test_rental_brest(client: AsyncClient):
    response = await client.post(
        "/api/v1/calculate-rental-tax",
        json={"city": "Брест", "property_type": "room", "months": 1},
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 49.0


@pytest.mark.asyncio
async def test_rental_kobrin(client: AsyncClient):
    response = await client.post(
        "/api/v1/calculate-rental-tax",
        json={"city": "Кобрин", "property_type": "room", "months": 1},
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 33.0


@pytest.mark.asyncio
async def test_rental_other(client: AsyncClient):
    response = await client.post(
        "/api/v1/calculate-rental-tax",
        json={"city": "Малорита", "property_type": "room", "months": 1},
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 20.0


# НОВЫЕ ТЕСТЫ АРЕНДЫ
@pytest.mark.asyncio
async def test_rental_minsk_apartment(client: AsyncClient):
    """Аренда квартиры в Минске"""
    response = await client.post(
        "/api/v1/calculate-rental-tax",
        json={"city": "Минск", "property_type": "apartment", "months": 1},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_tax"] > 0


@pytest.mark.asyncio
async def test_rental_multiple_months(client: AsyncClient):
    """Несколько месяцев аренды"""
    response = await client.post(
        "/api/v1/calculate-rental-tax",
        json={"city": "Минск", "property_type": "room", "months": 6},
    )
    assert response.status_code == 200
    assert response.json()["total_tax"] == 53.0 * 6


# =====================================================================
# 5. ВКЛАДЫ (налог на проценты)
# =====================================================================
@pytest.fixture(scope="function")
async def seed_deposit_rules(db_session):
    from app.models import DepositTaxRule

    db_session.add(
        DepositTaxRule(
            currency_type="BYN", min_term_months_for_exemption=12, tax_rate=0.13
        )
    )
    db_session.add(
        DepositTaxRule(
            currency_type="USD", min_term_months_for_exemption=24, tax_rate=0.13
        )
    )
    await db_session.commit()


@pytest.mark.asyncio
async def test_deposit_byn_short(client: AsyncClient, seed_deposit_rules):
    response = await client.post(
        "/api/v1/calculate-deposit-tax",
        json={
            "amount": 100000,
            "currency": "BYN",
            "annual_rate_percent": 14,
            "term_days": 180,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert abs(data["tax"] - 897.53) < 1.0


@pytest.mark.asyncio
async def test_deposit_byn_long(client: AsyncClient, seed_deposit_rules):
    response = await client.post(
        "/api/v1/calculate-deposit-tax",
        json={
            "amount": 100000,
            "currency": "BYN",
            "annual_rate_percent": 14,
            "term_days": 366,
        },
    )
    assert response.status_code == 200
    assert response.json()["tax"] == 0.0


@pytest.mark.asyncio
async def test_deposit_usd_short(client: AsyncClient, seed_deposit_rules):
    response = await client.post(
        "/api/v1/calculate-deposit-tax",
        json={
            "amount": 10000,
            "currency": "USD",
            "annual_rate_percent": 3,
            "term_days": 360,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert abs(data["tax"] - 38.47) < 0.5


@pytest.mark.asyncio
async def test_deposit_byn_progressive(client: AsyncClient, seed_deposit_rules):
    response = await client.post(
        "/api/v1/calculate-deposit-tax",
        json={
            "amount": 500000,
            "currency": "BYN",
            "annual_rate_percent": 10,
            "term_days": 30,
            "annual_income": 400000,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tax_rate"] == 0.25
    assert abs(data["tax"] - 1027.40) < 1.0


# =====================================================================
# 6. КРИПТОВАЛЮТА
# =====================================================================
@pytest.mark.asyncio
async def test_crypto_tax(client: AsyncClient):
    response = await client.post(
        "/api/v1/calculate-crypto-tax", json={"gross_income": 10000}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tax"] == 95.42


# =====================================================================
# 7. ПРОДАЖА ИМУЩЕСТВА (правило одного объекта) + НОВЫЕ ТЕСТЫ
# =====================================================================
@pytest.mark.asyncio
async def test_property_sale_sole(client: AsyncClient):
    response = await client.post(
        "/api/v1/calculate-property-sale-tax",
        json={
            "property_type": "real_estate",
            "sale_price": 200000,
            "acquisition_cost": 150000,
            "apply_deduction": False,
            "sole_property_5_years": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tax"] == 0.0
    assert "Освобождено" in data.get("note", "")


@pytest.mark.asyncio
async def test_property_sale_auto_deduction(client: AsyncClient):
    """Вычет 20% при продаже авто без подтверждённых расходов"""
    response = await client.post(
        "/api/v1/calculate-property-sale-tax",
        json={"property_type": "auto", "sale_price": 100000, "apply_deduction": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["taxable_amount"] == 80000.0
    assert data["tax"] == 10400.0


@pytest.mark.asyncio
async def test_property_sale_real_estate_with_acquisition_cost(client: AsyncClient):
    """Недвижимость с подтверждёнными расходами"""
    response = await client.post(
        "/api/v1/calculate-property-sale-tax",
        json={
            "property_type": "real_estate",
            "sale_price": 300000,
            "acquisition_cost": 250000,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["taxable_amount"] == 50000.0
    assert data["tax"] == 6500.0


# =====================================================================
# 8. ДИВИДЕНДЫ
# =====================================================================
@pytest.mark.asyncio
async def test_dividends_basic(client: AsyncClient):
    payload = {
        "monthly_incomes": [{"month": 1, "year": 2026, "salary": 0, "dividends": 10000}]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 1300.0
    assert data["tax_without_deductions"] == 1300.0
    assert data["savings"] == 0.0


@pytest.mark.asyncio
async def test_dividends_higher(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 0, "dividends": 500000}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 83000.0
    assert data["tax_without_deductions"] == 83000.0
    assert data["savings"] == 0.0


# =====================================================================
# 9. ПРОФЕССИОНАЛЬНЫЙ ВЫЧЕТ
# =====================================================================
@pytest.mark.asyncio
async def test_professional_deduction_40(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 10000,
                "professional_deduction_category": "art",
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 6000.0
    assert data["monthly_details"][0]["tax_withheld"] == 780.0
    assert data["tax_without_deductions"] == 1300.0
    assert data["savings"] == 520.0


# =====================================================================
# 10. СТРАХОВЫЕ ВЗНОСЫ
# =====================================================================
@pytest.mark.asyncio
async def test_insurance_deduction(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 5000, "insurance_expenses": 300}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 4700.0
    assert data["monthly_details"][0]["tax_withheld"] == 611.0
    assert data["tax_without_deductions"] == 650.0
    assert data["savings"] == 39.0


# =====================================================================
# 11. ИМУЩЕСТВЕННЫЙ ВЫЧЕТ НА ЖИЛЬЁ
# =====================================================================
@pytest.mark.asyncio
async def test_housing_deduction(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {
                "month": 1,
                "year": 2026,
                "salary": 5000,
                "needs_housing_improvement": True,
                "housing_expenses": 2000,
            }
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["monthly_details"][0]["taxable_income"] == 3000.0
    assert data["monthly_details"][0]["tax_withheld"] == 390.0
    assert data["tax_without_deductions"] == 650.0
    assert data["savings"] == 260.0


# =====================================================================
# 12. ДОХОД ИЗ-ЗА ГРАНИЦЫ
# =====================================================================
@pytest.mark.asyncio
async def test_foreign_income(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 0, "foreign_income": 5000}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_income"] == 5000.0
    assert data["final_tax"] == 650.0
    assert data["tax_without_deductions"] == 650.0
    assert data["savings"] == 0.0


# =====================================================================
# 13. ДОХОДЫ ОТ ФИЗЛИЦ
# =====================================================================
@pytest.mark.asyncio
async def test_personal_income_exemption(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 0, "personal_income": 6000}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 0.0
    assert data["tax_without_deductions"] == 0.0
    assert data["savings"] == 0.0


@pytest.mark.asyncio
async def test_personal_income_above_exemption(client: AsyncClient):
    payload = {
        "monthly_incomes": [
            {"month": 1, "year": 2026, "salary": 0, "personal_income": 10000}
        ]
    }
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["final_tax"] == 520.0
    assert data["tax_without_deductions"] == 520.0
    assert data["savings"] == 0.0
