import { eq } from 'drizzle-orm';
import { getDb } from '../../db/connection.js';
import { userProfiles } from '../../db/schema.js';
import { getEnv } from '../../config/env.js';

interface ChalyshAuthUser {
    id: string;
    telegramId: string | null;
    googleId: string | null;
    email: string | null;
    firstName: string;
    lastName: string | null;
    username: string | null;
    photoUrl: string | null;
}

interface ChalyshAuthResponse {
    accessToken: string;
    refreshToken: string;
    user: ChalyshAuthUser;
}

interface TokenPairResponse {
    accessToken: string;
    refreshToken: string;
}

async function proxyToAuth(path: string, body: unknown): Promise<Response> {
    const env = getEnv();
    const url = `${env.AUTH_SERVICE_URL}${path}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    return response;
}

export async function loginTelegram(data: unknown): Promise<{ authResponse: ChalyshAuthResponse; localUser: typeof userProfiles.$inferSelect }> {
    const response = await proxyToAuth('/auth/telegram', data);

    if (!response.ok) {
        const error = await response.json() as { message: string };
        throw new Error(error.message || 'Authentication failed');
    }

    const authResponse = await response.json() as ChalyshAuthResponse;
    const localUser = await upsertUserProfile(authResponse.user);

    return { authResponse, localUser };
}

export async function loginGoogle(idToken: string): Promise<{ authResponse: ChalyshAuthResponse; localUser: typeof userProfiles.$inferSelect }> {
    const response = await proxyToAuth('/auth/google', { idToken });

    if (!response.ok) {
        const error = await response.json() as { message: string };
        throw new Error(error.message || 'Authentication failed');
    }

    const authResponse = await response.json() as ChalyshAuthResponse;
    const localUser = await upsertUserProfile(authResponse.user);

    return { authResponse, localUser };
}

export async function refreshTokens(refreshToken: string): Promise<TokenPairResponse> {
    const response = await proxyToAuth('/auth/refresh', { refreshToken });

    if (!response.ok) {
        const error = await response.json() as { message: string };
        throw new Error(error.message || 'Token refresh failed');
    }

    return await response.json() as TokenPairResponse;
}

export async function logout(refreshToken: string): Promise<void> {
    const response = await proxyToAuth('/auth/logout', { refreshToken });

    if (!response.ok) {
        const error = await response.json() as { message: string };
        throw new Error(error.message || 'Logout failed');
    }
}

export async function verifyTokenWithChalyshAuth(token: string): Promise<typeof userProfiles.$inferSelect> {
    const env = getEnv();
    const url = `${env.AUTH_SERVICE_URL}/user/me`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Invalid token');
    }

    const authUser = await response.json() as ChalyshAuthUser;
    const localUser = await upsertUserProfile(authUser);
    return localUser;
}

export async function getUserProfile(authUserId: string) {
    const db = getDb();

    const profile = db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.authUserId, authUserId))
        .get();

    return profile || null;
}

export async function upsertUserProfile(authUser: ChalyshAuthUser) {
    const db = getDb();

    const existing = db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.authUserId, authUser.id))
        .get();

    if (existing) {
        const updated = db
            .update(userProfiles)
            .set({
                telegramId: authUser.telegramId,
                googleId: authUser.googleId,
                email: authUser.email,
                firstName: authUser.firstName,
                lastName: authUser.lastName,
                username: authUser.username,
                photoUrl: authUser.photoUrl,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(userProfiles.id, existing.id))
            .returning()
            .get();
        return updated!;
    }

    const created = db
        .insert(userProfiles)
        .values({
            authUserId: authUser.id,
            telegramId: authUser.telegramId,
            googleId: authUser.googleId,
            email: authUser.email,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            username: authUser.username,
            photoUrl: authUser.photoUrl,
        })
        .returning()
        .get();

    return created!;
}

