// src/components/ResultsStep.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Alert, Chip, LinearProgress, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions,
    ToggleButtonGroup, ToggleButton, FormControlLabel, Checkbox,
    Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { PieChart, Pie, Cell, Tooltip, Legend, Sector } from 'recharts';
import { useTaxContext } from '../context/TaxContext';
import { useAuth } from '../context/AuthContext';
import { calculateIncomeTax } from '../api';
import type { MonthlyIncome, IncomeTaxResponse, TaxResult } from '../types';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

pdfMake.vfs = pdfFonts.vfs;

const CATEGORY_COLORS: Record<string, string> = { income: '#0088FE', property: '#FF8042', investment: '#00C49F', other: '#FFBB28' };
const CATEGORY_LABELS: Record<string, string> = { income: 'Доходы', property: 'Имущество', investment: 'Инвестиции', other: 'Прочие' };

const INIT_MONTH: MonthlyIncome = { month: 1, year: 2025, salary: 0, children_birthdays: [], is_union_member: false, pension_contributions: false };

interface AggregatedItem {
    name: string;
    value: number;
    items: TaxResult[];
    color: string;
}

const ResultsStep: React.FC = () => {
    const { currentTaxes, saveCurrentToHistory, clearCurrentTaxes } = useTaxContext();
    const { isAuthenticated } = useAuth();
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const lastAutoSavedKey = useRef('');
    const isSaving = useRef(false);

    useEffect(() => {
        if (currentTaxes.length === 0 || !isAuthenticated || isSaving.current) return;
        const key = currentTaxes.map(t => `${t.name}-${t.tax.toFixed(2)}`).join('|');
        if (key !== lastAutoSavedKey.current) {
            isSaving.current = true;
            lastAutoSavedKey.current = key;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            saveCurrentToHistory(`Расчёт ${dateStr} ${timeStr}`).catch(() => { lastAutoSavedKey.current = ''; }).finally(() => { isSaving.current = false; });
        }
    }, [currentTaxes, isAuthenticated, saveCurrentToHistory]);

    const [compareScenario1Year, setCompareScenario1Year] = useState(2026);
    const [compareScenario2Year, setCompareScenario2Year] = useState(2025);
    const [compareScenario1Deductions, setCompareScenario1Deductions] = useState(true);
    const [compareScenario2Deductions, setCompareScenario2Deductions] = useState(false);
    const [comparisonResult1, setComparisonResult1] = useState<IncomeTaxResponse | null>(null);
    const [comparisonResult2, setComparisonResult2] = useState<IncomeTaxResponse | null>(null);
    const [comparing, setComparing] = useState(false);

    const totalTax = currentTaxes.reduce((sum, r) => sum + r.tax, 0);
    const categories = ['income', 'property', 'investment', 'other'];
    const categoryNames: Record<string, string> = { income: 'Налоги с доходов', property: 'Имущественные налоги', investment: 'Инвестиции', other: 'Прочие налоги' };

    const aggregated: AggregatedItem[] = categories.map(cat => {
        const items = currentTaxes.filter(r => r.category === cat);
        return { name: categoryNames[cat], value: items.reduce((sum, r) => sum + r.tax, 0), items, color: CATEGORY_COLORS[cat] || '#8884d8' };
    });

    const selectedAggregated = activeIndex !== undefined ? aggregated[activeIndex] : null;

    const totalIncome = currentTaxes.reduce((sum, r) => {
        if (r.details && typeof r.details === 'object' && 'total_income' in r.details) return sum + (r.details as any).total_income;
        return sum;
    }, 0);
    const taxBurdenPercent = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;

    const handleStartOver = () => { clearCurrentTaxes(); localStorage.setItem('taxCalcActiveStep', '0'); window.location.reload(); };

    const handleCompare = async () => {
        setComparing(true);
        try {
            const savedProfile = localStorage.getItem('taxCalcProfile');
            if (!savedProfile) { alert('Нет данных профиля.'); return; }
            const profile = JSON.parse(savedProfile);
            const { monthlySalary = 0, monthlyDividends = 0, monthlyForeign = 0, monthlyPersonal = 0, insuranceExpenses = 0, needsHousing = false, housingExpenses = 0, professionalCategory = '', childrenBirthdays = [], isSingleParent = false, isLargeFamily = false, disabilityDeduction = false, youngSpecialistDeduction = false, disabledChildrenBirthdays = [], educationExpenses = 0, educationStartMonth = null, educationEndMonth = null, medicalExpenses = 0, medicineExpenses = 0 } = profile;
            const buildPayload = (year: number, applyDeductions: boolean): MonthlyIncome[] => {
                const base: MonthlyIncome = {
                    ...INIT_MONTH, year, salary: monthlySalary, dividends: monthlyDividends, foreign_income: monthlyForeign, personal_income: monthlyPersonal,
                    insurance_expenses: applyDeductions ? insuranceExpenses : 0, needs_housing_improvement: applyDeductions ? needsHousing : false,
                    housing_expenses: applyDeductions ? housingExpenses : 0, children_birthdays: applyDeductions ? childrenBirthdays : [],
                    is_large_family: applyDeductions ? isLargeFamily : false,
                    disability_deduction: applyDeductions ? disabilityDeduction : false, young_specialist_deduction: applyDeductions ? youngSpecialistDeduction : false,
                    disabled_children_birthdays: applyDeductions ? disabledChildrenBirthdays : [], education_expenses: applyDeductions ? educationExpenses : 0,
                    education_start_month: applyDeductions ? educationStartMonth : null, education_end_month: applyDeductions ? educationEndMonth : null,
                    medical_expenses: applyDeductions ? medicalExpenses : 0, medicine_expenses: applyDeductions ? medicineExpenses : 0,
                    professional_deduction_category: applyDeductions ? (professionalCategory || null) : null,
                } as MonthlyIncome;
                return Array.from({ length: 12 }, (_, i) => ({ ...base, month: i + 1 }));
            };
            const [res1, res2] = await Promise.all([
                calculateIncomeTax({ monthly_incomes: buildPayload(compareScenario1Year, compareScenario1Deductions) }),
                calculateIncomeTax({ monthly_incomes: buildPayload(compareScenario2Year, compareScenario2Deductions) }),
            ]);
            setComparisonResult1(res1.data); setComparisonResult2(res2.data);
        } catch { alert('Не удалось выполнить сравнение'); } finally { setComparing(false); }
    };

    const exportPDF = () => {
        const docDef: any = {
            content: [
                { text: 'Сводный налоговый отчёт', style: 'header' },
                { text: `Дата: ${new Date().toLocaleDateString()}`, margin: [0, 5] },
                { text: `Общая сумма налогов: ${totalTax.toFixed(2)} руб.`, style: 'subheader' },
                { text: ' ', margin: [0, 5] },
                ...currentTaxes.map(r => ({ text: `${r.name}: ${r.tax.toFixed(2)} руб.`, margin: [0, 3] })),
            ],
            styles: { header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 10] }, subheader: { fontSize: 14, margin: [0, 5] } },
            defaultStyle: { font: 'Roboto' },
        };
        pdfMake.createPdf(docDef).download('налоговый-отчёт.pdf');
    };

    const exportXLSX = () => {
        const data = currentTaxes.map(r => ({ 'Налог': r.name, 'Категория': CATEGORY_LABELS[r.category] || r.category, 'Сумма (руб.)': r.tax }));
        const sheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.sheet_add_aoa(sheet, [['ИТОГО', '', totalTax]], { origin: -1 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'Сводка');
        XLSX.writeFile(wb, 'налоговый-отчёт.xlsx');
    };

    const renderActiveShape = (props: any) => {
        const { outerRadius, ...rest } = props;
        return <Sector {...rest} outerRadius={outerRadius + 10} />;
    };

    return (
        <Box>
            <Typography variant="h6">Сводный отчёт</Typography>
            {currentTaxes.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>Пока нет ни одного расчёта. Перейдите на предыдущие шаги и выполните расчёты.</Alert>
            ) : (
                <>
                    {/* Итоговая сумма - крупно и заметно */}
                    <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2, textAlign: 'center', bgcolor: 'rgba(20, 184, 166, 0.08)', border: '1px solid', borderColor: 'primary.main', borderRadius: 3 }}>
                        <Typography variant="body2" color="text.secondary">Общая сумма налогов</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
                            {totalTax.toFixed(2)} руб.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{currentTaxes.length} расчётов</Typography>
                    </Paper>

                    {/* Детализация по налогам - вертикальный список вместо таблицы */}
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {currentTaxes.map((r: TaxResult, i: number) => (
                            <Paper key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${CATEGORY_COLORS[r.category] || '#8884d8'}`, borderRadius: 2 }}>
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{r.name}</Typography>
                                    <Chip label={CATEGORY_LABELS[r.category] || r.category} size="small" sx={{ bgcolor: CATEGORY_COLORS[r.category] || '#8884d8', color: '#fff', fontWeight: 'bold', mt: 0.5 }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{r.tax.toFixed(2)} руб.</Typography>
                            </Paper>
                        ))}
                    </Box>

                    {totalIncome > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" gutterBottom>Налоговая нагрузка: <strong>{taxBurdenPercent.toFixed(1)}%</strong> от общего дохода</Typography>
                            <LinearProgress variant="determinate" value={Math.min(taxBurdenPercent, 100)} sx={{ height: 10, borderRadius: 5, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: taxBurdenPercent < 20 ? '#4caf50' : taxBurdenPercent < 40 ? '#ff9800' : '#f44336' } }} />
                        </Box>
                    )}

                    {/* PieChart */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', mt: 2, gap: 3 }}>
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
                            <PieChart width={300} height={300}>
                                <Pie activeShape={renderActiveShape}
                                    data={aggregated} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" dataKey="value"
                                    onClick={(_data: any, index: number) => setActiveIndex(prev => (prev === index ? undefined : index))} label>
                                    {aggregated.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                </Pie>
                                <Tooltip /><Legend />
                            </PieChart>
                        </Box>
                        {selectedAggregated && selectedAggregated.items && (
                            <Paper sx={{ flex: 1, p: 2, width: '100%' }}>
                                <Typography variant="subtitle1" gutterBottom>{selectedAggregated.name}</Typography>
                                <Typography variant="h5" color="primary" gutterBottom>{selectedAggregated.value.toFixed(2)} руб.</Typography>
                                {selectedAggregated.items.map((item: TaxResult, i: number) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2">{item.name}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.tax.toFixed(2)} руб.</Typography>
                                    </Box>
                                ))}
                            </Paper>
                        )}
                    </Box>

                    {/* Кнопки экспорта - вертикально на мобильных */}
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                        <Button variant="contained" onClick={exportPDF} fullWidth={true} sx={{ flex: { sm: 1 } }}>Скачать PDF</Button>
                        <Button variant="contained" color="success" onClick={exportXLSX} fullWidth={true} sx={{ flex: { sm: 1 } }}>Скачать XLSX</Button>
                        <Button variant="outlined" startIcon={<QuestionMarkIcon />} onClick={() => setDetailsOpen(true)} fullWidth={true} sx={{ flex: { sm: 1 } }}>Как мы считали</Button>
                        <Button variant="outlined" color="warning" onClick={handleStartOver} fullWidth={true} sx={{ flex: { sm: 1 } }}>Начать заново</Button>
                    </Box>

                    {/* Сравнение */}
                    <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="h6" gutterBottom>Сравнение сценариев</Typography>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <FormControlLabel control={<Checkbox checked={compareScenario1Deductions} onChange={e => setCompareScenario1Deductions(e.target.checked)} />} label="С вычетами" />
                                <ToggleButtonGroup value={compareScenario1Year} exclusive onChange={(_, val) => val && setCompareScenario1Year(val)} size="small">
                                    <ToggleButton value={2025}>2025</ToggleButton>
                                    <ToggleButton value={2026}>2026</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <FormControlLabel control={<Checkbox checked={compareScenario2Deductions} onChange={e => setCompareScenario2Deductions(e.target.checked)} />} label="С вычетами" />
                                <ToggleButtonGroup value={compareScenario2Year} exclusive onChange={(_, val) => val && setCompareScenario2Year(val)} size="small">
                                    <ToggleButton value={2025}>2025</ToggleButton>
                                    <ToggleButton value={2026}>2026</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            <Button variant="contained" onClick={handleCompare} disabled={comparing} fullWidth={true} sx={{ maxWidth: { sm: 200 } }}>
                                {comparing ? 'Сравнение...' : 'Сравнить'}
                            </Button>
                        </Box>

                        {comparisonResult1 && comparisonResult2 && (
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {[
                                    { label: 'Подоходный налог', val1: comparisonResult1.final_tax, val2: comparisonResult2.final_tax },
                                    { label: 'Экономия на вычетах', val1: comparisonResult1.savings, val2: comparisonResult2.savings },
                                    { label: 'Налоговая нагрузка', val1: comparisonResult1.total_tax_burden, val2: comparisonResult2.total_tax_burden },
                                ].map((row, i) => (
                                    <Paper key={i} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, flex: '1 1 120px' }}>{row.label}</Typography>
                                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Сценарий 1: {row.val1.toFixed(2)} руб.</Typography>
                                        <Typography variant="body2" color="secondary" sx={{ fontWeight: 600 }}>Сценарий 2: {row.val2.toFixed(2)} руб.</Typography>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {/* Диалог детализации */}
                    <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { mx: { xs: 1, sm: 2 }, width: { xs: 'calc(100% - 16px)', sm: 'auto' } } } }}>
                        <DialogTitle>Детализация расчётов</DialogTitle>
                        <DialogContent>
                            {currentTaxes.map((taxItem: TaxResult, idx: number) => (
                                <Accordion key={idx}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 700 }}>{taxItem.name}</Typography>
                                        <Typography sx={{ ml: 'auto', mr: 2 }}>{taxItem.tax.toFixed(2)} руб.</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2">{taxItem.details ? JSON.stringify(taxItem.details).substring(0, 200) : 'Детали отсутствуют'}</Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6">Итого: {totalTax.toFixed(2)} руб.</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailsOpen(false)}>Закрыть</Button>
                        </DialogActions>
                    </Dialog>

                    <Alert severity="warning" sx={{ mt: 3, bgcolor: 'rgba(237, 108, 2, 0.12)', border: '1px solid rgba(237, 108, 2, 0.4)', fontWeight: 'bold' }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>⚠️ Дисклеймер</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Расчёты являются ознакомительными и не заменяют официальную консультацию налогового органа. 
                            Для получения точной информации обратитесь в Министерство по налогам и сборам Республики Беларусь.
                        </Typography>
                    </Alert>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>📅 Что дальше?</Typography>
                        <Typography variant="body2">• Декларация подаётся до 31 марта.<br />• Уплата налогов — до 1 июня (подоходный) и 15 ноября (имущественные).<br />• Рекомендуем сохранить расчёт в PDF или Excel.</Typography>
                    </Alert>
                </>
            )}
        </Box>
    );
};

export default ResultsStep;