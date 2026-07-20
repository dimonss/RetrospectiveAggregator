import React from 'react';
import {
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type RetroColumn, type RetroCard, type Stage } from '../mocks/data';
import RetroCardComponent from './RetroCard';
import AddCardForm from './AddCardForm';
import './RetroColumn.css';

interface SortableCardProps {
  card: RetroCard;
  stage: Stage;
  currentUserId: string;
  userVotesLeft: number;
  columnColor: string;
  cardIndex: number;
  onVote: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onAddActionItem: (cardId: string, text: string, assigneeId: string) => void;
}

function SortableCard(props: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...(props.stage === 'grouping' ? { ...attributes, ...listeners } : {})}>
      <RetroCardComponent {...props} isDragging={isDragging} />
    </div>
  );
}

interface Props {
  column: RetroColumn;
  cards: RetroCard[];
  stage: Stage;
  currentUserId: string;
  anonymousMode: boolean;
  userVotesLeft: number;
  onAddCard: (text: string, columnId: string, isAnonymous: boolean) => void;
  onVote: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onAddActionItem: (cardId: string, text: string, assigneeId: string) => void;
}

export default function RetroColumn({
  column, cards, stage, currentUserId, anonymousMode,
  userVotesLeft, onAddCard, onVote, onDeleteCard, onAddActionItem
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  // In discussion, sort by votes descending
  const sortedCards = stage === 'discussion'
    ? [...cards].sort((a, b) => b.votes.length - a.votes.length)
    : cards;

  return (
    <div
      className={`retro-column ${isOver ? 'retro-column--over' : ''}`}
      style={{ '--col-color': column.color } as React.CSSProperties}
    >
      {/* Column header */}
      <div className="column-header">
        <div className="column-title-row">
          <span className="column-emoji">{column.emoji}</span>
          <h3 className="column-title">{column.title}</h3>
        </div>
        <span className="column-count">{cards.length}</span>
      </div>

      {/* Column accent bar */}
      <div className="column-accent-bar" style={{ background: column.color }} />

      {/* Cards */}
      <div className="column-cards" ref={setNodeRef}>
        <SortableContext items={sortedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {sortedCards.map((card, index) => (
            <SortableCard
              key={card.id}
              card={card}
              stage={stage}
              currentUserId={currentUserId}
              userVotesLeft={userVotesLeft}
              columnColor={column.color}
              cardIndex={index}
              onVote={onVote}
              onDelete={onDeleteCard}
              onAddActionItem={onAddActionItem}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {cards.length === 0 && (
          <div className="column-empty">
            <span>{column.emoji}</span>
            <p>Пока нет карточек</p>
          </div>
        )}
      </div>

      {/* Add card form (only in brainstorming) */}
      {stage === 'brainstorming' && (
        <div className="column-footer">
          <AddCardForm
            columnId={column.id}
            columnColor={column.color}
            defaultAnonymous={anonymousMode}
            onAdd={onAddCard}
          />
        </div>
      )}
    </div>
  );
}
