import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Copy, ArrowLeft, CheckSquare, Loader2 } from 'lucide-react';
import { MOCK_ROOM, MOCK_USERS, type ActionItem, type RetroRoom } from '../mocks/data';
import { getRoomApi } from '../api/rooms';
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

function generateMarkdown(room: RetroRoom, items: ReturnType<typeof buildSummaryData>) {
  const date = new Date(room.createdAt || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const lines = [
    `# 🔄 Ретроспектива: ${room.name}`,
    `*${date}*`,
    '',
    '## 📋 Задачи',
    '',
    ...items.map(ai => {
      const assignee = (room.participants || MOCK_USERS).find(u => u.id === ai.assigneeId);
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
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [room, setRoom] = useState<RetroRoom>(MOCK_ROOM);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getRoomApi(id)
        .then((data) => {
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
            cards: data.cards.map((c) => ({
              id: c.id,
              text: c.text,
              authorId: c.authorId,
              columnId: c.columnId,
              votes: c.votes,
              clusterId: c.clusterId || undefined,
              isAnonymous: c.isAnonymous,
              actionItems: [],
            })),
          });
        })
        .catch((err) => console.error('Error fetching room summary:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const actionItems = buildSummaryData(room);

  const topCards = [...room.cards]
    .sort((a, b) => b.votes.length - a.votes.length)
    .slice(0, 5);

  const handleCopy = () => {
    const md = generateMarkdown(room, actionItems);
    navigator.clipboard.writeText(md).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
          <Link to={`/retro/${id}`} className="btn-icon" id="btn-back-retro">
            <ArrowLeft size={18} />
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
                const assignee = MOCK_USERS.find(u => u.id === item.assigneeId);
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
                      <img
                        src={assignee?.avatar}
                        alt={assignee?.name}
                        className="assignee-avatar"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span className="assignee-name">{assignee?.name?.split(' ')[0]}</span>
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
                  <span className="stat-row-value">{room.participantIds.length}</span>
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
                {generateMarkdown(room, actionItems)}
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
          </div>
        </div>
      </main>
    </div>
  );
}
