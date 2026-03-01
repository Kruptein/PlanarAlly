import { beforeEach, describe, expect, it, vi } from "vitest";

// temporary mock fix until activeshape is less circular import-y
vi.mock("../../../../src/store/activeShape", () => ({
    activeShapeStore: {
        state: {},
    },
}));

import { NO_SYNC, SERVER_SYNC, UI_SYNC } from "../../../../src/core/models/types";
import { socket } from "../../../../src/game/api/socket";
import { accessSystem } from "../../../../src/game/systems/access";
import type { AccessConfig, AccessMap } from "../../../../src/game/systems/access/models";
import { DEFAULT_ACCESS_SYMBOL } from "../../../../src/game/systems/access/models";
import { auraSystem } from "../../../../src/game/systems/auras";
import { visionState } from "../../../../src/game/vision/state";
import { generateTestLocalId, generateTestShape } from "../../../helpers";

import { generateTestAura, generateTestAuraId } from "./helpers";

const emitSpy = vi.spyOn(socket, "emit");
const addVisionSpy = vi.spyOn(visionState, "addVisionSource");
const removeVisionSpy = vi.spyOn(visionState, "removeVisionSource");

function toAccessMap(access: { default: AccessConfig }): AccessMap {
    const map: AccessMap = new Map();
    map.set(DEFAULT_ACCESS_SYMBOL, access.default);
    return map;
}

describe("Aura System", () => {
    beforeEach(() => {
        auraSystem.clear();
        visionState.clear();
        addVisionSpy.mockClear();
        removeVisionSpy.mockClear();
        emitSpy.mockClear();
    });
    describe("get", () => {
        it("should return undefined if the shape does not exist", async () => {
            // setup
            const id = await generateTestLocalId();
            const auraId = generateTestAuraId();
            // test
            expect(auraSystem.get(id, auraId)).toBeUndefined();
        });
        it("should return undefined if the aura does not exist", async () => {
            // setup
            const id = await generateTestLocalId();
            const auraId = generateTestAuraId();
            auraSystem.importLate(id, [], "load");
            // test
            expect(auraSystem.get(id, auraId)).toBeUndefined();
        });
        it("should return the aura if it exists", async () => {
            // setup
            const id = await generateTestLocalId(await generateTestShape({ floor: "test" }));
            const aura = generateTestAura();
            auraSystem.importLate(id, [aura], "load");
            // test
            expect(auraSystem.get(id, aura.uuid)).toMatchObject(aura);
        });
    });
    describe("getAll", () => {
        it("should return an empty list if the shape is not known", async () => {
            // setup
            const id = await generateTestLocalId();
            // test
            expect(auraSystem.getAll(id)).toEqual([]);
        });
        it("should return all auras associated with the shape when vision access is granted", async () => {
            // setup
            const id = await generateTestLocalId(await generateTestShape({ floor: "test" }));
            accessSystem.import(id, toAccessMap({ default: { edit: false, movement: false, vision: true } }), "load");
            const aura = generateTestAura();
            auraSystem.importLate(id, [aura], "load");
            const aura2 = generateTestAura({ visible: false, visionSource: false });
            auraSystem.importLate(id, [aura, aura2], "load");
            // test
            expect(auraSystem.getAll(id)).toEqual([aura, aura2]);
        });
        it("should return the correct auras associated with the shape when vision access is not granted", async () => {
            // setup
            const id = await generateTestLocalId(await generateTestShape({ floor: "test" }));
            const aura = generateTestAura();
            const aura2 = generateTestAura({ visible: false, visionSource: false });
            const aura3 = generateTestAura({ visible: false, visionSource: true });
            const aura4 = generateTestAura({ visible: true, visionSource: false });
            auraSystem.importLate(id, [aura, aura2, aura3, aura4], "load");
            // test
            expect(auraSystem.getAll(id)).toEqual([aura, aura4]);
        });
    });
    describe("add", () => {
        it("should add the aura to the system", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.importLate(id, [], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.add(id, aura, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toEqual(aura);
            expect(invalidateSpy).not.toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should inform the server if SyncTo is set", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.importLate(id, [], "load");
            // test
            auraSystem.add(id, aura, SERVER_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toEqual(aura);
            expect(emitSpy).toBeCalled();
        });

        it("should invalidate the shape if the aura is active", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: false });
            auraSystem.importLate(id, [], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.add(id, aura, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toEqual(aura);
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should add the aura to the vision system if the aura is active and a vision source", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: true });
            auraSystem.importLate(id, [], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.add(id, aura, UI_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toEqual(aura);
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });
    });
    describe("update", () => {
        it("should update the aura", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: false,
                visionSource: true,
                angle: 0,
                borderColour: "black",
                colour: "red",
                dim: 20,
                direction: 2,
                name: "test aura",
                value: 560,
                visible: false,
            });
            auraSystem.importLate(id, [aura], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(
                id,
                aura.uuid,
                {
                    angle: 90,
                    borderColour: "blue",
                    direction: -20,
                    name: "changed test aura",
                    visible: true,
                },
                NO_SYNC,
            );
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: false,
                visionSource: true,
                angle: 90,
                borderColour: "blue",
                colour: "red",
                dim: 20,
                direction: -20,
                name: "changed test aura",
                value: 560,
                visible: true,
            });
            expect(invalidateSpy).not.toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should inform the server if SyncTo is set", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: false,
                visionSource: true,
            });
            auraSystem.importLate(id, [aura], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { angle: 90, visible: true }, SERVER_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: false,
                visionSource: true,
                angle: 90,
                visible: true,
            });
            expect(invalidateSpy).not.toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).toBeCalled();
        });

        it("should invalidate the shape if it is and stays active", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: true,
            });
            auraSystem.importLate(id, [aura], "load");
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: true,
                visionSource: true,
                angle: 90,
                visible: true,
            });
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should add to the visionState if it becomes active", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: false,
                visionSource: true,
            });
            auraSystem.importLate(id, [aura], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { active: true, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: true,
                visionSource: true,
                angle: 90,
                visible: true,
            });
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should add to the visionState if it becomes a vision source", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: false,
            });
            auraSystem.importLate(id, [aura], "load");
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { visionSource: true, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: true,
                visionSource: true,
                angle: 90,
                visible: true,
            });
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should remove from the visionState if it becomes inactive", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: false,
            });
            auraSystem.importLate(id, [aura], "load");
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { active: false, visionSource: true, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: false,
                visionSource: true,
                angle: 90,
                visible: true,
            });
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(removeVisionSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should remove from the visionState if it's no longer a vision source", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: true,
            });
            auraSystem.importLate(id, [aura], "load");
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { visionSource: false, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toMatchObject({
                active: true,
                visionSource: false,
                angle: 90,
                visible: true,
            });
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(removeVisionSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });
    });
    describe("remove", () => {
        it("should remove the aura from the system", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.importLate(id, [aura], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.remove(id, aura.uuid, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toBeUndefined();
            expect(invalidateSpy).not.toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
        });

        it("should inform the server if SyncTo is set", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.importLate(id, [aura], "load");
            // test
            auraSystem.remove(id, aura.uuid, SERVER_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toBeUndefined();
            expect(emitSpy).toBeCalled();
        });

        it("should invalidate the shape if the aura was active", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: false });
            auraSystem.importLate(id, [aura], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.remove(id, aura.uuid, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toBeUndefined();
            expect(invalidateSpy).toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should remove the aura from the vision system if the aura was active and a vision source", async () => {
            // setup
            const shape = await generateTestShape({ floor: "test" });
            const id = await generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: true });
            auraSystem.importLate(id, [aura], "load");
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.remove(id, aura.uuid, UI_SYNC);
            expect(auraSystem.get(id, aura.uuid)).toBeUndefined();
            expect(invalidateSpy).toBeCalled();
            expect(removeVisionSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });
    });
});
