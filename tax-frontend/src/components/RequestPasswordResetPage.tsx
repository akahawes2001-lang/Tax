import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Box,
} from '@mui/material';
import api from '../api';

const RequestPasswordResetPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setResetToken('');
        if (!email.trim()) {
            setError('Введите email');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/request-password-reset', { email });
            setSuccess(
                res.data.message || 'Проверьте почту — на ваш email отправлен код сброса пароля'
            );
            if (res.data.reset_token) {
                setResetToken(res.data.reset_token);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка при отправке запроса');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
                    Восстановление пароля
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Введите email, который вы использовали при регистрации.
                    Мы отправим на него код для сброса пароля.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                {resetToken && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Код сброса (для теста):</strong> {resetToken}
                        <br />
                        <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                        >
                            Перейти к сбросу пароля
                        </Button>
                    </Alert>
                )}

                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="dense"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" onClick={() => navigate('/')}>
                        На главную
                    </Button>
                    <Box>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{ mr: 1 }}
                        >
                            {loading ? 'Отправка...' : 'Отправить код'}
                        </Button>
                        <Button
                            variant="text"
                            onClick={() => navigate('/reset-password')}
                        >
                            У меня есть код
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default RequestPasswordResetPage;