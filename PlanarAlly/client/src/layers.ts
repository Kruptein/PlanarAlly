import {getUnitDistance, l2w, l2wx, l2wy, w2l, w2lr, w2lx, w2ly, w2lz} from "./units";
import {Shape, Circle, createShapeFromDict, Rect} from "./shapes";
import {OrderedMap, Point} from "./utils";
import gameManager from "./planarally";
import socket from "./socket";

const selectionInfo = {
    x: $('#selectionInfoX'),
    y: $('#selectionInfoY'),
    w: $('#selectionInfoW'),
    h: $('#selectionInfoH')
};

function setSelectionInfo(shape) {
    selectionInfo.x.val(shape.x);
    selectionInfo.y.val(shape.y);
    selectionInfo.w.val(shape.w);
    selectionInfo.h.val(shape.h);
}

export class LayerManager {
    layers: Layer[] = [];
    width = window.innerWidth;
    height = window.innerHeight;
    selectedLayer: string = null;

    UUIDMap: Map<string, Shape> = new Map();

    gridSize = 50;
    unitSize = 5;
    useGrid = true;
    fullFOW = false;
    fowOpacity = 0.3;

    zoomFactor = 1;
    panX = 0;
    panY = 0;

    // Refresh interval and redraw setter.
    interval = 30;

    constructor() {
        const lm = this;
        setInterval(function () {
            for (let i = lm.layers.length - 1; i >= 0; i--) {
                lm.layers[i].draw();
            }
        }, this.interval);
    }

    setOptions(options): void {
        if ("unitSize" in options)
            this.setUnitSize(options.unitSize);
        if ("useGrid" in options)
            this.setUseGrid(options.useGrid);
        if ("fullFOW" in options)
            this.setFullFOW(options.fullFOW);
        if ('fowOpacity' in options)
            this.setFOWOpacity(options.fowOpacity);
        if ("fowColour" in options)
            gameManager.fowColour.spectrum("set", options.fowColour);
    }

    setWidth(width: number): void {
        this.width = width;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.width = width;
            this.layers[i].width = width;
        }
    }

    setHeight(height: number): void {
        this.height = height;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.height = height;
            this.layers[i].height = height;
        }
    }

    addLayer(layer): void {
        this.layers.push(layer);
        if (this.selectedLayer === null && layer.selectable) this.selectedLayer = layer.name;
    }

    getLayer(name?: string) {
        name = (typeof name === 'undefined') ? this.selectedLayer : name;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].name === name) return this.layers[i];
        }
    }

    //todo rename to selectLayer
    setLayer(name): void {
        let found = false;
        const lm = this;
        this.layers.forEach(function (layer) {
            if (!layer.selectable) return;
            if (found) layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                lm.selectedLayer = name;
                found = true;
            }

            layer.selection = [];
            layer.invalidate(true);
        });
    }

    getGridLayer(): Layer {
        return this.getLayer("grid");
    }

    drawGrid(): void {
        const layer = this.getGridLayer();
        const ctx = layer.ctx;
        layer.clear();
        ctx.beginPath();

        for (let i = 0; i < layer.width; i += this.gridSize * this.zoomFactor) {
            ctx.moveTo(i + (this.panX % this.gridSize) * this.zoomFactor, 0);
            ctx.lineTo(i + (this.panX % this.gridSize) * this.zoomFactor, layer.height);
            ctx.moveTo(0, i + (this.panY % this.gridSize) * this.zoomFactor);
            ctx.lineTo(layer.width, i + (this.panY % this.gridSize) * this.zoomFactor);
        }

        ctx.strokeStyle = gameManager.gridColour.spectrum("get").toRgbString();
        ctx.lineWidth = 1;
        ctx.stroke();
        layer.valid = true;
        const fowl = this.getLayer("fow");
        if (fowl !== undefined)
            fowl.invalidate(true);
    }

    setGridSize(gridSize: number): void {
        if (gridSize !== this.gridSize) {
            this.gridSize = gridSize;
            this.drawGrid();
            $('#gridSizeInput').val(gridSize);
        }
    }

    setUnitSize(unitSize: number): void {
        if (unitSize !== this.unitSize) {
            this.unitSize = unitSize;
            this.drawGrid();
            $('#unitSizeInput').val(unitSize);
        }
    }

    setUseGrid(useGrid: boolean): void {
        if (useGrid !== this.useGrid) {
            this.useGrid = useGrid;
            if (useGrid)
                $('#grid-layer').show();
            else
                $('#grid-layer').hide();
            $('#useGridInput').prop("checked", useGrid);
        }
    }

    setFullFOW(fullFOW: boolean): void {
        if (fullFOW !== this.fullFOW) {
            this.fullFOW = fullFOW;
            const fowl = this.getLayer("fow");
            if (fowl !== undefined)
                fowl.invalidate(false);
            $('#useFOWInput').prop("checked", fullFOW);
        }
    }

    setFOWOpacity(fowOpacity: number): void {
        this.fowOpacity = fowOpacity;
        const fowl = this.getLayer("fow");
        if (fowl !== undefined)
            fowl.invalidate(false);
        $('#fowOpacity').val(fowOpacity);
    }

    invalidate(): void {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].invalidate(true);
        }
    }

    onMouseDown(e: MouseEvent): void {
        this.getLayer().onMouseDown(e);
    }

    onMouseMove(e: MouseEvent): void {
        this.getLayer().onMouseMove(e);
    }

    onMouseUp(e: MouseEvent): void {
        this.getLayer().onMouseUp(e);
    }

    onContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        this.getLayer().onContextMenu(e);
    }
}

export class Layer {
    name: string;
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    selectable: boolean = false;

    // When set to false, the layer will be redrawn on the next tick
    valid: boolean = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    shapes = new OrderedMap();

    // State variables
    // todo change to enum ?
    dragging = false;
    resizing = false;
    panning = false;
    selecting = false;

    // This is a helper to identify which corner or more specifically which resize direction is being used.
    resizedir = '';

    // This is a reference to an optional rectangular object that is used to select multiple tokens
    selectionHelper: Rect | null = null;
    selectionStartPoint: Point | null = null;

    // Collection of shapes that are currently selected
    selection: Shape[] = [];

    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    dragoffx = 0;
    dragoffy = 0;
    dragorig: Point;

    // Extra selection highlighting settings
    selectionColor = '#CC0000';
    selectionWidth = 2;

    stylePaddingLeft: number;
    stylePaddingTop: number;
    styleBorderLeft: number;
    styleBorderTop: number;
    htmlTop: number;
    htmlLeft: number;

    constructor(canvas, name) {
        this.canvas = canvas;
        this.name = name;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d');

        // todo: do we actually need the stylepadding and html stuff ?
        if (document.defaultView && document.defaultView.getComputedStyle) {
            this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
            this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
            this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
            this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
        }

        const html = document.body;
        this.htmlTop = html.offsetTop;
        this.htmlLeft = html.offsetLeft;
    }

    invalidate(skipLightUpdate: boolean): void {
        this.valid = false;
        if (!skipLightUpdate && this.name !== "fow") {
            const fow = gameManager.layerManager.getLayer("fow");
            if (fow !== undefined)
                fow.invalidate(true);
        }
    }

    addShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        if (temporary === undefined) temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (sync) socket.emit("add shape", {shape: shape.asDict(), temporary: temporary});
        gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
        this.invalidate(!sync);
    }

    setShapes(shapes: Shape[]): void {
        const t = [];
        const self = this;
        shapes.forEach(function (shape) {
            const sh = createShapeFromDict(shape, self);
            sh.layer = self.name;
            sh.checkLightSources();
            sh.setMovementBlock(shape.movementObstruction);
            gameManager.layerManager.UUIDMap.set(shape.uuid, sh);
            t.push(sh);
        });
        this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
        this.shapes.data = t;
        this.invalidate(false);
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean) {
        if (temporary === undefined) temporary = false;
        this.shapes.remove(shape);
        if (sync) socket.emit("remove shape", {shape: shape, temporary: temporary});
        const ls_i = gameManager.lightsources.findIndex(ls => ls.shape === shape.uuid);
        const lb_i = gameManager.lightblockers.findIndex(ls => ls === shape.uuid);
        const mb_i = gameManager.movementblockers.findIndex(ls => ls === shape.uuid);
        if (ls_i >= 0)
            gameManager.lightsources.splice(ls_i, 1);
        if (lb_i >= 0)
            gameManager.lightblockers.splice(lb_i, 1);
        if (mb_i >= 0)
            gameManager.movementblockers.splice(mb_i, 1);
        gameManager.layerManager.UUIDMap.delete(shape.uuid);

        const index = this.selection.indexOf(shape);
        if (index >= 0)
            this.selection.splice(index, 1);
        this.invalidate(!sync);
    }

    clear(): void {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    draw(doClear?: boolean): void {
        if (gameManager.board_initialised && !this.valid) {
            const ctx = this.ctx;
            doClear = doClear === undefined ? true : doClear;

            if (doClear)
                this.clear();

            const state = this;

            this.shapes.data.forEach(function (shape) {
                if (w2lx(shape.x) > state.width || w2ly(shape.y) > state.height ||
                    w2lx(shape.x + shape.w) < 0 || w2ly(shape.y + shape.h) < 0) return;
                if (state.name === 'fow' && shape.visionObstruction && gameManager.layerManager.getLayer().name !== state.name) return;
                shape.draw(ctx);
            });

            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = gameManager.layerManager.zoomFactor;
                this.selection.forEach(function (sel) {
                    if (!(sel instanceof Rect)) return;
                    ctx.strokeRect(w2lx(sel.x), w2ly(sel.y), sel.w * z, sel.h * z);

                    // topright
                    ctx.fillRect(w2lx(sel.x + sel.w - 3), w2ly(sel.y - 3), 6 * z, 6 * z);
                    // topleft
                    ctx.fillRect(w2lx(sel.x - 3), w2ly(sel.y - 3), 6 * z, 6 * z);
                    // botright
                    ctx.fillRect(w2lx(sel.x + sel.w - 3), w2ly(sel.y + sel.h - 3), 6 * z, 6 * z);
                    // botleft
                    ctx.fillRect(w2lx(sel.x - 3), w2ly(sel.y + sel.h - 3), 6 * z, 6 * z)
                });
            }

            this.valid = true;
        }
    }

    getMouse(e: MouseEvent): Point {
        let element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

        // todo check if we need these offsets.
        // Compute the total offset
        if (element.offsetParent !== undefined) {
            do {
                offsetX += element.offsetLeft;
                offsetY += element.offsetTop;
            } while ((element = element.offsetParent));
        }

        // Add padding and border style widths to offset
        // Also add the <html> offsets in case there's a position:fixed bar
        offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
        offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

        mx = e.pageX - offsetX;
        my = e.pageY - offsetY;

        return {x: mx, y: my};
    };

    moveShapeOrder(shape: Shape, destinationIndex: number, sync: boolean): void {
        if (this.shapes.moveTo(shape, destinationIndex)) {
            if (sync) socket.emit("moveShapeOrder", {shape: shape.asDict(), index: destinationIndex});
            this.invalidate(true);
        }
    };

    onShapeMove(shape?: Shape): void {
        this.invalidate(false);
    }
    onMouseDown(e: MouseEvent): void {
        const mouse = this.getMouse(e);
        const mx = mouse.x;
        const my = mouse.y;

        if (gameManager.tools[gameManager.selectedTool].name === 'select') {
            let hit = false;
            // the selectionStack allows for lowwer positioned objects that are selected to have precedence during overlap.
            let selectionStack;
            if (!this.selection.length)
                selectionStack = this.shapes.data;
            else
                selectionStack = this.shapes.data.concat(this.selection);
            for (let i = selectionStack.length - 1; i >= 0; i--) {
                const shape = selectionStack[i];
                const corn = shape.getCorner(mx, my);
                if (corn !== undefined) {
                    if (!shape.ownedBy()) continue;
                    this.selection = [shape];
                    shape.onSelection();
                    this.resizing = true;
                    this.resizedir = corn;
                    this.invalidate(true);
                    hit = true;
                    setSelectionInfo(shape);
                    break;
                } else if (shape.contains(mx, my)) {
                    if (!shape.ownedBy()) continue;
                    const sel = shape;
                    const z = gameManager.layerManager.zoomFactor;
                    if (this.selection.indexOf(sel) === -1) {
                        this.selection = [sel];
                        sel.onSelection();
                    }
                    this.dragging = true;
                    this.dragoffx = mx - sel.x * z;
                    this.dragoffy = my - sel.y * z;
                    this.dragorig = Object.assign({}, sel);
                    setSelectionInfo(shape);
                    this.invalidate(true);
                    hit = true;
                    break;
                }
            }

            if (!hit) {
                this.selection.forEach(function (sel) {
                    sel.onSelectionLoss();
                });
                this.selection = [];
                this.selecting = true;
                this.selectionStartPoint = l2w(this.getMouse(e));
                this.selectionHelper = new Rect(this.selectionStartPoint.x, this.selectionStartPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
                this.selectionHelper.owners.push(gameManager.username);
                this.addShape(this.selectionHelper, false, false);
                this.invalidate(true);
            }
        } else if (gameManager.tools[gameManager.selectedTool].name === 'pan') {
            this.panning = true;
            this.dragoffx = mx;
            this.dragoffy = my;
        }
    }
    onMouseMove(e: MouseEvent): void {
        const mouse = this.getMouse(e);
        const z = gameManager.layerManager.zoomFactor;
        if (this.selecting) {
            if (this.selectionStartPoint === null) return;
            // Currently draw on active this
            const endPoint = l2w(this.getMouse(e));

            this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper.x = Math.min(this.selectionStartPoint.x, endPoint.x);
            this.selectionHelper.y = Math.min(this.selectionStartPoint.y, endPoint.y);
            this.invalidate(true);
        } else if (this.panning) {
            gameManager.layerManager.panX += Math.round((mouse.x - this.dragoffx) / z);
            gameManager.layerManager.panY += Math.round((mouse.y - this.dragoffy) / z);
            this.dragoffx = mouse.x;
            this.dragoffy = mouse.y;
            gameManager.layerManager.invalidate();
        } else if (this.selection.length) {
            const ogX = this.selection[this.selection.length - 1].x * z;
            const ogY = this.selection[this.selection.length - 1].y * z;
            this.selection.forEach(function (sel) {
                if (!(sel instanceof Rect)) return; // TODO
                const dx = mouse.x - (ogX + this.dragoffx);
                const dy = mouse.y - (ogY + this.dragoffy);
                if (this.dragging) {
                    sel.x += dx / z;
                    sel.y += dy / z;
                    if (this.name !== 'fow') {
                        // We need to use the above updated values for the bounding box check
                        // First check if the bounding boxes overlap to stop close / precise movement
                        let blocked = false;
                        const bbox = sel.getBoundingBox();
                        const blockers = gameManager.movementblockers.filter(
                            mb => mb !== sel.uuid && gameManager.layerManager.UUIDMap.get(mb).getBoundingBox().intersectsWith(bbox));
                        if (blockers.length > 0) {
                            blocked = true;
                        } else {
                            // Draw a line from start to end position and see for any intersect
                            // This stops sudden leaps over walls! cheeky buggers
                            const line = {start: {x: ogX / z, y: ogY / z}, end: {x: sel.x, y: sel.y}};
                            blocked = gameManager.movementblockers.some(
                                mb => {
                                    const inter = gameManager.layerManager.UUIDMap.get(mb).getBoundingBox().getIntersectWithLine(line);
                                    return mb !== sel.uuid && inter.intersect !== null && inter.distance > 0;
                                }
                            );
                        }
                        if (blocked) {
                            sel.x -= dx / z;
                            sel.y -= dy / z;
                            return;
                        }
                    }
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", {shape: sel.asDict(), temporary: true});
                        setSelectionInfo(sel);
                    }
                    this.invalidate(false);
                } else if (this.resizing) {
                    if (this.resizedir === 'nw') {
                        sel.w = w2lx(sel.x) + sel.w * z - mouse.x;
                        sel.h = w2ly(sel.y) + sel.h * z - mouse.y;
                        sel.x = l2wx(mouse.x);
                        sel.y = l2wy(mouse.y);
                    } else if (this.resizedir === 'ne') {
                        sel.w = mouse.x - w2lx(sel.x);
                        sel.h = w2ly(sel.y) + sel.h * z - mouse.y;
                        sel.y = l2wy(mouse.y);
                    } else if (this.resizedir === 'se') {
                        sel.w = mouse.x - w2lx(sel.x);
                        sel.h = mouse.y - w2ly(sel.y);
                    } else if (this.resizedir === 'sw') {
                        sel.w = w2lx(sel.x) + sel.w * z - mouse.x;
                        sel.h = mouse.y - w2ly(sel.y);
                        sel.x = l2wx(mouse.x);
                    }
                    sel.w /= z;
                    sel.h /= z;
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", {shape: sel.asDict(), temporary: true});
                        setSelectionInfo(sel);
                    }
                    this.invalidate(false);
                } else if (sel) {
                    if (sel.inCorner(mouse.x, mouse.y, "nw")) {
                        document.body.style.cursor = "nw-resize";
                    } else if (sel.inCorner(mouse.x, mouse.y, "ne")) {
                        document.body.style.cursor = "ne-resize";
                    } else if (sel.inCorner(mouse.x, mouse.y, "se")) {
                        document.body.style.cursor = "se-resize";
                    } else if (sel.inCorner(mouse.x, mouse.y, "sw")) {
                        document.body.style.cursor = "sw-resize";
                    } else {
                        document.body.style.cursor = "default";
                    }
                }
            });
        } else {
            document.body.style.cursor = "default";
        }
    }
    onMouseUp(e: MouseEvent): void {
        if (this.selecting) {
            if (this.selectionStartPoint === null) return;

            this.shapes.data.forEach(function (shape) {
                if (shape === this.selectionHelper) return;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy()) return;
                if (this.selectionHelper.x <= bbox.x + bbox.w &&
                    this.selectionHelper.x + this.selectionHelper.w >= bbox.x &&
                    this.selectionHelper.y <= bbox.y + bbox.h &&
                    this.selectionHelper.y + this.selectionHelper.h >= bbox.y) {
                    this.selection.push(shape);
                }
            });

            // Push the selection helper as the last element of the selection
            // This makes sure that it will be the first one to be hit in the hit detection onMouseDown
            if (this.selection.length > 0)
                this.selection.push(this.selectionHelper);

            this.removeShape(this.selectionHelper, false, false);
            this.selectionStartPoint = null;
            this.invalidate(true);
        } else if (this.panning) {
            socket.emit("set clientOptions", {
                panX: gameManager.layerManager.panX,
                panY: gameManager.layerManager.panY
            });
        } else if (this.selection.length) {
            this.selection.forEach(function (sel) {
                if (!(sel instanceof Rect)) return; // TODO
                if (this.dragging) {
                    if (gameManager.layerManager.useGrid && !e.altKey) {
                        const gs = gameManager.layerManager.gridSize;
                        const mouse = {x: sel.x + sel.w / 2, y: sel.y + sel.h / 2};
                        const mx = mouse.x;
                        const my = mouse.y;
                        if ((sel.w / gs) % 2 === 0) {
                            sel.x = Math.round(mx / gs) * gs - sel.w / 2;
                        } else {
                            sel.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - sel.w / 2;
                        }
                        if ((sel.h / gs) % 2 === 0) {
                            sel.y = Math.round(my / gs) * gs - sel.h / 2;
                        } else {
                            sel.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - sel.h / 2;
                        }
                    }
                    if (this.dragorig.x !== sel.x || this.dragorig.y !== sel.y) {
                        if (sel !== this.selectionHelper) {
                            socket.emit("shapeMove", {shape: sel.asDict(), temporary: false});
                            setSelectionInfo(sel);
                        }
                        this.invalidate(false);
                    }
                }
                if (this.resizing) {
                    if (sel.w < 0) {
                        sel.x += sel.w;
                        sel.w = Math.abs(sel.w);
                    }
                    if (sel.h < 0) {
                        sel.y += sel.h;
                        sel.h = Math.abs(sel.h);
                    }
                    if (gameManager.layerManager.useGrid && !e.altKey) {
                        const gs = gameManager.layerManager.gridSize;
                        sel.x = Math.round(sel.x / gs) * gs;
                        sel.y = Math.round(sel.y / gs) * gs;
                        sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                        sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                    }
                    if (sel !== this.selectionHelper) {
                        socket.emit("shapeMove", {shape: sel.asDict(), temporary: false});
                        setSelectionInfo(sel);
                    }
                    this.invalidate(false);
                }
            });
        }
        this.dragging = false;
        this.resizing = false;
        this.panning = false;
        this.selecting = false;
    }
    onContextMenu(e: MouseEvent): void {
        const mouse = this.getMouse(e);
        const mx = mouse.x;
        const my = mouse.y;
        let hit = false;
        this.shapes.data.forEach(function (shape) {
            if (!hit && shape.contains(mx, my)) {
                shape.showContextMenu(mouse);
            }
        });
    }
}

export class GridLayer extends Layer {
    constructor(canvas, name) {
        super(canvas, name);
    }

    invalidate(): void {
        gameManager.layerManager.drawGrid();
    }
}

export class FOWLayer extends Layer {
    constructor(canvas, name) {
        super(canvas, name);
    }

    addShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        shape.fill = gameManager.fowColour.spectrum("get").toRgbString();
        super.addShape(shape, sync, temporary);
    }

    setShapes(shapes: Shape[]): void {
        const c = gameManager.fowColour.spectrum("get").toRgbString();
        shapes.forEach(function (shape) {
            shape.fill = c;
        });
        super.setShapes(shapes);
    }

    onShapeMove(shape?: Shape): void {
        shape.fill = gameManager.fowColour.spectrum("get").toRgbString();
        super.onShapeMove(shape);
    };

    draw(): void {
        if (gameManager.board_initialised && !this.valid) {
            const ctx = this.ctx;
            const orig_op = ctx.globalCompositeOperation;
            if (gameManager.layerManager.fullFOW) {
                const ogalpha = this.ctx.globalAlpha;
                this.ctx.globalCompositeOperation = "copy";
                if (gameManager.IS_DM)
                    this.ctx.globalAlpha = gameManager.layerManager.fowOpacity;
                this.ctx.fillStyle = gameManager.fowColour.spectrum("get").toRgbString();
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalAlpha = ogalpha;
                this.ctx.globalCompositeOperation = orig_op;
            }
            if (!gameManager.IS_DM)
                super.draw(!gameManager.layerManager.fullFOW);
            ctx.globalCompositeOperation = 'destination-out';
            gameManager.layerManager.getLayer("tokens").shapes.data.forEach(function (sh) {
                if (!sh.ownedBy()) return;
                const bb = sh.getBoundingBox();
                const lcenter = w2l(sh.center());
                const alm = 0.8 * w2lz(bb.w);
                ctx.beginPath();
                ctx.arc(lcenter.x, lcenter.y, alm, 0, 2 * Math.PI);
                const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'destination-out';
            gameManager.lightsources.forEach(function (ls) {
                const sh = gameManager.layerManager.UUIDMap.get(ls.shape);
                const aura = sh.auras.find(a => a.uuid === ls.aura);
                if (aura === undefined) {
                    console.log("Old lightsource still lingering in the gameManager list");
                    return;
                }
                const aura_length = getUnitDistance(aura.value);
                const center = sh.center();
                const lcenter = w2l(center);
                const bbox = new Circle(center.x, center.y, aura_length).getBoundingBox();

                // We first collect all lightblockers that are inside/cross our aura
                // This to prevent as many ray calculations as possible
                const local_lightblockers = [];
                gameManager.lightblockers.forEach(function (lb) {
                    if (lb === sh.uuid) return;
                    const lb_sh = gameManager.layerManager.UUIDMap.get(lb);
                    const lb_bb = lb_sh.getBoundingBox();
                    if (lb_bb.intersectsWith(bbox))
                        local_lightblockers.push(lb_bb);
                });

                ctx.beginPath();

                let arc_start = 0;

                // Cast rays in every degree
                for (let angle = 0; angle < 2 * Math.PI; angle += (1 / 180) * Math.PI) {
                    // Check hit with obstruction
                    let hit = {intersect: null, distance: Infinity};
                    let shape_hit = null;
                    local_lightblockers.forEach(function (lb_bb) {
                        const result = lb_bb.getIntersectWithLine({
                            start: center,
                            end: {
                                x: center.x + aura_length * Math.cos(angle),
                                y: center.y + aura_length * Math.sin(angle)
                            }
                        });
                        if (result.intersect !== null && result.distance < hit.distance) {
                            hit = result;
                            shape_hit = lb_bb;
                        }
                    });
                    // If we have no hit, check if we come from a previous hit so that we can go back to the arc
                    if (hit.intersect === null) {
                        if (arc_start === -1) {
                            arc_start = angle;
                            ctx.lineTo(
                                w2lx(center.x + aura_length * Math.cos(angle)),
                                w2ly(center.y + aura_length * Math.sin(angle))
                            );
                        }
                        continue;
                    }
                    // If hit , first finish any ongoing arc, then move to the intersection point
                    if (arc_start !== -1) {
                        ctx.arc(lcenter.x, lcenter.y, w2lr(aura.value), arc_start, angle);
                        arc_start = -1;
                    }
                    let extraX = (shape_hit.w / 4) * Math.cos(angle);
                    let extraY = (shape_hit.h / 4) * Math.sin(angle);
                    // if (!shape_hit.contains(hit.intersect.x + extraX, hit.intersect.y + extraY, false)) {
                    //     extraX = 0;
                    //     extraY = 0;
                    // }
                    ctx.lineTo(w2lx(hit.intersect.x + extraX), w2ly(hit.intersect.y + extraY));
                }
                if (arc_start !== -1)
                    ctx.arc(lcenter.x, lcenter.y, w2lr(aura.value), arc_start, 2 * Math.PI);

                const alm = w2lr(aura.value);
                const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                // ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fill();
            });
            if (gameManager.IS_DM)
                super.draw(!gameManager.layerManager.fullFOW);
            ctx.globalCompositeOperation = orig_op;
        }
    }
}