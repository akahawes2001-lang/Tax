from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import AnnualIncomeRequest, IncomeTaxResponse
from app.services import calculate_income_tax

router = APIRouter(prefix="/api/v1", tags=["income"])


@router.post("/calculate-income-tax", response_model=IncomeTaxResponse)
async def income_tax(data: AnnualIncomeRequest, db: AsyncSession = Depends(get_db)):
    return await calculate_income_tax(data, db)
