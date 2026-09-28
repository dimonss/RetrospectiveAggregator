import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../mocks/data';
import { getMe, logoutApi, type AuthUser } from '../api/auth';
import { clearTokens, getTokens, setOnUnauthorized, getActiveProvider, getAvailableProviders, setActiveProvider, type AuthProviderType } from '../api/client';

export interface AuthContextType {
  user: User | null;
  activeProvider: AuthProviderType | null;
  availableProviders: AuthProviderType[];
  login: (user: User, provider?: AuthProviderType) => void;
  logout: (target?: AuthProviderType | 'all') => Promise<void>;
  switchProvider: (provider: AuthProviderType) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  activeProvider: null,
  availableProviders: [],
  login: () => {},
  logout: async () => {},
  switchProvider: async () => {},
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
  const [activeProvider, setActiveProv] = useState<AuthProviderType | null>(() => getActiveProvider());
  const [availableProviders, setAvailableProviders] = useState<AuthProviderType[]>(() => getAvailableProviders());

  const handleLogin = useCallback((userData: User, provider?: AuthProviderType) => {
    setUser(userData);
    setActiveProv(provider || getActiveProvider());
    setAvailableProviders(getAvailableProviders());
  }, []);

  const handleLogout = useCallback(async (target?: AuthProviderType | 'all') => {
    try {
      await logoutApi(target);
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      clearTokens(target);
      const remaining = getActiveProvider();
      if (remaining) {
        setActiveProv(remaining);
        setAvailableProviders(getAvailableProviders());
        try {
          const profile = await getMe();
          setUser(authUserToUser(profile));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        setActiveProv(null);
        setAvailableProviders([]);
      }
    }
  }, []);


  const refreshUser = useCallback(async () => {
    const { accessToken, provider } = getTokens();
    setActiveProv(provider);
    setAvailableProviders(getAvailableProviders());
    if (accessToken) {
      try {
        const profile = await getMe();
        setUser(authUserToUser(profile));
      } catch {
        clearTokens();
        setUser(null);
        setActiveProv(getActiveProvider());
        setAvailableProviders(getAvailableProviders());
      } finally {
        setIsLoading(false);
      }
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const switchProvider = useCallback(async (provider: AuthProviderType) => {
    setActiveProvider(provider);
    setActiveProv(provider);
    setIsLoading(true);
    const { accessToken } = getTokens();
    if (accessToken) {
      try {
        const profile = await getMe();
        setUser(authUserToUser(profile));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setActiveProv(getActiveProvider());
      setAvailableProviders(getAvailableProviders());
    });
    return () => {
      setOnUnauthorized(null);
    };
  }, []);

  useEffect(() => {
    refreshUser();

    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes('accessToken') || e.key?.includes('auth_provider')) {
        refreshUser();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshUser]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProvider,
        availableProviders,
        login: handleLogin,
        logout: handleLogout,
        switchProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
