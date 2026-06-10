import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models import User, TransportTaxRate
from app.auth import get_password_hash
from app.database import engine as prod_engine

# Используем SQLite для тестов
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_audit.db"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def session(engine):
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as s:
        yield s

@pytest.fixture
async def client(engine):
    app.dependency_overrides[get_db] = lambda: session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
async def db_session(engine, session):
    yield session

@pytest.fixture
async def admin_user(db_session: AsyncSession):
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("AdminPass123!"),
        role="admin",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user

@pytest.fixture
async def normal_user(db_session: AsyncSession):
    user = User(
        email="user@test.com",
        hashed_password=get_password_hash("UserPass123!"),
        role="user",
        is_verified=True,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user

@pytest.fixture
async def admin_token(client, admin_user):
    response = await client.post(
        "/api/v1/auth/login", json={"email": "admin@test.com", "password": "AdminPass123!", "captcha_token": ""}
    )
    data = response.json()
    return data.get("access_token", "")

@pytest.fixture
async def user_token(client, normal_user):
    response = await client.post(
        "/api/v1/auth/login", json={"email": "user@test.com", "password": "UserPass123!", "captcha_token": ""}
    )
    data = response.json()
    return data.get("access_token", "")

@pytest.fixture
async def seed_transport_rates(db_session: AsyncSession):
    rates = [
        TransportTaxRate(vehicle_type="car", min_mass=0, max_mass=1.5, rate_2025=61, rate_2026=61, is_luxury=False),
        TransportTaxRate(vehicle_type="car", min_mass=1.5, max_mass=1.75, rate_2025=81, rate_2026=81, is_luxury=False),
        TransportTaxRate(vehicle_type="car", min_mass=1.75, max_mass=2.0, rate_2025=102, rate_2026=102, is_luxury=False),
        TransportTaxRate(vehicle_type="car", min_mass=2.0, max_mass=2.25, rate_2025=122, rate_2026=122, is_luxury=False),
        TransportTaxRate(vehicle_type="car", min_mass=2.25, max_mass=999, rate_2025=153, rate_2026=153, is_luxury=False),
        TransportTaxRate(vehicle_type="truck", min_mass=0, max_mass=999, rate_2025=25, rate_2026=25, is_luxury=False),
        TransportTaxRate(vehicle_type="bus", min_mass=0, max_mass=999, rate_2025=25, rate_2026=25, is_luxury=False),
        TransportTaxRate(vehicle_type="motorcycle", min_mass=0, max_mass=999, rate_2025=22, rate_2026=22, is_luxury=False),
        TransportTaxRate(vehicle_type="car", min_mass=0, max_mass=999, rate_2025=1530, rate_2026=1530, is_luxury=True, luxury_coefficient=10.0),
    ]
    for r in rates:
        db_session.add(r)
    await db_session.commit()