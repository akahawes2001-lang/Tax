import React, { useState } from 'react';
import {
    AppBar, Toolbar, Button, Box, IconButton, alpha, useTheme,
    Drawer, List, ListItem, ListItemButton, ListItemText, Divider
} from '@mui/material';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import Logo from './Logo';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout, openAuthDialog, user } = useAuth();
    const { mode, toggleTheme } = useThemeMode();
    const theme = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    const navButtonStyles = (path: string) => ({
        fontWeight: 500,
        fontSize: '0.9rem',
        textTransform: 'none',
        borderRadius: '14px',
        px: 1.5,
        py: 0.5,
        minWidth: 'auto',
        color: isActive(path) ? '#00c2ae' : '#6c7c9d',
        backgroundColor: isActive(path) ? 'rgba(20,184,166,0.12)' : 'transparent',
        border: '1.5px solid transparent',
        boxShadow: isActive(path) ? '0 0 8px rgba(20,184,166,0.15)' : 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
            backgroundColor: isActive(path) ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.08)',
            color: isActive(path) ? '#00c2ae' : '#ffffff',
        },
    });

    const isAdmin = user?.role === 'admin';

    const navItems = [
        { label: 'Главная', path: '/' },
        { label: 'Калькулятор', path: '/calculator' },
        { label: 'История', path: '/history' },
        { label: 'База знаний', path: '/knowledge' },
    ];

    const handleNavClick = (path: string) => {
        navigate(path);
        setDrawerOpen(false);
    };

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={0}
            sx={{
                height: 64,
                bgcolor: (t) => alpha(t.palette.background.paper, 0.75),
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid',
                borderColor: 'divider',
                px: { xs: 1, md: 3 },
            }}
        >
            <Toolbar disableGutters sx={{ height: 64, justifyContent: 'space-between' }}>
                {/* Логотип */}
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <Logo variant="small" />
                </Box>

                {/* Навигационные кнопки - десктоп */}
                <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 2 }}>
                    <Button onClick={() => navigate('/')} sx={navButtonStyles('/')}>
                        Главная
                    </Button>
                    <Button onClick={() => navigate('/calculator')} sx={navButtonStyles('/calculator')}>
                        Калькулятор
                    </Button>
                    <Button onClick={() => navigate('/history')} sx={navButtonStyles('/history')}>
                        История
                    </Button>
                    <Button onClick={() => navigate('/knowledge')} sx={navButtonStyles('/knowledge')}>
                        База знаний
                    </Button>
                </Box>

                {/* Правая группа */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={toggleTheme} size="small" sx={{ color: '#6c7c9d' }}>
                        {mode === 'dark' ? (
                            <WbSunnyOutlinedIcon fontSize="small" />
                        ) : (
                            <DarkModeOutlinedIcon fontSize="small" />
                        )}
                    </IconButton>

                    {/* Десктоп: кнопки авторизации */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                        {isAuthenticated ? (
                            <>
                                {isAdmin && (
                                    <Button
                                        onClick={() => navigate('/admin')}
                                        startIcon={<ShieldOutlinedIcon />}
                                        sx={{
                                            color: '#ffffff',
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            fontSize: '0.9rem',
                                            borderRadius: '14px',
                                            px: 1.5,
                                            py: 0.5,
                                            '&:hover': {
                                                backgroundColor: 'rgba(20,184,166,0.12)',
                                                color: '#ffffff',
                                            },
                                        }}
                                    >
                                        Админ
                                    </Button>
                                )}
                                <Button
                                    onClick={() => navigate('/profile')}
                                    startIcon={<PersonOutlinedIcon />}
                                    sx={{
                                        color: theme.palette.text.primary,
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        fontSize: '0.9rem',
                                        borderRadius: '14px',
                                        px: 1.5,
                                        py: 0.5,
                                        '&:hover': {
                                            backgroundColor: 'rgba(20,184,166,0.12)',
                                            color: theme.palette.text.primary,
                                        },
                                    }}
                                >
                                    {user?.displayName || 'Профиль'}
                                </Button>

                                <IconButton
                                    onClick={handleLogout}
                                    size="small"
                                    title="Выйти"
                                    sx={{
                                        color: '#6c7c9d',
                                        borderRadius: '14px',
                                        '&:hover': {
                                            backgroundColor: 'rgba(20,184,166,0.08)',
                                            color: '#ffffff',
                                        },
                                    }}
                                >
                                    <LogoutIcon fontSize="small" />
                                </IconButton>
                            </>
                        ) : (
                            <Button
                                startIcon={<LoginIcon />}
                                onClick={openAuthDialog}
                                size="small"
                                variant="outlined"
                                color="primary"
                            >
                                Войти
                            </Button>
                        )}
                    </Box>

                    {/* Мобильное: бургер-меню */}
                    <IconButton
                        onClick={() => setDrawerOpen(true)}
                        size="small"
                        sx={{ display: { xs: 'flex', md: 'none' }, color: '#6c7c9d' }}
                    >
                        <MenuIcon />
                    </IconButton>
                </Box>
            </Toolbar>

            {/* Drawer для мобильного меню */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                slotProps={{
                    paper: {
                        sx: {
                            width: 280,
                            bgcolor: theme.palette.background.paper,
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                        }
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ color: '#6c7c9d' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Divider />
                <List sx={{ pt: 1 }}>
                    {navItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                onClick={() => handleNavClick(item.path)}
                                selected={isActive(item.path)}
                                sx={{
                                    borderRadius: 2,
                                    mx: 1,
                                    mb: 0.5,
                                    color: isActive(item.path) ? '#00c2ae' : 'inherit',
                                    bgcolor: isActive(item.path) ? 'rgba(20,184,166,0.12)' : 'transparent',
                                    '&:hover': {
                                        bgcolor: isActive(item.path) ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.08)',
                                    },
                                }}
                            >
                            <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
                <List sx={{ pt: 1 }}>
                    {isAuthenticated ? (
                        <>
                            {isAdmin && (
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleNavClick('/admin')} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                                        <ShieldOutlinedIcon sx={{ mr: 1, fontSize: 20 }} />
                                        <ListItemText primary="Админ" />
                                    </ListItemButton>
                                </ListItem>
                            )}
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => handleNavClick('/profile')} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                                    <PersonOutlinedIcon sx={{ mr: 1, fontSize: 20 }} />
                                    <ListItemText primary={user?.displayName || 'Профиль'} />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                                    <ListItemText primary="Выйти" />
                                </ListItemButton>
                            </ListItem>
                        </>
                    ) : (
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { openAuthDialog(); setDrawerOpen(false); }} sx={{ borderRadius: 2, mx: 1, mb: 0.5 }}>
                                <LoginIcon sx={{ mr: 1, fontSize: 20 }} />
                                <ListItemText primary="Войти" />
                            </ListItemButton>
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </AppBar>
    );
};

export default Header;