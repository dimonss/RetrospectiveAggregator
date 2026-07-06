import React, { useState } from 'react';
import { ThumbsUp, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { type RetroCard, type Stage, MOCK_USERS } from '../mocks/data';
import './RetroCard.css';

const NOTE_COLORS = ['#fef3c7', '#fce7f3', '#dcfce7', '#dbeafe', '#ede9fe'];
const NOTE_TEXT_COLORS = ['#92400e', '#9d174d', '#166534', '#1e3a8a', '#4c1d95'];

interface Props {
  card: RetroCard;
  stage: Stage;
  currentUserId: string;
  anonymousMode: boolean;
  userVotesLeft: number;
  columnColor: string;
  cardIndex: number;
  isGrouped?: boolean;
  onVote: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onAddActionItem: (cardId: string, text: string, assigneeId: string) => void;
  isDragging?: boolean;
}

export default function RetroCard({
  card, stage, currentUserId, anonymousMode, userVotesLeft,
  columnColor, cardIndex, isGrouped,
  onVote, onDelete, onAddActionItem, isDragging
}: Props) {
  const colorIdx = cardIndex % NOTE_COLORS.length;
  const bgColor = NOTE_COLORS[colorIdx];
  const textColor = NOTE_TEXT_COLORS[colorIdx];

  const isMine = card.authorId === currentUserId;
  const hasVoted = card.votes.includes(currentUserId);
  const canVote = stage === 'voting' && !hasVoted && userVotesLeft > 0;

  const [showActionForm, setShowActionForm] = useState(false);
  const [actionText, setActionText] = useState('');
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [showActions, setShowActions] = useState(false);

  const author = MOCK_USERS.find(u => u.id === card.authorId);

  const submitAction = () => {
    if (actionText.trim()) {
      onAddActionItem(card.id, actionText.trim(), assigneeId);
      setActionText('');
      setShowActionForm(false);
    }
  };

  return (
    <div
      className={[
        'retro-card',
        isDragging ? 'retro-card--dragging' : '',
        isGrouped ? 'retro-card--grouped' : '',
        isMine ? 'retro-card--mine' : '',
      ].join(' ')}
      style={{ '--note-color': bgColor, '--note-text': textColor } as React.CSSProperties}
    >
      {/* Mine badge */}
      {isMine && (
        <div className="card-mine-badge" style={{ background: columnColor }}>Моя</div>
      )}

      {/* Card text */}
      <p className="card-text">{card.text}</p>

      {/* Author */}
      {!anonymousMode && (
        <div className="card-author">
          <img
            src={author?.avatar}
            alt={author?.name}
            className="card-author-avatar"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="card-author-name">{author?.name || 'Аноним'}</span>
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        {/* Votes */}
        {(stage === 'voting' || stage === 'discussion') && (
          <button
            className={`card-vote-btn ${hasVoted ? 'card-vote-btn--voted' : ''} ${canVote ? 'card-vote-btn--can-vote' : ''}`}
            onClick={() => canVote && onVote(card.id)}
            disabled={!canVote && !hasVoted}
            id={`btn-vote-${card.id}`}
          >
            <ThumbsUp size={13} />
            <span>{card.votes.length}</span>
          </button>
        )}

        {/* Actions */}
        <div className="card-actions">
          {stage === 'discussion' && (
            <button
              className="card-action-btn"
              onClick={() => setShowActionForm(!showActionForm)}
              id={`btn-add-action-${card.id}`}
              title="Добавить задачу"
            >
              <Plus size={14} />
            </button>
          )}
          {isMine && (
            <button
              className="card-action-btn card-action-btn--danger"
              onClick={() => onDelete(card.id)}
              id={`btn-delete-${card.id}`}
              title="Удалить"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Action Items */}
      {card.actionItems && card.actionItems.length > 0 && (
        <div className="card-action-items">
          <button
            className="card-action-items-toggle"
            onClick={() => setShowActions(!showActions)}
          >
            <span>📋 {card.actionItems.length} задач</span>
            {showActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showActions && (
            <ul className="action-items-list">
              {card.actionItems.map((ai) => {
                const assignee = MOCK_USERS.find(u => u.id === ai.assigneeId);
                return (
                  <li key={ai.id} className="action-item">
                    <span className="action-item-check">☐</span>
                    <span className="action-item-text">{ai.text}</span>
                    <span className="action-item-assignee">{assignee?.name?.split(' ')[0]}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Add action form */}
      {showActionForm && (
        <div className="card-action-form">
          <textarea
            placeholder="Что нужно сделать?"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            className="action-form-input"
            id={`action-text-${card.id}`}
            rows={2}
          />
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="action-form-select"
            id={`action-assignee-${card.id}`}
          >
            {MOCK_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="action-form-btns">
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={submitAction}>
              Добавить
            </button>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => setShowActionForm(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
