import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { TaxProvider } from './context/TaxContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import FeedbackPage from './components/FeedbackPage';
import ProfilePage from './components/ProfilePage';
import HistoryPage from './components/HistoryPage';
import AdminPage from './components/AdminPage';
import AuthDialog from './components/AuthDialog';
import VerifyEmailPage from './components/VerifyEmailPage';
import RequestPasswordResetPage from './components/RequestPasswordResetPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import NotFoundPage from './components/NotFoundPage';
import KnowledgeBase from './components/KnowledgeBase';
import CookieBanner from './components/CookieBanner';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <TaxProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/calculator" element={<Layout />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <AuthDialog />
              <CookieBanner />
            </BrowserRouter>
        </TaxProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;