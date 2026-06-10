import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_income_basic(client: AsyncClient):
    # Зарплата 100 000 в год, без вычетов
    payload = {"monthly_incomes": [{"month": 1, "year": 2026, "salary": 100000}]}
    response = await client.post("/api/v1/calculate-income-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_income"] == 100000
    # 13% от 100 000 = 13 000
    assert data["final_tax"] == 13000.0
