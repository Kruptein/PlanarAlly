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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2Fzc2V0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvYmFzZXJlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9ib3VuZGluZ3JlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9jaXJjbGUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9lZGl0ZGlhbG9nLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvbGluZS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL3JlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9zaGFwZS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL3RleHQudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy91dGlscy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc29ja2V0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdW5pdHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNB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QUcsQ0FBQyxRQUFRLENBQUMsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLG1EQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZGLFVBQVU7b0JBQ1YsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLG1EQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQy9FLFdBQVc7b0JBQ1gsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUMvRixVQUFVO29CQUNWLEdBQUcsQ0FBQyxRQUFRLENBQUMsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxRixDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FB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QyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzFELE1BQU0sS0FBSyxHQUFHLElBQUkscURBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUMxRCxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7d0JBRXRDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs0QkFDbkMsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7NEJBQzdDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDOzRCQUMxRCxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDMUQsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ3RELEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMxRCxDQUFDO3dCQUVELENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM1QixDQUFDO2lCQUNKLENBQUMsQ0FBQztZQUNQLENBQUM7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LElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBQ0QsUUFBUSxDQUFDLEtBQWtCO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBQ0QsUUFBUSxDQUFDLEtBQWtCLEVBQUUsTUFBYztRQUN2QyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2IsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEssS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoSixLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSyxLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEw7Z0JBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQztJQUNELFNBQVMsQ0FBQyxLQUFrQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMs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REFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ25ELEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2pDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLENBQUM7b0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDakMsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDbkQsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdkMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ25DLENBQUM7b0JBQ0Qs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QUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkcsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNqSixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNqRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENB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IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3RzX3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiLypcclxuVGhpcyBtb2R1bGUgZGVmaW5lcyBzb21lIFBvaW50IGNsYXNzZXMuXHJcbkEgc3Ryb25nIGZvY3VzIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYXQgbm8gdGltZSBhIGdsb2JhbCBhbmQgYSBsb2NhbCBwb2ludCBhcmUgaW4gc29tZSB3YXkgdXNlZCBpbnN0ZWFkIG9mIHRoZSBvdGhlci5cclxuVGhpcyBhZGRzIHNvbWUgYXQgZmlyc3QgZ2xhbmNlIHdlaXJkIGxvb2tpbmcgaGFja3MgYXMgdHMgZG9lcyBub3Qgc3VwcG9ydCBub21pbmFsIHR5cGluZy5cclxuKi9cclxuXHJcbmNsYXNzIFBvaW50IHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTpudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICB9XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIHZlYy5kaXJlY3Rpb24ueCwgdGhpcy55ICsgdmVjLmRpcmVjdGlvbi55KTtcclxuICAgIH1cclxuICAgIHN1YnRyYWN0KG90aGVyOiBQb2ludCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yKHt4OiB0aGlzLnggLSBvdGhlci54LCB5OiB0aGlzLnkgLSBvdGhlci55fSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgICBjbG9uZSgpOiBQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGNsYXNzIEdsb2JhbFBvaW50IGV4dGVuZHMgUG9pbnQge1xyXG4gICAgLy8gdGhpcyBpcyB0byBkaWZmZXJlbnRpYXRlIHdpdGggTG9jYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0dsb2JhbFBvaW50ITogc3RyaW5nO1xyXG4gICAgYWRkKHZlYzogVmVjdG9yPHRoaXM+KTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogR2xvYmFsUG9pbnQpOiBWZWN0b3I8dGhpcz4ge1xyXG4gICAgICAgICByZXR1cm4gc3VwZXIuc3VidHJhY3Qob3RoZXIpO1xyXG4gICAgfVxyXG4gICAgY2xvbmUoKTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuY2xvbmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExvY2FsUG9pbnQgZXh0ZW5kcyBQb2ludCB7XHJcbiAgICAvLyB0aGlzIGlzIHRvIGRpZmZlcmVudGlhdGUgd2l0aCBHbG9iYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0xvY2FsUG9pbnQhOiBzdHJpbmc7XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pOiBMb2NhbFBvaW50IHtcclxuICAgICAgICByZXR1cm4gPExvY2FsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogTG9jYWxQb2ludCk6IFZlY3Rvcjx0aGlzPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLnN1YnRyYWN0KG90aGVyKTtcclxuICAgIH1cclxuICAgIGNsb25lKCk6IExvY2FsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8TG9jYWxQb2ludD5zdXBlci5jbG9uZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmVjdG9yPFQgZXh0ZW5kcyBQb2ludD4ge1xyXG4gICAgZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn07XHJcbiAgICBvcmlnaW4/OiBUO1xyXG4gICAgY29uc3RydWN0b3IoZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn0sIG9yaWdpbj86IFQpIHtcclxuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICAgICAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbjtcclxuICAgIH1cclxuICAgIHJldmVyc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8VD4oe3g6IC10aGlzLmRpcmVjdGlvbi54LCB5OiAtdGhpcy5kaXJlY3Rpb24ueX0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmU8VCBleHRlbmRzIFBvaW50PihwOiBULCBsMTogVCwgbDI6IFQpIHtcclxuICAgIHJldHVybiBwLnggPj0gTWF0aC5taW4obDEueCwgbDIueCkgLSAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueCA8PSBNYXRoLm1heChsMS54LCBsMi54KSArIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55ID49IE1hdGgubWluKGwxLnksIGwyLnkpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnkgPD0gTWF0aC5tYXgobDEueSwgbDIueSkgKyAwLjAwMDAwMTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmVzPFQgZXh0ZW5kcyBQb2ludD4ocDogVCwgczE6IFQsIGUxOiBULCBzMjogVCwgZTI6IFQpIHtcclxuICAgIHJldHVybiBwb2ludEluTGluZShwLCBzMSwgZTEpICYmIHBvaW50SW5MaW5lKHAsIHMyLCBlMik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMaW5lc0ludGVyc2VjdFBvaW50PFQgZXh0ZW5kcyBQb2ludD4oczE6IFQsIGUxOiBULCBzMjogVCwgZTI6IFQpIHtcclxuICAgIC8vIGNvbnN0IHMxID0gTWF0aC5taW4oUzEsIClcclxuICAgIGNvbnN0IEExID0gZTEueS1zMS55O1xyXG4gICAgY29uc3QgQjEgPSBzMS54LWUxLng7XHJcbiAgICBjb25zdCBBMiA9IGUyLnktczIueTtcclxuICAgIGNvbnN0IEIyID0gczIueC1lMi54O1xyXG5cclxuICAgIC8vIEdldCBkZWx0YSBhbmQgY2hlY2sgaWYgdGhlIGxpbmVzIGFyZSBwYXJhbGxlbFxyXG4gICAgY29uc3QgZGVsdGEgPSBBMSpCMiAtIEEyKkIxO1xyXG4gICAgaWYoZGVsdGEgPT09IDApIHJldHVybiB7aW50ZXJzZWN0OiBudWxsLCBwYXJhbGxlbDogdHJ1ZX07XHJcblxyXG4gICAgY29uc3QgQzIgPSBBMipzMi54K0IyKnMyLnk7XHJcbiAgICBjb25zdCBDMSA9IEExKnMxLngrQjEqczEueTtcclxuICAgIC8vaW52ZXJ0IGRlbHRhIHRvIG1ha2UgZGl2aXNpb24gY2hlYXBlclxyXG4gICAgY29uc3QgaW52ZGVsdGEgPSAxL2RlbHRhO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdCA9IDxUPnt4OiAoQjIqQzEgLSBCMSpDMikqaW52ZGVsdGEsIHk6IChBMSpDMiAtIEEyKkMxKSppbnZkZWx0YX07XHJcbiAgICBpZiAoIXBvaW50SW5MaW5lcyhpbnRlcnNlY3QsIHMxLCBlMSwgczIsIGUyKSlcclxuICAgICAgICByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IGZhbHNlfTtcclxuICAgIHJldHVybiB7aW50ZXJzZWN0OiBpbnRlcnNlY3QsIHBhcmFsbGVsOiBmYWxzZX07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQb2ludERpc3RhbmNlKHAxOiBQb2ludCwgcDI6IFBvaW50KSB7XHJcbiAgICBjb25zdCBhID0gcDEueCAtIHAyLng7XHJcbiAgICBjb25zdCBiID0gcDEueSAtIHAyLnk7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCBhKmEgKyBiKmIgKTtcclxufSIsImltcG9ydCB7Z2V0VW5pdERpc3RhbmNlLCBsMmcsIGcybCwgZzJseiwgZzJsciwgZzJseCwgZzJseX0gZnJvbSBcIi4vdW5pdHNcIjtcclxuaW1wb3J0IHtHbG9iYWxQb2ludH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBMb2NhdGlvbk9wdGlvbnMsIFNlcnZlclNoYXBlIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZXMvc2hhcGVcIjtcclxuaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL3NoYXBlcy9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgQ2lyY2xlIGZyb20gXCIuL3NoYXBlcy9jaXJjbGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9zaGFwZXMvYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGNyZWF0ZVNoYXBlRnJvbURpY3QgfSBmcm9tIFwiLi9zaGFwZXMvdXRpbHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBMYXllck1hbmFnZXIge1xyXG4gICAgbGF5ZXJzOiBMYXllcltdID0gW107XHJcbiAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgc2VsZWN0ZWRMYXllcjogc3RyaW5nID0gXCJcIjtcclxuXHJcbiAgICBVVUlETWFwOiBNYXA8c3RyaW5nLCBTaGFwZT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgZ3JpZFNpemUgPSA1MDtcclxuICAgIHVuaXRTaXplID0gNTtcclxuICAgIHVzZUdyaWQgPSB0cnVlO1xyXG4gICAgZnVsbEZPVyA9IGZhbHNlO1xyXG4gICAgZm93T3BhY2l0eSA9IDAuMztcclxuXHJcbiAgICB6b29tRmFjdG9yID0gMTtcclxuICAgIHBhblggPSAwO1xyXG4gICAgcGFuWSA9IDA7XHJcblxyXG4gICAgLy8gUmVmcmVzaCBpbnRlcnZhbCBhbmQgcmVkcmF3IHNldHRlci5cclxuICAgIGludGVydmFsID0gMzA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGxtLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgbG0ubGF5ZXJzW2ldLmRyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMuaW50ZXJ2YWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE9wdGlvbnMob3B0aW9uczogTG9jYXRpb25PcHRpb25zKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKFwidW5pdFNpemVcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldFVuaXRTaXplKG9wdGlvbnMudW5pdFNpemUpO1xyXG4gICAgICAgIGlmIChcInVzZUdyaWRcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldFVzZUdyaWQob3B0aW9ucy51c2VHcmlkKTtcclxuICAgICAgICBpZiAoXCJmdWxsRk9XXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRGdWxsRk9XKG9wdGlvbnMuZnVsbEZPVyk7XHJcbiAgICAgICAgaWYgKCdmb3dPcGFjaXR5JyBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldEZPV09wYWNpdHkob3B0aW9ucy5mb3dPcGFjaXR5KTtcclxuICAgICAgICBpZiAoXCJmb3dDb2xvdXJcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5mb3dDb2xvdXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFdpZHRoKHdpZHRoOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZExheWVyKGxheWVyOiBMYXllcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLnB1c2gobGF5ZXIpO1xyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkTGF5ZXIgPT09IFwiXCIgJiYgbGF5ZXIuc2VsZWN0YWJsZSkgdGhpcy5zZWxlY3RlZExheWVyID0gbGF5ZXIubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBoYXNMYXllcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXllcnMuc29tZShsID0+IGwubmFtZSA9PT0gbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TGF5ZXIobmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIG5hbWUgPSAobmFtZSA9PT0gdW5kZWZpbmVkKSA/IHRoaXMuc2VsZWN0ZWRMYXllciA6IG5hbWU7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMubGF5ZXJzW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3RvZG8gcmVuYW1lIHRvIHNlbGVjdExheWVyXHJcbiAgICBzZXRMYXllcihuYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsbSA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5sYXllcnMuZm9yRWFjaChmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCAmJiBsYXllci5uYW1lICE9PSAnZm93JykgbGF5ZXIuY3R4Lmdsb2JhbEFscGhhID0gMC4zO1xyXG4gICAgICAgICAgICBlbHNlIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDEuMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBsYXllci5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBsbS5zZWxlY3RlZExheWVyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0R3JpZExheWVyKCk6IExheWVyfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXIoXCJncmlkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdHcmlkKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5nZXRHcmlkTGF5ZXIoKTtcclxuICAgICAgICBpZiAobGF5ZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGN0eCA9IGxheWVyLmN0eDtcclxuICAgICAgICBsYXllci5jbGVhcigpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXllci53aWR0aDsgaSArPSB0aGlzLmdyaWRTaXplICogdGhpcy56b29tRmFjdG9yKSB7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgbGF5ZXIuaGVpZ2h0KTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbygwLCBpICsgKHRoaXMucGFuWSAlIHRoaXMuZ3JpZFNpemUpICogdGhpcy56b29tRmFjdG9yKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyhsYXllci53aWR0aCwgaSArICh0aGlzLnBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lTWFuYWdlci5ncmlkQ29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIGxheWVyLnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5oYXNMYXllcihcImZvd1wiKSlcclxuICAgICAgICAgICAgdGhpcy5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRHcmlkU2l6ZShncmlkU2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdyaWRTaXplICE9PSB0aGlzLmdyaWRTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZFNpemUgPSBncmlkU2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjZ3JpZFNpemVJbnB1dCcpLnZhbChncmlkU2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVuaXRTaXplKHVuaXRTaXplOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBpZiAodW5pdFNpemUgIT09IHRoaXMudW5pdFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy51bml0U2l6ZSA9IHVuaXRTaXplO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICQoJyN1bml0U2l6ZUlucHV0JykudmFsKHVuaXRTaXplKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VXNlR3JpZCh1c2VHcmlkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHVzZUdyaWQgIT09IHRoaXMudXNlR3JpZCkge1xyXG4gICAgICAgICAgICB0aGlzLnVzZUdyaWQgPSB1c2VHcmlkO1xyXG4gICAgICAgICAgICBpZiAodXNlR3JpZClcclxuICAgICAgICAgICAgICAgICQoJyNncmlkLWxheWVyJykuc2hvdygpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLmhpZGUoKTtcclxuICAgICAgICAgICAgJCgnI3VzZUdyaWRJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIHVzZUdyaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRGdWxsRk9XKGZ1bGxGT1c6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZnVsbEZPVyAhPT0gdGhpcy5mdWxsRk9XKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnVsbEZPVyA9IGZ1bGxGT1c7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvd2wgPSB0aGlzLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgJCgnI3VzZUZPV0lucHV0JykucHJvcChcImNoZWNrZWRcIiwgZnVsbEZPVyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEZPV09wYWNpdHkoZm93T3BhY2l0eTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcclxuICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICQoJyNmb3dPcGFjaXR5JykudmFsKGZvd09wYWNpdHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubGF5ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXIge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgd2lkdGg6IG51bWJlcjtcclxuICAgIGhlaWdodDogbnVtYmVyO1xyXG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHNlbGVjdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHBsYXllcl9lZGl0YWJsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFdoZW4gc2V0IHRvIGZhbHNlLCB0aGUgbGF5ZXIgd2lsbCBiZSByZWRyYXduIG9uIHRoZSBuZXh0IHRpY2tcclxuICAgIHZhbGlkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAvLyBUaGUgY29sbGVjdGlvbiBvZiBzaGFwZXMgdGhhdCB0aGlzIGxheWVyIGNvbnRhaW5zLlxyXG4gICAgLy8gVGhlc2UgYXJlIG9yZGVyZWQgb24gYSBkZXB0aCBiYXNpcy5cclxuICAgIHNoYXBlczogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIENvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgYXJlIGN1cnJlbnRseSBzZWxlY3RlZFxyXG4gICAgc2VsZWN0aW9uOiBTaGFwZVtdID0gW107XHJcblxyXG4gICAgLy8gRXh0cmEgc2VsZWN0aW9uIGhpZ2hsaWdodGluZyBzZXR0aW5nc1xyXG4gICAgc2VsZWN0aW9uQ29sb3IgPSAnI0NDMDAwMCc7XHJcbiAgICBzZWxlY3Rpb25XaWR0aCA9IDI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKHNraXBMaWdodFVwZGF0ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIXNraXBMaWdodFVwZGF0ZSAmJiB0aGlzLm5hbWUgIT09IFwiZm93XCIgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICBzaGFwZS5sYXllciA9IHRoaXMubmFtZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKHNoYXBlKTtcclxuICAgICAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwiYWRkIHNoYXBlXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIHRlbXBvcmFyeTogdGVtcG9yYXJ5fSk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoYXBlKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNlcnZlclNoYXBlW10pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB0OiBTaGFwZVtdID0gW107XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSk7XHJcbiAgICAgICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtzaGFwZS50eXBlfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2gubGF5ZXIgPSBzZWxmLm5hbWU7XHJcbiAgICAgICAgICAgIHNoLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgICAgIHNoLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaCk7XHJcbiAgICAgICAgICAgIHQucHVzaChzaCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTsgLy8gVE9ETzogRml4IGtlZXBpbmcgc2VsZWN0aW9uIG9uIHRob3NlIGl0ZW1zIHRoYXQgYXJlIG5vdCBtb3ZlZC5cclxuICAgICAgICB0aGlzLnNoYXBlcyA9IHQ7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodGVtcG9yYXJ5ID09PSB1bmRlZmluZWQpIHRlbXBvcmFyeSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc2hhcGVzLnNwbGljZSh0aGlzLnNoYXBlcy5pbmRleE9mKHNoYXBlKSwgMSk7XHJcbiAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwicmVtb3ZlIHNoYXBlXCIsIHtzaGFwZTogc2hhcGUsIHRlbXBvcmFyeTogdGVtcG9yYXJ5fSk7XHJcbiAgICAgICAgY29uc3QgbHNfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5maW5kSW5kZXgobHMgPT4gbHMuc2hhcGUgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IGxiX2kgPSBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgY29uc3QgbWJfaSA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuZmluZEluZGV4KGxzID0+IGxzID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBpZiAobHNfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuc3BsaWNlKGxzX2ksIDEpO1xyXG4gICAgICAgIGlmIChsYl9pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKGxiX2ksIDEpO1xyXG4gICAgICAgIGlmIChtYl9pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc3BsaWNlKG1iX2ksIDEpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmRlbGV0ZShzaGFwZS51dWlkKTtcclxuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnNlbGVjdGlvbi5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAoaW5kZXggPj0gMClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhkb0NsZWFyPzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCAmJiAhdGhpcy52YWxpZCkge1xyXG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcclxuICAgICAgICAgICAgZG9DbGVhciA9IGRvQ2xlYXIgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBkb0NsZWFyO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRvQ2xlYXIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUudmlzaWJsZUluQ2FudmFzKHN0YXRlLmNhbnZhcykpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5uYW1lID09PSAnZm93JyAmJiBzaGFwZS52aXNpb25PYnN0cnVjdGlvbiAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSEubmFtZSAhPT0gc3RhdGUubmFtZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgc2hhcGUuZHJhdyhjdHgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5zZWxlY3Rpb25XaWR0aDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFJFRkFDVE9SIFRISVMgVE8gU2hhcGUuZHJhd1NlbGVjdGlvbihjdHgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KGcybHgoc2VsLnJlZlBvaW50LngpLCBnMmx5KHNlbC5yZWZQb2ludC55KSwgc2VsLncgKiB6LCBzZWwuaCAqIHopO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB0b3ByaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdChnMmx4KHNlbC5yZWZQb2ludC54ICsgc2VsLncgLSAzKSwgZzJseShzZWwucmVmUG9pbnQueSAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChzZWwucmVmUG9pbnQueCAtIDMpLCBnMmx5KHNlbC5yZWZQb2ludC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90cmlnaHRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChzZWwucmVmUG9pbnQueCArIHNlbC53IC0gMyksIGcybHkoc2VsLnJlZlBvaW50LnkgKyBzZWwuaCAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJvdGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChzZWwucmVmUG9pbnQueCAtIDMpLCBnMmx5KHNlbC5yZWZQb2ludC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlU2hhcGVPcmRlcihzaGFwZTogU2hhcGUsIGRlc3RpbmF0aW9uSW5kZXg6IG51bWJlciwgc3luYzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IG9sZElkeCA9IHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpO1xyXG4gICAgICAgIGlmIChvbGRJZHggPT09IGRlc3RpbmF0aW9uSW5kZXgpIHJldHVybjtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2Uob2xkSWR4LCAxKTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoZGVzdGluYXRpb25JbmRleCwgMCwgc2hhcGUpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcIm1vdmVTaGFwZU9yZGVyXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIGluZGV4OiBkZXN0aW5hdGlvbkluZGV4fSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblNoYXBlTW92ZShzaGFwZT86IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRMYXllciBleHRlbmRzIExheWVyIHtcclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dMYXllciBleHRlbmRzIExheWVyIHtcclxuXHJcbiAgICBhZGRTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc3VwZXIuYWRkU2hhcGUoc2hhcGUsIHN5bmMsIHRlbXBvcmFyeSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0U2hhcGVzKHNoYXBlczogU2VydmVyU2hhcGVbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGMgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgc2hhcGUuZmlsbCA9IGM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3VwZXIuc2V0U2hhcGVzKHNoYXBlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU6IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLm9uU2hhcGVNb3ZlKHNoYXBlKTtcclxuICAgIH07XHJcblxyXG4gICAgZHJhdygpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdfb3AgPSBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9nYWxwaGEgPSB0aGlzLmN0eC5nbG9iYWxBbHBoYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiY29weVwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBvZ2FscGhhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJ0b2tlbnNcIikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcInRva2Vuc1wiKSEuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaC5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYiA9IHNoLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IGcybChzaC5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxtID0gMC44ICogZzJseihiYi53KTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAobHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxzLnNoYXBlKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPbGQgbGlnaHRzb3VyY2Ugc3RpbGwgbGluZ2VyaW5nIGluIHRoZSBnYW1lTWFuYWdlciBsaXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbGVuZ3RoID0gZ2V0VW5pdERpc3RhbmNlKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsY2VudGVyID0gZzJsKGNlbnRlcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gbmV3IENpcmNsZShjZW50ZXIsIGF1cmFfbGVuZ3RoKS5nZXRCb3VuZGluZ0JveCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNvbGxlY3QgYWxsIGxpZ2h0YmxvY2tlcnMgdGhhdCBhcmUgaW5zaWRlL2Nyb3NzIG91ciBhdXJhXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHRvIHByZXZlbnQgYXMgbWFueSByYXkgY2FsY3VsYXRpb25zIGFzIHBvc3NpYmxlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbF9saWdodGJsb2NrZXJzOiBCb3VuZGluZ1JlY3RbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5mb3JFYWNoKGZ1bmN0aW9uIChsYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYiA9PT0gc2gudXVpZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX3NoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbGJfc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfYmIuaW50ZXJzZWN0c1dpdGgoYmJveCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2xpZ2h0YmxvY2tlcnMucHVzaChsYl9iYik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyY19zdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FzdCByYXlzIGluIGV2ZXJ5IGRlZ3JlZVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYW5nbGUgPSAwOyBhbmdsZSA8IDIgKiBNYXRoLlBJOyBhbmdsZSArPSAoMSAvIDE4MCkgKiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaGl0IHdpdGggb2JzdHJ1Y3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgaGl0OiB7aW50ZXJzZWN0OiBHbG9iYWxQb2ludHxudWxsLCBkaXN0YW5jZTpudW1iZXJ9ID0ge2ludGVyc2VjdDogbnVsbCwgZGlzdGFuY2U6IEluZmluaXR5fTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0OiBudWxsfEJvdW5kaW5nUmVjdCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPGxvY2FsX2xpZ2h0YmxvY2tlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfYmIgPSBsb2NhbF9saWdodGJsb2NrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsYl9iYi5nZXRJbnRlcnNlY3RXaXRoTGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogY2VudGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgR2xvYmFsUG9pbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXIueSArIGF1cmFfbGVuZ3RoICogTWF0aC5zaW4oYW5nbGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmludGVyc2VjdCAhPT0gbnVsbCAmJiByZXN1bHQuZGlzdGFuY2UgPCBoaXQuZGlzdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlX2hpdCA9IGxiX2JiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgbm8gaGl0LCBjaGVjayBpZiB3ZSBjb21lIGZyb20gYSBwcmV2aW91cyBoaXQgc28gdGhhdCB3ZSBjYW4gZ28gYmFjayB0byB0aGUgYXJjXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpdC5pbnRlcnNlY3QgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IGFuZ2xlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzdCA9IGcybChuZXcgR2xvYmFsUG9pbnQoY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSwgY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGhpdCAsIGZpcnN0IGZpbmlzaCBhbnkgb25nb2luZyBhcmMsIHRoZW4gbW92ZSB0byB0aGUgaW50ZXJzZWN0aW9uIHBvaW50XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgZzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCBhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFYID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGVfaGl0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhWCA9IChzaGFwZV9oaXQudyAvIDEwKSAqIE1hdGguY29zKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFZID0gKHNoYXBlX2hpdC5oIC8gMTApICogTWF0aC5zaW4oYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoIXNoYXBlX2hpdC5jb250YWlucyhoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgsIGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc3QgPSBnMmwobmV3IEdsb2JhbFBvaW50KGhpdC5pbnRlcnNlY3QueCArIGV4dHJhWCwgaGl0LmludGVyc2VjdC55ICsgZXh0cmFZKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ICE9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCBnMmxyKGF1cmEudmFsdWUpLCBhcmNfc3RhcnQsIDIgKiBNYXRoLlBJKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbG0gPSBnMmxyKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsIDAsIDAsIDEpJyk7XHJcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgIC8vIGN0eC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMCwgMCwgMSlcIjtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVyk7XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBzb2NrZXQgZnJvbSAnLi9zb2NrZXQnXHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7IExheWVyTWFuYWdlciwgTGF5ZXIsIEdyaWRMYXllciwgRk9XTGF5ZXIgfSBmcm9tIFwiLi9sYXllcnNcIjtcclxuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgQm9hcmRJbmZvLCBTZXJ2ZXJTaGFwZSwgSW5pdGlhdGl2ZURhdGEgfSBmcm9tICcuL2FwaV90eXBlcyc7XHJcbmltcG9ydCB7IE9yZGVyZWRNYXAgfSBmcm9tICcuL3V0aWxzJztcclxuaW1wb3J0IEFzc2V0IGZyb20gJy4vc2hhcGVzL2Fzc2V0JztcclxuaW1wb3J0IHtjcmVhdGVTaGFwZUZyb21EaWN0fSBmcm9tICcuL3NoYXBlcy91dGlscyc7XHJcbmltcG9ydCB7IERyYXdUb29sLCBSdWxlclRvb2wsIE1hcFRvb2wsIEZPV1Rvb2wsIEluaXRpYXRpdmVUcmFja2VyLCBUb29sIH0gZnJvbSBcIi4vdG9vbHNcIjtcclxuaW1wb3J0IHsgTG9jYWxQb2ludCwgR2xvYmFsUG9pbnQgfSBmcm9tICcuL2dlb20nO1xyXG5pbXBvcnQgUmVjdCBmcm9tICcuL3NoYXBlcy9yZWN0JztcclxuXHJcbmNsYXNzIEdhbWVNYW5hZ2VyIHtcclxuICAgIElTX0RNID0gZmFsc2U7XHJcbiAgICByb29tTmFtZSE6IHN0cmluZztcclxuICAgIHJvb21DcmVhdG9yITogc3RyaW5nO1xyXG4gICAgbG9jYXRpb25OYW1lITogc3RyaW5nO1xyXG4gICAgdXNlcm5hbWUhOiBzdHJpbmc7XHJcbiAgICBib2FyZF9pbml0aWFsaXNlZCA9IGZhbHNlO1xyXG4gICAgbGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcigpO1xyXG4gICAgc2VsZWN0ZWRUb29sOiBudW1iZXIgPSAwO1xyXG4gICAgdG9vbHM6IE9yZGVyZWRNYXA8c3RyaW5nLCBUb29sPiA9IG5ldyBPcmRlcmVkTWFwKCk7XHJcbiAgICBsaWdodHNvdXJjZXM6IHsgc2hhcGU6IHN0cmluZywgYXVyYTogc3RyaW5nIH1bXSA9IFtdO1xyXG4gICAgbGlnaHRibG9ja2Vyczogc3RyaW5nW10gPSBbXTtcclxuICAgIG1vdmVtZW50YmxvY2tlcnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBncmlkQ29sb3VyID0gJChcIiNncmlkQ29sb3VyXCIpO1xyXG4gICAgZm93Q29sb3VyID0gJChcIiNmb3dDb2xvdXJcIik7XHJcbiAgICBpbml0aWF0aXZlVHJhY2tlciA9IG5ldyBJbml0aWF0aXZlVHJhY2tlcigpO1xyXG4gICAgc2hhcGVTZWxlY3Rpb25EaWFsb2cgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmRpYWxvZyh7XHJcbiAgICAgICAgYXV0b09wZW46IGZhbHNlLFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0pO1xyXG4gICAgaW5pdGlhdGl2ZURpYWxvZyA9ICQoXCIjaW5pdGlhdGl2ZWRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJzE2MHB4J1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5ncmlkQ29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBcInJnYmEoMjU1LDAsMCwgMC41KVwiLFxyXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwgeyAnZ3JpZENvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5mb3dDb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBcInJnYig4MiwgODEsIDgxKVwiLFxyXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGwuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlLmZpbGwgPSBjb2xvdXIudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwgeyAnZm93Q29sb3VyJzogY29sb3VyLnRvUmdiU3RyaW5nKCkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEJvYXJkKHJvb206IEJvYXJkSW5mbyk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcigpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyc2RpdiA9ICQoJyNsYXllcnMnKTtcclxuICAgICAgICBsYXllcnNkaXYuZW1wdHkoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNlbGVjdGRpdiA9ICQoJyNsYXllcnNlbGVjdCcpO1xyXG4gICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoXCJ1bFwiKS5lbXB0eSgpO1xyXG4gICAgICAgIGxldCBzZWxlY3RhYmxlX2xheWVycyA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxtID0gJChcIiNsb2NhdGlvbnMtbWVudVwiKS5maW5kKFwiZGl2XCIpO1xyXG4gICAgICAgIGxtLmNoaWxkcmVuKCkub2ZmKCk7XHJcbiAgICAgICAgbG0uZW1wdHkoKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb20ubG9jYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYyA9ICQoXCI8ZGl2PlwiICsgcm9vbS5sb2NhdGlvbnNbaV0gKyBcIjwvZGl2PlwiKTtcclxuICAgICAgICAgICAgbG0uYXBwZW5kKGxvYyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxtcGx1cyA9ICQoJzxkaXY+PGkgY2xhc3M9XCJmYXMgZmEtcGx1c1wiPjwvaT48L2Rpdj4nKTtcclxuICAgICAgICBsbS5hcHBlbmQobG1wbHVzKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jbmFtZSA9IHByb21wdChcIk5ldyBsb2NhdGlvbiBuYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvY25hbWUgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJuZXcgbG9jYXRpb25cIiwgbG9jbmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcImNoYW5nZSBsb2NhdGlvblwiLCBlLnRhcmdldC50ZXh0Q29udGVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmJvYXJkLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBuZXdfbGF5ZXIgPSByb29tLmJvYXJkLmxheWVyc1tpXTtcclxuICAgICAgICAgICAgLy8gVUkgY2hhbmdlc1xyXG4gICAgICAgICAgICBsYXllcnNkaXYuYXBwZW5kKFwiPGNhbnZhcyBpZD0nXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiLWxheWVyJyBzdHlsZT0nei1pbmRleDogXCIgKyBpICsgXCInPjwvY2FudmFzPlwiKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5zZWxlY3RhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXh0cmEgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RhYmxlX2xheWVycyA9PT0gMCkgZXh0cmEgPSBcIiBjbGFzcz0nbGF5ZXItc2VsZWN0ZWQnXCI7XHJcbiAgICAgICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKCd1bCcpLmFwcGVuZChcIjxsaSBpZD0nc2VsZWN0LVwiICsgbmV3X2xheWVyLm5hbWUgKyBcIidcIiArIGV4dHJhICsgXCI+PGEgaHJlZj0nIyc+XCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZV9sYXllcnMgKz0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+JCgnIycgKyBuZXdfbGF5ZXIubmFtZSArICctbGF5ZXInKVswXTtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIFN0YXRlIGNoYW5nZXNcclxuICAgICAgICAgICAgbGV0IGw6IExheWVyO1xyXG4gICAgICAgICAgICBpZiAobmV3X2xheWVyLmdyaWQpXHJcbiAgICAgICAgICAgICAgICBsID0gbmV3IEdyaWRMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAobmV3X2xheWVyLm5hbWUgPT09ICdmb3cnKVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBGT1dMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgbC5zZWxlY3RhYmxlID0gbmV3X2xheWVyLnNlbGVjdGFibGU7XHJcbiAgICAgICAgICAgIGwucGxheWVyX2VkaXRhYmxlID0gbmV3X2xheWVyLnBsYXllcl9lZGl0YWJsZTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmFkZExheWVyKGwpO1xyXG4gICAgICAgICAgICBpZiAobmV3X2xheWVyLmdyaWQpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShuZXdfbGF5ZXIuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgICAgICQoXCIjZ3JpZC1sYXllclwiKS5kcm9wcGFibGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdDogXCIuZHJhZ2dhYmxlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZHJvcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIgdG8gZHJvcCB0aGUgdG9rZW4gb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgakNhbnZhcyA9ICQobC5jYW52YXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoakNhbnZhcy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJDYW52YXMgbWlzc2luZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSBqQ2FudmFzLm9mZnNldCgpITtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IG5ldyBMb2NhbFBvaW50KHVpLm9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQsIHVpLm9mZnNldC50b3AgLSBvZmZzZXQudG9wKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnggPCBzZXR0aW5nc19tZW51LndpZHRoKCkhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSAmJiBsb2MueSA8IGxvY2F0aW9uc19tZW51LndpZHRoKCkhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWR0aCA9IHVpLmhlbHBlclswXS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGVpZ2h0ID0gdWkuaGVscGVyWzBdLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2xvYyA9IGwyZyhsb2MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWcgPSA8SFRNTEltYWdlRWxlbWVudD51aS5kcmFnZ2FibGVbMF0uY2hpbGRyZW5bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gbmV3IEFzc2V0KGltZywgd2xvYywgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQuc3JjID0gbmV3IFVSTChpbWcuc3JjKS5wYXRobmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5yZWZQb2ludC54ID0gTWF0aC5yb3VuZChhc3NldC5yZWZQb2ludC54IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5yZWZQb2ludC55ID0gTWF0aC5yb3VuZChhc3NldC5yZWZQb2ludC55IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC53ID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LmggPSBNYXRoLm1heChNYXRoLnJvdW5kKGFzc2V0LmggLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsLmFkZFNoYXBlKGFzc2V0LCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGwuc2V0U2hhcGVzKG5ld19sYXllci5zaGFwZXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZvcmNlIHRoZSBjb3JyZWN0IG9wYWNpdHkgcmVuZGVyIG9uIG90aGVyIGxheWVycy5cclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhLm5hbWUpO1xyXG4gICAgICAgIC8vIHNvY2tldC5lbWl0KFwiY2xpZW50IGluaXRpYWxpc2VkXCIpO1xyXG4gICAgICAgIHRoaXMuYm9hcmRfaW5pdGlhbGlzZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPiAxKSB7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoXCJsaVwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmlkLnNwbGl0KFwiLVwiKVsxXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9sZCA9IGxheWVyc2VsZWN0ZGl2LmZpbmQoXCIjc2VsZWN0LVwiICsgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgIT09IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImxheWVyLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9sZC5yZW1vdmVDbGFzcyhcImxheWVyLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRMYXllcihuYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRTaGFwZShzaGFwZTogU2VydmVyU2hhcGUpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XHJcbiAgICAgICAgY29uc3Qgc2ggPSBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlKTtcclxuICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtzaGFwZS50eXBlfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUoc2gsIGZhbHNlKTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBtb3ZlU2hhcGUoc2hhcGU6IFNlcnZlclNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2ggPSBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlLCB0cnVlKTtcclxuICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtzaGFwZS50eXBlfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVhbF9zaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCksIHNoKTtcclxuICAgICAgICByZWFsX3NoYXBlLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIocmVhbF9zaGFwZS5sYXllcikhLm9uU2hhcGVNb3ZlKHJlYWxfc2hhcGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZVNoYXBlKGRhdGE6IHtzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbjt9KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoZGF0YS5zaGFwZS5sYXllcikpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7ZGF0YS5zaGFwZS5sYXllcn0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2ggPSBjcmVhdGVTaGFwZUZyb21EaWN0KGRhdGEuc2hhcGUsIHRydWUpO1xyXG4gICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gdHlwZSAke2RhdGEuc2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoYXBlID0gT2JqZWN0LmFzc2lnbih0aGlzLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpLCBzaCk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChkYXRhLnJlZHJhdylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoZGF0YS5zaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEluaXRpYXRpdmUoZGF0YTogSW5pdGlhdGl2ZURhdGFbXSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaW5pdGlhdGl2ZVRyYWNrZXIuZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5yZWRyYXcoKTtcclxuICAgICAgICBpZiAoZGF0YS5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDbGllbnRPcHRpb25zKG9wdGlvbnM6IENsaWVudE9wdGlvbnMpOiB2b2lkIHtcclxuICAgICAgICBpZiAob3B0aW9ucy5ncmlkQ29sb3VyKVxyXG4gICAgICAgICAgICB0aGlzLmdyaWRDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5ncmlkQ29sb3VyKTtcclxuICAgICAgICBpZiAob3B0aW9ucy5mb3dDb2xvdXIpIHtcclxuICAgICAgICAgICAgdGhpcy5mb3dDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5mb3dDb2xvdXIpO1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9uT3B0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbk9wdGlvbnNbYCR7Z2FtZU1hbmFnZXIucm9vbU5hbWV9LyR7Z2FtZU1hbmFnZXIucm9vbUNyZWF0b3J9LyR7Z2FtZU1hbmFnZXIubG9jYXRpb25OYW1lfWBdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSBvcHRpb25zLmxvY2F0aW9uT3B0aW9uc1tgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF07XHJcbiAgICAgICAgICAgICAgICBpZiAobG9jLnBhblgpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIucGFuWCA9IGxvYy5wYW5YO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYy5wYW5ZKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnBhblkgPSBsb2MucGFuWTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2Muem9vbUZhY3Rvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IgPSBsb2Muem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3pvb21lclwiKS5zbGlkZXIoeyB2YWx1ZTogMSAvIGxvYy56b29tRmFjdG9yIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5sZXQgZ2FtZU1hbmFnZXIgPSBuZXcgR2FtZU1hbmFnZXIoKTtcclxuKDxhbnk+d2luZG93KS5nYW1lTWFuYWdlciA9IGdhbWVNYW5hZ2VyO1xyXG4oPGFueT53aW5kb3cpLkdQID0gR2xvYmFsUG9pbnQ7XHJcbig8YW55PndpbmRvdykuQXNzZXQgPSBBc3NldDtcclxuXHJcbi8vICoqKiogU0VUVVAgVUkgKioqKlxyXG5cclxuLy8gcHJldmVudCBkb3VibGUgY2xpY2tpbmcgdGV4dCBzZWxlY3Rpb25cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICAkbWVudS5oaWRlKCk7XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VEb3duKGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VNb3ZlKGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlVXAoZSk7XHJcbn1cclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG9uUG9pbnRlckRvd24pO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvblBvaW50ZXJNb3ZlKTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uUG9pbnRlclVwKTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uIChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoZS5idXR0b24gIT09IDIgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uQ29udGV4dE1lbnUoZSk7XHJcbn0pO1xyXG5cclxuJChcIiN6b29tZXJcIikuc2xpZGVyKHtcclxuICAgIG9yaWVudGF0aW9uOiBcInZlcnRpY2FsXCIsXHJcbiAgICBtaW46IDAuNSxcclxuICAgIG1heDogNS4wLFxyXG4gICAgc3RlcDogMC4xLFxyXG4gICAgdmFsdWU6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yLFxyXG4gICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICBjb25zdCBvcmlnWiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IG5ld1ogPSAxIC8gdWkudmFsdWUhO1xyXG4gICAgICAgIGNvbnN0IG9yaWdYID0gd2luZG93LmlubmVyV2lkdGggLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdYID0gd2luZG93LmlubmVyV2lkdGggLyBuZXdaO1xyXG4gICAgICAgIGNvbnN0IG9yaWdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gb3JpZ1o7XHJcbiAgICAgICAgY29uc3QgbmV3WSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIG5ld1o7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IgPSBuZXdaO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YIC09IChvcmlnWCAtIG5ld1gpIC8gMjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWSAtPSAob3JpZ1kgLSBuZXdZKSAvIDI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHtcclxuICAgICAgICAgICAgbG9jYXRpb25PcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBbYCR7Z2FtZU1hbmFnZXIucm9vbU5hbWV9LyR7Z2FtZU1hbmFnZXIucm9vbUNyZWF0b3J9LyR7Z2FtZU1hbmFnZXIubG9jYXRpb25OYW1lfWBdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuWDogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblgsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFuWTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblksXHJcbiAgICAgICAgICAgICAgICAgICAgem9vbUZhY3RvcjogbmV3WixcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XHJcbiRtZW51LmhpZGUoKTtcclxuXHJcbmNvbnN0IHNldHRpbmdzX21lbnUgPSAkKFwiI21lbnVcIikhO1xyXG5jb25zdCBsb2NhdGlvbnNfbWVudSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikhO1xyXG5jb25zdCBsYXllcl9tZW51ID0gJChcIiNsYXllcnNlbGVjdFwiKSE7XHJcbiQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG5cclxuJCgnI3JtLXNldHRpbmdzJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKHNldHRpbmdzX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIsIHdpZHRoOiBcIis9MjAwcHhcIiB9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0dGluZ3NfbWVudS5hbmltYXRlKHsgd2lkdGg6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiwgd2lkdGg6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxheWVyX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoJyNybS1sb2NhdGlvbnMnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG9yZGVyIG9mIGFuaW1hdGlvbiBpcyBpbXBvcnRhbnQsIGl0IG90aGVyd2lzZSB3aWxsIHNvbWV0aW1lcyBzaG93IGEgc21hbGwgZ2FwIGJldHdlZW4gdGhlIHR3byBvYmplY3RzXHJcbiAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCItPTEwMHB4XCIgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGhlaWdodDogJ3RvZ2dsZScgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBoZWlnaHQ6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCIrPTEwMHB4XCIgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxud2luZG93Lm9ucmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFdpZHRoKHdpbmRvdy5pbm5lcldpZHRoKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRIZWlnaHQod2luZG93LmlubmVySGVpZ2h0KTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbn07XHJcblxyXG4kKCdib2R5Jykua2V5dXAoZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmIChlLmtleUNvZGUgPT09IDQ2ICYmIGUudGFyZ2V0LnRhZ05hbWUgIT09IFwiSU5QVVRcIikge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciBzZWxlY3RlZCBmb3IgZGVsZXRlIG9wZXJhdGlvblwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGwuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICBsLnJlbW92ZVNoYXBlKHNlbCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5yZW1vdmVJbml0aWF0aXZlKHNlbC51dWlkLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJChcIiNncmlkU2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCBncyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKGdzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGdyaWRzaXplXCIsIGdzKTtcclxufSk7XHJcblxyXG4kKFwiI3VuaXRTaXplSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVzID0gcGFyc2VJbnQoKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZSk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VW5pdFNpemUodXMpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VuaXRTaXplJzogdXMgfSk7XHJcbn0pO1xyXG4kKFwiI3VzZUdyaWRJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWcgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VXNlR3JpZCh1Zyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAndXNlR3JpZCc6IHVnIH0pO1xyXG59KTtcclxuJChcIiN1c2VGT1dJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWYgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0RnVsbEZPVyh1Zik7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAnZnVsbEZPVyc6IHVmIH0pO1xyXG59KTtcclxuJChcIiNmb3dPcGFjaXR5XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBsZXQgZm8gPSBwYXJzZUZsb2F0KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgaWYgKGlzTmFOKGZvKSkge1xyXG4gICAgICAgICQoXCIjZm93T3BhY2l0eVwiKS52YWwoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHkpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChmbyA8IDApIGZvID0gMDtcclxuICAgIGlmIChmbyA+IDEpIGZvID0gMTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGT1dPcGFjaXR5KGZvKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICdmb3dPcGFjaXR5JzogZm8gfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZU1hbmFnZXI7IiwiaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL2Jhc2VyZWN0XCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBnMmx4LCBnMmx5LCBnMmx6IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyQXNzZXQgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBc3NldCBleHRlbmRzIEJhc2VSZWN0IHtcclxuICAgIHR5cGUgPSBcImFzc2V0XCI7XHJcbiAgICBpbWc6IEhUTUxJbWFnZUVsZW1lbnQ7XHJcbiAgICBzcmM6IHN0cmluZyA9ICcnO1xyXG4gICAgY29uc3RydWN0b3IoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCB0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB3LCBoKTtcclxuICAgICAgICBpZiAodXVpZCAhPT0gdW5kZWZpbmVkKSB0aGlzLnV1aWQgPSB1dWlkO1xyXG4gICAgICAgIHRoaXMuaW1nID0gaW1nO1xyXG4gICAgfVxyXG4gICAgYXNEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICBzcmM6IHRoaXMuc3JjXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlckFzc2V0KSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgdGhpcy5zcmMgPSBkYXRhLnNyYztcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgZzJseCh0aGlzLnJlZlBvaW50LngpLCBnMmx5KHRoaXMucmVmUG9pbnQueSksIGcybHoodGhpcy53KSwgZzJseih0aGlzLmgpKTtcclxuICAgIH1cclxuICAgIGdldEluaXRpYXRpdmVSZXByKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcclxuICAgICAgICAgICAgdmlzaWJsZTogIWdhbWVNYW5hZ2VyLklTX0RNLFxyXG4gICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgIHNyYzogXCJcIixcclxuICAgICAgICAgICAgb3duZXJzOiB0aGlzLm93bmVyc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCwgVmVjdG9yIH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgZzJseCwgZzJseSB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQmFzZVJlY3QgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB3OiBudW1iZXI7XHJcbiAgICBoOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB1dWlkKTtcclxuICAgICAgICB0aGlzLncgPSB3O1xyXG4gICAgICAgIHRoaXMuaCA9IGg7XHJcbiAgICB9XHJcbiAgICBnZXRCYXNlRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihzdXBlci5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHc6IHRoaXMudyxcclxuICAgICAgICAgICAgaDogdGhpcy5oXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQsIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggPD0gcG9pbnQueCAmJiAodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA+PSBwb2ludC54ICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA8PSBwb2ludC55ICYmICh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpID49IHBvaW50Lnk7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgc3dpdGNoIChjb3JuZXIpIHtcclxuICAgICAgICAgICAgY2FzZSAnbmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnbncnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc3cnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc2UnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJud1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibndcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQuYWRkKG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHt4OiB0aGlzLncvMiwgeTogdGhpcy5oLzJ9KSk7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcblxyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gIShnMmx4KHRoaXMucmVmUG9pbnQueCkgPiBjYW52YXMud2lkdGggfHwgZzJseSh0aGlzLnJlZlBvaW50LnkpID4gY2FudmFzLmhlaWdodCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGcybHgodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA8IDAgfHwgZzJseSh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpIDwgMCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBnZXRMaW5lc0ludGVyc2VjdFBvaW50LCBnZXRQb2ludERpc3RhbmNlLCBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGwyZ3gsIGwyZ3kgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJvdW5kaW5nUmVjdCB7XHJcbiAgICB0eXBlID0gXCJib3VuZHJlY3RcIjtcclxuICAgIHJlZlBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIHc6IG51bWJlcjtcclxuICAgIGg6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gdG9wbGVmdDtcclxuICAgICAgICB0aGlzLncgPSB3O1xyXG4gICAgICAgIHRoaXMuaCA9IGg7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCA8PSBwb2ludC54ICYmICh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncpID49IHBvaW50LnggJiZcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55IDw9IHBvaW50LnkgJiYgKHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCkgPj0gcG9pbnQueTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnNlY3RzV2l0aChvdGhlcjogQm91bmRpbmdSZWN0KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuICEob3RoZXIucmVmUG9pbnQueCA+PSB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgfHxcclxuICAgICAgICAgICAgb3RoZXIucmVmUG9pbnQueCArIG90aGVyLncgPD0gdGhpcy5yZWZQb2ludC54IHx8XHJcbiAgICAgICAgICAgIG90aGVyLnJlZlBvaW50LnkgPj0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIHx8XHJcbiAgICAgICAgICAgIG90aGVyLnJlZlBvaW50LnkgKyBvdGhlci5oIDw9IHRoaXMucmVmUG9pbnQueSk7XHJcbiAgICB9XHJcbiAgICBnZXRJbnRlcnNlY3RXaXRoTGluZShsaW5lOiB7IHN0YXJ0OiBHbG9iYWxQb2ludDsgZW5kOiBHbG9iYWxQb2ludCB9KSB7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSBbXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55KSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCArIHRoaXMudywgdGhpcy5yZWZQb2ludC55KSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54LCB0aGlzLnJlZlBvaW50LnkpLCBuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54LCB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpLCBsaW5lLnN0YXJ0LCBsaW5lLmVuZCksXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCArIHRoaXMudywgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbGluZS5zdGFydCwgbGluZS5lbmQpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBsZXQgbWluX2QgPSBJbmZpbml0eTtcclxuICAgICAgICBsZXQgbWluX2kgPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbCA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBpZiAobC5pbnRlcnNlY3QgPT09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBkID0gZ2V0UG9pbnREaXN0YW5jZShsaW5lLnN0YXJ0LCBsLmludGVyc2VjdCk7XHJcbiAgICAgICAgICAgIGlmIChtaW5fZCA+IGQpIHtcclxuICAgICAgICAgICAgICAgIG1pbl9kID0gZDtcclxuICAgICAgICAgICAgICAgIG1pbl9pID0gbC5pbnRlcnNlY3Q7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgaW50ZXJzZWN0OiBtaW5faSwgZGlzdGFuY2U6IG1pbl9kIH1cclxuICAgIH1cclxufSIsImltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgeyBnMmwsIGcybHgsIGcybHkgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJDaXJjbGUgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaXJjbGUgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB0eXBlID0gXCJjaXJjbGVcIjtcclxuICAgIHI6IG51bWJlcjtcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IoY2VudGVyOiBHbG9iYWxQb2ludCwgcjogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcihjZW50ZXIsIHV1aWQpO1xyXG4gICAgICAgIHRoaXMuciA9IHIgfHwgMTtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH07XHJcbiAgICBhc0RpY3QoKTogU2VydmVyQ2lyY2xlIHtcclxuICAgICAgICAvLyBjb25zdCBiYXNlID0gPFNlcnZlckNpcmNsZT50aGlzLmdldEJhc2VEaWN0KCk7XHJcbiAgICAgICAgLy8gYmFzZS5yID0gdGhpcy5yO1xyXG4gICAgICAgIC8vIGJhc2UuYm9yZGVyID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgLy8gcmV0dXJuIGJhc2U7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHI6IHRoaXMucixcclxuICAgICAgICAgICAgYm9yZGVyOiB0aGlzLmJvcmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyQ2lyY2xlKSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgdGhpcy5yID0gZGF0YS5yO1xyXG4gICAgICAgIGlmKGRhdGEuYm9yZGVyKVxyXG4gICAgICAgICAgICB0aGlzLmJvcmRlciA9IGRhdGEuYm9yZGVyO1xyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54IC0gdGhpcy5yLCB0aGlzLnJlZlBvaW50LnkgLSB0aGlzLnIpLCB0aGlzLnIgKiAyLCB0aGlzLnIgKiAyKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XHJcbiAgICAgICAgY29uc3QgbG9jID0gZzJsKHRoaXMucmVmUG9pbnQpO1xyXG4gICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgIGlmICh0aGlzLmJvcmRlciAhPT0gXCJyZ2JhKDAsIDAsIDAsIDApXCIpIHtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIChwb2ludC54IC0gdGhpcy5yZWZQb2ludC54KSAqKiAyICsgKHBvaW50LnkgLSB0aGlzLnJlZlBvaW50LnkpICoqIDIgPCB0aGlzLnIgKiogMjtcclxuICAgIH1cclxuICAgIGluQ29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCwgY29ybmVyOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vVE9ET1xyXG4gICAgfVxyXG4gICAgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCkge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm5lXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJuZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInN3XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzd1wiO1xyXG4gICAgfVxyXG4gICAgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBHbG9iYWxQb2ludCk6IEdsb2JhbFBvaW50IHwgdm9pZCB7XHJcbiAgICAgICAgaWYgKGNlbnRlclBvaW50ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50O1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQgPSBjZW50ZXJQb2ludDtcclxuICAgIH1cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgdXVpZHY0IH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBvcHVsYXRlRWRpdEFzc2V0RGlhbG9nKHNlbGY6IFNoYXBlKSB7XHJcbiAgICAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKHNlbGYudXVpZCk7XHJcbiAgICBjb25zdCBkaWFsb2dfbmFtZSA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbmFtZVwiKTtcclxuICAgIGRpYWxvZ19uYW1lLnZhbChzZWxmLm5hbWUpO1xyXG4gICAgZGlhbG9nX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBzLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoXCIjc2VsZWN0aW9uLW5hbWVcIikudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRpYWxvZ19saWdodGJsb2NrID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1saWdodGJsb2NrZXJcIik7XHJcbiAgICBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLnZpc2lvbk9ic3RydWN0aW9uKTtcclxuICAgIGRpYWxvZ19saWdodGJsb2NrLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBzLnZpc2lvbk9ic3RydWN0aW9uID0gZGlhbG9nX2xpZ2h0YmxvY2sucHJvcChcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgIHMuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRpYWxvZ19tb3ZlYmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW1vdmVibG9ja2VyXCIpO1xyXG4gICAgZGlhbG9nX21vdmVibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgZGlhbG9nX21vdmVibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgcy5zZXRNb3ZlbWVudEJsb2NrKGRpYWxvZ19tb3ZlYmxvY2sucHJvcChcImNoZWNrZWRcIikpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBvd25lcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW93bmVyc1wiKTtcclxuICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy10cmFja2Vyc1wiKTtcclxuICAgIGNvbnN0IGF1cmFzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1hdXJhc1wiKTtcclxuICAgIG93bmVycy5uZXh0VW50aWwodHJhY2tlcnMpLnJlbW92ZSgpO1xyXG4gICAgdHJhY2tlcnMubmV4dFVudGlsKGF1cmFzKS5yZW1vdmUoKTtcclxuICAgIGF1cmFzLm5leHRVbnRpbCgkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmZpbmQoXCJmb3JtXCIpKS5yZW1vdmUoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRPd25lcihvd25lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3Qgb3dfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtbmFtZT1cIiR7b3duZXJ9XCIgdmFsdWU9XCIke293bmVyfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCBvd19yZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgdHJhY2tlcnMuYmVmb3JlKG93X25hbWUuYWRkKG93X3JlbW92ZSkpO1xyXG5cclxuICAgICAgICBvd19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgaWYgKG93X2kgPj0gMClcclxuICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxLCA8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5wdXNoKDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG93X3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGYub3duZXJzLmZvckVhY2goYWRkT3duZXIpO1xyXG4gICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKVxyXG4gICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZFRyYWNrZXIodHJhY2tlcjogVHJhY2tlcikge1xyXG4gICAgICAgIGNvbnN0IHRyX25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci5uYW1lfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCB0cl92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci52YWx1ZX1cIj5gKTtcclxuICAgICAgICBjb25zdCB0cl9tYXh2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIk1heCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLm1heHZhbHVlIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgdHJfdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IHRyX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICBhdXJhcy5iZWZvcmUoXHJcbiAgICAgICAgICAgIHRyX25hbWVcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+Lzwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl9tYXh2YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl9yZW1vdmUpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCF0cmFja2VyLnZpc2libGUpXHJcbiAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICB0cl9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTmFtZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LW5hbWVgKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLnRyYWNrZXJzLmxlbmd0aCB8fCBzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnB1c2goeyB1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAwLCBtYXh2YWx1ZTogMCwgdmlzaWJsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICBhZGRUcmFja2VyKHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0cl92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWYWx1ZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdHJfbWF4dmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWF6dmFsdWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ci5tYXh2YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVtb3ZlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHIubmFtZSA9PT0gJycgfHwgdHIudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3RyLnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnNwbGljZShzZWxmLnRyYWNrZXJzLmluZGV4T2YodHIpLCAxKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZpc2liaWxpdHkgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHIudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgdHIudmlzaWJsZSA9ICF0ci52aXNpYmxlO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxmLnRyYWNrZXJzLmZvckVhY2goYWRkVHJhY2tlcik7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkQXVyYShhdXJhOiBBdXJhKSB7XHJcbiAgICAgICAgY29uc3QgYXVyYV9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS52YWx1ZX1cIj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX2RpbXZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiRGltIHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEuZGltIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9jb2xvdXIgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkF1cmEgY29sb3VyXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9saWdodCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtbGlnaHRidWxiXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfcmVtb3ZlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuY2hpbGRyZW4oKS5sYXN0KCkuYXBwZW5kKFxyXG4gICAgICAgICAgICBhdXJhX25hbWVcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfZGltdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZCgkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApLmFwcGVuZChhdXJhX2NvbG91cikuYXBwZW5kKCQoXCI8L2Rpdj5cIikpKVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX3Zpc2libGUpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfbGlnaHQpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfcmVtb3ZlKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghYXVyYS52aXNpYmxlKVxyXG4gICAgICAgICAgICBhdXJhX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgIGlmICghYXVyYS5saWdodFNvdXJjZSlcclxuICAgICAgICAgICAgYXVyYV9saWdodC5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcblxyXG4gICAgICAgIGF1cmFfY29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBhdXJhLmNvbG91cixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gbW92ZSB1bmtub3duIGF1cmEgY29sb3VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIERvIG5vdCB1c2UgYXVyYSBkaXJlY3RseSBhcyBpdCBkb2VzIG5vdCB3b3JrIHByb3Blcmx5IGZvciBuZXcgYXVyYXNcclxuICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYXVyYV9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSBuYW1lIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLmF1cmFzLmxlbmd0aCB8fCBzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIHZhbHVlIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX2RpbXZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgZGltdmFsdWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1LnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYXUubmFtZSA9PT0gJycgJiYgYXUudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke2F1LnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLmF1cmFzLnNwbGljZShzZWxmLmF1cmFzLmluZGV4T2YoYXUpLCAxKTtcclxuICAgICAgICAgICAgc2VsZi5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgdmlzaWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUudmlzaWJsZSA9ICFhdS52aXNpYmxlO1xyXG4gICAgICAgICAgICBpZiAoYXUudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV9saWdodC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHRvZ2dsZSBsaWdodCBjYXBhYmlsaXR5IG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS5saWdodFNvdXJjZSA9ICFhdS5saWdodFNvdXJjZTtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIGxzLnB1c2goeyBzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxmLmF1cmFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW2ldKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZ2FtZU1hbmFnZXIuc2hhcGVTZWxlY3Rpb25EaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuXHJcbiAgICAkKCcuc2VsZWN0aW9uLXRyYWNrZXItdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKHRyYWNrZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB1cGRhdGUgdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG5ld190cmFja2VyID0gcHJvbXB0KGBOZXcgICR7dHJhY2tlci5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgIGlmIChuZXdfdHJhY2tlciA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGlmICh0cmFja2VyLnZhbHVlID09PSAwKVxyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlID0gMDtcclxuICAgICAgICBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlICs9IHBhcnNlSW50KG5ld190cmFja2VyLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5ld190cmFja2VyWzBdID09PSAnLScpIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSAtPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSA9IHBhcnNlSW50KG5ld190cmFja2VyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAkKHRoaXMpLnRleHQodmFsKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICB9KTtcclxuICAgICQoJy5zZWxlY3Rpb24tYXVyYS12YWx1ZScpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICBjb25zdCBhdXJhID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbmV3X2F1cmEgPSBwcm9tcHQoYE5ldyAgJHthdXJhLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XHJcbiAgICAgICAgaWYgKG5ld19hdXJhID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApXHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgPSAwO1xyXG4gICAgICAgIGlmIChuZXdfYXVyYVswXSA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobmV3X2F1cmFbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlIC09IHBhcnNlSW50KG5ld19hdXJhLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlID0gcGFyc2VJbnQobmV3X2F1cmEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH0pO1xyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHkgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJMaW5lIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGluZSBleHRlbmRzIFNoYXBlIHtcclxuICAgIHR5cGUgPSBcImxpbmVcIjtcclxuICAgIGVuZFBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIGNvbnN0cnVjdG9yKHN0YXJ0UG9pbnQ6IEdsb2JhbFBvaW50LCBlbmRQb2ludDogR2xvYmFsUG9pbnQsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcihzdGFydFBvaW50LCB1dWlkKTtcclxuICAgICAgICB0aGlzLmVuZFBvaW50ID0gZW5kUG9pbnQ7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHgyOiB0aGlzLmVuZFBvaW50LngsXHJcbiAgICAgICAgICAgIHkyOiB0aGlzLmVuZFBvaW50LnksXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QoXHJcbiAgICAgICAgICAgIG5ldyBHbG9iYWxQb2ludChcclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMucmVmUG9pbnQueCwgdGhpcy5lbmRQb2ludC54KSxcclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMucmVmUG9pbnQueCwgdGhpcy5lbmRQb2ludC55KSxcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy5yZWZQb2ludC54IC0gdGhpcy5lbmRQb2ludC54KSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy5yZWZQb2ludC55IC0gdGhpcy5lbmRQb2ludC55KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHgubW92ZVRvKGcybHgodGhpcy5yZWZQb2ludC54KSwgZzJseSh0aGlzLnJlZlBvaW50LnkpKTtcclxuICAgICAgICBjdHgubGluZVRvKGcybHgodGhpcy5lbmRQb2ludC54KSwgZzJseSh0aGlzLmVuZFBvaW50LnkpKTtcclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsMCwwLCAwLjUpJztcclxuICAgICAgICBjdHgubGluZVdpZHRoID0gMztcclxuICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHsgfSAvLyBUT0RPXHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiBcIlwiIH07IC8vIFRPRE9cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxufSIsImltcG9ydCBCYXNlUmVjdCBmcm9tIFwiLi9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgZzJsIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyUmVjdCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY3QgZXh0ZW5kcyBCYXNlUmVjdCB7XHJcbiAgICB0eXBlID0gXCJyZWN0XCJcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IodG9wbGVmdDogR2xvYmFsUG9pbnQsIHc6IG51bWJlciwgaDogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB3LCBoLCB1dWlkKTtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgYm9yZGVyOiB0aGlzLmJvcmRlclxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBmcm9tRGljdChkYXRhOiBTZXJ2ZXJSZWN0KSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgaWYgKGRhdGEuYm9yZGVyKVxyXG4gICAgICAgICAgICB0aGlzLmJvcmRlciA9IGRhdGEuYm9yZGVyO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBsb2MgPSBnMmwodGhpcy5yZWZQb2ludCk7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICAgICAgaWYgKHRoaXMuYm9yZGVyICE9PSBcInJnYmEoMCwgMCwgMCwgMClcIikge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyB1dWlkdjQgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBnMmwsIGcybHIgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgcG9wdWxhdGVFZGl0QXNzZXREaWFsb2cgfSBmcm9tIFwiLi9lZGl0ZGlhbG9nXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyU2hhcGUgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgU2hhcGUge1xyXG4gICAgLy8gVXNlZCB0byBjcmVhdGUgY2xhc3MgaW5zdGFuY2UgZnJvbSBzZXJ2ZXIgc2hhcGUgZGF0YVxyXG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IHR5cGU6IHN0cmluZztcclxuICAgIC8vIFRoZSB1bmlxdWUgSUQgb2YgdGhpcyBzaGFwZVxyXG4gICAgdXVpZDogc3RyaW5nO1xyXG4gICAgLy8gVGhlIGxheWVyIHRoZSBzaGFwZSBpcyBjdXJyZW50bHkgb25cclxuICAgIGxheWVyITogc3RyaW5nO1xyXG5cclxuICAgIC8vIEEgcmVmZXJlbmNlIHBvaW50IHJlZ2FyZGluZyB0aGF0IHNwZWNpZmljIHNoYXBlJ3Mgc3RydWN0dXJlXHJcbiAgICByZWZQb2ludDogR2xvYmFsUG9pbnQ7XHJcbiAgICBcclxuICAgIC8vIEZpbGwgY29sb3VyIG9mIHRoZSBzaGFwZVxyXG4gICAgZmlsbDogc3RyaW5nID0gJyMwMDAnO1xyXG4gICAgLy9UaGUgb3B0aW9uYWwgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNoYXBlXHJcbiAgICBuYW1lID0gJ1Vua25vd24gc2hhcGUnO1xyXG5cclxuICAgIC8vIEFzc29jaWF0ZWQgdHJhY2tlcnMvYXVyYXMvb3duZXJzXHJcbiAgICB0cmFja2VyczogVHJhY2tlcltdID0gW107XHJcbiAgICBhdXJhczogQXVyYVtdID0gW107XHJcbiAgICBvd25lcnM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgLy8gQmxvY2sgbGlnaHQgc291cmNlc1xyXG4gICAgdmlzaW9uT2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuICAgIC8vIFByZXZlbnQgc2hhcGVzIGZyb20gb3ZlcmxhcHBpbmcgd2l0aCB0aGlzIHNoYXBlXHJcbiAgICBtb3ZlbWVudE9ic3RydWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgLy8gRHJhdyBtb2R1cyB0byB1c2VcclxuICAgIGdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjogc3RyaW5nID0gXCJzb3VyY2Utb3ZlclwiO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJlZlBvaW50OiBHbG9iYWxQb2ludCwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQgPSByZWZQb2ludDtcclxuICAgICAgICB0aGlzLnV1aWQgPSB1dWlkIHx8IHV1aWR2NCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdDtcclxuXHJcbiAgICAvLyBJZiBpbldvcmxkQ29vcmQgaXMgXHJcbiAgICBhYnN0cmFjdCBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuO1xyXG5cclxuICAgIGFic3RyYWN0IGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGFic3RyYWN0IGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3QgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCk6IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuICAgIGFic3RyYWN0IHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbjtcclxuXHJcbiAgICBjaGVja0xpZ2h0U291cmNlcygpIHtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XHJcbiAgICAgICAgaWYgKHRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgdm9faSA9PT0gLTEpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnV1aWQpO1xyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5zcGxpY2Uodm9faSwgMSk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBsaWdodHNvdXJjZSBhdXJhcyBhcmUgaW4gdGhlIGdhbWVNYW5hZ2VyXHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdSkge1xyXG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcztcclxuICAgICAgICAgICAgY29uc3QgaSA9IGxzLmZpbmRJbmRleChvID0+IG8uYXVyYSA9PT0gYXUudXVpZCk7XHJcbiAgICAgICAgICAgIGlmIChhdS5saWdodFNvdXJjZSAmJiBpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgbHMucHVzaCh7IHNoYXBlOiBzZWxmLnV1aWQsIGF1cmE6IGF1LnV1aWQgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1LmxpZ2h0U291cmNlICYmIGkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgbHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55dGhpbmcgaW4gdGhlIGdhbWVNYW5hZ2VyIHJlZmVyZW5jaW5nIHRoaXMgc2hhcGUgaXMgaW4gZmFjdCBzdGlsbCBhIGxpZ2h0c291cmNlXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlc1tpXTtcclxuICAgICAgICAgICAgaWYgKGxzLnNoYXBlID09PSBzZWxmLnV1aWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5zb21lKGEgPT4gYS51dWlkID09PSBscy5hdXJhICYmIGEubGlnaHRTb3VyY2UpKVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TW92ZW1lbnRCbG9jayhibG9ja3NNb3ZlbWVudDogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGJsb2Nrc01vdmVtZW50IHx8IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IHZvX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmluZGV4T2YodGhpcy51dWlkKTtcclxuICAgICAgICBpZiAodGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgICAgICBlbHNlIGlmICghdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2Uodm9faSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3duZWRCeSh1c2VybmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIGlmICh1c2VybmFtZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IGdhbWVNYW5hZ2VyLnVzZXJuYW1lO1xyXG4gICAgICAgIHJldHVybiBnYW1lTWFuYWdlci5JU19ETSB8fCB0aGlzLm93bmVycy5pbmNsdWRlcyh1c2VybmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYWNrZXJzLmxlbmd0aCB8fCB0aGlzLnRyYWNrZXJzW3RoaXMudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKVxyXG4gICAgICAgICAgICB0aGlzLnRyYWNrZXJzLnB1c2goeyB1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAwLCBtYXh2YWx1ZTogMCwgdmlzaWJsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmF1cmFzLmxlbmd0aCB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgdGhpcy5hdXJhc1t0aGlzLmF1cmFzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKVxyXG4gICAgICAgICAgICB0aGlzLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogdXVpZHY0KCksXHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgZGltOiAwLFxyXG4gICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1uYW1lXCIpLnRleHQodGhpcy5uYW1lKTtcclxuICAgICAgICBjb25zdCB0cmFja2VycyA9ICQoXCIjc2VsZWN0aW9uLXRyYWNrZXJzXCIpO1xyXG4gICAgICAgIHRyYWNrZXJzLmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy50cmFja2Vycy5mb3JFYWNoKGZ1bmN0aW9uICh0cmFja2VyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgICAgIHRyYWNrZXJzLmFwcGVuZCgkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLXRyYWNrZXItJHt0cmFja2VyLnV1aWR9LW5hbWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4ke3RyYWNrZXIubmFtZX08L2Rpdj5gKSk7XHJcbiAgICAgICAgICAgIHRyYWNrZXJzLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi10cmFja2VyLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBhdXJhcyA9ICQoXCIjc2VsZWN0aW9uLWF1cmFzXCIpO1xyXG4gICAgICAgIGF1cmFzLmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1cmEuZGltID8gYCR7YXVyYS52YWx1ZX0vJHthdXJhLmRpbX1gIDogYXVyYS52YWx1ZTtcclxuICAgICAgICAgICAgYXVyYXMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tYXVyYS0ke2F1cmEudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPiR7YXVyYS5uYW1lfTwvZGl2PmApKTtcclxuICAgICAgICAgICAgYXVyYXMuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS12YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIGNsYXNzPVwic2VsZWN0aW9uLWF1cmEtdmFsdWVcIj4ke3ZhbH08L2Rpdj5gKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuc2hvdygpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnN0IGVkaXRidXR0b24gPSAkKFwiI3NlbGVjdGlvbi1lZGl0LWJ1dHRvblwiKTtcclxuICAgICAgICBpZiAoIXRoaXMub3duZWRCeSgpKVxyXG4gICAgICAgICAgICBlZGl0YnV0dG9uLmhpZGUoKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGVkaXRidXR0b24uc2hvdygpO1xyXG4gICAgICAgIGVkaXRidXR0b24ub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtwb3B1bGF0ZUVkaXRBc3NldERpYWxvZyhzZWxmKX0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0aW9uTG9zcygpIHtcclxuICAgICAgICAvLyAkKGAjc2hhcGVzZWxlY3Rpb25jb2ctJHt0aGlzLnV1aWR9YCkucmVtb3ZlKCk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbWVudVwiKS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG8gbm90IHByb3ZpZGUgZ2V0QmFzZURpY3QgYXMgdGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gdG8gZm9yY2UgdGhlIGltcGxlbWVudGF0aW9uXHJcbiAgICBhYnN0cmFjdCBhc0RpY3QoKTogU2VydmVyU2hhcGU7XHJcbiAgICBnZXRCYXNlRGljdCgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXHJcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcclxuICAgICAgICAgICAgeDogdGhpcy5yZWZQb2ludC54LFxyXG4gICAgICAgICAgICB5OiB0aGlzLnJlZlBvaW50LnksXHJcbiAgICAgICAgICAgIGxheWVyOiB0aGlzLmxheWVyLFxyXG4gICAgICAgICAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uLFxyXG4gICAgICAgICAgICBtb3ZlbWVudE9ic3RydWN0aW9uOiB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24sXHJcbiAgICAgICAgICAgIHZpc2lvbk9ic3RydWN0aW9uOiB0aGlzLnZpc2lvbk9ic3RydWN0aW9uLFxyXG4gICAgICAgICAgICBhdXJhczogdGhpcy5hdXJhcyxcclxuICAgICAgICAgICAgdHJhY2tlcnM6IHRoaXMudHJhY2tlcnMsXHJcbiAgICAgICAgICAgIG93bmVyczogdGhpcy5vd25lcnMsXHJcbiAgICAgICAgICAgIGZpbGw6IHRoaXMuZmlsbCxcclxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlclNoYXBlKSB7XHJcbiAgICAgICAgdGhpcy5sYXllciA9IGRhdGEubGF5ZXI7XHJcbiAgICAgICAgdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBkYXRhLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBkYXRhLm1vdmVtZW50T2JzdHJ1Y3Rpb247XHJcbiAgICAgICAgdGhpcy52aXNpb25PYnN0cnVjdGlvbiA9IGRhdGEudmlzaW9uT2JzdHJ1Y3Rpb247XHJcbiAgICAgICAgdGhpcy5hdXJhcyA9IGRhdGEuYXVyYXM7XHJcbiAgICAgICAgdGhpcy50cmFja2VycyA9IGRhdGEudHJhY2tlcnM7XHJcbiAgICAgICAgdGhpcy5vd25lcnMgPSBkYXRhLm93bmVycztcclxuICAgICAgICBpZiAoZGF0YS5uYW1lKVxyXG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIGlmICh0aGlzLmxheWVyID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XHJcbiAgICAgICAgdGhpcy5kcmF3QXVyYXMoY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3QXVyYXMoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1cmEpIHtcclxuICAgICAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gYXVyYS5jb2xvdXI7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJmb3dcIikgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5jdHggPT09IGN0eClcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYyA9IGcybChzZWxmLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIGcybHIoYXVyYS52YWx1ZSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgaWYgKGF1cmEuZGltKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0YyA9IHRpbnljb2xvcihhdXJhLmNvbG91cik7XHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGMuc2V0QWxwaGEodGMuZ2V0QWxwaGEoKSAvIDIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSBnMmwoc2VsZi5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgZzJscihhdXJhLmRpbSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzaG93Q29udGV4dE1lbnUobW91c2U6IExvY2FsUG9pbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgbC5zZWxlY3Rpb24gPSBbdGhpc107XHJcbiAgICAgICAgdGhpcy5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgIGwuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICBjb25zdCBhc3NldCA9IHRoaXM7XHJcbiAgICAgICAgJG1lbnUuc2hvdygpO1xyXG4gICAgICAgICRtZW51LmVtcHR5KCk7XHJcbiAgICAgICAgJG1lbnUuY3NzKHsgbGVmdDogbW91c2UueCwgdG9wOiBtb3VzZS55IH0pO1xyXG4gICAgICAgIGxldCBkYXRhID0gXCJcIiArXHJcbiAgICAgICAgICAgIFwiPHVsPlwiICtcclxuICAgICAgICAgICAgXCI8bGk+TGF5ZXI8dWw+XCI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmxheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGFibGUpIHJldHVybjtcclxuICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIubmFtZSA9PT0gbC5uYW1lID8gXCIgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6YXF1YScgXCIgOiBcIiBcIjtcclxuICAgICAgICAgICAgZGF0YSArPSBgPGxpIGRhdGEtYWN0aW9uPSdzZXRMYXllcicgZGF0YS1sYXllcj0nJHtsYXllci5uYW1lfScgJHtzZWx9IGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+JHtsYXllci5uYW1lfTwvbGk+YDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBkYXRhICs9IFwiPC91bD48L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J21vdmVUb0JhY2snIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBiYWNrPC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9Gcm9udCcgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGZyb250PC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdhZGRJbml0aWF0aXZlJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPkFkZCBpbml0aWF0aXZlPC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPC91bD5cIjtcclxuICAgICAgICAkbWVudS5odG1sKGRhdGEpO1xyXG4gICAgICAgICQoXCIuY29udGV4dC1jbGlja2FibGVcIikub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBhc3NldC5vbkNvbnRleHRNZW51KCQodGhpcykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgb25Db250ZXh0TWVudShtZW51OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgY29uc3QgYWN0aW9uID0gbWVudS5kYXRhKFwiYWN0aW9uXCIpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICAgICAgaWYgKGxheWVyID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICBjYXNlICdtb3ZlVG9Gcm9udCc6XHJcbiAgICAgICAgICAgICAgICBsYXllci5tb3ZlU2hhcGVPcmRlcih0aGlzLCBsYXllci5zaGFwZXMubGVuZ3RoIC0gMSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnbW92ZVRvQmFjayc6XHJcbiAgICAgICAgICAgICAgICBsYXllci5tb3ZlU2hhcGVPcmRlcih0aGlzLCAwLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzZXRMYXllcic6XHJcbiAgICAgICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihtZW51LmRhdGEoXCJsYXllclwiKSkhLmFkZFNoYXBlKHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2FkZEluaXRpYXRpdmUnOlxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZSh0aGlzLmdldEluaXRpYXRpdmVSZXByKCksIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICRtZW51LmhpZGUoKTtcclxuICAgIH1cclxuICAgIGdldEluaXRpYXRpdmVSZXByKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcclxuICAgICAgICAgICAgdmlzaWJsZTogIWdhbWVNYW5hZ2VyLklTX0RNLFxyXG4gICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgIHNyYzogXCJcIixcclxuICAgICAgICAgICAgb3duZXJzOiB0aGlzLm93bmVyc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGcybCB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJUZXh0IH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGV4dCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHR5cGUgPSBcInRleHRcIjtcclxuICAgIHRleHQ6IHN0cmluZztcclxuICAgIGZvbnQ6IHN0cmluZztcclxuICAgIGFuZ2xlOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbjogR2xvYmFsUG9pbnQsIHRleHQ6IHN0cmluZywgZm9udDogc3RyaW5nLCBhbmdsZT86IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHBvc2l0aW9uLCB1dWlkKTtcclxuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xyXG4gICAgICAgIHRoaXMuZm9udCA9IGZvbnQ7XHJcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlIHx8IDA7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRoaXMudGV4dCxcclxuICAgICAgICAgICAgZm9udDogdGhpcy5mb250LFxyXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQsIDUsIDUpOyAvLyBUb2RvOiBmaXggdGhpcyBib3VuZGluZyBib3hcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZvbnQgPSB0aGlzLmZvbnQ7XHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjb25zdCBkZXN0ID0gZzJsKHRoaXMucmVmUG9pbnQpO1xyXG4gICAgICAgIGN0eC50cmFuc2xhdGUoZGVzdC54LCBkZXN0LnkpO1xyXG4gICAgICAgIGN0eC5yb3RhdGUodGhpcy5hbmdsZSk7XHJcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XHJcbiAgICAgICAgY3R4LmZpbGxUZXh0KHRoaXMudGV4dCwgMCwgLTUpO1xyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHsgfSAvLyBUT0RPXHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiBcIlwiIH07IC8vIFRPRE9cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgUmVjdCBmcm9tIFwiLi9yZWN0XCI7XHJcbmltcG9ydCBDaXJjbGUgZnJvbSBcIi4vY2lyY2xlXCI7XHJcbmltcG9ydCBMaW5lIGZyb20gXCIuL2xpbmVcIjtcclxuaW1wb3J0IFRleHQgZnJvbSBcIi4vdGV4dFwiO1xyXG5pbXBvcnQgQXNzZXQgZnJvbSBcIi4vYXNzZXRcIjtcclxuaW1wb3J0IHsgU2VydmVyU2hhcGUsIFNlcnZlclJlY3QsIFNlcnZlckNpcmNsZSwgU2VydmVyTGluZSwgU2VydmVyVGV4dCwgU2VydmVyQXNzZXQgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZTogU2VydmVyU2hhcGUsIGR1bW15PzogYm9vbGVhbikge1xyXG4gICAgLy8gdG9kbyBpcyB0aGlzIGR1bW15IHN0dWZmIGFjdHVhbGx5IG5lZWRlZCwgZG8gd2UgZXZlciB3YW50IHRvIHJldHVybiB0aGUgbG9jYWwgc2hhcGU/XHJcbiAgICBpZiAoZHVtbXkgPT09IHVuZGVmaW5lZCkgZHVtbXkgPSBmYWxzZTtcclxuICAgIGlmICghZHVtbXkgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKVxyXG4gICAgICAgIHJldHVybiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgbGV0IHNoOiBTaGFwZTtcclxuXHJcbiAgICAvLyBBIGZyb21KU09OIGFuZCB0b0pTT04gb24gU2hhcGUgd291bGQgYmUgY2xlYW5lciBidXQgdHMgZG9lcyBub3QgYWxsb3cgZm9yIHN0YXRpYyBhYnN0cmFjdHMgc28geWVhaC5cclxuXHJcbiAgICBjb25zdCByZWZQb2ludCA9IG5ldyBHbG9iYWxQb2ludChzaGFwZS54LCBzaGFwZS55KTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHtcclxuICAgICAgICBjb25zdCByZWN0ID0gPFNlcnZlclJlY3Q+c2hhcGU7XHJcbiAgICAgICAgc2ggPSBuZXcgUmVjdChyZWZQb2ludCwgcmVjdC53LCByZWN0LmgsIHJlY3QuZmlsbCwgcmVjdC5ib3JkZXIsIHJlY3QudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdjaXJjbGUnKSB7XHJcbiAgICAgICAgY29uc3QgY2lyYyA9IDxTZXJ2ZXJDaXJjbGU+c2hhcGU7XHJcbiAgICAgICAgc2ggPSBuZXcgQ2lyY2xlKHJlZlBvaW50LCBjaXJjLnIsIGNpcmMuZmlsbCwgY2lyYy5ib3JkZXIsIGNpcmMudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdsaW5lJykge1xyXG4gICAgICAgIGNvbnN0IGxpbmUgPSA8U2VydmVyTGluZT5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBMaW5lKHJlZlBvaW50LCBuZXcgR2xvYmFsUG9pbnQobGluZS54MiwgbGluZS55MiksIGxpbmUudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICd0ZXh0Jykge1xyXG4gICAgICAgIGNvbnN0IHRleHQgPSA8U2VydmVyVGV4dD5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBUZXh0KHJlZlBvaW50LCB0ZXh0LnRleHQsIHRleHQuZm9udCwgdGV4dC5hbmdsZSwgdGV4dC51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2Fzc2V0Jykge1xyXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gPFNlcnZlckFzc2V0PnNoYXBlO1xyXG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZShhc3NldC53LCBhc3NldC5oKTtcclxuICAgICAgICBpZiAoYXNzZXQuc3JjLnN0YXJ0c1dpdGgoXCJodHRwXCIpKVxyXG4gICAgICAgICAgICBpbWcuc3JjID0gbmV3IFVSTChhc3NldC5zcmMpLnBhdGhuYW1lO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgaW1nLnNyYyA9IGFzc2V0LnNyY1xyXG4gICAgICAgIHNoID0gbmV3IEFzc2V0KGltZywgcmVmUG9pbnQsIGFzc2V0LncsIGFzc2V0LmgsIGFzc2V0LnV1aWQpO1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBzaC5mcm9tRGljdChzaGFwZSk7XHJcbiAgICByZXR1cm4gc2g7XHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBhbHBoU29ydCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IHNldHVwVG9vbHMgfSBmcm9tIFwiLi90b29sc1wiO1xyXG5pbXBvcnQgeyBDbGllbnRPcHRpb25zLCBMb2NhdGlvbk9wdGlvbnMsIEFzc2V0TGlzdCwgU2VydmVyU2hhcGUsIEluaXRpYXRpdmVEYXRhLCBCb2FyZEluZm8gfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuXHJcbmNvbnN0IHByb3RvY29sID0gZG9jdW1lbnQuZG9tYWluID09PSAnbG9jYWxob3N0JyA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xyXG5jb25zdCBzb2NrZXQgPSBpby5jb25uZWN0KHByb3RvY29sICsgZG9jdW1lbnQuZG9tYWluICsgXCI6XCIgKyBsb2NhdGlvbi5wb3J0ICsgXCIvcGxhbmFyYWxseVwiKTtcclxuc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJyZWRpcmVjdFwiLCBmdW5jdGlvbiAoZGVzdGluYXRpb246IHN0cmluZykge1xyXG4gICAgY29uc29sZS5sb2coXCJyZWRpcmVjdGluZ1wiKTtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gZGVzdGluYXRpb247XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgcm9vbSBpbmZvXCIsIGZ1bmN0aW9uIChkYXRhOiB7bmFtZTogc3RyaW5nLCBjcmVhdG9yOiBzdHJpbmd9KSB7XHJcbiAgICBnYW1lTWFuYWdlci5yb29tTmFtZSA9IGRhdGEubmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLnJvb21DcmVhdG9yID0gZGF0YS5jcmVhdG9yO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHVzZXJuYW1lXCIsIGZ1bmN0aW9uICh1c2VybmFtZTogc3RyaW5nKSB7XHJcbiAgICBnYW1lTWFuYWdlci51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIuSVNfRE0gPSB1c2VybmFtZSA9PT0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVsyXTtcclxuICAgIGlmICgkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpLmh0bWwoKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgc2V0dXBUb29scygpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGNsaWVudE9wdGlvbnNcIiwgZnVuY3Rpb24gKG9wdGlvbnM6IENsaWVudE9wdGlvbnMpIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldENsaWVudE9wdGlvbnMob3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgbG9jYXRpb25cIiwgZnVuY3Rpb24gKGRhdGE6IHtuYW1lOnN0cmluZywgb3B0aW9uczogTG9jYXRpb25PcHRpb25zfSkge1xyXG4gICAgZ2FtZU1hbmFnZXIubG9jYXRpb25OYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldE9wdGlvbnMoZGF0YS5vcHRpb25zKTtcclxufSk7XHJcbnNvY2tldC5vbihcImFzc2V0IGxpc3RcIiwgZnVuY3Rpb24gKGFzc2V0czogQXNzZXRMaXN0KSB7XHJcbiAgICBjb25zdCBtID0gJChcIiNtZW51LXRva2Vuc1wiKTtcclxuICAgIG0uZW1wdHkoKTtcclxuICAgIGxldCBoID0gJyc7XHJcblxyXG4gICAgY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uIChlbnRyeTogQXNzZXRMaXN0LCBwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBmb2xkZXJzID0gbmV3IE1hcChPYmplY3QuZW50cmllcyhlbnRyeS5mb2xkZXJzKSk7XHJcbiAgICAgICAgZm9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICAgIGggKz0gXCI8YnV0dG9uIGNsYXNzPSdhY2NvcmRpb24nPlwiICsga2V5ICsgXCI8L2J1dHRvbj48ZGl2IGNsYXNzPSdhY2NvcmRpb24tcGFuZWwnPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1zdWJwYW5lbCc+XCI7XHJcbiAgICAgICAgICAgIHByb2Nlc3ModmFsdWUsIHBhdGggKyBrZXkgKyBcIi9cIik7XHJcbiAgICAgICAgICAgIGggKz0gXCI8L2Rpdj48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5zb3J0KGFscGhTb3J0KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChhc3NldCkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGRpdiBjbGFzcz0nZHJhZ2dhYmxlIHRva2VuJz48aW1nIHNyYz0nL3N0YXRpYy9pbWcvYXNzZXRzL1wiICsgcGF0aCArIGFzc2V0ICsgXCInIHdpZHRoPSczNSc+XCIgKyBhc3NldCArIFwiPGkgY2xhc3M9J2ZhcyBmYS1jb2cnPjwvaT48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBwcm9jZXNzKGFzc2V0cywgXCJcIik7XHJcbiAgICBtLmh0bWwoaCk7XHJcbiAgICAkKFwiLmRyYWdnYWJsZVwiKS5kcmFnZ2FibGUoe1xyXG4gICAgICAgIGhlbHBlcjogXCJjbG9uZVwiLFxyXG4gICAgICAgIGFwcGVuZFRvOiBcIiNib2FyZFwiXHJcbiAgICB9KTtcclxuICAgICQoJy5hY2NvcmRpb24nKS5lYWNoKGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgICAkKHRoaXMpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKFwiYWNjb3JkaW9uLWFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5uZXh0KCkudG9nZ2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcbnNvY2tldC5vbihcImJvYXJkIGluaXRcIiwgZnVuY3Rpb24gKGxvY2F0aW9uX2luZm86IEJvYXJkSW5mbykge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0dXBCb2FyZChsb2NhdGlvbl9pbmZvKVxyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGdyaWRzaXplXCIsIGZ1bmN0aW9uIChncmlkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3JpZFNpemUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYWRkIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmFkZFNoYXBlKHNoYXBlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInJlbW92ZSBzaGFwZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biBzaGFwZWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgIGxheWVyLnJlbW92ZVNoYXBlKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSEsIGZhbHNlKTtcclxuICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwibW92ZVNoYXBlT3JkZXJcIiwgZnVuY3Rpb24gKGRhdGE6IHsgc2hhcGU6IFNlcnZlclNoYXBlOyBpbmRleDogbnVtYmVyIH0pIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKGRhdGEuc2hhcGUudXVpZCkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIG1vdmUgdGhlIHNoYXBlIG9yZGVyIG9mIGFuIHVua25vd24gc2hhcGVgKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoZGF0YS5zaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpITtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XHJcbiAgICBsYXllci5tb3ZlU2hhcGVPcmRlcihzaGFwZSwgZGF0YS5pbmRleCwgZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2hhcGVNb3ZlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLm1vdmVTaGFwZShzaGFwZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVTaGFwZVwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbiB9KSB7XHJcbiAgICBnYW1lTWFuYWdlci51cGRhdGVTaGFwZShkYXRhKTtcclxufSk7XHJcbnNvY2tldC5vbihcInVwZGF0ZUluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQgfHwgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNICYmICFkYXRhLnZpc2libGUpKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoZGF0YS51dWlkLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShkYXRhLCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXRJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhOiBJbml0aWF0aXZlRGF0YVtdKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRJbml0aWF0aXZlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiY2xlYXIgdGVtcG9yYXJpZXNcIiwgZnVuY3Rpb24gKHNoYXBlczogU2VydmVyU2hhcGVbXSkge1xyXG4gICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIGFuIHVua25vd24gdGVtcG9yYXJ5IHNoYXBlXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVhbF9zaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSE7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSEucmVtb3ZlU2hhcGUocmVhbF9zaGFwZSwgZmFsc2UpO1xyXG4gICAgfSlcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzb2NrZXQ7IiwiaW1wb3J0IHsgZ2V0VW5pdERpc3RhbmNlLCBsMmcsIGcybCwgZzJsciwgZzJseiwgZzJseCwgZzJseSwgbDJneSwgbDJneCB9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgVmVjdG9yLCBMb2NhbFBvaW50LCBHbG9iYWxQb2ludCB9IGZyb20gXCIuL2dlb21cIjtcclxuaW1wb3J0IHsgSW5pdGlhdGl2ZURhdGEgfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4vc2hhcGVzL3JlY3RcIjtcclxuaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL3NoYXBlcy9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgTGluZSBmcm9tIFwiLi9zaGFwZXMvbGluZVwiO1xyXG5pbXBvcnQgVGV4dCBmcm9tIFwiLi9zaGFwZXMvdGV4dFwiO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRvb2wge1xyXG4gICAgZGV0YWlsRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGFic3RyYWN0IG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHsgfTtcclxufVxyXG5cclxuZW51bSBTZWxlY3RPcGVyYXRpb25zIHtcclxuICAgIE5vb3AsXHJcbiAgICBSZXNpemUsXHJcbiAgICBEcmFnLFxyXG4gICAgR3JvdXBTZWxlY3QsXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZWxlY3RUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBtb2RlOiBTZWxlY3RPcGVyYXRpb25zID0gU2VsZWN0T3BlcmF0aW9ucy5Ob29wO1xyXG4gICAgcmVzaXplZGlyOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgLy8gQmVjYXVzZSB3ZSBuZXZlciBkcmFnIGZyb20gdGhlIGFzc2V0J3MgKDAsIDApIGNvb3JkIGFuZCB3YW50IGEgc21vb3RoZXIgZHJhZyBleHBlcmllbmNlXHJcbiAgICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBhY3R1YWwgb2Zmc2V0IHdpdGhpbiB0aGUgYXNzZXQuXHJcbiAgICBkcmFnOiBWZWN0b3I8TG9jYWxQb2ludD4gPSBuZXcgVmVjdG9yPExvY2FsUG9pbnQ+KHsgeDogMCwgeTogMCB9LCBuZXcgTG9jYWxQb2ludCgwLCAwKSk7XHJcbiAgICBzZWxlY3Rpb25TdGFydFBvaW50OiBHbG9iYWxQb2ludCA9IG5ldyBHbG9iYWxQb2ludCgtMTAwMCwgLTEwMDApO1xyXG4gICAgc2VsZWN0aW9uSGVscGVyOiBSZWN0ID0gbmV3IFJlY3QodGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LCAwLCAwKTtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG5cclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgLy8gdGhlIHNlbGVjdGlvblN0YWNrIGFsbG93cyBmb3IgbG93ZXIgcG9zaXRpb25lZCBvYmplY3RzIHRoYXQgYXJlIHNlbGVjdGVkIHRvIGhhdmUgcHJlY2VkZW5jZSBkdXJpbmcgb3ZlcmxhcC5cclxuICAgICAgICBsZXQgc2VsZWN0aW9uU3RhY2s7XHJcbiAgICAgICAgaWYgKCFsYXllci5zZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICBzZWxlY3Rpb25TdGFjayA9IGxheWVyLnNoYXBlcztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzLmNvbmNhdChsYXllci5zZWxlY3Rpb24pO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSBzZWxlY3Rpb25TdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHNlbGVjdGlvblN0YWNrW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBjb3JuID0gc2hhcGUuZ2V0Q29ybmVyKGwyZyhtb3VzZSkpO1xyXG4gICAgICAgICAgICBpZiAoY29ybiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2hhcGVdO1xyXG4gICAgICAgICAgICAgICAgc2hhcGUub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVkaXIgPSBjb3JuO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS5jb250YWlucyhsMmcobW91c2UpKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gc2hhcGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmluZGV4T2Yoc2VsKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2VsXTtcclxuICAgICAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuRHJhZztcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZyA9IG1vdXNlLnN1YnRyYWN0KGcybChzZWwucmVmUG9pbnQpKTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhZy5vcmlnaW4gPSBnMmwoc2VsLnJlZlBvaW50KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhZy5kaXJlY3Rpb24gPSBtb3VzZS5zdWJ0cmFjdCh0aGlzLmRyYWcub3JpZ2luKTtcclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaGl0KSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbkxvc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnJlZlBvaW50ID0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50O1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IDA7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFt0aGlzLnNlbGVjdGlvbkhlbHBlcl07XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdCkge1xyXG4gICAgICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgdGhpc1xyXG4gICAgICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhtb3VzZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC54KTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnJlZlBvaW50ID0gbmV3IEdsb2JhbFBvaW50KFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LngsIGVuZFBvaW50LngpLFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LnksIGVuZFBvaW50LnkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9nID0gZzJsKGxheWVyLnNlbGVjdGlvbltsYXllci5zZWxlY3Rpb24ubGVuZ3RoIC0gMV0ucmVmUG9pbnQpO1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaCgoc2VsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsdGEgPSBtb3VzZS5zdWJ0cmFjdChvZy5hZGQodGhpcy5kcmFnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkRyYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQgPSBzZWwucmVmUG9pbnQuYWRkKGwyZyhkZWx0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXllci5uYW1lID09PSAndG9rZW5zJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIHVzZSB0aGUgYWJvdmUgdXBkYXRlZCB2YWx1ZXMgZm9yIHRoZSBib3VuZGluZyBib3ggY2hlY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhlIGJvdW5kaW5nIGJveGVzIG92ZXJsYXAgdG8gc3RvcCBjbG9zZSAvIHByZWNpc2UgbW92ZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJsb2NrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBibG9ja2VycyA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuZmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4gbWIgIT09IHNlbC51dWlkICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhtYikgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KG1iKSEuZ2V0Qm91bmRpbmdCb3goKS5pbnRlcnNlY3RzV2l0aChiYm94KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChibG9ja2Vycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgYSBsaW5lIGZyb20gc3RhcnQgdG8gZW5kIHBvc2l0aW9uIGFuZCBzZWUgZm9yIGFueSBpbnRlcnNlY3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgc3RvcHMgc3VkZGVuIGxlYXBzIG92ZXIgd2FsbHMhIGNoZWVreSBidWdnZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0geyBzdGFydDogbDJnKG9nKSwgZW5kOiBzZWwucmVmUG9pbnQgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhtYikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW50ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobWIpIS5nZXRCb3VuZGluZ0JveCgpLmdldEludGVyc2VjdFdpdGhMaW5lKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWIgIT09IHNlbC51dWlkICYmIGludGVyLmludGVyc2VjdCAhPT0gbnVsbCAmJiBpbnRlci5kaXN0YW5jZSA+IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50ID0gc2VsLnJlZlBvaW50LmFkZChsMmcoZGVsdGEpLnJldmVyc2UoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVGhpcyBoYXMgdG8gYmUgc2hhcGUgc3BlY2lmaWNcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNpemVkaXIgPT09ICdudycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBnMmx4KHNlbC5yZWZQb2ludC54KSArIHNlbC53ICogeiAtIG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gZzJseShzZWwucmVmUG9pbnQueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQgPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5yZXNpemVkaXIgPT09ICduZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBtb3VzZS54IC0gZzJseChzZWwucmVmUG9pbnQueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gZzJseShzZWwucmVmUG9pbnQueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSA9IGwyZ3kobW91c2UueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ3NlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IG1vdXNlLnggLSBnMmx4KHNlbC5yZWZQb2ludC54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gZzJseShzZWwucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ3N3Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IGcybHgoc2VsLnJlZlBvaW50LngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gZzJseShzZWwucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ID0gbDJneChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgLz0gejtcclxuICAgICAgICAgICAgICAgICAgICBzZWwuaCAvPSB6O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ20gPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwuaW5Db3JuZXIoZ20sIFwibndcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm53LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKGdtLCBcIm5lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJuZS1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihnbSwgXCJzZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic2UtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIoZ20sIFwic3dcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInN3LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3QpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIGxheWVyLnNoYXBlcy5mb3JFYWNoKChzaGFwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlID09PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNoYXBlLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uSGVscGVyIS5yZWZQb2ludC54IDw9IGJib3gucmVmUG9pbnQueCArIGJib3gudyAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5yZWZQb2ludC54ICsgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLncgPj0gYmJveC5yZWZQb2ludC54ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnkgPD0gYmJveC5yZWZQb2ludC55ICsgYmJveC5oICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnkgKyB0aGlzLnNlbGVjdGlvbkhlbHBlciEuaCA+PSBiYm94LnJlZlBvaW50LnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24ucHVzaChzaGFwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUHVzaCB0aGUgc2VsZWN0aW9uIGhlbHBlciBhcyB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBzZWxlY3Rpb25cclxuICAgICAgICAgICAgLy8gVGhpcyBtYWtlcyBzdXJlIHRoYXQgaXQgd2lsbCBiZSB0aGUgZmlyc3Qgb25lIHRvIGJlIGhpdCBpbiB0aGUgaGl0IGRldGVjdGlvbiBvbk1vdXNlRG93blxyXG4gICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24ucHVzaCh0aGlzLnNlbGVjdGlvbkhlbHBlcik7XHJcblxyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaCgoc2VsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZHJhZy5vcmlnaW4hLnggPT09IGcybHgoc2VsLnJlZlBvaW50LngpICYmIHRoaXMuZHJhZy5vcmlnaW4hLnkgPT09IGcybHkoc2VsLnJlZlBvaW50LnkpKSB7IHJldHVybiB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW91c2UgPSBzZWwuY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXkgPSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHNlbC53IC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnggPSBNYXRoLnJvdW5kKG14IC8gZ3MpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueCA9IChNYXRoLnJvdW5kKChteCArIChncyAvIDIpKSAvIGdzKSAtICgxIC8gMikpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChzZWwuaCAvIGdzKSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC55ID0gTWF0aC5yb3VuZChteSAvIGdzKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50LnkgPSAoTWF0aC5yb3VuZCgobXkgKyAoZ3MgLyAyKSkgLyBncykgLSAoMSAvIDIpKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLncgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ICs9IHNlbC53O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IE1hdGguYWJzKHNlbC53KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC5oIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSArPSBzZWwuaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLmFicyhzZWwuaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludC54ID0gTWF0aC5yb3VuZChzZWwucmVmUG9pbnQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwucmVmUG9pbnQueSA9IE1hdGgucm91bmQoc2VsLnJlZlBvaW50LnkgLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuTm9vcFxyXG4gICAgfTtcclxuICAgIG9uQ29udGV4dE1lbnUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xyXG4gICAgICAgIGxheWVyLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBpZiAoIWhpdCAmJiBzaGFwZS5jb250YWlucyhsMmcobW91c2UpKSkge1xyXG4gICAgICAgICAgICAgICAgc2hhcGUuc2hvd0NvbnRleHRNZW51KG1vdXNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBhblRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIHBhblN0YXJ0ID0gbmV3IExvY2FsUG9pbnQoMCwgMCk7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnBhblN0YXJ0ID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBsMmcobW91c2Uuc3VidHJhY3QodGhpcy5wYW5TdGFydCkpLmRpcmVjdGlvbjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCArPSBNYXRoLnJvdW5kKGRpc3RhbmNlLngpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZICs9IE1hdGgucm91bmQoZGlzdGFuY2UueSk7XHJcbiAgICAgICAgdGhpcy5wYW5TdGFydCA9IG1vdXNlO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICBsb2NhdGlvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIFtgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF06IHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCxcclxuICAgICAgICAgICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7IH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFRvb2xzKCk6IHZvaWQge1xyXG4gICAgY29uc3QgdG9vbHNlbGVjdERpdiA9ICQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIik7XHJcbiAgICB0b29scy5mb3JFYWNoKGZ1bmN0aW9uICh0b29sKSB7XHJcbiAgICAgICAgaWYgKCF0b29sLnBsYXllclRvb2wgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IHRvb2xJbnN0YW5jZSA9IG5ldyB0b29sLmNseigpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLnRvb2xzLnNldCh0b29sLm5hbWUsIHRvb2xJbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgZXh0cmEgPSB0b29sLmRlZmF1bHRTZWxlY3QgPyBcIiBjbGFzcz0ndG9vbC1zZWxlY3RlZCdcIiA6IFwiXCI7XHJcbiAgICAgICAgY29uc3QgdG9vbExpID0gJChcIjxsaSBpZD0ndG9vbC1cIiArIHRvb2wubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIHRvb2wubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgIHRvb2xzZWxlY3REaXYuYXBwZW5kKHRvb2xMaSk7XHJcbiAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhO1xyXG4gICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICBkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29sTGkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdG9vbHMuaW5kZXhPZih0b29sKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIHtcclxuICAgICAgICAgICAgICAgICQoJy50b29sLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9ICQoJyN0b29sZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmNoaWxkcmVuKCkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERyYXdUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHJlY3QhOiBSZWN0O1xyXG4gICAgZmlsbENvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGJvcmRlckNvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+RmlsbDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuZmlsbENvbG9yKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+Qm9yZGVyPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5ib3JkZXJDb2xvcilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmVkXCJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgY29uc3QgZmlsbENvbG9yID0gdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICAgICAgY29uc3QgZmlsbCA9IGZpbGxDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogZmlsbENvbG9yO1xyXG4gICAgICAgIGNvbnN0IGJvcmRlckNvbG9yID0gdGhpcy5ib3JkZXJDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcclxuICAgICAgICBjb25zdCBib3JkZXIgPSBib3JkZXJDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogYm9yZGVyQ29sb3I7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LCAwLCAwLCBmaWxsLnRvUmdiU3RyaW5nKCksIGJvcmRlci50b1JnYlN0cmluZygpKTtcclxuICAgICAgICB0aGlzLnJlY3Qub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGlmIChsYXllci5uYW1lID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLnJlY3QudmlzaW9uT2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnJlY3QubW92ZW1lbnRPYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnJlY3QudXVpZCk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy5yZWN0IS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZSB9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSdWxlclRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcnVsZXIhOiBMaW5lO1xyXG4gICAgdGV4dCE6IFRleHQ7XHJcblxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucnVsZXIgPSBuZXcgTGluZSh0aGlzLnN0YXJ0UG9pbnQsIHRoaXMuc3RhcnRQb2ludCk7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gbmV3IFRleHQodGhpcy5zdGFydFBvaW50LmNsb25lKCksIFwiXCIsIFwiMjBweCBzZXJpZlwiKTtcclxuICAgICAgICB0aGlzLnJ1bGVyLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICB0aGlzLnRleHQub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBkcmF3IGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5ydWxlci5lbmRQb2ludCA9IGVuZFBvaW50O1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMucnVsZXIhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpZmZzaWduID0gTWF0aC5zaWduKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCkgKiBNYXRoLnNpZ24oZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICBjb25zdCB4ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgY29uc3QgeWRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIGNvbnN0IGxhYmVsID0gTWF0aC5yb3VuZChNYXRoLnNxcnQoKHhkaWZmKSAqKiAyICsgKHlkaWZmKSAqKiAyKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51bml0U2l6ZSAvIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSkgKyBcIiBmdFwiO1xyXG4gICAgICAgIGxldCBhbmdsZSA9IE1hdGguYXRhbjIoZGlmZnNpZ24gKiB5ZGlmZiwgeGRpZmYpO1xyXG4gICAgICAgIGNvbnN0IHhtaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCkgKyB4ZGlmZiAvIDI7XHJcbiAgICAgICAgY29uc3QgeW1pZCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KSArIHlkaWZmIC8gMjtcclxuICAgICAgICB0aGlzLnRleHQucmVmUG9pbnQueCA9IHhtaWQ7XHJcbiAgICAgICAgdGhpcy50ZXh0LnJlZlBvaW50LnkgPSB5bWlkO1xyXG4gICAgICAgIHRoaXMudGV4dC50ZXh0ID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy50ZXh0LmFuZ2xlID0gYW5nbGU7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy50ZXh0LmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5ydWxlciwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy50ZXh0LCB0cnVlLCB0cnVlKTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRk9XVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzdGFydFBvaW50ITogR2xvYmFsUG9pbnQ7XHJcbiAgICByZWN0ITogUmVjdDtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+UmV2ZWFsPC9kaXY+PGxhYmVsIGNsYXNzPSdzd2l0Y2gnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2Zvdy1yZXZlYWwnPjxzcGFuIGNsYXNzPSdzbGlkZXIgcm91bmQnPjwvc3Bhbj48L2xhYmVsPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LCAwLCAwLCBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKSk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIGlmICgkKFwiI2Zvdy1yZXZlYWxcIikucHJvcChcImNoZWNrZWRcIikpXHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW91dFwiO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLW92ZXJcIjtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcblxyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMucmVjdC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZSB9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1hcFRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcmVjdCE6IFJlY3Q7XHJcbiAgICB4Q291bnQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIHZhbHVlPSczJz5cIik7XHJcbiAgICB5Q291bnQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIHZhbHVlPSczJz5cIik7XHJcbiAgICBkZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PiNYPC9kaXY+XCIpKS5hcHBlbmQodGhpcy54Q291bnQpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWTwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueUNvdW50KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludCwgMCwgMCwgXCJyZ2JhKDAsMCwwLDApXCIsIFwiYmxhY2tcIik7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWN0LncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdC5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICB0aGlzLnJlY3QucmVmUG9pbnQueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QucmVmUG9pbnQueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucmVjdCEsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLnJlY3QudztcclxuICAgICAgICBjb25zdCBoID0gdGhpcy5yZWN0Lmg7XHJcbiAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uWzBdO1xyXG5cclxuICAgICAgICBpZiAoc2VsIGluc3RhbmNlb2YgUmVjdCkge1xyXG4gICAgICAgICAgICBzZWwudyAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueENvdW50LnZhbCgpKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIHc7XHJcbiAgICAgICAgICAgIHNlbC5oICo9IHBhcnNlSW50KDxzdHJpbmc+dGhpcy55Q291bnQudmFsKCkpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplIC8gaDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYXRpdmVUcmFja2VyIHtcclxuICAgIGRhdGE6IEluaXRpYXRpdmVEYXRhW10gPSBbXTtcclxuICAgIGFkZEluaXRpYXRpdmUoZGF0YTogSW5pdGlhdGl2ZURhdGEsIHN5bmM6IGJvb2xlYW4pIHtcclxuICAgICAgICAvLyBPcGVuIHRoZSBpbml0aWF0aXZlIHRyYWNrZXIgaWYgaXQgaXMgbm90IGN1cnJlbnRseSBvcGVuLlxyXG4gICAgICAgIGlmICh0aGlzLmRhdGEubGVuZ3RoID09PSAwIHx8ICFnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImlzT3BlblwiKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgICAgIC8vIElmIG5vIGluaXRpYXRpdmUgZ2l2ZW4sIGFzc3VtZSBpdCAwXHJcbiAgICAgICAgaWYgKGRhdGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBkYXRhLmluaXRpYXRpdmUgPSAwO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBzaGFwZSBpcyBhbHJlYWR5IGJlaW5nIHRyYWNrZWRcclxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSBkYXRhLnV1aWQpO1xyXG4gICAgICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhpc3RpbmcsIGRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3luYylcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGRhdGEpO1xyXG4gICAgfTtcclxuICAgIHJlbW92ZUluaXRpYXRpdmUodXVpZDogc3RyaW5nLCBzeW5jOiBib29sZWFuLCBza2lwR3JvdXBDaGVjazogYm9vbGVhbikge1xyXG4gICAgICAgIGNvbnN0IGQgPSB0aGlzLmRhdGEuZmluZEluZGV4KGQgPT4gZC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICBpZiAoZCA+PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICghc2tpcEdyb3VwQ2hlY2sgJiYgdGhpcy5kYXRhW2RdLmdyb3VwKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zcGxpY2UoZCwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgICAgIGlmIChzeW5jKVxyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIHsgdXVpZDogdXVpZCB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgJiYgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiY2xvc2VcIik7XHJcbiAgICB9O1xyXG4gICAgcmVkcmF3KCkge1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgaWYgKGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgaWYgKGIuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIHJldHVybiBiLmluaXRpYXRpdmUgLSBhLmluaXRpYXRpdmU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5vd25lcnMgPT09IHVuZGVmaW5lZCkgZGF0YS5vd25lcnMgPSBbXTtcclxuICAgICAgICAgICAgY29uc3QgaW1nID0gZGF0YS5zcmMgPT09IHVuZGVmaW5lZCA/ICcnIDogJChgPGltZyBzcmM9XCIke2RhdGEuc3JjfVwiIHdpZHRoPVwiMzBweFwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPmApO1xyXG4gICAgICAgICAgICAvLyBjb25zdCBuYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHtzaC51dWlkfVwiIHZhbHVlPVwiJHtzaC5uYW1lfVwiIGRpc2FibGVkPSdkaXNhYmxlZCcgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cInZhbHVlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCIgdmFsdWU9XCIke2RhdGEuaW5pdGlhdGl2ZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiB2YWx1ZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCB2aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS11c2Vyc1wiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gJChgPGRpdiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiByZW1vdmVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgICAgICB2aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS52aXNpYmxlID8gXCIxLjBcIiA6IFwiMC4zXCIpO1xyXG4gICAgICAgICAgICBncm91cC5jc3MoXCJvcGFjaXR5XCIsIGRhdGEuZ3JvdXAgPyBcIjEuMFwiIDogXCIwLjNcIik7XHJcbiAgICAgICAgICAgIGlmICghZGF0YS5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSkge1xyXG4gICAgICAgICAgICAgICAgdmFsLnByb3AoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlLmNzcyhcIm9wYWNpdHlcIiwgXCIwLjNcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuYXBwZW5kKGltZykuYXBwZW5kKHZhbCkuYXBwZW5kKHZpc2libGUpLmFwcGVuZChncm91cCkuYXBwZW5kKHJlbW92ZSk7XHJcblxyXG4gICAgICAgICAgICB2YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIGNoYW5nZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGQuaW5pdGlhdGl2ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSkgfHwgMDtcclxuICAgICAgICAgICAgICAgIHNlbGYuYWRkSW5pdGlhdGl2ZShkLCB0cnVlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB2aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSkhO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyB2aXNpYmxlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGQudmlzaWJsZSA9ICFkLnZpc2libGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZC52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGdyb3VwLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIGdyb3VwIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGQuZ3JvdXAgPSAhZC5ncm91cDtcclxuICAgICAgICAgICAgICAgIGlmIChkLmdyb3VwKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIHJlbW92ZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUluaXRpYXRpdmUodXVpZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAgICB7IG5hbWU6IFwic2VsZWN0XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IHRydWUsIGhhc0RldGFpbDogZmFsc2UsIGNsejogU2VsZWN0VG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcInBhblwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBQYW5Ub29sIH0sXHJcbiAgICB7IG5hbWU6IFwiZHJhd1wiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IERyYXdUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwicnVsZXJcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogZmFsc2UsIGNsejogUnVsZXJUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwiZm93XCIsIHBsYXllclRvb2w6IGZhbHNlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IEZPV1Rvb2wgfSxcclxuICAgIHsgbmFtZTogXCJtYXBcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogTWFwVG9vbCB9LFxyXG5dOyIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50LCBWZWN0b3IgfSBmcm9tIFwiLi9nZW9tXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJsKG9iajogR2xvYmFsUG9pbnQpOiBMb2NhbFBvaW50IHtcclxuICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIHJldHVybiBuZXcgTG9jYWxQb2ludCgob2JqLnggKyBwYW5YKSAqIHosIChvYmoueSArIHBhblkpICogeik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybChuZXcgR2xvYmFsUG9pbnQoeCwgMCkpLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx5KHk6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybChuZXcgR2xvYmFsUG9pbnQoMCwgeSkpLnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx6KHo6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHogKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXREaXN0YW5jZShyOiBudW1iZXIpIHtcclxuICAgIHJldHVybiAociAvIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51bml0U2l6ZSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmxyKHI6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybHooZ2V0VW5pdERpc3RhbmNlKHIpKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogTG9jYWxQb2ludCk6IEdsb2JhbFBvaW50O1xyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogVmVjdG9yPExvY2FsUG9pbnQ+KTogVmVjdG9yPEdsb2JhbFBvaW50PjtcclxuZXhwb3J0IGZ1bmN0aW9uIGwyZyhvYmo6IExvY2FsUG9pbnR8VmVjdG9yPExvY2FsUG9pbnQ+KTogR2xvYmFsUG9pbnR8VmVjdG9yPEdsb2JhbFBvaW50PiB7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgcGFuWCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YO1xyXG4gICAgICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIGlmIChvYmogaW5zdGFuY2VvZiBMb2NhbFBvaW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBHbG9iYWxQb2ludCgob2JqLnggLyB6KSAtIHBhblgsIChvYmoueSAvIHopIC0gcGFuWSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7eDogb2JqLmRpcmVjdGlvbi54IC8geiwgeTogb2JqLmRpcmVjdGlvbi55IC8gen0sIG9iai5vcmlnaW4gPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGwyZyhvYmoub3JpZ2luKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMmd4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGwyZyhuZXcgTG9jYWxQb2ludCh4LCAwKSkueDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyZ3koeTogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbDJnKG5ldyBMb2NhbFBvaW50KDAsIHkpKS55O1xyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlcy9zaGFwZVwiO1xyXG5pbXBvcnQgeyBMb2NhbFBvaW50IH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vdXNlKGU6IE1vdXNlRXZlbnQpOiBMb2NhbFBvaW50IHtcclxuICAgIHJldHVybiBuZXcgTG9jYWxQb2ludChlLnBhZ2VYLCBlLnBhZ2VZKTtcclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWxwaFNvcnQoYTogc3RyaW5nLCBiOiBzdHJpbmcpIHtcclxuICAgIGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiAxO1xyXG59XHJcblxyXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XHJcbmV4cG9ydCBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT3JkZXJlZE1hcDxLLCBWPiB7XHJcbiAgICBrZXlzOiBLW10gPSBbXTtcclxuICAgIHZhbHVlczogVltdID0gW107XHJcbiAgICBnZXQoa2V5OiBLKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW3RoaXMua2V5cy5pbmRleE9mKGtleSldO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5kZXhWYWx1ZShpZHg6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpZHhdO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5kZXhLZXkoaWR4OiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlzW2lkeF07XHJcbiAgICB9XHJcbiAgICBzZXQoa2V5OiBLLCB2YWx1ZTogVikge1xyXG4gICAgICAgIHRoaXMua2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMucHVzaCh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBpbmRleE9mKGVsZW1lbnQ6IEspIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlzLmluZGV4T2YoZWxlbWVudCk7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoZWxlbWVudDogSykge1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuaW5kZXhPZihlbGVtZW50KTtcclxuICAgICAgICB0aGlzLmtleXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICB9XHJcbn0iXSwic291cmNlUm9vdCI6IiJ9