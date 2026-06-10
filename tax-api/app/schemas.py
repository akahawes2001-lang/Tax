import re
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime, date


def validate_password_strong(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Пароль должен быть не менее 8 символов")
    if not re.search(r"[A-ZА-Я]", v):
        raise ValueError("Пароль должен содержать хотя бы одну заглавную букву")
    if not re.search(r"[0-9]", v):
        raise ValueError("Пароль должен содержать хотя бы одну цифру")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-\+=\[\]\\\\/]", v):
        raise ValueError("Пароль должен содержать хотя бы один спецсимвол")
    return v


class MonthlyIncome(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2100)
    salary: float = Field(..., ge=0)
    dividends: float = Field(0.0, ge=0)
    foreign_income: float = Field(0.0, ge=0)
    personal_income: float = Field(0.0, ge=0)
    children_birthdays: List[date] = Field(default_factory=list)
    is_single_parent: bool = Field(False, description="Одинокий родитель/опекун — 120 руб./мес. на ребёнка")
    is_large_family: bool = Field(False, description="Многодетная семья — 120 руб./мес. на ребёнка")
    disability_deduction: bool = Field(False)
    young_specialist_deduction: bool = Field(False)
    disabled_children_birthdays: List[date] = Field(default_factory=list)
    education_expenses: float = Field(0.0, ge=0)
    education_start_month: Optional[int] = Field(None, ge=1, le=12)
    education_end_month: Optional[int] = Field(None, ge=1, le=12)
    insurance_expenses: float = Field(0.0, ge=0)
    medical_expenses: float = Field(0.0, ge=0, description="Расходы на медицинские услуги")
    medicine_expenses: float = Field(0.0, ge=0, description="Расходы на лекарства (по рецепту)")
    alimony_paid: float = Field(0.0, ge=0, description="Сумма уплаченных алиментов (социальный вычет)")
    charity_amount: float = Field(0.0, ge=0, description="Сумма пожертвований на благотворительность (социальный вычет)")
    professional_deduction_category: Optional[str] = Field(
        None, pattern="^(literature|music|art|invention|other_20|other_30|other_40)$"
    )
    needs_housing_improvement: bool = Field(False)
    housing_expenses: float = Field(0.0, ge=0)
    is_union_member: bool = False
    pension_contributions: bool = False


class AnnualIncomeRequest(BaseModel):
    monthly_incomes: List[MonthlyIncome]


class MonthlyDetail(BaseModel):
    month: int
    taxable_income: float
    tax_withheld: float
    union_fee: float
    pension_fee: float


class IncomeTaxResponse(BaseModel):
    total_income: float
    total_withheld: float
    final_tax: float
    tax_without_deductions: float
    savings: float
    adjustment_due: float
    total_union_fees: float
    total_pension_fees: float
    total_tax_burden: float
    progressive_threshold_used: int
    monthly_details: List[MonthlyDetail]
    medical_deduction: float = Field(0.0, description="Социальный вычет на лечение и лекарства")
    alimony_deduction: float = Field(0.0, description="Социальный вычет на уплаченные алименты")
    charity_deduction: float = Field(0.0, description="Социальный вычет на благотворительность")


class DogTaxRequest(BaseModel):
    breed_type: str = Field(..., min_length=1)
    year: int = Field(..., gt=2020)
    number_of_dogs: int = Field(..., gt=0)
    quarters: int = Field(..., ge=1, le=4)
    is_disabled_12: bool = False
    is_pensioner: bool = False
    is_large_family: bool = False


class DogBreedResponse(BaseModel):
    id: int
    name: str
    is_dangerous: bool
    model_config = ConfigDict(from_attributes=True)


class TransportVehicle(BaseModel):
    vehicle_type: str = Field(..., min_length=1, description="Тип ТС: car, truck, bus, motorcycle, electric_motorcycle, trailer, trailer_caravan, boat, yacht, jet_ski, airplane, helicopter, electric_car")
    mass: float = Field(0.0, ge=0, description="Масса в тоннах (для авто, прицепов) или кг (для самолётов/вертолётов)")
    engine_capacity: Optional[int] = Field(None, ge=0, description="Объём двигателя в см³ (для мотоциклов)")
    power_hp: Optional[float] = Field(None, ge=0, description="Мощность мотора в л.с. (для лодок)")
    takeoff_weight: Optional[float] = Field(None, ge=0, description="Взлётная масса в кг (для самолётов, вертолётов)")
    year_of_manufacture: int = Field(..., ge=1900)
    is_luxury: bool = False
    is_electric: bool = False
    tax_year: int = Field(..., ge=2025)
    # Льготы по транспортному налогу (ст. 307-8 НК РБ)
    is_disabled_3: bool = Field(False, description="Инвалид III группы — скидка 50%")
    is_veteran: bool = Field(False, description="Ветеран боевых действий — освобождение")
    is_large_family: bool = Field(False, description="Многодетные — освобождение (1 автомобиль)")
    is_chernobyl: bool = Field(False, description="Чернобылец — освобождение")


class TransportTaxRequest(BaseModel):
    vehicles: List[TransportVehicle] = Field(..., min_length=1, description="Список транспортных средств")


class VehicleTaxDetail(BaseModel):
    vehicle_type: str
    mass: float = 0
    power_hp: Optional[float] = None
    takeoff_weight: Optional[float] = None
    tax_year: int
    calculated_tax: float
    note: Optional[str] = None


class TransportTaxResponse(BaseModel):
    total_tax: float
    vehicles_details: List[VehicleTaxDetail]


class DepositItem(BaseModel):
    amount: float = Field(..., gt=0, description="Сумма вклада")
    currency: str = Field(..., pattern="^(BYN|USD|EUR)$", description="Валюта вклада")
    annual_rate_percent: float = Field(..., ge=0, description="Годовая ставка в %")
    term_days: int = Field(..., gt=0, description="Срок в днях")
    early_termination: bool = Field(False, description="Досрочное расторжение — льгота утрачивается")


class DepositTaxRequest(BaseModel):
    deposits: List[DepositItem] = Field(..., min_length=1, description="Список вкладов")
    annual_income: Optional[float] = Field(None, ge=0, description="Годовой доход для прогрессивной ставки")


class DepositDetail(BaseModel):
    amount: float
    currency: str
    annual_rate_percent: float
    term_days: int
    interest_income: float
    tax_rate: float
    tax: float
    exempt: bool


class DepositTaxResponse(BaseModel):
    total_interest: float
    total_tax: float
    tax_rate: float
    deposits_details: List[DepositDetail]


class RentalTaxRequest(BaseModel):
    city: str = Field(..., min_length=1)
    property_type: str = Field(..., pattern="^(room|apartment|house|garage|parking_spot|dacha|garden_house)$")
    months: int = Field(..., gt=0)
    rooms: Optional[int] = Field(None, ge=1, description="Количество комнат (для Минска и облцентров влияет на ставку)")


class CryptoTaxRequest(BaseModel):
    gross_income: float = Field(..., gt=0)


class PropertySaleRequest(BaseModel):
    property_type: str = Field(..., pattern="^(real_estate|auto|securities)$")
    sale_price: float = Field(..., gt=0)
    acquisition_cost: Optional[float] = Field(None, ge=0)
    apply_deduction: bool = False
    sole_property_5_years: bool = False


class PropertyTaxRequest(BaseModel):
    cadastral_value: float = Field(..., gt=0, description="Кадастровая стоимость объекта")
    property_type: str = Field(..., pattern="^(apartment|house|garage|outbuilding|land)$")
    region: str = Field(..., min_length=1, description="Регион (область)")
    is_pensioner: bool = False
    is_large_family: bool = False
    is_disabled_1_2: bool = Field(False, description="Инвалид I или II группы — полное освобождение")
    is_chernobyl_victim: bool = Field(False, description="Чернобылец — полное освобождение")
    is_veteran: bool = Field(False, description="Ветеран боевых действий — полное освобождение")


class PropertyTaxResponse(BaseModel):
    cadastral_value: float
    property_type: str
    region: str
    base_rate: Optional[float] = None
    region_coefficient: Optional[float] = None
    calculated_tax: float
    note: Optional[str] = None
    benefits_applied: bool
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(..., min_length=1)
    referral_code: Optional[str] = None
    captcha_token: Optional[str] = Field(None, description="Токен reCAPTCHA для проверки")

    _validate_password = field_validator("password")(validate_password_strong)


class UserLogin(BaseModel):
    email: str
    password: str
    captcha_token: Optional[str] = Field(None, description="Токен reCAPTCHA для проверки")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HistoryCreate(BaseModel):
    name: str
    category: str
    tax: float
    details_json: Optional[str] = None


class HistoryUpdate(BaseModel):
    name: Optional[str] = None
    tax: Optional[float] = None
    details_json: Optional[str] = None


class HistoryResponse(BaseModel):
    id: int
    name: str
    category: str
    tax: float
    details_json: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class HistoryDetailResponse(BaseModel):
    id: int
    name: str
    category: str
    tax: float
    details_json: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class PaginatedHistoryResponse(BaseModel):
    items: List[HistoryResponse]
    total: int
    page: int
    limit: int


class ReviewCreate(BaseModel):
    text: str = Field(..., min_length=10, description="Текст отзыва")
    rating: int = Field(default=5, ge=1, le=5, description="Оценка от 1 до 5")
    author_name: str = Field(..., min_length=1, description="Имя автора отзыва")


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    text: str
    rating: int
    author_name: str = ""
    approved: bool
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class RequestPasswordReset(BaseModel):
    email: str = Field(..., pattern=r"^\S+@\S+\.\S+$")
    captcha_token: Optional[str] = Field(None, description="Токен reCAPTCHA для проверки")


class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(..., min_length=1)

    _validate_password = field_validator("new_password")(validate_password_strong)


class VerifyEmail(BaseModel):
    token: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=1)

    _validate_password = field_validator("new_password")(validate_password_strong)


class ChangeEmailRequest(BaseModel):
    new_email: str = Field(..., pattern=r"^\S+@\S+\.\S+$")


class ProfileStatsResponse(BaseModel):
    calculations: int
    total_tax: float
    reviews: int
    registered_at: str


class LandTaxRequest(BaseModel):
    cadastral_value: float = Field(..., gt=0, description="Кадастровая стоимость участка")
    land_category: str = Field(..., pattern="^(agricultural|residential|industrial|other)$")
    region: str = Field(..., min_length=1, description="Регион (область)")
    area_hectares: float = Field(..., gt=0, description="Площадь участка в гектарах")
    is_pensioner: bool = False
    is_large_family: bool = False
    is_disabled_1_2: bool = Field(False, description="Инвалид I или II группы — полное освобождение")
    is_chernobyl_victim: bool = Field(False, description="Чернобылец — полное освобождение")
    is_veteran: bool = Field(False, description="Ветеран боевых действий — полное освобождение")


class LandTaxResponse(BaseModel):
    tax_amount: float
    details: str
    applied_rate: float
    is_exempt: bool
    model_config = ConfigDict(from_attributes=True)


class CraftTaxRequest(BaseModel):
    is_craftsman: bool
    year: int = 2025


class CraftTaxResponse(BaseModel):
    tax_amount: float
    details: str
    is_craftsman: bool
    model_config = ConfigDict(from_attributes=True)


class AgroTaxRequest(BaseModel):
    is_agro_owner: bool
    year: int = 2025


class AgroTaxResponse(BaseModel):
    tax_amount: float
    details: str
    is_agro_owner: bool
    model_config = ConfigDict(from_attributes=True)


class IpTaxRequest(BaseModel):
    activity_type: str = Field(..., min_length=1, description="Вид деятельности из справочника")
    city_type: str = Field(..., pattern="^(minsk|regional_city|large_city|other)$", description="Тип населённого пункта")
    is_preferential: bool = Field(False, description="Льгота (например, для плательщиков впервые)")


class IpTaxResponse(BaseModel):
    tax_amount: float
    details: str
    applied_rate: float
    model_config = ConfigDict(from_attributes=True)