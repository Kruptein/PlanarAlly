import { beforeEach, describe, expect, it, vi } from "vitest";

// temporary mock fix until activeshape is less circular import-y
vi.mock("../../../../src/store/activeShape", () => ({
    activeShapeStore: {
        state: {},
    },
}));

import { NO_SYNC, SERVER_SYNC, UI_SYNC } from "../../../../src/core/models/types";
import { socket } from "../../../../src/game/api/socket";
import { compositeState } from "../../../../src/game/layers/state";
import { accessSystem } from "../../../../src/game/systems/access";
import { auraSystem } from "../../../../src/game/systems/auras";
import { visionState } from "../../../../src/game/vision/state";
import { generateTestLocalId, generateTestShape } from "../../../helpers";

import { generateTestAura, generateTestAuraId } from "./helpers";

const emitSpy = vi.spyOn(socket, "emit");
const addVisionSpy = vi.spyOn(visionState, "addVisionSource");
const removeVisionSpy = vi.spyOn(visionState, "removeVisionSource");

describe("Aura System", () => {
    beforeEach(() => {
        auraSystem.clear();
        compositeState.clear();
        visionState.clear();
        addVisionSpy.mockClear();
        removeVisionSpy.mockClear();
        emitSpy.mockClear();
    });
    describe("get", () => {
        it("should return undefined if the shape does not exist", () => {
            // setup
            const id = generateTestLocalId();
            const auraId = generateTestAuraId();
            // test
            expect(auraSystem.get(id, auraId, false)).toBeUndefined();
            expect(auraSystem.get(id, auraId, true)).toBeUndefined();
        });
        it("should return undefined if the aura does not exist", () => {
            // setup
            const id = generateTestLocalId();
            const auraId = generateTestAuraId();
            auraSystem.inform(id, []);
            // test
            expect(auraSystem.get(id, auraId, false)).toBeUndefined();
            expect(auraSystem.get(id, auraId, true)).toBeUndefined();
        });
        it("should return the aura if it exists", () => {
            // setup
            const id = generateTestLocalId(generateTestShape({ floor: "test" }));
            const aura = generateTestAura();
            auraSystem.inform(id, [aura]);
            // test
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject(aura);
            expect(auraSystem.get(id, aura.uuid, true)).toMatchObject(aura);
        });
        it("should correctly work for variants", () => {
            // setup
            const id = generateTestLocalId(generateTestShape({ floor: "test" }));
            const id2 = generateTestLocalId();
            const aura = generateTestAura();
            compositeState.addComposite(id, { id: id2, name: "variant" }, false);
            auraSystem.inform(id, [aura]);
            // test
            expect(auraSystem.get(id2, aura.uuid, false)).toBeUndefined();
            expect(auraSystem.get(id2, aura.uuid, true)).toMatchObject(aura);
        });
    });
    describe("getAll", () => {
        it("should return an empty list if the shape is not known", () => {
            // setup
            const id = generateTestLocalId();
            // test
            expect(auraSystem.getAll(id, false)).toEqual([]);
            expect(auraSystem.getAll(id, true)).toEqual([]);
        });
        it("should return all auras associated with the shape when vision access is granted", () => {
            // setup
            const id = generateTestLocalId(generateTestShape({ floor: "test" }));
            accessSystem.inform(id, { default: { edit: false, movement: false, vision: true }, extra: [] });
            const aura = generateTestAura();
            auraSystem.inform(id, [aura]);
            const aura2 = generateTestAura({ visible: false, visionSource: false });
            auraSystem.inform(id, [aura, aura2]);
            // test
            expect(auraSystem.getAll(id, false)).toEqual([aura, aura2]);
            expect(auraSystem.getAll(id, true)).toEqual([aura, aura2]);
        });
        it("should return the correct auras associated with the shape when vision access is not granted", () => {
            // setup
            const id = generateTestLocalId(generateTestShape({ floor: "test" }));
            const aura = generateTestAura();
            const aura2 = generateTestAura({ visible: false, visionSource: false });
            const aura3 = generateTestAura({ visible: false, visionSource: true });
            const aura4 = generateTestAura({ visible: true, visionSource: false });
            auraSystem.inform(id, [aura, aura2, aura3, aura4]);
            // test
            expect(auraSystem.getAll(id, false)).toEqual([aura, aura4]);
            expect(auraSystem.getAll(id, true)).toEqual([aura, aura4]);
        });
        it("should correctly work for variants", () => {
            // setup
            const id = generateTestLocalId(generateTestShape({ floor: "test" }));
            accessSystem.inform(id, { default: { edit: false, movement: false, vision: true }, extra: [] });
            const id2 = generateTestLocalId();
            accessSystem.inform(id2, { default: { edit: false, movement: false, vision: true }, extra: [] });
            compositeState.addComposite(id, { id: id2, name: "variant" }, false);
            const aura = generateTestAura();
            auraSystem.inform(id, [aura]);
            const aura2 = generateTestAura({ visible: false, visionSource: false });
            auraSystem.inform(id2, [aura2]);
            // test
            expect(auraSystem.getAll(id2, false)).toEqual([aura2]);
            expect(auraSystem.getAll(id2, true)).toEqual([aura, aura2]);
        });
    });
    describe("add", () => {
        it("should add the aura to the system", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.inform(id, []);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.add(id, aura, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toEqual(aura);
            expect(invalidateSpy).not.toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should inform the server if SyncTo is set", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.inform(id, []);
            // test
            auraSystem.add(id, aura, SERVER_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toEqual(aura);
            expect(emitSpy).toBeCalled();
        });

        it("should invalidate the shape if the aura is active", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: false });
            auraSystem.inform(id, []);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.add(id, aura, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toEqual(aura);
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should add the aura to the vision system if the aura is active and a vision source", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: true });
            auraSystem.inform(id, []);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.add(id, aura, UI_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toEqual(aura);
            expect(invalidateSpy).toBeCalled();
            expect(addVisionSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });
    });
    describe("update", () => {
        it("should update the aura", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
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
            auraSystem.inform(id, [aura]);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(
                id,
                aura.uuid,
                { angle: 90, borderColour: "blue", direction: -20, name: "changed test aura", visible: true },
                NO_SYNC,
            );
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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

        it("should inform the server if SyncTo is set", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({
                active: false,
                visionSource: true,
            });
            auraSystem.inform(id, [aura]);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { angle: 90, visible: true }, SERVER_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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

        it("should invalidate the shape if it is and stays active", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: true,
            });
            auraSystem.inform(id, [aura]);
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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

        it("should add to the visionState if it becomes active", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({
                active: false,
                visionSource: true,
            });
            auraSystem.inform(id, [aura]);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { active: true, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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

        it("should add to the visionState if it becomes a vision source", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: false,
            });
            auraSystem.inform(id, [aura]);
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { visionSource: true, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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

        it("should remove from the visionState if it becomes inactive", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: false,
            });
            auraSystem.inform(id, [aura]);
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { active: false, visionSource: true, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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

        it("should remove from the visionState if it's no longer a vision source", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({
                active: true,
                visionSource: true,
            });
            auraSystem.inform(id, [aura]);
            addVisionSpy.mockClear();
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.update(id, aura.uuid, { visionSource: false, angle: 90, visible: true }, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toMatchObject({
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
        it("should remove the aura from the system", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.inform(id, [aura]);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.remove(id, aura.uuid, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toBeUndefined();
            expect(invalidateSpy).not.toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
        });

        it("should inform the server if SyncTo is set", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: false, visionSource: true });
            auraSystem.inform(id, [aura]);
            // test
            auraSystem.remove(id, aura.uuid, SERVER_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toBeUndefined();
            expect(emitSpy).toBeCalled();
        });

        it("should invalidate the shape if the aura was active", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: false });
            auraSystem.inform(id, [aura]);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.remove(id, aura.uuid, NO_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toBeUndefined();
            expect(invalidateSpy).toBeCalled();
            expect(removeVisionSpy).not.toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });

        it("should remove the aura from the vision system if the aura was active and a vision source", () => {
            // setup
            const shape = generateTestShape({ floor: "test" });
            const id = generateTestLocalId(shape);
            const aura = generateTestAura({ active: true, visionSource: true });
            auraSystem.inform(id, [aura]);
            const invalidateSpy = vi.spyOn(shape, "invalidate");
            // test
            auraSystem.remove(id, aura.uuid, UI_SYNC);
            expect(auraSystem.get(id, aura.uuid, false)).toBeUndefined();
            expect(invalidateSpy).toBeCalled();
            expect(removeVisionSpy).toBeCalled();
            expect(emitSpy).not.toBeCalled();
        });
    });
});
