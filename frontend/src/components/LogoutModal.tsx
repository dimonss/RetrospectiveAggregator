import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth, authUserToUser } from '../context/AuthContext';
import { loginWithGoogle, loginWithTelegram } from '../api/auth';
import { LogOut, AlertTriangle, UserPlus, X } from 'lucide-react';
import './LogoutModal.css';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const { logout, login, availableProviders } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const hasGoogle = availableProviders.includes('google');
  const hasTelegram = availableProviders.includes('telegram');

  // Init Telegram widget if only Google is logged in
  useEffect(() => {
    if (!isOpen || hasTelegram) return;
    const container = document.getElementById('retro-logout-tg-container');
    if (!container) return;

    container.innerHTML = '';
    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || '';

    (window as any).onRetroLogoutTgAuth = async (tgUser: any) => {
      try {
        const res = await loginWithTelegram(tgUser);
        login(authUserToUser(res.user), 'telegram');
      } catch (err) {
        console.error('Telegram auth failed:', err);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onRetroLogoutTgAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    container.appendChild(script);

    return () => {
      delete (window as any).onRetroLogoutTgAuth;
    };
  }, [isOpen, hasTelegram, login]);

  // Init Google button if only Telegram is logged in
  useEffect(() => {
    if (!isOpen || hasGoogle) return;
    const container = document.getElementById('retro-logout-google-container');
    if (!container) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const handleGoogleCallback = async (response: any) => {
      try {
        const res = await loginWithGoogle(response.credential);
        login(authUserToUser(res.user), 'google');
      } catch (err) {
        console.error('Google auth failed:', err);
      }
    };

    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
      google.accounts.id.renderButton(container, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
      });
    }
  }, [isOpen, hasGoogle, login]);


  if (!isOpen) return null;

  const handleLogoutProvider = async (provider: 'google' | 'telegram') => {
    setIsProcessing(true);
    try {
      await logout(provider);
      if (availableProviders.length <= 1) {
        onClose();
        navigate('/login');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsProcessing(true);
    try {
      await logout('all');
      onClose();
      navigate('/login');
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="retro-logout-modal-overlay" onClick={onClose}>
      <div className="retro-logout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="retro-logout-header">
          <div className="retro-logout-header-left">
            <div className="retro-logout-icon-box">
              <LogOut size={22} />
            </div>
            <div>
              <h3 className="retro-logout-title">Выход из аккаунта</h3>
              <div className="retro-logout-subtitle">Управление активными сессиями</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* SSO Alert */}
        <div className="retro-sso-warning">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Сквозная авторизация экосистемы chalysh.pro</strong>
            Выход будет выполнен во всех подключенных веб-приложениях экосистемы
            (HealthChecker, Брелоки, Ретроспектива, Валидатор ТЗ, Space Shooter, ChalyshAuth).
          </div>
        </div>

        {/* Both providers */}
        {hasGoogle && hasTelegram ? (
          <div className="retro-logout-options">
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Выберите вариант выхода:
            </div>

            <div className="retro-logout-option-row">
              <div className="retro-logout-option-info">
                <span className="retro-logout-option-title">🔵 Google</span>
                <span className="retro-logout-option-sub">
                  Выйти из Google во всех сервисах. Telegram останется активным.
                </span>
              </div>
              <button
                disabled={isProcessing}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                onClick={() => handleLogoutProvider('google')}
              >
                Выйти из Google
              </button>
            </div>

            <div className="retro-logout-option-row">
              <div className="retro-logout-option-info">
                <span className="retro-logout-option-title">✈️ Telegram</span>
                <span className="retro-logout-option-sub">
                  Выйти из Telegram во всех сервисах. Google останется активным.
                </span>
              </div>
              <button
                disabled={isProcessing}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                onClick={() => handleLogoutProvider('telegram')}
              >
                Выйти из Telegram
              </button>
            </div>

            <div className="retro-logout-option-row" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}>
              <div className="retro-logout-option-info">
                <span className="retro-logout-option-title" style={{ color: '#f87171' }}>
                  🚪 Выйти со всех сразу
                </span>
                <span className="retro-logout-option-sub">
                  Полный выход из обоих аккаунтов во всех сервисах.
                </span>
              </div>
              <button
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem', background: '#ef4444', borderColor: '#ef4444', whiteSpace: 'nowrap' }}
                onClick={handleLogoutAll}
              >
                Выйти со всех
              </button>
            </div>
          </div>
        ) : (
          /* Single provider */
          <div className="retro-logout-options">
            <div className="retro-logout-option-row">
              <div className="retro-logout-option-info">
                <span className="retro-logout-option-title">
                  {hasGoogle ? '🔵 Google (активен)' : '✈️ Telegram (активен)'}
                </span>
                <span className="retro-logout-option-sub">
                  Текущий аккаунт
                </span>
              </div>
              <button
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem', background: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleLogoutAll}
              >
                Выйти со всех сервисов
              </button>
            </div>

            {/* Add second provider */}
            <div className="retro-add-provider-box">
              <div className="retro-add-provider-header">
                <UserPlus size={16} />
                <span>Войти другим способом</span>
              </div>
              <p className="retro-add-provider-desc">
                {hasGoogle
                  ? 'Вы можете также войти через Telegram, чтобы переключаться между разными профилями:'
                  : 'Вы можете также войти через Google, чтобы переключаться между разными профилями:'}
              </p>
              <div className="retro-add-provider-widget">
                {hasGoogle ? (
                  <div id="retro-logout-tg-container"></div>
                ) : (
                  <div id="retro-logout-google-container"></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="retro-logout-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
            Отмена
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
