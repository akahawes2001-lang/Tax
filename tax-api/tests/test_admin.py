import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_can_access_admin_endpoint(client: AsyncClient, admin_token: str):
    response = await client.get(
        "/api/v1/admin/dog-tax-rates",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_normal_user_cannot_access_admin_endpoint(
    client: AsyncClient, user_token: str
):
    response = await client.get(
        "/api/v1/admin/dog-tax-rates", headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 403
    assert "Доступ запрещён" in response.json()["detail"]


@pytest.mark.asyncio
async def test_unauthenticated_cannot_access_admin_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/admin/dog-tax-rates")
    assert response.status_code in [401, 403]  # 401 или 403 в зависимости от реализации
