import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth.middleware.js';
import {
    createRoomSchema,
    roomResponseSchema,
    roomListResponseSchema,
    roomDetailResponseSchema,
    roomStatsResponseSchema,
    createCardSchema,
    cardSchema,
    deleteCardParamsSchema,
    deleteCardResponseSchema,
    updateCardPositionsSchema,
    updateStageSchema,
    errorResponseSchema,
} from './rooms.schemas.js';
import {
    createRoom,
    getUserRooms,
    getRoomById,
    getUserStats,
    addCardToRoom,
    deleteCardFromRoom,
    updateCardPositions,
    updateRoomStage,
} from './rooms.service.js';

export async function roomsRoutes(app: FastifyInstance) {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();

    // POST /rooms - Create room
    typedApp.post(
        '/rooms',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Rooms'],
                description: 'Create a new retrospective room',
                security: [{ bearerAuth: [] }],
                body: createRoomSchema,
                response: {
                    201: roomResponseSchema,
                    401: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const room = await createRoom(user, request.body);
            return reply.status(201).send(room);
        },
    );

    // GET /rooms - List current user rooms
    typedApp.get(
        '/rooms',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Rooms'],
                description: 'Get all rooms for the authenticated user',
                security: [{ bearerAuth: [] }],
                response: {
                    200: roomListResponseSchema,
                    401: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const rooms = await getUserRooms(user.id);
            return reply.send(rooms);
        },
    );

    // GET /rooms/stats - Get statistics for current user
    typedApp.get(
        '/rooms/stats',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Rooms'],
                description: 'Get room statistics and metrics for the authenticated user',
                security: [{ bearerAuth: [] }],
                response: {
                    200: roomStatsResponseSchema,
                    401: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const stats = await getUserStats(user.id);
            return reply.send(stats);
        },
    );

    // GET /rooms/:id - Get room detail by id
    typedApp.get(
        '/rooms/:id',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Rooms'],
                description: 'Get detailed room information by ID (cards, columns, etc.)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: roomDetailResponseSchema,
                    401: errorResponseSchema,
                    404: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const { id } = request.params as { id: string };
            const room = await getRoomById(id, user);

            if (!room) {
                return reply.status(404).send({ message: 'Room not found' });
            }

            return reply.send(room);
        },
    );

    // PATCH /rooms/:id/stage - Update room stage
    typedApp.patch(
        '/rooms/:id/stage',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Rooms'],
                description: 'Update retrospective room stage (facilitator only)',
                security: [{ bearerAuth: [] }],
                body: updateStageSchema,
                response: {
                    200: z.object({ success: z.boolean() }),
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const { id } = request.params as { id: string };
            try {
                await updateRoomStage(id, user, request.body.stage);
                return reply.send({ success: true });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Forbidden';
                return reply.status(403).send({ message });
            }
        },
    );

    // POST /rooms/:id/cards - Add card to room
    typedApp.post(
        '/rooms/:id/cards',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Cards'],
                description: 'Add a new card to a retrospective room',
                security: [{ bearerAuth: [] }],
                body: createCardSchema,
                response: {
                    201: cardSchema,
                    401: errorResponseSchema,
                    404: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const { id } = request.params as { id: string };
            try {
                const card = await addCardToRoom(id, user, request.body);
                return reply.status(201).send(card);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error adding card';
                return reply.status(404).send({ message });
            }
        },
    );

    // PATCH /rooms/:id/cards/positions - Update card positions and columns
    typedApp.patch(
        '/rooms/:id/cards/positions',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Cards'],
                description: 'Update card positions and column assignments (facilitator only)',
                security: [{ bearerAuth: [] }],
                body: updateCardPositionsSchema,
                response: {
                    200: z.object({ success: z.boolean() }),
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const { id } = request.params as { id: string };
            try {
                await updateCardPositions(id, user, request.body);
                return reply.send({ success: true });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Forbidden';
                return reply.status(403).send({ message });
            }
        },
    );

    // DELETE /rooms/cards/:cardId - Delete card
    typedApp.delete(
        '/rooms/cards/:cardId',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Cards'],
                description: 'Delete a card from a room',
                security: [{ bearerAuth: [] }],
                params: deleteCardParamsSchema,
                response: {
                    200: deleteCardResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const { cardId } = request.params as { cardId: string };
            try {
                const deleted = await deleteCardFromRoom(cardId, user);
                if (!deleted) {
                    return reply.status(404).send({ message: 'Card not found' });
                }
                return reply.send({ success: true });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Forbidden';
                return reply.status(403).send({ message });
            }
        },
    );
}
