
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { TEMPLATES, MOCK_ROOM } from '../mocks/data';
import './TemplateModal.css';

interface Props {
  onClose: () => void;
}

export default function TemplateModal({ onClose }: Props) {
  const navigate = useNavigate();

  const handleSelect = (_templateId: string) => {
    // In demo mode — just navigate to the mock room
    navigate(`/retro/${MOCK_ROOM.id}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content template-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Выберите шаблон</h2>
            <p className="modal-subtitle">Шаблон задаёт структуру колонок для вашей ретроспективы</p>
          </div>
          <button className="btn-icon" onClick={onClose} id="btn-close-template-modal">
            <X size={20} />
          </button>
        </div>

        <div className="templates-grid">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              id={`btn-template-${template.id}`}
              className="template-card"
              onClick={() => handleSelect(template.id)}
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

              <div className="template-cta">
                Выбрать <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>

        <div className="modal-footer-note">
          🎯 В демо-режиме откроется готовая сессия с предзаполненными карточками
        </div>
      </div>
    </div>
  );
}
