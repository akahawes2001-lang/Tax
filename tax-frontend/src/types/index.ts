export interface MonthlyIncome {
    month: number;
    year: number;
    salary: number;
    dividends?: number;
    foreign_income?: number;
    personal_income?: number;
    children_birthdays: string[];
    enhanced_child_deduction?: boolean;
    disability_deduction?: boolean;
    young_specialist_deduction?: boolean;
    disabled_children_birthdays?: string[];
    education_expenses?: number;
    education_start_month?: number | null;
    education_end_month?: number | null;
    insurance_expenses?: number;
    medical_expenses?: number;
    medicine_expenses?: number;
    professional_deduction_category?: string | null;
    needs_housing_improvement?: boolean;
    housing_expenses?: number;
    is_union_member?: boolean;
    pension_contributions?: boolean;
}

export interface IncomeTaxResponse {
    total_income: number;
    total_withheld: number;
    final_tax: number;
    tax_without_deductions: number;
    savings: number;
    adjustment_due: number;
    total_union_fees: number;
    total_pension_fees: number;
    total_tax_burden: number;
    progressive_threshold_used: number;
    monthly_details: MonthlyDetail[];
    medical_deduction: number;
}

export interface MonthlyDetail {
    month: number;
    taxable_income: number;
    tax_withheld: number;
    union_fee: number;
    pension_fee: number;
}

export interface DogTaxRequest {
    breed_type: string;
    year: number;
    number_of_dogs: number;
    quarters: number;
    is_disabled_12?: boolean;
    is_pensioner?: boolean;
    is_large_family?: boolean;
}

export interface DogTaxResponse {
    breed_type: string;
    year: number;
    rate_per_quarter: number;
    total_tax: number;
}

export interface DogBreed {
    id: number;
    name: string;
    is_dangerous: boolean;
}

export interface TransportVehicle {
    vehicle_type: string;
    mass: number;
    engine_capacity?: number | null;
    power_hp?: number | null;
    takeoff_weight?: number | null;
    year_of_manufacture: number;
    is_luxury: boolean;
    is_electric: boolean;
    tax_year: number;
}

export interface TransportTaxRequest {
    vehicles: TransportVehicle[];
}

export interface VehicleTaxDetail {
    vehicle_type: string;
    mass: number;
    power_hp?: number | null;
    takeoff_weight?: number | null;
    tax_year: number;
    calculated_tax: number;
    note?: string | null;
}

export interface TransportTaxResponse {
    total_tax: number;
    vehicles_details: VehicleTaxDetail[];
}

export interface DepositItem {
    amount: number;
    currency: string;
    annual_rate_percent: number;
    term_days: number;
}

export interface DepositTaxRequest {
    deposits: DepositItem[];
    annual_income?: number;
}

export interface DepositDetail {
    amount: number;
    currency: string;
    annual_rate_percent: number;
    term_days: number;
    interest_income: number;
    tax_rate: number;
    tax: number;
    exempt: boolean;
}

export interface DepositTaxResponse {
    total_interest: number;
    total_tax: number;
    tax_rate: number;
    deposits_details: DepositDetail[];
}

export interface RentalTaxRequest {
    city: string;
    property_type: string;
    months: number;
}

export interface RentalTaxResponse {
    city_group: string;
    monthly_tax: number;
    total_tax: number;
}

export interface CryptoTaxRequest {
    gross_income: number;
}

export interface CryptoTaxResponse {
    gross_income: number;
    coefficient: number;
    taxable_base: number;
    rate: number;
    tax: number;
}

export interface PropertySaleRequest {
    property_type: string;
    sale_price: number;
    acquisition_cost?: number;
    apply_deduction: boolean;
}

export interface PropertyTaxRequest {
    cadastral_value: number;
    property_type: string;
    region: string;
    is_pensioner?: boolean;
    is_large_family?: boolean;
    is_disabled?: boolean;
}

export interface PropertyTaxResponse {
    cadastral_value: number;
    property_type: string;
    region: string;
    base_rate?: number;
    region_coefficient?: number;
    calculated_tax: number;
    note?: string;
    benefits_applied: boolean;
}

export interface PropertySaleResponse {
    property_type: string;
    sale_price: number;
    taxable_amount: number;
    tax: number;
    deduction_applied: boolean;
}

export interface LandTaxRequest {
    cadastral_value: number;
    land_category: string;
    region: string;
    area_hectares: number;
    is_pensioner?: boolean;
    is_large_family?: boolean;
    is_disabled?: boolean;
    is_chernobyl_victim?: boolean;
}

export interface LandTaxResponse {
    tax_amount: number;
    details: string;
    applied_rate: number;
    is_exempt: boolean;
}

export interface CraftTaxRequest {
    is_craftsman: boolean;
    year?: number;
}

export interface CraftTaxResponse {
    tax_amount: number;
    details: string;
    is_craftsman: boolean;
}

export interface AgroTaxRequest {
    is_agro_owner: boolean;
    year?: number;
}

export interface AgroTaxResponse {
    tax_amount: number;
    details: string;
    is_agro_owner: boolean;
}

export interface IpTaxRequest {
    activity_type: string;
    city_type: string;
    is_preferential?: boolean;
}

export interface IpTaxResponse {
    tax_amount: number;
    details: string;
    applied_rate: number;
}

export interface TaxResult {
    name: string;
    category: 'income' | 'property' | 'investment' | 'other';
    tax: number;
    details?: unknown;
}