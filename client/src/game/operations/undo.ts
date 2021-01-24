import { EventBus } from "../event-bus";
import { GlobalPoint, Vector } from "../geom";
import { layerManager } from "../layers/manager";
import { moveFloor, moveLayer } from "../layers/utils";
import { Operation, ShapeMovementOperation, ShapeRotationOperation } from "./model";
import { moveShapes } from "./movement";
import { resizeShape } from "./resize";
import { rotateShapes } from "./rotation";

const undoStack: Operation[] = [];
let redoStack: Operation[] = [];
let operationInProgress = false;

export function addOperation(operation: Operation): void {
    console.log(operationInProgress, operation);
    if (operationInProgress) return;
    undoStack.push(operation);
    redoStack = [];
}

export function undoOperation(): void {
    handleOperation("undo");
}

export function redoOperation(): void {
    handleOperation("redo");
}

function handleOperation(direction: "undo" | "redo"): void {
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
        }
    }
    operationInProgress = false;
}

function handleMovement(shapes: ShapeMovementOperation[], direction: "undo" | "redo"): void {
    const fullShapes = shapes.map((s) => layerManager.UUIDMap.get(s.uuid)!);
    let delta = Vector.fromPoints(GlobalPoint.fromArray(shapes[0].to), GlobalPoint.fromArray(shapes[0].from));
    if (direction === "redo") delta = delta.reverse();
    moveShapes(fullShapes, delta, true);
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
