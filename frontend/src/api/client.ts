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
        } catch {
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function apiRequest<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const { accessToken } = getTokens();

    const headers: Record<string, string> = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    // Auto-refresh on 401
    if (response.status === 401) {
        const { refreshToken } = getTokens();
        if (refreshToken) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                const newTokens = getTokens();
                headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                response = await fetch(`${API_BASE}${path}`, {
                    ...options,
                    headers,
                });
            }
        }

        if (response.status === 401) {
            handleUnauthorized();
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Ошибка запроса' })) as { message: string };
        throw new Error(error.message);
    }

    return response.json() as Promise<T>;
}

export { setTokens, getTokens };

