/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./PlanarAlly/client/src/planarally.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./PlanarAlly/client/src/geom.ts":
/*!***************************************!*\
  !*** ./PlanarAlly/client/src/geom.ts ***!
  \***************************************/
/*! exports provided: getLinesIntersectPoint, getPointDistance */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLinesIntersectPoint", function() { return getLinesIntersectPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPointDistance", function() { return getPointDistance; });
function pointInLine(p, l1, l2) {
    return p.x >= Math.min(l1.x, l2.x) - 0.000001 &&
        p.x <= Math.max(l1.x, l2.x) + 0.000001 &&
        p.y >= Math.min(l1.y, l2.y) - 0.000001 &&
        p.y <= Math.max(l1.y, l2.y) + 0.000001;
}
function pointInLines(p, s1, e1, s2, e2) {
    return pointInLine(p, s1, e1) && pointInLine(p, s2, e2);
}
function getLinesIntersectPoint(s1, e1, s2, e2) {
    // const s1 = Math.min(S1, )
    const A1 = e1.y - s1.y;
    const B1 = s1.x - e1.x;
    const A2 = e2.y - s2.y;
    const B2 = s2.x - e2.x;
    // Get delta and check if the lines are parallel
    const delta = A1 * B2 - A2 * B1;
    if (delta === 0)
        return false;
    const C2 = A2 * s2.x + B2 * s2.y;
    const C1 = A1 * s1.x + B1 * s1.y;
    //invert delta to make division cheaper
    const invdelta = 1 / delta;
    const intersect = { x: (B2 * C1 - B1 * C2) * invdelta, y: (A1 * C2 - A2 * C1) * invdelta };
    if (!pointInLines(intersect, s1, e1, s2, e2))
        return null;
    return intersect;
}
function getPointDistance(p1, p2) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}


/***/ }),

/***/ "./PlanarAlly/client/src/layers.ts":
/*!*****************************************!*\
  !*** ./PlanarAlly/client/src/layers.ts ***!
  \*****************************************/
/*! exports provided: Layer, GridLayer, FOWLayer, LayerManager */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Layer", function() { return Layer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GridLayer", function() { return GridLayer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FOWLayer", function() { return FOWLayer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LayerManager", function() { return LayerManager; });
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.ts");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shapes */ "./PlanarAlly/client/src/shapes.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils */ "./PlanarAlly/client/src/utils.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.ts");





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
class Layer {
    constructor(canvas, name) {
        this.selectable = false;
        // When set to false, the layer will be redrawn on the next tick
        this.valid = false;
        // The collection of shapes that this layer contains.
        // These are ordered on a depth basis.
        this.shapes = new _utils__WEBPACK_IMPORTED_MODULE_2__["OrderedMap"]();
        // State variables
        // todo change to enum ?
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
    invalidate(skipLightUpdate) {
        this.valid = false;
        if (!skipLightUpdate && this.name !== "fow") {
            const fow = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer("fow");
            if (fow !== undefined)
                fow.invalidate(true);
        }
    }
    addShape(shape, sync, temporary) {
        if (temporary === undefined)
            temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (sync)
            _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("add shape", { shape: shape.asDict(), temporary: temporary });
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.set(shape.uuid, shape);
        this.invalidate(!sync);
    }
    setShapes(shapes) {
        const t = [];
        const self = this;
        shapes.forEach(function (shape) {
            const sh = Object(_shapes__WEBPACK_IMPORTED_MODULE_1__["createShapeFromDict"])(shape, self);
            sh.layer = self.name;
            sh.checkLightSources();
            sh.setMovementBlock(shape.movementObstruction);
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.set(shape.uuid, sh);
            t.push(sh);
        });
        this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
        this.shapes.data = t;
        this.invalidate(false);
    }
    removeShape(shape, sync, temporary) {
        if (temporary === undefined)
            temporary = false;
        this.shapes.remove(shape);
        if (sync)
            _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("remove shape", { shape: shape, temporary: temporary });
        const ls_i = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].lightsources.findIndex(ls => ls.shape === shape.uuid);
        const lb_i = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].lightblockers.findIndex(ls => ls === shape.uuid);
        const mb_i = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].movementblockers.findIndex(ls => ls === shape.uuid);
        if (ls_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].lightsources.splice(ls_i, 1);
        if (lb_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].lightblockers.splice(lb_i, 1);
        if (mb_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].movementblockers.splice(mb_i, 1);
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.delete(shape.uuid);
        const index = this.selection.indexOf(shape);
        if (index >= 0)
            this.selection.splice(index, 1);
        this.invalidate(!sync);
    }
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    draw(doClear) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].board_initialised && !this.valid) {
            const ctx = this.ctx;
            doClear = doClear === undefined ? true : doClear;
            if (doClear)
                this.clear();
            const state = this;
            this.shapes.data.forEach(function (shape) {
                if (Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(shape.x) > state.width || Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(shape.y) > state.height ||
                    Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(shape.x + shape.w) < 0 || Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(shape.y + shape.h) < 0)
                    return;
                if (state.name === 'fow' && shape.visionObstruction && _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer().name !== state.name)
                    return;
                shape.draw(ctx);
            });
            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
                this.selection.forEach(function (sel) {
                    if (!(sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"]))
                        return;
                    ctx.strokeRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y), sel.w * z, sel.h * z);
                    // topright
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y - 3), 6 * z, 6 * z);
                    // topleft
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y - 3), 6 * z, 6 * z);
                    // botright
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y + sel.h - 3), 6 * z, 6 * z);
                    // botleft
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y + sel.h - 3), 6 * z, 6 * z);
                });
            }
            this.valid = true;
        }
    }
    getMouse(e) {
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
        return { x: mx, y: my };
    }
    ;
    moveShapeOrder(shape, destinationIndex, sync) {
        if (this.shapes.moveTo(shape, destinationIndex)) {
            if (sync)
                _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("moveShapeOrder", { shape: shape.asDict(), index: destinationIndex });
            this.invalidate(true);
        }
    }
    ;
    onShapeMove(shape) {
        this.invalidate(false);
    }
}
class GridLayer extends Layer {
    constructor(canvas, name) {
        super(canvas, name);
    }
    invalidate() {
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.drawGrid();
    }
}
class FOWLayer extends Layer {
    constructor(canvas, name) {
        super(canvas, name);
    }
    addShape(shape, sync, temporary) {
        shape.fill = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].fowColour.spectrum("get").toRgbString();
        super.addShape(shape, sync, temporary);
    }
    setShapes(shapes) {
        const c = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].fowColour.spectrum("get").toRgbString();
        shapes.forEach(function (shape) {
            shape.fill = c;
        });
        super.setShapes(shapes);
    }
    onShapeMove(shape) {
        shape.fill = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].fowColour.spectrum("get").toRgbString();
        super.onShapeMove(shape);
    }
    ;
    draw() {
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].board_initialised && !this.valid) {
            const ctx = this.ctx;
            const orig_op = ctx.globalCompositeOperation;
            if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.fullFOW) {
                const ogalpha = this.ctx.globalAlpha;
                this.ctx.globalCompositeOperation = "copy";
                if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].IS_DM)
                    this.ctx.globalAlpha = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.fowOpacity;
                this.ctx.fillStyle = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].fowColour.spectrum("get").toRgbString();
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalAlpha = ogalpha;
                this.ctx.globalCompositeOperation = orig_op;
            }
            if (!_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].IS_DM)
                super.draw(!_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.fullFOW);
            ctx.globalCompositeOperation = 'destination-out';
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer("tokens").shapes.data.forEach(function (sh) {
                if (!sh.ownedBy())
                    return;
                const bb = sh.getBoundingBox();
                const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2l"])(sh.center());
                const alm = 0.8 * Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lz"])(bb.w);
                ctx.beginPath();
                ctx.arc(lcenter.x, lcenter.y, alm, 0, 2 * Math.PI);
                const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'destination-out';
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].lightsources.forEach(function (ls) {
                const sh = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.get(ls.shape);
                const aura = sh.auras.find(a => a.uuid === ls.aura);
                if (aura === undefined) {
                    console.log("Old lightsource still lingering in the gameManager list");
                    return;
                }
                const aura_length = Object(_units__WEBPACK_IMPORTED_MODULE_0__["getUnitDistance"])(aura.value);
                const center = sh.center();
                const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2l"])(center);
                const bbox = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Circle"](center.x, center.y, aura_length).getBoundingBox();
                // We first collect all lightblockers that are inside/cross our aura
                // This to prevent as many ray calculations as possible
                const local_lightblockers = [];
                _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].lightblockers.forEach(function (lb) {
                    if (lb === sh.uuid)
                        return;
                    const lb_sh = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.get(lb);
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
                            ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(center.x + aura_length * Math.cos(angle)), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(center.y + aura_length * Math.sin(angle)));
                        }
                        continue;
                    }
                    // If hit , first finish any ongoing arc, then move to the intersection point
                    if (arc_start !== -1) {
                        ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lr"])(aura.value), arc_start, angle);
                        arc_start = -1;
                    }
                    let extraX = (shape_hit.w / 4) * Math.cos(angle);
                    let extraY = (shape_hit.h / 4) * Math.sin(angle);
                    // if (!shape_hit.contains(hit.intersect.x + extraX, hit.intersect.y + extraY, false)) {
                    //     extraX = 0;
                    //     extraY = 0;
                    // }
                    ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(hit.intersect.x + extraX), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(hit.intersect.y + extraY));
                }
                if (arc_start !== -1)
                    ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lr"])(aura.value), arc_start, 2 * Math.PI);
                const alm = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lr"])(aura.value);
                const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                // ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fill();
            });
            if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].IS_DM)
                super.draw(!_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.fullFOW);
            ctx.globalCompositeOperation = orig_op;
        }
    }
}
// **** Manager for working with multiple layers
class LayerManager {
    constructor() {
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
    setOptions(options) {
        if ("unitSize" in options)
            this.setUnitSize(options.unitSize);
        if ("useGrid" in options)
            this.setUseGrid(options.useGrid);
        if ("fullFOW" in options)
            this.setFullFOW(options.fullFOW);
        if ('fowOpacity' in options)
            this.setFOWOpacity(options.fowOpacity);
        if ("fowColour" in options)
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].fowColour.spectrum("set", options.fowColour);
    }
    setWidth(width) {
        this.width = width;
        for (let i = 0; i < _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.layers.length; i++) {
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.layers[i].canvas.width = width;
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.layers[i].width = width;
        }
    }
    setHeight(height) {
        this.height = height;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.height = height;
            this.layers[i].height = height;
        }
    }
    addLayer(layer) {
        this.layers.push(layer);
        if (this.selectedLayer === null && layer.selectable)
            this.selectedLayer = layer.name;
    }
    getLayer(name) {
        name = (typeof name === 'undefined') ? this.selectedLayer : name;
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i].name === name)
                return this.layers[i];
        }
    }
    //todo rename to selectLayer
    setLayer(name) {
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
    }
    getGridLayer() {
        return this.getLayer("grid");
    }
    drawGrid() {
        const layer = this.getGridLayer();
        const ctx = layer.ctx;
        const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
        const panX = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panX;
        const panY = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panY;
        layer.clear();
        ctx.beginPath();
        for (let i = 0; i < layer.width; i += this.gridSize * z) {
            ctx.moveTo(i + (panX % this.gridSize) * z, 0);
            ctx.lineTo(i + (panX % this.gridSize) * z, layer.height);
            ctx.moveTo(0, i + (panY % this.gridSize) * z);
            ctx.lineTo(layer.width, i + (panY % this.gridSize) * z);
        }
        ctx.strokeStyle = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].gridColour.spectrum("get").toRgbString();
        ctx.lineWidth = 1;
        ctx.stroke();
        layer.valid = true;
        const fowl = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer("fow");
        if (fowl !== undefined)
            fowl.invalidate(true);
    }
    setGridSize(gridSize) {
        if (gridSize !== this.gridSize) {
            this.gridSize = gridSize;
            this.drawGrid();
            $('#gridSizeInput').val(gridSize);
        }
    }
    setUnitSize(unitSize) {
        if (unitSize !== this.unitSize) {
            this.unitSize = unitSize;
            this.drawGrid();
            $('#unitSizeInput').val(unitSize);
        }
    }
    setUseGrid(useGrid) {
        if (useGrid !== this.useGrid) {
            this.useGrid = useGrid;
            if (useGrid)
                $('#grid-layer').show();
            else
                $('#grid-layer').hide();
            $('#useGridInput').prop("checked", useGrid);
        }
    }
    setFullFOW(fullFOW) {
        if (fullFOW !== this.fullFOW) {
            this.fullFOW = fullFOW;
            const fowl = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer("fow");
            if (fowl !== undefined)
                fowl.invalidate(false);
            $('#useFOWInput').prop("checked", fullFOW);
        }
    }
    setFOWOpacity(fowOpacity) {
        this.fowOpacity = fowOpacity;
        const fowl = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer("fow");
        if (fowl !== undefined)
            fowl.invalidate(false);
        $('#fowOpacity').val(fowOpacity);
    }
    invalidate() {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].invalidate(true);
        }
    }
    onMouseDown(e) {
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = layer.getMouse(e);
        const mx = mouse.x;
        const my = mouse.y;
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].tools[_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].selectedTool].name === 'select') {
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
                    const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
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
                layer.selectionStartPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
                layer.selectionHelper = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](layer.selectionStartPoint.x, layer.selectionStartPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
                layer.selectionHelper.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].username);
                layer.addShape(layer.selectionHelper, false, false);
                layer.invalidate(true);
            }
        }
        else if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].tools[_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].selectedTool].name === 'pan') {
            layer.panning = true;
            layer.dragoffx = mx;
            layer.dragoffy = my;
        }
    }
    onMouseMove(e) {
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = layer.getMouse(e);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
        if (layer.selecting) {
            if (layer.selectionStartPoint === null)
                return;
            // Currently draw on active layer
            const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
            layer.selectionHelper.w = Math.abs(endPoint.x - layer.selectionStartPoint.x);
            layer.selectionHelper.h = Math.abs(endPoint.y - layer.selectionStartPoint.y);
            layer.selectionHelper.x = Math.min(layer.selectionStartPoint.x, endPoint.x);
            layer.selectionHelper.y = Math.min(layer.selectionStartPoint.y, endPoint.y);
            layer.invalidate(true);
        }
        else if (layer.panning) {
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panX += Math.round((mouse.x - layer.dragoffx) / z);
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panY += Math.round((mouse.y - layer.dragoffy) / z);
            layer.dragoffx = mouse.x;
            layer.dragoffy = mouse.y;
            _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.invalidate();
        }
        else if (layer.selection.length) {
            const ogX = layer.selection[layer.selection.length - 1].x * z;
            const ogY = layer.selection[layer.selection.length - 1].y * z;
            layer.selection.forEach(function (sel) {
                if (!(sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"]))
                    return; // TODO
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
                        const blockers = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].movementblockers.filter(mb => mb !== sel.uuid && _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.get(mb).getBoundingBox().intersectsWith(bbox));
                        if (blockers.length > 0) {
                            blocked = true;
                        }
                        else {
                            // Draw a line from start to end position and see for any intersect
                            // This stops sudden leaps over walls! cheeky buggers
                            const line = { start: { x: ogX / z, y: ogY / z }, end: { x: sel.x, y: sel.y } };
                            blocked = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].movementblockers.some(mb => {
                                const inter = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.UUIDMap.get(mb).getBoundingBox().getIntersectWithLine(line);
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
                        _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                        setSelectionInfo(sel);
                    }
                    layer.invalidate(false);
                }
                else if (layer.resizing) {
                    if (layer.resizedir === 'nw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                        sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wx"])(mouse.x);
                        sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wy"])(mouse.y);
                    }
                    else if (layer.resizedir === 'ne') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x);
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                        sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wy"])(mouse.y);
                    }
                    else if (layer.resizedir === 'se') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x);
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y);
                    }
                    else if (layer.resizedir === 'sw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y);
                        sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wx"])(mouse.x);
                    }
                    sel.w /= z;
                    sel.h /= z;
                    if (sel !== layer.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                        setSelectionInfo(sel);
                    }
                    layer.invalidate(false);
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
    }
    onMouseUp(e) {
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
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
            _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("set clientOptions", {
                panX: _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panX,
                panY: _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panY
            });
        }
        else if (layer.selection.length) {
            layer.selection.forEach(function (sel) {
                if (!(sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"]))
                    return; // TODO
                if (layer.dragging) {
                    if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.gridSize;
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
                    if (layer.dragorig.x !== sel.x || layer.dragorig.y !== sel.y) {
                        if (sel !== layer.selectionHelper) {
                            _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                            setSelectionInfo(sel);
                        }
                        layer.invalidate(false);
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
                    if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.gridSize;
                        sel.x = Math.round(sel.x / gs) * gs;
                        sel.y = Math.round(sel.y / gs) * gs;
                        sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                        sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                    }
                    if (sel !== layer.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_4__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                        setSelectionInfo(sel);
                    }
                    layer.invalidate(false);
                }
            });
        }
        layer.dragging = false;
        layer.resizing = false;
        layer.panning = false;
        layer.selecting = false;
    }
    onContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = layer.getMouse(e);
        const mx = mouse.x;
        const my = mouse.y;
        let hit = false;
        layer.shapes.data.forEach(function (shape) {
            if (!hit && shape.contains(mx, my)) {
                shape.showContextMenu(mouse);
            }
        });
    }
}


/***/ }),

/***/ "./PlanarAlly/client/src/planarally.ts":
/*!*********************************************!*\
  !*** ./PlanarAlly/client/src/planarally.ts ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.ts");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shapes */ "./PlanarAlly/client/src/shapes.ts");
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tools */ "./PlanarAlly/client/src/tools.ts");
/* harmony import */ var _layers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./layers */ "./PlanarAlly/client/src/layers.ts");





class GameManager {
    constructor() {
        this.IS_DM = false;
        this.board_initialised = false;
        this.layerManager = new _layers__WEBPACK_IMPORTED_MODULE_4__["LayerManager"]();
        this.selectedTool = 0;
        this.rulerTool = new _tools__WEBPACK_IMPORTED_MODULE_3__["RulerTool"]();
        this.drawTool = new _tools__WEBPACK_IMPORTED_MODULE_3__["DrawTool"]();
        this.fowTool = new _tools__WEBPACK_IMPORTED_MODULE_3__["FOWTool"]();
        this.mapTool = new _tools__WEBPACK_IMPORTED_MODULE_3__["MapTool"]();
        this.lightsources = [];
        this.lightblockers = [];
        this.movementblockers = [];
        this.gridColour = $("#gridColour");
        this.fowColour = $("#fowColour");
        this.initiativeTracker = new _tools__WEBPACK_IMPORTED_MODULE_3__["InitiativeTracker"]();
        this.shapeSelectionDialog = $("#shapeselectiondialog").dialog({
            autoOpen: false,
            width: 'auto'
        });
        this.initiativeDialog = $("#initiativedialog").dialog({
            autoOpen: false,
            width: '160px'
        });
        this.gridColour.spectrum({
            showInput: true,
            allowEmpty: true,
            showAlpha: true,
            color: "rgba(255,0,0, 0.5)",
            move: function () {
                gameManager.layerManager.drawGrid();
            },
            change: function (colour) {
                _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { 'gridColour': colour.toRgbString() });
            }
        });
        this.fowColour.spectrum({
            showInput: true,
            color: "rgb(82, 81, 81)",
            move: function (colour) {
                const l = gameManager.layerManager.getLayer("fow");
                if (l !== undefined) {
                    l.shapes.data.forEach(function (shape) {
                        shape.fill = colour.toRgbString();
                    });
                    l.invalidate(false);
                }
            },
            change: function (colour) {
                _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { 'fowColour': colour.toRgbString() });
            }
        });
    }
    setupBoard(room) {
        this.layerManager = new _layers__WEBPACK_IMPORTED_MODULE_4__["LayerManager"]();
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
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("new location", locname);
            }
            else {
                _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("change location", e.target.textContent);
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
                l = new _layers__WEBPACK_IMPORTED_MODULE_4__["GridLayer"](canvas, new_layer.name);
            else if (new_layer.name === 'fow')
                l = new _layers__WEBPACK_IMPORTED_MODULE_4__["FOWLayer"](canvas, new_layer.name);
            else
                l = new _layers__WEBPACK_IMPORTED_MODULE_4__["Layer"](canvas, new_layer.name);
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
                        const wloc = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(loc);
                        const img = ui.draggable[0].children[0];
                        const asset = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Asset"](img, wloc.x, wloc.y, img.width, img.height);
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
        this.board_initialised = true;
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
    }
    addShape(shape) {
        const layer = this.layerManager.getLayer(shape.layer);
        layer.addShape(Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape), false);
        layer.invalidate(false);
    }
    moveShape(shape) {
        shape = Object.assign(this.layerManager.UUIDMap.get(shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape, true));
        shape.checkLightSources();
        this.layerManager.getLayer(shape.layer).onShapeMove(shape);
    }
    updateShape(data) {
        const shape = Object.assign(this.layerManager.UUIDMap.get(data.shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(data.shape, true));
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (data.redraw)
            this.layerManager.getLayer(data.shape.layer).invalidate(false);
    }
    setInitiative(data) {
        this.initiativeTracker.data = data;
        this.initiativeTracker.redraw();
        if (data.length > 0)
            this.initiativeDialog.dialog("open");
    }
    setClientOptions(options) {
        if ("gridColour" in options)
            this.gridColour.spectrum("set", options.gridColour);
        if ("fowColour" in options) {
            this.fowColour.spectrum("set", options.fowColour);
            this.layerManager.invalidate();
        }
        if ("panX" in options)
            this.layerManager.panX = options.panX;
        if ("panY" in options)
            this.layerManager.panY = options.panY;
        if ("zoomFactor" in options) {
            this.layerManager.zoomFactor = options.zoomFactor;
            $("#zoomer").slider({ value: 1 / options.zoomFactor });
            this.layerManager.getGridLayer().invalidate(false);
        }
    }
}
let gameManager = new GameManager();
// **** SETUP UI ****
// prevent double clicking text selection
window.addEventListener('selectstart', function (e) {
    e.preventDefault();
    return false;
});
function onPointerDown(e) {
    if (!gameManager.board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    $menu.hide();
    gameManager.tools[gameManager.selectedTool].func.onMouseDown(e);
}
function onPointerMove(e) {
    if (!gameManager.board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    gameManager.tools[gameManager.selectedTool].func.onMouseMove(e);
}
function onPointerUp(e) {
    if (!gameManager.board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    gameManager.tools[gameManager.selectedTool].func.onMouseUp(e);
}
window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);
window.addEventListener('contextmenu', function (e) {
    if (!gameManager.board_initialised)
        return;
    if (e.button !== 2 || e.target.tagName !== 'CANVAS')
        return;
    gameManager.tools[gameManager.selectedTool].func.onContextMenu(e);
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", {
            zoomFactor: newZ,
            panX: gameManager.layerManager.panX,
            panY: gameManager.layerManager.panY
        });
    }
});
const $menu = $('#contextMenu');
$menu.hide();
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
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set gridsize", gs);
});
$("#unitSizeInput").on("change", function (e) {
    const us = parseInt(e.target.value);
    gameManager.layerManager.setUnitSize(us);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set locationOptions", { 'unitSize': us });
});
$("#useGridInput").on("change", function (e) {
    const ug = e.target.checked;
    gameManager.layerManager.setUseGrid(ug);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set locationOptions", { 'useGrid': ug });
});
$("#useFOWInput").on("change", function (e) {
    const uf = e.target.checked;
    gameManager.layerManager.setFullFOW(uf);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set locationOptions", { 'fullFOW': uf });
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
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set locationOptions", { 'fowOpacity': fo });
});
/* harmony default export */ __webpack_exports__["default"] = (gameManager);


/***/ }),

/***/ "./PlanarAlly/client/src/shapes.ts":
/*!*****************************************!*\
  !*** ./PlanarAlly/client/src/shapes.ts ***!
  \*****************************************/
/*! exports provided: Shape, BoundingRect, Rect, Circle, Line, Text, Asset, createShapeFromDict */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Shape", function() { return Shape; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BoundingRect", function() { return BoundingRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Rect", function() { return Rect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Circle", function() { return Circle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return Line; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Text", function() { return Text; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Asset", function() { return Asset; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createShapeFromDict", function() { return createShapeFromDict; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils */ "./PlanarAlly/client/src/utils.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./geom */ "./PlanarAlly/client/src/geom.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.ts");





const $menu = $('#contextMenu');
class Shape {
    constructor(uuid) {
        this.layer = null;
        this.name = 'Unknown shape';
        this.trackers = [];
        this.auras = [];
        this.owners = [];
        this.visionObstruction = false;
        this.movementObstruction = false;
        this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
    }
    checkLightSources() {
        const self = this;
        const vo_i = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightblockers.indexOf(this.uuid);
        if (this.visionObstruction && vo_i === -1)
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightblockers.push(this.uuid);
        else if (!this.visionObstruction && vo_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightblockers.splice(vo_i, 1);
        // Check if the lightsource auras are in the gameManager
        this.auras.forEach(function (au) {
            const ls = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightsources;
            const i = ls.findIndex(o => o.aura === au.uuid);
            if (au.lightSource && i === -1) {
                ls.push({ shape: self.uuid, aura: au.uuid });
            }
            else if (!au.lightSource && i >= 0) {
                ls.splice(i, 1);
            }
        });
        // Check if anything in the gameManager referencing this shape is in fact still a lightsource
        for (let i = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightsources.length - 1; i >= 0; i--) {
            const ls = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightsources[i];
            if (ls.shape === self.uuid) {
                if (!self.auras.some(a => a.uuid === ls.aura && a.lightSource))
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightsources.splice(i, 1);
            }
        }
    }
    setMovementBlock(blocksMovement) {
        this.movementObstruction = blocksMovement || false;
        const vo_i = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.indexOf(this.uuid);
        if (this.movementObstruction && vo_i === -1)
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.push(this.uuid);
        else if (!this.movementObstruction && vo_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.splice(vo_i, 1);
    }
    ownedBy(username) {
        if (username === undefined)
            username = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username;
        return _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM || this.owners.includes(username);
    }
    onSelection() {
        if (!this.trackers.length || this.trackers[this.trackers.length - 1].name !== '' || this.trackers[this.trackers.length - 1].value !== '')
            this.trackers.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(), name: '', value: '', maxvalue: '', visible: false });
        if (!this.auras.length || this.auras[this.auras.length - 1].name !== '' || this.auras[this.auras.length - 1].value !== '')
            this.auras.push({
                uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(),
                name: '',
                value: '',
                dim: '',
                lightSource: false,
                colour: 'rgba(0,0,0,0)',
                visible: false
            });
        $("#selection-name").text(this.name);
        const trackers = $("#selection-trackers");
        trackers.empty();
        this.trackers.forEach(function (tracker) {
            const val = tracker.maxvalue ? `${tracker.value}/${tracker.maxvalue}` : tracker.value;
            trackers.append($(`<div id="selection-tracker-${tracker.uuid}-name" data-uuid="${tracker.uuid}">${tracker.name}</div>`));
            trackers.append($(`<div id="selection-tracker-${tracker.uuid}-value" data-uuid="${tracker.uuid}" class="selection-tracker-value">${val}</div>`));
        });
        const auras = $("#selection-auras");
        auras.empty();
        this.auras.forEach(function (aura) {
            const val = aura.dim ? `${aura.value}/${aura.dim}` : aura.value;
            auras.append($(`<div id="selection-aura-${aura.uuid}-name" data-uuid="${aura.uuid}">${aura.name}</div>`));
            auras.append($(`<div id="selection-aura-${aura.uuid}-value" data-uuid="${aura.uuid}" class="selection-aura-value">${val}</div>`));
        });
        $("#selection-menu").show();
        const self = this;
        const editbutton = $("#selection-edit-button");
        if (!this.ownedBy())
            editbutton.hide();
        else
            editbutton.show();
        editbutton.on("click", function () {
            $("#shapeselectiondialog-uuid").val(self.uuid);
            const dialog_name = $("#shapeselectiondialog-name");
            dialog_name.val(self.name);
            dialog_name.on("change", function () {
                const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get($("#shapeselectiondialog-uuid").val());
                s.name = $(this).val();
                $("#selection-name").text($(this).val());
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: s.asDict(), redraw: false });
            });
            const dialog_lightblock = $("#shapeselectiondialog-lightblocker");
            dialog_lightblock.prop("checked", self.visionObstruction);
            dialog_lightblock.on("click", function () {
                const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get($("#shapeselectiondialog-uuid").val());
                s.visionObstruction = dialog_lightblock.prop("checked");
                s.checkLightSources();
            });
            const dialog_moveblock = $("#shapeselectiondialog-moveblocker");
            dialog_moveblock.prop("checked", self.movementObstruction);
            dialog_moveblock.on("click", function () {
                const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get($("#shapeselectiondialog-uuid").val());
                s.setMovementBlock(dialog_moveblock.prop("checked"));
            });
            const owners = $("#shapeselectiondialog-owners");
            const trackers = $("#shapeselectiondialog-trackers");
            const auras = $("#shapeselectiondialog-auras");
            owners.nextUntil(trackers).remove();
            trackers.nextUntil(auras).remove();
            auras.nextUntil($("#shapeselectiondialog").find("form")).remove();
            function addOwner(owner) {
                const ow_name = $(`<input type="text" placeholder="name" data-name="${owner}" value="${owner}" style="grid-column-start: name">`);
                const ow_remove = $(`<div style="grid-column-start: remove"><i class="fas fa-trash-alt"></i></div>`);
                trackers.before(ow_name.add(ow_remove));
                ow_name.on("change", function () {
                    const ow_i = self.owners.findIndex(o => o === $(this).data('name'));
                    if (ow_i >= 0)
                        self.owners.splice(ow_i, 1, $(this).val());
                    else
                        self.owners.push($(this).val());
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
                    if (!self.owners.length || self.owners[self.owners.length - 1].name !== '' || self.owners[self.owners.length - 1].value !== '') {
                        addOwner("");
                    }
                });
                ow_remove.on("click", function () {
                    const ow = self.owners.find(o => o.uuid === $(this).data('uuid'));
                    $(this).prev().remove();
                    $(this).remove();
                    self.owners.splice(self.owners.indexOf(ow), 1);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
                });
            }
            self.owners.forEach(addOwner);
            if (!self.owners.length || self.owners[self.owners.length - 1].name !== '' || self.owners[self.owners.length - 1].value !== '')
                addOwner("");
            function addTracker(tracker) {
                const tr_name = $(`<input type="text" placeholder="name" data-uuid="${tracker.uuid}" value="${tracker.name}" style="grid-column-start: name">`);
                const tr_val = $(`<input type="text" title="Current value" data-uuid="${tracker.uuid}" value="${tracker.value}">`);
                const tr_maxval = $(`<input type="text" title="Max value" data-uuid="${tracker.uuid}" value="${tracker.maxvalue || ""}">`);
                const tr_visible = $(`<div data-uuid="${tracker.uuid}"><i class="fas fa-eye"></i></div>`);
                const tr_remove = $(`<div data-uuid="${tracker.uuid}"><i class="fas fa-trash-alt"></i></div>`);
                auras.before(tr_name
                    .add(tr_val)
                    .add(`<span data-uuid="${tracker.uuid}">/</span>`)
                    .add(tr_maxval)
                    .add(`<span data-uuid="${tracker.uuid}"></span>`)
                    .add(tr_visible)
                    .add(`<span data-uuid="${tracker.uuid}"></span>`)
                    .add(tr_remove));
                if (!tracker.visible)
                    tr_visible.css("opacity", 0.3);
                tr_name.on("change", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    tr.name = $(this).val();
                    $(`#selection-tracker-${tr.uuid}-name`).text($(this).val());
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
                    if (!self.trackers.length || self.trackers[self.trackers.length - 1].name !== '' || self.trackers[self.trackers.length - 1].value !== '') {
                        self.trackers.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(), name: '', value: '', maxvalue: '', visible: false });
                        addTracker(self.trackers[self.trackers.length - 1]);
                    }
                });
                tr_val.on("change", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    tr.value = $(this).val();
                    const val = tr.maxvalue ? `${tr.value}/${tr.maxvalue}` : tr.value;
                    $(`#selection-tracker-${tr.uuid}-value`).text(val);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
                });
                tr_maxval.on("change", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    tr.maxvalue = $(this).val();
                    const val = tr.maxvalue ? `${tr.value}/${tr.maxvalue}` : tr.value;
                    $(`#selection-tracker-${tr.uuid}-value`).text(val);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
                });
                tr_remove.on("click", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr.name === '' || tr.value === '')
                        return;
                    $(`[data-uuid=${tr.uuid}]`).remove();
                    self.trackers.splice(self.trackers.indexOf(tr), 1);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
                });
                tr_visible.on("click", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr.visible)
                        $(this).css("opacity", 0.3);
                    else
                        $(this).css("opacity", 1.0);
                    tr.visible = !tr.visible;
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                });
            }
            self.trackers.forEach(addTracker);
            function addAura(aura) {
                const aura_name = $(`<input type="text" placeholder="name" data-uuid="${aura.uuid}" value="${aura.name}" style="grid-column-start: name">`);
                const aura_val = $(`<input type="text" title="Current value" data-uuid="${aura.uuid}" value="${aura.value}">`);
                const aura_dimval = $(`<input type="text" title="Dim value" data-uuid="${aura.uuid}" value="${aura.dim || ""}">`);
                const aura_colour = $(`<input type="text" title="Aura colour" data-uuid="${aura.uuid}">`);
                const aura_visible = $(`<div data-uuid="${aura.uuid}"><i class="fas fa-eye"></i></div>`);
                const aura_light = $(`<div data-uuid="${aura.uuid}"><i class="fas fa-lightbulb"></i></div>`);
                const aura_remove = $(`<div data-uuid="${aura.uuid}"><i class="fas fa-trash-alt"></i></div>`);
                $("#shapeselectiondialog").children().last().append(aura_name
                    .add(aura_val)
                    .add(`<span data-uuid="${aura.uuid}">/</span>`)
                    .add(aura_dimval)
                    .add($(`<div data-uuid="${aura.uuid}">`).append(aura_colour).append($("</div>")))
                    .add(aura_visible)
                    .add(aura_light)
                    .add(aura_remove));
                if (!aura.visible)
                    aura_visible.css("opacity", 0.3);
                if (!aura.lightSource)
                    aura_light.css("opacity", 0.3);
                aura_colour.spectrum({
                    showInput: true,
                    showAlpha: true,
                    color: aura.colour,
                    move: function (colour) {
                        const au = self.auras.find(a => a.uuid === $(this).data('uuid'));
                        // Do not use aura directly as it does not work properly for new auras
                        au.colour = colour.toRgbString();
                        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(true);
                    },
                    change: function () {
                        _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                    }
                });
                aura_name.on("change", function () {
                    const au = self.auras.find(a => a.uuid === $(this).data('uuid'));
                    au.name = $(this).val();
                    $(`#selection-aura-${au.uuid}-name`).text($(this).val());
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                    if (!self.auras.length || self.auras[self.auras.length - 1].name !== '' || self.auras[self.auras.length - 1].value !== '') {
                        self.auras.push({
                            uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(),
                            name: '',
                            value: '',
                            dim: '',
                            lightSource: false,
                            colour: 'rgba(0,0,0,0)',
                            visible: false
                        });
                        addAura(self.auras[self.auras.length - 1]);
                    }
                });
                aura_val.on("change", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    au.value = $(this).val();
                    const val = au.dim ? `${au.value}/${au.dim}` : au.value;
                    $(`#selection-aura-${au.uuid}-value`).text(val);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(au.layer).invalidate(false);
                });
                aura_dimval.on("change", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    au.dim = $(this).val();
                    const val = au.dim ? `${au.value}/${au.dim}` : au.value;
                    $(`#selection-aura-${au.uuid}-value`).text(val);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(au.layer).invalidate(false);
                });
                aura_remove.on("click", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    if (au.name === '' && au.value === '')
                        return;
                    $(`[data-uuid=${au.uuid}]`).remove();
                    self.auras.splice(self.auras.indexOf(au), 1);
                    self.checkLightSources();
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(au.layer).invalidate(false);
                });
                aura_visible.on("click", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    au.visible = !au.visible;
                    if (au.visible)
                        $(this).css("opacity", 1.0);
                    else
                        $(this).css("opacity", 0.3);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                });
                aura_light.on("click", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    au.lightSource = !au.lightSource;
                    const ls = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].lightsources;
                    const i = ls.findIndex(o => o.aura === au.uuid);
                    if (au.lightSource) {
                        $(this).css("opacity", 1.0);
                        if (i === -1)
                            ls.push({ shape: self.uuid, aura: au.uuid });
                    }
                    else {
                        $(this).css("opacity", 0.3);
                        if (i >= 0)
                            ls.splice(i, 1);
                    }
                    const fowl = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("fow");
                    if (fowl !== undefined)
                        fowl.invalidate(false);
                    _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                });
            }
            for (let i = 0; i < self.auras.length; i++) {
                addAura(self.auras[i]);
            }
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].shapeSelectionDialog.dialog("open");
        });
        $('.selection-tracker-value').on("click", function () {
            const uuid = $(this).data('uuid');
            const tracker = self.trackers.find(t => t.uuid === uuid);
            const new_tracker = prompt(`New  ${tracker.name} value: (absolute or relative)`);
            if (new_tracker[0] === '+') {
                tracker.value += parseInt(new_tracker.slice(1));
            }
            else if (new_tracker[0] === '-') {
                tracker.value -= parseInt(new_tracker.slice(1));
            }
            else {
                tracker.value = parseInt(new_tracker);
            }
            const val = tracker.maxvalue ? `${tracker.value}/${tracker.maxvalue}` : tracker.value;
            $(this).text(val);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
        });
        $('.selection-aura-value').on("click", function () {
            const uuid = $(this).data('uuid');
            const aura = self.auras.find(t => t.uuid === uuid);
            const new_aura = prompt(`New  ${aura.name} value: (absolute or relative)`);
            if (new_aura[0] === '+') {
                aura.value += parseInt(new_aura.slice(1));
            }
            else if (new_aura[0] === '-') {
                aura.value -= parseInt(new_aura.slice(1));
            }
            else {
                aura.value = parseInt(new_aura);
            }
            const val = aura.dim ? `${aura.value}/${aura.dim}` : aura.value;
            $(this).text(val);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(false);
        });
    }
    onSelectionLoss() {
        // $(`#shapeselectioncog-${this.uuid}`).remove();
        $("#selection-menu").hide();
    }
    asDict() {
        return Object.assign({}, this);
    }
    draw(ctx) {
        if (this.layer === 'fow') {
            this.fill = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].fowColour.spectrum("get").toRgbString();
        }
        if (this.globalCompositeOperation !== undefined)
            ctx.globalCompositeOperation = this.globalCompositeOperation;
        else
            ctx.globalCompositeOperation = "source-over";
        this.drawAuras(ctx);
    }
    drawAuras(ctx) {
        const self = this;
        this.auras.forEach(function (aura) {
            ctx.beginPath();
            ctx.fillStyle = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("fow").ctx === ctx ? "black" : aura.colour;
            const loc = Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2l"])(self.center());
            ctx.arc(loc.x, loc.y, Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lr"])(aura.value), 0, 2 * Math.PI);
            ctx.fill();
            if (aura.dim) {
                const tc = tinycolor(aura.colour);
                ctx.beginPath();
                ctx.fillStyle = tc.setAlpha(tc.getAlpha() / 2).toRgbString();
                const loc = Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2l"])(self.center());
                ctx.arc(loc.x, loc.y, Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lr"])(aura.dim), 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }
    showContextMenu(mouse) {
        const l = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer();
        l.selection = [this];
        this.onSelection();
        l.invalidate(true);
        const asset = this;
        $menu.show();
        $menu.empty();
        $menu.css({ left: mouse.x, top: mouse.y });
        let data = "" +
            "<ul>" +
            "<li>Layer<ul>";
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.layers.forEach(function (layer) {
            if (!layer.selectable)
                return;
            const sel = layer.name === l.name ? " style='background-color:aqua' " : " ";
            data += `<li data-action='setLayer' data-layer='${layer.name}' ${sel} class='context-clickable'>${layer.name}</li>`;
        });
        data += "</ul></li>" +
            "<li data-action='moveToBack' class='context-clickable'>Move to back</li>" +
            "<li data-action='moveToFront' class='context-clickable'>Move to front</li>" +
            "<li data-action='addInitiative' class='context-clickable'>Add initiative</li>" +
            "</ul>";
        $menu.html(data);
        $(".context-clickable").on('click', function () {
            handleContextMenu($(this), asset);
        });
    }
}
class BoundingRect {
    constructor(x, y, w, h) {
        this.type = "boundrect";
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    contains(x, y, inWorldCoord) {
        if (inWorldCoord) {
            x = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wx"])(x);
            y = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wy"])(y);
        }
        return this.x <= x && (this.x + this.w) >= x &&
            this.y <= y && (this.y + this.h) >= y;
    }
    intersectsWith(other) {
        return !(other.x >= this.x + this.w ||
            other.x + other.w <= this.x ||
            other.y >= this.y + this.h ||
            other.y + other.h <= this.y);
    }
    getIntersectWithLine(line) {
        const lines = [
            Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x, y: this.y }, { x: this.x + this.w, y: this.y }, line.start, line.end),
            Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x + this.w, y: this.y }, {
                x: this.x + this.w,
                y: this.y + this.h
            }, line.start, line.end),
            Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x, y: this.y }, { x: this.x, y: this.y + this.h }, line.start, line.end),
            Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x, y: this.y + this.h }, {
                x: this.x + this.w,
                y: this.y + this.h
            }, line.start, line.end)
        ];
        let min_d = Infinity;
        let min_i = null;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === null)
                continue;
            const d = Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getPointDistance"])(line.start, lines[i]);
            if (min_d > d) {
                min_d = d;
                min_i = lines[i];
            }
        }
        return { intersect: min_i, distance: min_d };
    }
}
class Rect extends Shape {
    constructor(x, y, w, h, fill, border, uuid) {
        super(uuid);
        this.type = "rect";
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 1;
        this.h = h || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
        this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
    }
    getBoundingBox() {
        return new BoundingRect(this.x, this.y, this.w, this.h);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = this.fill;
        const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
        const loc = Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2l"])({ x: this.x, y: this.y });
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.border;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
    contains(x, y, inWorldCoord) {
        if (inWorldCoord) {
            x = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wx"])(x);
            y = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wy"])(y);
        }
        return this.x <= x && (this.x + this.w) >= x &&
            this.y <= y && (this.y + this.h) >= y;
    }
    inCorner(x, y, corner) {
        switch (corner) {
            case 'ne':
                return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w - 3) <= x && x <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y - 3) <= y && y <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + 3);
            case 'nw':
                return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x - 3) <= x && x <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y - 3) <= y && y <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + 3);
            case 'sw':
                return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x - 3) <= x && x <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h - 3) <= y && y <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h + 3);
            case 'se':
                return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w - 3) <= x && x <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h - 3) <= y && y <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h + 3);
            default:
                return false;
        }
    }
    getCorner(x, y) {
        if (this.inCorner(x, y, "ne"))
            return "ne";
        else if (this.inCorner(x, y, "nw"))
            return "nw";
        else if (this.inCorner(x, y, "se"))
            return "se";
        else if (this.inCorner(x, y, "sw"))
            return "sw";
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
        this.x = centerPoint.x - this.w / 2;
        this.y = centerPoint.y - this.h / 2;
    }
}
class Circle extends Shape {
    constructor(x, y, r, fill, border, uuid) {
        super(uuid);
        this.type = "circle";
        this.x = x || 0;
        this.y = y || 0;
        this.r = r || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
        this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
    }
    ;
    getBoundingBox() {
        return new BoundingRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        const loc = Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2l"])({ x: this.x, y: this.y });
        ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.strokeStyle = this.border;
            ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(x, y) {
        return (x - Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x)) ** 2 + (y - Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y)) ** 2 < this.r ** 2;
    }
    inCorner(x, y, corner) {
        return false; //TODO
    }
    getCorner(x, y) {
        if (this.inCorner(x, y, "ne"))
            return "ne";
        else if (this.inCorner(x, y, "nw"))
            return "nw";
        else if (this.inCorner(x, y, "se"))
            return "se";
        else if (this.inCorner(x, y, "sw"))
            return "sw";
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return { x: this.x, y: this.y };
        this.x = centerPoint.x;
        this.y = centerPoint.y;
    }
}
class Line extends Shape {
    constructor(x1, y1, x2, y2, uuid) {
        super(uuid);
        this.type = "line";
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
    }
    getBoundingBox() {
        return new BoundingRect(Math.min(this.x1, this.x2), Math.min(this.y1, this.y2), Math.abs(this.x1 - this.x2), Math.abs(this.y1 - this.y2));
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x1), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y1));
        ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x2), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y2));
        ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    contains(x, y, inWorldCoord) {
        return false; // TODO
    }
    center(centerPoint) { } // TODO
}
class Text extends Shape {
    constructor(x, y, text, font, angle, uuid) {
        super(uuid);
        this.type = "text";
        this.x = x;
        this.y = y;
        this.text = text;
        this.font = font;
        this.angle = angle || 0;
        this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
    }
    getBoundingBox() {
        return new BoundingRect(this.x, this.y, 5, 5); // Todo: fix this bounding box
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        ctx.translate(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y));
        ctx.rotate(this.angle);
        ctx.textAlign = "center";
        ctx.fillText(this.text, 0, -5);
        ctx.restore();
    }
    contains(x, y, inWorldCoord) {
        return false; // TODO
    }
    center(centerPoint) { } // TODO
}
class Asset extends Rect {
    constructor(img, x, y, w, h, uuid) {
        super(x, y, w, h);
        if (uuid !== undefined)
            this.uuid = uuid;
        this.type = "asset";
        this.img = img;
    }
    draw(ctx) {
        super.draw(ctx);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
        ctx.drawImage(this.img, Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y), this.w * z, this.h * z);
    }
}
function createShapeFromDict(shape, dummy) {
    if (dummy === undefined)
        dummy = false;
    if (!dummy && _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(shape.uuid))
        return _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(shape.uuid);
    let sh;
    if (shape.type === 'rect')
        sh = Object.assign(new Rect(), shape);
    if (shape.type === 'circle')
        sh = Object.assign(new Circle(), shape);
    if (shape.type === 'line')
        sh = Object.assign(new Line(), shape);
    if (shape.type === 'text')
        sh = Object.assign(new Text(), shape);
    if (shape.type === 'asset') {
        const img = new Image(shape.w, shape.h);
        img.src = shape.src;
        sh = Object.assign(new Asset(), shape);
        sh.img = img;
        img.onload = function () {
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer).invalidate(false);
        };
    }
    return sh;
}
function handleContextMenu(menu, shape) {
    const action = menu.data("action");
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer();
    switch (action) {
        case 'moveToFront':
            layer.moveShapeOrder(shape, layer.shapes.data.length - 1, true);
            break;
        case 'moveToBack':
            layer.moveShapeOrder(shape, 0, true);
            break;
        case 'setLayer':
            layer.removeShape(shape, true);
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(menu.data("layer")).addShape(shape, true);
            break;
        case 'addInitiative':
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeTracker.addInitiative({
                uuid: shape.uuid,
                visible: !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM,
                group: false,
                src: shape.src,
                owners: shape.owners
            }, true);
            break;
    }
    $menu.hide();
}


/***/ }),

/***/ "./PlanarAlly/client/src/socket.ts":
/*!*****************************************!*\
  !*** ./PlanarAlly/client/src/socket.ts ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./PlanarAlly/client/src/utils.ts");
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tools */ "./PlanarAlly/client/src/tools.ts");



const protocol = document.domain === 'localhost' ? "http://" : "https://";
const socket = io.connect(protocol + document.domain + ":" + location.port + "/planarally");
socket.on("connect", function () {
    console.log("Connected");
});
socket.on("disconnect", function () {
    console.log("Disconnected");
});
socket.on("redirect", function (destination) {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("set username", function (username) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username = username;
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM = username === window.location.pathname.split("/")[2];
    if ($("#toolselect").find("ul").html().length === 0)
        Object(_tools__WEBPACK_IMPORTED_MODULE_2__["setupTools"])();
});
socket.on("set clientOptions", function (options) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].setClientOptions(options);
});
socket.on("set locationOptions", function (options) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.setOptions(options);
});
socket.on("asset list", function (assets) {
    const m = $("#menu-tokens");
    m.empty();
    let h = '';
    const process = function (entry, path) {
        const folders = new Map(Object.entries(entry.folders));
        folders.forEach(function (value, key) {
            h += "<button class='accordion'>" + key + "</button><div class='accordion-panel'><div class='accordion-subpanel'>";
            process(value, path + key + "/");
            h += "</div></div>";
        });
        entry.files.sort(_utils__WEBPACK_IMPORTED_MODULE_1__["alphSort"]);
        entry.files.forEach(function (asset) {
            h += "<div class='draggable token'><img src='/static/img/assets/" + path + asset + "' width='35'>" + asset + "<i class='fas fa-cog'></i></div>";
        });
    };
    process(assets, "");
    m.html(h);
    $(".draggable").draggable({
        helper: "clone",
        appendTo: "#board"
    });
    $('.accordion').each(function (idx) {
        $(this).on("click", function () {
            $(this).toggleClass("accordion-active");
            $(this).next().toggle();
        });
    });
});
socket.on("board init", function (location_info) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].setupBoard(location_info);
});
socket.on("set gridsize", function (gridSize) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.setGridSize(gridSize);
});
socket.on("add shape", function (shape) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].addShape(shape);
});
socket.on("remove shape", function (shape) {
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer);
    layer.removeShape(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(shape.uuid), false);
    layer.invalidate(false);
});
socket.on("moveShapeOrder", function (data) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(data.shape.layer).moveShapeOrder(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(data.shape.uuid), data.index, false);
});
socket.on("shapeMove", function (shape) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].moveShape(shape);
});
socket.on("updateShape", function (data) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].updateShape(data);
});
socket.on("updateInitiative", function (data) {
    if (data.initiative === undefined || (!data.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM && !data.visible))
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeTracker.removeInitiative(data.uuid, false, true);
    else
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeTracker.addInitiative(data, false);
});
socket.on("setInitiative", function (data) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].setInitiative(data);
});
socket.on("clear temporaries", function (shapes) {
    shapes.forEach(function (shape) {
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer).removeShape(shape, false);
    });
});
/* harmony default export */ __webpack_exports__["default"] = (socket);


/***/ }),

/***/ "./PlanarAlly/client/src/tools.ts":
/*!****************************************!*\
  !*** ./PlanarAlly/client/src/tools.ts ***!
  \****************************************/
/*! exports provided: setupTools, DrawTool, RulerTool, FOWTool, MapTool, InitiativeTracker */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setupTools", function() { return setupTools; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DrawTool", function() { return DrawTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RulerTool", function() { return RulerTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FOWTool", function() { return FOWTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapTool", function() { return MapTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InitiativeTracker", function() { return InitiativeTracker; });
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.ts");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shapes */ "./PlanarAlly/client/src/shapes.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.ts");




const tools = [
    { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, func: undefined },
    { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, func: undefined },
    { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, func: undefined },
    { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, func: undefined },
    { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, func: undefined },
    { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, func: undefined },
];
function setupTools() {
    // TODO: FIX THIS TEMPORARY SHIT, this is a quickfix after the js>ts transition
    tools[0].func = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager;
    tools[1].func = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager;
    tools[2].func = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].drawTool;
    tools[3].func = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].rulerTool;
    tools[4].func = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowTool;
    tools[5].func = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].mapTool;
    _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].tools = tools;
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
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
            if (index !== _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].selectedTool) {
                $('.tool-selected').removeClass("tool-selected");
                $(this).addClass("tool-selected");
                _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].selectedTool = index;
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
}
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
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    const fillColor = this.fillColor.spectrum("get");
    const fill = fillColor === null ? tinycolor("transparent") : fillColor;
    const borderColor = this.borderColor.spectrum("get");
    const border = borderColor === null ? tinycolor("transparent") : borderColor;
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, fill.toRgbString(), border.toRgbString());
    this.rect.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
    if (layer.name === 'fow') {
        this.rect.visionObstruction = true;
        this.rect.movementObstruction = true;
    }
    _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightblockers.push(this.rect.uuid);
    layer.addShape(this.rect, true, false);
};
DrawTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
    layer.invalidate(false);
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
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("draw");
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.ruler = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Line"](this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Text"](this.startPoint.x, this.startPoint.y, "", "20px serif");
    this.ruler.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
    this.text.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
    layer.addShape(this.ruler, true, true);
    layer.addShape(this.text, true, true);
};
RulerTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("draw");
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.ruler.x2 = endPoint.x;
    this.ruler.y2 = endPoint.y;
    _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: this.ruler.asDict(), temporary: true });
    const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
    const xdiff = Math.abs(endPoint.x - this.startPoint.x);
    const ydiff = Math.abs(endPoint.y - this.startPoint.y);
    const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.unitSize / _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize) + " ft";
    let angle = Math.atan2(diffsign * ydiff, xdiff);
    const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
    const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
    this.text.x = xmid;
    this.text.y = ymid;
    this.text.text = label;
    this.text.angle = angle;
    _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: this.text.asDict(), temporary: true });
    layer.invalidate(true);
};
RulerTool.prototype.onMouseUp = function () {
    if (this.startPoint === null)
        return;
    this.startPoint = null;
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("draw");
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
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("fow");
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString());
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
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("fow");
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
    layer.invalidate(false);
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
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
    layer.addShape(this.rect, false, false);
};
MapTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    // socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
    layer.invalidate(false);
};
MapTool.prototype.onMouseUp = function () {
    if (this.startPoint === null)
        return;
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
    if (layer.selection.length !== 1) {
        layer.removeShape(this.rect, false, false);
        return;
    }
    const w = this.rect.w;
    const h = this.rect.h;
    layer.selection[0].w *= this.xCount.val() * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize / w;
    layer.selection[0].h *= this.yCount.val() * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize / h;
    layer.removeShape(this.rect, false, false);
    this.startPoint = null;
    this.rect = null;
};
function InitiativeTracker() {
    this.data = [];
}
InitiativeTracker.prototype.addInitiative = function (data, sync) {
    // Open the initiative tracker if it is not currently open.
    if (this.data.length === 0 || !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.dialog("isOpen"))
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.dialog("open");
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
        _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("updateInitiative", data);
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
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("updateInitiative", { uuid: uuid });
    }
    if (this.data.length === 0 && _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.dialog("isOpen"))
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.dialog("close");
};
InitiativeTracker.prototype.redraw = function () {
    _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.empty();
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
        if (!data.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM) {
            val.prop("disabled", "disabled");
            remove.css("opacity", "0.3");
        }
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.append(img).append(val).append(visible).append(group).append(remove);
        val.on("change", function () {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            d.initiative = parseInt($(this).val()) || 0;
            self.addInitiative(d, true);
        });
        visible.on("click", function () {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                return;
            d.visible = !d.visible;
            if (d.visible)
                $(this).css("opacity", 1.0);
            else
                $(this).css("opacity", 0.3);
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("updateInitiative", d);
        });
        group.on("click", function () {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                return;
            d.group = !d.group;
            if (d.group)
                $(this).css("opacity", 1.0);
            else
                $(this).css("opacity", 0.3);
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("updateInitiative", d);
        });
        remove.on("click", function () {
            const uuid = $(this).data('uuid');
            const d = self.data.find(d => d.uuid === uuid);
            if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                return;
            $(`[data-uuid=${uuid}]`).remove();
            self.removeInitiative(uuid, true, true);
        });
    });
};


/***/ }),

/***/ "./PlanarAlly/client/src/units.ts":
/*!****************************************!*\
  !*** ./PlanarAlly/client/src/units.ts ***!
  \****************************************/
/*! exports provided: w2l, w2lx, w2ly, w2lz, getUnitDistance, w2lr, l2w, l2wx, l2wy */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w2l", function() { return w2l; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w2lx", function() { return w2lx; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w2ly", function() { return w2ly; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w2lz", function() { return w2lz; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUnitDistance", function() { return getUnitDistance; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "w2lr", function() { return w2lr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l2w", function() { return l2w; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l2wx", function() { return l2wx; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l2wy", function() { return l2wy; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.ts");

function w2l(obj) {
    const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
    const panX = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panX;
    const panY = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panY;
    return {
        x: (obj.x + panX) * z,
        y: (obj.y + panY) * z
    };
}
function w2lx(x) {
    return w2l({ x: x, y: 0 }).x;
}
function w2ly(y) {
    return w2l({ x: 0, y: y }).y;
}
function w2lz(z) {
    return z * _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
}
function getUnitDistance(r) {
    return (r / _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.unitSize) * _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.gridSize;
}
function w2lr(r) {
    return w2lz(getUnitDistance(r));
}
function l2w(obj) {
    const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
    const panX = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panX;
    const panY = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panY;
    return {
        x: (obj.x / z) - panX,
        y: (obj.y / z) - panY
    };
}
function l2wx(x) {
    return l2w({ x: x, y: 0 }).x;
}
function l2wy(y) {
    return l2w({ x: 0, y: y }).y;
}


/***/ }),

/***/ "./PlanarAlly/client/src/utils.ts":
/*!****************************************!*\
  !*** ./PlanarAlly/client/src/utils.ts ***!
  \****************************************/
/*! exports provided: alphSort, uuidv4, OrderedMap */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "alphSort", function() { return alphSort; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "uuidv4", function() { return uuidv4; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OrderedMap", function() { return OrderedMap; });
function alphSort(a, b) {
    if (a.toLowerCase() < b.toLowerCase())
        return -1;
    else
        return 1;
}
// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
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


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vUGxhbmFyQWxseS9jbGllbnQvc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vUGxhbmFyQWxseS9jbGllbnQvc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi9QbGFuYXJBbGx5L2NsaWVudC9zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi9QbGFuYXJBbGx5L2NsaWVudC9zcmMvc2hhcGVzLnRzIiwid2VicGFjazovLy8uL1BsYW5hckFsbHkvY2xpZW50L3NyYy9zb2NrZXQudHMiLCJ3ZWJwYWNrOi8vLy4vUGxhbmFyQWxseS9jbGllbnQvc3JjL3Rvb2xzLnRzIiwid2VicGFjazovLy8uL1BsYW5hckFsbHkvY2xpZW50L3NyYy91bml0cy50cyIsIndlYnBhY2s6Ly8vLi9QbGFuYXJBbGx5L2NsaWVudC9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ25FQTtBQUFBLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7SUFDMUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxD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O3dCQUNqRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFDRCxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUMzQixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQzFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdEIsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNsQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FB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QUFFLE1BQWM7UUFDekMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNiLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUgsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVHLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFD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Q0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELDJFQUEyRTtJQUMzRSxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUNGLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHO0lBQzFCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDO1FBQUMsTUFBTSxDQUFDO0lBQ3JDLE1BQU0sS0FBSyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUM7SUFDWCxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcs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TUFBTSxLQUFLLEdBQUcsQ0FBQztRQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNoQixDQUFDLENBQUMiLCJmaWxlIjoicGxhbmFyYWxseS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL1BsYW5hckFsbHkvY2xpZW50L3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiZnVuY3Rpb24gcG9pbnRJbkxpbmUocCwgbDEsIGwyKSB7XHJcbiAgICByZXR1cm4gcC54ID49IE1hdGgubWluKGwxLngsIGwyLngpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnggPD0gTWF0aC5tYXgobDEueCwgbDIueCkgKyAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueSA+PSBNYXRoLm1pbihsMS55LCBsMi55KSAtIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55IDw9IE1hdGgubWF4KGwxLnksIGwyLnkpICsgMC4wMDAwMDE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lcyhwLCBzMSwgZTEsIHMyLCBlMikge1xyXG4gICAgcmV0dXJuIHBvaW50SW5MaW5lKHAsIHMxLCBlMSkgJiYgcG9pbnRJbkxpbmUocCwgczIsIGUyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoczEsIGUxLCBzMiwgZTIpe1xyXG4gICAgLy8gY29uc3QgczEgPSBNYXRoLm1pbihTMSwgKVxyXG4gICAgY29uc3QgQTEgPSBlMS55LXMxLnk7XHJcbiAgICBjb25zdCBCMSA9IHMxLngtZTEueDtcclxuICAgIGNvbnN0IEEyID0gZTIueS1zMi55O1xyXG4gICAgY29uc3QgQjIgPSBzMi54LWUyLng7XHJcblxyXG4gICAgLy8gR2V0IGRlbHRhIGFuZCBjaGVjayBpZiB0aGUgbGluZXMgYXJlIHBhcmFsbGVsXHJcbiAgICBjb25zdCBkZWx0YSA9IEExKkIyIC0gQTIqQjE7XHJcbiAgICBpZihkZWx0YSA9PT0gMCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIGNvbnN0IEMyID0gQTIqczIueCtCMipzMi55O1xyXG4gICAgY29uc3QgQzEgPSBBMSpzMS54K0IxKnMxLnk7XHJcbiAgICAvL2ludmVydCBkZWx0YSB0byBtYWtlIGRpdmlzaW9uIGNoZWFwZXJcclxuICAgIGNvbnN0IGludmRlbHRhID0gMS9kZWx0YTtcclxuXHJcbiAgICBjb25zdCBpbnRlcnNlY3QgPSB7eDogKEIyKkMxIC0gQjEqQzIpKmludmRlbHRhLCB5OiAoQTEqQzIgLSBBMipDMSkqaW52ZGVsdGF9O1xyXG4gICAgaWYgKCFwb2ludEluTGluZXMoaW50ZXJzZWN0LCBzMSwgZTEsIHMyLCBlMikpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICByZXR1cm4gaW50ZXJzZWN0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9pbnREaXN0YW5jZShwMSwgcDIpIHtcclxuICAgIGNvbnN0IGEgPSBwMS54IC0gcDIueDtcclxuICAgIGNvbnN0IGIgPSBwMS55IC0gcDIueTtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoIGEqYSArIGIqYiApO1xyXG59IiwiaW1wb3J0IHtnZXRVbml0RGlzdGFuY2UsIGwydywgbDJ3eCwgbDJ3eSwgdzJsLCB3MmxyLCB3Mmx4LCB3Mmx5LCB3Mmx6fSBmcm9tIFwiLi91bml0c1wiO1xyXG5pbXBvcnQge1NoYXBlLCBDaXJjbGUsIGNyZWF0ZVNoYXBlRnJvbURpY3QsIFJlY3R9IGZyb20gXCIuL3NoYXBlc1wiO1xyXG5pbXBvcnQge09yZGVyZWRNYXAsIFBvaW50fSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuL3NvY2tldFwiO1xyXG5cclxuY29uc3Qgc2VsZWN0aW9uSW5mbyA9IHtcclxuICAgIHg6ICQoJyNzZWxlY3Rpb25JbmZvWCcpLFxyXG4gICAgeTogJCgnI3NlbGVjdGlvbkluZm9ZJyksXHJcbiAgICB3OiAkKCcjc2VsZWN0aW9uSW5mb1cnKSxcclxuICAgIGg6ICQoJyNzZWxlY3Rpb25JbmZvSCcpXHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZXRTZWxlY3Rpb25JbmZvKHNoYXBlKSB7XHJcbiAgICBzZWxlY3Rpb25JbmZvLngudmFsKHNoYXBlLngpO1xyXG4gICAgc2VsZWN0aW9uSW5mby55LnZhbChzaGFwZS55KTtcclxuICAgIHNlbGVjdGlvbkluZm8udy52YWwoc2hhcGUudyk7XHJcbiAgICBzZWxlY3Rpb25JbmZvLmgudmFsKHNoYXBlLmgpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXIge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgd2lkdGg6IG51bWJlcjtcclxuICAgIGhlaWdodDogbnVtYmVyO1xyXG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHNlbGVjdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBXaGVuIHNldCB0byBmYWxzZSwgdGhlIGxheWVyIHdpbGwgYmUgcmVkcmF3biBvbiB0aGUgbmV4dCB0aWNrXHJcbiAgICB2YWxpZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgLy8gVGhlIGNvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgdGhpcyBsYXllciBjb250YWlucy5cclxuICAgIC8vIFRoZXNlIGFyZSBvcmRlcmVkIG9uIGEgZGVwdGggYmFzaXMuXHJcbiAgICBzaGFwZXMgPSBuZXcgT3JkZXJlZE1hcCgpO1xyXG5cclxuICAgIC8vIFN0YXRlIHZhcmlhYmxlc1xyXG4gICAgLy8gdG9kbyBjaGFuZ2UgdG8gZW51bSA/XHJcbiAgICBkcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgcmVzaXppbmcgPSBmYWxzZTtcclxuICAgIHBhbm5pbmcgPSBmYWxzZTtcclxuICAgIHNlbGVjdGluZyA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFRoaXMgaXMgYSBoZWxwZXIgdG8gaWRlbnRpZnkgd2hpY2ggY29ybmVyIG9yIG1vcmUgc3BlY2lmaWNhbGx5IHdoaWNoIHJlc2l6ZSBkaXJlY3Rpb24gaXMgYmVpbmcgdXNlZC5cclxuICAgIHJlc2l6ZWRpciA9ICcnO1xyXG5cclxuICAgIC8vIFRoaXMgaXMgYSByZWZlcmVuY2UgdG8gYW4gb3B0aW9uYWwgcmVjdGFuZ3VsYXIgb2JqZWN0IHRoYXQgaXMgdXNlZCB0byBzZWxlY3QgbXVsdGlwbGUgdG9rZW5zXHJcbiAgICBzZWxlY3Rpb25IZWxwZXI6IFJlY3QgfCBudWxsID0gbnVsbDtcclxuICAgIHNlbGVjdGlvblN0YXJ0UG9pbnQ6IFBvaW50IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgLy8gQ29sbGVjdGlvbiBvZiBzaGFwZXMgdGhhdCBhcmUgY3VycmVudGx5IHNlbGVjdGVkXHJcbiAgICBzZWxlY3Rpb246IFNoYXBlW10gPSBbXTtcclxuXHJcbiAgICAvLyBCZWNhdXNlIHdlIG5ldmVyIGRyYWcgZnJvbSB0aGUgYXNzZXQncyAoMCwgMCkgY29vcmQgYW5kIHdhbnQgYSBzbW9vdGhlciBkcmFnIGV4cGVyaWVuY2VcclxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cclxuICAgIGRyYWdvZmZ4ID0gMDtcclxuICAgIGRyYWdvZmZ5ID0gMDtcclxuICAgIGRyYWdvcmlnOiBQb2ludDtcclxuXHJcbiAgICAvLyBFeHRyYSBzZWxlY3Rpb24gaGlnaGxpZ2h0aW5nIHNldHRpbmdzXHJcbiAgICBzZWxlY3Rpb25Db2xvciA9ICcjQ0MwMDAwJztcclxuICAgIHNlbGVjdGlvbldpZHRoID0gMjtcclxuXHJcbiAgICBzdHlsZVBhZGRpbmdMZWZ0OiBudW1iZXI7XHJcbiAgICBzdHlsZVBhZGRpbmdUb3A6IG51bWJlcjtcclxuICAgIHN0eWxlQm9yZGVyTGVmdDogbnVtYmVyO1xyXG4gICAgc3R5bGVCb3JkZXJUb3A6IG51bWJlcjtcclxuICAgIGh0bWxUb3A6IG51bWJlcjtcclxuICAgIGh0bWxMZWZ0OiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBuYW1lKSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICAgICAgICAvLyB0b2RvOiBkbyB3ZSBhY3R1YWxseSBuZWVkIHRoZSBzdHlsZXBhZGRpbmcgYW5kIGh0bWwgc3R1ZmYgP1xyXG4gICAgICAgIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGVQYWRkaW5nTGVmdCA9IHBhcnNlSW50KGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoY2FudmFzLCBudWxsKVsncGFkZGluZ0xlZnQnXSwgMTApIHx8IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGVQYWRkaW5nVG9wID0gcGFyc2VJbnQoZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShjYW52YXMsIG51bGwpWydwYWRkaW5nVG9wJ10sIDEwKSB8fCAwO1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlQm9yZGVyTGVmdCA9IHBhcnNlSW50KGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoY2FudmFzLCBudWxsKVsnYm9yZGVyTGVmdFdpZHRoJ10sIDEwKSB8fCAwO1xyXG4gICAgICAgICAgICB0aGlzLnN0eWxlQm9yZGVyVG9wID0gcGFyc2VJbnQoZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShjYW52YXMsIG51bGwpWydib3JkZXJUb3BXaWR0aCddLCAxMCkgfHwgMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGh0bWwgPSBkb2N1bWVudC5ib2R5O1xyXG4gICAgICAgIHRoaXMuaHRtbFRvcCA9IGh0bWwub2Zmc2V0VG9wO1xyXG4gICAgICAgIHRoaXMuaHRtbExlZnQgPSBodG1sLm9mZnNldExlZnQ7XHJcbiAgICB9XHJcblxyXG4gICAgaW52YWxpZGF0ZShza2lwTGlnaHRVcGRhdGU6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFza2lwTGlnaHRVcGRhdGUgJiYgdGhpcy5uYW1lICE9PSBcImZvd1wiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvdyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgaWYgKGZvdyAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgZm93LmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgc2hhcGUubGF5ZXIgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMucHVzaChzaGFwZSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcImFkZCBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaGFwZSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRTaGFwZXMoc2hhcGVzOiBTaGFwZVtdKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgdCA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUsIHNlbGYpO1xyXG4gICAgICAgICAgICBzaC5sYXllciA9IHNlbGYubmFtZTtcclxuICAgICAgICAgICAgc2guY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc2guc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoKTtcclxuICAgICAgICAgICAgdC5wdXNoKHNoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdOyAvLyBUT0RPOiBGaXgga2VlcGluZyBzZWxlY3Rpb24gb24gdGhvc2UgaXRlbXMgdGhhdCBhcmUgbm90IG1vdmVkLlxyXG4gICAgICAgIHRoaXMuc2hhcGVzLmRhdGEgPSB0O1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5yZW1vdmUoc2hhcGUpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcInJlbW92ZSBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgICAgIGNvbnN0IGxzX2kgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZmluZEluZGV4KGxzID0+IGxzLnNoYXBlID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBjb25zdCBsYl9pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IG1iX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgaWYgKGxzX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShsc19pLCAxKTtcclxuICAgICAgICBpZiAobGJfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZShsYl9pLCAxKTtcclxuICAgICAgICBpZiAobWJfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZShtYl9pLCAxKTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5kZWxldGUoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zZWxlY3Rpb24uaW5kZXhPZihzaGFwZSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID49IDApXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoZG9DbGVhcj86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGRvQ2xlYXIgPSBkb0NsZWFyID09PSB1bmRlZmluZWQgPyB0cnVlIDogZG9DbGVhcjtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb0NsZWFyKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaGFwZXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHcybHgoc2hhcGUueCkgPiBzdGF0ZS53aWR0aCB8fCB3Mmx5KHNoYXBlLnkpID4gc3RhdGUuaGVpZ2h0IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdzJseChzaGFwZS54ICsgc2hhcGUudykgPCAwIHx8IHcybHkoc2hhcGUueSArIHNoYXBlLmgpIDwgMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLm5hbWUgPT09ICdmb3cnICYmIHNoYXBlLnZpc2lvbk9ic3RydWN0aW9uICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpLm5hbWUgIT09IHN0YXRlLm5hbWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHNoYXBlLmRyYXcoY3R4KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuc2VsZWN0aW9uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBSZWN0KSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KHcybHgoc2VsLngpLCB3Mmx5KHNlbC55KSwgc2VsLncgKiB6LCBzZWwuaCAqIHopO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB0b3ByaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54ICsgc2VsLncgLSAzKSwgdzJseShzZWwueSAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodzJseChzZWwueCAtIDMpLCB3Mmx5KHNlbC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90cmlnaHRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodzJseChzZWwueCArIHNlbC53IC0gMyksIHcybHkoc2VsLnkgKyBzZWwuaCAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJvdGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodzJseChzZWwueCAtIDMpLCB3Mmx5KHNlbC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRNb3VzZShlOiBNb3VzZUV2ZW50KTogUG9pbnQge1xyXG4gICAgICAgIGxldCBlbGVtZW50ID0gdGhpcy5jYW52YXMsIG9mZnNldFggPSAwLCBvZmZzZXRZID0gMCwgbXgsIG15O1xyXG5cclxuICAgICAgICAvLyB0b2RvIGNoZWNrIGlmIHdlIG5lZWQgdGhlc2Ugb2Zmc2V0cy5cclxuICAgICAgICAvLyBDb21wdXRlIHRoZSB0b3RhbCBvZmZzZXRcclxuICAgICAgICBpZiAoZWxlbWVudC5vZmZzZXRQYXJlbnQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXRYICs9IGVsZW1lbnQub2Zmc2V0TGVmdDtcclxuICAgICAgICAgICAgICAgIG9mZnNldFkgKz0gZWxlbWVudC5vZmZzZXRUb3A7XHJcbiAgICAgICAgICAgIH0gd2hpbGUgKChlbGVtZW50ID0gZWxlbWVudC5vZmZzZXRQYXJlbnQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFkZCBwYWRkaW5nIGFuZCBib3JkZXIgc3R5bGUgd2lkdGhzIHRvIG9mZnNldFxyXG4gICAgICAgIC8vIEFsc28gYWRkIHRoZSA8aHRtbD4gb2Zmc2V0cyBpbiBjYXNlIHRoZXJlJ3MgYSBwb3NpdGlvbjpmaXhlZCBiYXJcclxuICAgICAgICBvZmZzZXRYICs9IHRoaXMuc3R5bGVQYWRkaW5nTGVmdCArIHRoaXMuc3R5bGVCb3JkZXJMZWZ0ICsgdGhpcy5odG1sTGVmdDtcclxuICAgICAgICBvZmZzZXRZICs9IHRoaXMuc3R5bGVQYWRkaW5nVG9wICsgdGhpcy5zdHlsZUJvcmRlclRvcCArIHRoaXMuaHRtbFRvcDtcclxuXHJcbiAgICAgICAgbXggPSBlLnBhZ2VYIC0gb2Zmc2V0WDtcclxuICAgICAgICBteSA9IGUucGFnZVkgLSBvZmZzZXRZO1xyXG5cclxuICAgICAgICByZXR1cm4ge3g6IG14LCB5OiBteX07XHJcbiAgICB9O1xyXG5cclxuICAgIG1vdmVTaGFwZU9yZGVyKHNoYXBlOiBTaGFwZSwgZGVzdGluYXRpb25JbmRleDogbnVtYmVyLCBzeW5jOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2hhcGVzLm1vdmVUbyhzaGFwZSwgZGVzdGluYXRpb25JbmRleCkpIHtcclxuICAgICAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwibW92ZVNoYXBlT3JkZXJcIiwge3NoYXBlOiBzaGFwZS5hc0RpY3QoKSwgaW5kZXg6IGRlc3RpbmF0aW9uSW5kZXh9KTtcclxuICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU/OiBTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBMYXllciB7XHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIG5hbWUpIHtcclxuICAgICAgICBzdXBlcihjYW52YXMsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dMYXllciBleHRlbmRzIExheWVyIHtcclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhcywgbmFtZSkge1xyXG4gICAgICAgIHN1cGVyKGNhbnZhcywgbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLmFkZFNoYXBlKHNoYXBlLCBzeW5jLCB0ZW1wb3JhcnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNoYXBlW10pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBjID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIHNoYXBlLmZpbGwgPSBjO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHN1cGVyLnNldFNoYXBlcyhzaGFwZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2hhcGVNb3ZlKHNoYXBlPzogU2hhcGUpOiB2b2lkIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc3VwZXIub25TaGFwZU1vdmUoc2hhcGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBkcmF3KCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCAmJiAhdGhpcy52YWxpZCkge1xyXG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcclxuICAgICAgICAgICAgY29uc3Qgb3JpZ19vcCA9IGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVykge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2dhbHBoYSA9IHRoaXMuY3R4Lmdsb2JhbEFscGhhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJjb3B5XCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZm93T3BhY2l0eTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IG9nYWxwaGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVyk7XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwidG9rZW5zXCIpLnNoYXBlcy5kYXRhLmZvckVhY2goZnVuY3Rpb24gKHNoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoLm93bmVkQnkoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmIgPSBzaC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IHcybChzaC5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbG0gPSAwLjggKiB3Mmx6KGJiLncpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBncmFkaWVudCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtIC8gMiwgbGNlbnRlci54LCBsY2VudGVyLnksIGFsbSk7XHJcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwgMCwgMCwgMSknKTtcclxuICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKGxzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChscy5zaGFwZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPbGQgbGlnaHRzb3VyY2Ugc3RpbGwgbGluZ2VyaW5nIGluIHRoZSBnYW1lTWFuYWdlciBsaXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbGVuZ3RoID0gZ2V0VW5pdERpc3RhbmNlKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsY2VudGVyID0gdzJsKGNlbnRlcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gbmV3IENpcmNsZShjZW50ZXIueCwgY2VudGVyLnksIGF1cmFfbGVuZ3RoKS5nZXRCb3VuZGluZ0JveCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNvbGxlY3QgYWxsIGxpZ2h0YmxvY2tlcnMgdGhhdCBhcmUgaW5zaWRlL2Nyb3NzIG91ciBhdXJhXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHRvIHByZXZlbnQgYXMgbWFueSByYXkgY2FsY3VsYXRpb25zIGFzIHBvc3NpYmxlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbF9saWdodGJsb2NrZXJzID0gW107XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmZvckVhY2goZnVuY3Rpb24gKGxiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiID09PSBzaC51dWlkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfc2ggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobGIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbGJfc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfYmIuaW50ZXJzZWN0c1dpdGgoYmJveCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2xpZ2h0YmxvY2tlcnMucHVzaChsYl9iYik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyY19zdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FzdCByYXlzIGluIGV2ZXJ5IGRlZ3JlZVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYW5nbGUgPSAwOyBhbmdsZSA8IDIgKiBNYXRoLlBJOyBhbmdsZSArPSAoMSAvIDE4MCkgKiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaGl0IHdpdGggb2JzdHJ1Y3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgaGl0ID0ge2ludGVyc2VjdDogbnVsbCwgZGlzdGFuY2U6IEluZmluaXR5fTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbF9saWdodGJsb2NrZXJzLmZvckVhY2goZnVuY3Rpb24gKGxiX2JiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxiX2JiLmdldEludGVyc2VjdFdpdGhMaW5lKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBjZW50ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBjZW50ZXIueCArIGF1cmFfbGVuZ3RoICogTWF0aC5jb3MoYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGNlbnRlci55ICsgYXVyYV9sZW5ndGggKiBNYXRoLnNpbihhbmdsZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuaW50ZXJzZWN0ICE9PSBudWxsICYmIHJlc3VsdC5kaXN0YW5jZSA8IGhpdC5kaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGl0ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVfaGl0ID0gbGJfYmI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIG5vIGhpdCwgY2hlY2sgaWYgd2UgY29tZSBmcm9tIGEgcHJldmlvdXMgaGl0IHNvIHRoYXQgd2UgY2FuIGdvIGJhY2sgdG8gdGhlIGFyY1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaXQuaW50ZXJzZWN0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSBhbmdsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdzJseChjZW50ZXIueCArIGF1cmFfbGVuZ3RoICogTWF0aC5jb3MoYW5nbGUpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3Mmx5KGNlbnRlci55ICsgYXVyYV9sZW5ndGggKiBNYXRoLnNpbihhbmdsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBoaXQgLCBmaXJzdCBmaW5pc2ggYW55IG9uZ29pbmcgYXJjLCB0aGVuIG1vdmUgdG8gdGhlIGludGVyc2VjdGlvbiBwb2ludFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIHcybHIoYXVyYS52YWx1ZSksIGFyY19zdGFydCwgYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4dHJhWCA9IChzaGFwZV9oaXQudyAvIDQpICogTWF0aC5jb3MoYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHRyYVkgPSAoc2hhcGVfaGl0LmggLyA0KSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoIXNoYXBlX2hpdC5jb250YWlucyhoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgsIGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8odzJseChoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgpLCB3Mmx5KGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgdzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCAyICogTWF0aC5QSSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxtID0gdzJscihhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcclxuICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsIDAsIDAsIDApJyk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbiAgICAgICAgICAgICAgICAvLyBjdHguZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEpXCI7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vICoqKiogTWFuYWdlciBmb3Igd29ya2luZyB3aXRoIG11bHRpcGxlIGxheWVyc1xyXG5cclxuZXhwb3J0IGNsYXNzIExheWVyTWFuYWdlciB7XHJcbiAgICBsYXllcnM6IExheWVyW10gPSBbXTtcclxuICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICBzZWxlY3RlZExheWVyOiBzdHJpbmd8bnVsbCA9IG51bGw7XHJcblxyXG4gICAgVVVJRE1hcDogTWFwPHN0cmluZywgU2hhcGU+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIGdyaWRTaXplID0gNTA7XHJcbiAgICB1bml0U2l6ZSA9IDU7XHJcbiAgICB1c2VHcmlkID0gdHJ1ZTtcclxuICAgIGZ1bGxGT1cgPSBmYWxzZTtcclxuICAgIGZvd09wYWNpdHkgPSAwLjM7XHJcblxyXG4gICAgem9vbUZhY3RvciA9IDE7XHJcbiAgICBwYW5YID0gMDtcclxuICAgIHBhblkgPSAwO1xyXG5cclxuICAgIC8vIFJlZnJlc2ggaW50ZXJ2YWwgYW5kIHJlZHJhdyBzZXR0ZXIuXHJcbiAgICBpbnRlcnZhbCA9IDMwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBsbS5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGxtLmxheWVyc1tpXS5kcmF3KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLmludGVydmFsKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRPcHRpb25zKG9wdGlvbnMpOiB2b2lkIHtcclxuICAgICAgICBpZiAoXCJ1bml0U2l6ZVwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0VW5pdFNpemUob3B0aW9ucy51bml0U2l6ZSk7XHJcbiAgICAgICAgaWYgKFwidXNlR3JpZFwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0VXNlR3JpZChvcHRpb25zLnVzZUdyaWQpO1xyXG4gICAgICAgIGlmIChcImZ1bGxGT1dcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldEZ1bGxGT1cob3B0aW9ucy5mdWxsRk9XKTtcclxuICAgICAgICBpZiAoJ2Zvd09wYWNpdHknIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0Rk9XT3BhY2l0eShvcHRpb25zLmZvd09wYWNpdHkpO1xyXG4gICAgICAgIGlmIChcImZvd0NvbG91clwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmZvd0NvbG91cik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0V2lkdGgod2lkdGg6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmxheWVyc1tpXS5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmxheWVyc1tpXS53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTGF5ZXIobGF5ZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcclxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExheWVyID09PSBudWxsICYmIGxheWVyLnNlbGVjdGFibGUpIHRoaXMuc2VsZWN0ZWRMYXllciA9IGxheWVyLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TGF5ZXIobmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIG5hbWUgPSAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSA/IHRoaXMuc2VsZWN0ZWRMYXllciA6IG5hbWU7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMubGF5ZXJzW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3RvZG8gcmVuYW1lIHRvIHNlbGVjdExheWVyXHJcbiAgICBzZXRMYXllcihuYW1lKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoZm91bmQpIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDAuMztcclxuICAgICAgICAgICAgZWxzZSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAxLjA7XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbGF5ZXIubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbG0uc2VsZWN0ZWRMYXllciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEdyaWRMYXllcigpOiBMYXllciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXIoXCJncmlkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdHcmlkKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5nZXRHcmlkTGF5ZXIoKTtcclxuICAgICAgICBjb25zdCBjdHggPSBsYXllci5jdHg7XHJcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgICAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XHJcbiAgICAgICAgbGF5ZXIuY2xlYXIoKTtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIud2lkdGg7IGkgKz0gdGhpcy5ncmlkU2l6ZSAqIHopIHtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbyhpICsgKHBhblggJSB0aGlzLmdyaWRTaXplKSAqIHosIDApO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGkgKyAocGFuWCAlIHRoaXMuZ3JpZFNpemUpICogeiwgbGF5ZXIuaGVpZ2h0KTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbygwLCBpICsgKHBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHopO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGxheWVyLndpZHRoLCBpICsgKHBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHopO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gZ2FtZU1hbmFnZXIuZ3JpZENvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICBsYXllci52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgZm93bCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBmb3dsLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R3JpZFNpemUoZ3JpZFNpemU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGlmIChncmlkU2l6ZSAhPT0gdGhpcy5ncmlkU2l6ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmdyaWRTaXplID0gZ3JpZFNpemU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgJCgnI2dyaWRTaXplSW5wdXQnKS52YWwoZ3JpZFNpemUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRVbml0U2l6ZSh1bml0U2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHVuaXRTaXplICE9PSB0aGlzLnVuaXRTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdFNpemUgPSB1bml0U2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjdW5pdFNpemVJbnB1dCcpLnZhbCh1bml0U2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVzZUdyaWQodXNlR3JpZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh1c2VHcmlkICE9PSB0aGlzLnVzZUdyaWQpIHtcclxuICAgICAgICAgICAgdGhpcy51c2VHcmlkID0gdXNlR3JpZDtcclxuICAgICAgICAgICAgaWYgKHVzZUdyaWQpXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLnNob3coKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJCgnI2dyaWQtbGF5ZXInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICQoJyN1c2VHcmlkSW5wdXQnKS5wcm9wKFwiY2hlY2tlZFwiLCB1c2VHcmlkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RnVsbEZPVyhmdWxsRk9XOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGZ1bGxGT1cgIT09IHRoaXMuZnVsbEZPVykge1xyXG4gICAgICAgICAgICB0aGlzLmZ1bGxGT1cgPSBmdWxsRk9XO1xyXG4gICAgICAgICAgICBjb25zdCBmb3dsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgJCgnI3VzZUZPV0lucHV0JykucHJvcChcImNoZWNrZWRcIiwgZnVsbEZPVyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEZPV09wYWNpdHkoZm93T3BhY2l0eTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcclxuICAgICAgICBjb25zdCBmb3dsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGZvd2wuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgJCgnI2Zvd09wYWNpdHknKS52YWwoZm93T3BhY2l0eSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW52YWxpZGF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBsYXllci5nZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCBteCA9IG1vdXNlLng7XHJcbiAgICAgICAgY29uc3QgbXkgPSBtb3VzZS55O1xyXG5cclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIudG9vbHNbZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sXS5uYW1lID09PSAnc2VsZWN0Jykge1xyXG4gICAgICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIHRoZSBzZWxlY3Rpb25TdGFjayBhbGxvd3MgZm9yIGxvd3dlciBwb3NpdGlvbmVkIG9iamVjdHMgdGhhdCBhcmUgc2VsZWN0ZWQgdG8gaGF2ZSBwcmVjZWRlbmNlIGR1cmluZyBvdmVybGFwLlxyXG4gICAgICAgICAgICBsZXQgc2VsZWN0aW9uU3RhY2s7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzLmRhdGE7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzLmRhdGEuY29uY2F0KGxheWVyLnNlbGVjdGlvbik7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBzZWxlY3Rpb25TdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2hhcGUgPSBzZWxlY3Rpb25TdGFja1tpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvcm4gPSBzaGFwZS5nZXRDb3JuZXIobXgsIG15KTtcclxuICAgICAgICAgICAgICAgIGlmIChjb3JuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3NoYXBlXTtcclxuICAgICAgICAgICAgICAgICAgICBzaGFwZS5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnJlc2l6aW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5yZXNpemVkaXIgPSBjb3JuO1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25JbmZvKHNoYXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUuY29udGFpbnMobXgsIG15KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBzaGFwZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5pbmRleE9mKHNlbCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtzZWxdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZHJhZ2dpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmRyYWdvZmZ4ID0gbXggLSBzZWwueCAqIHo7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuZHJhZ29mZnkgPSBteSAtIHNlbC55ICogejtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5kcmFnb3JpZyA9IE9iamVjdC5hc3NpZ24oe30sIHNlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0aW9uSW5mbyhzaGFwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIWhpdCkge1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbkxvc3MoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3RpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uU3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIgPSBuZXcgUmVjdChsYXllci5zZWxlY3Rpb25TdGFydFBvaW50LngsIGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQueSwgMCwgMCwgXCJyZ2JhKDAsMCwwLDApXCIsIFwiYmxhY2tcIik7XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuYWRkU2hhcGUobGF5ZXIuc2VsZWN0aW9uSGVscGVyLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoZ2FtZU1hbmFnZXIudG9vbHNbZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sXS5uYW1lID09PSAncGFuJykge1xyXG4gICAgICAgICAgICBsYXllci5wYW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgbGF5ZXIuZHJhZ29mZnggPSBteDtcclxuICAgICAgICAgICAgbGF5ZXIuZHJhZ29mZnkgPSBteTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBsYXllci5nZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgaWYgKGxheWVyLnNlbGVjdGluZykge1xyXG4gICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uU3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gbGF5ZXIuc2VsZWN0aW9uU3RhcnRQb2ludC54KTtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gbGF5ZXIuc2VsZWN0aW9uU3RhcnRQb2ludC55KTtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLnggPSBNYXRoLm1pbihsYXllci5zZWxlY3Rpb25TdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIueSA9IE1hdGgubWluKGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5wYW5uaW5nKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YICs9IE1hdGgucm91bmQoKG1vdXNlLnggLSBsYXllci5kcmFnb2ZmeCkgLyB6KTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgKz0gTWF0aC5yb3VuZCgobW91c2UueSAtIGxheWVyLmRyYWdvZmZ5KSAvIHopO1xyXG4gICAgICAgICAgICBsYXllci5kcmFnb2ZmeCA9IG1vdXNlLng7XHJcbiAgICAgICAgICAgIGxheWVyLmRyYWdvZmZ5ID0gbW91c2UueTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2dYID0gbGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS54ICogejtcclxuICAgICAgICAgICAgY29uc3Qgb2dZID0gbGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS55ICogejtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoc2VsIGluc3RhbmNlb2YgUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZHggPSBtb3VzZS54IC0gKG9nWCArIGxheWVyLmRyYWdvZmZ4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGR5ID0gbW91c2UueSAtIChvZ1kgKyBsYXllci5kcmFnb2ZmeSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuZHJhZ2dpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWwueCArPSBkeCAvIHo7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnkgKz0gZHkgLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXllci5uYW1lICE9PSAnZm93Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIHVzZSB0aGUgYWJvdmUgdXBkYXRlZCB2YWx1ZXMgZm9yIHRoZSBib3VuZGluZyBib3ggY2hlY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIGJvdW5kaW5nIGJveGVzIG92ZXJsYXAgdG8gc3RvcCBjbG9zZSAvIHByZWNpc2UgbW92ZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJsb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBibG9ja2VycyA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuZmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4gbWIgIT09IHNlbC51dWlkICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChtYikuZ2V0Qm91bmRpbmdCb3goKS5pbnRlcnNlY3RzV2l0aChiYm94KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChibG9ja2Vycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgYSBsaW5lIGZyb20gc3RhcnQgdG8gZW5kIHBvc2l0aW9uIGFuZCBzZWUgZm9yIGFueSBpbnRlcnNlY3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgc3RvcHMgc3VkZGVuIGxlYXBzIG92ZXIgd2FsbHMhIGNoZWVreSBidWdnZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0ge3N0YXJ0OiB7eDogb2dYIC8geiwgeTogb2dZIC8gen0sIGVuZDoge3g6IHNlbC54LCB5OiBzZWwueX19O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tlZCA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc29tZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KG1iKS5nZXRCb3VuZGluZ0JveCgpLmdldEludGVyc2VjdFdpdGhMaW5lKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWIgIT09IHNlbC51dWlkICYmIGludGVyLmludGVyc2VjdCAhPT0gbnVsbCAmJiBpbnRlci5kaXN0YW5jZSA+IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggLT0gZHggLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgLT0gZHkgLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IGxheWVyLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2VsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnJlc2l6aW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLnJlc2l6ZWRpciA9PT0gJ253Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IHcybHgoc2VsLngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSB3Mmx5KHNlbC55KSArIHNlbC5oICogeiAtIG1vdXNlLnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gbDJ3eChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBsMnd5KG1vdXNlLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGF5ZXIucmVzaXplZGlyID09PSAnbmUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gbW91c2UueCAtIHcybHgoc2VsLngpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IHcybHkoc2VsLnkpICsgc2VsLmggKiB6IC0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBsMnd5KG1vdXNlLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGF5ZXIucmVzaXplZGlyID09PSAnc2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gbW91c2UueCAtIHcybHgoc2VsLngpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IG1vdXNlLnkgLSB3Mmx5KHNlbC55KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnJlc2l6ZWRpciA9PT0gJ3N3Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IHcybHgoc2VsLngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gdzJseShzZWwueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gbDJ3eChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgLz0gejtcclxuICAgICAgICAgICAgICAgICAgICBzZWwuaCAvPSB6O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IGxheWVyLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2VsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJud1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwibnctcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJuZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwibmUtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJzZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic2UtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJzd1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic3ctcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW5nKSB7XHJcbiAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb25TdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBsYXllci5zaGFwZXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlID09PSBsYXllci5zZWxlY3Rpb25IZWxwZXIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBzaGFwZS5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb25IZWxwZXIueCA8PSBiYm94LnggKyBiYm94LncgJiZcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIueCArIGxheWVyLnNlbGVjdGlvbkhlbHBlci53ID49IGJib3gueCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbkhlbHBlci55IDw9IGJib3gueSArIGJib3guaCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbkhlbHBlci55ICsgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLmggPj0gYmJveC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2goc2hhcGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1c2ggdGhlIHNlbGVjdGlvbiBoZWxwZXIgYXMgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgc2VsZWN0aW9uXHJcbiAgICAgICAgICAgIC8vIFRoaXMgbWFrZXMgc3VyZSB0aGF0IGl0IHdpbGwgYmUgdGhlIGZpcnN0IG9uZSB0byBiZSBoaXQgaW4gdGhlIGhpdCBkZXRlY3Rpb24gb25Nb3VzZURvd25cclxuICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2gobGF5ZXIuc2VsZWN0aW9uSGVscGVyKTtcclxuXHJcbiAgICAgICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKGxheWVyLnNlbGVjdGlvbkhlbHBlciwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uU3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5wYW5uaW5nKSB7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICAgICAgcGFuWDogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblgsXHJcbiAgICAgICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoc2VsIGluc3RhbmNlb2YgUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLmRyYWdnaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW91c2UgPSB7eDogc2VsLnggKyBzZWwudyAvIDIsIHk6IHNlbC55ICsgc2VsLmggLyAyfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXggPSBtb3VzZS54O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc2VsLncgLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwueCA9IE1hdGgucm91bmQobXggLyBncykgKiBncyAtIHNlbC53IC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gKE1hdGgucm91bmQoKG14ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHNlbC53IC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHNlbC5oIC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBNYXRoLnJvdW5kKG15IC8gZ3MpICogZ3MgLSBzZWwuaCAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IChNYXRoLnJvdW5kKChteSArIChncyAvIDIpKSAvIGdzKSAtICgxIC8gMikpICogZ3MgLSBzZWwuaCAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLmRyYWdvcmlnLnggIT09IHNlbC54IHx8IGxheWVyLmRyYWdvcmlnLnkgIT09IHNlbC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IGxheWVyLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2VsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIucmVzaXppbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLncgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ICs9IHNlbC53O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IE1hdGguYWJzKHNlbC53KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC5oIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSArPSBzZWwuaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLmFicyhzZWwuaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gTWF0aC5yb3VuZChzZWwueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IE1hdGgucm91bmQoc2VsLnkgLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gbGF5ZXIuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2VsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXllci5kcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIGxheWVyLnJlc2l6aW5nID0gZmFsc2U7XHJcbiAgICAgICAgbGF5ZXIucGFubmluZyA9IGZhbHNlO1xyXG4gICAgICAgIGxheWVyLnNlbGVjdGluZyA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ29udGV4dE1lbnUoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBsYXllci5nZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCBteCA9IG1vdXNlLng7XHJcbiAgICAgICAgY29uc3QgbXkgPSBtb3VzZS55O1xyXG4gICAgICAgIGxldCBoaXQgPSBmYWxzZTtcclxuICAgICAgICBsYXllci5zaGFwZXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBpZiAoIWhpdCAmJiBzaGFwZS5jb250YWlucyhteCwgbXkpKSB7XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5zaG93Q29udGV4dE1lbnUobW91c2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgc29ja2V0IGZyb20gJy4vc29ja2V0J1xyXG5pbXBvcnQge2wyd30gZnJvbSBcIi4vdW5pdHNcIjtcclxuaW1wb3J0IHtBc3NldCwgY3JlYXRlU2hhcGVGcm9tRGljdH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcbmltcG9ydCB7RHJhd1Rvb2wsIFJ1bGVyVG9vbCwgTWFwVG9vbCwgRk9XVG9vbCwgSW5pdGlhdGl2ZVRyYWNrZXJ9IGZyb20gXCIuL3Rvb2xzXCI7XHJcbmltcG9ydCB7TGF5ZXJNYW5hZ2VyLCBMYXllciwgR3JpZExheWVyLCBGT1dMYXllcn0gZnJvbSBcIi4vbGF5ZXJzXCI7XHJcblxyXG5jbGFzcyBHYW1lTWFuYWdlciB7XHJcbiAgICBJU19ETSA9IGZhbHNlO1xyXG4gICAgdXNlcm5hbWU6IHN0cmluZztcclxuICAgIGJvYXJkX2luaXRpYWxpc2VkID0gZmFsc2U7XHJcbiAgICBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICBzZWxlY3RlZFRvb2wgPSAwO1xyXG4gICAgdG9vbHM7XHJcbiAgICBydWxlclRvb2wgPSBuZXcgUnVsZXJUb29sKCk7XHJcbiAgICBkcmF3VG9vbCA9IG5ldyBEcmF3VG9vbCgpO1xyXG4gICAgZm93VG9vbCA9IG5ldyBGT1dUb29sKCk7XHJcbiAgICBtYXBUb29sID0gbmV3IE1hcFRvb2woKTtcclxuICAgIGxpZ2h0c291cmNlcyA9IFtdO1xyXG4gICAgbGlnaHRibG9ja2VycyA9IFtdO1xyXG4gICAgbW92ZW1lbnRibG9ja2VycyA9IFtdO1xyXG4gICAgZ3JpZENvbG91ciA9ICQoXCIjZ3JpZENvbG91clwiKTtcclxuICAgIGZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xyXG4gICAgaW5pdGlhdGl2ZVRyYWNrZXIgPSBuZXcgSW5pdGlhdGl2ZVRyYWNrZXIoKTtcclxuICAgIHNoYXBlU2VsZWN0aW9uRGlhbG9nID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9KTtcclxuICAgIGluaXRpYXRpdmVEaWFsb2cgPSAkKFwiI2luaXRpYXRpdmVkaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICcxNjBweCdcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2JhKDI1NSwwLDAsIDAuNSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsnZ3JpZENvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmZvd0NvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmdiKDgyLCA4MSwgODEpXCIsXHJcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAobCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5zaGFwZXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5maWxsID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsnZm93Q29sb3VyJzogY29sb3VyLnRvUmdiU3RyaW5nKCl9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNldHVwQm9hcmQocm9vbSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcigpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyc2RpdiA9ICQoJyNsYXllcnMnKTtcclxuICAgICAgICBsYXllcnNkaXYuZW1wdHkoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNlbGVjdGRpdiA9ICQoJyNsYXllcnNlbGVjdCcpO1xyXG4gICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoXCJ1bFwiKS5lbXB0eSgpO1xyXG4gICAgICAgIGxldCBzZWxlY3RhYmxlX2xheWVycyA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxtID0gJChcIiNsb2NhdGlvbnMtbWVudVwiKS5maW5kKFwiZGl2XCIpO1xyXG4gICAgICAgIGxtLmNoaWxkcmVuKCkub2ZmKCk7XHJcbiAgICAgICAgbG0uZW1wdHkoKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb20ubG9jYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYyA9ICQoXCI8ZGl2PlwiICsgcm9vbS5sb2NhdGlvbnNbaV0gKyBcIjwvZGl2PlwiKTtcclxuICAgICAgICAgICAgbG0uYXBwZW5kKGxvYyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxtcGx1cyA9ICQoJzxkaXY+PGkgY2xhc3M9XCJmYXMgZmEtcGx1c1wiPjwvaT48L2Rpdj4nKTtcclxuICAgICAgICBsbS5hcHBlbmQobG1wbHVzKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jbmFtZSA9IHByb21wdChcIk5ldyBsb2NhdGlvbiBuYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvY25hbWUgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJuZXcgbG9jYXRpb25cIiwgbG9jbmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcImNoYW5nZSBsb2NhdGlvblwiLCBlLnRhcmdldC50ZXh0Q29udGVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmJvYXJkLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBuZXdfbGF5ZXIgPSByb29tLmJvYXJkLmxheWVyc1tpXTtcclxuICAgICAgICAgICAgLy8gVUkgY2hhbmdlc1xyXG4gICAgICAgICAgICBsYXllcnNkaXYuYXBwZW5kKFwiPGNhbnZhcyBpZD0nXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiLWxheWVyJyBzdHlsZT0nei1pbmRleDogXCIgKyBpICsgXCInPjwvY2FudmFzPlwiKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5zZWxlY3RhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXh0cmEgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RhYmxlX2xheWVycyA9PT0gMCkgZXh0cmEgPSBcIiBjbGFzcz0nbGF5ZXItc2VsZWN0ZWQnXCI7XHJcbiAgICAgICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKCd1bCcpLmFwcGVuZChcIjxsaSBpZD0nc2VsZWN0LVwiICsgbmV3X2xheWVyLm5hbWUgKyBcIidcIiArIGV4dHJhICsgXCI+PGEgaHJlZj0nIyc+XCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZV9sYXllcnMgKz0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+JCgnIycgKyBuZXdfbGF5ZXIubmFtZSArICctbGF5ZXInKVswXTtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIFN0YXRlIGNoYW5nZXNcclxuICAgICAgICAgICAgbGV0IGw7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuZ3JpZClcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgR3JpZExheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChuZXdfbGF5ZXIubmFtZSA9PT0gJ2ZvdycpXHJcbiAgICAgICAgICAgICAgICBsID0gbmV3IEZPV0xheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBsID0gbmV3IExheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xyXG4gICAgICAgICAgICBsLnNlbGVjdGFibGUgPSBuZXdfbGF5ZXIuc2VsZWN0YWJsZTtcclxuICAgICAgICAgICAgbC5wbGF5ZXJfZWRpdGFibGUgPSBuZXdfbGF5ZXIucGxheWVyX2VkaXRhYmxlO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuYWRkTGF5ZXIobCk7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuZ3JpZCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKG5ld19sYXllci5zaXplKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNncmlkLWxheWVyXCIpLmRyb3BwYWJsZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0OiBcIi5kcmFnZ2FibGVcIixcclxuICAgICAgICAgICAgICAgICAgICBkcm9wOiBmdW5jdGlvbiAoZXZlbnQ6IE1vdXNlRXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gJChsLmNhbnZhcykub2Zmc2V0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB1aS5vZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogdWkub2Zmc2V0LnRvcCAtIG9mZnNldC50b3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnggPCBzZXR0aW5nc19tZW51LndpZHRoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbnNfbWVudS5pcyhcIjp2aXNpYmxlXCIpICYmIGxvYy55IDwgbG9jYXRpb25zX21lbnUud2lkdGgoKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lkdGggPSB1aS5oZWxwZXJbMF0ud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCA9IHVpLmhlbHBlclswXS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdsb2MgPSBsMncobG9jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1nID0gPEhUTUxJbWFnZUVsZW1lbnQ+dWkuZHJhZ2dhYmxlWzBdLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldChpbWcsIHdsb2MueCwgd2xvYy55LCBpbWcud2lkdGgsIGltZy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5zcmMgPSBpbWcuc3JjO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFldmVudC5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQueCA9IE1hdGgucm91bmQoYXNzZXQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQueSA9IE1hdGgucm91bmQoYXNzZXQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQudyA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbC5hZGRTaGFwZShhc3NldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsLnNldFNoYXBlcyhuZXdfbGF5ZXIuc2hhcGVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb3JjZSB0aGUgY29ycmVjdCBvcGFjaXR5IHJlbmRlciBvbiBvdGhlciBsYXllcnMuXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpLm5hbWUpO1xyXG4gICAgICAgIC8vIHNvY2tldC5lbWl0KFwiY2xpZW50IGluaXRpYWxpc2VkXCIpO1xyXG4gICAgICAgIHRoaXMuYm9hcmRfaW5pdGlhbGlzZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPiAxKSB7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoXCJsaVwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmlkLnNwbGl0KFwiLVwiKVsxXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9sZCA9IGxheWVyc2VsZWN0ZGl2LmZpbmQoXCIjc2VsZWN0LVwiICsgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgIT09IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImxheWVyLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9sZC5yZW1vdmVDbGFzcyhcImxheWVyLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRMYXllcihuYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRTaGFwZShzaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpLCBmYWxzZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVNoYXBlKHNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlLCB0cnVlKSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikub25TaGFwZU1vdmUoc2hhcGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZVNoYXBlKGRhdGEpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSwgY3JlYXRlU2hhcGVGcm9tRGljdChkYXRhLnNoYXBlLCB0cnVlKSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChkYXRhLnJlZHJhdylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoZGF0YS5zaGFwZS5sYXllcikuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SW5pdGlhdGl2ZShkYXRhKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5kYXRhID0gZGF0YTtcclxuICAgICAgICB0aGlzLmluaXRpYXRpdmVUcmFja2VyLnJlZHJhdygpO1xyXG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENsaWVudE9wdGlvbnMob3B0aW9ucyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChcImdyaWRDb2xvdXJcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLmdyaWRDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5ncmlkQ29sb3VyKTtcclxuICAgICAgICBpZiAoXCJmb3dDb2xvdXJcIiBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXCJwYW5YXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIucGFuWCA9IG9wdGlvbnMucGFuWDtcclxuICAgICAgICBpZiAoXCJwYW5ZXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIucGFuWSA9IG9wdGlvbnMucGFuWTtcclxuICAgICAgICBpZiAoXCJ6b29tRmFjdG9yXCIgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gb3B0aW9ucy56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAkKFwiI3pvb21lclwiKS5zbGlkZXIoe3ZhbHVlOiAxIC8gb3B0aW9ucy56b29tRmFjdG9yfSk7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldEdyaWRMYXllcigpLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmxldCBnYW1lTWFuYWdlciA9IG5ldyBHYW1lTWFuYWdlcigpO1xyXG5cclxuLy8gKioqKiBTRVRVUCBVSSAqKioqXHJcblxyXG4vLyBwcmV2ZW50IGRvdWJsZSBjbGlja2luZyB0ZXh0IHNlbGVjdGlvblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlckRvd24oZSkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgZS50YXJnZXQudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgICRtZW51LmhpZGUoKTtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzW2dhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbF0uZnVuYy5vbk1vdXNlRG93bihlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyTW92ZShlKSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCBlLnRhcmdldC50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHNbZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sXS5mdW5jLm9uTW91c2VNb3ZlKGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJVcChlKSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCBlLnRhcmdldC50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHNbZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sXS5mdW5jLm9uTW91c2VVcChlKTtcclxufVxyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgb25Qb2ludGVyRG93bik7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uUG9pbnRlck1vdmUpO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Qb2ludGVyVXApO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmIChlLmJ1dHRvbiAhPT0gMiB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHNbZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sXS5mdW5jLm9uQ29udGV4dE1lbnUoZSk7XHJcbn0pO1xyXG5cclxuJChcIiN6b29tZXJcIikuc2xpZGVyKHtcclxuICAgIG9yaWVudGF0aW9uOiBcInZlcnRpY2FsXCIsXHJcbiAgICBtaW46IDAuNSxcclxuICAgIG1heDogNS4wLFxyXG4gICAgc3RlcDogMC4xLFxyXG4gICAgdmFsdWU6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yLFxyXG4gICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICBjb25zdCBvcmlnWiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IG5ld1ogPSAxIC8gdWkudmFsdWU7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG9yaWdaO1xyXG4gICAgICAgIGNvbnN0IG5ld1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG5ld1o7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gbmV3WjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvciA9IG5ld1o7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblggLT0gKG9yaWdYIC0gbmV3WCkgLyAyO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZIC09IChvcmlnWSAtIG5ld1kpIC8gMjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICB6b29tRmFjdG9yOiBuZXdaLFxyXG4gICAgICAgICAgICBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCxcclxuICAgICAgICAgICAgcGFuWTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhbllcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG4kbWVudS5oaWRlKCk7XHJcblxyXG5jb25zdCBzZXR0aW5nc19tZW51ID0gJChcIiNtZW51XCIpO1xyXG5jb25zdCBsb2NhdGlvbnNfbWVudSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIik7XHJcbmNvbnN0IGxheWVyX21lbnUgPSAkKFwiI2xheWVyc2VsZWN0XCIpO1xyXG4kKFwiI3NlbGVjdGlvbi1tZW51XCIpLmhpZGUoKTtcclxuXHJcbiQoJyNybS1zZXR0aW5ncycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gb3JkZXIgb2YgYW5pbWF0aW9uIGlzIGltcG9ydGFudCwgaXQgb3RoZXJ3aXNlIHdpbGwgc29tZXRpbWVzIHNob3cgYSBzbWFsbCBnYXAgYmV0d2VlbiB0aGUgdHdvIG9iamVjdHNcclxuICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoe2xlZnQ6IFwiLT0yMDBweFwifSk7XHJcbiAgICAgICAgc2V0dGluZ3NfbWVudS5hbmltYXRlKHt3aWR0aDogJ3RvZ2dsZSd9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHtsZWZ0OiBcIi09MjAwcHhcIiwgd2lkdGg6IFwiKz0yMDBweFwifSk7XHJcbiAgICAgICAgbGF5ZXJfbWVudS5hbmltYXRlKHtsZWZ0OiBcIi09MjAwcHhcIn0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzZXR0aW5nc19tZW51LmFuaW1hdGUoe3dpZHRoOiAndG9nZ2xlJ30pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7bGVmdDogXCIrPTIwMHB4XCJ9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHtsZWZ0OiBcIis9MjAwcHhcIiwgd2lkdGg6IFwiLT0yMDBweFwifSk7XHJcbiAgICAgICAgbGF5ZXJfbWVudS5hbmltYXRlKHtsZWZ0OiBcIis9MjAwcHhcIn0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoJyNybS1sb2NhdGlvbnMnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG9yZGVyIG9mIGFuaW1hdGlvbiBpcyBpbXBvcnRhbnQsIGl0IG90aGVyd2lzZSB3aWxsIHNvbWV0aW1lcyBzaG93IGEgc21hbGwgZ2FwIGJldHdlZW4gdGhlIHR3byBvYmplY3RzXHJcbiAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7dG9wOiBcIi09MTAwcHhcIn0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoe2hlaWdodDogJ3RvZ2dsZSd9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7aGVpZ2h0OiAndG9nZ2xlJ30pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7dG9wOiBcIis9MTAwcHhcIn0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRXaWR0aCh3aW5kb3cuaW5uZXJXaWR0aCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0SGVpZ2h0KHdpbmRvdy5pbm5lckhlaWdodCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5cclxuJCgnYm9keScpLmtleXVwKGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAoZS5rZXlDb2RlID09PSA0NiAmJiBlLnRhcmdldC50YWdOYW1lICE9PSBcIklOUFVUXCIpIHtcclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICAgICAgbC5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgIGwucmVtb3ZlU2hhcGUoc2VsLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoc2VsLnV1aWQsIHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoXCIjZ3JpZFNpemVJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgZ3MgPSBwYXJzZUludCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBncmlkc2l6ZVwiLCBncyk7XHJcbn0pO1xyXG5cclxuJChcIiN1bml0U2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1cyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVuaXRTaXplKHVzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7J3VuaXRTaXplJzogdXN9KTtcclxufSk7XHJcbiQoXCIjdXNlR3JpZElucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1ZyA9ICg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRVc2VHcmlkKHVnKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7J3VzZUdyaWQnOiB1Z30pO1xyXG59KTtcclxuJChcIiN1c2VGT1dJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWYgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0RnVsbEZPVyh1Zik7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeydmdWxsRk9XJzogdWZ9KTtcclxufSk7XHJcbiQoXCIjZm93T3BhY2l0eVwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgbGV0IGZvID0gcGFyc2VGbG9hdCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGlmIChpc05hTihmbykpIHtcclxuICAgICAgICAkKFwiI2Zvd09wYWNpdHlcIikudmFsKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mb3dPcGFjaXR5KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoZm8gPCAwKSBmbyA9IDA7XHJcbiAgICBpZiAoZm8gPiAxKSBmbyA9IDE7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0Rk9XT3BhY2l0eShmbyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeydmb3dPcGFjaXR5JzogZm99KTtcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lTWFuYWdlcjsiLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuL3NvY2tldFwiO1xyXG5pbXBvcnQge3V1aWR2NH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHtnZXRMaW5lc0ludGVyc2VjdFBvaW50LCBnZXRQb2ludERpc3RhbmNlfSBmcm9tIFwiLi9nZW9tXCI7XHJcbmltcG9ydCB7bDJ3eCwgbDJ3eSwgdzJsLCB3MmxyLCB3Mmx4LCB3Mmx5fSBmcm9tIFwiLi91bml0c1wiO1xyXG5cclxuY29uc3QgJG1lbnUgPSAkKCcjY29udGV4dE1lbnUnKTtcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaGFwZSB7XHJcbiAgICB0eXBlOiBzdHJpbmc7XHJcbiAgICB1dWlkOiBzdHJpbmc7XHJcbiAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHN0cmluZztcclxuICAgIGZpbGw6IHN0cmluZztcclxuICAgIGxheWVyID0gbnVsbDtcclxuICAgIG5hbWUgPSAnVW5rbm93biBzaGFwZSc7XHJcbiAgICB0cmFja2VycyA9IFtdO1xyXG4gICAgYXVyYXMgPSBbXTtcclxuICAgIG93bmVycyA9IFtdO1xyXG4gICAgdmlzaW9uT2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuICAgIG1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih1dWlkPykge1xyXG4gICAgICAgIHRoaXMudXVpZCA9IHV1aWQgfHwgdXVpZHY0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0O1xyXG5cclxuICAgIGFic3RyYWN0IGNvbnRhaW5zKHg6IG51bWJlciwgeTogbnVtYmVyLCBpbldvcmxkQ29vcmQ6IGJvb2xlYW4pOiBib29sZWFuO1xyXG5cclxuICAgIGFic3RyYWN0IGNlbnRlcihjZW50ZXJQb2ludD8pO1xyXG5cclxuICAgIGNoZWNrTGlnaHRTb3VyY2VzKCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnN0IHZvX2kgPSBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmluZGV4T2YodGhpcy51dWlkKTtcclxuICAgICAgICBpZiAodGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgdm9faSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGxpZ2h0c291cmNlIGF1cmFzIGFyZSBpbiB0aGUgZ2FtZU1hbmFnZXJcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgICAgICBjb25zdCBpID0gbHMuZmluZEluZGV4KG8gPT4gby5hdXJhID09PSBhdS51dWlkKTtcclxuICAgICAgICAgICAgaWYgKGF1LmxpZ2h0U291cmNlICYmIGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBscy5wdXNoKHtzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1LmxpZ2h0U291cmNlICYmIGkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgbHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55dGhpbmcgaW4gdGhlIGdhbWVNYW5hZ2VyIHJlZmVyZW5jaW5nIHRoaXMgc2hhcGUgaXMgaW4gZmFjdCBzdGlsbCBhIGxpZ2h0c291cmNlXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlc1tpXTtcclxuICAgICAgICAgICAgaWYgKGxzLnNoYXBlID09PSBzZWxmLnV1aWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5zb21lKGEgPT4gYS51dWlkID09PSBscy5hdXJhICYmIGEubGlnaHRTb3VyY2UpKVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TW92ZW1lbnRCbG9jayhibG9ja3NNb3ZlbWVudCkge1xyXG4gICAgICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGJsb2Nrc01vdmVtZW50IHx8IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IHZvX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmluZGV4T2YodGhpcy51dWlkKTtcclxuICAgICAgICBpZiAodGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgICAgICBlbHNlIGlmICghdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2Uodm9faSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3duZWRCeSh1c2VybmFtZT8pIHtcclxuICAgICAgICBpZiAodXNlcm5hbWUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdXNlcm5hbWUgPSBnYW1lTWFuYWdlci51c2VybmFtZTtcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIuSVNfRE0gfHwgdGhpcy5vd25lcnMuaW5jbHVkZXModXNlcm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0aW9uKCkge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFja2Vycy5sZW5ndGggfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpXHJcbiAgICAgICAgICAgIHRoaXMudHJhY2tlcnMucHVzaCh7dXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogJycsIG1heHZhbHVlOiAnJywgdmlzaWJsZTogZmFsc2V9KTtcclxuICAgICAgICBpZiAoIXRoaXMuYXVyYXMubGVuZ3RoIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0udmFsdWUgIT09ICcnKVxyXG4gICAgICAgICAgICB0aGlzLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogdXVpZHY0KCksXHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcclxuICAgICAgICAgICAgICAgIGRpbTogJycsXHJcbiAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBjb2xvdXI6ICdyZ2JhKDAsMCwwLDApJyxcclxuICAgICAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW5hbWVcIikudGV4dCh0aGlzLm5hbWUpO1xyXG4gICAgICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzZWxlY3Rpb24tdHJhY2tlcnNcIik7XHJcbiAgICAgICAgdHJhY2tlcnMuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLnRyYWNrZXJzLmZvckVhY2goZnVuY3Rpb24gKHRyYWNrZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPiR7dHJhY2tlci5uYW1lfTwvZGl2PmApKTtcclxuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChgPGRpdiBpZD1cInNlbGVjdGlvbi10cmFja2VyLSR7dHJhY2tlci51dWlkfS12YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIGNsYXNzPVwic2VsZWN0aW9uLXRyYWNrZXItdmFsdWVcIj4ke3ZhbH08L2Rpdj5gKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGF1cmFzID0gJChcIiNzZWxlY3Rpb24tYXVyYXNcIik7XHJcbiAgICAgICAgYXVyYXMuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1cmEpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXVyYS5kaW0gPyBgJHthdXJhLnZhbHVlfS8ke2F1cmEuZGltfWAgOiBhdXJhLnZhbHVlO1xyXG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+JHthdXJhLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLWF1cmEtJHthdXJhLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tYXVyYS12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbWVudVwiKS5zaG93KCk7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3QgZWRpdGJ1dHRvbiA9ICQoXCIjc2VsZWN0aW9uLWVkaXQtYnV0dG9uXCIpO1xyXG4gICAgICAgIGlmICghdGhpcy5vd25lZEJ5KCkpXHJcbiAgICAgICAgICAgIGVkaXRidXR0b24uaGlkZSgpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWRpdGJ1dHRvbi5zaG93KCk7XHJcbiAgICAgICAgZWRpdGJ1dHRvbi5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbChzZWxmLnV1aWQpO1xyXG4gICAgICAgICAgICBjb25zdCBkaWFsb2dfbmFtZSA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbmFtZVwiKTtcclxuICAgICAgICAgICAgZGlhbG9nX25hbWUudmFsKHNlbGYubmFtZSk7XHJcbiAgICAgICAgICAgIGRpYWxvZ19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgcy5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZX0pXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBkaWFsb2dfbGlnaHRibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbGlnaHRibG9ja2VyXCIpO1xyXG4gICAgICAgICAgICBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLnZpc2lvbk9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgZGlhbG9nX2xpZ2h0YmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgIHMudmlzaW9uT2JzdHJ1Y3Rpb24gPSBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgICAgIHMuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpYWxvZ19tb3ZlYmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW1vdmVibG9ja2VyXCIpO1xyXG4gICAgICAgICAgICBkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgICAgIGRpYWxvZ19tb3ZlYmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgIHMuc2V0TW92ZW1lbnRCbG9jayhkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvd25lcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW93bmVyc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXRyYWNrZXJzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhcyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctYXVyYXNcIik7XHJcbiAgICAgICAgICAgIG93bmVycy5uZXh0VW50aWwodHJhY2tlcnMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5uZXh0VW50aWwoYXVyYXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBhdXJhcy5uZXh0VW50aWwoJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5maW5kKFwiZm9ybVwiKSkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRPd25lcihvd25lcikge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3dfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtbmFtZT1cIiR7b3duZXJ9XCIgdmFsdWU9XCIke293bmVyfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG93X3JlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyYWNrZXJzLmJlZm9yZShvd19uYW1lLmFkZChvd19yZW1vdmUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBvd19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvd19pID49IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxLCAkKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnB1c2goJCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkT3duZXIoXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBvd19yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3cgPSBzZWxmLm93bmVycy5maW5kKG8gPT4gby51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5zcGxpY2Uoc2VsZi5vd25lcnMuaW5kZXhPZihvdyksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5vd25lcnMuZm9yRWFjaChhZGRPd25lcik7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi5vd25lcnMubGVuZ3RoIHx8IHNlbGYub3duZXJzW3NlbGYub3duZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYub3duZXJzW3NlbGYub3duZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAnJylcclxuICAgICAgICAgICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkVHJhY2tlcih0cmFja2VyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci52YWx1ZX1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyX21heHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiTWF4IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubWF4dmFsdWUgfHwgXCJcIn1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1cmFzLmJlZm9yZShcclxuICAgICAgICAgICAgICAgICAgICB0cl9uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQodHJfdmFsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQodHJfbWF4dmFsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl92aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl9yZW1vdmUpXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghdHJhY2tlci52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdHIubmFtZSA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi50cmFja2Vycy5sZW5ndGggfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5wdXNoKHt1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAnJywgbWF4dmFsdWU6ICcnLCB2aXNpYmxlOiBmYWxzZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRUcmFja2VyKHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0cl92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdHIudmFsdWUgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRyX21heHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB0ci5tYXh2YWx1ZSA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdHJfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyLm5hbWUgPT09ICcnIHx8IHRyLnZhbHVlID09PSAnJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHt0ci51dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnNwbGljZShzZWxmLnRyYWNrZXJzLmluZGV4T2YodHIpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZX0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0cl92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdHIudmlzaWJsZSA9ICF0ci52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWV9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnRyYWNrZXJzLmZvckVhY2goYWRkVHJhY2tlcik7XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRBdXJhKGF1cmEpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLm5hbWV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS52YWx1ZX1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfZGltdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJEaW0gdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS5kaW0gfHwgXCJcIn1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfY29sb3VyID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJBdXJhIGNvbG91clwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX2xpZ2h0ID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1saWdodGJ1bGJcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgICAgICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuY2hpbGRyZW4oKS5sYXN0KCkuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgIGF1cmFfbmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmFsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYXVyYV9kaW12YWwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj5gKS5hcHBlbmQoYXVyYV9jb2xvdXIpLmFwcGVuZCgkKFwiPC9kaXY+XCIpKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX3Zpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYXVyYV9saWdodClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX3JlbW92ZSlcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFhdXJhLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgYXVyYV92aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIGlmICghYXVyYS5saWdodFNvdXJjZSlcclxuICAgICAgICAgICAgICAgICAgICBhdXJhX2xpZ2h0LmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhdXJhX2NvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogYXVyYS5jb2xvdXIsXHJcbiAgICAgICAgICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEbyBub3QgdXNlIGF1cmEgZGlyZWN0bHkgYXMgaXQgZG9lcyBub3Qgd29yayBwcm9wZXJseSBmb3IgbmV3IGF1cmFzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYXVyYV9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF1Lm5hbWUgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LW5hbWVgKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5sZW5ndGggfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hdXJhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaW06ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXVyYV92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXUudmFsdWUgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihhdS5sYXllcikuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGF1cmFfZGltdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF1LmRpbSA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKGF1LmxheWVyKS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXVyYV9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXUubmFtZSA9PT0gJycgJiYgYXUudmFsdWUgPT09ICcnKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke2F1LnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXVyYXMuc3BsaWNlKHNlbGYuYXVyYXMuaW5kZXhPZihhdSksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKGF1LmxheWVyKS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXVyYV92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXUudmlzaWJsZSA9ICFhdS52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdS52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWV9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXVyYV9saWdodC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF1LmxpZ2h0U291cmNlID0gIWF1LmxpZ2h0U291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdS5saWdodFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbHMucHVzaCh7c2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3dsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvd2wuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5hdXJhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLnNoYXBlU2VsZWN0aW9uRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnLnNlbGVjdGlvbi10cmFja2VyLXZhbHVlJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICAgICAgY29uc3QgdHJhY2tlciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld190cmFja2VyID0gcHJvbXB0KGBOZXcgICR7dHJhY2tlci5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgICAgICBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSArPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSAtPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VyLnZhbHVlID0gcGFyc2VJbnQobmV3X3RyYWNrZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgICAgICQodGhpcykudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZX0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJy5zZWxlY3Rpb24tYXVyYS12YWx1ZScpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1cmEgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgICAgICBjb25zdCBuZXdfYXVyYSA9IHByb21wdChgTmV3ICAke2F1cmEubmFtZX0gdmFsdWU6IChhYnNvbHV0ZSBvciByZWxhdGl2ZSlgKTtcclxuICAgICAgICAgICAgaWYgKG5ld19hdXJhWzBdID09PSAnKycpIHtcclxuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5ld19hdXJhWzBdID09PSAnLScpIHtcclxuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgLT0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXVyYS52YWx1ZSA9IHBhcnNlSW50KG5ld19hdXJhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgICAgICQodGhpcykudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlfSk7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvblNlbGVjdGlvbkxvc3MoKSB7XHJcbiAgICAgICAgLy8gJChgI3NoYXBlc2VsZWN0aW9uY29nLSR7dGhpcy51dWlkfWApLnJlbW92ZSgpO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjdHgpIHtcclxuICAgICAgICBpZiAodGhpcy5sYXllciA9PT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgdGhpcy5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgICAgIHRoaXMuZHJhd0F1cmFzKGN0eCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0F1cmFzKGN0eCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikuY3R4ID09PSBjdHggPyBcImJsYWNrXCIgOiBhdXJhLmNvbG91cjtcclxuICAgICAgICAgICAgY29uc3QgbG9jID0gdzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdzJscihhdXJhLnZhbHVlKSwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICBpZiAoYXVyYS5kaW0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRjID0gdGlueWNvbG9yKGF1cmEuY29sb3VyKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0Yy5zZXRBbHBoYSh0Yy5nZXRBbHBoYSgpIC8gMikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IHcybChzZWxmLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB3MmxyKGF1cmEuZGltKSwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3dDb250ZXh0TWVudShtb3VzZSkge1xyXG4gICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgICAgICBsLnNlbGVjdGlvbiA9IFt0aGlzXTtcclxuICAgICAgICB0aGlzLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgbC5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcztcclxuICAgICAgICAkbWVudS5zaG93KCk7XHJcbiAgICAgICAgJG1lbnUuZW1wdHkoKTtcclxuICAgICAgICAkbWVudS5jc3Moe2xlZnQ6IG1vdXNlLngsIHRvcDogbW91c2UueX0pO1xyXG4gICAgICAgIGxldCBkYXRhID0gXCJcIiArXHJcbiAgICAgICAgICAgIFwiPHVsPlwiICtcclxuICAgICAgICAgICAgXCI8bGk+TGF5ZXI8dWw+XCI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmxheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGFibGUpIHJldHVybjtcclxuICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIubmFtZSA9PT0gbC5uYW1lID8gXCIgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6YXF1YScgXCIgOiBcIiBcIjtcclxuICAgICAgICAgICAgZGF0YSArPSBgPGxpIGRhdGEtYWN0aW9uPSdzZXRMYXllcicgZGF0YS1sYXllcj0nJHtsYXllci5uYW1lfScgJHtzZWx9IGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+JHtsYXllci5uYW1lfTwvbGk+YDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBkYXRhICs9IFwiPC91bD48L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J21vdmVUb0JhY2snIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBiYWNrPC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9Gcm9udCcgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGZyb250PC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdhZGRJbml0aWF0aXZlJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPkFkZCBpbml0aWF0aXZlPC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPC91bD5cIjtcclxuICAgICAgICAkbWVudS5odG1sKGRhdGEpO1xyXG4gICAgICAgICQoXCIuY29udGV4dC1jbGlja2FibGVcIikub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBoYW5kbGVDb250ZXh0TWVudSgkKHRoaXMpLCBhc3NldCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCb3VuZGluZ1JlY3Qge1xyXG4gICAgdHlwZSA9IFwiYm91bmRyZWN0XCI7XHJcbiAgICB4OiBudW1iZXI7XHJcbiAgICB5OiBudW1iZXI7XHJcbiAgICB3OiBudW1iZXI7XHJcbiAgICBoOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMudyA9IHc7XHJcbiAgICAgICAgdGhpcy5oID0gaDtcclxuICAgIH1cclxuXHJcbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYgKGluV29ybGRDb29yZCkge1xyXG4gICAgICAgICAgICB4ID0gbDJ3eCh4KTtcclxuICAgICAgICAgICAgeSA9IGwyd3koeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnggPD0geCAmJiAodGhpcy54ICsgdGhpcy53KSA+PSB4ICYmXHJcbiAgICAgICAgICAgIHRoaXMueSA8PSB5ICYmICh0aGlzLnkgKyB0aGlzLmgpID49IHk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJzZWN0c1dpdGgob3RoZXI6IEJvdW5kaW5nUmVjdCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAhKG90aGVyLnggPj0gdGhpcy54ICsgdGhpcy53IHx8XHJcbiAgICAgICAgICAgIG90aGVyLnggKyBvdGhlci53IDw9IHRoaXMueCB8fFxyXG4gICAgICAgICAgICBvdGhlci55ID49IHRoaXMueSArIHRoaXMuaCB8fFxyXG4gICAgICAgICAgICBvdGhlci55ICsgb3RoZXIuaCA8PSB0aGlzLnkpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW50ZXJzZWN0V2l0aExpbmUobGluZSkge1xyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gW1xyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHt4OiB0aGlzLngsIHk6IHRoaXMueX0sIHt4OiB0aGlzLnggKyB0aGlzLncsIHk6IHRoaXMueX0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7eDogdGhpcy54ICsgdGhpcy53LCB5OiB0aGlzLnl9LCB7XHJcbiAgICAgICAgICAgICAgICB4OiB0aGlzLnggKyB0aGlzLncsXHJcbiAgICAgICAgICAgICAgICB5OiB0aGlzLnkgKyB0aGlzLmhcclxuICAgICAgICAgICAgfSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHt4OiB0aGlzLngsIHk6IHRoaXMueX0sIHt4OiB0aGlzLngsIHk6IHRoaXMueSArIHRoaXMuaH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7eDogdGhpcy54LCB5OiB0aGlzLnkgKyB0aGlzLmh9LCB7XHJcbiAgICAgICAgICAgICAgICB4OiB0aGlzLnggKyB0aGlzLncsXHJcbiAgICAgICAgICAgICAgICB5OiB0aGlzLnkgKyB0aGlzLmhcclxuICAgICAgICAgICAgfSwgbGluZS5zdGFydCwgbGluZS5lbmQpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBsZXQgbWluX2QgPSBJbmZpbml0eTtcclxuICAgICAgICBsZXQgbWluX2kgPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGxpbmVzW2ldID09PSBudWxsKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgZCA9IGdldFBvaW50RGlzdGFuY2UobGluZS5zdGFydCwgbGluZXNbaV0pO1xyXG4gICAgICAgICAgICBpZiAobWluX2QgPiBkKSB7XHJcbiAgICAgICAgICAgICAgICBtaW5fZCA9IGQ7XHJcbiAgICAgICAgICAgICAgICBtaW5faSA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7aW50ZXJzZWN0OiBtaW5faSwgZGlzdGFuY2U6IG1pbl9kfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIHc6IG51bWJlcjtcclxuICAgIGg6IG51bWJlcjtcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IoeCwgeSwgdywgaCwgZmlsbD8sIGJvcmRlcj8sIHV1aWQ/KSB7XHJcbiAgICAgICAgc3VwZXIodXVpZCk7XHJcbiAgICAgICAgdGhpcy50eXBlID0gXCJyZWN0XCI7XHJcbiAgICAgICAgdGhpcy54ID0geCB8fCAwO1xyXG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcclxuICAgICAgICB0aGlzLncgPSB3IHx8IDE7XHJcbiAgICAgICAgdGhpcy5oID0gaCB8fCAxO1xyXG4gICAgICAgIHRoaXMuZmlsbCA9IGZpbGwgfHwgJyMwMDAnO1xyXG4gICAgICAgIHRoaXMuYm9yZGVyID0gYm9yZGVyIHx8IFwicmdiYSgwLCAwLCAwLCAwKVwiO1xyXG4gICAgICAgIHRoaXMudXVpZCA9IHV1aWQgfHwgdXVpZHY0KCk7XHJcbiAgICB9XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHgpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgbG9jID0gdzJsKHt4OiB0aGlzLngsIHk6IHRoaXMueX0pO1xyXG4gICAgICAgIGN0eC5maWxsUmVjdChsb2MueCwgbG9jLnksIHRoaXMudyAqIHosIHRoaXMuaCAqIHopO1xyXG4gICAgICAgIGlmICh0aGlzLmJvcmRlciAhPT0gXCJyZ2JhKDAsIDAsIDAsIDApXCIpIHtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluV29ybGRDb29yZDogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmIChpbldvcmxkQ29vcmQpIHtcclxuICAgICAgICAgICAgeCA9IGwyd3goeCk7XHJcbiAgICAgICAgICAgIHkgPSBsMnd5KHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy54IDw9IHggJiYgKHRoaXMueCArIHRoaXMudykgPj0geCAmJlxyXG4gICAgICAgICAgICB0aGlzLnkgPD0geSAmJiAodGhpcy55ICsgdGhpcy5oKSA+PSB5O1xyXG4gICAgfVxyXG4gICAgaW5Db3JuZXIoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgc3dpdGNoIChjb3JuZXIpIHtcclxuICAgICAgICAgICAgY2FzZSAnbmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54ICsgdGhpcy53IC0gMykgPD0geCAmJiB4IDw9IHcybHgodGhpcy54ICsgdGhpcy53ICsgMykgJiYgdzJseSh0aGlzLnkgLSAzKSA8PSB5ICYmIHkgPD0gdzJseSh0aGlzLnkgKyAzKTtcclxuICAgICAgICAgICAgY2FzZSAnbncnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54IC0gMykgPD0geCAmJiB4IDw9IHcybHgodGhpcy54ICsgMykgJiYgdzJseSh0aGlzLnkgLSAzKSA8PSB5ICYmIHkgPD0gdzJseSh0aGlzLnkgKyAzKTtcclxuICAgICAgICAgICAgY2FzZSAnc3cnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54IC0gMykgPD0geCAmJiB4IDw9IHcybHgodGhpcy54ICsgMykgJiYgdzJseSh0aGlzLnkgKyB0aGlzLmggLSAzKSA8PSB5ICYmIHkgPD0gdzJseSh0aGlzLnkgKyB0aGlzLmggKyAzKTtcclxuICAgICAgICAgICAgY2FzZSAnc2UnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54ICsgdGhpcy53IC0gMykgPD0geCAmJiB4IDw9IHcybHgodGhpcy54ICsgdGhpcy53ICsgMykgJiYgdzJseSh0aGlzLnkgKyB0aGlzLmggLSAzKSA8PSB5ICYmIHkgPD0gdzJseSh0aGlzLnkgKyB0aGlzLmggKyAzKTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXRDb3JuZXIoeCwgeSkge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/KSB7XHJcbiAgICAgICAgaWYgKGNlbnRlclBvaW50ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiB7eDogdGhpcy54ICsgdGhpcy53IC8gMiwgeTogdGhpcy55ICsgdGhpcy5oIC8gMn07XHJcbiAgICAgICAgdGhpcy54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDaXJjbGUgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB4OiBudW1iZXI7XHJcbiAgICB5OiBudW1iZXI7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBib3JkZXI6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKHgsIHksIHIsIGZpbGw/LCBib3JkZXI/LCB1dWlkPykge1xyXG4gICAgICAgIHN1cGVyKHV1aWQpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwiY2lyY2xlXCI7XHJcbiAgICAgICAgdGhpcy54ID0geCB8fCAwO1xyXG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcclxuICAgICAgICB0aGlzLnIgPSByIHx8IDE7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICAgICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICAgICAgdGhpcy51dWlkID0gdXVpZCB8fCB1dWlkdjQoKTtcclxuICAgIH07XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMueCAtIHRoaXMuciwgdGhpcy55IC0gdGhpcy5yLCB0aGlzLnIgKiAyLCB0aGlzLnIgKiAyKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4KSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IHcybCh7eDogdGhpcy54LCB5OiB0aGlzLnl9KTtcclxuICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdGhpcy5yLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHgsIHkpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gKHggLSB3Mmx4KHRoaXMueCkpICoqIDIgKyAoeSAtIHcybHkodGhpcy55KSkgKiogMiA8IHRoaXMuciAqKiAyO1xyXG4gICAgfVxyXG4gICAgaW5Db3JuZXIoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvL1RPRE9cclxuICAgIH1cclxuICAgIGdldENvcm5lcih4LCB5KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD8pIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHt4OiB0aGlzLngsIHk6IHRoaXMueX07XHJcbiAgICAgICAgdGhpcy54ID0gY2VudGVyUG9pbnQueDtcclxuICAgICAgICB0aGlzLnkgPSBjZW50ZXJQb2ludC55O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGluZSBleHRlbmRzIFNoYXBlIHtcclxuICAgIHgxOiBudW1iZXI7XHJcbiAgICB5MTogbnVtYmVyO1xyXG4gICAgeDI6IG51bWJlcjtcclxuICAgIHkyOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih4MSwgeTEsIHgyLCB5MiwgdXVpZD8pIHtcclxuICAgICAgICBzdXBlcih1dWlkKTtcclxuICAgICAgICB0aGlzLnR5cGUgPSBcImxpbmVcIjtcclxuICAgICAgICB0aGlzLngxID0geDE7XHJcbiAgICAgICAgdGhpcy55MSA9IHkxO1xyXG4gICAgICAgIHRoaXMueDIgPSB4MjtcclxuICAgICAgICB0aGlzLnkyID0geTI7XHJcbiAgICAgICAgdGhpcy51dWlkID0gdXVpZCB8fCB1dWlkdjQoKTtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QoXHJcbiAgICAgICAgICAgIE1hdGgubWluKHRoaXMueDEsIHRoaXMueDIpLFxyXG4gICAgICAgICAgICBNYXRoLm1pbih0aGlzLnkxLCB0aGlzLnkyKSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy54MSAtIHRoaXMueDIpLFxyXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLnkxIC0gdGhpcy55MilcclxuICAgICAgICApO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHgpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odzJseCh0aGlzLngxKSwgdzJseSh0aGlzLnkxKSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh3Mmx4KHRoaXMueDIpLCB3Mmx5KHRoaXMueTIpKTtcclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsMCwwLCAwLjUpJztcclxuICAgICAgICBjdHgubGluZVdpZHRoID0gMztcclxuICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKGNlbnRlclBvaW50Pykge30gLy8gVE9ET1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIHRleHQ6IHN0cmluZztcclxuICAgIGZvbnQ6IHN0cmluZztcclxuICAgIGFuZ2xlOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih4LCB5LCB0ZXh0LCBmb250LCBhbmdsZT8sIHV1aWQ/KSB7XHJcbiAgICAgICAgc3VwZXIodXVpZCk7XHJcbiAgICAgICAgdGhpcy50eXBlID0gXCJ0ZXh0XCI7XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XHJcbiAgICAgICAgdGhpcy5mb250ID0gZm9udDtcclxuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGUgfHwgMDtcclxuICAgICAgICB0aGlzLnV1aWQgPSB1dWlkIHx8IHV1aWR2NCgpO1xyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLngsIHRoaXMueSwgNSwgNSk7IC8vIFRvZG86IGZpeCB0aGlzIGJvdW5kaW5nIGJveFxyXG4gICAgfVxyXG4gICAgZHJhdyhjdHgpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZvbnQgPSB0aGlzLmZvbnQ7XHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjdHgudHJhbnNsYXRlKHcybHgodGhpcy54KSwgdzJseSh0aGlzLnkpKTtcclxuICAgICAgICBjdHgucm90YXRlKHRoaXMuYW5nbGUpO1xyXG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xyXG4gICAgICAgIGN0eC5maWxsVGV4dCh0aGlzLnRleHQsIDAsIC01KTtcclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgfVxyXG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluV29ybGRDb29yZDogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xyXG4gICAgfVxyXG5cclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD8pIHt9IC8vIFRPRE9cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFzc2V0IGV4dGVuZHMgUmVjdCB7XHJcbiAgICBpbWc6IEhUTUxJbWFnZUVsZW1lbnQ7XHJcbiAgICBzcmM6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKGltZywgeCwgeSwgdywgaCwgdXVpZD8pIHtcclxuICAgICAgICBzdXBlcih4LCB5LCB3LCBoKTtcclxuICAgICAgICBpZih1dWlkICE9PSB1bmRlZmluZWQpIHRoaXMudXVpZCA9IHV1aWQ7XHJcbiAgICAgICAgdGhpcy50eXBlID0gXCJhc3NldFwiO1xyXG4gICAgICAgIHRoaXMuaW1nID0gaW1nO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHgpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHcybHgodGhpcy54KSwgdzJseSh0aGlzLnkpLCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlLCBkdW1teT8pIHtcclxuICAgIGlmIChkdW1teSA9PT0gdW5kZWZpbmVkKSBkdW1teSA9IGZhbHNlO1xyXG4gICAgaWYgKCFkdW1teSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpXHJcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKTtcclxuXHJcbiAgICBsZXQgc2g7XHJcblxyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdyZWN0Jykgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBSZWN0KCksIHNoYXBlKTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAnY2lyY2xlJykgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBDaXJjbGUoKSwgc2hhcGUpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdsaW5lJykgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBMaW5lKCksIHNoYXBlKTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAndGV4dCcpIHNoID0gT2JqZWN0LmFzc2lnbihuZXcgVGV4dCgpLCBzaGFwZSk7XHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ2Fzc2V0Jykge1xyXG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZShzaGFwZS53LCBzaGFwZS5oKTtcclxuICAgICAgICBpbWcuc3JjID0gc2hhcGUuc3JjO1xyXG4gICAgICAgIHNoID0gT2JqZWN0LmFzc2lnbihuZXcgQXNzZXQoKSwgc2hhcGUpO1xyXG4gICAgICAgIHNoLmltZyA9IGltZztcclxuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2g7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUNvbnRleHRNZW51KG1lbnUsIHNoYXBlKSB7XHJcbiAgICBjb25zdCBhY3Rpb24gPSBtZW51LmRhdGEoXCJhY3Rpb25cIik7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICBjYXNlICdtb3ZlVG9Gcm9udCc6XHJcbiAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCBsYXllci5zaGFwZXMuZGF0YS5sZW5ndGggLSAxLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnbW92ZVRvQmFjayc6XHJcbiAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCAwLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2V0TGF5ZXInOlxyXG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZShzaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihtZW51LmRhdGEoXCJsYXllclwiKSkuYWRkU2hhcGUoc2hhcGUsIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdhZGRJbml0aWF0aXZlJzpcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBzaGFwZS51dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGU6ICFnYW1lTWFuYWdlci5JU19ETSxcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBzaGFwZS5zcmMsXHJcbiAgICAgICAgICAgICAgICAgICAgb3duZXJzOiBzaGFwZS5vd25lcnNcclxuICAgICAgICAgICAgICAgIH0sIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgICRtZW51LmhpZGUoKTtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7YWxwaFNvcnR9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7c2V0dXBUb29sc30gZnJvbSBcIi4vdG9vbHNcIjtcclxuXHJcbmNvbnN0IHByb3RvY29sID0gZG9jdW1lbnQuZG9tYWluID09PSAnbG9jYWxob3N0JyA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xyXG5jb25zdCBzb2NrZXQgPSBpby5jb25uZWN0KHByb3RvY29sICsgZG9jdW1lbnQuZG9tYWluICsgXCI6XCIgKyBsb2NhdGlvbi5wb3J0ICsgXCIvcGxhbmFyYWxseVwiKTtcclxuc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJyZWRpcmVjdFwiLCBmdW5jdGlvbiAoZGVzdGluYXRpb24pIHtcclxuICAgIGNvbnNvbGUubG9nKFwicmVkaXJlY3RpbmdcIik7XHJcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGRlc3RpbmF0aW9uO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHVzZXJuYW1lXCIsIGZ1bmN0aW9uICh1c2VybmFtZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIudXNlcm5hbWUgPSB1c2VybmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLklTX0RNID0gdXNlcm5hbWUgPT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMl07XHJcbiAgICBpZiAoJChcIiN0b29sc2VsZWN0XCIpLmZpbmQoXCJ1bFwiKS5odG1sKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHNldHVwVG9vbHMoKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCBjbGllbnRPcHRpb25zXCIsIGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRDbGllbnRPcHRpb25zKG9wdGlvbnMpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJhc3NldCBsaXN0XCIsIGZ1bmN0aW9uIChhc3NldHMpIHtcclxuICAgIGNvbnN0IG0gPSAkKFwiI21lbnUtdG9rZW5zXCIpO1xyXG4gICAgbS5lbXB0eSgpO1xyXG4gICAgbGV0IGggPSAnJztcclxuXHJcbiAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGVudHJ5LCBwYXRoKSB7XHJcbiAgICAgICAgY29uc3QgZm9sZGVycyA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoZW50cnkuZm9sZGVycykpO1xyXG4gICAgICAgIGZvbGRlcnMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGJ1dHRvbiBjbGFzcz0nYWNjb3JkaW9uJz5cIiArIGtleSArIFwiPC9idXR0b24+PGRpdiBjbGFzcz0nYWNjb3JkaW9uLXBhbmVsJz48ZGl2IGNsYXNzPSdhY2NvcmRpb24tc3VicGFuZWwnPlwiO1xyXG4gICAgICAgICAgICBwcm9jZXNzKHZhbHVlLCBwYXRoICsga2V5ICsgXCIvXCIpO1xyXG4gICAgICAgICAgICBoICs9IFwiPC9kaXY+PC9kaXY+XCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZW50cnkuZmlsZXMuc29ydChhbHBoU29ydCk7XHJcbiAgICAgICAgZW50cnkuZmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoYXNzZXQpIHtcclxuICAgICAgICAgICAgaCArPSBcIjxkaXYgY2xhc3M9J2RyYWdnYWJsZSB0b2tlbic+PGltZyBzcmM9Jy9zdGF0aWMvaW1nL2Fzc2V0cy9cIiArIHBhdGggKyBhc3NldCArIFwiJyB3aWR0aD0nMzUnPlwiICsgYXNzZXQgKyBcIjxpIGNsYXNzPSdmYXMgZmEtY29nJz48L2k+PC9kaXY+XCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcHJvY2Vzcyhhc3NldHMsIFwiXCIpO1xyXG4gICAgbS5odG1sKGgpO1xyXG4gICAgJChcIi5kcmFnZ2FibGVcIikuZHJhZ2dhYmxlKHtcclxuICAgICAgICBoZWxwZXI6IFwiY2xvbmVcIixcclxuICAgICAgICBhcHBlbmRUbzogXCIjYm9hcmRcIlxyXG4gICAgfSk7XHJcbiAgICAkKCcuYWNjb3JkaW9uJykuZWFjaChmdW5jdGlvbiAoaWR4KSB7XHJcbiAgICAgICAgJCh0aGlzKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcyhcImFjY29yZGlvbi1hY3RpdmVcIik7XHJcbiAgICAgICAgICAgICQodGhpcykubmV4dCgpLnRvZ2dsZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJib2FyZCBpbml0XCIsIGZ1bmN0aW9uIChsb2NhdGlvbl9pbmZvKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXR1cEJvYXJkKGxvY2F0aW9uX2luZm8pXHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgZ3JpZHNpemVcIiwgZnVuY3Rpb24gKGdyaWRTaXplKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3JpZFNpemUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYWRkIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuYWRkU2hhcGUoc2hhcGUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwicmVtb3ZlIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpO1xyXG4gICAgbGF5ZXIucmVtb3ZlU2hhcGUoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBmYWxzZSk7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxufSk7XHJcbnNvY2tldC5vbihcIm1vdmVTaGFwZU9yZGVyXCIsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoZGF0YS5zaGFwZS5sYXllcikubW92ZVNoYXBlT3JkZXIoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGRhdGEuc2hhcGUudXVpZCksIGRhdGEuaW5kZXgsIGZhbHNlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNoYXBlTW92ZVwiLCBmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLm1vdmVTaGFwZShzaGFwZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVTaGFwZVwiLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgZ2FtZU1hbmFnZXIudXBkYXRlU2hhcGUoZGF0YSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQgfHwgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNICYmICFkYXRhLnZpc2libGUpKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoZGF0YS51dWlkLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShkYXRhLCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXRJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRJbml0aWF0aXZlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiY2xlYXIgdGVtcG9yYXJpZXNcIiwgZnVuY3Rpb24gKHNoYXBlcykge1xyXG4gICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKS5yZW1vdmVTaGFwZShzaGFwZSwgZmFsc2UpO1xyXG4gICAgfSlcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzb2NrZXQ7IiwiaW1wb3J0IHtsMnd9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7TGluZSwgUmVjdCwgVGV4dH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICAgIHtuYW1lOiBcInNlbGVjdFwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiB0cnVlLCBoYXNEZXRhaWw6IGZhbHNlLCBmdW5jOiB1bmRlZmluZWR9LFxyXG4gICAge25hbWU6IFwicGFuXCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IGZhbHNlLCBmdW5jOiB1bmRlZmluZWR9LFxyXG4gICAge25hbWU6IFwiZHJhd1wiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBmdW5jOiB1bmRlZmluZWR9LFxyXG4gICAge25hbWU6IFwicnVsZXJcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogZmFsc2UsIGZ1bmM6IHVuZGVmaW5lZH0sXHJcbiAgICB7bmFtZTogXCJmb3dcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGZ1bmM6IHVuZGVmaW5lZH0sXHJcbiAgICB7bmFtZTogXCJtYXBcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGZ1bmM6IHVuZGVmaW5lZH0sXHJcbl07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBUb29scygpOiB2b2lkIHtcclxuICAgIC8vIFRPRE86IEZJWCBUSElTIFRFTVBPUkFSWSBTSElULCB0aGlzIGlzIGEgcXVpY2tmaXggYWZ0ZXIgdGhlIGpzPnRzIHRyYW5zaXRpb25cclxuICAgIHRvb2xzWzBdLmZ1bmMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXI7XHJcbiAgICB0b29sc1sxXS5mdW5jID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyO1xyXG4gICAgdG9vbHNbMl0uZnVuYyA9IGdhbWVNYW5hZ2VyLmRyYXdUb29sO1xyXG4gICAgdG9vbHNbM10uZnVuYyA9IGdhbWVNYW5hZ2VyLnJ1bGVyVG9vbDtcclxuICAgIHRvb2xzWzRdLmZ1bmMgPSBnYW1lTWFuYWdlci5mb3dUb29sO1xyXG4gICAgdG9vbHNbNV0uZnVuYyA9IGdhbWVNYW5hZ2VyLm1hcFRvb2w7XHJcbiAgICBnYW1lTWFuYWdlci50b29scyA9IHRvb2xzO1xyXG4gICAgY29uc3QgdG9vbHNlbGVjdERpdiA9ICQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIik7XHJcbiAgICB0b29scy5mb3JFYWNoKGZ1bmN0aW9uICh0b29sKSB7XHJcbiAgICAgICAgaWYgKCF0b29sLnBsYXllclRvb2wgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgZXh0cmEgPSB0b29sLmRlZmF1bHRTZWxlY3QgPyBcIiBjbGFzcz0ndG9vbC1zZWxlY3RlZCdcIiA6IFwiXCI7XHJcbiAgICAgICAgY29uc3QgdG9vbExpID0gJChcIjxsaSBpZD0ndG9vbC1cIiArIHRvb2wubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIHRvb2wubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgIHRvb2xzZWxlY3REaXYuYXBwZW5kKHRvb2xMaSk7XHJcbiAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IHRvb2wuZnVuYy5kZXRhaWxEaXY7XHJcbiAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuYXBwZW5kKGRpdik7XHJcbiAgICAgICAgICAgIGRpdi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvb2xMaS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0b29scy5pbmRleE9mKHRvb2wpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkge1xyXG4gICAgICAgICAgICAgICAgJCgnLnRvb2wtc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwidG9vbC1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gJCgnI3Rvb2xkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgIGlmICh0b29sLmhhc0RldGFpbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuY2hpbGRyZW4oKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbC5mdW5jLmRldGFpbERpdi5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsLnNob3coKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBEcmF3VG9vbCgpIHtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICB0aGlzLmRldGFpbERpdiA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5maWxsQ29sb3IgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIC8+XCIpO1xyXG4gICAgdGhpcy5ib3JkZXJDb2xvciA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgLz5cIik7XHJcbiAgICB0aGlzLmRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+RmlsbDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuZmlsbENvbG9yKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+Qm9yZGVyPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5ib3JkZXJDb2xvcilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgLy8gdGhpcy5kZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgIC8vICAgICAuYXBwZW5kKCQoXCI8ZGl2PlwiKS5hcHBlbmQoJChcIjxkaXY+RmlsbDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuZmlsbENvbG9yKS5hcHBlbmQoJChcIjwvZGl2PlwiKSkpXHJcbiAgICAvLyAgICAgLmFwcGVuZCgkKFwiPGRpdj5cIikuYXBwZW5kKCQoXCI8ZGl2PkJvcmRlcjwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuYm9yZGVyQ29sb3IpLmFwcGVuZChcIjwvZGl2PlwiKSlcclxuICAgIC8vICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICBjb2xvcjogXCJyZWRcIlxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKHtcclxuICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICBzaG93QWxwaGE6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5EcmF3VG9vbC5wcm90b3R5cGUub25Nb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuICAgIGNvbnN0IGZpbGxDb2xvciA9IHRoaXMuZmlsbENvbG9yLnNwZWN0cnVtKFwiZ2V0XCIpO1xyXG4gICAgY29uc3QgZmlsbCA9IGZpbGxDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogZmlsbENvbG9yO1xyXG4gICAgY29uc3QgYm9yZGVyQ29sb3IgPSB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKFwiZ2V0XCIpO1xyXG4gICAgY29uc3QgYm9yZGVyID0gYm9yZGVyQ29sb3IgPT09IG51bGwgPyB0aW55Y29sb3IoXCJ0cmFuc3BhcmVudFwiKSA6IGJvcmRlckNvbG9yO1xyXG4gICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCAwLCAwLCBmaWxsLnRvUmdiU3RyaW5nKCksIGJvcmRlci50b1JnYlN0cmluZygpKTtcclxuICAgIHRoaXMucmVjdC5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICBpZiAobGF5ZXIubmFtZSA9PT0gJ2ZvdycpIHtcclxuICAgICAgICB0aGlzLnJlY3QudmlzaW9uT2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgICAgIHRoaXMucmVjdC5tb3ZlbWVudE9ic3RydWN0aW9uID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnJlY3QudXVpZCk7XHJcbiAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJlY3QsIHRydWUsIGZhbHNlKTtcclxufTtcclxuRHJhd1Rvb2wucHJvdG90eXBlLm9uTW91c2VNb3ZlID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgIGNvbnN0IGVuZFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuXHJcbiAgICB0aGlzLnJlY3QudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICB0aGlzLnJlY3QueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgIHRoaXMucmVjdC55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnJlY3QuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG59O1xyXG5EcmF3VG9vbC5wcm90b3R5cGUub25Nb3VzZVVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMucmVjdCA9IG51bGw7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gUnVsZXJUb29sKCkge1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxufVxyXG5cclxuUnVsZXJUb29sLnByb3RvdHlwZS5vbk1vdXNlRG93biA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKTtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICB0aGlzLnJ1bGVyID0gbmV3IExpbmUodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCB0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgdGhpcy50ZXh0ID0gbmV3IFRleHQodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCBcIlwiLCBcIjIwcHggc2VyaWZcIik7XHJcbiAgICB0aGlzLnJ1bGVyLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgIHRoaXMudGV4dC5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJ1bGVyLCB0cnVlLCB0cnVlKTtcclxuICAgIGxheWVyLmFkZFNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbn07XHJcblJ1bGVyVG9vbC5wcm90b3R5cGUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIik7XHJcbiAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcblxyXG4gICAgdGhpcy5ydWxlci54MiA9IGVuZFBvaW50Lng7XHJcbiAgICB0aGlzLnJ1bGVyLnkyID0gZW5kUG9pbnQueTtcclxuICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogdGhpcy5ydWxlci5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcblxyXG4gICAgY29uc3QgZGlmZnNpZ24gPSBNYXRoLnNpZ24oZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KSAqIE1hdGguc2lnbihlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgY29uc3QgeGRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgY29uc3QgeWRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgY29uc3QgbGFiZWwgPSBNYXRoLnJvdW5kKE1hdGguc3FydCgoeGRpZmYpICoqIDIgKyAoeWRpZmYpICoqIDIpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVuaXRTaXplIC8gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplKSArIFwiIGZ0XCI7XHJcbiAgICBsZXQgYW5nbGUgPSBNYXRoLmF0YW4yKGRpZmZzaWduICogeWRpZmYsIHhkaWZmKTtcclxuICAgIGNvbnN0IHhtaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCkgKyB4ZGlmZiAvIDI7XHJcbiAgICBjb25zdCB5bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpICsgeWRpZmYgLyAyO1xyXG4gICAgdGhpcy50ZXh0LnggPSB4bWlkO1xyXG4gICAgdGhpcy50ZXh0LnkgPSB5bWlkO1xyXG4gICAgdGhpcy50ZXh0LnRleHQgPSBsYWJlbDtcclxuICAgIHRoaXMudGV4dC5hbmdsZSA9IGFuZ2xlO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnRleHQuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZX0pO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxufTtcclxuUnVsZXJUb29sLnByb3RvdHlwZS5vbk1vdXNlVXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpO1xyXG4gICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5ydWxlciwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnRleHQsIHRydWUsIHRydWUpO1xyXG4gICAgdGhpcy5ydWxlciA9IG51bGw7XHJcbiAgICB0aGlzLnRleHQgPSBudWxsO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGT1dUb29sKCkge1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMuZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5SZXZlYWw8L2Rpdj48bGFiZWwgY2xhc3M9J3N3aXRjaCc+PGlucHV0IHR5cGU9J2NoZWNrYm94JyBpZD0nZm93LXJldmVhbCc+PHNwYW4gY2xhc3M9J3NsaWRlciByb3VuZCc+PC9zcGFuPjwvbGFiZWw+XCIpKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbn1cclxuXHJcbkZPV1Rvb2wucHJvdG90eXBlLm9uTW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSwgMCwgMCwgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcblxyXG4gICAgaWYgKCQoXCIjZm93LXJldmVhbFwiKS5wcm9wKFwiY2hlY2tlZFwiKSlcclxuICAgICAgICB0aGlzLnJlY3QuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdXRcIjtcclxuICAgIGVsc2VcclxuICAgICAgICB0aGlzLnJlY3QuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG59O1xyXG5GT1dUb29sLnByb3RvdHlwZS5vbk1vdXNlVXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xyXG4gICAgdGhpcy5yZWN0ID0gbnVsbDtcclxufTtcclxuRk9XVG9vbC5wcm90b3R5cGUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgIGNvbnN0IGVuZFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuXHJcbiAgICB0aGlzLnJlY3QudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICB0aGlzLnJlY3QueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgIHRoaXMucmVjdC55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG5cclxuICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogdGhpcy5yZWN0LmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBNYXBUb29sKCkge1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMueENvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgdGhpcy55Q291bnQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIHZhbHVlPSczJz5cIik7XHJcbiAgICB0aGlzLmRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1g8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnhDb3VudClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PiNZPC9kaXY+XCIpKS5hcHBlbmQodGhpcy55Q291bnQpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxufVxyXG5cclxuTWFwVG9vbC5wcm90b3R5cGUub25Nb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIDAsIDAsIFwicmdiYSgwLDAsMCwwKVwiLCBcImJsYWNrXCIpO1xyXG4gICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCBmYWxzZSwgZmFsc2UpO1xyXG59O1xyXG5NYXBUb29sLnByb3RvdHlwZS5vbk1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcblxyXG4gICAgdGhpcy5yZWN0LncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgdGhpcy5yZWN0LmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgdGhpcy5yZWN0LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICB0aGlzLnJlY3QueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgIC8vIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogdGhpcy5yZWN0LmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxufTtcclxuTWFwVG9vbC5wcm90b3R5cGUub25Nb3VzZVVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5yZWN0LCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB3ID0gdGhpcy5yZWN0Lnc7XHJcbiAgICBjb25zdCBoID0gdGhpcy5yZWN0Lmg7XHJcbiAgICBsYXllci5zZWxlY3Rpb25bMF0udyAqPSB0aGlzLnhDb3VudC52YWwoKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIHc7XHJcbiAgICBsYXllci5zZWxlY3Rpb25bMF0uaCAqPSB0aGlzLnlDb3VudC52YWwoKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIGg7XHJcbiAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xyXG4gICAgdGhpcy5yZWN0ID0gbnVsbDtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJbml0aWF0aXZlVHJhY2tlcigpIHtcclxuICAgIHRoaXMuZGF0YSA9IFtdO1xyXG59XHJcbkluaXRpYXRpdmVUcmFja2VyLnByb3RvdHlwZS5hZGRJbml0aWF0aXZlID0gZnVuY3Rpb24gKGRhdGEsIHN5bmMpIHtcclxuICAgIC8vIE9wZW4gdGhlIGluaXRpYXRpdmUgdHJhY2tlciBpZiBpdCBpcyBub3QgY3VycmVudGx5IG9wZW4uXHJcbiAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCB8fCAhZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgLy8gSWYgbm8gaW5pdGlhdGl2ZSBnaXZlbiwgYXNzdW1lIGl0IDBcclxuICAgIGlmIChkYXRhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICBkYXRhLmluaXRpYXRpdmUgPSAwO1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHNoYXBlIGlzIGFscmVhZHkgYmVpbmcgdHJhY2tlZFxyXG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gZGF0YS51dWlkKTtcclxuICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICBPYmplY3QuYXNzaWduKGV4aXN0aW5nLCBkYXRhKTtcclxuICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcclxuICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgfVxyXG4gICAgaWYgKHN5bmMpXHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGRhdGEpO1xyXG59O1xyXG5Jbml0aWF0aXZlVHJhY2tlci5wcm90b3R5cGUucmVtb3ZlSW5pdGlhdGl2ZSA9IGZ1bmN0aW9uICh1dWlkLCBzeW5jLCBza2lwR3JvdXBDaGVjaykge1xyXG4gICAgc2tpcEdyb3VwQ2hlY2sgPSBza2lwR3JvdXBDaGVjayB8fCBmYWxzZTtcclxuICAgIGNvbnN0IGQgPSB0aGlzLmRhdGEuZmluZEluZGV4KGQgPT4gZC51dWlkID09PSB1dWlkKTtcclxuICAgIGlmIChkID49IDApIHtcclxuICAgICAgICBpZiAoIXNraXBHcm91cENoZWNrICYmIHRoaXMuZGF0YVtkXS5ncm91cCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuZGF0YS5zcGxpY2UoZCwgMSk7XHJcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICBpZiAoc3luYylcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIHt1dWlkOiB1dWlkfSk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCAmJiBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImlzT3BlblwiKSlcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImNsb3NlXCIpO1xyXG59O1xyXG5Jbml0aWF0aXZlVHJhY2tlci5wcm90b3R5cGUucmVkcmF3ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5lbXB0eSgpO1xyXG5cclxuICAgIHRoaXMuZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgcmV0dXJuIGIuaW5pdGlhdGl2ZSAtIGEuaW5pdGlhdGl2ZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgaWYgKGRhdGEub3duZXJzID09PSB1bmRlZmluZWQpIGRhdGEub3duZXJzID0gW107XHJcbiAgICAgICAgY29uc3QgaW1nID0gZGF0YS5zcmMgPT09IHVuZGVmaW5lZCA/ICcnIDogJChgPGltZyBzcmM9XCIke2RhdGEuc3JjfVwiIHdpZHRoPVwiMzBweFwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPmApO1xyXG4gICAgICAgIC8vIGNvbnN0IG5hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3NoLnV1aWR9XCIgdmFsdWU9XCIke3NoLm5hbWV9XCIgZGlzYWJsZWQ9J2Rpc2FibGVkJyBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgY29uc3QgdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJ2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiIHZhbHVlPVwiJHtkYXRhLmluaXRpYXRpdmV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogdmFsdWVcIj5gKTtcclxuICAgICAgICBjb25zdCB2aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgY29uc3QgZ3JvdXAgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXVzZXJzXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IHJlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICB2aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS52aXNpYmxlID8gXCIxLjBcIiA6IFwiMC4zXCIpO1xyXG4gICAgICAgIGdyb3VwLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS5ncm91cCA/IFwiMS4wXCIgOiBcIjAuM1wiKTtcclxuICAgICAgICBpZiAoIWRhdGEub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pIHtcclxuICAgICAgICAgICAgdmFsLnByb3AoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICByZW1vdmUuY3NzKFwib3BhY2l0eVwiLCBcIjAuM1wiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuYXBwZW5kKGltZykuYXBwZW5kKHZhbCkuYXBwZW5kKHZpc2libGUpLmFwcGVuZChncm91cCkuYXBwZW5kKHJlbW92ZSk7XHJcblxyXG4gICAgICAgIHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGQuaW5pdGlhdGl2ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSkgfHwgMDtcclxuICAgICAgICAgICAgc2VsZi5hZGRJbml0aWF0aXZlKGQsIHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGQudmlzaWJsZSA9ICFkLnZpc2libGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZC52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZ3JvdXAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZC5ncm91cCA9ICFkLmdyb3VwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQuZ3JvdXApXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICAgICAgaWYoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHt1dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgc2VsZi5yZW1vdmVJbml0aWF0aXZlKHV1aWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn07IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmwob2JqKSB7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICBjb25zdCBwYW5YID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblg7XHJcbiAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IChvYmoueCArIHBhblgpICogeixcclxuICAgICAgICB5OiAob2JqLnkgKyBwYW5ZKSAqIHpcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHcybHgoeCkge1xyXG4gICAgcmV0dXJuIHcybCh7eDogeCwgeTogMH0pLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmx5KHkpIHtcclxuICAgIHJldHVybiB3Mmwoe3g6IDAsIHk6IHl9KS55O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJseih6KSB7XHJcbiAgICByZXR1cm4geiAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdERpc3RhbmNlKHIpIHtcclxuICAgIHJldHVybiAociAvIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51bml0U2l6ZSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3MmxyKHIpIHtcclxuICAgIHJldHVybiB3Mmx6KGdldFVuaXREaXN0YW5jZShyKSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwydyhvYmopIHtcclxuICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogKG9iai54IC8geikgLSBwYW5YLFxyXG4gICAgICAgIHk6IChvYmoueSAvIHopIC0gcGFuWVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJ3eCh4KSB7XHJcbiAgICByZXR1cm4gbDJ3KHt4OiB4LCB5OiAwfSkueDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyd3koeSkge1xyXG4gICAgcmV0dXJuIGwydyh7eDogMCwgeTogeX0pLnk7XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIFBvaW50IHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbHBoU29ydChhLCBiKSB7XHJcbiAgICBpZiAoYS50b0xvd2VyQ2FzZSgpIDwgYi50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gMTtcclxufVxyXG5cclxuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxyXG5leHBvcnQgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIE9yZGVyZWRNYXAoKSB7XHJcbiAgICB0aGlzLmRhdGEgPSBbXTtcclxufVxyXG5cclxuT3JkZXJlZE1hcC5wcm90b3R5cGUgPSBbXTtcclxuT3JkZXJlZE1hcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICB0aGlzLmRhdGEucHVzaChlbGVtZW50KTtcclxufTtcclxuT3JkZXJlZE1hcC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgIHRoaXMuZGF0YS5zcGxpY2UodGhpcy5kYXRhLmluZGV4T2YoZWxlbWVudCksIDEpO1xyXG59O1xyXG5PcmRlcmVkTWFwLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgIHJldHVybiB0aGlzLmRhdGEuaW5kZXhPZihlbGVtZW50KTtcclxufTtcclxuT3JkZXJlZE1hcC5wcm90b3R5cGUubW92ZVRvID0gZnVuY3Rpb24gKGVsZW1lbnQsIGlkeCkge1xyXG4gICAgY29uc3Qgb2xkSWR4ID0gdGhpcy5pbmRleE9mKGVsZW1lbnQpO1xyXG4gICAgaWYgKG9sZElkeCA9PT0gaWR4KSByZXR1cm4gZmFsc2U7XHJcbiAgICB0aGlzLmRhdGEuc3BsaWNlKG9sZElkeCwgMSk7XHJcbiAgICB0aGlzLmRhdGEuc3BsaWNlKGlkeCwgMCwgZWxlbWVudCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufTsiXSwic291cmNlUm9vdCI6IiJ9