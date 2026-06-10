from fastapi import APIRouter
from app.schemas import AgroTaxRequest, AgroTaxResponse

router = APIRouter(prefix="/api/v1/agro-tax", tags=["agro_tax"])

AGRO_TAX_RATE = 42  # 1 базовая величина для 2025 года


@router.post("/calculate", response_model=AgroTaxResponse)
def calculate_agro_tax(request: AgroTaxRequest):
    """
    Расчёт сбора за осуществление деятельности в сфере агроэкотуризма.
    Ставка: 1 базовая величина (42 руб.) в год.
    """
    if request.is_agro_owner:
        tax_amount = float(AGRO_TAX_RATE)
        details = "Ставка: 1 БВ (42 руб.)"
    else:
        tax_amount = 0.0
        details = "Не является владельцем агроусадьбы. Сбор не начисляется."

    return AgroTaxResponse(
        tax_amount=tax_amount,
        details=details,
        is_agro_owner=request.is_agro_owner,
    )
