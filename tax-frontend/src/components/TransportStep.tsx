// src/components/TransportStep.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Alert, useMediaQuery, useTheme,
    Autocomplete, CircularProgress, Select, MenuItem, FormControl, InputLabel,
    IconButton, Paper, Chip, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ElectricCarIcon from '@mui/icons-material/ElectricCar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import FlightIcon from '@mui/icons-material/Flight';
import { useTaxContext } from '../context/TaxContext';
import { fetchBrands, fetchModels, fetchCarMass, calculateTransportTax } from '../api';
import type { TransportVehicle, TransportTaxResponse } from '../types';

interface CarEntry {
    vehicle_type: string;
    brand: string;
    model: string;
    mass: number | null;
    engine_capacity: number | null;
    power_hp: number | null;
    takeoff_weight: number | null;
    year_of_manufacture: number;
    is_luxury: boolean;
    is_electric: boolean;
    tax_year: number;
}

const GROUP_LABELS: Record<string, string> = {
    car: 'Легковые автомобили',
    electric_car: 'Электромобили',
    motorcycle: 'Мотоциклы',
    electric_motorcycle: 'Электромотоциклы',
    trailer: 'Прицепы',
    trailer_caravan: 'Прицепы-дачи',
    truck: 'Грузовые автомобили',
    bus: 'Автобусы',
    boat: 'Лодки',
    yacht: 'Яхты и катера',
    jet_ski: 'Гидроциклы',
    airplane: 'Самолёты',
    helicopter: 'Вертолёты',
};

const GROUP_ORDER = ['car', 'electric_car', 'motorcycle', 'electric_motorcycle', 'trailer', 'trailer_caravan', 'truck', 'bus', 'boat', 'yacht', 'jet_ski', 'airplane', 'helicopter'];
const KG_VEHICLE_TYPES = ['car', 'truck', 'bus'];
const WEIGHT_VEHICLE_TYPES = ['airplane', 'helicopter'];
const POWER_VEHICLE_TYPES = ['boat'];
const WATER_VEHICLE_TYPES = ['boat', 'yacht', 'jet_ski'];
const AIR_VEHICLE_TYPES = ['airplane', 'helicopter'];

const TransportStep: React.FC = () => {
    const [cars, setCars] = useState<CarEntry[]>([]);
    const [vehicleType, setVehicleType] = useState<string>('car');
    const [brand, setBrand] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [mass, setMass] = useState<string>('');
    const [engineCapacity, setEngineCapacity] = useState<number | null>(null);
    const [powerHp, setPowerHp] = useState<string>('');
    const [takeoffWeight, setTakeoffWeight] = useState<string>('');
    const [year, setYear] = useState<number>(2020);
    const [taxYear, setTaxYear] = useState<number>(2026);
    const [isElectric, setIsElectric] = useState<boolean>(false);
    const [luxuryWarning, setLuxuryWarning] = useState(false);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [massFromDb, setMassFromDb] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [taxResponse, setTaxResponse] = useState<TransportTaxResponse | null>(null);
    
    const massLabel = vehicleType === 'bus' ? 'Количество мест' : vehicleType === 'truck' ? 'Масса (тонн)' : vehicleType === 'trailer' ? 'Масса (тонн)' : 'Масса (тонн)';
    const showMassField = ['car', 'truck', 'bus', 'trailer'].includes(vehicleType);
    const showEngineField = vehicleType === 'motorcycle';
    const showBrandModel = vehicleType === 'car';
    const showPowerField = POWER_VEHICLE_TYPES.includes(vehicleType);
    const showWeightField = WEIGHT_VEHICLE_TYPES.includes(vehicleType);

    const { updateCurrentTax } = useTaxContext();
    const theme = useTheme();

    const [brandOptions, setBrandOptions] = useState<string[]>([]);
    const [modelOptions, setModelOptions] = useState<string[]>([]);
    const previousKeyRef = useRef('');

    const loadBrands = async () => {
        if (brandOptions.length > 0) return;
        try { const res = await fetchBrands(); setBrandOptions(res.data); } catch { setBrandOptions([]); }
    };

    const handleBrandChange = async (newBrand: string) => {
        setBrand(newBrand); setModel(''); setMass(''); setMassFromDb(null); setLuxuryWarning(false); setModelOptions([]);
        if (newBrand.length >= 2) { setCatalogLoading(true); try { const res = await fetchModels(newBrand); setModelOptions(res.data); } catch { setModelOptions([]); } finally { setCatalogLoading(false); } }
    };

    const handleModelChange = async (newModel: string) => {
        setModel(newModel);
        if (newModel && brand) { setCatalogLoading(true); try { const res = await fetchCarMass(brand, newModel); if (res.data.mass !== null && res.data.mass !== undefined) { setMass((res.data.mass / 1000).toFixed(3)); setMassFromDb(res.data.mass); } else { setMass(''); setMassFromDb(null); } setLuxuryWarning(!!res.data.is_luxury); } catch { setMass(''); setMassFromDb(null); setLuxuryWarning(false); } finally { setCatalogLoading(false); } }
        else { setMass(''); setMassFromDb(null); setLuxuryWarning(false); }
    };

    const resetForm = () => { setBrand(''); setModel(''); setMass(''); setYear(2020); setEngineCapacity(null); setPowerHp(''); setTakeoffWeight(''); setIsElectric(false); setLuxuryWarning(false); setMassFromDb(null); setModelOptions([]); setError(null); };

    const addCar = () => {
        if (vehicleType === 'car' && (!brand || !model)) { setError('Укажите марку и модель'); return; }
        if (POWER_VEHICLE_TYPES.includes(vehicleType) && !powerHp) { setError('Укажите мощность мотора (л.с.)'); return; }
        if (WEIGHT_VEHICLE_TYPES.includes(vehicleType) && !takeoffWeight) { setError('Укажите взлётную массу (кг)'); return; }
        setCars([...cars, { vehicle_type: vehicleType, brand: brand || '', model: model || '', mass: mass ? parseFloat(mass) : null, engine_capacity: vehicleType === 'motorcycle' ? engineCapacity : null, power_hp: POWER_VEHICLE_TYPES.includes(vehicleType) ? (powerHp ? parseFloat(powerHp) : null) : null, takeoff_weight: WEIGHT_VEHICLE_TYPES.includes(vehicleType) ? (takeoffWeight ? parseFloat(takeoffWeight) : null) : null, year_of_manufacture: year, is_luxury: luxuryWarning, is_electric: isElectric, tax_year: taxYear }]);
        resetForm();
    };

    const removeCar = (index: number) => setCars(cars.filter((_, i) => i !== index));

    const updateTax = useCallback(async (carsList: CarEntry[]) => {
        if (carsList.length === 0) { setTaxResponse(null); updateCurrentTax({ name: 'Транспортный налог', category: 'property', tax: 0 }); return; }
        const key = JSON.stringify(carsList); if (key === previousKeyRef.current) return; previousKeyRef.current = key;
        try {
            const vehicles: TransportVehicle[] = carsList.map(car => ({
                vehicle_type: car.vehicle_type, mass: KG_VEHICLE_TYPES.includes(car.vehicle_type) ? (car.mass ?? 0) * 1000 : car.mass ?? 0,
                engine_capacity: car.engine_capacity, power_hp: car.power_hp, takeoff_weight: car.takeoff_weight,
                year_of_manufacture: car.year_of_manufacture, is_luxury: car.is_luxury, is_electric: car.is_electric, tax_year: car.tax_year,
            }));
            const res = await calculateTransportTax({ vehicles }); const response = res.data; setTaxResponse(response);
            updateCurrentTax({ name: 'Транспортный налог', category: 'property', tax: response.total_tax, details: { vehicles: carsList, response } });
        } catch { setTaxResponse(null); }
    }, [updateCurrentTax]);

    useEffect(() => { updateTax(cars); }, [cars, updateTax]);

    const groupedCars = useMemo(() => { const groups: Record<string, CarEntry[]> = {}; GROUP_ORDER.forEach(type => { const g = cars.filter(c => c.vehicle_type === type); if (g.length > 0) groups[type] = g; }); return groups; }, [cars]);

    const getVehicleIcon = (entry: CarEntry) => {
        if (WATER_VEHICLE_TYPES.includes(entry.vehicle_type)) return <DirectionsBoatIcon />;
        if (AIR_VEHICLE_TYPES.includes(entry.vehicle_type)) return <FlightIcon />;
        if (entry.vehicle_type === 'electric_car' || (entry.vehicle_type === 'car' && entry.is_electric)) return <ElectricCarIcon />;
        if (entry.vehicle_type === 'motorcycle' || entry.vehicle_type === 'electric_motorcycle') return <TwoWheelerIcon />;
        return <DirectionsCarIcon />;
    };

    const getDetailInfo = (entry: CarEntry) => {
        if (WATER_VEHICLE_TYPES.includes(entry.vehicle_type)) return `Мощность: ${entry.power_hp ?? '—'} л.с.`;
        if (AIR_VEHICLE_TYPES.includes(entry.vehicle_type)) return `Взлётная масса: ${entry.takeoff_weight ?? '—'} кг`;
        if (entry.vehicle_type === 'motorcycle' || entry.vehicle_type === 'electric_motorcycle') return `Объём: ${entry.engine_capacity ?? '—'} см³`;
        return `Масса: ${entry.mass !== null ? entry.mass.toFixed(3) + ' т' : '—'}`;
    };

    return (
        <Box>
            <Typography variant="h6">Транспортные средства</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <FormControl size="small" fullWidth>
                    <InputLabel>Тип ТС</InputLabel>
                    <Select value={vehicleType} label="Тип ТС" onChange={e => setVehicleType(e.target.value)}>
                        <MenuItem value="car">Легковой автомобиль (ДВС)</MenuItem>
                        <MenuItem value="electric_car">Электромобиль</MenuItem>
                        <MenuItem value="motorcycle">Мотоцикл (ДВС)</MenuItem>
                        <MenuItem value="electric_motorcycle">Электромотоцикл</MenuItem>
                        <MenuItem value="trailer">Прицеп</MenuItem>
                        <MenuItem value="trailer_caravan">Прицеп-дача</MenuItem>
                        <MenuItem value="truck">Грузовой автомобиль</MenuItem>
                        <MenuItem value="bus">Автобус</MenuItem>
                        <Divider />
                        <MenuItem value="boat">Лодка (водный)</MenuItem>
                        <MenuItem value="yacht">Яхта / катер</MenuItem>
                        <MenuItem value="jet_ski">Гидроцикл</MenuItem>
                        <Divider />
                        <MenuItem value="airplane">Самолёт (воздушный)</MenuItem>
                        <MenuItem value="helicopter">Вертолёт</MenuItem>
                    </Select>
                </FormControl>

                {showBrandModel && (
                    <>
                        <Autocomplete freeSolo options={brandOptions} value={brand} onInputChange={(_, v) => handleBrandChange(v)} onChange={(_, v) => handleBrandChange(v || '')} onOpen={loadBrands}
                            renderInput={(params) => <TextField {...params} label="Марка" size="small" helperText="Например: Lada" />} noOptionsText="Нет данных" />
                        <Autocomplete freeSolo options={modelOptions} value={model} onInputChange={(_, v) => handleModelChange(v)} onChange={(_, v) => handleModelChange(v || '')} disabled={!brand}
                            renderInput={(params) => <TextField {...params} label="Модель" size="small" helperText={brand ? 'Выберите модель' : 'Сначала выберите марку'} />} noOptionsText={brand ? 'Нет моделей' : 'Сначала выберите марку'} />
                        {catalogLoading && <CircularProgress size={24} />}
                        {luxuryWarning && <Alert severity="warning">Премиум-автомобиль: будет применён коэффициент роскоши</Alert>}
                    </>
                )}

                {showMassField && <TextField label={massLabel} type="number" value={mass} onChange={e => setMass(e.target.value)} size="small" fullWidth helperText={vehicleType === 'bus' ? 'Количество мест' : massFromDb ? `Взято из справочника (${(massFromDb / 1000).toFixed(3)} т)` : 'Введите массу в тоннах'} />}
                {showEngineField && <TextField label="Объём двигателя (см³)" type="number" value={engineCapacity ?? ''} onChange={e => setEngineCapacity(e.target.value ? Number(e.target.value) : null)} size="small" fullWidth helperText="Например: 800" />}
                {showPowerField && <TextField label="Мощность мотора (л.с.)" type="number" value={powerHp} onChange={e => setPowerHp(e.target.value)} size="small" fullWidth helperText="Мощность двигателя в лошадиных силах" />}
                {showWeightField && <TextField label="Взлётная масса (кг)" type="number" value={takeoffWeight} onChange={e => setTakeoffWeight(e.target.value)} size="small" fullWidth helperText={vehicleType === 'airplane' ? '500 руб./год за каждые 100 кг' : '700 руб./год за каждые 100 кг'} />}

                <TextField label="Год выпуска" type="number" value={year} onChange={e => setYear(Number(e.target.value))} size="small" fullWidth helperText="Например: 2020" />
                <TextField label="Год расчёта" type="number" value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} size="small" fullWidth helperText="2025 или 2026" />

                <Button variant="outlined" onClick={addCar} fullWidth>Добавить</Button>
            </Box>

            {Object.keys(groupedCars).length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(groupedCars).map(([type, groupCars]) => (
                        <Box key={type}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{GROUP_LABELS[type] || type}</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                {groupCars.map((entry, i) => {
                                    const globalIdx = cars.indexOf(entry);
                                    const detail = taxResponse?.vehicles_details[globalIdx];
                                    return (
                                        <Paper key={i} elevation={1} sx={{ p: 2, borderLeft: `4px solid ${detail ? '#4caf50' : '#9e9e9e'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getVehicleIcon(entry)}
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{entry.brand || entry.model || GROUP_LABELS[entry.vehicle_type] || entry.vehicle_type}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{getDetailInfo(entry)} | Год: {entry.year_of_manufacture}</Typography>
                                                    {detail && <Typography variant="caption" color="success.main" sx={{ display: 'block', fontWeight: 'bold' }}>Налог: {detail.calculated_tax.toFixed(2)} руб.{detail.note && ` • ${detail.note}`}</Typography>}
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {entry.is_luxury && <Chip label="Люкс" size="small" color="error" variant="outlined" />}
                                                {entry.is_electric && <Chip label="Электро" size="small" color="info" variant="outlined" />}
                                                <IconButton size="small" onClick={() => removeCar(i)}><DeleteIcon /></IconButton>
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}
                    {cars.length > 0 && taxResponse && (
                        <Alert severity="success">Общая сумма транспортного налога: <strong>{taxResponse.total_tax.toFixed(2)} руб.</strong></Alert>
                    )}
                </Box>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default TransportStep;