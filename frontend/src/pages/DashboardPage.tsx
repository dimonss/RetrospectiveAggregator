import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, ChevronRight, LogOut, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { type TemplateId } from '../mocks/data';
import { getRoomsApi, getRoomStatsApi, type RoomApiData, type RoomStatsApiData } from '../api/rooms';
import TemplateModal from '../components/TemplateModal';
import ThemeToggle from '../components/ThemeToggle';
import './DashboardPage.css';

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  brainstorming: { label: 'Сбор идей', color: '#a855f7' },
  grouping: { label: 'Группировка', color: '#3b82f6' },
  voting: { label: 'Голосование', color: '#f59e0b' },
  discussion: { label: 'Обсуждение', color: '#22c55e' },
};

const TEMPLATE_NAMES: Record<TemplateId, string> = {
  'mad-sad-glad': 'Злюсь / Грущу / Радуюсь',
  'start-stop-continue': 'Начать / Прекратить / Продолжить',
  'went-well': 'Что прошло хорошо / Что улучшить / Задачи',
};

const TEMPLATE_EMOJIS: Record<TemplateId, string> = {
  'went-well': '🚀',
  'mad-sad-glad': '🎭',
  'start-stop-continue': '🚦',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'только что';
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  return `${days} дней назад`;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [realRooms, setRealRooms] = useState<RoomApiData[]>([]);
  const [realStats, setRealStats] = useState<RoomStatsApiData | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    setIsLoadingRooms(true);
    setIsLoadingStats(true);
    getRoomsApi()
      .then(setRealRooms)
      .catch((err) => console.error('Failed to load rooms:', err))
      .finally(() => setIsLoadingRooms(false));

    getRoomStatsApi()
      .then(setRealStats)
      .catch((err) => console.error('Failed to load room stats:', err))
      .finally(() => setIsLoadingStats(false));
  }, []);

  const displayRooms = realRooms.map(r => ({
    id: r.id,
    name: r.name,
    template: r.template,
    stage: r.stage as keyof typeof STAGE_LABELS,
    emoji: TEMPLATE_EMOJIS[r.template as TemplateId] || '🔄',
    participantCount: r.participantCount,
    createdAt: r.createdAt,
  }));

  const displayStats = realStats || { totalSessions: 0, totalActionItems: 0, totalParticipants: 0, totalCards: 0 };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header glass-elevated">
        <div className="dashboard-header-left">
          <div className="header-logo">
            <span>🔄</span>
          </div>
          <span className="header-brand gradient-text">RetroAggregator</span>
        </div>
        <div className="dashboard-header-right">
          <div className="user-info">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="user-avatar"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="user-name">{user?.name}</span>
          </div>
          <ThemeToggle />
          <button
            id="btn-logout"
            className="btn-icon tooltip-bottom"
            onClick={logout}
            data-tooltip="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Hero section */}
        <section className="dashboard-hero animate-slide-up">
          <div className="hero-text">
            <h1>Привет, <span className="gradient-text">{user?.name?.split(' ')[0]} 👋</span></h1>
            <p>Начните новую ретроспективу или продолжите незавершённую</p>
          </div>
          <button
            id="btn-create-retro"
            className="btn-primary create-btn"
            onClick={() => setShowTemplateModal(true)}
          >
            <Plus size={18} />
            Создать ретроспективу
          </button>
        </section>

        {/* Stats row */}
        <section className="dashboard-stats animate-fade-in">
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.2)' }}>🔄</div>
            <div>
              <div className="stat-value">
                {isLoadingStats ? <Loader2 size={18} className="animate-spin loader-svg" /> : displayStats.totalSessions}
              </div>
              <div className="stat-label">Всего сессий</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.2)' }}>✅</div>
            <div>
              <div className="stat-value">
                {isLoadingStats ? <Loader2 size={18} className="animate-spin loader-svg" /> : displayStats.totalActionItems}
              </div>
              <div className="stat-label">Задачи</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>👥</div>
            <div>
              <div className="stat-value">
                {isLoadingStats ? <Loader2 size={18} className="animate-spin loader-svg" /> : displayStats.totalParticipants}
              </div>
              <div className="stat-label">Участников</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.2)' }}>💡</div>
            <div>
              <div className="stat-value">
                {isLoadingStats ? <Loader2 size={18} className="animate-spin loader-svg" /> : displayStats.totalCards}
              </div>
              <div className="stat-label">Карточек идей</div>
            </div>
          </div>
        </section>


        {/* Rooms */}
        <section className="dashboard-rooms">
          <div className="section-header">
            <h2>Мои ретроспективы</h2>
            <span className="badge badge-purple">{displayRooms.length}</span>
          </div>
          <div className="rooms-grid">
            {isLoadingRooms ? (
              <div className="room-card glass animate-fade-in rooms-loading">
                <div className="loader-icon-wrapper">
                  <Loader2 size={24} className="animate-spin loader-svg" />
                </div>
                <span className="loader-text">Загрузка комнат...</span>
              </div>
            ) : (
              displayRooms.map((room, index) => {
                const stage = STAGE_LABELS[room.stage] || STAGE_LABELS.brainstorming;
                return (
                  <div
                    key={room.id}
                    className="room-card glass animate-fade-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => navigate(`/retro/${room.id}`)}
                    id={`room-card-${room.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/retro/${room.id}`)}
                  >
                    <div className="room-card-top">
                      <div className="room-emoji">{room.emoji}</div>
                      <span
                        className="badge"
                        style={{
                          background: `${stage.color}20`,
                          color: stage.color,
                          border: `1px solid ${stage.color}40`
                        }}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <h3 className="room-name">{room.name}</h3>
                    <p className="room-template">{TEMPLATE_NAMES[room.template as TemplateId] || room.template}</p>
                    <div className="room-card-footer">
                      <span className="room-meta">
                        <Users size={14} />
                        {room.participantCount} участников
                      </span>
                      <span className="room-meta">
                        <Clock size={14} />
                        {timeAgo(room.createdAt)}
                      </span>
                      <ChevronRight size={16} className="room-arrow" />
                    </div>
                  </div>
                );
              })
            )}

            {/* Create new card */}

            <div
              className="room-card room-card-new glass"
              onClick={() => setShowTemplateModal(true)}
              id="btn-create-room-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setShowTemplateModal(true)}
            >
              <div className="new-room-icon">
                <Plus size={28} />
              </div>
              <span className="new-room-text">Новая ретроспектива</span>
              <p className="new-room-sub">Выберите шаблон и пригласите команду</p>
            </div>
          </div>
        </section>

        {/* Quick tips */}
        <section className="dashboard-tips animate-fade-in">
          <div className="tips-header">
            <Zap size={18} style={{ color: '#f59e0b' }} />
            <h3>Быстрый старт</h3>
          </div>
          <div className="tips-grid">
            <div className="tip-item glass">
              <span className="tip-number">1</span>
              <div>
                <div className="tip-title">Создайте комнату</div>
                <div className="tip-desc">Выберите шаблон, скопируйте ссылку</div>
              </div>
            </div>
            <div className="tip-item glass">
              <span className="tip-number">2</span>
              <div>
                <div className="tip-title">Соберите идеи</div>
                <div className="tip-desc">Анонимный режим снижает барьер</div>
              </div>
            </div>
            <div className="tip-item glass">
              <span className="tip-number">3</span>
              <div>
                <div className="tip-title">Проголосуйте</div>
                <div className="tip-desc">Выберите самые важные темы</div>
              </div>
            </div>
            <div className="tip-item glass">
              <span className="tip-number">4</span>
              <div>
                <div className="tip-title">Экспортируйте</div>
                <div className="tip-desc">Задачи в Telegram/Slack</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showTemplateModal && (
        <TemplateModal onClose={() => setShowTemplateModal(false)} />
      )}
    </div>
  );
}
