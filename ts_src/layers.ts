import {getUnitDistance, g2l, g2lz, g2lr, g2lx, g2ly} from "./units";
import {GlobalPoint} from "./geom";
import gameManager from "./planarally";
import socket from "./socket";
import { LocationOptions, ServerShape } from "./api_types";
import Shape from "./shapes/shape";
import Circle from "./shapes/circle";
import BoundingRect from "./shapes/boundingrect";
import { createShapeFromDict } from "./shapes/utils";
import { Settings } from "./settings";

export class LayerManager {
    layers: Layer[] = [];
    width = window.innerWidth;
    height = window.innerHeight;
    selectedLayer: string = "";

    UUIDMap: Map<string, Shape> = new Map();

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

    setOptions(options: LocationOptions): void {
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

    addLayer(layer: Layer): void {
        this.layers.push(layer);
        if (this.selectedLayer === "" && layer.selectable) this.selectedLayer = layer.name;
    }

    hasLayer(name: string): boolean {
        return this.layers.some(l => l.name === name);
    }

    getLayer(name?: string) {
        name = (name === undefined) ? this.selectedLayer : name;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].name === name) return this.layers[i];
        }
    }

    //todo rename to selectLayer
    setLayer(name: string): void {
        let found = false;
        const lm = this;
        this.layers.forEach(function (layer) {
            if (!layer.selectable) return;
            if (found && layer.name !== 'fow') layer.ctx.globalAlpha = 0.3;
            else layer.ctx.globalAlpha = 1.0;

            if (name === layer.name) {
                lm.selectedLayer = name;
                found = true;
            }

            layer.selection = [];
            layer.invalidate(true);
        });
    }

    getGridLayer(): Layer|undefined {
        return this.getLayer("grid");
    }

    drawGrid(): void {
        const layer = this.getGridLayer();
        if (layer === undefined) return;
        const ctx = layer.ctx;
        layer.clear();
        ctx.beginPath();

        for (let i = 0; i < layer.width; i += Settings.gridSize * Settings.zoomFactor) {
            ctx.moveTo(i + (Settings.panX % Settings.gridSize) * Settings.zoomFactor, 0);
            ctx.lineTo(i + (Settings.panX % Settings.gridSize) * Settings.zoomFactor, layer.height);
            ctx.moveTo(0, i + (Settings.panY % Settings.gridSize) * Settings.zoomFactor);
            ctx.lineTo(layer.width, i + (Settings.panY % Settings.gridSize) * Settings.zoomFactor);
        }

        ctx.strokeStyle = gameManager.gridColour.spectrum("get").toRgbString();
        ctx.lineWidth = 1;
        ctx.stroke();
        layer.valid = true;
        if (this.hasLayer("fow"))
            this.getLayer("fow")!.invalidate(true);
    }

    setGridSize(gridSize: number): void {
        if (gridSize !== gridSize) {
            gridSize = gridSize;
            this.drawGrid();
            $('#gridSizeInput').val(gridSize);
        }
    }

    setUnitSize(unitSize: number): void {
        if (unitSize !== Settings.unitSize) {
            Settings.unitSize = unitSize;
            this.drawGrid();
            $('#unitSizeInput').val(unitSize);
        }
    }

    setUseGrid(useGrid: boolean): void {
        if (useGrid !== Settings.useGrid) {
            Settings.useGrid = useGrid;
            if (useGrid)
                $('#grid-layer').show();
            else
                $('#grid-layer').hide();
            $('#useGridInput').prop("checked", useGrid);
        }
    }

    setFullFOW(fullFOW: boolean): void {
        if (fullFOW !== Settings.fullFOW) {
            Settings.fullFOW = fullFOW;
            const fowl = this.getLayer("fow");
            if (fowl !== undefined)
                fowl.invalidate(false);
            $('#useFOWInput').prop("checked", fullFOW);
        }
    }

    setFOWOpacity(fowOpacity: number): void {
        Settings.fowOpacity = fowOpacity;
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
}

export class Layer {
    name: string;
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    selectable: boolean = false;
    player_editable: boolean = false;

    // When set to false, the layer will be redrawn on the next tick
    valid: boolean = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    shapes: Shape[] = [];

    // Collection of shapes that are currently selected
    selection: Shape[] = [];

    // Extra selection highlighting settings
    selectionColor = '#CC0000';
    selectionWidth = 2;

    constructor(canvas: HTMLCanvasElement, name: string) {
        this.canvas = canvas;
        this.name = name;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d')!;
    }

    invalidate(skipLightUpdate: boolean): void {
        this.valid = false;
        if (!skipLightUpdate && this.name !== "fow" && gameManager.layerManager.hasLayer("fow")) {
            gameManager.layerManager.getLayer("fow")!.invalidate(true);
        }
    }

    addShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        if (temporary === undefined) temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (shape.annotation.length)
            gameManager.annotations.push(shape.uuid);
        if (sync) socket.emit("add shape", {shape: shape.asDict(), temporary: temporary});
        gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
        this.invalidate(!sync);
    }

    setShapes(shapes: ServerShape[]): void {
        const t: Shape[] = [];
        const self = this;
        shapes.forEach(function (shape) {
            const sh = createShapeFromDict(shape);
            if (sh === undefined) {
                console.log(`Shape with unknown type ${shape.type} could not be added`);
                return ;
            }
            sh.layer = self.name;
            sh.checkLightSources();
            sh.setMovementBlock(shape.movementObstruction);
            if (sh.annotation.length)
                gameManager.annotations.push(sh.uuid);
            gameManager.layerManager.UUIDMap.set(shape.uuid, sh);
            t.push(sh);
        });
        this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
        this.shapes = t;
        this.invalidate(false);
    }

    removeShape(shape: Shape, sync: boolean, temporary?: boolean) {
        if (temporary === undefined) temporary = false;
        this.shapes.splice(this.shapes.indexOf(shape), 1);
        if (sync) socket.emit("remove shape", {shape: shape, temporary: temporary});
        const ls_i = gameManager.lightsources.findIndex(ls => ls.shape === shape.uuid);
        const lb_i = gameManager.lightblockers.findIndex(ls => ls === shape.uuid);
        const mb_i = gameManager.movementblockers.findIndex(ls => ls === shape.uuid);
        const an_i = gameManager.annotations.findIndex(ls => ls === shape.uuid);
        if (ls_i >= 0)
            gameManager.lightsources.splice(ls_i, 1);
        if (lb_i >= 0)
            gameManager.lightblockers.splice(lb_i, 1);
        if (mb_i >= 0)
            gameManager.movementblockers.splice(mb_i, 1);
        if (an_i >= 0)
            gameManager.annotations.splice(an_i, 1);

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

            this.shapes.forEach(function (shape) {
                if (gameManager.layerManager.getLayer() === undefined) return;
                if (!shape.visibleInCanvas(state.canvas)) return;
                if (state.name === 'fow' && shape.visionObstruction && gameManager.layerManager.getLayer()!.name !== state.name) return;
                shape.draw(ctx);
            });

            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = Settings.zoomFactor;
                this.selection.forEach(function (sel) {
                    const bb = sel.getBoundingBox();
                    // TODO: REFACTOR THIS TO Shape.drawSelection(ctx);
                    ctx.strokeRect(g2lx(bb.refPoint.x), g2ly(bb.refPoint.y), bb.w * z, bb.h * z);

                    // topright
                    ctx.fillRect(g2lx(bb.refPoint.x + bb.w - 3), g2ly(bb.refPoint.y - 3), 6 * z, 6 * z);
                    // topleft
                    ctx.fillRect(g2lx(bb.refPoint.x - 3), g2ly(bb.refPoint.y - 3), 6 * z, 6 * z);
                    // botright
                    ctx.fillRect(g2lx(bb.refPoint.x + bb.w - 3), g2ly(bb.refPoint.y + bb.h - 3), 6 * z, 6 * z);
                    // botleft
                    ctx.fillRect(g2lx(bb.refPoint.x - 3), g2ly(bb.refPoint.y + bb.h - 3), 6 * z, 6 * z)
                });
            }

            this.valid = true;
        }
    }

    moveShapeOrder(shape: Shape, destinationIndex: number, sync: boolean): void {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex) return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync) socket.emit("moveShapeOrder", {shape: shape.asDict(), index: destinationIndex});
        this.invalidate(true);
    };

    onShapeMove(shape?: Shape): void {
        this.invalidate(false);
    }
}

export class GridLayer extends Layer {
    invalidate(): void {
        gameManager.layerManager.drawGrid();
    }
}

export class FOWLayer extends Layer {

    addShape(shape: Shape, sync: boolean, temporary?: boolean): void {
        shape.fill = gameManager.fowColour.spectrum("get").toRgbString();
        super.addShape(shape, sync, temporary);
    }

    setShapes(shapes: ServerShape[]): void {
        const c = gameManager.fowColour.spectrum("get").toRgbString();
        shapes.forEach(function (shape) {
            shape.fill = c;
        });
        super.setShapes(shapes);
    }

    onShapeMove(shape: Shape): void {
        shape.fill = gameManager.fowColour.spectrum("get").toRgbString();
        super.onShapeMove(shape);
    };

    draw(): void {
        if (gameManager.board_initialised && !this.valid) {
            const ctx = this.ctx;
            const orig_op = ctx.globalCompositeOperation;
            if (Settings.fullFOW) {
                const ogalpha = this.ctx.globalAlpha;
                this.ctx.globalCompositeOperation = "copy";
                if (gameManager.IS_DM)
                    this.ctx.globalAlpha = Settings.fowOpacity;
                this.ctx.fillStyle = gameManager.fowColour.spectrum("get").toRgbString();
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalAlpha = ogalpha;
                this.ctx.globalCompositeOperation = orig_op;
            }
            if (!gameManager.IS_DM)
                super.draw(!Settings.fullFOW);
            ctx.globalCompositeOperation = 'destination-out';
            if (gameManager.layerManager.hasLayer("tokens")) {
                gameManager.layerManager.getLayer("tokens")!.shapes.forEach(function (sh) {
                    if (!sh.ownedBy()) return;
                    const bb = sh.getBoundingBox();
                    const lcenter = g2l(sh.center());
                    const alm = 0.8 * g2lz(bb.w);
                    ctx.beginPath();
                    ctx.arc(lcenter.x, lcenter.y, alm, 0, 2 * Math.PI);
                    const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fill();
                });
            }
            ctx.globalCompositeOperation = 'destination-out';
            gameManager.lightsources.forEach(function (ls) {
                const sh = gameManager.layerManager.UUIDMap.get(ls.shape);
                if (sh === undefined) return;
                const aura = sh.auras.find(a => a.uuid === ls.aura);
                if (aura === undefined) {
                    console.log("Old lightsource still lingering in the gameManager list");
                    return;
                }
                const aura_length = getUnitDistance(aura.value);
                const center = sh.center();
                const lcenter = g2l(center);
                const bbox = new Circle(center, aura_length).getBoundingBox();

                // We first collect all lightblockers that are inside/cross our aura
                // This to prevent as many ray calculations as possible
                const local_lightblockers: BoundingRect[] = [];
                gameManager.lightblockers.forEach(function (lb) {
                    if (lb === sh.uuid) return;
                    const lb_sh = gameManager.layerManager.UUIDMap.get(lb);
                    if (lb_sh === undefined) return;
                    const lb_bb = lb_sh.getBoundingBox();
                    if (lb_bb.intersectsWith(bbox))
                        local_lightblockers.push(lb_bb);
                });

                ctx.beginPath();

                let arc_start = 0;

                // Cast rays in every degree
                for (let angle = 0; angle < 2 * Math.PI; angle += (1 / 180) * Math.PI) {
                    // Check hit with obstruction
                    let hit: {intersect: GlobalPoint|null, distance:number} = {intersect: null, distance: Infinity};
                    let shape_hit: null|BoundingRect = null;
                    for (let i=0; i<local_lightblockers.length; i++) {
                        const lb_bb = local_lightblockers[i];
                        const result = lb_bb.getIntersectWithLine({
                            start: center,
                            end: new GlobalPoint(
                                center.x + aura_length * Math.cos(angle),
                                center.y + aura_length * Math.sin(angle)
                            )
                        });
                        if (result.intersect !== null && result.distance < hit.distance) {
                            hit = result;
                            shape_hit = lb_bb;
                        }
                    }
                    // If we have no hit, check if we come from a previous hit so that we can go back to the arc
                    if (hit.intersect === null) {
                        if (arc_start === -1) {
                            arc_start = angle;
                            const dest = g2l(new GlobalPoint(center.x + aura_length * Math.cos(angle), center.y + aura_length * Math.sin(angle)));
                            ctx.lineTo(dest.x, dest.y);
                        }
                        continue;
                    }
                    // If hit , first finish any ongoing arc, then move to the intersection point
                    if (arc_start !== -1) {
                        ctx.arc(lcenter.x, lcenter.y, g2lr(aura.value), arc_start, angle);
                        arc_start = -1;
                    }
                    let extraX = 0;
                    let extraY = 0;
                    if (shape_hit !== null) {
                        extraX = (shape_hit.w / 10) * Math.cos(angle);
                        extraY = (shape_hit.h / 10) * Math.sin(angle);
                    }
                    // if (!shape_hit.contains(hit.intersect.x + extraX, hit.intersect.y + extraY, false)) {
                    //     extraX = 0;
                    //     extraY = 0;
                    // }
                    const dest = g2l(new GlobalPoint(hit.intersect.x + extraX, hit.intersect.y + extraY));
                    ctx.lineTo(dest.x, dest.y);
                }
                if (arc_start !== -1)
                    ctx.arc(lcenter.x, lcenter.y, g2lr(aura.value), arc_start, 2 * Math.PI);

                const alm = g2lr(aura.value);
                const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                // ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fill();
            });
            if (gameManager.IS_DM)
                super.draw(!Settings.fullFOW);
            ctx.globalCompositeOperation = orig_op;
        }
    }
}