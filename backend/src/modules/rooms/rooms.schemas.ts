import { z } from 'zod';

export const createRoomSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    template: z.enum(['went-well', 'mad-sad-glad', 'start-stop-continue']),
    anonymousMode: z.boolean().default(false),
});

export const roomResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    template: z.string(),
    stage: z.string(),
    facilitatorId: z.string(),
    anonymousMode: z.boolean(),
    inviteLink: z.string(),
    participantCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const roomListResponseSchema = z.array(roomResponseSchema);


export const cardSchema = z.object({
    id: z.string(),
    text: z.string(),
    authorId: z.string(),
    columnId: z.string(),
    votes: z.array(z.string()),
    clusterId: z.string().optional().nullable(),
    isAnonymous: z.boolean(),
    createdAt: z.string(),
});

export const columnSchema = z.object({
    id: z.string(),
    title: z.string(),
    emoji: z.string(),
    color: z.string(),
});

export const participantProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
    color: z.string(),
});

export const roomDetailResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    template: z.string(),
    stage: z.string(),
    facilitatorId: z.string(),
    anonymousMode: z.boolean(),
    inviteLink: z.string(),
    participantCount: z.number(),
    participantIds: z.array(z.string()),
    participants: z.array(participantProfileSchema).optional(),
    columns: z.array(columnSchema),
    cards: z.array(cardSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createCardSchema = z.object({
    text: z.string().min(1, 'Card text is required'),
    columnId: z.string().min(1, 'Column ID is required'),
    isAnonymous: z.boolean().optional(),
});

export const deleteCardParamsSchema = z.object({
    cardId: z.string(),
});

export const deleteCardResponseSchema = z.object({
    success: z.boolean(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomDetailResponse = z.infer<typeof roomDetailResponseSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type CardResponse = z.infer<typeof cardSchema>;

export const roomStatsResponseSchema = z.object({
    totalSessions: z.number(),
    totalActionItems: z.number(),
    totalParticipants: z.number(),
    totalCards: z.number(),
});

export type RoomStatsResponse = z.infer<typeof roomStatsResponseSchema>;

