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
    reverse() {
        return new Vector({ x: -this.direction.x, y: -this.direction.y }, this.origin);
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
/* harmony import */ var _shapes_baserect__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./shapes/baserect */ "./ts_src/shapes/baserect.ts");
/* harmony import */ var _shapes_circle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shapes/circle */ "./ts_src/shapes/circle.ts");
/* harmony import */ var _shapes_utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./shapes/utils */ "./ts_src/shapes/utils.ts");







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
        if (sync)
            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("add shape", { shape: shape.asDict(), temporary: temporary });
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.set(shape.uuid, shape);
        this.invalidate(!sync);
    }
    setShapes(shapes) {
        const t = [];
        const self = this;
        shapes.forEach(function (shape) {
            const sh = Object(_shapes_utils__WEBPACK_IMPORTED_MODULE_6__["createShapeFromDict"])(shape);
            if (sh === undefined) {
                console.log(`Shape with unknown type ${shape.type} could not be added`);
                return;
            }
            sh.layer = self.name;
            sh.checkLightSources();
            sh.setMovementBlock(shape.movementObstruction);
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
        if (ls_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightsources.splice(ls_i, 1);
        if (lb_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].lightblockers.splice(lb_i, 1);
        if (mb_i >= 0)
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].movementblockers.splice(mb_i, 1);
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
                    if (!(sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_4__["default"]))
                        return;
                    // TODO: REFACTOR THIS TO Shape.drawSelection(ctx);
                    ctx.strokeRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y), sel.w * z, sel.h * z);
                    // topright
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y - 3), 6 * z, 6 * z);
                    // topleft
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y - 3), 6 * z, 6 * z);
                    // botright
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y + sel.h - 3), 6 * z, 6 * z);
                    // botleft
                    ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y + sel.h - 3), 6 * z, 6 * z);
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
                const bbox = new _shapes_circle__WEBPACK_IMPORTED_MODULE_5__["default"](center, aura_length).getBoundingBox();
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
                        extraX = (shape_hit.w / 4) * Math.cos(angle);
                        extraY = (shape_hit.h / 4) * Math.sin(angle);
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
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./tools */ "./ts_src/tools.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");








class GameManager {
    constructor() {
        this.IS_DM = false;
        this.board_initialised = false;
        this.layerManager = new _layers__WEBPACK_IMPORTED_MODULE_2__["LayerManager"]();
        this.selectedTool = 0;
        this.tools = new _utils__WEBPACK_IMPORTED_MODULE_3__["OrderedMap"]();
        this.lightsources = [];
        this.lightblockers = [];
        this.movementblockers = [];
        this.gridColour = $("#gridColour");
        this.fowColour = $("#fowColour");
        this.initiativeTracker = new _tools__WEBPACK_IMPORTED_MODULE_6__["InitiativeTracker"]();
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
                        const loc = new _geom__WEBPACK_IMPORTED_MODULE_7__["LocalPoint"](ui.offset.left - offset.left, ui.offset.top - offset.top);
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
                    if (this.layerManager.getGridLayer() !== undefined)
                        this.layerManager.getGridLayer().invalidate(false);
                }
            }
        }
    }
}
let gameManager = new GameManager();
window.gameManager = gameManager;
window.GP = _geom__WEBPACK_IMPORTED_MODULE_7__["GlobalPoint"];
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
            src: "",
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
    intersectsWith(other) {
        return !(other.refPoint.x >= this.refPoint.x + this.w ||
            other.refPoint.x + other.w <= this.refPoint.x ||
            other.refPoint.y >= this.refPoint.y + this.h ||
            other.refPoint.y + other.h <= this.refPoint.y);
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
        }
    });
    const dialog_moveblock = $("#shapeselectiondialog-moveblocker");
    dialog_moveblock.prop("checked", self.movementObstruction);
    dialog_moveblock.on("click", function () {
        const uuid = $("#shapeselectiondialog-uuid").val();
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.has(uuid)) {
            const s = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.UUIDMap.get(uuid);
            s.setMovementBlock(dialog_moveblock.prop("checked"));
        }
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
            endPointX: this.endPoint.x,
            endPointY: this.endPoint.y,
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
        ctx.fillText(this.text, 0, -5);
        ctx.restore();
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
        sh = new _line__WEBPACK_IMPORTED_MODULE_3__["default"](refPoint, new _geom__WEBPACK_IMPORTED_MODULE_6__["GlobalPoint"](line.x2, line.y2));
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
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tools */ "./ts_src/tools.ts");



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
        Object(_tools__WEBPACK_IMPORTED_MODULE_2__["setupTools"])();
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

/***/ "./ts_src/tools.ts":
/*!*************************!*\
  !*** ./ts_src/tools.ts ***!
  \*************************/
/*! exports provided: Tool, SelectTool, PanTool, setupTools, DrawTool, RulerTool, FOWTool, MapTool, InitiativeTracker */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Tool", function() { return Tool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SelectTool", function() { return SelectTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PanTool", function() { return PanTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setupTools", function() { return setupTools; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DrawTool", function() { return DrawTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "RulerTool", function() { return RulerTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FOWTool", function() { return FOWTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MapTool", function() { return MapTool; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InitiativeTracker", function() { return InitiativeTracker; });
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./units */ "./ts_src/units.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./socket */ "./ts_src/socket.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils */ "./ts_src/utils.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");
/* harmony import */ var _shapes_rect__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./shapes/rect */ "./ts_src/shapes/rect.ts");
/* harmony import */ var _shapes_baserect__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./shapes/baserect */ "./ts_src/shapes/baserect.ts");
/* harmony import */ var _shapes_line__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./shapes/line */ "./ts_src/shapes/line.ts");
/* harmony import */ var _shapes_text__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./shapes/text */ "./ts_src/shapes/text.ts");









class Tool {
    onContextMenu(e) { }
    ;
}
var SelectOperations;
(function (SelectOperations) {
    SelectOperations[SelectOperations["Noop"] = 0] = "Noop";
    SelectOperations[SelectOperations["Resize"] = 1] = "Resize";
    SelectOperations[SelectOperations["Drag"] = 2] = "Drag";
    SelectOperations[SelectOperations["GroupSelect"] = 3] = "GroupSelect";
})(SelectOperations || (SelectOperations = {}));
class SelectTool extends Tool {
    constructor() {
        super();
        this.mode = SelectOperations.Noop;
        this.resizedir = "";
        // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
        // we keep track of the actual offset within the asset.
        this.drag = new _geom__WEBPACK_IMPORTED_MODULE_4__["Vector"]({ x: 0, y: 0 }, new _geom__WEBPACK_IMPORTED_MODULE_4__["LocalPoint"](0, 0));
        this.selectionStartPoint = new _geom__WEBPACK_IMPORTED_MODULE_4__["GlobalPoint"](-1000, -1000);
        this.selectionHelper = new _shapes_rect__WEBPACK_IMPORTED_MODULE_5__["default"](this.selectionStartPoint, 0, 0);
        this.selectionHelper.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username);
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e);
        let hit = false;
        // the selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length)
            selectionStack = layer.shapes;
        else
            selectionStack = layer.shapes.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            const corn = shape.getCorner(Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse));
            if (corn !== undefined) {
                if (!shape.ownedBy())
                    continue;
                layer.selection = [shape];
                shape.onSelection();
                this.mode = SelectOperations.Resize;
                this.resizedir = corn;
                layer.invalidate(true);
                hit = true;
                break;
            }
            else if (shape.contains(Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse))) {
                if (!shape.ownedBy())
                    continue;
                const sel = shape;
                const z = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                this.mode = SelectOperations.Drag;
                this.drag = mouse.subtract(Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2l"])(sel.refPoint));
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
            this.selectionStartPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
            this.selectionHelper.refPoint = this.selectionStartPoint;
            this.selectionHelper.w = 0;
            this.selectionHelper.h = 0;
            layer.selection = [this.selectionHelper];
            layer.invalidate(true);
        }
    }
    ;
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.zoomFactor;
        if (this.mode === SelectOperations.GroupSelect) {
            // Currently draw on active this
            const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse);
            this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper.refPoint = new _geom__WEBPACK_IMPORTED_MODULE_4__["GlobalPoint"](Math.min(this.selectionStartPoint.x, endPoint.x), Math.min(this.selectionStartPoint.y, endPoint.y));
            layer.invalidate(true);
        }
        else if (layer.selection.length) {
            const og = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2l"])(layer.selection[layer.selection.length - 1].refPoint);
            layer.selection.forEach((sel) => {
                if (!(sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_6__["default"]))
                    return; // TODO
                const delta = mouse.subtract(og.add(this.drag));
                if (this.mode === SelectOperations.Drag) {
                    sel.refPoint = sel.refPoint.add(Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(delta));
                    if (layer.name === 'tokens') {
                        // We need to use the above updated values for the bounding box check
                        // First check if the bounding boxes overlap to stop close / precise movement
                        let blocked = false;
                        const bbox = sel.getBoundingBox();
                        const blockers = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].movementblockers.filter(mb => mb !== sel.uuid && _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.UUIDMap.has(mb) && _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.UUIDMap.get(mb).getBoundingBox().intersectsWith(bbox));
                        if (blockers.length > 0) {
                            blocked = true;
                        }
                        else {
                            // Draw a line from start to end position and see for any intersect
                            // This stops sudden leaps over walls! cheeky buggers
                            const line = { start: Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(og), end: sel.refPoint };
                            blocked = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].movementblockers.some(mb => {
                                if (!_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.UUIDMap.has(mb))
                                    return false;
                                const inter = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.UUIDMap.get(mb).getBoundingBox().getIntersectWithLine(line);
                                return mb !== sel.uuid && inter.intersect !== null && inter.distance > 0;
                            });
                        }
                        if (blocked) {
                            sel.refPoint = sel.refPoint.add(Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(delta).reverse());
                            return;
                        }
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
                else if (this.mode === SelectOperations.Resize) {
                    // TODO: This has to be shape specific
                    if (this.resizedir === 'nw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x) + sel.w * z - mouse.x;
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y) + sel.h * z - mouse.y;
                        sel.refPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse);
                    }
                    else if (this.resizedir === 'ne') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x);
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y) + sel.h * z - mouse.y;
                        sel.refPoint.y = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2gy"])(mouse.y);
                    }
                    else if (this.resizedir === 'se') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x);
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y);
                    }
                    else if (this.resizedir === 'sw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x) + sel.w * z - mouse.x;
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y);
                        sel.refPoint.x = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2gx"])(mouse.x);
                    }
                    sel.w /= z;
                    sel.h /= z;
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
                else if (sel) {
                    const gm = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse);
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
            });
        }
        else {
            document.body.style.cursor = "default";
        }
    }
    ;
    onMouseUp(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e);
        if (this.mode === SelectOperations.GroupSelect) {
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
                if (!(sel instanceof _shapes_baserect__WEBPACK_IMPORTED_MODULE_6__["default"]))
                    return; // TODO
                if (this.mode === SelectOperations.Drag) {
                    if (this.drag.origin.x === Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2lx"])(sel.refPoint.x) && this.drag.origin.y === Object(_units__WEBPACK_IMPORTED_MODULE_0__["g2ly"])(sel.refPoint.y)) {
                        return;
                    }
                    if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.gridSize;
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
                        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === SelectOperations.Resize) {
                    if (sel.w < 0) {
                        sel.refPoint.x += sel.w;
                        sel.w = Math.abs(sel.w);
                    }
                    if (sel.h < 0) {
                        sel.refPoint.y += sel.h;
                        sel.h = Math.abs(sel.h);
                    }
                    if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.gridSize;
                        sel.refPoint.x = Math.round(sel.refPoint.x / gs) * gs;
                        sel.refPoint.y = Math.round(sel.refPoint.y / gs) * gs;
                        sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                        sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
            });
        }
        this.mode = SelectOperations.Noop;
    }
    ;
    onContextMenu(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e);
        const mx = mouse.x;
        const my = mouse.y;
        let hit = false;
        layer.shapes.forEach(function (shape) {
            if (!hit && shape.contains(Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse))) {
                shape.showContextMenu(mouse);
            }
        });
    }
    ;
}
class PanTool extends Tool {
    constructor() {
        super(...arguments);
        this.panStart = new _geom__WEBPACK_IMPORTED_MODULE_4__["LocalPoint"](0, 0);
        this.active = false;
    }
    onMouseDown(e) {
        this.panStart = Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e);
        this.active = true;
    }
    ;
    onMouseMove(e) {
        if (!this.active)
            return;
        const mouse = Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.zoomFactor;
        const distance = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(mouse.subtract(this.panStart)).direction;
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.panX += Math.round(distance.x);
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.panY += Math.round(distance.y);
        this.panStart = mouse;
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.invalidate();
    }
    ;
    onMouseUp(e) {
        this.active = false;
        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("set clientOptions", {
            locationOptions: {
                [`${_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].roomName}/${_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].roomCreator}/${_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].locationName}`]: {
                    panX: _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.panX,
                    panY: _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.panY
                }
            }
        });
    }
    ;
    onContextMenu(e) { }
    ;
}
function setupTools() {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM)
            return;
        const toolInstance = new tool.clz();
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].tools.set(tool.name, toolInstance);
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
            if (index !== _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].selectedTool) {
                $('.tool-selected').removeClass("tool-selected");
                $(this).addClass("tool-selected");
                _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].selectedTool = index;
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
class DrawTool extends Tool {
    constructor() {
        super();
        this.active = false;
        this.fillColor = $("<input type='text' />");
        this.borderColor = $("<input type='text' />");
        this.detailDiv = $("<div>")
            .append($("<div>Fill</div>")).append(this.fillColor)
            .append($("<div>Border</div>")).append(this.borderColor)
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
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        const fillColor = this.fillColor.spectrum("get");
        const fill = fillColor === null ? tinycolor("transparent") : fillColor;
        const borderColor = this.borderColor.spectrum("get");
        const border = borderColor === null ? tinycolor("transparent") : borderColor;
        this.rect = new _shapes_rect__WEBPACK_IMPORTED_MODULE_5__["default"](this.startPoint, 0, 0, fill.toRgbString(), border.toRgbString());
        this.rect.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username);
        if (layer.name === 'fow') {
            this.rect.visionObstruction = true;
            this.rect.movementObstruction = true;
        }
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].lightblockers.push(this.rect.uuid);
        layer.addShape(this.rect, true, false);
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e) {
        this.active = false;
    }
}
class RulerTool extends Tool {
    constructor() {
        super(...arguments);
        this.active = false;
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        console.log("Mouse down");
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("draw");
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.ruler = new _shapes_line__WEBPACK_IMPORTED_MODULE_7__["default"](this.startPoint, this.startPoint);
        this.text = new _shapes_text__WEBPACK_IMPORTED_MODULE_8__["default"](this.startPoint.clone(), "", "20px serif");
        this.ruler.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username);
        this.text.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username);
        layer.addShape(this.ruler, true, true);
        layer.addShape(this.text, true, true);
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("draw") === undefined) {
            console.log("No draw layer!");
            return;
        }
        // Currently draw on active layer
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("draw");
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.ruler.endPoint = endPoint;
        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: this.ruler.asDict(), temporary: true });
        const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
        const xdiff = Math.abs(endPoint.x - this.startPoint.x);
        const ydiff = Math.abs(endPoint.y - this.startPoint.y);
        const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.unitSize / _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.gridSize) + " ft";
        let angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
        const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
        this.text.refPoint.x = xmid;
        this.text.refPoint.y = ymid;
        this.text.text = label;
        this.text.angle = angle;
        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: this.text.asDict(), temporary: true });
        layer.invalidate(true);
    }
    onMouseUp(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("draw");
        layer.removeShape(this.ruler, true, true);
        layer.removeShape(this.text, true, true);
        layer.invalidate(true);
    }
}
class FOWTool extends Tool {
    constructor() {
        super(...arguments);
        this.active = false;
        this.detailDiv = $("<div>")
            .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
            .append($("</div>"));
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("fow");
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect = new _shapes_rect__WEBPACK_IMPORTED_MODULE_5__["default"](this.startPoint, 0, 0, _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].fowColour.spectrum("get").toRgbString());
        layer.addShape(this.rect, true, false);
        if ($("#fow-reveal").prop("checked"))
            this.rect.globalCompositeOperation = "destination-out";
        else
            this.rect.globalCompositeOperation = "source-over";
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        // Currently draw on active layer
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer("fow");
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
        layer.invalidate(false);
    }
    onMouseUp(e) {
        this.active = false;
    }
}
class MapTool extends Tool {
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
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect = new _shapes_rect__WEBPACK_IMPORTED_MODULE_5__["default"](this.startPoint, 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, false, false);
    }
    onMouseMove(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2g"])(Object(_utils__WEBPACK_IMPORTED_MODULE_3__["getMouse"])(e));
        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect.refPoint.y = Math.min(this.startPoint.y, endPoint.y);
        layer.invalidate(false);
    }
    onMouseUp(e) {
        if (!this.active)
            return;
        if (_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.getLayer();
        if (layer.selection.length !== 1) {
            layer.removeShape(this.rect, false, false);
            return;
        }
        const w = this.rect.w;
        const h = this.rect.h;
        const sel = layer.selection[0];
        if (sel instanceof _shapes_rect__WEBPACK_IMPORTED_MODULE_5__["default"]) {
            sel.w *= parseInt(this.xCount.val()) * _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.gridSize / w;
            sel.h *= parseInt(this.yCount.val()) * _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].layerManager.gridSize / h;
        }
        layer.removeShape(this.rect, false, false);
    }
}
class InitiativeTracker {
    constructor() {
        this.data = [];
    }
    addInitiative(data, sync) {
        // Open the initiative tracker if it is not currently open.
        if (this.data.length === 0 || !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeDialog.dialog("isOpen"))
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeDialog.dialog("open");
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
            _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("updateInitiative", data);
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
                _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("updateInitiative", { uuid: uuid });
        }
        if (this.data.length === 0 && _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeDialog.dialog("isOpen"))
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeDialog.dialog("close");
    }
    ;
    redraw() {
        _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeDialog.empty();
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
            if (!data.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM) {
                val.prop("disabled", "disabled");
                remove.css("opacity", "0.3");
            }
            _planarally__WEBPACK_IMPORTED_MODULE_1__["default"].initiativeDialog.append(img).append(val).append(visible).append(group).append(remove);
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
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM)
                    return;
                d.visible = !d.visible;
                if (d.visible)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("updateInitiative", d);
            });
            group.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog group unknown uuid?");
                    return;
                }
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM)
                    return;
                d.group = !d.group;
                if (d.group)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                _socket__WEBPACK_IMPORTED_MODULE_2__["default"].emit("updateInitiative", d);
            });
            remove.on("click", function () {
                const uuid = $(this).data('uuid');
                const d = self.data.find(d => d.uuid === uuid);
                if (d === undefined) {
                    console.log("Initiativedialog remove unknown uuid?");
                    return;
                }
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_1__["default"].IS_DM)
                    return;
                $(`[data-uuid=${uuid}]`).remove();
                self.removeInitiative(uuid, true, true);
            });
        });
    }
    ;
}
const tools = [
    { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, clz: SelectTool },
    { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, clz: PanTool },
    { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, clz: DrawTool },
    { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, clz: RulerTool },
    { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, clz: FOWTool },
    { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, clz: MapTool },
];


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2Fzc2V0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvYmFzZXJlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9ib3VuZGluZ3JlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9jaXJjbGUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9lZGl0ZGlhbG9nLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvbGluZS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL3JlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9zaGFwZS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL3RleHQudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy91dGlscy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc29ja2V0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdW5pdHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNB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QUcsQ0FBQyxRQUFRLENBQUMsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLG1EQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZGLFVBQVU7b0JBQ1YsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLG1EQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQy9FLFdBQVc7b0JBQ1gsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUMvRixVQUFVO29CQUNWLEdBQUcsQ0FBQyxRQUFRLENBQUMsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxRixDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FB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QyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzFELE1BQU0sS0FBSyxHQUFHLElBQUkscURBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUMxRCxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7d0JBRXRDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs0QkFDbkMsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7NEJBQzdDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDOzRCQUMxRCxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDMUQsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ3RELEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMxRCxDQUFDO3dCQUVELENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM1QixDQUFDO2lCQUNKLENBQUMsQ0FBQztZQUNQLENBQUM7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LElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsUUFBUSxDQUFDLEtBQWtCO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBQ0QsUUFBUSxDQUFDLEtBQWtCLEVBQUUsTUFBYztRQUN2QyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2IsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEssS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoSixLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSyxLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEw7Z0JBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQztJQUNELFNBQVMsQ0FBQyxLQUFrQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMs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Q0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDWixHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN4QixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxNQUFNLEVBQUUsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7d0JBQzdDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUN0RCxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDdEQsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ2xELEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUN0RCxDQUFDO29C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LENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQ0QsYUFBYSxDQUFDLEdBQVc7UUFDckIsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNELFdBQVcsQ0FBQyxHQUFXO1FBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDRCxHQUFHLENBQUMsR0FBTSxFQUFFLEtBQVE7UUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNELE9BQU8sQ0FBQyxPQUFVO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxNQUFNLENBQUMsT0FBVTtRQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0NBQ0oiLCJmaWxlIjoicGxhbmFyYWxseS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3RzX3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiLypcclxuVGhpcyBtb2R1bGUgZGVmaW5lcyBzb21lIFBvaW50IGNsYXNzZXMuXHJcbkEgc3Ryb25nIGZvY3VzIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYXQgbm8gdGltZSBhIGdsb2JhbCBhbmQgYSBsb2NhbCBwb2ludCBhcmUgaW4gc29tZSB3YXkgdXNlZCBpbnN0ZWFkIG9mIHRoZSBvdGhlci5cclxuVGhpcyBhZGRzIHNvbWUgYXQgZmlyc3QgZ2xhbmNlIHdlaXJkIGxvb2tpbmcgaGFja3MgYXMgdHMgZG9lcyBub3Qgc3VwcG9ydCBub21pbmFsIHR5cGluZy5cclxuKi9cclxuXHJcbmNsYXNzIFBvaW50IHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTpudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICB9XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIHZlYy5kaXJlY3Rpb24ueCwgdGhpcy55ICsgdmVjLmRpcmVjdGlvbi55KTtcclxuICAgIH1cclxuICAgIHN1YnRyYWN0KG90aGVyOiBQb2ludCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yKHt4OiB0aGlzLnggLSBvdGhlci54LCB5OiB0aGlzLnkgLSBvdGhlci55fSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgICBjbG9uZSgpOiBQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGNsYXNzIEdsb2JhbFBvaW50IGV4dGVuZHMgUG9pbnQge1xyXG4gICAgLy8gdGhpcyBpcyB0byBkaWZmZXJlbnRpYXRlIHdpdGggTG9jYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0dsb2JhbFBvaW50ITogc3RyaW5nO1xyXG4gICAgYWRkKHZlYzogVmVjdG9yPHRoaXM+KTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogR2xvYmFsUG9pbnQpOiBWZWN0b3I8dGhpcz4ge1xyXG4gICAgICAgICByZXR1cm4gc3VwZXIuc3VidHJhY3Qob3RoZXIpO1xyXG4gICAgfVxyXG4gICAgY2xvbmUoKTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuY2xvbmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExvY2FsUG9pbnQgZXh0ZW5kcyBQb2ludCB7XHJcbiAgICAvLyB0aGlzIGlzIHRvIGRpZmZlcmVudGlhdGUgd2l0aCBHbG9iYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0xvY2FsUG9pbnQhOiBzdHJpbmc7XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pOiBMb2NhbFBvaW50IHtcclxuICAgICAgICByZXR1cm4gPExvY2FsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogTG9jYWxQb2ludCk6IFZlY3Rvcjx0aGlzPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLnN1YnRyYWN0KG90aGVyKTtcclxuICAgIH1cclxuICAgIGNsb25lKCk6IExvY2FsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8TG9jYWxQb2ludD5zdXBlci5jbG9uZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmVjdG9yPFQgZXh0ZW5kcyBQb2ludD4ge1xyXG4gICAgZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn07XHJcbiAgICBvcmlnaW4/OiBUO1xyXG4gICAgY29uc3RydWN0b3IoZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn0sIG9yaWdpbj86IFQpIHtcclxuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICAgICAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbjtcclxuICAgIH1cclxuICAgIHJldmVyc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8VD4oe3g6IC10aGlzLmRpcmVjdGlvbi54LCB5OiAtdGhpcy5kaXJlY3Rpb24ueX0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmU8VCBleHRlbmRzIFBvaW50PihwOiBULCBsMTogVCwgbDI6IFQpIHtcclxuICAgIHJldHVybiBwLnggPj0gTWF0aC5taW4obDEueCwgbDIueCkgLSAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueCA8PSBNYXRoLm1heChsMS54LCBsMi54KSArIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55ID49IE1hdGgubWluKGwxLnksIGwyLnkpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnkgPD0gTWF0aC5tYXgobDEueSwgbDIueSkgKyAwLjAwMDAwMTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmVzPFQgZXh0ZW5kcyBQb2ludD4ocDogVCwgczE6IFQsIGUxOiBULCBzMjogVCwgZTI6IFQpIHtcclxuICAgIHJldHVybiBwb2ludEluTGluZShwLCBzMSwgZTEpICYmIHBvaW50SW5MaW5lKHAsIHMyLCBlMik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMaW5lc0ludGVyc2VjdFBvaW50PFQgZXh0ZW5kcyBQb2ludD4oczE6IFQsIGUxOiBULCBzMjogVCwgZTI6IFQpIHtcclxuICAgIC8vIGNvbnN0IHMxID0gTWF0aC5taW4oUzEsIClcclxuICAgIGNvbnN0IEExID0gZTEueS1zMS55O1xyXG4gICAgY29uc3QgQjEgPSBzMS54LWUxLng7XHJcbiAgICBjb25zdCBBMiA9IGUyLnktczIueTtcclxuICAgIGNvbnN0IEIyID0gczIueC1lMi54O1xyXG5cclxuICAgIC8vIEdldCBkZWx0YSBhbmQgY2hlY2sgaWYgdGhlIGxpbmVzIGFyZSBwYXJhbGxlbFxyXG4gICAgY29uc3QgZGVsdGEgPSBBMSpCMiAtIEEyKkIxO1xyXG4gICAgaWYoZGVsdGEgPT09IDApIHJldHVybiB7aW50ZXJzZWN0OiBudWxsLCBwYXJhbGxlbDogdHJ1ZX07XHJcblxyXG4gICAgY29uc3QgQzIgPSBBMipzMi54K0IyKnMyLnk7XHJcbiAgICBjb25zdCBDMSA9IEExKnMxLngrQjEqczEueTtcclxuICAgIC8vaW52ZXJ0IGRlbHRhIHRvIG1ha2UgZGl2aXNpb24gY2hlYXBlclxyXG4gICAgY29uc3QgaW52ZGVsdGEgPSAxL2RlbHRhO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdCA9IDxUPnt4OiAoQjIqQzEgLSBCMSpDMikqaW52ZGVsdGEsIHk6IChBMSpDMiAtIEEyKkMxKSppbnZkZWx0YX07XHJcbiAgICBpZiAoIXBvaW50SW5MaW5lcyhpbnRlcnNlY3QsIHMxLCBlMSwgczIsIGUyKSlcclxuICAgICAgICByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IGZhbHNlfTtcclxuICAgIHJldHVybiB7aW50ZXJzZWN0OiBpbnRlcnNlY3QsIHBhcmFsbGVsOiBmYWxzZX07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQb2ludERpc3RhbmNlKHAxOiBQb2ludCwgcDI6IFBvaW50KSB7XHJcbiAgICBjb25zdCBhID0gcDEueCAtIHAyLng7XHJcbiAgICBjb25zdCBiID0gcDEueSAtIHAyLnk7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCBhKmEgKyBiKmIgKTtcclxufSIsImltcG9ydCB7Z2V0VW5pdERpc3RhbmNlLCBsMmcsIGcybCwgZzJseiwgZzJsciwgZzJseCwgZzJseX0gZnJvbSBcIi4vdW5pdHNcIjtcclxuaW1wb3J0IHtHbG9iYWxQb2ludH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBMb2NhdGlvbk9wdGlvbnMsIFNlcnZlclNoYXBlIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZXMvc2hhcGVcIjtcclxuaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL3NoYXBlcy9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgQ2lyY2xlIGZyb20gXCIuL3NoYXBlcy9jaXJjbGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9zaGFwZXMvYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGNyZWF0ZVNoYXBlRnJvbURpY3QgfSBmcm9tIFwiLi9zaGFwZXMvdXRpbHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBMYXllck1hbmFnZXIge1xyXG4gICAgbGF5ZXJzOiBMYXllcltdID0gW107XHJcbiAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgc2VsZWN0ZWRMYXllcjogc3RyaW5nID0gXCJcIjtcclxuXHJcbiAgICBVVUlETWFwOiBNYXA8c3RyaW5nLCBTaGFwZT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgZ3JpZFNpemUgPSA1MDtcclxuICAgIHVuaXRTaXplID0gNTtcclxuICAgIHVzZUdyaWQgPSB0cnVlO1xyXG4gICAgZnVsbEZPVyA9IGZhbHNlO1xyXG4gICAgZm93T3BhY2l0eSA9IDAuMztcclxuXHJcbiAgICB6b29tRmFjdG9yID0gMTtcclxuICAgIHBhblggPSAwO1xyXG4gICAgcGFuWSA9IDA7XHJcblxyXG4gICAgLy8gUmVmcmVzaCBpbnRlcnZhbCBhbmQgcmVkcmF3IHNldHRlci5cclxuICAgIGludGVydmFsID0gMzA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGxtLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgbG0ubGF5ZXJzW2ldLmRyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMuaW50ZXJ2YWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE9wdGlvbnMob3B0aW9uczogTG9jYXRpb25PcHRpb25zKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKFwidW5pdFNpemVcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldFVuaXRTaXplKG9wdGlvbnMudW5pdFNpemUpO1xyXG4gICAgICAgIGlmIChcInVzZUdyaWRcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldFVzZUdyaWQob3B0aW9ucy51c2VHcmlkKTtcclxuICAgICAgICBpZiAoXCJmdWxsRk9XXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRGdWxsRk9XKG9wdGlvbnMuZnVsbEZPVyk7XHJcbiAgICAgICAgaWYgKCdmb3dPcGFjaXR5JyBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldEZPV09wYWNpdHkob3B0aW9ucy5mb3dPcGFjaXR5KTtcclxuICAgICAgICBpZiAoXCJmb3dDb2xvdXJcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5mb3dDb2xvdXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFdpZHRoKHdpZHRoOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZExheWVyKGxheWVyOiBMYXllcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLnB1c2gobGF5ZXIpO1xyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkTGF5ZXIgPT09IFwiXCIgJiYgbGF5ZXIuc2VsZWN0YWJsZSkgdGhpcy5zZWxlY3RlZExheWVyID0gbGF5ZXIubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBoYXNMYXllcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXllcnMuc29tZShsID0+IGwubmFtZSA9PT0gbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TGF5ZXIobmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIG5hbWUgPSAobmFtZSA9PT0gdW5kZWZpbmVkKSA/IHRoaXMuc2VsZWN0ZWRMYXllciA6IG5hbWU7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMubGF5ZXJzW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3RvZG8gcmVuYW1lIHRvIHNlbGVjdExheWVyXHJcbiAgICBzZXRMYXllcihuYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsbSA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5sYXllcnMuZm9yRWFjaChmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCAmJiBsYXllci5uYW1lICE9PSAnZm93JykgbGF5ZXIuY3R4Lmdsb2JhbEFscGhhID0gMC4zO1xyXG4gICAgICAgICAgICBlbHNlIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDEuMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBsYXllci5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBsbS5zZWxlY3RlZExheWVyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0R3JpZExheWVyKCk6IExheWVyfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXIoXCJncmlkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdHcmlkKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5nZXRHcmlkTGF5ZXIoKTtcclxuICAgICAgICBpZiAobGF5ZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGN0eCA9IGxheWVyLmN0eDtcclxuICAgICAgICBsYXllci5jbGVhcigpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXllci53aWR0aDsgaSArPSB0aGlzLmdyaWRTaXplICogdGhpcy56b29tRmFjdG9yKSB7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgbGF5ZXIuaGVpZ2h0KTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbygwLCBpICsgKHRoaXMucGFuWSAlIHRoaXMuZ3JpZFNpemUpICogdGhpcy56b29tRmFjdG9yKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyhsYXllci53aWR0aCwgaSArICh0aGlzLnBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lTWFuYWdlci5ncmlkQ29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIGxheWVyLnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5oYXNMYXllcihcImZvd1wiKSlcclxuICAgICAgICAgICAgdGhpcy5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRHcmlkU2l6ZShncmlkU2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdyaWRTaXplICE9PSB0aGlzLmdyaWRTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZFNpemUgPSBncmlkU2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjZ3JpZFNpemVJbnB1dCcpLnZhbChncmlkU2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVuaXRTaXplKHVuaXRTaXplOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBpZiAodW5pdFNpemUgIT09IHRoaXMudW5pdFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy51bml0U2l6ZSA9IHVuaXRTaXplO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICQoJyN1bml0U2l6ZUlucHV0JykudmFsKHVuaXRTaXplKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VXNlR3JpZCh1c2VHcmlkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHVzZUdyaWQgIT09IHRoaXMudXNlR3JpZCkge1xyXG4gICAgICAgICAgICB0aGlzLnVzZUdyaWQgPSB1c2VHcmlkO1xyXG4gICAgICAgICAgICBpZiAodXNlR3JpZClcclxuICAgICAgICAgICAgICAgICQoJyNncmlkLWxheWVyJykuc2hvdygpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLmhpZGUoKTtcclxuICAgICAgICAgICAgJCgnI3VzZUdyaWRJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIHVzZUdyaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRGdWxsRk9XKGZ1bGxGT1c6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZnVsbEZPVyAhPT0gdGhpcy5mdWxsRk9XKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnVsbEZPVyA9IGZ1bGxGT1c7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvd2wgPSB0aGlzLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgJCgnI3VzZUZPV0lucHV0JykucHJvcChcImNoZWNrZWRcIiwgZnVsbEZPVyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEZPV09wYWNpdHkoZm93T3BhY2l0eTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcclxuICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICQoJyNmb3dPcGFjaXR5JykudmFsKGZvd09wYWNpdHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubGF5ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXIge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgd2lkdGg6IG51bWJlcjtcclxuICAgIGhlaWdodDogbnVtYmVyO1xyXG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHNlbGVjdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHBsYXllcl9lZGl0YWJsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFdoZW4gc2V0IHRvIGZhbHNlLCB0aGUgbGF5ZXIgd2lsbCBiZSByZWRyYXduIG9uIHRoZSBuZXh0IHRpY2tcclxuICAgIHZhbGlkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAvLyBUaGUgY29sbGVjdGlvbiBvZiBzaGFwZXMgdGhhdCB0aGlzIGxheWVyIGNvbnRhaW5zLlxyXG4gICAgLy8gVGhlc2UgYXJlIG9yZGVyZWQgb24gYSBkZXB0aCBiYXNpcy5cclxuICAgIHNoYXBlczogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIENvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgYXJlIGN1cnJlbnRseSBzZWxlY3RlZFxyXG4gICAgc2VsZWN0aW9uOiBTaGFwZVtdID0gW107XHJcblxyXG4gICAgLy8gRXh0cmEgc2VsZWN0aW9uIGhpZ2hsaWdodGluZyBzZXR0aW5nc1xyXG4gICAgc2VsZWN0aW9uQ29sb3IgPSAnI0NDMDAwMCc7XHJcbiAgICBzZWxlY3Rpb25XaWR0aCA9IDI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKHNraXBMaWdodFVwZGF0ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIXNraXBMaWdodFVwZGF0ZSAmJiB0aGlzLm5hbWUgIT09IFwiZm93XCIgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICBzaGFwZS5sYXllciA9IHRoaXMubmFtZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKHNoYXBlKTtcclxuICAgICAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwiYWRkIHNoYXBlXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIHRlbXBvcmFyeTogdGVtcG9yYXJ5fSk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoYXBlKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNlcnZlclNoYXBlW10pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB0OiBTaGFwZVtdID0gW107XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSk7XHJcbiAgICAgICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtzaGFwZS50eXBlfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2gubGF5ZXIgPSBzZWxmLm5hbWU7XHJcbiAgICAgICAgICAgIHNoLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgICAgIHNoLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaCk7XHJcbiAgICAgICAgICAgIHQucHVzaChzaCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTsgLy8gVE9ETzogRml4IGtlZXBpbmcgc2VsZWN0aW9uIG9uIHRob3NlIGl0ZW1zIHRoYXQgYXJlIG5vdCBtb3ZlZC5cclxuICAgICAgICB0aGlzLnNoYXBlcyA9IHQ7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodGVtcG9yYXJ5ID09PSB1bmRlZmluZWQpIHRlbXBvcmFyeSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc2hhcGVzLnNwbGljZSh0aGlzLnNoYXBlcy5pbmRleE9mKHNoYXBlKSwgMSk7XHJcbiAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwicmVtb3ZlIHNoYXBlXCIsIHtzaGFwZTogc2hhcGUsIHRlbXBvcmFyeTogdGVtcG9yYXJ5fSk7XHJcbiAgICAgICAgY29uc3QgbHNfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5maW5kSW5kZXgobHMgPT4gbHMuc2hhcGUgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IGxiX2kgPSBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgY29uc3QgbWJfaSA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuZmluZEluZGV4KGxzID0+IGxzID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBpZiAobHNfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuc3BsaWNlKGxzX2ksIDEpO1xyXG4gICAgICAgIGlmIChsYl9pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKGxiX2ksIDEpO1xyXG4gICAgICAgIGlmIChtYl9pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc3BsaWNlKG1iX2ksIDEpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmRlbGV0ZShzaGFwZS51dWlkKTtcclxuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnNlbGVjdGlvbi5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAoaW5kZXggPj0gMClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhkb0NsZWFyPzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCAmJiAhdGhpcy52YWxpZCkge1xyXG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcclxuICAgICAgICAgICAgZG9DbGVhciA9IGRvQ2xlYXIgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBkb0NsZWFyO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRvQ2xlYXIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUudmlzaWJsZUluQ2FudmFzKHN0YXRlLmNhbnZhcykpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5uYW1lID09PSAnZm93JyAmJiBzaGFwZS52aXNpb25PYnN0cnVjdGlvbiAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSEubmFtZSAhPT0gc3RhdGUubmFtZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgc2hhcGUuZHJhdyhjdHgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5zZWxlY3Rpb25XaWR0aDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFJFRkFDVE9SIFRISVMgVE8gU2hhcGUuZHJhd1NlbGVjdGlvbihjdHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KGcybHgoc2VsLnJlZlBvaW50LngpLCBnMmx5KHNlbC5yZWZQb2ludC55KSwgc2VsLncgKiB6LCBzZWwuaCAqIHopO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB0b3ByaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdChnMmx4KHNlbC5yZWZQb2ludC54ICsgc2VsLncgLSAzKSwgZzJseShzZWwucmVmUG9pbnQueSAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChzZWwucmVmUG9pbnQueCAtIDMpLCBnMmx5KHNlbC5yZWZQb2ludC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90cmlnaHRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChzZWwucmVmUG9pbnQueCArIHNlbC53IC0gMyksIGcybHkoc2VsLnJlZlBvaW50LnkgKyBzZWwuaCAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJvdGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChzZWwucmVmUG9pbnQueCAtIDMpLCBnMmx5KHNlbC5yZWZQb2ludC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlU2hhcGVPcmRlcihzaGFwZTogU2hhcGUsIGRlc3RpbmF0aW9uSW5kZXg6IG51bWJlciwgc3luYzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IG9sZElkeCA9IHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpO1xyXG4gICAgICAgIGlmIChvbGRJZHggPT09IGRlc3RpbmF0aW9uSW5kZXgpIHJldHVybjtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2Uob2xkSWR4LCAxKTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoZGVzdGluYXRpb25JbmRleCwgMCwgc2hhcGUpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcIm1vdmVTaGFwZU9yZGVyXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIGluZGV4OiBkZXN0aW5hdGlvbkluZGV4fSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblNoYXBlTW92ZShzaGFwZT86IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRMYXllciBleHRlbmRzIExheWVyIHtcclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dMYXllciBleHRlbmRzIExheWVyIHtcclxuXHJcbiAgICBhZGRTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc3VwZXIuYWRkU2hhcGUoc2hhcGUsIHN5bmMsIHRlbXBvcmFyeSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0U2hhcGVzKHNoYXBlczogU2VydmVyU2hhcGVbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGMgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgc2hhcGUuZmlsbCA9IGM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3VwZXIuc2V0U2hhcGVzKHNoYXBlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU6IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLm9uU2hhcGVNb3ZlKHNoYXBlKTtcclxuICAgIH07XHJcblxyXG4gICAgZHJhdygpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdfb3AgPSBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9nYWxwaGEgPSB0aGlzLmN0eC5nbG9iYWxBbHBoYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiY29weVwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBvZ2FscGhhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJ0b2tlbnNcIikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcInRva2Vuc1wiKSEuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaC5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYiA9IHNoLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IGcybChzaC5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxtID0gMC44ICogZzJseihiYi53KTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAobHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxzLnNoYXBlKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPbGQgbGlnaHRzb3VyY2Ugc3RpbGwgbGluZ2VyaW5nIGluIHRoZSBnYW1lTWFuYWdlciBsaXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbGVuZ3RoID0gZ2V0VW5pdERpc3RhbmNlKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsY2VudGVyID0gZzJsKGNlbnRlcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gbmV3IENpcmNsZShjZW50ZXIsIGF1cmFfbGVuZ3RoKS5nZXRCb3VuZGluZ0JveCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNvbGxlY3QgYWxsIGxpZ2h0YmxvY2tlcnMgdGhhdCBhcmUgaW5zaWRlL2Nyb3NzIG91ciBhdXJhXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHRvIHByZXZlbnQgYXMgbWFueSByYXkgY2FsY3VsYXRpb25zIGFzIHBvc3NpYmxlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbF9saWdodGJsb2NrZXJzOiBCb3VuZGluZ1JlY3RbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5mb3JFYWNoKGZ1bmN0aW9uIChsYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYiA9PT0gc2gudXVpZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX3NoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbGJfc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfYmIuaW50ZXJzZWN0c1dpdGgoYmJveCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2xpZ2h0YmxvY2tlcnMucHVzaChsYl9iYik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyY19zdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FzdCByYXlzIGluIGV2ZXJ5IGRlZ3JlZVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYW5nbGUgPSAwOyBhbmdsZSA8IDIgKiBNYXRoLlBJOyBhbmdsZSArPSAoMSAvIDE4MCkgKiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaGl0IHdpdGggb2JzdHJ1Y3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgaGl0OiB7aW50ZXJzZWN0OiBHbG9iYWxQb2ludHxudWxsLCBkaXN0YW5jZTpudW1iZXJ9ID0ge2ludGVyc2VjdDogbnVsbCwgZGlzdGFuY2U6IEluZmluaXR5fTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0OiBudWxsfEJvdW5kaW5nUmVjdCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPGxvY2FsX2xpZ2h0YmxvY2tlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfYmIgPSBsb2NhbF9saWdodGJsb2NrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsYl9iYi5nZXRJbnRlcnNlY3RXaXRoTGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogY2VudGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgR2xvYmFsUG9pbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXIueSArIGF1cmFfbGVuZ3RoICogTWF0aC5zaW4oYW5nbGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmludGVyc2VjdCAhPT0gbnVsbCAmJiByZXN1bHQuZGlzdGFuY2UgPCBoaXQuZGlzdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlX2hpdCA9IGxiX2JiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgbm8gaGl0LCBjaGVjayBpZiB3ZSBjb21lIGZyb20gYSBwcmV2aW91cyBoaXQgc28gdGhhdCB3ZSBjYW4gZ28gYmFjayB0byB0aGUgYXJjXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpdC5pbnRlcnNlY3QgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IGFuZ2xlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzdCA9IGcybChuZXcgR2xvYmFsUG9pbnQoY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSwgY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGhpdCAsIGZpcnN0IGZpbmlzaCBhbnkgb25nb2luZyBhcmMsIHRoZW4gbW92ZSB0byB0aGUgaW50ZXJzZWN0aW9uIHBvaW50XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgZzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCBhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFYID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGVfaGl0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhWCA9IChzaGFwZV9oaXQudyAvIDQpICogTWF0aC5jb3MoYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYVkgPSAoc2hhcGVfaGl0LmggLyA0KSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCFzaGFwZV9oaXQuY29udGFpbnMoaGl0LmludGVyc2VjdC54ICsgZXh0cmFYLCBoaXQuaW50ZXJzZWN0LnkgKyBleHRyYVksIGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVggPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVkgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXN0ID0gZzJsKG5ldyBHbG9iYWxQb2ludChoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgsIGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oZGVzdC54LCBkZXN0LnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgZzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCAyICogTWF0aC5QSSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxtID0gZzJscihhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcclxuICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsIDAsIDAsIDApJyk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbiAgICAgICAgICAgICAgICAvLyBjdHguZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEpXCI7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgc29ja2V0IGZyb20gJy4vc29ja2V0J1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi91bml0c1wiO1xyXG5pbXBvcnQgeyBMYXllck1hbmFnZXIsIExheWVyLCBHcmlkTGF5ZXIsIEZPV0xheWVyIH0gZnJvbSBcIi4vbGF5ZXJzXCI7XHJcbmltcG9ydCB7IENsaWVudE9wdGlvbnMsIEJvYXJkSW5mbywgU2VydmVyU2hhcGUsIEluaXRpYXRpdmVEYXRhIH0gZnJvbSAnLi9hcGlfdHlwZXMnO1xyXG5pbXBvcnQgeyBPcmRlcmVkTWFwIH0gZnJvbSAnLi91dGlscyc7XHJcbmltcG9ydCBBc3NldCBmcm9tICcuL3NoYXBlcy9hc3NldCc7XHJcbmltcG9ydCB7Y3JlYXRlU2hhcGVGcm9tRGljdH0gZnJvbSAnLi9zaGFwZXMvdXRpbHMnO1xyXG5pbXBvcnQgeyBEcmF3VG9vbCwgUnVsZXJUb29sLCBNYXBUb29sLCBGT1dUb29sLCBJbml0aWF0aXZlVHJhY2tlciwgVG9vbCB9IGZyb20gXCIuL3Rvb2xzXCI7XHJcbmltcG9ydCB7IExvY2FsUG9pbnQsIEdsb2JhbFBvaW50IH0gZnJvbSAnLi9nZW9tJztcclxuaW1wb3J0IFJlY3QgZnJvbSAnLi9zaGFwZXMvcmVjdCc7XHJcblxyXG5jbGFzcyBHYW1lTWFuYWdlciB7XHJcbiAgICBJU19ETSA9IGZhbHNlO1xyXG4gICAgcm9vbU5hbWUhOiBzdHJpbmc7XHJcbiAgICByb29tQ3JlYXRvciE6IHN0cmluZztcclxuICAgIGxvY2F0aW9uTmFtZSE6IHN0cmluZztcclxuICAgIHVzZXJuYW1lITogc3RyaW5nO1xyXG4gICAgYm9hcmRfaW5pdGlhbGlzZWQgPSBmYWxzZTtcclxuICAgIGxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgIHNlbGVjdGVkVG9vbDogbnVtYmVyID0gMDtcclxuICAgIHRvb2xzOiBPcmRlcmVkTWFwPHN0cmluZywgVG9vbD4gPSBuZXcgT3JkZXJlZE1hcCgpO1xyXG4gICAgbGlnaHRzb3VyY2VzOiB7IHNoYXBlOiBzdHJpbmcsIGF1cmE6IHN0cmluZyB9W10gPSBbXTtcclxuICAgIGxpZ2h0YmxvY2tlcnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBtb3ZlbWVudGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgZ3JpZENvbG91ciA9ICQoXCIjZ3JpZENvbG91clwiKTtcclxuICAgIGZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xyXG4gICAgaW5pdGlhdGl2ZVRyYWNrZXIgPSBuZXcgSW5pdGlhdGl2ZVRyYWNrZXIoKTtcclxuICAgIHNoYXBlU2VsZWN0aW9uRGlhbG9nID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9KTtcclxuICAgIGluaXRpYXRpdmVEaWFsb2cgPSAkKFwiI2luaXRpYXRpdmVkaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICcxNjBweCdcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2JhKDI1NSwwLDAsIDAuNSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2dyaWRDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2IoODIsIDgxLCA4MSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5maWxsID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2Zvd0NvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0dXBCb2FyZChyb29tOiBCb2FyZEluZm8pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNkaXYgPSAkKCcjbGF5ZXJzJyk7XHJcbiAgICAgICAgbGF5ZXJzZGl2LmVtcHR5KCk7XHJcbiAgICAgICAgY29uc3QgbGF5ZXJzZWxlY3RkaXYgPSAkKCcjbGF5ZXJzZWxlY3QnKTtcclxuICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwidWxcIikuZW1wdHkoKTtcclxuICAgICAgICBsZXQgc2VsZWN0YWJsZV9sYXllcnMgPSAwO1xyXG5cclxuICAgICAgICBjb25zdCBsbSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikuZmluZChcImRpdlwiKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9mZigpO1xyXG4gICAgICAgIGxtLmVtcHR5KCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmxvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSAkKFwiPGRpdj5cIiArIHJvb20ubG9jYXRpb25zW2ldICsgXCI8L2Rpdj5cIik7XHJcbiAgICAgICAgICAgIGxtLmFwcGVuZChsb2MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsbXBsdXMgPSAkKCc8ZGl2PjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9kaXY+Jyk7XHJcbiAgICAgICAgbG0uYXBwZW5kKGxtcGx1cyk7XHJcbiAgICAgICAgbG0uY2hpbGRyZW4oKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvY25hbWUgPSBwcm9tcHQoXCJOZXcgbG9jYXRpb24gbmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2NuYW1lICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwibmV3IGxvY2F0aW9uXCIsIGxvY25hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJjaGFuZ2UgbG9jYXRpb25cIiwgZS50YXJnZXQudGV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5ib2FyZC5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3X2xheWVyID0gcm9vbS5ib2FyZC5sYXllcnNbaV07XHJcbiAgICAgICAgICAgIC8vIFVJIGNoYW5nZXNcclxuICAgICAgICAgICAgbGF5ZXJzZGl2LmFwcGVuZChcIjxjYW52YXMgaWQ9J1wiICsgbmV3X2xheWVyLm5hbWUgKyBcIi1sYXllcicgc3R5bGU9J3otaW5kZXg6IFwiICsgaSArIFwiJz48L2NhbnZhcz5cIik7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuc2VsZWN0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGV4dHJhID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPT09IDApIGV4dHJhID0gXCIgY2xhc3M9J2xheWVyLXNlbGVjdGVkJ1wiO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZCgndWwnKS5hcHBlbmQoXCI8bGkgaWQ9J3NlbGVjdC1cIiArIG5ld19sYXllci5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgbmV3X2xheWVyLm5hbWUgKyBcIjwvYT48L2xpPlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGFibGVfbGF5ZXJzICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PiQoJyMnICsgbmV3X2xheWVyLm5hbWUgKyAnLWxheWVyJylbMF07XHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBTdGF0ZSBjaGFuZ2VzXHJcbiAgICAgICAgICAgIGxldCBsOiBMYXllcjtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBHcmlkTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld19sYXllci5uYW1lID09PSAnZm93JylcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgRk9XTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGwuc2VsZWN0YWJsZSA9IG5ld19sYXllci5zZWxlY3RhYmxlO1xyXG4gICAgICAgICAgICBsLnBsYXllcl9lZGl0YWJsZSA9IG5ld19sYXllci5wbGF5ZXJfZWRpdGFibGU7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5hZGRMYXllcihsKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUobmV3X2xheWVyLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiI2dyaWQtbGF5ZXJcIikuZHJvcHBhYmxlKHtcclxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6IFwiLmRyYWdnYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyb3A6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIHRvIGRyb3AgdGhlIHRva2VuIG9uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpDYW52YXMgPSAkKGwuY2FudmFzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGpDYW52YXMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIG1pc3NpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gakNhbnZhcy5vZmZzZXQoKSE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSBuZXcgTG9jYWxQb2ludCh1aS5vZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0LCB1aS5vZmZzZXQudG9wIC0gb2Zmc2V0LnRvcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3NfbWVudS5pcyhcIjp2aXNpYmxlXCIpICYmIGxvYy54IDwgc2V0dGluZ3NfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnkgPCBsb2NhdGlvbnNfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lkdGggPSB1aS5oZWxwZXJbMF0ud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCA9IHVpLmhlbHBlclswXS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdsb2MgPSBsMmcobG9jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1nID0gPEhUTUxJbWFnZUVsZW1lbnQ+dWkuZHJhZ2dhYmxlWzBdLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldChpbWcsIHdsb2MsIGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnNyYyA9IG5ldyBVUkwoaW1nLnNyYykucGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQucmVmUG9pbnQueCA9IE1hdGgucm91bmQoYXNzZXQucmVmUG9pbnQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQucmVmUG9pbnQueSA9IE1hdGgucm91bmQoYXNzZXQucmVmUG9pbnQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQudyA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbC5hZGRTaGFwZShhc3NldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsLnNldFNoYXBlcyhuZXdfbGF5ZXIuc2hhcGVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb3JjZSB0aGUgY29ycmVjdCBvcGFjaXR5IHJlbmRlciBvbiBvdGhlciBsYXllcnMuXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpIS5uYW1lKTtcclxuICAgICAgICAvLyBzb2NrZXQuZW1pdChcImNsaWVudCBpbml0aWFsaXNlZFwiKTtcclxuICAgICAgICB0aGlzLmJvYXJkX2luaXRpYWxpc2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGFibGVfbGF5ZXJzID4gMSkge1xyXG4gICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwibGlcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5pZC5zcGxpdChcIi1cIilbMV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSBsYXllcnNlbGVjdGRpdi5maW5kKFwiI3NlbGVjdC1cIiArIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKTtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lICE9PSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2VsZWN0ZWRMYXllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBvbGQucmVtb3ZlQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIobmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNlcnZlclNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHNoLCBmYWxzZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVNoYXBlKHNoYXBlOiBTZXJ2ZXJTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBzaCk7XHJcbiAgICAgICAgcmVhbF9zaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKHJlYWxfc2hhcGUubGF5ZXIpIS5vblNoYXBlTW92ZShyZWFsX3NoYXBlKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVTaGFwZShkYXRhOiB7c2hhcGU6IFNlcnZlclNoYXBlOyByZWRyYXc6IGJvb2xlYW47fSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChkYXRhLnNoYXBlLCB0cnVlKTtcclxuICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtkYXRhLnNoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSwgc2gpO1xyXG4gICAgICAgIHNoYXBlLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgc2hhcGUuc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICBpZiAoZGF0YS5yZWRyYXcpXHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKGRhdGEuc2hhcGUubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRJbml0aWF0aXZlKGRhdGE6IEluaXRpYXRpdmVEYXRhW10pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmluaXRpYXRpdmVUcmFja2VyLmRhdGEgPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhdGl2ZVRyYWNrZXIucmVkcmF3KCk7XHJcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgdGhpcy5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2xpZW50T3B0aW9ucyhvcHRpb25zOiBDbGllbnRPcHRpb25zKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZENvbG91cilcclxuICAgICAgICAgICAgdGhpcy5ncmlkQ29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZ3JpZENvbG91cik7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZm93Q29sb3VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbk9wdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25PcHRpb25zW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jID0gb3B0aW9ucy5sb2NhdGlvbk9wdGlvbnNbYCR7Z2FtZU1hbmFnZXIucm9vbU5hbWV9LyR7Z2FtZU1hbmFnZXIucm9vbUNyZWF0b3J9LyR7Z2FtZU1hbmFnZXIubG9jYXRpb25OYW1lfWBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYy5wYW5YKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnBhblggPSBsb2MucGFuWDtcclxuICAgICAgICAgICAgICAgIGlmIChsb2MucGFuWSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5wYW5ZID0gbG9jLnBhblk7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9jLnpvb21GYWN0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gbG9jLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiN6b29tZXJcIikuc2xpZGVyKHsgdmFsdWU6IDEgLyBsb2Muem9vbUZhY3RvciB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXllck1hbmFnZXIuZ2V0R3JpZExheWVyKCkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0R3JpZExheWVyKCkhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubGV0IGdhbWVNYW5hZ2VyID0gbmV3IEdhbWVNYW5hZ2VyKCk7XHJcbig8YW55PndpbmRvdykuZ2FtZU1hbmFnZXIgPSBnYW1lTWFuYWdlcjtcclxuKDxhbnk+d2luZG93KS5HUCA9IEdsb2JhbFBvaW50O1xyXG4oPGFueT53aW5kb3cpLkFzc2V0ID0gQXNzZXQ7XHJcblxyXG4vLyAqKioqIFNFVFVQIFVJICoqKipcclxuXHJcbi8vIHByZXZlbnQgZG91YmxlIGNsaWNraW5nIHRleHQgc2VsZWN0aW9uXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgJG1lbnUuaGlkZSgpO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlRG93bihlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlTW92ZShlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZVVwKGUpO1xyXG59XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBvblBvaW50ZXJEb3duKTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVyTW92ZSk7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblBvaW50ZXJVcCk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKGUuYnV0dG9uICE9PSAyIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbkNvbnRleHRNZW51KGUpO1xyXG59KTtcclxuXHJcbiQoXCIjem9vbWVyXCIpLnNsaWRlcih7XHJcbiAgICBvcmllbnRhdGlvbjogXCJ2ZXJ0aWNhbFwiLFxyXG4gICAgbWluOiAwLjUsXHJcbiAgICBtYXg6IDUuMCxcclxuICAgIHN0ZXA6IDAuMSxcclxuICAgIHZhbHVlOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcixcclxuICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBuZXdaID0gMSAvIHVpLnZhbHVlITtcclxuICAgICAgICBjb25zdCBvcmlnWCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gb3JpZ1o7XHJcbiAgICAgICAgY29uc3QgbmV3WCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gbmV3WjtcclxuICAgICAgICBjb25zdCBvcmlnWSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIG9yaWdaO1xyXG4gICAgICAgIGNvbnN0IG5ld1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBuZXdaO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gbmV3WjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCAtPSAob3JpZ1ggLSBuZXdYKSAvIDI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgLT0gKG9yaWdZIC0gbmV3WSkgLyAyO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7XHJcbiAgICAgICAgICAgIGxvY2F0aW9uT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXToge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhblg6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhblk6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZLFxyXG4gICAgICAgICAgICAgICAgICAgIHpvb21GYWN0b3I6IG5ld1osXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG4kbWVudS5oaWRlKCk7XHJcblxyXG5jb25zdCBzZXR0aW5nc19tZW51ID0gJChcIiNtZW51XCIpITtcclxuY29uc3QgbG9jYXRpb25zX21lbnUgPSAkKFwiI2xvY2F0aW9ucy1tZW51XCIpITtcclxuY29uc3QgbGF5ZXJfbWVudSA9ICQoXCIjbGF5ZXJzZWxlY3RcIikhO1xyXG4kKFwiI3NlbGVjdGlvbi1tZW51XCIpLmhpZGUoKTtcclxuXHJcbiQoJyNybS1zZXR0aW5ncycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gb3JkZXIgb2YgYW5pbWF0aW9uIGlzIGltcG9ydGFudCwgaXQgb3RoZXJ3aXNlIHdpbGwgc29tZXRpbWVzIHNob3cgYSBzbWFsbCBnYXAgYmV0d2VlbiB0aGUgdHdvIG9iamVjdHNcclxuICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiB9KTtcclxuICAgICAgICBzZXR0aW5nc19tZW51LmFuaW1hdGUoeyB3aWR0aDogJ3RvZ2dsZScgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiLCB3aWR0aDogXCIrPTIwMHB4XCIgfSk7XHJcbiAgICAgICAgbGF5ZXJfbWVudS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgbGVmdDogXCIrPTIwMHB4XCIsIHdpZHRoOiBcIi09MjAwcHhcIiB9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG4kKCcjcm0tbG9jYXRpb25zJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyB0b3A6IFwiLT0xMDBweFwiIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBoZWlnaHQ6ICd0b2dnbGUnIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgaGVpZ2h0OiAndG9nZ2xlJyB9KTtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyB0b3A6IFwiKz0xMDBweFwiIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRXaWR0aCh3aW5kb3cuaW5uZXJXaWR0aCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0SGVpZ2h0KHdpbmRvdy5pbm5lckhlaWdodCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5cclxuJCgnYm9keScpLmtleXVwKGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAoZS5rZXlDb2RlID09PSA0NiAmJiBlLnRhcmdldC50YWdOYW1lICE9PSBcIklOUFVUXCIpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIgc2VsZWN0ZWQgZm9yIGRlbGV0ZSBvcGVyYXRpb25cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBsLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgbC5yZW1vdmVTaGFwZShzZWwsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShzZWwudXVpZCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoXCIjZ3JpZFNpemVJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgZ3MgPSBwYXJzZUludCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBncmlkc2l6ZVwiLCBncyk7XHJcbn0pO1xyXG5cclxuJChcIiN1bml0U2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1cyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVuaXRTaXplKHVzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICd1bml0U2l6ZSc6IHVzIH0pO1xyXG59KTtcclxuJChcIiN1c2VHcmlkSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVnID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVzZUdyaWQodWcpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VzZUdyaWQnOiB1ZyB9KTtcclxufSk7XHJcbiQoXCIjdXNlRk9XSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVmID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZ1bGxGT1codWYpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ2Z1bGxGT1cnOiB1ZiB9KTtcclxufSk7XHJcbiQoXCIjZm93T3BhY2l0eVwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgbGV0IGZvID0gcGFyc2VGbG9hdCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGlmIChpc05hTihmbykpIHtcclxuICAgICAgICAkKFwiI2Zvd09wYWNpdHlcIikudmFsKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mb3dPcGFjaXR5KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoZm8gPCAwKSBmbyA9IDA7XHJcbiAgICBpZiAoZm8gPiAxKSBmbyA9IDE7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0Rk9XT3BhY2l0eShmbyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAnZm93T3BhY2l0eSc6IGZvIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVNYW5hZ2VyOyIsImltcG9ydCBCYXNlUmVjdCBmcm9tIFwiLi9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgZzJseCwgZzJseSwgZzJseiB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IFNlcnZlckFzc2V0IH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXNzZXQgZXh0ZW5kcyBCYXNlUmVjdCB7XHJcbiAgICB0eXBlID0gXCJhc3NldFwiO1xyXG4gICAgaW1nOiBIVE1MSW1hZ2VFbGVtZW50O1xyXG4gICAgc3JjOiBzdHJpbmcgPSAnJztcclxuICAgIGNvbnN0cnVjdG9yKGltZzogSFRNTEltYWdlRWxlbWVudCwgdG9wbGVmdDogR2xvYmFsUG9pbnQsIHc6IG51bWJlciwgaDogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIodG9wbGVmdCwgdywgaCk7XHJcbiAgICAgICAgaWYgKHV1aWQgIT09IHVuZGVmaW5lZCkgdGhpcy51dWlkID0gdXVpZDtcclxuICAgICAgICB0aGlzLmltZyA9IGltZztcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgc3JjOiB0aGlzLnNyY1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBmcm9tRGljdChkYXRhOiBTZXJ2ZXJBc3NldCkge1xyXG4gICAgICAgIHN1cGVyLmZyb21EaWN0KGRhdGEpO1xyXG4gICAgICAgIHRoaXMuc3JjID0gZGF0YS5zcmM7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIGcybHgodGhpcy5yZWZQb2ludC54KSwgZzJseSh0aGlzLnJlZlBvaW50LnkpLCBnMmx6KHRoaXMudyksIGcybHoodGhpcy5oKSk7XHJcbiAgICB9XHJcbiAgICBnZXRJbml0aWF0aXZlUmVwcigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXHJcbiAgICAgICAgICAgIHZpc2libGU6ICFnYW1lTWFuYWdlci5JU19ETSxcclxuICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICBzcmM6IFwiXCIsXHJcbiAgICAgICAgICAgIG93bmVyczogdGhpcy5vd25lcnNcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQsIFZlY3RvciB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHkgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFic3RyYWN0IGNsYXNzIEJhc2VSZWN0IGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdzogbnVtYmVyO1xyXG4gICAgaDogbnVtYmVyO1xyXG4gICAgY29uc3RydWN0b3IodG9wbGVmdDogR2xvYmFsUG9pbnQsIHc6IG51bWJlciwgaDogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIodG9wbGVmdCwgdXVpZCk7XHJcbiAgICAgICAgdGhpcy53ID0gdztcclxuICAgICAgICB0aGlzLmggPSBoO1xyXG4gICAgfVxyXG4gICAgZ2V0QmFzZURpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oc3VwZXIuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICB3OiB0aGlzLncsXHJcbiAgICAgICAgICAgIGg6IHRoaXMuaFxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLnJlZlBvaW50LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54IDw9IHBvaW50LnggJiYgKHRoaXMucmVmUG9pbnQueCArIHRoaXMudykgPj0gcG9pbnQueCAmJlxyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgPD0gcG9pbnQueSAmJiAodGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSA+PSBwb2ludC55O1xyXG4gICAgfVxyXG4gICAgaW5Db3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50LCBjb3JuZXI6IHN0cmluZykge1xyXG4gICAgICAgIHN3aXRjaCAoY29ybmVyKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ25lJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgKyAzICYmIHRoaXMucmVmUG9pbnQueSAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIDM7XHJcbiAgICAgICAgICAgIGNhc2UgJ253JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyAzICYmIHRoaXMucmVmUG9pbnQueSAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIDM7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N3JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyAzICYmIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCArIDM7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgKyAzICYmIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCArIDM7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCk6IHN0cmluZ3x1bmRlZmluZWQge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm5lXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJuZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInN3XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzd1wiO1xyXG4gICAgfVxyXG4gICAgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBHbG9iYWxQb2ludCk6IEdsb2JhbFBvaW50IHwgdm9pZCB7XHJcbiAgICAgICAgaWYgKGNlbnRlclBvaW50ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LmFkZChuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7eDogdGhpcy53LzIsIHk6IHRoaXMuaC8yfSkpO1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQueCA9IGNlbnRlclBvaW50LnggLSB0aGlzLncgLyAyO1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQueSA9IGNlbnRlclBvaW50LnkgLSB0aGlzLmggLyAyO1xyXG4gICAgfVxyXG5cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuICEoZzJseCh0aGlzLnJlZlBvaW50LngpID4gY2FudmFzLndpZHRoIHx8IGcybHkodGhpcy5yZWZQb2ludC55KSA+IGNhbnZhcy5oZWlnaHQgfHxcclxuICAgICAgICAgICAgICAgICAgICBnMmx4KHRoaXMucmVmUG9pbnQueCArIHRoaXMudykgPCAwIHx8IGcybHkodGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSA8IDApO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCwgZ2V0UG9pbnREaXN0YW5jZSwgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBsMmd4LCBsMmd5IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCb3VuZGluZ1JlY3Qge1xyXG4gICAgdHlwZSA9IFwiYm91bmRyZWN0XCI7XHJcbiAgICByZWZQb2ludDogR2xvYmFsUG9pbnQ7XHJcbiAgICB3OiBudW1iZXI7XHJcbiAgICBoOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IodG9wbGVmdDogR2xvYmFsUG9pbnQsIHc6IG51bWJlciwgaDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludCA9IHRvcGxlZnQ7XHJcbiAgICAgICAgdGhpcy53ID0gdztcclxuICAgICAgICB0aGlzLmggPSBoO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggPD0gcG9pbnQueCAmJiAodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA+PSBwb2ludC54ICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA8PSBwb2ludC55ICYmICh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpID49IHBvaW50Lnk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJzZWN0c1dpdGgob3RoZXI6IEJvdW5kaW5nUmVjdCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAhKG90aGVyLnJlZlBvaW50LnggPj0gdGhpcy5yZWZQb2ludC54ICsgdGhpcy53IHx8XHJcbiAgICAgICAgICAgIG90aGVyLnJlZlBvaW50LnggKyBvdGhlci53IDw9IHRoaXMucmVmUG9pbnQueCB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC55ID49IHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC55ICsgb3RoZXIuaCA8PSB0aGlzLnJlZlBvaW50LnkpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW50ZXJzZWN0V2l0aExpbmUobGluZTogeyBzdGFydDogR2xvYmFsUG9pbnQ7IGVuZDogR2xvYmFsUG9pbnQgfSkge1xyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gW1xyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LngsIHRoaXMucmVmUG9pbnQueSksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54ICsgdGhpcy53LCB0aGlzLnJlZlBvaW50LnkpLCBuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54ICsgdGhpcy53LCB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpLCBsaW5lLnN0YXJ0LCBsaW5lLmVuZCksXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55KSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LngsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IG1pbl9kID0gSW5maW5pdHk7XHJcbiAgICAgICAgbGV0IG1pbl9pID0gbnVsbDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGwgPSBsaW5lc1tpXTtcclxuICAgICAgICAgICAgaWYgKGwuaW50ZXJzZWN0ID09PSBudWxsKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgZCA9IGdldFBvaW50RGlzdGFuY2UobGluZS5zdGFydCwgbC5pbnRlcnNlY3QpO1xyXG4gICAgICAgICAgICBpZiAobWluX2QgPiBkKSB7XHJcbiAgICAgICAgICAgICAgICBtaW5fZCA9IGQ7XHJcbiAgICAgICAgICAgICAgICBtaW5faSA9IGwuaW50ZXJzZWN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IGludGVyc2VjdDogbWluX2ksIGRpc3RhbmNlOiBtaW5fZCB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IHsgZzJsLCBnMmx4LCBnMmx5IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyQ2lyY2xlIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2lyY2xlIGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdHlwZSA9IFwiY2lyY2xlXCI7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBib3JkZXI6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKGNlbnRlcjogR2xvYmFsUG9pbnQsIHI6IG51bWJlciwgZmlsbD86IHN0cmluZywgYm9yZGVyPzogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoY2VudGVyLCB1dWlkKTtcclxuICAgICAgICB0aGlzLnIgPSByIHx8IDE7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICAgICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB9O1xyXG4gICAgYXNEaWN0KCk6IFNlcnZlckNpcmNsZSB7XHJcbiAgICAgICAgLy8gY29uc3QgYmFzZSA9IDxTZXJ2ZXJDaXJjbGU+dGhpcy5nZXRCYXNlRGljdCgpO1xyXG4gICAgICAgIC8vIGJhc2UuciA9IHRoaXMucjtcclxuICAgICAgICAvLyBiYXNlLmJvcmRlciA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgIC8vIHJldHVybiBiYXNlO1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICByOiB0aGlzLnIsXHJcbiAgICAgICAgICAgIGJvcmRlcjogdGhpcy5ib3JkZXJcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlckNpcmNsZSkge1xyXG4gICAgICAgIHN1cGVyLmZyb21EaWN0KGRhdGEpO1xyXG4gICAgICAgIHRoaXMuciA9IGRhdGEucjtcclxuICAgICAgICBpZihkYXRhLmJvcmRlcilcclxuICAgICAgICAgICAgdGhpcy5ib3JkZXIgPSBkYXRhLmJvcmRlcjtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCAtIHRoaXMuciwgdGhpcy5yZWZQb2ludC55IC0gdGhpcy5yKSwgdGhpcy5yICogMiwgdGhpcy5yICogMik7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IGcybCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdGhpcy5yLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAocG9pbnQueCAtIHRoaXMucmVmUG9pbnQueCkgKiogMiArIChwb2ludC55IC0gdGhpcy5yZWZQb2ludC55KSAqKiAyIDwgdGhpcy5yICoqIDI7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvL1RPRE9cclxuICAgIH1cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic2VcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInNlXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQge1xyXG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludDtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gY2VudGVyUG9pbnQ7XHJcbiAgICB9XHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IHV1aWR2NCB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwb3B1bGF0ZUVkaXRBc3NldERpYWxvZyhzZWxmOiBTaGFwZSkge1xyXG4gICAgJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbChzZWxmLnV1aWQpO1xyXG4gICAgY29uc3QgZGlhbG9nX25hbWUgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW5hbWVcIik7XHJcbiAgICBkaWFsb2dfbmFtZS52YWwoc2VsZi5uYW1lKTtcclxuICAgIGRpYWxvZ19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgcy5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAkKFwiI3NlbGVjdGlvbi1uYW1lXCIpLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkaWFsb2dfbGlnaHRibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbGlnaHRibG9ja2VyXCIpO1xyXG4gICAgZGlhbG9nX2xpZ2h0YmxvY2sucHJvcChcImNoZWNrZWRcIiwgc2VsZi52aXNpb25PYnN0cnVjdGlvbik7XHJcbiAgICBkaWFsb2dfbGlnaHRibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgcy52aXNpb25PYnN0cnVjdGlvbiA9IGRpYWxvZ19saWdodGJsb2NrLnByb3AoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICBzLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBkaWFsb2dfbW92ZWJsb2NrID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1tb3ZlYmxvY2tlclwiKTtcclxuICAgIGRpYWxvZ19tb3ZlYmxvY2sucHJvcChcImNoZWNrZWRcIiwgc2VsZi5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgIGRpYWxvZ19tb3ZlYmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgIHMuc2V0TW92ZW1lbnRCbG9jayhkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBvd25lcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW93bmVyc1wiKTtcclxuICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy10cmFja2Vyc1wiKTtcclxuICAgIGNvbnN0IGF1cmFzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1hdXJhc1wiKTtcclxuICAgIG93bmVycy5uZXh0VW50aWwodHJhY2tlcnMpLnJlbW92ZSgpO1xyXG4gICAgdHJhY2tlcnMubmV4dFVudGlsKGF1cmFzKS5yZW1vdmUoKTtcclxuICAgIGF1cmFzLm5leHRVbnRpbCgkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmZpbmQoXCJmb3JtXCIpKS5yZW1vdmUoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRPd25lcihvd25lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qgb3dfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtbmFtZT1cIiR7b3duZXJ9XCIgdmFsdWU9XCIke293bmVyfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCBvd19yZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgdHJhY2tlcnMuYmVmb3JlKG93X25hbWUuYWRkKG93X3JlbW92ZSkpO1xyXG5cclxuICAgICAgICBvd19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgaWYgKG93X2kgPj0gMClcclxuICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxLCA8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5wdXNoKDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG93X3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGYub3duZXJzLmZvckVhY2goYWRkT3duZXIpO1xyXG4gICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKVxyXG4gICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZFRyYWNrZXIodHJhY2tlcjogVHJhY2tlcikge1xyXG4gICAgICAgIGNvbnN0IHRyX25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci5uYW1lfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCB0cl92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci52YWx1ZX1cIj5gKTtcclxuICAgICAgICBjb25zdCB0cl9tYXh2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIk1heCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLm1heHZhbHVlIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgdHJfdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IHRyX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICBhdXJhcy5iZWZvcmUoXHJcbiAgICAgICAgICAgIHRyX25hbWVcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+Lzwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl9tYXh2YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl9yZW1vdmUpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCF0cmFja2VyLnZpc2libGUpXHJcbiAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICB0cl9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTmFtZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LW5hbWVgKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLnRyYWNrZXJzLmxlbmd0aCB8fCBzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnB1c2goeyB1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAwLCBtYXh2YWx1ZTogMCwgdmlzaWJsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICBhZGRUcmFja2VyKHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0cl92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWYWx1ZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdHJfbWF4dmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWF6dmFsdWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ci5tYXh2YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVtb3ZlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHIubmFtZSA9PT0gJycgfHwgdHIudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3RyLnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnNwbGljZShzZWxmLnRyYWNrZXJzLmluZGV4T2YodHIpLCAxKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZpc2liaWxpdHkgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHIudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgdHIudmlzaWJsZSA9ICF0ci52aXNpYmxlO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxmLnRyYWNrZXJzLmZvckVhY2goYWRkVHJhY2tlcik7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkQXVyYShhdXJhOiBBdXJhKSB7XHJcbiAgICAgICAgY29uc3QgYXVyYV9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS52YWx1ZX1cIj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX2RpbXZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiRGltIHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEuZGltIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9jb2xvdXIgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkF1cmEgY29sb3VyXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9saWdodCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtbGlnaHRidWxiXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfcmVtb3ZlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuY2hpbGRyZW4oKS5sYXN0KCkuYXBwZW5kKFxyXG4gICAgICAgICAgICBhdXJhX25hbWVcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfZGltdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZCgkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApLmFwcGVuZChhdXJhX2NvbG91cikuYXBwZW5kKCQoXCI8L2Rpdj5cIikpKVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX3Zpc2libGUpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfbGlnaHQpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfcmVtb3ZlKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghYXVyYS52aXNpYmxlKVxyXG4gICAgICAgICAgICBhdXJhX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgIGlmICghYXVyYS5saWdodFNvdXJjZSlcclxuICAgICAgICAgICAgYXVyYV9saWdodC5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcblxyXG4gICAgICAgIGF1cmFfY29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBhdXJhLmNvbG91cixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gbW92ZSB1bmtub3duIGF1cmEgY29sb3VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIERvIG5vdCB1c2UgYXVyYSBkaXJlY3RseSBhcyBpdCBkb2VzIG5vdCB3b3JrIHByb3Blcmx5IGZvciBuZXcgYXVyYXNcclxuICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYXVyYV9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSBuYW1lIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLmF1cmFzLmxlbmd0aCB8fCBzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIHZhbHVlIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX2RpbXZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgZGltdmFsdWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1LnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYXUubmFtZSA9PT0gJycgJiYgYXUudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke2F1LnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLmF1cmFzLnNwbGljZShzZWxmLmF1cmFzLmluZGV4T2YoYXUpLCAxKTtcclxuICAgICAgICAgICAgc2VsZi5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgdmlzaWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUudmlzaWJsZSA9ICFhdS52aXNpYmxlO1xyXG4gICAgICAgICAgICBpZiAoYXUudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV9saWdodC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHRvZ2dsZSBsaWdodCBjYXBhYmlsaXR5IG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS5saWdodFNvdXJjZSA9ICFhdS5saWdodFNvdXJjZTtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIGxzLnB1c2goeyBzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxmLmF1cmFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW2ldKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZ2FtZU1hbmFnZXIuc2hhcGVTZWxlY3Rpb25EaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuXHJcbiAgICAkKCcuc2VsZWN0aW9uLXRyYWNrZXItdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKHRyYWNrZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB1cGRhdGUgdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG5ld190cmFja2VyID0gcHJvbXB0KGBOZXcgICR7dHJhY2tlci5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgIGlmIChuZXdfdHJhY2tlciA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGlmICh0cmFja2VyLnZhbHVlID09PSAwKVxyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlID0gMDtcclxuICAgICAgICBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlICs9IHBhcnNlSW50KG5ld190cmFja2VyLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5ld190cmFja2VyWzBdID09PSAnLScpIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSAtPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSA9IHBhcnNlSW50KG5ld190cmFja2VyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAkKHRoaXMpLnRleHQodmFsKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICB9KTtcclxuICAgICQoJy5zZWxlY3Rpb24tYXVyYS12YWx1ZScpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICBjb25zdCBhdXJhID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbmV3X2F1cmEgPSBwcm9tcHQoYE5ldyAgJHthdXJhLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XHJcbiAgICAgICAgaWYgKG5ld19hdXJhID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApXHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgPSAwO1xyXG4gICAgICAgIGlmIChuZXdfYXVyYVswXSA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobmV3X2F1cmFbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlIC09IHBhcnNlSW50KG5ld19hdXJhLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlID0gcGFyc2VJbnQobmV3X2F1cmEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH0pO1xyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHkgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJMaW5lIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGluZSBleHRlbmRzIFNoYXBlIHtcclxuICAgIHR5cGUgPSBcImxpbmVcIjtcclxuICAgIGVuZFBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIGNvbnN0cnVjdG9yKHN0YXJ0UG9pbnQ6IEdsb2JhbFBvaW50LCBlbmRQb2ludDogR2xvYmFsUG9pbnQsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcihzdGFydFBvaW50LCB1dWlkKTtcclxuICAgICAgICB0aGlzLmVuZFBvaW50ID0gZW5kUG9pbnQ7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIGVuZFBvaW50WDogdGhpcy5lbmRQb2ludC54LFxyXG4gICAgICAgICAgICBlbmRQb2ludFk6IHRoaXMuZW5kUG9pbnQueSxcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdChcclxuICAgICAgICAgICAgbmV3IEdsb2JhbFBvaW50KFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5yZWZQb2ludC54LCB0aGlzLmVuZFBvaW50LngpLFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5yZWZQb2ludC54LCB0aGlzLmVuZFBvaW50LnkpLFxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLnJlZlBvaW50LnggLSB0aGlzLmVuZFBvaW50LngpLFxyXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLnJlZlBvaW50LnkgLSB0aGlzLmVuZFBvaW50LnkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8oZzJseCh0aGlzLnJlZlBvaW50LngpLCBnMmx5KHRoaXMucmVmUG9pbnQueSkpO1xyXG4gICAgICAgIGN0eC5saW5lVG8oZzJseCh0aGlzLmVuZFBvaW50LngpLCBnMmx5KHRoaXMuZW5kUG9pbnQueSkpO1xyXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwwLDAsIDAuNSknO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAzO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xyXG4gICAgfVxyXG5cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQgeyB9IC8vIFRPRE9cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmd8dW5kZWZpbmVkIHsgcmV0dXJuIFwiXCIgfTsgLy8gVE9ET1xyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xyXG59IiwiaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL2Jhc2VyZWN0XCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBnMmwgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJSZWN0IH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVjdCBleHRlbmRzIEJhc2VSZWN0IHtcclxuICAgIHR5cGUgPSBcInJlY3RcIlxyXG4gICAgYm9yZGVyOiBzdHJpbmc7XHJcbiAgICBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIsIGZpbGw/OiBzdHJpbmcsIGJvcmRlcj86IHN0cmluZywgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHRvcGxlZnQsIHcsIGgsIHV1aWQpO1xyXG4gICAgICAgIHRoaXMuZmlsbCA9IGZpbGwgfHwgJyMwMDAnO1xyXG4gICAgICAgIHRoaXMuYm9yZGVyID0gYm9yZGVyIHx8IFwicmdiYSgwLCAwLCAwLCAwKVwiO1xyXG4gICAgfVxyXG4gICAgYXNEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICBib3JkZXI6IHRoaXMuYm9yZGVyXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlclJlY3QpIHtcclxuICAgICAgICBzdXBlci5mcm9tRGljdChkYXRhKTtcclxuICAgICAgICBpZiAoZGF0YS5ib3JkZXIpXHJcbiAgICAgICAgICAgIHRoaXMuYm9yZGVyID0gZGF0YS5ib3JkZXI7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XHJcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IGcybCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICBjdHguZmlsbFJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlUmVjdChsb2MueCwgbG9jLnksIHRoaXMudyAqIHosIHRoaXMuaCAqIHopO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IHV1aWR2NCB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IGcybCwgZzJsciB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBwb3B1bGF0ZUVkaXRBc3NldERpYWxvZyB9IGZyb20gXCIuL2VkaXRkaWFsb2dcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQsIExvY2FsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJTaGFwZSB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBTaGFwZSB7XHJcbiAgICAvLyBVc2VkIHRvIGNyZWF0ZSBjbGFzcyBpbnN0YW5jZSBmcm9tIHNlcnZlciBzaGFwZSBkYXRhXHJcbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHlwZTogc3RyaW5nO1xyXG4gICAgLy8gVGhlIHVuaXF1ZSBJRCBvZiB0aGlzIHNoYXBlXHJcbiAgICB1dWlkOiBzdHJpbmc7XHJcbiAgICAvLyBUaGUgbGF5ZXIgdGhlIHNoYXBlIGlzIGN1cnJlbnRseSBvblxyXG4gICAgbGF5ZXIhOiBzdHJpbmc7XHJcblxyXG4gICAgLy8gQSByZWZlcmVuY2UgcG9pbnQgcmVnYXJkaW5nIHRoYXQgc3BlY2lmaWMgc2hhcGUncyBzdHJ1Y3R1cmVcclxuICAgIHJlZlBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIFxyXG4gICAgLy8gRmlsbCBjb2xvdXIgb2YgdGhlIHNoYXBlXHJcbiAgICBmaWxsOiBzdHJpbmcgPSAnIzAwMCc7XHJcbiAgICAvL1RoZSBvcHRpb25hbCBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2hhcGVcclxuICAgIG5hbWUgPSAnVW5rbm93biBzaGFwZSc7XHJcblxyXG4gICAgLy8gQXNzb2NpYXRlZCB0cmFja2Vycy9hdXJhcy9vd25lcnNcclxuICAgIHRyYWNrZXJzOiBUcmFja2VyW10gPSBbXTtcclxuICAgIGF1cmFzOiBBdXJhW10gPSBbXTtcclxuICAgIG93bmVyczogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICAvLyBCbG9jayBsaWdodCBzb3VyY2VzXHJcbiAgICB2aXNpb25PYnN0cnVjdGlvbiA9IGZhbHNlO1xyXG4gICAgLy8gUHJldmVudCBzaGFwZXMgZnJvbSBvdmVybGFwcGluZyB3aXRoIHRoaXMgc2hhcGVcclxuICAgIG1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBEcmF3IG1vZHVzIHRvIHVzZVxyXG4gICAgZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uOiBzdHJpbmcgPSBcInNvdXJjZS1vdmVyXCI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocmVmUG9pbnQ6IEdsb2JhbFBvaW50LCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludCA9IHJlZlBvaW50O1xyXG4gICAgICAgIHRoaXMudXVpZCA9IHV1aWQgfHwgdXVpZHY0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0O1xyXG5cclxuICAgIC8vIElmIGluV29ybGRDb29yZCBpcyBcclxuICAgIGFic3RyYWN0IGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW47XHJcblxyXG4gICAgYWJzdHJhY3QgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgYWJzdHJhY3QgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgYWJzdHJhY3QgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuO1xyXG5cclxuICAgIGNoZWNrTGlnaHRTb3VyY2VzKCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnN0IHZvX2kgPSBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmluZGV4T2YodGhpcy51dWlkKTtcclxuICAgICAgICBpZiAodGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgdm9faSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGxpZ2h0c291cmNlIGF1cmFzIGFyZSBpbiB0aGUgZ2FtZU1hbmFnZXJcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgICAgICBjb25zdCBpID0gbHMuZmluZEluZGV4KG8gPT4gby5hdXJhID09PSBhdS51dWlkKTtcclxuICAgICAgICAgICAgaWYgKGF1LmxpZ2h0U291cmNlICYmIGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBscy5wdXNoKHsgc2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZCB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghYXUubGlnaHRTb3VyY2UgJiYgaSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBscy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBDaGVjayBpZiBhbnl0aGluZyBpbiB0aGUgZ2FtZU1hbmFnZXIgcmVmZXJlbmNpbmcgdGhpcyBzaGFwZSBpcyBpbiBmYWN0IHN0aWxsIGEgbGlnaHRzb3VyY2VcclxuICAgICAgICBmb3IgKGxldCBpID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzW2ldO1xyXG4gICAgICAgICAgICBpZiAobHMuc2hhcGUgPT09IHNlbGYudXVpZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLmF1cmFzLnNvbWUoYSA9PiBhLnV1aWQgPT09IGxzLmF1cmEgJiYgYS5saWdodFNvdXJjZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRNb3ZlbWVudEJsb2NrKGJsb2Nrc01vdmVtZW50OiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uID0gYmxvY2tzTW92ZW1lbnQgfHwgZmFsc2U7XHJcbiAgICAgICAgY29uc3Qgdm9faSA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuaW5kZXhPZih0aGlzLnV1aWQpO1xyXG4gICAgICAgIGlmICh0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gJiYgdm9faSA9PT0gLTEpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMucHVzaCh0aGlzLnV1aWQpO1xyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gJiYgdm9faSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBvd25lZEJ5KHVzZXJuYW1lPzogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHVzZXJuYW1lID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHVzZXJuYW1lID0gZ2FtZU1hbmFnZXIudXNlcm5hbWU7XHJcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLklTX0RNIHx8IHRoaXMub3duZXJzLmluY2x1ZGVzKHVzZXJuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNlbGVjdGlvbigpIHtcclxuICAgICAgICBpZiAoIXRoaXMudHJhY2tlcnMubGVuZ3RoIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCB0aGlzLnRyYWNrZXJzW3RoaXMudHJhY2tlcnMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApXHJcbiAgICAgICAgICAgIHRoaXMudHJhY2tlcnMucHVzaCh7IHV1aWQ6IHV1aWR2NCgpLCBuYW1lOiAnJywgdmFsdWU6IDAsIG1heHZhbHVlOiAwLCB2aXNpYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICBpZiAoIXRoaXMuYXVyYXMubGVuZ3RoIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApXHJcbiAgICAgICAgICAgIHRoaXMuYXVyYXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiB1dWlkdjQoKSxcclxuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IDAsXHJcbiAgICAgICAgICAgICAgICBkaW06IDAsXHJcbiAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBjb2xvdXI6ICdyZ2JhKDAsMCwwLDApJyxcclxuICAgICAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW5hbWVcIikudGV4dCh0aGlzLm5hbWUpO1xyXG4gICAgICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzZWxlY3Rpb24tdHJhY2tlcnNcIik7XHJcbiAgICAgICAgdHJhY2tlcnMuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLnRyYWNrZXJzLmZvckVhY2goZnVuY3Rpb24gKHRyYWNrZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPiR7dHJhY2tlci5uYW1lfTwvZGl2PmApKTtcclxuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChgPGRpdiBpZD1cInNlbGVjdGlvbi10cmFja2VyLSR7dHJhY2tlci51dWlkfS12YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIGNsYXNzPVwic2VsZWN0aW9uLXRyYWNrZXItdmFsdWVcIj4ke3ZhbH08L2Rpdj5gKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGF1cmFzID0gJChcIiNzZWxlY3Rpb24tYXVyYXNcIik7XHJcbiAgICAgICAgYXVyYXMuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1cmEpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXVyYS5kaW0gPyBgJHthdXJhLnZhbHVlfS8ke2F1cmEuZGltfWAgOiBhdXJhLnZhbHVlO1xyXG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+JHthdXJhLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLWF1cmEtJHthdXJhLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tYXVyYS12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbWVudVwiKS5zaG93KCk7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3QgZWRpdGJ1dHRvbiA9ICQoXCIjc2VsZWN0aW9uLWVkaXQtYnV0dG9uXCIpO1xyXG4gICAgICAgIGlmICghdGhpcy5vd25lZEJ5KCkpXHJcbiAgICAgICAgICAgIGVkaXRidXR0b24uaGlkZSgpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWRpdGJ1dHRvbi5zaG93KCk7XHJcbiAgICAgICAgZWRpdGJ1dHRvbi5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge3BvcHVsYXRlRWRpdEFzc2V0RGlhbG9nKHNlbGYpfSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3Rpb25Mb3NzKCkge1xyXG4gICAgICAgIC8vICQoYCNzaGFwZXNlbGVjdGlvbmNvZy0ke3RoaXMudXVpZH1gKS5yZW1vdmUoKTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1tZW51XCIpLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEbyBub3QgcHJvdmlkZSBnZXRCYXNlRGljdCBhcyB0aGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiB0byBmb3JjZSB0aGUgaW1wbGVtZW50YXRpb25cclxuICAgIGFic3RyYWN0IGFzRGljdCgpOiBTZXJ2ZXJTaGFwZTtcclxuICAgIGdldEJhc2VEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcclxuICAgICAgICAgICAgdXVpZDogdGhpcy51dWlkLFxyXG4gICAgICAgICAgICB4OiB0aGlzLnJlZlBvaW50LngsXHJcbiAgICAgICAgICAgIHk6IHRoaXMucmVmUG9pbnQueSxcclxuICAgICAgICAgICAgbGF5ZXI6IHRoaXMubGF5ZXIsXHJcbiAgICAgICAgICAgIGdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjogdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24sXHJcbiAgICAgICAgICAgIG1vdmVtZW50T2JzdHJ1Y3Rpb246IHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbixcclxuICAgICAgICAgICAgdmlzaW9uT2JzdHJ1Y3Rpb246IHRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24sXHJcbiAgICAgICAgICAgIGF1cmFzOiB0aGlzLmF1cmFzLFxyXG4gICAgICAgICAgICB0cmFja2VyczogdGhpcy50cmFja2VycyxcclxuICAgICAgICAgICAgb3duZXJzOiB0aGlzLm93bmVycyxcclxuICAgICAgICAgICAgZmlsbDogdGhpcy5maWxsLFxyXG4gICAgICAgICAgICBuYW1lOiB0aGlzLm5hbWUsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyU2hhcGUpIHtcclxuICAgICAgICB0aGlzLmxheWVyID0gZGF0YS5sYXllcjtcclxuICAgICAgICB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IGRhdGEuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGRhdGEubW92ZW1lbnRPYnN0cnVjdGlvbjtcclxuICAgICAgICB0aGlzLnZpc2lvbk9ic3RydWN0aW9uID0gZGF0YS52aXNpb25PYnN0cnVjdGlvbjtcclxuICAgICAgICB0aGlzLmF1cmFzID0gZGF0YS5hdXJhcztcclxuICAgICAgICB0aGlzLnRyYWNrZXJzID0gZGF0YS50cmFja2VycztcclxuICAgICAgICB0aGlzLm93bmVycyA9IGRhdGEub3duZXJzO1xyXG4gICAgICAgIGlmIChkYXRhLm5hbWUpXHJcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IGRhdGEubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubGF5ZXIgPT09ICdmb3cnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLW92ZXJcIjtcclxuICAgICAgICB0aGlzLmRyYXdBdXJhcyhjdHgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdBdXJhcyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgICAgICBpZiAoYXVyYS52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBhdXJhLmNvbG91cjtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhLmN0eCA9PT0gY3R4KVxyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcclxuICAgICAgICAgICAgY29uc3QgbG9jID0gZzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgZzJscihhdXJhLnZhbHVlKSwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICBpZiAoYXVyYS5kaW0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRjID0gdGlueWNvbG9yKGF1cmEuY29sb3VyKTtcclxuICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0Yy5zZXRBbHBoYSh0Yy5nZXRBbHBoYSgpIC8gMikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IGcybChzZWxmLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCBnMmxyKGF1cmEuZGltKSwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3dDb250ZXh0TWVudShtb3VzZTogTG9jYWxQb2ludCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBsLnNlbGVjdGlvbiA9IFt0aGlzXTtcclxuICAgICAgICB0aGlzLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgbC5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcztcclxuICAgICAgICAkbWVudS5zaG93KCk7XHJcbiAgICAgICAgJG1lbnUuZW1wdHkoKTtcclxuICAgICAgICAkbWVudS5jc3MoeyBsZWZ0OiBtb3VzZS54LCB0b3A6IG1vdXNlLnkgfSk7XHJcbiAgICAgICAgbGV0IGRhdGEgPSBcIlwiICtcclxuICAgICAgICAgICAgXCI8dWw+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaT5MYXllcjx1bD5cIjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCBzZWwgPSBsYXllci5uYW1lID09PSBsLm5hbWUgPyBcIiBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjphcXVhJyBcIiA6IFwiIFwiO1xyXG4gICAgICAgICAgICBkYXRhICs9IGA8bGkgZGF0YS1hY3Rpb249J3NldExheWVyJyBkYXRhLWxheWVyPScke2xheWVyLm5hbWV9JyAke3NlbH0gY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz4ke2xheWVyLm5hbWV9PC9saT5gO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRhdGEgKz0gXCI8L3VsPjwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvQmFjaycgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGJhY2s8L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J21vdmVUb0Zyb250JyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPk1vdmUgdG8gZnJvbnQ8L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J2FkZEluaXRpYXRpdmUnIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+QWRkIGluaXRpYXRpdmU8L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8L3VsPlwiO1xyXG4gICAgICAgICRtZW51Lmh0bWwoZGF0YSk7XHJcbiAgICAgICAgJChcIi5jb250ZXh0LWNsaWNrYWJsZVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFzc2V0Lm9uQ29udGV4dE1lbnUoJCh0aGlzKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBvbkNvbnRleHRNZW51KG1lbnU6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuICAgICAgICBjb25zdCBhY3Rpb24gPSBtZW51LmRhdGEoXCJhY3Rpb25cIik7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgICAgICBpZiAobGF5ZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vdmVUb0Zyb250JzpcclxuICAgICAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHRoaXMsIGxheWVyLnNoYXBlcy5sZW5ndGggLSAxLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdtb3ZlVG9CYWNrJzpcclxuICAgICAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHRoaXMsIDAsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NldExheWVyJzpcclxuICAgICAgICAgICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKG1lbnUuZGF0YShcImxheWVyXCIpKSEuYWRkU2hhcGUodGhpcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnYWRkSW5pdGlhdGl2ZSc6XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5hZGRJbml0aWF0aXZlKHRoaXMuZ2V0SW5pdGlhdGl2ZVJlcHIoKSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgJG1lbnUuaGlkZSgpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5pdGlhdGl2ZVJlcHIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdXVpZDogdGhpcy51dWlkLFxyXG4gICAgICAgICAgICB2aXNpYmxlOiAhZ2FtZU1hbmFnZXIuSVNfRE0sXHJcbiAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgc3JjOiBcIlwiLFxyXG4gICAgICAgICAgICBvd25lcnM6IHRoaXMub3duZXJzXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgZzJsIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IFNlcnZlclRleHQgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0IGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdHlwZSA9IFwidGV4dFwiO1xyXG4gICAgdGV4dDogc3RyaW5nO1xyXG4gICAgZm9udDogc3RyaW5nO1xyXG4gICAgYW5nbGU6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBHbG9iYWxQb2ludCwgdGV4dDogc3RyaW5nLCBmb250OiBzdHJpbmcsIGFuZ2xlPzogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIocG9zaXRpb24sIHV1aWQpO1xyXG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XHJcbiAgICAgICAgdGhpcy5mb250ID0gZm9udDtcclxuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGUgfHwgMDtcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50ZXh0LFxyXG4gICAgICAgICAgICBmb250OiB0aGlzLmZvbnQsXHJcbiAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy5yZWZQb2ludCwgNSwgNSk7IC8vIFRvZG86IGZpeCB0aGlzIGJvdW5kaW5nIGJveFxyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZm9udCA9IHRoaXMuZm9udDtcclxuICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgIGNvbnN0IGRlc3QgPSBnMmwodGhpcy5yZWZQb2ludCk7XHJcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgY3R4LnJvdGF0ZSh0aGlzLmFuZ2xlKTtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICBjdHguZmlsbFRleHQodGhpcy50ZXh0LCAwLCAtNSk7XHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xyXG4gICAgfVxyXG5cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQgeyB9IC8vIFRPRE9cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmd8dW5kZWZpbmVkIHsgcmV0dXJuIFwiXCIgfTsgLy8gVE9ET1xyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuL3JlY3RcIjtcclxuaW1wb3J0IENpcmNsZSBmcm9tIFwiLi9jaXJjbGVcIjtcclxuaW1wb3J0IExpbmUgZnJvbSBcIi4vbGluZVwiO1xyXG5pbXBvcnQgVGV4dCBmcm9tIFwiLi90ZXh0XCI7XHJcbmltcG9ydCBBc3NldCBmcm9tIFwiLi9hc3NldFwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJTaGFwZSwgU2VydmVyUmVjdCwgU2VydmVyQ2lyY2xlLCBTZXJ2ZXJMaW5lLCBTZXJ2ZXJUZXh0LCBTZXJ2ZXJBc3NldCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlOiBTZXJ2ZXJTaGFwZSwgZHVtbXk/OiBib29sZWFuKSB7XHJcbiAgICAvLyB0b2RvIGlzIHRoaXMgZHVtbXkgc3R1ZmYgYWN0dWFsbHkgbmVlZGVkLCBkbyB3ZSBldmVyIHdhbnQgdG8gcmV0dXJuIHRoZSBsb2NhbCBzaGFwZT9cclxuICAgIGlmIChkdW1teSA9PT0gdW5kZWZpbmVkKSBkdW1teSA9IGZhbHNlO1xyXG4gICAgaWYgKCFkdW1teSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpXHJcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKTtcclxuXHJcbiAgICBsZXQgc2g6IFNoYXBlO1xyXG5cclxuICAgIC8vIEEgZnJvbUpTT04gYW5kIHRvSlNPTiBvbiBTaGFwZSB3b3VsZCBiZSBjbGVhbmVyIGJ1dCB0cyBkb2VzIG5vdCBhbGxvdyBmb3Igc3RhdGljIGFic3RyYWN0cyBzbyB5ZWFoLlxyXG5cclxuICAgIGNvbnN0IHJlZlBvaW50ID0gbmV3IEdsb2JhbFBvaW50KHNoYXBlLngsIHNoYXBlLnkpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdyZWN0Jykge1xyXG4gICAgICAgIGNvbnN0IHJlY3QgPSA8U2VydmVyUmVjdD5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBSZWN0KHJlZlBvaW50LCByZWN0LncsIHJlY3QuaCwgcmVjdC5maWxsLCByZWN0LmJvcmRlciwgcmVjdC51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2NpcmNsZScpIHtcclxuICAgICAgICBjb25zdCBjaXJjID0gPFNlcnZlckNpcmNsZT5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBDaXJjbGUocmVmUG9pbnQsIGNpcmMuciwgY2lyYy5maWxsLCBjaXJjLmJvcmRlciwgY2lyYy51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2xpbmUnKSB7XHJcbiAgICAgICAgY29uc3QgbGluZSA9IDxTZXJ2ZXJMaW5lPnNoYXBlO1xyXG4gICAgICAgIHNoID0gbmV3IExpbmUocmVmUG9pbnQsIG5ldyBHbG9iYWxQb2ludChsaW5lLngyLCBsaW5lLnkyKSk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICd0ZXh0Jykge1xyXG4gICAgICAgIGNvbnN0IHRleHQgPSA8U2VydmVyVGV4dD5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBUZXh0KHJlZlBvaW50LCB0ZXh0LnRleHQsIHRleHQuZm9udCwgdGV4dC5hbmdsZSwgdGV4dC51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2Fzc2V0Jykge1xyXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gPFNlcnZlckFzc2V0PnNoYXBlO1xyXG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZShhc3NldC53LCBhc3NldC5oKTtcclxuICAgICAgICBpZiAoYXNzZXQuc3JjLnN0YXJ0c1dpdGgoXCJodHRwXCIpKVxyXG4gICAgICAgICAgICBpbWcuc3JjID0gbmV3IFVSTChhc3NldC5zcmMpLnBhdGhuYW1lO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgaW1nLnNyYyA9IGFzc2V0LnNyY1xyXG4gICAgICAgIHNoID0gbmV3IEFzc2V0KGltZywgcmVmUG9pbnQsIGFzc2V0LncsIGFzc2V0LmgsIGFzc2V0LnV1aWQpO1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBzaC5mcm9tRGljdChzaGFwZSk7XHJcbiAgICByZXR1cm4gc2g7XHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBhbHBoU29ydCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IHNldHVwVG9vbHMgfSBmcm9tIFwiLi90b29sc1wiO1xyXG5pbXBvcnQgeyBDbGllbnRPcHRpb25zLCBMb2NhdGlvbk9wdGlvbnMsIEFzc2V0TGlzdCwgU2VydmVyU2hhcGUsIEluaXRpYXRpdmVEYXRhLCBCb2FyZEluZm8gfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuXHJcbmNvbnN0IHByb3RvY29sID0gZG9jdW1lbnQuZG9tYWluID09PSAnbG9jYWxob3N0JyA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xyXG5jb25zdCBzb2NrZXQgPSBpby5jb25uZWN0KHByb3RvY29sICsgZG9jdW1lbnQuZG9tYWluICsgXCI6XCIgKyBsb2NhdGlvbi5wb3J0ICsgXCIvcGxhbmFyYWxseVwiKTtcclxuc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJyZWRpcmVjdFwiLCBmdW5jdGlvbiAoZGVzdGluYXRpb246IHN0cmluZykge1xyXG4gICAgY29uc29sZS5sb2coXCJyZWRpcmVjdGluZ1wiKTtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gZGVzdGluYXRpb247XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgcm9vbSBpbmZvXCIsIGZ1bmN0aW9uIChkYXRhOiB7bmFtZTogc3RyaW5nLCBjcmVhdG9yOiBzdHJpbmd9KSB7XHJcbiAgICBnYW1lTWFuYWdlci5yb29tTmFtZSA9IGRhdGEubmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLnJvb21DcmVhdG9yID0gZGF0YS5jcmVhdG9yO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHVzZXJuYW1lXCIsIGZ1bmN0aW9uICh1c2VybmFtZTogc3RyaW5nKSB7XHJcbiAgICBnYW1lTWFuYWdlci51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIuSVNfRE0gPSB1c2VybmFtZSA9PT0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVsyXTtcclxuICAgIGlmICgkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpLmh0bWwoKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgc2V0dXBUb29scygpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGNsaWVudE9wdGlvbnNcIiwgZnVuY3Rpb24gKG9wdGlvbnM6IENsaWVudE9wdGlvbnMpIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldENsaWVudE9wdGlvbnMob3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgbG9jYXRpb25cIiwgZnVuY3Rpb24gKGRhdGE6IHtuYW1lOnN0cmluZywgb3B0aW9uczogTG9jYXRpb25PcHRpb25zfSkge1xyXG4gICAgZ2FtZU1hbmFnZXIubG9jYXRpb25OYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldE9wdGlvbnMoZGF0YS5vcHRpb25zKTtcclxufSk7XHJcbnNvY2tldC5vbihcImFzc2V0IGxpc3RcIiwgZnVuY3Rpb24gKGFzc2V0czogQXNzZXRMaXN0KSB7XHJcbiAgICBjb25zdCBtID0gJChcIiNtZW51LXRva2Vuc1wiKTtcclxuICAgIG0uZW1wdHkoKTtcclxuICAgIGxldCBoID0gJyc7XHJcblxyXG4gICAgY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uIChlbnRyeTogQXNzZXRMaXN0LCBwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBmb2xkZXJzID0gbmV3IE1hcChPYmplY3QuZW50cmllcyhlbnRyeS5mb2xkZXJzKSk7XHJcbiAgICAgICAgZm9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICAgIGggKz0gXCI8YnV0dG9uIGNsYXNzPSdhY2NvcmRpb24nPlwiICsga2V5ICsgXCI8L2J1dHRvbj48ZGl2IGNsYXNzPSdhY2NvcmRpb24tcGFuZWwnPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1zdWJwYW5lbCc+XCI7XHJcbiAgICAgICAgICAgIHByb2Nlc3ModmFsdWUsIHBhdGggKyBrZXkgKyBcIi9cIik7XHJcbiAgICAgICAgICAgIGggKz0gXCI8L2Rpdj48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5zb3J0KGFscGhTb3J0KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChhc3NldCkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGRpdiBjbGFzcz0nZHJhZ2dhYmxlIHRva2VuJz48aW1nIHNyYz0nL3N0YXRpYy9pbWcvYXNzZXRzL1wiICsgcGF0aCArIGFzc2V0ICsgXCInIHdpZHRoPSczNSc+XCIgKyBhc3NldCArIFwiPGkgY2xhc3M9J2ZhcyBmYS1jb2cnPjwvaT48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBwcm9jZXNzKGFzc2V0cywgXCJcIik7XHJcbiAgICBtLmh0bWwoaCk7XHJcbiAgICAkKFwiLmRyYWdnYWJsZVwiKS5kcmFnZ2FibGUoe1xyXG4gICAgICAgIGhlbHBlcjogXCJjbG9uZVwiLFxyXG4gICAgICAgIGFwcGVuZFRvOiBcIiNib2FyZFwiXHJcbiAgICB9KTtcclxuICAgICQoJy5hY2NvcmRpb24nKS5lYWNoKGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgICAkKHRoaXMpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKFwiYWNjb3JkaW9uLWFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5uZXh0KCkudG9nZ2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcbnNvY2tldC5vbihcImJvYXJkIGluaXRcIiwgZnVuY3Rpb24gKGxvY2F0aW9uX2luZm86IEJvYXJkSW5mbykge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0dXBCb2FyZChsb2NhdGlvbl9pbmZvKVxyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGdyaWRzaXplXCIsIGZ1bmN0aW9uIChncmlkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3JpZFNpemUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYWRkIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmFkZFNoYXBlKHNoYXBlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInJlbW92ZSBzaGFwZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biBzaGFwZWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgIGxheWVyLnJlbW92ZVNoYXBlKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSEsIGZhbHNlKTtcclxuICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwibW92ZVNoYXBlT3JkZXJcIiwgZnVuY3Rpb24gKGRhdGE6IHsgc2hhcGU6IFNlcnZlclNoYXBlOyBpbmRleDogbnVtYmVyIH0pIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKGRhdGEuc2hhcGUudXVpZCkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIG1vdmUgdGhlIHNoYXBlIG9yZGVyIG9mIGFuIHVua25vd24gc2hhcGVgKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoZGF0YS5zaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpITtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XHJcbiAgICBsYXllci5tb3ZlU2hhcGVPcmRlcihzaGFwZSwgZGF0YS5pbmRleCwgZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2hhcGVNb3ZlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLm1vdmVTaGFwZShzaGFwZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVTaGFwZVwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbiB9KSB7XHJcbiAgICBnYW1lTWFuYWdlci51cGRhdGVTaGFwZShkYXRhKTtcclxufSk7XHJcbnNvY2tldC5vbihcInVwZGF0ZUluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQgfHwgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNICYmICFkYXRhLnZpc2libGUpKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoZGF0YS51dWlkLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShkYXRhLCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXRJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhOiBJbml0aWF0aXZlRGF0YVtdKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRJbml0aWF0aXZlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiY2xlYXIgdGVtcG9yYXJpZXNcIiwgZnVuY3Rpb24gKHNoYXBlczogU2VydmVyU2hhcGVbXSkge1xyXG4gICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIGFuIHVua25vd24gdGVtcG9yYXJ5IHNoYXBlXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVhbF9zaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSE7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSEucmVtb3ZlU2hhcGUocmVhbF9zaGFwZSwgZmFsc2UpO1xyXG4gICAgfSlcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzb2NrZXQ7IiwiaW1wb3J0IHsgZ2V0VW5pdERpc3RhbmNlLCBsMmcsIGcybCwgZzJsciwgZzJseiwgZzJseCwgZzJseSwgbDJneSwgbDJneCB9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgVmVjdG9yLCBMb2NhbFBvaW50LCBHbG9iYWxQb2ludCB9IGZyb20gXCIuL2dlb21cIjtcclxuaW1wb3J0IHsgSW5pdGlhdGl2ZURhdGEgfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4vc2hhcGVzL3JlY3RcIjtcclxuaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL3NoYXBlcy9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgTGluZSBmcm9tIFwiLi9zaGFwZXMvbGluZVwiO1xyXG5pbXBvcnQgVGV4dCBmcm9tIFwiLi9zaGFwZXMvdGV4dFwiO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRvb2wge1xyXG4gICAgZGV0YWlsRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGFic3RyYWN0IG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHsgfTtcclxufVxyXG5cclxuZW51bSBTZWxlY3RPcGVyYXRpb25zIHtcclxuICAgIE5vb3AsXHJcbiAgICBSZXNpemUsXHJcbiAgICBEcmFnLFxyXG4gICAgR3JvdXBTZWxlY3QsXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZWxlY3RUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBtb2RlOiBTZWxlY3RPcGVyYXRpb25zID0gU2VsZWN0T3BlcmF0aW9ucy5Ob29wO1xyXG4gICAgcmVzaXplZGlyOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgLy8gQmVjYXVzZSB3ZSBuZXZlciBkcmFnIGZyb20gdGhlIGFzc2V0J3MgKDAsIDApIGNvb3JkIGFuZCB3YW50IGEgc21vb3RoZXIgZHJhZyBleHBlcmllbmNlXHJcbiAgICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBhY3R1YWwgb2Zmc2V0IHdpdGhpbiB0aGUgYXNzZXQuXHJcbiAgICBkcmFnOiBWZWN0b3I8TG9jYWxQb2ludD4gPSBuZXcgVmVjdG9yPExvY2FsUG9pbnQ+KHsgeDogMCwgeTogMCB9LCBuZXcgTG9jYWxQb2ludCgwLCAwKSk7XHJcbiAgICBzZWxlY3Rpb25TdGFydFBvaW50OiBHbG9iYWxQb2ludCA9IG5ldyBHbG9iYWxQb2ludCgtMTAwMCwgLTEwMDApO1xyXG4gICAgc2VsZWN0aW9uSGVscGVyOiBSZWN0ID0gbmV3IFJlY3QodGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LCAwLCAwKTtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG5cclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgLy8gdGhlIHNlbGVjdGlvblN0YWNrIGFsbG93cyBmb3IgbG93ZXIgcG9zaXRpb25lZCBvYmplY3RzIHRoYXQgYXJlIHNlbGVjdGVkIHRvIGhhdmUgcHJlY2VkZW5jZSBkdXJpbmcgb3ZlcmxhcC5cclxuICAgICAgICBsZXQgc2VsZWN0aW9uU3RhY2s7XHJcbiAgICAgICAgaWYgKCFsYXllci5zZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICBzZWxlY3Rpb25TdGFjayA9IGxheWVyLnNoYXBlcztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzLmNvbmNhdChsYXllci5zZWxlY3Rpb24pO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSBzZWxlY3Rpb25TdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHNlbGVjdGlvblN0YWNrW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBjb3JuID0gc2hhcGUuZ2V0Q29ybmVyKGwyZyhtb3VzZSkpO1xyXG4gICAgICAgICAgICBpZiAoY29ybiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2hhcGVdO1xyXG4gICAgICAgICAgICAgICAgc2hhcGUub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVkaXIgPSBjb3JuO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS5jb250YWlucyhsMmcobW91c2UpKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gc2hhcGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmluZGV4T2Yoc2VsKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2VsXTtcclxuICAgICAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuRHJhZztcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZyA9IG1vdXNlLnN1YnRyYWN0KGcybChzZWwucmVmUG9pbnQpKTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhZy5vcmlnaW4gPSBnMmwoc2VsLnJlZlBvaW50KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhZy5kaXJlY3Rpb24gPSBtb3VzZS5zdWJ0cmFjdCh0aGlzLmRyYWcub3JpZ2luKTtcclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaGl0KSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbkxvc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnJlZlBvaW50ID0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50O1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IDA7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFt0aGlzLnNlbGVjdGlvbkhlbHBlcl07XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdCkge1xyXG4gICAgICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgdGhpc1xyXG4gICAgICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhtb3VzZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC54KTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnJlZlBvaW50ID0gbmV3IEdsb2JhbFBvaW50KFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LngsIGVuZFBvaW50LngpLFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LnksIGVuZFBvaW50LnkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9nID0gZzJsKGxheWVyLnNlbGVjdGlvbltsYXllci5zZWxlY3Rpb24ubGVuZ3RoIC0gMV0ucmVmUG9pbnQpO1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaCgoc2VsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBtb3VzZS5zdWJ0cmFjdChvZy5hZGQodGhpcy5kcmFnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkRyYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQgPSBzZWwucmVmUG9pbnQuYWRkKGwyZyhkZWx0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXllci5uYW1lID09PSAndG9rZW5zJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIHVzZSB0aGUgYWJvdmUgdXBkYXRlZCB2YWx1ZXMgZm9yIHRoZSBib3VuZGluZyBib3ggY2hlY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIGJvdW5kaW5nIGJveGVzIG92ZXJsYXAgdG8gc3RvcCBjbG9zZSAvIHByZWNpc2UgbW92ZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJsb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBibG9ja2VycyA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuZmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4gbWIgIT09IHNlbC51dWlkICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhtYikgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KG1iKSEuZ2V0Qm91bmRpbmdCb3goKS5pbnRlcnNlY3RzV2l0aChiYm94KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChibG9ja2Vycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgYSBsaW5lIGZyb20gc3RhcnQgdG8gZW5kIHBvc2l0aW9uIGFuZCBzZWUgZm9yIGFueSBpbnRlcnNlY3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgc3RvcHMgc3VkZGVuIGxlYXBzIG92ZXIgd2FsbHMhIGNoZWVreSBidWdnZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0geyBzdGFydDogbDJnKG9nKSwgZW5kOiBzZWwucmVmUG9pbnQgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhtYikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW50ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobWIpIS5nZXRCb3VuZGluZ0JveCgpLmdldEludGVyc2VjdFdpdGhMaW5lKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWIgIT09IHNlbC51dWlkICYmIGludGVyLmludGVyc2VjdCAhPT0gbnVsbCAmJiBpbnRlci5kaXN0YW5jZSA+IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50ID0gc2VsLnJlZlBvaW50LmFkZChsMmcoZGVsdGEpLnJldmVyc2UoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVGhpcyBoYXMgdG8gYmUgc2hhcGUgc3BlY2lmaWNcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNpemVkaXIgPT09ICdudycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBnMmx4KHNlbC5yZWZQb2ludC54KSArIHNlbC53ICogeiAtIG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gZzJseShzZWwucmVmUG9pbnQueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQgPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5yZXNpemVkaXIgPT09ICduZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBtb3VzZS54IC0gZzJseChzZWwucmVmUG9pbnQueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gZzJseShzZWwucmVmUG9pbnQueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSA9IGwyZ3kobW91c2UueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ3NlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IG1vdXNlLnggLSBnMmx4KHNlbC5yZWZQb2ludC54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gZzJseShzZWwucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ3N3Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IGcybHgoc2VsLnJlZlBvaW50LngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gZzJseShzZWwucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ID0gbDJneChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgLz0gejtcclxuICAgICAgICAgICAgICAgICAgICBzZWwuaCAvPSB6O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ20gPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwuaW5Db3JuZXIoZ20sIFwibndcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm53LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKGdtLCBcIm5lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJuZS1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihnbSwgXCJzZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic2UtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIoZ20sIFwic3dcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInN3LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3QpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIGxheWVyLnNoYXBlcy5mb3JFYWNoKChzaGFwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlID09PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNoYXBlLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uSGVscGVyIS5yZWZQb2ludC54IDw9IGJib3gucmVmUG9pbnQueCArIGJib3gudyAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5yZWZQb2ludC54ICsgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLncgPj0gYmJveC5yZWZQb2ludC54ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnkgPD0gYmJveC5yZWZQb2ludC55ICsgYmJveC5oICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnkgKyB0aGlzLnNlbGVjdGlvbkhlbHBlciEuaCA+PSBiYm94LnJlZlBvaW50LnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24ucHVzaChzaGFwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUHVzaCB0aGUgc2VsZWN0aW9uIGhlbHBlciBhcyB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBzZWxlY3Rpb25cclxuICAgICAgICAgICAgLy8gVGhpcyBtYWtlcyBzdXJlIHRoYXQgaXQgd2lsbCBiZSB0aGUgZmlyc3Qgb25lIHRvIGJlIGhpdCBpbiB0aGUgaGl0IGRldGVjdGlvbiBvbk1vdXNlRG93blxyXG4gICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24ucHVzaCh0aGlzLnNlbGVjdGlvbkhlbHBlcik7XHJcblxyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaCgoc2VsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZHJhZy5vcmlnaW4hLnggPT09IGcybHgoc2VsLnJlZlBvaW50LngpICYmIHRoaXMuZHJhZy5vcmlnaW4hLnkgPT09IGcybHkoc2VsLnJlZlBvaW50LnkpKSB7IHJldHVybiB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW91c2UgPSBzZWwuY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXkgPSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHNlbC53IC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnggPSBNYXRoLnJvdW5kKG14IC8gZ3MpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueCA9IChNYXRoLnJvdW5kKChteCArIChncyAvIDIpKSAvIGdzKSAtICgxIC8gMikpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChzZWwuaCAvIGdzKSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC55ID0gTWF0aC5yb3VuZChteSAvIGdzKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnkgPSAoTWF0aC5yb3VuZCgobXkgKyAoZ3MgLyAyKSkgLyBncykgLSAoMSAvIDIpKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLncgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ICs9IHNlbC53O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IE1hdGguYWJzKHNlbC53KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC5oIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSArPSBzZWwuaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLmFicyhzZWwuaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ID0gTWF0aC5yb3VuZChzZWwucmVmUG9pbnQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSA9IE1hdGgucm91bmQoc2VsLnJlZlBvaW50LnkgLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuTm9vcFxyXG4gICAgfTtcclxuICAgIG9uQ29udGV4dE1lbnUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xyXG4gICAgICAgIGxheWVyLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBpZiAoIWhpdCAmJiBzaGFwZS5jb250YWlucyhsMmcobW91c2UpKSkge1xyXG4gICAgICAgICAgICAgICAgc2hhcGUuc2hvd0NvbnRleHRNZW51KG1vdXNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBhblRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIHBhblN0YXJ0ID0gbmV3IExvY2FsUG9pbnQoMCwgMCk7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnBhblN0YXJ0ID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBsMmcobW91c2Uuc3VidHJhY3QodGhpcy5wYW5TdGFydCkpLmRpcmVjdGlvbjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCArPSBNYXRoLnJvdW5kKGRpc3RhbmNlLngpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZICs9IE1hdGgucm91bmQoZGlzdGFuY2UueSk7XHJcbiAgICAgICAgdGhpcy5wYW5TdGFydCA9IG1vdXNlO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICBsb2NhdGlvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIFtgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF06IHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCxcclxuICAgICAgICAgICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7IH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFRvb2xzKCk6IHZvaWQge1xyXG4gICAgY29uc3QgdG9vbHNlbGVjdERpdiA9ICQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIik7XHJcbiAgICB0b29scy5mb3JFYWNoKGZ1bmN0aW9uICh0b29sKSB7XHJcbiAgICAgICAgaWYgKCF0b29sLnBsYXllclRvb2wgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IHRvb2xJbnN0YW5jZSA9IG5ldyB0b29sLmNseigpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLnRvb2xzLnNldCh0b29sLm5hbWUsIHRvb2xJbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgZXh0cmEgPSB0b29sLmRlZmF1bHRTZWxlY3QgPyBcIiBjbGFzcz0ndG9vbC1zZWxlY3RlZCdcIiA6IFwiXCI7XHJcbiAgICAgICAgY29uc3QgdG9vbExpID0gJChcIjxsaSBpZD0ndG9vbC1cIiArIHRvb2wubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIHRvb2wubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgIHRvb2xzZWxlY3REaXYuYXBwZW5kKHRvb2xMaSk7XHJcbiAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhO1xyXG4gICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICBkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29sTGkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdG9vbHMuaW5kZXhPZih0b29sKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIHtcclxuICAgICAgICAgICAgICAgICQoJy50b29sLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9ICQoJyN0b29sZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmNoaWxkcmVuKCkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERyYXdUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHJlY3QhOiBSZWN0O1xyXG4gICAgZmlsbENvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGJvcmRlckNvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+RmlsbDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuZmlsbENvbG9yKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+Qm9yZGVyPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5ib3JkZXJDb2xvcilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmVkXCJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgY29uc3QgZmlsbENvbG9yID0gdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICAgICAgY29uc3QgZmlsbCA9IGZpbGxDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogZmlsbENvbG9yO1xyXG4gICAgICAgIGNvbnN0IGJvcmRlckNvbG9yID0gdGhpcy5ib3JkZXJDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcclxuICAgICAgICBjb25zdCBib3JkZXIgPSBib3JkZXJDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogYm9yZGVyQ29sb3I7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LCAwLCAwLCBmaWxsLnRvUmdiU3RyaW5nKCksIGJvcmRlci50b1JnYlN0cmluZygpKTtcclxuICAgICAgICB0aGlzLnJlY3Qub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGlmIChsYXllci5uYW1lID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLnJlY3QudmlzaW9uT2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnJlY3QubW92ZW1lbnRPYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnJlY3QudXVpZCk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy5yZWN0IS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZSB9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSdWxlclRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcnVsZXIhOiBMaW5lO1xyXG4gICAgdGV4dCE6IFRleHQ7XHJcblxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhcIk1vdXNlIGRvd25cIik7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICB0aGlzLnJ1bGVyID0gbmV3IExpbmUodGhpcy5zdGFydFBvaW50LCB0aGlzLnN0YXJ0UG9pbnQpO1xyXG4gICAgICAgIHRoaXMudGV4dCA9IG5ldyBUZXh0KHRoaXMuc3RhcnRQb2ludC5jbG9uZSgpLCBcIlwiLCBcIjIwcHggc2VyaWZcIik7XHJcbiAgICAgICAgdGhpcy5ydWxlci5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgdGhpcy50ZXh0Lm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJ1bGVyLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnRleHQsIHRydWUsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gZHJhdyBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucnVsZXIuZW5kUG9pbnQgPSBlbmRQb2ludDtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiB0aGlzLnJ1bGVyIS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBkaWZmc2lnbiA9IE1hdGguc2lnbihlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpICogTWF0aC5zaWduKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgY29uc3QgeGRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIGNvbnN0IHlkaWZmID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICBjb25zdCBsYWJlbCA9IE1hdGgucm91bmQoTWF0aC5zcXJ0KCh4ZGlmZikgKiogMiArICh5ZGlmZikgKiogMikgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemUpICsgXCIgZnRcIjtcclxuICAgICAgICBsZXQgYW5nbGUgPSBNYXRoLmF0YW4yKGRpZmZzaWduICogeWRpZmYsIHhkaWZmKTtcclxuICAgICAgICBjb25zdCB4bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpICsgeGRpZmYgLyAyO1xyXG4gICAgICAgIGNvbnN0IHltaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSkgKyB5ZGlmZiAvIDI7XHJcbiAgICAgICAgdGhpcy50ZXh0LnJlZlBvaW50LnggPSB4bWlkO1xyXG4gICAgICAgIHRoaXMudGV4dC5yZWZQb2ludC55ID0geW1pZDtcclxuICAgICAgICB0aGlzLnRleHQudGV4dCA9IGxhYmVsO1xyXG4gICAgICAgIHRoaXMudGV4dC5hbmdsZSA9IGFuZ2xlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMudGV4dC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZPV1Rvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcmVjdCE6IFJlY3Q7XHJcbiAgICBkZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PlJldmVhbDwvZGl2PjxsYWJlbCBjbGFzcz0nc3dpdGNoJz48aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdmb3ctcmV2ZWFsJz48c3BhbiBjbGFzcz0nc2xpZGVyIHJvdW5kJz48L3NwYW4+PC9sYWJlbD5cIikpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludCwgMCwgMCwgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgdHJ1ZSwgZmFsc2UpO1xyXG5cclxuICAgICAgICBpZiAoJChcIiNmb3ctcmV2ZWFsXCIpLnByb3AoXCJjaGVja2VkXCIpKVxyXG4gICAgICAgICAgICB0aGlzLnJlY3QuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdXRcIjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgICAgICB0aGlzLnJlY3QudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIHRoaXMucmVjdC5yZWZQb2ludC54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdC5yZWZQb2ludC55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG5cclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiB0aGlzLnJlY3QuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNYXBUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHJlY3QhOiBSZWN0O1xyXG4gICAgeENvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgeUNvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueENvdW50KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1k8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnlDb3VudClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQsIDAsIDAsIFwicmdiYSgwLDAsMCwwKVwiLCBcImJsYWNrXCIpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QhLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3ID0gdGhpcy5yZWN0Lnc7XHJcbiAgICAgICAgY29uc3QgaCA9IHRoaXMucmVjdC5oO1xyXG4gICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLnNlbGVjdGlvblswXTtcclxuXHJcbiAgICAgICAgaWYgKHNlbCBpbnN0YW5jZW9mIFJlY3QpIHtcclxuICAgICAgICAgICAgc2VsLncgKj0gcGFyc2VJbnQoPHN0cmluZz50aGlzLnhDb3VudC52YWwoKSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemUgLyB3O1xyXG4gICAgICAgICAgICBzZWwuaCAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueUNvdW50LnZhbCgpKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBJbml0aWF0aXZlVHJhY2tlciB7XHJcbiAgICBkYXRhOiBJbml0aWF0aXZlRGF0YVtdID0gW107XHJcbiAgICBhZGRJbml0aWF0aXZlKGRhdGE6IEluaXRpYXRpdmVEYXRhLCBzeW5jOiBib29sZWFuKSB7XHJcbiAgICAgICAgLy8gT3BlbiB0aGUgaW5pdGlhdGl2ZSB0cmFja2VyIGlmIGl0IGlzIG5vdCBjdXJyZW50bHkgb3Blbi5cclxuICAgICAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCB8fCAhZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuICAgICAgICAvLyBJZiBubyBpbml0aWF0aXZlIGdpdmVuLCBhc3N1bWUgaXQgMFxyXG4gICAgICAgIGlmIChkYXRhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgZGF0YS5pbml0aWF0aXZlID0gMDtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgc2hhcGUgaXMgYWxyZWFkeSBiZWluZyB0cmFja2VkXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gZGF0YS51dWlkKTtcclxuICAgICAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4aXN0aW5nLCBkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkYXRhKTtcclxuICAgIH07XHJcbiAgICByZW1vdmVJbml0aWF0aXZlKHV1aWQ6IHN0cmluZywgc3luYzogYm9vbGVhbiwgc2tpcEdyb3VwQ2hlY2s6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCBkID0gdGhpcy5kYXRhLmZpbmRJbmRleChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKGQgPj0gMCkge1xyXG4gICAgICAgICAgICBpZiAoIXNraXBHcm91cENoZWNrICYmIHRoaXMuZGF0YVtkXS5ncm91cCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc3BsaWNlKGQsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgICAgICBpZiAoc3luYylcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCB7IHV1aWQ6IHV1aWQgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmRhdGEubGVuZ3RoID09PSAwICYmIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiaXNPcGVuXCIpKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImNsb3NlXCIpO1xyXG4gICAgfTtcclxuICAgIHJlZHJhdygpIHtcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgICAgIGlmIChhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIGlmIChiLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICByZXR1cm4gYi5pbml0aWF0aXZlIC0gYS5pbml0aWF0aXZlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEub3duZXJzID09PSB1bmRlZmluZWQpIGRhdGEub3duZXJzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IGRhdGEuc3JjID09PSB1bmRlZmluZWQgPyAnJyA6ICQoYDxpbWcgc3JjPVwiJHtkYXRhLnNyY31cIiB3aWR0aD1cIjMwcHhcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj5gKTtcclxuICAgICAgICAgICAgLy8gY29uc3QgbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7c2gudXVpZH1cIiB2YWx1ZT1cIiR7c2gubmFtZX1cIiBkaXNhYmxlZD0nZGlzYWJsZWQnIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJ2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiIHZhbHVlPVwiJHtkYXRhLmluaXRpYXRpdmV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogdmFsdWVcIj5gKTtcclxuICAgICAgICAgICAgY29uc3QgdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICBjb25zdCBncm91cCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdXNlcnNcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIGRhdGEudmlzaWJsZSA/IFwiMS4wXCIgOiBcIjAuM1wiKTtcclxuICAgICAgICAgICAgZ3JvdXAuY3NzKFwib3BhY2l0eVwiLCBkYXRhLmdyb3VwID8gXCIxLjBcIiA6IFwiMC4zXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWRhdGEub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pIHtcclxuICAgICAgICAgICAgICAgIHZhbC5wcm9wKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgICAgICAgIHJlbW92ZS5jc3MoXCJvcGFjaXR5XCIsIFwiMC4zXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmFwcGVuZChpbWcpLmFwcGVuZCh2YWwpLmFwcGVuZCh2aXNpYmxlKS5hcHBlbmQoZ3JvdXApLmFwcGVuZChyZW1vdmUpO1xyXG5cclxuICAgICAgICAgICAgdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBjaGFuZ2UgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkLmluaXRpYXRpdmUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpIHx8IDA7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZEluaXRpYXRpdmUoZCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpITtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgdmlzaWJsZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBkLnZpc2libGUgPSAhZC52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBncm91cC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBncm91cCB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBkLmdyb3VwID0gIWQuZ3JvdXA7XHJcbiAgICAgICAgICAgICAgICBpZiAoZC5ncm91cClcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyByZW1vdmUgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3V1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVJbml0aWF0aXZlKHV1aWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gICAgeyBuYW1lOiBcInNlbGVjdFwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiB0cnVlLCBoYXNEZXRhaWw6IGZhbHNlLCBjbHo6IFNlbGVjdFRvb2wgfSxcclxuICAgIHsgbmFtZTogXCJwYW5cIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogZmFsc2UsIGNsejogUGFuVG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcImRyYXdcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBEcmF3VG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcInJ1bGVyXCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IGZhbHNlLCBjbHo6IFJ1bGVyVG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcImZvd1wiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBGT1dUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwibWFwXCIsIHBsYXllclRvb2w6IGZhbHNlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IE1hcFRvb2wgfSxcclxuXTsiLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCwgTG9jYWxQb2ludCwgVmVjdG9yIH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGcybChvYmo6IEdsb2JhbFBvaW50KTogTG9jYWxQb2ludCB7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICBjb25zdCBwYW5YID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblg7XHJcbiAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XHJcbiAgICByZXR1cm4gbmV3IExvY2FsUG9pbnQoKG9iai54ICsgcGFuWCkgKiB6LCAob2JqLnkgKyBwYW5ZKSAqIHopO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJseCh4OiBudW1iZXIpIHtcclxuICAgIHJldHVybiBnMmwobmV3IEdsb2JhbFBvaW50KHgsIDApKS54O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJseSh5OiBudW1iZXIpIHtcclxuICAgIHJldHVybiBnMmwobmV3IEdsb2JhbFBvaW50KDAsIHkpKS55O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJseih6OiBudW1iZXIpIHtcclxuICAgIHJldHVybiB6ICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbml0RGlzdGFuY2UocjogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gKHIgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJscihyOiBudW1iZXIpIHtcclxuICAgIHJldHVybiBnMmx6KGdldFVuaXREaXN0YW5jZShyKSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyZyhvYmo6IExvY2FsUG9pbnQpOiBHbG9iYWxQb2ludDtcclxuZXhwb3J0IGZ1bmN0aW9uIGwyZyhvYmo6IFZlY3RvcjxMb2NhbFBvaW50Pik6IFZlY3RvcjxHbG9iYWxQb2ludD47XHJcbmV4cG9ydCBmdW5jdGlvbiBsMmcob2JqOiBMb2NhbFBvaW50fFZlY3RvcjxMb2NhbFBvaW50Pik6IEdsb2JhbFBvaW50fFZlY3RvcjxHbG9iYWxQb2ludD4ge1xyXG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgICAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XHJcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgTG9jYWxQb2ludCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgR2xvYmFsUG9pbnQoKG9iai54IC8geikgLSBwYW5YLCAob2JqLnkgLyB6KSAtIHBhblkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjxHbG9iYWxQb2ludD4oe3g6IG9iai5kaXJlY3Rpb24ueCAvIHosIHk6IG9iai5kaXJlY3Rpb24ueSAvIHp9LCBvYmoub3JpZ2luID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBsMmcob2JqLm9yaWdpbikpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJneCh4OiBudW1iZXIpIHtcclxuICAgIHJldHVybiBsMmcobmV3IExvY2FsUG9pbnQoeCwgMCkpLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMmd5KHk6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGwyZyhuZXcgTG9jYWxQb2ludCgwLCB5KSkueTtcclxufSIsImltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZXMvc2hhcGVcIjtcclxuaW1wb3J0IHsgTG9jYWxQb2ludCB9IGZyb20gXCIuL2dlb21cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb3VzZShlOiBNb3VzZUV2ZW50KTogTG9jYWxQb2ludCB7XHJcbiAgICByZXR1cm4gbmV3IExvY2FsUG9pbnQoZS5wYWdlWCwgZS5wYWdlWSk7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFscGhTb3J0KGE6IHN0cmluZywgYjogc3RyaW5nKSB7XHJcbiAgICBpZiAoYS50b0xvd2VyQ2FzZSgpIDwgYi50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gMTtcclxufVxyXG5cclxuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxyXG5leHBvcnQgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE9yZGVyZWRNYXA8SywgVj4ge1xyXG4gICAga2V5czogS1tdID0gW107XHJcbiAgICB2YWx1ZXM6IFZbXSA9IFtdO1xyXG4gICAgZ2V0KGtleTogSykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1t0aGlzLmtleXMuaW5kZXhPZihrZXkpXTtcclxuICAgIH1cclxuICAgIGdldEluZGV4VmFsdWUoaWR4OiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaWR4XTtcclxuICAgIH1cclxuICAgIGdldEluZGV4S2V5KGlkeDogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5c1tpZHhdO1xyXG4gICAgfVxyXG4gICAgc2V0KGtleTogSywgdmFsdWU6IFYpIHtcclxuICAgICAgICB0aGlzLmtleXMucHVzaChrZXkpO1xyXG4gICAgICAgIHRoaXMudmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgfVxyXG4gICAgaW5kZXhPZihlbGVtZW50OiBLKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5cy5pbmRleE9mKGVsZW1lbnQpO1xyXG4gICAgfVxyXG4gICAgcmVtb3ZlKGVsZW1lbnQ6IEspIHtcclxuICAgICAgICBjb25zdCBpZHggPSB0aGlzLmluZGV4T2YoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5rZXlzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIHRoaXMudmFsdWVzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiIifQ==