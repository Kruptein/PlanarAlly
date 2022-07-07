import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import type { Sync } from "../../../core/models/types";
import { getGameState } from "../../../store/_game";
import { clientStore } from "../../../store/client";
import { settingsStore } from "../../../store/settings";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { initiativeStore } from "../../ui/initiative/state";
import { floorSystem } from "../floors";

import { sendShapeAddOwner, sendShapeDeleteOwner, sendShapeUpdateDefaultOwner, sendShapeUpdateOwner } from "./emits";
import { accessToServer, ownerToServer } from "./helpers";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "./models";
import type { ACCESS_KEY, ShapeAccess, ShapeOwner } from "./models";
import { accessState } from "./state";

const { _$, activeTokens } = accessState;

type AccessMap = Map<ACCESS_KEY, ShapeAccess>;

class AccessSystem implements ShapeSystem {
    // If a LocalId is NOT in the access map,
    // it is assumed to have default access settings
    // this is the case for the vast majority of shapes
    // and would thus just waste memory
    private access: Map<LocalId, AccessMap> = new Map();

    // REACTIVE

    loadState(id: LocalId): void {
        _$.id = id;
        _$.id = id;
        _$.playerAccess.clear();
        for (const [user, access] of this.access.get(id) ?? []) {
            if (user === DEFAULT_ACCESS_SYMBOL) {
                _$.defaultAccess = { ...access };
            } else {
                _$.playerAccess.set(user, { ...access });
            }
        }
    }

    dropState(): void {
        _$.id = undefined;
    }

    // BEHAVIOUR

    clear(): void {
        this.dropState();
        _$.activeTokenFilters?.clear();
        _$.ownedTokens.clear();
        this.access.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, access: { default: ShapeAccess; extra: ShapeOwner[] }): void {
        const accessMap: AccessMap = new Map();

        // Default Access
        if (access.default.edit || access.default.movement || access.default.vision) {
            accessMap.set(DEFAULT_ACCESS_SYMBOL, access.default);
            if (_$.id === id) {
                _$.defaultAccess = access.default;
            }
        } else {
            accessMap.delete(DEFAULT_ACCESS_SYMBOL);
            if (_$.id === id) {
                _$.defaultAccess = access.default;
            }
        }

        // Player Access
        for (const extra of access.extra) {
            accessMap.set(extra.user, extra.access);
            if (_$.id === id) {
                _$.playerAccess.set(extra.user, extra.access);
            }
        }

        // Commit
        this.access.set(id, accessMap);
        initiativeStore._forceUpdate();
    }

    drop(id: LocalId): void {
        this.access.delete(id);
        if (_$.id === id) {
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
        if (getGameState().isDm) return true;

        const shape = getShape(id);
        if (shape === undefined) return false;

        if (shape.isToken && limitToActiveTokens) {
            if (!activeTokens.value.has(id)) {
                return false;
            }
        }

        if (getGameState().isFakePlayer) return true;

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

        if (_$.id === shapeId) {
            _$.playerAccess.set(user, userAccess);
        }

        // todo: some sort of event register instead of calling these other systems manually ?
        if (userAccess.vision && user === clientStore.state.username) {
            const shape = getShape(shapeId);
            if (shape !== undefined && shape.isToken) {
                this.addOwnedToken(shapeId);
            }
        }

        if (settingsStore.fowLos.value) floorSystem.invalidateLightAllFloors();
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
                    this.addOwnedToken(shapeId);
                } else {
                    this.removeOwnedToken(shapeId);
                }
            }
        }

        // Commit to state
        const newAccess = { ...oldAccess, ...access };
        this.access.get(shapeId)!.set(user, newAccess);

        if (_$.id === shapeId) {
            if (user === DEFAULT_ACCESS_SYMBOL) {
                _$.defaultAccess = newAccess;
            } else {
                _$.playerAccess.set(user, newAccess);
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

        if (settingsStore.fowLos.value) floorSystem.invalidateLightAllFloors();
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

        if (_$.id === shapeId) {
            _$.playerAccess.delete(user);
        }

        if (oldAccess.vision && user === clientStore.state.username) {
            const shape = getShape(shapeId);
            if (shape !== undefined && shape.isToken) {
                this.removeOwnedToken(shapeId);
            }
        }

        if (settingsStore.fowLos.value) floorSystem.invalidateLightAllFloors();
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

    // Owned/Active Tokens

    setActiveTokens(...tokens: LocalId[]): void {
        _$.activeTokenFilters = new Set(tokens);
        floorSystem.invalidateLightAllFloors();
    }

    unsetActiveTokens(): void {
        _$.activeTokenFilters = undefined;
        floorSystem.invalidateLightAllFloors();
    }

    addActiveToken(token: LocalId): void {
        if (_$.activeTokenFilters === undefined) return;
        _$.activeTokenFilters.add(token);
        if (_$.activeTokenFilters.size === _$.ownedTokens.size) _$.activeTokenFilters = undefined;
        floorSystem.invalidateLightAllFloors();
    }

    removeActiveToken(token: LocalId): void {
        if (_$.activeTokenFilters === undefined) {
            _$.activeTokenFilters = new Set([..._$.ownedTokens]);
        }
        _$.activeTokenFilters.delete(token);
        floorSystem.invalidateLightAllFloors();
    }

    addOwnedToken(token: LocalId): void {
        _$.ownedTokens.add(token);
    }

    removeOwnedToken(token: LocalId): void {
        _$.ownedTokens.delete(token);
    }
}

export const accessSystem = new AccessSystem();
registerSystem("access", accessSystem, true, accessState);
