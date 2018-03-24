import socket from './socket';
import { w2l, w2lx, w2ly, w2lz, w2lr, l2w, l2wx, l2wy, getUnitDistance } from "./units";
import { Circle, Rect, Asset, Text, Line, createShapeFromDict } from "./shapes";
// Removes violation errors on touchstart? https://stackoverflow.com/questions/46094912/added-non-passive-event-listener-to-a-scroll-blocking-touchstart-event
// This is only necessary due to the spectrum color picker
// $.events.special.touchstart = {
//     setup: function (_, ns, handle) {
//         if (ns.includes("noPreventDefault")) {
//             this.addEventListener("touchstart", handle, {passive: false});
//         } else {
//             this.addEventListener("touchstart", handle, {passive: true});
//         }
//     }
// };
let board_initialised = false;
// **** specific Layer State Management
function LayerState(canvas, name) {
    this.canvas = canvas;
    this.name = name;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }
    const html = document.body;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;
    const state = this;
    // When set to false, the layer will be redrawn on the next tick
    this.valid = false;
    // The collection of shapes that this layer contains.
    // These are ordered on a depth basis.
    this.shapes = new OrderedMap();
    // State variables
    this.dragging = false;
    this.resizing = false;
    this.panning = false;
    this.selecting = false;
    // This is a helper to identify which corner or more specifically which resize direction is being used.
    this.resizedir = '';
    // This is a reference to an optional rectangular object that is used to select multiple tokens
    this.selectionHelper = null;
    this.selectionStartPoint = null;
    // Collection of shapes that are currently selected
    this.selection = [];
    // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
    // we keep track of the actual offset within the asset.
    this.dragoffx = 0;
    this.dragoffy = 0;
    // Extra selection highlighting settings
    this.selectionColor = '#CC0000';
    this.selectionWidth = 2;
}
LayerState.prototype.invalidate = function (skipLightUpdate) {
    this.valid = false;
    skipLightUpdate = skipLightUpdate || false;
    if (!skipLightUpdate && this.name !== "fow") {
        const fow = gameManager.layerManager.getLayer("fow");
        if (fow !== undefined)
            fow.invalidate(true);
    }
};
LayerState.prototype.addShape = function (shape, sync, temporary) {
    if (sync === undefined)
        sync = false;
    if (temporary === undefined)
        temporary = false;
    shape.layer = this.name;
    this.shapes.push(shape);
    shape.checkLightSources();
    shape.setMovementBlock(shape.movementObstruction);
    if (sync)
        socket.emit("add shape", { shape: shape.asDict(), temporary: temporary });
    gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
    this.invalidate(!sync);
};
LayerState.prototype.setShapes = function (shapes) {
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
    this.invalidate();
};
LayerState.prototype.removeShape = function (shape, sync, temporary) {
    if (sync === undefined)
        sync = false;
    if (temporary === undefined)
        temporary = false;
    shape.onRemove();
    this.shapes.remove(shape);
    if (sync)
        socket.emit("remove shape", { shape: shape, temporary: temporary });
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
    if (this.selection === shape)
        this.selection = null;
    this.invalidate(!sync);
};
LayerState.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
};
LayerState.prototype.draw = function (doClear) {
    if (board_initialised && !this.valid) {
        const ctx = this.ctx;
        doClear = doClear === undefined ? true : doClear;
        if (doClear)
            this.clear();
        const state = this;
        this.shapes.data.forEach(function (shape) {
            if (w2lx(shape.x) > state.width || w2ly(shape.y) > state.height ||
                w2lx(shape.x + shape.w) < 0 || w2ly(shape.y + shape.h) < 0)
                return;
            if (state.name === 'fow' && shape.visionObstruction && gameManager.layerManager.getLayer().name !== state.name)
                return;
            shape.draw(ctx);
        });
        if (this.selection != null) {
            ctx.fillStyle = this.selectionColor;
            ctx.strokeStyle = this.selectionColor;
            ctx.lineWidth = this.selectionWidth;
            const z = gameManager.layerManager.zoomFactor;
            this.selection.forEach(function (sel) {
                ctx.strokeRect(w2lx(sel.x), w2ly(sel.y), sel.w * z, sel.h * z);
                // topright
                ctx.fillRect(w2lx(sel.x + sel.w - 3), w2ly(sel.y - 3), 6 * z, 6 * z);
                // topleft
                ctx.fillRect(w2lx(sel.x - 3), w2ly(sel.y - 3), 6 * z, 6 * z);
                // botright
                ctx.fillRect(w2lx(sel.x + sel.w - 3), w2ly(sel.y + sel.h - 3), 6 * z, 6 * z);
                // botleft
                ctx.fillRect(w2lx(sel.x - 3), w2ly(sel.y + sel.h - 3), 6 * z, 6 * z);
            });
        }
        this.valid = true;
    }
};
LayerState.prototype.getMouse = function (e) {
    let element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
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
    return { x: mx, y: my };
};
LayerState.prototype.moveShapeOrder = function (shape, destinationIndex, sync) {
    if (this.shapes.moveTo(shape, destinationIndex)) {
        if (sync)
            socket.emit("moveShapeOrder", { shape: shape.asDict(), index: destinationIndex });
        this.invalidate(true);
    }
};
LayerState.prototype.onShapeMove = function () {
    this.invalidate();
};
function GridLayerState(canvas, name) {
    LayerState.call(this, canvas, name);
}
GridLayerState.prototype = Object.create(LayerState.prototype);
GridLayerState.prototype.invalidate = function () {
    gameManager.layerManager.drawGrid();
};
function FOWLayerState(canvas, name) {
    LayerState.call(this, canvas, name);
}
FOWLayerState.prototype = Object.create(LayerState.prototype);
FOWLayerState.prototype.addShape = function (shape, sync, temporary) {
    shape.fill = gameManager.fowColour.spectrum("get").toRgbString();
    LayerState.prototype.addShape.call(this, shape, sync, temporary);
};
FOWLayerState.prototype.setShapes = function (shapes) {
    const c = gameManager.fowColour.spectrum("get").toRgbString();
    shapes.forEach(function (shape) {
        shape.fill = c;
    });
    LayerState.prototype.setShapes.call(this, shapes);
};
FOWLayerState.prototype.onShapeMove = function (shape) {
    shape.fill = gameManager.fowColour.spectrum("get").toRgbString();
    LayerState.prototype.onShapeMove.call(this, shape);
};
FOWLayerState.prototype.draw = function () {
    if (board_initialised && !this.valid) {
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
            LayerState.prototype.draw.call(this, !gameManager.layerManager.fullFOW);
        ctx.globalCompositeOperation = 'destination-out';
        gameManager.layerManager.getLayer("tokens").shapes.data.forEach(function (sh) {
            if (!sh.ownedBy())
                return;
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
                if (lb === sh.uuid)
                    return;
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
                let hit = { intersect: null, distance: Infinity };
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
                        ctx.lineTo(w2lx(center.x + aura_length * Math.cos(angle)), w2ly(center.y + aura_length * Math.sin(angle)));
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
            LayerState.prototype.draw.call(this, !gameManager.layerManager.fullFOW);
        ctx.globalCompositeOperation = orig_op;
    }
};
// **** Manager for working with multiple layers
function LayerManager() {
    this.layers = [];
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.selectedLayer = null;
    this.UUIDMap = new Map();
    this.gridSize = 50;
    this.unitSize = 5;
    this.useGrid = true;
    this.fullFOW = false;
    this.fowOpacity = 0.3;
    this.zoomFactor = 1;
    this.panX = 0;
    this.panY = 0;
    // Refresh interval and redraw setter.
    this.interval = 30;
    const lm = this;
    setInterval(function () {
        for (let i = lm.layers.length - 1; i >= 0; i--) {
            lm.layers[i].draw();
        }
    }, this.interval);
}
LayerManager.prototype.setOptions = function (options) {
    if ("unitSize" in options)
        gameManager.layerManager.setUnitSize(options.unitSize);
    if ("useGrid" in options)
        gameManager.layerManager.setUseGrid(options.useGrid);
    if ("fullFOW" in options)
        gameManager.layerManager.setFullFOW(options.fullFOW);
    if ('fowOpacity' in options)
        gameManager.layerManager.setFOWOpacity(options.fowOpacity);
    if ("fowColour" in options)
        gameManager.fowColour.spectrum("set", options.fowColour);
};
LayerManager.prototype.setWidth = function (width) {
    this.width = width;
    for (let i = 0; i < gameManager.layerManager.layers.length; i++) {
        gameManager.layerManager.layers[i].canvas.width = width;
        gameManager.layerManager.layers[i].width = width;
    }
};
LayerManager.prototype.setHeight = function (height) {
    this.height = height;
    for (let i = 0; i < this.layers.length; i++) {
        this.layers[i].canvas.height = height;
        this.layers[i].height = height;
    }
};
LayerManager.prototype.addLayer = function (layer) {
    this.layers.push(layer);
    if (this.selectedLayer === null && layer.selectable)
        this.selectedLayer = layer.name;
};
LayerManager.prototype.getLayer = function (name) {
    name = (typeof name === 'undefined') ? this.selectedLayer : name;
    for (let i = 0; i < this.layers.length; i++) {
        if (this.layers[i].name === name)
            return this.layers[i];
    }
};
LayerManager.prototype.setLayer = function (name) {
    let found = false;
    const lm = this;
    this.layers.forEach(function (layer) {
        if (!layer.selectable)
            return;
        if (found)
            layer.ctx.globalAlpha = 0.3;
        else
            layer.ctx.globalAlpha = 1.0;
        if (name === layer.name) {
            lm.selectedLayer = name;
            found = true;
        }
        layer.selection = [];
        layer.invalidate(true);
    });
};
LayerManager.prototype.getGridLayer = function () {
    return this.getLayer("grid");
};
LayerManager.prototype.drawGrid = function () {
    const layer = this.getGridLayer();
    const ctx = layer.ctx;
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    layer.clear();
    ctx.beginPath();
    for (let i = 0; i < layer.width; i += this.gridSize * z) {
        ctx.moveTo(i + (panX % this.gridSize) * z, 0);
        ctx.lineTo(i + (panX % this.gridSize) * z, layer.height);
        ctx.moveTo(0, i + (panY % this.gridSize) * z);
        ctx.lineTo(layer.width, i + (panY % this.gridSize) * z);
    }
    ctx.strokeStyle = gameManager.gridColour.spectrum("get").toRgbString();
    ctx.lineWidth = 1;
    ctx.stroke();
    layer.valid = true;
    const fowl = gameManager.layerManager.getLayer("fow");
    if (fowl !== undefined)
        fowl.invalidate();
};
LayerManager.prototype.setGridSize = function (gridSize) {
    if (gridSize !== this.gridSize) {
        this.gridSize = gridSize;
        this.drawGrid();
        $('#gridSizeInput').val(gridSize);
    }
};
LayerManager.prototype.setUnitSize = function (unitSize) {
    if (unitSize !== this.unitSize) {
        this.unitSize = unitSize;
        this.drawGrid();
        $('#unitSizeInput').val(unitSize);
    }
};
LayerManager.prototype.setUseGrid = function (useGrid) {
    if (useGrid !== this.useGrid) {
        this.useGrid = useGrid;
        if (useGrid)
            $('#grid-layer').show();
        else
            $('#grid-layer').hide();
        $('#useGridInput').prop("checked", useGrid);
    }
};
LayerManager.prototype.setFullFOW = function (fullFOW) {
    if (fullFOW !== this.fullFOW) {
        this.fullFOW = fullFOW;
        const fowl = gameManager.layerManager.getLayer("fow");
        if (fowl !== undefined)
            fowl.invalidate();
        $('#useFOWInput').prop("checked", fullFOW);
    }
};
LayerManager.prototype.setFOWOpacity = function (fowOpacity) {
    this.fowOpacity = fowOpacity;
    const fowl = gameManager.layerManager.getLayer("fow");
    if (fowl !== undefined)
        fowl.invalidate();
    $('#fowOpacity').val(fowOpacity);
};
LayerManager.prototype.invalidate = function () {
    for (let i = this.layers.length - 1; i >= 0; i--) {
        this.layers[i].invalidate(true);
    }
};
LayerManager.prototype.onMouseDown = function (e) {
    const layer = gameManager.layerManager.getLayer();
    const mouse = layer.getMouse(e);
    const mx = mouse.x;
    const my = mouse.y;
    if (tools[gameManager.selectedTool].name === 'select') {
        let hit = false;
        // the selectionStack allows for lowwer positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length)
            selectionStack = layer.shapes.data;
        else
            selectionStack = layer.shapes.data.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            const corn = shape.getCorner(mx, my);
            if (corn !== undefined) {
                if (!shape.ownedBy())
                    continue;
                layer.selection = [shape];
                shape.onSelection();
                layer.resizing = true;
                layer.resizedir = corn;
                layer.invalidate(true);
                hit = true;
                setSelectionInfo(shape);
                break;
            }
            else if (shape.contains(mx, my)) {
                if (!shape.ownedBy())
                    continue;
                const sel = shape;
                const z = gameManager.layerManager.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                layer.dragging = true;
                layer.dragoffx = mx - sel.x * z;
                layer.dragoffy = my - sel.y * z;
                layer.dragorig = Object.assign({}, sel);
                setSelectionInfo(shape);
                layer.invalidate(true);
                hit = true;
                break;
            }
        }
        if (!hit) {
            layer.selection.forEach(function (sel) {
                sel.onSelectionLoss();
            });
            layer.selection = [];
            layer.selecting = true;
            layer.selectionStartPoint = l2w(layer.getMouse(e));
            layer.selectionHelper = new Rect(layer.selectionStartPoint.x, layer.selectionStartPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
            layer.selectionHelper.owners.push(gameManager.username);
            layer.addShape(layer.selectionHelper, false, false);
            layer.invalidate(true);
        }
    }
    else if (tools[gameManager.selectedTool].name === 'pan') {
        layer.panning = true;
        layer.dragoffx = mx;
        layer.dragoffy = my;
    }
};
LayerManager.prototype.onMouseMove = function (e) {
    const layer = gameManager.layerManager.getLayer();
    const mouse = layer.getMouse(e);
    const z = gameManager.layerManager.zoomFactor;
    if (layer.selecting) {
        if (this.selectionStartPoint === null)
            return;
        // Currently draw on active layer
        const endPoint = l2w(layer.getMouse(e));
        layer.selectionHelper.w = Math.abs(endPoint.x - layer.selectionStartPoint.x);
        layer.selectionHelper.h = Math.abs(endPoint.y - layer.selectionStartPoint.y);
        layer.selectionHelper.x = Math.min(layer.selectionStartPoint.x, endPoint.x);
        layer.selectionHelper.y = Math.min(layer.selectionStartPoint.y, endPoint.y);
        layer.invalidate(true);
    }
    else if (layer.panning) {
        gameManager.layerManager.panX += Math.round((mouse.x - layer.dragoffx) / z);
        gameManager.layerManager.panY += Math.round((mouse.y - layer.dragoffy) / z);
        layer.dragoffx = mouse.x;
        layer.dragoffy = mouse.y;
        gameManager.layerManager.invalidate();
    }
    else if (layer.selection.length) {
        const ogX = layer.selection[layer.selection.length - 1].x * z;
        const ogY = layer.selection[layer.selection.length - 1].y * z;
        layer.selection.forEach(function (sel) {
            const dx = mouse.x - (ogX + layer.dragoffx);
            const dy = mouse.y - (ogY + layer.dragoffy);
            if (layer.dragging) {
                sel.x += dx / z;
                sel.y += dy / z;
                if (layer.name !== 'fow') {
                    // We need to use the above updated values for the bounding box check
                    // First check if the bounding boxes overlap to stop close / precise movement
                    let blocked = false;
                    const bbox = sel.getBoundingBox();
                    const blockers = gameManager.movementblockers.filter(mb => mb !== sel.uuid && gameManager.layerManager.UUIDMap.get(mb).getBoundingBox().intersectsWith(bbox));
                    if (blockers.length > 0) {
                        blocked = true;
                    }
                    else {
                        // Draw a line from start to end position and see for any intersect
                        // This stops sudden leaps over walls! cheeky buggers
                        const line = { start: { x: ogX / z, y: ogY / z }, end: { x: sel.x, y: sel.y } };
                        blocked = gameManager.movementblockers.some(mb => {
                            const inter = gameManager.layerManager.UUIDMap.get(mb).getBoundingBox().getIntersectWithLine(line);
                            return mb !== sel.uuid && inter.intersect !== null && inter.distance > 0;
                        });
                    }
                    if (blocked) {
                        sel.x -= dx / z;
                        sel.y -= dy / z;
                        return;
                    }
                }
                if (sel !== layer.selectionHelper) {
                    socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    setSelectionInfo(sel);
                }
                layer.invalidate();
            }
            else if (layer.resizing) {
                if (layer.resizedir === 'nw') {
                    sel.w = w2lx(sel.x) + sel.w * z - mouse.x;
                    sel.h = w2ly(sel.y) + sel.h * z - mouse.y;
                    sel.x = l2wx(mouse.x);
                    sel.y = l2wy(mouse.y);
                }
                else if (layer.resizedir === 'ne') {
                    sel.w = mouse.x - w2lx(sel.x);
                    sel.h = w2ly(sel.y) + sel.h * z - mouse.y;
                    sel.y = l2wy(mouse.y);
                }
                else if (layer.resizedir === 'se') {
                    sel.w = mouse.x - w2lx(sel.x);
                    sel.h = mouse.y - w2ly(sel.y);
                }
                else if (layer.resizedir === 'sw') {
                    sel.w = w2lx(sel.x) + sel.w * z - mouse.x;
                    sel.h = mouse.y - w2ly(sel.y);
                    sel.x = l2wx(mouse.x);
                }
                sel.w /= z;
                sel.h /= z;
                if (sel !== layer.selectionHelper) {
                    socket.emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    setSelectionInfo(sel);
                }
                layer.invalidate();
            }
            else if (sel) {
                if (sel.inCorner(mouse.x, mouse.y, "nw")) {
                    document.body.style.cursor = "nw-resize";
                }
                else if (sel.inCorner(mouse.x, mouse.y, "ne")) {
                    document.body.style.cursor = "ne-resize";
                }
                else if (sel.inCorner(mouse.x, mouse.y, "se")) {
                    document.body.style.cursor = "se-resize";
                }
                else if (sel.inCorner(mouse.x, mouse.y, "sw")) {
                    document.body.style.cursor = "sw-resize";
                }
                else {
                    document.body.style.cursor = "default";
                }
            }
        });
    }
    else {
        document.body.style.cursor = "default";
    }
};
LayerManager.prototype.onMouseUp = function (e) {
    const layer = gameManager.layerManager.getLayer();
    if (layer.selecting) {
        if (layer.selectionStartPoint === null)
            return;
        layer.shapes.data.forEach(function (shape) {
            if (shape === layer.selectionHelper)
                return;
            const bbox = shape.getBoundingBox();
            if (!shape.ownedBy())
                return;
            if (layer.selectionHelper.x <= bbox.x + bbox.w &&
                layer.selectionHelper.x + layer.selectionHelper.w >= bbox.x &&
                layer.selectionHelper.y <= bbox.y + bbox.h &&
                layer.selectionHelper.y + layer.selectionHelper.h >= bbox.y) {
                layer.selection.push(shape);
            }
        });
        // Push the selection helper as the last element of the selection
        // This makes sure that it will be the first one to be hit in the hit detection onMouseDown
        if (layer.selection.length > 0)
            layer.selection.push(layer.selectionHelper);
        layer.removeShape(layer.selectionHelper, false, false);
        layer.selectionStartPoint = null;
        layer.invalidate(true);
    }
    else if (layer.panning) {
        socket.emit("set clientOptions", {
            panX: gameManager.layerManager.panX,
            panY: gameManager.layerManager.panY
        });
    }
    else if (layer.selection.length) {
        layer.selection.forEach(function (sel) {
            if (layer.dragging) {
                if (gameManager.layerManager.useGrid && !e.altKey) {
                    const gs = gameManager.layerManager.gridSize;
                    const mouse = { x: sel.x + sel.w / 2, y: sel.y + sel.h / 2 };
                    const mx = mouse.x;
                    const my = mouse.y;
                    if ((sel.w / gs) % 2 === 0) {
                        sel.x = Math.round(mx / gs) * gs - sel.w / 2;
                    }
                    else {
                        sel.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - sel.w / 2;
                    }
                    if ((sel.h / gs) % 2 === 0) {
                        sel.y = Math.round(my / gs) * gs - sel.h / 2;
                    }
                    else {
                        sel.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - sel.h / 2;
                    }
                }
                sel.onMouseUp();
                if (layer.dragorig.x !== sel.x || layer.dragorig.y !== sel.y) {
                    if (sel !== layer.selectionHelper) {
                        socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                        setSelectionInfo(sel);
                    }
                    layer.invalidate();
                }
            }
            if (layer.resizing) {
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
                if (sel !== layer.selectionHelper) {
                    socket.emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    setSelectionInfo(sel);
                }
                layer.invalidate();
            }
        });
    }
    layer.dragging = false;
    layer.resizing = false;
    layer.panning = false;
    layer.selecting = false;
};
LayerManager.prototype.onContextMenu = function (e) {
    e.preventDefault();
    e.stopPropagation();
    const layer = gameManager.layerManager.getLayer();
    const mouse = layer.getMouse(e);
    const mx = mouse.x;
    const my = mouse.y;
    let hit = false;
    layer.shapes.data.forEach(function (shape) {
        if (!hit && shape.contains(mx, my)) {
            shape.showContextMenu(mouse);
        }
    });
};
function DrawTool() {
    this.startPoint = null;
    this.detailDiv = null;
    this.fillColor = $("<input type='text' />");
    this.borderColor = $("<input type='text' />");
    this.detailDiv = $("<div>")
        .append($("<div>Fill</div>")).append(this.fillColor)
        .append($("<div>Border</div>")).append(this.borderColor)
        .append($("</div>"));
    // this.detailDiv = $("<div>")
    //     .append($("<div>").append($("<div>Fill</div>")).append(this.fillColor).append($("</div>")))
    //     .append($("<div>").append($("<div>Border</div>")).append(this.borderColor).append("</div>"))
    //     .append($("</div>"));
    this.fillColor.spectrum({
        showInput: true,
        allowEmpty: true,
        showAlpha: true,
        color: "red"
    });
    this.borderColor.spectrum({
        showInput: true,
        allowEmpty: true,
        showAlpha: true
    });
}
DrawTool.prototype.onMouseDown = function (e) {
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    this.startPoint = l2w(layer.getMouse(e));
    const fillColor = this.fillColor.spectrum("get");
    const fill = fillColor === null ? tinycolor("transparent") : fillColor;
    const borderColor = this.borderColor.spectrum("get");
    const border = borderColor === null ? tinycolor("transparent") : borderColor;
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, fill.toRgbString(), border.toRgbString());
    this.rect.owners.push(gameManager.username);
    if (layer.name === 'fow') {
        this.rect.visionObstruction = true;
        this.rect.movementObstruction = true;
    }
    gameManager.lightblockers.push(this.rect.uuid);
    layer.addShape(this.rect, true, false);
};
DrawTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = l2w(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    socket.emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
    layer.invalidate();
};
DrawTool.prototype.onMouseUp = function () {
    if (this.startPoint === null)
        return;
    this.startPoint = null;
    this.rect = null;
};
function RulerTool() {
    this.startPoint = null;
}
RulerTool.prototype.onMouseDown = function (e) {
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("draw");
    this.startPoint = l2w(layer.getMouse(e));
    this.ruler = new Line(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new Text(this.startPoint.x, this.startPoint.y, "", "20px serif");
    this.ruler.owners.push(gameManager.username);
    this.text.owners.push(gameManager.username);
    layer.addShape(this.ruler, true, true);
    layer.addShape(this.text, true, true);
};
RulerTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("draw");
    const endPoint = l2w(layer.getMouse(e));
    this.ruler.x2 = endPoint.x;
    this.ruler.y2 = endPoint.y;
    socket.emit("shapeMove", { shape: this.ruler.asDict(), temporary: true });
    const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
    const xdiff = Math.abs(endPoint.x - this.startPoint.x);
    const ydiff = Math.abs(endPoint.y - this.startPoint.y);
    const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * gameManager.layerManager.unitSize / gameManager.layerManager.gridSize) + " ft";
    let angle = Math.atan2(diffsign * ydiff, xdiff);
    const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
    const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
    this.text.x = xmid;
    this.text.y = ymid;
    this.text.text = label;
    this.text.angle = angle;
    socket.emit("shapeMove", { shape: this.text.asDict(), temporary: true });
    layer.invalidate(true);
};
RulerTool.prototype.onMouseUp = function () {
    if (this.startPoint === null)
        return;
    this.startPoint = null;
    const layer = gameManager.layerManager.getLayer("draw");
    layer.removeShape(this.ruler, true, true);
    layer.removeShape(this.text, true, true);
    this.ruler = null;
    this.text = null;
    layer.invalidate(true);
};
function FOWTool() {
    this.startPoint = null;
    this.detailDiv = $("<div>")
        .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
        .append($("</div>"));
}
FOWTool.prototype.onMouseDown = function (e) {
    const layer = gameManager.layerManager.getLayer("fow");
    this.startPoint = l2w(layer.getMouse(e));
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, gameManager.fowColour.spectrum("get").toRgbString());
    layer.addShape(this.rect, true, false);
    if ($("#fow-reveal").prop("checked"))
        this.rect.globalCompositeOperation = "destination-out";
    else
        this.rect.globalCompositeOperation = "source-over";
};
FOWTool.prototype.onMouseUp = function () {
    if (this.startPoint === null)
        return;
    this.startPoint = null;
    this.rect = null;
};
FOWTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("fow");
    const endPoint = l2w(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    socket.emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
    layer.invalidate();
};
function MapTool() {
    this.startPoint = null;
    this.xCount = $("<input type='text' value='3'>");
    this.yCount = $("<input type='text' value='3'>");
    this.detailDiv = $("<div>")
        .append($("<div>#X</div>")).append(this.xCount)
        .append($("<div>#Y</div>")).append(this.yCount)
        .append($("</div>"));
}
MapTool.prototype.onMouseDown = function (e) {
    const layer = gameManager.layerManager.getLayer();
    this.startPoint = l2w(layer.getMouse(e));
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
    layer.addShape(this.rect, false, false);
};
MapTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = l2w(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    // socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
    layer.invalidate();
};
MapTool.prototype.onMouseUp = function () {
    if (this.startPoint === null)
        return;
    const layer = gameManager.layerManager.getLayer();
    if (layer.selection.length !== 1) {
        layer.removeShape(this.rect, false, false);
        return;
    }
    const w = this.rect.w;
    const h = this.rect.h;
    layer.selection[0].w *= this.xCount.val() * gameManager.layerManager.gridSize / w;
    layer.selection[0].h *= this.yCount.val() * gameManager.layerManager.gridSize / h;
    layer.removeShape(this.rect, false, false);
    this.startPoint = null;
    this.rect = null;
};
function GameManager() {
    this.layerManager = new LayerManager();
    this.selectedTool = 0;
    this.rulerTool = new RulerTool();
    this.drawTool = new DrawTool();
    this.fowTool = new FOWTool();
    this.mapTool = new MapTool();
    this.lightsources = [];
    this.lightblockers = [];
    this.movementblockers = [];
    this.gridColour = $("#gridColour");
    this.gridColour.spectrum({
        showInput: true,
        allowEmpty: true,
        showAlpha: true,
        color: "rgba(255,0,0, 0.5)",
        move: function () {
            gameManager.layerManager.drawGrid();
        },
        change: function (colour) {
            socket.emit("set clientOptions", { 'gridColour': colour.toRgbString() });
        }
    });
    this.fowColour = $("#fowColour");
    this.fowColour.spectrum({
        showInput: true,
        color: "rgb(82, 81, 81)",
        move: function (colour) {
            const l = gameManager.layerManager.getLayer("fow");
            if (l !== undefined) {
                l.shapes.data.forEach(function (shape) {
                    shape.fill = colour.toRgbString();
                });
                l.invalidate();
            }
        },
        change: function (colour) {
            socket.emit("set clientOptions", { 'fowColour': colour.toRgbString() });
        }
    });
    this.initiativeTracker = new InitiativeTracker();
    this.shapeSelectionDialog = $("#shapeselectiondialog").dialog({
        autoOpen: false,
        width: 'auto'
    });
    this.initiativeDialog = $("#initiativedialog").dialog({
        autoOpen: false,
        width: '160px'
    });
}
GameManager.prototype.setupBoard = function (room) {
    gameManager.layerManager = new LayerManager();
    const layersdiv = $('#layers');
    layersdiv.empty();
    const layerselectdiv = $('#layerselect');
    layerselectdiv.find("ul").empty();
    let selectable_layers = 0;
    const lm = $("#locations-menu").find("div");
    lm.children().off();
    lm.empty();
    for (let i = 0; i < room.locations.length; i++) {
        const loc = $("<div>" + room.locations[i] + "</div>");
        lm.append(loc);
    }
    const lmplus = $('<div><i class="fas fa-plus"></i></div>');
    lm.append(lmplus);
    lm.children().on("click", function (e) {
        if (e.target.textContent === '') {
            const locname = prompt("New location name");
            if (locname !== null)
                socket.emit("new location", locname);
        }
        else {
            socket.emit("change location", e.target.textContent);
        }
    });
    for (let i = 0; i < room.board.layers.length; i++) {
        const new_layer = room.board.layers[i];
        // UI changes
        layersdiv.append("<canvas id='" + new_layer.name + "-layer' style='z-index: " + i + "'></canvas>");
        if (new_layer.selectable) {
            let extra = '';
            if (selectable_layers === 0)
                extra = " class='layer-selected'";
            layerselectdiv.find('ul').append("<li id='select-" + new_layer.name + "'" + extra + "><a href='#'>" + new_layer.name + "</a></li>");
            selectable_layers += 1;
        }
        const canvas = $('#' + new_layer.name + '-layer')[0];
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // State changes
        let l;
        if (new_layer.grid)
            l = new GridLayerState(canvas, new_layer.name);
        else if (new_layer.name === 'fow')
            l = new FOWLayerState(canvas, new_layer.name);
        else
            l = new LayerState(canvas, new_layer.name);
        l.selectable = new_layer.selectable;
        l.player_editable = new_layer.player_editable;
        gameManager.layerManager.addLayer(l);
        if (new_layer.grid) {
            gameManager.layerManager.setGridSize(new_layer.size);
            gameManager.layerManager.drawGrid();
            $("#grid-layer").droppable({
                accept: ".draggable",
                drop: function (event, ui) {
                    const l = gameManager.layerManager.getLayer();
                    const offset = $(l.canvas).offset();
                    const loc = {
                        x: ui.offset.left - offset.left,
                        y: ui.offset.top - offset.top
                    };
                    if (settings_menu.is(":visible") && loc.x < settings_menu.width())
                        return;
                    if (locations_menu.is(":visible") && loc.y < locations_menu.width())
                        return;
                    // width = ui.helper[0].width;
                    // height = ui.helper[0].height;
                    const wloc = l2w(loc);
                    const img = ui.draggable[0].children[0];
                    const asset = new Asset(img, wloc.x, wloc.y, img.width, img.height);
                    asset.src = img.src;
                    if (gameManager.layerManager.useGrid && !event.altKey) {
                        const gs = gameManager.layerManager.gridSize;
                        asset.x = Math.round(asset.x / gs) * gs;
                        asset.y = Math.round(asset.y / gs) * gs;
                        asset.w = Math.max(Math.round(asset.w / gs) * gs, gs);
                        asset.h = Math.max(Math.round(asset.h / gs) * gs, gs);
                    }
                    l.addShape(asset, true);
                }
            });
        }
        else {
            l.setShapes(new_layer.shapes);
        }
    }
    // Force the correct opacity render on other layers.
    gameManager.layerManager.setLayer(gameManager.layerManager.getLayer().name);
    // socket.emit("client initialised");
    board_initialised = true;
    if (selectable_layers > 1) {
        layerselectdiv.find("li").on("click", function () {
            const name = this.id.split("-")[1];
            const old = layerselectdiv.find("#select-" + gameManager.layerManager.selectedLayer);
            if (name !== gameManager.layerManager.selectedLayer) {
                $(this).addClass("layer-selected");
                old.removeClass("layer-selected");
                gameManager.layerManager.setLayer(name);
            }
        });
    }
    else {
        layerselectdiv.hide();
    }
};
GameManager.prototype.addShape = function (shape) {
    const layer = gameManager.layerManager.getLayer(shape.layer);
    layer.addShape(createShapeFromDict(shape), false);
    layer.invalidate();
};
GameManager.prototype.moveShape = function (shape) {
    shape = Object.assign(gameManager.layerManager.UUIDMap.get(shape.uuid), createShapeFromDict(shape, true));
    shape.checkLightSources();
    gameManager.layerManager.getLayer(shape.layer).onShapeMove(shape);
};
GameManager.prototype.updateShape = function (data) {
    const shape = Object.assign(gameManager.layerManager.UUIDMap.get(data.shape.uuid), createShapeFromDict(data.shape, true));
    shape.checkLightSources();
    shape.setMovementBlock(shape.movementObstruction);
    if (data.redraw)
        gameManager.layerManager.getLayer(data.shape.layer).invalidate();
};
GameManager.prototype.setInitiative = function (data) {
    gameManager.initiativeTracker.data = data;
    gameManager.initiativeTracker.redraw();
    if (data.length > 0)
        gameManager.initiativeDialog.dialog("open");
};
GameManager.prototype.setClientOptions = function (options) {
    if ("gridColour" in options)
        gameManager.gridColour.spectrum("set", options.gridColour);
    if ("fowColour" in options) {
        gameManager.fowColour.spectrum("set", options.fowColour);
        gameManager.layerManager.invalidate();
    }
    if ("panX" in options)
        gameManager.layerManager.panX = options.panX;
    if ("panY" in options)
        gameManager.layerManager.panY = options.panY;
    if ("zoomFactor" in options) {
        gameManager.layerManager.zoomFactor = options.zoomFactor;
        $("#zoomer").slider({ value: 1 / options.zoomFactor });
        gameManager.layerManager.getGridLayer().invalidate();
    }
};
GameManager.prototype.setupTools = function () {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !gameManager.IS_DM)
            return;
        const extra = tool.defaultSelect ? " class='tool-selected'" : "";
        const toolLi = $("<li id='tool-" + tool.name + "'" + extra + "><a href='#'>" + tool.name + "</a></li>");
        toolselectDiv.append(toolLi);
        if (tool.hasDetail) {
            const div = tool.func.detailDiv;
            $('#tooldetail').append(div);
            div.hide();
        }
        toolLi.on("click", function () {
            const index = tools.indexOf(tool);
            if (index !== gameManager.selectedTool) {
                $('.tool-selected').removeClass("tool-selected");
                $(this).addClass("tool-selected");
                gameManager.selectedTool = index;
                const detail = $('#tooldetail');
                if (tool.hasDetail) {
                    $('#tooldetail').children().hide();
                    tool.func.detailDiv.show();
                    detail.show();
                }
                else {
                    detail.hide();
                }
            }
        });
    });
};
let gameManager = new GameManager();
// **** SETUP UI ****
const tools = [
    { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, func: gameManager.layerManager },
    { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, func: gameManager.layerManager },
    { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, func: gameManager.drawTool },
    { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, func: gameManager.rulerTool },
    { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, func: gameManager.fowTool },
    { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, func: gameManager.mapTool },
];
// prevent double clicking text selection
window.addEventListener('selectstart', function (e) {
    e.preventDefault();
    return false;
});
function onPointerDown(e) {
    if (!board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    $menu.hide();
    tools[gameManager.selectedTool].func.onMouseDown(e);
}
function onPointerMove(e) {
    if (!board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    tools[gameManager.selectedTool].func.onMouseMove(e);
}
function onPointerUp(e) {
    if (!board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    tools[gameManager.selectedTool].func.onMouseUp(e);
}
window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);
window.addEventListener('contextmenu', function (e) {
    if (!board_initialised)
        return;
    if (e.button !== 2 || e.target.tagName !== 'CANVAS')
        return;
    tools[gameManager.selectedTool].func.onContextMenu(e);
});
$("#zoomer").slider({
    orientation: "vertical",
    min: 0.5,
    max: 5.0,
    step: 0.1,
    value: gameManager.layerManager.zoomFactor,
    slide: function (event, ui) {
        const origZ = gameManager.layerManager.zoomFactor;
        const newZ = 1 / ui.value;
        const origX = window.innerWidth / origZ;
        const newX = window.innerWidth / newZ;
        const origY = window.innerHeight / origZ;
        const newY = window.innerHeight / newZ;
        gameManager.layerManager.zoomFactor = newZ;
        gameManager.layerManager.panX -= (origX - newX) / 2;
        gameManager.layerManager.panY -= (origY - newY) / 2;
        gameManager.layerManager.invalidate();
        socket.emit("set clientOptions", { zoomFactor: newZ, panX: gameManager.layerManager.panX, panY: gameManager.layerManager.panY });
    }
});
const $menu = $('#contextMenu');
$menu.hide();
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
const settings_menu = $("#menu");
const locations_menu = $("#locations-menu");
const layer_menu = $("#layerselect");
$("#selection-menu").hide();
$('#rm-settings').on("click", function () {
    // order of animation is important, it otherwise will sometimes show a small gap between the two objects
    if (settings_menu.is(":visible")) {
        $('#radialmenu').animate({ left: "-=200px" });
        settings_menu.animate({ width: 'toggle' });
        locations_menu.animate({ left: "-=200px", width: "+=200px" });
        layer_menu.animate({ left: "-=200px" });
    }
    else {
        settings_menu.animate({ width: 'toggle' });
        $('#radialmenu').animate({ left: "+=200px" });
        locations_menu.animate({ left: "+=200px", width: "-=200px" });
        layer_menu.animate({ left: "+=200px" });
    }
});
$('#rm-locations').on("click", function () {
    // order of animation is important, it otherwise will sometimes show a small gap between the two objects
    if (locations_menu.is(":visible")) {
        $('#radialmenu').animate({ top: "-=100px" });
        locations_menu.animate({ height: 'toggle' });
    }
    else {
        locations_menu.animate({ height: 'toggle' });
        $('#radialmenu').animate({ top: "+=100px" });
    }
});
window.onresize = function () {
    gameManager.layerManager.setWidth(window.innerWidth);
    gameManager.layerManager.setHeight(window.innerHeight);
    gameManager.layerManager.invalidate();
};
$('body').keyup(function (e) {
    if (e.keyCode === 46 && e.target.tagName !== "INPUT") {
        const l = gameManager.layerManager.getLayer();
        l.selection.forEach(function (sel) {
            l.removeShape(sel, true, false);
            gameManager.initiativeTracker.removeInitiative(sel.uuid, true);
        });
    }
});
$("#gridSizeInput").on("change", function (e) {
    const gs = parseInt(e.target.value);
    gameManager.layerManager.setGridSize(gs);
    socket.emit("set gridsize", gs);
});
$("#unitSizeInput").on("change", function (e) {
    const us = parseInt(e.target.value);
    gameManager.layerManager.setUnitSize(us);
    socket.emit("set locationOptions", { 'unitSize': us });
});
$("#useGridInput").on("change", function (e) {
    const ug = e.target.checked;
    gameManager.layerManager.setUseGrid(ug);
    socket.emit("set locationOptions", { 'useGrid': ug });
});
$("#useFOWInput").on("change", function (e) {
    const uf = e.target.checked;
    gameManager.layerManager.setFullFOW(uf);
    socket.emit("set locationOptions", { 'fullFOW': uf });
});
$("#fowOpacity").on("change", function (e) {
    let fo = parseFloat(e.target.value);
    if (isNaN(fo)) {
        $("#fowOpacity").val(gameManager.layerManager.fowOpacity);
        return;
    }
    if (fo < 0)
        fo = 0;
    if (fo > 1)
        fo = 1;
    gameManager.layerManager.setFOWOpacity(fo);
    socket.emit("set locationOptions", { 'fowOpacity': fo });
});
// **** UTILS ****
function OrderedMap() {
    this.data = [];
}
OrderedMap.prototype = [];
OrderedMap.prototype.push = function (element) {
    this.data.push(element);
};
OrderedMap.prototype.remove = function (element) {
    this.data.splice(this.data.indexOf(element), 1);
};
OrderedMap.prototype.indexOf = function (element) {
    return this.data.indexOf(element);
};
OrderedMap.prototype.moveTo = function (element, idx) {
    const oldIdx = this.indexOf(element);
    if (oldIdx === idx)
        return false;
    this.data.splice(oldIdx, 1);
    this.data.splice(idx, 0, element);
    return true;
};
function InitiativeTracker() {
    this.data = [];
}
InitiativeTracker.prototype.addInitiative = function (data, sync) {
    // Open the initiative tracker if it is not currently open.
    if (this.data.length === 0 || !gameManager.initiativeDialog.dialog("isOpen"))
        gameManager.initiativeDialog.dialog("open");
    // If no initiative given, assume it 0
    if (data.initiative === undefined)
        data.initiative = 0;
    // Check if the shape is already being tracked
    const existing = this.data.find(d => d.uuid === data.uuid);
    if (existing !== undefined) {
        Object.assign(existing, data);
        this.redraw();
    }
    else {
        this.data.push(data);
        this.redraw();
    }
    if (sync)
        socket.emit("updateInitiative", data);
};
InitiativeTracker.prototype.removeInitiative = function (uuid, sync, skipGroupCheck) {
    skipGroupCheck = skipGroupCheck || false;
    const d = this.data.findIndex(d => d.uuid === uuid);
    if (d >= 0) {
        if (!skipGroupCheck && this.data[d].group)
            return;
        this.data.splice(d, 1);
        this.redraw();
        if (sync)
            socket.emit("updateInitiative", { uuid: uuid });
    }
    if (this.data.length === 0 && gameManager.initiativeDialog.dialog("isOpen"))
        gameManager.initiativeDialog.dialog("close");
};
InitiativeTracker.prototype.redraw = function () {
    gameManager.initiativeDialog.empty();
    this.data.sort(function (a, b) {
        return b.initiative - a.initiative;
    });
    const self = this;
    this.data.forEach(function (data) {
        if (data.owners === undefined)
            data.owners = [];
        const img = data.src === undefined ? '' : $(`<img src="${data.src}" width="30px" data-uuid="${data.uuid}">`);
        // const name = $(`<input type="text" placeholder="name" data-uuid="${sh.uuid}" value="${sh.name}" disabled='disabled' style="grid-column-start: name">`);
        const val = $(`<input type="text" placeholder="value" data-uuid="${data.uuid}" value="${data.initiative}" style="grid-column-start: value">`);
        const visible = $(`<div data-uuid="${data.uuid}"><i class="fas fa-eye"></i></div>`);
        const group = $(`<div data-uuid="${data.uuid}"><i class="fas fa-users"></i></div>`);
        const remove = $(`<div style="grid-column-start: remove" data-uuid="${data.uuid}"><i class="fas fa-trash-alt"></i></div>`);
        visible.css("opacity", data.visible ? "1.0" : "0.3");
        group.css("opacity", data.group ? "1.0" : "0.3");
        if (!data.owners.includes(gameManager.username) && !gameManager.IS_DM) {
            val.prop("disabled", "disabled");
            remove.css("opacity", "0.3");
        }
        gameManager.initiativeDialog.append(img).append(val).append(visible).append(group).append(remove);
        val.on("change", function () {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            d.initiative = parseInt($(this).val()) || 0;
            self.addInitiative(d, true);
        });
        visible.on("click", function () {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            if (!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                return;
            d.visible = !d.visible;
            if (d.visible)
                $(this).css("opacity", 1.0);
            else
                $(this).css("opacity", 0.3);
            socket.emit("updateInitiative", d);
        });
        group.on("click", function () {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            if (!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                return;
            d.group = !d.group;
            if (d.group)
                $(this).css("opacity", 1.0);
            else
                $(this).css("opacity", 0.3);
            socket.emit("updateInitiative", d);
        });
        remove.on("click", function () {
            const uuid = $(this).data('uuid');
            const d = self.data.find(d => d.uuid === uuid);
            if (!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                return;
            $(`[data-uuid=${uuid}]`).remove();
            self.removeInitiative(uuid, true, true);
        });
    });
};
export default gameManager;
//# sourceMappingURL=planarally.js.map