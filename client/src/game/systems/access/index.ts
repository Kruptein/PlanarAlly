import { type DeepReadonly } from "vue";

import type { ApiCoreShape } from "../../../apiTypes";
import type { LocalId } from "../../../core/id";
import { filter, guard } from "../../../core/iter";
import type { Sync } from "../../../core/models/types";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem, SystemInformMode } from "../../../core/systems/models";
import { coreStore } from "../../../store/core";
import { getGlobalId, getShape, getBaseShapeId } from "../../id";
import { initiativeStore } from "../../ui/initiative/state";
import { floorSystem } from "../floors";
import { gameState } from "../game/state";
import { playerSystem } from "../players";
import { locationSettingsSystem } from "../settings/location";

import { sendShapeAddOwner, sendShapeDeleteOwner, sendShapeUpdateDefaultOwner, sendShapeUpdateOwner } from "./emits";
import { accessToServer, ownerToClient, ownerToServer } from "./helpers";
import { ACCESS_LEVELS, DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL, isNonDefaultAccessSymbol } from "./models";
import type { AccessMap, ACCESS_KEY, AccessConfig, ShapeOwner, AccessLevel } from "./models";
import { accessState } from "./state";

const { mutableReactive: $, activeTokens, mutable, raw } = accessState;

class AccessSystem implements ShapeSystem<AccessMap | undefined> {
    // CORE

    clear(): void {
        this.dropState();
        for (const al of ACCESS_LEVELS) {
            $.activeTokenFilters.delete(al);
            $.ownedTokens.get(al)?.clear();
        }
        mutable.access.clear();
    }

    drop(id: LocalId): void {
        mutable.access.delete(id);
        for (const al of ACCESS_LEVELS) {
            $.ownedTokens.get(al)?.delete(id);
            $.activeTokenFilters.get(al)?.delete(id);
        }
        if ($.id === id) {
            this.dropState();
        }
    }

    import(id: LocalId, data: AccessMap | undefined, _mode: SystemInformMode): void {
        if (data === undefined) return;
        mutable.access.set(id, data);

        if ($.id === id) {
            this.loadState(id);
        }

        this._updateOwnedState(id);
        initiativeStore._forceUpdate();
    }

    export(id: LocalId): AccessMap | undefined {
        return mutable.access.get(id);
    }

    toServerShape(id: LocalId, shape: ApiCoreShape): void {
        const defaultAccess = this.getDefault(id);
        shape.default_edit_access = defaultAccess.edit;
        shape.default_vision_access = defaultAccess.vision;
        shape.default_movement_access = defaultAccess.movement;

        shape.owners = this.getOwnersFull(id).map((o) => ownerToServer(o));
    }

    fromServerShape(shape: ApiCoreShape): AccessMap | undefined {
        const defaultAccess = {
            edit: shape.default_edit_access,
            vision: shape.default_vision_access,
            movement: shape.default_movement_access,
        };

        const accessMap: AccessMap = new Map();

        // Default Access
        if (defaultAccess.edit || defaultAccess.movement || defaultAccess.vision) {
            accessMap.set(DEFAULT_ACCESS_SYMBOL, defaultAccess);
        }

        // Player Access
        for (const extra of shape.owners.map((owner) => ownerToClient(owner))) {
            accessMap.set(extra.user, extra.access);
        }

        return accessMap.size > 0 ? accessMap : undefined;
    }

    // REACTIVE

    loadState(id: LocalId): void {
        $.id = id;
        $.defaultAccess = { ...DEFAULT_ACCESS };
        $.playerAccess.clear();

        const accessMap = mutable.access.get(id);

        if (accessMap !== undefined) {
            for (const [user, access] of accessMap) {
                if (user === DEFAULT_ACCESS_SYMBOL) {
                    $.defaultAccess = { ...access };
                } else {
                    $.playerAccess.set(user, { ...access });
                }
            }
        }
    }

    dropState(): void {
        $.id = undefined;
    }

    // BEHAVIOUR

    getDefault(id: LocalId): DeepReadonly<AccessConfig> {
        return mutable.access.get(id)?.get(DEFAULT_ACCESS_SYMBOL) ?? DEFAULT_ACCESS;
    }

    // High-level access check based on owned/active state
    // Should be used by external systems
    hasAccessTo(id: LocalId, access: AccessLevel | AccessLevel[], limitToActiveTokens = false): boolean {
        id = getBaseShapeId(id);
        // 1. DMs always have access when not limiting to active tokens
        if (gameState.raw.isDm && !limitToActiveTokens) return true;

        const _access: AccessLevel[] = Array.isArray(access) ? access : [access];

        // This is an extra case to cover the special case where the shape has no attached users
        // in which case the auras would be hidden for the DM with the normal behaviour.
        // If we're not actively filtering tokens, we can assume we want to show them.
        if (gameState.raw.isDm && _access.every((al) => !raw.activeTokenFilters.has(al))) return true;

        // 2. Otherwise check in the active tokens or owned tokens depending on the limitToActiveTokens flag
        return _access.every((al) => (limitToActiveTokens ? activeTokens.value : raw.ownedTokens).get(al)?.has(id));
    }

    // Low-level internal access check
    // This decides whether a shape is regarded as owned for a certain access level
    private _hasAccessTo(id: LocalId, access: AccessLevel): boolean {
        id = getBaseShapeId(id);
        const accessMap = mutable.access.get(id);
        if (accessMap === undefined) return false;

        if (gameState.isDmOrFake.value) {
            return accessMap.values().some((a) => a[access]);
        }

        const defaultAccess = accessMap.get(DEFAULT_ACCESS_SYMBOL) ?? DEFAULT_ACCESS;
        if (defaultAccess[access]) return true;

        const playerAccess = accessMap.get(playerSystem.getCurrentPlayer()?.name ?? "");
        if (playerAccess === undefined) return false;
        return playerAccess[access];
    }

    _updateOwnedState(id: LocalId): void {
        for (const al of ACCESS_LEVELS) {
            if (this._hasAccessTo(id, al)) {
                this.addOwnedToken(id, al);
            } else {
                this.removeOwnedToken(id, al);
            }
        }
    }

    getAccess(shapeId: LocalId, user: string): DeepReadonly<AccessConfig> | undefined {
        return mutable.access.get(shapeId)?.get(user);
    }

    addAccess(shapeId: LocalId, user: string, access: Partial<AccessConfig>, syncTo: Sync): void {
        if (mutable.access.get(shapeId)?.has(user) === true) {
            console.error("[ACCESS] Attempt to add access for user with access");
            return;
        }
        if (gameState.isDmOrFake.value && coreStore.state.username === user) return;

        const userAccess = { ...DEFAULT_ACCESS, ...access };

        const shapeMap = mutable.access.get(shapeId) ?? (new Map() as AccessMap);
        shapeMap.set(user, userAccess);
        mutable.access.set(shapeId, shapeMap);

        if (syncTo.server) {
            sendShapeAddOwner(
                ownerToServer({
                    access: userAccess,
                    user,
                    shape: shapeId,
                }),
            );
        }

        if ($.id === shapeId) {
            $.playerAccess.set(user, userAccess);
        }

        this._updateOwnedState(shapeId);

        if (locationSettingsSystem.isLosActive()) floorSystem.invalidateLightAllFloors();
        if (syncTo.ui) initiativeStore._forceUpdate();
    }

    updateAccess(shapeId: LocalId, user: ACCESS_KEY, access: Partial<AccessConfig>, syncTo: Sync): void {
        if (user !== DEFAULT_ACCESS_SYMBOL && mutable.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to update access for user without access");
            return;
        }

        const oldAccess = mutable.access.get(shapeId)?.get(user) ?? DEFAULT_ACCESS;

        // Commit to state
        const newAccess = { ...oldAccess, ...access };
        if (!mutable.access.has(shapeId)) {
            mutable.access.set(shapeId, new Map());
        }
        mutable.access.get(shapeId)!.set(user, newAccess);

        // Check owned-token changes
        this._updateOwnedState(shapeId);

        if ($.id === shapeId) {
            if (user === DEFAULT_ACCESS_SYMBOL) {
                $.defaultAccess = newAccess;
            } else {
                $.playerAccess.set(user, newAccess);
            }
        }

        if (syncTo.server) {
            const shape = getGlobalId(shapeId);
            if (shape !== undefined) {
                if (user === DEFAULT_ACCESS_SYMBOL) {
                    sendShapeUpdateDefaultOwner({ ...accessToServer(newAccess), shape });
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
        }

        if (locationSettingsSystem.isLosActive()) {
            if (access.vision !== undefined && access.vision !== oldAccess.vision) {
                const shape = getShape(shapeId);
                // The shape's aura on it's normal layer might not be up to date yet at this point
                if (shape !== undefined) shape.invalidate(true);
            }
            floorSystem.invalidateLightAllFloors();
        }
        initiativeStore._forceUpdate();
    }

    removeAccess(shapeId: LocalId, user: string, syncTo: Sync): void {
        if (mutable.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to remove access for user without access");
            return;
        }

        mutable.access.get(shapeId)!.delete(user);

        // todo: note check

        if (syncTo.server) {
            const shape = getGlobalId(shapeId);
            if (shape !== undefined)
                sendShapeDeleteOwner({
                    user,
                    shape,
                });
        }

        if ($.id === shapeId) {
            $.playerAccess.delete(user);
        }

        this._updateOwnedState(shapeId);

        if (locationSettingsSystem.isLosActive()) floorSystem.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    getOwners(id: LocalId): Iterable<string> {
        return guard(mutable.access.get(id)?.keys() ?? [], isNonDefaultAccessSymbol);
    }

    getOwnersFull(id: LocalId): DeepReadonly<ShapeOwner[]> {
        return [...(mutable.access.get(id)?.entries() ?? [])]
            .filter(([user]) => user !== DEFAULT_ACCESS_SYMBOL)
            .map(([user, access]) => ({
                access,
                user: user as string,
                shape: id,
            }));
    }

    // Owned/Active Tokens

    setActiveVisionTokens(...tokens: LocalId[]): void {
        $.activeTokenFilters.set("vision", new Set(tokens));
        floorSystem.invalidateLightAllFloors();
    }

    clearActiveVisionTokens(): void {
        $.activeTokenFilters.delete("vision");
        floorSystem.invalidateLightAllFloors();
    }

    addActiveToken(token: LocalId, access: AccessLevel): void {
        const accessActiveTokens = $.activeTokenFilters.get(access);
        // If there are no current filters, it's as if all tokens are active
        // so adding another active token requires no further action
        if (accessActiveTokens === undefined) return;
        accessActiveTokens.add(token);
        if (accessActiveTokens.size === raw.ownedTokens.get(access)!.size) $.activeTokenFilters.delete(access);

        // the token itself might need re-rendering (e.g. invisible)
        getShape(token)?.invalidate(true);
        floorSystem.invalidateLightAllFloors();
    }

    removeActiveToken(token: LocalId, access: AccessLevel): void {
        const id = getBaseShapeId(token);
        const accessActiveTokens = $.activeTokenFilters.get(access);
        if (accessActiveTokens === undefined) {
            $.activeTokenFilters.set(access, new Set(filter(raw.ownedTokens.get(access)!, (t) => t !== id)));
        } else {
            accessActiveTokens.delete(id);
        }

        // the token itself might need re-rendering (e.g. invisible)
        getShape(token)?.invalidate(true);
        floorSystem.invalidateLightAllFloors();
    }

    addOwnedToken(token: LocalId, access: AccessLevel): void {
        $.ownedTokens.get(access)!.add(token);
    }

    removeOwnedToken(token: LocalId, access: AccessLevel): void {
        $.ownedTokens.get(access)!.delete(token);
    }
}

export const accessSystem = new AccessSystem();
registerSystem("access", accessSystem, true, accessState);
