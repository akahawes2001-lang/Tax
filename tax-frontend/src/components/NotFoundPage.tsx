import React from 'react';
import { Box, Container, Typography, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const NotFoundPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="sm" sx={{ textAlign: 'center', pt: { xs: 8, md: 12 } }}>
        <Typography
          variant="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '4rem', md: '6rem' },
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.2rem', md: '1.5rem' },
            color: 'text.primary',
            mb: 2,
          }}
        >
          Страница не найдена
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', mb: 4, fontSize: { xs: '0.9rem', md: '1rem' } }}
        >
          Возможно, она была перемещена или удалена. Проверьте правильность адреса или вернитесь на главную.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{ borderRadius: '12px', px: 4, py: 1.5 }}
        >
          На главную
        </Button>
      </Container>
      <Box sx={{ mt: 8 }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default NotFoundPage;