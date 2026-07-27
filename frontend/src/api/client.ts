const API_BASE = import.meta.env.BASE_URL.endsWith('/')
    ? `${import.meta.env.BASE_URL.slice(0, -1)}/api`
    : `${import.meta.env.BASE_URL}api`;

function getTokens() {
    return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
    };
}

function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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

export { setTokens, getTokens };


