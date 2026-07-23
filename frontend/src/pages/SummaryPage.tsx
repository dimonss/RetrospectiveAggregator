import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Copy, ArrowLeft, CheckSquare, Loader2, Home } from 'lucide-react';
import { MOCK_ROOM, MOCK_USERS, type ActionItem, type RetroRoom } from '../mocks/data';
import { getRoomApi, toggleActionItemDoneApi } from '../api/rooms';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import './SummaryPage.css';

function buildSummaryData(room: RetroRoom) {
  const allActionItems: Array<ActionItem & { cardText: string; cardId: string }> = [];

  room.cards.forEach(card => {
    (card.actionItems || []).forEach(ai => {
      allActionItems.push({ ...ai, cardText: card.text, cardId: card.id });
    });
  });

  return allActionItems;
}

function generateMarkdown(
  room: RetroRoom,
  items: ReturnType<typeof buildSummaryData>,
  participantsList?: Array<{ id: string; name: string; avatar: string }>
) {
  const date = new Date(room.createdAt || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const pList = (participantsList && participantsList.length > 0) ? participantsList : (room.participants || MOCK_USERS);
  const lines = [
    `# 🔄 Ретроспектива: ${room.name}`,
    `*${date}*`,
    '',
    '## 📋 Задачи',
    '',
    ...items.map(ai => {
      const assignee = pList.find(u => u.id === ai.assigneeId) || MOCK_USERS.find(u => u.id === ai.assigneeId);
      return `- [ ] ${ai.text} *(${assignee?.name || 'Не назначен'})*`;
    }),
    '',
    '---',
    '_Сгенерировано платформой RetroAggregator_',
  ];
  return lines.join('\n');
}

export default function SummaryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [room, setRoom] = useState<RetroRoom>(MOCK_ROOM);
  const [isLoading, setIsLoading] = useState(true);

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

  const participantsList = (room.participants && room.participants.length > 0)
    ? room.participants
    : (user ? [{ id: user.id, name: user.name, avatar: user.avatar }] : MOCK_USERS);

  const actionItems = buildSummaryData(room);

  const topCards = [...room.cards]
    .sort((a, b) => b.votes.length - a.votes.length)
    .slice(0, 5);

  const handleCopy = () => {
    const md = generateMarkdown(room, actionItems, participantsList);
    navigator.clipboard.writeText(md).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCheck = async (actionItemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(actionItemId) ? next.delete(actionItemId) : next.add(actionItemId);
      return next;
    });

    try {
      await toggleActionItemDoneApi(actionItemId);
    } catch (err) {
      console.error('Failed to toggle action item state:', err);
      setCheckedItems(prev => {
        const next = new Set(prev);
        next.has(actionItemId) ? next.delete(actionItemId) : next.add(actionItemId);
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
                return (
                  <div
                    key={item.id}
                    className={`action-card glass ${isDone ? 'action-card--done' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                    role="checkbox"
                    aria-checked={isDone}
                    tabIndex={0}
                    id={`action-card-${item.id}`}
                    onKeyDown={(e) => e.key === 'Enter' && toggleCheck(item.id)}
                  >
                    <div className="action-card-check">
                      {isDone ? (
                        <div className="check-done">✓</div>
                      ) : (
                        <div className="check-empty" />
                      )}
                    </div>
                    <div className="action-card-content">
                      <p className="action-card-text">{item.text}</p>
                      <p className="action-card-source">↩ {item.cardText}</p>
                    </div>
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
                {generateMarkdown(room, actionItems, participantsList)}
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
    </div>
  );
}
