from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import PropertySaleRequest
from app.utils import get_param_float

router = APIRouter(prefix="/api/v1", tags=["property_sale"])


@router.post("/calculate-property-sale-tax")
async def property_sale(req: PropertySaleRequest, db: AsyncSession = Depends(get_db)):
    # Правило "одного объекта": если это недвижимость и чекбокс включён, налог = 0
    if req.property_type == "real_estate" and req.sole_property_5_years:
        return {
            "property_type": req.property_type,
            "sale_price": req.sale_price,
            "taxable_amount": 0.0,
            "tax": 0.0,
            "deduction_applied": False,
            "note": "Освобождено: единственное жильё, продаваемое не чаще раза в 5 лет",
        }

    if req.apply_deduction:
        if req.property_type == "auto":
            # Вычет 20%, но не более 10 000 руб. (ст. 222 п.2 НК РБ)
            deduction = min(req.sale_price * 0.20, 10000.0)
            taxable = max(req.sale_price - deduction, 0)
        elif req.property_type == "real_estate":
            # Вычет 20% от суммы дохода (ст. 222 п.1 НК РБ)
            taxable = max(req.sale_price * 0.80, 0)
        else:
            deduction = await get_param_float(
                db, f"property_deduction_{req.property_type}", 0
            )
            taxable = max(req.sale_price - deduction, 0)
    else:
        cost = req.acquisition_cost if req.acquisition_cost else 0
        taxable = max(req.sale_price - cost, 0)

    tax_rate = await get_param_float(db, "base_tax_rate", 0.13)
    tax = round(taxable * tax_rate, 2)
    return {
        "property_type": req.property_type,
        "sale_price": req.sale_price,
        "taxable_amount": taxable,
        "tax": tax,
        "deduction_applied": req.apply_deduction,
    }
