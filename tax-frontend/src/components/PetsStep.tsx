// src/components/PetsStep.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box, Typography, TextField, Button,
    Alert, useMediaQuery, useTheme,
    IconButton, Autocomplete, CircularProgress,
    FormControlLabel, Checkbox, Tooltip, Paper, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PetsIcon from '@mui/icons-material/Pets';
import { searchDogBreeds } from '../api';
import { useTaxContext } from '../context/TaxContext';
import { useDebounce } from '../hooks/useDebounce';

interface DogEntry {
    breed: string;
    year: number;
    number_of_dogs: number;
    quarters: number;
    is_disabled_12: boolean;
    is_pensioner: boolean;
    is_large_family: boolean;
}

interface DogBreed {
    id: number;
    name: string;
    is_dangerous: boolean;
}

const DANGEROUS_RATE = 67;
const NORMAL_RATE = 14;

const PetsStep: React.FC = () => {
    const [dogs, setDogs] = useState<DogEntry[]>([]);
    const [breedInput, setBreedInput] = useState<string>('');
    const [selectedBreed, setSelectedBreed] = useState<DogBreed | null>(null);
    const [breedOptions, setBreedOptions] = useState<DogBreed[]>([]);
    const [breedLoading, setBreedLoading] = useState(false);
    const [count, setCount] = useState(1);
    const [quarters, setQuarters] = useState(4);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isDisabled12, setIsDisabled12] = useState(false);
    const [isPensioner, setIsPensioner] = useState(false);
    const [isLargeFamily, setIsLargeFamily] = useState(false);

    const { updateCurrentTax } = useTaxContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleSearch = async (query: string) => {
        if (query.length < 2) {
            setBreedOptions([]);
            return;
        }
        setBreedLoading(true);
        try {
            const res = await searchDogBreeds(query);
            setBreedOptions(res.data);
        } catch {
            setBreedOptions([]);
        } finally {
            setBreedLoading(false);
        }
    };

    const addDog = () => {
        if (!selectedBreed) {
            setError('Выберите породу из списка');
            return;
        }
        setDogs([...dogs, {
            breed: selectedBreed.name,
            year: 2026,
            number_of_dogs: count,
            quarters: quarters,
            is_disabled_12: isDisabled12,
            is_pensioner: isPensioner,
            is_large_family: isLargeFamily,
        }]);
        setCount(1);
        setQuarters(4);
        setBreedInput('');
        setSelectedBreed(null);
        setBreedOptions([]);
        setSuccess(false);
        setError(null);
    };

    const removeDog = (index: number) => {
        setDogs(dogs.filter((_, i) => i !== index));
    };

    const calcKey = useMemo(() => JSON.stringify({
        dogs: dogs.map(d => ({
            breed: d.breed,
            number_of_dogs: d.number_of_dogs,
            quarters: d.quarters,
            is_disabled_12: d.is_disabled_12,
            is_pensioner: d.is_pensioner,
            is_large_family: d.is_large_family,
        })),
        isDisabled12,
        isPensioner,
        isLargeFamily,
        breedOptions: breedOptions.map(b => b.name + b.is_dangerous),
    }), [dogs, isDisabled12, isPensioner, isLargeFamily, breedOptions]);

    const debouncedKey = useDebounce(calcKey, 600);
    const previousKeyRef = useRef('');

    const getDangerousStatus = useCallback((breedName: string): boolean => {
        const found = breedOptions.find(b => b.name === breedName);
        return found ? found.is_dangerous : false;
    }, [breedOptions]);

    const { dangerousDogs, safeDogs, dangerousTax, safeTax, totalTax } = useMemo(() => {
        const dangerous: DogEntry[] = [];
        const safe: DogEntry[] = [];
        let dTax = 0;
        let sTax = 0;

        dogs.forEach(dog => {
            const isDangerous = getDangerousStatus(dog.breed);
            let rate = isDangerous ? DANGEROUS_RATE : NORMAL_RATE;
            let tax = rate * dog.number_of_dogs * dog.quarters;

            if (dog.is_disabled_12) {
                tax = 0;
            } else {
                if (dog.is_pensioner && dog.number_of_dogs > 0) {
                    tax -= (rate * 0.5) * dog.quarters;
                }
                if (dog.is_large_family && dog.number_of_dogs > 0) {
                    tax -= (rate * 0.5) * dog.quarters;
                }
                if (tax < 0) tax = 0;
            }

            if (isDangerous) {
                dangerous.push(dog);
                dTax += tax;
            } else {
                safe.push(dog);
                sTax += tax;
            }
        });

        return {
            dangerousDogs: dangerous,
            safeDogs: safe,
            dangerousTax: dTax,
            safeTax: sTax,
            totalTax: dTax + sTax,
        };
    }, [dogs, getDangerousStatus]);

    const calculateAll = useCallback(() => {
        if (dogs.length === 0) return;
        if (debouncedKey === previousKeyRef.current) return;
        previousKeyRef.current = debouncedKey;

        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            updateCurrentTax({ name: 'Налог на собак', category: 'property', tax: totalTax, details: dogs });
            setSuccess(true);
        } catch (err) {
            setError('Ошибка при расчёте налога на собак');
        } finally {
            setLoading(false);
        }
    }, [dogs, totalTax, updateCurrentTax, debouncedKey]);

    useEffect(() => {
        calculateAll();
    }, [calculateAll]);

    const renderDogCard = (dog: DogEntry, index: number) => {
        const isDangerous = getDangerousStatus(dog.breed);
        return (
            <Paper
                key={index}
                elevation={1}
                sx={{
                    p: 2,
                    borderLeft: `4px solid ${isDangerous ? '#f44336' : '#4caf50'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PetsIcon sx={{ color: isDangerous ? '#f44336' : '#4caf50' }} />
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {dog.breed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {dog.number_of_dogs} шт. × {dog.quarters} кварт.
                            {dog.is_disabled_12 && ' | Освобождены (инв. I/II)'}
                            {dog.is_pensioner && ' | Скидка 50% (пенсионер)'}
                            {dog.is_large_family && ' | Скидка 50% (многодет.)'}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={isDangerous ? 'Опасная' : 'Неопасная'}
                        size="small"
                        color={isDangerous ? 'error' : 'success'}
                        variant="outlined"
                    />
                    <IconButton size="small" onClick={() => removeDog(index)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Paper>
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Домашние животные (собаки)</Typography>
                <Tooltip title="Добавьте всех ваших собак. Порода определяет ставку налога: опасные — 67 руб./квартал, неопасные — 14 руб./квартал. Предусмотрены льготы для инвалидов, пенсионеров и многодетных семей." arrow>
                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                </Tooltip>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isDisabled12} onChange={e => setIsDisabled12(e.target.checked)} />}
                        label="Инвалид I/II группы (освобождение от налога)"
                    />
                    <Tooltip title="Полное освобождение от уплаты налога за всех собак, независимо от породы и количества. Пример: у вас три собаки, вы инвалид II группы — налог 0 руб." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isPensioner} onChange={e => setIsPensioner(e.target.checked)} />}
                        label="Пенсионер (скидка 50% на одну собаку)"
                    />
                    <Tooltip title="Скидка 50% применяется к одной собаке (любой породы). Если у вас несколько собак, скидка применяется только к одной. Пример: одна опасная собака — вместо 67 руб. будет 33.5 руб./квартал." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isLargeFamily} onChange={e => setIsLargeFamily(e.target.checked)} />}
                        label="Многодетная семья (скидка 50% на одну собаку)"
                    />
                    <Tooltip title="Скидка 50% применяется к одной собаке (любой породы). Если у вас несколько собак, скидка применяется только к одной. Пример: одна опасная собака — вместо 67 руб. будет 33.5 руб./квартал." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mt: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Autocomplete
                        options={breedOptions}
                        inputValue={breedInput}
                        onInputChange={(_, newValue) => {
                            setBreedInput(newValue);
                            handleSearch(newValue);
                        }}
                        getOptionLabel={(option) => option.name}
                        onChange={(_, newValue) => setSelectedBreed(newValue)}
                        loading={breedLoading}
                        noOptionsText="Ничего не найдено"
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Порода"
                                size="small"
                                fullWidth={isMobile}
                                helperText="Начните вводить название"
                            />
                        )}
                        sx={{ minWidth: 200, flex: 1 }}
                    />
                </Box>
                <TextField
                    label="Количество"
                    type="number"
                    value={count}
                    onChange={e => setCount(Number(e.target.value))}
                    size="small"
                    sx={{ width: isMobile ? '100%' : 100 }}
                    helperText="Собак одной породы"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Tooltip title="Сколько у вас собак этой породы. Пример: две немецкие овчарки — укажите 2." arrow>
                                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help' }}>?</Typography>
                                </Tooltip>
                            ),
                        },
                    }}
                />
                <TextField
                    label="Кварталов"
                    type="number"
                    value={quarters}
                    onChange={e => setQuarters(Math.min(4, Math.max(1, Number(e.target.value))))}
                    size="small"
                    sx={{ width: isMobile ? '100%' : 100 }}
                    helperText="1–4"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Tooltip title="Сколько кварталов вы владеете собакой в течение года. Если весь год — 4 квартала. Пример: завели собаку в апреле — налог за 3 квартала." arrow>
                                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help' }}>?</Typography>
                                </Tooltip>
                            ),
                        },
                    }}
                />
                <Button variant="outlined" onClick={addDog} fullWidth={isMobile}>
                    + Добавить собаку
                </Button>
            </Box>

            {dogs.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dangerousDogs.length > 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} color="error">
                                    Опасные породы
                                </Typography>
                                <Chip label={`${dangerousDogs.length} шт.`} size="small" sx={{ bgcolor: '#ffebee', fontWeight: 'medium' }} />
                                {dangerousTax > 0 && (
                                    <Chip label={`Налог: ${dangerousTax.toFixed(2)} руб.`} size="small" color="error" variant="outlined" />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {dangerousDogs.map((dog, i) => renderDogCard(dog, i))}
                            </Box>
                        </Box>
                    )}

                    {safeDogs.length > 0 && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} color="success.main">
                                    Неопасные породы
                                </Typography>
                                <Chip label={`${safeDogs.length} шт.`} size="small" sx={{ bgcolor: '#e8f5e9', fontWeight: 'medium' }} />
                                {safeTax > 0 && (
                                    <Chip label={`Налог: ${safeTax.toFixed(2)} руб.`} size="small" color="success" variant="outlined" />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {safeDogs.map((dog, i) => renderDogCard(dog, i))}
                            </Box>
                        </Box>
                    )}
                </Box>
            )}

            {dogs.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" onClick={calculateAll} disabled={loading} fullWidth={isMobile}>
                        {loading ? 'Загрузка...' : 'Рассчитать налог на собак'}
                    </Button>
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>Расчёт выполнен успешно</Alert>}
        </Box>
    );
};

export default PetsStep;