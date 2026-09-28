import { apiRequest, setTokens, clearTokens, getTokens, type AuthProviderType } from './client';


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

    setTokens(result.accessToken, result.refreshToken, 'telegram');
    if (result.user) {
        localStorage.setItem('telegram_user', JSON.stringify(result.user));
    }
    return result;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const result = await apiRequest<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
    });

    setTokens(result.accessToken, result.refreshToken, 'google');
    if (result.user) {
        localStorage.setItem('google_user', JSON.stringify(result.user));
    }
    return result;
}

export async function getMe(): Promise<UserProfile> {
    const profile = await apiRequest<UserProfile>('/auth/me');
    const provider = getTokens().provider;
    if (provider && profile) {
        localStorage.setItem(`${provider}_user`, JSON.stringify(profile));
    }
    return profile;
}

export async function logoutApi(target?: AuthProviderType | 'all'): Promise<void> {
    if (target === 'all') {
        const gRefresh = localStorage.getItem('google_refreshToken');
        const tgRefresh = localStorage.getItem('telegram_refreshToken');
        if (gRefresh) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: gRefresh }) }).catch(() => {});
        if (tgRefresh) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: tgRefresh }) }).catch(() => {});
    } else if (target) {
        const refresh = localStorage.getItem(`${target}_refreshToken`);
        if (refresh) await apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) }).catch(() => {});
    } else {
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
    }
    clearTokens(target);
}

