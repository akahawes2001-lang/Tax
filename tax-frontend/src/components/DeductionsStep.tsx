// src/components/DeductionsStep.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box, Typography, TextField, Alert, useMediaQuery, useTheme,
    FormControlLabel, Checkbox, Tooltip, RadioGroup, Radio, FormControl, FormLabel,
    LinearProgress, Paper
} from '@mui/material';
import { useTaxContext } from '../context/TaxContext';
import { useDebounce } from '../hooks/useDebounce';

const STORAGE_KEY = 'taxCalcDeductions';

interface DeductionsState {
    unionOption: 'member' | 'voluntary' | 'none';
    pension3plus3: boolean;
    voluntaryInsurance: number;
    medicalInsurance: number;
    alimonyAmount: number;
    otherWrits: number;
    charityAmount: number;
}

const getInitialState = (): DeductionsState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return {
        unionOption: 'none',
        pension3plus3: false,
        voluntaryInsurance: 0,
        medicalInsurance: 0,
        alimonyAmount: 0,
        otherWrits: 0,
        charityAmount: 0,
    };
};

const DeductionsStep: React.FC = () => {
    const [state, setState] = useState<DeductionsState>(getInitialState);
    const { updateCurrentTax, currentTaxes } = useTaxContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const monthlySalary = useMemo(() => {
        const incomeResult = currentTaxes.find(r => r.name === 'Подоходный налог');
        if (incomeResult?.details && typeof incomeResult.details === 'object' && 'total_income' in incomeResult.details) {
            return (incomeResult.details as any).total_income / 12;
        }
        const saved = localStorage.getItem('taxCalcMonthlySalary');
        return saved ? parseFloat(saved) : 0;
    }, [currentTaxes]);

    const calcDepsKey = useMemo(() => JSON.stringify({ ...state, monthlySalary }), [state, monthlySalary]);
    const debouncedKey = useDebounce(calcDepsKey, 600);
    const previousKeyRef = useRef('');

    const calculateDeductions = useCallback(() => {
        if (monthlySalary <= 0) return;
        if (debouncedKey === previousKeyRef.current) return;
        previousKeyRef.current = debouncedKey;

        const fsfs = monthlySalary * 0.01;
        let union = 0;
        if (state.unionOption === 'member' || state.unionOption === 'voluntary') {
            union = monthlySalary * 0.01;
        }
        const pension3plus3 = state.pension3plus3 ? monthlySalary * 0.03 : 0;
        const voluntaryInsurance = state.voluntaryInsurance || 0;
        const medicalInsurance = state.medicalInsurance || 0;

        if (fsfs > 0) updateCurrentTax({ name: 'Взнос ФСЗН', category: 'income', tax: fsfs * 12 });
        if (union > 0) updateCurrentTax({ name: 'Профсоюзные взносы', category: 'income', tax: union * 12 });
        if (pension3plus3 > 0) updateCurrentTax({ name: 'Добровольное пенсионное (3%)', category: 'income', tax: pension3plus3 * 12 });
        if (voluntaryInsurance > 0) updateCurrentTax({ name: 'Страхование жизни', category: 'income', tax: voluntaryInsurance * 12 });
        if (medicalInsurance > 0) updateCurrentTax({ name: 'Медицинское страхование', category: 'income', tax: medicalInsurance * 12 });
        if (state.alimonyAmount > 0) updateCurrentTax({ name: 'Алименты', category: 'income', tax: state.alimonyAmount * 12 });
        if (state.otherWrits > 0) updateCurrentTax({ name: 'Исполнительные листы', category: 'income', tax: state.otherWrits * 12 });
    }, [state, monthlySalary, updateCurrentTax, debouncedKey]);

    useEffect(() => {
        calculateDeductions();
    }, [calculateDeductions]);

    const netSalary = useMemo(() => {
        const incomeTax = currentTaxes.find(r => r.name === 'Подоходный налог')?.tax ?? 0;
        const incomeTaxMonthly = incomeTax / 12;
        const fsfs = monthlySalary * 0.01;
        const union = (state.unionOption === 'member' || state.unionOption === 'voluntary') ? monthlySalary * 0.01 : 0;
        const pension3plus3 = state.pension3plus3 ? monthlySalary * 0.03 : 0;
        const totalDeductions = fsfs + union + pension3plus3 + state.voluntaryInsurance + state.medicalInsurance;
        return monthlySalary - incomeTaxMonthly - totalDeductions;
    }, [monthlySalary, currentTaxes, state]);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Удержания</Typography>
                <Tooltip title="Здесь вы можете указать все удержания из зарплаты: обязательный взнос в ФСЗН, профсоюзные взносы, добровольные отчисления и исполнительные листы. Чистая зарплата будет рассчитана автоматически." arrow>
                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                </Tooltip>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
                Обязательный взнос в ФСЗН (1%) удерживается работодателем автоматически. Вы не можете его отключить.
            </Alert>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, width: isMobile ? '100%' : 350 }}>
                {/* Профсоюзные взносы */}
                <FormControl component="fieldset">
                    <FormLabel component="legend">Профсоюзные взносы</FormLabel>
                    <RadioGroup
                        value={state.unionOption}
                        onChange={e => setState(prev => ({ ...prev, unionOption: e.target.value as 'member' | 'voluntary' | 'none' }))}
                    >
                        <FormControlLabel value="member" control={<Radio />} label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                Член профсоюза (1%)
                                <Tooltip title="Если вы состоите в профсоюзе, с вашей зарплаты удерживается 1%. Этот взнос не уменьшает подоходный налог. Пример: при зарплате 2500 руб. взнос составит 25 руб./мес." arrow>
                                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                                </Tooltip>
                            </Box>
                        } />
                        <FormControlLabel value="voluntary" control={<Radio />} label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                Не член профсоюза, но плачу добровольно (1%)
                                <Tooltip title="Даже если вы не в профсоюзе, но добровольно перечисляете 1%, выберите этот вариант. Условия те же: 1% от зарплаты." arrow>
                                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                                </Tooltip>
                            </Box>
                        } />
                        <FormControlLabel value="none" control={<Radio />} label="Не плачу" />
                    </RadioGroup>
                </FormControl>

                {/* Добровольное пенсионное страхование */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={state.pension3plus3}
                            onChange={e => setState(prev => ({ ...prev, pension3plus3: e.target.checked }))}
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            Добровольное пенсионное страхование «3+3» (3% от зарплаты)
                            <Tooltip title="Программа «3+3»: вы платите 3% от зарплаты, государство добавляет столько же. Эти деньги идут на дополнительную пенсию. Пример: при зарплате 2500 руб. ваш взнос 75 руб./мес., столько же добавляет государство." arrow>
                                <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                            </Tooltip>
                        </Box>
                    }
                />

                {/* Добровольное страхование жизни */}
                <TextField
                    label="Добровольное страхование жизни (в месяц)"
                    type="number"
                    value={state.voluntaryInsurance}
                    onChange={e => setState(prev => ({ ...prev, voluntaryInsurance: Number(e.target.value) }))}
                    helperText="Сумма ежемесячного взноса"
                    fullWidth
                    slotProps={{ htmlInput: { 'data-testid': 'voluntary-insurance-input' } }}
                />

                {/* Медицинское страхование */}
                <TextField
                    label="Добровольное медицинское страхование (в месяц)"
                    type="number"
                    value={state.medicalInsurance}
                    onChange={e => setState(prev => ({ ...prev, medicalInsurance: Number(e.target.value) }))}
                    helperText="Сумма ежемесячного взноса"
                    fullWidth
                    slotProps={{ htmlInput: { 'data-testid': 'medical-insurance-input' } }}
                />

                <Typography variant="subtitle2" sx={{ mt: 2 }}>Исполнительные листы</Typography>

                {/* Алименты */}
                <TextField
                    label="Алименты (сумма в месяц)"
                    type="number"
                    value={state.alimonyAmount}
                    onChange={e => setState(prev => ({ ...prev, alimonyAmount: Number(e.target.value) }))}
                    helperText="Фиксированная сумма"
                    fullWidth
                    slotProps={{ htmlInput: { 'data-testid': 'alimony-input' } }}
                />

                {/* Прочие удержания */}
                <TextField
                    label="Прочие удержания (штрафы, кредиты) в месяц"
                    type="number"
                    value={state.otherWrits}
                    onChange={e => setState(prev => ({ ...prev, otherWrits: Number(e.target.value) }))}
                    helperText="Сумма прочих удержаний"
                    fullWidth
                    slotProps={{ htmlInput: { 'data-testid': 'other-writs-input' } }}
                />

                <Typography variant="subtitle2" sx={{ mt: 2 }}>Социальные вычеты</Typography>

                {/* Пожертвования на благотворительность */}
                <TextField
                    label="Пожертвования на благотворительность (в месяц)"
                    type="number"
                    value={state.charityAmount}
                    onChange={e => setState(prev => ({ ...prev, charityAmount: Number(e.target.value) }))}
                    helperText="Вычет не более 50% от суммы налога"
                    fullWidth
                    slotProps={{ htmlInput: { 'data-testid': 'charity-input' } }}
                />

                {/* Индикатор предельных удержаний */}
                {netSalary > 0 && (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Чистая зарплата после налога и удержаний: <strong>{netSalary.toFixed(2)} руб.</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Максимальное удержание по алиментам (50%): {(netSalary * 0.5).toFixed(2)} руб.<br />
                            Максимальное удержание по прочим листам (20%): {(netSalary * 0.2).toFixed(2)} руб.
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(((state.alimonyAmount + state.otherWrits) / netSalary) * 100, 100)}
                                sx={{ height: 10, borderRadius: 5 }}
                            />
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                {state.alimonyAmount + state.otherWrits > netSalary * 0.5
                                    ? '⚠️ Внимание: удержания превышают 50% чистого дохода!'
                                    : 'Уровень удержаний в пределах нормы.'}
                            </Typography>
                        </Box>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default DeductionsStep;