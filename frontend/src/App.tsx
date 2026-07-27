import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, ThemeContext, useTheme } from './context/ThemeContext';
import { AuthProvider, AuthContext, useAuth } from './context/AuthContext';
import { OfflineProvider, useOffline } from './context/OfflineContext';
import { OfflineBanner } from './components/OfflineBanner';
import AppRoutes from './routes/AppRoutes';

export { AuthContext, ThemeContext, useAuth, useTheme, useOffline };

export default function App() {
  return (
    <ThemeProvider>
      <OfflineProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <OfflineBanner />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </OfflineProvider>
    </ThemeProvider>
  );
}
