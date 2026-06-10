from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import DepositTaxRule
from app.schemas import DepositTaxRequest, DepositTaxResponse, DepositDetail

router = APIRouter(prefix="/api/v1", tags=["deposit"])

# Дефолтные сроки освобождения (в месяцах), если в БД нет записей
DEFAULT_EXEMPTION_MONTHS = {
    "BYN": 12,
    "USD": 24,
    "EUR": 24,
    "RUB": 12,
}


async def _get_exemption_months(currency: str, db: AsyncSession) -> int:
    """Получить минимальный срок освобождения для валюты из БД или дефолт."""
    result = await db.execute(
        select(DepositTaxRule).where(DepositTaxRule.currency_type == currency)
    )
    rule = result.scalars().first()
    if rule:
        return rule.min_term_months_for_exemption
    return DEFAULT_EXEMPTION_MONTHS.get(currency, 12)


@router.post("/calculate-deposit-tax", response_model=DepositTaxResponse)
async def deposit_tax(req: DepositTaxRequest, db: AsyncSession = Depends(get_db)):
    # 1. Определяем ставку налога на основе общего годового дохода
    tax_rate = 0.13
    if req.annual_income and req.annual_income > 350_000:
        tax_rate = 0.25

    total_interest = 0.0
    total_tax = 0.0
    deposits_details: list[DepositDetail] = []

    for dep in req.deposits:
        term_years = dep.term_days / 365.0
        interest_income = dep.amount * (dep.annual_rate_percent / 100) * term_years

        # Проверяем освобождение по сроку
        min_term_months = await _get_exemption_months(dep.currency, db)
        term_months = dep.term_days / 30.44
        # По ст. 201 НК РБ: при досрочном расторжении льгота утрачивается
        exempt = (term_months >= min_term_months) and not dep.early_termination

        if exempt:
            tax = 0.0
        else:
            tax = round(interest_income * tax_rate, 2)

        total_interest += interest_income
        total_tax += tax

        deposits_details.append(
            DepositDetail(
                amount=dep.amount,
                currency=dep.currency,
                annual_rate_percent=dep.annual_rate_percent,
                term_days=dep.term_days,
                interest_income=round(interest_income, 2),
                tax_rate=tax_rate,
                tax=tax,
                exempt=exempt,
            )
        )

    # Округляем итоги
    total_interest = round(total_interest, 2)
    total_tax = round(total_tax, 2)

    return DepositTaxResponse(
        total_interest=total_interest,
        total_tax=total_tax,
        tax_rate=tax_rate,
        deposits_details=deposits_details,
    )