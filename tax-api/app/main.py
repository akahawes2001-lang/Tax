# tax-api/app/main.py
import os
import logging
import sentry_sdk
from loguru import logger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.routers import (
    income,
    transport,
    deposit,
    dog,
    rental,
    crypto,
    property_sale,
    property_tax,
    land_tax,
    craft_tax,
    agro_tax,
    ip_tax,
    history,
    auth,
    admin,
    car_catalog,
    settlements,
    profile,
    reviews,
)
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter_setup import limiter

# Настройка Sentry (мониторинг ошибок)
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN", ""),
    traces_sample_rate=1.0,
    environment=os.getenv("ENVIRONMENT", "development"),
)

# Structured logging (loguru)
os.makedirs("logs", exist_ok=True)
logging.basicConfig(handlers=[logging.NullHandler()])
logger.add("logs/taxbel.json", format="{time} {level} {message}", rotation="10 MB", serialize=True)
logger.add(lambda msg: print(msg, end=""), format="{time} {level} {message}", colorize=True)

app = FastAPI(title="TaxBel API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class CSPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if not request.url.path.startswith("/docs") and not request.url.path.startswith("/redoc"):
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' https://www.google.com https://www.gstatic.com 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "frame-src https://www.google.com;"
            )
        return response

# CSP Middleware
app.add_middleware(CSPMiddleware)

# CORS: читаем из .env или используем дефолт для разработки
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(income.router)
app.include_router(transport.router)
app.include_router(deposit.router)
app.include_router(dog.router)
app.include_router(rental.router)
app.include_router(crypto.router)
app.include_router(property_sale.router)
app.include_router(property_tax.router)
app.include_router(land_tax.router)
app.include_router(craft_tax.router)
app.include_router(agro_tax.router)
app.include_router(ip_tax.router)
app.include_router(history.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(car_catalog.router)
app.include_router(settlements.router)
app.include_router(profile.router)
app.include_router(reviews.router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "TaxBel API is running"}


@app.post("/run-seed")
async def run_seed():
    import subprocess, sys, os
    scripts = ["seed.py", "import_breeds.py", "import_cars_final.py"]
    results = []
    for script in scripts:
        try:
            result = subprocess.run(
                [sys.executable, script],
                capture_output=True,
                text=True,
                cwd="tax-api"
            )
            results.append({
                "script": script,
                "status": "ok",
                "stdout": result.stdout[-200:],  # последние 200 символов, чтобы не перегружать ответ
                "stderr": result.stderr[-200:]
            })
        except Exception as e:
            results.append({
                "script": script,
                "status": "error",
                "message": str(e)
            })
    return {"results": results}


@app.get("/health")
async def health():
    """Health-check эндпоинт."""
    db_status = "ok"
    try:
        async with engine.connect() as conn:
            await conn.execute(engine.dialect.statement.compile(
                engine.dialect,
                lambda s: s
            ))
    except Exception:
        db_status = "error"
    return {
        "status": "healthy" if db_status == "ok" else "degraded",
        "database": db_status,
        "version": "1.0.0",
    }