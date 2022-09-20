import { throttle } from "lodash";

import { l2g } from "../core/conversions";
import type { GlobalPoint } from "../core/geometry";
import { toGP, toLP } from "../core/geometry";
import { InvalidationMode, SyncMode } from "../core/models/types";
import { Store } from "../core/store";
import { sendAddSpawnShape, sendLgTokenConnect, sendRemoveSpawnShape } from "../game/api/emits/lg";
import { sendShapePositionUpdate } from "../game/api/emits/shape/core";
// import { dropAsset } from "../game/dropAsset";
import { getGlobalId, getShape } from "../game/id";
import type { LocalId } from "../game/id";
import type { IShape } from "../game/interfaces/shape";
import { LayerName } from "../game/models/floor";
import type { LgSpawn } from "../game/models/lg";
// import { HAND_TYPE } from "../game/models/lg";
import { rotateShapes } from "../game/operations/rotation";
// import { addKillTimer, setKillTimerTicks } from "../game/rendering/core";
import { Polygon } from "../game/shapes/variants/polygon";
import { accessSystem } from "../game/systems/access";
import type { ClientId } from "../game/systems/client/models";
import { floorSystem } from "../game/systems/floors";
import { floorState } from "../game/systems/floors/state";
import { visionState } from "../game/vision/state";
// import { Sign } from "../game/vision/tds";
// import { orientation } from "../game/vision/triag";

type BoardInfo = Map<string, { client: ClientId; xOffset: number; yOffset: number }>;

interface LastGameboardState {
    lastGameboardShapes: number[];
    spawnMap: Map<number, { imageSource: string; assetId: number }>;
    boardInfo: BoardInfo;
}

function fromLGtoPA(points: [number, number]): GlobalPoint {
    return l2g(toLP(points[0] * 2560, points[1] * 2560));
}

const sendPosUpdate = throttle(sendShapePositionUpdate, 50);

class LastGameboardStore extends Store<LastGameboardState> {
    // Map<sessionId, typeId>
    private sessionMap: Map<number, number> = new Map();

    // Map<typeId, uuid>
    private shapeMap: Map<number, LocalId | null> = new Map();

    // Set of PA shapes that are actually attached to tokens
    private tokenShapes: Set<number> = new Set();

    private contourShapes: Map<number, LocalId> = new Map();
    private contourHistory: Map<number, [number, number][]> = new Map();

    protected data(): LastGameboardState {
        const boardInfo: BoardInfo = new Map();

        return {
            lastGameboardShapes: [],
            spawnMap: new Map(),
            boardInfo,
        };
    }

    clear(): void {
        this._state.spawnMap.clear();
        this._state.boardInfo.clear();
    }

    linkSession(sessionId: number, typeId: number): void {
        this.sessionMap.set(sessionId, typeId);
    }

    isLgShape(shape: LocalId): boolean {
        return [...this.shapeMap.values()].includes(shape);
    }

    getTypeId(sessionId: number): number | undefined {
        return this.sessionMap.get(sessionId);
    }

    // ATTACHING

    isTokenShape(typeId: number): boolean {
        return this.tokenShapes.has(typeId);
    }

    canAttach(position: GlobalPoint, typeId: number): IShape | null {
        const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens);
        for (const shape of layer?.getShapes({ includeComposites: false }) ?? []) {
            // skip if we're already attached
            if (this.shapeMap.get(typeId) === shape.id && shape.contains(position)) return null;
            if (!accessSystem.hasAccessTo(shape.id, false, { movement: true })) continue;

            // const type = [...this.shapeMap.entries()].find(([, uuid]) => uuid === shape.uuid);
            // if (type !== undefined) {
            //     if (type[1] !== null && [...this.contourShapes.values()].includes(type[1])) continue;
            // }

            if (shape.contains(position)) {
                return shape;
            }
        }
        return null;
    }

    addLgShape(typeId: number, id: LocalId, sync: boolean): void {
        this.shapeMap.set(typeId, id);
        if (sync) sendLgTokenConnect({ typeId, uuid: getGlobalId(id) });
        this.tokenShapes.add(typeId);

        // cleanup
        if (this.contourShapes.has(typeId)) {
            const oldUuid = this.contourShapes.get(typeId)!;
            const shape = getShape(oldUuid);
            this.contourHistory.delete(typeId);
            this.contourShapes.delete(typeId);
            if (shape === undefined) return;
            shape.layer.removeShape(shape, { sync: SyncMode.FULL_SYNC, recalculate: true, dropShapeId: true });
        }
    }

    // Position/Angle updates

    moveLgShape(sessionId: number, position: GlobalPoint): void {
        const typeId = this.sessionMap.get(sessionId);
        if (typeId === undefined) return;
        const uuid = this.shapeMap.get(typeId);
        if (uuid === undefined || uuid === null) return;

        const shape = getShape(uuid);
        if (shape === undefined) return;

        shape.center(position);
        shape.invalidate(false);
        sendPosUpdate([shape], false);
        // sendShapePositionUpdate([shape], false);
    }

    rotateShape(sessionId: number, angle: number): void {
        const typeId = this.sessionMap.get(sessionId);
        if (typeId === undefined) return;
        const uuid = this.shapeMap.get(typeId);
        if (uuid === undefined || uuid === null) return;

        const shape = getShape(uuid);

        // if (shape === undefined || !(shape.options.canRotate ?? false)) return;
        if (shape === undefined) return;

        rotateShapes([shape], angle - shape.angle - Math.PI / 2, shape.center(), false);
        sendPosUpdate([shape], false);
    }

    // SPAWNING

    addSpawnShape(info: LgSpawn, sync: boolean): void {
        this._state.spawnMap.set(info.typeId, info.file);
        if (sync) sendAddSpawnShape(info);
    }

    removeSpawnId(typeId: number, sync: boolean): void {
        this._state.spawnMap.delete(typeId);
        if (sync) sendRemoveSpawnShape(typeId);
    }

    isSpawnToken(sessionId: number): boolean {
        return this._state.spawnMap.has(sessionId);
    }

    async spawnShape(typeId: number, position: GlobalPoint): Promise<void> {
        // not used and sets of 200 circular imports :V
        //
        // const spawnInfo = this._state.spawnMap.get(typeId);
        // if (spawnInfo === undefined) return;
        // if (gameStore.state.isDm) {
        //     const layer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens);
        //     const shape = await dropAsset(spawnInfo, g2l(position), layer);
        //     if (shape !== undefined) sendSpawnedShapeId({ typeId, uuid: getGlobalId(shape.id) });
        // } else {
        //     sendDoSpawnShape({ typeId, position });
        // }
    }

    linkSpawnedShape(typeId: number, uuid: LocalId): void {
        this.shapeMap.set(typeId, uuid);
    }

    // CONTOURS

    isContourShape(typeId: number): boolean {
        return this.contourHistory.has(typeId);
    }

    createContourShape(typeId: number): void {
        this.shapeMap.set(typeId, null);
    }

    setLgContour(sessionId: number, points: [number, number][]): void {
        const typeId = this.sessionMap.get(sessionId);
        if (typeId === undefined) return;
        // Prevent constant updates if the contour did not change
        if (this.contourHistory.has(typeId)) {
            const oldPoints = this.contourHistory.get(typeId)!;
            if (oldPoints.length === points.length) {
                let equal = true;
                for (let i = 0; i < points.length; i++) {
                    if (oldPoints[i][0] !== points[i][0] || oldPoints[i][1] !== points[i][1]) {
                        equal = false;
                        break;
                    }
                }
                if (equal) return;
            }
        }
        this.contourHistory.set(typeId, points);

        const uuid = this.shapeMap.get(typeId);
        if (uuid === undefined) return;

        let shape: Polygon;
        if (uuid !== null) {
            shape = getShape(uuid)! as Polygon;
            if (shape.type !== "polygon") return;
        } else {
            shape = new Polygon(toGP([0, 0]), undefined, undefined, { blocksMovement: true, blocksVision: true });

            const layer = floorSystem.getLayer(floorState.currentFloor!.value!, LayerName.Tokens)!;
            layer.addShape(shape, SyncMode.NO_SYNC, InvalidationMode.NO);
            this.shapeMap.set(typeId, shape.id);
            this.contourShapes.set(typeId, shape.id);
        }

        shape.vertices = points.map((p) => fromLGtoPA(p));
        visionState.recalculateMovement(shape.floor.id);
        visionState.recalculateVision(shape.floor.id);
        shape.layer.invalidate(false);
        sendPosUpdate([shape], true);
    }

    // HAND BLADE

    // setHandContour(contour: [number, number][]): void {
    //     let shape: Polygon;

    //     // get min and max x-coord values to run the left-hull algorithm against
    //     const min = getIndex(contour, (curr, acc) => curr[0] < acc[0]);
    //     const max = getIndex(contour, (curr, acc) => curr[0] > acc[0]);

    //     const pointsA = [
    //         contour[min],
    //         ...contour.slice(max, max < min ? min : undefined),
    //         ...(max < min ? [] : contour.slice(0, min)),
    //     ];

    //     const pointsB = [
    //         contour[max],
    //         ...contour.slice(min, min < max ? max : undefined),
    //         ...(min < max ? [] : contour.slice(0, max)),
    //     ];

    //     const a = leftHull(pointsA);
    //     const b = leftHull(pointsB);
    //     const convex = [...a.slice(1), ...b.slice(1), a[1]].map((p) => fromLGtoPA(p));

    //     // find longest edge
    //     // let i = 0;
    //     // let l = 0;
    //     // for (let j = 1; j < convex.length; j++) {
    //     //     const d = getPointDistance(convex[j - 1], convex[j % (convex.length - 1)]);
    //     //     if (d > l) {
    //     //         l = d;
    //     //         i = j;
    //     //     }
    //     // }
    //     // Add extra point
    //     // const cp = getCenterLine(toArrayP(convex[i - 1]), toArrayP(convex[i % (convex.length - 1)]));
    //     // const r = new Ray(toGP(cp), new Vector(1, 1));
    //     // convex.splice(i, 0, r.get(100));

    //     if (!this.shapeMap.has(HAND_TYPE) || getShape(this.shapeMap.get(HAND_TYPE)!) === undefined) {
    //         shape = new Polygon(convex[0], convex.slice(1), undefined, { fillColour: "rgba(0, 0, 0, 1)" });

    //         shape.options.preFogShape = true;
    //         shape.options.skipDraw = true;
    //         shape.globalCompositeOperation = "source-over";
    //         addKillTimer(shape.id, 2, SyncMode.NO_SYNC, false);

    //         const layer = floorSystem.getLayer(floorState.currentFloor!.value!, LayerName.Lighting)!;
    //         layer.addShape(shape, SyncMode.NO_SYNC, InvalidationMode.NO);
    //         this.shapeMap.set(HAND_TYPE, shape.id);
    //     } else {
    //         shape = getShape(this.shapeMap.get(HAND_TYPE)!)! as Polygon;
    //         shape.vertices = convex;
    //         setKillTimerTicks(shape.id, 2);
    //         shape.layer;
    //     }
    //     shape.layer.invalidate(false);
    // }
}

// graham & yao polygon -> convex hull
// function leftHull(points: [number, number][]): [number, number][] {
//     const q = [points[0], points[1]];
//     let t = 1;
//     let x = 2;
//     while (orientation(q[t - 1], q[t], points[x]) != Sign.RIGHT_TURN) {
//         x++;
//         if (x > points.length - 1) return q;
//     }
//     q.push(points[x]);
//     t++;
//     let y = x - 1;

//     while (true) {
//         x++;
//         if (x > points.length - 1) return q;

//         if (orientation(q[t - 1], q[t], points[x]) != Sign.LEFT_TURN) {
//             let tg: [number, number][];
//             if (orientation(points[y], q[t], points[x]) == Sign.LEFT_TURN) {
//                 tg = [q[t - 1], q[t]];
//             } else {
//                 tg = [q[t], q[0]];
//             }
//             while (orientation(tg[0], tg[1], points[x]) != Sign.LEFT_TURN) {
//                 x++;
//                 if (x > points.length - 1) return q;
//             }
//         }

//         while (orientation(q[t - 1], q[t], points[x]) != Sign.RIGHT_TURN) {
//             q.pop();
//             t--;
//         }

//         q.push(points[x]);
//         t++;
//         y = x - 1;
//     }
// }

// function getIndex(data: [number, number][], cmp: (curr: [number, number], acc: [number, number]) => boolean): number {
//     let i = 0;
//     let d = data[0];
//     for (const [e, el] of data.slice(1).entries()) {
//         if (cmp(el, d)) {
//             i = e;
//             d = el;
//         }
//     }
//     return i;
// }

// (window as any).lh = leftHull;

export const lastGameboardStore = new LastGameboardStore();
(window as any).lastGameboardStore = lastGameboardStore;
