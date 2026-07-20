import React, { useState } from 'react';
import { Plus, X, Eye, EyeOff } from 'lucide-react';
import './AddCardForm.css';

interface Props {
  columnId: string;
  columnColor: string;
  defaultAnonymous?: boolean;
  onAdd: (text: string, columnId: string, isAnonymous: boolean) => void;
}

export default function AddCardForm({ columnId, columnColor, defaultAnonymous = false, onAdd }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(defaultAnonymous);

  const submit = () => {
    if (text.trim()) {
      onAdd(text.trim(), columnId, isAnonymous);
      setText('');
      setIsOpen(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setText('');
    }
  };

  if (!isOpen) {
    return (
      <button
        className="add-card-trigger"
        onClick={() => {
          setIsAnonymous(defaultAnonymous);
          setIsOpen(true);
        }}
        id={`btn-add-card-${columnId}`}
        style={{ '--col-color': columnColor } as React.CSSProperties}
      >
        <Plus size={16} />
        <span>Добавить карточку</span>
      </button>
    );
  }

  return (
    <div
      className="add-card-form"
      style={{ '--col-color': columnColor } as React.CSSProperties}
    >
      <textarea
        autoFocus
        placeholder="Опишите вашу мысль..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        className="add-card-textarea"
        id={`input-card-${columnId}`}
        rows={3}
      />
      <div className="add-card-form-hint">Enter — добавить, Shift+Enter — перенос строки</div>
      <div className="add-card-form-btns">
        <button
          type="button"
          className={`add-card-anon-toggle ${isAnonymous ? 'add-card-anon-toggle--on' : ''}`}
          onClick={() => setIsAnonymous(!isAnonymous)}
          id={`btn-toggle-card-anon-${columnId}`}
          title={isAnonymous ? 'Отправить анонимно' : 'Отправить открыто'}
        >
          {isAnonymous ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{isAnonymous ? 'Анонимно' : 'Открыто'}</span>
        </button>

        <div className="add-card-form-actions-right">
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
            onClick={submit}
            id={`btn-submit-card-${columnId}`}
          >
            Добавить
          </button>
          <button
            className="btn-icon"
            onClick={() => { setIsOpen(false); setText(''); }}
            id={`btn-cancel-card-${columnId}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
