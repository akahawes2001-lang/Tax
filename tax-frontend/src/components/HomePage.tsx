// src/components/HomePage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Button, Paper, Rating, Alert,
  useTheme, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ElectricCarOutlinedIcon from '@mui/icons-material/ElectricCarOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import RealEstateAgentOutlinedIcon from '@mui/icons-material/RealEstateAgentOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import NatureOutlinedIcon from '@mui/icons-material/NatureOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import Footer from './Footer';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const taxCards = [
  {
    icon: <AccountBalanceWalletOutlinedIcon sx={{ color: '#FF8C00', fontSize: 24 }} />,
    title: 'Подоходный налог',
    desc: 'Прогрессивная шкала 13% / 25% / 30%. Социальные, стандартные и имущественные вычеты, вычеты на детей.',
  },
  {
    icon: <ElectricCarOutlinedIcon sx={{ color: '#3B82F6', fontSize: 24 }} />,
    title: 'Транспортный налог',
    desc: 'Легковые, грузовые, мотоциклы, электромобили (0 руб.). Водный и воздушный транспорт. Налог на роскошь ×10.',
  },
  {
    icon: <PetsOutlinedIcon sx={{ color: '#EF4444', fontSize: 24 }} />,
    title: 'Налог на собак',
    desc: 'Умный поиск породы. Опасные — 67 руб./кв., неопасные — 14 руб./кв. Льготы для пенсионеров и многодетных.',
  },
  {
    icon: <SavingsOutlinedIcon sx={{ color: '#10B981', fontSize: 24 }} />,
    title: 'Налог на вклады',
    desc: 'Поддержка нескольких вкладов. BYN ≥ 12 мес. и валюта ≥ 24 мес. — освобождение. Ставка 13%/25%.',
  },
  {
    icon: <CottageOutlinedIcon sx={{ color: '#8B5CF6', fontSize: 24 }} />,
    title: 'Налог на аренду',
    desc: 'Минск — 53 руб., облцентры — 49, крупные города — 33, прочие — 20 руб./мес. Разные типы объектов.',
  },
  {
    icon: <TrendingUpOutlinedIcon sx={{ color: '#F59E0B', fontSize: 24 }} />,
    title: 'Налог с продажи',
    desc: 'Авто, недвижимость, ценные бумаги. Вычет расходов или фиксированный 20%. Освобождение для единственного жилья.',
  },
  {
    icon: <RealEstateAgentOutlinedIcon sx={{ color: '#8B5CF6', fontSize: 24 }} />,
    title: 'Налог на недвижимость',
    desc: 'Квартира, дом, гараж, хозпостройка. Ставка 0.1%–1.2%. Льготы: пенсионеры, многодетные, инвалиды.',
  },
  {
    icon: <LandscapeOutlinedIcon sx={{ color: '#22C55E', fontSize: 24 }} />,
    title: 'Земельный налог',
    desc: 'Сельхоз — 0.1%, жильё — 0.5%, промзона — 1.0%, прочие — 1.5%. Льготы для пенсионеров, многодетных, инвалидов, пострадавших от ЧАЭС.',
  },
  {
    icon: <AccountBalanceOutlinedIcon sx={{ color: '#EC4899', fontSize: 24 }} />,
    title: 'Удержания из зарплаты',
    desc: 'ФСЗН 1%, профсоюз, доп. пенсионное 3+3, страховки, алименты, исполнительные листы с индикатором лимита.',
  },
  {
    icon: <HandymanOutlinedIcon sx={{ color: '#FF6B35', fontSize: 24 }} />,
    title: 'Ремесленный сбор',
    desc: '1 базовая величина (42 руб.) в год для ремесленников. Просто отметьте чекбокс.',
  },
  {
    icon: <NatureOutlinedIcon sx={{ color: '#4CAF50', fontSize: 24 }} />,
    title: 'Сбор за агроэкотуризм',
    desc: '1 базовая величина (42 руб.) в год для владельцев агроусадеб. Просто отметьте чекбокс.',
  },
  {
    icon: <BusinessCenterOutlinedIcon sx={{ color: '#F97316', fontSize: 24 }} />,
    title: 'Единый налог для ИП',
    desc: 'Расчёт фиксированного налога для ИП без наёмных работников. Выбор вида деятельности и населённого пункта.',
  },
];

const highlights = [
  {
    icon: <BoltOutlinedIcon sx={{ color: 'primary.main', fontSize: 25 }} />,
    title: 'Мгновенный пересчёт',
    desc: 'Результаты обновляются при каждом изменении поля — без нажатия кнопок.',
  },
  {
    icon: <VerifiedUserOutlinedIcon sx={{ color: 'primary.main', fontSize: 25 }} />,
    title: 'Актуальные ставки',
    desc: 'Ставки 2026 года. Ссылки на статьи Налогового кодекса Республики Беларусь.',
  },
  {
    icon: <DownloadOutlinedIcon sx={{ color: 'primary.main', fontSize: 25 }} />,
    title: 'Экспорт PDF и Excel',
    desc: 'Скачайте сводный отчёт, детализацию или налоговую декларацию в один клик.',
  },
  {
    icon: <CheckCircleOutlinedIcon sx={{ color: 'primary.main', fontSize: 25 }} />,
    title: 'Бесплатно',
    desc: 'Полный функционал без регистрации. Сохранение истории расчётов — после входа в аккаунт.',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const [reviews, setReviews] = useState<any[]>([]);

  const [expressIncome, setExpressIncome] = useState('');
  const [expressChildren, setExpressChildren] = useState('');
  const [expressResult, setExpressResult] = useState<any>(null);
  const [expressOpen, setExpressOpen] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);

  const handleExpressCalc = async () => {
    const income = parseFloat(expressIncome);
    if (!income || income <= 0) return;
    setExpressLoading(true);
    try {
      const childrenCount = parseInt(expressChildren) || 0;
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        year: 2026,
        salary: Math.round(income / 12 * 100) / 100,
        dividends: 0,
        foreign_income: 0,
        personal_income: 0,
        children_birthdays: childrenCount > 0
          ? Array(childrenCount).fill('2020-01-01')
          : [],
        is_single_parent: false,
        is_large_family: false,
        disability_deduction: false,
        young_specialist_deduction: false,
        disabled_children_birthdays: [],
        education_expenses: 0,
        insurance_expenses: 0,
        medical_expenses: 0,
        medicine_expenses: 0,
        alimony_paid: 0,
        charity_amount: 0,
        is_union_member: false,
        pension_contributions: false,
        needs_housing_improvement: false,
        housing_expenses: 0,
      }));
      const res = await api.post('/calculate-income-tax', { monthly_incomes: months });
      setExpressResult(res.data);
      setExpressOpen(true);
    } catch (e: any) {
      console.error(e);
    } finally {
      setExpressLoading(false);
    }
  };

  useEffect(() => {
    api.get('/reviews/public')
      .then(res => setReviews(res.data))
      .catch(() => { });
  }, []);

  return (
    <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC', minHeight: '100vh' }}>
      <Header />

      {/* Диалог результатов экспресс-расчёта */}
      <Dialog open={expressOpen} onClose={() => setExpressOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          <FlashOnIcon sx={{ color: 'primary.main', verticalAlign: 'middle', mr: 1 }} />
          Результат быстрого расчёта
        </DialogTitle>
        <DialogContent>
          {expressResult && (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(20,184,166,0.08)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Общий доход</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{expressResult.total_income.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(239,68,68,0.08)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Итоговый налог</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>{expressResult.final_tax.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(16,185,129,0.08)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Экономия за счёт вычетов</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{expressResult.savings.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(59,130,246,0.08)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>ФСЗН (1%)</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{expressResult.total_pension_fees.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(245,158,11,0.08)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Общая налоговая нагрузка</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{expressResult.total_tax_burden.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} руб.</Typography>
                </Paper>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Это ознакомительный расчёт. Для полного расчёта с учётом всех налогов используйте пошаговый мастер.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setExpressOpen(false)}>Закрыть</Button>
          <Button variant="contained" onClick={() => { setExpressOpen(false); navigate('/calculator'); }}>
            Полный расчёт
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hero */}
      <Box sx={{ textAlign: 'center', pt: { xs: 4, md: 10 }, pb: { xs: 3, md: 6 } }}>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              mb: 2,
              px: { xs: 1.5, md: 2.5 },
              py: 0.6,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
              Актуальные ставки 2026 • Без регистрации • Бесплатно
            </Typography>
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.8rem', md: '4.5rem' },
              lineHeight: 1.1,
              mb: 1.5,
              color: 'text.primary',
            }}
          >
            Налоговый<br />
            <Box component="span" sx={{ color: 'primary.main' }}>калькулятор</Box><br />
            Беларуси
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 3,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '0.9rem', md: '1.1rem' },
              color: 'text.secondary',
            }}
          >
            Рассчитайте 12 видов налогов и сборов за несколько минут.<br />
            Автоматический пересчёт, детализация со ссылками на Налоговый кодекс РБ, экспорт в PDF.
          </Typography>

          {/* Экспресс-расчёт */}
          <Box sx={{
            maxWidth: 600, mx: 'auto', mb: 3, p: { xs: 2, md: 3 },
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(20,184,166,0.08)' : 'rgba(20,184,166,0.05)',
            borderRadius: 3, border: '1px solid', borderColor: 'rgba(20,184,166,0.3)'
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              <FlashOnIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Быстрый расчёт подоходного налога
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
              <TextField
                label="Годовой доход (BYN)"
                type="number"
                size="small"
                value={expressIncome}
                onChange={e => setExpressIncome(e.target.value)}
                sx={{ flex: 2, minWidth: 150 }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                label="Детей"
                type="number"
                size="small"
                value={expressChildren}
                onChange={e => setExpressChildren(e.target.value)}
                sx={{ flex: 1, minWidth: 80, maxWidth: 120 }}
                slotProps={{ htmlInput: { min: 0, max: 20 } }}
              />
              <Button
                variant="contained"
                onClick={handleExpressCalc}
                disabled={expressLoading || !expressIncome}
                sx={{ borderRadius: '10px', whiteSpace: 'nowrap', minWidth: 130 }}
              >
                {expressLoading ? <CircularProgress size={20} /> : 'Рассчитать'}
              </Button>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />}
            onClick={() => navigate('/calculator')}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              px: { xs: 4, sm: 8 },
              py: { xs: 1.8, md: 2.2 },
              fontSize: { xs: '1.1rem', md: '1.4rem' },
              fontWeight: 700,
              borderRadius: '12px',
              color: '#000000',
              bgcolor: 'primary.main',
              boxShadow: '0 12px 32px rgba(20,184,166,0.5), 0 4px 10px rgba(20,184,166,0.25)',
              '&:hover': { bgcolor: '#0FA89A', boxShadow: '0 16px 40px rgba(20,184,166,0.6), 0 6px 14px rgba(20,184,166,0.3)' },
              mb: 2,
            }}
          >
            Начать расчёт
          </Button>

          <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, color: 'text.secondary' }}>
            Пошаговый мастер · 12 видов налогов · Скачать PDF
          </Typography>

          <Box sx={{ mt: { xs: 8, md: 21 } }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '2.5rem' }, fontWeight: 700, color: 'text.primary', textAlign: 'center' }}>
              12 видов налогов и сборов в одном месте
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, fontSize: { xs: '0.85rem', md: '1rem' }, color: 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}>
              Все актуальные ставки и льготы Республики Беларусь с детализацией и ссылками на законодательство
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Карточки налогов */}
      <Box sx={{ px: { xs: 2, sm: 4, md: 16 }, pb: { xs: 6, md: 16 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px' }}>
          {taxCards.map((card, index) => (
            <Box
              key={index}
              sx={{
                width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' },
                display: 'flex',
              }}
            >
              <Paper
                sx={{
                  px: { xs: 2, md: 2.5 },
                  py: { xs: 1, md: 1.25 },
                  width: '100%',
                  height: { xs: 150, md: 180 },
                  display: 'flex',
                  bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.25s ease',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 12px 24px rgba(20,184,166,0.25)',
                    transform: 'translateY(-4px)',
                    bgcolor: theme.palette.mode === 'dark' ? '#0a1022' : '#F9FAFB',
                  },
                }}
              >
                <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
                  <Box sx={{ width: { xs: 36, md: 42 }, height: { xs: 36, md: 42 }, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${card.icon.props.sx.color}15`, alignSelf: 'flex-start' }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.85rem' }, lineHeight: 1.3, color: 'text.primary', mb: 0.2 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.8rem' }, lineHeight: 1.3, color: 'text.secondary', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {card.desc}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Почему TaxBel */}
      <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 6, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: { xs: 3, md: 4 } }}>
            {highlights.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: { xs: '45%', sm: 220 } }}>
                <Box sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(20,184,166,0.08)', mb: 1 }}>
                  {item.icon}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '0.85rem', md: '1rem' } }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' }, lineHeight: 1.4, color: '#6c7c9d', wordBreak: 'break-word' }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Отзывы */}
      <Box sx={{ pt: { xs: 10, md: 20 }, pb: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontSize: { xs: '1.3rem', md: '2rem' }, fontWeight: 700, color: 'text.primary', textAlign: 'center', mb: 3 }}>
            Что говорят пользователи
          </Typography>
        </Container>

        {reviews.length > 0 ? (
          <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 3, md: 6 } }}>
            <Container maxWidth="md">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                {reviews.map((review: any) => (
                  <Box key={review.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 8px)' } }}>
                    <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#fff', borderRadius: '16px', border: '1px solid', borderColor: 'divider', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 0 15px rgba(20,184,166,0.2)' } }}>
                      <Rating value={review.rating} readOnly size="small" sx={{ color: '#FFC107', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{review.text}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>— {review.author_name || `Пользователь ${review.user_id}`}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Container>
          </Box>
        ) : (
          <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 3, md: 6 } }}>
            <Container maxWidth="md">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(20,184,166,0.08)', mb: 2 }}>
                  <RateReviewOutlinedIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1rem', md: '1.15rem' }, mb: 1 }}>
                  Ваш отзыв станет первым!
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4, color: '#6c7c9d', maxWidth: 420, mb: 2 }}>
                  Поделитесь впечатлениями о сервисе — это поможет другим пользователям правильно рассчитать налоги.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/feedback')} sx={{ px: 4, py: 1, fontSize: '0.9rem', fontWeight: 700, borderRadius: '12px', color: '#000000', bgcolor: 'primary.main', '&:hover': { bgcolor: '#0FA89A' } }}>
                  Оставить отзыв
                </Button>
              </Box>
            </Container>
          </Box>
        )}
      </Box>

      {/* CTA */}
      <Box sx={{ py: { xs: 6, md: 12 } }}>
        <Container maxWidth="md">
          <Paper sx={{ p: { xs: 3, md: 6 }, bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF', borderRadius: '24px', border: '1px solid', borderColor: 'rgba(20,184,166,0.25)', boxShadow: '0 0 30px rgba(20,184,166,0.15)', textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary', mb: 2, fontSize: { xs: '1.2rem', md: '2rem' } }}>
              Готовы рассчитать налоги?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, maxWidth: 500, mx: 'auto', fontSize: { xs: '0.85rem', md: '0.95rem' }, lineHeight: 1.5, color: '#6c7c9d' }}>
              Пошаговый мастер за 2–3 минуты. Результат — сразу. Сохранение, PDF и Excel — бесплатно.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 2 }, justifyContent: 'center', alignItems: 'center' }}>
              <Button
                variant="contained" size="large" endIcon={<ArrowForwardIcon sx={{ fontSize: '1.2rem' }} />}
                onClick={() => navigate('/calculator')}
                sx={{
                  width: { xs: '100%', sm: 'auto' }, px: { xs: 3, sm: 5 }, py: 1.4, fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', color: '#000000', bgcolor: 'primary.main',
                  boxShadow: '0 8px 24px rgba(20,184,166,0.4), 0 2px 6px rgba(0,0,0,0.2)',
                  '&:hover': { bgcolor: '#0FA89A', boxShadow: '0 10px 28px rgba(20,184,166,0.5), 0 4px 10px rgba(0,0,0,0.25)' },
                }}
              >
                Начать расчёт
              </Button>
              <Button
                variant="outlined" size="large"
                onClick={() => navigate('/knowledge')}
                sx={{
                  width: { xs: '100%', sm: 'auto' }, px: { xs: 3, sm: 5 }, py: 1.4, fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px',
                  borderColor: 'primary.main', color: 'primary.main',
                  '&:hover': { borderColor: '#0FA89A', bgcolor: 'rgba(20,184,166,0.08)' },
                }}
              >
                Узнать больше о налогах
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Дисклеймер */}
      <Box sx={{ px: { xs: 2, sm: 4, md: 16 }, pb: 4 }}>
        <Alert severity="warning" sx={{ bgcolor: 'rgba(237, 108, 2, 0.12)', border: '1px solid rgba(237, 108, 2, 0.4)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>⚠️ Дисклеймер</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Расчёты являются ознакомительными и не заменяют официальную консультацию налогового органа. 
            Для получения точной информации обратитесь в Министерство по налогам и сборам Республики Беларусь.
          </Typography>
        </Alert>
      </Box>

      <Footer />
    </Box>
  );
};

export default HomePage;