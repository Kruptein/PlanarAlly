import type { DeepReadonly } from "vue";

import { registerSystem } from "..";
import type { ShapeSystem } from "..";
import { guard } from "../../../core/iter";
import { NO_SYNC } from "../../../core/models/types";
import type { Sync } from "../../../core/models/types";
import { coreStore } from "../../../store/core";
import { getGlobalId } from "../../id";
import type { LocalId } from "../../id";
import { initiativeStore } from "../../ui/initiative/state";
import { annotationSystem } from "../annotations";
import { annotationState } from "../annotations/state";
import { floorSystem } from "../floors";
import { gameState } from "../game/state";
import { playerSystem } from "../players";
import { getProperties } from "../properties/state";
import { locationSettingsState } from "../settings/location/state";

import { sendShapeAddOwner, sendShapeDeleteOwner, sendShapeUpdateDefaultOwner, sendShapeUpdateOwner } from "./emits";
import { accessToServer, ownerToServer } from "./helpers";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL, isNonDefaultAccessSymbol } from "./models";
import type { ACCESS_KEY, ShapeAccess, ShapeOwner } from "./models";
import { accessState } from "./state";

const { mutableReactive: $, activeTokens } = accessState;

type AccessMap = Map<ACCESS_KEY, ShapeAccess>;

class AccessSystem implements ShapeSystem {
    // If a LocalId is NOT in the access map,
    // it is assumed to have default access settings
    // this is the case for the vast majority of shapes
    // and would thus just waste memory
    private access = new Map<LocalId, AccessMap>();

    // REACTIVE

    loadState(id: LocalId): void {
        $.id = id;
        $.defaultAccess = { ...DEFAULT_ACCESS };
        $.playerAccess.clear();

        const accessMap = this.access.get(id);

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
        this.access.clear();
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
        this.access.set(id, accessMap);
        initiativeStore._forceUpdate();
    }

    drop(id: LocalId): void {
        this.access.delete(id);
        if ($.id === id) {
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
        if (gameState.raw.isDm && !limitToActiveTokens) return true;

        const props = getProperties(id);
        if (props === undefined) return false;

        if (props.isToken && limitToActiveTokens) {
            if (!activeTokens.value.has(id)) {
                return false;
            }
        }

        if (gameState.isDmOrFake.value) return true;

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

        const userAccess = accessMap.get(playerSystem.getCurrentPlayer()!.name);
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
        if (gameState.isDmOrFake.value && coreStore.state.username === user) return;

        const userAccess = { ...DEFAULT_ACCESS, ...access };

        const shapeMap = this.access.get(shapeId) ?? (new Map() as AccessMap);
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
        if (user !== DEFAULT_ACCESS_SYMBOL && this.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to update access for user without access");
            return;
        }

        const oldAccess = this.access.get(shapeId)?.get(user) ?? DEFAULT_ACCESS;

        // Check owned-token changes
        if (
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
        if (!this.access.has(shapeId)) {
            this.access.set(shapeId, new Map());
        }
        this.access.get(shapeId)!.set(user, newAccess);

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

        if (locationSettingsState.raw.fowLos.value) floorSystem.invalidateLightAllFloors();
        initiativeStore._forceUpdate();
    }

    removeAccess(shapeId: LocalId, user: string, syncTo: Sync): void {
        if (this.access.get(shapeId)?.has(user) !== true) {
            console.error("[ACCESS] Attempt to remove access for user without access");
            return;
        }

        const oldAccess = this.access.get(shapeId)!.get(user)!;
        this.access.get(shapeId)!.delete(user);

        // annotation check
        if (!annotationState.readonly.visible.has(shapeId)) {
            annotationSystem.setAnnotation(shapeId, "", NO_SYNC);
        }

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
        return guard(this.access.get(id)?.keys() ?? [], isNonDefaultAccessSymbol);
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
        floorSystem.invalidateLightAllFloors();
    }

    removeActiveToken(token: LocalId): void {
        if ($.activeTokenFilters === undefined) {
            $.activeTokenFilters = new Set([...$.ownedTokens]);
        }
        $.activeTokenFilters.delete(token);
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
