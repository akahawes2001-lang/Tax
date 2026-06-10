"""Тест регистрации с реальной отправкой email."""
import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "http://127.0.0.1:8000/api/v1/auth/register",
            json={"email": "testemail123@mail.ru", "password": "StrongPass1!", "captcha_token": ""},
            timeout=15
        )
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")

asyncio.run(test())