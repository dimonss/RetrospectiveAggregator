const API_BASE = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL.slice(0, -1)}/api`
    : `${import.meta.env.BASE_URL}api`;

export type AuthProviderType = 'google' | 'telegram';
export const APP_ID = 'retrospective';
const APP_PROVIDER_KEY = `${APP_ID}_auth_provider`;

export function hasTokensFor(provider: AuthProviderType): boolean {
    return !!localStorage.getItem(`${provider}_accessToken`) && !!localStorage.getItem(`${provider}_refreshToken`);
}

export function getAvailableProviders(): AuthProviderType[] {
    const list: AuthProviderType[] = [];
    if (hasTokensFor('google')) list.push('google');
    if (hasTokensFor('telegram')) list.push('telegram');
    return list;
}

export function getActiveProvider(): AuthProviderType | null {
    const hasGoogle = hasTokensFor('google');
    const hasTelegram = hasTokensFor('telegram');

    if (!hasGoogle && !hasTelegram) {
        return null;
    }
    if (hasGoogle && !hasTelegram) {
        return 'google';
    }
    if (hasTelegram && !hasGoogle) {
        return 'telegram';
    }

    const stored = localStorage.getItem(APP_PROVIDER_KEY) as AuthProviderType | null;
    if (stored === 'google' || stored === 'telegram') {
        return stored;
    }

    return 'google';
}

export function setActiveProvider(provider: AuthProviderType) {
    localStorage.setItem(APP_PROVIDER_KEY, provider);
}

export function getTokens() {
    const provider = getActiveProvider();
    if (!provider) {
        return { accessToken: null, refreshToken: null, provider: null };
    }
    return {
        accessToken: localStorage.getItem(`${provider}_accessToken`),
        refreshToken: localStorage.getItem(`${provider}_refreshToken`),
        provider,
    };
}

export function setTokens(accessToken: string, refreshToken: string, provider?: AuthProviderType) {
    const targetProvider = provider || getActiveProvider() || 'google';
    localStorage.setItem(`${targetProvider}_accessToken`, accessToken);
    localStorage.setItem(`${targetProvider}_refreshToken`, refreshToken);
    localStorage.setItem(APP_PROVIDER_KEY, targetProvider);
}

export function clearTokens(target?: AuthProviderType | 'all' | boolean) {
    if (target === 'all' || target === false) {
        localStorage.removeItem('google_accessToken');
        localStorage.removeItem('google_refreshToken');
        localStorage.removeItem('google_user');
        localStorage.removeItem('telegram_accessToken');
        localStorage.removeItem('telegram_refreshToken');
        localStorage.removeItem('telegram_user');
        localStorage.removeItem(APP_PROVIDER_KEY);
        return;
    }

    const providerToRemove = (target === 'google' || target === 'telegram') ? target : getActiveProvider();
    if (providerToRemove) {
        localStorage.removeItem(`${providerToRemove}_accessToken`);
        localStorage.removeItem(`${providerToRemove}_refreshToken`);
        localStorage.removeItem(`${providerToRemove}_user`);
        const remaining = getActiveProvider();
        if (remaining) {
            localStorage.setItem(APP_PROVIDER_KEY, remaining);
        } else {
            localStorage.removeItem(APP_PROVIDER_KEY);
        }
    }
}


let refreshPromise: Promise<boolean> | null = null;
type UnauthorizedHandler = () => void;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export function setOnUnauthorized(callback: UnauthorizedHandler | null) {
    onUnauthorizedCallback = callback;
}

function handleUnauthorized() {
    clearTokens();
    if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
    }
}

async function refreshAccessToken(): Promise<boolean> {
    const { refreshToken } = getTokens();
    if (!refreshToken) return false;

    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) return false;

            const data = await response.json() as { accessToken: string; refreshToken: string };
            if (!data.accessToken || !data.refreshToken) return false;

            setTokens(data.accessToken, data.refreshToken);
            return true;
        } catch (err) {
            notifyNetworkError();
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

import { notifyNetworkError } from '../context/OfflineContext';
import { showGlobalToast } from '../context/ToastContext';

export interface ApiRequestOptions extends RequestInit {
    retries?: number;
    retryDelay?: number;
    silentError?: boolean;
}

function isRetryableError(response?: Response, isNetworkErr?: boolean): boolean {
    if (isNetworkErr) return true;
    if (!response) return true;
    // Retry on 5xx Server Errors or 429 Too Many Requests
    return response.status >= 500 || response.status === 429;
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const maxRetries = options.retries ?? 3;
    const retryDelay = options.retryDelay ?? 10000; // 10 seconds default interval
    const silentError = options.silentError ?? false;

    let attempt = 0;

    while (attempt <= maxRetries) {
        const { accessToken } = getTokens();

        const headers: Record<string, string> = {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...((options.headers as Record<string, string>) || {}),
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let response: Response | undefined = undefined;
        let isNetworkError = false;

        try {
            response = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
            });
        } catch (err) {
            isNetworkError = true;
            notifyNetworkError();
        }

        // Handle 401 token refresh if applicable
        if (response && response.status === 401) {
            const { refreshToken } = getTokens();
            if (refreshToken) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    const newTokens = getTokens();
                    headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                    try {
                        response = await fetch(`${API_BASE}${path}`, {
                            ...options,
                            headers,
                        });
                        isNetworkError = false;
                    } catch (err) {
                        isNetworkError = true;
                        notifyNetworkError();
                    }
                }
            }

            if (response && response.status === 401) {
                handleUnauthorized();
            }
        }

        // If request succeeded (2xx)
        if (response && response.ok) {
            return response.json() as Promise<T>;
        }

        // Check if we should retry
        const canRetry = attempt < maxRetries && isRetryableError(response, isNetworkError);

        if (canRetry) {
            attempt++;
            const delayMs = retryDelay;

            if (!silentError) {
                showGlobalToast({
                    type: 'warning',
                    title: 'Временный сбой связи',
                    message: `Не удалось выполнить запрос к серверу. Следующая попытка (${attempt}/${maxRetries}) через 10 секунд...`,
                    duration: delayMs - 500,
                });
            }

            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
        }

        // If we reach here, request failed and retries (if any) are exhausted
        let errorMessage = 'Ошибка соединения с сервером';
        if (response) {
            const errData = await response.json().catch(() => ({ message: `Ошибка сервера (код ${response.status})` })) as { message?: string };
            errorMessage = errData.message || `Ошибка ${response.status}`;
        }

        if (!silentError) {
            showGlobalToast({
                type: 'error',
                title: 'Ошибка операции',
                message: errorMessage,
                duration: 6000,
                action: {
                    label: 'Повторить',
                    onClick: () => {
                        apiRequest<T>(path, options).catch(() => {});
                    },
                },
            });
        }

        throw new Error(errorMessage);
    }

    throw new Error('Превышено количество попыток подключения');
}

