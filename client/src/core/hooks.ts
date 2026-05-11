export interface HookMap {}

export type HookHandler<K extends keyof HookMap> = (
    value: HookMap[K]["value"],
    context: HookMap[K]["args"],
) => HookMap[K]["value"];

const handlers: { [K in keyof HookMap]?: HookHandler<K>[] } = {};

function tap<K extends keyof HookMap>(hook: K, handler: HookHandler<K>): () => void {
    if (!handlers[hook]) {
        handlers[hook] = [];
    }
    handlers[hook]!.push(handler);
    return () => untap(hook, handler);
}

/**
 * Execute all handlers in registration order, passing the initialValue through the pipeline.
 * Synchronously returns the final modified value.
 *
 * If a handler throws an exception, the pipeline is interrupted, returning the current value and logging the error.
 */
function pipe<K extends keyof HookMap, V extends HookMap[K]["value"]>(
    hook: K,
    initialValue: V,
    context: HookMap[K]["args"],
): V {
    const hookHandlers = handlers[hook];
    if (!hookHandlers || hookHandlers.length === 0) return initialValue;

    let value: HookMap[K]["value"] = initialValue;
    for (const handler of hookHandlers) {
        try {
            value = handler(value, context);
        } catch (err) {
            console.error(`[HookSystem] Handler error for hook "${hook as string}":`, err);
            break;
        }
    }
    return value as V;
}

function untap<K extends keyof HookMap>(hook: K, handler: HookHandler<K>): void {
    const hookHandlers = handlers[hook];
    if (!hookHandlers) return;
    const idx = hookHandlers.indexOf(handler);
    if (idx !== -1) hookHandlers.splice(idx, 1);
}

export const hooks = { tap, pipe };
