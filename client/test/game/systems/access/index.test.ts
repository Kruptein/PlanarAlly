import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalId } from "../../../../src/core/id";
import { NO_SYNC, SERVER_SYNC, UI_SYNC } from "../../../../src/core/models/types";
import { socket } from "../../../../src/game/api/socket";
import { accessSystem } from "../../../../src/game/systems/access";
import { DEFAULT_ACCESS, DEFAULT_ACCESS_SYMBOL } from "../../../../src/game/systems/access/models";
import type { AccessConfig, AccessMap } from "../../../../src/game/systems/access/models";
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

function toAccessMap(access: { default: AccessConfig; extra: { access: AccessConfig; user: string }[] }): AccessMap {
    const map: AccessMap = new Map();
    map.set(DEFAULT_ACCESS_SYMBOL, access.default);
    for (const extra of access.extra) {
        map.set(extra.user, extra.access);
    }
    return map;
}

function accessCheck(id: LocalId, access: AccessConfig, limiter: boolean = false): void {
    for (const [key, value] of Object.entries(access)) {
        expect(accessSystem.hasAccessTo(id, key as keyof AccessConfig, limiter)).toBe(value);
    }
}

describe("Access System", () => {
    beforeEach(() => {
        accessSystem.clear();
        errorSpy.mockClear();
        emitSpy.mockClear();
        addOwnedTokenSpy.mockClear();
        removeOwnedTokenSpy.mockClear();
    });
    describe("inform", () => {
        it("should update $state if active", async () => {
            // setup
            const id = await generateTestLocalId();
            const id2 = await generateTestLocalId();
            accessSystem.loadState(id);
            //test
            accessSystem.import(
                id2,
                toAccessMap({
                    default: { edit: false, movement: true, vision: true },
                    extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
                }),
                "load",
            );
            expect(accessState.raw.defaultAccess).toEqual(DEFAULT_ACCESS);
            expect(accessState.raw.playerAccess.size).toBe(0);

            accessSystem.import(
                id,
                toAccessMap({
                    default: { edit: false, movement: true, vision: true },
                    extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
                }),
                "load",
            );
            expect(accessState.raw.defaultAccess).toEqual({ edit: false, movement: true, vision: true });
            expect(accessState.raw.playerAccess.get("testUser")).toEqual({
                edit: true,
                movement: false,
                vision: true,
            });
        });
    });
    describe("getDefault", () => {
        it("should return DEFAULT_ACCESS when configured as such", async () => {
            // setup
            const id = await generateTestLocalId();
            const id2 = await generateTestLocalId();
            accessSystem.import(id, toAccessMap({ default: DEFAULT_ACCESS, extra: [] }), "load");
            accessSystem.import(
                id2,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
                }),
                "load",
            );
            // test
            expect(accessSystem.getDefault(id)).toBe(DEFAULT_ACCESS);
            expect(accessSystem.getDefault(id2)).toBe(DEFAULT_ACCESS);
        });
        it("should return the correct default access when configured", async () => {
            // setup
            const id = await generateTestLocalId();
            const id2 = await generateTestLocalId();
            const id1Default = { edit: true, movement: false, vision: true };
            const id2Default = { edit: false, movement: true, vision: false };

            accessSystem.import(id, toAccessMap({ default: id1Default, extra: [] }), "load");
            accessSystem.import(
                id2,
                toAccessMap({
                    default: id2Default,
                    extra: [{ access: { edit: true, movement: false, vision: true }, user: "testUser" }],
                }),
                "load",
            );
            // test
            expect(accessSystem.getDefault(id)).toBe(id1Default);
            expect(accessSystem.getDefault(id2)).toBe(id2Default);
        });
    });
    describe("hasAccessTo", () => {
        let id: LocalId;
        let id2: LocalId;
        let id3: LocalId;
        let id4: LocalId;
        let id5: LocalId;

        beforeEach(async () => {
            // Shape 1: Only some default access rights
            // Shape 2: Full access rights for a specific user
            // Shape 3: Mixed default & specific access rights
            // Shape 4: No access rights
            // Shape 5: Player with only edit access rights
            id = await generateTestLocalId();
            id2 = await generateTestLocalId();
            id3 = await generateTestLocalId();
            id4 = await generateTestLocalId();
            id5 = await generateTestLocalId();

            const id1Default = { edit: true, movement: false, vision: true };
            const id2Default = { edit: false, movement: true, vision: false };
            const id3Default = { edit: false, movement: false, vision: true };
            const id4Default = { edit: false, movement: false, vision: false };
            const id5Default = { edit: false, movement: false, vision: false };

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

            accessSystem.import(id, toAccessMap({ default: id1Default, extra: [] }), "load");
            accessSystem.import(
                id2,
                toAccessMap({
                    default: id2Default,
                    extra: [id2TestUser, id2DmUser],
                }),
                "load",
            );
            accessSystem.import(
                id3,
                toAccessMap({
                    default: id3Default,
                    extra: [id3TestUser],
                }),
                "load",
            );
            accessSystem.import(
                id4,
                toAccessMap({
                    default: id4Default,
                    extra: [],
                }),
                "load",
            );
            accessSystem.import(
                id5,
                toAccessMap({
                    default: id5Default,
                    extra: [id3TestUser],
                }),
                "load",
            );
        });
        it("should return true for the DM without limiters", () => {
            // setup
            gameSystem.setDm(true);
            // test
            accessCheck(id, { edit: true, movement: true, vision: true });
            accessCheck(id2, { edit: true, movement: true, vision: true });
            accessCheck(id3, { edit: true, movement: true, vision: true });
            accessCheck(id4, { edit: true, movement: true, vision: true });
            accessCheck(id5, { edit: true, movement: true, vision: true });
            // teardown
            gameSystem.setDm(false);
        });
        it("should return true for the DM without a limiter regardless of the active filter", () => {
            // setup
            gameSystem.setDm(true);
            accessSystem.setActiveVisionTokens(id, id2, id3);
            // test
            accessCheck(id, { edit: true, movement: true, vision: true });
            accessCheck(id2, { edit: true, movement: true, vision: true });
            accessCheck(id3, { edit: true, movement: true, vision: true });
            accessCheck(id4, { edit: true, movement: true, vision: true });
            accessCheck(id5, { edit: true, movement: true, vision: true });
            // teardown
            gameSystem.setDm(false);
        });
        it("should return true for the DM with a limiter and the shape in the active filter", () => {
            // setup
            gameSystem.setDm(true);
            // test only shape 1 active
            accessSystem.setActiveVisionTokens(id);
            accessCheck(id, { edit: true, movement: true, vision: true }, true);
            // test shape 2
            accessSystem.setActiveVisionTokens(id2);
            accessCheck(id2, { edit: true, movement: true, vision: true }, true);
            // test shape 3
            accessSystem.setActiveVisionTokens(id3);
            accessCheck(id3, { edit: true, movement: true, vision: true }, true);
            // test shape 4
            accessSystem.setActiveVisionTokens(id4);
            accessCheck(id4, { edit: true, movement: true, vision: true }, true);
            // test shape 5
            accessSystem.setActiveVisionTokens(id5);
            accessCheck(id5, { edit: true, movement: true, vision: true }, true);
            // test all shapes
            accessSystem.setActiveVisionTokens(id, id2, id3, id4, id5);
            expect(accessSystem.hasAccessTo(id, "edit", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id2, "movement", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id4, "vision", true)).toBe(true);
            expect(accessSystem.hasAccessTo(id5, "vision", true)).toBe(true);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return false for the DM with a limiter and the shape not in the active filter", () => {
            // setup
            gameSystem.setDm(true);
            // test shape 1 active
            accessSystem.setActiveVisionTokens(id);
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id4, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id5, "vision", true)).toBe(false);
            // test shape 2 active
            accessSystem.setActiveVisionTokens(id2);
            expect(accessSystem.hasAccessTo(id, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id4, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id5, "vision", true)).toBe(false);
            // test shape 3 active
            accessSystem.setActiveVisionTokens(id3);
            expect(accessSystem.hasAccessTo(id, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id4, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id5, "vision", true)).toBe(false);
            // test shape 4 active
            accessSystem.setActiveVisionTokens(id4);
            expect(accessSystem.hasAccessTo(id, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id5, "vision", true)).toBe(false);
            // test shape 5 active
            accessSystem.setActiveVisionTokens(id5);
            expect(accessSystem.hasAccessTo(id, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id2, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id3, "vision", true)).toBe(false);
            expect(accessSystem.hasAccessTo(id4, "vision", true)).toBe(false);
            // teardown
            gameSystem.setDm(false);
        });
        it("should return according to access rights for the FAKE-DM without limiters", () => {
            // setup
            gameSystem.setDm(true);
            gameSystem.setFakePlayer(true);
            // test
            accessCheck(id, { edit: true, movement: false, vision: true });
            accessCheck(id2, { edit: true, movement: true, vision: true });
            accessCheck(id3, { edit: true, movement: false, vision: true });
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
            accessCheck(id, { edit: true, movement: false, vision: true }, true);
            // test shape 2
            accessSystem.setActiveVisionTokens(id2);
            accessCheck(id2, { edit: true, movement: true, vision: true }, true);
            // test shape 3
            accessSystem.setActiveVisionTokens(id3);
            accessCheck(id3, { edit: true, movement: false, vision: true }, true);
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
            accessCheck(id, { edit: true, movement: false, vision: true });
            //   Shape 2
            accessCheck(id2, { edit: false, movement: true, vision: false });
            //   Shape 3
            accessCheck(id3, { edit: false, movement: false, vision: true });
            //   Shape 4
            accessCheck(id4, { edit: false, movement: false, vision: false });
            //   Shape 5
            accessCheck(id5, { edit: false, movement: false, vision: false });
            // User 2: Full access
            coreStore.setUsername("userWithFullRights");
            //   Shape 1
            accessCheck(id, { edit: true, movement: false, vision: true });
            //   Shape 2
            accessCheck(id2, { edit: true, movement: true, vision: true });
            //   Shape 3
            accessCheck(id3, { edit: false, movement: false, vision: true });
            //   Shape 4
            accessCheck(id4, { edit: false, movement: false, vision: false });
            //   Shape 5
            accessCheck(id5, { edit: false, movement: false, vision: false });
            // User 3: Mixed access
            coreStore.setUsername("userWithLimitedRights");
            //   Shape 1
            accessCheck(id, { edit: true, movement: false, vision: true });
            //   Shape 2
            accessCheck(id2, { edit: false, movement: true, vision: false });
            //   Shape 3
            accessCheck(id3, { edit: true, movement: false, vision: true });
            //   Shape 4
            accessCheck(id4, { edit: false, movement: false, vision: false });
            //   Shape 5
            accessCheck(id5, { edit: true, movement: false, vision: false });
        });
    });
    describe("getAccess", () => {
        it("should return undefined if access was not configured for the shape.", async () => {
            const id = await generateTestLocalId();
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
        });
        it("should return undefined if access was not given for a specific user.", async () => {
            const id = await generateTestLocalId();
            accessSystem.import(id, toAccessMap({ default: DEFAULT_ACCESS, extra: [] }), "load");
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
        });
        it("should return the access for a specific user if it was added", async () => {
            const id = await generateTestLocalId();
            const access: AccessConfig = { vision: true, movement: false, edit: true };
            accessSystem.import(
                id,
                toAccessMap({ default: DEFAULT_ACCESS, extra: [{ user: "some user", access }] }),
                "load",
            );
            expect(accessSystem.getAccess(id, "some user")).toBe(access);
        });
    });
    describe("addAccess", () => {
        it("should error out if the user already has access", async () => {
            // setup
            const id = await generateTestLocalId();
            const access: AccessConfig = { edit: false, movement: false, vision: true };
            accessSystem.import(
                id,
                toAccessMap({ default: DEFAULT_ACCESS, extra: [{ user: "some user", access }] }),
                "load",
            );
            // test
            accessSystem.addAccess(id, "some user", access, SERVER_SYNC);
            expect(errorSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
            expect(addOwnedTokenSpy).not.toBeCalled();
        });
        it("should add a new user to the system", async () => {
            // setup
            const id = await generateTestLocalId();
            const someUserAccess: AccessConfig = { edit: false, movement: false, vision: true };
            const newUserAccess: AccessConfig = { edit: false, movement: true, vision: true };
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: someUserAccess }],
                }),
                "load",
            );
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
        it("should not emit if SyncTo is not server", async () => {
            // setup
            const id = await generateTestLocalId();
            const someUserAccess: AccessConfig = { edit: false, movement: false, vision: true };
            const newUserAccess: AccessConfig = { edit: false, movement: true, vision: true };
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [],
                }),
                "load",
            );
            // test
            accessSystem.addAccess(id, "some user", someUserAccess, UI_SYNC);
            accessSystem.addAccess(id, "new user", newUserAccess, NO_SYNC);
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
            expect(addOwnedTokenSpy).not.toBeCalled();
        });
        it("should update $state", async () => {
            // setup
            const id = await generateTestLocalId();
            const id2 = await generateTestLocalId();
            const someUserAccess: AccessConfig = { edit: false, movement: false, vision: true };
            const newUserAccess: AccessConfig = { edit: false, movement: true, vision: true };
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [],
                }),
                "load",
            );
            accessSystem.import(
                id2,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [],
                }),
                "load",
            );
            accessSystem.loadState(id);
            // test
            accessSystem.addAccess(id, "some user", someUserAccess, UI_SYNC);
            accessSystem.addAccess(id2, "new user", newUserAccess, NO_SYNC);
            expect(accessState.raw.playerAccess.get("some user")).toEqual(someUserAccess);
            expect(accessState.raw.playerAccess.get("new user")).toBeUndefined();
        });
    });
    describe("updateAccess", () => {
        it("should error if the shape is not known to the system", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should error if the user has no access to the shape", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(id, toAccessMap({ default: DEFAULT_ACCESS, extra: [] }), "load");
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should update default state", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(id, toAccessMap({ default: DEFAULT_ACCESS, extra: [] }), "load");
            // test
            expect(accessSystem.getDefault(id)).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.updateAccess(id, DEFAULT_ACCESS_SYMBOL, { edit: true }, SERVER_SYNC);
            expect(accessSystem.getDefault(id)).toEqual({ edit: true, movement: false, vision: false });
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should update user state", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: { edit: false, movement: false, vision: false } }],
                }),
                "load",
            );
            // test
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.updateAccess(id, "some user", { edit: true }, SERVER_SYNC);
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: true, movement: false, vision: false });
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should update $state", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
                }),
                "load",
            );
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
        it("should error if the shape is not known to the system", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should error if the user has no access to the shape", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(id, toAccessMap({ default: DEFAULT_ACCESS, extra: [] }), "load");
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            // test
            expect(errorSpy).toBeCalled();
        });
        it("should remove the user state", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: { edit: false, movement: false, vision: false } }],
                }),
                "load",
            );
            // test
            expect(accessSystem.getAccess(id, "some user")).toEqual({ edit: false, movement: false, vision: false });
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(accessSystem.getAccess(id, "some user")).toBeUndefined();
            expect(errorSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });
        it("should update $state", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
                }),
                "load",
            );
            accessSystem.loadState(id);
            // test
            expect(accessState.raw.playerAccess.has("some user")).toBe(true);
            accessSystem.removeAccess(id, "some user", SERVER_SYNC);
            expect(accessState.raw.playerAccess.has("some user")).toBe(false);
        });
    });
    describe("getOwners", () => {
        it("should return an empty list if the shape is not known to the system", async () => {
            // setup
            const id = await generateTestLocalId();
            // test
            expect([...accessSystem.getOwners(id)].length).toBe(0);
        });
        it("should return an empty list if no owners are associated with the shape", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [],
                }),
                "load",
            );
            // test
            expect([...accessSystem.getOwners(id)].length).toBe(0);
        });
        it("should return all owners associated with the shape", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
                }),
                "load",
            );
            // test
            expect([...accessSystem.getOwners(id)]).toEqual(["some user"]);
            accessSystem.addAccess(id, "other user", DEFAULT_ACCESS, UI_SYNC);
            expect([...accessSystem.getOwners(id)]).toEqual(["some user", "other user"]);
        });
    });
    describe("getOwnersFull", () => {
        it("should return an empty list if the shape is not known to the system", async () => {
            // setup
            const id = await generateTestLocalId();
            // test
            expect(accessSystem.getOwnersFull(id).length).toBe(0);
        });
        it("should return an empty list if no owners are associated with the shape", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [],
                }),
                "load",
            );
            // test
            expect(accessSystem.getOwnersFull(id).length).toBe(0);
        });
        it("should return all owners associated with the shape", async () => {
            // setup
            const id = await generateTestLocalId();
            accessSystem.import(
                id,
                toAccessMap({
                    default: DEFAULT_ACCESS,
                    extra: [{ user: "some user", access: { edit: false, movement: false, vision: true } }],
                }),
                "load",
            );
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
