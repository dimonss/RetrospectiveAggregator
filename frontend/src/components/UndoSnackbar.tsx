import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, X } from 'lucide-react';
import './UndoSnackbar.css';

export interface UndoSnackbarProps {
  message: string;
  onUndo: () => void;
  onTimeout: () => void;
  durationMs?: number;
}

export default function UndoSnackbar({
  message,
  onUndo,
  onTimeout,
  durationMs = 5000,
}: UndoSnackbarProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onTimeout();
      }, 200); // sync with fadeOut animation duration
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onTimeout]);

  const handleUndoClick = () => {
    setIsClosing(true);
    setTimeout(() => {
      onUndo();
    }, 150);
  };

  const handleDismissClick = () => {
    setIsClosing(true);
    setTimeout(() => {
      onTimeout();
    }, 150);
  };

  return (
    <div className={`undo-snackbar-container ${isClosing ? 'closing' : ''}`}>
      <div className="undo-snackbar glass-elevated">
        <div className="undo-snackbar-content">
          <div className="undo-snackbar-icon">
            <Trash2 size={18} />
          </div>
          <span className="undo-snackbar-message">{message}</span>
        </div>
        <div className="undo-snackbar-actions">
          <button
            type="button"
            className="undo-snackbar-btn"
            onClick={handleUndoClick}
            id="btn-undo-delete"
          >
            <RotateCcw size={15} />
            <span>Отменить</span>
          </button>
          <button
            type="button"
            className="undo-snackbar-dismiss"
            onClick={handleDismissClick}
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>
        <div
          className="undo-snackbar-progress"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  );
}
