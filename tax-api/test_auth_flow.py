"""Тест всех эндпоинтов аутентификации"""
import httpx
import asyncio

BASE_URL = "http://localhost:8000/api/v1/auth"


async def test():
    async with httpx.AsyncClient() as client:
        # 1. Регистрация
        print("=" * 60)
        r1 = await client.post(
            f"{BASE_URL}/register",
            json={"email": "flowtest@test.com", "password": "123456"},
        )
        print(f"REGISTER: {r1.status_code}")
        print(f"  {r1.json()}")

        r1_data = r1.json()
        verify_token = r1_data.get("verification_token", "")

        # 2. Подтверждение email
        if verify_token:
            r2 = await client.post(
                f"{BASE_URL}/verify-email", json={"token": verify_token}
            )
            print(f"VERIFY: {r2.status_code} - {r2.json()}")

        # 3. Логин после подтверждения
        r3 = await client.post(
            f"{BASE_URL}/login",
            json={"email": "flowtest@test.com", "password": "123456"},
        )
        print(f"LOGIN: {r3.status_code}")
        token = r3.json().get("access_token", "")
        print(f"  token: {token[:30]}...")

        # 4. Request password reset
        r4 = await client.post(
            f"{BASE_URL}/request-password-reset",
            json={"email": "flowtest@test.com"},
        )
        print(f"RESET REQUEST: {r4.status_code} - {r4.json()}")
        reset_token = r4.json().get("reset_token", "")

        # 5. Reset password
        if reset_token:
            r5 = await client.post(
                f"{BASE_URL}/reset-password",
                json={"token": reset_token, "new_password": "654321"},
            )
            print(f"RESET PASSWORD: {r5.status_code} - {r5.json()}")

            # 6. Логин с новым паролем
            r6 = await client.post(
                f"{BASE_URL}/login",
                json={"email": "flowtest@test.com", "password": "654321"},
            )
            print(f"LOGIN NEW PWD: {r6.status_code}")
            print(f"  token: {r6.json().get('access_token', '')[:30]}...")

        print("=" * 60)
        print("All tests passed!")


asyncio.run(test())