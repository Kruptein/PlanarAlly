import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalId } from "../../../../src/core/id";
import { NO_SYNC, SERVER_SYNC, UI_SYNC } from "../../../../src/core/models/types";
import { socket } from "../../../../src/game/api/socket";
import { accessSystem } from "../../../../src/game/systems/access";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "../../../../src/game/systems/access/models";
import type { ShapeAccess } from "../../../../src/game/systems/access/models";
import { accessState } from "../../../../src/game/systems/access/state";
import { gameSystem } from "../../../../src/game/systems/game";
import { playerSystem } from "../../../../src/game/systems/players";
import type { ShapeProperties } from "../../../../src/game/systems/properties/state";
import { coreStore } from "../../../../src/store/core";
import { generatePlayer, generateTestLocalId } from "../../../helpers";

const errorSpy = vi.spyOn(console, "error");
const emitSpy = vi.spyOn(socket, "emit");
const addOwnedTokenSpy = vi.spyOn(accessSystem, "addOwnedToken");
const removeOwnedTokenSpy = vi.spyOn(accessSystem, "removeOwnedToken");

let GET_PROPERTIES_OVERRIDE: (() => Partial<ShapeProperties> | undefined) | undefined = undefined;
vi.mock("../../../../src/game/systems/properties/state", async () => {
    const state: Record<string, any> = await vi.importActual("../../../../src/game/systems/properties/state");
    return {
        ...state,
        getProperties: (localId: LocalId) => {
            return GET_PROPERTIES_OVERRIDE === undefined ? state.getProperties(localId) : GET_PROPERTIES_OVERRIDE();
        },
    };
});

describe("Access System", () => {
    beforeEach(() => {
        accessSystem.clear();
        errorSpy.mockClear();
        emitSpy.mockClear();
        addOwnedTokenSpy.mockClear();
        removeOwnedTokenSpy.mockClear();
        GET_PROPERTIES_OVERRIDE = undefined;
    });
    describe("inform", () => {
        it("should update $state if active", () => {
            // setup
            const id = generateTestLocalId();
            const id2 = generateTestLocalId();
            accessSystem.loadState(id);
            //test
            accessSystem.inform(id2, {
                default: { edit: false, movement: true, vision: true },
                extra: [{ access: { edit: true, movement: false, vision: true }, shape: id2, user: "testUser" }],
            });
            expect(accessState.raw.defaultAccess).toEqual(DEFAULT_ACCESS);
            expect(accessState.raw.playerAccess.size).toBe(0);

            accessSystem.inform(id, {
                default: { edit: false, movement: true, vision: true },
                extra: [{ access: { edit: true, movement: false, vision: true }, shape: id2, user: "testUser" }],
            });
            expect(accessState.raw.defaultAccess).toEqual({ edit: false, movement: true, vision: true });
            expect(accessState.raw.playerAccess.get("testUser")).toEqual({
                edit: true,
                movement: false,
                vision: true,
            });
        });
    });
    describe("getDefault", () => {
        it("should return DEFAULT_ACCESS when configured as such", () => {
            // setup
            const id = generateTestLocalId();
            const id2 = generateTestLocalId();
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [] });
            accessSystem.inform(id2, {
                default: DEFAULT_ACCESS,
                extra: [{ access: { edit: true, movement: false, vision: true }, shape: id2, user: "testUser" }],
            });
            // test
            expect(accessSystem.getDefault(id)).toBe(DEFAULT_ACCESS);
            expect(accessSystem.getDefault(id2)).toBe(DEFAULT_ACCESS);
        });
        it("should return the correct default access when configured", () => {
            // setup
            const id = generateTestLocalId();
            const id2 = generateTestLocalId();
            const id1Default = { edit: true, movement: false, vision: true };
            const id2Default = { edit: false, movement: true, vision: false };

            accessSystem.inform(id, { default: id1Default, extra: [] });
            accessSystem.inform(id2, {
                default: id2Default,
                extra: [{ access: { edit: true, movement: false, vision: true }, shape: id2, user: "testUser" }],
            });
            // test
            expect(accessSystem.getDefault(id)).toBe(id1Default);
            expect(accessSystem.getDefault(id2)).toBe(id2Default);
        });
    });
    describe("hasAccessTo", () => {
        let id: LocalId;
        let id2: LocalId;

        beforeEach(() => {
            id = generateTestLocalId();
            id2 = generateTestLocalId();
            const id1Default = { edit: true, movement: false, vision: true };
            const id2Default = { edit: false, movement: true, vision: false };
            const id2TestUser = {
                access: { edit: true, movement: true, vision: true },
                shape: id2,
                user: "userWithFullRights",
            };
            playerSystem.addPlayer(generatePlayer("userWithFullRights"));
            const id2DmUser = {
                access: { edit: false, movement: false, vision: false },
                shape: id2,
                user: "userWithNoRights",
            };
            playerSystem.addPlayer(generatePlayer("userWithNoRights"));

            accessSystem.inform(id, { default: id1Default, extra: [] });
            accessSystem.inform(id2, {
                default: id2Default,
                extra: [id2TestUser, id2DmUser],
            });
        });
        it("should return correctly if the player is a DM", () => {
            // setup
            gameSystem.setDm(true);
            // test
            expect(accessSystem.hasAccessTo(id, false, { edit: true })).toBe(true);
            // extra checks
            // 1. shape does not exist
            GET_PROPERTIES_OVERRIDE = () => undefined;
            expect(accessSystem.hasAccessTo(id, false, { edit: true })).toBe(true);
            // 2. shape is a token that is not active and the limiter is active
            GET_PROPERTIES_OVERRIDE = () => ({ isToken: true });
            accessSystem.setActiveTokens();
            expect(accessSystem.hasAccessTo(id, true, { edit: true })).toBe(false);
            GET_PROPERTIES_OVERRIDE = undefined;
            // 3. the current user would otherwise not have access
            coreStore.setUsername("userWithNoRights");
            expect(accessSystem.hasAccessTo(id2, false, { edit: true })).toBe(true);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return false if the shape does not exist", () => {
            // setup
            GET_PROPERTIES_OVERRIDE = () => undefined;
            // test
            expect(accessSystem.hasAccessTo(id, false, { movement: true })).toBe(false);
            // extra checks
            // 1. fake player
            gameSystem.setFakePlayer(true);
            expect(accessSystem.hasAccessTo(id, false, { movement: true })).toBe(false);
            gameSystem.setFakePlayer(false);
            gameSystem.setDm(false); // fakeplayer resets isDm
            // 2. default access is granted
            expect(accessSystem.hasAccessTo(id, false, { edit: true })).toBe(false);
            // 3. user access is granted
            coreStore.setUsername("userWithFullRights");
            expect(accessSystem.hasAccessTo(id2, false, { edit: true })).toBe(false);
        });
        it("should return false if the shape is a token and NOT an active token with the limiter active", () => {
            // setup
            GET_PROPERTIES_OVERRIDE = () => ({ isToken: true });
            accessSystem.setActiveTokens();
            // test
            expect(accessSystem.hasAccessTo(id, true, { edit: true })).toBe(false);
            // without limiter
            expect(accessSystem.hasAccessTo(id, false, { edit: true })).toBe(true);
            // without isToken
            GET_PROPERTIES_OVERRIDE = undefined;
            expect(accessSystem.hasAccessTo(id, true, { edit: true })).toBe(true);
            // with active token
            GET_PROPERTIES_OVERRIDE = () => ({ isToken: true });
            accessSystem.setActiveTokens(id);
            expect(accessSystem.hasAccessTo(id, true, { edit: true })).toBe(true);
            accessSystem.setActiveTokens();
            // extra checks
            // 1. fake player
            gameSystem.setFakePlayer(true);
            expect(accessSystem.hasAccessTo(id, true, { edit: true })).toBe(false);
            gameSystem.setFakePlayer(false);
            gameSystem.setDm(false); // fakeplayer resets isDm
            // 2. default access is granted
            expect(accessSystem.hasAccessTo(id, true, { edit: true })).toBe(false);
            // 3. user access is granted
            coreStore.setUsername("userWithFullRights");
            expect(accessSystem.hasAccessTo(id2, true, { edit: true })).toBe(false);
        });
        it("should return false if fake player is activated", () => {
            // setup
            gameSystem.setFakePlayer(true);
            // test
            expect(accessSystem.hasAccessTo(id, false, { movement: true })).toBe(false);
            // extra checks
            // 1. user access is not granted
            coreStore.setUsername("userWithNoRights");
            expect(accessSystem.hasAccessTo(id2, false, { edit: true })).toBe(false);
            // teardown
            gameSystem.setFakePlayer(false);
            gameSystem.setDm(false); // fakeplayer resets isDm
        });
        it("should return true if default access is granted", () => {
            // test
            expect(accessSystem.hasAccessTo(id, false, { edit: true })).toBe(true);
            expect(accessSystem.hasAccessTo(id2, false, { movement: true })).toBe(true);
            expect(accessSystem.hasAccessTo(id, false, { vision: true })).toBe(true);
            // extra checks
            // 1. user access is not granted
            coreStore.setUsername("userWithNoRights");
            expect(accessSystem.hasAccessTo(id2, false, { movement: true })).toBe(true);
        });
        it("should return true if user access is granted", () => {
            // setup
            coreStore.setUsername("userWithFullRights");
            // test
            expect(accessSystem.hasAccessTo(id2, false, { edit: true })).toBe(true);
            expect(accessSystem.hasAccessTo(id2, false, { vision: true })).toBe(true);
        });
        it("should return false if user access is not granted", () => {
            // setup
            coreStore.setUsername("userWithNoRights");
            // test
            expect(accessSystem.hasAccessTo(id, false, { movement: true })).toBe(false);
            expect(accessSystem.hasAccessTo(id2, false, { edit: true })).toBe(false);
            expect(accessSystem.hasAccessTo(id2, false, { vision: true })).toBe(false);
        });
    });
    describe("getAccess", () => {
        it("should return undefined if access was not configured for the shape.", () => {
            const id = generateTestLocalId();
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
        });
        it("should return undefined if access was not given for a specific user.", () => {
            const id = generateTestLocalId();
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [] });
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
        });
        it("should return the access for a specific user if it was added", () => {
            const id = generateTestLocalId();
            const access: ShapeAccess = { vision: true, movement: false, edit: true };
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [{ user: "some user", shape: id, access }] });
            expect(accessSystem.getAccess(id, "some user")).toBe(access);
        });
    });
    describe("addAccess", () => {
        it("should error out if the user already has access", () => {
            // setup
            const id = generateTestLocalId();
            const access: ShapeAccess = { edit: false, movement: false, vision: true };
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [{ user: "some user", shape: id, access }] });
            // test
            accessSystem.addAccess(id, "some user", access, SERVER_SYNC);
            expect(errorSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
            expect(addOwnedTokenSpy).not.toBeCalled();
        });
        it("should add a new user to the system", () => {
            // setup
            const id = generateTestLocalId();
            const someUserAccess: ShapeAccess = { edit: false, movement: false, vision: true };
            const newUserAccess: ShapeAccess = { edit: false, movement: true, vision: true };
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: someUserAccess }],
            });
            // test
            accessSystem.addAccess(id, "new user", newUserAccess, SERVER_SYNC);
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
            expect(addOwnedTokenSpy).not.toBeCalled();
            expect(accessSystem.getAccess(id, "new user")).toEqual(newUserAccess);
            // verify other users not changed
            expect(accessSystem.getDefault(id)).toBe(DEFAULT_ACCESS);
            expect(accessSystem.getAccess(id, "some user")).toBe(someUserAccess);
        });
        it("should not emit if SyncTo is not server", () => {
            // setup
            const id = generateTestLocalId();
            const someUserAccess: ShapeAccess = { edit: false, movement: false, vision: true };
            const newUserAccess: ShapeAccess = { edit: false, movement: true, vision: true };
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [],
            });
            // test
            accessSystem.addAccess(id, "some user", someUserAccess, UI_SYNC);
            accessSystem.addAccess(id, "new user", newUserAccess, NO_SYNC);
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
            expect(addOwnedTokenSpy).not.toBeCalled();
        });
        it("should update $state", () => {
            // setup
            const id = generateTestLocalId();
            const id2 = generateTestLocalId();
            const someUserAccess: ShapeAccess = { edit: false, movement: false, vision: true };
            const newUserAccess: ShapeAccess = { edit: false, movement: true, vision: true };
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [],
            });
            accessSystem.inform(id2, {
                default: DEFAULT_ACCESS,
                extra: [],
            });
            accessSystem.loadState(id);
            // test
            accessSystem.addAccess(id, "some user", someUserAccess, UI_SYNC);
            accessSystem.addAccess(id2, "new user", newUserAccess, NO_SYNC);
            expect(accessState.raw.playerAccess.get("some user")).toEqual(someUserAccess);
            expect(accessState.raw.playerAccess.get("new user")).toBeUndefined();
        });
        it("should call addOwnedToken if access is vision AND username matches AND isToken", () => {
            // setup
            const id = generateTestLocalId();
            const userWithoutVision: ShapeAccess = { edit: false, movement: false, vision: false };
            const userWithVision: ShapeAccess = { edit: false, movement: false, vision: true };
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [],
            });
            playerSystem.addPlayer(generatePlayer("some user"));
            playerSystem.addPlayer(generatePlayer("vision user wo isToken"));
            playerSystem.addPlayer(generatePlayer("vision user w isToken"));
            // test
            // 1. vision: false && username is ok && !isToken
            coreStore.setUsername("some user");
            accessSystem.addAccess(id, "some user", userWithoutVision, UI_SYNC);
            expect(addOwnedTokenSpy).not.toBeCalled();
            // 2. vision: true && username is ok && !isToken
            coreStore.setUsername("vision user wo isToken");
            accessSystem.addAccess(id, "vision user wo isToken", userWithVision, UI_SYNC);
            expect(addOwnedTokenSpy).not.toBeCalled();
            // 3. vision: true && username is ok && isToken
            GET_PROPERTIES_OVERRIDE = () => ({ isToken: true });
            coreStore.setUsername("vision user w isToken");
            accessSystem.addAccess(id, "vision user w isToken", userWithVision, UI_SYNC);
            expect(addOwnedTokenSpy).toBeCalled();
        });
    });
    describe("updateAccess", () => {
        it("should error if the shape is not known to the system", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should error if the user has no access to the shape", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [] });
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should update default state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [] });
            // test
            expect(accessSystem.getDefault(id)).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.updateAccess(id, DEFAULT_ACCESS_SYMBOL, { edit: true }, SERVER_SYNC);
            expect(accessSystem.getDefault(id)).toEqual({ edit: true, movement: false, vision: false });
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should update user state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: false } }],
            });
            // test
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: true, movement: false, vision: false });
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should add to the owned tokens if vision is toggled on for the current user", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: false } }],
            });
            // test
            // 1. without correct username
            accessSystem.updateAccess(id, "some user", { vision: true }, SERVER_SYNC);
            expect(addOwnedTokenSpy).not.toBeCalled();
            accessSystem.updateAccess(id, "some user", { vision: false }, SERVER_SYNC); // reset
            // 2. without isToken
            coreStore.setUsername("some user");
            accessSystem.updateAccess(id, "some user", { vision: true }, SERVER_SYNC);
            expect(addOwnedTokenSpy).not.toBeCalled();
            accessSystem.updateAccess(id, "some user", { vision: false }, SERVER_SYNC); // reset
            // 3. correct
            GET_PROPERTIES_OVERRIDE = () => ({
                isToken: true,
            });
            accessSystem.updateAccess(id, "some user", { vision: true }, SERVER_SYNC);
            expect(addOwnedTokenSpy).toBeCalled();
        });
        it("should remove from the owned tokens if vision is toggled off for the current user", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: true } }],
            });
            // test
            // 1. without correct username
            accessSystem.updateAccess(id, "some user", { vision: false }, SERVER_SYNC);
            expect(removeOwnedTokenSpy).not.toBeCalled();
            accessSystem.updateAccess(id, "some user", { vision: true }, SERVER_SYNC); // reset
            // 2. without isToken
            coreStore.setUsername("some user");
            accessSystem.updateAccess(id, "some user", { vision: false }, SERVER_SYNC);
            expect(removeOwnedTokenSpy).not.toBeCalled();
            accessSystem.updateAccess(id, "some user", { vision: true }, SERVER_SYNC); // reset
            // 3. correct
            GET_PROPERTIES_OVERRIDE = () => ({
                isToken: true,
            });
            accessSystem.updateAccess(id, "some user", { vision: false }, SERVER_SYNC);
            expect(removeOwnedTokenSpy).toBeCalled();
        });
        it("should update $state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: true } }],
            });
            accessSystem.loadState(id);
            // test
            expect(accessState.raw.playerAccess.get("some user")).toEqual({
                edit: false,
                movement: false,
                vision: true,
            });
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            expect(accessState.raw.playerAccess.get("some user")).toEqual({
                edit: true,
                movement: false,
                vision: true,
            });
        });
    });
    describe("removeAccess", () => {
        it("should error if the shape is not known to the system", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should error if the user has no access to the shape", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [] });
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should remove the user state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: false } }],
            });
            // test
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should remove from the owned tokens if vision is on for the current user", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: true } }],
            });
            // test
            // 1. without correct username
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(removeOwnedTokenSpy).not.toBeCalled();
            accessSystem.addAccess(id, "some user", { vision: true }, SERVER_SYNC); // reset
            // 2. without isToken
            coreStore.setUsername("some user");
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(removeOwnedTokenSpy).not.toBeCalled();
            accessSystem.addAccess(id, "some user", { vision: true }, SERVER_SYNC); // reset
            // 3. correct
            GET_PROPERTIES_OVERRIDE = () => ({
                isToken: true,
            });
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(removeOwnedTokenSpy).toBeCalled();
        });
        it("should update $state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: true } }],
            });
            accessSystem.loadState(id);
            // test
            expect(accessState.raw.playerAccess.has("some user")).toBe(true);
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(accessState.raw.playerAccess.has("some user")).toBe(false);
        });
    });
    describe("getOwners", () => {
        it("should return an empty list if the shape is not known to the system", () => {
            // setup
            const id = generateTestLocalId();
            // test
            expect([...accessSystem.getOwners(id)].length).toBe(0);
        });
        it("should return an empty list if no owners are associated with the shape", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [],
            });
            // test
            expect([...accessSystem.getOwners(id)].length).toBe(0);
        });
        it("should return all owners associated with the shape", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: true } }],
            });
            // test
            expect([...accessSystem.getOwners(id)]).toEqual(["some user"]);
            accessSystem.addAccess(id, "other user", DEFAULT_ACCESS, UI_SYNC);
            expect([...accessSystem.getOwners(id)]).toEqual(["some user", "other user"]);
        });
    });
    describe("getOwnersFull", () => {
        it("should return an empty list if the shape is not known to the system", () => {
            // setup
            const id = generateTestLocalId();
            // test
            expect(accessSystem.getOwnersFull(id).length).toBe(0);
        });
        it("should return an empty list if no owners are associated with the shape", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [],
            });
            // test
            expect(accessSystem.getOwnersFull(id).length).toBe(0);
        });
        it("should return all owners associated with the shape", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", shape: id, access: { edit: false, movement: false, vision: true } }],
            });
            // test
            expect(accessSystem.getOwnersFull(id)).toEqual([
                { user: "some user", shape: id, access: { edit: false, movement: false, vision: true } },
            ]);
            accessSystem.addAccess(id, "other user", DEFAULT_ACCESS, UI_SYNC);
            expect(accessSystem.getOwnersFull(id)).toEqual([
                { user: "some user", shape: id, access: { edit: false, movement: false, vision: true } },
                { user: "other user", shape: id, access: { edit: false, movement: false, vision: false } },
            ]);
        });
    });
});
