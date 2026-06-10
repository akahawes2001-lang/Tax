import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';

    const [token, setToken] = useState(tokenFromUrl);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if (!token.trim()) {
            setError('Введите код сброса пароля');
            return;
        }
        if (newPassword.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', {
                token,
                new_password: newPassword,
            });
            setSuccess(res.data.message || 'Пароль успешно изменён');
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка при сбросе пароля');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>
                    Сброс пароля
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <TextField
                    label="Код сброса (токен)"
                    fullWidth
                    margin="dense"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    disabled={loading || !!tokenFromUrl}
                />
                <TextField
                    label="Новый пароль"
                    type="password"
                    fullWidth
                    margin="dense"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    label="Подтверждение пароля"
                    type="password"
                    fullWidth
                    margin="dense"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button variant="outlined" onClick={() => navigate('/request-password-reset')}>
                        Назад
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Сброс...' : 'Сбросить пароль'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ResetPasswordPage;