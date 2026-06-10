// src/components/PropertyStep.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Alert, useMediaQuery, useTheme,
    Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox,
    IconButton, Tooltip, Paper, Chip, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import GarageIcon from '@mui/icons-material/Garage';
import LandscapeIcon from '@mui/icons-material/Landscape';
import { useTaxContext } from '../context/TaxContext';
import { calculatePropertyTax } from '../api';

interface PropertyEntry {
    cadastral_value: number;
    property_type: string;
    region: string;
    is_pensioner: boolean;
    is_large_family: boolean;
    is_disabled: boolean;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
    apartment: 'Квартира',
    house: 'Дом',
    garage: 'Гараж',
    outbuilding: 'Хозпостройка',
    land: 'Земельный участок',
};

const PROPERTY_TYPE_ORDER = ['apartment', 'house', 'garage', 'outbuilding', 'land'];

const REGIONS = [
    'Минск',
    'Минская',
    'Брестская',
    'Витебская',
    'Гомельская',
    'Гродненская',
    'Могилёвская',
];

const PropertyStep: React.FC = () => {
    const [properties, setProperties] = useState<PropertyEntry[]>([]);
    const [cadastralValue, setCadastralValue] = useState<string>('');
    const [propertyType, setPropertyType] = useState<string>('apartment');
    const [region, setRegion] = useState<string>('Минск');
    const [isPensioner, setIsPensioner] = useState(false);
    const [isLargeFamily, setIsLargeFamily] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [calculatedTax, setCalculatedTax] = useState<number | null>(null);
    const [groupTaxes, setGroupTaxes] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);

    const { updateCurrentTax } = useTaxContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const previousKeyRef = useRef('');

    const addProperty = () => {
        const value = parseFloat(cadastralValue);
        if (!cadastralValue || isNaN(value) || value <= 0) {
            setError('Укажите корректную кадастровую стоимость');
            return;
        }

        const newProperty: PropertyEntry = {
            cadastral_value: value,
            property_type: propertyType,
            region,
            is_pensioner: isPensioner,
            is_large_family: isLargeFamily,
            is_disabled: isDisabled,
        };

        setProperties([...properties, newProperty]);
        setCadastralValue('');
        setPropertyType('apartment');
        setRegion('Минск');
        setIsPensioner(false);
        setIsLargeFamily(false);
        setIsDisabled(false);
        setError(null);
    };

    const removeProperty = (index: number) => {
        setProperties(properties.filter((_, i) => i !== index));
    };

    const updateTax = useCallback(async (propsList: PropertyEntry[]) => {
        if (propsList.length === 0) {
            setCalculatedTax(null);
            setGroupTaxes({});
            updateCurrentTax({ name: 'Налог на недвижимость', category: 'property', tax: 0 });
            return;
        }

        const key = JSON.stringify(propsList);
        if (key === previousKeyRef.current) return;
        previousKeyRef.current = key;

        try {
            let totalTax = 0;
            const taxes: Record<string, number> = {};
            for (const prop of propsList) {
                const res = await calculatePropertyTax({
                    cadastral_value: prop.cadastral_value,
                    property_type: prop.property_type,
                    region: prop.region,
                    is_pensioner: prop.is_pensioner,
                    is_large_family: prop.is_large_family,
                    is_disabled: prop.is_disabled,
                });
                const tax = res.data.calculated_tax;
                totalTax += tax;
                const groupKey = prop.property_type;
                taxes[groupKey] = (taxes[groupKey] || 0) + tax;
            }
            setCalculatedTax(totalTax);
            setGroupTaxes(taxes);
            updateCurrentTax({ name: 'Налог на недвижимость', category: 'property', tax: totalTax, details: propsList });
        } catch {
            setCalculatedTax(null);
        }
    }, [updateCurrentTax]);

    useEffect(() => {
        updateTax(properties);
    }, [properties, updateTax]);

    const groupedProperties = useMemo(() => {
        const groups: Record<string, PropertyEntry[]> = {};
        PROPERTY_TYPE_ORDER.forEach(type => {
            const groupProps = properties.filter(p => p.property_type === type);
            if (groupProps.length > 0) groups[type] = groupProps;
        });
        return groups;
    }, [properties]);

    const getPropertyIcon = (type: string) => {
        switch (type) {
            case 'garage':
                return <GarageIcon />;
            case 'land':
                return <LandscapeIcon />;
            default:
                return <HomeIcon />;
        }
    };

    const hasBenefits = isPensioner || isLargeFamily || isDisabled;

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">Налог на недвижимость и землю</Typography>
                <Tooltip title="Добавьте объекты недвижимости. Для жилья (квартира, дом) ставка 0.1%, для гаража и хозпостройки — до 1.2%, для земли — 0.1%. Пенсионеры, многодетные и инвалиды освобождены от налога." arrow>
                    <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 2, mt: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 180 }} data-testid="property-type-select">
                        <InputLabel>Тип объекта</InputLabel>
                        <Select value={propertyType} label="Тип объекта" onChange={e => setPropertyType(e.target.value)}>
                            <MenuItem value="apartment">Квартира</MenuItem>
                            <MenuItem value="house">Дом</MenuItem>
                            <MenuItem value="garage">Гараж</MenuItem>
                            <MenuItem value="outbuilding">Хозпостройка</MenuItem>
                            <MenuItem value="land">Земельный участок</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title="Выберите тип объекта недвижимости. Ставка налога зависит от типа: квартира/дом — 0.1%, гараж/хозпостройка — 1.2%, земля — 0.1%." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        label="Кадастровая стоимость (руб.)"
                        type="number"
                        value={cadastralValue}
                        onChange={e => setCadastralValue(e.target.value)}
                        size="small"
                        fullWidth={isMobile}
                        helperText="Укажите кадастровую стоимость из документов"
                        slotProps={{ htmlInput: { 'data-testid': 'property-cadastral-input' } }}
                    />
                    <Tooltip title="Кадастровая стоимость указана в выписке из кадастра или в документах на недвижимость. Налог рассчитывается как процент от этой стоимости." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }} data-testid="property-region-select">
                        <InputLabel>Регион</InputLabel>
                        <Select value={region} label="Регион" onChange={e => setRegion(e.target.value)}>
                            {REGIONS.map(r => (
                                <MenuItem key={r} value={r}>{r}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="Регион влияет на коэффициент налога. Например, Минск — 1.0, Могилёвская область — 0.7." arrow>
                        <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', cursor: 'help', ml: 0.5 }}>?</Typography>
                    </Tooltip>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <FormControlLabel
                        control={<Checkbox checked={isPensioner} onChange={e => setIsPensioner(e.target.checked)} size="small" />}
                        label="Пенсионер"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={isLargeFamily} onChange={e => setIsLargeFamily(e.target.checked)} size="small" />}
                        label="Многодетный"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={isDisabled} onChange={e => setIsDisabled(e.target.checked)} size="small" />}
                        label="Инвалид"
                    />
                </Box>

                <Button variant="outlined" onClick={addProperty} fullWidth={isMobile} data-testid="property-add-button">Добавить</Button>
            </Box>

            {hasBenefits && (
                <Alert severity="info" sx={{ mt: 1 }}>
                    Вы указали льготную категорию. Налог на недвижимость будет полностью освобождён.
                </Alert>
            )}

            {Object.keys(groupedProperties).length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(groupedProperties).map(([type, groupProps]) => (
                        <Box key={type}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {PROPERTY_TYPE_LABELS[type] || type}
                                </Typography>
                                <Chip label={`${groupProps.length} шт.`} size="small" sx={{ bgcolor: 'grey.200', fontWeight: 'medium' }} />
                                {groupTaxes[type] !== undefined && groupTaxes[type] > 0 && (
                                    <Chip label={`Налог: ${groupTaxes[type].toFixed(2)} руб.`} size="small" color="primary" variant="outlined" />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {groupProps.map((prop, i) => (
                                    <Paper key={i} elevation={1} sx={{
                                        p: 2,
                                        borderLeft: `4px solid ${prop.is_pensioner || prop.is_large_family || prop.is_disabled ? '#4caf50' : '#ff9800'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getPropertyIcon(prop.property_type)}
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                    {PROPERTY_TYPE_LABELS[prop.property_type] || prop.property_type}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Кадастровая стоимость: {prop.cadastral_value.toLocaleString()} руб.
                                                    {' | '}Регион: {prop.region}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {prop.is_pensioner && <Chip label="Пенсионер" size="small" color="success" variant="outlined" />}
                                            {prop.is_large_family && <Chip label="Многодетный" size="small" color="success" variant="outlined" />}
                                            {prop.is_disabled && <Chip label="Инвалид" size="small" color="success" variant="outlined" />}
                                            <IconButton size="small" onClick={() => removeProperty(i)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                    ))}
                </Box>
            )}

            {properties.length > 0 && calculatedTax !== null && (
                <Box sx={{ mt: 2 }}>
                    <Alert severity="success" data-testid="property-total-tax">
                        Общая сумма налога на недвижимость: <strong>{calculatedTax.toFixed(2)} руб.</strong>
                    </Alert>
                </Box>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );
};

export default PropertyStep;
