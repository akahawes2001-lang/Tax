import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, actionLabel, onAction }) => {
    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', py: { xs: 4, md: 6 }, px: 2
        }}>
            <Box sx={{
                width: 56, height: 56, borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'rgba(20,184,166,0.08)', mb: 2
            }}>
                {icon || <InboxOutlinedIcon sx={{ color: 'primary.main', fontSize: 32 }} />}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1rem', md: '1.15rem' } }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360, mb: 2, fontSize: '0.85rem' }}>
                    {subtitle}
                </Typography>
            )}
            {actionLabel && onAction && (
                <Button variant="contained" onClick={onAction} sx={{ borderRadius: '10px', px: 3 }}>
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
};

export default EmptyState;