import type { DeepReadonly } from "vue";

import type { LocalId } from "../../../core/id";
import { guard } from "../../../core/iter";
import type { Sync } from "../../../core/models/types";
import { registerSystem } from "../../../core/systems";
import type { ShapeSystem } from "../../../core/systems";
import { coreStore } from "../../../store/core";
import { getGlobalId, getShape } from "../../id";
import { initiativeStore } from "../../ui/initiative/state";
import { floorSystem } from "../floors";
import { gameState } from "../game/state";
import { playerSystem } from "../players";
import { getProperties } from "../properties/state";
import { locationSettingsState } from "../settings/location/state";

import { sendShapeAddOwner, sendShapeDeleteOwner, sendShapeUpdateDefaultOwner, sendShapeUpdateOwner } from "./emits";
import { accessToServer, ownerToServer } from "./helpers";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL, isNonDefaultAccessSymbol } from "./models";
import type { AccessMap, ACCESS_KEY, ShapeAccess, ShapeOwner } from "./models";
import { accessState } from "./state";

const { mutableReactive: $, activeTokens, mutable } = accessState;

class AccessSystem implements ShapeSystem {
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

    clear(): void {
        this.dropState();
        $.activeTokenFilters?.clear();
        $.ownedTokens.clear();
        mutable.access.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, access: { default: ShapeAccess; extra: ShapeOwner[] }): void {
        const accessMap: AccessMap = new Map();

        // Default Access
        if (access.default.edit || access.default.movement || access.default.vision) {
            accessMap.set(DEFAULT_ACCESS_SYMBOL, access.default);
            if ($.id === id) {
                $.defaultAccess = access.default;
            }
        } else {
            accessMap.delete(DEFAULT_ACCESS_SYMBOL);
            if ($.id === id) {
                $.defaultAccess = access.default;
            }
        }

        // Player Access
        for (const extra of access.extra) {
            accessMap.set(extra.user, extra.access);
            if ($.id === id) {
                $.playerAccess.set(extra.user, extra.access);
            }
        }

        // Commit
        mutable.access.set(id, accessMap);
        initiativeStore._forceUpdate();
    }

    drop(id: LocalId): void {
        mutable.access.delete(id);
        if ($.id === id) {
            this.dropState();
        }
    }

    getDefault(id: LocalId): DeepReadonly<ShapeAccess> {
        return mutable.access.get(id)?.get(DEFAULT_ACCESS_SYMBOL) ?? DEFAULT_ACCESS;
    }

    hasAccessTo(
        id: LocalId,
        limitToActiveTokens: boolean,
        access: Partial<{ edit: boolean; vision: boolean; movement: boolean }>,
    ): boolean {
        if (gameState.raw.isDm && !limitToActiveTokens) return true;

        const props = getProperties(id);
        if (props === undefined) return false;

        if (props.isToken && limitToActiveTokens) {
            if (!activeTokens.value.has(id)) {
                // In theory we should check default permission rights here
                // But that's a usecase I haven't come across yet.
                return false;
            } else if (gameState.raw.isFakePlayer) {
                return true;
            }
        }

        if (gameState.raw.isDm) return true;

        const accessMap = mutable.access.get(id);
        if (accessMap === undefined) return false;

        const defaultAccess = accessMap.get(DEFAULT_ACCESS_SYMBOL) ?? DEFAULT_ACCESS;

        if (
            ((access.edit ?? false) && defaultAccess.edit) ||
            ((access.movement ?? false) && defaultAccess.movement) ||
            ((access.vision ?? false) && defaultAccess.vision)
        ) {
            return true;
        }

        const userAccess = accessMap.get(playerSystem.getCurrentPlayer()!.name);
        if (userAccess === undefined) return false;

        return (
            ((access.edit ?? false) ? userAccess.edit : true) &&
            ((access.movement ?? false) ? userAccess.movement : true) &&
            ((access.vision ?? false) ? userAccess.vision : true)
        );
    }

    getAccess(shapeId: LocalId, user: string): DeepReadonly<ShapeAccess> | undefined {
        return mutable.access.get(shapeId)?.get(user);
    }

    addAccess(shapeId: LocalId, user: string, access: Partial<ShapeAccess>, syncTo: Sync): void {
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

        // todo: some sort of event register instead of calling these other systems manually ?
        if (userAccess.vision && user === playerSystem.getCurrentPlayer()?.name) {
            const props = getProperties(shapeId);
            if (props?.isToken === true) {
                this.addOwnedToken(shapeId);
            }
        }

        if (locationSettingsState.raw.fowLos.value) floorSystem.invalidateLightAllFloors();
        if (syncTo.ui) initiativeStore._forceUpdate();
    }

    updateAccess(shapeId: LocalId, user: ACCESS_KEY, access: Partial<ShapeAccess>, syncTo: Sync): void {
        if (user !== DEFAULT_ACCESS_SYMBOL && mutable.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to update access for user without access");
            return;
        }

        const oldAccess = mutable.access.get(shapeId)?.get(user) ?? DEFAULT_ACCESS;

        // Check owned-token changes
        if (
            !gameState.isDmOrFake.value &&
            access.vision !== undefined &&
            access.vision !== oldAccess.vision &&
            (user === playerSystem.getCurrentPlayer()?.name || user === DEFAULT_ACCESS_SYMBOL)
        ) {
            const props = getProperties(shapeId);
            if (props?.isToken === true) {
                if (access.vision) {
                    this.addOwnedToken(shapeId);
                } else {
                    this.removeOwnedToken(shapeId);
                }
            }
        }

        // Commit to state
        const newAccess = { ...oldAccess, ...access };
        if (!mutable.access.has(shapeId)) {
            mutable.access.set(shapeId, new Map());
        }
        mutable.access.get(shapeId)!.set(user, newAccess);

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

        if (locationSettingsState.raw.fowLos.value) {
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

        const oldAccess = mutable.access.get(shapeId)!.get(user)!;
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

        if (oldAccess.vision && user === playerSystem.getCurrentPlayer()?.name) {
            const props = getProperties(shapeId);
            if (props?.isToken === true) {
                this.removeOwnedToken(shapeId);
            }
        }

        if (locationSettingsState.raw.fowLos.value) floorSystem.invalidateLightAllFloors();
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

    setActiveTokens(...tokens: LocalId[]): void {
        $.activeTokenFilters = new Set(tokens);
        floorSystem.invalidateLightAllFloors();
    }

    unsetActiveTokens(): void {
        $.activeTokenFilters = undefined;
        floorSystem.invalidateLightAllFloors();
    }

    addActiveToken(token: LocalId): void {
        if ($.activeTokenFilters === undefined) return;
        $.activeTokenFilters.add(token);
        if ($.activeTokenFilters.size === $.ownedTokens.size) $.activeTokenFilters = undefined;

        // the token itself might need re-rendering (e.g. invisible)
        getShape(token)?.invalidate(true);
        floorSystem.invalidateLightAllFloors();
    }

    removeActiveToken(token: LocalId): void {
        if ($.activeTokenFilters === undefined) {
            $.activeTokenFilters = new Set([...$.ownedTokens]);
        }
        $.activeTokenFilters.delete(token);

        // the token itself might need re-rendering (e.g. invisible)
        getShape(token)?.invalidate(true);
        floorSystem.invalidateLightAllFloors();
    }

    addOwnedToken(token: LocalId): void {
        $.ownedTokens.add(token);
    }

    removeOwnedToken(token: LocalId): void {
        $.ownedTokens.delete(token);
    }
}

export const accessSystem = new AccessSystem();
registerSystem("access", accessSystem, true, accessState);
