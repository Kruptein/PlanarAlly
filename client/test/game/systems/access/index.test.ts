import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalId } from "../../../../src/core/id";
import { NO_SYNC, SERVER_SYNC, UI_SYNC } from "../../../../src/core/models/types";
import { socket } from "../../../../src/game/api/socket";
import { accessSystem } from "../../../../src/game/systems/access";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "../../../../src/game/systems/access/models";
import type { AccessConfig } from "../../../../src/game/systems/access/models";
import { accessState } from "../../../../src/game/systems/access/state";
import { gameSystem } from "../../../../src/game/systems/game";
import { playerSystem } from "../../../../src/game/systems/players";
import { coreStore } from "../../../../src/store/core";
import { generatePlayer, generateTestLocalId } from "../../../helpers";

const errorSpy = vi.spyOn(console, "error");
const emitSpy = vi.spyOn(socket, "emit");
const addOwnedTokenSpy = vi.spyOn(accessSystem, "addOwnedToken");
const removeOwnedTokenSpy = vi.spyOn(accessSystem, "removeOwnedToken");

// Mock for gameSystem.setDm to rerun _updateOwnedToken for all known tokens
const originalSetDm = gameSystem.setDm.bind(gameSystem);
vi.spyOn(gameSystem, "setDm").mockImplementation((isDm: boolean) => {
    originalSetDm(isDm);

    // Rerun _updateOwnedToken for all known tokens
    for (const id of accessState.readonly.access.keys()) {
        accessSystem._updateOwnedState(id);
    }
});

// Mock for coreStore.setUsername to rerun _updateOwnedToken for all known tokens
const originalSetUsername = coreStore.setUsername.bind(coreStore);
vi.spyOn(coreStore, "setUsername").mockImplementation((username: string) => {
    originalSetUsername(username);

    // Rerun _updateOwnedToken for all known tokens
    for (const id of accessState.readonly.access.keys()) {
        accessSystem._updateOwnedState(id);
    }
});

describe("Access System", () => {
    beforeEach(() => {
        accessSystem.clear();
        errorSpy.mockClear();
        emitSpy.mockClear();
        addOwnedTokenSpy.mockClear();
        removeOwnedTokenSpy.mockClear();
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
                extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
            });
            expect(accessState.raw.defaultAccess).toEqual(DEFAULT_ACCESS);
            expect(accessState.raw.playerAccess.size).toBe(0);

            accessSystem.inform(id, {
                default: { edit: false, movement: true, vision: true },
                extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
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
                extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
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
                extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
            });
            // test
            expect(accessSystem.getDefault(id)).toBe(id1Default);
            expect(accessSystem.getDefault(id2)).toBe(id2Default);
        });
    });
    describe("hasAccessTo", () => {
        let id: LocalId;
        let id2: LocalId;
        let id3: LocalId;

        beforeEach(() => {
            // Shape 1: Only some default access rights
            // Shape 2: Full access rights for a specific user
            // Shape 3: Mixed default & specific access rights
            id = generateTestLocalId();
            id2 = generateTestLocalId();
            id3 = generateTestLocalId();

            const id1Default = { edit: true, movement: false, vision: true };
            const id2Default = { edit: false, movement: true, vision: false };
            const id3Default = { edit: false, movement: false, vision: true };

            const id2TestUser = {
                access: { edit: true, movement: true, vision: true },
                user: "userWithFullRights",
            };
            playerSystem.addPlayer(generatePlayer("userWithFullRights"));
            const id2DmUser = {
                access: { edit: false, movement: false, vision: false },
                user: "userWithNoRights",
            };
            playerSystem.addPlayer(generatePlayer("userWithNoRights"));

            const id3TestUser = {
                access: { edit: true, movement: false, vision: false },
                user: "userWithLimitedRights",
            };
            playerSystem.addPlayer(generatePlayer("userWithLimitedRights"));

            accessSystem.inform(id, { default: id1Default, extra: [] });
            accessSystem.inform(id2, {
                default: id2Default,
                extra: [id2TestUser, id2DmUser],
            });
            accessSystem.inform(id3, {
                default: id3Default,
                extra: [id3TestUser],
            });
        });
        it("should return true for the DM without limiters", () => {
            // setup
            gameSystem.setDm(true);
            // test
            expect(accessSystem.hasAccessTo(id, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "vision")).toBe(true);

            expect(accessSystem.hasAccessTo(id2, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision")).toBe(true);

            expect(accessSystem.hasAccessTo(id3, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "vision")).toBe(true);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return true for the DM without a limiter regardless of the active filter", () => {
            // setup
            gameSystem.setDm(true);
            accessSystem.setActiveVisionTokens(id, id2, id3);
            // test
            expect(accessSystem.hasAccessTo(id, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "vision")).toBe(true);

            expect(accessSystem.hasAccessTo(id2, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision")).toBe(true);

            expect(accessSystem.hasAccessTo(id3, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "vision")).toBe(true);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return according to the access rights for the DM with a limiter and the shape in the active filter", () => {
            // setup
            gameSystem.setDm(true);
            // test shape 1
            accessSystem.setActiveVisionTokens(id);
            expect(accessSystem.hasAccessTo(id, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id, "vision", true)).toBe(true);
            // test shape 2
            accessSystem.setActiveVisionTokens(id2);
            expect(accessSystem.hasAccessTo(id2, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(true);
            // test shape 3
            accessSystem.setActiveVisionTokens(id3);
            expect(accessSystem.hasAccessTo(id3, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "movement", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(true);
            // test all shapes
            accessSystem.setActiveVisionTokens(id, id2, id3);
            expect(accessSystem.hasAccessTo(id, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(true);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return false for the DM with a limiter and the shape not in the active filter", () => {
            // setup
            gameSystem.setDm(true);
            accessSystem.setActiveVisionTokens(id);
            // test
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(false);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return according to access rights for the FAKE-DM without limiters", () => {
            // setup
            gameSystem.setDm(true);
            gameSystem.setFakePlayer(true);
            // test
            expect(accessSystem.hasAccessTo(id, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id, "vision")).toBe(true);

            expect(accessSystem.hasAccessTo(id2, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision")).toBe(true);

            expect(accessSystem.hasAccessTo(id3, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision")).toBe(true);
            // teardown
            gameSystem.setFakePlayer(false);
            gameSystem.setDm(false);
        });
        it("should return according to the access rights for the FAKE-DM with a limiter and the shape in the active filter", () => {
            // setup
            gameSystem.setDm(true);
            gameSystem.setFakePlayer(true);
            // test shape 1
            accessSystem.setActiveVisionTokens(id);
            expect(accessSystem.hasAccessTo(id, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id, "vision", true)).toBe(true);
            // test shape 2
            accessSystem.setActiveVisionTokens(id2);
            expect(accessSystem.hasAccessTo(id2, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(true);
            // test shape 3
            accessSystem.setActiveVisionTokens(id3);
            expect(accessSystem.hasAccessTo(id3, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "movement", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(true);
            // test all shapes
            accessSystem.setActiveVisionTokens(id, id2, id3);
            expect(accessSystem.hasAccessTo(id, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(true);
            // teardown
            gameSystem.setFakePlayer(false);
            gameSystem.setDm(false);
        });
        it("should return false for the FAKE-DM with a limiter and the shape not in the active filter", () => {
            // setup
            gameSystem.setDm(true);
            gameSystem.setFakePlayer(true);
            accessSystem.setActiveVisionTokens(id);
            // test
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(false);
            // teardown
            gameSystem.setFakePlayer(false);
            gameSystem.setDm(false);
        });
        it("should return according to access rules values for players", () => {
            // User 1: No access
            coreStore.setUsername("userWithNoRights");
            //   Shape 1
            expect(accessSystem.hasAccessTo(id, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id, "vision")).toBe(true);
            //   Shape 2
            expect(accessSystem.hasAccessTo(id2, "edit")).toBe(false);
            expect(accessSystem.hasAccessTo(id2, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision")).toBe(false);
            //   Shape 3
            expect(accessSystem.hasAccessTo(id3, "edit")).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision")).toBe(true);
            // User 2: Full access
            coreStore.setUsername("userWithFullRights");
            //   Shape 1
            expect(accessSystem.hasAccessTo(id, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id, "vision")).toBe(true);
            //   Shape 2
            expect(accessSystem.hasAccessTo(id2, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision")).toBe(true);
            //   Shape 3
            expect(accessSystem.hasAccessTo(id3, "edit")).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision")).toBe(true);
            // User 3: Mixed access
            coreStore.setUsername("userWithLimitedRights");
            //   Shape 1
            expect(accessSystem.hasAccessTo(id, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id, "vision")).toBe(true);
            //   Shape 2
            expect(accessSystem.hasAccessTo(id2, "edit")).toBe(false);
            expect(accessSystem.hasAccessTo(id2, "movement")).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "vision")).toBe(false);
            //   Shape 3
            expect(accessSystem.hasAccessTo(id3, "edit")).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "movement")).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision")).toBe(true);
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
            const access: AccessConfig = { vision: true, movement: false, edit: true };
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [{ user: "some user", access }] });
            expect(accessSystem.getAccess(id, "some user")).toBe(access);
        });
    });
    describe("addAccess", () => {
        it("should error out if the user already has access", () => {
            // setup
            const id = generateTestLocalId();
            const access: AccessConfig = { edit: false, movement: false, vision: true };
            accessSystem.inform(id, { default: DEFAULT_ACCESS, extra: [{ user: "some user", access }] });
            // test
            accessSystem.addAccess(id, "some user", access, SERVER_SYNC);
            expect(errorSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
            expect(addOwnedTokenSpy).not.toBeCalled();
        });
        it("should add a new user to the system", () => {
            // setup
            const id = generateTestLocalId();
            const someUserAccess: AccessConfig = { edit: false, movement: false, vision: true };
            const newUserAccess: AccessConfig = { edit: false, movement: true, vision: true };
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", access: someUserAccess }],
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
            const someUserAccess: AccessConfig = { edit: false, movement: false, vision: true };
            const newUserAccess: AccessConfig = { edit: false, movement: true, vision: true };
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
            const someUserAccess: AccessConfig = { edit: false, movement: false, vision: true };
            const newUserAccess: AccessConfig = { edit: false, movement: true, vision: true };
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
                extra: [{ user: "some user", access: { edit: false, movement: false, vision: false } }],
            });
            // test
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: true, movement: false, vision: false });
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should update $state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
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
                extra: [{ user: "some user", access: { edit: false, movement: false, vision: false } }],
            });
            // test
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should update $state", () => {
            // setup
            const id = generateTestLocalId();
            accessSystem.inform(id, {
                default: DEFAULT_ACCESS,
                extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
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
                extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
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
                extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
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
