import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RetroPage from './pages/RetroPage';
import SummaryPage from './pages/SummaryPage';
import { type User } from './mocks/data';
import { getMe, logoutApi, type AuthUser } from './api/auth';
import { clearTokens, getTokens } from './api/client';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/retro/:id" element={<ProtectedRoute><RetroPage /></ProtectedRoute>} />
      <Route path="/retro/:id/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}




export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedDemoUser = sessionStorage.getItem('demo_user');
    return savedDemoUser ? JSON.parse(savedDemoUser) : null;
  });
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
      if (next) {
        setUser(null);
        sessionStorage.removeItem('demo_user');
      }
      return next;
    });
  };

  const handleLogin = useCallback((userData: User) => {
    setUser(userData);
    if (isDemoMode) {
      sessionStorage.setItem('demo_user', JSON.stringify(userData));
    }
  }, [isDemoMode]);

  const handleLogout = useCallback(async () => {
    if (!isDemoMode) {
      await logoutApi();
    } else {
      sessionStorage.removeItem('demo_user');
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
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } else {
        setUser(null);
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
        <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </AuthContext.Provider>
      </DemoContext.Provider>
    </ThemeContext.Provider>
  );
}

