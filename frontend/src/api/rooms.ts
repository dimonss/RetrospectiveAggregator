import { apiRequest } from './client';
import type { User } from '../mocks/data';

export interface CreateRoomParams {
    name: string;
    template: 'went-well' | 'mad-sad-glad' | 'start-stop-continue';
    anonymousMode?: boolean;
}

export interface RoomApiData {
    id: string;
    name: string;
    template: 'went-well' | 'mad-sad-glad' | 'start-stop-continue';
    stage: 'brainstorming' | 'grouping' | 'voting' | 'discussion' | 'completed';
    facilitatorId: string;
    anonymousMode: boolean;
    inviteLink: string;
    participantCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ActionItemApiData {
    id: string;
    cardId: string;
    text: string;
    assigneeId?: string | null;
    done: boolean;
    createdAt: string;
}

export interface CardApiData {
    id: string;
    text: string;
    authorId: string;
    columnId: string;
    position?: number;
    votes: string[];
    clusterId?: string | null;
    isAnonymous: boolean;
    actionItems?: ActionItemApiData[];
    createdAt: string;
}

export interface RoomDetailApiData extends RoomApiData {
    participantIds: string[];
    participants?: User[];
    columns: Array<{
        id: string;
        title: string;
        emoji: string;
        color: string;
    }>;
    cards: CardApiData[];
}

export interface RoomStatsApiData {
    totalSessions: number;
    totalActionItems: number;
    totalParticipants: number;
    totalCards: number;
}

export async function createRoomApi(params: CreateRoomParams): Promise<RoomApiData> {
    return apiRequest<RoomApiData>('/rooms', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function getRoomsApi(): Promise<RoomApiData[]> {
    return apiRequest<RoomApiData[]>('/rooms');
}

export async function getRoomStatsApi(): Promise<RoomStatsApiData> {
    return apiRequest<RoomStatsApiData>('/rooms/stats');
}

export async function getRoomApi(id: string): Promise<RoomDetailApiData> {
    return apiRequest<RoomDetailApiData>(`/rooms/${id}`);
}

export async function addCardApi(roomId: string, columnId: string, text: string, isAnonymous?: boolean): Promise<CardApiData> {
    return apiRequest<CardApiData>(`/rooms/${roomId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ columnId, text, isAnonymous }),
    });
}

export async function deleteCardApi(cardId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/rooms/cards/${cardId}`, {
        method: 'DELETE',
    });
}

export async function updateCardPositionsApi(
    roomId: string,
    positions: Array<{ id: string; columnId: string; position: number }>
): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/rooms/${roomId}/cards/positions`, {
        method: 'PATCH',
        body: JSON.stringify({ positions }),
    });
}

export async function updateRoomStageApi(
    roomId: string,
    stage: 'brainstorming' | 'grouping' | 'voting' | 'discussion' | 'completed'
): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/rooms/${roomId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
    });
}

export async function toggleCardVoteApi(cardId: string): Promise<{ votes: string[] }> {
    return apiRequest<{ votes: string[] }>(`/rooms/cards/${cardId}/vote`, {
        method: 'POST',
    });
}

export async function addActionItemApi(
    cardId: string,
    text: string,
    assigneeId?: string
): Promise<ActionItemApiData> {
    return apiRequest<ActionItemApiData>(`/rooms/cards/${cardId}/action-items`, {
        method: 'POST',
        body: JSON.stringify({ text, assigneeId }),
    });
}

export async function toggleActionItemDoneApi(
    actionItemId: string
): Promise<{ id: string; done: boolean }> {
    return apiRequest<{ id: string; done: boolean }>(`/rooms/action-items/${actionItemId}/toggle`, {
        method: 'PATCH',
    });
}

export async function deleteActionItemApi(
    actionItemId: string
): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/rooms/action-items/${actionItemId}`, {
        method: 'DELETE',
    });
}


