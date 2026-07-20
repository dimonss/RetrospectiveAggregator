import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const REDIRECT_STORAGE_KEY = 'redirect_path';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const fullPath = location.pathname + location.search;
    if (fullPath && fullPath !== '/' && fullPath !== '/dashboard') {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, fullPath);
    }
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const fromLocation = location.state?.from;
    const fromPath = fromLocation ? (fromLocation.pathname + (fromLocation.search || '')) : null;
    const savedPath = sessionStorage.getItem(REDIRECT_STORAGE_KEY);

    const targetPath = fromPath || savedPath;

    if (targetPath && targetPath !== '/' && targetPath !== '/dashboard') {
      sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
      return <Navigate to={targetPath} replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
