import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = import.meta.env.BASE_URL;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-wrapper">
          <div className="error-boundary-backdrop" />
          <div className="error-boundary-card glass-elevated" role="alert" aria-live="assertive">
            <div className="error-boundary-icon-wrapper">
              <AlertOctagon size={48} className="error-boundary-icon" />
            </div>
            
            <h1 className="error-boundary-title">Приложение столкнулось с ошибкой</h1>
            
            <p className="error-boundary-description">
              Произошёл непредвиденный сбой в работе интерфейса. Все данные сохранены, попробуйте обновить страницу или повторить попытку.
            </p>

            {this.state.error && (
              <div className="error-boundary-details">
                <div className="error-boundary-details-header">Технические детали:</div>
                <div className="error-boundary-message">{this.state.error.message || 'Неизвестная ошибка'}</div>
              </div>
            )}

            <div className="error-boundary-actions">
              <button
                type="button"
                className="error-boundary-btn primary"
                onClick={this.handleReset}
              >
                <RefreshCw size={16} />
                <span>Попробовать снова</span>
              </button>
              <button
                type="button"
                className="error-boundary-btn secondary"
                onClick={this.handleReload}
              >
                <span>Перезагрузить страницу</span>
              </button>
              <button
                type="button"
                className="error-boundary-btn secondary"
                onClick={this.handleGoHome}
              >
                <Home size={16} />
                <span>На главную</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
