import type { ApiShapeCustomData } from "../apiTypes";
import type { ElementId, UiShapeCustomData } from "../game/systems/customData/types";
// Types defined in various systems; declared here as lightweight interfaces to avoid circular references
// Actual payload carries the full runtime object
import type { Tracker, TrackerId } from "../game/systems/trackers/models";

import type { LocalId } from "./id";
import type { Sync } from "./models/types";

// ---------------------------------------------------------------------------
// EventMap — Centralized definition for all notification events
// New system events can be extended here
// ---------------------------------------------------------------------------

export interface EventMap {
    // CustomData events
    "customData:added": { id: LocalId; element: UiShapeCustomData; syncTo: Sync };
    "customData:updated": { id: LocalId; elementId: ElementId; delta: Partial<ApiShapeCustomData>; syncTo: Sync };
    "customData:removed": { id: LocalId; elementId: ElementId; syncTo: Sync };

    // Tracker events
    "tracker:added": { id: LocalId; tracker: Tracker; syncTo: Sync };
    "tracker:updated": { id: LocalId; trackerId: TrackerId; delta: Partial<Tracker>; syncTo: Sync };
    "tracker:removed": { id: LocalId; trackerId: TrackerId; syncTo: Sync };
}

type EventHandler<K extends keyof EventMap> = (payload: EventMap[K]) => void | Promise<void>;

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

export class EventBus {
    private listeners: { [K in keyof EventMap]?: EventHandler<K>[] } = {};

    /**
     * Register an event listener.
     * Returns an unsubscription function.
     */
    on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(handler);
        return () => this.off(event, handler);
    }

    /**
     * Register a one-time event listener that automatically removes itself after firing once.
     */
    once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void {
        const wrapper = ((payload: EventMap[K]) => {
            this.off(event, wrapper);
            return handler(payload);
        }) as EventHandler<K>;
        return this.on(event, wrapper);
    }

    /**
     * Trigger an event (fire-and-forget).
     * Synchronous handlers execute sequentially; asynchronous handlers' Promises only catch exceptions.
     * Handler exceptions are logged via console.error and do not affect other handlers.
     */
    emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
        const handlers = this.listeners[event];
        if (!handlers || handlers.length === 0) return;

        for (const handler of handlers) {
            try {
                const result = handler(payload);
                if (result instanceof Promise) {
                    result.catch((err) => {
                        console.error(`[EventBus] Async handler error for event "${String(event)}":`, err);
                    });
                }
            } catch (err) {
                console.error(`[EventBus] Handler error for event "${String(event)}":`, err);
            }
        }
    }

    private off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
        const handlers = this.listeners[event];
        if (!handlers) return;
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
    }
}

export const eventBus = new EventBus();
