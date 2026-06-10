import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_car_brands(client: AsyncClient, seed_cars):
    response = await client.get("/api/v1/car-brands")
    assert response.status_code == 200
    brands = response.json()
    assert "Lada" in brands


@pytest.mark.asyncio
async def test_car_models(client: AsyncClient, seed_cars):
    response = await client.get("/api/v1/car-models?brand=Lada")
    assert response.status_code == 200
    models = response.json()
    assert "Vesta" in models


@pytest.mark.asyncio
async def test_car_mass(client: AsyncClient, seed_cars):
    response = await client.get("/api/v1/car-mass?brand=Lada&model=Vesta")
    assert response.status_code == 200
    data = response.json()
    assert data["mass"] == 1230


@pytest.mark.asyncio
async def test_transport_tax_car(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "car",
        "mass": 1.2,
        "year_of_manufacture": 2020,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["calculated_tax"] == 75.0


@pytest.mark.asyncio
async def test_transport_tax_electric_car(client: AsyncClient):
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
    data = response.json()
    assert data["calculated_tax"] == 0.0


@pytest.mark.asyncio
async def test_transport_tax_motorcycle(client: AsyncClient):
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
    data = response.json()
    assert data["calculated_tax"] == 245.0


@pytest.mark.asyncio
async def test_transport_tax_electric_motorcycle_new(client: AsyncClient):
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
    data = response.json()
    assert data["calculated_tax"] == 245.0


@pytest.mark.asyncio
async def test_transport_tax_electric_motorcycle_old(client: AsyncClient):
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
    data = response.json()
    assert data["calculated_tax"] == 49.0


@pytest.mark.asyncio
async def test_transport_tax_truck(client: AsyncClient, seed_transport_rates):
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
    data = response.json()
    assert data["calculated_tax"] == 117.0


@pytest.mark.asyncio
async def test_transport_tax_bus(client: AsyncClient, seed_transport_rates):
    payload = {
        "vehicle_type": "bus",
        "mass": 15,  # число мест
        "year_of_manufacture": 2020,
        "is_luxury": False,
        "is_electric": False,
        "tax_year": 2026,
    }
    response = await client.post("/api/v1/calculate-transport-tax", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["calculated_tax"] == 143.0


@pytest.mark.asyncio
async def test_transport_tax_luxury_car(client: AsyncClient, seed_transport_rates):
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
    data = response.json()
    # 148 * 10 = 1480
    assert data["calculated_tax"] == 1480.0
