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

export async function createRoomApi(params: CreateRoomParams): Promise<RoomApiData> {
    return apiRequest<RoomApiData>('/rooms', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function getRoomsApi(): Promise<RoomApiData[]> {
    return apiRequest<RoomApiData[]>('/rooms');
}

export async function getRoomApi(id: string): Promise<RoomApiData> {
    return apiRequest<RoomApiData>(`/rooms/${id}`);
}
