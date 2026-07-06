import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import './AddCardForm.css';

interface Props {
  columnId: string;
  columnColor: string;
  onAdd: (text: string, columnId: string) => void;
}

export default function AddCardForm({ columnId, columnColor, onAdd }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');

  const submit = () => {
    if (text.trim()) {
      onAdd(text.trim(), columnId);
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
        onClick={() => setIsOpen(true)}
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
  );
}
