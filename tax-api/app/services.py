from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from app.schemas import AnnualIncomeRequest, IncomeTaxResponse, MonthlyDetail
from app.utils import get_param_float, get_param_int

STANDARD_DEDUCTION = 216.0
STANDARD_INCOME_LIMIT = 1308.0
CHILD_DEDUCTION = 63.0
ENHANCED_CHILD_DEDUCTION = 120.0
DISABILITY_DEDUCTION = 306.0
YOUNG_SPECIALIST_DEDUCTION = 860.0
DISABLED_CHILD_DEDUCTION = 120.0
MAX_TOTAL_DEDUCTION = 306.0
DIVIDEND_THRESHOLD = 350_000.0
DIVIDEND_RATE_BASIC = 0.13
DIVIDEND_RATE_HIGHER = 0.25
PERSONAL_INCOME_EXEMPTION = 6000.0

PROFESSIONAL_DEDUCTION_RATES = {
    "literature": 0.20,
    "music": 0.30,
    "art": 0.40,
    "invention": 0.40,
    "other_20": 0.20,
    "other_30": 0.30,
    "other_40": 0.40,
}


def is_child_eligible(birthday: date, month_start: date) -> bool:
    try:
        eighteenth = date(birthday.year + 18, birthday.month, birthday.day)
    except ValueError:
        eighteenth = date(birthday.year + 18, 2, 28)
    return month_start < eighteenth


async def calculate_income_tax(
    data: AnnualIncomeRequest, db: AsyncSession
) -> IncomeTaxResponse:
    monthly_details = []
    total_salary = 0.0
    total_taxable_salary = 0.0
    total_taxable_salary_no_deductions = (
        0.0  # налоговая база без вычетов (только зарплата)
    )
    total_foreign = 0.0
    total_dividends = 0.0
    total_personal = 0.0
    total_withheld = 0.0
    total_union = 0.0
    total_pension = 0.0

    base_rate = await get_param_float(db, "base_tax_rate", 0.13)
    higher_rate = await get_param_float(db, "higher_tax_rate", 0.25)
    super_rate = await get_param_float(db, "super_tax_rate", 0.30)

    for inc in data.monthly_incomes:
        month_start = date(inc.year, inc.month, 1)

        has_professional = (
            inc.professional_deduction_category
            and inc.professional_deduction_category in PROFESSIONAL_DEDUCTION_RATES
        )

        # По НК ст. 213: профессиональные вычеты применяются ВМЕСТО стандартных
        # к доходам от авторских прав/изобретений (не по трудовому договору)
        if has_professional:
            auto_standard = 0.0
            children_deduction = 0.0
            disabled_children_deduction = 0.0
        else:
            auto_standard = (
                STANDARD_DEDUCTION if inc.salary <= STANDARD_INCOME_LIMIT else 0.0
            )

            children_deduction = 0.0
            for bday in inc.children_birthdays:
                if is_child_eligible(bday, month_start):
                    rate = (
                        ENHANCED_CHILD_DEDUCTION
                        if inc.is_single_parent or inc.is_large_family
                        else CHILD_DEDUCTION
                    )
                    children_deduction += rate

            disabled_children_deduction = 0.0
            for bday in inc.disabled_children_birthdays:
                if is_child_eligible(bday, month_start):
                    disabled_children_deduction += DISABLED_CHILD_DEDUCTION

        disability_deduction = DISABILITY_DEDUCTION if inc.disability_deduction else 0.0
        young_deduction = (
            YOUNG_SPECIALIST_DEDUCTION if inc.young_specialist_deduction else 0.0
        )
        education_deduction = inc.education_expenses
        insurance_deduction = inc.insurance_expenses
        medical_deduction = inc.medical_expenses + inc.medicine_expenses
        housing_deduction = (
            inc.housing_expenses if inc.needs_housing_improvement else 0.0
        )

        professional_deduction = 0.0
        if has_professional:
            rate = PROFESSIONAL_DEDUCTION_RATES[inc.professional_deduction_category]
            professional_deduction = inc.salary * rate

        limited_deductions = min(
            auto_standard + children_deduction + disabled_children_deduction,
            MAX_TOTAL_DEDUCTION,
        )
        total_deductions = (
            limited_deductions
            + disability_deduction
            + young_deduction
            + education_deduction
            + insurance_deduction
            + housing_deduction
            + professional_deduction
        )

        taxable_salary = max(inc.salary - total_deductions, 0)
        monthly_tax = round(taxable_salary * base_rate, 2)

        total_salary += inc.salary
        total_taxable_salary += taxable_salary
        total_taxable_salary_no_deductions += inc.salary  # без вычетов
        total_foreign += inc.foreign_income
        total_dividends += inc.dividends
        total_personal += inc.personal_income
        total_withheld += monthly_tax

        union_fee = round(inc.salary * 0.01, 2) if inc.is_union_member else 0.0
        pension_fee = round(inc.salary * 0.01, 2)  # ФСЗН 1% — обязательный для всех работающих (ст. 56-57 НК)
        total_union += union_fee
        total_pension += pension_fee

        monthly_details.append(
            MonthlyDetail(
                month=inc.month,
                taxable_income=taxable_salary,
                tax_withheld=monthly_tax,
                union_fee=union_fee,
                pension_fee=pension_fee,
            )
        )

    # Налог без вычетов (только зарплата, дивиденды, зарубежный доход и доход от физлиц считаются отдельно)
    year = data.monthly_incomes[0].year if data.monthly_incomes else 2026
    threshold_key_1 = f"progressive_threshold_1_{year}"
    threshold_key_2 = f"progressive_threshold_2_{year}"
    threshold_1 = await get_param_int(db, threshold_key_1, 350_000)
    threshold_2 = await get_param_int(db, threshold_key_2, 600_000)

    combined_no_deductions = total_taxable_salary_no_deductions + total_foreign
    if combined_no_deductions > threshold_2:
        no_ded_tax = (
            round(threshold_1 * base_rate, 2)
            + round((threshold_2 - threshold_1) * higher_rate, 2)
            + round((combined_no_deductions - threshold_2) * super_rate, 2)
        )
    elif combined_no_deductions > threshold_1:
        no_ded_tax = round(threshold_1 * base_rate, 2) + round(
            (combined_no_deductions - threshold_1) * higher_rate, 2
        )
    else:
        no_ded_tax = round(combined_no_deductions * base_rate, 2)

    # Налог с вычетами (зарплата + зарубежный доход)
    combined_taxable = total_taxable_salary + total_foreign
    if combined_taxable > threshold_2:
        main_tax = (
            round(threshold_1 * base_rate, 2)
            + round((threshold_2 - threshold_1) * higher_rate, 2)
            + round((combined_taxable - threshold_2) * super_rate, 2)
        )
    elif combined_taxable > threshold_1:
        main_tax = round(threshold_1 * base_rate, 2) + round(
            (combined_taxable - threshold_1) * higher_rate, 2
        )
    else:
        main_tax = round(combined_taxable * base_rate, 2)

    # Дивиденды
    if total_dividends > DIVIDEND_THRESHOLD:
        dividend_tax = round(
            DIVIDEND_THRESHOLD * DIVIDEND_RATE_BASIC
            + (total_dividends - DIVIDEND_THRESHOLD) * DIVIDEND_RATE_HIGHER,
            2,
        )
    else:
        dividend_tax = round(total_dividends * DIVIDEND_RATE_BASIC, 2)

    # Доход от физлиц
    taxable_personal = max(total_personal - PERSONAL_INCOME_EXEMPTION, 0)
    personal_tax = round(taxable_personal * base_rate, 2)

    # Налог без применения вычетов (нужен для ограничения социальных вычетов)
    tax_without_deductions = no_ded_tax + dividend_tax + personal_tax

    # Социальные вычеты (обучение + страховки + лечение + лекарства + алименты)
    # Ограничение: не более 50% от суммы налога до применения вычетов
    total_social_deduction = (
        sum(inc.education_expenses + inc.insurance_expenses + inc.medical_expenses + inc.medicine_expenses
            for inc in data.monthly_incomes)
    )
    total_alimony_paid = sum(inc.alimony_paid for inc in data.monthly_incomes)
    max_social_deduction = tax_without_deductions * 0.5
    if total_social_deduction > max_social_deduction:
        total_social_deduction = max_social_deduction

    # Вычет на уплаченные алименты (ст. 210 НК РБ) — в пределах оставшегося лимита
    remaining_limit = max_social_deduction - total_social_deduction
    alimony_deduction = min(total_alimony_paid, remaining_limit)
    if alimony_deduction < 0:
        alimony_deduction = 0.0

    # Вычет на благотворительность (ст. 210 НК РБ) — в пределах оставшегося лимита
    total_charity = sum(inc.charity_amount for inc in data.monthly_incomes)
    remaining_limit_after_alimony = max_social_deduction - total_social_deduction - alimony_deduction
    if remaining_limit_after_alimony < 0:
        remaining_limit_after_alimony = 0.0
    charity_deduction = min(total_charity, remaining_limit_after_alimony)
    if charity_deduction < 0:
        charity_deduction = 0.0

    # Пересчитываем налог с учётом ограничения социальных вычетов
    # Распределяем ограничение пропорционально между месяцами
    total_education = sum(inc.education_expenses for inc in data.monthly_incomes)
    total_insurance = sum(inc.insurance_expenses for inc in data.monthly_incomes)
    total_medical = sum(inc.medical_expenses + inc.medicine_expenses for inc in data.monthly_incomes)
    total_raw_social = total_education + total_insurance + total_medical

    if total_raw_social > 0:
        ratio = total_social_deduction / total_raw_social
    else:
        ratio = 1.0

    # Пересчитываем monthly_details с учётом ограничения
    total_taxable_salary_adjusted = 0.0
    total_withheld_adjusted = 0.0
    monthly_details_adjusted = []

    for inc in data.monthly_incomes:
        month_start = date(inc.year, inc.month, 1)

        has_professional = (
            inc.professional_deduction_category
            and inc.professional_deduction_category in PROFESSIONAL_DEDUCTION_RATES
        )

        # По НК ст. 213: профессиональные вычеты применяются ВМЕСТО стандартных
        if has_professional:
            auto_standard = 0.0
            children_deduction = 0.0
            disabled_children_deduction = 0.0
        else:
            auto_standard = (
                STANDARD_DEDUCTION if inc.salary <= STANDARD_INCOME_LIMIT else 0.0
            )

            children_deduction = 0.0
            for bday in inc.children_birthdays:
                if is_child_eligible(bday, month_start):
                    rate = (
                        ENHANCED_CHILD_DEDUCTION
                        if inc.is_single_parent or inc.is_large_family
                        else CHILD_DEDUCTION
                    )
                    children_deduction += rate

            disabled_children_deduction = 0.0
            for bday in inc.disabled_children_birthdays:
                if is_child_eligible(bday, month_start):
                    disabled_children_deduction += DISABLED_CHILD_DEDUCTION

        disability_deduction = DISABILITY_DEDUCTION if inc.disability_deduction else 0.0
        young_deduction = (
            YOUNG_SPECIALIST_DEDUCTION if inc.young_specialist_deduction else 0.0
        )

        education_deduction = inc.education_expenses * ratio
        insurance_deduction = inc.insurance_expenses * ratio
        medical_deduction_month = (inc.medical_expenses + inc.medicine_expenses) * ratio

        housing_deduction = (
            inc.housing_expenses if inc.needs_housing_improvement else 0.0
        )

        professional_deduction = 0.0
        if has_professional:
            rate = PROFESSIONAL_DEDUCTION_RATES[inc.professional_deduction_category]
            professional_deduction = inc.salary * rate

        limited_deductions = min(
            auto_standard + children_deduction + disabled_children_deduction,
            MAX_TOTAL_DEDUCTION,
        )
        total_deductions = (
            limited_deductions
            + disability_deduction
            + young_deduction
            + education_deduction
            + insurance_deduction
            + medical_deduction_month
            + housing_deduction
            + professional_deduction
        )

        taxable_salary = max(inc.salary - total_deductions, 0)
        monthly_tax = round(taxable_salary * base_rate, 2)

        total_taxable_salary_adjusted += taxable_salary
        total_withheld_adjusted += monthly_tax

        union_fee = round(inc.salary * 0.01, 2) if inc.is_union_member else 0.0
        pension_fee = round(inc.salary * 0.01, 2)  # ФСЗН 1% — обязательный для всех работающих (ст. 56-57 НК)

        monthly_details_adjusted.append(
            MonthlyDetail(
                month=inc.month,
                taxable_income=taxable_salary,
                tax_withheld=monthly_tax,
                union_fee=union_fee,
                pension_fee=pension_fee,
            )
        )

    # Пересчитываем налог с учётом скорректированных вычетов
    combined_taxable_adjusted = total_taxable_salary_adjusted + total_foreign
    if combined_taxable_adjusted > threshold_2:
        main_tax_adjusted = (
            round(threshold_1 * base_rate, 2)
            + round((threshold_2 - threshold_1) * higher_rate, 2)
            + round((combined_taxable_adjusted - threshold_2) * super_rate, 2)
        )
    elif combined_taxable_adjusted > threshold_1:
        main_tax_adjusted = round(threshold_1 * base_rate, 2) + round(
            (combined_taxable_adjusted - threshold_1) * higher_rate, 2
        )
    else:
        main_tax_adjusted = round(combined_taxable_adjusted * base_rate, 2)

    final_tax_adjusted = main_tax_adjusted + dividend_tax + personal_tax
    savings_adjusted = round(tax_without_deductions - final_tax_adjusted, 2)
    adjustment_adjusted = round(final_tax_adjusted - total_withheld, 2)
    total_burden_adjusted = round(final_tax_adjusted + total_union + total_pension, 2)

    # Сумма вычета на лечение/лекарства (с учётом ограничения)
    medical_deduction_total = round(total_medical * ratio, 2)

    return IncomeTaxResponse(
        total_income=total_salary + total_dividends + total_foreign + total_personal,
        total_withheld=total_withheld_adjusted,
        final_tax=final_tax_adjusted,
        tax_without_deductions=tax_without_deductions,
        savings=savings_adjusted,
        adjustment_due=adjustment_adjusted,
        total_union_fees=total_union,
        total_pension_fees=total_pension,
        total_tax_burden=total_burden_adjusted,
        progressive_threshold_used=threshold_1,
        monthly_details=monthly_details_adjusted,
        medical_deduction=medical_deduction_total,
        alimony_deduction=round(alimony_deduction, 2),
        charity_deduction=round(charity_deduction, 2),
    )
