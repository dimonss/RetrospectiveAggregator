import { apiRequest, setTokens, clearTokens, getTokens } from './client';

interface AuthUser {
    id: string;
    authUserId: string;
    telegramId: string | null;
    googleId: string | null;
    email: string | null;
    firstName: string;
    lastName: string | null;
    username: string | null;
    photoUrl: string | null;
}

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

interface UserProfile extends AuthUser {
    createdAt: string;
    updatedAt: string;
}

export type { AuthUser, AuthResponse, UserProfile };

export async function loginWithTelegram(data: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}): Promise<AuthResponse> {
    const result = await apiRequest<AuthResponse>('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify(data),
    });

    setTokens(result.accessToken, result.refreshToken);
    return result;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const result = await apiRequest<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
    });

    setTokens(result.accessToken, result.refreshToken);
    return result;
}

export async function getMe(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/auth/me');
}

export async function logoutApi(): Promise<void> {
    const { refreshToken } = getTokens();
    if (refreshToken) {
        try {
            await apiRequest('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            // Ignore logout errors
        }
    }
    clearTokens();
}
