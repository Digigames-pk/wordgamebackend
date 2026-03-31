function xsrfToken(): string {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

function csrfMeta(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
    const method = (init.method ?? 'GET').toUpperCase();
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
