import { useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Eye, EyeOff, ArrowRight, Users, Copy, Check,
  ArrowLeft, Sparkles
} from 'lucide-react';
import { AuthContext } from '../App';
import {
  MOCK_ROOM, MOCK_USERS, MAX_VOTES,
  type RetroRoom, type RetroCard, type Stage, type ActionItem,
} from '../mocks/data';
import StageIndicator from '../components/StageIndicator';
import RetroColumn from '../components/RetroColumn';
import RetroCardComponent from '../components/RetroCard';
import './RetroPage.css';

const STAGE_ORDER: Stage[] = ['brainstorming', 'grouping', 'voting', 'discussion'];

const STAGE_HINTS: Record<Stage, { title: string; hint: string; emoji: string }> = {
  brainstorming: {
    emoji: '💡',
    title: 'Сбор идей',
    hint: 'Добавляйте карточки в колонки. Анонимный режим позволяет писать откровенно.',
  },
  grouping: {
    emoji: '🗂️',
    title: 'Группировка',
    hint: 'Перетащите похожие карточки друг на друга, чтобы объединить их в кластеры.',
  },
  voting: {
    emoji: '🗳️',
    title: 'Голосование',
    hint: `У каждого участника ${MAX_VOTES} голосов. Отметьте самые важные карточки.`,
  },
  discussion: {
    emoji: '💬',
    title: 'Обсуждение',
    hint: 'Карточки отсортированы по популярности. Добавляйте action items к каждой теме.',
  },
};

export default function RetroPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [room, setRoom] = useState<RetroRoom>({ ...MOCK_ROOM });
  const [copied, setCopied] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }));

  const isFacilitator = user?.id === room.facilitatorId;
  const currentStageIdx = STAGE_ORDER.indexOf(room.stage);

  // Votes left for current user
  const totalVotesUsed = room.cards
    .filter(c => c.votes.includes(user?.id || ''))
    .reduce((sum, c) => sum + (c.votes.includes(user?.id || '') ? 1 : 0), 0);
  const votesLeft = MAX_VOTES - totalVotesUsed;

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAddCard = (text: string, columnId: string) => {
    const newCard: RetroCard = {
      id: `c-${Date.now()}`,
      text,
      authorId: user?.id || 'u1',
      columnId,
      votes: [],
      actionItems: [],
    };
    setRoom(prev => ({ ...prev, cards: [...prev.cards, newCard] }));
  };

  const handleDeleteCard = (cardId: string) => {
    setRoom(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== cardId) }));
  };

  const handleVote = (cardId: string) => {
    if (votesLeft <= 0) return;
    setRoom(prev => ({
      ...prev,
      cards: prev.cards.map(c =>
        c.id === cardId && !c.votes.includes(user?.id || '')
          ? { ...c, votes: [...c.votes, user?.id || ''] }
          : c
      ),
    }));
  };

  const handleAddActionItem = (cardId: string, text: string, assigneeId: string) => {
    const newItem: ActionItem = {
      id: `ai-${Date.now()}`,
      text,
      assigneeId,
      done: false,
    };
    setRoom(prev => ({
      ...prev,
      cards: prev.cards.map(c =>
        c.id === cardId
          ? { ...c, actionItems: [...(c.actionItems || []), newItem] }
          : c
      ),
    }));
  };

  const handleNextStage = () => {
    if (currentStageIdx < STAGE_ORDER.length - 1) {
      setRoom(prev => ({ ...prev, stage: STAGE_ORDER[currentStageIdx + 1] }));
    } else {
      navigate(`/retro/${id}/summary`);
    }
  };

  const handleStageChange = (stage: Stage) => {
    setRoom(prev => ({ ...prev, stage }));
  };

  const handleAnonymousToggle = () => {
    setRoom(prev => ({ ...prev, anonymousMode: !prev.anonymousMode }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── DnD ─────────────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) return;

    const activeCard = room.cards.find(c => c.id === active.id);
    if (!activeCard) return;

    // If dropped on a column (different from card's column), move there
    const targetColumn = room.columns.find(col => col.id === over.id);
    if (targetColumn && activeCard.columnId !== targetColumn.id) {
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(c =>
          c.id === active.id ? { ...c, columnId: targetColumn.id } : c
        ),
      }));
      return;
    }

    // Reorder within column
    const overCard = room.cards.find(c => c.id === over.id);
    if (overCard && activeCard.columnId === overCard.columnId) {
      const colCards = room.cards.filter(c => c.columnId === activeCard.columnId);
      const oldIdx = colCards.findIndex(c => c.id === active.id);
      const newIdx = colCards.findIndex(c => c.id === over.id);
      const reordered = arrayMove(colCards, oldIdx, newIdx);

      setRoom(prev => ({
        ...prev,
        cards: [
          ...prev.cards.filter(c => c.columnId !== activeCard.columnId),
          ...reordered,
        ],
      }));
    }
  };

  const activeCard = activeCardId ? room.cards.find(c => c.id === activeCardId) : null;
  const activeColumn = activeCard ? room.columns.find(c => c.id === activeCard.columnId) : null;

  const hint = STAGE_HINTS[room.stage];

  return (
    <div className="retro-page">
      {/* Header */}
      <header className="retro-header glass-elevated">
        <div className="retro-header-left">
          <Link to="/dashboard" className="btn-icon" id="btn-back-dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="retro-room-info">
            <h1 className="retro-room-name">{room.name}</h1>
            <div className="retro-room-meta">
              <span className="badge badge-purple">
                <Users size={11} />
                {room.participantIds.length} участников
              </span>
              {isFacilitator && (
                <span className="badge badge-yellow">⚡ Фасилитатор</span>
              )}
            </div>
          </div>
        </div>

        <div className="retro-header-center">
          <StageIndicator
            currentStage={room.stage}
            isFacilitator={isFacilitator}
            onStageChange={handleStageChange}
          />
        </div>

        <div className="retro-header-right">
          {/* Anonymous toggle */}
          {room.stage === 'brainstorming' && (
            <button
              id="btn-anon-toggle"
              className={`anon-toggle ${room.anonymousMode ? 'anon-toggle--on' : ''}`}
              onClick={handleAnonymousToggle}
              data-tooltip={room.anonymousMode ? 'Анонимно: вкл' : 'Анонимно: выкл'}
            >
              {room.anonymousMode ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{room.anonymousMode ? 'Анонимно' : 'Открыто'}</span>
            </button>
          )}

          {/* Votes counter */}
          {room.stage === 'voting' && (
            <div className="votes-counter">
              <span className="votes-counter-dots">
                {Array.from({ length: MAX_VOTES }).map((_, i) => (
                  <span
                    key={i}
                    className={`vote-dot ${i < votesLeft ? 'vote-dot--available' : 'vote-dot--used'}`}
                  />
                ))}
              </span>
              <span className="votes-counter-text">{votesLeft} из {MAX_VOTES} голосов</span>
            </div>
          )}

          {/* Share */}
          <button
            id="btn-share-link"
            className="btn-secondary"
            onClick={handleCopyLink}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Копировать ссылку'}
          </button>

          {/* Facilitator next stage */}
          {isFacilitator && (
            <button
              id="btn-next-stage"
              className="btn-primary"
              onClick={handleNextStage}
            >
              {currentStageIdx < STAGE_ORDER.length - 1
                ? `Следующий этап`
                : 'Завершить'}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Stage hint banner */}
      <div className="stage-hint animate-fade-in" key={room.stage}>
        <span className="stage-hint-emoji">{hint.emoji}</span>
        <div>
          <strong>{hint.title}</strong>
          <span> — {hint.hint}</span>
        </div>
        {room.stage === 'voting' && (
          <div className="stage-hint-votes">
            <Sparkles size={14} />
            <span>Осталось голосов: <strong>{votesLeft}</strong></span>
          </div>
        )}
      </div>

      {/* Board */}
      <main className="retro-board">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="retro-columns">
            {room.columns.map(column => {
              const colCards = room.cards.filter(c => c.columnId === column.id);
              return (
                <RetroColumn
                  key={column.id}
                  column={column}
                  cards={colCards}
                  stage={room.stage}
                  currentUserId={user?.id || 'u1'}
                  anonymousMode={room.anonymousMode}
                  userVotesLeft={votesLeft}
                  onAddCard={handleAddCard}
                  onVote={handleVote}
                  onDeleteCard={handleDeleteCard}
                  onAddActionItem={handleAddActionItem}
                />
              );
            })}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeCard && activeColumn ? (
              <RetroCardComponent
                card={activeCard}
                stage={room.stage}
                currentUserId={user?.id || 'u1'}
                anonymousMode={false}
                userVotesLeft={0}
                columnColor={activeColumn.color}
                cardIndex={0}
                isDragging
                onVote={() => {}}
                onDelete={() => {}}
                onAddActionItem={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Participant avatars bar */}
      <div className="retro-participants-bar glass">
        <span className="participants-label">Участники:</span>
        {MOCK_USERS.map(u => (
          <div key={u.id} className="participant-chip" data-tooltip={u.name}>
            <img
              src={u.avatar}
              alt={u.name}
              className="participant-avatar"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="participant-status" style={{ background: u.color }} />
          </div>
        ))}
      </div>
    </div>
  );
}
