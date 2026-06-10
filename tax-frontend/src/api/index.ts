import axios from 'axios';
import type {
    IncomeTaxResponse, MonthlyIncome,
    DogTaxRequest, TransportTaxRequest, TransportTaxResponse,
    DepositTaxRequest, DepositTaxResponse,
    RentalTaxRequest,
    CryptoTaxRequest, PropertySaleRequest,
    PropertyTaxRequest, LandTaxRequest,
    CraftTaxRequest, AgroTaxRequest,
    IpTaxRequest
} from '../types';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    withCredentials: true,  // отсылаем httpOnly cookie с каждым запросом
});

// Убираем interceptor, который клал токен из localStorage — токен теперь в cookie

api.interceptors.response.use(
    response => response,
    error => {
        if (error?.__cancelNoToken) {
            return Promise.resolve({ data: [] });
        }
        return Promise.reject(error);
    }
);

export const calculateIncomeTax = (data: { monthly_incomes: MonthlyIncome[] }) =>
    api.post<IncomeTaxResponse>('/calculate-income-tax', data);
export const calculateDogTax = (data: DogTaxRequest) =>
    api.post('/calculate-dog-tax', data);
export const calculateTransportTax = (data: TransportTaxRequest) =>
    api.post<TransportTaxResponse>('/calculate-transport-tax', data);
export const calculateDepositTax = (data: DepositTaxRequest) =>
    api.post<DepositTaxResponse>('/calculate-deposit-tax', data);
export const calculateRentalTax = (data: RentalTaxRequest) =>
    api.post('/calculate-rental-tax', data);
export const calculateCryptoTax = (data: CryptoTaxRequest) =>
    api.post('/calculate-crypto-tax', data);
export const calculatePropertySaleTax = (data: PropertySaleRequest) =>
    api.post('/calculate-property-sale-tax', data);
export const calculatePropertyTax = (data: PropertyTaxRequest) =>
    api.post('/calculate-property-tax', data);
export const calculateLandTax = (data: LandTaxRequest) =>
    api.post('/land-tax/calculate', data);
export const calculateCraftTax = (data: CraftTaxRequest) =>
    api.post('/craft-tax/calculate', data);
export const calculateAgroTax = (data: AgroTaxRequest) =>
    api.post('/agro-tax/calculate', data);
export const calculateIpTax = (data: IpTaxRequest) =>
    api.post('/ip-tax/calculate', data);

export const fetchBrands = () => api.get('/car-brands');
export const fetchModels = (brand: string) => api.get(`/car-models?brand=${encodeURIComponent(brand)}`);
export const fetchCarMass = (brand: string, model: string) => api.get(`/car-mass?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);

export const fetchHistory = () => api.get('/history');
export const saveHistory = (data: { name: string; category: string; tax: number; details_json?: string }) =>
    api.post('/history', data);
export const deleteHistory = (id: number) => api.delete(`/history/${id}`);
export const clearAllHistory = () => api.delete('/history');

export const fetchRentalCities = () => api.get('/rental-cities');
export const searchDogBreeds = (q: string) => api.get('/dog-breeds/search', { params: { q } });

export default api;