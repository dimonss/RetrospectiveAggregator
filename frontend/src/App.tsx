import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, ThemeContext, useTheme } from './context/ThemeContext';
import { DemoProvider, DemoContext, useDemo } from './context/DemoContext';
import { AuthProvider, AuthContext, useAuth } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export { AuthContext, ThemeContext, DemoContext, useAuth, useTheme, useDemo };

export default function App() {
  return (
    <ThemeProvider>
      <DemoProvider>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </DemoProvider>
    </ThemeProvider>
  );
}
