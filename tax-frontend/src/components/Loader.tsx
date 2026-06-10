import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface LoaderProps {
    text?: string;
    size?: number;
    fullPage?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ text = 'Загрузка...', size = 40, fullPage = false }) => {
    const theme = useTheme();

    if (fullPage) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(3,7,17,0.85)' : 'rgba(248,250,252,0.85)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                }}
            >
                <CircularProgress size={size} sx={{ color: 'primary.main' }} />
                {text && (
                    <Typography
                        variant="body2"
                        sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}
                    >
                        {text}
                    </Typography>
                )}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, md: 6 },
                px: 2,
            }}
        >
            <CircularProgress size={size} sx={{ color: 'primary.main' }} />
            {text && (
                <Typography
                    variant="body2"
                    sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}
                >
                    {text}
                </Typography>
            )}
        </Box>
    );
};

export default Loader;