import { GlobalPoint, Vector } from "../geom";
import { layerManager } from "../layers/manager";
import { moveShapes } from "./movement";

export interface ShapeMovementOperation {
    uuid: string;
    from: number[];
    to: number[];
}

export interface MovementOperation {
    type: "movement";
    shapes: ShapeMovementOperation[];
}

export type Operation = MovementOperation;

const undoStack: Operation[] = [];
let redoStack: Operation[] = [];
let operationInProgress = false;

export function addOperation(operation: Operation): void {
    console.log(operationInProgress, operation.type, operation);
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
