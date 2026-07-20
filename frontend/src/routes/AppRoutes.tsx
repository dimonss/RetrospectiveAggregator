import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import RetroPage from '../pages/RetroPage';
import SummaryPage from '../pages/SummaryPage';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';

export default function AppRoutes() {
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
