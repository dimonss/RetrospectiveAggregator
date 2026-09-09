import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Copy, ArrowLeft, CheckSquare, Loader2, Home, Trash2, MessageSquare, Send } from 'lucide-react';
import { MOCK_ROOM, MOCK_USERS, type ActionItem, type RetroRoom } from '../mocks/data';
import { getRoomApi, toggleActionItemDoneApi, deleteActionItemApi, addActionItemCommentApi, deleteActionItemCommentApi } from '../api/rooms';
import { useAuth } from '../context/AuthContext';
import { showGlobalToast } from '../context/ToastContext';
import ThemeToggle from '../components/ThemeToggle';
import UndoSnackbar from '../components/UndoSnackbar';
import './SummaryPage.css';

function buildSummaryData(room: RetroRoom) {
  const allActionItems: Array<ActionItem & { cardText: string; cardId: string }> = [];

  room.cards.forEach(card => {
    (card.actionItems || []).forEach(ai => {
      allActionItems.push({
        ...ai,
        comments: ai.comments || [],
        cardText: card.text,
        cardId: card.id,
      });
    });
  });

  return allActionItems;
}

function generateMarkdown(
  room: RetroRoom,
  items: ReturnType<typeof buildSummaryData>,
  participantsList?: Array<{ id: string; name: string; avatar: string }>,
  checkedItems?: Set<string>
) {
  const date = new Date(room.createdAt || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const pList = (participantsList && participantsList.length > 0) ? participantsList : (room.participants || MOCK_USERS);
  const lines = [
    `# 🔄 Ретроспектива: ${room.name}`,
    `*${date}*`,
    '',
    '## 📋 Задачи',
    '',
    ...items.flatMap(ai => {
      const assignee = pList.find(u => u.id === ai.assigneeId) || MOCK_USERS.find(u => u.id === ai.assigneeId);
      const isDone = checkedItems ? checkedItems.has(ai.id) : ai.done;
      const itemLines = [`- [${isDone ? 'x' : ' '}] ${ai.text} *(${assignee?.name || 'Не назначен'})*`];
      if (ai.comments && ai.comments.length > 0) {
        ai.comments.forEach(c => {
          itemLines.push(`  - 💬 ${c.userName || 'Участник'}: ${c.text}`);
        });
      }
      return itemLines;
    }),
    '',
    '---',
    '_Сгенерировано платформой RetroAggregator_',
  ];
  return lines.join('\n');
}

interface PendingItemDeletion {
  cardId: string;
  actionItem: ActionItem;
  index: number;
}

export default function SummaryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [room, setRoom] = useState<RetroRoom>(MOCK_ROOM);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeletion, setPendingDeletion] = useState<PendingItemDeletion | null>(null);
  const pendingDeletionRef = useRef<PendingItemDeletion | null>(null);

  useEffect(() => {
    return () => {
      if (pendingDeletionRef.current) {
        deleteActionItemApi(pendingDeletionRef.current.actionItem.id).catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getRoomApi(id)
        .then((data) => {
          const mappedCards = data.cards.map((c) => ({
            id: c.id,
            text: c.text,
            authorId: c.authorId,
            columnId: c.columnId,
            votes: c.votes,
            clusterId: c.clusterId || undefined,
            isAnonymous: c.isAnonymous,
            actionItems: (c.actionItems || []).map(ai => ({
              id: ai.id,
              text: ai.text,
              assigneeId: ai.assigneeId || '',
              done: ai.done,
              comments: (ai.comments || []).map(comm => ({
                id: comm.id,
                actionItemId: comm.actionItemId,
                userId: comm.userId,
                userName: comm.userName,
                userAvatar: comm.userAvatar,
                text: comm.text,
                createdAt: comm.createdAt,
              })),
            })),
          }));

          const initialChecked = new Set<string>();
          mappedCards.forEach(c => {
            c.actionItems.forEach(ai => {
              if (ai.done) initialChecked.add(ai.id);
            });
          });
          setCheckedItems(initialChecked);

          setRoom({
            id: data.id,
            name: data.name,
            template: data.template,
            stage: data.stage,
            facilitatorId: data.facilitatorId,
            participantIds: data.participantIds,
            participants: data.participants || [],
            anonymousMode: data.anonymousMode,
            createdAt: data.createdAt,
            columns: data.columns,
            clusters: [],
            cards: mappedCards,
          });
        })
        .catch((err) => console.error('Error fetching room summary:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const toggleComments = (actionItemId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(actionItemId)) {
        next.delete(actionItemId);
      } else {
        next.add(actionItemId);
      }
      return next;
    });
  };

  const handleAddComment = async (actionItemId: string) => {
    const text = (commentDrafts[actionItemId] || '').trim();
    if (!text || submittingComment[actionItemId]) return;

    setSubmittingComment(prev => ({ ...prev, [actionItemId]: true }));
    try {
      const newComment = await addActionItemCommentApi(actionItemId, text);
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(card => ({
          ...card,
          actionItems: (card.actionItems || []).map(ai => {
            if (ai.id !== actionItemId) return ai;
            return {
              ...ai,
              comments: [...(ai.comments || []), newComment],
            };
          }),
        })),
      }));
      setCommentDrafts(prev => ({ ...prev, [actionItemId]: '' }));
      setExpandedComments(prev => new Set(prev).add(actionItemId));
    } catch (err) {
      console.error('Failed to add comment:', err);
      showGlobalToast({ message: 'Не удалось добавить комментарий', type: 'error' });
    } finally {
      setSubmittingComment(prev => ({ ...prev, [actionItemId]: false }));
    }
  };

  const handleDeleteComment = async (actionItemId: string, commentId: string) => {
    if (!window.confirm('Удалить этот комментарий?')) {
      return;
    }
    setDeletingCommentId(commentId);
    try {
      await deleteActionItemCommentApi(commentId);
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(card => ({
          ...card,
          actionItems: (card.actionItems || []).map(ai => {
            if (ai.id !== actionItemId) return ai;
            return {
              ...ai,
              comments: (ai.comments || []).filter(c => c.id !== commentId),
            };
          }),
        })),
      }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      showGlobalToast({ message: 'Не удалось удалить комментарий', type: 'error' });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isFacilitator = user?.id === room.facilitatorId;
  const participantsList = (room.participants && room.participants.length > 0)
    ? room.participants
    : (user ? [{ id: user.id, name: user.name, avatar: user.avatar }] : MOCK_USERS);

  const actionItems = buildSummaryData(room);

  const topCards = [...room.cards]
    .sort((a, b) => b.votes.length - a.votes.length)
    .slice(0, 5);

  const handleCopy = () => {
    const md = generateMarkdown(room, actionItems, participantsList, checkedItems);
    navigator.clipboard.writeText(md).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commitPendingDeletion = async (pending: PendingItemDeletion) => {
    try {
      await deleteActionItemApi(pending.actionItem.id);
    } catch (err) {
      console.error('Failed to commit deletion:', err);
    }
  };

  const handleDeleteActionItem = (actionItemId: string) => {
    let parentCardId = '';
    let foundItem: ActionItem | undefined;
    let itemIndex = -1;

    for (const c of room.cards) {
      const idx = (c.actionItems || []).findIndex(ai => ai.id === actionItemId);
      if (idx !== -1) {
        parentCardId = c.id;
        foundItem = c.actionItems![idx];
        itemIndex = idx;
        break;
      }
    }

    if (!foundItem || !parentCardId) return;

    if (pendingDeletionRef.current) {
      commitPendingDeletion(pendingDeletionRef.current);
    }

    setRoom(prev => ({
      ...prev,
      cards: prev.cards.map(c => ({
        ...c,
        actionItems: (c.actionItems || []).filter(ai => ai.id !== actionItemId),
      })),
    }));

    const nextPending: PendingItemDeletion = {
      cardId: parentCardId,
      actionItem: foundItem,
      index: itemIndex,
    };
    pendingDeletionRef.current = nextPending;
    setPendingDeletion(nextPending);
  };

  const handleUndo = () => {
    const pending = pendingDeletionRef.current;
    if (!pending) return;

    const { cardId, actionItem, index } = pending;
    setRoom(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id !== cardId) return c;
        const currentItems = [...(c.actionItems || [])];
        const insertAt = Math.min(index, currentItems.length);
        currentItems.splice(insertAt, 0, actionItem);
        return { ...c, actionItems: currentItems };
      }),
    }));

    pendingDeletionRef.current = null;
    setPendingDeletion(null);
  };

  const handleTimeout = () => {
    const pending = pendingDeletionRef.current;
    if (pending) {
      commitPendingDeletion(pending);
      pendingDeletionRef.current = null;
      setPendingDeletion(null);
    }
  };

  const toggleCheck = async (actionItemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(actionItemId)) {
        next.delete(actionItemId);
      } else {
        next.add(actionItemId);
      }
      return next;
    });

    try {
      await toggleActionItemDoneApi(actionItemId);
    } catch (err) {
      console.error('Failed to toggle action item state:', err);
      setCheckedItems(prev => {
        const next = new Set(prev);
        if (next.has(actionItemId)) {
          next.delete(actionItemId);
        } else {
          next.add(actionItemId);
        }
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="summary-page-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <Loader2 size={28} className="animate-spin loader-svg" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Загрузка итогов...</span>
      </div>
    );
  }

  return (
    <div className="summary-page">
      {/* Header */}
      <header className="summary-header glass-elevated">
        <div className="summary-header-left">
          <Link to={`/retro/${id}`} className="btn-icon" id="btn-back-retro" title="Назад к ретроспективе">
            <ArrowLeft size={18} />
          </Link>
          <Link to="/dashboard" className="btn-secondary" id="btn-go-home" title="Выйти на главную страницу" style={{ padding: '8px 14px', fontSize: '13px' }}>
            <Home size={16} />
            <span>На главную</span>
          </Link>
          <div>
            <h1 className="summary-title">Итоги ретроспективы</h1>
            <p className="summary-subtitle">{room.name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ThemeToggle />
          <button
            id="btn-copy-summary"
            className="btn-primary"
            onClick={handleCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Скопировать для Telegram/Slack'}
          </button>
        </div>
      </header>

      <main className="summary-main">
        <div className="summary-grid">
          {/* Action Items */}
          <section className="summary-section" id="section-action-items">
            <div className="section-title">
              <CheckSquare size={20} style={{ color: '#7c3aed' }} />
              <h2>Задачи</h2>
              <span className="badge badge-purple">{actionItems.length}</span>
            </div>

            <div className="action-items-cards">
              {actionItems.map((item) => {
                const assignee = participantsList.find(u => u.id === item.assigneeId)
                  || (user && user.id === item.assigneeId ? user : undefined)
                  || MOCK_USERS.find(u => u.id === item.assigneeId);
                const avatarUrl = assignee?.avatar || (item.assigneeId ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.assigneeId}` : undefined);
                const isDone = checkedItems.has(item.id);
                const commentsCount = item.comments?.length || 0;
                const isCommentsOpen = expandedComments.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`action-card glass ${isDone ? 'action-card--done' : ''}`}
                    id={`action-card-${item.id}`}
                  >
                    <div className="action-card-main">
                      <div
                        className="action-card-check"
                        role="checkbox"
                        aria-checked={isDone}
                        aria-label={`Отметить задачу «${item.text}» как ${isDone ? 'невыполненную' : 'выполненную'}`}
                        tabIndex={0}
                        onClick={() => toggleCheck(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            toggleCheck(item.id);
                          }
                        }}
                      >
                        {isDone ? (
                          <div className="check-done">✓</div>
                        ) : (
                          <div className="check-empty" />
                        )}
                      </div>
                      <div
                        className="action-card-content"
                        onClick={() => toggleCheck(item.id)}
                      >
                        <p className="action-card-text">{item.text}</p>
                        <p className="action-card-source">↩ {item.cardText}</p>
                      </div>
                      <div className="action-card-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="action-card-assignee">
                          {avatarUrl && (
                            <img
                              src={avatarUrl}
                              alt={assignee?.name || 'Ответственный'}
                              className="assignee-avatar"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          <span className="assignee-name">{assignee?.name?.split(' ')[0] || 'Не назначен'}</span>
                        </div>
                        <button
                          type="button"
                          className={`action-card-comment-btn ${commentsCount > 0 ? 'has-comments' : ''} ${isCommentsOpen ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComments(item.id);
                          }}
                          title={commentsCount > 0 ? `Комментарии (${commentsCount})` : 'Добавить комментарий'}
                          id={`btn-comments-${item.id}`}
                        >
                          <MessageSquare size={14} />
                          {commentsCount > 0 && <span className="comment-badge">{commentsCount}</span>}
                        </button>
                        {isFacilitator && (
                          <button
                            type="button"
                            className="action-card-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteActionItem(item.id);
                            }}
                            title="Удалить задачу"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isCommentsOpen && (
                      <div
                        className="action-comments-section"
                        onClick={(e) => e.stopPropagation()}
                        id={`comments-section-${item.id}`}
                      >
                        <div className="action-comments-header">
                          <span className="action-comments-title">
                            <MessageSquare size={13} />
                            <span>Комментарии</span>
                            {commentsCount > 0 && <span className="badge badge-purple">{commentsCount}</span>}
                          </span>
                        </div>

                        {commentsCount > 0 && (
                          <div className="action-comments-list">
                            {item.comments!.map((comment) => {
                              const isCommentAuthor = user?.id === comment.userId;
                              const canDeleteComment = isCommentAuthor || isFacilitator;
                              const isDeleting = deletingCommentId === comment.id;
                              const commentDate = new Date(comment.createdAt).toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              return (
                                <div key={comment.id} className="action-comment-item" id={`comment-${comment.id}`}>
                                  <img
                                    src={comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`}
                                    alt={comment.userName || 'Автор'}
                                    className="action-comment-avatar"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                  <div className="action-comment-body">
                                    <div className="action-comment-meta">
                                      <span className="action-comment-author">{comment.userName || 'Участник'}</span>
                                      <span className="action-comment-time">{commentDate}</span>
                                      {canDeleteComment && (
                                        <button
                                          type="button"
                                          className="action-comment-delete-btn"
                                          onClick={() => handleDeleteComment(item.id, comment.id)}
                                          disabled={isDeleting}
                                          title="Удалить комментарий"
                                        >
                                          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        </button>
                                      )}
                                    </div>
                                    <p className="action-comment-text">{comment.text}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <form
                          className="action-comment-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddComment(item.id);
                          }}
                        >
                          <input
                            type="text"
                            className="action-comment-input"
                            placeholder="Написать комментарий..."
                            value={commentDrafts[item.id] || ''}
                            onChange={(e) => setCommentDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                            disabled={submittingComment[item.id]}
                          />
                          <button
                            type="submit"
                            className="btn-primary action-comment-send-btn"
                            disabled={!commentDrafts[item.id]?.trim() || submittingComment[item.id]}
                            title="Отправить комментарий"
                          >
                            {submittingComment[item.id] ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stats */}
          <div className="summary-sidebar">
            {/* Top voted cards */}
            <section className="summary-section">
              <div className="section-title">
                <span>🏆</span>
                <h2>Топ тем по голосам</h2>
              </div>
              <div className="top-cards">
                {topCards.map((card, i) => (
                  <div key={card.id} className="top-card glass">
                    <span className="top-card-rank">#{i + 1}</span>
                    <p className="top-card-text">{card.text}</p>
                    <div className="top-card-votes">
                      <span>👍</span>
                      <strong>{card.votes.length}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Stats */}
            <section className="summary-section">
              <div className="section-title">
                <span>📊</span>
                <h2>Статистика сессии</h2>
              </div>
              <div className="stats-list glass">
                <div className="stat-row">
                  <span className="stat-row-label">Участников</span>
                  <span className="stat-row-value">{(room.participantIds || []).length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Карточек идей</span>
                  <span className="stat-row-value">{room.cards.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Всего голосов</span>
                  <span className="stat-row-value">
                    {room.cards.reduce((sum, c) => sum + c.votes.length, 0)}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Задачи</span>
                  <span className="stat-row-value">{actionItems.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-row-label">Выполнено</span>
                  <span className="stat-row-value" style={{ color: '#22c55e' }}>
                    {checkedItems.size}/{actionItems.length}
                  </span>
                </div>
              </div>
            </section>

            {/* Export preview */}
            <section className="summary-section">
              <div className="section-title">
                <span>📝</span>
                <h2>Markdown превью</h2>
              </div>
              <pre className="markdown-preview glass">
                {generateMarkdown(room, actionItems, participantsList, checkedItems)}
              </pre>
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                onClick={handleCopy}
                id="btn-copy-markdown"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Скопировано!' : 'Скопировать Markdown'}
              </button>
            </section>

            {/* Navigation back home */}
            <section className="summary-section">
              <Link
                to="/dashboard"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                id="btn-exit-dashboard-sidebar"
              >
                <Home size={16} />
                <span>Выйти на главную страницу</span>
              </Link>
            </section>
          </div>
        </div>
      </main>

      {pendingDeletion && (
        <UndoSnackbar
          message={`Задача «${pendingDeletion.actionItem.text.slice(0, 25)}${pendingDeletion.actionItem.text.length > 25 ? '...' : ''}» удалена`}
          onUndo={handleUndo}
          onTimeout={handleTimeout}
          durationMs={5000}
        />
      )}
    </div>
  );
}
