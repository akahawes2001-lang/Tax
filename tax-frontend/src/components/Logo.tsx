// src/components/Logo.tsx
import React from 'react';
import { Box, Typography, useTheme, darken } from '@mui/material';

interface LogoProps {
    variant?: 'small' | 'large';
    color?: string; // основной цвет (по умолчанию бирюзовый из темы)
}

const Logo: React.FC<LogoProps> = ({ variant = 'small', color }) => {
    const theme = useTheme();
    const primaryColor = color || theme.palette.primary.main;
    const size = variant === 'large' ? 56 : 36;
    const textVariant = variant === 'large' ? 'h4' : 'h6';

    // затемнённые варианты
    const darkColor1 = darken(primaryColor, 0.12);
    const darkColor2 = darken(primaryColor, 0.24);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* SVG-логотип: три столбца диаграммы, выровненные по нижнему краю, с уменьшенным расстоянием */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Высокий столбец (базовый цвет) */}
                <rect x="4" y="6" width="6" height="24" rx="3" fill={primaryColor} />
                {/* Средний столбец (темнее), отступ 2px от предыдущего */}
                <rect x="12" y="14" width="6" height="16" rx="3" fill={darkColor1} />
                {/* Низкий столбец (ещё темнее), отступ 2px */}
                <rect x="20" y="22" width="6" height="8" rx="3" fill={darkColor2} />
            </svg>

            {/* Текстовая часть */}
            <Typography
                variant={textVariant}
                fontWeight="bold"
                sx={{ letterSpacing: 1, display: 'inline' }}
            >
                <Box component="span" sx={{ color: 'text.primary' }}>
                    Tax
                </Box>
                <Box component="span" sx={{ color: primaryColor }}>
                    Bel
                </Box>
            </Typography>
        </Box>
    );
};

export default Logo;