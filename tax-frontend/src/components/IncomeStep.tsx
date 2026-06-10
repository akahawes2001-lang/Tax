// src/components/IncomeStep.tsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, TextField, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Alert, useMediaQuery, useTheme, TableContainer, Paper,
  IconButton, List, ListItem, ListItemText,
  Select, MenuItem, FormControl, InputLabel,
  FormControlLabel, Checkbox, LinearProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateIncomeTax } from '../api';
import { useTaxContext } from '../context/TaxContext';
import { useDebounce } from '../hooks/useDebounce';
import type { MonthlyIncome, IncomeTaxResponse } from '../types';

const AVAILABLE_YEARS = [2025, 2026];
const MONTHS = [
  { value: 1, label: 'Январь' }, { value: 2, label: 'Февраль' }, { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' }, { value: 5, label: 'Май' }, { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' }, { value: 8, label: 'Август' }, { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' }, { value: 11, label: 'Ноябрь' }, { value: 12, label: 'Декабрь' }
];

const PROFESSIONAL_CATEGORIES = [
  { value: '', label: 'Нет' },
  { value: 'literature', label: 'Литературные произведения (20%)' },
  { value: 'music', label: 'Музыкальные произведения (30%)' },
  { value: 'art', label: 'Произведения искусства (40%)' },
  { value: 'invention', label: 'Изобретения и полезные модели (40%)' },
  { value: 'other_20', label: 'Иные виды деятельности (20%)' },
  { value: 'other_30', label: 'Иные виды деятельности (30%)' },
  { value: 'other_40', label: 'Иные виды деятельности (40%)' },
];

const INIT_MONTH: MonthlyIncome = {
  month: 1, year: 2025, salary: 0,
  children_birthdays: [], is_union_member: false, pension_contributions: false
};

const PROFILE_STORAGE_KEY = 'taxCalcProfile';

const getSavedProfile = () => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { }
  return null;
};

const saveProfile = (profileData: Record<string, any>) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  } catch { }
};

const IncomeStep: React.FC = () => {
  const savedProfile = getSavedProfile();

  const [tab, setTab] = useState(0);
  const [calculationYear, setCalculationYear] = useState<number>(savedProfile?.calculationYear ?? 2026);
  const [monthlySalary, setMonthlySalary] = useState<number>(savedProfile?.monthlySalary ?? 0);
  const [monthlyDividends, setMonthlyDividends] = useState<number>(savedProfile?.monthlyDividends ?? 0);
  const [monthlyForeign, setMonthlyForeign] = useState<number>(savedProfile?.monthlyForeign ?? 0);
  const [monthlyPersonal, setMonthlyPersonal] = useState<number>(savedProfile?.monthlyPersonal ?? 0);
  const [insuranceExpenses, setInsuranceExpenses] = useState<number>(savedProfile?.insuranceExpenses ?? 0);
  const [needsHousing, setNeedsHousing] = useState<boolean>(savedProfile?.needsHousing ?? false);
  const [housingExpenses, setHousingExpenses] = useState<number>(savedProfile?.housingExpenses ?? 0);
  const [professionalCategory, setProfessionalCategory] = useState<string>(savedProfile?.professionalCategory ?? '');
  const [childrenBirthdays, setChildrenBirthdays] = useState<string[]>(savedProfile?.childrenBirthdays ?? []);
  const [newBirthday, setNewBirthday] = useState<string>('');
  const [isSingleParent, setIsSingleParent] = useState<boolean>(savedProfile?.isSingleParent ?? false);
  const [isLargeFamily, setIsLargeFamily] = useState<boolean>(savedProfile?.isLargeFamily ?? false);
  const [disabilityDeduction, setDisabilityDeduction] = useState<boolean>(savedProfile?.disabilityDeduction ?? false);
  const [youngSpecialistDeduction, setYoungSpecialistDeduction] = useState<boolean>(savedProfile?.youngSpecialistDeduction ?? false);
  const [disabledChildrenBirthdays, setDisabledChildrenBirthdays] = useState<string[]>(savedProfile?.disabledChildrenBirthdays ?? []);
  const [newDisabledBirthday, setNewDisabledBirthday] = useState<string>('');
  const [educationExpenses, setEducationExpenses] = useState<number>(savedProfile?.educationExpenses ?? 0);
  const [educationStartMonth, setEducationStartMonth] = useState<number | null>(savedProfile?.educationStartMonth ?? null);
  const [educationEndMonth, setEducationEndMonth] = useState<number | null>(savedProfile?.educationEndMonth ?? null);
  const [medicalExpenses, setMedicalExpenses] = useState<number>(savedProfile?.medicalExpenses ?? 0);
  const [medicineExpenses, setMedicineExpenses] = useState<number>(savedProfile?.medicineExpenses ?? 0);
  const [alimonyPaid, setAlimonyPaid] = useState<number>(savedProfile?.alimonyPaid ?? 0);
  const [charityAmount, setCharityAmount] = useState<number>(savedProfile?.charityAmount ?? 0);

  const [months, setMonths] = useState<MonthlyIncome[]>(
    Array.from({ length: 12 }, (_, i) => ({ ...INIT_MONTH, month: i + 1 }))
  );
  const [result, setResult] = useState<IncomeTaxResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { updateCurrentTax } = useTaxContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const previousKeyRef = useRef('');

  useEffect(() => {
    saveProfile({
      calculationYear, monthlySalary, monthlyDividends, monthlyForeign,
      monthlyPersonal, insuranceExpenses, needsHousing, housingExpenses,
      professionalCategory, childrenBirthdays, isSingleParent, isLargeFamily,
      disabilityDeduction, youngSpecialistDeduction, disabledChildrenBirthdays,
      educationExpenses, educationStartMonth, educationEndMonth,
      medicalExpenses, medicineExpenses, alimonyPaid, charityAmount,
    });
  }, [calculationYear, monthlySalary, monthlyDividends, monthlyForeign, monthlyPersonal, insuranceExpenses, needsHousing, housingExpenses, professionalCategory, childrenBirthdays, isSingleParent, isLargeFamily, disabilityDeduction, youngSpecialistDeduction, disabledChildrenBirthdays, educationExpenses, educationStartMonth, educationEndMonth, medicalExpenses, medicineExpenses, alimonyPaid, charityAmount]);

  useEffect(() => {
    localStorage.setItem('taxCalcMonthlySalary', String(monthlySalary));
  }, [monthlySalary]);

  useEffect(() => {
    setMonths(prev => prev.map(m => ({ ...m, year: calculationYear })));
  }, [calculationYear]);

  const calcDepsKey = useMemo(() => JSON.stringify({
    tab, calculationYear, monthlySalary, monthlyDividends, monthlyForeign,
    monthlyPersonal, insuranceExpenses, needsHousing, housingExpenses,
    professionalCategory, childrenBirthdays, isSingleParent, isLargeFamily,
    disabilityDeduction, youngSpecialistDeduction, disabledChildrenBirthdays,
    educationExpenses, educationStartMonth, educationEndMonth,
    medicalExpenses, medicineExpenses, charityAmount,
    monthsSalaries: tab === 1 ? months.map(m => m.salary) : null,
  }), [tab, calculationYear, monthlySalary, monthlyDividends, monthlyForeign, monthlyPersonal, insuranceExpenses, needsHousing, housingExpenses, professionalCategory, childrenBirthdays, isSingleParent, isLargeFamily, disabilityDeduction, youngSpecialistDeduction, disabledChildrenBirthdays, educationExpenses, educationStartMonth, educationEndMonth, medicalExpenses, medicineExpenses, charityAmount, months]);

  const debouncedKey = useDebounce(calcDepsKey, 600);

  const handleCalculate = useCallback(async () => {
    if (debouncedKey === previousKeyRef.current) return;
    previousKeyRef.current = debouncedKey;
    setLoading(true); setError(null); setSuccess(false);
    try {
      const payload: MonthlyIncome[] = tab === 0
        ? Array.from({ length: 12 }, (_, i) => ({
            ...INIT_MONTH, month: i + 1, year: calculationYear,
            salary: monthlySalary, dividends: monthlyDividends,
            foreign_income: monthlyForeign, personal_income: monthlyPersonal,
            insurance_expenses: insuranceExpenses, needs_housing_improvement: needsHousing,
            housing_expenses: housingExpenses, children_birthdays: childrenBirthdays,
            is_single_parent: isSingleParent, is_large_family: isLargeFamily,
            disability_deduction: disabilityDeduction, young_specialist_deduction: youngSpecialistDeduction,
            disabled_children_birthdays: disabledChildrenBirthdays,
            education_expenses: educationExpenses, education_start_month: educationStartMonth,
            education_end_month: educationEndMonth, medical_expenses: medicalExpenses,
            medicine_expenses: medicineExpenses, alimony_paid: alimonyPaid,
            charity_amount: charityAmount, professional_deduction_category: professionalCategory || null,
            is_union_member: false, pension_contributions: false,
          }))
        : months.map(m => ({ ...m, year: calculationYear, dividends: monthlyDividends, foreign_income: monthlyForeign, personal_income: monthlyPersonal, insurance_expenses: insuranceExpenses, needs_housing_improvement: needsHousing, housing_expenses: housingExpenses, children_birthdays: childrenBirthdays, is_single_parent: isSingleParent, is_large_family: isLargeFamily, disability_deduction: disabilityDeduction, young_specialist_deduction: youngSpecialistDeduction, disabled_children_birthdays: disabledChildrenBirthdays, education_expenses: educationExpenses, education_start_month: educationStartMonth, education_end_month: educationEndMonth, medical_expenses: medicalExpenses, medicine_expenses: medicineExpenses, alimony_paid: alimonyPaid, charity_amount: charityAmount, professional_deduction_category: professionalCategory || null, is_union_member: false, pension_contributions: false })).filter(m => m.salary > 0);

      const res = await calculateIncomeTax({ monthly_incomes: payload });
      setResult(res.data); setSuccess(true);
      updateCurrentTax({ name: 'Подоходный налог', category: 'income', tax: res.data.final_tax, details: res.data });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || (err as { message?: string })?.message || 'Неизвестная ошибка';
      setError(String(detail));
    } finally { setLoading(false); }
  }, [debouncedKey, tab, calculationYear, monthlySalary, monthlyDividends, monthlyForeign, monthlyPersonal, insuranceExpenses, needsHousing, housingExpenses, professionalCategory, childrenBirthdays, isSingleParent, isLargeFamily, disabilityDeduction, youngSpecialistDeduction, disabledChildrenBirthdays, educationExpenses, educationStartMonth, educationEndMonth, medicalExpenses, medicineExpenses, alimonyPaid, charityAmount, months, updateCurrentTax]);

  useEffect(() => { handleCalculate(); }, [handleCalculate]);

  const handleAddChild = () => { if (newBirthday && !childrenBirthdays.includes(newBirthday)) { setChildrenBirthdays([...childrenBirthdays, newBirthday]); setNewBirthday(''); } };
  const handleRemoveChild = (index: number) => setChildrenBirthdays(childrenBirthdays.filter((_, i) => i !== index));
  const handleAddDisabledChild = () => { if (newDisabledBirthday && !disabledChildrenBirthdays.includes(newDisabledBirthday)) { setDisabledChildrenBirthdays([...disabledChildrenBirthdays, newDisabledBirthday]); setNewDisabledBirthday(''); } };
  const handleRemoveDisabledChild = (index: number) => setDisabledChildrenBirthdays(disabledChildrenBirthdays.filter((_, i) => i !== index));

  const profileProgress = useMemo(() => {
    let filled = 0; const total = 8;
    if (monthlySalary > 0) filled++;
    if (childrenBirthdays.length > 0) filled++;
    if (isSingleParent || isLargeFamily) filled++;
    if (disabledChildrenBirthdays.length > 0) filled++;
    if (disabilityDeduction) filled++;
    if (youngSpecialistDeduction) filled++;
    if (educationExpenses > 0) filled++;
    if (insuranceExpenses > 0) filled++;
    if (needsHousing && housingExpenses > 0) filled++;
    if (monthlyDividends > 0 || monthlyForeign > 0 || monthlyPersonal > 0) filled++;
    return (filled / total) * 100;
  }, [monthlySalary, childrenBirthdays, isSingleParent, isLargeFamily, disabledChildrenBirthdays, disabilityDeduction, youngSpecialistDeduction, educationExpenses, insuranceExpenses, needsHousing, housingExpenses, monthlyDividends, monthlyForeign, monthlyPersonal]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Доходы</Typography>
        <FormControl size="small" sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}>
          <InputLabel>Год расчёта</InputLabel>
          <Select value={calculationYear} label="Год расчёта" onChange={e => setCalculationYear(Number(e.target.value))}>
            {AVAILABLE_YEARS.map(year => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 1, mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Заполнено данных профиля</Typography>
          <Typography variant="caption" color="text.secondary">{Math.round(profileProgress)}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={profileProgress} sx={{ height: 6, borderRadius: 3 }} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>Чем больше данных вы укажете, тем точнее будет расчёт налога.</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }} variant={isMobile ? 'scrollable' : 'standard'}>
        <Tab label="Общий доход за год" />
        <Tab label="Расписать по месяцам" />
      </Tabs>

      {tab === 0 ? (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          <TextField label="Ежемесячный доход (зарплата)" type="number" value={monthlySalary} onChange={e => setMonthlySalary(Number(e.target.value))} helperText="Сумма до вычета налогов" fullWidth />
          <TextField label="Ежемесячные дивиденды" type="number" value={monthlyDividends} onChange={e => setMonthlyDividends(Number(e.target.value))} helperText="Сумма дохода от ценных бумаг" fullWidth />
          <TextField label="Доход из-за границы (за месяц)" type="number" value={monthlyForeign} onChange={e => setMonthlyForeign(Number(e.target.value))} helperText="Сумма, полученная за пределами РБ" fullWidth />
          <TextField label="Доход от физлиц (не от ИП) за месяц" type="number" value={monthlyPersonal} onChange={e => setMonthlyPersonal(Number(e.target.value))} helperText="Сумма по договорам с физлицами" fullWidth />
          <TextField label="Страховые взносы (за месяц)" type="number" value={insuranceExpenses} onChange={e => setInsuranceExpenses(Number(e.target.value))} helperText="Сумма страховых отчислений" fullWidth />
          <FormControlLabel control={<Checkbox checked={needsHousing} onChange={e => setNeedsHousing(e.target.checked)} />} label="Состою на учёте нуждающихся в улучшении жилищных условий" />
          <TextField label="Расходы на строительство/покупку жилья (за месяц)" type="number" value={housingExpenses} onChange={e => setHousingExpenses(Number(e.target.value))} helperText="Фактические расходы на жильё" fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Профессиональный вычет</InputLabel>
            <Select value={professionalCategory} label="Профессиональный вычет" onChange={e => setProfessionalCategory(e.target.value)}>
              {PROFESSIONAL_CATEGORIES.map(cat => (<MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          {months.map((m, i) => (
            <Box sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 8px)', md: 'calc(25% - 12px)' } }} key={i}>
              <TextField label={`Месяц ${i + 1}`} type="number" value={m.salary} onChange={e => setMonths(prev => { const u = [...prev]; u[i] = { ...u[i], salary: Number(e.target.value) }; return u; })} size="small" fullWidth />
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 2, width: '100%' }}>
        <Typography variant="subtitle2">Дети до 18 лет</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField type="date" value={newBirthday} onChange={e => setNewBirthday(e.target.value)} size="small" fullWidth />
          <Button variant="outlined" onClick={handleAddChild} size="small" fullWidth={isMobile}>Добавить</Button>
        </Box>
        {childrenBirthdays.length > 0 && (
          <>
            <List dense>
              {childrenBirthdays.map((bday, idx) => (
                <ListItem key={idx} secondaryAction={<IconButton edge="end" size="small" onClick={() => handleRemoveChild(idx)}><DeleteIcon /></IconButton>}>
                  <ListItemText primary={bday} />
                </ListItem>
              ))}
            </List>
            <FormControlLabel control={<Checkbox checked={isSingleParent} onChange={e => setIsSingleParent(e.target.checked)} size="small" />} label="Одинокий родитель / опекун (вычет 120 руб./мес.)" />
            <FormControlLabel control={<Checkbox checked={isLargeFamily} onChange={e => setIsLargeFamily(e.target.checked)} size="small" />} label="Многодетная семья (вычет 120 руб./мес.)" />
          </>
        )}
      </Box>

      <Box sx={{ mt: 2, width: '100%' }}>
        <Typography variant="subtitle2">Дети-инвалиды с детства I группы</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField type="date" value={newDisabledBirthday} onChange={e => setNewDisabledBirthday(e.target.value)} size="small" fullWidth />
          <Button variant="outlined" onClick={handleAddDisabledChild} size="small" fullWidth={isMobile}>Добавить</Button>
        </Box>
        {disabledChildrenBirthdays.length > 0 && (
          <List dense>
            {disabledChildrenBirthdays.map((bday, idx) => (
              <ListItem key={idx} secondaryAction={<IconButton edge="end" size="small" onClick={() => handleRemoveDisabledChild(idx)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={bday} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Alert severity="info" sx={{ mt: 2 }}>Сумма вычетов не может превышать 306 руб./мес. (ст. 209 НК РБ).</Alert>

      <FormControlLabel control={<Checkbox checked={disabilityDeduction} onChange={e => setDisabilityDeduction(e.target.checked)} />} label="Инвалид I/II группы (вычет 306 руб./мес.)" />
      <FormControlLabel control={<Checkbox checked={youngSpecialistDeduction} onChange={e => setYoungSpecialistDeduction(e.target.checked)} />} label="Молодой специалист (вычет 860 руб./мес.)" />

      <Box sx={{ mt: 2, width: '100%' }}>
        <TextField label="Расходы на обучение (за месяц)" type="number" value={educationExpenses} onChange={e => setEducationExpenses(Number(e.target.value))} helperText="Фактические расходы на учёбу" fullWidth />
        <Typography variant="body2" sx={{ mt: 1 }}>Период обучения:</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
          <FormControl size="small" sx={{ minWidth: 120, flex: { xs: 1, sm: 'none' } }}>
            <InputLabel>Начало</InputLabel>
            <Select value={educationStartMonth ?? ''} label="Начало" onChange={e => setEducationStartMonth(e.target.value ? Number(e.target.value) : null)}>
              {MONTHS.map(m => (<MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>))}
            </Select>
          </FormControl>
          <Typography variant="body1">–</Typography>
          <FormControl size="small" sx={{ minWidth: 120, flex: { xs: 1, sm: 'none' } }}>
            <InputLabel>Окончание</InputLabel>
            <Select value={educationEndMonth ?? ''} label="Окончание" onChange={e => setEducationEndMonth(e.target.value ? Number(e.target.value) : null)}>
              {MONTHS.map(m => (<MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ mt: 2, width: '100%' }}>
        <TextField label="Расходы на медицинские услуги (за месяц)" type="number" value={medicalExpenses} onChange={e => setMedicalExpenses(Number(e.target.value))} helperText="Фактические расходы на лечение" fullWidth />
        <TextField label="Расходы на лекарства (по рецепту) за месяц" type="number" value={medicineExpenses} onChange={e => setMedicineExpenses(Number(e.target.value))} helperText="Расходы на приобретённые по рецепту лекарства" fullWidth sx={{ mt: 1 }} />
      </Box>

      <Box sx={{ mt: 2, width: '100%' }}>
        <TextField label="Уплаченные алименты (вычет)" type="number" value={alimonyPaid} onChange={e => setAlimonyPaid(Number(e.target.value))} helperText="Сумма алиментов" fullWidth />
      </Box>

      <Box sx={{ mt: 2, width: '100%' }}>
        <TextField label="Пожертвования на благотворительность" type="number" value={charityAmount} onChange={e => setCharityAmount(Number(e.target.value))} helperText="Вычет не более 50% от суммы налога" fullWidth />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleCalculate} disabled={loading} fullWidth>
          {loading ? 'Загрузка...' : 'Рассчитать подоходный налог'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>Расчёт выполнен успешно</Alert>}

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Детализация по месяцам</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400, overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow><TableCell>Месяц</TableCell><TableCell>Облагаемый доход</TableCell><TableCell>Налог</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {result.monthly_details.map(d => (
                  <TableRow key={d.month}><TableCell>{d.month}</TableCell><TableCell>{d.taxable_income.toFixed(2)}</TableCell><TableCell>{d.tax_withheld.toFixed(2)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ width: '100%', mt: 2 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.monthly_details} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="taxable_income" fill="#8884d8" name="Доход" />
                <Bar dataKey="tax_withheld" fill="#82ca9d" name="Налог" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Typography>Итого налог: {result.final_tax.toFixed(2)} руб.</Typography>
          <Typography>Корректировка: {result.adjustment_due.toFixed(2)} руб.</Typography>

          {result.savings > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">Экономия на вычетах: <strong>{result.savings.toFixed(2)} руб.</strong></Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default IncomeStep;