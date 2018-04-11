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
/******/ 	return __webpack_require__(__webpack_require__.s = "./ts_src/planarally.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./ts_src/geom.ts":
/*!************************!*\
  !*** ./ts_src/geom.ts ***!
  \************************/
/*! exports provided: GlobalPoint, LocalPoint, Vector, getLinesIntersectPoint, getPointDistance */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GlobalPoint", function() { return GlobalPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LocalPoint", function() { return LocalPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Vector", function() { return Vector; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getLinesIntersectPoint", function() { return getLinesIntersectPoint; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getPointDistance", function() { return getPointDistance; });
/*
This module defines some Point classes.
A strong focus is made to ensure that at no time a global and a local point are in some way used instead of the other.
This adds some at first glance weird looking hacks as ts does not support nominal typing.
*/
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vec) {
        return new Point(this.x + vec.direction.x, this.y + vec.direction.y);
    }
    subtract(other) {
        return new Vector({ x: this.x - other.x, y: this.y - other.y }, this);
    }
    clone() {
        return new Point(this.x, this.y);
    }
}
class GlobalPoint extends Point {
    add(vec) {
        return super.add(vec);
    }
    subtract(other) {
        return super.subtract(other);
    }
    clone() {
        return super.clone();
    }
}
class LocalPoint extends Point {
    add(vec) {
        return super.add(vec);
    }
    subtract(other) {
        return super.subtract(other);
    }
    clone() {
        return super.clone();
    }
}
class Vector {
    constructor(direction, origin) {
        this.direction = direction;
        this.origin = origin;
    }
    length() {
        return Math.sqrt(Math.pow(this.direction.x, 2) + Math.pow(this.direction.y, 2));
    }
    normalize() {
        const l = this.length();
        return new Vector({ x: this.direction.x / l, y: this.direction.y / l }, this.origin);
    }
    reverse() {
        return new Vector({ x: -this.direction.x, y: -this.direction.y }, this.origin);
    }
    multiply(scale) {
        return new Vector({ x: this.direction.x * scale, y: this.direction.y * scale }, this.origin);
    }
    dot(other) {
        return this.direction.x * other.direction.x + this.direction.y * other.direction.y;
    }
}
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
        return { intersect: null, parallel: true };
    const C2 = A2 * s2.x + B2 * s2.y;
    const C1 = A1 * s1.x + B1 * s1.y;
    //invert delta to make division cheaper
    const invdelta = 1 / delta;
    const intersect = { x: (B2 * C1 - B1 * C2) * invdelta, y: (A1 * C2 - A2 * C1) * invdelta };
    if (!pointInLines(intersect, s1, e1, s2, e2))
        return { intersect: null, parallel: false };
    return { intersect: intersect, parallel: false };
}
function getPointDistance(p1, p2) {
    const a = p1.x - p2.x;
    const b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}


/***/ }),

/***/ "./ts_src/layers.ts":
/*!**************************!*\
  !*** ./ts_src/layers.ts ***!
  \**************************/
/*! exports provided: LayerManager, Layer, GridLayer, FOWLayer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LayerManager", function() { return LayerManager; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Layer", function() { return Layer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GridLayer", function() { return GridLayer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FOWLayer", function() { return FOWLayer; });
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./units */ "./ts_src/units.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./socket */ "./ts_src/socket.ts");
/* harmony import */ var _shapes_circle__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./shapes/circle */ "./ts_src/shapes/circle.ts");
/* harmony import */ var _shapes_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shapes/utils */ "./ts_src/shapes/utils.ts");






class LayerManager {
    constructor() {
        this.layers = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.selectedLayer = "";
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
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("set", options.fowColour);
    }
    setWidth(width) {
        this.width = width;
        for (let i = 0; i < this.layers.length; i++) {
            this.layers[i].canvas.width = width;
            this.layers[i].width = width;
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
        if (this.selectedLayer === "" && layer.selectable)
            this.selectedLayer = layer.name;
    }
    hasLayer(name) {
        return this.layers.some(l => l.name === name);
    }
    getLayer(name) {
        name = (name === undefined) ? this.selectedLayer : name;
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
            if (found && layer.name !== 'fow')
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
        if (layer === undefined)
            return;
        const ctx = layer.ctx;
        layer.clear();
        ctx.beginPath();
        for (let i = 0; i < layer.width; i += this.gridSize * this.zoomFactor) {
            ctx.moveTo(i + (this.panX % this.gridSize) * this.zoomFactor, 0);
            ctx.lineTo(i + (this.panX % this.gridSize) * this.zoomFactor, layer.height);
            ctx.moveTo(0, i + (this.panY % this.gridSize) * this.zoomFactor);
            ctx.lineTo(layer.width, i + (this.panY % this.gridSize) * this.zoomFactor);
        }
        ctx.strokeStyle = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].gridColour.spectrum("get").toRgbString();
        ctx.lineWidth = 1;
        ctx.stroke();
        layer.valid = true;
        if (this.hasLayer("fow"))
            this.getLayer("fow").invalidate(true);
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
            const fowl = this.getLayer("fow");
            if (fowl !== undefined)
                fowl.invalidate(false);
            $('#useFOWInput').prop("checked", fullFOW);
        }
    }
    setFOWOpacity(fowOpacity) {
        this.fowOpacity = fowOpacity;
        const fowl = this.getLayer("fow");
        if (fowl !== undefined)
            fowl.invalidate(false);
        $('#fowOpacity').val(fowOpacity);
    }
    invalidate() {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            this.layers[i].invalidate(true);
        }
    }
}
class Layer {
    constructor(canvas, name) {
        this.selectable = false;
        this.player_editable = false;
        // When set to false, the layer will be redrawn on the next tick
        this.valid = false;
        // The collection of shapes that this layer contains.
        // These are ordered on a depth basis.
        this.shapes = [];
        // Collection of shapes that are currently selected
        this.selection = [];
        // Extra selection highlighting settings
        this.selectionColor = '#CC0000';
        this.selectionWidth = 2;
        this.canvas = canvas;
        this.name = name;
        this.width = canvas.width;
        this.height = canvas.height;
        this.ctx = canvas.getContext('2d');
    }
    invalidate(skipLightUpdate) {
        this.valid = false;
        if (!skipLightUpdate && this.name !== "fow" && _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.hasLayer("fow")) {
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("fow").invalidate(true);
        }
    }
    addShape(shape, sync, temporary) {
        if (temporary === undefined)
            temporary = false;
        shape.layer = this.name;
        this.shapes.push(shape);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        if (shape.annotation.length)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].annotations.push(shape.uuid);
        if (sync)
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("add shape", { shape: shape.asDict(), temporary: temporary });
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.set(shape.uuid, shape);
        this.invalidate(!sync);
    }
    setShapes(shapes) {
        const t = [];
        const self = this;
        shapes.forEach(function (shape) {
            const sh = Object(_shapes_utils__WEBPACK_IMPORTED_MODULE_5__["createShapeFromDict"])(shape);
            if (sh === undefined) {
                console.log(`Shape with unknown type ${shape.type} could not be added`);
                return;
            }
            sh.layer = self.name;
            sh.checkLightSources();
            sh.setMovementBlock(shape.movementObstruction);
            if (sh.annotation.length)
                _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].annotations.push(sh.uuid);
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.set(shape.uuid, sh);
            t.push(sh);
        });
        this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
        this.shapes = t;
        this.invalidate(false);
    }
    removeShape(shape, sync, temporary) {
        if (temporary === undefined)
            temporary = false;
        this.shapes.splice(this.shapes.indexOf(shape), 1);
        if (sync)
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("remove shape", { shape: shape, temporary: temporary });
        const ls_i = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightsources.findIndex(ls => ls.shape === shape.uuid);
        const lb_i = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightblockers.findIndex(ls => ls === shape.uuid);
        const mb_i = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].movementblockers.findIndex(ls => ls === shape.uuid);
        const an_i = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].annotations.findIndex(ls => ls === shape.uuid);
        if (ls_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightsources.splice(ls_i, 1);
        if (lb_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightblockers.splice(lb_i, 1);
        if (mb_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].movementblockers.splice(mb_i, 1);
        if (an_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].annotations.splice(an_i, 1);
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.delete(shape.uuid);
        const index = this.selection.indexOf(shape);
        if (index >= 0)
            this.selection.splice(index, 1);
        this.invalidate(!sync);
    }
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    draw(doClear) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].board_initialised && !this.valid) {
            const ctx = this.ctx;
            doClear = doClear === undefined ? true : doClear;
            if (doClear)
                this.clear();
            const state = this;
            this.shapes.forEach(function (shape) {
                if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined)
                    return;
                if (!shape.visibleInCanvas(state.canvas))
                    return;
                if (state.name === 'fow' && shape.visionObstruction && _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer().name !== state.name)
                    return;
                shape.draw(ctx);
            });
            if (this.selection != null) {
                ctx.fillStyle = this.selectionColor;
                ctx.strokeStyle = this.selectionColor;
                ctx.lineWidth = this.selectionWidth;
                const z = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.zoomFactor;
                this.selection.forEach(function (sel) {
                    const bb = sel.getBoundingBox();
                    // TODO: REFACTOR THIS TO Shape.drawSelection(ctx);
                    ctx.strokeRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(bb.refPoint.x), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(bb.refPoint.y), bb.w * z, bb.h * z);
                    // topright
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(bb.refPoint.x + bb.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(bb.refPoint.y - 3), 6 * z, 6 * z);
                    // topleft
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(bb.refPoint.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(bb.refPoint.y - 3), 6 * z, 6 * z);
                    // botright
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(bb.refPoint.x + bb.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(bb.refPoint.y + bb.h - 3), 6 * z, 6 * z);
                    // botleft
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(bb.refPoint.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(bb.refPoint.y + bb.h - 3), 6 * z, 6 * z);
                });
            }
            this.valid = true;
        }
    }
    moveShapeOrder(shape, destinationIndex, sync) {
        const oldIdx = this.shapes.indexOf(shape);
        if (oldIdx === destinationIndex)
            return;
        this.shapes.splice(oldIdx, 1);
        this.shapes.splice(destinationIndex, 0, shape);
        if (sync)
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("moveShapeOrder", { shape: shape.asDict(), index: destinationIndex });
        this.invalidate(true);
    }
    ;
    onShapeMove(shape) {
        this.invalidate(false);
    }
}
class GridLayer extends Layer {
    invalidate() {
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.drawGrid();
    }
}
class FOWLayer extends Layer {
    addShape(shape, sync, temporary) {
        shape.fill = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString();
        super.addShape(shape, sync, temporary);
    }
    setShapes(shapes) {
        const c = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString();
        shapes.forEach(function (shape) {
            shape.fill = c;
        });
        super.setShapes(shapes);
    }
    onShapeMove(shape) {
        shape.fill = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString();
        super.onShapeMove(shape);
    }
    ;
    draw() {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].board_initialised && !this.valid) {
            const ctx = this.ctx;
            const orig_op = ctx.globalCompositeOperation;
            if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.fullFOW) {
                const ogalpha = this.ctx.globalAlpha;
                this.ctx.globalCompositeOperation = "copy";
                if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                    this.ctx.globalAlpha = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.fowOpacity;
                this.ctx.fillStyle = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString();
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalAlpha = ogalpha;
                this.ctx.globalCompositeOperation = orig_op;
            }
            if (!_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                super.draw(!_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.fullFOW);
            ctx.globalCompositeOperation = 'destination-out';
            if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.hasLayer("tokens")) {
                _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("tokens").shapes.forEach(function (sh) {
                    if (!sh.ownedBy())
                        return;
                    const bb = sh.getBoundingBox();
                    const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2l"])(sh.center());
                    const alm = 0.8 * Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lz"])(bb.w);
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
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightsources.forEach(function (ls) {
                const sh = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.get(ls.shape);
                if (sh === undefined)
                    return;
                const aura = sh.auras.find(a => a.uuid === ls.aura);
                if (aura === undefined) {
                    console.log("Old lightsource still lingering in the gameManager list");
                    return;
                }
                const aura_length = Object(_units__WEBPACK_IMPORTED_MODULE_0__["getUnitDistance"])(aura.value);
                const center = sh.center();
                const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2l"])(center);
                const bbox = new _shapes_circle__WEBPACK_IMPORTED_MODULE_4__["default"](center, aura_length).getBoundingBox();
                // We first collect all lightblockers that are inside/cross our aura
                // This to prevent as many ray calculations as possible
                const local_lightblockers = [];
                _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightblockers.forEach(function (lb) {
                    if (lb === sh.uuid)
                        return;
                    const lb_sh = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.get(lb);
                    if (lb_sh === undefined)
                        return;
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
                    for (let i = 0; i < local_lightblockers.length; i++) {
                        const lb_bb = local_lightblockers[i];
                        const result = lb_bb.getIntersectWithLine({
                            start: center,
                            end: new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](center.x + aura_length * Math.cos(angle), center.y + aura_length * Math.sin(angle))
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
                            const dest = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2l"])(new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](center.x + aura_length * Math.cos(angle), center.y + aura_length * Math.sin(angle)));
                            ctx.lineTo(dest.x, dest.y);
                        }
                        continue;
                    }
                    // If hit , first finish any ongoing arc, then move to the intersection point
                    if (arc_start !== -1) {
                        ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lr"])(aura.value), arc_start, angle);
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
                    const dest = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2l"])(new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](hit.intersect.x + extraX, hit.intersect.y + extraY));
                    ctx.lineTo(dest.x, dest.y);
                }
                if (arc_start !== -1)
                    ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lr"])(aura.value), arc_start, 2 * Math.PI);
                const alm = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lr"])(aura.value);
                const gradient = ctx.createRadialGradient(lcenter.x, lcenter.y, alm / 2, lcenter.x, lcenter.y, alm);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                // ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fill();
            });
            if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                super.draw(!_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.fullFOW);
            ctx.globalCompositeOperation = orig_op;
        }
    }
}


/***/ }),

/***/ "./ts_src/planarally.ts":
/*!******************************!*\
  !*** ./ts_src/planarally.ts ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./socket */ "./ts_src/socket.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./units */ "./ts_src/units.ts");
/* harmony import */ var _layers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./layers */ "./ts_src/layers.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils */ "./ts_src/utils.ts");
/* harmony import */ var _shapes_asset__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./shapes/asset */ "./ts_src/shapes/asset.ts");
/* harmony import */ var _shapes_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shapes/utils */ "./ts_src/shapes/utils.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");
/* harmony import */ var _shapes_text__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./shapes/text */ "./ts_src/shapes/text.ts");
/* harmony import */ var _tools_initiative__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./tools/initiative */ "./ts_src/tools/initiative.ts");









class GameManager {
    constructor() {
        this.IS_DM = false;
        this.board_initialised = false;
        this.layerManager = new _layers__WEBPACK_IMPORTED_MODULE_2__["LayerManager"]();
        this.selectedTool = 0;
        this.tools = new _utils__WEBPACK_IMPORTED_MODULE_3__["OrderedMap"]();
        this.lightsources = [];
        this.lightblockers = [];
        this.annotations = [];
        this.annotationText = new _shapes_text__WEBPACK_IMPORTED_MODULE_7__["default"](new _geom__WEBPACK_IMPORTED_MODULE_6__["GlobalPoint"](0, 0), "", "bold 20px serif");
        this.movementblockers = [];
        this.gridColour = $("#gridColour");
        this.fowColour = $("#fowColour");
        this.initiativeTracker = new _tools_initiative__WEBPACK_IMPORTED_MODULE_8__["InitiativeTracker"]();
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
                    l.shapes.forEach(function (shape) {
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
        this.layerManager = new _layers__WEBPACK_IMPORTED_MODULE_2__["LayerManager"]();
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
                l = new _layers__WEBPACK_IMPORTED_MODULE_2__["GridLayer"](canvas, new_layer.name);
            else if (new_layer.name === 'fow')
                l = new _layers__WEBPACK_IMPORTED_MODULE_2__["FOWLayer"](canvas, new_layer.name);
            else
                l = new _layers__WEBPACK_IMPORTED_MODULE_2__["Layer"](canvas, new_layer.name);
            l.selectable = new_layer.selectable;
            l.player_editable = new_layer.player_editable;
            gameManager.layerManager.addLayer(l);
            if (new_layer.grid) {
                gameManager.layerManager.setGridSize(new_layer.size);
                gameManager.layerManager.drawGrid();
                $("#grid-layer").droppable({
                    accept: ".draggable",
                    drop: function (event, ui) {
                        if (gameManager.layerManager.getLayer() === undefined) {
                            console.log("No active layer to drop the token on");
                            return;
                        }
                        const l = gameManager.layerManager.getLayer();
                        const jCanvas = $(l.canvas);
                        if (jCanvas.length === 0) {
                            console.log("Canvas missing");
                            return;
                        }
                        const offset = jCanvas.offset();
                        const loc = new _geom__WEBPACK_IMPORTED_MODULE_6__["LocalPoint"](ui.offset.left - offset.left, ui.offset.top - offset.top);
                        if (settings_menu.is(":visible") && loc.x < settings_menu.width())
                            return;
                        if (locations_menu.is(":visible") && loc.y < locations_menu.width())
                            return;
                        // width = ui.helper[0].width;
                        // height = ui.helper[0].height;
                        const wloc = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2g"])(loc);
                        const img = ui.draggable[0].children[0];
                        const asset = new _shapes_asset__WEBPACK_IMPORTED_MODULE_4__["default"](img, wloc, img.width, img.height);
                        asset.src = new URL(img.src).pathname;
                        if (gameManager.layerManager.useGrid) {
                            const gs = gameManager.layerManager.gridSize;
                            asset.refPoint.x = Math.round(asset.refPoint.x / gs) * gs;
                            asset.refPoint.y = Math.round(asset.refPoint.y / gs) * gs;
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
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = this.layerManager.getLayer(shape.layer);
        const sh = Object(_shapes_utils__WEBPACK_IMPORTED_MODULE_5__["createShapeFromDict"])(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        layer.addShape(sh, false);
        layer.invalidate(false);
    }
    moveShape(shape) {
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const sh = Object(_shapes_utils__WEBPACK_IMPORTED_MODULE_5__["createShapeFromDict"])(shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        const real_shape = Object.assign(this.layerManager.UUIDMap.get(shape.uuid), sh);
        real_shape.checkLightSources();
        this.layerManager.getLayer(real_shape.layer).onShapeMove(real_shape);
    }
    updateShape(data) {
        if (!gameManager.layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = Object(_shapes_utils__WEBPACK_IMPORTED_MODULE_5__["createShapeFromDict"])(data.shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${data.shape.type} could not be added`);
            return;
        }
        const shape = Object.assign(this.layerManager.UUIDMap.get(data.shape.uuid), sh);
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
        if (options.gridColour)
            this.gridColour.spectrum("set", options.gridColour);
        if (options.fowColour) {
            this.fowColour.spectrum("set", options.fowColour);
            this.layerManager.invalidate();
        }
        if (options.locationOptions) {
            if (options.locationOptions[`${gameManager.roomName}/${gameManager.roomCreator}/${gameManager.locationName}`]) {
                const loc = options.locationOptions[`${gameManager.roomName}/${gameManager.roomCreator}/${gameManager.locationName}`];
                if (loc.panX)
                    this.layerManager.panX = loc.panX;
                if (loc.panY)
                    this.layerManager.panY = loc.panY;
                if (loc.zoomFactor) {
                    this.layerManager.zoomFactor = loc.zoomFactor;
                    $("#zoomer").slider({ value: 1 / loc.zoomFactor });
                }
                if (this.layerManager.getGridLayer() !== undefined)
                    this.layerManager.getGridLayer().invalidate(false);
            }
        }
    }
}
let gameManager = new GameManager();
window.gameManager = gameManager;
window.GP = _geom__WEBPACK_IMPORTED_MODULE_6__["GlobalPoint"];
window.Asset = _shapes_asset__WEBPACK_IMPORTED_MODULE_4__["default"];
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
    gameManager.tools.getIndexValue(gameManager.selectedTool).onMouseDown(e);
}
function onPointerMove(e) {
    if (!gameManager.board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    gameManager.tools.getIndexValue(gameManager.selectedTool).onMouseMove(e);
    // Annotation hover
    let found = false;
    for (let i = 0; i < gameManager.annotations.length; i++) {
        const uuid = gameManager.annotations[i];
        if (gameManager.layerManager.UUIDMap.has(uuid) && gameManager.layerManager.hasLayer("draw")) {
            const draw_layer = gameManager.layerManager.getLayer("draw");
            if (gameManager.annotationText.layer !== "draw")
                draw_layer.addShape(gameManager.annotationText, false);
            const shape = gameManager.layerManager.UUIDMap.get(uuid);
            if (shape.contains(Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e)))) {
                found = true;
                gameManager.annotationText.text = shape.annotation;
                gameManager.annotationText.refPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2g"])(new _geom__WEBPACK_IMPORTED_MODULE_6__["LocalPoint"]((draw_layer.canvas.width / 2) - shape.annotation.length / 2, 50));
                draw_layer.invalidate(true);
            }
        }
    }
    if (!found && gameManager.annotationText.text !== '') {
        gameManager.annotationText.text = '';
        gameManager.layerManager.getLayer("draw").invalidate(true);
    }
}
function onPointerUp(e) {
    if (!gameManager.board_initialised)
        return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS')
        return;
    gameManager.tools.getIndexValue(gameManager.selectedTool).onMouseUp(e);
}
window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);
window.addEventListener('contextmenu', function (e) {
    if (!gameManager.board_initialised)
        return;
    if (e.button !== 2 || e.target.tagName !== 'CANVAS')
        return;
    e.preventDefault();
    e.stopPropagation();
    gameManager.tools.getIndexValue(gameManager.selectedTool).onContextMenu(e);
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
            locationOptions: {
                [`${gameManager.roomName}/${gameManager.roomCreator}/${gameManager.locationName}`]: {
                    panX: gameManager.layerManager.panX,
                    panY: gameManager.layerManager.panY,
                    zoomFactor: newZ,
                }
            }
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
        if (gameManager.layerManager.getLayer === undefined) {
            console.log("No active layer selected for delete operation");
            return;
        }
        const l = gameManager.layerManager.getLayer();
        l.selection.forEach(function (sel) {
            l.removeShape(sel, true, false);
            gameManager.initiativeTracker.removeInitiative(sel.uuid, true, false);
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

/***/ "./ts_src/shapes/asset.ts":
/*!********************************!*\
  !*** ./ts_src/shapes/asset.ts ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Asset; });
/* harmony import */ var _baserect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baserect */ "./ts_src/shapes/baserect.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");



class Asset extends _baserect__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(img, topleft, w, h, uuid) {
        super(topleft, w, h);
        this.type = "asset";
        this.src = '';
        if (uuid !== undefined)
            this.uuid = uuid;
        this.img = img;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            src: this.src
        });
    }
    fromDict(data) {
        super.fromDict(data);
        this.src = data.src;
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.drawImage(this.img, Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lx"])(this.refPoint.x), Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2ly"])(this.refPoint.y), Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lz"])(this.w), Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lz"])(this.h));
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM,
            group: false,
            src: this.src,
            owners: this.owners
        };
    }
}


/***/ }),

/***/ "./ts_src/shapes/baserect.ts":
/*!***********************************!*\
  !*** ./ts_src/shapes/baserect.ts ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return BaseRect; });
/* harmony import */ var _boundingrect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./boundingrect */ "./ts_src/shapes/boundingrect.ts");
/* harmony import */ var _shape__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shape */ "./ts_src/shapes/shape.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");




class BaseRect extends _shape__WEBPACK_IMPORTED_MODULE_1__["default"] {
    constructor(topleft, w, h, uuid) {
        super(topleft, uuid);
        this.w = w;
        this.h = h;
    }
    getBaseDict() {
        return Object.assign(super.getBaseDict(), {
            w: this.w,
            h: this.h
        });
    }
    getBoundingBox() {
        return new _boundingrect__WEBPACK_IMPORTED_MODULE_0__["default"](this.refPoint, this.w, this.h);
    }
    contains(point) {
        return this.refPoint.x <= point.x && (this.refPoint.x + this.w) >= point.x &&
            this.refPoint.y <= point.y && (this.refPoint.y + this.h) >= point.y;
    }
    inCorner(point, corner) {
        switch (corner) {
            case 'ne':
                return this.refPoint.x + this.w - 3 <= point.x && point.x <= this.refPoint.x + this.w + 3 && this.refPoint.y - 3 <= point.y && point.y <= this.refPoint.y + 3;
            case 'nw':
                return this.refPoint.x - 3 <= point.x && point.x <= this.refPoint.x + 3 && this.refPoint.y - 3 <= point.y && point.y <= this.refPoint.y + 3;
            case 'sw':
                return this.refPoint.x - 3 <= point.x && point.x <= this.refPoint.x + 3 && this.refPoint.y + this.h - 3 <= point.y && point.y <= this.refPoint.y + this.h + 3;
            case 'se':
                return this.refPoint.x + this.w - 3 <= point.x && point.x <= this.refPoint.x + this.w + 3 && this.refPoint.y + this.h - 3 <= point.y && point.y <= this.refPoint.y + this.h + 3;
            default:
                return false;
        }
    }
    getCorner(point) {
        if (this.inCorner(point, "ne"))
            return "ne";
        else if (this.inCorner(point, "nw"))
            return "nw";
        else if (this.inCorner(point, "se"))
            return "se";
        else if (this.inCorner(point, "sw"))
            return "sw";
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return this.refPoint.add(new _geom__WEBPACK_IMPORTED_MODULE_2__["Vector"]({ x: this.w / 2, y: this.h / 2 }));
        this.refPoint.x = centerPoint.x - this.w / 2;
        this.refPoint.y = centerPoint.y - this.h / 2;
    }
    visibleInCanvas(canvas) {
        return !(Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2lx"])(this.refPoint.x) > canvas.width || Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2ly"])(this.refPoint.y) > canvas.height ||
            Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2lx"])(this.refPoint.x + this.w) < 0 || Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2ly"])(this.refPoint.y + this.h) < 0);
    }
}


/***/ }),

/***/ "./ts_src/shapes/boundingrect.ts":
/*!***************************************!*\
  !*** ./ts_src/shapes/boundingrect.ts ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return BoundingRect; });
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");

class BoundingRect {
    constructor(topleft, w, h) {
        this.type = "boundrect";
        this.refPoint = topleft;
        this.w = w;
        this.h = h;
    }
    contains(point) {
        return this.refPoint.x <= point.x && (this.refPoint.x + this.w) >= point.x &&
            this.refPoint.y <= point.y && (this.refPoint.y + this.h) >= point.y;
    }
    offset(vector) {
        return new BoundingRect(this.refPoint.add(vector), this.w, this.h);
    }
    intersectsWith(other) {
        return !(other.refPoint.x > this.refPoint.x + this.w ||
            other.refPoint.x + other.w < this.refPoint.x ||
            other.refPoint.y > this.refPoint.y + this.h ||
            other.refPoint.y + other.h < this.refPoint.y);
    }
    getIntersectAreaWithRect(other) {
        const topleft = new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](Math.max(this.refPoint.x, other.refPoint.x), Math.max(this.refPoint.y, other.refPoint.y));
        const w = Math.min(this.refPoint.x + this.w, other.refPoint.x + other.w) - topleft.x;
        const h = Math.min(this.refPoint.y + this.h, other.refPoint.y + other.h) - topleft.y;
        return new BoundingRect(topleft, w, h);
    }
    getIntersectWithLine(line) {
        const lines = [
            Object(_geom__WEBPACK_IMPORTED_MODULE_0__["getLinesIntersectPoint"])(new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x, this.refPoint.y), new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x + this.w, this.refPoint.y), line.start, line.end),
            Object(_geom__WEBPACK_IMPORTED_MODULE_0__["getLinesIntersectPoint"])(new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x + this.w, this.refPoint.y), new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x + this.w, this.refPoint.y + this.h), line.start, line.end),
            Object(_geom__WEBPACK_IMPORTED_MODULE_0__["getLinesIntersectPoint"])(new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x, this.refPoint.y), new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x, this.refPoint.y + this.h), line.start, line.end),
            Object(_geom__WEBPACK_IMPORTED_MODULE_0__["getLinesIntersectPoint"])(new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x, this.refPoint.y + this.h), new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](this.refPoint.x + this.w, this.refPoint.y + this.h), line.start, line.end)
        ];
        let min_d = Infinity;
        let min_i = null;
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            if (l.intersect === null)
                continue;
            const d = Object(_geom__WEBPACK_IMPORTED_MODULE_0__["getPointDistance"])(line.start, l.intersect);
            if (min_d > d) {
                min_d = d;
                min_i = l.intersect;
            }
        }
        return { intersect: min_i, distance: min_d };
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return this.refPoint.add(new _geom__WEBPACK_IMPORTED_MODULE_0__["Vector"]({ x: this.w / 2, y: this.h / 2 }));
        this.refPoint.x = centerPoint.x - this.w / 2;
        this.refPoint.y = centerPoint.y - this.h / 2;
    }
}


/***/ }),

/***/ "./ts_src/shapes/circle.ts":
/*!*********************************!*\
  !*** ./ts_src/shapes/circle.ts ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Circle; });
/* harmony import */ var _shape__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shape */ "./ts_src/shapes/shape.ts");
/* harmony import */ var _boundingrect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./boundingrect */ "./ts_src/shapes/boundingrect.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");




class Circle extends _shape__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(center, r, fill, border, uuid) {
        super(center, uuid);
        this.type = "circle";
        this.r = r || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    }
    ;
    asDict() {
        // const base = <ServerCircle>this.getBaseDict();
        // base.r = this.r;
        // base.border = this.border;
        // return base;
        return Object.assign(this.getBaseDict(), {
            r: this.r,
            border: this.border
        });
    }
    fromDict(data) {
        super.fromDict(data);
        this.r = data.r;
        if (data.border)
            this.border = data.border;
    }
    getBoundingBox() {
        return new _boundingrect__WEBPACK_IMPORTED_MODULE_1__["default"](new _geom__WEBPACK_IMPORTED_MODULE_3__["GlobalPoint"](this.refPoint.x - this.r, this.refPoint.y - this.r), this.r * 2, this.r * 2);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        const loc = Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2l"])(this.refPoint);
        ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.strokeStyle = this.border;
            ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(point) {
        return (point.x - this.refPoint.x) ** 2 + (point.y - this.refPoint.y) ** 2 < this.r ** 2;
    }
    inCorner(point, corner) {
        return false; //TODO
    }
    getCorner(point) {
        if (this.inCorner(point, "ne"))
            return "ne";
        else if (this.inCorner(point, "nw"))
            return "nw";
        else if (this.inCorner(point, "se"))
            return "se";
        else if (this.inCorner(point, "sw"))
            return "sw";
    }
    center(centerPoint) {
        if (centerPoint === undefined)
            return this.refPoint;
        this.refPoint = centerPoint;
    }
    visibleInCanvas(canvas) { return true; } // TODO
}


/***/ }),

/***/ "./ts_src/shapes/editdialog.ts":
/*!*************************************!*\
  !*** ./ts_src/shapes/editdialog.ts ***!
  \*************************************/
/*! exports provided: populateEditAssetDialog */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "populateEditAssetDialog", function() { return populateEditAssetDialog; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");



function populateEditAssetDialog(self) {
    $("#shapeselectiondialog-uuid").val(self.uuid);
    const dialog_name = $("#shapeselectiondialog-name");
    dialog_name.val(self.name);
    dialog_name.on("change", function () {
        const uuid = $("#shapeselectiondialog-uuid").val();
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(uuid)) {
            const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(uuid);
            s.name = $(this).val();
            $("#selection-name").text($(this).val());
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: s.asDict(), redraw: false });
        }
    });
    const dialog_lightblock = $("#shapeselectiondialog-lightblocker");
    dialog_lightblock.prop("checked", self.visionObstruction);
    dialog_lightblock.on("click", function () {
        const uuid = $("#shapeselectiondialog-uuid").val();
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(uuid)) {
            const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(uuid);
            s.visionObstruction = dialog_lightblock.prop("checked");
            s.checkLightSources();
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: s.asDict(), redraw: true });
        }
    });
    const dialog_moveblock = $("#shapeselectiondialog-moveblocker");
    dialog_moveblock.prop("checked", self.movementObstruction);
    dialog_moveblock.on("click", function () {
        const uuid = $("#shapeselectiondialog-uuid").val();
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(uuid)) {
            const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(uuid);
            s.setMovementBlock(dialog_moveblock.prop("checked"));
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: s.asDict(), redraw: false });
        }
    });
    const annotation_text = $("#shapeselectiondialog-annotation-textarea");
    annotation_text.val(self.annotation);
    annotation_text.on("change", function () {
        const uuid = $("#shapeselectiondialog-uuid").val();
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(uuid)) {
            const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(uuid);
            const had_annotation = s.annotation !== '';
            s.annotation = $(this).val();
            if (s.annotation !== '' && !had_annotation) {
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].annotations.push(s.uuid);
                if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer("draw"))
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("draw").invalidate(true);
            }
            else if (s.annotation == '' && had_annotation) {
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].annotations.splice(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].annotations.findIndex(an => an === s.uuid));
                if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer("draw"))
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("draw").invalidate(true);
            }
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: s.asDict(), redraw: false });
        }
    });
    const owners = $("#shapeselectiondialog-owners");
    const trackers = $("#shapeselectiondialog-trackers");
    const auras = $("#shapeselectiondialog-auras");
    const annotation = $("#shapeselectiondialog-annotation");
    owners.nextUntil(trackers).remove();
    trackers.nextUntil(auras).remove();
    auras.nextUntil(annotation).remove(); //($("#shapeselectiondialog").find("form")).remove();
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
            if (!self.owners.length || self.owners[self.owners.length - 1] !== '') {
                addOwner("");
            }
        });
        ow_remove.on("click", function () {
            const ow_i = self.owners.findIndex(o => o === $(this).data('name'));
            $(this).prev().remove();
            $(this).remove();
            self.owners.splice(ow_i, 1);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
        });
    }
    self.owners.forEach(addOwner);
    if (!self.owners.length || self.owners[self.owners.length - 1] !== '')
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
            if (tr === undefined) {
                console.log("Name change on unknown tracker");
                return;
            }
            tr.name = $(this).val();
            $(`#selection-tracker-${tr.uuid}-name`).text($(this).val());
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
            if (!self.trackers.length || self.trackers[self.trackers.length - 1].name !== '' || self.trackers[self.trackers.length - 1].value !== 0) {
                self.trackers.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(), name: '', value: 0, maxvalue: 0, visible: false });
                addTracker(self.trackers[self.trackers.length - 1]);
            }
        });
        tr_val.on("change", function () {
            const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
            if (tr === undefined) {
                console.log("Value change on unknown tracker");
                return;
            }
            tr.value = parseInt($(this).val());
            const val = tr.maxvalue ? `${tr.value}/${tr.maxvalue}` : tr.value;
            $(`#selection-tracker-${tr.uuid}-value`).text(val);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
        });
        tr_maxval.on("change", function () {
            const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
            if (tr === undefined) {
                console.log("Mazvalue change on unknown tracker");
                return;
            }
            tr.maxvalue = parseInt($(this).val());
            const val = tr.maxvalue ? `${tr.value}/${tr.maxvalue}` : tr.value;
            $(`#selection-tracker-${tr.uuid}-value`).text(val);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
        });
        tr_remove.on("click", function () {
            const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
            if (tr === undefined) {
                console.log("Remove on unknown tracker");
                return;
            }
            if (tr.name === '' || tr.value === 0)
                return;
            $(`[data-uuid=${tr.uuid}]`).remove();
            self.trackers.splice(self.trackers.indexOf(tr), 1);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: false });
        });
        tr_visible.on("click", function () {
            const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
            if (tr === undefined) {
                console.log("Visibility change on unknown tracker");
                return;
            }
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
        // $("#shapeselectiondialog").children().last().append(
        annotation.before(aura_name
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
                if (au === undefined) {
                    console.log("Attempted to move unknown aura colour");
                    return;
                }
                // Do not use aura directly as it does not work properly for new auras
                au.colour = colour.toRgbString();
                if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(self.layer)) {
                    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(true);
                }
                else {
                    console.log("Aura colour target has no associated layer");
                }
            },
            change: function () {
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
            }
        });
        aura_name.on("change", function () {
            const au = self.auras.find(a => a.uuid === $(this).data('uuid'));
            if (au === undefined) {
                console.log("Attempted to change name of unknown aura");
                return;
            }
            au.name = $(this).val();
            $(`#selection-aura-${au.uuid}-name`).text($(this).val());
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
            if (!self.auras.length || self.auras[self.auras.length - 1].name !== '' || self.auras[self.auras.length - 1].value !== 0) {
                self.auras.push({
                    uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(),
                    name: '',
                    value: 0,
                    dim: 0,
                    lightSource: false,
                    colour: 'rgba(0,0,0,0)',
                    visible: false
                });
                addAura(self.auras[self.auras.length - 1]);
            }
        });
        aura_val.on("change", function () {
            const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
            if (au === undefined) {
                console.log("Attempted to change value of unknown aura");
                return;
            }
            au.value = parseInt($(this).val());
            const val = au.dim ? `${au.value}/${au.dim}` : au.value;
            $(`#selection-aura-${au.uuid}-value`).text(val);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
            if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(self.layer)) {
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(true);
            }
            else {
                console.log("Aura colour target has no associated layer");
            }
        });
        aura_dimval.on("change", function () {
            const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
            if (au === undefined) {
                console.log("Attempted to change dimvalue of unknown aura");
                return;
            }
            au.value = parseInt($(this).val());
            const val = au.dim ? `${au.value}/${au.dim}` : au.value;
            $(`#selection-aura-${au.uuid}-value`).text(val);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
            if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(self.layer)) {
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(true);
            }
            else {
                console.log("Aura colour target has no associated layer");
            }
        });
        aura_remove.on("click", function () {
            const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
            if (au === undefined) {
                console.log("Attempted to remove unknown aura");
                return;
            }
            if (au.name === '' && au.value === 0)
                return;
            $(`[data-uuid=${au.uuid}]`).remove();
            self.auras.splice(self.auras.indexOf(au), 1);
            self.checkLightSources();
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
            if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(self.layer)) {
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(true);
            }
            else {
                console.log("Aura colour target has no associated layer");
            }
        });
        aura_visible.on("click", function () {
            const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
            if (au === undefined) {
                console.log("Attempted to toggle visibility of unknown aura");
                return;
            }
            au.visible = !au.visible;
            if (au.visible)
                $(this).css("opacity", 1.0);
            else
                $(this).css("opacity", 0.3);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
        });
        aura_light.on("click", function () {
            const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
            if (au === undefined) {
                console.log("Attempted to toggle light capability of unknown aura");
                return;
            }
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
            if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer("fow"))
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("fow").invalidate(false);
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
        });
    }
    for (let i = 0; i < self.auras.length; i++) {
        addAura(self.auras[i]);
    }
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].shapeSelectionDialog.dialog("open");
    $('.selection-tracker-value').on("click", function () {
        const uuid = $(this).data('uuid');
        const tracker = self.trackers.find(t => t.uuid === uuid);
        if (tracker === undefined) {
            console.log("Attempted to update unknown tracker");
            return;
        }
        const new_tracker = prompt(`New  ${tracker.name} value: (absolute or relative)`);
        if (new_tracker === null)
            return;
        if (tracker.value === 0)
            tracker.value = 0;
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
        if (aura === undefined) {
            console.log("Attempted to update unknown aura");
            return;
        }
        const new_aura = prompt(`New  ${aura.name} value: (absolute or relative)`);
        if (new_aura === null)
            return;
        if (aura.value === 0)
            aura.value = 0;
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
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(self.layer))
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate(false);
    });
}


/***/ }),

/***/ "./ts_src/shapes/line.ts":
/*!*******************************!*\
  !*** ./ts_src/shapes/line.ts ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Line; });
/* harmony import */ var _shape__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shape */ "./ts_src/shapes/shape.ts");
/* harmony import */ var _boundingrect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./boundingrect */ "./ts_src/shapes/boundingrect.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");




class Line extends _shape__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(startPoint, endPoint, uuid) {
        super(startPoint, uuid);
        this.type = "line";
        this.endPoint = endPoint;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            x2: this.endPoint.x,
            y2: this.endPoint.y,
        });
    }
    getBoundingBox() {
        return new _boundingrect__WEBPACK_IMPORTED_MODULE_1__["default"](new _geom__WEBPACK_IMPORTED_MODULE_3__["GlobalPoint"](Math.min(this.refPoint.x, this.endPoint.x), Math.min(this.refPoint.x, this.endPoint.y)), Math.abs(this.refPoint.x - this.endPoint.x), Math.abs(this.refPoint.y - this.endPoint.y));
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lx"])(this.refPoint.x), Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2ly"])(this.refPoint.y));
        ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lx"])(this.endPoint.x), Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2ly"])(this.endPoint.y));
        ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    contains(point) {
        return false; // TODO
    }
    center(centerPoint) { } // TODO
    getCorner(point) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
}


/***/ }),

/***/ "./ts_src/shapes/rect.ts":
/*!*******************************!*\
  !*** ./ts_src/shapes/rect.ts ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Rect; });
/* harmony import */ var _baserect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baserect */ "./ts_src/shapes/baserect.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");



class Rect extends _baserect__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(topleft, w, h, fill, border, uuid) {
        super(topleft, w, h, uuid);
        this.type = "rect";
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            border: this.border
        });
    }
    fromDict(data) {
        super.fromDict(data);
        if (data.border)
            this.border = data.border;
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = this.fill;
        const z = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.zoomFactor;
        const loc = Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2l"])(this.refPoint);
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.border;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
}


/***/ }),

/***/ "./ts_src/shapes/shape.ts":
/*!********************************!*\
  !*** ./ts_src/shapes/shape.ts ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Shape; });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _editdialog__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./editdialog */ "./ts_src/shapes/editdialog.ts");




const $menu = $('#contextMenu');
class Shape {
    constructor(refPoint, uuid) {
        // Fill colour of the shape
        this.fill = '#000';
        //The optional name associated with the shape
        this.name = 'Unknown shape';
        // Associated trackers/auras/owners
        this.trackers = [];
        this.auras = [];
        this.owners = [];
        // Block light sources
        this.visionObstruction = false;
        // Prevent shapes from overlapping with this shape
        this.movementObstruction = false;
        // Mouseover annotation
        this.annotation = '';
        // Draw modus to use
        this.globalCompositeOperation = "source-over";
        this.refPoint = refPoint;
        this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_0__["uuidv4"])();
    }
    checkLightSources() {
        const self = this;
        const vo_i = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightblockers.indexOf(this.uuid);
        if (this.visionObstruction && vo_i === -1)
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightblockers.push(this.uuid);
        else if (!this.visionObstruction && vo_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightblockers.splice(vo_i, 1);
        // Check if the lightsource auras are in the gameManager
        this.auras.forEach(function (au) {
            const ls = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightsources;
            const i = ls.findIndex(o => o.aura === au.uuid);
            if (au.lightSource && i === -1) {
                ls.push({ shape: self.uuid, aura: au.uuid });
            }
            else if (!au.lightSource && i >= 0) {
                ls.splice(i, 1);
            }
        });
        // Check if anything in the gameManager referencing this shape is in fact still a lightsource
        for (let i = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightsources.length - 1; i >= 0; i--) {
            const ls = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightsources[i];
            if (ls.shape === self.uuid) {
                if (!self.auras.some(a => a.uuid === ls.aura && a.lightSource))
                    _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightsources.splice(i, 1);
            }
        }
    }
    setMovementBlock(blocksMovement) {
        this.movementObstruction = blocksMovement || false;
        const vo_i = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].movementblockers.indexOf(this.uuid);
        if (this.movementObstruction && vo_i === -1)
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].movementblockers.push(this.uuid);
        else if (!this.movementObstruction && vo_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].movementblockers.splice(vo_i, 1);
    }
    ownedBy(username) {
        if (username === undefined)
            username = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username;
        return _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM || this.owners.includes(username);
    }
    onSelection() {
        if (!this.trackers.length || this.trackers[this.trackers.length - 1].name !== '' || this.trackers[this.trackers.length - 1].value !== 0)
            this.trackers.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_0__["uuidv4"])(), name: '', value: 0, maxvalue: 0, visible: false });
        if (!this.auras.length || this.auras[this.auras.length - 1].name !== '' || this.auras[this.auras.length - 1].value !== 0)
            this.auras.push({
                uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_0__["uuidv4"])(),
                name: '',
                value: 0,
                dim: 0,
                lightSource: false,
                colour: 'rgba(0,0,0,0)',
                visible: false
            });
        $("#selection-name").text(this.name);
        const trackers = $("#selection-trackers");
        trackers.empty();
        this.trackers.forEach(function (tracker) {
            if (tracker.value === 0)
                return;
            const val = tracker.maxvalue ? `${tracker.value}/${tracker.maxvalue}` : tracker.value;
            trackers.append($(`<div id="selection-tracker-${tracker.uuid}-name" data-uuid="${tracker.uuid}">${tracker.name}</div>`));
            trackers.append($(`<div id="selection-tracker-${tracker.uuid}-value" data-uuid="${tracker.uuid}" class="selection-tracker-value">${val}</div>`));
        });
        const auras = $("#selection-auras");
        auras.empty();
        this.auras.forEach(function (aura) {
            if (aura.value === 0)
                return;
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
        editbutton.on("click", function () { Object(_editdialog__WEBPACK_IMPORTED_MODULE_3__["populateEditAssetDialog"])(self); });
    }
    onSelectionLoss() {
        // $(`#shapeselectioncog-${this.uuid}`).remove();
        $("#selection-menu").hide();
    }
    getBaseDict() {
        return {
            type: this.type,
            uuid: this.uuid,
            x: this.refPoint.x,
            y: this.refPoint.y,
            layer: this.layer,
            globalCompositeOperation: this.globalCompositeOperation,
            movementObstruction: this.movementObstruction,
            visionObstruction: this.visionObstruction,
            auras: this.auras,
            trackers: this.trackers,
            owners: this.owners,
            fill: this.fill,
            name: this.name,
            annotation: this.annotation,
        };
    }
    fromDict(data) {
        this.layer = data.layer;
        this.globalCompositeOperation = data.globalCompositeOperation;
        this.movementObstruction = data.movementObstruction;
        this.visionObstruction = data.visionObstruction;
        this.auras = data.auras;
        this.trackers = data.trackers;
        this.owners = data.owners;
        if (data.annotation)
            this.annotation = data.annotation;
        if (data.name)
            this.name = data.name;
    }
    draw(ctx) {
        if (this.layer === 'fow') {
            this.fill = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].fowColour.spectrum("get").toRgbString();
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
            if (aura.value === 0)
                return;
            ctx.beginPath();
            ctx.fillStyle = aura.colour;
            if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.hasLayer("fow") && _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("fow").ctx === ctx)
                ctx.fillStyle = "black";
            const loc = Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2l"])(self.center());
            ctx.arc(loc.x, loc.y, Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lr"])(aura.value), 0, 2 * Math.PI);
            ctx.fill();
            if (aura.dim) {
                const tc = tinycolor(aura.colour);
                ctx.beginPath();
                ctx.fillStyle = tc.setAlpha(tc.getAlpha() / 2).toRgbString();
                const loc = Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2l"])(self.center());
                ctx.arc(loc.x, loc.y, Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2lr"])(aura.dim), 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }
    showContextMenu(mouse) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined)
            return;
        const l = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
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
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.layers.forEach(function (layer) {
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
            asset.onContextMenu($(this));
        });
    }
    onContextMenu(menu) {
        const action = menu.data("action");
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        if (layer === undefined)
            return;
        switch (action) {
            case 'moveToFront':
                layer.moveShapeOrder(this, layer.shapes.length - 1, true);
                break;
            case 'moveToBack':
                layer.moveShapeOrder(this, 0, true);
                break;
            case 'setLayer':
                layer.removeShape(this, true);
                _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer(menu.data("layer")).addShape(this, true);
                break;
            case 'addInitiative':
                _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeTracker.addInitiative(this.getInitiativeRepr(), true);
                break;
        }
        $menu.hide();
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM,
            group: false,
            src: "",
            owners: this.owners
        };
    }
}


/***/ }),

/***/ "./ts_src/shapes/text.ts":
/*!*******************************!*\
  !*** ./ts_src/shapes/text.ts ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Text; });
/* harmony import */ var _shape__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./shape */ "./ts_src/shapes/shape.ts");
/* harmony import */ var _boundingrect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./boundingrect */ "./ts_src/shapes/boundingrect.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");



class Text extends _shape__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(position, text, font, angle, uuid) {
        super(position, uuid);
        this.type = "text";
        this.text = text;
        this.font = font;
        this.angle = angle || 0;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            text: this.text,
            font: this.font,
            angle: this.angle
        });
    }
    getBoundingBox() {
        return new _boundingrect__WEBPACK_IMPORTED_MODULE_1__["default"](this.refPoint, 5, 5); // Todo: fix this bounding box
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        const dest = Object(_units__WEBPACK_IMPORTED_MODULE_2__["g2l"])(this.refPoint);
        ctx.translate(dest.x, dest.y);
        ctx.rotate(this.angle);
        ctx.textAlign = "center";
        // ctx.fillText(this.text, 0, -5);
        this.drawWrappedText(ctx);
        ctx.restore();
    }
    contains(point) {
        return false; // TODO
    }
    center(centerPoint) { } // TODO
    getCorner(point) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
    drawWrappedText(ctx) {
        const lines = this.text.split("\n");
        const maxWidth = ctx.canvas.width;
        const lineHeight = 30;
        const x = 0; //this.refPoint.x;
        let y = -5; //this.refPoint.y;
        for (let n = 0; n < lines.length; n++) {
            let line = '';
            const words = lines[n].split(" ");
            for (let w = 0; w < words.length; w++) {
                const testLine = line + words[w] + " ";
                var metrics = ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, x, y);
                    line = words[w] + " ";
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, y);
            y += lineHeight;
        }
    }
}


/***/ }),

/***/ "./ts_src/shapes/utils.ts":
/*!********************************!*\
  !*** ./ts_src/shapes/utils.ts ***!
  \********************************/
/*! exports provided: createShapeFromDict */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createShapeFromDict", function() { return createShapeFromDict; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _rect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rect */ "./ts_src/shapes/rect.ts");
/* harmony import */ var _circle__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./circle */ "./ts_src/shapes/circle.ts");
/* harmony import */ var _line__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./line */ "./ts_src/shapes/line.ts");
/* harmony import */ var _text__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./text */ "./ts_src/shapes/text.ts");
/* harmony import */ var _asset__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./asset */ "./ts_src/shapes/asset.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");







function createShapeFromDict(shape, dummy) {
    // todo is this dummy stuff actually needed, do we ever want to return the local shape?
    if (dummy === undefined)
        dummy = false;
    if (!dummy && _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(shape.uuid))
        return _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(shape.uuid);
    let sh;
    // A fromJSON and toJSON on Shape would be cleaner but ts does not allow for static abstracts so yeah.
    const refPoint = new _geom__WEBPACK_IMPORTED_MODULE_6__["GlobalPoint"](shape.x, shape.y);
    if (shape.type === 'rect') {
        const rect = shape;
        sh = new _rect__WEBPACK_IMPORTED_MODULE_1__["default"](refPoint, rect.w, rect.h, rect.fill, rect.border, rect.uuid);
    }
    else if (shape.type === 'circle') {
        const circ = shape;
        sh = new _circle__WEBPACK_IMPORTED_MODULE_2__["default"](refPoint, circ.r, circ.fill, circ.border, circ.uuid);
    }
    else if (shape.type === 'line') {
        const line = shape;
        sh = new _line__WEBPACK_IMPORTED_MODULE_3__["default"](refPoint, new _geom__WEBPACK_IMPORTED_MODULE_6__["GlobalPoint"](line.x2, line.y2), line.uuid);
    }
    else if (shape.type === 'text') {
        const text = shape;
        sh = new _text__WEBPACK_IMPORTED_MODULE_4__["default"](refPoint, text.text, text.font, text.angle, text.uuid);
    }
    else if (shape.type === 'asset') {
        const asset = shape;
        const img = new Image(asset.w, asset.h);
        if (asset.src.startsWith("http"))
            img.src = new URL(asset.src).pathname;
        else
            img.src = asset.src;
        sh = new _asset__WEBPACK_IMPORTED_MODULE_5__["default"](img, refPoint, asset.w, asset.h, asset.uuid);
        img.onload = function () {
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer).invalidate(false);
        };
    }
    else {
        return undefined;
    }
    sh.fromDict(shape);
    return sh;
}


/***/ }),

/***/ "./ts_src/socket.ts":
/*!**************************!*\
  !*** ./ts_src/socket.ts ***!
  \**************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./ts_src/utils.ts");
/* harmony import */ var _tools_tools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tools/tools */ "./ts_src/tools/tools.ts");



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
socket.on("set room info", function (data) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].roomName = data.name;
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].roomCreator = data.creator;
});
socket.on("set username", function (username) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username = username;
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM = username === window.location.pathname.split("/")[2];
    if ($("#toolselect").find("ul").html().length === 0)
        Object(_tools_tools__WEBPACK_IMPORTED_MODULE_2__["setupTools"])();
});
socket.on("set clientOptions", function (options) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].setClientOptions(options);
});
socket.on("set location", function (data) {
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].locationName = data.name;
    _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.setOptions(data.options);
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
    if (!_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(shape.uuid)) {
        console.log(`Attempted to remove an unknown shape`);
        return;
    }
    if (!_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
        return;
    }
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer);
    layer.removeShape(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(shape.uuid), false);
    layer.invalidate(false);
});
socket.on("moveShapeOrder", function (data) {
    if (!_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(data.shape.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return;
    }
    if (!_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(data.shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${data.shape.layer}`);
        return;
    }
    const shape = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(data.shape.uuid);
    const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer);
    layer.moveShapeOrder(shape, data.index, false);
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
        if (!_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(shape.uuid)) {
            console.log("Attempted to remove an unknown temporary shape");
            return;
        }
        if (!_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer(shape.layer)) {
            console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
            return;
        }
        const real_shape = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(shape.uuid);
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer).removeShape(real_shape, false);
    });
});
/* harmony default export */ __webpack_exports__["default"] = (socket);


/***/ }),

/***/ "./ts_src/tools/draw.ts":
/*!******************************!*\
  !*** ./ts_src/tools/draw.ts ***!
  \******************************/
/*! exports provided: DrawTool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DrawTool", function() { return DrawTool; });
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _shapes_rect__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shapes/rect */ "./ts_src/shapes/rect.ts");
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");
/* harmony import */ var _shapes_circle__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shapes/circle */ "./ts_src/shapes/circle.ts");







class DrawTool extends _tool__WEBPACK_IMPORTED_MODULE_5__["Tool"] {
    constructor() {
        super();
        this.active = false;
        this.fillColor = $("<input type='text' />");
        this.borderColor = $("<input type='text' />");
        this.shapeSelect = $("<select><option value='square'>&#xf0c8;</option><option value='circle'>&#xf111;</option></select>");
        this.detailDiv = $("<div>")
            .append($("<div>Fill</div>")).append(this.fillColor)
            .append($("<div>Border</div>")).append(this.borderColor)
            .append($("<div>Shape</div>")).append(this.shapeSelect)
            .append($("</div>"));
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
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_1__["getMouse"])(e));
        const fillColor = this.fillColor.spectrum("get");
        const fill = fillColor === null ? tinycolor("transparent") : fillColor;
        const borderColor = this.borderColor.spectrum("get");
        const border = borderColor === null ? tinycolor("transparent") : borderColor;
        if (this.shapeSelect.val() === 'square')
            this.shape = new _shapes_rect__WEBPACK_IMPORTED_MODULE_4__["default"](this.startPoint.clone(), 0, 0, fill.toRgbString(), border.toRgbString());
        else if (this.shapeSelect.val() === 'circle')
            this.shape = new _shapes_circle__WEBPACK_IMPORTED_MODULE_6__["default"](this.startPoint.clone(), 0, fill.toRgbString(), border.toRgbString());
        this.shape.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
        if (layer.name === 'fow') {
            this.shape.visionObstruction = true;
            this.shape.movementObstruction = true;
        }
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightblockers.push(this.shape.uuid);
        layer.addShape(this.shape, true, false);
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_1__["getMouse"])(e));
        if (this.shapeSelect.val() === 'square') {
            this.shape.w = Math.abs(endPoint.x - this.startPoint.x);
            this.shape.h = Math.abs(endPoint.y - this.startPoint.y);
            this.shape.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
            this.shape.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        }
        else if (this.shapeSelect.val() === 'circle') {
            this.shape.r = endPoint.subtract(this.startPoint).length();
        }
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.shape.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e) {
        this.active = false;
    }
}


/***/ }),

/***/ "./ts_src/tools/fow.ts":
/*!*****************************!*\
  !*** ./ts_src/tools/fow.ts ***!
  \*****************************/
/*! exports provided: FOWTool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FOWTool", function() { return FOWTool; });
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");
/* harmony import */ var _shapes_rect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shapes/rect */ "./ts_src/shapes/rect.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");






class FOWTool extends _tool__WEBPACK_IMPORTED_MODULE_0__["Tool"] {
    constructor() {
        super(...arguments);
        this.active = false;
        this.detailDiv = $("<div>")
            .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
            .append($("</div>"));
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("fow");
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e));
        this.rect = new _shapes_rect__WEBPACK_IMPORTED_MODULE_1__["default"](this.startPoint.clone(), 0, 0, _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString());
        layer.addShape(this.rect, true, false);
        if ($("#fow-reveal").prop("checked"))
            this.rect.globalCompositeOperation = "destination-out";
        else
            this.rect.globalCompositeOperation = "source-over";
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        // Currently draw on active layer
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("fow");
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e));
        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        _socket__WEBPACK_IMPORTED_MODULE_5__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e) {
        this.active = false;
    }
}


/***/ }),

/***/ "./ts_src/tools/initiative.ts":
/*!************************************!*\
  !*** ./ts_src/tools/initiative.ts ***!
  \************************************/
/*! exports provided: InitiativeTracker */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InitiativeTracker", function() { return InitiativeTracker; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");


class InitiativeTracker {
    constructor() {
        this.data = [];
    }
    addInitiative(data, sync) {
        // Open the initiative tracker if it is not currently open.
        if (this.data.length === 0 || !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeDialog.dialog("isOpen"))
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeDialog.dialog("open");
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
            _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateInitiative", data);
    }
    ;
    removeInitiative(uuid, sync, skipGroupCheck) {
        const d = this.data.findIndex(d => d.uuid === uuid);
        if (d >= 0) {
            if (!skipGroupCheck && this.data[d].group)
                return;
            this.data.splice(d, 1);
            this.redraw();
            if (sync)
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateInitiative", { uuid: uuid });
        }
        if (this.data.length === 0 && _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeDialog.dialog("isOpen"))
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeDialog.dialog("close");
    }
    ;
    redraw() {
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeDialog.empty();
        this.data.sort(function (a, b) {
            if (a.initiative === undefined)
                return 1;
            if (b.initiative === undefined)
                return -1;
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
            if (!data.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM) {
                val.prop("disabled", "disabled");
                remove.css("opacity", "0.3");
            }
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeDialog.append(img).append(val).append(visible).append(group).append(remove);
            val.on("change", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog change unknown uuid?");
                    return;
                }
                d.initiative = parseInt($(this).val()) || 0;
                self.addInitiative(d, true);
            });
            visible.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog visible unknown uuid?");
                    return;
                }
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM)
                    return;
                d.visible = !d.visible;
                if (d.visible)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateInitiative", d);
            });
            group.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog group unknown uuid?");
                    return;
                }
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM)
                    return;
                d.group = !d.group;
                if (d.group)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateInitiative", d);
            });
            remove.on("click", function () {
                const uuid = $(this).data('uuid');
                const d = self.data.find(d => d.uuid === uuid);
                if (d === undefined) {
                    console.log("Initiativedialog remove unknown uuid?");
                    return;
                }
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM)
                    return;
                $(`[data-uuid=${uuid}]`).remove();
                self.removeInitiative(uuid, true, true);
            });
        });
    }
    ;
}


/***/ }),

/***/ "./ts_src/tools/map.ts":
/*!*****************************!*\
  !*** ./ts_src/tools/map.ts ***!
  \*****************************/
/*! exports provided: MapTool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapTool", function() { return MapTool; });
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");
/* harmony import */ var _shapes_rect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shapes/rect */ "./ts_src/shapes/rect.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _shapes_baserect__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shapes/baserect */ "./ts_src/shapes/baserect.ts");






class MapTool extends _tool__WEBPACK_IMPORTED_MODULE_0__["Tool"] {
    constructor() {
        super(...arguments);
        this.active = false;
        this.xCount = $("<input type='text' value='3'>");
        this.yCount = $("<input type='text' value='3'>");
        this.detailDiv = $("<div>")
            .append($("<div>#X</div>")).append(this.xCount)
            .append($("<div>#Y</div>")).append(this.yCount)
            .append($("</div>"));
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect = new _shapes_rect__WEBPACK_IMPORTED_MODULE_1__["default"](this.startPoint, 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, false, false);
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        layer.invalidate(false);
    }
    onMouseUp(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        if (layer.selection.length !== 1) {
            layer.removeShape(this.rect, false, false);
            return;
        }
        const w = this.rect.w;
        const h = this.rect.h;
        const sel = layer.selection[0];
        if (sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_5__["default"]) {
            sel.w *= parseInt(this.xCount.val()) * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize / w;
            sel.h *= parseInt(this.yCount.val()) * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize / h;
            console.log("Updated selection");
        }
        layer.removeShape(this.rect, false, false);
    }
}


/***/ }),

/***/ "./ts_src/tools/pan.ts":
/*!*****************************!*\
  !*** ./ts_src/tools/pan.ts ***!
  \*****************************/
/*! exports provided: PanTool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PanTool", function() { return PanTool; });
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");






class PanTool extends _tool__WEBPACK_IMPORTED_MODULE_0__["Tool"] {
    constructor() {
        super(...arguments);
        this.panStart = new _geom__WEBPACK_IMPORTED_MODULE_1__["LocalPoint"](0, 0);
        this.active = false;
    }
    onMouseDown(e) {
        this.panStart = Object(_utils__WEBPACK_IMPORTED_MODULE_2__["getMouse"])(e);
        this.active = true;
    }
    ;
    onMouseMove(e) {
        if (!this.active)
            return;
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_2__["getMouse"])(e);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
        const distance = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2g"])(mouse.subtract(this.panStart)).direction;
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panX += Math.round(distance.x);
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panY += Math.round(distance.y);
        this.panStart = mouse;
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.invalidate();
    }
    ;
    onMouseUp(e) {
        this.active = false;
        _socket__WEBPACK_IMPORTED_MODULE_5__["default"].emit("set clientOptions", {
            locationOptions: {
                [`${_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].roomName}/${_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].roomCreator}/${_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].locationName}`]: {
                    panX: _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panX,
                    panY: _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.panY
                }
            }
        });
    }
    ;
    onContextMenu(e) { }
    ;
}


/***/ }),

/***/ "./ts_src/tools/ruler.ts":
/*!*******************************!*\
  !*** ./ts_src/tools/ruler.ts ***!
  \*******************************/
/*! exports provided: RulerTool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RulerTool", function() { return RulerTool; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");
/* harmony import */ var _shapes_line__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shapes/line */ "./ts_src/shapes/line.ts");
/* harmony import */ var _shapes_text__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shapes/text */ "./ts_src/shapes/text.ts");







class RulerTool extends _tool__WEBPACK_IMPORTED_MODULE_4__["Tool"] {
    constructor() {
        super(...arguments);
        this.active = false;
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("draw");
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_2__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.ruler = new _shapes_line__WEBPACK_IMPORTED_MODULE_5__["default"](this.startPoint, this.startPoint);
        this.text = new _shapes_text__WEBPACK_IMPORTED_MODULE_6__["default"](this.startPoint.clone(), "", "bold 20px serif");
        this.ruler.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username);
        this.text.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username);
        layer.addShape(this.ruler, true, true);
        layer.addShape(this.text, true, true);
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("draw") === undefined) {
            console.log("No draw layer!");
            return;
        }
        // Currently draw on active layer
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("draw");
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_2__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.ruler.endPoint = endPoint;
        _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("shapeMove", { shape: this.ruler.asDict(), temporary: true });
        const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
        const xdiff = Math.abs(endPoint.x - this.startPoint.x);
        const ydiff = Math.abs(endPoint.y - this.startPoint.y);
        const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.unitSize / _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.gridSize) + " ft";
        let angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
        const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
        this.text.refPoint.x = xmid;
        this.text.refPoint.y = ymid;
        this.text.text = label;
        this.text.angle = angle;
        _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("shapeMove", { shape: this.text.asDict(), temporary: true });
        layer.invalidate(true);
    }
    onMouseUp(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("draw");
        layer.removeShape(this.ruler, true, true);
        layer.removeShape(this.text, true, true);
        layer.invalidate(true);
    }
}


/***/ }),

/***/ "./ts_src/tools/select.ts":
/*!********************************!*\
  !*** ./ts_src/tools/select.ts ***!
  \********************************/
/*! exports provided: SelectTool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectTool", function() { return SelectTool; });
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tools */ "./ts_src/tools/tools.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");
/* harmony import */ var _shapes_rect__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shapes/rect */ "./ts_src/shapes/rect.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils */ "./ts_src/utils.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../socket */ "./ts_src/socket.ts");
/* harmony import */ var _shapes_baserect__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../shapes/baserect */ "./ts_src/shapes/baserect.ts");
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");









class SelectTool extends _tool__WEBPACK_IMPORTED_MODULE_8__["Tool"] {
    constructor() {
        super();
        this.mode = _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Noop;
        this.resizedir = "";
        // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
        // we keep track of the actual offset within the asset.
        this.drag = new _geom__WEBPACK_IMPORTED_MODULE_1__["Vector"]({ x: 0, y: 0 }, new _geom__WEBPACK_IMPORTED_MODULE_1__["LocalPoint"](0, 0));
        this.selectionStartPoint = new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](-1000, -1000);
        this.selectionHelper = new _shapes_rect__WEBPACK_IMPORTED_MODULE_2__["default"](this.selectionStartPoint, 0, 0);
        this.selectionHelper.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].username);
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e);
        let hit = false;
        // the selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length)
            selectionStack = layer.shapes;
        else
            selectionStack = layer.shapes.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            const corn = shape.getCorner(Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse));
            if (corn !== undefined) {
                if (!shape.ownedBy())
                    continue;
                layer.selection = [shape];
                shape.onSelection();
                this.mode = _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Resize;
                this.resizedir = corn;
                layer.invalidate(true);
                hit = true;
                break;
            }
            else if (shape.contains(Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse))) {
                if (!shape.ownedBy())
                    continue;
                const sel = shape;
                const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                this.mode = _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Drag;
                this.drag = mouse.subtract(Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2l"])(sel.refPoint));
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
            this.mode = _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].GroupSelect;
            this.selectionStartPoint = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e));
            this.selectionHelper.refPoint = this.selectionStartPoint;
            this.selectionHelper.w = 0;
            this.selectionHelper.h = 0;
            layer.selection = [this.selectionHelper];
            layer.invalidate(true);
        }
    }
    ;
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.zoomFactor;
        if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].GroupSelect) {
            // Currently draw on active this
            const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse);
            this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper.refPoint = new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](Math.min(this.selectionStartPoint.x, endPoint.x), Math.min(this.selectionStartPoint.y, endPoint.y));
            layer.invalidate(true);
        }
        else if (layer.selection.length) {
            const og = Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2l"])(layer.selection[layer.selection.length - 1].refPoint);
            let delta = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse.subtract(og.add(this.drag)));
            if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Drag) {
                // If we are on the tokens layer do a movement block check.
                if (layer.name === 'tokens') {
                    for (let i = 0; i < layer.selection.length; i++) {
                        const sel = layer.selection[i];
                        if (sel.uuid === this.selectionHelper.uuid)
                            continue; // the selection helper should not be treated as a real shape.
                        delta = Object(_tools__WEBPACK_IMPORTED_MODULE_0__["calculateDelta"])(delta, sel);
                    }
                }
                // Actually apply the delta on all shapes
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    sel.refPoint = sel.refPoint.add(delta);
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_6__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                }
                layer.invalidate(false);
            }
            else if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Resize) {
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    if (!(sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_7__["default"]))
                        return; // TODO
                    // TODO: This has to be shape specific
                    if (this.resizedir === 'nw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2lx"])(sel.refPoint.x) + sel.w * z - mouse.x;
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2ly"])(sel.refPoint.y) + sel.h * z - mouse.y;
                        sel.refPoint = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse);
                    }
                    else if (this.resizedir === 'ne') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2lx"])(sel.refPoint.x);
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2ly"])(sel.refPoint.y) + sel.h * z - mouse.y;
                        sel.refPoint.y = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2gy"])(mouse.y);
                    }
                    else if (this.resizedir === 'se') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2lx"])(sel.refPoint.x);
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2ly"])(sel.refPoint.y);
                    }
                    else if (this.resizedir === 'sw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2lx"])(sel.refPoint.x) + sel.w * z - mouse.x;
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2ly"])(sel.refPoint.y);
                        sel.refPoint.x = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2gx"])(mouse.x);
                    }
                    sel.w /= z;
                    sel.h /= z;
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_6__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
            }
            else {
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    if (!(sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_7__["default"]))
                        return; // TODO
                    const gm = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse);
                    if (sel.inCorner(gm, "nw")) {
                        document.body.style.cursor = "nw-resize";
                    }
                    else if (sel.inCorner(gm, "ne")) {
                        document.body.style.cursor = "ne-resize";
                    }
                    else if (sel.inCorner(gm, "se")) {
                        document.body.style.cursor = "se-resize";
                    }
                    else if (sel.inCorner(gm, "sw")) {
                        document.body.style.cursor = "sw-resize";
                    }
                    else {
                        document.body.style.cursor = "default";
                    }
                }
            }
            ;
        }
        else {
            document.body.style.cursor = "default";
        }
    }
    ;
    onMouseUp(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e);
        if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].GroupSelect) {
            layer.selection = [];
            layer.shapes.forEach((shape) => {
                if (shape === this.selectionHelper)
                    return;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy())
                    return;
                if (this.selectionHelper.refPoint.x <= bbox.refPoint.x + bbox.w &&
                    this.selectionHelper.refPoint.x + this.selectionHelper.w >= bbox.refPoint.x &&
                    this.selectionHelper.refPoint.y <= bbox.refPoint.y + bbox.h &&
                    this.selectionHelper.refPoint.y + this.selectionHelper.h >= bbox.refPoint.y) {
                    layer.selection.push(shape);
                }
            });
            // Push the selection helper as the last element of the selection
            // This makes sure that it will be the first one to be hit in the hit detection onMouseDown
            if (layer.selection.length > 0)
                layer.selection.push(this.selectionHelper);
            layer.invalidate(true);
        }
        else if (layer.selection.length) {
            layer.selection.forEach((sel) => {
                if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Drag) {
                    if (this.drag.origin.x === Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2lx"])(sel.refPoint.x) && this.drag.origin.y === Object(_units__WEBPACK_IMPORTED_MODULE_5__["g2ly"])(sel.refPoint.y)) {
                        return;
                    }
                    if ((sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_7__["default"]) && _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.gridSize;
                        const mouse = sel.center();
                        const mx = mouse.x;
                        const my = mouse.y;
                        if ((sel.w / gs) % 2 === 0) {
                            sel.refPoint.x = Math.round(mx / gs) * gs - sel.w / 2;
                        }
                        else {
                            sel.refPoint.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - sel.w / 2;
                        }
                        if ((sel.h / gs) % 2 === 0) {
                            sel.refPoint.y = Math.round(my / gs) * gs - sel.h / 2;
                        }
                        else {
                            sel.refPoint.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - sel.h / 2;
                        }
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_6__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Resize) {
                    if (!(sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_7__["default"]))
                        return; // TODO
                    if (sel.w < 0) {
                        sel.refPoint.x += sel.w;
                        sel.w = Math.abs(sel.w);
                    }
                    if (sel.h < 0) {
                        sel.refPoint.y += sel.h;
                        sel.h = Math.abs(sel.h);
                    }
                    if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.gridSize;
                        sel.refPoint.x = Math.round(sel.refPoint.x / gs) * gs;
                        sel.refPoint.y = Math.round(sel.refPoint.y / gs) * gs;
                        sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                        sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_6__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
            });
        }
        this.mode = _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Noop;
    }
    ;
    onContextMenu(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_4__["getMouse"])(e);
        const mx = mouse.x;
        const my = mouse.y;
        let hit = false;
        layer.shapes.forEach(function (shape) {
            if (!hit && shape.contains(Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse))) {
                shape.showContextMenu(mouse);
            }
        });
    }
    ;
}


/***/ }),

/***/ "./ts_src/tools/tool.ts":
/*!******************************!*\
  !*** ./ts_src/tools/tool.ts ***!
  \******************************/
/*! exports provided: Tool */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Tool", function() { return Tool; });
class Tool {
    onContextMenu(e) { }
    ;
}


/***/ }),

/***/ "./ts_src/tools/tools.ts":
/*!*******************************!*\
  !*** ./ts_src/tools/tools.ts ***!
  \*******************************/
/*! exports provided: SelectOperations, setupTools, calculateDelta */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectOperations", function() { return SelectOperations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setupTools", function() { return setupTools; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "calculateDelta", function() { return calculateDelta; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _select__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./select */ "./ts_src/tools/select.ts");
/* harmony import */ var _pan__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pan */ "./ts_src/tools/pan.ts");
/* harmony import */ var _draw__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./draw */ "./ts_src/tools/draw.ts");
/* harmony import */ var _ruler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ruler */ "./ts_src/tools/ruler.ts");
/* harmony import */ var _fow__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./fow */ "./ts_src/tools/fow.ts");
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./map */ "./ts_src/tools/map.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../geom */ "./ts_src/geom.ts");








var SelectOperations;
(function (SelectOperations) {
    SelectOperations[SelectOperations["Noop"] = 0] = "Noop";
    SelectOperations[SelectOperations["Resize"] = 1] = "Resize";
    SelectOperations[SelectOperations["Drag"] = 2] = "Drag";
    SelectOperations[SelectOperations["GroupSelect"] = 3] = "GroupSelect";
})(SelectOperations || (SelectOperations = {}));
function setupTools() {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM)
            return;
        const toolInstance = new tool.clz();
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].tools.set(tool.name, toolInstance);
        const extra = tool.defaultSelect ? " class='tool-selected'" : "";
        const toolLi = $("<li id='tool-" + tool.name + "'" + extra + "><a href='#'>" + tool.name + "</a></li>");
        toolselectDiv.append(toolLi);
        if (tool.hasDetail) {
            const div = toolInstance.detailDiv;
            $('#tooldetail').append(div);
            div.hide();
        }
        toolLi.on("click", function () {
            const index = tools.indexOf(tool);
            if (index !== _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].selectedTool) {
                $('.tool-selected').removeClass("tool-selected");
                $(this).addClass("tool-selected");
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].selectedTool = index;
                const detail = $('#tooldetail');
                if (tool.hasDetail) {
                    $('#tooldetail').children().hide();
                    toolInstance.detailDiv.show();
                    detail.show();
                }
                else {
                    detail.hide();
                }
            }
        });
    });
}
const tools = [
    { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, clz: _select__WEBPACK_IMPORTED_MODULE_1__["SelectTool"] },
    { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, clz: _pan__WEBPACK_IMPORTED_MODULE_2__["PanTool"] },
    { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, clz: _draw__WEBPACK_IMPORTED_MODULE_3__["DrawTool"] },
    { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, clz: _ruler__WEBPACK_IMPORTED_MODULE_4__["RulerTool"] },
    { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, clz: _fow__WEBPACK_IMPORTED_MODULE_5__["FOWTool"] },
    { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, clz: _map__WEBPACK_IMPORTED_MODULE_6__["MapTool"] },
];
// First go through each shape in the selection and see if the delta has to be truncated due to movement blockers
// This is definitely super convoluted and inefficient but I was tired and really wanted the smooth wall sliding collision stuff to work
// And it does now, so hey ¯\_(ツ)_/¯
function calculateDelta(delta, sel, done) {
    if (done === undefined)
        done = [];
    const ogSelBBox = sel.getBoundingBox();
    const newSelBBox = ogSelBBox.offset(delta);
    let refine = false;
    for (let mb = 0; mb < _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.length; mb++) {
        if (done.includes(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers[mb]))
            continue;
        const blocker = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers[mb]);
        const blockerBBox = blocker.getBoundingBox();
        // Check if the bounding box of our destination would intersect with the bounding box of the movementblocker
        if (blockerBBox.intersectsWith(newSelBBox) || blockerBBox.getIntersectWithLine({ start: ogSelBBox.refPoint.add(delta.normalize()), end: newSelBBox.refPoint }).intersect) {
            const bCenter = blockerBBox.center();
            const sCenter = ogSelBBox.center();
            const d = sCenter.subtract(bCenter);
            const ux = new _geom__WEBPACK_IMPORTED_MODULE_7__["Vector"]({ x: 1, y: 0 });
            const uy = new _geom__WEBPACK_IMPORTED_MODULE_7__["Vector"]({ x: 0, y: 1 });
            let dx = d.dot(ux);
            let dy = d.dot(uy);
            if (dx > blockerBBox.w / 2)
                dx = blockerBBox.w / 2;
            if (dx < -blockerBBox.w / 2)
                dx = -blockerBBox.w / 2;
            if (dy > blockerBBox.h / 2)
                dy = blockerBBox.h / 2;
            if (dy < -blockerBBox.h / 2)
                dy = -blockerBBox.h / 2;
            // Closest point / intersection point between the two bboxes.  Not the delta intersect!
            const p = bCenter.add(ux.multiply(dx)).add(uy.multiply(dy));
            if (p.x === ogSelBBox.refPoint.x || p.x === ogSelBBox.refPoint.x + ogSelBBox.w)
                delta.direction.x = 0;
            else if (p.y === ogSelBBox.refPoint.y || p.y === ogSelBBox.refPoint.y + ogSelBBox.h)
                delta.direction.y = 0;
            else {
                if (p.x < ogSelBBox.refPoint.x)
                    delta.direction.x = p.x - ogSelBBox.refPoint.x;
                else if (p.x > ogSelBBox.refPoint.x + ogSelBBox.w)
                    delta.direction.x = p.x - (ogSelBBox.refPoint.x + ogSelBBox.w);
                else if (p.y < ogSelBBox.refPoint.y)
                    delta.direction.y = p.y - ogSelBBox.refPoint.y;
                else if (p.y > ogSelBBox.refPoint.y + ogSelBBox.h)
                    delta.direction.y = p.y - (ogSelBBox.refPoint.y + ogSelBBox.h);
            }
            refine = true;
            done.push(_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers[mb]);
            break;
        }
    }
    if (refine)
        delta = calculateDelta(delta, sel, done);
    return delta;
}


/***/ }),

/***/ "./ts_src/units.ts":
/*!*************************!*\
  !*** ./ts_src/units.ts ***!
  \*************************/
/*! exports provided: g2l, g2lx, g2ly, g2lz, getUnitDistance, g2lr, l2g, l2gx, l2gy */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g2l", function() { return g2l; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g2lx", function() { return g2lx; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g2ly", function() { return g2ly; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g2lz", function() { return g2lz; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUnitDistance", function() { return getUnitDistance; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g2lr", function() { return g2lr; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l2g", function() { return l2g; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l2gx", function() { return l2gx; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l2gy", function() { return l2gy; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");


function g2l(obj) {
    const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
    const panX = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panX;
    const panY = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panY;
    return new _geom__WEBPACK_IMPORTED_MODULE_1__["LocalPoint"]((obj.x + panX) * z, (obj.y + panY) * z);
}
function g2lx(x) {
    return g2l(new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](x, 0)).x;
}
function g2ly(y) {
    return g2l(new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"](0, y)).y;
}
function g2lz(z) {
    return z * _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
}
function getUnitDistance(r) {
    return (r / _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.unitSize) * _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.gridSize;
}
function g2lr(r) {
    return g2lz(getUnitDistance(r));
}
function l2g(obj) {
    const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
    const panX = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panX;
    const panY = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.panY;
    if (obj instanceof _geom__WEBPACK_IMPORTED_MODULE_1__["LocalPoint"]) {
        return new _geom__WEBPACK_IMPORTED_MODULE_1__["GlobalPoint"]((obj.x / z) - panX, (obj.y / z) - panY);
    }
    else {
        return new _geom__WEBPACK_IMPORTED_MODULE_1__["Vector"]({ x: obj.direction.x / z, y: obj.direction.y / z }, obj.origin === undefined ? undefined : l2g(obj.origin));
    }
}
function l2gx(x) {
    return l2g(new _geom__WEBPACK_IMPORTED_MODULE_1__["LocalPoint"](x, 0)).x;
}
function l2gy(y) {
    return l2g(new _geom__WEBPACK_IMPORTED_MODULE_1__["LocalPoint"](0, y)).y;
}


/***/ }),

/***/ "./ts_src/utils.ts":
/*!*************************!*\
  !*** ./ts_src/utils.ts ***!
  \*************************/
/*! exports provided: getMouse, alphSort, uuidv4, OrderedMap */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getMouse", function() { return getMouse; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "alphSort", function() { return alphSort; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "uuidv4", function() { return uuidv4; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OrderedMap", function() { return OrderedMap; });
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");

function getMouse(e) {
    return new _geom__WEBPACK_IMPORTED_MODULE_0__["LocalPoint"](e.pageX, e.pageY);
}
;
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
class OrderedMap {
    constructor() {
        this.keys = [];
        this.values = [];
    }
    get(key) {
        return this.values[this.keys.indexOf(key)];
    }
    getIndexValue(idx) {
        return this.values[idx];
    }
    getIndexKey(idx) {
        return this.keys[idx];
    }
    set(key, value) {
        this.keys.push(key);
        this.values.push(value);
    }
    indexOf(element) {
        return this.keys.indexOf(element);
    }
    remove(element) {
        const idx = this.indexOf(element);
        this.keys.splice(idx, 1);
        this.values.splice(idx, 1);
    }
}


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2Fzc2V0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvYmFzZXJlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9ib3VuZGluZ3JlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9jaXJjbGUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9lZGl0ZGlhbG9nLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvbGluZS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL3JlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9zaGFwZS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL3RleHQudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy91dGlscy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc29ja2V0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9kcmF3LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9mb3cudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzL2luaXRpYXRpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzL21hcC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvcGFuLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9ydWxlci50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvc2VsZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy90b29sLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy90b29scy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdW5pdHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHlEQUFpRCxjQUFjO0FBQy9EOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOzs7QUFHQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuRUE7QUFBQTs7OztFQUlFO0FBRUY7SUFHSSxZQUFZLENBQVMsRUFBRSxDQUFRO1FBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQ0QsR0FBRyxDQUFDLEdBQWlCO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBQ0QsUUFBUSxDQUFDLEtBQVk7UUFDakIsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENB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QyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQztJQUM1QixFQUFFLEVBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDO0lBRXpELE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNCLHVDQUF1QztJQUN2QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDO0lBRXpCLE1BQU0sU0FBUyxHQUFNLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUMsRUFBRSxDQUFDLEdBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQyxHQUFDLFFBQVEsRUFBQyxDQUFDO0lBQ2hGLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUM5QyxNQUFNLENBQUMsRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUssMEJBQTJCLEVBQVMsRUFBRSxFQUFTO0lBQ2pELE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN0QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENB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Q0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3BFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNqRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFRCxHQUFHLENBQUMsV0FBVyxHQUFHLG1EQUFXLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN2RSxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDYixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMs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LEVBQUU7WUFDdEMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ1osQ0FBQztJQUNOLENBQUM7SUFDRCxjQUFjO1FBQ1YsTUFBTSxDQUFDLElBQUkscURBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFDRCxRQUFRLENBQUMsS0FBa0I7UUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFDRCxRQUFRLENBQUMsS0FBa0IsRUFBRSxNQUFjO1FBQ3ZDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDYixLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSyxLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hKLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xLLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FB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Q0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNqSixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNqRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDNUIsSUFBSSxDQUFDLElBQUks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Q0FBQzt3QkFDWixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN4QixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDWixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN4QixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxNQUFNLEVBQUUsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7d0JBQzdDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUN0RCxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDdEQsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ2xELEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxD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QUFLLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsQ0FBQztnQkFDRixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUMzQixLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUM5QyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDaEMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENB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Q0FBQztJQUMvQixDQUFDO0NBQ0oiLCJmaWxlIjoicGxhbmFyYWxseS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3RzX3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiLypcclxuVGhpcyBtb2R1bGUgZGVmaW5lcyBzb21lIFBvaW50IGNsYXNzZXMuXHJcbkEgc3Ryb25nIGZvY3VzIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYXQgbm8gdGltZSBhIGdsb2JhbCBhbmQgYSBsb2NhbCBwb2ludCBhcmUgaW4gc29tZSB3YXkgdXNlZCBpbnN0ZWFkIG9mIHRoZSBvdGhlci5cclxuVGhpcyBhZGRzIHNvbWUgYXQgZmlyc3QgZ2xhbmNlIHdlaXJkIGxvb2tpbmcgaGFja3MgYXMgdHMgZG9lcyBub3Qgc3VwcG9ydCBub21pbmFsIHR5cGluZy5cclxuKi9cclxuXHJcbmNsYXNzIFBvaW50IHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTpudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICB9XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIHZlYy5kaXJlY3Rpb24ueCwgdGhpcy55ICsgdmVjLmRpcmVjdGlvbi55KTtcclxuICAgIH1cclxuICAgIHN1YnRyYWN0KG90aGVyOiBQb2ludCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yKHt4OiB0aGlzLnggLSBvdGhlci54LCB5OiB0aGlzLnkgLSBvdGhlci55fSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgICBjbG9uZSgpOiBQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGNsYXNzIEdsb2JhbFBvaW50IGV4dGVuZHMgUG9pbnQge1xyXG4gICAgLy8gdGhpcyBpcyB0byBkaWZmZXJlbnRpYXRlIHdpdGggTG9jYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0dsb2JhbFBvaW50ITogc3RyaW5nO1xyXG4gICAgYWRkKHZlYzogVmVjdG9yPHRoaXM+KTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogR2xvYmFsUG9pbnQpOiBWZWN0b3I8dGhpcz4ge1xyXG4gICAgICAgICByZXR1cm4gc3VwZXIuc3VidHJhY3Qob3RoZXIpO1xyXG4gICAgfVxyXG4gICAgY2xvbmUoKTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuY2xvbmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExvY2FsUG9pbnQgZXh0ZW5kcyBQb2ludCB7XHJcbiAgICAvLyB0aGlzIGlzIHRvIGRpZmZlcmVudGlhdGUgd2l0aCBHbG9iYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0xvY2FsUG9pbnQhOiBzdHJpbmc7XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pOiBMb2NhbFBvaW50IHtcclxuICAgICAgICByZXR1cm4gPExvY2FsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogTG9jYWxQb2ludCk6IFZlY3Rvcjx0aGlzPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLnN1YnRyYWN0KG90aGVyKTtcclxuICAgIH1cclxuICAgIGNsb25lKCk6IExvY2FsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8TG9jYWxQb2ludD5zdXBlci5jbG9uZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmVjdG9yPFQgZXh0ZW5kcyBQb2ludD4ge1xyXG4gICAgZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn07XHJcbiAgICBvcmlnaW4/OiBUO1xyXG4gICAgY29uc3RydWN0b3IoZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn0sIG9yaWdpbj86IFQpIHtcclxuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICAgICAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbjtcclxuICAgIH1cclxuICAgIGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuZGlyZWN0aW9uLngsIDIpICsgTWF0aC5wb3codGhpcy5kaXJlY3Rpb24ueSwgMikpO1xyXG4gICAgfVxyXG4gICAgbm9ybWFsaXplKCkge1xyXG4gICAgICAgIGNvbnN0IGwgPSB0aGlzLmxlbmd0aCgpXHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8VD4oe3g6IHRoaXMuZGlyZWN0aW9uLnggLyBsLCB5OiB0aGlzLmRpcmVjdGlvbi55IC8gbH0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxuICAgIHJldmVyc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8VD4oe3g6IC10aGlzLmRpcmVjdGlvbi54LCB5OiAtdGhpcy5kaXJlY3Rpb24ueX0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxuICAgIG11bHRpcGx5KHNjYWxlOiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjxUPih7eDogdGhpcy5kaXJlY3Rpb24ueCAqIHNjYWxlLCB5OiB0aGlzLmRpcmVjdGlvbi55ICogc2NhbGV9LCB0aGlzLm9yaWdpbik7XHJcbiAgICB9XHJcbiAgICBkb3Qob3RoZXI6IFZlY3RvcjxUPikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpcmVjdGlvbi54ICogb3RoZXIuZGlyZWN0aW9uLnggKyB0aGlzLmRpcmVjdGlvbi55ICogb3RoZXIuZGlyZWN0aW9uLnk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lPFQgZXh0ZW5kcyBQb2ludD4ocDogVCwgbDE6IFQsIGwyOiBUKSB7XHJcbiAgICByZXR1cm4gcC54ID49IE1hdGgubWluKGwxLngsIGwyLngpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnggPD0gTWF0aC5tYXgobDEueCwgbDIueCkgKyAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueSA+PSBNYXRoLm1pbihsMS55LCBsMi55KSAtIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55IDw9IE1hdGgubWF4KGwxLnksIGwyLnkpICsgMC4wMDAwMDE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lczxUIGV4dGVuZHMgUG9pbnQ+KHA6IFQsIHMxOiBULCBlMTogVCwgczI6IFQsIGUyOiBUKSB7XHJcbiAgICByZXR1cm4gcG9pbnRJbkxpbmUocCwgczEsIGUxKSAmJiBwb2ludEluTGluZShwLCBzMiwgZTIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGluZXNJbnRlcnNlY3RQb2ludDxUIGV4dGVuZHMgUG9pbnQ+KHMxOiBULCBlMTogVCwgczI6IFQsIGUyOiBUKSB7XHJcbiAgICAvLyBjb25zdCBzMSA9IE1hdGgubWluKFMxLCApXHJcbiAgICBjb25zdCBBMSA9IGUxLnktczEueTtcclxuICAgIGNvbnN0IEIxID0gczEueC1lMS54O1xyXG4gICAgY29uc3QgQTIgPSBlMi55LXMyLnk7XHJcbiAgICBjb25zdCBCMiA9IHMyLngtZTIueDtcclxuXHJcbiAgICAvLyBHZXQgZGVsdGEgYW5kIGNoZWNrIGlmIHRoZSBsaW5lcyBhcmUgcGFyYWxsZWxcclxuICAgIGNvbnN0IGRlbHRhID0gQTEqQjIgLSBBMipCMTtcclxuICAgIGlmKGRlbHRhID09PSAwKSByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IHRydWV9O1xyXG5cclxuICAgIGNvbnN0IEMyID0gQTIqczIueCtCMipzMi55O1xyXG4gICAgY29uc3QgQzEgPSBBMSpzMS54K0IxKnMxLnk7XHJcbiAgICAvL2ludmVydCBkZWx0YSB0byBtYWtlIGRpdmlzaW9uIGNoZWFwZXJcclxuICAgIGNvbnN0IGludmRlbHRhID0gMS9kZWx0YTtcclxuXHJcbiAgICBjb25zdCBpbnRlcnNlY3QgPSA8VD57eDogKEIyKkMxIC0gQjEqQzIpKmludmRlbHRhLCB5OiAoQTEqQzIgLSBBMipDMSkqaW52ZGVsdGF9O1xyXG4gICAgaWYgKCFwb2ludEluTGluZXMoaW50ZXJzZWN0LCBzMSwgZTEsIHMyLCBlMikpXHJcbiAgICAgICAgcmV0dXJuIHtpbnRlcnNlY3Q6IG51bGwsIHBhcmFsbGVsOiBmYWxzZX07XHJcbiAgICByZXR1cm4ge2ludGVyc2VjdDogaW50ZXJzZWN0LCBwYXJhbGxlbDogZmFsc2V9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9pbnREaXN0YW5jZShwMTogUG9pbnQsIHAyOiBQb2ludCkge1xyXG4gICAgY29uc3QgYSA9IHAxLnggLSBwMi54O1xyXG4gICAgY29uc3QgYiA9IHAxLnkgLSBwMi55O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggYSphICsgYipiICk7XHJcbn0iLCJpbXBvcnQge2dldFVuaXREaXN0YW5jZSwgbDJnLCBnMmwsIGcybHosIGcybHIsIGcybHgsIGcybHl9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7R2xvYmFsUG9pbnR9IGZyb20gXCIuL2dlb21cIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgTG9jYXRpb25PcHRpb25zLCBTZXJ2ZXJTaGFwZSB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVzL3NoYXBlXCI7XHJcbmltcG9ydCBCYXNlUmVjdCBmcm9tIFwiLi9zaGFwZXMvYmFzZXJlY3RcIjtcclxuaW1wb3J0IENpcmNsZSBmcm9tIFwiLi9zaGFwZXMvY2lyY2xlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vc2hhcGVzL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgeyBjcmVhdGVTaGFwZUZyb21EaWN0IH0gZnJvbSBcIi4vc2hhcGVzL3V0aWxzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXJNYW5hZ2VyIHtcclxuICAgIGxheWVyczogTGF5ZXJbXSA9IFtdO1xyXG4gICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIHNlbGVjdGVkTGF5ZXI6IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgVVVJRE1hcDogTWFwPHN0cmluZywgU2hhcGU+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIGdyaWRTaXplID0gNTA7XHJcbiAgICB1bml0U2l6ZSA9IDU7XHJcbiAgICB1c2VHcmlkID0gdHJ1ZTtcclxuICAgIGZ1bGxGT1cgPSBmYWxzZTtcclxuICAgIGZvd09wYWNpdHkgPSAwLjM7XHJcblxyXG4gICAgem9vbUZhY3RvciA9IDE7XHJcbiAgICBwYW5YID0gMDtcclxuICAgIHBhblkgPSAwO1xyXG5cclxuICAgIC8vIFJlZnJlc2ggaW50ZXJ2YWwgYW5kIHJlZHJhdyBzZXR0ZXIuXHJcbiAgICBpbnRlcnZhbCA9IDMwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBsbS5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGxtLmxheWVyc1tpXS5kcmF3KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLmludGVydmFsKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRPcHRpb25zKG9wdGlvbnM6IExvY2F0aW9uT3B0aW9ucyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChcInVuaXRTaXplXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRVbml0U2l6ZShvcHRpb25zLnVuaXRTaXplKTtcclxuICAgICAgICBpZiAoXCJ1c2VHcmlkXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRVc2VHcmlkKG9wdGlvbnMudXNlR3JpZCk7XHJcbiAgICAgICAgaWYgKFwiZnVsbEZPV1wiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0RnVsbEZPVyhvcHRpb25zLmZ1bGxGT1cpO1xyXG4gICAgICAgIGlmICgnZm93T3BhY2l0eScgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRGT1dPcGFjaXR5KG9wdGlvbnMuZm93T3BhY2l0eSk7XHJcbiAgICAgICAgaWYgKFwiZm93Q29sb3VyXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRXaWR0aCh3aWR0aDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEhlaWdodChoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRMYXllcihsYXllcjogTGF5ZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcclxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExheWVyID09PSBcIlwiICYmIGxheWVyLnNlbGVjdGFibGUpIHRoaXMuc2VsZWN0ZWRMYXllciA9IGxheWVyLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzTGF5ZXIobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzLnNvbWUobCA9PiBsLm5hbWUgPT09IG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldExheWVyKG5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICBuYW1lID0gKG5hbWUgPT09IHVuZGVmaW5lZCkgPyB0aGlzLnNlbGVjdGVkTGF5ZXIgOiBuYW1lO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLm5hbWUgPT09IG5hbWUpIHJldHVybiB0aGlzLmxheWVyc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy90b2RvIHJlbmFtZSB0byBzZWxlY3RMYXllclxyXG4gICAgc2V0TGF5ZXIobmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoZm91bmQgJiYgbGF5ZXIubmFtZSAhPT0gJ2ZvdycpIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDAuMztcclxuICAgICAgICAgICAgZWxzZSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAxLjA7XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbGF5ZXIubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbG0uc2VsZWN0ZWRMYXllciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEdyaWRMYXllcigpOiBMYXllcnx1bmRlZmluZWQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldExheWVyKFwiZ3JpZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3R3JpZCgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMuZ2V0R3JpZExheWVyKCk7XHJcbiAgICAgICAgaWYgKGxheWVyID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjb25zdCBjdHggPSBsYXllci5jdHg7XHJcbiAgICAgICAgbGF5ZXIuY2xlYXIoKTtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIud2lkdGg7IGkgKz0gdGhpcy5ncmlkU2l6ZSAqIHRoaXMuem9vbUZhY3Rvcikge1xyXG4gICAgICAgICAgICBjdHgubW92ZVRvKGkgKyAodGhpcy5wYW5YICUgdGhpcy5ncmlkU2l6ZSkgKiB0aGlzLnpvb21GYWN0b3IsIDApO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGkgKyAodGhpcy5wYW5YICUgdGhpcy5ncmlkU2l6ZSkgKiB0aGlzLnpvb21GYWN0b3IsIGxheWVyLmhlaWdodCk7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oMCwgaSArICh0aGlzLnBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3Rvcik7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8obGF5ZXIud2lkdGgsIGkgKyAodGhpcy5wYW5ZICUgdGhpcy5ncmlkU2l6ZSkgKiB0aGlzLnpvb21GYWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gZ2FtZU1hbmFnZXIuZ3JpZENvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICBsYXllci52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTGF5ZXIoXCJmb3dcIikpXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R3JpZFNpemUoZ3JpZFNpemU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGlmIChncmlkU2l6ZSAhPT0gdGhpcy5ncmlkU2l6ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmdyaWRTaXplID0gZ3JpZFNpemU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgJCgnI2dyaWRTaXplSW5wdXQnKS52YWwoZ3JpZFNpemUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRVbml0U2l6ZSh1bml0U2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHVuaXRTaXplICE9PSB0aGlzLnVuaXRTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdFNpemUgPSB1bml0U2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjdW5pdFNpemVJbnB1dCcpLnZhbCh1bml0U2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVzZUdyaWQodXNlR3JpZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh1c2VHcmlkICE9PSB0aGlzLnVzZUdyaWQpIHtcclxuICAgICAgICAgICAgdGhpcy51c2VHcmlkID0gdXNlR3JpZDtcclxuICAgICAgICAgICAgaWYgKHVzZUdyaWQpXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLnNob3coKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJCgnI2dyaWQtbGF5ZXInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICQoJyN1c2VHcmlkSW5wdXQnKS5wcm9wKFwiY2hlY2tlZFwiLCB1c2VHcmlkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RnVsbEZPVyhmdWxsRk9XOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGZ1bGxGT1cgIT09IHRoaXMuZnVsbEZPVykge1xyXG4gICAgICAgICAgICB0aGlzLmZ1bGxGT1cgPSBmdWxsRk9XO1xyXG4gICAgICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgaWYgKGZvd2wgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIGZvd2wuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICQoJyN1c2VGT1dJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIGZ1bGxGT1cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRGT1dPcGFjaXR5KGZvd09wYWNpdHk6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZm93T3BhY2l0eSA9IGZvd09wYWNpdHk7XHJcbiAgICAgICAgY29uc3QgZm93bCA9IHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgaWYgKGZvd2wgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAkKCcjZm93T3BhY2l0eScpLnZhbChmb3dPcGFjaXR5KTtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExheWVyIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHdpZHRoOiBudW1iZXI7XHJcbiAgICBoZWlnaHQ6IG51bWJlcjtcclxuICAgIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHJcbiAgICBzZWxlY3RhYmxlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwbGF5ZXJfZWRpdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBXaGVuIHNldCB0byBmYWxzZSwgdGhlIGxheWVyIHdpbGwgYmUgcmVkcmF3biBvbiB0aGUgbmV4dCB0aWNrXHJcbiAgICB2YWxpZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgLy8gVGhlIGNvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgdGhpcyBsYXllciBjb250YWlucy5cclxuICAgIC8vIFRoZXNlIGFyZSBvcmRlcmVkIG9uIGEgZGVwdGggYmFzaXMuXHJcbiAgICBzaGFwZXM6IFNoYXBlW10gPSBbXTtcclxuXHJcbiAgICAvLyBDb2xsZWN0aW9uIG9mIHNoYXBlcyB0aGF0IGFyZSBjdXJyZW50bHkgc2VsZWN0ZWRcclxuICAgIHNlbGVjdGlvbjogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIEV4dHJhIHNlbGVjdGlvbiBoaWdobGlnaHRpbmcgc2V0dGluZ3NcclxuICAgIHNlbGVjdGlvbkNvbG9yID0gJyNDQzAwMDAnO1xyXG4gICAgc2VsZWN0aW9uV2lkdGggPSAyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XHJcbiAgICB9XHJcblxyXG4gICAgaW52YWxpZGF0ZShza2lwTGlnaHRVcGRhdGU6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFza2lwTGlnaHRVcGRhdGUgJiYgdGhpcy5uYW1lICE9PSBcImZvd1wiICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSkge1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgc2hhcGUubGF5ZXIgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMucHVzaChzaGFwZSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChzaGFwZS5hbm5vdGF0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMucHVzaChzaGFwZS51dWlkKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJhZGQgc2hhcGVcIiwge3NoYXBlOiBzaGFwZS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5zZXQoc2hhcGUudXVpZCwgc2hhcGUpO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSghc3luYyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0U2hhcGVzKHNoYXBlczogU2VydmVyU2hhcGVbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IHQ6IFNoYXBlW10gPSBbXTtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2ggPSBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlKTtcclxuICAgICAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gdHlwZSAke3NoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzaC5sYXllciA9IHNlbGYubmFtZTtcclxuICAgICAgICAgICAgc2guY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc2guc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKHNoLmFubm90YXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMucHVzaChzaC51dWlkKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoKTtcclxuICAgICAgICAgICAgdC5wdXNoKHNoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdOyAvLyBUT0RPOiBGaXgga2VlcGluZyBzZWxlY3Rpb24gb24gdGhvc2UgaXRlbXMgdGhhdCBhcmUgbm90IG1vdmVkLlxyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gdDtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpLCAxKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJyZW1vdmUgc2hhcGVcIiwge3NoYXBlOiBzaGFwZSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcclxuICAgICAgICBjb25zdCBsc19pID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmZpbmRJbmRleChscyA9PiBscy5zaGFwZSA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgY29uc3QgbGJfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZmluZEluZGV4KGxzID0+IGxzID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBjb25zdCBtYl9pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IGFuX2kgPSBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGlmIChsc19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UobHNfaSwgMSk7XHJcbiAgICAgICAgaWYgKGxiX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5zcGxpY2UobGJfaSwgMSk7XHJcbiAgICAgICAgaWYgKG1iX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2UobWJfaSwgMSk7XHJcbiAgICAgICAgaWYgKGFuX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMuc3BsaWNlKGFuX2ksIDEpO1xyXG5cclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5kZWxldGUoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zZWxlY3Rpb24uaW5kZXhPZihzaGFwZSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID49IDApXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoZG9DbGVhcj86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGRvQ2xlYXIgPSBkb0NsZWFyID09PSB1bmRlZmluZWQgPyB0cnVlIDogZG9DbGVhcjtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb0NsZWFyKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLnZpc2libGVJbkNhbnZhcyhzdGF0ZS5jYW52YXMpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUubmFtZSA9PT0gJ2ZvdycgJiYgc2hhcGUudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhLm5hbWUgIT09IHN0YXRlLm5hbWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHNoYXBlLmRyYXcoY3R4KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuc2VsZWN0aW9uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYiA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFJFRkFDVE9SIFRISVMgVE8gU2hhcGUuZHJhd1NlbGVjdGlvbihjdHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KGcybHgoYmIucmVmUG9pbnQueCksIGcybHkoYmIucmVmUG9pbnQueSksIGJiLncgKiB6LCBiYi5oICogeik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGcybHgoYmIucmVmUG9pbnQueCArIGJiLncgLSAzKSwgZzJseShiYi5yZWZQb2ludC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9wbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdChnMmx4KGJiLnJlZlBvaW50LnggLSAzKSwgZzJseShiYi5yZWZQb2ludC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90cmlnaHRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChiYi5yZWZQb2ludC54ICsgYmIudyAtIDMpLCBnMmx5KGJiLnJlZlBvaW50LnkgKyBiYi5oIC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90bGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdChnMmx4KGJiLnJlZlBvaW50LnggLSAzKSwgZzJseShiYi5yZWZQb2ludC55ICsgYmIuaCAtIDMpLCA2ICogeiwgNiAqIHopXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmVTaGFwZU9yZGVyKHNoYXBlOiBTaGFwZSwgZGVzdGluYXRpb25JbmRleDogbnVtYmVyLCBzeW5jOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3Qgb2xkSWR4ID0gdGhpcy5zaGFwZXMuaW5kZXhPZihzaGFwZSk7XHJcbiAgICAgICAgaWYgKG9sZElkeCA9PT0gZGVzdGluYXRpb25JbmRleCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuc2hhcGVzLnNwbGljZShvbGRJZHgsIDEpO1xyXG4gICAgICAgIHRoaXMuc2hhcGVzLnNwbGljZShkZXN0aW5hdGlvbkluZGV4LCAwLCBzaGFwZSk7XHJcbiAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwibW92ZVNoYXBlT3JkZXJcIiwge3NoYXBlOiBzaGFwZS5hc0RpY3QoKSwgaW5kZXg6IGRlc3RpbmF0aW9uSW5kZXh9KTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIG9uU2hhcGVNb3ZlKHNoYXBlPzogU2hhcGUpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR3JpZExheWVyIGV4dGVuZHMgTGF5ZXIge1xyXG4gICAgaW52YWxpZGF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZPV0xheWVyIGV4dGVuZHMgTGF5ZXIge1xyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHNoYXBlLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzdXBlci5hZGRTaGFwZShzaGFwZSwgc3luYywgdGVtcG9yYXJ5KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRTaGFwZXMoc2hhcGVzOiBTZXJ2ZXJTaGFwZVtdKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYyA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBzaGFwZS5maWxsID0gYztcclxuICAgICAgICB9KTtcclxuICAgICAgICBzdXBlci5zZXRTaGFwZXMoc2hhcGVzKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNoYXBlTW92ZShzaGFwZTogU2hhcGUpOiB2b2lkIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc3VwZXIub25TaGFwZU1vdmUoc2hhcGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBkcmF3KCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCAmJiAhdGhpcy52YWxpZCkge1xyXG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcclxuICAgICAgICAgICAgY29uc3Qgb3JpZ19vcCA9IGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVykge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2dhbHBoYSA9IHRoaXMuY3R4Lmdsb2JhbEFscGhhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJjb3B5XCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZm93T3BhY2l0eTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IG9nYWxwaGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVyk7XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcInRva2Vuc1wiKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwidG9rZW5zXCIpIS5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNoLm93bmVkQnkoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJiID0gc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsY2VudGVyID0gZzJsKHNoLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhbG0gPSAwLjggKiBnMmx6KGJiLncpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0sIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFkaWVudCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtIC8gMiwgbGNlbnRlci54LCBsY2VudGVyLnksIGFsbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsIDAsIDAsIDEpJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsIDAsIDAsIDApJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChscykge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2ggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobHMuc2hhcGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmEgPSBzaC5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSBscy5hdXJhKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdXJhID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk9sZCBsaWdodHNvdXJjZSBzdGlsbCBsaW5nZXJpbmcgaW4gdGhlIGdhbWVNYW5hZ2VyIGxpc3RcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9sZW5ndGggPSBnZXRVbml0RGlzdGFuY2UoYXVyYS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXIgPSBzaC5jZW50ZXIoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxjZW50ZXIgPSBnMmwoY2VudGVyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBuZXcgQ2lyY2xlKGNlbnRlciwgYXVyYV9sZW5ndGgpLmdldEJvdW5kaW5nQm94KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV2UgZmlyc3QgY29sbGVjdCBhbGwgbGlnaHRibG9ja2VycyB0aGF0IGFyZSBpbnNpZGUvY3Jvc3Mgb3VyIGF1cmFcclxuICAgICAgICAgICAgICAgIC8vIFRoaXMgdG8gcHJldmVudCBhcyBtYW55IHJheSBjYWxjdWxhdGlvbnMgYXMgcG9zc2libGVcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvY2FsX2xpZ2h0YmxvY2tlcnM6IEJvdW5kaW5nUmVjdFtdID0gW107XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmZvckVhY2goZnVuY3Rpb24gKGxiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiID09PSBzaC51dWlkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfc2ggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobGIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYl9zaCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfYmIgPSBsYl9zaC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYl9iYi5pbnRlcnNlY3RzV2l0aChiYm94KSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxfbGlnaHRibG9ja2Vycy5wdXNoKGxiX2JiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJjX3N0YXJ0ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYXN0IHJheXMgaW4gZXZlcnkgZGVncmVlXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhbmdsZSA9IDA7IGFuZ2xlIDwgMiAqIE1hdGguUEk7IGFuZ2xlICs9ICgxIC8gMTgwKSAqIE1hdGguUEkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBoaXQgd2l0aCBvYnN0cnVjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBoaXQ6IHtpbnRlcnNlY3Q6IEdsb2JhbFBvaW50fG51bGwsIGRpc3RhbmNlOm51bWJlcn0gPSB7aW50ZXJzZWN0OiBudWxsLCBkaXN0YW5jZTogSW5maW5pdHl9O1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzaGFwZV9oaXQ6IG51bGx8Qm91bmRpbmdSZWN0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpPTA7IGk8bG9jYWxfbGlnaHRibG9ja2Vycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYl9iYiA9IGxvY2FsX2xpZ2h0YmxvY2tlcnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGxiX2JiLmdldEludGVyc2VjdFdpdGhMaW5lKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBjZW50ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IG5ldyBHbG9iYWxQb2ludChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXIueCArIGF1cmFfbGVuZ3RoICogTWF0aC5jb3MoYW5nbGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlci55ICsgYXVyYV9sZW5ndGggKiBNYXRoLnNpbihhbmdsZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuaW50ZXJzZWN0ICE9PSBudWxsICYmIHJlc3VsdC5kaXN0YW5jZSA8IGhpdC5kaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGl0ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVfaGl0ID0gbGJfYmI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBubyBoaXQsIGNoZWNrIGlmIHdlIGNvbWUgZnJvbSBhIHByZXZpb3VzIGhpdCBzbyB0aGF0IHdlIGNhbiBnbyBiYWNrIHRvIHRoZSBhcmNcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaGl0LmludGVyc2VjdCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJjX3N0YXJ0ID0gYW5nbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXN0ID0gZzJsKG5ldyBHbG9iYWxQb2ludChjZW50ZXIueCArIGF1cmFfbGVuZ3RoICogTWF0aC5jb3MoYW5nbGUpLCBjZW50ZXIueSArIGF1cmFfbGVuZ3RoICogTWF0aC5zaW4oYW5nbGUpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKGRlc3QueCwgZGVzdC55KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgaGl0ICwgZmlyc3QgZmluaXNoIGFueSBvbmdvaW5nIGFyYywgdGhlbiBtb3ZlIHRvIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnRcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCBnMmxyKGF1cmEudmFsdWUpLCBhcmNfc3RhcnQsIGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJjX3N0YXJ0ID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHRyYVggPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHRyYVkgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGFwZV9oaXQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFYID0gKHNoYXBlX2hpdC53IC8gMTApICogTWF0aC5jb3MoYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYVkgPSAoc2hhcGVfaGl0LmggLyAxMCkgKiBNYXRoLnNpbihhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICghc2hhcGVfaGl0LmNvbnRhaW5zKGhpdC5pbnRlcnNlY3QueCArIGV4dHJhWCwgaGl0LmludGVyc2VjdC55ICsgZXh0cmFZLCBmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZXh0cmFYID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzdCA9IGcybChuZXcgR2xvYmFsUG9pbnQoaGl0LmludGVyc2VjdC54ICsgZXh0cmFYLCBoaXQuaW50ZXJzZWN0LnkgKyBleHRyYVkpKTtcclxuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKGRlc3QueCwgZGVzdC55KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgIT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIGcybHIoYXVyYS52YWx1ZSksIGFyY19zdGFydCwgMiAqIE1hdGguUEkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGFsbSA9IGcybHIoYXVyYS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBncmFkaWVudCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtIC8gMiwgbGNlbnRlci54LCBsY2VudGVyLnksIGFsbSk7XHJcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwgMCwgMCwgMSknKTtcclxuICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xyXG4gICAgICAgICAgICAgICAgLy8gY3R4LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxKVwiO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgIHN1cGVyLmRyYXcoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mdWxsRk9XKTtcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9yaWdfb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHNvY2tldCBmcm9tICcuL3NvY2tldCdcclxuaW1wb3J0IHsgbDJnIH0gZnJvbSBcIi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgTGF5ZXJNYW5hZ2VyLCBMYXllciwgR3JpZExheWVyLCBGT1dMYXllciB9IGZyb20gXCIuL2xheWVyc1wiO1xyXG5pbXBvcnQgeyBDbGllbnRPcHRpb25zLCBCb2FyZEluZm8sIFNlcnZlclNoYXBlLCBJbml0aWF0aXZlRGF0YSB9IGZyb20gJy4vYXBpX3R5cGVzJztcclxuaW1wb3J0IHsgT3JkZXJlZE1hcCwgZ2V0TW91c2UgfSBmcm9tICcuL3V0aWxzJztcclxuaW1wb3J0IEFzc2V0IGZyb20gJy4vc2hhcGVzL2Fzc2V0JztcclxuaW1wb3J0IHtjcmVhdGVTaGFwZUZyb21EaWN0fSBmcm9tICcuL3NoYXBlcy91dGlscyc7XHJcbmltcG9ydCB7IExvY2FsUG9pbnQsIEdsb2JhbFBvaW50IH0gZnJvbSAnLi9nZW9tJztcclxuaW1wb3J0IFJlY3QgZnJvbSAnLi9zaGFwZXMvcmVjdCc7XHJcbmltcG9ydCBUZXh0IGZyb20gJy4vc2hhcGVzL3RleHQnO1xyXG5pbXBvcnQgeyBUb29sIH0gZnJvbSAnLi90b29scy90b29sJztcclxuaW1wb3J0IHsgSW5pdGlhdGl2ZVRyYWNrZXIgfSBmcm9tICcuL3Rvb2xzL2luaXRpYXRpdmUnO1xyXG5cclxuY2xhc3MgR2FtZU1hbmFnZXIge1xyXG4gICAgSVNfRE0gPSBmYWxzZTtcclxuICAgIHJvb21OYW1lITogc3RyaW5nO1xyXG4gICAgcm9vbUNyZWF0b3IhOiBzdHJpbmc7XHJcbiAgICBsb2NhdGlvbk5hbWUhOiBzdHJpbmc7XHJcbiAgICB1c2VybmFtZSE6IHN0cmluZztcclxuICAgIGJvYXJkX2luaXRpYWxpc2VkID0gZmFsc2U7XHJcbiAgICBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICBzZWxlY3RlZFRvb2w6IG51bWJlciA9IDA7XHJcbiAgICB0b29sczogT3JkZXJlZE1hcDxzdHJpbmcsIFRvb2w+ID0gbmV3IE9yZGVyZWRNYXAoKTtcclxuICAgIGxpZ2h0c291cmNlczogeyBzaGFwZTogc3RyaW5nLCBhdXJhOiBzdHJpbmcgfVtdID0gW107XHJcbiAgICBsaWdodGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgYW5ub3RhdGlvbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBhbm5vdGF0aW9uVGV4dDogVGV4dCA9IG5ldyBUZXh0KG5ldyBHbG9iYWxQb2ludCgwLCAwKSwgXCJcIiwgXCJib2xkIDIwcHggc2VyaWZcIik7XHJcbiAgICBtb3ZlbWVudGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgZ3JpZENvbG91ciA9ICQoXCIjZ3JpZENvbG91clwiKTtcclxuICAgIGZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xyXG4gICAgaW5pdGlhdGl2ZVRyYWNrZXIgPSBuZXcgSW5pdGlhdGl2ZVRyYWNrZXIoKTtcclxuICAgIHNoYXBlU2VsZWN0aW9uRGlhbG9nID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9KTtcclxuICAgIGluaXRpYXRpdmVEaWFsb2cgPSAkKFwiI2luaXRpYXRpdmVkaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICcxNjBweCdcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2JhKDI1NSwwLDAsIDAuNSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2dyaWRDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2IoODIsIDgxLCA4MSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5maWxsID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2Zvd0NvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0dXBCb2FyZChyb29tOiBCb2FyZEluZm8pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNkaXYgPSAkKCcjbGF5ZXJzJyk7XHJcbiAgICAgICAgbGF5ZXJzZGl2LmVtcHR5KCk7XHJcbiAgICAgICAgY29uc3QgbGF5ZXJzZWxlY3RkaXYgPSAkKCcjbGF5ZXJzZWxlY3QnKTtcclxuICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwidWxcIikuZW1wdHkoKTtcclxuICAgICAgICBsZXQgc2VsZWN0YWJsZV9sYXllcnMgPSAwO1xyXG5cclxuICAgICAgICBjb25zdCBsbSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikuZmluZChcImRpdlwiKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9mZigpO1xyXG4gICAgICAgIGxtLmVtcHR5KCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmxvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSAkKFwiPGRpdj5cIiArIHJvb20ubG9jYXRpb25zW2ldICsgXCI8L2Rpdj5cIik7XHJcbiAgICAgICAgICAgIGxtLmFwcGVuZChsb2MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsbXBsdXMgPSAkKCc8ZGl2PjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9kaXY+Jyk7XHJcbiAgICAgICAgbG0uYXBwZW5kKGxtcGx1cyk7XHJcbiAgICAgICAgbG0uY2hpbGRyZW4oKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvY25hbWUgPSBwcm9tcHQoXCJOZXcgbG9jYXRpb24gbmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2NuYW1lICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwibmV3IGxvY2F0aW9uXCIsIGxvY25hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJjaGFuZ2UgbG9jYXRpb25cIiwgZS50YXJnZXQudGV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5ib2FyZC5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3X2xheWVyID0gcm9vbS5ib2FyZC5sYXllcnNbaV07XHJcbiAgICAgICAgICAgIC8vIFVJIGNoYW5nZXNcclxuICAgICAgICAgICAgbGF5ZXJzZGl2LmFwcGVuZChcIjxjYW52YXMgaWQ9J1wiICsgbmV3X2xheWVyLm5hbWUgKyBcIi1sYXllcicgc3R5bGU9J3otaW5kZXg6IFwiICsgaSArIFwiJz48L2NhbnZhcz5cIik7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuc2VsZWN0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGV4dHJhID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPT09IDApIGV4dHJhID0gXCIgY2xhc3M9J2xheWVyLXNlbGVjdGVkJ1wiO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZCgndWwnKS5hcHBlbmQoXCI8bGkgaWQ9J3NlbGVjdC1cIiArIG5ld19sYXllci5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgbmV3X2xheWVyLm5hbWUgKyBcIjwvYT48L2xpPlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGFibGVfbGF5ZXJzICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PiQoJyMnICsgbmV3X2xheWVyLm5hbWUgKyAnLWxheWVyJylbMF07XHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBTdGF0ZSBjaGFuZ2VzXHJcbiAgICAgICAgICAgIGxldCBsOiBMYXllcjtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBHcmlkTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld19sYXllci5uYW1lID09PSAnZm93JylcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgRk9XTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGwuc2VsZWN0YWJsZSA9IG5ld19sYXllci5zZWxlY3RhYmxlO1xyXG4gICAgICAgICAgICBsLnBsYXllcl9lZGl0YWJsZSA9IG5ld19sYXllci5wbGF5ZXJfZWRpdGFibGU7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5hZGRMYXllcihsKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUobmV3X2xheWVyLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiI2dyaWQtbGF5ZXJcIikuZHJvcHBhYmxlKHtcclxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6IFwiLmRyYWdnYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyb3A6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIHRvIGRyb3AgdGhlIHRva2VuIG9uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpDYW52YXMgPSAkKGwuY2FudmFzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGpDYW52YXMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIG1pc3NpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gakNhbnZhcy5vZmZzZXQoKSE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSBuZXcgTG9jYWxQb2ludCh1aS5vZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0LCB1aS5vZmZzZXQudG9wIC0gb2Zmc2V0LnRvcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3NfbWVudS5pcyhcIjp2aXNpYmxlXCIpICYmIGxvYy54IDwgc2V0dGluZ3NfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnkgPCBsb2NhdGlvbnNfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lkdGggPSB1aS5oZWxwZXJbMF0ud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCA9IHVpLmhlbHBlclswXS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdsb2MgPSBsMmcobG9jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1nID0gPEhUTUxJbWFnZUVsZW1lbnQ+dWkuZHJhZ2dhYmxlWzBdLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldChpbWcsIHdsb2MsIGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnNyYyA9IG5ldyBVUkwoaW1nLnNyYykucGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQucmVmUG9pbnQueCA9IE1hdGgucm91bmQoYXNzZXQucmVmUG9pbnQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQucmVmUG9pbnQueSA9IE1hdGgucm91bmQoYXNzZXQucmVmUG9pbnQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQudyA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbC5hZGRTaGFwZShhc3NldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsLnNldFNoYXBlcyhuZXdfbGF5ZXIuc2hhcGVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb3JjZSB0aGUgY29ycmVjdCBvcGFjaXR5IHJlbmRlciBvbiBvdGhlciBsYXllcnMuXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpIS5uYW1lKTtcclxuICAgICAgICAvLyBzb2NrZXQuZW1pdChcImNsaWVudCBpbml0aWFsaXNlZFwiKTtcclxuICAgICAgICB0aGlzLmJvYXJkX2luaXRpYWxpc2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGFibGVfbGF5ZXJzID4gMSkge1xyXG4gICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwibGlcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5pZC5zcGxpdChcIi1cIilbMV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSBsYXllcnNlbGVjdGRpdi5maW5kKFwiI3NlbGVjdC1cIiArIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKTtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lICE9PSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2VsZWN0ZWRMYXllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBvbGQucmVtb3ZlQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIobmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNlcnZlclNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHNoLCBmYWxzZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVNoYXBlKHNoYXBlOiBTZXJ2ZXJTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBzaCk7XHJcbiAgICAgICAgcmVhbF9zaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKHJlYWxfc2hhcGUubGF5ZXIpIS5vblNoYXBlTW92ZShyZWFsX3NoYXBlKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVTaGFwZShkYXRhOiB7c2hhcGU6IFNlcnZlclNoYXBlOyByZWRyYXc6IGJvb2xlYW47fSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChkYXRhLnNoYXBlLCB0cnVlKTtcclxuICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtkYXRhLnNoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSwgc2gpO1xyXG4gICAgICAgIHNoYXBlLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgc2hhcGUuc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICBpZiAoZGF0YS5yZWRyYXcpXHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKGRhdGEuc2hhcGUubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRJbml0aWF0aXZlKGRhdGE6IEluaXRpYXRpdmVEYXRhW10pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmluaXRpYXRpdmVUcmFja2VyLmRhdGEgPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhdGl2ZVRyYWNrZXIucmVkcmF3KCk7XHJcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgdGhpcy5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2xpZW50T3B0aW9ucyhvcHRpb25zOiBDbGllbnRPcHRpb25zKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZENvbG91cilcclxuICAgICAgICAgICAgdGhpcy5ncmlkQ29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZ3JpZENvbG91cik7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZm93Q29sb3VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbk9wdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25PcHRpb25zW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jID0gb3B0aW9ucy5sb2NhdGlvbk9wdGlvbnNbYCR7Z2FtZU1hbmFnZXIucm9vbU5hbWV9LyR7Z2FtZU1hbmFnZXIucm9vbUNyZWF0b3J9LyR7Z2FtZU1hbmFnZXIubG9jYXRpb25OYW1lfWBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYy5wYW5YKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnBhblggPSBsb2MucGFuWDtcclxuICAgICAgICAgICAgICAgIGlmIChsb2MucGFuWSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5wYW5ZID0gbG9jLnBhblk7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9jLnpvb21GYWN0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gbG9jLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiN6b29tZXJcIikuc2xpZGVyKHsgdmFsdWU6IDEgLyBsb2Muem9vbUZhY3RvciB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldEdyaWRMYXllcigpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmxldCBnYW1lTWFuYWdlciA9IG5ldyBHYW1lTWFuYWdlcigpO1xyXG4oPGFueT53aW5kb3cpLmdhbWVNYW5hZ2VyID0gZ2FtZU1hbmFnZXI7XHJcbig8YW55PndpbmRvdykuR1AgPSBHbG9iYWxQb2ludDtcclxuKDxhbnk+d2luZG93KS5Bc3NldCA9IEFzc2V0O1xyXG5cclxuLy8gKioqKiBTRVRVUCBVSSAqKioqXHJcblxyXG4vLyBwcmV2ZW50IGRvdWJsZSBjbGlja2luZyB0ZXh0IHNlbGVjdGlvblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlckRvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgICRtZW51LmhpZGUoKTtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZURvd24oZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlck1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZU1vdmUoZSk7XHJcbiAgICAvLyBBbm5vdGF0aW9uIGhvdmVyXHJcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgIGZvciAobGV0IGk9MDsgaSA8IGdhbWVNYW5hZ2VyLmFubm90YXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IGdhbWVNYW5hZ2VyLmFubm90YXRpb25zW2ldO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZHJhd1wiKSl7XHJcbiAgICAgICAgICAgIGNvbnN0IGRyYXdfbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmFubm90YXRpb25UZXh0LmxheWVyICE9PSBcImRyYXdcIilcclxuICAgICAgICAgICAgICAgIGRyYXdfbGF5ZXIuYWRkU2hhcGUoZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQsIGZhbHNlKTtcclxuICAgICAgICAgICAgY29uc3Qgc2hhcGUgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBpZiAoc2hhcGUuY29udGFpbnMobDJnKGdldE1vdXNlKGUpKSkpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmFubm90YXRpb25UZXh0LnRleHQgPSBzaGFwZS5hbm5vdGF0aW9uO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQucmVmUG9pbnQgPSBsMmcobmV3IExvY2FsUG9pbnQoKGRyYXdfbGF5ZXIuY2FudmFzLndpZHRoIC8gMikgLSBzaGFwZS5hbm5vdGF0aW9uLmxlbmd0aC8yLCA1MCkpO1xyXG4gICAgICAgICAgICAgICAgZHJhd19sYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCFmb3VuZCAmJiBnYW1lTWFuYWdlci5hbm5vdGF0aW9uVGV4dC50ZXh0ICE9PSAnJyl7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQudGV4dCA9ICcnO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlclVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VVcChlKTtcclxufVxyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgb25Qb2ludGVyRG93bik7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uUG9pbnRlck1vdmUpO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Qb2ludGVyVXApO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmIChlLmJ1dHRvbiAhPT0gMiB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Db250ZXh0TWVudShlKTtcclxufSk7XHJcblxyXG4kKFwiI3pvb21lclwiKS5zbGlkZXIoe1xyXG4gICAgb3JpZW50YXRpb246IFwidmVydGljYWxcIixcclxuICAgIG1pbjogMC41LFxyXG4gICAgbWF4OiA1LjAsXHJcbiAgICBzdGVwOiAwLjEsXHJcbiAgICB2YWx1ZTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IsXHJcbiAgICBzbGlkZTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIGNvbnN0IG9yaWdaID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgbmV3WiA9IDEgLyB1aS52YWx1ZSE7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG9yaWdaO1xyXG4gICAgICAgIGNvbnN0IG5ld1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG5ld1o7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gbmV3WjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvciA9IG5ld1o7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblggLT0gKG9yaWdYIC0gbmV3WCkgLyAyO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZIC09IChvcmlnWSAtIG5ld1kpIC8gMjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICBsb2NhdGlvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIFtgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF06IHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCxcclxuICAgICAgICAgICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWSxcclxuICAgICAgICAgICAgICAgICAgICB6b29tRmFjdG9yOiBuZXdaLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuY29uc3QgJG1lbnUgPSAkKCcjY29udGV4dE1lbnUnKTtcclxuJG1lbnUuaGlkZSgpO1xyXG5cclxuY29uc3Qgc2V0dGluZ3NfbWVudSA9ICQoXCIjbWVudVwiKSE7XHJcbmNvbnN0IGxvY2F0aW9uc19tZW51ID0gJChcIiNsb2NhdGlvbnMtbWVudVwiKSE7XHJcbmNvbnN0IGxheWVyX21lbnUgPSAkKFwiI2xheWVyc2VsZWN0XCIpITtcclxuJChcIiNzZWxlY3Rpb24tbWVudVwiKS5oaWRlKCk7XHJcblxyXG4kKCcjcm0tc2V0dGluZ3MnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG9yZGVyIG9mIGFuaW1hdGlvbiBpcyBpbXBvcnRhbnQsIGl0IG90aGVyd2lzZSB3aWxsIHNvbWV0aW1lcyBzaG93IGEgc21hbGwgZ2FwIGJldHdlZW4gdGhlIHR3byBvYmplY3RzXHJcbiAgICBpZiAoc2V0dGluZ3NfbWVudS5pcyhcIjp2aXNpYmxlXCIpKSB7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIgfSk7XHJcbiAgICAgICAgc2V0dGluZ3NfbWVudS5hbmltYXRlKHsgd2lkdGg6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiwgd2lkdGg6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxheWVyX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzZXR0aW5nc19tZW51LmFuaW1hdGUoeyB3aWR0aDogJ3RvZ2dsZScgfSk7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgbGVmdDogXCIrPTIwMHB4XCIgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiLCB3aWR0aDogXCItPTIwMHB4XCIgfSk7XHJcbiAgICAgICAgbGF5ZXJfbWVudS5hbmltYXRlKHsgbGVmdDogXCIrPTIwMHB4XCIgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJCgnI3JtLWxvY2F0aW9ucycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gb3JkZXIgb2YgYW5pbWF0aW9uIGlzIGltcG9ydGFudCwgaXQgb3RoZXJ3aXNlIHdpbGwgc29tZXRpbWVzIHNob3cgYSBzbWFsbCBnYXAgYmV0d2VlbiB0aGUgdHdvIG9iamVjdHNcclxuICAgIGlmIChsb2NhdGlvbnNfbWVudS5pcyhcIjp2aXNpYmxlXCIpKSB7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgdG9wOiBcIi09MTAwcHhcIiB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgaGVpZ2h0OiAndG9nZ2xlJyB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGhlaWdodDogJ3RvZ2dsZScgfSk7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgdG9wOiBcIis9MTAwcHhcIiB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG53aW5kb3cub25yZXNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0V2lkdGgod2luZG93LmlubmVyV2lkdGgpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEhlaWdodCh3aW5kb3cuaW5uZXJIZWlnaHQpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxufTtcclxuXHJcbiQoJ2JvZHknKS5rZXl1cChmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKGUua2V5Q29kZSA9PT0gNDYgJiYgZS50YXJnZXQudGFnTmFtZSAhPT0gXCJJTlBVVFwiKSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIHNlbGVjdGVkIGZvciBkZWxldGUgb3BlcmF0aW9uXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgbC5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgIGwucmVtb3ZlU2hhcGUoc2VsLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoc2VsLnV1aWQsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG4kKFwiI2dyaWRTaXplSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IGdzID0gcGFyc2VJbnQoKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZSk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3MpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgZ3JpZHNpemVcIiwgZ3MpO1xyXG59KTtcclxuXHJcbiQoXCIjdW5pdFNpemVJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdXMgPSBwYXJzZUludCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRVbml0U2l6ZSh1cyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAndW5pdFNpemUnOiB1cyB9KTtcclxufSk7XHJcbiQoXCIjdXNlR3JpZElucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1ZyA9ICg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRVc2VHcmlkKHVnKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICd1c2VHcmlkJzogdWcgfSk7XHJcbn0pO1xyXG4kKFwiI3VzZUZPV0lucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1ZiA9ICg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGdWxsRk9XKHVmKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICdmdWxsRk9XJzogdWYgfSk7XHJcbn0pO1xyXG4kKFwiI2Zvd09wYWNpdHlcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGxldCBmbyA9IHBhcnNlRmxvYXQoKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZSk7XHJcbiAgICBpZiAoaXNOYU4oZm8pKSB7XHJcbiAgICAgICAgJChcIiNmb3dPcGFjaXR5XCIpLnZhbChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZm93T3BhY2l0eSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGZvIDwgMCkgZm8gPSAwO1xyXG4gICAgaWYgKGZvID4gMSkgZm8gPSAxO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZPV09wYWNpdHkoZm8pO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ2Zvd09wYWNpdHknOiBmbyB9KTtcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lTWFuYWdlcjsiLCJpbXBvcnQgQmFzZVJlY3QgZnJvbSBcIi4vYmFzZXJlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHksIGcybHogfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJBc3NldCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFzc2V0IGV4dGVuZHMgQmFzZVJlY3Qge1xyXG4gICAgdHlwZSA9IFwiYXNzZXRcIjtcclxuICAgIGltZzogSFRNTEltYWdlRWxlbWVudDtcclxuICAgIHNyYzogc3RyaW5nID0gJyc7XHJcbiAgICBjb25zdHJ1Y3RvcihpbWc6IEhUTUxJbWFnZUVsZW1lbnQsIHRvcGxlZnQ6IEdsb2JhbFBvaW50LCB3OiBudW1iZXIsIGg6IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHRvcGxlZnQsIHcsIGgpO1xyXG4gICAgICAgIGlmICh1dWlkICE9PSB1bmRlZmluZWQpIHRoaXMudXVpZCA9IHV1aWQ7XHJcbiAgICAgICAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHNyYzogdGhpcy5zcmNcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyQXNzZXQpIHtcclxuICAgICAgICBzdXBlci5mcm9tRGljdChkYXRhKTtcclxuICAgICAgICB0aGlzLnNyYyA9IGRhdGEuc3JjO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCBnMmx4KHRoaXMucmVmUG9pbnQueCksIGcybHkodGhpcy5yZWZQb2ludC55KSwgZzJseih0aGlzLncpLCBnMmx6KHRoaXMuaCkpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5pdGlhdGl2ZVJlcHIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdXVpZDogdGhpcy51dWlkLFxyXG4gICAgICAgICAgICB2aXNpYmxlOiAhZ2FtZU1hbmFnZXIuSVNfRE0sXHJcbiAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgc3JjOiB0aGlzLnNyYyxcclxuICAgICAgICAgICAgb3duZXJzOiB0aGlzLm93bmVyc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCwgVmVjdG9yIH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgZzJseCwgZzJseSB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQmFzZVJlY3QgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB3OiBudW1iZXI7XHJcbiAgICBoOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB1dWlkKTtcclxuICAgICAgICB0aGlzLncgPSB3O1xyXG4gICAgICAgIHRoaXMuaCA9IGg7XHJcbiAgICB9XHJcbiAgICBnZXRCYXNlRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihzdXBlci5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHc6IHRoaXMudyxcclxuICAgICAgICAgICAgaDogdGhpcy5oXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQsIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggPD0gcG9pbnQueCAmJiAodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA+PSBwb2ludC54ICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA8PSBwb2ludC55ICYmICh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpID49IHBvaW50Lnk7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgc3dpdGNoIChjb3JuZXIpIHtcclxuICAgICAgICAgICAgY2FzZSAnbmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnbncnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc3cnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc2UnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJud1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibndcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQuYWRkKG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHt4OiB0aGlzLncvMiwgeTogdGhpcy5oLzJ9KSk7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcblxyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gIShnMmx4KHRoaXMucmVmUG9pbnQueCkgPiBjYW52YXMud2lkdGggfHwgZzJseSh0aGlzLnJlZlBvaW50LnkpID4gY2FudmFzLmhlaWdodCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGcybHgodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA8IDAgfHwgZzJseSh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpIDwgMCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBnZXRMaW5lc0ludGVyc2VjdFBvaW50LCBnZXRQb2ludERpc3RhbmNlLCBHbG9iYWxQb2ludCwgVmVjdG9yIH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgbDJneCwgbDJneSB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQm91bmRpbmdSZWN0IHtcclxuICAgIHR5cGUgPSBcImJvdW5kcmVjdFwiO1xyXG4gICAgcmVmUG9pbnQ6IEdsb2JhbFBvaW50O1xyXG4gICAgdzogbnVtYmVyO1xyXG4gICAgaDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHRvcGxlZnQ6IEdsb2JhbFBvaW50LCB3OiBudW1iZXIsIGg6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQgPSB0b3BsZWZ0O1xyXG4gICAgICAgIHRoaXMudyA9IHc7XHJcbiAgICAgICAgdGhpcy5oID0gaDtcclxuICAgIH1cclxuXHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54IDw9IHBvaW50LnggJiYgKHRoaXMucmVmUG9pbnQueCArIHRoaXMudykgPj0gcG9pbnQueCAmJlxyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgPD0gcG9pbnQueSAmJiAodGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSA+PSBwb2ludC55O1xyXG4gICAgfVxyXG5cclxuICAgIG9mZnNldCh2ZWN0b3I6IFZlY3RvcjxHbG9iYWxQb2ludD4pOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQuYWRkKHZlY3RvciksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnNlY3RzV2l0aChvdGhlcjogQm91bmRpbmdSZWN0KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuICEob3RoZXIucmVmUG9pbnQueCA+IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC54ICsgb3RoZXIudyA8IHRoaXMucmVmUG9pbnQueCB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC55ID4gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIHx8XHJcbiAgICAgICAgICAgIG90aGVyLnJlZlBvaW50LnkgKyBvdGhlci5oIDwgdGhpcy5yZWZQb2ludC55KTtcclxuICAgIH1cclxuICAgIGdldEludGVyc2VjdEFyZWFXaXRoUmVjdChvdGhlcjogQm91bmRpbmdSZWN0KTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICBjb25zdCB0b3BsZWZ0ID0gbmV3IEdsb2JhbFBvaW50KE1hdGgubWF4KHRoaXMucmVmUG9pbnQueCwgb3RoZXIucmVmUG9pbnQueCksIE1hdGgubWF4KHRoaXMucmVmUG9pbnQueSwgb3RoZXIucmVmUG9pbnQueSkpO1xyXG4gICAgICAgIGNvbnN0IHcgPSBNYXRoLm1pbih0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIG90aGVyLnJlZlBvaW50LnggKyBvdGhlci53KSAtIHRvcGxlZnQueDtcclxuICAgICAgICBjb25zdCBoID0gTWF0aC5taW4odGhpcy5yZWZQb2ludC55ICsgdGhpcy5oLCBvdGhlci5yZWZQb2ludC55ICsgb3RoZXIuaCkgLSB0b3BsZWZ0Lnk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodG9wbGVmdCwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBnZXRJbnRlcnNlY3RXaXRoTGluZShsaW5lOiB7IHN0YXJ0OiBHbG9iYWxQb2ludDsgZW5kOiBHbG9iYWxQb2ludCB9KSB7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSBbXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55KSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCArIHRoaXMudywgdGhpcy5yZWZQb2ludC55KSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54LCB0aGlzLnJlZlBvaW50LnkpLCBuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54LCB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpLCBsaW5lLnN0YXJ0LCBsaW5lLmVuZCksXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCArIHRoaXMudywgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbGluZS5zdGFydCwgbGluZS5lbmQpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBsZXQgbWluX2QgPSBJbmZpbml0eTtcclxuICAgICAgICBsZXQgbWluX2kgPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbCA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBpZiAobC5pbnRlcnNlY3QgPT09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBkID0gZ2V0UG9pbnREaXN0YW5jZShsaW5lLnN0YXJ0LCBsLmludGVyc2VjdCk7XHJcbiAgICAgICAgICAgIGlmIChtaW5fZCA+IGQpIHtcclxuICAgICAgICAgICAgICAgIG1pbl9kID0gZDtcclxuICAgICAgICAgICAgICAgIG1pbl9pID0gbC5pbnRlcnNlY3Q7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgaW50ZXJzZWN0OiBtaW5faSwgZGlzdGFuY2U6IG1pbl9kIH1cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQuYWRkKG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHt4OiB0aGlzLncvMiwgeTogdGhpcy5oLzJ9KSk7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IHsgZzJsLCBnMmx4LCBnMmx5IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyQ2lyY2xlIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2lyY2xlIGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdHlwZSA9IFwiY2lyY2xlXCI7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBib3JkZXI6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKGNlbnRlcjogR2xvYmFsUG9pbnQsIHI6IG51bWJlciwgZmlsbD86IHN0cmluZywgYm9yZGVyPzogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoY2VudGVyLCB1dWlkKTtcclxuICAgICAgICB0aGlzLnIgPSByIHx8IDE7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICAgICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB9O1xyXG4gICAgYXNEaWN0KCk6IFNlcnZlckNpcmNsZSB7XHJcbiAgICAgICAgLy8gY29uc3QgYmFzZSA9IDxTZXJ2ZXJDaXJjbGU+dGhpcy5nZXRCYXNlRGljdCgpO1xyXG4gICAgICAgIC8vIGJhc2UuciA9IHRoaXMucjtcclxuICAgICAgICAvLyBiYXNlLmJvcmRlciA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgIC8vIHJldHVybiBiYXNlO1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICByOiB0aGlzLnIsXHJcbiAgICAgICAgICAgIGJvcmRlcjogdGhpcy5ib3JkZXJcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlckNpcmNsZSkge1xyXG4gICAgICAgIHN1cGVyLmZyb21EaWN0KGRhdGEpO1xyXG4gICAgICAgIHRoaXMuciA9IGRhdGEucjtcclxuICAgICAgICBpZihkYXRhLmJvcmRlcilcclxuICAgICAgICAgICAgdGhpcy5ib3JkZXIgPSBkYXRhLmJvcmRlcjtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCAtIHRoaXMuciwgdGhpcy5yZWZQb2ludC55IC0gdGhpcy5yKSwgdGhpcy5yICogMiwgdGhpcy5yICogMik7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IGcybCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdGhpcy5yLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAocG9pbnQueCAtIHRoaXMucmVmUG9pbnQueCkgKiogMiArIChwb2ludC55IC0gdGhpcy5yZWZQb2ludC55KSAqKiAyIDwgdGhpcy5yICoqIDI7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvL1RPRE9cclxuICAgIH1cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic2VcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInNlXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQge1xyXG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludDtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gY2VudGVyUG9pbnQ7XHJcbiAgICB9XHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IHV1aWR2NCB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwb3B1bGF0ZUVkaXRBc3NldERpYWxvZyhzZWxmOiBTaGFwZSkge1xyXG4gICAgJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbChzZWxmLnV1aWQpO1xyXG4gICAgY29uc3QgZGlhbG9nX25hbWUgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW5hbWVcIik7XHJcbiAgICBkaWFsb2dfbmFtZS52YWwoc2VsZi5uYW1lKTtcclxuICAgIGRpYWxvZ19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgcy5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAkKFwiI3NlbGVjdGlvbi1uYW1lXCIpLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkaWFsb2dfbGlnaHRibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbGlnaHRibG9ja2VyXCIpO1xyXG4gICAgZGlhbG9nX2xpZ2h0YmxvY2sucHJvcChcImNoZWNrZWRcIiwgc2VsZi52aXNpb25PYnN0cnVjdGlvbik7XHJcbiAgICBkaWFsb2dfbGlnaHRibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgcy52aXNpb25PYnN0cnVjdGlvbiA9IGRpYWxvZ19saWdodGJsb2NrLnByb3AoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICBzLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkaWFsb2dfbW92ZWJsb2NrID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1tb3ZlYmxvY2tlclwiKTtcclxuICAgIGRpYWxvZ19tb3ZlYmxvY2sucHJvcChcImNoZWNrZWRcIiwgc2VsZi5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgIGRpYWxvZ19tb3ZlYmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgIHMuc2V0TW92ZW1lbnRCbG9jayhkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIpKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgYW5ub3RhdGlvbl90ZXh0ID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1hbm5vdGF0aW9uLXRleHRhcmVhXCIpO1xyXG4gICAgYW5ub3RhdGlvbl90ZXh0LnZhbChzZWxmLmFubm90YXRpb24pO1xyXG4gICAgYW5ub3RhdGlvbl90ZXh0Lm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBjb25zdCBoYWRfYW5ub3RhdGlvbiA9IHMuYW5ub3RhdGlvbiAhPT0gJyc7XHJcbiAgICAgICAgICAgIHMuYW5ub3RhdGlvbiA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgaWYgKHMuYW5ub3RhdGlvbiAhPT0gJycgJiYgIWhhZF9hbm5vdGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5wdXNoKHMudXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZHJhd1wiKSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpIS5pbnZhbGlkYXRlKHRydWUpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocy5hbm5vdGF0aW9uID09ICcnICYmIGhhZF9hbm5vdGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5zcGxpY2UoZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMuZmluZEluZGV4KGFuID0+IGFuID09PSBzLnV1aWQpKTtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJkcmF3XCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhLmludmFsaWRhdGUodHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBvd25lcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW93bmVyc1wiKTtcclxuICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy10cmFja2Vyc1wiKTtcclxuICAgIGNvbnN0IGF1cmFzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1hdXJhc1wiKTtcclxuICAgIGNvbnN0IGFubm90YXRpb24gPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWFubm90YXRpb25cIik7XHJcbiAgICBvd25lcnMubmV4dFVudGlsKHRyYWNrZXJzKS5yZW1vdmUoKTtcclxuICAgIHRyYWNrZXJzLm5leHRVbnRpbChhdXJhcykucmVtb3ZlKCk7XHJcbiAgICBhdXJhcy5uZXh0VW50aWwoYW5ub3RhdGlvbikucmVtb3ZlKCk7ICAvLygkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmZpbmQoXCJmb3JtXCIpKS5yZW1vdmUoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRPd25lcihvd25lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qgb3dfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtbmFtZT1cIiR7b3duZXJ9XCIgdmFsdWU9XCIke293bmVyfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCBvd19yZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgdHJhY2tlcnMuYmVmb3JlKG93X25hbWUuYWRkKG93X3JlbW92ZSkpO1xyXG5cclxuICAgICAgICBvd19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgaWYgKG93X2kgPj0gMClcclxuICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxLCA8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5wdXNoKDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG93X3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGYub3duZXJzLmZvckVhY2goYWRkT3duZXIpO1xyXG4gICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKVxyXG4gICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZFRyYWNrZXIodHJhY2tlcjogVHJhY2tlcikge1xyXG4gICAgICAgIGNvbnN0IHRyX25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci5uYW1lfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCB0cl92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci52YWx1ZX1cIj5gKTtcclxuICAgICAgICBjb25zdCB0cl9tYXh2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIk1heCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLm1heHZhbHVlIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgdHJfdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IHRyX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICBhdXJhcy5iZWZvcmUoXHJcbiAgICAgICAgICAgIHRyX25hbWVcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+Lzwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl9tYXh2YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl9yZW1vdmUpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCF0cmFja2VyLnZpc2libGUpXHJcbiAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICB0cl9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTmFtZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LW5hbWVgKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLnRyYWNrZXJzLmxlbmd0aCB8fCBzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnB1c2goeyB1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAwLCBtYXh2YWx1ZTogMCwgdmlzaWJsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICBhZGRUcmFja2VyKHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0cl92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWYWx1ZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdHJfbWF4dmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWF6dmFsdWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ci5tYXh2YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVtb3ZlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHIubmFtZSA9PT0gJycgfHwgdHIudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3RyLnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnNwbGljZShzZWxmLnRyYWNrZXJzLmluZGV4T2YodHIpLCAxKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZpc2liaWxpdHkgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHIudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgdHIudmlzaWJsZSA9ICF0ci52aXNpYmxlO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxmLnRyYWNrZXJzLmZvckVhY2goYWRkVHJhY2tlcik7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkQXVyYShhdXJhOiBBdXJhKSB7XHJcbiAgICAgICAgY29uc3QgYXVyYV9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS52YWx1ZX1cIj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX2RpbXZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiRGltIHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEuZGltIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9jb2xvdXIgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkF1cmEgY29sb3VyXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9saWdodCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtbGlnaHRidWxiXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfcmVtb3ZlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgIC8vICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuY2hpbGRyZW4oKS5sYXN0KCkuYXBwZW5kKFxyXG4gICAgICAgIGFubm90YXRpb24uYmVmb3JlKFxyXG4gICAgICAgICAgICBhdXJhX25hbWVcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfZGltdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZCgkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApLmFwcGVuZChhdXJhX2NvbG91cikuYXBwZW5kKCQoXCI8L2Rpdj5cIikpKVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX3Zpc2libGUpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfbGlnaHQpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfcmVtb3ZlKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghYXVyYS52aXNpYmxlKVxyXG4gICAgICAgICAgICBhdXJhX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgIGlmICghYXVyYS5saWdodFNvdXJjZSlcclxuICAgICAgICAgICAgYXVyYV9saWdodC5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcblxyXG4gICAgICAgIGF1cmFfY29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBhdXJhLmNvbG91cixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gbW92ZSB1bmtub3duIGF1cmEgY29sb3VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIERvIG5vdCB1c2UgYXVyYSBkaXJlY3RseSBhcyBpdCBkb2VzIG5vdCB3b3JrIHByb3Blcmx5IGZvciBuZXcgYXVyYXNcclxuICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYXVyYV9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSBuYW1lIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLmF1cmFzLmxlbmd0aCB8fCBzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIHZhbHVlIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX2RpbXZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgZGltdmFsdWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1LnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYXUubmFtZSA9PT0gJycgJiYgYXUudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke2F1LnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLmF1cmFzLnNwbGljZShzZWxmLmF1cmFzLmluZGV4T2YoYXUpLCAxKTtcclxuICAgICAgICAgICAgc2VsZi5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgdmlzaWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUudmlzaWJsZSA9ICFhdS52aXNpYmxlO1xyXG4gICAgICAgICAgICBpZiAoYXUudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV9saWdodC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHRvZ2dsZSBsaWdodCBjYXBhYmlsaXR5IG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS5saWdodFNvdXJjZSA9ICFhdS5saWdodFNvdXJjZTtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIGxzLnB1c2goeyBzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxmLmF1cmFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW2ldKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZ2FtZU1hbmFnZXIuc2hhcGVTZWxlY3Rpb25EaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuXHJcbiAgICAkKCcuc2VsZWN0aW9uLXRyYWNrZXItdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKHRyYWNrZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB1cGRhdGUgdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG5ld190cmFja2VyID0gcHJvbXB0KGBOZXcgICR7dHJhY2tlci5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgIGlmIChuZXdfdHJhY2tlciA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGlmICh0cmFja2VyLnZhbHVlID09PSAwKVxyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlID0gMDtcclxuICAgICAgICBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlICs9IHBhcnNlSW50KG5ld190cmFja2VyLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5ld190cmFja2VyWzBdID09PSAnLScpIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSAtPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSA9IHBhcnNlSW50KG5ld190cmFja2VyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAkKHRoaXMpLnRleHQodmFsKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICB9KTtcclxuICAgICQoJy5zZWxlY3Rpb24tYXVyYS12YWx1ZScpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICBjb25zdCBhdXJhID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbmV3X2F1cmEgPSBwcm9tcHQoYE5ldyAgJHthdXJhLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XHJcbiAgICAgICAgaWYgKG5ld19hdXJhID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApXHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgPSAwO1xyXG4gICAgICAgIGlmIChuZXdfYXVyYVswXSA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobmV3X2F1cmFbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlIC09IHBhcnNlSW50KG5ld19hdXJhLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlID0gcGFyc2VJbnQobmV3X2F1cmEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH0pO1xyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHkgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJMaW5lIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGluZSBleHRlbmRzIFNoYXBlIHtcclxuICAgIHR5cGUgPSBcImxpbmVcIjtcclxuICAgIGVuZFBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIGNvbnN0cnVjdG9yKHN0YXJ0UG9pbnQ6IEdsb2JhbFBvaW50LCBlbmRQb2ludDogR2xvYmFsUG9pbnQsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcihzdGFydFBvaW50LCB1dWlkKTtcclxuICAgICAgICB0aGlzLmVuZFBvaW50ID0gZW5kUG9pbnQ7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHgyOiB0aGlzLmVuZFBvaW50LngsXHJcbiAgICAgICAgICAgIHkyOiB0aGlzLmVuZFBvaW50LnksXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QoXHJcbiAgICAgICAgICAgIG5ldyBHbG9iYWxQb2ludChcclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMucmVmUG9pbnQueCwgdGhpcy5lbmRQb2ludC54KSxcclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMucmVmUG9pbnQueCwgdGhpcy5lbmRQb2ludC55KSxcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy5yZWZQb2ludC54IC0gdGhpcy5lbmRQb2ludC54KSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy5yZWZQb2ludC55IC0gdGhpcy5lbmRQb2ludC55KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHgubW92ZVRvKGcybHgodGhpcy5yZWZQb2ludC54KSwgZzJseSh0aGlzLnJlZlBvaW50LnkpKTtcclxuICAgICAgICBjdHgubGluZVRvKGcybHgodGhpcy5lbmRQb2ludC54KSwgZzJseSh0aGlzLmVuZFBvaW50LnkpKTtcclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsMCwwLCAwLjUpJztcclxuICAgICAgICBjdHgubGluZVdpZHRoID0gMztcclxuICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHsgfSAvLyBUT0RPXHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiBcIlwiIH07IC8vIFRPRE9cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxufSIsImltcG9ydCBCYXNlUmVjdCBmcm9tIFwiLi9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgZzJsIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyUmVjdCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY3QgZXh0ZW5kcyBCYXNlUmVjdCB7XHJcbiAgICB0eXBlID0gXCJyZWN0XCJcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IodG9wbGVmdDogR2xvYmFsUG9pbnQsIHc6IG51bWJlciwgaDogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB3LCBoLCB1dWlkKTtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgYm9yZGVyOiB0aGlzLmJvcmRlclxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBmcm9tRGljdChkYXRhOiBTZXJ2ZXJSZWN0KSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgaWYgKGRhdGEuYm9yZGVyKVxyXG4gICAgICAgICAgICB0aGlzLmJvcmRlciA9IGRhdGEuYm9yZGVyO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBsb2MgPSBnMmwodGhpcy5yZWZQb2ludCk7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICAgICAgaWYgKHRoaXMuYm9yZGVyICE9PSBcInJnYmEoMCwgMCwgMCwgMClcIikge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyB1dWlkdjQgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBnMmwsIGcybHIgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgcG9wdWxhdGVFZGl0QXNzZXREaWFsb2cgfSBmcm9tIFwiLi9lZGl0ZGlhbG9nXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyU2hhcGUgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgU2hhcGUge1xyXG4gICAgLy8gVXNlZCB0byBjcmVhdGUgY2xhc3MgaW5zdGFuY2UgZnJvbSBzZXJ2ZXIgc2hhcGUgZGF0YVxyXG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IHR5cGU6IHN0cmluZztcclxuICAgIC8vIFRoZSB1bmlxdWUgSUQgb2YgdGhpcyBzaGFwZVxyXG4gICAgdXVpZDogc3RyaW5nO1xyXG4gICAgLy8gVGhlIGxheWVyIHRoZSBzaGFwZSBpcyBjdXJyZW50bHkgb25cclxuICAgIGxheWVyITogc3RyaW5nO1xyXG5cclxuICAgIC8vIEEgcmVmZXJlbmNlIHBvaW50IHJlZ2FyZGluZyB0aGF0IHNwZWNpZmljIHNoYXBlJ3Mgc3RydWN0dXJlXHJcbiAgICByZWZQb2ludDogR2xvYmFsUG9pbnQ7XHJcbiAgICBcclxuICAgIC8vIEZpbGwgY29sb3VyIG9mIHRoZSBzaGFwZVxyXG4gICAgZmlsbDogc3RyaW5nID0gJyMwMDAnO1xyXG4gICAgLy9UaGUgb3B0aW9uYWwgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNoYXBlXHJcbiAgICBuYW1lID0gJ1Vua25vd24gc2hhcGUnO1xyXG5cclxuICAgIC8vIEFzc29jaWF0ZWQgdHJhY2tlcnMvYXVyYXMvb3duZXJzXHJcbiAgICB0cmFja2VyczogVHJhY2tlcltdID0gW107XHJcbiAgICBhdXJhczogQXVyYVtdID0gW107XHJcbiAgICBvd25lcnM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgLy8gQmxvY2sgbGlnaHQgc291cmNlc1xyXG4gICAgdmlzaW9uT2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuICAgIC8vIFByZXZlbnQgc2hhcGVzIGZyb20gb3ZlcmxhcHBpbmcgd2l0aCB0aGlzIHNoYXBlXHJcbiAgICBtb3ZlbWVudE9ic3RydWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgLy8gTW91c2VvdmVyIGFubm90YXRpb25cclxuICAgIGFubm90YXRpb246IHN0cmluZyA9ICcnO1xyXG5cclxuICAgIC8vIERyYXcgbW9kdXMgdG8gdXNlXHJcbiAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHN0cmluZyA9IFwic291cmNlLW92ZXJcIjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihyZWZQb2ludDogR2xvYmFsUG9pbnQsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gcmVmUG9pbnQ7XHJcbiAgICAgICAgdGhpcy51dWlkID0gdXVpZCB8fCB1dWlkdjQoKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Q7XHJcblxyXG4gICAgLy8gSWYgaW5Xb3JsZENvb3JkIGlzIFxyXG4gICAgYWJzdHJhY3QgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbjtcclxuXHJcbiAgICBhYnN0cmFjdCBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBhYnN0cmFjdCBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGFic3RyYWN0IGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICBhYnN0cmFjdCB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW47XHJcblxyXG4gICAgY2hlY2tMaWdodFNvdXJjZXMoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3Qgdm9faSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuaW5kZXhPZih0aGlzLnV1aWQpO1xyXG4gICAgICAgIGlmICh0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgICAgICBlbHNlIGlmICghdGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgbGlnaHRzb3VyY2UgYXVyYXMgYXJlIGluIHRoZSBnYW1lTWFuYWdlclxyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXUpIHtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UgJiYgaSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGxzLnB1c2goeyBzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFhdS5saWdodFNvdXJjZSAmJiBpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIGFueXRoaW5nIGluIHRoZSBnYW1lTWFuYWdlciByZWZlcmVuY2luZyB0aGlzIHNoYXBlIGlzIGluIGZhY3Qgc3RpbGwgYSBsaWdodHNvdXJjZVxyXG4gICAgICAgIGZvciAobGV0IGkgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChscy5zaGFwZSA9PT0gc2VsZi51dWlkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuYXVyYXMuc29tZShhID0+IGEudXVpZCA9PT0gbHMuYXVyYSAmJiBhLmxpZ2h0U291cmNlKSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE1vdmVtZW50QmxvY2soYmxvY2tzTW92ZW1lbnQ6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBibG9ja3NNb3ZlbWVudCB8fCBmYWxzZTtcclxuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XHJcbiAgICAgICAgaWYgKHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIG93bmVkQnkodXNlcm5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodXNlcm5hbWUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdXNlcm5hbWUgPSBnYW1lTWFuYWdlci51c2VybmFtZTtcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIuSVNfRE0gfHwgdGhpcy5vd25lcnMuaW5jbHVkZXModXNlcm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0aW9uKCkge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFja2Vycy5sZW5ndGggfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMClcclxuICAgICAgICAgICAgdGhpcy50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xyXG4gICAgICAgIGlmICghdGhpcy5hdXJhcy5sZW5ndGggfHwgdGhpcy5hdXJhc1t0aGlzLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMClcclxuICAgICAgICAgICAgdGhpcy5hdXJhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogMCxcclxuICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgIGxpZ2h0U291cmNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLFxyXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KHRoaXMubmFtZSk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NlbGVjdGlvbi10cmFja2Vyc1wiKTtcclxuICAgICAgICB0cmFja2Vycy5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMudHJhY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAodHJhY2tlcikge1xyXG4gICAgICAgICAgICBpZiAodHJhY2tlci52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmFja2VyLm1heHZhbHVlID8gYCR7dHJhY2tlci52YWx1ZX0vJHt0cmFja2VyLm1heHZhbHVlfWAgOiB0cmFja2VyLnZhbHVlO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi10cmFja2VyLSR7dHJhY2tlci51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+JHt0cmFja2VyLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLXRyYWNrZXItJHt0cmFja2VyLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tdHJhY2tlci12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgYXVyYXMgPSAkKFwiI3NlbGVjdGlvbi1hdXJhc1wiKTtcclxuICAgICAgICBhdXJhcy5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgICAgICBpZiAoYXVyYS52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgICAgIGF1cmFzLmFwcGVuZCgkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLWF1cmEtJHthdXJhLnV1aWR9LW5hbWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4ke2F1cmEubmFtZX08L2Rpdj5gKSk7XHJcbiAgICAgICAgICAgIGF1cmFzLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tYXVyYS0ke2F1cmEudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi1hdXJhLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1tZW51XCIpLnNob3coKTtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zdCBlZGl0YnV0dG9uID0gJChcIiNzZWxlY3Rpb24tZWRpdC1idXR0b25cIik7XHJcbiAgICAgICAgaWYgKCF0aGlzLm93bmVkQnkoKSlcclxuICAgICAgICAgICAgZWRpdGJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlZGl0YnV0dG9uLnNob3coKTtcclxuICAgICAgICBlZGl0YnV0dG9uLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7cG9wdWxhdGVFZGl0QXNzZXREaWFsb2coc2VsZil9KTtcclxuICAgIH1cclxuXHJcbiAgICBvblNlbGVjdGlvbkxvc3MoKSB7XHJcbiAgICAgICAgLy8gJChgI3NoYXBlc2VsZWN0aW9uY29nLSR7dGhpcy51dWlkfWApLnJlbW92ZSgpO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERvIG5vdCBwcm92aWRlIGdldEJhc2VEaWN0IGFzIHRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHRvIGZvcmNlIHRoZSBpbXBsZW1lbnRhdGlvblxyXG4gICAgYWJzdHJhY3QgYXNEaWN0KCk6IFNlcnZlclNoYXBlO1xyXG4gICAgZ2V0QmFzZURpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxyXG4gICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXHJcbiAgICAgICAgICAgIHg6IHRoaXMucmVmUG9pbnQueCxcclxuICAgICAgICAgICAgeTogdGhpcy5yZWZQb2ludC55LFxyXG4gICAgICAgICAgICBsYXllcjogdGhpcy5sYXllcixcclxuICAgICAgICAgICAgZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uOiB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbixcclxuICAgICAgICAgICAgbW92ZW1lbnRPYnN0cnVjdGlvbjogdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uLFxyXG4gICAgICAgICAgICB2aXNpb25PYnN0cnVjdGlvbjogdGhpcy52aXNpb25PYnN0cnVjdGlvbixcclxuICAgICAgICAgICAgYXVyYXM6IHRoaXMuYXVyYXMsXHJcbiAgICAgICAgICAgIHRyYWNrZXJzOiB0aGlzLnRyYWNrZXJzLFxyXG4gICAgICAgICAgICBvd25lcnM6IHRoaXMub3duZXJzLFxyXG4gICAgICAgICAgICBmaWxsOiB0aGlzLmZpbGwsXHJcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcclxuICAgICAgICAgICAgYW5ub3RhdGlvbjogdGhpcy5hbm5vdGF0aW9uLFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlclNoYXBlKSB7XHJcbiAgICAgICAgdGhpcy5sYXllciA9IGRhdGEubGF5ZXI7XHJcbiAgICAgICAgdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBkYXRhLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBkYXRhLm1vdmVtZW50T2JzdHJ1Y3Rpb247XHJcbiAgICAgICAgdGhpcy52aXNpb25PYnN0cnVjdGlvbiA9IGRhdGEudmlzaW9uT2JzdHJ1Y3Rpb247XHJcbiAgICAgICAgdGhpcy5hdXJhcyA9IGRhdGEuYXVyYXM7XHJcbiAgICAgICAgdGhpcy50cmFja2VycyA9IGRhdGEudHJhY2tlcnM7XHJcbiAgICAgICAgdGhpcy5vd25lcnMgPSBkYXRhLm93bmVycztcclxuICAgICAgICBpZiAoZGF0YS5hbm5vdGF0aW9uKVxyXG4gICAgICAgICAgICB0aGlzLmFubm90YXRpb24gPSBkYXRhLmFubm90YXRpb247XHJcbiAgICAgICAgaWYgKGRhdGEubmFtZSlcclxuICAgICAgICAgICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBpZiAodGhpcy5sYXllciA9PT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgdGhpcy5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgICAgIHRoaXMuZHJhd0F1cmFzKGN0eCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0F1cmFzKGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGF1cmEuY29sb3VyO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuY3R4ID09PSBjdHgpXHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSBnMmwoc2VsZi5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCBnMmxyKGF1cmEudmFsdWUpLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLmRpbSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGMgPSB0aW55Y29sb3IoYXVyYS5jb2xvdXIpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRjLnNldEFscGhhKHRjLmdldEFscGhhKCkgLyAyKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jID0gZzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIGcybHIoYXVyYS5kaW0pLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0NvbnRleHRNZW51KG1vdXNlOiBMb2NhbFBvaW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGwuc2VsZWN0aW9uID0gW3RoaXNdO1xyXG4gICAgICAgIHRoaXMub25TZWxlY3Rpb24oKTtcclxuICAgICAgICBsLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzO1xyXG4gICAgICAgICRtZW51LnNob3coKTtcclxuICAgICAgICAkbWVudS5lbXB0eSgpO1xyXG4gICAgICAgICRtZW51LmNzcyh7IGxlZnQ6IG1vdXNlLngsIHRvcDogbW91c2UueSB9KTtcclxuICAgICAgICBsZXQgZGF0YSA9IFwiXCIgK1xyXG4gICAgICAgICAgICBcIjx1bD5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpPkxheWVyPHVsPlwiO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5sYXllcnMuZm9yRWFjaChmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLm5hbWUgPT09IGwubmFtZSA/IFwiIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOmFxdWEnIFwiIDogXCIgXCI7XHJcbiAgICAgICAgICAgIGRhdGEgKz0gYDxsaSBkYXRhLWFjdGlvbj0nc2V0TGF5ZXInIGRhdGEtbGF5ZXI9JyR7bGF5ZXIubmFtZX0nICR7c2VsfSBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPiR7bGF5ZXIubmFtZX08L2xpPmA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGF0YSArPSBcIjwvdWw+PC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9CYWNrJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPk1vdmUgdG8gYmFjazwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvRnJvbnQnIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBmcm9udDwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nYWRkSW5pdGlhdGl2ZScgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5BZGQgaW5pdGlhdGl2ZTwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjwvdWw+XCI7XHJcbiAgICAgICAgJG1lbnUuaHRtbChkYXRhKTtcclxuICAgICAgICAkKFwiLmNvbnRleHQtY2xpY2thYmxlXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYXNzZXQub25Db250ZXh0TWVudSgkKHRoaXMpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIG9uQ29udGV4dE1lbnUobWVudTogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IG1lbnUuZGF0YShcImFjdGlvblwiKTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgICAgIGlmIChsYXllciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSAnbW92ZVRvRnJvbnQnOlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIodGhpcywgbGF5ZXIuc2hhcGVzLmxlbmd0aCAtIDEsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vdmVUb0JhY2snOlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIodGhpcywgMCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc2V0TGF5ZXInOlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIobWVudS5kYXRhKFwibGF5ZXJcIikpIS5hZGRTaGFwZSh0aGlzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdhZGRJbml0aWF0aXZlJzpcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLmFkZEluaXRpYXRpdmUodGhpcy5nZXRJbml0aWF0aXZlUmVwcigpLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkbWVudS5oaWRlKCk7XHJcbiAgICB9XHJcbiAgICBnZXRJbml0aWF0aXZlUmVwcigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXHJcbiAgICAgICAgICAgIHZpc2libGU6ICFnYW1lTWFuYWdlci5JU19ETSxcclxuICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICBzcmM6IFwiXCIsXHJcbiAgICAgICAgICAgIG93bmVyczogdGhpcy5vd25lcnNcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBnMmwgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgU2VydmVyVGV4dCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRleHQgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB0eXBlID0gXCJ0ZXh0XCI7XHJcbiAgICB0ZXh0OiBzdHJpbmc7XHJcbiAgICBmb250OiBzdHJpbmc7XHJcbiAgICBhbmdsZTogbnVtYmVyO1xyXG4gICAgY29uc3RydWN0b3IocG9zaXRpb246IEdsb2JhbFBvaW50LCB0ZXh0OiBzdHJpbmcsIGZvbnQ6IHN0cmluZywgYW5nbGU/OiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcihwb3NpdGlvbiwgdXVpZCk7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcclxuICAgICAgICB0aGlzLmZvbnQgPSBmb250O1xyXG4gICAgICAgIHRoaXMuYW5nbGUgPSBhbmdsZSB8fCAwO1xyXG4gICAgfVxyXG4gICAgYXNEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICB0ZXh0OiB0aGlzLnRleHQsXHJcbiAgICAgICAgICAgIGZvbnQ6IHRoaXMuZm9udCxcclxuICAgICAgICAgICAgYW5nbGU6IHRoaXMuYW5nbGVcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLnJlZlBvaW50LCA1LCA1KTsgLy8gVG9kbzogZml4IHRoaXMgYm91bmRpbmcgYm94XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5mb250ID0gdGhpcy5mb250O1xyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY29uc3QgZGVzdCA9IGcybCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICBjdHgudHJhbnNsYXRlKGRlc3QueCwgZGVzdC55KTtcclxuICAgICAgICBjdHgucm90YXRlKHRoaXMuYW5nbGUpO1xyXG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xyXG4gICAgICAgIC8vIGN0eC5maWxsVGV4dCh0aGlzLnRleHQsIDAsIC01KTtcclxuICAgICAgICB0aGlzLmRyYXdXcmFwcGVkVGV4dChjdHgpO1xyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHsgfSAvLyBUT0RPXHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nIHwgdW5kZWZpbmVkIHsgcmV0dXJuIFwiXCIgfTsgLy8gVE9ET1xyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xyXG5cclxuICAgIHByaXZhdGUgZHJhd1dyYXBwZWRUZXh0KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSB0aGlzLnRleHQuc3BsaXQoXCJcXG5cIik7XHJcbiAgICAgICAgY29uc3QgbWF4V2lkdGggPSBjdHguY2FudmFzLndpZHRoO1xyXG4gICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSAzMDtcclxuICAgICAgICBjb25zdCB4ID0gMDsgLy90aGlzLnJlZlBvaW50Lng7XHJcbiAgICAgICAgbGV0IHkgPSAtNTsgLy90aGlzLnJlZlBvaW50Lnk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgbGluZXMubGVuZ3RoOyBuKyspIHtcclxuICAgICAgICAgICAgbGV0IGxpbmUgPSAnJztcclxuICAgICAgICAgICAgY29uc3Qgd29yZHMgPSBsaW5lc1tuXS5zcGxpdChcIiBcIik7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHcgPSAwOyB3IDwgd29yZHMubGVuZ3RoOyB3KyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RMaW5lID0gbGluZSArIHdvcmRzW3ddICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWV0cmljcyA9IGN0eC5tZWFzdXJlVGV4dCh0ZXN0TGluZSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVzdFdpZHRoID0gbWV0cmljcy53aWR0aDtcclxuICAgICAgICAgICAgICAgIGlmICh0ZXN0V2lkdGggPiBtYXhXaWR0aCAmJiBuID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChsaW5lLCB4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lID0gd29yZHNbd10gKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgICAgICB5ICs9IGxpbmVIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSB0ZXN0TGluZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguZmlsbFRleHQobGluZSwgeCwgeSk7XHJcbiAgICAgICAgICAgIHkgKz0gbGluZUhlaWdodDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4vcmVjdFwiO1xyXG5pbXBvcnQgQ2lyY2xlIGZyb20gXCIuL2NpcmNsZVwiO1xyXG5pbXBvcnQgTGluZSBmcm9tIFwiLi9saW5lXCI7XHJcbmltcG9ydCBUZXh0IGZyb20gXCIuL3RleHRcIjtcclxuaW1wb3J0IEFzc2V0IGZyb20gXCIuL2Fzc2V0XCI7XHJcbmltcG9ydCB7IFNlcnZlclNoYXBlLCBTZXJ2ZXJSZWN0LCBTZXJ2ZXJDaXJjbGUsIFNlcnZlckxpbmUsIFNlcnZlclRleHQsIFNlcnZlckFzc2V0IH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGU6IFNlcnZlclNoYXBlLCBkdW1teT86IGJvb2xlYW4pIHtcclxuICAgIC8vIHRvZG8gaXMgdGhpcyBkdW1teSBzdHVmZiBhY3R1YWxseSBuZWVkZWQsIGRvIHdlIGV2ZXIgd2FudCB0byByZXR1cm4gdGhlIGxvY2FsIHNoYXBlP1xyXG4gICAgaWYgKGR1bW15ID09PSB1bmRlZmluZWQpIGR1bW15ID0gZmFsc2U7XHJcbiAgICBpZiAoIWR1bW15ICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSlcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpO1xyXG5cclxuICAgIGxldCBzaDogU2hhcGU7XHJcblxyXG4gICAgLy8gQSBmcm9tSlNPTiBhbmQgdG9KU09OIG9uIFNoYXBlIHdvdWxkIGJlIGNsZWFuZXIgYnV0IHRzIGRvZXMgbm90IGFsbG93IGZvciBzdGF0aWMgYWJzdHJhY3RzIHNvIHllYWguXHJcblxyXG4gICAgY29uc3QgcmVmUG9pbnQgPSBuZXcgR2xvYmFsUG9pbnQoc2hhcGUueCwgc2hhcGUueSk7XHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSB7XHJcbiAgICAgICAgY29uc3QgcmVjdCA9IDxTZXJ2ZXJSZWN0PnNoYXBlO1xyXG4gICAgICAgIHNoID0gbmV3IFJlY3QocmVmUG9pbnQsIHJlY3QudywgcmVjdC5oLCByZWN0LmZpbGwsIHJlY3QuYm9yZGVyLCByZWN0LnV1aWQpO1xyXG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnY2lyY2xlJykge1xyXG4gICAgICAgIGNvbnN0IGNpcmMgPSA8U2VydmVyQ2lyY2xlPnNoYXBlO1xyXG4gICAgICAgIHNoID0gbmV3IENpcmNsZShyZWZQb2ludCwgY2lyYy5yLCBjaXJjLmZpbGwsIGNpcmMuYm9yZGVyLCBjaXJjLnV1aWQpO1xyXG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnbGluZScpIHtcclxuICAgICAgICBjb25zdCBsaW5lID0gPFNlcnZlckxpbmU+c2hhcGU7XHJcbiAgICAgICAgc2ggPSBuZXcgTGluZShyZWZQb2ludCwgbmV3IEdsb2JhbFBvaW50KGxpbmUueDIsIGxpbmUueTIpLCBsaW5lLnV1aWQpO1xyXG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAndGV4dCcpIHtcclxuICAgICAgICBjb25zdCB0ZXh0ID0gPFNlcnZlclRleHQ+c2hhcGU7XHJcbiAgICAgICAgc2ggPSBuZXcgVGV4dChyZWZQb2ludCwgdGV4dC50ZXh0LCB0ZXh0LmZvbnQsIHRleHQuYW5nbGUsIHRleHQudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdhc3NldCcpIHtcclxuICAgICAgICBjb25zdCBhc3NldCA9IDxTZXJ2ZXJBc3NldD5zaGFwZTtcclxuICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoYXNzZXQudywgYXNzZXQuaCk7XHJcbiAgICAgICAgaWYgKGFzc2V0LnNyYy5zdGFydHNXaXRoKFwiaHR0cFwiKSlcclxuICAgICAgICAgICAgaW1nLnNyYyA9IG5ldyBVUkwoYXNzZXQuc3JjKS5wYXRobmFtZTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGltZy5zcmMgPSBhc3NldC5zcmNcclxuICAgICAgICBzaCA9IG5ldyBBc3NldChpbWcsIHJlZlBvaW50LCBhc3NldC53LCBhc3NldC5oLCBhc3NldC51dWlkKTtcclxuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgc2guZnJvbURpY3Qoc2hhcGUpO1xyXG4gICAgcmV0dXJuIHNoO1xyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgYWxwaFNvcnQgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBzZXR1cFRvb2xzIH0gZnJvbSBcIi4vdG9vbHMvdG9vbHNcIjtcclxuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgTG9jYXRpb25PcHRpb25zLCBBc3NldExpc3QsIFNlcnZlclNoYXBlLCBJbml0aWF0aXZlRGF0YSwgQm9hcmRJbmZvIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XHJcblxyXG5jb25zdCBwcm90b2NvbCA9IGRvY3VtZW50LmRvbWFpbiA9PT0gJ2xvY2FsaG9zdCcgPyBcImh0dHA6Ly9cIiA6IFwiaHR0cHM6Ly9cIjtcclxuY29uc3Qgc29ja2V0ID0gaW8uY29ubmVjdChwcm90b2NvbCArIGRvY3VtZW50LmRvbWFpbiArIFwiOlwiICsgbG9jYXRpb24ucG9ydCArIFwiL3BsYW5hcmFsbHlcIik7XHJcbnNvY2tldC5vbihcImNvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiRGlzY29ubmVjdGVkXCIpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwicmVkaXJlY3RcIiwgZnVuY3Rpb24gKGRlc3RpbmF0aW9uOiBzdHJpbmcpIHtcclxuICAgIGNvbnNvbGUubG9nKFwicmVkaXJlY3RpbmdcIik7XHJcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGRlc3RpbmF0aW9uO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHJvb20gaW5mb1wiLCBmdW5jdGlvbiAoZGF0YToge25hbWU6IHN0cmluZywgY3JlYXRvcjogc3RyaW5nfSkge1xyXG4gICAgZ2FtZU1hbmFnZXIucm9vbU5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICBnYW1lTWFuYWdlci5yb29tQ3JlYXRvciA9IGRhdGEuY3JlYXRvcjtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCB1c2VybmFtZVwiLCBmdW5jdGlvbiAodXNlcm5hbWU6IHN0cmluZykge1xyXG4gICAgZ2FtZU1hbmFnZXIudXNlcm5hbWUgPSB1c2VybmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLklTX0RNID0gdXNlcm5hbWUgPT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMl07XHJcbiAgICBpZiAoJChcIiN0b29sc2VsZWN0XCIpLmZpbmQoXCJ1bFwiKS5odG1sKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHNldHVwVG9vbHMoKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCBjbGllbnRPcHRpb25zXCIsIGZ1bmN0aW9uIChvcHRpb25zOiBDbGllbnRPcHRpb25zKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRDbGllbnRPcHRpb25zKG9wdGlvbnMpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGxvY2F0aW9uXCIsIGZ1bmN0aW9uIChkYXRhOiB7bmFtZTpzdHJpbmcsIG9wdGlvbnM6IExvY2F0aW9uT3B0aW9uc30pIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZSA9IGRhdGEubmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRPcHRpb25zKGRhdGEub3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJhc3NldCBsaXN0XCIsIGZ1bmN0aW9uIChhc3NldHM6IEFzc2V0TGlzdCkge1xyXG4gICAgY29uc3QgbSA9ICQoXCIjbWVudS10b2tlbnNcIik7XHJcbiAgICBtLmVtcHR5KCk7XHJcbiAgICBsZXQgaCA9ICcnO1xyXG5cclxuICAgIGNvbnN0IHByb2Nlc3MgPSBmdW5jdGlvbiAoZW50cnk6IEFzc2V0TGlzdCwgcGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgZm9sZGVycyA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoZW50cnkuZm9sZGVycykpO1xyXG4gICAgICAgIGZvbGRlcnMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGJ1dHRvbiBjbGFzcz0nYWNjb3JkaW9uJz5cIiArIGtleSArIFwiPC9idXR0b24+PGRpdiBjbGFzcz0nYWNjb3JkaW9uLXBhbmVsJz48ZGl2IGNsYXNzPSdhY2NvcmRpb24tc3VicGFuZWwnPlwiO1xyXG4gICAgICAgICAgICBwcm9jZXNzKHZhbHVlLCBwYXRoICsga2V5ICsgXCIvXCIpO1xyXG4gICAgICAgICAgICBoICs9IFwiPC9kaXY+PC9kaXY+XCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZW50cnkuZmlsZXMuc29ydChhbHBoU29ydCk7XHJcbiAgICAgICAgZW50cnkuZmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoYXNzZXQpIHtcclxuICAgICAgICAgICAgaCArPSBcIjxkaXYgY2xhc3M9J2RyYWdnYWJsZSB0b2tlbic+PGltZyBzcmM9Jy9zdGF0aWMvaW1nL2Fzc2V0cy9cIiArIHBhdGggKyBhc3NldCArIFwiJyB3aWR0aD0nMzUnPlwiICsgYXNzZXQgKyBcIjxpIGNsYXNzPSdmYXMgZmEtY29nJz48L2k+PC9kaXY+XCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcHJvY2Vzcyhhc3NldHMsIFwiXCIpO1xyXG4gICAgbS5odG1sKGgpO1xyXG4gICAgJChcIi5kcmFnZ2FibGVcIikuZHJhZ2dhYmxlKHtcclxuICAgICAgICBoZWxwZXI6IFwiY2xvbmVcIixcclxuICAgICAgICBhcHBlbmRUbzogXCIjYm9hcmRcIlxyXG4gICAgfSk7XHJcbiAgICAkKCcuYWNjb3JkaW9uJykuZWFjaChmdW5jdGlvbiAoaWR4KSB7XHJcbiAgICAgICAgJCh0aGlzKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcyhcImFjY29yZGlvbi1hY3RpdmVcIik7XHJcbiAgICAgICAgICAgICQodGhpcykubmV4dCgpLnRvZ2dsZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJib2FyZCBpbml0XCIsIGZ1bmN0aW9uIChsb2NhdGlvbl9pbmZvOiBCb2FyZEluZm8pIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldHVwQm9hcmQobG9jYXRpb25faW5mbylcclxufSk7XHJcbnNvY2tldC5vbihcInNldCBncmlkc2l6ZVwiLCBmdW5jdGlvbiAoZ3JpZFNpemU6IG51bWJlcikge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKGdyaWRTaXplKTtcclxufSk7XHJcbnNvY2tldC5vbihcImFkZCBzaGFwZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XHJcbiAgICBnYW1lTWFuYWdlci5hZGRTaGFwZShzaGFwZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJyZW1vdmUgc2hhcGVcIiwgZnVuY3Rpb24gKHNoYXBlOiBTZXJ2ZXJTaGFwZSkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIGFuIHVua25vd24gc2hhcGVgKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgc2hhcGUgZnJvbSBhbiB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9YCk7XHJcbiAgICAgICAgcmV0dXJuIDtcclxuICAgIH1cclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XHJcbiAgICBsYXllci5yZW1vdmVTaGFwZShnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCkhLCBmYWxzZSk7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxufSk7XHJcbnNvY2tldC5vbihcIm1vdmVTaGFwZU9yZGVyXCIsIGZ1bmN0aW9uIChkYXRhOiB7IHNoYXBlOiBTZXJ2ZXJTaGFwZTsgaW5kZXg6IG51bWJlciB9KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhkYXRhLnNoYXBlLnV1aWQpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byBtb3ZlIHRoZSBzaGFwZSBvcmRlciBvZiBhbiB1bmtub3duIHNoYXBlYCk7XHJcbiAgICAgICAgcmV0dXJuIDtcclxuICAgIH1cclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgc2hhcGUgZnJvbSBhbiB1bmtub3duIGxheWVyICR7ZGF0YS5zaGFwZS5sYXllcn1gKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc2hhcGUgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSE7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIoc2hhcGUsIGRhdGEuaW5kZXgsIGZhbHNlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNoYXBlTW92ZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XHJcbiAgICBnYW1lTWFuYWdlci5tb3ZlU2hhcGUoc2hhcGUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwidXBkYXRlU2hhcGVcIiwgZnVuY3Rpb24gKGRhdGE6IHsgc2hhcGU6IFNlcnZlclNoYXBlOyByZWRyYXc6IGJvb2xlYW4gfSkge1xyXG4gICAgZ2FtZU1hbmFnZXIudXBkYXRlU2hhcGUoZGF0YSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhOiBJbml0aWF0aXZlRGF0YSkge1xyXG4gICAgaWYgKGRhdGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkIHx8ICghZGF0YS5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSAmJiAhZGF0YS52aXNpYmxlKSlcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5yZW1vdmVJbml0aWF0aXZlKGRhdGEudXVpZCwgZmFsc2UsIHRydWUpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLmFkZEluaXRpYXRpdmUoZGF0YSwgZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0SW5pdGlhdGl2ZVwiLCBmdW5jdGlvbiAoZGF0YTogSW5pdGlhdGl2ZURhdGFbXSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0SW5pdGlhdGl2ZShkYXRhKTtcclxufSk7XHJcbnNvY2tldC5vbihcImNsZWFyIHRlbXBvcmFyaWVzXCIsIGZ1bmN0aW9uIChzaGFwZXM6IFNlcnZlclNoYXBlW10pIHtcclxuICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHJlbW92ZSBhbiB1bmtub3duIHRlbXBvcmFyeSBzaGFwZVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgc2hhcGUgZnJvbSBhbiB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9YCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCkhO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhLnJlbW92ZVNoYXBlKHJlYWxfc2hhcGUsIGZhbHNlKTtcclxuICAgIH0pXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc29ja2V0OyIsImltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBnZXRNb3VzZSB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgbDJnIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuLi9zaGFwZXMvcmVjdFwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IFRvb2wgfSBmcm9tIFwiLi90b29sXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi4vc2hhcGVzL3NoYXBlXCI7XHJcbmltcG9ydCBDaXJjbGUgZnJvbSBcIi4uL3NoYXBlcy9jaXJjbGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBEcmF3VG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzdGFydFBvaW50ITogR2xvYmFsUG9pbnQ7XHJcbiAgICBzaGFwZSE6IFNoYXBlO1xyXG4gICAgZmlsbENvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGJvcmRlckNvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIHNoYXBlU2VsZWN0ID0gJChcIjxzZWxlY3Q+PG9wdGlvbiB2YWx1ZT0nc3F1YXJlJz4mI3hmMGM4Ozwvb3B0aW9uPjxvcHRpb24gdmFsdWU9J2NpcmNsZSc+JiN4ZjExMTs8L29wdGlvbj48L3NlbGVjdD5cIik7XHJcbiAgICBkZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PkZpbGw8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLmZpbGxDb2xvcilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PkJvcmRlcjwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuYm9yZGVyQ29sb3IpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5TaGFwZTwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuc2hhcGVTZWxlY3QpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuZmlsbENvbG9yLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBcInJlZFwiXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5ib3JkZXJDb2xvci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIGNvbnN0IGZpbGxDb2xvciA9IHRoaXMuZmlsbENvbG9yLnNwZWN0cnVtKFwiZ2V0XCIpO1xyXG4gICAgICAgIGNvbnN0IGZpbGwgPSBmaWxsQ29sb3IgPT09IG51bGwgPyB0aW55Y29sb3IoXCJ0cmFuc3BhcmVudFwiKSA6IGZpbGxDb2xvcjtcclxuICAgICAgICBjb25zdCBib3JkZXJDb2xvciA9IHRoaXMuYm9yZGVyQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICAgICAgY29uc3QgYm9yZGVyID0gYm9yZGVyQ29sb3IgPT09IG51bGwgPyB0aW55Y29sb3IoXCJ0cmFuc3BhcmVudFwiKSA6IGJvcmRlckNvbG9yO1xyXG4gICAgICAgIGlmICh0aGlzLnNoYXBlU2VsZWN0LnZhbCgpID09PSAnc3F1YXJlJylcclxuICAgICAgICAgICAgdGhpcy5zaGFwZSA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludC5jbG9uZSgpLCAwLCAwLCBmaWxsLnRvUmdiU3RyaW5nKCksIGJvcmRlci50b1JnYlN0cmluZygpKTtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLnNoYXBlU2VsZWN0LnZhbCgpID09PSAnY2lyY2xlJylcclxuICAgICAgICAgICAgdGhpcy5zaGFwZSA9IG5ldyBDaXJjbGUodGhpcy5zdGFydFBvaW50LmNsb25lKCksIDAsIGZpbGwudG9SZ2JTdHJpbmcoKSwgYm9yZGVyLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgICAgIHRoaXMuc2hhcGUub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGlmIChsYXllci5uYW1lID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlLnZpc2lvbk9ic3RydWN0aW9uID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMuc2hhcGUudXVpZCk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5zaGFwZSwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zaGFwZVNlbGVjdC52YWwoKSA9PT0gJ3NxdWFyZScpIHtcclxuICAgICAgICAgICAgKDxSZWN0PnRoaXMuc2hhcGUpLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgICAgICAoPFJlY3Q+dGhpcy5zaGFwZSkuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGUucmVmUG9pbnQueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZS5yZWZQb2ludC55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zaGFwZVNlbGVjdC52YWwoKSA9PT0gJ2NpcmNsZScpIHtcclxuICAgICAgICAgICAgKDxDaXJjbGU+dGhpcy5zaGFwZSkuciA9IGVuZFBvaW50LnN1YnRyYWN0KHRoaXMuc3RhcnRQb2ludCkubGVuZ3RoKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMuc2hhcGUhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlIH0pO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgUmVjdCBmcm9tIFwiLi4vc2hhcGVzL3JlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBnZXRNb3VzZSB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHJlY3QhOiBSZWN0O1xyXG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5SZXZlYWw8L2Rpdj48bGFiZWwgY2xhc3M9J3N3aXRjaCc+PGlucHV0IHR5cGU9J2NoZWNrYm94JyBpZD0nZm93LXJldmVhbCc+PHNwYW4gY2xhc3M9J3NsaWRlciByb3VuZCc+PC9zcGFuPjwvbGFiZWw+XCIpKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQuY2xvbmUoKSwgMCwgMCwgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgdHJ1ZSwgZmFsc2UpO1xyXG5cclxuICAgICAgICBpZiAoJChcIiNmb3ctcmV2ZWFsXCIpLnByb3AoXCJjaGVja2VkXCIpKVxyXG4gICAgICAgICAgICB0aGlzLnJlY3QuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdXRcIjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgICAgICB0aGlzLnJlY3QudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIHRoaXMucmVjdC5yZWZQb2ludC54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdC5yZWZQb2ludC55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG5cclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiB0aGlzLnJlY3QuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBJbml0aWF0aXZlRGF0YSB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYXRpdmVUcmFja2VyIHtcclxuICAgIGRhdGE6IEluaXRpYXRpdmVEYXRhW10gPSBbXTtcclxuICAgIGFkZEluaXRpYXRpdmUoZGF0YTogSW5pdGlhdGl2ZURhdGEsIHN5bmM6IGJvb2xlYW4pIHtcclxuICAgICAgICAvLyBPcGVuIHRoZSBpbml0aWF0aXZlIHRyYWNrZXIgaWYgaXQgaXMgbm90IGN1cnJlbnRseSBvcGVuLlxyXG4gICAgICAgIGlmICh0aGlzLmRhdGEubGVuZ3RoID09PSAwIHx8ICFnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImlzT3BlblwiKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgICAgIC8vIElmIG5vIGluaXRpYXRpdmUgZ2l2ZW4sIGFzc3VtZSBpdCAwXHJcbiAgICAgICAgaWYgKGRhdGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBkYXRhLmluaXRpYXRpdmUgPSAwO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBzaGFwZSBpcyBhbHJlYWR5IGJlaW5nIHRyYWNrZWRcclxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSBkYXRhLnV1aWQpO1xyXG4gICAgICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhpc3RpbmcsIGRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3luYylcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGRhdGEpO1xyXG4gICAgfTtcclxuICAgIHJlbW92ZUluaXRpYXRpdmUodXVpZDogc3RyaW5nLCBzeW5jOiBib29sZWFuLCBza2lwR3JvdXBDaGVjazogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IGQgPSB0aGlzLmRhdGEuZmluZEluZGV4KGQgPT4gZC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICBpZiAoZCA+PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICghc2tpcEdyb3VwQ2hlY2sgJiYgdGhpcy5kYXRhW2RdLmdyb3VwKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zcGxpY2UoZCwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgICAgIGlmIChzeW5jKVxyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIHsgdXVpZDogdXVpZCB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgJiYgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiY2xvc2VcIik7XHJcbiAgICB9O1xyXG4gICAgcmVkcmF3KCkge1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgaWYgKGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgaWYgKGIuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIHJldHVybiBiLmluaXRpYXRpdmUgLSBhLmluaXRpYXRpdmU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5vd25lcnMgPT09IHVuZGVmaW5lZCkgZGF0YS5vd25lcnMgPSBbXTtcclxuICAgICAgICAgICAgY29uc3QgaW1nID0gZGF0YS5zcmMgPT09IHVuZGVmaW5lZCA/ICcnIDogJChgPGltZyBzcmM9XCIke2RhdGEuc3JjfVwiIHdpZHRoPVwiMzBweFwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPmApO1xyXG4gICAgICAgICAgICAvLyBjb25zdCBuYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHtzaC51dWlkfVwiIHZhbHVlPVwiJHtzaC5uYW1lfVwiIGRpc2FibGVkPSdkaXNhYmxlZCcgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cInZhbHVlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCIgdmFsdWU9XCIke2RhdGEuaW5pdGlhdGl2ZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiB2YWx1ZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCB2aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS11c2Vyc1wiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gJChgPGRpdiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiByZW1vdmVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgICAgICB2aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS52aXNpYmxlID8gXCIxLjBcIiA6IFwiMC4zXCIpO1xyXG4gICAgICAgICAgICBncm91cC5jc3MoXCJvcGFjaXR5XCIsIGRhdGEuZ3JvdXAgPyBcIjEuMFwiIDogXCIwLjNcIik7XHJcbiAgICAgICAgICAgIGlmICghZGF0YS5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSkge1xyXG4gICAgICAgICAgICAgICAgdmFsLnByb3AoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlLmNzcyhcIm9wYWNpdHlcIiwgXCIwLjNcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuYXBwZW5kKGltZykuYXBwZW5kKHZhbCkuYXBwZW5kKHZpc2libGUpLmFwcGVuZChncm91cCkuYXBwZW5kKHJlbW92ZSk7XHJcblxyXG4gICAgICAgICAgICB2YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIGNoYW5nZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGQuaW5pdGlhdGl2ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSkgfHwgMDtcclxuICAgICAgICAgICAgICAgIHNlbGYuYWRkSW5pdGlhdGl2ZShkLCB0cnVlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSkhO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyB2aXNpYmxlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGQudmlzaWJsZSA9ICFkLnZpc2libGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZC52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGdyb3VwLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIGdyb3VwIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGQuZ3JvdXAgPSAhZC5ncm91cDtcclxuICAgICAgICAgICAgICAgIGlmIChkLmdyb3VwKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIHJlbW92ZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUluaXRpYXRpdmUodXVpZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufSIsImltcG9ydCB7IFRvb2wgfSBmcm9tIFwiLi90b29sXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4uL3NoYXBlcy9yZWN0XCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBnZXRNb3VzZSB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuLi9zaGFwZXMvYmFzZXJlY3RcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNYXBUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHJlY3QhOiBSZWN0O1xyXG4gICAgeENvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgeUNvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueENvdW50KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1k8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnlDb3VudClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQsIDAsIDAsIFwicmdiYSgwLDAsMCwwKVwiLCBcImJsYWNrXCIpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QhLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3ID0gdGhpcy5yZWN0Lnc7XHJcbiAgICAgICAgY29uc3QgaCA9IHRoaXMucmVjdC5oO1xyXG4gICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLnNlbGVjdGlvblswXTtcclxuXHJcbiAgICAgICAgaWYgKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSB7XHJcbiAgICAgICAgICAgIHNlbC53ICo9IHBhcnNlSW50KDxzdHJpbmc+dGhpcy54Q291bnQudmFsKCkpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplIC8gdztcclxuICAgICAgICAgICAgc2VsLmggKj0gcGFyc2VJbnQoPHN0cmluZz50aGlzLnlDb3VudC52YWwoKSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemUgLyBoO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVwZGF0ZWQgc2VsZWN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5yZWN0LCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IHsgTG9jYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUGFuVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgcGFuU3RhcnQgPSBuZXcgTG9jYWxQb2ludCgwLCAwKTtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucGFuU3RhcnQgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGwyZyhtb3VzZS5zdWJ0cmFjdCh0aGlzLnBhblN0YXJ0KSkuZGlyZWN0aW9uO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YICs9IE1hdGgucm91bmQoZGlzdGFuY2UueCk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgKz0gTWF0aC5yb3VuZChkaXN0YW5jZS55KTtcclxuICAgICAgICB0aGlzLnBhblN0YXJ0ID0gbW91c2U7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgIH07XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7XHJcbiAgICAgICAgICAgIGxvY2F0aW9uT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXToge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhblg6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhblk6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHsgfTtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgbDJnIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IFRvb2wgfSBmcm9tIFwiLi90b29sXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IExpbmUgZnJvbSBcIi4uL3NoYXBlcy9saW5lXCI7XHJcbmltcG9ydCBUZXh0IGZyb20gXCIuLi9zaGFwZXMvdGV4dFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJ1bGVyVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzdGFydFBvaW50ITogR2xvYmFsUG9pbnQ7XHJcbiAgICBydWxlciE6IExpbmU7XHJcbiAgICB0ZXh0ITogVGV4dDtcclxuXHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5ydWxlciA9IG5ldyBMaW5lKHRoaXMuc3RhcnRQb2ludCwgdGhpcy5zdGFydFBvaW50KTtcclxuICAgICAgICB0aGlzLnRleHQgPSBuZXcgVGV4dCh0aGlzLnN0YXJ0UG9pbnQuY2xvbmUoKSwgXCJcIiwgXCJib2xkIDIwcHggc2VyaWZcIik7XHJcbiAgICAgICAgdGhpcy5ydWxlci5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgdGhpcy50ZXh0Lm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJ1bGVyLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnRleHQsIHRydWUsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gZHJhdyBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucnVsZXIuZW5kUG9pbnQgPSBlbmRQb2ludDtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiB0aGlzLnJ1bGVyIS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBkaWZmc2lnbiA9IE1hdGguc2lnbihlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpICogTWF0aC5zaWduKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgY29uc3QgeGRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIGNvbnN0IHlkaWZmID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICBjb25zdCBsYWJlbCA9IE1hdGgucm91bmQoTWF0aC5zcXJ0KCh4ZGlmZikgKiogMiArICh5ZGlmZikgKiogMikgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemUpICsgXCIgZnRcIjtcclxuICAgICAgICBsZXQgYW5nbGUgPSBNYXRoLmF0YW4yKGRpZmZzaWduICogeWRpZmYsIHhkaWZmKTtcclxuICAgICAgICBjb25zdCB4bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpICsgeGRpZmYgLyAyO1xyXG4gICAgICAgIGNvbnN0IHltaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSkgKyB5ZGlmZiAvIDI7XHJcbiAgICAgICAgdGhpcy50ZXh0LnJlZlBvaW50LnggPSB4bWlkO1xyXG4gICAgICAgIHRoaXMudGV4dC5yZWZQb2ludC55ID0geW1pZDtcclxuICAgICAgICB0aGlzLnRleHQudGV4dCA9IGxhYmVsO1xyXG4gICAgICAgIHRoaXMudGV4dC5hbmdsZSA9IGFuZ2xlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMudGV4dC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFNlbGVjdE9wZXJhdGlvbnMsIGNhbGN1bGF0ZURlbHRhIH0gZnJvbSBcIi4vdG9vbHNcIjtcclxuaW1wb3J0IHsgVmVjdG9yLCBMb2NhbFBvaW50LCBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuLi9zaGFwZXMvcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgbDJnLCBnMmwsIGcybHgsIGcybHksIGwyZ3ksIGwyZ3ggfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCBCYXNlUmVjdCBmcm9tIFwiLi4vc2hhcGVzL2Jhc2VyZWN0XCI7XHJcbmltcG9ydCB7IFRvb2wgfSBmcm9tIFwiLi90b29sXCI7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdFRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIG1vZGU6IFNlbGVjdE9wZXJhdGlvbnMgPSBTZWxlY3RPcGVyYXRpb25zLk5vb3A7XHJcbiAgICByZXNpemVkaXI6IHN0cmluZyA9IFwiXCI7XHJcbiAgICAvLyBCZWNhdXNlIHdlIG5ldmVyIGRyYWcgZnJvbSB0aGUgYXNzZXQncyAoMCwgMCkgY29vcmQgYW5kIHdhbnQgYSBzbW9vdGhlciBkcmFnIGV4cGVyaWVuY2VcclxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cclxuICAgIGRyYWc6IFZlY3RvcjxMb2NhbFBvaW50PiA9IG5ldyBWZWN0b3I8TG9jYWxQb2ludD4oeyB4OiAwLCB5OiAwIH0sIG5ldyBMb2NhbFBvaW50KDAsIDApKTtcclxuICAgIHNlbGVjdGlvblN0YXJ0UG9pbnQ6IEdsb2JhbFBvaW50ID0gbmV3IEdsb2JhbFBvaW50KC0xMDAwLCAtMTAwMCk7XHJcbiAgICBzZWxlY3Rpb25IZWxwZXI6IFJlY3QgPSBuZXcgUmVjdCh0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQsIDAsIDApO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcblxyXG4gICAgICAgIGxldCBoaXQgPSBmYWxzZTtcclxuICAgICAgICAvLyB0aGUgc2VsZWN0aW9uU3RhY2sgYWxsb3dzIGZvciBsb3dlciBwb3NpdGlvbmVkIG9iamVjdHMgdGhhdCBhcmUgc2VsZWN0ZWQgdG8gaGF2ZSBwcmVjZWRlbmNlIGR1cmluZyBvdmVybGFwLlxyXG4gICAgICAgIGxldCBzZWxlY3Rpb25TdGFjaztcclxuICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2VsZWN0aW9uU3RhY2sgPSBsYXllci5zaGFwZXMuY29uY2F0KGxheWVyLnNlbGVjdGlvbik7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHNlbGVjdGlvblN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYXBlID0gc2VsZWN0aW9uU3RhY2tbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IGNvcm4gPSBzaGFwZS5nZXRDb3JuZXIobDJnKG1vdXNlKSk7XHJcbiAgICAgICAgICAgIGlmIChjb3JuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtzaGFwZV07XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZWRpciA9IGNvcm47XHJcbiAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLmNvbnRhaW5zKGwyZyhtb3VzZSkpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBzaGFwZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24uaW5kZXhPZihzZWwpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtzZWxdO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnID0gbW91c2Uuc3VidHJhY3QoZzJsKHNlbC5yZWZQb2ludCkpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmFnLm9yaWdpbiA9IGcybChzZWwucmVmUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmFnLmRpcmVjdGlvbiA9IG1vdXNlLnN1YnRyYWN0KHRoaXMuZHJhZy5vcmlnaW4pO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFoaXQpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgc2VsLm9uU2VsZWN0aW9uTG9zcygpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIucmVmUG9pbnQgPSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLncgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5oID0gMDtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3RoaXMuc2VsZWN0aW9uSGVscGVyXTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0KSB7XHJcbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSB0aGlzXHJcbiAgICAgICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKG1vdXNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC55KTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIucmVmUG9pbnQgPSBuZXcgR2xvYmFsUG9pbnQoXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCksXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2cgPSBnMmwobGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS5yZWZQb2ludCk7XHJcbiAgICAgICAgICAgIGxldCBkZWx0YSA9IGwyZyhtb3VzZS5zdWJ0cmFjdChvZy5hZGQodGhpcy5kcmFnKSkpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkRyYWcpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGFyZSBvbiB0aGUgdG9rZW5zIGxheWVyIGRvIGEgbW92ZW1lbnQgYmxvY2sgY2hlY2suXHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIubmFtZSA9PT0gJ3Rva2VucycpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyLnNlbGVjdGlvbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBsYXllci5zZWxlY3Rpb25baV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWwudXVpZCA9PT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIudXVpZCkgY29udGludWU7IC8vIHRoZSBzZWxlY3Rpb24gaGVscGVyIHNob3VsZCBub3QgYmUgdHJlYXRlZCBhcyBhIHJlYWwgc2hhcGUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhID0gY2FsY3VsYXRlRGVsdGEoZGVsdGEsIHNlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQWN0dWFsbHkgYXBwbHkgdGhlIGRlbHRhIG9uIGFsbCBzaGFwZXNcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludCA9IHNlbC5yZWZQb2ludC5hZGQoZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSkgcmV0dXJuOyAvLyBUT0RPXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVGhpcyBoYXMgdG8gYmUgc2hhcGUgc3BlY2lmaWNcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNpemVkaXIgPT09ICdudycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBnMmx4KHNlbC5yZWZQb2ludC54KSArIHNlbC53ICogeiAtIG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gZzJseShzZWwucmVmUG9pbnQueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQgPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5yZXNpemVkaXIgPT09ICduZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBtb3VzZS54IC0gZzJseChzZWwucmVmUG9pbnQueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gZzJseShzZWwucmVmUG9pbnQueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSA9IGwyZ3kobW91c2UueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ3NlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IG1vdXNlLnggLSBnMmx4KHNlbC5yZWZQb2ludC54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gZzJseShzZWwucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ3N3Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IGcybHgoc2VsLnJlZlBvaW50LngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gZzJseShzZWwucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ID0gbDJneChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgLz0gejtcclxuICAgICAgICAgICAgICAgICAgICBzZWwuaCAvPSB6O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSkgcmV0dXJuOyAvLyBUT0RPXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ20gPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwuaW5Db3JuZXIoZ20sIFwibndcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm53LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKGdtLCBcIm5lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJuZS1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihnbSwgXCJzZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic2UtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIoZ20sIFwic3dcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInN3LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdCkge1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgbGF5ZXIuc2hhcGVzLmZvckVhY2goKHNoYXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUgPT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gc2hhcGUuZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnggPD0gYmJveC5yZWZQb2ludC54ICsgYmJveC53ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnggKyB0aGlzLnNlbGVjdGlvbkhlbHBlciEudyA+PSBiYm94LnJlZlBvaW50LnggJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEucmVmUG9pbnQueSA8PSBiYm94LnJlZlBvaW50LnkgKyBiYm94LmggJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEucmVmUG9pbnQueSArIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5oID49IGJib3gucmVmUG9pbnQueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5wdXNoKHNoYXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXNoIHRoZSBzZWxlY3Rpb24gaGVscGVyIGFzIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIHNlbGVjdGlvblxyXG4gICAgICAgICAgICAvLyBUaGlzIG1ha2VzIHN1cmUgdGhhdCBpdCB3aWxsIGJlIHRoZSBmaXJzdCBvbmUgdG8gYmUgaGl0IGluIHRoZSBoaXQgZGV0ZWN0aW9uIG9uTW91c2VEb3duXHJcbiAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5wdXNoKHRoaXMuc2VsZWN0aW9uSGVscGVyKTtcclxuXHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKChzZWwpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuRHJhZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRyYWcub3JpZ2luIS54ID09PSBnMmx4KHNlbC5yZWZQb2ludC54KSAmJiB0aGlzLmRyYWcub3JpZ2luIS55ID09PSBnMmx5KHNlbC5yZWZQb2ludC55KSkgeyByZXR1cm4gfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgoc2VsIGluc3RhbmNlb2YgQmFzZVJlY3QpICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW91c2UgPSBzZWwuY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXkgPSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHNlbC53IC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnggPSBNYXRoLnJvdW5kKG14IC8gZ3MpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueCA9IChNYXRoLnJvdW5kKChteCArIChncyAvIDIpKSAvIGdzKSAtICgxIC8gMikpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChzZWwuaCAvIGdzKSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC55ID0gTWF0aC5yb3VuZChteSAvIGdzKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnkgPSAoTWF0aC5yb3VuZCgobXkgKyAoZ3MgLyAyKSkgLyBncykgLSAoMSAvIDIpKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwudyA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnggKz0gc2VsLnc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gTWF0aC5hYnMoc2VsLncpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLmggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC55ICs9IHNlbC5oO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IE1hdGguYWJzKHNlbC5oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnggPSBNYXRoLnJvdW5kKHNlbC5yZWZQb2ludC54IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC55ID0gTWF0aC5yb3VuZChzZWwucmVmUG9pbnQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IE1hdGgubWF4KE1hdGgucm91bmQoc2VsLncgLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IE1hdGgubWF4KE1hdGgucm91bmQoc2VsLmggLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5Ob29wXHJcbiAgICB9O1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgY29uc3QgbXggPSBtb3VzZS54O1xyXG4gICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgbGF5ZXIuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGlmICghaGl0ICYmIHNoYXBlLmNvbnRhaW5zKGwyZyhtb3VzZSkpKSB7XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5zaG93Q29udGV4dE1lbnUobW91c2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59IiwiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRvb2wge1xyXG4gICAgZGV0YWlsRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGFic3RyYWN0IG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHsgfTtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBTZWxlY3RUb29sIH0gZnJvbSBcIi4vc2VsZWN0XCI7XHJcbmltcG9ydCB7IFBhblRvb2wgfSBmcm9tIFwiLi9wYW5cIjtcclxuaW1wb3J0IHsgRHJhd1Rvb2wgfSBmcm9tIFwiLi9kcmF3XCI7XHJcbmltcG9ydCB7IFJ1bGVyVG9vbCB9IGZyb20gXCIuL3J1bGVyXCI7XHJcbmltcG9ydCB7IEZPV1Rvb2wgfSBmcm9tIFwiLi9mb3dcIjtcclxuaW1wb3J0IHsgTWFwVG9vbCB9IGZyb20gXCIuL21hcFwiO1xyXG5pbXBvcnQgeyBWZWN0b3IsIEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuLi9zaGFwZXMvc2hhcGVcIjtcclxuXHJcbmV4cG9ydCBlbnVtIFNlbGVjdE9wZXJhdGlvbnMge1xyXG4gICAgTm9vcCxcclxuICAgIFJlc2l6ZSxcclxuICAgIERyYWcsXHJcbiAgICBHcm91cFNlbGVjdCxcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwVG9vbHMoKTogdm9pZCB7XHJcbiAgICBjb25zdCB0b29sc2VsZWN0RGl2ID0gJChcIiN0b29sc2VsZWN0XCIpLmZpbmQoXCJ1bFwiKTtcclxuICAgIHRvb2xzLmZvckVhY2goZnVuY3Rpb24gKHRvb2wpIHtcclxuICAgICAgICBpZiAoIXRvb2wucGxheWVyVG9vbCAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgdG9vbEluc3RhbmNlID0gbmV3IHRvb2wuY2x6KCk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIudG9vbHMuc2V0KHRvb2wubmFtZSwgdG9vbEluc3RhbmNlKTtcclxuICAgICAgICBjb25zdCBleHRyYSA9IHRvb2wuZGVmYXVsdFNlbGVjdCA/IFwiIGNsYXNzPSd0b29sLXNlbGVjdGVkJ1wiIDogXCJcIjtcclxuICAgICAgICBjb25zdCB0b29sTGkgPSAkKFwiPGxpIGlkPSd0b29sLVwiICsgdG9vbC5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgdG9vbC5uYW1lICsgXCI8L2E+PC9saT5cIik7XHJcbiAgICAgICAgdG9vbHNlbGVjdERpdi5hcHBlbmQodG9vbExpKTtcclxuICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgY29uc3QgZGl2ID0gdG9vbEluc3RhbmNlLmRldGFpbERpdiE7XHJcbiAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuYXBwZW5kKGRpdik7XHJcbiAgICAgICAgICAgIGRpdi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvb2xMaS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0b29scy5pbmRleE9mKHRvb2wpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkge1xyXG4gICAgICAgICAgICAgICAgJCgnLnRvb2wtc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwidG9vbC1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gJCgnI3Rvb2xkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgIGlmICh0b29sLmhhc0RldGFpbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuY2hpbGRyZW4oKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbEluc3RhbmNlLmRldGFpbERpdiEuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbC5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbC5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICAgIHsgbmFtZTogXCJzZWxlY3RcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogdHJ1ZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBTZWxlY3RUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwicGFuXCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IGZhbHNlLCBjbHo6IFBhblRvb2wgfSxcclxuICAgIHsgbmFtZTogXCJkcmF3XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogRHJhd1Rvb2wgfSxcclxuICAgIHsgbmFtZTogXCJydWxlclwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBSdWxlclRvb2wgfSxcclxuICAgIHsgbmFtZTogXCJmb3dcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogRk9XVG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcIm1hcFwiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBNYXBUb29sIH0sXHJcbl07XHJcblxyXG5cclxuLy8gRmlyc3QgZ28gdGhyb3VnaCBlYWNoIHNoYXBlIGluIHRoZSBzZWxlY3Rpb24gYW5kIHNlZSBpZiB0aGUgZGVsdGEgaGFzIHRvIGJlIHRydW5jYXRlZCBkdWUgdG8gbW92ZW1lbnQgYmxvY2tlcnNcclxuXHJcbi8vIFRoaXMgaXMgZGVmaW5pdGVseSBzdXBlciBjb252b2x1dGVkIGFuZCBpbmVmZmljaWVudCBidXQgSSB3YXMgdGlyZWQgYW5kIHJlYWxseSB3YW50ZWQgdGhlIHNtb290aCB3YWxsIHNsaWRpbmcgY29sbGlzaW9uIHN0dWZmIHRvIHdvcmtcclxuLy8gQW5kIGl0IGRvZXMgbm93LCBzbyBoZXkgwq9cXF8o44OEKV8vwq9cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZURlbHRhKGRlbHRhOiBWZWN0b3I8R2xvYmFsUG9pbnQ+LCBzZWw6IFNoYXBlLCBkb25lPzogc3RyaW5nW10pIHtcclxuICAgIGlmIChkb25lID09PSB1bmRlZmluZWQpIGRvbmUgPSBbXTtcclxuICAgIGNvbnN0IG9nU2VsQkJveCA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgY29uc3QgbmV3U2VsQkJveCA9IG9nU2VsQkJveC5vZmZzZXQoZGVsdGEpO1xyXG4gICAgbGV0IHJlZmluZSA9IGZhbHNlO1xyXG4gICAgZm9yIChsZXQgbWIgPSAwOyBtYiA8IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMubGVuZ3RoOyBtYisrKSB7XHJcbiAgICAgICAgaWYgKGRvbmUuaW5jbHVkZXMoZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vyc1ttYl0pKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICBjb25zdCBibG9ja2VyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnNbbWJdKSE7XHJcbiAgICAgICAgY29uc3QgYmxvY2tlckJCb3ggPSBibG9ja2VyLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGJvdW5kaW5nIGJveCBvZiBvdXIgZGVzdGluYXRpb24gd291bGQgaW50ZXJzZWN0IHdpdGggdGhlIGJvdW5kaW5nIGJveCBvZiB0aGUgbW92ZW1lbnRibG9ja2VyXHJcbiAgICAgICAgaWYgKGJsb2NrZXJCQm94LmludGVyc2VjdHNXaXRoKG5ld1NlbEJCb3gpIHx8IGJsb2NrZXJCQm94LmdldEludGVyc2VjdFdpdGhMaW5lKHsgc3RhcnQ6IG9nU2VsQkJveC5yZWZQb2ludC5hZGQoZGVsdGEubm9ybWFsaXplKCkpLCBlbmQ6IG5ld1NlbEJCb3gucmVmUG9pbnQgfSkuaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJDZW50ZXIgPSBibG9ja2VyQkJveC5jZW50ZXIoKTtcclxuICAgICAgICAgICAgY29uc3Qgc0NlbnRlciA9IG9nU2VsQkJveC5jZW50ZXIoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBzQ2VudGVyLnN1YnRyYWN0KGJDZW50ZXIpO1xyXG4gICAgICAgICAgICBjb25zdCB1eCA9IG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHsgeDogMSwgeTogMCB9KTtcclxuICAgICAgICAgICAgY29uc3QgdXkgPSBuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7IHg6IDAsIHk6IDEgfSk7XHJcbiAgICAgICAgICAgIGxldCBkeCA9IGQuZG90KHV4KTtcclxuICAgICAgICAgICAgbGV0IGR5ID0gZC5kb3QodXkpO1xyXG4gICAgICAgICAgICBpZiAoZHggPiBibG9ja2VyQkJveC53IC8gMikgZHggPSBibG9ja2VyQkJveC53IC8gMjtcclxuICAgICAgICAgICAgaWYgKGR4IDwgLWJsb2NrZXJCQm94LncgLyAyKSBkeCA9IC1ibG9ja2VyQkJveC53IC8gMjtcclxuICAgICAgICAgICAgaWYgKGR5ID4gYmxvY2tlckJCb3guaCAvIDIpIGR5ID0gYmxvY2tlckJCb3guaCAvIDI7XHJcbiAgICAgICAgICAgIGlmIChkeSA8IC1ibG9ja2VyQkJveC5oIC8gMikgZHkgPSAtYmxvY2tlckJCb3guaCAvIDI7XHJcblxyXG4gICAgICAgICAgICAvLyBDbG9zZXN0IHBvaW50IC8gaW50ZXJzZWN0aW9uIHBvaW50IGJldHdlZW4gdGhlIHR3byBiYm94ZXMuICBOb3QgdGhlIGRlbHRhIGludGVyc2VjdCFcclxuICAgICAgICAgICAgY29uc3QgcCA9IGJDZW50ZXIuYWRkKHV4Lm11bHRpcGx5KGR4KSkuYWRkKHV5Lm11bHRpcGx5KGR5KSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocC54ID09PSBvZ1NlbEJCb3gucmVmUG9pbnQueCB8fCBwLnggPT09IG9nU2VsQkJveC5yZWZQb2ludC54ICsgb2dTZWxCQm94LncpXHJcbiAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueCA9IDA7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHAueSA9PT0gb2dTZWxCQm94LnJlZlBvaW50LnkgfHwgcC55ID09PSBvZ1NlbEJCb3gucmVmUG9pbnQueSArIG9nU2VsQkJveC5oKVxyXG4gICAgICAgICAgICAgICAgZGVsdGEuZGlyZWN0aW9uLnkgPSAwO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChwLnggPCBvZ1NlbEJCb3gucmVmUG9pbnQueClcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueCA9IHAueCAtIG9nU2VsQkJveC5yZWZQb2ludC54O1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocC54ID4gb2dTZWxCQm94LnJlZlBvaW50LnggKyBvZ1NlbEJCb3gudylcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueCA9IHAueCAtIChvZ1NlbEJCb3gucmVmUG9pbnQueCArIG9nU2VsQkJveC53KTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHAueSA8IG9nU2VsQkJveC5yZWZQb2ludC55KVxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhLmRpcmVjdGlvbi55ID0gcC55IC0gb2dTZWxCQm94LnJlZlBvaW50Lnk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwLnkgPiBvZ1NlbEJCb3gucmVmUG9pbnQueSArIG9nU2VsQkJveC5oKVxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhLmRpcmVjdGlvbi55ID0gcC55IC0gKG9nU2VsQkJveC5yZWZQb2ludC55ICsgb2dTZWxCQm94LmgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlZmluZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGRvbmUucHVzaChnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzW21iXSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChyZWZpbmUpXHJcbiAgICAgICAgZGVsdGEgPSBjYWxjdWxhdGVEZWx0YShkZWx0YSwgc2VsLCBkb25lKTtcclxuICAgIHJldHVybiBkZWx0YTtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50LCBWZWN0b3IgfSBmcm9tIFwiLi9nZW9tXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJsKG9iajogR2xvYmFsUG9pbnQpOiBMb2NhbFBvaW50IHtcclxuICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIHJldHVybiBuZXcgTG9jYWxQb2ludCgob2JqLnggKyBwYW5YKSAqIHosIChvYmoueSArIHBhblkpICogeik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybChuZXcgR2xvYmFsUG9pbnQoeCwgMCkpLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx5KHk6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybChuZXcgR2xvYmFsUG9pbnQoMCwgeSkpLnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx6KHo6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHogKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXREaXN0YW5jZShyOiBudW1iZXIpIHtcclxuICAgIHJldHVybiAociAvIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51bml0U2l6ZSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmxyKHI6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybHooZ2V0VW5pdERpc3RhbmNlKHIpKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogTG9jYWxQb2ludCk6IEdsb2JhbFBvaW50O1xyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogVmVjdG9yPExvY2FsUG9pbnQ+KTogVmVjdG9yPEdsb2JhbFBvaW50PjtcclxuZXhwb3J0IGZ1bmN0aW9uIGwyZyhvYmo6IExvY2FsUG9pbnR8VmVjdG9yPExvY2FsUG9pbnQ+KTogR2xvYmFsUG9pbnR8VmVjdG9yPEdsb2JhbFBvaW50PiB7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgcGFuWCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YO1xyXG4gICAgICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIGlmIChvYmogaW5zdGFuY2VvZiBMb2NhbFBvaW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBHbG9iYWxQb2ludCgob2JqLnggLyB6KSAtIHBhblgsIChvYmoueSAvIHopIC0gcGFuWSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7eDogb2JqLmRpcmVjdGlvbi54IC8geiwgeTogb2JqLmRpcmVjdGlvbi55IC8gen0sIG9iai5vcmlnaW4gPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGwyZyhvYmoub3JpZ2luKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMmd4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGwyZyhuZXcgTG9jYWxQb2ludCh4LCAwKSkueDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyZ3koeTogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbDJnKG5ldyBMb2NhbFBvaW50KDAsIHkpKS55O1xyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlcy9zaGFwZVwiO1xyXG5pbXBvcnQgeyBMb2NhbFBvaW50IH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vdXNlKGU6IE1vdXNlRXZlbnQpOiBMb2NhbFBvaW50IHtcclxuICAgIHJldHVybiBuZXcgTG9jYWxQb2ludChlLnBhZ2VYLCBlLnBhZ2VZKTtcclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWxwaFNvcnQoYTogc3RyaW5nLCBiOiBzdHJpbmcpIHtcclxuICAgIGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiAxO1xyXG59XHJcblxyXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XHJcbmV4cG9ydCBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT3JkZXJlZE1hcDxLLCBWPiB7XHJcbiAgICBrZXlzOiBLW10gPSBbXTtcclxuICAgIHZhbHVlczogVltdID0gW107XHJcbiAgICBnZXQoa2V5OiBLKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW3RoaXMua2V5cy5pbmRleE9mKGtleSldO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5kZXhWYWx1ZShpZHg6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpZHhdO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5kZXhLZXkoaWR4OiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlzW2lkeF07XHJcbiAgICB9XHJcbiAgICBzZXQoa2V5OiBLLCB2YWx1ZTogVikge1xyXG4gICAgICAgIHRoaXMua2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMucHVzaCh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBpbmRleE9mKGVsZW1lbnQ6IEspIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlzLmluZGV4T2YoZWxlbWVudCk7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoZWxlbWVudDogSykge1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuaW5kZXhPZihlbGVtZW50KTtcclxuICAgICAgICB0aGlzLmtleXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICB9XHJcbn0iXSwic291cmNlUm9vdCI6IiJ9