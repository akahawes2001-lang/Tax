import React, { useState } from 'react';
import {
    Box, Container, Typography, Button, Paper, Stack, Alert, Rating, TextField
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const FeedbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [text, setText] = useState('');
    const [rating, setRating] = useState<number | null>(5);
    const [authorName, setAuthorName] = useState('');
    const [authorNameError, setAuthorNameError] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setError('Для отправки отзыва необходимо войти в аккаунт.');
            return;
        }
        if (!authorName.trim()) {
            setAuthorNameError('Имя обязательно');
            return;
        }
        setAuthorNameError('');
        try {
            await api.post('/reviews', { text, rating, author_name: authorName.trim() });
            setSuccess(true);
            setText('');
            setRating(5);
            setAuthorName('');
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Ошибка при отправке');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <Header />
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="h5" fontWeight={700} mb={1} textAlign="center">
                        Обратная связь
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
                        Напишите ваш отзыв или сообщите об ошибке. Отзывы публикуются после проверки.
                    </Typography>

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Спасибо! Ваш отзыв отправлен на модерацию.
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    Ваша оценка
                                </Typography>
                                <Rating
                                    value={rating}
                                    onChange={(_, newValue) => setRating(newValue)}
                                    size="large"
                                    sx={{ color: 'primary.main' }}
                                />
                            </Box>
                            <TextField
                                label="Ваше имя"
                                value={authorName}
                                onChange={e => setAuthorName(e.target.value)}
                                error={!!authorNameError}
                                helperText={authorNameError}
                                required
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                label="Ваш отзыв"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                required
                                multiline
                                rows={4}
                                fullWidth
                                slotProps={{ htmlInput: { minLength: 10 } }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                endIcon={<SendIcon />}
                            >
                                Отправить
                            </Button>
                        </Stack>
                    </form>

                    <Button
                        variant="text"
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/')}
                    >
                        ← На главную
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};

export default FeedbackPage;