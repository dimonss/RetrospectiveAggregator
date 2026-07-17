import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authenticate } from '../../plugins/auth.middleware.js';
import {
    createRoomSchema,
    roomResponseSchema,
    roomListResponseSchema,
} from './rooms.schemas.js';
import {
    createRoom,
    getUserRooms,
    getRoomById,
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
                    401: { type: 'object', properties: { message: { type: 'string' } } },
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
                    401: { type: 'object', properties: { message: { type: 'string' } } },
                },
            },
        },
        async (request, reply) => {
            const user = request.currentUser!;
            const rooms = await getUserRooms(user.id);
            return reply.send(rooms);
        },
    );

    // GET /rooms/:id - Get room by id
    typedApp.get(
        '/rooms/:id',
        {
            preHandler: [authenticate],
            schema: {
                tags: ['Rooms'],
                description: 'Get room details by ID (joins user as participant if new)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: roomResponseSchema,
                    401: { type: 'object', properties: { message: { type: 'string' } } },
                    404: { type: 'object', properties: { message: { type: 'string' } } },
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
}
