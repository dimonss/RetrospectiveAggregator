import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../mocks/data';
import { getMe, logoutApi, type AuthUser } from '../api/auth';
import { clearTokens, getTokens } from '../api/client';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
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
  }, []);

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
