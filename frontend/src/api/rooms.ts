import { apiRequest } from './client';

export interface CreateRoomParams {
    name: string;
    template: 'went-well' | 'mad-sad-glad' | 'start-stop-continue';
    anonymousMode?: boolean;
}

export interface RoomApiData {
    id: string;
    name: string;
    template: 'went-well' | 'mad-sad-glad' | 'start-stop-continue';
    stage: 'brainstorming' | 'grouping' | 'voting' | 'discussion';
    facilitatorId: string;
    anonymousMode: boolean;
    inviteLink: string;
    participantCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CardApiData {
    id: string;
    text: string;
    authorId: string;
    columnId: string;
    votes: string[];
    clusterId?: string | null;
    isAnonymous: boolean;
    createdAt: string;
}

export interface RoomDetailApiData extends RoomApiData {
    participantIds: string[];
    columns: Array<{
        id: string;
        title: string;
        emoji: string;
        color: string;
    }>;
    cards: CardApiData[];
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

export async function getRoomApi(id: string): Promise<RoomDetailApiData> {
    return apiRequest<RoomDetailApiData>(`/rooms/${id}`);
}

export async function addCardApi(roomId: string, columnId: string, text: string): Promise<CardApiData> {
    return apiRequest<CardApiData>(`/rooms/${roomId}/cards`, {
        method: 'POST',
        body: JSON.stringify({ columnId, text }),
    });
}

export async function deleteCardApi(cardId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/rooms/cards/${cardId}`, {
        method: 'DELETE',
    });
}
