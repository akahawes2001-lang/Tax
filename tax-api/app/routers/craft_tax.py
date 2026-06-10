from fastapi import APIRouter
from app.schemas import CraftTaxRequest, CraftTaxResponse

router = APIRouter(prefix="/api/v1/craft-tax", tags=["craft_tax"])

# Ставка: 1 базовая величина (42 руб. для 2025 года)
CRAFT_TAX_RATE = 42


@router.post("/calculate", response_model=CraftTaxResponse)
async def craft_tax(req: CraftTaxRequest):
    if req.is_craftsman:
        tax_amount = CRAFT_TAX_RATE
        details = (
            f"Статус: ремесленник\n"
            f"Ставка: 1 базовая величина (42 руб.)\n"
            f"Итоговая сумма: {tax_amount} руб."
        )
    else:
        tax_amount = 0
        details = "Статус: не ремесленник. Сбор не начисляется."

    return CraftTaxResponse(
        tax_amount=tax_amount,
        details=details,
        is_craftsman=req.is_craftsman,
    )
