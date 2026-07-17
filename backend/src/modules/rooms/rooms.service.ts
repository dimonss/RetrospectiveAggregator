import { eq, count } from 'drizzle-orm';
import { getDb } from '../../db/connection.js';
import { retroRooms, retroParticipants, userProfiles } from '../../db/schema.js';
import type { CreateRoomInput, RoomResponse } from './rooms.schemas.js';

function buildInviteLink(roomId: string): string {
    return `https://chalysh.pro/dev/retro/${roomId}`;
}

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

    // Select rooms where user is a participant
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
): Promise<RoomResponse | null> {
    const db = getDb();

    const room = db
        .select()
        .from(retroRooms)
        .where(eq(retroRooms.id, roomId))
        .get();

    if (!room) {
        return null;
    }

    // Check if user is already a participant, if not, join as participant
    const existingParticipant = db
        .select()
        .from(retroParticipants)
        .where(eq(retroParticipants.roomId, roomId))
        .all()
        .find(p => p.userId === userProfile.id);

    if (!existingParticipant) {
        db.insert(retroParticipants)
            .values({
                roomId: room.id,
                userId: userProfile.id,
                role: 'participant',
            })
            .run();
    }

    const participantCountRes = db
        .select({ value: count() })
        .from(retroParticipants)
        .where(eq(retroParticipants.roomId, room.id))
        .get();

    return {
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
    };
}
