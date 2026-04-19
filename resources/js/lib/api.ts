function xsrfToken(): string {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function csrfMeta(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function ensureXsrfToken(): Promise<void> {
    if (xsrfToken()) {
        return;
    }
    await fetch('/sanctum/csrf-cookie', {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
        },
    });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
    const method = (init.method ?? 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        await ensureXsrfToken();
    }
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers as Record<string, string>),
    };
    const csrf = csrfMeta();
    if (csrf) {
        headers['X-CSRF-TOKEN'] = csrf;
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        headers['X-XSRF-TOKEN'] = xsrfToken();
    }
    if (init.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers,
    });

    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(err.message || err.error || res.statusText || String(res.status));
    }

    return res.json() as Promise<T>;
}

/**
 * JSON fetch to same-origin web routes (session cookie + CSRF).
 * Does not send the Inertia header so controllers can return raw JSON (e.g. Wasabi presign).
 */
export async function webSessionJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`;
    const method = (init.method ?? 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        await ensureXsrfToken();
    }
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.headers as Record<string, string>),
    };
    const csrf = csrfMeta();
    if (csrf) {
        headers['X-CSRF-TOKEN'] = csrf;
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        headers['X-XSRF-TOKEN'] = xsrfToken();
    }
    if (init.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers,
    });

    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(err.message || err.error || res.statusText || String(res.status));
    }

    return res.json() as Promise<T>;
}
