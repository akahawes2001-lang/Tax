import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { TaxResult, DepositItem, DepositTaxResponse } from '../types';
import { saveHistory, calculateDepositTax as apiCalculateDepositTax } from '../api';
import { useAuth } from './AuthContext';

interface TaxContextType {
    results: TaxResult[];
    currentTaxes: TaxResult[];
    currentStep: number;
    setCurrentStep: (step: number) => void;
    updateCurrentTax: (r: TaxResult) => void;
    clearCurrentTaxes: () => void;
    saveCurrentToHistory: (name: string) => Promise<void>;
    clearResults: () => void;
    loadServerHistory: () => Promise<void>;
    charityAmount: number;
    setCharityAmount: (amount: number) => void;
    charityDeduction: number;
    setCharityDeduction: (deduction: number) => void;
    // Deposit multi-deposit support
    deposits: DepositItem[];
    addDeposit: () => void;
    removeDeposit: (index: number) => void;
    updateDeposit: (index: number, field: keyof DepositItem, value: number | string) => void;
    setDeposits: (deposits: DepositItem[]) => void;
    depositResult: DepositTaxResponse | null;
    setDepositResult: (result: DepositTaxResponse | null) => void;
    depositAnnualIncome: number;
    setDepositAnnualIncome: (income: number) => void;
}

const TaxContext = createContext<TaxContextType | undefined>(undefined);

export const TaxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [results, setResults] = useState<TaxResult[]>(() => {
        try {
            const saved = localStorage.getItem('taxCalcHistory');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [currentTaxes, setCurrentTaxes] = useState<TaxResult[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('taxCalcActiveStep');
            return saved ? parseInt(saved, 10) : 0;
        } catch { return 0; }
    });
    const { token, isAuthenticated } = useAuth();
    const [charityAmount, setCharityAmount] = useState<number>(0);
    const [charityDeduction, setCharityDeduction] = useState<number>(0);
    // Deposit multi-deposit state
    const [deposits, setDeposits] = useState<DepositItem[]>(() => {
        try {
            const saved = localStorage.getItem('taxCalcDeposits');
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return [{ amount: 0, currency: 'BYN', annual_rate_percent: 0, term_days: 0 }];
    });
    const [depositResult, setDepositResult] = useState<DepositTaxResponse | null>(null);
    const [depositAnnualIncome, setDepositAnnualIncome] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('taxCalcAnnualIncome');
            return saved ? parseFloat(saved) : 0;
        } catch { return 0; }
    });

    // Persist deposits
    useEffect(() => {
        try {
            localStorage.setItem('taxCalcDeposits', JSON.stringify(deposits));
        } catch { /* ignore */ }
    }, [deposits]);

    // Persist annual income for deposits
    useEffect(() => {
        try {
            localStorage.setItem('taxCalcAnnualIncome', String(depositAnnualIncome));
        } catch { /* ignore */ }
    }, [depositAnnualIncome]);

    const addDeposit = useCallback(() => {
        setDeposits(prev => [...prev, { amount: 0, currency: 'BYN', annual_rate_percent: 0, term_days: 0 }]);
    }, []);

    const removeDeposit = useCallback((index: number) => {
        setDeposits(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const updateDeposit = useCallback((index: number, field: keyof DepositItem, value: number | string) => {
        setDeposits(prev => prev.map((dep, i) =>
            i === index ? { ...dep, [field]: value } : dep
        ));
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('taxCalcHistory', JSON.stringify(results));
        } catch { }
    }, [results]);

    useEffect(() => {
        try {
            localStorage.setItem('taxCalcActiveStep', String(currentStep));
        } catch { }
    }, [currentStep]);

    const updateCurrentTax = (r: TaxResult) => {
        setCurrentTaxes(prev => {
            const filtered = prev.filter(item => item.name !== r.name);
            return [...filtered, r];
        });
    };

    const clearCurrentTaxes = () => setCurrentTaxes([]);

    const saveCurrentToHistory = async (name: string) => {
        if (!isAuthenticated || !token || currentTaxes.length === 0) {
            console.warn('Сохранить нечего: нет авторизации или данных');
            return;
        }
        const totalTax = currentTaxes.reduce((sum, t) => sum + t.tax, 0);
        const details = currentTaxes.map(t => ({
            name: t.name,
            category: t.category,
            tax: t.tax,
        }));

        try {
            await saveHistory({
                name,
                category: 'mixed',
                tax: totalTax,
                details_json: JSON.stringify(details),
            });
            console.log('Расчёт успешно сохранён');
            // После успешного сохранения загружаем историю с сервера
            await loadServerHistoryInternal();
        } catch (err: any) {
            if (err?.response?.status === 401) {
                console.error('Ошибка авторизации. Пожалуйста, перезайдите в аккаунт.');
                // Можно показать alert или уведомление
                alert('Ваша сессия истекла. Пожалуйста, выйдите и зайдите снова.');
            } else {
                console.error('Ошибка при сохранении истории:', err);
            }
        }
    };

    const clearResults = () => {
        setResults([]);
        localStorage.removeItem('taxCalcHistory');
        localStorage.removeItem('taxCalcActiveStep');
    };

    const loadServerHistory = async () => {
        await loadServerHistoryInternal();
    };

    const loadServerHistoryInternal = async () => {
        if (!isAuthenticated || !token) return;
        try {
            const { fetchHistory } = await import('../api');
            const res = await fetchHistory();
            const serverResults: TaxResult[] = res.data.map((item: any) => ({
                name: item.name,
                category: item.category,
                tax: item.tax,
                details: item.details_json ? JSON.parse(item.details_json) : undefined,
            }));
            setResults(serverResults);
        } catch (err: any) {
            if (err?.response?.status === 401) {
                console.warn('Не удалось загрузить историю: требуется авторизация');
            } else {
                console.error('Ошибка загрузки истории:', err);
            }
        }
    };

    return (
        <TaxContext.Provider
            value={{
                results,
                currentTaxes,
                currentStep,
                setCurrentStep,
                updateCurrentTax,
                clearCurrentTaxes,
                saveCurrentToHistory,
                clearResults,
                loadServerHistory,
                charityAmount,
                setCharityAmount,
                charityDeduction,
                setCharityDeduction,
                deposits,
                addDeposit,
                removeDeposit,
                updateDeposit,
                setDeposits,
                depositResult,
                setDepositResult,
                depositAnnualIncome,
                setDepositAnnualIncome,
            }}
        >
            {children}
        </TaxContext.Provider>
    );
};

export const useTaxContext = () => {
    const ctx = useContext(TaxContext);
    if (!ctx) throw new Error('useTaxContext must be inside TaxProvider');
    return ctx;
};