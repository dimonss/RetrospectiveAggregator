import { useState, useCallback } from 'react';
import { useAuth, authUserToUser } from '../context/AuthContext';
import { loginWithTelegram, loginWithGoogle } from '../api/auth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import ThemeToggle from '../components/ThemeToggle';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleCallback = useCallback(async (idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginWithGoogle(idToken);
      login(authUserToUser(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации Google');
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const handleTelegramCallback = useCallback(async (user: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginWithTelegram(user);
      login(authUserToUser(response.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации Telegram');
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // Clean SDK hooks
  useGoogleAuth({
    containerId: 'google-real-btn',
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    onSuccess: handleGoogleCallback,
  });

  useTelegramAuth({
    containerId: 'telegram-real-btn',
    botName: import.meta.env.VITE_TELEGRAM_BOT || 'ChalyshAuthBot',
    onSuccess: handleTelegramCallback,
  });

  return (
    <div className="login-page">
      {/* Theme Toggle */}
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="login-container animate-slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <span>🔄</span>
          </div>
          <div className="logo-text">
            <h1 className="gradient-text">Retro</h1>
            <span className="logo-sub">Aggregator</span>
          </div>
        </div>

        <p className="login-tagline">
          Платформа для эффективных ретроспектив.<br/>
          От идей — до действий за один сеанс.
        </p>

        {/* Features pills */}
        <div className="login-features">
          <span className="feature-pill">💡 Анонимный сбор</span>
          <span className="feature-pill">🗂️ Кластеризация</span>
          <span className="feature-pill">🗳️ Голосование</span>
          <span className="feature-pill">📋 Задачи</span>
        </div>

        {/* Auth card */}
        <div className="login-card glass-elevated">
          <h2 className="login-card-title">Войти в платформу</h2>
          <p className="login-card-desc">Выберите удобный способ входа — профиль подтянется автоматически</p>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <div className="login-real-buttons-container">
            <div id="google-real-btn" className="real-auth-btn-wrap" />
            <div id="telegram-real-btn" className="real-auth-btn-wrap" />
          </div>
        </div>

        {/* Participant avatars preview */}
        <div className="login-social-proof">
          <div className="avatars-stack">
            {['seed=a', 'seed=b', 'seed=c', 'seed=d'].map((s, i) => (
              <img
                key={i}
                src={`https://api.dicebear.com/7.x/avataaars/svg?${s}`}
                alt=""
                className="avatar-small"
                style={{ marginLeft: i > 0 ? '-10px' : '0' }}
              />
            ))}
          </div>
          <span className="login-social-text">Уже используют 200+ команд</span>
        </div>
      </div>
    </div>
  );
}
