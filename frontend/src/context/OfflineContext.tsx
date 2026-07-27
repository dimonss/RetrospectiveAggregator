import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface OfflineContextType {
  isOffline: boolean;
  checkConnection: () => Promise<boolean>;
  reportNetworkError: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Module-level listener trigger for API client integration
let globalReportOffline: (() => void) | null = null;

export function notifyNetworkError() {
  if (globalReportOffline) {
    globalReportOffline();
  }
}

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const reportNetworkError = useCallback(() => {
    setIsOffline(true);
  }, []);

  useEffect(() => {
    globalReportOffline = reportNetworkError;
    return () => {
      globalReportOffline = null;
    };
  }, [reportNetworkError]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return false;
    }

    try {
      // Small HEAD or GET request to verify actual network connectivity
      const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
        ? import.meta.env.BASE_URL 
        : `${import.meta.env.BASE_URL}/`;
      const response = await fetch(`${baseUrl}favicon.ico?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const online = response.ok || response.status < 500;
      setIsOffline(!online);
      return online;
    } catch {
      setIsOffline(true);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      checkConnection();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  return (
    <OfflineContext.Provider value={{ isOffline, checkConnection, reportNetworkError }}>
      {children}
    </OfflineContext.Provider>
  );
};

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
