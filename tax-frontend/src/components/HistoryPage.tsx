// src/components/HistoryPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Collapse,
    Card,
    CardContent,
    Skeleton,
    Snackbar,
    Divider,
    Pagination,
    useTheme,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HistoryIcon from '@mui/icons-material/History';
import LoginIcon from '@mui/icons-material/Login';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Header from './Header';
import Footer from './Footer';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

interface HistoryItem {
    id: number;
    name: string;
    category: string;
    tax: number;
    created_at: string;
}

interface HistoryDetail {
    id: number;
    name: string;
    category: string;
    tax: number;
    details_json?: string;
    created_at: string;
}

interface DetailRow {
    name: string;
    amount: number;
    category?: string;
}

const ITEMS_PER_PAGE = 6;

const categoryLabels: Record<string, string> = {
    income: 'Подоходный налог / удержания',
    property: 'Имущественные налоги',
    investment: 'Инвестиционные налоги',
    other: 'Прочие налоги',
    mixed: 'Смешанный расчёт',
};

const getReadableCategory = (category: string): string => {
    return categoryLabels[category] || category;
};

const generatePDF = async (detail: HistoryDetail) => {
    const { name, category, tax, details_json, created_at } = detail;
    const readableCategory = getReadableCategory(category);

    let detailsRows: any[] = [];
    let depositRows: any[] = [];
    if (details_json) {
        try {
            const parsed = JSON.parse(details_json);
            if (Array.isArray(parsed)) {
                detailsRows = parsed.map((item: any) => [
                    item.name || 'Без названия',
                    getReadableCategory(item.category || ''),
                    item.tax != null ? `${item.tax.toFixed(2)} руб.` : '—',
                ]);
                const depositItem = parsed.find((i: any) => i.name === 'Налог на вклад');
                if (depositItem?.details?.deposits_details) {
                    depositRows = depositItem.details.deposits_details.map((d: any, i: number) => [
                        `Вклад №${i + 1}`,
                        `${d.currency}`,
                        `${d.amount?.toFixed(2)} ${d.currency}`,
                        `${d.annual_rate_percent}%`,
                        `${d.term_days} дн.`,
                        `${d.interest_income?.toFixed(2)} руб.`,
                        `${d.tax?.toFixed(2)} руб.`,
                    ]);
                }
            }
        } catch (e) {
            // не JSON – просто строка
        }
    }

    const craftItem = Array.isArray(JSON.parse(details_json || '[]')) 
        ? JSON.parse(details_json || '[]').find((i: any) => i.name === 'Ремесленный сбор')
        : null;
    const incomeItem = Array.isArray(JSON.parse(details_json || '[]')) 
        ? JSON.parse(details_json || '[]').find((i: any) => i.name === 'Подоходный налог')
        : null;
    const medicalDeduction = incomeItem?.details?.medical_deduction || 0;
    const alimonyDeduction = incomeItem?.details?.alimony_deduction || 0;
    const charityDeduction = incomeItem?.details?.charity_deduction || 0;
    const agroItem = Array.isArray(JSON.parse(details_json || '[]')) 
        ? JSON.parse(details_json || '[]').find((i: any) => i.name === 'Сбор за агроэкотуризм')
        : null;
    const ipTaxItem = Array.isArray(JSON.parse(details_json || '[]')) 
        ? JSON.parse(details_json || '[]').find((i: any) => i.name === 'Единый налог (ИП)')
        : null;

    const docDefinition: any = {
        content: [
            { text: 'Детали расчёта', style: 'header' },
            { text: `Название: ${name || 'Общий расчёт'}`, margin: [0, 10, 0, 5] },
            { text: `Категория: ${readableCategory}`, margin: [0, 5, 0, 5] },
            { text: `Общая сумма налога: ${tax != null ? tax.toFixed(2) + ' руб.' : '—'}`, margin: [0, 5, 0, 5] },
            { text: `Дата: ${new Date(created_at).toLocaleString('ru-RU')}`, margin: [0, 5, 0, 10] },
        ],
        styles: {
            header: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        },
    };

    if (detailsRows.length > 0) {
        docDefinition.content.push({ text: 'Состав расчёта:', style: 'subheader', margin: [0, 10, 0, 5] });
        docDefinition.content.push({
            table: {
                headerRows: 1,
                widths: ['*', '*', '*'],
                body: [
                    ['Налог', 'Категория', 'Сумма'],
                    ...detailsRows,
                ],
            },
            layout: 'lightHorizontalLines',
        });
        docDefinition.styles.subheader = { fontSize: 12, bold: true };
    } else if (details_json) {
        docDefinition.content.push({ text: 'Детали:', style: 'subheader', margin: [0, 10, 0, 5] });
        docDefinition.content.push({ text: details_json });
    }

    if (depositRows.length > 0) {
        docDefinition.content.push({ text: 'Детализация по вкладам:', style: 'subheader', margin: [0, 10, 0, 5] });
        docDefinition.content.push({
            table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: [
                    ['Вклад', 'Валюта', 'Сумма', 'Ставка', 'Срок', 'Доход', 'Налог'],
                    ...depositRows,
                ],
            },
            layout: 'lightHorizontalLines',
        });
    }

    if (medicalDeduction > 0) {
        docDefinition.content.push({ text: ' ', margin: [0, 5] });
        docDefinition.content.push({ text: 'Вычет на лечение и лекарства:', style: 'subheader' });
        docDefinition.content.push({ text: `Сумма вычета: ${medicalDeduction.toFixed(2)} руб.` });
        docDefinition.content.push({ text: 'Вычет предоставлен в пределах 50% от суммы налога (ст. 210 НК РБ).' });
    }

    if (alimonyDeduction > 0) {
        docDefinition.content.push({ text: ' ', margin: [0, 5] });
        docDefinition.content.push({ text: 'Вычет на уплаченные алименты:', style: 'subheader' });
        docDefinition.content.push({ text: `Сумма вычета: ${alimonyDeduction.toFixed(2)} руб.` });
        docDefinition.content.push({ text: 'Вычет предоставлен в пределах 50% от суммы налога (ст. 210 НК РБ).' });
    }

    if (charityDeduction > 0) {
        docDefinition.content.push({ text: ' ', margin: [0, 5] });
        docDefinition.content.push({ text: 'Вычет на благотворительность:', style: 'subheader' });
        docDefinition.content.push({ text: `Сумма вычета: ${charityDeduction.toFixed(2)} руб.` });
        docDefinition.content.push({ text: 'Вычет предоставлен в пределах 50% от суммы налога (ст. 210 НК РБ).' });
    }

    if (craftItem) {
        docDefinition.content.push({ text: ' ', margin: [0, 5] });
        docDefinition.content.push({ text: 'Ремесленный сбор:', style: 'subheader' });
        docDefinition.content.push({ text: `Статус: ${craftItem.details?.is_craftsman ? 'Ремесленник' : 'Не ремесленник'}` });
        docDefinition.content.push({ text: `Ставка: 1 БВ (42 руб.)` });
        docDefinition.content.push({ text: `Сумма: ${craftItem.tax.toFixed(2)} руб.` });
    }
    if (agroItem) {
        docDefinition.content.push({ text: ' ', margin: [0, 5] });
        docDefinition.content.push({ text: 'Сбор за агроэкотуризм:', style: 'subheader' });
        docDefinition.content.push({ text: `Статус: ${agroItem.details?.is_agro_owner ? 'Владелец агроусадьбы' : 'Не владелец агроусадьбы'}` });
        docDefinition.content.push({ text: `Ставка: 1 БВ (42 руб.)` });
        docDefinition.content.push({ text: `Сумма: ${agroItem.tax.toFixed(2)} руб.` });
    }
    if (ipTaxItem) {
        docDefinition.content.push({ text: ' ', margin: [0, 5] });
        docDefinition.content.push({ text: 'Единый налог (ИП):', style: 'subheader' });
        const ipDetails = ipTaxItem.details || {};
        docDefinition.content.push({ text: `Вид деятельности: ${ipDetails.activity_type || '—'}` });
        docDefinition.content.push({ text: `Тип населённого пункта: ${ipDetails.city_type || '—'}` });
        docDefinition.content.push({ text: `Месячная ставка: ${ipDetails.applied_rate || '—'} руб.` });
        if (ipDetails.is_preferential) {
            docDefinition.content.push({ text: `Льгота 25%: Применена` });
        }
        docDefinition.content.push({ text: `Сумма: ${ipTaxItem.tax.toFixed(2)} руб.` });
    }

    pdfMake.createPdf(docDefinition).download(`Расчёт_${name || 'история'}_${detail.id}.pdf`);
};

const generateExcel = (detail: HistoryDetail) => {
    const { name, category, tax, details_json, created_at } = detail;
    const readableCategory = getReadableCategory(category);

    const workbook = XLSX.utils.book_new();
    const sheetData: any[] = [
        ['Название', name || 'Общий расчёт'],
        ['Категория', readableCategory],
        ['Сумма налога', tax != null ? tax.toFixed(2) + ' руб.' : '—'],
        ['Дата', new Date(created_at).toLocaleString('ru-RU')],
        [],
    ];

    if (details_json) {
        try {
            const parsed = JSON.parse(details_json);
            if (Array.isArray(parsed)) {
                sheetData.push(['Налог', 'Категория', 'Сумма']);
                parsed.forEach((item: any) => {
                    sheetData.push([
                        item.name || '',
                        getReadableCategory(item.category || ''),
                        item.tax != null ? item.tax.toFixed(2) : '—',
                    ]);
                });
                const depositItem = parsed.find((i: any) => i.name === 'Налог на вклад');
                if (depositItem?.details?.deposits_details) {
                    sheetData.push([]);
                    sheetData.push(['Детализация по вкладам']);
                    sheetData.push(['Вклад', 'Валюта', 'Сумма', 'Ставка', 'Срок', 'Доход', 'Налог']);
                    depositItem.details.deposits_details.forEach((d: any, i: number) => {
                        sheetData.push([
                            `Вклад №${i + 1}`,
                            d.currency,
                            `${d.amount?.toFixed(2)} ${d.currency}`,
                            `${d.annual_rate_percent}%`,
                            `${d.term_days} дн.`,
                            `${d.interest_income?.toFixed(2)} руб.`,
                            `${d.tax?.toFixed(2)} руб.`,
                        ]);
                    });
                    sheetData.push([]);
                    sheetData.push(['Общий доход', depositItem.details.total_interest?.toFixed(2)]);
                    sheetData.push(['Общий налог', depositItem.details.total_tax?.toFixed(2)]);
                }
            } else {
                sheetData.push(['Детали', details_json]);
            }
        } catch (e) {
            sheetData.push(['Детали', details_json]);
        }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Расчёт');
    XLSX.writeFile(workbook, `Расчёт_${name || 'история'}_${detail.id}.xlsx`);
};

const parseDetails = (details_json?: string): DetailRow[] => {
    if (!details_json) return [];
    try {
        const parsed = JSON.parse(details_json);
        if (Array.isArray(parsed)) {
            return parsed.map((item: any) => ({
                name: item.name || 'Без названия',
                amount: item.tax != null ? item.tax : 0,
                category: getReadableCategory(item.category || ''),
            }));
        }
    } catch { /* ignore */ }
    return [];
};

const HistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isAuthLoading, isAuthDialogOpen, openAuthDialog } = useAuth();
    // openAuthDialog is used
    const theme = useTheme();
    const dialogWasOpened = useRef(false);

    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Detail state (inline collapse)
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [detailsMap, setDetailsMap] = useState<Record<number, HistoryDetail>>({});
    const [detailsLoading, setDetailsLoading] = useState<Set<number>>(new Set());

    // Delete state
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const loadHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/history', {
                params: { page, limit: ITEMS_PER_PAGE },
            });
            setHistory(res.data.items);
            setTotal(res.data.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Не удалось загрузить историю');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated) {
            openAuthDialog();
            dialogWasOpened.current = true;
        } else {
            loadHistory();
        }
    }, [isAuthenticated, isAuthLoading, openAuthDialog, loadHistory]);

    useEffect(() => {
        if (dialogWasOpened.current && !isAuthDialogOpen && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthDialogOpen, isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated && !isAuthLoading) {
            loadHistory();
        }
    }, [isAuthenticated, isAuthLoading, loadHistory]);

    const loadDetail = useCallback(async (id: number) => {
        if (detailsMap[id]) return; // already loaded
        setDetailsLoading(prev => new Set(prev).add(id));
        try {
            const res = await api.get(`/history/${id}`);
            setDetailsMap(prev => ({ ...prev, [id]: res.data }));
        } catch (err: any) {
            setSnackbar({ open: true, message: 'Ошибка загрузки деталей', severity: 'error' });
        } finally {
            setDetailsLoading(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }, [detailsMap]);

    const handleToggleExpand = async (id: number) => {
        if (expandedIds.has(id)) {
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } else {
            await loadDetail(id);
            setExpandedIds(prev => new Set(prev).add(id));
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingIds(prev => new Set(prev).add(id));
        try {
            await api.delete(`/history/${id}`);
            // Remove from local state
            setHistory(prev => prev.filter(item => item.id !== id));
            setTotal(prev => prev - 1);
            setDetailsMap(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            setSnackbar({ open: true, message: 'Расчёт удалён', severity: 'success' });
        } catch (err: any) {
            setSnackbar({ open: true, message: 'Ошибка при удалении', severity: 'error' });
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        setExpandedIds(new Set());
        setDetailsMap({});
    };

    const handleExportPDF = async (item: HistoryItem) => {
        try {
            const res = await api.get(`/history/${item.id}`);
            generatePDF(res.data);
        } catch (e) {
            setSnackbar({ open: true, message: 'Ошибка экспорта PDF', severity: 'error' });
        }
    };

    const handleExportXLSX = async (item: HistoryItem) => {
        try {
            const res = await api.get(`/history/${item.id}`);
            generateExcel(res.data);
        } catch (e) {
            setSnackbar({ open: true, message: 'Ошибка экспорта Excel', severity: 'error' });
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const cardBg = theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF';
    const borderColor = theme.palette.mode === 'dark' ? 'divider' : '#E0E0E0';

    // Skeleton cards
    const renderSkeletons = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} sx={{ bgcolor: cardBg, borderRadius: '16px', border: '1px solid', borderColor }}>
                    <CardContent>
                        <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={22} />
                        <Skeleton variant="text" width="30%" height={18} sx={{ mt: 0.5 }} />
                    </CardContent>
                </Card>
            ))}
        </Box>
    );

    // Not authenticated
    if (!isAuthenticated && !isAuthLoading) {
        return (
            <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
                    <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
                        <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: 'rgba(20,184,166,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                            <HistoryIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                            История расчётов
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                            Войдите, чтобы сохранять и просматривать расчёты
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<LoginIcon />}
                            onClick={openAuthDialog}
                            sx={{ px: 4, py: 1.2, borderRadius: '12px', fontWeight: 700, color: '#000', bgcolor: 'primary.main', '&:hover': { bgcolor: '#0FA89A' } }}
                        >
                            Войти
                        </Button>
                    </Box>
                </Box>
                <Footer />
            </Box>
        );
    }

    // Auth loading
    if (isAuthLoading) {
        return (
            <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC', minHeight: '100vh' }}>
                <Header />
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                    <CircularProgress color="primary" />
                </Box>
                <Footer />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <Box sx={{ flex: 1 }}>
                <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
                    {/* Заголовок */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: { xs: 3, md: 4 } }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                                История расчётов
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                {total > 0
                                    ? `Всего сохранённых расчётов: ${total}`
                                    : 'Нет сохранённых расчётов'}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={() => navigate('/calculator')}
                            sx={{
                                bgcolor: 'primary.main', color: '#000', fontWeight: 700,
                                borderRadius: '12px', px: 3, py: 1.2,
                                '&:hover': { bgcolor: '#0FA89A' },
                                fontSize: { xs: '0.85rem', md: '0.95rem' },
                            }}
                        >
                            Новый расчёт
                        </Button>
                    </Box>

                    {/* Ошибка */}
                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 3, borderRadius: '12px' }}
                            action={
                                <Button size="small" onClick={loadHistory} sx={{ color: 'inherit', fontWeight: 700 }}>
                                    Повторить
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Загрузка */}
                    {loading && renderSkeletons()}

                    {/* Пустое состояние */}
                    {!loading && !error && history.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 } }}>
                            <Box sx={{ width: 72, height: 72, borderRadius: '20px', bgcolor: 'rgba(20,184,166,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                                <HistoryIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                                Ни одного сохранённого расчёта
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.6 }}>
                                Выполните расчёт налогов и сохраните его, чтобы он появился здесь
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<CalculateIcon />}
                                onClick={() => navigate('/calculator')}
                                sx={{ px: 4, py: 1.2, borderRadius: '12px', fontWeight: 700, color: '#000', bgcolor: 'primary.main', '&:hover': { bgcolor: '#0FA89A' } }}
                            >
                                Начать расчёт
                            </Button>
                        </Box>
                    )}

                    {/* Список карточек */}
                    {!loading && !error && history.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {history.map((item) => {
                                const isExpanded = expandedIds.has(item.id);
                                const detail = detailsMap[item.id];
                                const detailsRows = detail ? parseDetails(detail.details_json) : [];
                                const isDeleting = deletingIds.has(item.id);
                                const isDetailLoading = detailsLoading.has(item.id);

                                return (
                                    <Card
                                        key={item.id}
                                        sx={{
                                            bgcolor: cardBg,
                                            borderRadius: '16px',
                                            border: '1px solid',
                                            borderColor,
                                            transition: 'all 0.25s ease',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                boxShadow: '0 8px 20px rgba(20,184,166,0.15)',
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
                                            {/* Верхняя строка: название + кнопки */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                                                    {item.name || 'Налоговый расчёт'}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0, ml: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleExportPDF(item)}
                                                        sx={{ color: '#6c7c9d', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}
                                                    >
                                                        <PictureAsPdfIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleExportXLSX(item)}
                                                        sx={{ color: '#6c7c9d', '&:hover': { color: '#22C55E', bgcolor: 'rgba(34,197,94,0.08)' } }}
                                                    >
                                                        <TableViewIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={isDeleting}
                                                        sx={{ color: '#6c7c9d', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}
                                                    >
                                                        {isDeleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleExpand(item.id)}
                                                        sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(20,184,166,0.08)' } }}
                                                    >
                                                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                    </IconButton>
                                                </Box>
                                            </Box>

                                            {/* Строка с суммой и датой */}
                                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1rem', md: '1.1rem' } }}>
                                                    {item.tax?.toFixed(2)} руб.
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </Typography>
                                            </Box>
                                        </CardContent>

                                        {/* Раскрывающаяся детализация */}
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <Divider sx={{ borderColor }} />
                                            <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 } }}>
                                                {isDetailLoading ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                                                        <CircularProgress size={16} />
                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Загрузка деталей...</Typography>
                                                    </Box>
                                                ) : detailsRows.length > 0 ? (
                                                    <>
                                                        {detailsRows.map((row, idx) => (
                                                            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
                                                                <Typography variant="body2" sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                                                                    {row.name}
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                                                                    {row.amount.toFixed(2)} руб.
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                        <Divider sx={{ my: 1, borderColor }} />
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                                Итого
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.95rem' }}>
                                                                {detail?.tax?.toFixed(2)} руб.
                                                            </Typography>
                                                        </Box>
                                                    </>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                        Детализация недоступна
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Card>
                                );
                            })}
                        </Box>
                    )}

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                sx={{
                                    '& .MuiPaginationItem-root': { color: 'text.secondary' },
                                    '& .Mui-selected': { bgcolor: 'primary.main', color: '#000', fontWeight: 700 },
                                }}
                            />
                        </Box>
                    )}
                </Container>
            </Box>

            <Footer />

            {/* Snackbar для уведомлений */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    sx={{ borderRadius: '12px', fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default HistoryPage;