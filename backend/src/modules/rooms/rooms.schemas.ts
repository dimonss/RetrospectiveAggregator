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

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
