// src/components/IpTaxStep.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Box, Typography, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, Alert, Paper, useTheme, RadioGroup, Radio,
} from '@mui/material';
import { useTaxContext } from '../context/TaxContext';
import { calculateIpTax } from '../api';
import type { IpTaxResponse } from '../types';

const ACTIVITY_OPTIONS: Record<string, string> = {
    retail_food: 'Розничная торговля продовольственными товарами',
    retail_nonfood: 'Розничная торговля непродовольственными товарами',
    catering: 'Общественное питание (кафе, рестораны)',
    hairdressing: 'Парикмахерские и косметические услуги',
    cargo_transport: 'Грузоперевозки',
    construction: 'Строительные и ремонтные работы',
    it_services: 'IT-услуги и разработка ПО',
    rental: 'Аренда недвижимости',
    other: 'Прочие виды деятельности',
};

const CITY_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'minsk', label: 'Минск' },
    { value: 'regional_city', label: 'Областной центр' },
    { value: 'large_city', label: 'Крупный город' },
    { value: 'other', label: 'Прочие населённые пункты' },
];

// Ставки для предварительного расчёта на фронтенде
const PREVIEW_RATES: Record<string, Record<string, number>> = {
    retail_food: { minsk: 350, regional_city: 250, large_city: 200, other: 150 },
    retail_nonfood: { minsk: 500, regional_city: 350, large_city: 250, other: 200 },
    catering: { minsk: 800, regional_city: 600, large_city: 400, other: 300 },
    hairdressing: { minsk: 200, regional_city: 150, large_city: 120, other: 100 },
    cargo_transport: { minsk: 400, regional_city: 300, large_city: 250, other: 200 },
    construction: { minsk: 600, regional_city: 450, large_city: 350, other: 250 },
    it_services: { minsk: 1000, regional_city: 800, large_city: 600, other: 500 },
    rental: { minsk: 700, regional_city: 500, large_city: 400, other: 300 },
    other: { minsk: 300, regional_city: 250, large_city: 200, other: 150 },
};

const IpTaxStep: React.FC = () => {
    const [activityType, setActivityType] = useState('');
    const [cityType, setCityType] = useState('minsk');
    const [isPreferential, setIsPreferential] = useState(false);
    const [result, setResult] = useState<IpTaxResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { updateCurrentTax } = useTaxContext();
    const theme = useTheme();
    const previousKeyRef = useRef('');

    const updateTax = useCallback(async () => {
        if (!activityType || !cityType) {
            setResult(null);
            return;
        }
        const key = JSON.stringify({ activity_type: activityType, city_type: cityType, is_preferential: isPreferential });
        if (key === previousKeyRef.current) return;
        previousKeyRef.current = key;

        setLoading(true);
        setError(null);
        try {
            const res = await calculateIpTax({
                activity_type: activityType,
                city_type: cityType,
                is_preferential: isPreferential,
            });
            const data: IpTaxResponse = res.data;
            setResult(data);
            updateCurrentTax({
                name: 'Единый налог (ИП)',
                category: 'other',
                tax: data.tax_amount,
                details: data,
            });
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Ошибка при расчёте единого налога для ИП';
            setError(msg);
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [activityType, cityType, isPreferential, updateCurrentTax]);

    useEffect(() => {
        updateTax();
    }, [updateTax]);

    // Предварительный расчёт для отображения
    const previewRate = activityType && cityType ? PREVIEW_RATES[activityType]?.[cityType] : null;
    const previewDiscount = previewRate && isPreferential ? previewRate * 0.25 : 0;
    const previewTotal = previewRate ? Math.max(previewRate - previewDiscount, 1) : null;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Единый налог (ИП)</Typography>
                <Typography
                    component="span"
                    sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}
                    title="Фиксированный налог для индивидуальных предпринимателей без наёмных работников (ст. 293–306 НК РБ)."
                >
                    ?
                </Typography>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Выбор вида деятельности */}
                <FormControl fullWidth>
                    <InputLabel>Вид деятельности</InputLabel>
                    <Select
                        value={activityType}
                        label="Вид деятельности"
                        onChange={e => setActivityType(e.target.value)}
                    >
                        {Object.entries(ACTIVITY_OPTIONS).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Выбор типа населённого пункта */}
                <FormControl>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Тип населённого пункта
                    </Typography>
                    <RadioGroup
                        value={cityType}
                        onChange={e => setCityType(e.target.value)}
                    >
                        {CITY_TYPE_OPTIONS.map(opt => (
                            <FormControlLabel
                                key={opt.value}
                                value={opt.value}
                                control={<Radio />}
                                label={opt.label}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>

                {/* Чекбокс льготы */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isPreferential}
                            onChange={e => setIsPreferential(e.target.checked)}
                        />
                    }
                    label="Льгота (первый год деятельности)"
                />
            </Box>

            {loading && <Alert severity="info" sx={{ mt: 2 }}>Расчёт...</Alert>}

            {/* Предварительный расчёт */}
            {activityType && cityType && (
                <Paper
                    elevation={0}
                    sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#F3F4F6',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Предварительный расчёт
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Ставка</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {previewRate !== null ? `${previewRate} руб./мес.` : '—'}
                            </Typography>
                        </Box>
                        {isPreferential && previewDiscount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Льгота 25%</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                    -{previewDiscount.toFixed(2)} руб.
                                </Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Итого к уплате</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {previewTotal !== null ? `${previewTotal.toFixed(2)} руб./мес.` : '—'}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {result !== null && (
                <Paper
                    elevation={0}
                    sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#F3F4F6',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                    data-testid="ip-tax-detail"
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Детализация расчёта (с сервера)
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {result.details}
                    </Typography>
                </Paper>
            )}

            {!activityType && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Выберите вид деятельности для расчёта.
                </Alert>
            )}

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default IpTaxStep;