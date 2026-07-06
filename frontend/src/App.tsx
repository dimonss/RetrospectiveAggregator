import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RetroPage from './pages/RetroPage';
import SummaryPage from './pages/SummaryPage';
import { type User } from './mocks/data';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}>({ user: null, login: () => {}, logout: () => {} });

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" replace />} />
          <Route path="/retro/:id" element={user ? <RetroPage /> : <Navigate to="/" replace />} />
          <Route path="/retro/:id/summary" element={user ? <SummaryPage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
