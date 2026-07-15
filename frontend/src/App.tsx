import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RetroPage from './pages/RetroPage';
import SummaryPage from './pages/SummaryPage';
import { type User } from './mocks/data';
import { getMe, logoutApi, type AuthUser } from './api/auth';
import { clearTokens, getTokens } from './api/client';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}>({ user: null, login: () => {}, logout: () => {} });

export const ThemeContext = React.createContext<{
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}>({ theme: 'dark', toggleTheme: () => {} });

export const DemoContext = React.createContext<{
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}>({ isDemoMode: true, toggleDemoMode: () => {} });

function authUserToUser(authUser: AuthUser): User {
  const name = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ');
  return {
    id: authUser.id,
    name,
    avatar: authUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.username || authUser.id}`,
    color: '#7c3aed',
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDemoMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [isLoading, setIsLoading] = useState(true);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev;
      localStorage.setItem('isDemoMode', String(next));
      return next;
    });
  };

  const handleLogout = useCallback(async () => {
    if (!isDemoMode) {
      await logoutApi();
    }
    setUser(null);
  }, [isDemoMode]);

  // Restore session on mount (real mode only)
  useEffect(() => {
    if (!isDemoMode) {
      const { accessToken } = getTokens();
      if (accessToken) {
        getMe()
          .then(profile => {
            setUser(authUserToUser(profile));
          })
          .catch(() => {
            clearTokens();
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
        <AuthContext.Provider value={{ user, login: setUser, logout: handleLogout }}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
              <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" replace />} />
              <Route path="/retro/:id" element={user ? <RetroPage /> : <Navigate to="/" replace />} />
              <Route path="/retro/:id/summary" element={user ? <SummaryPage /> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthContext.Provider>
      </DemoContext.Provider>
    </ThemeContext.Provider>
  );
}
