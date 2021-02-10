import { SyncMode } from "../../core/models/types";
import { EventBus } from "../event-bus";
import { GlobalPoint, Vector } from "../geom";
import { layerManager } from "../layers/manager";
import { moveFloor, moveLayer } from "../layers/utils";
import { gameManager } from "../manager";
import { ServerShape } from "../models/shapes";
import { deleteShapes } from "../shapes/utils";

import { Operation, ShapeMovementOperation, ShapeRotationOperation } from "./model";
import { moveShapes } from "./movement";
import { resizeShape } from "./resize";
import { rotateShapes } from "./rotation";

let undoStack: Operation[] = [];
let redoStack: Operation[] = [];
let operationInProgress = false;

/**
 * Add a new operation to the undo stack.
 */
export function addOperation(operation: Operation): void {
    if (operationInProgress) return;
    undoStack.push(operation);
    redoStack = [];
    if (undoStack.length > 50) undoStack.shift();
}

/**
 * Override the last operation.
 * This is an advanced function that should only be used for special cases.
 * e.g. addShape is sometimes called pre-emptively with later updates to size during draw
 * whereas we want to have the final w/h to be part of the undo operation info
 */
export function overrideLastOperation(operation: Operation): void {
    const lastOp = undoStack.pop();
    if (lastOp === undefined || lastOp.type !== operation.type)
        throw new Error("Wrong usage of overrideLastOperation.");
    undoStack.push(operation);
}

/**
 * Clear the undo and redo stacks.
 */
export function clearUndoStacks(): void {
    undoStack = [];
    redoStack = [];
}

export async function undoOperation(): Promise<void> {
    await handleOperation("undo");
}

export async function redoOperation(): Promise<void> {
    await handleOperation("redo");
}

async function handleOperation(direction: "undo" | "redo"): Promise<void> {
    operationInProgress = true;
    const op = direction === "undo" ? undoStack.pop() : redoStack.pop();
    if (op !== undefined) {
        if (direction === "undo") redoStack.push(op);
        else undoStack.push(op);

        if (op.type === "movement") {
            handleMovement(op.shapes, direction);
        } else if (op.type === "rotation") {
            handleRotation(op.shapes, op.center, direction);
        } else if (op.type === "resize") {
            handleResize(op.uuid, op.fromPoint, op.toPoint, op.resizePoint, op.retainAspectRatio, direction);
        } else if (op.type === "floormovement") {
            handleFloorMove(op.shapes, op.from, op.to, direction);
        } else if (op.type === "layermovement") {
            handleLayerMove(op.shapes, op.from, op.to, direction);
        } else if (op.type === "shaperemove") {
            await handleShapeRemove(op.shapes, direction);
        } else if (op.type === "shapeadd") {
            await handleShapeRemove(op.shapes, direction === "redo" ? "undo" : "redo");
        }
    }
    operationInProgress = false;
}

function handleMovement(shapes: ShapeMovementOperation[], direction: "undo" | "redo"): void {
    const fullShapes = shapes.map((s) => layerManager.UUIDMap.get(s.uuid)!);
    let delta = Vector.fromPoints(GlobalPoint.fromArray(shapes[0].to), GlobalPoint.fromArray(shapes[0].from));
    if (direction === "redo") delta = delta.reverse();
    moveShapes(fullShapes, delta, true);
    EventBus.$emit("Select.RotationHelper.Reset");
}

function handleRotation(shapes: ShapeRotationOperation[], center: GlobalPoint, direction: "undo" | "redo"): void {
    const fullShapes = shapes.map((s) => layerManager.UUIDMap.get(s.uuid)!);
    let angle = shapes[0].from - shapes[0].to;
    if (direction === "redo") angle *= -1;
    rotateShapes(fullShapes, angle, center, true);
    EventBus.$emit("Select.RotationHelper.Reset");
}

function handleResize(
    uuid: string,
    fromPoint: number[],
    toPoint: number[],
    resizePoint: number,
    retainAspectRatio: boolean,
    direction: "undo" | "redo",
): void {
    const shape = layerManager.UUIDMap.get(uuid)!;
    const targetPoint = direction === "undo" ? fromPoint : toPoint;
    resizeShape(shape, GlobalPoint.fromArray(targetPoint), resizePoint, retainAspectRatio, false);
}

function handleFloorMove(shapes: string[], from: number, to: number, direction: "undo" | "redo"): void {
    const fullShapes = shapes.map((s) => layerManager.UUIDMap.get(s)!);
    let floorId = from;
    if (direction === "redo") floorId = to;
    const floor = layerManager.getFloor(floorId)!;
    moveFloor(fullShapes, floor, true);
}

function handleLayerMove(shapes: string[], from: string, to: string, direction: "undo" | "redo"): void {
    const fullShapes = shapes.map((s) => layerManager.UUIDMap.get(s)!);
    let layerName = from;
    if (direction === "redo") layerName = to;
    const floor = layerManager.getFloor(fullShapes[0].floor.id)!;
    const layer = layerManager.getLayer(floor, layerName)!;
    moveLayer(fullShapes, layer, true);
}

async function handleShapeRemove(shapes: ServerShape[], direction: "undo" | "redo"): Promise<void> {
    if (direction === "undo") {
        for (const shape of shapes) await gameManager.addShape(shape, SyncMode.FULL_SYNC);
    } else {
        deleteShapes(
            shapes.map((s) => layerManager.UUIDMap.get(s.uuid)!),
            SyncMode.FULL_SYNC,
        );
    }
}
