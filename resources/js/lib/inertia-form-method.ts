import { router, type VisitOptions } from '@inertiajs/react';

/**
 * Laravel HTTP method spoofing: send POST with `_method` so strict proxies / PHP stacks
 * that mishandle PUT/PATCH/DELETE still route correctly.
 */
export function postWithMethod(
    method: 'put' | 'patch' | 'delete',
    url: string,
    data: Record<string, unknown> = {},
    options?: VisitOptions,
): ReturnType<typeof router.post> {
    return router.post(url, { ...data, _method: method }, options);
}
