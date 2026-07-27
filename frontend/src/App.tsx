import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, ThemeContext, useTheme } from './context/ThemeContext';
import { AuthProvider, AuthContext, useAuth } from './context/AuthContext';
import { OfflineProvider, useOffline } from './context/OfflineContext';
import { ToastProvider, useToast, showGlobalToast } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import AppRoutes from './routes/AppRoutes';

export { AuthContext, ThemeContext, useAuth, useTheme, useOffline, useToast };

function GlobalUnhandledErrorListener() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      const message =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === 'string'
          ? event.reason
          : 'Сбой выполнения асинхронного действия';

      showGlobalToast({
        type: 'error',
        title: 'Непредвиденный сбой',
        message,
        duration: 6000,
      });
    };

    const handleWindowError = (event: ErrorEvent) => {
      console.error('Global Window Error:', event.error || event.message);
      // Avoid spamming user for minor script loading error if already handled
      if (event.message?.includes('ResizeObserver')) return;

      showGlobalToast({
        type: 'error',
        title: 'Ошибка приложения',
        message: event.message || 'Произошла ошибка выполнения скрипта',
        duration: 6000,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <OfflineProvider>
            <AuthProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <GlobalUnhandledErrorListener />
                <ToastContainer />
                <OfflineBanner />
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </OfflineProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
