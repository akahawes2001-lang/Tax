// src/components/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button, Paper, TextField, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton, Rating,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Header from './Header';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import api from '../api';

const USER_PROFILE_KEY = 'taxCalcProfile';

interface ProfileData {
  lastName: string;
  firstName: string;
  middleName: string;
  unp: string;
  avatar: string;
  referralCode: string;
  referrals: number;
  email: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, token, user } = useAuth();
  const theme = useTheme();

  const [profile, setProfile] = useState<ProfileData>({
    lastName: '', firstName: '', middleName: '', unp: '', avatar: '',
    referralCode: '', referrals: 0, email: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stats, setStats] = useState({ calculations: 0, total_tax: 0, reviews: 0 });

  // Состояния для отзыва
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewAuthorName, setReviewAuthorName] = useState('');
  const [reviewAuthorNameError, setReviewAuthorNameError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Загрузка профиля из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setProfile(prev => ({
          ...prev,
          lastName: data.lastName || '',
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          unp: data.unp || '',
          avatar: data.avatar || '',
          referralCode: data.referralCode || '',
          referrals: data.referrals || 0,
          email: data.email || '',
        }));
      }
    } catch { }
  }, []);

  // Загрузка статистики
  const loadStats = () => {
    if (!isAuthenticated || !token) return;
    api.get('/profile/stats')
      .then(res => {
        if (res && res.data) {
          setStats({
            calculations: Number(res.data.calculations) || 0,
            total_tax: Number(res.data.total_tax) || 0,
            reviews: Number(res.data.reviews) || 0,
          });
        }
      })
      .catch((err: Error) => console.error('Stats error:', err));
  };

  useEffect(() => {
    loadStats();
  }, [isAuthenticated, token]);

  const handleProfileSave = () => {
    const existing = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}');
    const updated = { ...existing, ...profile };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile/delete-account');
      logout();
      navigate('/');
    } catch {
      alert('Ошибка при удалении аккаунта');
    }
  };

  // Отправка отзыва
  const handleReviewSubmit = async () => {
    if (!reviewText.trim()) return;
    if (!reviewAuthorName.trim()) {
      setReviewAuthorNameError('Имя обязательно');
      return;
    }
    if (reviewText.trim().length < 10) {
      setReviewError('Минимальная длина отзыва — 10 символов');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    setReviewAuthorNameError('');
    try {
      await api.post('/reviews', { text: reviewText.trim(), rating: reviewRating, author_name: reviewAuthorName.trim() });
      setReviewSuccess(true);
      setReviewText('');
      setReviewRating(5);
      setReviewAuthorName('');
      loadStats();
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      let message = 'Ошибка при отправке отзыва';
      if (err.response?.data) {
        if (Array.isArray(err.response.data.detail)) {
          message = err.response.data.detail
            .map((e: any) => e.msg || JSON.stringify(e))
            .join('; ');
        } else if (err.response.data.detail) {
          message = err.response.data.detail;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        } else {
          message = JSON.stringify(err.response.data);
        }
      }
      setReviewError(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? '#070d1d' : '#FFFFFF';
  const textSecondary = '#6c7c9d';
  const primaryColor = theme.palette.primary.main;

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
      '&:hover fieldset': { borderColor: primaryColor },
      '&.Mui-focused fieldset': { borderColor: primaryColor },
    },
    '& .MuiOutlinedInput-input': {
      color: isDark ? '#E6EEF0' : '#0F1720',
      '&::placeholder': {
        color: textSecondary,
        opacity: 1,
      },
    },
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#030711' : '#F8FAFC', color: 'white' }}>
        <Header />
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.primary">Вы не авторизованы</Typography>
          <Button onClick={() => navigate('/')} sx={{ mt: 2, color: primaryColor }}>Вернуться на главную</Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#030711' : '#F8FAFC', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ flex: 1 }}>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Typography variant="h2" sx={{ fontWeight: 700, textAlign: 'center', mb: 4 }}>
            Профиль
          </Typography>

          {/* Карточки статистики */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
            mb: 3,
          }}>
            {[
              { value: stats.calculations, label: 'Расчётов' },
              { value: stats.total_tax > 0 ? `${stats.total_tax.toFixed(0)} руб.` : '0 руб.', label: 'Налогов рассчитано' },
              { value: stats.reviews, label: 'Отзывов' }
            ].map((item, idx) => (
              <Paper key={idx} sx={{
                p: 3,
                bgcolor: cardBg,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                color: 'white',
                width: { xs: '100%', sm: 'calc(33.333% - 16px)', md: 'calc(33.333% - 16px)' },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 120,
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: primaryColor }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, textTransform: 'capitalize' }}>
                  {item.label}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Карточка личных данных */}
          <Paper sx={{ borderRadius: '16px', bgcolor: cardBg, border: '1px solid', borderColor: 'divider', color: 'white', p: 4, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar src={profile.avatar || undefined} sx={{ width: 64, height: 64, border: '3px solid', borderColor: primaryColor }}>
                <PersonIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {profile.firstName || profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'Пользователь'}
                </Typography>
                <IconButton component="label" size="small" sx={{ color: primaryColor }}>
                  <EditIcon fontSize="small" />
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setProfile(prev => ({ ...prev, avatar: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }} />
                </IconButton>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
              Личные данные
            </Typography>

            {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>Данные сохранены</Alert>}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" sx={{ color: textSecondary, mb: 0.5 }}>Фамилия</Typography>
                <TextField fullWidth value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} placeholder="Введите фамилию" sx={inputStyles} />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" sx={{ color: textSecondary, mb: 0.5 }}>Имя</Typography>
                <TextField fullWidth value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} placeholder="Введите имя" sx={inputStyles} />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" sx={{ color: textSecondary, mb: 0.5 }}>Отчество</Typography>
                <TextField fullWidth value={profile.middleName} onChange={e => setProfile(p => ({ ...p, middleName: e.target.value }))} placeholder="Введите отчество" sx={inputStyles} />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' } }}>
                <Typography variant="body2" sx={{ color: textSecondary, mb: 0.5 }}>УНП (для ИП)</Typography>
                <TextField fullWidth value={profile.unp} onChange={e => setProfile(p => ({ ...p, unp: e.target.value }))} placeholder="Введите УНП" sx={inputStyles} />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: textSecondary, mb: 0.5 }}>Email</Typography>
              <TextField fullWidth value={profile.email || user?.email || ''} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Введите email" sx={inputStyles} />
            </Box>

            <Button
              variant="contained"
              startIcon={<PersonIcon />}
              onClick={handleProfileSave}
              sx={{
                bgcolor: primaryColor,
                color: '#000',
                fontWeight: 700,
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                '&:hover': { bgcolor: '#0FA89A' },
              }}
            >
              Сохранить
            </Button>
          </Paper>

          {/* Карточка отзыва */}
          <Paper sx={{ borderRadius: '16px', bgcolor: cardBg, border: '1px solid', borderColor: 'divider', color: 'white', p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
              Оставить отзыв
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Rating
                name="review-rating"
                value={reviewRating}
                onChange={(_event, newValue) => {
                  if (newValue !== null) setReviewRating(newValue);
                }}
                size="large"
                icon={<StarIcon sx={{ color: '#FFC107' }} fontSize="inherit" />}
                emptyIcon={<StarBorderIcon sx={{ color: '#6c7c9d', opacity: 0.5 }} fontSize="inherit" />}
              />
            </Box>

            <TextField
              label="Ваше имя"
              value={reviewAuthorName}
              onChange={(e) => setReviewAuthorName(e.target.value)}
              error={!!reviewAuthorNameError}
              helperText={reviewAuthorNameError}
              required
              fullWidth
              variant="outlined"
              sx={{ mb: 2, ...inputStyles }}
            />

            <TextField
              multiline
              rows={4}
              fullWidth
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Поделитесь впечатлениями о сервисе..."
              sx={{
                ...inputStyles,
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#0B1220' : '#FFFFFF',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                  '&:hover fieldset': { borderColor: primaryColor },
                  '&.Mui-focused fieldset': { borderColor: primaryColor },
                },
                '& .MuiOutlinedInput-input': {
                  color: isDark ? '#E6EEF0' : '#0F1720',
                  '&::placeholder': {
                    color: textSecondary,
                    opacity: 1,
                  },
                },
              }}
            />

            {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
            {reviewSuccess && <Alert severity="success" sx={{ mb: 2 }}>Спасибо! Отзыв отправлен на модерацию.</Alert>}

            <Button
              variant="contained"
              disabled={!reviewText.trim() || reviewSubmitting}
              onClick={handleReviewSubmit}
              sx={{
                bgcolor: primaryColor,
                color: '#000',
                fontWeight: 700,
                borderRadius: '12px',
                px: 3,
                py: 1.2,
                opacity: !reviewText.trim() ? 0.5 : 1,
                '&:hover': {
                  bgcolor: '#0FA89A',
                  opacity: 1,
                },
                '&.Mui-disabled': {
                  bgcolor: primaryColor,
                  opacity: 0.4,
                  color: '#000',
                },
              }}
            >
              {reviewSubmitting ? 'Отправка...' : 'Оставить отзыв'}
            </Button>
          </Paper>

          {/* Кнопка удаления аккаунта */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteOpen(true)}
              sx={{ borderRadius: '8px' }}
            >
              Удалить аккаунт
            </Button>
          </Box>

          <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} slotProps={{ paper: { sx: { bgcolor: cardBg, color: 'text.primary', borderRadius: 3 } } }}>
            <DialogTitle>Удалить аккаунт?</DialogTitle>
            <DialogContent>Это действие необратимо.</DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteOpen(false)}>Отмена</Button>
              <Button onClick={handleDeleteAccount} color="error">Удалить</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default ProfilePage;