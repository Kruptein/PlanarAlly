import { computed, reactive } from "vue";
import type { ComputedRef, DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { System } from "..";
import type { Sync } from "../../../core/models/types";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { initiativeStore } from "../../ui/initiative/state";

import { sendShapeAddOwner, sendShapeDeleteOwner, sendShapeUpdateDefaultOwner, sendShapeUpdateOwner } from "./emits";
import { accessToServer, ownerToServer } from "./helpers";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "./models";
import type { ACCESS_KEY, ShapeAccess, ShapeOwner } from "./models";

interface AccessState {
    id: LocalId | undefined;
    defaultAccess: ShapeAccess;
    playerAccess: Map<string, ShapeAccess>;
}

type AccessMap = Map<ACCESS_KEY, ShapeAccess>;

class AccessSystem implements System {
    // If a LocalId is NOT in the access map,
    // it is assumed to have default access settings
    // this is the case for the vast majority of shapes
    // and would thus just waste memory
    private access: Map<LocalId, AccessMap> = new Map();

    // REACTIVE

    private _state: AccessState;
    $: {
        hasEditAccess: ComputedRef<boolean>;
        owners: ComputedRef<string[]>;
    };

    constructor() {
        this._state = reactive({
            id: undefined,
            defaultAccess: DEFAULT_ACCESS,
            playerAccess: new Map(),
        });

        this.$ = {
            hasEditAccess: computed(() => {
                if (this._state.id === undefined) return false;
                if (gameStore.state.isDm) return true;
                if (gameStore.state.isFakePlayer && gameStore.activeTokens.value.has(this._state.id)) return true;
                if (this._state.defaultAccess.edit) return true;
                const username = clientStore.state.username;
                return [...this._state.playerAccess.entries()].some(([u, a]) => u === username && a.edit === true);
            }),
            owners: computed(() => {
                if (this._state.id === undefined) return [];
                return [...this._state.playerAccess.keys()];
            }),
        };
    }

    get state(): DeepReadonly<AccessState> {
        return this._state;
    }

    loadState(id: LocalId): void {
        this._state.id = id;
        this._state.playerAccess.clear();
        for (const [user, access] of this.access.get(id) ?? []) {
            if (user === DEFAULT_ACCESS_SYMBOL) {
                this._state.defaultAccess = { ...access };
            } else {
                this._state.playerAccess.set(user, { ...access });
            }
        }
    }

    dropState(): void {
        this._state.id = undefined;
    }

    // BEHAVIOUR

    clear(): void {
        this.dropState();
        this.access.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, access: { default: ShapeAccess; extra: ShapeOwner[] }): void {
        const accessMap: AccessMap = new Map();

        // Default Access
        if (access.default.edit || access.default.movement || access.default.vision) {
            accessMap.set(DEFAULT_ACCESS_SYMBOL, access.default);
            if (this._state.id === id) {
                this._state.defaultAccess = access.default;
            }
        } else {
            accessMap.delete(DEFAULT_ACCESS_SYMBOL);
            if (this._state.id === id) {
                this._state.defaultAccess = access.default;
            }
        }

        // Player Access
        for (const extra of access.extra) {
            accessMap.set(extra.user, extra.access);
            if (this._state.id === id) {
                this._state.playerAccess.set(extra.user, extra.access);
            }
        }

        // Commit
        this.access.set(id, accessMap);
        initiativeStore._forceUpdate();
    }

    drop(id: LocalId): void {
        this.access.delete(id);
        if (this._state.id === id) {
            this.dropState();
        }
    }

    getDefault(id: LocalId): DeepReadonly<ShapeAccess> {
        return this.access.get(id)?.get(DEFAULT_ACCESS_SYMBOL) ?? DEFAULT_ACCESS;
    }

    hasAccessTo(
        id: LocalId,
        limitToActiveTokens: boolean,
        access: Partial<{ edit: boolean; vision: boolean; movement: boolean }>,
    ): boolean {
        if (gameStore.state.isDm) return true;

        const shape = getShape(id);
        if (shape === undefined) return false;

        if (shape.isToken && limitToActiveTokens) {
            if (!gameStore.activeTokens.value.has(id)) {
                return false;
            }
        }

        if (gameStore.state.isFakePlayer) return true;

        const accessMap = this.access.get(id);
        if (accessMap === undefined) return false;

        const defaultAccess = accessMap.get(DEFAULT_ACCESS_SYMBOL) ?? DEFAULT_ACCESS;

        if (
            ((access.edit ?? false) && defaultAccess.edit) ||
            ((access.movement ?? false) && defaultAccess.movement) ||
            ((access.vision ?? false) && defaultAccess.vision)
        ) {
            return true;
        }

        const userAccess = accessMap.get(clientStore.state.username);
        if (userAccess === undefined) return false;

        return (
            (access.edit ?? false ? userAccess.edit : true) &&
            (access.movement ?? false ? userAccess.movement : true) &&
            (access.vision ?? false ? userAccess.vision : true)
        );
    }

    getAccess(shapeId: LocalId, user: string): DeepReadonly<ShapeAccess> | undefined {
        return this.access.get(shapeId)?.get(user);
    }

    addAccess(shapeId: LocalId, user: string, access: Partial<ShapeAccess>, syncTo: Sync): void {
        if (this.access.get(shapeId)?.has(user) === true) {
            console.error("[ACCESS] Attempt to add access for user with access");
            return;
        }

        const userAccess = { ...DEFAULT_ACCESS, ...access };

        const shapeMap: AccessMap = this.access.get(shapeId) ?? new Map();
        shapeMap.set(user, userAccess);
        this.access.set(shapeId, shapeMap);

        if (syncTo.server) {
            sendShapeAddOwner(
                ownerToServer({
                    access: userAccess,
                    user,
                    shape: shapeId,
                }),
            );
        }

        if (this._state.id === shapeId) {
            this._state.playerAccess.set(user, userAccess);
        }

        // todo: some sort of event register instead of calling these other systems manually ?
        if (userAccess.vision && user === clientStore.state.username) {
            const shape = getShape(shapeId);
            if (shape !== undefined && shape.isToken) {
                gameStore.addOwnedToken(shapeId);
            }
        }

        if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    updateAccess(shapeId: LocalId, user: ACCESS_KEY, access: Partial<ShapeAccess>, syncTo: Sync): void {
        if (user !== DEFAULT_ACCESS_SYMBOL && this.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to update access for user without access");
            return;
        }

        const oldAccess = this.access.get(shapeId)?.get(user) ?? DEFAULT_ACCESS;

        // Check owned-token changes
        if (
            access.vision !== undefined &&
            access.vision !== oldAccess.vision &&
            (user === clientStore.state.username || user === DEFAULT_ACCESS_SYMBOL)
        ) {
            const shape = getShape(shapeId);
            if (shape !== undefined && shape.isToken) {
                if (access.vision) {
                    gameStore.addOwnedToken(shapeId);
                } else {
                    gameStore.removeOwnedToken(shapeId);
                }
            }
        }

        // Commit to state
        const newAccess = { ...oldAccess, ...access };
        this.access.get(shapeId)!.set(user, newAccess);

        if (this._state.id === shapeId) {
            if (user === DEFAULT_ACCESS_SYMBOL) {
                this._state.defaultAccess = newAccess;
            } else {
                this._state.playerAccess.set(user, newAccess);
            }
        }

        if (syncTo.server) {
            if (user === DEFAULT_ACCESS_SYMBOL) {
                sendShapeUpdateDefaultOwner({ ...accessToServer(newAccess), shape: getGlobalId(shapeId) });
            } else {
                sendShapeUpdateOwner(
                    ownerToServer({
                        access: newAccess,
                        user,
                        shape: shapeId,
                    }),
                );
            }
        }

        if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    removeAccess(shapeId: LocalId, user: string, syncTo: Sync): void {
        if (this.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to remove access for user without access");
            return;
        }

        const oldAccess = this.access.get(shapeId)!.get(user)!;
        this.access.get(shapeId)!.delete(user);

        if (syncTo.server) {
            sendShapeDeleteOwner({
                user,
                shape: getGlobalId(shapeId),
            });
        }

        if (this._state.id === shapeId) {
            this._state.playerAccess.delete(user);
        }

        if (oldAccess.vision && user === clientStore.state.username) {
            const shape = getShape(shapeId);
            if (shape !== undefined && shape.isToken) {
                gameStore.removeOwnedToken(shapeId);
            }
        }

        if (settingsStore.fowLos.value) floorStore.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    getOwners(id: LocalId): DeepReadonly<string[]> {
        return [...(this.access.get(id)?.keys() ?? [])].filter((user) => user !== DEFAULT_ACCESS_SYMBOL) as string[];
    }

    getOwnersFull(id: LocalId): DeepReadonly<ShapeOwner[]> {
        return [...(this.access.get(id)?.entries() ?? [])]
            .filter(([user]) => user !== DEFAULT_ACCESS_SYMBOL)
            .map(([user, access]) => ({
                access,
                user: user as string,
                shape: id,
            }));
    }
}

export const accessSystem = new AccessSystem();
registerSystem("access", accessSystem);
