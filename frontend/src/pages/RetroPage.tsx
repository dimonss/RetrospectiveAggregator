import { useState, useEffect } from 'react';
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
  ArrowRight, Users, Copy, Check,
  ArrowLeft, Sparkles, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_ROOM, MOCK_USERS, MAX_VOTES,
  type RetroRoom, type RetroCard, type Stage, type ActionItem,
} from '../mocks/data';
import { getRoomApi, addCardApi, deleteCardApi, updateCardPositionsApi, updateRoomStageApi, toggleCardVoteApi, addActionItemApi } from '../api/rooms';
import StageIndicator from '../components/StageIndicator';
import RetroColumn from '../components/RetroColumn';
import RetroCardComponent from '../components/RetroCard';
import ThemeToggle from '../components/ThemeToggle';
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
    hint: 'Перетащите похожие карточки друг на друга или поменяйте порядок, чтобы структурировать темы.',
  },
  voting: {
    emoji: '🗳️',
    title: 'Голосование',
    hint: `У каждого участника ${MAX_VOTES} голосов. Отметьте самые важные карточки.`,
  },
  discussion: {
    emoji: '💬',
    title: 'Обсуждение',
    hint: 'Карточки отсортированы по популярности. Добавляйте задачи к каждой теме.',
  },
};

export default function RetroPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<RetroRoom>({ ...MOCK_ROOM });
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }));

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
              actionItems: (c.actionItems || []).map(ai => ({
                id: ai.id,
                text: ai.text,
                assigneeId: ai.assigneeId || '',
                done: ai.done,
              })),
            })),
          });
        })
        .catch((err) => console.error('Error fetching room:', err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  // Polling for live room updates
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      getRoomApi(id)
        .then((data) => {
          setRoom((prev) => {
            if (activeCardId) return prev; // Do not interrupt drag operation
            return {
              ...prev,
              name: data.name || prev.name,
              template: data.template || prev.template,
              stage: data.stage,
              facilitatorId: data.facilitatorId || prev.facilitatorId,
              columns: data.columns && data.columns.length > 0 ? data.columns : prev.columns,
              participants: data.participants || [],
              participantIds: data.participantIds,
              cards: data.cards.map((c) => ({
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
              })),
            };
          });
        })
        .catch((err) => console.error('Error polling room:', err));
    }, 10000);

    return () => clearInterval(interval);
  }, [id, activeCardId]);

  const [activeTabId, setActiveTabId] = useState<string>('');

  useEffect(() => {
    if (room.columns.length > 0 && !activeTabId) {
      setActiveTabId(room.columns[0].id);
    }
  }, [room.columns, activeTabId]);

  const handleTabClick = (colId: string) => {
    setActiveTabId(colId);
    const el = document.getElementById(`column-${colId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const isFacilitator = user?.id === room.facilitatorId;
  const currentStageIdx = STAGE_ORDER.indexOf(room.stage);

  // Votes left for current user
  const totalVotesUsed = room.cards
    .filter(c => c.votes.includes(user?.id || ''))
    .reduce((sum, c) => sum + (c.votes.includes(user?.id || '') ? 1 : 0), 0);
  const votesLeft = MAX_VOTES - totalVotesUsed;

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleAddCard = async (text: string, columnId: string, isAnonymous: boolean) => {
    if (!id) return;

    try {
      const createdCard = await addCardApi(id, columnId, text, isAnonymous);
      const newCard: RetroCard = {
        id: createdCard.id,
        text: createdCard.text,
        authorId: createdCard.authorId,
        columnId: createdCard.columnId,
        votes: createdCard.votes,
        clusterId: createdCard.clusterId || undefined,
        isAnonymous: createdCard.isAnonymous,
        actionItems: [],
      };
      setRoom(prev => ({ ...prev, cards: [...prev.cards, newCard] }));
    } catch (err) {
      console.error('Failed to add card:', err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCardApi(cardId);
      setRoom(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== cardId) }));
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };


  const handleVote = async (cardId: string) => {
    if (!user?.id) return;
    const card = room.cards.find(c => c.id === cardId);
    if (!card) return;

    const hasVoted = card.votes.includes(user.id);
    if (!hasVoted && votesLeft <= 0) return;

    const currentUserId = user.id;

    // Optimistic update
    setRoom(prev => ({
      ...prev,
      cards: prev.cards.map(c => {
        if (c.id !== cardId) return c;
        const updatedVotes = hasVoted
          ? c.votes.filter(vId => vId !== currentUserId)
          : [...c.votes, currentUserId];
        return { ...c, votes: updatedVotes };
      }),
    }));

    try {
      const result = await toggleCardVoteApi(cardId);
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(c =>
          c.id === cardId ? { ...c, votes: result.votes } : c
        ),
      }));
    } catch (err) {
      console.error('Failed to toggle vote:', err);
      // Revert optimistic update
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(c => {
          if (c.id !== cardId) return c;
          const revertedVotes = hasVoted
            ? [...c.votes, currentUserId]
            : c.votes.filter(vId => vId !== currentUserId);
          return { ...c, votes: revertedVotes };
        }),
      }));
    }
  };

  const handleAddActionItem = async (cardId: string, text: string, assigneeId: string) => {
    const tempId = `ai-${Date.now()}`;
    const newItem: ActionItem = {
      id: tempId,
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

    try {
      const created = await addActionItemApi(cardId, text, assigneeId);
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(c =>
          c.id === cardId
            ? {
                ...c,
                actionItems: (c.actionItems || []).map(ai =>
                  ai.id === tempId ? { id: created.id, text: created.text, assigneeId: created.assigneeId || '', done: created.done } : ai
                ),
              }
            : c
        ),
      }));
    } catch (err) {
      console.error('Failed to add action item:', err);
      setRoom(prev => ({
        ...prev,
        cards: prev.cards.map(c =>
          c.id === cardId
            ? { ...c, actionItems: (c.actionItems || []).filter(ai => ai.id !== tempId) }
            : c
        ),
      }));
    }
  };

  const handleNextStage = () => {
    if (currentStageIdx < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentStageIdx + 1];
      setRoom(prev => ({ ...prev, stage: nextStage }));
      if (id) {
        updateRoomStageApi(id, nextStage).catch(console.error);
      }
    } else {
      navigate(`/retro/${id}/summary`);
    }
  };

  const handleStageChange = (stage: Stage) => {
    setRoom(prev => ({ ...prev, stage }));
    if (id) {
      updateRoomStageApi(id, stage).catch(console.error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── DnD (Facilitator only in grouping stage) ───────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    if (!isFacilitator || room.stage !== 'grouping') return;
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isFacilitator || room.stage !== 'grouping') {
      setActiveCardId(null);
      return;
    }

    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) return;

    const activeCard = room.cards.find(c => c.id === active.id);
    if (!activeCard) return;

    let updatedCards = [...room.cards];

    // If dropped on a column (different from card's column), move there
    const targetColumn = room.columns.find(col => col.id === over.id);
    if (targetColumn && activeCard.columnId !== targetColumn.id) {
      updatedCards = updatedCards.map(c =>
        c.id === active.id ? { ...c, columnId: targetColumn.id } : c
      );
    } else {
      // Reorder within column
      const overCard = room.cards.find(c => c.id === over.id);
      if (overCard && activeCard.columnId === overCard.columnId) {
        const colCards = room.cards.filter(c => c.columnId === activeCard.columnId);
        const oldIdx = colCards.findIndex(c => c.id === active.id);
        const newIdx = colCards.findIndex(c => c.id === over.id);
        const reordered = arrayMove(colCards, oldIdx, newIdx);

        updatedCards = [
          ...room.cards.filter(c => c.columnId !== activeCard.columnId),
          ...reordered,
        ];
      }
    }

    setRoom(prev => ({ ...prev, cards: updatedCards }));

    // Save card positions and column assignments to backend
    if (id) {
      const positionsToUpdate: Array<{ id: string; columnId: string; position: number }> = [];
      for (const col of room.columns) {
        const colCards = updatedCards.filter(c => c.columnId === col.id);
        colCards.forEach((c, idx) => {
          positionsToUpdate.push({
            id: c.id,
            columnId: c.columnId,
            position: idx,
          });
        });
      }
      updateCardPositionsApi(id, positionsToUpdate).catch(console.error);
    }
  };

  const activeCard = activeCardId ? room.cards.find(c => c.id === activeCardId) : null;
  const activeColumn = activeCard ? room.columns.find(c => c.id === activeCard.columnId) : null;

  const hint = !isFacilitator && room.stage === 'grouping'
    ? {
        emoji: '⏳',
        title: 'Группировка карточек',
        hint: 'Создатель комнаты формирует темы и группирует карточки. Пожалуйста, подождите...',
      }
    : !isFacilitator && room.stage === 'discussion'
    ? {
        emoji: '⏳',
        title: 'Обсуждение итогов',
        hint: 'Создатель комнаты подводит итоги ретроспективы и фиксирует задачи. Пожалуйста, подождите...',
      }
    : (STAGE_HINTS[room.stage] || STAGE_HINTS.brainstorming);

  if (isLoading) {
    return (
      <div className="retro-page-loading">
        <div className="loader-icon-wrapper" style={{ width: '56px', height: '56px' }}>
          <Loader2 size={28} className="animate-spin loader-svg" />
        </div>
        <span className="loader-text">Загрузка ретроспективы...</span>
      </div>
    );
  }

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

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Share */}
          {isFacilitator && (
            <button
              id="btn-share-link"
              className="btn-secondary"
              onClick={handleCopyLink}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Скопировано!' : 'Ссылка'}</span>
            </button>
          )}

          {/* Facilitator next stage */}
          {isFacilitator && (
            <button
              id="btn-next-stage"
              className="btn-primary"
              onClick={handleNextStage}
            >
              <span className="btn-text-mobile-hide">
                {currentStageIdx < STAGE_ORDER.length - 1
                  ? `Далее`
                  : 'Завершить'}
              </span>
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

      {/* Mobile Column Tabs */}
      <div className="mobile-column-tabs">
        {room.columns.map(col => {
          const colCardCount = room.cards.filter(c => c.columnId === col.id).length;
          return (
            <button
              key={col.id}
              className={`mobile-tab-btn ${activeTabId === col.id ? 'mobile-tab-btn--active' : ''}`}
              style={{ '--tab-color': col.color } as React.CSSProperties}
              onClick={() => handleTabClick(col.id)}
            >
              <span>{col.emoji}</span>
              <span>{col.title}</span>
              <span className="mobile-tab-count">{colCardCount}</span>
            </button>
          );
        })}
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
                  isFacilitator={isFacilitator}
                  currentUserId={user?.id || 'u1'}
                  anonymousMode={room.anonymousMode}
                  userVotesLeft={votesLeft}
                  participants={room.participants && room.participants.length > 0 ? room.participants : MOCK_USERS}
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
                userVotesLeft={0}
                columnColor={activeColumn.color}
                cardIndex={0}
                participants={room.participants && room.participants.length > 0 ? room.participants : MOCK_USERS}
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
        {(room.participants && room.participants.length > 0 ? room.participants : MOCK_USERS).map(u => (
          <div key={u.id} className="participant-chip" data-tooltip={u.name}>
            <img
              src={u.avatar}
              alt={u.name}
              className="participant-avatar"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="participant-status" style={{ background: u.color || '#7c3aed' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
