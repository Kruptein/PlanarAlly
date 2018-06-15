import { SelectOperations, calculateDelta } from "./tools";
import { Vector, LocalPoint, GlobalPoint, Ray } from "../geom";
import Rect from "../shapes/rect";
import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g, g2l, g2lx, g2ly } from "../units";
import socket from "../socket";
import { Tool } from "./tool";
import Settings from "../settings";
import CircularToken from "../shapes/circulartoken";


export class SelectTool extends Tool {
    mode: SelectOperations = SelectOperations.Noop;
    resizedir: string = "";
    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    drag: Ray<LocalPoint> = new Ray<LocalPoint>(new LocalPoint(0, 0), new Vector(0, 0));
    selectionStartPoint: GlobalPoint = new GlobalPoint(-1000, -1000);
    selectionHelper: Rect = new Rect(this.selectionStartPoint, 0, 0);
    dialog = $("#createtokendialog").dialog({
        autoOpen: false,
        buttons: {
            "Create token": function () {
                // *pukes*
                const token = new CircularToken(
                    (<SelectTool>gameManager.tools.get("select")).selectionStartPoint,
                    Settings.gridSize / 2,
                    <string>$("#createtokendialog-name").val(),
                    "10px serif",
                    (<SelectTool>gameManager.tools.get("select")).dialog_fill.spectrum("get").toRgbString(),
                    (<SelectTool>gameManager.tools.get("select")).dialog_border.spectrum("get").toRgbString()
                );
                const layer = gameManager.layerManager.getLayer()!;
                layer.addShape(token, true);
                layer.invalidate(false);
                $(this).dialog('close');
            }
        }
    });
    dialog_fill = $("#createtokendialog-fill").spectrum({
        showInput: true,
        showAlpha: true,
        color: "#fff",
    });
    dialog_border = $("#createtokendialog-border").spectrum({
        showInput: true,
        showAlpha: true,
        color: "#000",
    });

    constructor() {
        super();
        this.selectionHelper.owners.push(Settings.username);
    }
    onMouseDown(e: MouseEvent): void {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = gameManager.layerManager.getLayer()!;
        const mouse = getMouse(e);

        let hit = false;
        // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length)
            selectionStack = layer.shapes;
        else
            selectionStack = layer.shapes.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            const corn = shape.getBoundingBox().getCorner(l2g(mouse));
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
                const z = Settings.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                this.mode = SelectOperations.Drag;
                const lref = g2l(sel.refPoint);
                this.drag = new Ray<LocalPoint>(lref, mouse.subtract(lref));
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
        const z = Settings.zoomFactor;
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
            const origin = og.add(this.drag.direction);
            let delta = mouse.subtract(origin).multiply(1/Settings.zoomFactor);
            if (this.mode === SelectOperations.Drag) {
                // If we are on the tokens layer do a movement block check.
                if (layer.name === 'tokens' && !(e.shiftKey && Settings.IS_DM)) {
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
                    sel.resize(this.resizedir, mouse);
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
            } else {
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    const bb = sel.getBoundingBox();
                    const gm = l2g(mouse);
                    if (bb.inCorner(gm, "nw")) {
                        document.body.style.cursor = "nw-resize";
                    } else if (bb.inCorner(gm, "ne")) {
                        document.body.style.cursor = "ne-resize";
                    } else if (bb.inCorner(gm, "se")) {
                        document.body.style.cursor = "se-resize";
                    } else if (bb.inCorner(gm, "sw")) {
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
                if (this.selectionHelper!.refPoint.x <= bbox.topRight.x &&
                    this.selectionHelper!.refPoint.x + this.selectionHelper!.w >= bbox.topLeft.x &&
                    this.selectionHelper!.refPoint.y <= bbox.botLeft.y &&
                    this.selectionHelper!.refPoint.y + this.selectionHelper!.h >= bbox.topLeft.y) {
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
                    if (Settings.useGrid && !e.altKey) {
                        sel.snapToGrid();
                    }

                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === SelectOperations.Resize) {
                    if (Settings.useGrid && !e.altKey) {
                        sel.resizeToGrid();
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
        let hit = false;
        layer.selection.forEach(function (shape) {
            if (!hit && shape.contains(l2g(mouse))) {
                hit = true;
                shape.showContextMenu(mouse);
            }
        });
        if (!hit) {
            if (gameManager.layerManager.getLayer() === undefined) return;
            const l = gameManager.layerManager.getLayer()!;
            const asset = this;
            const $menu = $('#contextMenu');
            $menu.show();
            $menu.empty();
            $menu.css({ left: mouse.x, top: mouse.y });
            let data = "<ul>";
            if (Settings.IS_DM)
                data += "<li data-action='bringPlayers' class='context-clickable'>Bring players</li>";
            data += "<li data-action='createToken' class='context-clickable'>Create basic token</li>";
            data += "</ul>";
            $menu.html(data);
            const self = this;
            $(".context-clickable").on('click', function () {
                const action = $(this).data("action");
                switch (action) {
                    case 'bringPlayers':
                        if (!Settings.IS_DM) break;
                        const g_mouse = l2g(mouse);
                        socket.emit("bringPlayers", {x: g_mouse.x, y: g_mouse.y});
                        break;
                    case 'createToken':
                        self.selectionStartPoint = l2g(mouse);
                        self.dialog.dialog("open");
                        break;
                }
                $menu.hide();
            });
        }
    }
}