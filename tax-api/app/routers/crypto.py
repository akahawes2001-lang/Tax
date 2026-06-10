from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import CryptoTaxRequest
from app.utils import get_param_float

router = APIRouter(prefix="/api/v1", tags=["crypto"])


@router.post("/calculate-crypto-tax")
async def crypto_tax(req: CryptoTaxRequest, db: AsyncSession = Depends(get_db)):
    # Коэффициент доходности на 2026 год – 0.0367
    coef = await get_param_float(db, "crypto_income_coefficient", 0.0367)
    # Ставка налога – 26%
    tax_rate = await get_param_float(db, "crypto_tax_rate", 0.26)
    tax_base = req.gross_income * coef
    tax = round(tax_base * tax_rate, 2)
    return {
        "gross_income": req.gross_income,
        "coefficient": coef,
        "taxable_base": round(tax_base, 2),
        "rate": tax_rate,
        "tax": tax,
    }
