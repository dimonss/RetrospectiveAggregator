import type { FastifyRequest, FastifyReply } from 'fastify';
import { getUserProfile, fetchAndSaveUserProfile } from '../modules/auth/auth.service.js';
import type { userProfiles } from '../db/schema.js';

declare module 'fastify' {
    interface FastifyRequest {
        currentUser?: typeof userProfiles.$inferSelect;
    }
}

interface JwtPayload {
    sub: string;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ message: 'Unauthorized: Missing or invalid Authorization header' });
    }

    try {
        // Perform fast in-memory JWT verification using JWT_SECRET
        const decoded = await request.jwtVerify<JwtPayload>();
        const authUserId = decoded.sub;

        let userProfile = await getUserProfile(authUserId);

        // Rare fallback: if user profile is not yet synced locally, fetch /user/me once
        if (!userProfile) {
            const token = authHeader.substring(7).trim();
            userProfile = await fetchAndSaveUserProfile(token);
        }

        request.currentUser = userProfile;
    } catch {
        return reply.status(401).send({ message: 'Unauthorized: Invalid token' });
    }
}

