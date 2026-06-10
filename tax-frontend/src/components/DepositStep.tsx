// src/components/DepositStep.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Alert, useMediaQuery, useTheme, Tooltip,
    LinearProgress, Paper, IconButton, Select, MenuItem, FormControl, InputLabel, Card, CardContent
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { calculateDepositTax } from '../api';
import { useTaxContext } from '../context/TaxContext';
import { useDebounce } from '../hooks/useDebounce';
import type { DepositItem } from '../types';

const DepositStep: React.FC = () => {
    const { deposits, addDeposit, removeDeposit, updateDeposit, setDepositResult, depositResult, depositAnnualIncome, setDepositAnnualIncome, updateCurrentTax } = useTaxContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calcKey = useMemo(() => JSON.stringify({ deposits, annual_income: depositAnnualIncome > 0 ? depositAnnualIncome : undefined }), [deposits, depositAnnualIncome]);
    const debouncedKey = useDebounce(calcKey, 600);
    const previousKeyRef = useRef<string>('');

    const handleCalculate = useCallback(async () => {
        const hasValidDeposit = deposits.some(d => d.amount > 0 && d.annual_rate_percent > 0 && d.term_days > 0);
        if (!hasValidDeposit) return;
        if (debouncedKey === previousKeyRef.current) return;
        previousKeyRef.current = debouncedKey;
        setLoading(true); setError(null);
        try {
            const res = await calculateDepositTax({ deposits, annual_income: depositAnnualIncome > 0 ? depositAnnualIncome : undefined });
            const result = res.data; setDepositResult(result);
            updateCurrentTax({ name: 'Налог на вклад', category: 'investment', tax: result.total_tax, details: result });
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (err as { message?: string })?.message || 'Ошибка расчёта';
            setError(String(detail));
        } finally { setLoading(false); }
    }, [deposits, depositAnnualIncome, debouncedKey, updateCurrentTax, setDepositResult]);

    useEffect(() => { handleCalculate(); }, [handleCalculate]);

    const getExemptionMonths = (currency: string): number => currency === 'BYN' ? 12 : 24;

    return (
        <Box>
            <Typography variant="h6">Инвестиции и накопления</Typography>

            <TextField label="Ваш годовой доход (руб.)" type="number" value={depositAnnualIncome} onChange={e => setDepositAnnualIncome(Number(e.target.value))} fullWidth sx={{ mb: 2, mt: 2 }} helperText="Для прогрессивной ставки (если > 350 000 руб., ставка 25%)" />

            {deposits.map((dep, index) => {
                const termMonths = dep.term_days / 30.44;
                const exemptionMonths = getExemptionMonths(dep.currency);
                const isExempt = termMonths >= exemptionMonths;
                const progressValue = Math.min((termMonths / exemptionMonths) * 100, 100);

                return (
                    <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Вклад №{index + 1}</Typography>
                                <IconButton size="small" color="error" onClick={() => removeDeposit(index)} disabled={deposits.length <= 1} title="Удалить вклад"><RemoveCircleIcon /></IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField label="Сумма вклада" type="number" value={dep.amount || ''} onChange={e => updateDeposit(index, 'amount', Number(e.target.value))} fullWidth helperText="В BYN" />
                                <FormControl fullWidth size="small">
                                    <InputLabel>Валюта</InputLabel>
                                    <Select value={dep.currency} label="Валюта" onChange={e => updateDeposit(index, 'currency', e.target.value)}>
                                        <MenuItem value="BYN">BYN</MenuItem>
                                        <MenuItem value="USD">USD</MenuItem>
                                        <MenuItem value="EUR">EUR</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField label="Годовая ставка, %" type="number" value={dep.annual_rate_percent || ''} onChange={e => updateDeposit(index, 'annual_rate_percent', Number(e.target.value))} fullWidth helperText="Например: 14.5" />
                                <TextField label="Срок (дней)" type="number" value={dep.term_days || ''} onChange={e => updateDeposit(index, 'term_days', Number(e.target.value))} fullWidth helperText="Количество дней" />
                            </Box>
                        </CardContent>
                    </Card>
                );
            })}

            <Button variant="outlined" startIcon={<AddCircleIcon />} onClick={addDeposit} fullWidth sx={{ mb: 2 }}>Добавить вклад</Button>
            <Button variant="contained" onClick={handleCalculate} disabled={loading} fullWidth sx={{ mb: 2 }}>{loading ? 'Загрузка...' : 'Рассчитать налог на проценты'}</Button>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {depositResult && depositResult.deposits_details.length > 0 && (
                <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body1">Общий процентный доход: <strong>{depositResult.total_interest.toFixed(2)} руб.</strong><br />Общий налог: <strong>{depositResult.total_tax.toFixed(2)} руб.</strong></Typography>
                    </Alert>
                    <Typography variant="subtitle2" gutterBottom>Детализация по вкладам:</Typography>
                    {depositResult.deposits_details.map((detail, idx) => (
                        <Paper key={idx} sx={{ p: 2, mb: 1, bgcolor: 'rgba(20, 184, 166, 0.08)', border: '1px solid', borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Вклад №{idx + 1} ({detail.currency}) — {detail.amount.toFixed(2)} {detail.currency}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                                <Typography variant="body2">Ставка: <strong>{detail.annual_rate_percent}%</strong></Typography>
                                <Typography variant="body2">Срок: <strong>{detail.term_days} дн.</strong></Typography>
                                <Typography variant="body2">Доход: <strong>{detail.interest_income.toFixed(2)} руб.</strong></Typography>
                                <Typography variant="body2">Налог: <strong>{detail.tax.toFixed(2)} руб.</strong>{detail.exempt && <span> (освобождён)</span>}</Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}><Typography variant="body2">• Для BYN проценты освобождаются от налога, если срок ≥ 12 мес.<br />• Для валютных вкладов — если срок ≥ 24 мес.<br />• Ставка налога: 13%. Если годовой доход {'>'} 350 000 руб. — 25%.</Typography></Alert>
        </Box>
    );
};

export default DepositStep;