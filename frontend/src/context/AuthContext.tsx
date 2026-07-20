import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '../mocks/data';
import { getMe, logoutApi, type AuthUser } from '../api/auth';
import { clearTokens, getTokens } from '../api/client';
import { useDemo } from './DemoContext';

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function authUserToUser(authUser: AuthUser): User {
  const name = [authUser.firstName, authUser.lastName].filter(Boolean).join(' ');
  return {
    id: authUser.id,
    name,
    avatar: authUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.username || authUser.id}`,
    color: '#7c3aed',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDemoMode } = useDemo();

  const [user, setUser] = useState<User | null>(() => {
    const savedDemoUser = sessionStorage.getItem('demo_user');
    return savedDemoUser ? JSON.parse(savedDemoUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const prevDemoModeRef = useRef<boolean>(isDemoMode);

  useEffect(() => {
    if (!prevDemoModeRef.current && isDemoMode) {
      setUser(null);
      sessionStorage.removeItem('demo_user');
    }
    prevDemoModeRef.current = isDemoMode;
  }, [isDemoMode]);

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
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
