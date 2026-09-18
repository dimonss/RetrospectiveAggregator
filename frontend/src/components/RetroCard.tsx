import React, { useState } from 'react';
import { ThumbsUp, Plus, Trash2, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { type RetroCard, type Stage, MOCK_USERS } from '../mocks/data';
import { useAuth } from '../context/AuthContext';
import './RetroCard.css';

const NOTE_COLORS = ['#fef3c7', '#fce7f3', '#dcfce7', '#dbeafe', '#ede9fe'];
const NOTE_TEXT_COLORS = ['#92400e', '#9d174d', '#166534', '#1e3a8a', '#4c1d95'];

function formatTasksCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${count} задач`;
  if (mod10 === 1) return `${count} задача`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} задачи`;
  return `${count} задач`;
}

interface Props {
  card: RetroCard;
  stage: Stage;
  isFacilitator?: boolean;
  currentUserId: string;
  userVotesLeft: number;
  columnColor: string;
  cardIndex: number;
  isGrouped?: boolean;
  participants?: Array<{ id: string; name: string; avatar: string; color?: string }>;
  onVote: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onAddActionItem: (cardId: string, text: string, assigneeId: string) => void;
  onDeleteActionItem?: (actionItemId: string) => void;
  isDragging?: boolean;
  isDeleting?: boolean;
}

export default function RetroCard({
  card, stage, isFacilitator, currentUserId, userVotesLeft,
  columnColor, cardIndex, isGrouped, participants,
  onVote, onDelete, onAddActionItem, onDeleteActionItem, isDragging, isDeleting
}: Props) {
  const { user: currentUser } = useAuth();
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
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);

  const isDeletingCard = isDeleting || isDeletingLocal;

  const author = (currentUser && card.authorId === currentUser.id)
    ? currentUser
    : (participants?.find(u => u.id === card.authorId) || MOCK_USERS.find(u => u.id === card.authorId));

  const userList = (participants && participants.length > 0)
    ? participants
    : (currentUser ? [{ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }] : MOCK_USERS);

  const submitAction = () => {
    if (actionText.trim()) {
      const selectedAssignee = assigneeId || userList[0]?.id || currentUserId;
      onAddActionItem(card.id, actionText.trim(), selectedAssignee);
      setActionText('');
      setShowActionForm(false);
      setShowActions(true);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeletingCard) return;
    setIsDeletingLocal(true);
    onDelete(card.id);
  };

  return (
    <div
      className={[
        'retro-card',
        isDragging ? 'retro-card--dragging' : '',
        isDeletingCard ? 'retro-card--deleting' : '',
        isGrouped ? 'retro-card--grouped' : '',
        isMine ? 'retro-card--mine' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--note-color': bgColor, '--note-text': textColor } as React.CSSProperties}
    >
      {/* Mine badge */}
      {isMine && (
        <div className="card-mine-badge" style={{ background: columnColor }}>Моя</div>
      )}

      {/* Card text */}
      <p className="card-text">{card.text}</p>

      {/* Author */}
      {card.isAnonymous ? (
        <div className="card-author card-author--anon">
          <span className="card-author-name">Аноним</span>
        </div>
      ) : (
        <div className="card-author">
          {author?.avatar && (
            <img
              src={author.avatar}
              alt={author.name}
              className="card-author-avatar"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <span className="card-author-name">{author?.name || 'Участник'}</span>
        </div>
      )}

      {/* Footer */}
      <div className="card-footer">
        {/* Votes */}
        {(stage === 'voting' || stage === 'discussion') && (
          <button
            className={`card-vote-btn ${hasVoted ? 'card-vote-btn--voted' : ''} ${stage === 'voting' && (canVote || hasVoted) ? 'card-vote-btn--can-vote' : ''}`}
            onClick={() => stage === 'voting' && (canVote || hasVoted) && onVote(card.id)}
            disabled={stage !== 'voting' || (!canVote && !hasVoted) || isDeletingCard}
            id={`btn-vote-${card.id}`}
          >
            <ThumbsUp size={13} />
            <span>{card.votes.length}</span>
          </button>
        )}

        {/* Actions */}
        <div className="card-actions">
          {(isMine || isFacilitator) && (
            <button
              className="card-action-btn card-action-btn--danger"
              onClick={handleDeleteClick}
              disabled={isDeletingCard}
              id={`btn-delete-${card.id}`}
              title="Удалить"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Action Items */}
      {card.actionItems && card.actionItems.length > 0 ? (
        <div className="card-action-items">
          <div className="card-action-items-header">
            <button
              type="button"
              className="card-action-items-toggle"
              onClick={() => setShowActions(!showActions)}
            >
              <span className="card-tasks-badge card-tasks-badge--has-items">
                <CheckSquare size={13} className="card-tasks-icon" />
                <span>{formatTasksCount(card.actionItems.length)}</span>
              </span>
              {showActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {stage === 'discussion' && isFacilitator && (
              <button
                type="button"
                className={`card-add-task-btn card-add-task-btn--compact ${showActionForm ? 'card-add-task-btn--active' : ''}`}
                onClick={() => setShowActionForm(!showActionForm)}
                disabled={isDeletingCard}
                id={`btn-add-action-${card.id}`}
                title={showActionForm ? 'Скрыть форму' : 'Добавить задачу к карточке'}
              >
                <Plus size={13} />
                <span>Добавить</span>
              </button>
            )}
          </div>

          {showActions && (
            <ul className="action-items-list">
              {card.actionItems.map((ai) => {
                const assignee = userList.find(u => u.id === ai.assigneeId) || (currentUser && currentUser.id === ai.assigneeId ? currentUser : undefined);
                const avatarUrl = assignee?.avatar || (ai.assigneeId ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${ai.assigneeId}` : undefined);
                return (
                  <li key={ai.id} className="action-item">
                    <span className="action-item-check">☐</span>
                    <span className="action-item-text">{ai.text}</span>
                    <div className="action-item-assignee-tag">
                      {avatarUrl && (
                        <img
                          src={avatarUrl}
                          alt={assignee?.name || 'Исполнитель'}
                          className="action-item-assignee-avatar"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span>{assignee?.name?.split(' ')[0] || 'Не назначен'}</span>
                    </div>
                    {isFacilitator && onDeleteActionItem && (
                      <button
                        type="button"
                        className="action-item-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteActionItem(ai.id);
                        }}
                        title="Удалить задачу"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        stage === 'discussion' && (
          <div className="card-action-items card-action-items--empty-discussion">
            <span className="card-tasks-badge card-tasks-badge--empty">
              <CheckSquare size={13} className="card-tasks-icon" />
              <span>0 задач</span>
            </span>
            {isFacilitator && (
              <button
                type="button"
                className={`card-add-task-btn ${showActionForm ? 'card-add-task-btn--active' : ''}`}
                onClick={() => setShowActionForm(!showActionForm)}
                disabled={isDeletingCard}
                id={`btn-add-action-${card.id}`}
                title={showActionForm ? 'Скрыть форму' : 'Добавить задачу к карточке'}
              >
                <Plus size={13} />
                <span>Добавить задачу</span>
              </button>
            )}
          </div>
        )
      )}

      {/* Add action form */}
      {showActionForm && (
        <div className="card-action-form">
          <textarea
            placeholder="Что нужно сделать? (Ctrl+Enter для сохранения)"
            value={actionText}
            onChange={(e) => setActionText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                submitAction();
              } else if (e.key === 'Escape') {
                setShowActionForm(false);
              }
            }}
            className="action-form-input"
            id={`action-text-${card.id}`}
            rows={2}
            autoFocus
          />
          <div className="action-form-assignees">
            <span className="action-form-assignees-label">Исполнитель:</span>
            <div className="assignee-chips">
              {userList.map(u => {
                const isSelected = (assigneeId || userList[0]?.id) === u.id;
                const avatarUrl = u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`;
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`assignee-chip ${isSelected ? 'assignee-chip--selected' : ''}`}
                    onClick={() => setAssigneeId(u.id)}
                    title={u.name}
                  >
                    <img src={avatarUrl} alt={u.name} className="assignee-chip-avatar" />
                    <span className="assignee-chip-name">{u.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
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
