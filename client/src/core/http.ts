export function baseAdjust(url: string): string {
    if (url.startsWith("/")) url = url.slice(1);
    return import.meta.env.BASE_URL + url;
}

export const http = {
    delete: _delete,
    get,
    patchJson,
    post,
    postJson,
};

async function get(url: string): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(import.meta.env.BASE_URL + url);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function post(url: string, body?: any): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(import.meta.env.BASE_URL + url, {
        method: "POST",
        body,
    });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function postJson(url: string, data?: any): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(import.meta.env.BASE_URL + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
    });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function patchJson(url: string, data?: any): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(import.meta.env.BASE_URL + url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
    });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
async function _delete(url: string): Promise<Response> {
    if (url.startsWith("/")) url = url.slice(1);
    return fetch(import.meta.env.BASE_URL + url, {
        method: "DELETE",
    });
}
