import { state } from "./store";

export async function auth_fetch(
    path: string,
    options?: RequestInit & {
        token?: string;
    }
): Promise<Response> {
    const token = options?.token ?? state.access_token;

    return await fetch(`/api/${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        ...options,
    });
}
