import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, RefreshCw, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import type { ToastItem } from '../context/ToastContext';
import './ToastContainer.css';

const SingleToast: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const duration = toast.duration ?? 5000;

  useEffect(() => {
    if (duration <= 0) return; // infinite toast if duration <= 0

    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onDismiss(toast.id);
      }, 250); // wait for fade out CSS animation
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 250);
  };

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
    }
    handleDismiss();
  };

  const renderIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle size={20} className="toast-icon-error" />;
      case 'warning':
        return <AlertTriangle size={20} className="toast-icon-warning" />;
      case 'success':
        return <CheckCircle size={20} className="toast-icon-success" />;
      case 'info':
      default:
        return <Info size={20} className="toast-icon-info" />;
    }
  };

  return (
    <div
      className={`toast-item toast-type-${toast.type} glass-elevated ${isClosing ? 'closing' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-content-wrapper">
        <div className="toast-icon-container">{renderIcon()}</div>
        <div className="toast-text-container">
          {toast.title && <div className="toast-title">{toast.title}</div>}
          <div className="toast-message">{toast.message}</div>
        </div>
        <div className="toast-actions">
          {toast.action && (
            <button
              type="button"
              className="toast-action-btn"
              onClick={handleAction}
            >
              <RefreshCw size={14} />
              <span>{toast.action.label}</span>
            </button>
          )}
          <button
            type="button"
            className="toast-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {duration > 0 && (
        <div
          className="toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-label="Уведомления системы">
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};
