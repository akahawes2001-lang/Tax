import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useThemeMode must be inside ThemeProvider');
    return ctx;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('themeMode');
        return saved === 'light' ? 'light' : 'dark';
    });

    useEffect(() => {
        localStorage.setItem('themeMode', mode);
    }, [mode]);

    const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: '#14B8A6',
                contrastText: '#FFFFFF',
            },
            secondary: {
                main: '#10B981',
            },
            error: {
                main: '#EF4444',
            },
            background: {
                default: mode === 'dark' ? '#0F1720' : '#F8FAFC',
                paper: mode === 'dark' ? '#111827' : '#FFFFFF',
            },
            text: {
                primary: mode === 'dark' ? '#E6EEF0' : '#0F1720',
                secondary: '#9CA3AF',
            },
            divider: 'rgba(148,163,184,0.2)',
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.25 },
            h2: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.25 },
            h3: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.25 },
            h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.25 },
            h5: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.25 },
            h6: { fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.25 },
            body1: { fontSize: '1rem', lineHeight: 1.5 },
            body2: { fontSize: '0.875rem', lineHeight: 1.5 },
            caption: { fontSize: '0.75rem', lineHeight: 1.5 },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 999,
                        fontWeight: 600,
                        transition: 'all 150ms',
                        '&:hover': {
                            filter: 'brightness(0.9)',
                        },
                        '&:active': {
                            transform: 'scale(0.98)',
                        },
                        '&.Mui-disabled': {
                            opacity: 0.4,
                            pointerEvents: 'none',
                        },
                    },
                    containedPrimary: {
                        boxShadow: '0 10px 25px rgba(20,184,166,0.4)',
                    },
                    outlinedPrimary: {
                        borderColor: '#14B8A6',
                        color: '#14B8A6',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        padding: 20,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            backgroundColor: mode === 'dark' ? '#0B1220' : '#FFFFFF',
                            '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.06)',
                            },
                            '&:hover fieldset': {
                                borderColor: '#14B8A6',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#14B8A6',
                            },
                            '& input': {
                                padding: '12px 14px',
                                color: mode === 'dark' ? '#E6EEF0' : '#0F1720',
                            },
                        },
                    },
                },
            },
        },
    }), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};