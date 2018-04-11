import { SelectOperations, calculateDelta } from "./tools";
import { Vector, LocalPoint, GlobalPoint } from "../geom";
import Rect from "../shapes/rect";
import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g, g2l, g2lx, g2ly, l2gy, l2gx } from "../units";
import socket from "../socket";
import BaseRect from "../shapes/baserect";
import { Tool } from "./tool";


export class SelectTool extends Tool {
    mode: SelectOperations = SelectOperations.Noop;
    resizedir: string = "";
    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    drag: Vector<LocalPoint> = new Vector<LocalPoint>({ x: 0, y: 0 }, new LocalPoint(0, 0));
    selectionStartPoint: GlobalPoint = new GlobalPoint(-1000, -1000);
    selectionHelper: Rect = new Rect(this.selectionStartPoint, 0, 0);
    constructor() {
        super();
        this.selectionHelper.owners.push(gameManager.username);
    }
    onMouseDown(e: MouseEvent): void {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer()!;
        const mouse = getMouse(e);

        let hit = false;
        // the selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length)
            selectionStack = layer.shapes;
        else
            selectionStack = layer.shapes.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            const corn = shape.getCorner(l2g(mouse));
            if (corn !== undefined) {
                if (!shape.ownedBy()) continue;
                layer.selection = [shape];
                shape.onSelection();
                this.mode = SelectOperations.Resize;
                this.resizedir = corn;
                layer.invalidate(true);
                hit = true;
                break;
            } else if (shape.contains(l2g(mouse))) {
                if (!shape.ownedBy()) continue;
                const sel = shape;
                const z = gameManager.layerManager.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                this.mode = SelectOperations.Drag;
                this.drag = mouse.subtract(g2l(sel.refPoint));
                // this.drag.origin = g2l(sel.refPoint);
                // this.drag.direction = mouse.subtract(this.drag.origin);
                layer.invalidate(true);
                hit = true;
                break;
            }
        }

        if (!hit) {
            layer.selection.forEach(function (sel) {
                sel.onSelectionLoss();
            });
            this.mode = SelectOperations.GroupSelect;
            this.selectionStartPoint = l2g(getMouse(e));
            this.selectionHelper.refPoint = this.selectionStartPoint;
            this.selectionHelper.w = 0;
            this.selectionHelper.h = 0;
            layer.selection = [this.selectionHelper];
            layer.invalidate(true);
        }
    };
    onMouseMove(e: MouseEvent): void {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer()!;
        const mouse = getMouse(e);
        const z = gameManager.layerManager.zoomFactor;
        if (this.mode === SelectOperations.GroupSelect) {
            // Currently draw on active this
            const endPoint = l2g(mouse);

            this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper.refPoint = new GlobalPoint(
                Math.min(this.selectionStartPoint.x, endPoint.x),
                Math.min(this.selectionStartPoint.y, endPoint.y)
            );
            layer.invalidate(true);
        } else if (layer.selection.length) {
            const og = g2l(layer.selection[layer.selection.length - 1].refPoint);
            let delta = l2g(mouse.subtract(og.add(this.drag)));
            if (this.mode === SelectOperations.Drag) {
                // If we are on the tokens layer do a movement block check.
                if (layer.name === 'tokens') {
                    for (let i = 0; i < layer.selection.length; i++) {
                        const sel = layer.selection[i];
                        if (sel.uuid === this.selectionHelper.uuid) continue; // the selection helper should not be treated as a real shape.
                        delta = calculateDelta(delta, sel);
                    }
                }
                // Actually apply the delta on all shapes
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    sel.refPoint = sel.refPoint.add(delta);
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                }
                layer.invalidate(false);
            } else if (this.mode === SelectOperations.Resize) {
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    if (!(sel instanceof BaseRect)) return; // TODO
                    // TODO: This has to be shape specific
                    if (this.resizedir === 'nw') {
                        sel.w = g2lx(sel.refPoint.x) + sel.w * z - mouse.x;
                        sel.h = g2ly(sel.refPoint.y) + sel.h * z - mouse.y;
                        sel.refPoint = l2g(mouse);
                    } else if (this.resizedir === 'ne') {
                        sel.w = mouse.x - g2lx(sel.refPoint.x);
                        sel.h = g2ly(sel.refPoint.y) + sel.h * z - mouse.y;
                        sel.refPoint.y = l2gy(mouse.y);
                    } else if (this.resizedir === 'se') {
                        sel.w = mouse.x - g2lx(sel.refPoint.x);
                        sel.h = mouse.y - g2ly(sel.refPoint.y);
                    } else if (this.resizedir === 'sw') {
                        sel.w = g2lx(sel.refPoint.x) + sel.w * z - mouse.x;
                        sel.h = mouse.y - g2ly(sel.refPoint.y);
                        sel.refPoint.x = l2gx(mouse.x);
                    }
                    sel.w /= z;
                    sel.h /= z;
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
            } else {
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    if (!(sel instanceof BaseRect)) return; // TODO
                    const gm = l2g(mouse);
                    if (sel.inCorner(gm, "nw")) {
                        document.body.style.cursor = "nw-resize";
                    } else if (sel.inCorner(gm, "ne")) {
                        document.body.style.cursor = "ne-resize";
                    } else if (sel.inCorner(gm, "se")) {
                        document.body.style.cursor = "se-resize";
                    } else if (sel.inCorner(gm, "sw")) {
                        document.body.style.cursor = "sw-resize";
                    } else {
                        document.body.style.cursor = "default";
                    }
                }
            };
        } else {
            document.body.style.cursor = "default";
        }
    };
    onMouseUp(e: MouseEvent): void {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer()!;
        const mouse = getMouse(e);
        if (this.mode === SelectOperations.GroupSelect) {
            layer.selection = [];
            layer.shapes.forEach((shape) => {
                if (shape === this.selectionHelper) return;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy()) return;
                if (this.selectionHelper!.refPoint.x <= bbox.refPoint.x + bbox.w &&
                    this.selectionHelper!.refPoint.x + this.selectionHelper!.w >= bbox.refPoint.x &&
                    this.selectionHelper!.refPoint.y <= bbox.refPoint.y + bbox.h &&
                    this.selectionHelper!.refPoint.y + this.selectionHelper!.h >= bbox.refPoint.y) {
                    layer.selection.push(shape);
                }
            });

            // Push the selection helper as the last element of the selection
            // This makes sure that it will be the first one to be hit in the hit detection onMouseDown
            if (layer.selection.length > 0)
                layer.selection.push(this.selectionHelper);

            layer.invalidate(true);
        } else if (layer.selection.length) {
            layer.selection.forEach((sel) => {
                if (this.mode === SelectOperations.Drag) {
                    if (this.drag.origin!.x === g2lx(sel.refPoint.x) && this.drag.origin!.y === g2ly(sel.refPoint.y)) { return }
                    if ((sel instanceof BaseRect) && gameManager.layerManager.useGrid && !e.altKey) {
                        const gs = gameManager.layerManager.gridSize;
                        const mouse = sel.center();
                        const mx = mouse.x;
                        const my = mouse.y;
                        if ((sel.w / gs) % 2 === 0) {
                            sel.refPoint.x = Math.round(mx / gs) * gs - sel.w / 2;
                        } else {
                            sel.refPoint.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - sel.w / 2;
                        }
                        if ((sel.h / gs) % 2 === 0) {
                            sel.refPoint.y = Math.round(my / gs) * gs - sel.h / 2;
                        } else {
                            sel.refPoint.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - sel.h / 2;
                        }
                    }

                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === SelectOperations.Resize) {
                    if (!(sel instanceof BaseRect)) return; // TODO
                    if (sel.w < 0) {
                        sel.refPoint.x += sel.w;
                        sel.w = Math.abs(sel.w);
                    }
                    if (sel.h < 0) {
                        sel.refPoint.y += sel.h;
                        sel.h = Math.abs(sel.h);
                    }
                    if (gameManager.layerManager.useGrid && !e.altKey) {
                        const gs = gameManager.layerManager.gridSize;
                        sel.refPoint.x = Math.round(sel.refPoint.x / gs) * gs;
                        sel.refPoint.y = Math.round(sel.refPoint.y / gs) * gs;
                        sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                        sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                    }
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
            });
        }
        this.mode = SelectOperations.Noop
    };
    onContextMenu(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer()!;
        const mouse = getMouse(e);
        const mx = mouse.x;
        const my = mouse.y;
        let hit = false;
        layer.shapes.forEach(function (shape) {
            if (!hit && shape.contains(l2g(mouse))) {
                shape.showContextMenu(mouse);
            }
        });
    };
}