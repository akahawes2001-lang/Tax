import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Slide, useTheme } from '@mui/material';
import CookieOutlinedIcon from '@mui/icons-material/CookieOutlined';

const CookieBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Небольшая задержка для плавного появления
            const timer = setTimeout(() => setVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setVisible(false);
    };

    return (
        <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
            <Box
                sx={{
                    position: 'fixed',
                    bottom: { xs: 8, sm: 16 },
                    left: { xs: 8, sm: 16 },
                    right: { xs: 8, sm: 16 },
                    maxWidth: 480,
                    zIndex: 9999,
                    bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    p: { xs: 2, sm: 2.5 },
                }}
            >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(20,184,166,0.08)',
                            flexShrink: 0,
                        }}
                    >
                        <CookieOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
                        >
                            Мы используем cookie
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5, mb: 1.5 }}
                        >
                            Сервис использует httpOnly cookie для аутентификации и localStorage для настроек темы.
                            Нажимая «Принять», вы соглашаетесь с использованием cookie.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleAccept}
                                sx={{ borderRadius: '8px', px: 2, fontSize: '0.8rem' }}
                            >
                                Принять
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleDecline}
                                sx={{ borderRadius: '8px', px: 2, fontSize: '0.8rem' }}
                            >
                                Отклонить
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Slide>
    );
};

export default CookieBanner;