import type { ApiShapeCustomData } from "../apiTypes";
import type { UiShapeCustomData } from "../game/systems/customData/types";
import type { Tracker } from "../game/systems/trackers/models";

import type { LocalId } from "./id";
import type { Sync } from "./models/types";

// ---------------------------------------------------------------------------
// HookMap — Centralized definition for all interceptive hooks
// Each hook defines args (immutable context) and value (modifiable by pipeline)
// ---------------------------------------------------------------------------

export interface HookMap {
    "pre:customData:update": {
        args: { id: LocalId; element: UiShapeCustomData; syncTo: Sync };
        value: Partial<ApiShapeCustomData>;
    };
    "pre:tracker:update": {
        args: { id: LocalId; tracker: Tracker; syncTo: Sync };
        value: Partial<Tracker>;
    };
}

type HookHandler<K extends keyof HookMap> = (
    value: HookMap[K]["value"],
    context: HookMap[K]["args"],
) => HookMap[K]["value"];

// ---------------------------------------------------------------------------
// HookSystem
// ---------------------------------------------------------------------------

export class HookSystem {
    private handlers: { [K in keyof HookMap]?: HookHandler<K>[] } = {};

    /**
     * Register a hook handler (executed in registration order).
     * Returns an untap function.
     */
    tap<K extends keyof HookMap>(hook: K, handler: HookHandler<K>): () => void {
        if (!this.handlers[hook]) {
            this.handlers[hook] = [];
        }
        this.handlers[hook]!.push(handler);
        return () => this.untap(hook, handler);
    }

    /**
     * Execute all handlers in registration order, passing the initialValue through the pipeline.
     * Synchronously returns the final modified value.
     *
     * If a handler throws an exception, the pipeline is interrupted, returning the current value and logging the error.
     */
    pipe<K extends keyof HookMap>(
        hook: K,
        initialValue: HookMap[K]["value"],
        context: HookMap[K]["args"],
    ): HookMap[K]["value"] {
        const handlers = this.handlers[hook];
        if (!handlers || handlers.length === 0) return initialValue;

        let value = initialValue;
        for (const handler of handlers) {
            try {
                value = handler(value, context);
            } catch (err) {
                console.error(`[HookSystem] Handler error for hook "${String(hook)}":`, err);
                break;
            }
        }
        return value;
    }

    private untap<K extends keyof HookMap>(hook: K, handler: HookHandler<K>): void {
        const handlers = this.handlers[hook];
        if (!handlers) return;
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
    }
}

export const hooks = new HookSystem();
