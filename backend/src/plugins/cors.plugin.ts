import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

export default fp(async function corsPlugin(app: FastifyInstance) {
    await app.register(cors, {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
});

