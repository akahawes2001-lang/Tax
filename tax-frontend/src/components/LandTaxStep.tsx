// src/components/LandTaxStep.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Alert, useMediaQuery, useTheme,
    FormControl, InputLabel, Select, MenuItem, Tooltip, Checkbox, FormControlLabel,
    Paper,
} from '@mui/material';
import { useTaxContext } from '../context/TaxContext';
import { calculateLandTax } from '../api';
import type { LandTaxRequest, LandTaxResponse } from '../types';

const LAND_CATEGORY_LABELS: Record<string, string> = {
    agricultural: 'Сельскохозяйственные земли',
    residential: 'Земли под жилую застройку',
    industrial: 'Промышленные земли',
    other: 'Прочие земли',
};

const LAND_CATEGORY_RATES: Record<string, string> = {
    agricultural: '0.1%',
    residential: '0.5%',
    industrial: '1.0%',
    other: '1.5%',
};

const LandTaxStep: React.FC = () => {
    const [cadastralValue, setCadastralValue] = useState<string>('');
    const [landCategory, setLandCategory] = useState<string>('agricultural');
    const [region, setRegion] = useState<string>('');
    const [areaHectares, setAreaHectares] = useState<string>('');
    const [isPensioner, setIsPensioner] = useState(false);
    const [isLargeFamily, setIsLargeFamily] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isChernobylVictim, setIsChernobylVictim] = useState(false);
    const [result, setResult] = useState<LandTaxResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { updateCurrentTax } = useTaxContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const previousKeyRef = useRef('');

    const hasBenefits = isPensioner || isLargeFamily || isDisabled || isChernobylVictim;

    const buildRequest = useCallback((): LandTaxRequest | null => {
        const cadValue = parseFloat(cadastralValue);
        const area = parseFloat(areaHectares);
        if (!cadastralValue || isNaN(cadValue) || cadValue <= 0) return null;
        if (!areaHectares || isNaN(area) || area <= 0) return null;
        if (!region.trim()) return null;
        return {
            cadastral_value: cadValue,
            land_category: landCategory,
            region: region.trim(),
            area_hectares: area,
            is_pensioner: isPensioner,
            is_large_family: isLargeFamily,
            is_disabled: isDisabled,
            is_chernobyl_victim: isChernobylVictim,
        };
    }, [cadastralValue, landCategory, region, areaHectares, isPensioner, isLargeFamily, isDisabled, isChernobylVictim]);

    const updateTax = useCallback(async () => {
        const req = buildRequest();
        if (!req) {
            setResult(null);
            updateCurrentTax({ name: 'Земельный налог', category: 'property', tax: 0 });
            return;
        }

        const key = JSON.stringify(req);
        if (key === previousKeyRef.current) return;
        previousKeyRef.current = key;

        setLoading(true);
        setError(null);
        try {
            const res = await calculateLandTax(req);
            const data: LandTaxResponse = res.data;
            setResult(data);
            updateCurrentTax({ name: 'Земельный налог', category: 'property', tax: data.tax_amount, details: data });
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Ошибка при расчёте земельного налога';
            setError(msg);
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [buildRequest, updateCurrentTax]);

    useEffect(() => {
        updateTax();
    }, [updateTax]);

    const cadValue = parseFloat(cadastralValue) || 0;
    const rate = result?.applied_rate ?? (LAND_CATEGORY_RATES[landCategory] ? parseFloat(LAND_CATEGORY_RATES[landCategory]) : 0);
    const taxBeforeBenefits = cadValue * (rate / 100);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Земельный налог</Typography>
                <Tooltip title="Рассчитайте земельный налог на основе кадастровой стоимости участка. Ставка зависит от категории земли. Пенсионеры, многодетные, инвалиды и пострадавшие от ЧАЭС освобождены от налога." arrow>
                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 2, mt: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        label="Кадастровая стоимость (BYN)"
                        type="number"
                        value={cadastralValue}
                        onChange={e => setCadastralValue(e.target.value)}
                        size="small"
                        helperText="Стоимость участка по кадастру"
                        slotProps={{ htmlInput: { 'data-testid': 'land-cadastral-value-input' } }}
                    />
                    <Tooltip title="Кадастровая стоимость земельного участка указана в выписке из кадастра недвижимости. Налог рассчитывается как процент от этой стоимости." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }} data-testid="land-category-select">
                        <InputLabel>Категория земли</InputLabel>
                        <Select value={landCategory} label="Категория земли" onChange={e => setLandCategory(e.target.value)}>
                            {Object.entries(LAND_CATEGORY_LABELS).map(([key, label]) => (
                                <MenuItem key={key} value={key}>
                                    {label} ({LAND_CATEGORY_RATES[key]})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Категория земельного участка определяет ставку налога. Сельскохозяйственные — 0.1%, жилая застройка — 0.5%, промышленные — 1.0%, прочие — 1.5%." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }} data-testid="land-region-select">
                        <InputLabel>Регион</InputLabel>
                        <Select value={region} label="Регион" onChange={e => setRegion(e.target.value)}>
                            <MenuItem value="Брестская">Брестская</MenuItem>
                            <MenuItem value="Витебская">Витебская</MenuItem>
                            <MenuItem value="Гомельская">Гомельская</MenuItem>
                            <MenuItem value="Гродненская">Гродненская</MenuItem>
                            <MenuItem value="Минская">Минская</MenuItem>
                            <MenuItem value="Могилёвская">Могилёвская</MenuItem>
                            <MenuItem value="г. Минск">г. Минск</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title="Укажите область, в которой находится земельный участок." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        label="Площадь (га)"
                        type="number"
                        value={areaHectares}
                        onChange={e => setAreaHectares(e.target.value)}
                        size="small"
                        helperText="Площадь в гектарах"
                        slotProps={{ htmlInput: { 'data-testid': 'land-area-input' } }}
                    />
                    <Tooltip title="Площадь земельного участка в гектарах. Указывается в документах на землю." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 2 }}>
                <FormControlLabel
                    control={<Checkbox checked={isPensioner} onChange={e => setIsPensioner(e.target.checked)} />}
                    label="Пенсионер"
                />
                <FormControlLabel
                    control={<Checkbox checked={isLargeFamily} onChange={e => setIsLargeFamily(e.target.checked)} />}
                    label="Многодетный"
                />
                <FormControlLabel
                    control={<Checkbox checked={isDisabled} onChange={e => setIsDisabled(e.target.checked)} />}
                    label="Инвалид"
                />
                <FormControlLabel
                    control={<Checkbox checked={isChernobylVictim} onChange={e => setIsChernobylVictim(e.target.checked)} />}
                    label="Пострадавший от ЧАЭС"
                />
            </Box>

            {hasBenefits && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Вы относитесь к льготной категории — земельный налог не начисляется.
                </Alert>
            )}

            {loading && <Alert severity="info" sx={{ mt: 2 }}>Расчёт...</Alert>}

            {/* Блок детализации расчёта */}
            {result !== null && cadValue > 0 && (
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
                    data-testid="land-tax-detail"
                >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Детализация расчёта
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Кадастровая стоимость</Typography>
                            <Typography variant="body2" fontWeight={600}>{cadValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Категория земли</Typography>
                            <Typography variant="body2" fontWeight={600}>{LAND_CATEGORY_LABELS[landCategory]}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Применённая ставка</Typography>
                            <Typography variant="body2" fontWeight={600}>{result.applied_rate}%</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Сумма налога до льгот</Typography>
                            <Typography variant="body2" fontWeight={600}>{taxBeforeBenefits.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Льготы</Typography>
                            <Typography variant="body2" fontWeight={600} color={result.is_exempt ? 'success.main' : 'text.secondary'}>
                                {result.is_exempt ? 'Применены (освобождение)' : 'Не применяются'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                            <Typography variant="body2" fontWeight={700}>Итоговая сумма налога</Typography>
                            <Typography variant="body2" fontWeight={700} color={result.is_exempt ? 'success.main' : 'primary.main'}>
                                {result.tax_amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default LandTaxStep;
