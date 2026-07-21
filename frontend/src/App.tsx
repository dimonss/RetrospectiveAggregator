import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, ThemeContext, useTheme } from './context/ThemeContext';
import { AuthProvider, AuthContext, useAuth } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export { AuthContext, ThemeContext, useAuth, useTheme };

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
