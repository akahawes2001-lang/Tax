import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Footer: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoHome = () => {
        if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
        }
    };

    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                py: { xs: 3, sm: 4 },
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: { xs: 2, sm: 2 },
                        textAlign: { xs: 'center', sm: 'left' },
                    }}
                >
                    {/* Логотип */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Logo variant="small" />
                    </Box>

                    {/* Центральный текст - строго по центру */}
                    <Box sx={{ textAlign: 'center', flex: '1 1 auto', minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c7c9d', textAlign: 'center' }}>
                            Ставки актуальны на 2026 г.
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6c7c9d', textAlign: 'center' }}>
                            Не является официальной налоговой консультацией. Для точного расчёта обратитесь в МНС РБ.
                        </Typography>
                    </Box>

                    {/* Кнопки - вертикально на мобильных, уменьшенный размер */}
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.25, sm: 1.5 }, alignItems: 'center' }}>
                        <Button
                            onClick={handleGoHome}
                            sx={{
                                color: '#6c7c9d',
                                fontSize: '0.8rem',
                                fontWeight: 400,
                                textTransform: 'none',
                                py: 0.25,
                                minHeight: 24,
                                '&:hover': {
                                    color: '#ffffff',
                                    backgroundColor: 'transparent',
                                },
                            }}
                        >
                            Главная
                        </Button>
                        <Button
                            onClick={() => navigate('/calculator')}
                            sx={{
                                color: '#6c7c9d',
                                fontSize: '0.8rem',
                                fontWeight: 400,
                                textTransform: 'none',
                                py: 0.25,
                                minHeight: 24,
                                '&:hover': {
                                    color: '#ffffff',
                                    backgroundColor: 'transparent',
                                },
                            }}
                        >
                            Калькулятор
                        </Button>
                        <Button
                            onClick={() => navigate('/terms')}
                            sx={{
                                color: '#6c7c9d',
                                fontSize: '0.8rem',
                                fontWeight: 400,
                                textTransform: 'none',
                                py: 0.25,
                                minHeight: 24,
                                '&:hover': {
                                    color: '#ffffff',
                                    backgroundColor: 'transparent',
                                },
                            }}
                        >
                            Пользовательское соглашение
                        </Button>
                        <Button
                            onClick={() => navigate('/privacy')}
                            sx={{
                                color: '#6c7c9d',
                                fontSize: '0.8rem',
                                fontWeight: 400,
                                textTransform: 'none',
                                py: 0.25,
                                minHeight: 24,
                                '&:hover': {
                                    color: '#ffffff',
                                    backgroundColor: 'transparent',
                                },
                            }}
                        >
                            Политика конфиденциальности
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;