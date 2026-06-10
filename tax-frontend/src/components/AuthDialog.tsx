import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, Tabs, Tab, Link, Box, Typography, CircularProgress, FormControlLabel, Checkbox
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const RECAPTCHA_SITE_KEY = '6Lf72xUtAAAAAAVXvQjgCu3RoPTpCZji1ChiNkZh';

declare global {
    interface Window {
        grecaptcha?: any;
    }
}

const AuthDialog: React.FC = () => {
    const { isAuthDialogOpen, closeAuthDialog, login } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [registered, setRegistered] = useState(false);
    const [verifyToken, setVerifyToken] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [verifyMsg, setVerifyMsg] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = async () => {
        setError('');
        const endpoint = tab === 0 ? '/auth/login' : '/auth/register';
        const payload: any = { email, password };
        payload.captcha_token = captchaToken || '';
        try {
            const res = await api.post(endpoint, payload);
            if (tab === 0) {
                // login принимает объект с access_token
                await login(res.data);
                closeAuthDialog();
            } else {
                setRegistered(true);
                setVerifyStatus('idle');
                if (res.data.verification_token) {
                    setVerifyToken(res.data.verification_token);
                }
            }
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail.map((d: any) => d.msg).join('; '));
            } else {
                setError(detail || 'Ошибка');
            }
        }
    };

    const handleRecaptchaLoad = useCallback(() => {
        if (window.grecaptcha) {
            window.grecaptcha.render('recaptcha-container', {
                sitekey: RECAPTCHA_SITE_KEY,
                callback: (token: string) => setCaptchaToken(token),
            });
        }
    }, []);

    React.useEffect(() => {
        if (isAuthDialogOpen) {
            setCaptchaToken('');
            setAgreed(false);
            setError('');
            setVerifyStatus('idle');
            setVerifyMsg('');
            setVerifyToken('');
            if (window.grecaptcha) {
                const container = document.getElementById('recaptcha-container');
                if (container) container.innerHTML = '';
            }
            setTimeout(handleRecaptchaLoad, 500);
        }
    }, [isAuthDialogOpen, handleRecaptchaLoad]);

    const handleForgotPassword = () => {
        closeAuthDialog();
        navigate('/request-password-reset');
    };

    const handleVerifyNow = useCallback(async () => {
        if (!verifyToken) {
            setVerifyStatus('error');
            setVerifyMsg('Токен подтверждения не найден');
            return;
        }
        setVerifying(true);
        setVerifyStatus('idle');
        try {
            const res = await api.post('/auth/verify-email', { token: verifyToken });
            setVerifyStatus('success');
            setVerifyMsg(res.data.message || 'Email успешно подтверждён');
        } catch (err: any) {
            setVerifyStatus('error');
            setVerifyMsg(err.response?.data?.detail || 'Ошибка при подтверждении email');
        } finally {
            setVerifying(false);
        }
    }, [verifyToken]);

    const handleClose = () => {
        closeAuthDialog();
    };

    return (
        <Dialog
            open={isAuthDialogOpen}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            disableEnforceFocus
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderRadius: 3,
                        mx: { xs: 1, sm: 2 },
                        width: { xs: 'calc(100% - 16px)', sm: 'auto' },
                    }
                }
            }}
        >
            {registered ? (
                <>
                    <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                        Регистрация завершена
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center', pb: 1 }}>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Пользователь <strong>{email}</strong> успешно создан.
                        </Alert>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            Для входа в систему необходимо подтвердить email.
                        </Typography>

                        {verifyStatus === 'idle' && (
                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                Нажмите кнопку ниже, чтобы подтвердить email прямо сейчас, или перейдите по ссылке из письма.
                            </Typography>
                        )}

                        {verifyStatus === 'success' && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {verifyMsg}<br/>Теперь вы можете войти в систему.
                            </Alert>
                        )}

                        {verifyStatus === 'error' && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {verifyMsg}
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {verifyStatus === 'idle' && (
                            <Button variant="contained" onClick={handleVerifyNow} disabled={verifying} fullWidth sx={{ borderRadius: '10px' }}>
                                {verifying ? <CircularProgress size={24} /> : 'Подтвердить email сейчас'}
                            </Button>
                        )}
                        <Button variant="outlined" onClick={() => { setRegistered(false); setTab(0); }} fullWidth sx={{ borderRadius: '10px' }}>
                            {verifyStatus === 'success' ? 'Войти' : 'Уже подтвердили? Войти'}
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle>
                        <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} centered>
                            <Tab label="Вход" />
                            <Tab label="Регистрация" />
                        </Tabs>
                    </DialogTitle>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <TextField label="Email" type="email" fullWidth margin="dense" value={email} onChange={e => setEmail(e.target.value)} />
                        <TextField label="Пароль" type="password" fullWidth margin="dense" value={password} onChange={e => setPassword(e.target.value)}
                            helperText={tab === 1 ? 'Минимум 8 символов, заглавная, цифра, спецсимвол' : ''} />
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', minHeight: 78 }}>
                            <div id="recaptcha-container" />
                        </Box>
                        {tab === 1 && (
                            <FormControlLabel
                                control={<Checkbox checked={agreed} onChange={e => setAgreed(e.target.checked)} size="small" />}
                                label={
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Я принимаю{' '}
                                        <Link href="/terms" target="_blank" sx={{ cursor: 'pointer' }}>
                                            Пользовательское соглашение
                                        </Link>{' '}
                                        и{' '}
                                        <Link href="/privacy" target="_blank" sx={{ cursor: 'pointer' }}>
                                            Политику конфиденциальности
                                        </Link>
                                    </Typography>
                                }
                                sx={{ mt: 1, alignItems: 'flex-start' }}
                            />
                        )}
                        {tab === 0 && (
                            <Box sx={{ mt: 1, textAlign: 'right' }}>
                                <Link component="button" variant="body2" onClick={handleForgotPassword} sx={{ color: 'primary.main', cursor: 'pointer' }}>
                                    Забыли пароль?
                                </Link>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 1 } }}>
                        <Button onClick={closeAuthDialog}>Отмена</Button>
                        <Button variant="contained" onClick={handleSubmit} disabled={tab === 1 && !agreed}>
                            {tab === 0 ? 'Войти' : 'Зарегистрироваться'}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default AuthDialog;