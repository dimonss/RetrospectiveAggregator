export type Stage = 'brainstorming' | 'grouping' | 'voting' | 'discussion';

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface CardCluster {
  id: string;
  cardIds: string[];
}

export interface RetroCard {
  id: string;
  text: string;
  authorId: string;
  columnId: string;
  votes: string[]; // userIds who voted
  clusterId?: string;
  isAnonymous?: boolean;
  actionItems?: ActionItem[];
}

export interface ActionItem {
  id: string;
  text: string;
  assigneeId: string;
  done: boolean;
}

export interface RetroColumn {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

export interface RetroRoom {
  id: string;
  name: string;
  template: TemplateId;
  stage: Stage;
  facilitatorId: string;
  participantIds: string[];
  participants?: User[];
  columns: RetroColumn[];
  cards: RetroCard[];
  clusters: CardCluster[];
  createdAt: string;
  anonymousMode: boolean;
}

export type TemplateId = 'mad-sad-glad' | 'start-stop-continue' | 'went-well';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  emoji: string;
  columns: Omit<RetroColumn, 'id'>[];
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Дмитрий Чалыш',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dmitry',
  color: '#7c3aed',
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  { id: 'u2', name: 'Анна Смирнова', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna', color: '#db2777' },
  { id: 'u3', name: 'Игорь Петров', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=igor', color: '#059669' },
  { id: 'u4', name: 'Мария Козлова', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', color: '#d97706' },
];

// ─── Templates ───────────────────────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: 'mad-sad-glad',
    name: 'Злюсь / Грущу / Радуюсь',
    description: 'Эмоциональный срез команды — что злит, что расстраивает, что радует',
    emoji: '😤😢😄',
    columns: [
      { title: 'Злюсь 😤', emoji: '😤', color: '#ef4444' },
      { title: 'Грущу 😢', emoji: '😢', color: '#3b82f6' },
      { title: 'Радуюсь 😄', emoji: '😄', color: '#22c55e' },
    ],
  },
  {
    id: 'start-stop-continue',
    name: 'Начать / Прекратить / Продолжить',
    description: 'Процессный срез — что начать, что прекратить, что продолжать делать',
    emoji: '▶️⏹️🔄',
    columns: [
      { title: 'Начать ▶️', emoji: '▶️', color: '#22c55e' },
      { title: 'Прекратить ⏹️', emoji: '⏹️', color: '#ef4444' },
      { title: 'Продолжить 🔄', emoji: '🔄', color: '#3b82f6' },
    ],
  },
  {
    id: 'went-well',
    name: 'Что прошло хорошо / Что улучшить / Задачи',
    description: 'Классическая agile-ретроспектива с акцентом на действия',
    emoji: '✅🔧📋',
    columns: [
      { title: 'Что прошло хорошо ✅', emoji: '✅', color: '#22c55e' },
      { title: 'Что улучшить 🔧', emoji: '🔧', color: '#f59e0b' },
      { title: 'Задачи 📋', emoji: '📋', color: '#7c3aed' },
    ],
  },
];

// ─── Mock Room ────────────────────────────────────────────────────────────────

export const MOCK_ROOM: RetroRoom = {
    id: 'room-123',
  name: 'Спринт 42 Ретроспектива',
  template: 'went-well',
  stage: 'brainstorming',
  facilitatorId: 'u1',
  participantIds: ['u1', 'u2', 'u3', 'u4'],
  participants: MOCK_USERS,
  anonymousMode: true,
  createdAt: new Date().toISOString(),
  columns: [
    { id: 'col-1', title: 'Что прошло хорошо ✅', emoji: '✅', color: '#22c55e' },
    { id: 'col-2', title: 'Что улучшить 🔧', emoji: '🔧', color: '#f59e0b' },
    { id: 'col-3', title: 'Задачи 📋', emoji: '📋', color: '#7c3aed' },
  ],
  cards: [
    { id: 'c1', text: 'Отличная коммуникация в команде', authorId: 'u1', columnId: 'col-1', votes: ['u2', 'u3', 'u4'], actionItems: [], isAnonymous: false },
    { id: 'c2', text: 'Быстро закрыли технический долг', authorId: 'u2', columnId: 'col-1', votes: ['u1', 'u3'], actionItems: [], isAnonymous: true },
    { id: 'c3', text: 'Успели задеплоить раньше дедлайна', authorId: 'u3', columnId: 'col-1', votes: ['u1'], actionItems: [], isAnonymous: true },
    { id: 'c4', text: 'Слишком долгий код-ревью', authorId: 'u2', columnId: 'col-2', votes: ['u1', 'u3', 'u4'], actionItems: [], isAnonymous: true },
    { id: 'c5', text: 'Нет четких требований от продукта', authorId: 'u4', columnId: 'col-2', votes: ['u2', 'u3'], actionItems: [], isAnonymous: true },
    { id: 'c6', text: 'Код-ревью занимает больше 2 дней', authorId: 'u1', columnId: 'col-2', votes: ['u2'], actionItems: [], isAnonymous: false },
    { id: 'c7', text: 'Настроить автоматическую сборку', authorId: 'u3', columnId: 'col-3', votes: ['u1', 'u2', 'u3', 'u4'], actionItems: [], isAnonymous: false },
    { id: 'c8', text: 'Провести воркшоп по DDD', authorId: 'u1', columnId: 'col-3', votes: ['u2', 'u4'], actionItems: [], isAnonymous: true },
  ],
  clusters: [],
};

// ─── Mock Dashboard Rooms ────────────────────────────────────────────────────

export const MOCK_DASHBOARD_ROOMS = [
  {
      id: 'room-123',
    name: 'Спринт 42 Ретроспектива',
    template: 'went-well' as TemplateId,
    stage: 'brainstorming' as Stage,
    participantCount: 4,
    createdAt: new Date().toISOString(),
    emoji: '✅',
  },
  {
    id: 'room-old-1',
    name: 'Спринт 41 — Разбор полётов',
    template: 'mad-sad-glad' as TemplateId,
    stage: 'discussion' as Stage,
    participantCount: 6,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    emoji: '😤',
  },
  {
    id: 'room-old-2',
    name: 'Q2 Квартальная ретро',
    template: 'start-stop-continue' as TemplateId,
    stage: 'discussion' as Stage,
    participantCount: 12,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    emoji: '▶️',
  },
];

export const STAGES: { id: Stage; label: string; emoji: string }[] = [
  { id: 'brainstorming', label: 'Идеи', emoji: '💡' },
  { id: 'grouping', label: 'Группировка', emoji: '🗂️' },
  { id: 'voting', label: 'Голосование', emoji: '🗳️' },
  { id: 'discussion', label: 'Обсуждение', emoji: '💬' },
];

export const MAX_VOTES = 5;
