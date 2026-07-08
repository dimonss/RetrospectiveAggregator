import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, ChevronRight, LogOut, Zap } from 'lucide-react';
import { AuthContext } from '../App';
import { MOCK_DASHBOARD_ROOMS, type TemplateId } from '../mocks/data';
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
  'mad-sad-glad': 'Mad / Sad / Glad',
  'start-stop-continue': 'Start / Stop / Continue',
  'went-well': 'Went Well / Improve / Actions',
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
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showTemplateModal, setShowTemplateModal] = useState(false);

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
              <div className="stat-value">3</div>
              <div className="stat-label">Всего сессий</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.2)' }}>✅</div>
            <div>
              <div className="stat-value">12</div>
              <div className="stat-label">Action Items</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>👥</div>
            <div>
              <div className="stat-value">22</div>
              <div className="stat-label">Участников</div>
            </div>
          </div>
          <div className="stat-card glass">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.2)' }}>💡</div>
            <div>
              <div className="stat-value">64</div>
              <div className="stat-label">Карточек идей</div>
            </div>
          </div>
        </section>

        {/* Rooms */}
        <section className="dashboard-rooms">
          <div className="section-header">
            <h2>Мои ретроспективы</h2>
            <span className="badge badge-purple">{MOCK_DASHBOARD_ROOMS.length}</span>
          </div>
          <div className="rooms-grid">
            {MOCK_DASHBOARD_ROOMS.map((room, index) => {
              const stage = STAGE_LABELS[room.stage];
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
                  <p className="room-template">{TEMPLATE_NAMES[room.template]}</p>
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
            })}

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
                <div className="tip-desc">Action Items в Telegram/Slack</div>
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
