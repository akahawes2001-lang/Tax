import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "TestPass123!"},
    )
    # 200 — регистрация успешна (dev mode capcha skip)
    assert response.status_code == 200
    assert "Пользователь создан" in response.json()["message"]


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    # Первая регистрация
    await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "TestPass123!"},
    )
    # Повторная – должно быть 400
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "dup@example.com", "password": "TestPass123!"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Регистрируем пользователя
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "Secret123!"},
    )
    # Подтверждаем email (в тестовой БД токен можно получить из ответа регистрации)
    # В тестах регистрация возвращает verification_token
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "logine2e@example.com", "password": "Secret123!"},
    )
    verify_token = reg_resp.json().get("verification_token", "")
    if verify_token:
        await client.post("/api/v1/auth/verify-email", json={"token": verify_token})

    # Входим
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "logine2e@example.com", "password": "Secret123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrong@example.com", "password": "Correct1!"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "incorrect"},
    )
    assert response.status_code == 401