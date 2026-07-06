import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { CURRENT_USER } from '../mocks/data';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // Mock Google login
    login(CURRENT_USER);
    navigate('/dashboard');
  };

  const handleTelegramLogin = () => {
    // Mock Telegram login
    login({ ...CURRENT_USER, name: 'TG Пользователь', id: 'u-tg' });
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
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
          <span className="feature-pill">📋 Action Items</span>
        </div>

        {/* Auth card */}
        <div className="login-card glass-elevated">
          <h2 className="login-card-title">Войти в платформу</h2>
          <p className="login-card-desc">Выберите удобный способ входа — профиль подтянется автоматически</p>

          <div className="login-buttons">
            <button
              id="btn-google-login"
              className="auth-btn auth-btn-google"
              onClick={handleGoogleLogin}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.4 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.4C9.8 37.4 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Войти через Google
            </button>

            <button
              id="btn-telegram-login"
              className="auth-btn auth-btn-telegram"
              onClick={handleTelegramLogin}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.267l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.292z"/>
              </svg>
              Войти через Telegram
            </button>
          </div>

          <p className="login-demo-note">
            🎯 Демо-режим: авторизация не настоящая, все данные — моки
          </p>
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
