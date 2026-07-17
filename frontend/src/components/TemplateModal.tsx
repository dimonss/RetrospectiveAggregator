import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { TEMPLATES, MOCK_ROOM, type TemplateId } from '../mocks/data';
import { DemoContext } from '../App';
import { createRoomApi } from '../api/rooms';
import './TemplateModal.css';

interface Props {
  onClose: () => void;
}

export default function TemplateModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { isDemoMode } = useContext(DemoContext);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('went-well');
  const [roomName, setRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (isDemoMode) {
      navigate(`/retro/${MOCK_ROOM.id}`);
      onClose();
      return;
    }

    const finalName = roomName.trim() || `Ретроспектива ${new Date().toLocaleDateString('ru-RU')}`;
    setIsLoading(true);
    setError(null);

    try {
      const room = await createRoomApi({
        name: finalName,
        template: selectedTemplate,
        anonymousMode: false,
      });
      navigate(`/retro/${room.id}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании ретроспективы');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content template-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Создание ретроспективы</h2>
            <p className="modal-subtitle">Укажите название и выберите шаблон колонок</p>
          </div>
          <button className="btn-icon" onClick={onClose} id="btn-close-template-modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            ⚠️ {error}
          </div>
        )}

        <div className="room-name-field">
          <label htmlFor="input-room-name" className="room-name-label">
            Название встречи
          </label>
          <input
            id="input-room-name"
            type="text"
            className="room-name-input glass"
            placeholder={`Например: Спринт ${new Date().toLocaleDateString('ru-RU')}`}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>

        <div className="templates-grid">
          {TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                id={`btn-template-${template.id}`}
                className={`template-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-emoji">{template.emoji}</div>
                <h3 className="template-name">{template.name}</h3>
                <p className="template-desc">{template.description}</p>

                {/* Columns preview */}
                <div className="template-columns-preview">
                  {template.columns.map((col, i) => (
                    <div
                      key={i}
                      className="template-col-pill"
                      style={{ background: `${col.color}20`, border: `1px solid ${col.color}40`, color: col.color }}
                    >
                      {col.emoji} {col.title.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            id="btn-confirm-create-room"
            className="btn-primary"
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Создаём...
              </>
            ) : (
              <>
                Создать комнату <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {isDemoMode && (
          <div className="modal-footer-note">
            🎯 В демо-режиме откроется готовая сессия с предзаполненными карточками
          </div>
        )}
      </div>
    </div>
  );
}
