import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Box,
    TextField,
} from '@mui/material';
import api from '../api';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const urlToken = searchParams.get('token');
    const [token, setToken] = useState(urlToken || '');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (urlToken) {
            setToken(urlToken);
            setStatus('loading');
            verifyToken(urlToken);
        } else {
            setStatus('idle');
            setMessage('Вставьте токен из письма и нажмите "Подтвердить"');
        }
    }, [urlToken]);

    const verifyToken = async (t: string) => {
        setStatus('loading');
        setMessage('');
        try {
            const res = await api.post('/auth/verify-email', { token: t });
            setStatus('success');
            setMessage(res.data.message || 'Email успешно подтверждён');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.detail || 'Ошибка при подтверждении email');
        }
    };

    const handleVerify = () => {
        if (token.trim()) {
            verifyToken(token.trim());
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: { xs: 4, sm: 8 }, px: { xs: 2, sm: 3 } }}>
            <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    Подтверждение email
                </Typography>

                {status === 'loading' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                            Подтверждение...
                        </Typography>
                    </Box>
                )}

                {status === 'success' && (
                    <Alert severity="success" sx={{ my: 2 }}>
                        {message}
                    </Alert>
                )}

                {status === 'error' && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {message}
                    </Alert>
                )}

                {status !== 'success' && (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Токен подтверждения"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            fullWidth
                            size="small"
                            helperText="Вставьте токен из письма или из поля после регистрации"
                            sx={{ mb: 2 }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleVerify}
                            disabled={status === 'loading' || !token.trim()}
                            fullWidth
                            sx={{ mb: 1 }}
                        >
                            Подтвердить
                        </Button>
                    </Box>
                )}

                <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    fullWidth
                    sx={{ mt: status === 'success' ? 2 : 0 }}
                >
                    На главную
                </Button>
            </Paper>
        </Container>
    );
};

export default VerifyEmailPage;