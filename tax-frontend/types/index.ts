export interface MonthlyIncome {
    month: number;
    year: number;
    salary: number;
    dividends?: number;
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
    alimony_paid?: number;
    charity_amount?: number;
    professional_deduction_category?: string | null;
    is_union_member?: boolean;
    pension_contributions?: boolean;
}

export interface IncomeTaxResponse {
    total_income: number;
    total_withheld: number;
    final_tax: number;
    adjustment_due: number;
    total_union_fees: number;
    total_pension_fees: number;
    total_tax_burden: number;
    progressive_threshold_used: number;
    monthly_details: MonthlyDetail[];
    medical_deduction?: number;
    alimony_deduction?: number;
    charity_deduction?: number;
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
}

export interface DogTaxResponse {
    breed_type: string;
    year: number;
    rate_per_quarter: number;
    total_tax: number;
}

export interface TransportTaxRequest {
    vehicle_type: string;
    mass?: number;
    engine_capacity?: number | null;
    year_of_manufacture: number;
    is_luxury: boolean;
    is_electric: boolean;
    tax_year: number;
}

export interface TransportTaxResponse {
    vehicle_type: string;
    mass: number;
    tax_year: number;
    calculated_tax: number;
}

export interface DepositTaxRequest {
    amount: number;
    currency: string;
    annual_rate_percent: number;
    term_days: number;
}

export interface DepositTaxResponse {
    currency: string;
    interest_income: number;
    tax: number;
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

export interface PropertySaleResponse {
    property_type: string;
    sale_price: number;
    taxable_amount: number;
    tax: number;
    deduction_applied: boolean;
}

export interface TaxResult {
    name: string;
    category: 'income' | 'property' | 'investment' | 'other';
    tax: number;
    details?: unknown;
}