// src/components/CraftStep.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Box, Typography, Checkbox, FormControlLabel, Alert, Paper, useTheme,
} from '@mui/material';
import { useTaxContext } from '../context/TaxContext';
import { calculateCraftTax } from '../api';
import type { CraftTaxResponse } from '../types';

const CRAFT_TAX_RATE = 42;

const CraftStep: React.FC = () => {
    const [isCraftsman, setIsCraftsman] = useState(false);
    const [result, setResult] = useState<CraftTaxResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { updateCurrentTax } = useTaxContext();
    const theme = useTheme();
    const previousKeyRef = useRef('');

    const updateTax = useCallback(async () => {
        const key = JSON.stringify({ is_craftsman: isCraftsman });
        if (key === previousKeyRef.current) return;
        previousKeyRef.current = key;

        setLoading(true);
        setError(null);
        try {
            const res = await calculateCraftTax({ is_craftsman: isCraftsman, year: 2025 });
            const data: CraftTaxResponse = res.data;
            setResult(data);
            updateCurrentTax({
                name: 'Ремесленный сбор',
                category: 'other',
                tax: data.tax_amount,
                details: data,
            });
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Ошибка при расчёте ремесленного сбора';
            setError(msg);
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, [isCraftsman, updateCurrentTax]);

    useEffect(() => {
        updateTax();
    }, [updateTax]);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Ремесленный сбор</Typography>
                <Typography
                    component="span"
                    sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}
                    title="Физические лица, осуществляющие ремесленную деятельность, уплачивают сбор в размере 1 базовой величины (42 руб.) в год."
                >
                    ?
                </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isCraftsman}
                            onChange={e => setIsCraftsman(e.target.checked)}
                        />
                    }
                    label="Я являюсь ремесленником"
                />
            </Box>

            {loading && <Alert severity="info" sx={{ mt: 2 }}>Расчёт...</Alert>}

            {result !== null && isCraftsman && (
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
                    data-testid="craft-tax-detail"
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Детализация расчёта
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Статус</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Ремесленник</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Ставка</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>1 базовая величина ({CRAFT_TAX_RATE} руб.)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Итоговая сумма сбора</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {result.tax_amount.toFixed(2)} руб.
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            {!isCraftsman && result !== null && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Вы не являетесь ремесленником. Сбор не начисляется.
                </Alert>
            )}

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default CraftStep;
