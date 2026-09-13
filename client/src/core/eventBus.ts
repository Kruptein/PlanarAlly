export interface EventMap {}

export type EventHandler<K extends keyof EventMap> = (payload: EventMap[K]) => void | Promise<void>;

const listeners: { [K in keyof EventMap]?: EventHandler<K>[] } = {};

function on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void {
    if (!listeners[event]) {
        listeners[event] = [];
    }
    listeners[event]!.push(handler);
    return () => off(event, handler);
}

function once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void {
    const wrapper = ((payload: EventMap[K]) => {
        off(event, wrapper);
        return handler(payload);
    }) as EventHandler<K>;
    return on(event, wrapper);
}

function emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const handlers = listeners[event];
    if (!handlers || handlers.length === 0) return;

    for (const handler of handlers) {
        try {
            const result = handler(payload);
            if (result instanceof Promise) {
                result.catch((err) => {
                    console.error(`[EventBus] Async handler error for event "${event as string}":`, err);
                });
            }
        } catch (err) {
            console.error(`[EventBus] Handler error for event "${event as string}":`, err);
        }
    }
}

function off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    const handlers = listeners[event];
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
}

export interface EventBus {
    on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void;
    once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void;
    emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
}

export const eventBus: EventBus = { on, once, emit };
