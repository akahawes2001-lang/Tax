import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api';

interface AuthContextType {
    token: string | null;
    user: any | null;
    login: (data: { access_token?: string; email?: string } | string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    isAuthDialogOpen: boolean;
    openAuthDialog: () => void;
    closeAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

    // Проверка токена при старте по cookie (httpOnly — не читаем, просто проверяем /auth/me)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get('/auth/me');
                if (!cancelled) {
                    setUser(res.data);
                    setToken('authenticated'); // маркер, что пользователь есть
                }
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setToken(null);
                }
            } finally {
                if (!cancelled) setIsAuthLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const login = async (data: { access_token?: string; email?: string } | string) => {
        setToken('authenticated');
        setIsAuthDialogOpen(false);
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch {
            // Если /auth/me не доступен (например, httpOnly cookie не отправилась),
            // пробуем использовать данные из ответа логина
            if (typeof data === 'object' && data.email) {
                setUser({ email: data.email });
            } else {
                setToken(null);
                setUser(null);
            }
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Игнорируем ошибку при выходе
        }
        setToken(null);
        setUser(null);
    };

    const openAuthDialog = () => setIsAuthDialogOpen(true);
    const closeAuthDialog = () => setIsAuthDialogOpen(false);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isAuthLoading,
                isAuthDialogOpen,
                openAuthDialog,
                closeAuthDialog,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};