import { eq, count, and } from 'drizzle-orm';
import { getDb } from '../../db/connection.js';
import { getEnv } from '../../config/env.js';
import { retroRooms, retroParticipants, retroCards, retroVotes, retroActionItems, userProfiles } from '../../db/schema.js';
import type { CreateRoomInput, RoomResponse, RoomDetailResponse, CardResponse, CreateCardInput, RoomStatsResponse, UpdateCardPositionsInput } from './rooms.schemas.js';

function buildInviteLink(roomId: string): string {
    const appUrl = getEnv().APP_URL.endsWith('/')
        ? getEnv().APP_URL.slice(0, -1)
        : getEnv().APP_URL;
    return `${appUrl}/retro/${roomId}`;
}

const TEMPLATE_COLUMNS: Record<string, Array<{ id: string; title: string; emoji: string; color: string }>> = {
    'mad-sad-glad': [
        { id: 'col-1', title: 'Злюсь 😤', emoji: '😤', color: '#ef4444' },
        { id: 'col-2', title: 'Грущу 😢', emoji: '😢', color: '#3b82f6' },
        { id: 'col-3', title: 'Радуюсь 😄', emoji: '😄', color: '#22c55e' },
    ],
    'start-stop-continue': [
        { id: 'col-1', title: 'Начать ▶️', emoji: '▶️', color: '#22c55e' },
        { id: 'col-2', title: 'Прекратить ⏹️', emoji: '⏹️', color: '#ef4444' },
        { id: 'col-3', title: 'Продолжить 🔄', emoji: '🔄', color: '#3b82f6' },
    ],
    'went-well': [
        { id: 'col-1', title: 'Что прошло хорошо ✅', emoji: '✅', color: '#22c55e' },
        { id: 'col-2', title: 'Что улучшить 🔧', emoji: '🔧', color: '#f59e0b' },
        { id: 'col-3', title: 'Задачи 📋', emoji: '📋', color: '#7c3aed' },
    ],
};

export async function createRoom(
    userProfile: typeof userProfiles.$inferSelect,
    input: CreateRoomInput,
): Promise<RoomResponse> {
    const db = getDb();

    // 1. Create room
    const createdRoom = db
        .insert(retroRooms)
        .values({
            name: input.name,
            template: input.template,
            stage: 'brainstorming',
            facilitatorId: userProfile.id,
            anonymousMode: String(input.anonymousMode),
        })
        .returning()
        .get();

    // 2. Add facilitator as a participant
    db.insert(retroParticipants)
        .values({
            roomId: createdRoom.id,
            userId: userProfile.id,
            role: 'facilitator',
        })
        .run();

    return {
        id: createdRoom.id,
        name: createdRoom.name,
        template: createdRoom.template,
        stage: createdRoom.stage,
        facilitatorId: createdRoom.facilitatorId,
        anonymousMode: createdRoom.anonymousMode === 'true',
        inviteLink: buildInviteLink(createdRoom.id),
        participantCount: 1,
        createdAt: createdRoom.createdAt || new Date().toISOString(),
        updatedAt: createdRoom.updatedAt || new Date().toISOString(),
    };
}

export async function getUserRooms(userId: string): Promise<RoomResponse[]> {
    const db = getDb();

    const userParticipations = db
        .select({ roomId: retroParticipants.roomId })
        .from(retroParticipants)
        .where(eq(retroParticipants.userId, userId))
        .all();

    const roomIds = userParticipations.map(p => p.roomId);
    if (roomIds.length === 0) {
        return [];
    }

    const rooms = db
        .select()
        .from(retroRooms)
        .all()
        .filter(room => roomIds.includes(room.id));

    const result: RoomResponse[] = [];

    for (const room of rooms) {
        const participantCountRes = db
            .select({ value: count() })
            .from(retroParticipants)
            .where(eq(retroParticipants.roomId, room.id))
            .get();

        result.push({
            id: room.id,
            name: room.name,
            template: room.template,
            stage: room.stage,
            facilitatorId: room.facilitatorId,
            anonymousMode: room.anonymousMode === 'true',
            inviteLink: buildInviteLink(room.id),
            participantCount: participantCountRes?.value || 1,
            createdAt: room.createdAt || new Date().toISOString(),
            updatedAt: room.updatedAt || new Date().toISOString(),
        });
    }

    return result;
}

export async function getRoomById(
    roomId: string,
    userProfile: typeof userProfiles.$inferSelect,
): Promise<RoomDetailResponse | null> {
    const db = getDb();

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, roomId))
        .get();

    if (!room) {
        return null;
    }

    // Join room if not participant
    const participants = db
        .select()
        .from(retroParticipants)
        .where(eq(retroParticipants.roomId, roomId))
        .all();

    const isParticipant = participants.some(p => p.userId === userProfile.id);
    if (!isParticipant) {
        db.insert(retroParticipants)
            .values({
                roomId: room.id,
                userId: userProfile.id,
                role: 'participant',
            })
            .run();
        participants.push({
            id: 'temp',
            roomId: room.id,
            userId: userProfile.id,
            role: 'participant',
            joinedAt: new Date().toISOString(),
        });
    }

    // Get cards sorted by position ASC, createdAt ASC
    const dbCards = db
        .select()
        .from(retroCards)
        .where(eq(retroCards.roomId, roomId))
        .all()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const dbActionItems = db
        .select()
        .from(retroActionItems)
        .where(eq(retroActionItems.roomId, roomId))
        .all();

    const cards: CardResponse[] = [];
    for (const card of dbCards) {
        const votes = db
            .select({ userId: retroVotes.userId })
            .from(retroVotes)
            .where(eq(retroVotes.cardId, card.id))
            .all()
            .map(v => v.userId);

        const cardActionItems = dbActionItems
            .filter(ai => ai.cardId === card.id)
            .map(ai => ({
                id: ai.id,
                cardId: ai.cardId,
                text: ai.text,
                assigneeId: ai.assigneeId,
                done: ai.done === 'true',
                createdAt: ai.createdAt || new Date().toISOString(),
            }));

        cards.push({
            id: card.id,
            text: card.text,
            authorId: card.authorId,
            columnId: card.columnId,
            position: card.position ?? 0,
            votes,
            clusterId: card.clusterId,
            isAnonymous: card.isAnonymous === 'true',
            actionItems: cardActionItems,
            createdAt: card.createdAt || new Date().toISOString(),
        });
    }

    const participantUserIds = participants.map(p => p.userId);
    const allUserProfiles = db.select().from(userProfiles).all();
    const participantProfiles = allUserProfiles
        .filter(u => participantUserIds.includes(u.id))
        .map(u => ({
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Участник',
            avatar: u.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username || u.id}`,
            color: '#7c3aed',
        }));

    const columns = TEMPLATE_COLUMNS[room.template] || TEMPLATE_COLUMNS['went-well'];

    return {
        id: room.id,
        name: room.name,
        template: room.template,
        stage: room.stage,
        facilitatorId: room.facilitatorId,
        anonymousMode: room.anonymousMode === 'true',
        inviteLink: buildInviteLink(room.id),
        participantCount: participants.length,
        participantIds: participantUserIds,
        participants: participantProfiles,
        columns,
        cards,
        createdAt: room.createdAt || new Date().toISOString(),
        updatedAt: room.updatedAt || new Date().toISOString(),
    };
}

export async function addCardToRoom(
    roomId: string,
    userProfile: typeof userProfiles.$inferSelect,
    input: CreateCardInput,
): Promise<CardResponse> {
    const db = getDb();

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, roomId))
        .get();

    if (!room) {
        throw new Error('Room not found');
    }

    const colCards = db
        .select()
        .from(retroCards)
        .where(eq(retroCards.roomId, room.id))
        .all()
        .filter(c => c.columnId === input.columnId);

    const createdCard = db
        .insert(retroCards)
        .values({
            roomId: room.id,
            columnId: input.columnId,
            text: input.text,
            authorId: userProfile.id,
            isAnonymous: String(input.isAnonymous ?? (room.anonymousMode === 'true')),
            position: colCards.length,
        })
        .returning()
        .get();

    return {
        id: createdCard.id,
        text: createdCard.text,
        authorId: createdCard.authorId,
        columnId: createdCard.columnId,
        position: createdCard.position ?? 0,
        votes: [],
        clusterId: createdCard.clusterId,
        isAnonymous: createdCard.isAnonymous === 'true',
        actionItems: [],
        createdAt: createdCard.createdAt || new Date().toISOString(),
    };
}

export async function updateCardPositions(
    roomId: string,
    userProfile: typeof userProfiles.$inferSelect,
    input: UpdateCardPositionsInput,
): Promise<boolean> {
    const db = getDb();

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, roomId))
        .get();

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.facilitatorId !== userProfile.id) {
        throw new Error('Forbidden: Only facilitator can update card positions');
    }

    for (const item of input.positions) {
        db.update(retroCards)
            .set({
                columnId: item.columnId,
                position: item.position,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(retroCards.id, item.id))
            .run();
    }

    return true;
}

export async function updateRoomStage(
    roomId: string,
    userProfile: typeof userProfiles.$inferSelect,
    stage: 'brainstorming' | 'grouping' | 'voting' | 'discussion' | 'completed',
): Promise<boolean> {
    const db = getDb();

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, roomId))
        .get();

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.facilitatorId !== userProfile.id) {
        throw new Error('Forbidden: Only facilitator can change room stage');
    }

    db.update(retroRooms)
        .set({
            stage,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(retroRooms.id, roomId))
        .run();

    return true;
}

export async function deleteCardFromRoom(
    cardId: string,
    userProfile: typeof userProfiles.$inferSelect,
): Promise<boolean> {
    const db = getDb();

    const card = db
        .select()
        .from(retroCards)
        .where(eq(retroCards.id, cardId))
        .get();

    if (!card) return false;

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, card.roomId))
        .get();

    // Allow author or facilitator to delete
    if (card.authorId !== userProfile.id && room?.facilitatorId !== userProfile.id) {
        throw new Error('Forbidden');
    }

    db.delete(retroCards).where(eq(retroCards.id, cardId)).run();
    return true;
}

export async function getUserStats(userId: string): Promise<RoomStatsResponse> {
    const db = getDb();

    const userParticipations = db
        .select({ roomId: retroParticipants.roomId })
        .from(retroParticipants)
        .where(eq(retroParticipants.userId, userId))
        .all();

    const roomIds = userParticipations.map(p => p.roomId);
    if (roomIds.length === 0) {
        return {
            totalSessions: 0,
            totalActionItems: 0,
            totalParticipants: 0,
            totalCards: 0,
        };
    }

    const totalSessions = roomIds.length;

    // Get all rooms the user participates in to check templates
    const rooms = db
        .select()
        .from(retroRooms)
        .all()
        .filter(room => roomIds.includes(room.id));

    const wentWellRoomIds = rooms.filter(r => r.template === 'went-well').map(r => r.id);

    // Unique participants count across user's rooms
    const participants = db
        .select({ roomId: retroParticipants.roomId, userId: retroParticipants.userId })
        .from(retroParticipants)
        .all()
        .filter(p => roomIds.includes(p.roomId));

    const uniqueParticipantIds = new Set(participants.map(p => p.userId));
    const totalParticipants = uniqueParticipantIds.size;

    // Cards stats across user's rooms
    const allCards = db
        .select()
        .from(retroCards)
        .all()
        .filter(c => roomIds.includes(c.roomId));

    const totalCards = allCards.length;
    const allActionItems = db
        .select()
        .from(retroActionItems)
        .all()
        .filter(ai => roomIds.includes(ai.roomId));
    const totalActionItems = allActionItems.length;

    return {
        totalSessions,
        totalActionItems,
        totalParticipants,
        totalCards,
    };
}

export async function addActionItemToCard(
    cardId: string,
    userProfile: typeof userProfiles.$inferSelect,
    input: { text: string; assigneeId?: string },
) {
    const db = getDb();

    const card = db
        .select()
        .from(retroCards)
        .where(eq(retroCards.id, cardId))
        .get();

    if (!card) {
        throw new Error('Card not found');
    }

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, card.roomId))
        .get();

    if (!room || room.facilitatorId !== userProfile.id) {
        throw new Error('Forbidden: Only room facilitator can add action items');
    }

    let validAssigneeId: string | null = null;
    if (input.assigneeId) {
        const userExists = db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.id, input.assigneeId))
            .get();
        if (userExists) {
            validAssigneeId = input.assigneeId;
        }
    }

    const createdActionItem = db
        .insert(retroActionItems)
        .values({
            cardId: card.id,
            roomId: card.roomId,
            text: input.text,
            assigneeId: validAssigneeId,
            done: 'false',
        })
        .returning()
        .get();

    return {
        id: createdActionItem.id,
        cardId: createdActionItem.cardId,
        text: createdActionItem.text,
        assigneeId: createdActionItem.assigneeId,
        done: createdActionItem.done === 'true',
        createdAt: createdActionItem.createdAt || new Date().toISOString(),
    };
}

export async function toggleActionItemDone(
    actionItemId: string,
    userProfile: typeof userProfiles.$inferSelect,
) {
    const db = getDb();

    const item = db
        .select()
        .from(retroActionItems)
        .where(eq(retroActionItems.id, actionItemId))
        .get();

    if (!item) {
        throw new Error('Action item not found');
    }

    const nextDone = item.done === 'true' ? 'false' : 'true';

    db.update(retroActionItems)
        .set({
            done: nextDone,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(retroActionItems.id, actionItemId))
        .run();

    return {
        id: item.id,
        done: nextDone === 'true',
    };
}

export async function deleteActionItem(
    actionItemId: string,
    userProfile: typeof userProfiles.$inferSelect,
) {
    const db = getDb();

    const item = db
        .select()
        .from(retroActionItems)
        .where(eq(retroActionItems.id, actionItemId))
        .get();

    if (!item) return false;

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, item.roomId))
        .get();

    if (!room || room.facilitatorId !== userProfile.id) {
        throw new Error('Forbidden: Only room facilitator can delete action items');
    }

    db.delete(retroActionItems).where(eq(retroActionItems.id, actionItemId)).run();
    return true;
}

export async function toggleCardVote(
    cardId: string,
    userProfile: typeof userProfiles.$inferSelect,
): Promise<{ votes: string[] }> {
    const db = getDb();

    const card = db
        .select()
        .from(retroCards)
        .where(eq(retroCards.id, cardId))
        .get();

    if (!card) {
        throw new Error('Card not found');
    }

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, card.roomId))
        .get();

    if (!room) {
        throw new Error('Room not found');
    }

    if (room.stage !== 'voting') {
        throw new Error('Voting is only allowed during voting stage');
    }

    // Check if user already voted for this card
    const existingVote = db
        .select()
        .from(retroVotes)
        .where(and(eq(retroVotes.cardId, cardId), eq(retroVotes.userId, userProfile.id)))
        .get();

    if (existingVote) {
        // Remove vote
        db.delete(retroVotes)
            .where(eq(retroVotes.id, existingVote.id))
            .run();
    } else {
        // Count user's votes in this room across all cards
        const userRoomVotes = db
            .select({ id: retroVotes.id })
            .from(retroVotes)
            .innerJoin(retroCards, eq(retroVotes.cardId, retroCards.id))
            .where(and(eq(retroCards.roomId, room.id), eq(retroVotes.userId, userProfile.id)))
            .all();

        if (userRoomVotes.length >= 5) {
            throw new Error('No votes left (maximum 5 votes per user)');
        }

        // Add vote
        db.insert(retroVotes)
            .values({
                cardId,
                userId: userProfile.id,
            })
            .run();
    }

    // Fetch updated votes for the card
    const updatedVotes = db
        .select({ userId: retroVotes.userId })
        .from(retroVotes)
        .where(eq(retroVotes.cardId, cardId))
        .all()
        .map(v => v.userId);

    return { votes: updatedVotes };
}
