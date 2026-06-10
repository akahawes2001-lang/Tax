// src/components/AdminPage.tsx
import React, { useEffect, useState } from 'react';
import {
    Box, Container, Typography, Paper, Button, Chip,
    Alert, Grid, Rating, IconButton, Divider, Skeleton, Snackbar,
    useTheme, Card, CardContent
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import RateReviewIcon from '@mui/icons-material/RateReview';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Review {
    id: number;
    user_id: number;
    text: string;
    rating: number;
    author_name?: string;
    approved: boolean;
    created_at: string;
}

interface AdminStats {
    pending_reviews: number;
    approved_reviews: number;
    total_calculations: number;
    total_tax: number;
}

interface RecentCalc {
    id: number;
    name: string;
    tax: number;
    created_at: string;
}

const AdminPage: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success',
    });

    const [stats, setStats] = useState<AdminStats>({
        pending_reviews: 0,
        approved_reviews: 0,
        total_calculations: 0,
        total_tax: 0,
    });

    const [recentCalcs, setRecentCalcs] = useState<RecentCalc[]>([]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Stats error:', err);
        }
    };

    const fetchRecentCalculations = async () => {
        try {
            const res = await api.get('/history', { params: { page: 1, limit: 10 } });
            setRecentCalcs(res.data.items || []);
        } catch (err) {
            console.error('Recent calc error:', err);
        }
    };

    const fetchReviews = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/admin/reviews');
            setReviews(res.data);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate('/');
            }
            setError(err.response?.data?.detail || 'Ошибка загрузки отзывов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/?login=required');
            return;
        }
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchStats();
        fetchReviews();
        fetchRecentCalculations();
    }, [isAuthenticated, user]);

    const handleToggleApprove = async (id: number) => {
        try {
            await api.put(`/admin/reviews/${id}/approve`);
            setReviews(prev =>
                prev.map(r => (r.id === id ? { ...r, approved: !r.approved } : r))
            );
            fetchStats();
            setSnackbar({ open: true, message: 'Статус отзыва обновлён', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Ошибка при обновлении', severity: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить отзыв навсегда?')) return;
        try {
            await api.delete(`/admin/reviews/${id}`);
            setReviews(prev => prev.filter(r => r.id !== id));
            fetchStats();
            setSnackbar({ open: true, message: 'Отзыв удалён', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Ошибка при удалении', severity: 'error' });
        }
    };

    const bgColor = theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC';
    const cardBg = theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF';
    const borderColor = theme.palette.mode === 'dark' ? 'divider' : '#E0E0E0';

    // Not authenticated / not admin
    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    const pendingReviews = reviews.filter(r => !r.approved);
    const approvedReviews = reviews.filter(r => r.approved);

    return (
        <Box sx={{ bgcolor: bgColor, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <Box sx={{ flex: 1 }}>
                <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
                    {/* Заголовок */}
                    <Box sx={{ mb: { xs: 3, md: 4 } }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                            Панель администратора
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Управление отзывами и статистика
                        </Typography>
                    </Box>

                    {/* Блок статистики — 4 карточки */}
                    <Grid container spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
                        {[
                            { value: stats.pending_reviews, label: 'На модерации', accent: stats.pending_reviews > 0, color: '#F59E0B' },
                            { value: stats.approved_reviews, label: 'Опубликованных отзывов', accent: false, color: '#14B8A6' },
                            { value: stats.total_calculations, label: 'Расчётов всего', accent: false, color: '#14B8A6' },
                            { value: `${stats.total_tax.toFixed(0)} руб.`, label: 'Рассчитано налогов', accent: false, color: '#14B8A6' },
                        ].map((item, idx) => (
                            <Grid size={{ xs: 6, sm: 3 }} key={idx}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        bgcolor: cardBg,
                                        borderRadius: '16px',
                                        borderColor: item.accent ? '#F59E0B' : borderColor,
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            boxShadow: '0 4px 12px rgba(20,184,166,0.15)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ py: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: item.color, fontSize: { xs: '1.4rem', md: '1.8rem' } }}>
                                            {item.value}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                            {item.label}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Отзывы на модерации */}
                    <Paper
                        variant="outlined"
                        sx={{ bgcolor: cardBg, borderRadius: '16px', borderColor, mb: { xs: 2, md: 3 }, overflow: 'hidden' }}
                    >
                        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RateReviewIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                                    Отзывы на модерации
                                </Typography>
                            </Box>
                            <Chip
                                label={pendingReviews.length}
                                size="small"
                                color={pendingReviews.length > 0 ? 'warning' : 'default'}
                                sx={{ fontWeight: 700, minWidth: 32 }}
                            />
                        </Box>

                        {loading ? (
                            <Box sx={{ p: { xs: 2, md: 3 } }}>
                                <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                                <Skeleton variant="text" width="60%" height={20} />
                                <Skeleton variant="text" width="90%" height={20} sx={{ mt: 1 }} />
                            </Box>
                        ) : pendingReviews.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: { xs: 4, md: 5 } }}>
                                <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: 'rgba(20,184,166,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                                    <CheckIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Все отзывы обработаны
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
                                {pendingReviews.map((review, idx) => (
                                    <Box key={review.id}>
                                        {idx > 0 && <Divider sx={{ my: 1.5, borderColor }} />}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.5 }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                        {review.author_name || `Пользователь #${review.user_id}`}
                                                    </Typography>
                                                    <Rating value={review.rating} readOnly size="small" sx={{ color: '#FFC107' }} />
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5, wordBreak: 'break-word' }}>
                                                    {review.text}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
                                                    {new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<CheckIcon />}
                                                    onClick={() => handleToggleApprove(review.id)}
                                                    sx={{
                                                        bgcolor: '#10B981', color: '#fff', fontWeight: 700,
                                                        borderRadius: '8px', fontSize: '0.75rem', minWidth: 90,
                                                        '&:hover': { bgcolor: '#059669' },
                                                    }}
                                                >
                                                    Принять
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<CloseIcon />}
                                                    onClick={() => handleDelete(review.id)}
                                                    sx={{
                                                        color: '#EF4444', borderColor: '#EF4444', fontWeight: 600,
                                                        borderRadius: '8px', fontSize: '0.75rem', minWidth: 90,
                                                        '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(239,68,68,0.08)' },
                                                    }}
                                                >
                                                    Отклонить
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* Опубликованные отзывы */}
                    <Paper
                        variant="outlined"
                        sx={{ bgcolor: cardBg, borderRadius: '16px', borderColor, mb: { xs: 2, md: 3 }, overflow: 'hidden' }}
                    >
                        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StarIcon sx={{ color: '#FFC107', fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                                    Опубликованные отзывы
                                </Typography>
                            </Box>
                            <Chip label={approvedReviews.length} size="small" sx={{ fontWeight: 700, minWidth: 32 }} />
                        </Box>

                        {loading ? (
                            <Box sx={{ p: { xs: 2, md: 3 } }}>
                                <Skeleton variant="text" width="80%" height={24} />
                            </Box>
                        ) : approvedReviews.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: { xs: 3, md: 4 } }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    Нет опубликованных отзывов
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
                                {approvedReviews.map((review, idx) => (
                                    <Box key={review.id}>
                                        {idx > 0 && <Divider sx={{ my: 1, borderColor }} />}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                        {review.author_name || `Пользователь #${review.user_id}`}
                                                    </Typography>
                                                    <Rating value={review.rating} readOnly size="small" sx={{ color: '#FFC107' }} />
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {review.text}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(review.id)}
                                                sx={{ color: '#6c7c9d', mt: 0.5, '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* Последние расчёты */}
                    <Paper
                        variant="outlined"
                        sx={{ bgcolor: cardBg, borderRadius: '16px', borderColor, overflow: 'hidden' }}
                    >
                        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor }}>
                            <BarChartIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                                Последние расчёты
                            </Typography>
                        </Box>
                        <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
                            {recentCalcs.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Расчёты пока не выполнялись
                                    </Typography>
                                </Box>
                            ) : (
                                recentCalcs.map((calc, idx) => (
                                    <Box key={calc.id}>
                                        {idx > 0 && <Divider sx={{ borderColor }} />}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                                                    {calc.name || 'Расчёт'}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                                    {new Date(calc.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', flexShrink: 0, ml: 1 }}>
                                                {calc.tax?.toFixed(2)} руб.
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Container>
            </Box>

            <Footer />

            {/* Snackbar */}
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

export default AdminPage;