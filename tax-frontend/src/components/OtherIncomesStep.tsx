// src/components/OtherIncomesStep.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box, Typography, Tabs, Tab, TextField, Button, Select, MenuItem,
  FormControlLabel, Checkbox, Alert, useMediaQuery, useTheme,
  Autocomplete, Tooltip
} from '@mui/material';
import { calculateRentalTax, calculateCryptoTax, calculatePropertySaleTax, fetchRentalCities } from '../api';
import { useTaxContext } from '../context/TaxContext';
import { useDebounce } from '../hooks/useDebounce';

const OtherIncomesStep: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { updateCurrentTax } = useTaxContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Rental
  const [city, setCity] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [propType, setPropType] = useState('room');
  const [months, setMonths] = useState(1);
  const [rooms, setRooms] = useState<number>(1);
  const [rentalResult, setRentalResult] = useState<number | null>(null);
  const rentalPreviousKeyRef = useRef('');

  const loadCities = async () => {
    if (cityOptions.length > 0) return;
    try {
      const res = await fetchRentalCities();
      const uniqueCities = Array.from(new Set(res.data.cities));
      setCityOptions(["Другие населённые пункты (20 руб.)", ...uniqueCities]);
    } catch {
      setCityOptions(["Другие населённые пункты (20 руб.)"]);
    }
  };

  const handleRental = useCallback(async () => {
    if (!city) {
      setError('Выберите населённый пункт');
      return;
    }
    const key = JSON.stringify({ city, propType, months });
    if (key === rentalPreviousKeyRef.current) return;
    rentalPreviousKeyRef.current = key;

    setLoading(true); setError(null); setSuccess(false); setRentalResult(null);
    try {
      const cityName = city.includes("Другие") ? "другие" : city;
      const res = await calculateRentalTax({
        city: cityName,
        property_type: propType,
        months
      });
      setRentalResult(res.data.total_tax);
      updateCurrentTax({
        name: 'Налог на аренду',
        category: 'other',
        tax: res.data.total_tax,
        details: res.data
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Ошибка при расчёте аренды'));
    } finally { setLoading(false); }
  }, [city, propType, months, updateCurrentTax]);

  // Crypto
  const [gross, setGross] = useState(0);
  const cryptoPreviousKeyRef = useRef('');
  const handleCrypto = useCallback(async () => {
    if (gross <= 0) return;
    const key = JSON.stringify({ gross });
    if (key === cryptoPreviousKeyRef.current) return;
    cryptoPreviousKeyRef.current = key;

    setLoading(true); setError(null); setSuccess(false);
    try {
      const res = await calculateCryptoTax({ gross_income: gross });
      updateCurrentTax({ name: 'Налог на криптовалюту', category: 'investment', tax: res.data.tax, details: res.data });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Ошибка при расчёте криптоналога'));
    } finally { setLoading(false); }
  }, [gross, updateCurrentTax]);

  // Sale
  const [saleType, setSaleType] = useState('auto');
  const [salePrice, setSalePrice] = useState(0);
  const [acquisitionCost, setAcquisitionCost] = useState(0);
  const [applyDeduction, setApplyDeduction] = useState(false);
  const [soleProperty5Years, setSoleProperty5Years] = useState(false);
  const salePreviousKeyRef = useRef('');
  const handleSale = useCallback(async () => {
    if (salePrice <= 0) return;
    const key = JSON.stringify({ saleType, salePrice, acquisitionCost, applyDeduction, soleProperty5Years });
    if (key === salePreviousKeyRef.current) return;
    salePreviousKeyRef.current = key;

    setLoading(true); setError(null); setSuccess(false);
    try {
      const res = await calculatePropertySaleTax({
        property_type: saleType, sale_price: salePrice,
        acquisition_cost: acquisitionCost, apply_deduction: applyDeduction,
        sole_property_5_years: soleProperty5Years
      });
      updateCurrentTax({ name: 'Налог с продажи имущества', category: 'property', tax: res.data.tax, details: res.data });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Ошибка при расчёте налога с продажи'));
    } finally { setLoading(false); }
  }, [saleType, salePrice, acquisitionCost, applyDeduction, soleProperty5Years, updateCurrentTax]);

  const getErrorMessage = (err: unknown, defaultMsg: string): string => {
    const detail =
      (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
      (err as { message?: string })?.message;
    return detail ? String(detail) : defaultMsg;
  };

  // Определяем, нужно ли показывать поле "Количество комнат"
  const showRoomsField = (() => {
    if (!city || propType !== 'apartment' && propType !== 'house' && propType !== 'room') return false;
    const isMinskOrRegional = city === 'Минск' || (
      cityOptions.includes(city) &&
      (city === 'Брест' || city === 'Витебск' || city === 'Гомель' || city === 'Гродно' || city === 'Могилёв')
    );
    return isMinskOrRegional;
  })();

  const rentalKey = useMemo(() => JSON.stringify({ city, propType, months, rooms }), [city, propType, months, rooms]);
  const cryptoKey = useMemo(() => JSON.stringify({ gross }), [gross]);
  const saleKey = useMemo(() => JSON.stringify({ saleType, salePrice, acquisitionCost, applyDeduction, soleProperty5Years }), [saleType, salePrice, acquisitionCost, applyDeduction, soleProperty5Years]);

  const debouncedRental = useDebounce(rentalKey, 600);
  const debouncedCrypto = useDebounce(cryptoKey, 600);
  const debouncedSale = useDebounce(saleKey, 600);

  useEffect(() => {
    if (tab === 0) handleRental();
  }, [debouncedRental, tab, handleRental]);
  useEffect(() => {
    if (tab === 1) handleCrypto();
  }, [debouncedCrypto, tab, handleCrypto]);
  useEffect(() => {
    if (tab === 2) handleSale();
  }, [debouncedSale, tab, handleSale]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6">Прочие доходы</Typography>
        <Tooltip title="Здесь рассчитываются налоги на аренду, криптовалюту и продажу имущества. Выберите нужную вкладку." arrow>
          <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
        </Tooltip>
      </Box>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(null); setSuccess(false); }} variant={isMobile ? 'scrollable' : 'standard'}>
        <Tab label="Аренда" />
        <Tab label="Криптовалюта" />
        <Tab label="Продажа имущества" />
      </Tabs>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>Расчёт выполнен успешно</Alert>}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, width: isMobile ? '100%' : 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Autocomplete
              options={cityOptions}
              value={city}
              onChange={(_, newValue) => setCity(newValue)}
              onOpen={loadCities}
              noOptionsText="Ничего не найдено"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Населённый пункт"
                  helperText="Выберите город"
                />
              )}
              sx={{ flex: 1 }}
            />
            <Tooltip title="Выберите город из выпадающего списка. Если вашего города нет, выберите «Другие». Ставка зависит от категории: Минск — 53 руб./мес., облцентры — 49 руб./мес., крупные города — 33 руб./мес., иные — 20 руб./мес." arrow>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
            </Tooltip>
          </Box>

          <Select value={propType} onChange={e => setPropType(e.target.value)} fullWidth>
            <MenuItem value="room">Жилая комната / садовый домик / дача</MenuItem>
            <MenuItem value="garage">Гараж</MenuItem>
            <MenuItem value="parking">Машино-место</MenuItem>
          </Select>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Количество месяцев"
              type="number"
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              fullWidth
              helperText="Сколько месяцев сдаётся"
              slotProps={{ htmlInput: { 'data-testid': 'rental-months-input' } }}
            />
            <Tooltip title="Укажите, на сколько месяцев вы сдаёте объект. Итоговая сумма налога = месячная ставка × количество месяцев. Пример: комната в Минске на 6 месяцев — 53 × 6 = 318 руб." arrow>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
            </Tooltip>
          </Box>

          <Button variant="contained" onClick={handleRental} disabled={loading} fullWidth data-testid="rental-calculate-button">
            {loading ? 'Загрузка...' : 'Рассчитать'}
          </Button>
          {rentalResult !== null && (
            <Alert severity="success">
              Сумма налога за {months} мес.: <strong>{rentalResult.toFixed(2)} руб.</strong>
            </Alert>
          )}
          <Alert severity="info">
            Ставки на 2026 год: Минск – 53 руб., облцентры – 49 руб., крупные города (Барановичи, Бобруйск, Борисов...) – 33 руб., иные населённые пункты – 20 руб.
          </Alert>
        </Box>
      )}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, width: isMobile ? '100%' : 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Доход от операций с токенами"
              type="number"
              value={gross}
              onChange={e => setGross(Number(e.target.value))}
              fullWidth
              helperText="Общая сумма дохода"
            />
            <Tooltip title="Введите общую сумму дохода от операций с токенами за год. Налоговая база = доход × 0.0367, ставка налога — 26%. Пример: доход 10 000 руб. → налог = 10 000 × 0.0367 × 0.26 ≈ 95.42 руб." arrow>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
            </Tooltip>
          </Box>
          <Button variant="contained" onClick={handleCrypto} disabled={loading} fullWidth>
            {loading ? 'Загрузка...' : 'Рассчитать налог'}
          </Button>
          <Alert severity="info">
            Налог на криптовалюту: коэффициент доходности – 0.0367 (2026 г.), ставка – 26%. Налог = (доход × 0.0367) × 0.26.
          </Alert>
        </Box>
      )}
      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, width: isMobile ? '100%' : 300 }}>
          <Select value={saleType} onChange={e => setSaleType(e.target.value)} fullWidth>
            <MenuItem value="auto">Автомобиль</MenuItem>
            <MenuItem value="real_estate">Недвижимость</MenuItem>
            <MenuItem value="securities">Ценные бумаги</MenuItem>
          </Select>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Цена продажи"
              type="number"
              value={salePrice}
              onChange={e => setSalePrice(Number(e.target.value))}
              fullWidth
              helperText="Сумма продажи"
              slotProps={{ htmlInput: { 'data-testid': 'sale-price-input' } }}
            />
            <Tooltip title="Цена, по которой вы продали имущество. Налог рассчитывается с разницы между ценой продажи и расходами на приобретение (или с применением вычета 20%). Пример: продали авто за 80 000 руб." arrow>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Расходы на приобретение"
              type="number"
              value={acquisitionCost}
              onChange={e => setAcquisitionCost(Number(e.target.value))}
              fullWidth
              helperText="Документально подтверждённые"
            />
            <Tooltip title="Сумма, которую вы потратили на приобретение этого имущества. Если подтвердить расходы документально, налог будет меньше. Пример: купили авто за 70 000 руб. — укажите 70 000." arrow>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
            </Tooltip>
          </Box>

          <FormControlLabel
            control={<Checkbox checked={applyDeduction} onChange={e => setApplyDeduction(e.target.checked)} slotProps={{ input: { 'data-testid': 'sale-deduction-checkbox' } as any }} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Применить имущественный вычет
                <Tooltip title="Если у вас нет подтверждённых расходов, можно применить вычет 20% от цены продажи. Пример: продали за 80 000 руб. → вычет 16 000 руб., налог с 64 000 руб." arrow>
                  <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                </Tooltip>
              </Box>
            }
          />
          <FormControlLabel
            control={<Checkbox checked={soleProperty5Years} onChange={e => setSoleProperty5Years(e.target.checked)} />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Единственное жильё, продаваемое не чаще раза в 5 лет (освобождение от налога)
                <Tooltip title="Если вы продаёте единственное жильё и не делали этого в течение последних 5 лет, налог платить не нужно. Пример: продаёте квартиру, в которой жили 10 лет — налог 0 руб." arrow>
                  <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                </Tooltip>
              </Box>
            }
            sx={{ mt: 0.5 }}
          />
          <Button variant="contained" onClick={handleSale} disabled={loading} fullWidth data-testid="sale-calculate-button">
            {loading ? 'Загрузка...' : 'Рассчитать'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default OtherIncomesStep;