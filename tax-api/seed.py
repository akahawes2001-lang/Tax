import asyncio
from sqlalchemy import text
from app.database import engine, async_session, Base
from app.models import (
    DogTaxRate,
    TransportTaxRate,
    DepositTaxRule,
    RentalTaxRate,
    SystemParameter,
    User,
    CarReference,
)
from app.auth import get_password_hash


async def seed():
    # 1. Удаляем все таблицы и создаём заново (чистая структура)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # 2. Заполняем данными
    async with async_session() as session:
        # Собаки (2025 и 2026)
        session.add(DogTaxRate(breed_type="dangerous", year=2025, rate_per_quarter=63))
        session.add(
            DogTaxRate(breed_type="non_dangerous", year=2025, rate_per_quarter=13)
        )
        session.add(DogTaxRate(breed_type="dangerous", year=2026, rate_per_quarter=67))
        session.add(
            DogTaxRate(breed_type="non_dangerous", year=2026, rate_per_quarter=14)
        )

        # Депозиты
        session.add(
            DepositTaxRule(
                currency_type="BYN", min_term_months_for_exemption=12, tax_rate=0.13
            )
        )
        session.add(
            DepositTaxRule(
                currency_type="USD", min_term_months_for_exemption=24, tax_rate=0.13
            )
        )
        session.add(
            DepositTaxRule(
                currency_type="EUR", min_term_months_for_exemption=24, tax_rate=0.13
            )
        )

        # Аренда (ставки 2026 — согласно Приложению 2 НК РБ)
        # Минск
        session.add(RentalTaxRate(city_group="minsk", property_type="room", monthly_tax=53))
        session.add(RentalTaxRate(city_group="minsk", property_type="apartment", monthly_tax=53))
        session.add(RentalTaxRate(city_group="minsk", property_type="house", monthly_tax=53))
        # Областные центры
        session.add(RentalTaxRate(city_group="regional_center", property_type="room", monthly_tax=49))
        session.add(RentalTaxRate(city_group="regional_center", property_type="apartment", monthly_tax=49))
        session.add(RentalTaxRate(city_group="regional_center", property_type="house", monthly_tax=49))
        # Крупные города
        session.add(RentalTaxRate(city_group="large_city", property_type="room", monthly_tax=33))
        session.add(RentalTaxRate(city_group="large_city", property_type="apartment", monthly_tax=33))
        session.add(RentalTaxRate(city_group="large_city", property_type="house", monthly_tax=33))
        # Прочие
        session.add(RentalTaxRate(city_group="other", property_type="room", monthly_tax=20))
        session.add(RentalTaxRate(city_group="other", property_type="apartment", monthly_tax=20))
        session.add(RentalTaxRate(city_group="other", property_type="house", monthly_tax=20))

        # Транспортные ставки (новая структура)
        transport_rates = [
            TransportTaxRate(
                vehicle_type="car", min_mass=0, max_mass=1.5, rate_2025=70, rate_2026=75
            ),
            TransportTaxRate(
                vehicle_type="car",
                min_mass=1.5,
                max_mass=1.75,
                rate_2025=92,
                rate_2026=99,
            ),
            TransportTaxRate(
                vehicle_type="car",
                min_mass=1.75,
                max_mass=2.0,
                rate_2025=116,
                rate_2026=124,
            ),
            TransportTaxRate(
                vehicle_type="car",
                min_mass=2.0,
                max_mass=2.25,
                rate_2025=138,
                rate_2026=148,
            ),
            TransportTaxRate(
                vehicle_type="car",
                min_mass=2.25,
                max_mass=2.5,
                rate_2025=161,
                rate_2026=177,
            ),
            TransportTaxRate(
                vehicle_type="car",
                min_mass=2.5,
                max_mass=3.0,
                rate_2025=183,
                rate_2026=196,
            ),
            TransportTaxRate(
                vehicle_type="car",
                min_mass=3.0,
                max_mass=100,
                rate_2025=253,
                rate_2026=270,
            ),
            TransportTaxRate(
                vehicle_type="motorcycle",
                min_mass=0,
                max_mass=100,
                rate_2025=46,
                rate_2026=49,
            ),
            TransportTaxRate(
                vehicle_type="trailer",
                min_mass=0,
                max_mass=0.75,
                rate_2025=46,
                rate_2026=49,
            ),
            TransportTaxRate(
                vehicle_type="trailer",
                min_mass=0.75,
                max_mass=100,
                rate_2025=253,
                rate_2026=270,
            ),
            # Грузовики (ст. 307-3 НК РБ)
            TransportTaxRate(
                vehicle_type="truck",
                min_mass=0,
                max_mass=3.5,
                rate_2025=150,
                rate_2026=154,
            ),
            TransportTaxRate(
                vehicle_type="truck",
                min_mass=3.5,
                max_mass=12.0,
                rate_2025=300,
                rate_2026=308,
            ),
            TransportTaxRate(
                vehicle_type="truck",
                min_mass=12.0,
                max_mass=100,
                rate_2025=500,
                rate_2026=513,
            ),
            # Автобусы (ст. 307-4 НК РБ)
            TransportTaxRate(
                vehicle_type="bus",
                min_mass=0,
                max_mass=20,
                rate_2025=200,
                rate_2026=205,
            ),
            TransportTaxRate(
                vehicle_type="bus",
                min_mass=21,
                max_mass=40,
                rate_2025=300,
                rate_2026=308,
            ),
            TransportTaxRate(
                vehicle_type="bus",
                min_mass=41,
                max_mass=1000,
                rate_2025=400,
                rate_2026=410,
            ),
        ]
        session.add_all(transport_rates)

        # Системные параметры
        params = [
            SystemParameter(key="progressive_threshold_1_2025", value="220000"),
            SystemParameter(key="progressive_threshold_2_2025", value="600000"),
            SystemParameter(key="progressive_threshold_1_2026", value="350000"),
            SystemParameter(key="progressive_threshold_2_2026", value="600000"),
            SystemParameter(key="base_tax_rate", value="0.13"),
            SystemParameter(key="higher_tax_rate", value="0.25"),
            SystemParameter(key="super_tax_rate", value="0.30"),
            SystemParameter(key="crypto_income_coefficient", value="0.0367"),
            SystemParameter(key="crypto_tax_rate", value="0.26"),
            SystemParameter(key="property_deduction_real_estate", value="0"),
            SystemParameter(key="property_deduction_auto", value="0.20"),
            SystemParameter(key="property_deduction_securities", value="0"),
        ]
        session.add_all(params)

        # Тестовый пользователь
        test_user = User(
            email="test@example.com", hashed_password=get_password_hash("test123")
        )
        session.add(test_user)

        # Администратор
        admin_user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            role="admin",
        )
        session.add(admin_user)

        await session.commit()
        print("База данных успешно пересоздана и заполнена актуальными данными.")


if __name__ == "__main__":
    asyncio.run(seed())
