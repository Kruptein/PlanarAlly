import { Store } from "../core/store";
import type { IShape } from "../game/shapes/interfaces";

import { coreStore } from "./core";
import { gameStore } from "./game";

interface LogicState {
    doors: Set<string>;

    request: { requester: string; shape: string } | undefined;
}

export enum Access {
    Enabled,
    Request,
    Disabled,
}

class LogicStore extends Store<LogicState> {
    protected data(): LogicState {
        return {
            doors: new Set(),
            request: undefined,
        };
    }

    clearRequest(): void {
        this._state.request = undefined;
    }

    handleRequest(data: { shape: string; requester: string }): void {
        this._state.request = data;
    }

    addDoor(shape: string): void {
        this._state.doors.add(shape);
    }

    removeDoor(shape: string): void {
        this._state.doors.delete(shape);
    }

    canUseDoor(shape: IShape): Access {
        if (!shape.isDoor) return Access.Disabled;
        if (!gameStore.state.isDm) {
            const conditions = shape.options.doorConditions;
            if (conditions === undefined) return Access.Disabled;
            // First specific user permissions
            if (conditions.enabled.includes(coreStore.state.username)) return Access.Enabled;
            if (conditions.request.includes(coreStore.state.username)) return Access.Request;
            if (conditions.disabled.includes(coreStore.state.username)) return Access.Disabled;
            // Check default permissions
            if (conditions.enabled.includes("default")) return Access.Enabled;
            if (conditions.request.includes("default")) return Access.Request;
            if (conditions.disabled.includes("default")) return Access.Disabled;
        }
        return Access.Enabled;
    }
}

export const logicStore = new LogicStore();
(window as any).logicStore = logicStore;
