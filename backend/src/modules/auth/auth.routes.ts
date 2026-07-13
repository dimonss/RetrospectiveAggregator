import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
    telegramAuthSchema,
    googleAuthSchema,
    refreshTokenSchema,
    authResponseSchema,
    tokenPairResponseSchema,
    messageResponseSchema,
    userProfileResponseSchema,
} from './auth.schemas.js';
import {
    loginTelegram,
    loginGoogle,
    refreshTokens,
    logout,
    getUserProfile,
} from './auth.service.js';

export async function authRoutes(app: FastifyInstance) {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();

    // POST /auth/telegram
    typedApp.post(
        '/auth/telegram',
        {
            schema: {
                tags: ['Auth'],
                description: 'Login via Telegram (proxied to ChalyshAuth)',
                body: telegramAuthSchema,
                response: {
                    200: authResponseSchema,
                    401: messageResponseSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                const { authResponse, localUser } = await loginTelegram(request.body);
                return reply.send({
                    accessToken: authResponse.accessToken,
                    refreshToken: authResponse.refreshToken,
                    user: {
                        id: localUser.id,
                        authUserId: localUser.authUserId,
                        telegramId: localUser.telegramId,
                        googleId: localUser.googleId,
                        email: localUser.email,
                        firstName: localUser.firstName,
                        lastName: localUser.lastName,
                        username: localUser.username,
                        photoUrl: localUser.photoUrl,
                    },
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Authentication failed';
                return reply.status(401).send({ message });
            }
        },
    );

    // POST /auth/google
    typedApp.post(
        '/auth/google',
        {
            schema: {
                tags: ['Auth'],
                description: 'Login via Google (proxied to ChalyshAuth)',
                body: googleAuthSchema,
                response: {
                    200: authResponseSchema,
                    401: messageResponseSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                const { authResponse, localUser } = await loginGoogle(request.body.idToken);
                return reply.send({
                    accessToken: authResponse.accessToken,
                    refreshToken: authResponse.refreshToken,
                    user: {
                        id: localUser.id,
                        authUserId: localUser.authUserId,
                        telegramId: localUser.telegramId,
                        googleId: localUser.googleId,
                        email: localUser.email,
                        firstName: localUser.firstName,
                        lastName: localUser.lastName,
                        username: localUser.username,
                        photoUrl: localUser.photoUrl,
                    },
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Authentication failed';
                return reply.status(401).send({ message });
            }
        },
    );

    // POST /auth/refresh
    typedApp.post(
        '/auth/refresh',
        {
            schema: {
                tags: ['Auth'],
                description: 'Refresh token pair (proxied to ChalyshAuth)',
                body: refreshTokenSchema,
                response: {
                    200: tokenPairResponseSchema,
                    401: messageResponseSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                const result = await refreshTokens(request.body.refreshToken);
                return reply.send(result);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Token refresh failed';
                return reply.status(401).send({ message });
            }
        },
    );

    // POST /auth/logout
    typedApp.post(
        '/auth/logout',
        {
            schema: {
                tags: ['Auth'],
                description: 'Logout (proxied to ChalyshAuth)',
                body: refreshTokenSchema,
                response: {
                    200: messageResponseSchema,
                    400: messageResponseSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                await logout(request.body.refreshToken);
                return reply.send({ message: 'Logged out successfully' });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Logout failed';
                return reply.status(400).send({ message });
            }
        },
    );

    // GET /auth/me
    typedApp.get(
        '/auth/me',
        {
            schema: {
                tags: ['Auth'],
                description: 'Get current user profile (requires Bearer token)',
                security: [{ bearerAuth: [] }],
                response: {
                    200: userProfileResponseSchema,
                    401: messageResponseSchema,
                    404: messageResponseSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                await request.jwtVerify();
            } catch {
                return reply.status(401).send({ message: 'Unauthorized' });
            }

            const payload = request.user as { sub: string };
            const profile = await getUserProfile(payload.sub);

            if (!profile) {
                return reply.status(404).send({ message: 'User profile not found' });
            }

            return reply.send(profile);
        },
    );
}
