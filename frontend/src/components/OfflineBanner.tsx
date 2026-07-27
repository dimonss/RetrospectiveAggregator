import React, { useState } from 'react';
import { useOffline } from '../context/OfflineContext';
import './OfflineBanner.css';

export const OfflineBanner: React.FC = () => {
  const { isOffline, checkConnection } = useOffline();
  const [isChecking, setIsChecking] = useState(false);

  if (!isOffline) {
    return null;
  }

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      await checkConnection();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      {/* Semi-transparent backdrop overlay to block user actions during offline mode */}
      <div className="offline-overlay" role="presentation" aria-hidden="true" />

      <div className="offline-banner-container" role="alert" aria-live="assertive">
        <div className="offline-banner">
          <div className="offline-banner-content">
            <div className="offline-banner-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
              </svg>
            </div>
            <div className="offline-banner-text">
              <div className="offline-banner-title">
                Отсутствует подключение к сети
              </div>
              <span className="offline-banner-description">
                Действия заблокированы для предотвращения потери данных. Соединение восстановится автоматически.
              </span>
            </div>
          </div>
          <div className="offline-banner-action">
            <button
              className="offline-banner-btn"
              onClick={handleRetry}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <span className="offline-spinner" aria-hidden="true" />
                  Проверка...
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6" />
                    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Проверить соединение
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
