import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyTokenWithChalyshAuth } from '../modules/auth/auth.service.js';
import type { userProfiles } from '../db/schema.js';

declare module 'fastify' {
    interface FastifyRequest {
        currentUser?: typeof userProfiles.$inferSelect;
    }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ message: 'Unauthorized: Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7).trim();

    try {
        const userProfile = await verifyTokenWithChalyshAuth(token);
        request.currentUser = userProfile;
    } catch {
        return reply.status(401).send({ message: 'Unauthorized: Invalid token' });
    }
}
