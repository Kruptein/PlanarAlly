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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./settings */ "./ts_src/settings.ts");







class LayerManager {
    constructor() {
        this.layers = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.selectedLayer = "";
        this.UUIDMap = new Map();
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
        for (let i = 0; i < layer.width; i += _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor) {
            ctx.moveTo(i + (_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panX % _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize) * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor, 0);
            ctx.lineTo(i + (_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panX % _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize) * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor, layer.height);
            ctx.moveTo(0, i + (_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panY % _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize) * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor);
            ctx.lineTo(layer.width, i + (_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panY % _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize) * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor);
        }
        ctx.strokeStyle = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].gridColour.spectrum("get").toRgbString();
        ctx.lineWidth = 1;
        ctx.stroke();
        layer.valid = true;
        if (this.hasLayer("fow"))
            this.getLayer("fow").invalidate(true);
    }
    setGridSize(gridSize) {
        if (gridSize !== gridSize) {
            gridSize = gridSize;
            this.drawGrid();
            $('#gridSizeInput').val(gridSize);
        }
    }
    setUnitSize(unitSize) {
        if (unitSize !== _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].unitSize) {
            _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].unitSize = unitSize;
            this.drawGrid();
            $('#unitSizeInput').val(unitSize);
        }
    }
    setUseGrid(useGrid) {
        if (useGrid !== _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].useGrid) {
            _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].useGrid = useGrid;
            if (useGrid)
                $('#grid-layer').show();
            else
                $('#grid-layer').hide();
            $('#useGridInput').prop("checked", useGrid);
        }
    }
    setFullFOW(fullFOW) {
        if (fullFOW !== _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fullFOW) {
            _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fullFOW = fullFOW;
            const fowl = this.getLayer("fow");
            if (fowl !== undefined)
                fowl.invalidate(false);
            $('#useFOWInput').prop("checked", fullFOW);
        }
    }
    setFOWOpacity(fowOpacity) {
        _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fowOpacity = fowOpacity;
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
                const z = _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor;
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
            if (_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fullFOW) {
                const ogalpha = this.ctx.globalAlpha;
                this.ctx.globalCompositeOperation = "copy";
                if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                    this.ctx.globalAlpha = _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fowOpacity;
                this.ctx.fillStyle = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString();
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.globalAlpha = ogalpha;
                this.ctx.globalCompositeOperation = orig_op;
            }
            if (!_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
                super.draw(!_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fullFOW);
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
                super.draw(!_settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].fullFOW);
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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./settings */ "./ts_src/settings.ts");










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
                        if (_settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].useGrid) {
                            const gs = _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].gridSize;
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
                    _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].panX = loc.panX;
                if (loc.panY)
                    _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].panY = loc.panY;
                if (loc.zoomFactor) {
                    _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].zoomFactor = loc.zoomFactor;
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
    if (e.button == 1) {
        const panTool = gameManager.tools.get("pan");
        if (panTool !== undefined) {
            panTool.onMouseDown(e);
        }
    }
    if ((e.button !== 0) || e.target.tagName !== 'CANVAS')
        return;
    $menu.hide();
    gameManager.tools.getIndexValue(gameManager.selectedTool).onMouseDown(e);
}
function onPointerMove(e) {
    if (!gameManager.board_initialised)
        return;
    if ((e.buttons & 4) !== 0) {
        const panTool = gameManager.tools.get("pan");
        if (panTool !== undefined) {
            panTool.onMouseMove(e);
        }
    }
    if (((e.buttons & 1) !== 1) || e.target.tagName !== 'CANVAS')
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
    if (e.button == 1) {
        const panTool = gameManager.tools.get("pan");
        if (panTool !== undefined) {
            panTool.onMouseUp(e);
        }
    }
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
    value: _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].zoomFactor,
    slide: function (event, ui) {
        const origZ = _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].zoomFactor;
        const newZ = 1 / ui.value;
        const origX = window.innerWidth / origZ;
        const newX = window.innerWidth / newZ;
        const origY = window.innerHeight / origZ;
        const newY = window.innerHeight / newZ;
        _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].zoomFactor = newZ;
        _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].panX -= (origX - newX) / 2;
        _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].panY -= (origY - newY) / 2;
        gameManager.layerManager.invalidate();
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", {
            locationOptions: {
                [`${gameManager.roomName}/${gameManager.roomCreator}/${gameManager.locationName}`]: {
                    panX: _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].panX,
                    panY: _settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].panY,
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
        $("#fowOpacity").val(_settings__WEBPACK_IMPORTED_MODULE_9__["Settings"].fowOpacity);
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

/***/ "./ts_src/settings.ts":
/*!****************************!*\
  !*** ./ts_src/settings.ts ***!
  \****************************/
/*! exports provided: Settings */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Settings", function() { return Settings; });
class Settings {
}
Settings.gridSize = 50;
Settings.unitSize = 5;
Settings.useGrid = true;
Settings.fullFOW = false;
Settings.fowOpacity = 0.3;
Settings.zoomFactor = 1;
Settings.panX = 0;
Settings.panY = 0;


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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");





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
    snapToGrid() {
        const gs = _settings__WEBPACK_IMPORTED_MODULE_4__["Settings"].gridSize;
        const center = this.center();
        const mx = center.x;
        const my = center.y;
        if ((this.w / gs) % 2 === 0) {
            this.refPoint.x = Math.round(mx / gs) * gs - this.w / 2;
        }
        else {
            this.refPoint.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - this.w / 2;
        }
        if ((this.h / gs) % 2 === 0) {
            this.refPoint.y = Math.round(my / gs) * gs - this.h / 2;
        }
        else {
            this.refPoint.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - this.h / 2;
        }
    }
    resizeToGrid() {
        const gs = _settings__WEBPACK_IMPORTED_MODULE_4__["Settings"].gridSize;
        this.refPoint.x = Math.round(this.refPoint.x / gs) * gs;
        this.refPoint.y = Math.round(this.refPoint.y / gs) * gs;
        this.w = Math.max(Math.round(this.w / gs) * gs, gs);
        this.h = Math.max(Math.round(this.h / gs) * gs, gs);
    }
    resize(resizedir, point) {
        const z = _settings__WEBPACK_IMPORTED_MODULE_4__["Settings"].zoomFactor;
        if (resizedir === 'nw') {
            this.w = Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2lx"])(this.refPoint.x) + this.w * z - point.x;
            this.h = Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2ly"])(this.refPoint.y) + this.h * z - point.y;
            this.refPoint = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2g"])(point);
        }
        else if (resizedir === 'ne') {
            this.w = point.x - Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2lx"])(this.refPoint.x);
            this.h = Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2ly"])(this.refPoint.y) + this.h * z - point.y;
            this.refPoint.y = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2gy"])(point.y);
        }
        else if (resizedir === 'se') {
            this.w = point.x - Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2lx"])(this.refPoint.x);
            this.h = point.y - Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2ly"])(this.refPoint.y);
        }
        else if (resizedir === 'sw') {
            this.w = Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2lx"])(this.refPoint.x) + this.w * z - point.x;
            this.h = point.y - Object(_units__WEBPACK_IMPORTED_MODULE_3__["g2ly"])(this.refPoint.y);
            this.refPoint.x = Object(_units__WEBPACK_IMPORTED_MODULE_3__["l2gx"])(point.x);
        }
        this.w /= z;
        this.h /= z;
        if (this.w < 0) {
            this.refPoint.x += this.w;
            this.w = Math.abs(this.w);
        }
        if (this.h < 0) {
            this.refPoint.y += this.h;
            this.h = Math.abs(this.h);
        }
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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");





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
    snapToGrid() {
        const gs = _settings__WEBPACK_IMPORTED_MODULE_4__["Settings"].gridSize;
        if ((2 * this.r / gs) % 2 === 0) {
            this.refPoint.x = Math.round(this.refPoint.x / gs) * gs;
        }
        else {
            this.refPoint.x = Math.round((this.refPoint.x - (gs / 2)) / gs) * gs + this.r;
        }
        if ((2 * this.r / gs) % 2 === 0) {
            this.refPoint.y = Math.round(this.refPoint.y / gs) * gs;
        }
        else {
            this.refPoint.y = Math.round((this.refPoint.y - (gs / 2)) / gs) * gs + this.r;
        }
    }
    resizeToGrid() {
        const gs = _settings__WEBPACK_IMPORTED_MODULE_4__["Settings"].gridSize;
        this.r = Math.max(Math.round(this.r / gs) * gs, gs / 2);
    }
    resize(resizedir, point) {
        const z = _settings__WEBPACK_IMPORTED_MODULE_4__["Settings"].zoomFactor;
        const diff = Object(_units__WEBPACK_IMPORTED_MODULE_2__["l2g"])(point).subtract(this.refPoint);
        this.r = Math.sqrt(Math.pow(diff.length(), 2) / 2);
    }
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
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../units */ "./ts_src/units.ts");
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");



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
        const z = _settings__WEBPACK_IMPORTED_MODULE_2__["Settings"].zoomFactor;
        const loc = Object(_units__WEBPACK_IMPORTED_MODULE_1__["g2l"])(this.refPoint);
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
    // Code to snap a grid to the grid
    // This is shape dependent as the shape refPoints are shape specific in
    snapToGrid() { }
    ;
    resizeToGrid() { }
    ;
    resize(resizeDir, point) { }
    ;
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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");







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
            sel.w *= parseInt(this.xCount.val()) * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize / w;
            sel.h *= parseInt(this.yCount.val()) * _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].gridSize / h;
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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");







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
        const z = _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].zoomFactor;
        const distance = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2g"])(mouse.subtract(this.panStart)).direction;
        _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panX += Math.round(distance.x);
        _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panY += Math.round(distance.y);
        this.panStart = mouse;
        _planarally__WEBPACK_IMPORTED_MODULE_3__["default"].layerManager.invalidate();
    }
    ;
    onMouseUp(e) {
        this.active = false;
        if (this.panStart.x === Object(_utils__WEBPACK_IMPORTED_MODULE_2__["getMouse"])(e).x && this.panStart.y === Object(_utils__WEBPACK_IMPORTED_MODULE_2__["getMouse"])(e).y) {
            return;
        }
        _socket__WEBPACK_IMPORTED_MODULE_5__["default"].emit("set clientOptions", {
            locationOptions: {
                [`${_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].roomName}/${_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].roomCreator}/${_planarally__WEBPACK_IMPORTED_MODULE_3__["default"].locationName}`]: {
                    panX: _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panX,
                    panY: _settings__WEBPACK_IMPORTED_MODULE_6__["Settings"].panY
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
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");








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
        const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * _settings__WEBPACK_IMPORTED_MODULE_7__["Settings"].unitSize / _settings__WEBPACK_IMPORTED_MODULE_7__["Settings"].gridSize) + " ft";
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
/* harmony import */ var _tool__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./tool */ "./ts_src/tools/tool.ts");
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../settings */ "./ts_src/settings.ts");









class SelectTool extends _tool__WEBPACK_IMPORTED_MODULE_7__["Tool"] {
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
            const corn = shape.getBoundingBox().getCorner(Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse));
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
                const z = _settings__WEBPACK_IMPORTED_MODULE_8__["Settings"].zoomFactor;
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
        const z = _settings__WEBPACK_IMPORTED_MODULE_8__["Settings"].zoomFactor;
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
                    sel.resize(this.resizedir, mouse);
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_6__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
            }
            else {
                for (let i = 0; i < layer.selection.length; i++) {
                    const sel = layer.selection[i];
                    const bb = sel.getBoundingBox();
                    const gm = Object(_units__WEBPACK_IMPORTED_MODULE_5__["l2g"])(mouse);
                    if (bb.inCorner(gm, "nw")) {
                        document.body.style.cursor = "nw-resize";
                    }
                    else if (bb.inCorner(gm, "ne")) {
                        document.body.style.cursor = "ne-resize";
                    }
                    else if (bb.inCorner(gm, "se")) {
                        document.body.style.cursor = "se-resize";
                    }
                    else if (bb.inCorner(gm, "sw")) {
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
                    if (_settings__WEBPACK_IMPORTED_MODULE_8__["Settings"].useGrid && !e.altKey) {
                        sel.snapToGrid();
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_6__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
                if (this.mode === _tools__WEBPACK_IMPORTED_MODULE_0__["SelectOperations"].Resize) {
                    if (_settings__WEBPACK_IMPORTED_MODULE_8__["Settings"].useGrid && !e.altKey) {
                        sel.resizeToGrid();
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
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./settings */ "./ts_src/settings.ts");


function g2l(obj) {
    const z = _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].zoomFactor;
    const panX = _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].panX;
    const panY = _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].panY;
    return new _geom__WEBPACK_IMPORTED_MODULE_0__["LocalPoint"]((obj.x + panX) * z, (obj.y + panY) * z);
}
function g2lx(x) {
    return g2l(new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](x, 0)).x;
}
function g2ly(y) {
    return g2l(new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"](0, y)).y;
}
function g2lz(z) {
    return z * _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].zoomFactor;
}
function getUnitDistance(r) {
    return (r / _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].unitSize) * _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].gridSize;
}
function g2lr(r) {
    return g2lz(getUnitDistance(r));
}
function l2g(obj) {
    const z = _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].zoomFactor;
    const panX = _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].panX;
    const panY = _settings__WEBPACK_IMPORTED_MODULE_1__["Settings"].panY;
    if (obj instanceof _geom__WEBPACK_IMPORTED_MODULE_0__["LocalPoint"]) {
        return new _geom__WEBPACK_IMPORTED_MODULE_0__["GlobalPoint"]((obj.x / z) - panX, (obj.y / z) - panY);
    }
    else {
        return new _geom__WEBPACK_IMPORTED_MODULE_0__["Vector"]({ x: obj.direction.x / z, y: obj.direction.y / z }, obj.origin === undefined ? undefined : l2g(obj.origin));
    }
}
function l2gx(x) {
    return l2g(new _geom__WEBPACK_IMPORTED_MODULE_0__["LocalPoint"](x, 0)).x;
}
function l2gy(y) {
    return l2g(new _geom__WEBPACK_IMPORTED_MODULE_0__["LocalPoint"](0, y)).y;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2V0dGluZ3MudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9hc3NldC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2Jhc2VyZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvYm91bmRpbmdyZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvY2lyY2xlLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvZWRpdGRpYWxvZy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2xpbmUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9yZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvc2hhcGUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy90ZXh0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvdXRpbHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NvY2tldC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvZHJhdy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvZm93LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9pbml0aWF0aXZlLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9tYXAudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzL3Bhbi50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvcnVsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzL3NlbGVjdC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvdG9vbC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvdG9vbHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3VuaXRzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7O0FBR0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbkVBO0FBQUE7Ozs7RUFJRTtBQUVGO0lBR0ksWUFBWSxDQUFTLEVBQUUsQ0FBUTtRQUMzQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUNELEdBQUcsQ0FBQyxHQUFpQjtRQUNqQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNELFFBQVEsQ0FBQyxLQUFZO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxFQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FB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QUFnRDtJQUNoRCxNQUFNLEtBQUssR0FBRyxFQUFFLEdBQUMsRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUM7SUFDNUIsRUFBRSxFQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQztJQUV6RCxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzQixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzQix1Q0FBdUM7SUFDdkMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFDLEtBQUssQ0FBQztJQUV6QixNQUFNLFNBQVMsR0FBTSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQyxHQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUMsRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUMsR0FBQyxRQUFRLEVBQUMsQ0FBQztJQUNoRixFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUM7SUFDOUMsTUFBTSxDQUFDLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUM7QUFDbkQsQ0FBQztBQUVLLDBCQUEyQixFQUFTLEVBQUUsRUFBUztJQUNqRCxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcsRUFB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LENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDO0lBQ0QsUUFBUSxDQUFDLEtBQWtCLEVBQUUsTUFBYztRQUN2QyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2IsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEssS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoSixLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSyxLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEw7Z0JBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQztJQUNELFNBQVMsQ0FBQyxLQUFrQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFHRCxNQUFNLENBQUMsV0FBeUI7UUFDNUIsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSw0Q0FBTSxDQUFjLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELGVBQWUsQ0FBQyxNQUF5QjtRQUNyQyxNQUFNLENBQUMsQ0FBQyxDQUFDLG1EQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTTtZQUMxRSxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUNELFVBQVU7UUFDTixNQUFNLEVBQUUsR0FBRyxrREFBUSxDQUFDLFFBQVEsQ0FBQztRQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDN0IsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNwQixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckYsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckYsQ0FBQztJQUNMLENBQUM7SUFDRCxZQUFZO1FBQ1IsTUFBTSxFQUFFLEdBQUcsa0RBQVEsQ0FBQyxRQUFRLENBQUM7UUFDN0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDeEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDeEQsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNELE1BQU0sQ0FBQyxTQUFpQixFQUFFLEtBQWlCO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLGtEQUFRLENBQUMsVUFBVSxDQUFDO1FBQzlCLEVBQUUsQ0FBQyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsUUFBUSxHQUFHLGtEQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxt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SSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGlEQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUMzSixvRUFBc0IsQ0FBQyxJQUFJLGlEQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksaURBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDN0ssb0VBQXNCLENBQUMsSUFBSSxpREFBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxpREFBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDM0osb0VBQXNCLENBQUMsSUFBSSxpREFBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGlEQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENB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LENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xLLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwTDtnQkFDSSxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3JCLENBQUM7SUFDTCxDQUFDO0lBQ0QsU0FBUyxDQUFDLEtBQWtCO1FBQ3hCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FB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LE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxNQUFNLENBQUMsT0FBVTtRQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0NBQ0oiLCJmaWxlIjoicGxhbmFyYWxseS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3RzX3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiLypcclxuVGhpcyBtb2R1bGUgZGVmaW5lcyBzb21lIFBvaW50IGNsYXNzZXMuXHJcbkEgc3Ryb25nIGZvY3VzIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYXQgbm8gdGltZSBhIGdsb2JhbCBhbmQgYSBsb2NhbCBwb2ludCBhcmUgaW4gc29tZSB3YXkgdXNlZCBpbnN0ZWFkIG9mIHRoZSBvdGhlci5cclxuVGhpcyBhZGRzIHNvbWUgYXQgZmlyc3QgZ2xhbmNlIHdlaXJkIGxvb2tpbmcgaGFja3MgYXMgdHMgZG9lcyBub3Qgc3VwcG9ydCBub21pbmFsIHR5cGluZy5cclxuKi9cclxuXHJcbmNsYXNzIFBvaW50IHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTpudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICB9XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIHZlYy5kaXJlY3Rpb24ueCwgdGhpcy55ICsgdmVjLmRpcmVjdGlvbi55KTtcclxuICAgIH1cclxuICAgIHN1YnRyYWN0KG90aGVyOiBQb2ludCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yKHt4OiB0aGlzLnggLSBvdGhlci54LCB5OiB0aGlzLnkgLSBvdGhlci55fSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgICBjbG9uZSgpOiBQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0IGNsYXNzIEdsb2JhbFBvaW50IGV4dGVuZHMgUG9pbnQge1xyXG4gICAgLy8gdGhpcyBpcyB0byBkaWZmZXJlbnRpYXRlIHdpdGggTG9jYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0dsb2JhbFBvaW50ITogc3RyaW5nO1xyXG4gICAgYWRkKHZlYzogVmVjdG9yPHRoaXM+KTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogR2xvYmFsUG9pbnQpOiBWZWN0b3I8dGhpcz4ge1xyXG4gICAgICAgICByZXR1cm4gc3VwZXIuc3VidHJhY3Qob3RoZXIpO1xyXG4gICAgfVxyXG4gICAgY2xvbmUoKTogR2xvYmFsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8R2xvYmFsUG9pbnQ+c3VwZXIuY2xvbmUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExvY2FsUG9pbnQgZXh0ZW5kcyBQb2ludCB7XHJcbiAgICAvLyB0aGlzIGlzIHRvIGRpZmZlcmVudGlhdGUgd2l0aCBHbG9iYWxQb2ludCwgaXMgYWN0dWFsbHkgbmV2ZXIgdXNlZFxyXG4gICAgLy8gV2UgZG8gISB0byBwcmV2ZW50IGVycm9ycyB0aGF0IGl0IGdldHMgbmV2ZXIgaW5pdGlhbGl6ZWQgYmVjYXVzZSB5ZWFoLlxyXG4gICAgX0xvY2FsUG9pbnQhOiBzdHJpbmc7XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pOiBMb2NhbFBvaW50IHtcclxuICAgICAgICByZXR1cm4gPExvY2FsUG9pbnQ+c3VwZXIuYWRkKHZlYyk7XHJcbiAgICB9XHJcbiAgICBzdWJ0cmFjdChvdGhlcjogTG9jYWxQb2ludCk6IFZlY3Rvcjx0aGlzPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLnN1YnRyYWN0KG90aGVyKTtcclxuICAgIH1cclxuICAgIGNsb25lKCk6IExvY2FsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8TG9jYWxQb2ludD5zdXBlci5jbG9uZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmVjdG9yPFQgZXh0ZW5kcyBQb2ludD4ge1xyXG4gICAgZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn07XHJcbiAgICBvcmlnaW4/OiBUO1xyXG4gICAgY29uc3RydWN0b3IoZGlyZWN0aW9uOiB7eDogbnVtYmVyLCB5Om51bWJlcn0sIG9yaWdpbj86IFQpIHtcclxuICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcclxuICAgICAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbjtcclxuICAgIH1cclxuICAgIGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMuZGlyZWN0aW9uLngsIDIpICsgTWF0aC5wb3codGhpcy5kaXJlY3Rpb24ueSwgMikpO1xyXG4gICAgfVxyXG4gICAgbm9ybWFsaXplKCkge1xyXG4gICAgICAgIGNvbnN0IGwgPSB0aGlzLmxlbmd0aCgpXHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8VD4oe3g6IHRoaXMuZGlyZWN0aW9uLnggLyBsLCB5OiB0aGlzLmRpcmVjdGlvbi55IC8gbH0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxuICAgIHJldmVyc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8VD4oe3g6IC10aGlzLmRpcmVjdGlvbi54LCB5OiAtdGhpcy5kaXJlY3Rpb24ueX0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxuICAgIG11bHRpcGx5KHNjYWxlOiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjxUPih7eDogdGhpcy5kaXJlY3Rpb24ueCAqIHNjYWxlLCB5OiB0aGlzLmRpcmVjdGlvbi55ICogc2NhbGV9LCB0aGlzLm9yaWdpbik7XHJcbiAgICB9XHJcbiAgICBkb3Qob3RoZXI6IFZlY3RvcjxUPikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRpcmVjdGlvbi54ICogb3RoZXIuZGlyZWN0aW9uLnggKyB0aGlzLmRpcmVjdGlvbi55ICogb3RoZXIuZGlyZWN0aW9uLnk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lPFQgZXh0ZW5kcyBQb2ludD4ocDogVCwgbDE6IFQsIGwyOiBUKSB7XHJcbiAgICByZXR1cm4gcC54ID49IE1hdGgubWluKGwxLngsIGwyLngpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnggPD0gTWF0aC5tYXgobDEueCwgbDIueCkgKyAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueSA+PSBNYXRoLm1pbihsMS55LCBsMi55KSAtIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55IDw9IE1hdGgubWF4KGwxLnksIGwyLnkpICsgMC4wMDAwMDE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lczxUIGV4dGVuZHMgUG9pbnQ+KHA6IFQsIHMxOiBULCBlMTogVCwgczI6IFQsIGUyOiBUKSB7XHJcbiAgICByZXR1cm4gcG9pbnRJbkxpbmUocCwgczEsIGUxKSAmJiBwb2ludEluTGluZShwLCBzMiwgZTIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGluZXNJbnRlcnNlY3RQb2ludDxUIGV4dGVuZHMgUG9pbnQ+KHMxOiBULCBlMTogVCwgczI6IFQsIGUyOiBUKSB7XHJcbiAgICAvLyBjb25zdCBzMSA9IE1hdGgubWluKFMxLCApXHJcbiAgICBjb25zdCBBMSA9IGUxLnktczEueTtcclxuICAgIGNvbnN0IEIxID0gczEueC1lMS54O1xyXG4gICAgY29uc3QgQTIgPSBlMi55LXMyLnk7XHJcbiAgICBjb25zdCBCMiA9IHMyLngtZTIueDtcclxuXHJcbiAgICAvLyBHZXQgZGVsdGEgYW5kIGNoZWNrIGlmIHRoZSBsaW5lcyBhcmUgcGFyYWxsZWxcclxuICAgIGNvbnN0IGRlbHRhID0gQTEqQjIgLSBBMipCMTtcclxuICAgIGlmKGRlbHRhID09PSAwKSByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IHRydWV9O1xyXG5cclxuICAgIGNvbnN0IEMyID0gQTIqczIueCtCMipzMi55O1xyXG4gICAgY29uc3QgQzEgPSBBMSpzMS54K0IxKnMxLnk7XHJcbiAgICAvL2ludmVydCBkZWx0YSB0byBtYWtlIGRpdmlzaW9uIGNoZWFwZXJcclxuICAgIGNvbnN0IGludmRlbHRhID0gMS9kZWx0YTtcclxuXHJcbiAgICBjb25zdCBpbnRlcnNlY3QgPSA8VD57eDogKEIyKkMxIC0gQjEqQzIpKmludmRlbHRhLCB5OiAoQTEqQzIgLSBBMipDMSkqaW52ZGVsdGF9O1xyXG4gICAgaWYgKCFwb2ludEluTGluZXMoaW50ZXJzZWN0LCBzMSwgZTEsIHMyLCBlMikpXHJcbiAgICAgICAgcmV0dXJuIHtpbnRlcnNlY3Q6IG51bGwsIHBhcmFsbGVsOiBmYWxzZX07XHJcbiAgICByZXR1cm4ge2ludGVyc2VjdDogaW50ZXJzZWN0LCBwYXJhbGxlbDogZmFsc2V9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9pbnREaXN0YW5jZShwMTogUG9pbnQsIHAyOiBQb2ludCkge1xyXG4gICAgY29uc3QgYSA9IHAxLnggLSBwMi54O1xyXG4gICAgY29uc3QgYiA9IHAxLnkgLSBwMi55O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggYSphICsgYipiICk7XHJcbn0iLCJpbXBvcnQge2dldFVuaXREaXN0YW5jZSwgZzJsLCBnMmx6LCBnMmxyLCBnMmx4LCBnMmx5fSBmcm9tIFwiLi91bml0c1wiO1xyXG5pbXBvcnQge0dsb2JhbFBvaW50fSBmcm9tIFwiLi9nZW9tXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IExvY2F0aW9uT3B0aW9ucywgU2VydmVyU2hhcGUgfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlcy9zaGFwZVwiO1xyXG5pbXBvcnQgQ2lyY2xlIGZyb20gXCIuL3NoYXBlcy9jaXJjbGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9zaGFwZXMvYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGNyZWF0ZVNoYXBlRnJvbURpY3QgfSBmcm9tIFwiLi9zaGFwZXMvdXRpbHNcIjtcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIExheWVyTWFuYWdlciB7XHJcbiAgICBsYXllcnM6IExheWVyW10gPSBbXTtcclxuICAgIHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICBzZWxlY3RlZExheWVyOiBzdHJpbmcgPSBcIlwiO1xyXG5cclxuICAgIFVVSURNYXA6IE1hcDxzdHJpbmcsIFNoYXBlPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAvLyBSZWZyZXNoIGludGVydmFsIGFuZCByZWRyYXcgc2V0dGVyLlxyXG4gICAgaW50ZXJ2YWwgPSAzMDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBjb25zdCBsbSA9IHRoaXM7XHJcbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gbG0ubGF5ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBsbS5sYXllcnNbaV0uZHJhdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgdGhpcy5pbnRlcnZhbCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0T3B0aW9ucyhvcHRpb25zOiBMb2NhdGlvbk9wdGlvbnMpOiB2b2lkIHtcclxuICAgICAgICBpZiAoXCJ1bml0U2l6ZVwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0VW5pdFNpemUob3B0aW9ucy51bml0U2l6ZSk7XHJcbiAgICAgICAgaWYgKFwidXNlR3JpZFwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0VXNlR3JpZChvcHRpb25zLnVzZUdyaWQpO1xyXG4gICAgICAgIGlmIChcImZ1bGxGT1dcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldEZ1bGxGT1cob3B0aW9ucy5mdWxsRk9XKTtcclxuICAgICAgICBpZiAoJ2Zvd09wYWNpdHknIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0Rk9XT3BhY2l0eShvcHRpb25zLmZvd09wYWNpdHkpO1xyXG4gICAgICAgIGlmIChcImZvd0NvbG91clwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmZvd0NvbG91cik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0V2lkdGgod2lkdGg6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTGF5ZXIobGF5ZXI6IExheWVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5sYXllcnMucHVzaChsYXllcik7XHJcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRMYXllciA9PT0gXCJcIiAmJiBsYXllci5zZWxlY3RhYmxlKSB0aGlzLnNlbGVjdGVkTGF5ZXIgPSBsYXllci5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc0xheWVyKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxheWVycy5zb21lKGwgPT4gbC5uYW1lID09PSBuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRMYXllcihuYW1lPzogc3RyaW5nKSB7XHJcbiAgICAgICAgbmFtZSA9IChuYW1lID09PSB1bmRlZmluZWQpID8gdGhpcy5zZWxlY3RlZExheWVyIDogbmFtZTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyc1tpXS5uYW1lID09PSBuYW1lKSByZXR1cm4gdGhpcy5sYXllcnNbaV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vdG9kbyByZW5hbWUgdG8gc2VsZWN0TGF5ZXJcclxuICAgIHNldExheWVyKG5hbWU6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgICAgICB0aGlzLmxheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGFibGUpIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGZvdW5kICYmIGxheWVyLm5hbWUgIT09ICdmb3cnKSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAwLjM7XHJcbiAgICAgICAgICAgIGVsc2UgbGF5ZXIuY3R4Lmdsb2JhbEFscGhhID0gMS4wO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IGxheWVyLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGxtLnNlbGVjdGVkTGF5ZXIgPSBuYW1lO1xyXG4gICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRHcmlkTGF5ZXIoKTogTGF5ZXJ8dW5kZWZpbmVkIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRMYXllcihcImdyaWRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0dyaWQoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSB0aGlzLmdldEdyaWRMYXllcigpO1xyXG4gICAgICAgIGlmIChsYXllciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgY3R4ID0gbGF5ZXIuY3R4O1xyXG4gICAgICAgIGxheWVyLmNsZWFyKCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyLndpZHRoOyBpICs9IFNldHRpbmdzLmdyaWRTaXplICogU2V0dGluZ3Muem9vbUZhY3Rvcikge1xyXG4gICAgICAgICAgICBjdHgubW92ZVRvKGkgKyAoU2V0dGluZ3MucGFuWCAlIFNldHRpbmdzLmdyaWRTaXplKSAqIFNldHRpbmdzLnpvb21GYWN0b3IsIDApO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGkgKyAoU2V0dGluZ3MucGFuWCAlIFNldHRpbmdzLmdyaWRTaXplKSAqIFNldHRpbmdzLnpvb21GYWN0b3IsIGxheWVyLmhlaWdodCk7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oMCwgaSArIChTZXR0aW5ncy5wYW5ZICUgU2V0dGluZ3MuZ3JpZFNpemUpICogU2V0dGluZ3Muem9vbUZhY3Rvcik7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8obGF5ZXIud2lkdGgsIGkgKyAoU2V0dGluZ3MucGFuWSAlIFNldHRpbmdzLmdyaWRTaXplKSAqIFNldHRpbmdzLnpvb21GYWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gZ2FtZU1hbmFnZXIuZ3JpZENvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICBsYXllci52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTGF5ZXIoXCJmb3dcIikpXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R3JpZFNpemUoZ3JpZFNpemU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGlmIChncmlkU2l6ZSAhPT0gZ3JpZFNpemUpIHtcclxuICAgICAgICAgICAgZ3JpZFNpemUgPSBncmlkU2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjZ3JpZFNpemVJbnB1dCcpLnZhbChncmlkU2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVuaXRTaXplKHVuaXRTaXplOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBpZiAodW5pdFNpemUgIT09IFNldHRpbmdzLnVuaXRTaXplKSB7XHJcbiAgICAgICAgICAgIFNldHRpbmdzLnVuaXRTaXplID0gdW5pdFNpemU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgJCgnI3VuaXRTaXplSW5wdXQnKS52YWwodW5pdFNpemUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRVc2VHcmlkKHVzZUdyaWQ6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAodXNlR3JpZCAhPT0gU2V0dGluZ3MudXNlR3JpZCkge1xyXG4gICAgICAgICAgICBTZXR0aW5ncy51c2VHcmlkID0gdXNlR3JpZDtcclxuICAgICAgICAgICAgaWYgKHVzZUdyaWQpXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLnNob3coKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJCgnI2dyaWQtbGF5ZXInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICQoJyN1c2VHcmlkSW5wdXQnKS5wcm9wKFwiY2hlY2tlZFwiLCB1c2VHcmlkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RnVsbEZPVyhmdWxsRk9XOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGZ1bGxGT1cgIT09IFNldHRpbmdzLmZ1bGxGT1cpIHtcclxuICAgICAgICAgICAgU2V0dGluZ3MuZnVsbEZPVyA9IGZ1bGxGT1c7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvd2wgPSB0aGlzLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgJCgnI3VzZUZPV0lucHV0JykucHJvcChcImNoZWNrZWRcIiwgZnVsbEZPVyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEZPV09wYWNpdHkoZm93T3BhY2l0eTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgU2V0dGluZ3MuZm93T3BhY2l0eSA9IGZvd09wYWNpdHk7XHJcbiAgICAgICAgY29uc3QgZm93bCA9IHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgaWYgKGZvd2wgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAkKCcjZm93T3BhY2l0eScpLnZhbChmb3dPcGFjaXR5KTtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExheWVyIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHdpZHRoOiBudW1iZXI7XHJcbiAgICBoZWlnaHQ6IG51bWJlcjtcclxuICAgIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHJcbiAgICBzZWxlY3RhYmxlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwbGF5ZXJfZWRpdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBXaGVuIHNldCB0byBmYWxzZSwgdGhlIGxheWVyIHdpbGwgYmUgcmVkcmF3biBvbiB0aGUgbmV4dCB0aWNrXHJcbiAgICB2YWxpZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgLy8gVGhlIGNvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgdGhpcyBsYXllciBjb250YWlucy5cclxuICAgIC8vIFRoZXNlIGFyZSBvcmRlcmVkIG9uIGEgZGVwdGggYmFzaXMuXHJcbiAgICBzaGFwZXM6IFNoYXBlW10gPSBbXTtcclxuXHJcbiAgICAvLyBDb2xsZWN0aW9uIG9mIHNoYXBlcyB0aGF0IGFyZSBjdXJyZW50bHkgc2VsZWN0ZWRcclxuICAgIHNlbGVjdGlvbjogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIEV4dHJhIHNlbGVjdGlvbiBoaWdobGlnaHRpbmcgc2V0dGluZ3NcclxuICAgIHNlbGVjdGlvbkNvbG9yID0gJyNDQzAwMDAnO1xyXG4gICAgc2VsZWN0aW9uV2lkdGggPSAyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XHJcbiAgICB9XHJcblxyXG4gICAgaW52YWxpZGF0ZShza2lwTGlnaHRVcGRhdGU6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFza2lwTGlnaHRVcGRhdGUgJiYgdGhpcy5uYW1lICE9PSBcImZvd1wiICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSkge1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgc2hhcGUubGF5ZXIgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMucHVzaChzaGFwZSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChzaGFwZS5hbm5vdGF0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMucHVzaChzaGFwZS51dWlkKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJhZGQgc2hhcGVcIiwge3NoYXBlOiBzaGFwZS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5zZXQoc2hhcGUudXVpZCwgc2hhcGUpO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSghc3luYyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0U2hhcGVzKHNoYXBlczogU2VydmVyU2hhcGVbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IHQ6IFNoYXBlW10gPSBbXTtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2ggPSBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlKTtcclxuICAgICAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gdHlwZSAke3NoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzaC5sYXllciA9IHNlbGYubmFtZTtcclxuICAgICAgICAgICAgc2guY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc2guc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgaWYgKHNoLmFubm90YXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMucHVzaChzaC51dWlkKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoKTtcclxuICAgICAgICAgICAgdC5wdXNoKHNoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdOyAvLyBUT0RPOiBGaXgga2VlcGluZyBzZWxlY3Rpb24gb24gdGhvc2UgaXRlbXMgdGhhdCBhcmUgbm90IG1vdmVkLlxyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gdDtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpLCAxKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJyZW1vdmUgc2hhcGVcIiwge3NoYXBlOiBzaGFwZSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcclxuICAgICAgICBjb25zdCBsc19pID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmZpbmRJbmRleChscyA9PiBscy5zaGFwZSA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgY29uc3QgbGJfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZmluZEluZGV4KGxzID0+IGxzID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBjb25zdCBtYl9pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IGFuX2kgPSBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGlmIChsc19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UobHNfaSwgMSk7XHJcbiAgICAgICAgaWYgKGxiX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5zcGxpY2UobGJfaSwgMSk7XHJcbiAgICAgICAgaWYgKG1iX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2UobWJfaSwgMSk7XHJcbiAgICAgICAgaWYgKGFuX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMuc3BsaWNlKGFuX2ksIDEpO1xyXG5cclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5kZWxldGUoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zZWxlY3Rpb24uaW5kZXhPZihzaGFwZSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID49IDApXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoZG9DbGVhcj86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGRvQ2xlYXIgPSBkb0NsZWFyID09PSB1bmRlZmluZWQgPyB0cnVlIDogZG9DbGVhcjtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb0NsZWFyKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLnZpc2libGVJbkNhbnZhcyhzdGF0ZS5jYW52YXMpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUubmFtZSA9PT0gJ2ZvdycgJiYgc2hhcGUudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhLm5hbWUgIT09IHN0YXRlLm5hbWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHNoYXBlLmRyYXcoY3R4KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuc2VsZWN0aW9uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gU2V0dGluZ3Muem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJiID0gc2VsLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogUkVGQUNUT1IgVEhJUyBUTyBTaGFwZS5kcmF3U2VsZWN0aW9uKGN0eCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QoZzJseChiYi5yZWZQb2ludC54KSwgZzJseShiYi5yZWZQb2ludC55KSwgYmIudyAqIHosIGJiLmggKiB6KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9wcmlnaHRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChiYi5yZWZQb2ludC54ICsgYmIudyAtIDMpLCBnMmx5KGJiLnJlZlBvaW50LnkgLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0b3BsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGcybHgoYmIucmVmUG9pbnQueCAtIDMpLCBnMmx5KGJiLnJlZlBvaW50LnkgLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBib3RyaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdChnMmx4KGJiLnJlZlBvaW50LnggKyBiYi53IC0gMyksIGcybHkoYmIucmVmUG9pbnQueSArIGJiLmggLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBib3RsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGcybHgoYmIucmVmUG9pbnQueCAtIDMpLCBnMmx5KGJiLnJlZlBvaW50LnkgKyBiYi5oIC0gMyksIDYgKiB6LCA2ICogeilcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVNoYXBlT3JkZXIoc2hhcGU6IFNoYXBlLCBkZXN0aW5hdGlvbkluZGV4OiBudW1iZXIsIHN5bmM6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBvbGRJZHggPSB0aGlzLnNoYXBlcy5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAob2xkSWR4ID09PSBkZXN0aW5hdGlvbkluZGV4KSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKG9sZElkeCwgMSk7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKGRlc3RpbmF0aW9uSW5kZXgsIDAsIHNoYXBlKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJtb3ZlU2hhcGVPcmRlclwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCBpbmRleDogZGVzdGluYXRpb25JbmRleH0pO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU/OiBTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBMYXllciB7XHJcbiAgICBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5kcmF3R3JpZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRk9XTGF5ZXIgZXh0ZW5kcyBMYXllciB7XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLmFkZFNoYXBlKHNoYXBlLCBzeW5jLCB0ZW1wb3JhcnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNlcnZlclNoYXBlW10pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBjID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIHNoYXBlLmZpbGwgPSBjO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHN1cGVyLnNldFNoYXBlcyhzaGFwZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2hhcGVNb3ZlKHNoYXBlOiBTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIHNoYXBlLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzdXBlci5vblNoYXBlTW92ZShzaGFwZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGRyYXcoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkICYmICF0aGlzLnZhbGlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuY3R4O1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnX29wID0gY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICAgICAgaWYgKFNldHRpbmdzLmZ1bGxGT1cpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9nYWxwaGEgPSB0aGlzLmN0eC5nbG9iYWxBbHBoYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiY29weVwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gU2V0dGluZ3MuZm93T3BhY2l0eTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IG9nYWxwaGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFTZXR0aW5ncy5mdWxsRk9XKTtcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwidG9rZW5zXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJ0b2tlbnNcIikhLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2gub3duZWRCeSgpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmIgPSBzaC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxjZW50ZXIgPSBnMmwoc2guY2VudGVyKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsbSA9IDAuOCAqIGcybHooYmIudyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcclxuICAgICAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwgMCwgMCwgMSknKTtcclxuICAgICAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKGxzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChscy5zaGFwZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYSA9IHNoLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09IGxzLmF1cmEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF1cmEgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT2xkIGxpZ2h0c291cmNlIHN0aWxsIGxpbmdlcmluZyBpbiB0aGUgZ2FtZU1hbmFnZXIgbGlzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX2xlbmd0aCA9IGdldFVuaXREaXN0YW5jZShhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IHNoLmNlbnRlcigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IGcybChjZW50ZXIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IG5ldyBDaXJjbGUoY2VudGVyLCBhdXJhX2xlbmd0aCkuZ2V0Qm91bmRpbmdCb3goKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBXZSBmaXJzdCBjb2xsZWN0IGFsbCBsaWdodGJsb2NrZXJzIHRoYXQgYXJlIGluc2lkZS9jcm9zcyBvdXIgYXVyYVxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyB0byBwcmV2ZW50IGFzIG1hbnkgcmF5IGNhbGN1bGF0aW9ucyBhcyBwb3NzaWJsZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jYWxfbGlnaHRibG9ja2VyczogQm91bmRpbmdSZWN0W10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAobGIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGIgPT09IHNoLnV1aWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYl9zaCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChsYik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiX3NoID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYl9iYiA9IGxiX3NoLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiX2JiLmludGVyc2VjdHNXaXRoKGJib3gpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbF9saWdodGJsb2NrZXJzLnB1c2gobGJfYmIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhcmNfc3RhcnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhc3QgcmF5cyBpbiBldmVyeSBkZWdyZWVcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGFuZ2xlID0gMDsgYW5nbGUgPCAyICogTWF0aC5QSTsgYW5nbGUgKz0gKDEgLyAxODApICogTWF0aC5QSSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGhpdCB3aXRoIG9ic3RydWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhpdDoge2ludGVyc2VjdDogR2xvYmFsUG9pbnR8bnVsbCwgZGlzdGFuY2U6bnVtYmVyfSA9IHtpbnRlcnNlY3Q6IG51bGwsIGRpc3RhbmNlOiBJbmZpbml0eX07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNoYXBlX2hpdDogbnVsbHxCb3VuZGluZ1JlY3QgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxsb2NhbF9saWdodGJsb2NrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbG9jYWxfbGlnaHRibG9ja2Vyc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbGJfYmIuZ2V0SW50ZXJzZWN0V2l0aExpbmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGNlbnRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbmV3IEdsb2JhbFBvaW50KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlci54ICsgYXVyYV9sZW5ndGggKiBNYXRoLmNvcyhhbmdsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5pbnRlcnNlY3QgIT09IG51bGwgJiYgcmVzdWx0LmRpc3RhbmNlIDwgaGl0LmRpc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaXQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZV9oaXQgPSBsYl9iYjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIG5vIGhpdCwgY2hlY2sgaWYgd2UgY29tZSBmcm9tIGEgcHJldmlvdXMgaGl0IHNvIHRoYXQgd2UgY2FuIGdvIGJhY2sgdG8gdGhlIGFyY1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaXQuaW50ZXJzZWN0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSBhbmdsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc3QgPSBnMmwobmV3IEdsb2JhbFBvaW50KGNlbnRlci54ICsgYXVyYV9sZW5ndGggKiBNYXRoLmNvcyhhbmdsZSksIGNlbnRlci55ICsgYXVyYV9sZW5ndGggKiBNYXRoLnNpbihhbmdsZSkpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oZGVzdC54LCBkZXN0LnkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBoaXQgLCBmaXJzdCBmaW5pc2ggYW55IG9uZ29pbmcgYXJjLCB0aGVuIG1vdmUgdG8gdGhlIGludGVyc2VjdGlvbiBwb2ludFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIGcybHIoYXVyYS52YWx1ZSksIGFyY19zdGFydCwgYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4dHJhWCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4dHJhWSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoYXBlX2hpdCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYVggPSAoc2hhcGVfaGl0LncgLyAxMCkgKiBNYXRoLmNvcyhhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhWSA9IChzaGFwZV9oaXQuaCAvIDEwKSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCFzaGFwZV9oaXQuY29udGFpbnMoaGl0LmludGVyc2VjdC54ICsgZXh0cmFYLCBoaXQuaW50ZXJzZWN0LnkgKyBleHRyYVksIGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVggPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVkgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXN0ID0gZzJsKG5ldyBHbG9iYWxQb2ludChoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgsIGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oZGVzdC54LCBkZXN0LnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgZzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCAyICogTWF0aC5QSSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgYWxtID0gZzJscihhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcclxuICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDAsIDAsIDAsIDApJyk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbiAgICAgICAgICAgICAgICAvLyBjdHguZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEpXCI7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghU2V0dGluZ3MuZnVsbEZPVyk7XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBzb2NrZXQgZnJvbSAnLi9zb2NrZXQnXHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7IExheWVyTWFuYWdlciwgTGF5ZXIsIEdyaWRMYXllciwgRk9XTGF5ZXIgfSBmcm9tIFwiLi9sYXllcnNcIjtcclxuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgQm9hcmRJbmZvLCBTZXJ2ZXJTaGFwZSwgSW5pdGlhdGl2ZURhdGEgfSBmcm9tICcuL2FwaV90eXBlcyc7XHJcbmltcG9ydCB7IE9yZGVyZWRNYXAsIGdldE1vdXNlIH0gZnJvbSAnLi91dGlscyc7XHJcbmltcG9ydCBBc3NldCBmcm9tICcuL3NoYXBlcy9hc3NldCc7XHJcbmltcG9ydCB7Y3JlYXRlU2hhcGVGcm9tRGljdH0gZnJvbSAnLi9zaGFwZXMvdXRpbHMnO1xyXG5pbXBvcnQgeyBMb2NhbFBvaW50LCBHbG9iYWxQb2ludCB9IGZyb20gJy4vZ2VvbSc7XHJcbmltcG9ydCBUZXh0IGZyb20gJy4vc2hhcGVzL3RleHQnO1xyXG5pbXBvcnQgeyBUb29sIH0gZnJvbSAnLi90b29scy90b29sJztcclxuaW1wb3J0IHsgSW5pdGlhdGl2ZVRyYWNrZXIgfSBmcm9tICcuL3Rvb2xzL2luaXRpYXRpdmUnO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gJy4vc2V0dGluZ3MnO1xyXG5cclxuY2xhc3MgR2FtZU1hbmFnZXIge1xyXG4gICAgSVNfRE0gPSBmYWxzZTtcclxuICAgIHJvb21OYW1lITogc3RyaW5nO1xyXG4gICAgcm9vbUNyZWF0b3IhOiBzdHJpbmc7XHJcbiAgICBsb2NhdGlvbk5hbWUhOiBzdHJpbmc7XHJcbiAgICB1c2VybmFtZSE6IHN0cmluZztcclxuICAgIGJvYXJkX2luaXRpYWxpc2VkID0gZmFsc2U7XHJcbiAgICBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICBzZWxlY3RlZFRvb2w6IG51bWJlciA9IDA7XHJcbiAgICB0b29sczogT3JkZXJlZE1hcDxzdHJpbmcsIFRvb2w+ID0gbmV3IE9yZGVyZWRNYXAoKTtcclxuICAgIGxpZ2h0c291cmNlczogeyBzaGFwZTogc3RyaW5nLCBhdXJhOiBzdHJpbmcgfVtdID0gW107XHJcbiAgICBsaWdodGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgYW5ub3RhdGlvbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBhbm5vdGF0aW9uVGV4dDogVGV4dCA9IG5ldyBUZXh0KG5ldyBHbG9iYWxQb2ludCgwLCAwKSwgXCJcIiwgXCJib2xkIDIwcHggc2VyaWZcIik7XHJcbiAgICBtb3ZlbWVudGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgZ3JpZENvbG91ciA9ICQoXCIjZ3JpZENvbG91clwiKTtcclxuICAgIGZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xyXG4gICAgaW5pdGlhdGl2ZVRyYWNrZXIgPSBuZXcgSW5pdGlhdGl2ZVRyYWNrZXIoKTtcclxuICAgIHNoYXBlU2VsZWN0aW9uRGlhbG9nID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9KTtcclxuICAgIGluaXRpYXRpdmVEaWFsb2cgPSAkKFwiI2luaXRpYXRpdmVkaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICcxNjBweCdcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2JhKDI1NSwwLDAsIDAuNSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2dyaWRDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2IoODIsIDgxLCA4MSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5maWxsID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2Zvd0NvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0dXBCb2FyZChyb29tOiBCb2FyZEluZm8pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNkaXYgPSAkKCcjbGF5ZXJzJyk7XHJcbiAgICAgICAgbGF5ZXJzZGl2LmVtcHR5KCk7XHJcbiAgICAgICAgY29uc3QgbGF5ZXJzZWxlY3RkaXYgPSAkKCcjbGF5ZXJzZWxlY3QnKTtcclxuICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwidWxcIikuZW1wdHkoKTtcclxuICAgICAgICBsZXQgc2VsZWN0YWJsZV9sYXllcnMgPSAwO1xyXG5cclxuICAgICAgICBjb25zdCBsbSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikuZmluZChcImRpdlwiKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9mZigpO1xyXG4gICAgICAgIGxtLmVtcHR5KCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmxvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSAkKFwiPGRpdj5cIiArIHJvb20ubG9jYXRpb25zW2ldICsgXCI8L2Rpdj5cIik7XHJcbiAgICAgICAgICAgIGxtLmFwcGVuZChsb2MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsbXBsdXMgPSAkKCc8ZGl2PjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9kaXY+Jyk7XHJcbiAgICAgICAgbG0uYXBwZW5kKGxtcGx1cyk7XHJcbiAgICAgICAgbG0uY2hpbGRyZW4oKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvY25hbWUgPSBwcm9tcHQoXCJOZXcgbG9jYXRpb24gbmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2NuYW1lICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwibmV3IGxvY2F0aW9uXCIsIGxvY25hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJjaGFuZ2UgbG9jYXRpb25cIiwgZS50YXJnZXQudGV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5ib2FyZC5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3X2xheWVyID0gcm9vbS5ib2FyZC5sYXllcnNbaV07XHJcbiAgICAgICAgICAgIC8vIFVJIGNoYW5nZXNcclxuICAgICAgICAgICAgbGF5ZXJzZGl2LmFwcGVuZChcIjxjYW52YXMgaWQ9J1wiICsgbmV3X2xheWVyLm5hbWUgKyBcIi1sYXllcicgc3R5bGU9J3otaW5kZXg6IFwiICsgaSArIFwiJz48L2NhbnZhcz5cIik7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuc2VsZWN0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGV4dHJhID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPT09IDApIGV4dHJhID0gXCIgY2xhc3M9J2xheWVyLXNlbGVjdGVkJ1wiO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZCgndWwnKS5hcHBlbmQoXCI8bGkgaWQ9J3NlbGVjdC1cIiArIG5ld19sYXllci5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgbmV3X2xheWVyLm5hbWUgKyBcIjwvYT48L2xpPlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGFibGVfbGF5ZXJzICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PiQoJyMnICsgbmV3X2xheWVyLm5hbWUgKyAnLWxheWVyJylbMF07XHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBTdGF0ZSBjaGFuZ2VzXHJcbiAgICAgICAgICAgIGxldCBsOiBMYXllcjtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBHcmlkTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld19sYXllci5uYW1lID09PSAnZm93JylcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgRk9XTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGwuc2VsZWN0YWJsZSA9IG5ld19sYXllci5zZWxlY3RhYmxlO1xyXG4gICAgICAgICAgICBsLnBsYXllcl9lZGl0YWJsZSA9IG5ld19sYXllci5wbGF5ZXJfZWRpdGFibGU7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5hZGRMYXllcihsKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUobmV3X2xheWVyLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiI2dyaWQtbGF5ZXJcIikuZHJvcHBhYmxlKHtcclxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6IFwiLmRyYWdnYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyb3A6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIHRvIGRyb3AgdGhlIHRva2VuIG9uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpDYW52YXMgPSAkKGwuY2FudmFzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGpDYW52YXMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIG1pc3NpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gakNhbnZhcy5vZmZzZXQoKSE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSBuZXcgTG9jYWxQb2ludCh1aS5vZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0LCB1aS5vZmZzZXQudG9wIC0gb2Zmc2V0LnRvcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3NfbWVudS5pcyhcIjp2aXNpYmxlXCIpICYmIGxvYy54IDwgc2V0dGluZ3NfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnkgPCBsb2NhdGlvbnNfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lkdGggPSB1aS5oZWxwZXJbMF0ud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCA9IHVpLmhlbHBlclswXS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdsb2MgPSBsMmcobG9jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1nID0gPEhUTUxJbWFnZUVsZW1lbnQ+dWkuZHJhZ2dhYmxlWzBdLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldChpbWcsIHdsb2MsIGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnNyYyA9IG5ldyBVUkwoaW1nLnNyYykucGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoU2V0dGluZ3MudXNlR3JpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBTZXR0aW5ncy5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnJlZlBvaW50LnggPSBNYXRoLnJvdW5kKGFzc2V0LnJlZlBvaW50LnggLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnJlZlBvaW50LnkgPSBNYXRoLnJvdW5kKGFzc2V0LnJlZlBvaW50LnkgLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LncgPSBNYXRoLm1heChNYXRoLnJvdW5kKGFzc2V0LncgLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQuaCA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQuaCAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGwuYWRkU2hhcGUoYXNzZXQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbC5zZXRTaGFwZXMobmV3X2xheWVyLnNoYXBlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9yY2UgdGhlIGNvcnJlY3Qgb3BhY2l0eSByZW5kZXIgb24gb3RoZXIgbGF5ZXJzLlxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRMYXllcihnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSEubmFtZSk7XHJcbiAgICAgICAgLy8gc29ja2V0LmVtaXQoXCJjbGllbnQgaW5pdGlhbGlzZWRcIik7XHJcbiAgICAgICAgdGhpcy5ib2FyZF9pbml0aWFsaXNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3RhYmxlX2xheWVycyA+IDEpIHtcclxuICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZChcImxpXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuaWQuc3BsaXQoXCItXCIpWzFdO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkID0gbGF5ZXJzZWxlY3RkaXYuZmluZChcIiNzZWxlY3QtXCIgKyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2VsZWN0ZWRMYXllcik7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSAhPT0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwibGF5ZXItc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgb2xkLnJlbW92ZUNsYXNzKFwibGF5ZXItc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTZXJ2ZXJTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpO1xyXG4gICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gdHlwZSAke3NoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsYXllci5hZGRTaGFwZShzaCwgZmFsc2UpO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vdmVTaGFwZShzaGFwZTogU2VydmVyU2hhcGUpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUsIHRydWUpO1xyXG4gICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gdHlwZSAke3NoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZWFsX3NoYXBlID0gT2JqZWN0LmFzc2lnbih0aGlzLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSwgc2gpO1xyXG4gICAgICAgIHJlYWxfc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihyZWFsX3NoYXBlLmxheWVyKSEub25TaGFwZU1vdmUocmVhbF9zaGFwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlU2hhcGUoZGF0YToge3NoYXBlOiBTZXJ2ZXJTaGFwZTsgcmVkcmF3OiBib29sZWFuO30pOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihkYXRhLnNoYXBlLmxheWVyKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3QoZGF0YS5zaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7ZGF0YS5zaGFwZS50eXBlfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGRhdGEuc2hhcGUudXVpZCksIHNoKTtcclxuICAgICAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgaWYgKGRhdGEucmVkcmF3KVxyXG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihkYXRhLnNoYXBlLmxheWVyKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SW5pdGlhdGl2ZShkYXRhOiBJbml0aWF0aXZlRGF0YVtdKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5kYXRhID0gZGF0YTtcclxuICAgICAgICB0aGlzLmluaXRpYXRpdmVUcmFja2VyLnJlZHJhdygpO1xyXG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENsaWVudE9wdGlvbnMob3B0aW9uczogQ2xpZW50T3B0aW9ucyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdyaWRDb2xvdXIpXHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmdyaWRDb2xvdXIpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmZvd0NvbG91cikge1xyXG4gICAgICAgICAgICB0aGlzLmZvd0NvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmZvd0NvbG91cik7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25PcHRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9uT3B0aW9uc1tgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IG9wdGlvbnMubG9jYXRpb25PcHRpb25zW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2MucGFuWClcclxuICAgICAgICAgICAgICAgICAgICBTZXR0aW5ncy5wYW5YID0gbG9jLnBhblg7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9jLnBhblkpXHJcbiAgICAgICAgICAgICAgICAgICAgU2V0dGluZ3MucGFuWSA9IGxvYy5wYW5ZO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYy56b29tRmFjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgU2V0dGluZ3Muem9vbUZhY3RvciA9IGxvYy56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjem9vbWVyXCIpLnNsaWRlcih7IHZhbHVlOiAxIC8gbG9jLnpvb21GYWN0b3IgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXllck1hbmFnZXIuZ2V0R3JpZExheWVyKCkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5sZXQgZ2FtZU1hbmFnZXIgPSBuZXcgR2FtZU1hbmFnZXIoKTtcclxuKDxhbnk+d2luZG93KS5nYW1lTWFuYWdlciA9IGdhbWVNYW5hZ2VyO1xyXG4oPGFueT53aW5kb3cpLkdQID0gR2xvYmFsUG9pbnQ7XHJcbig8YW55PndpbmRvdykuQXNzZXQgPSBBc3NldDtcclxuXHJcbi8vICoqKiogU0VUVVAgVUkgKioqKlxyXG5cclxuLy8gcHJldmVudCBkb3VibGUgY2xpY2tpbmcgdGV4dCBzZWxlY3Rpb25cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmIChlLmJ1dHRvbiA9PSAxKSB7XHJcbiAgICAgICAgY29uc3QgcGFuVG9vbCA9IGdhbWVNYW5hZ2VyLnRvb2xzLmdldChcInBhblwiKTtcclxuICAgICAgICBpZiAocGFuVG9vbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHBhblRvb2wub25Nb3VzZURvd24oZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgICRtZW51LmhpZGUoKTtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZURvd24oZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlck1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbnMgJiA0KSAhPT0gMCkge1xyXG4gICAgICAgIGNvbnN0IHBhblRvb2wgPSBnYW1lTWFuYWdlci50b29scy5nZXQoXCJwYW5cIik7XHJcbiAgICAgICAgaWYgKHBhblRvb2wgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBwYW5Ub29sLm9uTW91c2VNb3ZlKGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmICgoKGUuYnV0dG9ucyAmIDEpICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlTW92ZShlKTtcclxuICAgIC8vIEFubm90YXRpb24gaG92ZXJcclxuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgZm9yIChsZXQgaT0wOyBpIDwgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnNbaV07XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJkcmF3XCIpKXtcclxuICAgICAgICAgICAgY29uc3QgZHJhd19sYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQubGF5ZXIgIT09IFwiZHJhd1wiKVxyXG4gICAgICAgICAgICAgICAgZHJhd19sYXllci5hZGRTaGFwZShnYW1lTWFuYWdlci5hbm5vdGF0aW9uVGV4dCwgZmFsc2UpO1xyXG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgIGlmIChzaGFwZS5jb250YWlucyhsMmcoZ2V0TW91c2UoZSkpKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQudGV4dCA9IHNoYXBlLmFubm90YXRpb247XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9uVGV4dC5yZWZQb2ludCA9IGwyZyhuZXcgTG9jYWxQb2ludCgoZHJhd19sYXllci5jYW52YXMud2lkdGggLyAyKSAtIHNoYXBlLmFubm90YXRpb24ubGVuZ3RoLzIsIDUwKSk7XHJcbiAgICAgICAgICAgICAgICBkcmF3X2xheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoIWZvdW5kICYmIGdhbWVNYW5hZ2VyLmFubm90YXRpb25UZXh0LnRleHQgIT09ICcnKXtcclxuICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9uVGV4dC50ZXh0ID0gJyc7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKGUuYnV0dG9uID09IDEpIHtcclxuICAgICAgICBjb25zdCBwYW5Ub29sID0gZ2FtZU1hbmFnZXIudG9vbHMuZ2V0KFwicGFuXCIpO1xyXG4gICAgICAgIGlmIChwYW5Ub29sICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcGFuVG9vbC5vbk1vdXNlVXAoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZVVwKGUpO1xyXG59XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBvblBvaW50ZXJEb3duKTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVyTW92ZSk7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblBvaW50ZXJVcCk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKGUuYnV0dG9uICE9PSAyIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbkNvbnRleHRNZW51KGUpO1xyXG59KTtcclxuXHJcbiQoXCIjem9vbWVyXCIpLnNsaWRlcih7XHJcbiAgICBvcmllbnRhdGlvbjogXCJ2ZXJ0aWNhbFwiLFxyXG4gICAgbWluOiAwLjUsXHJcbiAgICBtYXg6IDUuMCxcclxuICAgIHN0ZXA6IDAuMSxcclxuICAgIHZhbHVlOiBTZXR0aW5ncy56b29tRmFjdG9yLFxyXG4gICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICBjb25zdCBvcmlnWiA9IFNldHRpbmdzLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgbmV3WiA9IDEgLyB1aS52YWx1ZSE7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG9yaWdaO1xyXG4gICAgICAgIGNvbnN0IG5ld1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG5ld1o7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gbmV3WjtcclxuICAgICAgICBTZXR0aW5ncy56b29tRmFjdG9yID0gbmV3WjtcclxuICAgICAgICBTZXR0aW5ncy5wYW5YIC09IChvcmlnWCAtIG5ld1gpIC8gMjtcclxuICAgICAgICBTZXR0aW5ncy5wYW5ZIC09IChvcmlnWSAtIG5ld1kpIC8gMjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICBsb2NhdGlvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIFtgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF06IHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5YOiBTZXR0aW5ncy5wYW5YLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhblk6IFNldHRpbmdzLnBhblksXHJcbiAgICAgICAgICAgICAgICAgICAgem9vbUZhY3RvcjogbmV3WixcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XHJcbiRtZW51LmhpZGUoKTtcclxuXHJcbmNvbnN0IHNldHRpbmdzX21lbnUgPSAkKFwiI21lbnVcIikhO1xyXG5jb25zdCBsb2NhdGlvbnNfbWVudSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikhO1xyXG5jb25zdCBsYXllcl9tZW51ID0gJChcIiNsYXllcnNlbGVjdFwiKSE7XHJcbiQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG5cclxuJCgnI3JtLXNldHRpbmdzJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKHNldHRpbmdzX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIsIHdpZHRoOiBcIis9MjAwcHhcIiB9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0dGluZ3NfbWVudS5hbmltYXRlKHsgd2lkdGg6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiwgd2lkdGg6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxheWVyX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoJyNybS1sb2NhdGlvbnMnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG9yZGVyIG9mIGFuaW1hdGlvbiBpcyBpbXBvcnRhbnQsIGl0IG90aGVyd2lzZSB3aWxsIHNvbWV0aW1lcyBzaG93IGEgc21hbGwgZ2FwIGJldHdlZW4gdGhlIHR3byBvYmplY3RzXHJcbiAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCItPTEwMHB4XCIgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGhlaWdodDogJ3RvZ2dsZScgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBoZWlnaHQ6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCIrPTEwMHB4XCIgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxud2luZG93Lm9ucmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFdpZHRoKHdpbmRvdy5pbm5lcldpZHRoKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRIZWlnaHQod2luZG93LmlubmVySGVpZ2h0KTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbn07XHJcblxyXG4kKCdib2R5Jykua2V5dXAoZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmIChlLmtleUNvZGUgPT09IDQ2ICYmIGUudGFyZ2V0LnRhZ05hbWUgIT09IFwiSU5QVVRcIikge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciBzZWxlY3RlZCBmb3IgZGVsZXRlIG9wZXJhdGlvblwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGwuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICBsLnJlbW92ZVNoYXBlKHNlbCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5yZW1vdmVJbml0aWF0aXZlKHNlbC51dWlkLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJChcIiNncmlkU2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCBncyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKGdzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGdyaWRzaXplXCIsIGdzKTtcclxufSk7XHJcblxyXG4kKFwiI3VuaXRTaXplSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVzID0gcGFyc2VJbnQoKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZSk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VW5pdFNpemUodXMpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VuaXRTaXplJzogdXMgfSk7XHJcbn0pO1xyXG4kKFwiI3VzZUdyaWRJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWcgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VXNlR3JpZCh1Zyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAndXNlR3JpZCc6IHVnIH0pO1xyXG59KTtcclxuJChcIiN1c2VGT1dJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWYgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0RnVsbEZPVyh1Zik7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAnZnVsbEZPVyc6IHVmIH0pO1xyXG59KTtcclxuJChcIiNmb3dPcGFjaXR5XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBsZXQgZm8gPSBwYXJzZUZsb2F0KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgaWYgKGlzTmFOKGZvKSkge1xyXG4gICAgICAgICQoXCIjZm93T3BhY2l0eVwiKS52YWwoU2V0dGluZ3MuZm93T3BhY2l0eSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKGZvIDwgMCkgZm8gPSAwO1xyXG4gICAgaWYgKGZvID4gMSkgZm8gPSAxO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZPV09wYWNpdHkoZm8pO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ2Zvd09wYWNpdHknOiBmbyB9KTtcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnYW1lTWFuYWdlcjsiLCJleHBvcnQgY2xhc3MgU2V0dGluZ3Mge1xyXG4gICAgc3RhdGljIGdyaWRTaXplID0gNTA7XHJcbiAgICBzdGF0aWMgdW5pdFNpemUgPSA1O1xyXG4gICAgc3RhdGljIHVzZUdyaWQgPSB0cnVlO1xyXG4gICAgc3RhdGljIGZ1bGxGT1cgPSBmYWxzZTtcclxuICAgIHN0YXRpYyBmb3dPcGFjaXR5ID0gMC4zO1xyXG4gICAgXHJcbiAgICBzdGF0aWMgem9vbUZhY3RvciA9IDE7XHJcbiAgICBzdGF0aWMgcGFuWCA9IDA7XHJcbiAgICBzdGF0aWMgcGFuWSA9IDA7XHJcbn0iLCJpbXBvcnQgQmFzZVJlY3QgZnJvbSBcIi4vYmFzZXJlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHksIGcybHogfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJBc3NldCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFzc2V0IGV4dGVuZHMgQmFzZVJlY3Qge1xyXG4gICAgdHlwZSA9IFwiYXNzZXRcIjtcclxuICAgIGltZzogSFRNTEltYWdlRWxlbWVudDtcclxuICAgIHNyYzogc3RyaW5nID0gJyc7XHJcbiAgICBjb25zdHJ1Y3RvcihpbWc6IEhUTUxJbWFnZUVsZW1lbnQsIHRvcGxlZnQ6IEdsb2JhbFBvaW50LCB3OiBudW1iZXIsIGg6IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHRvcGxlZnQsIHcsIGgpO1xyXG4gICAgICAgIGlmICh1dWlkICE9PSB1bmRlZmluZWQpIHRoaXMudXVpZCA9IHV1aWQ7XHJcbiAgICAgICAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHNyYzogdGhpcy5zcmNcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyQXNzZXQpIHtcclxuICAgICAgICBzdXBlci5mcm9tRGljdChkYXRhKTtcclxuICAgICAgICB0aGlzLnNyYyA9IGRhdGEuc3JjO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCBnMmx4KHRoaXMucmVmUG9pbnQueCksIGcybHkodGhpcy5yZWZQb2ludC55KSwgZzJseih0aGlzLncpLCBnMmx6KHRoaXMuaCkpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5pdGlhdGl2ZVJlcHIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdXVpZDogdGhpcy51dWlkLFxyXG4gICAgICAgICAgICB2aXNpYmxlOiAhZ2FtZU1hbmFnZXIuSVNfRE0sXHJcbiAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgc3JjOiB0aGlzLnNyYyxcclxuICAgICAgICAgICAgb3duZXJzOiB0aGlzLm93bmVyc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCwgVmVjdG9yLCBMb2NhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgZzJseCwgZzJseSwgbDJnLCBsMmd5LCBsMmd4IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBCYXNlUmVjdCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHc6IG51bWJlcjtcclxuICAgIGg6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHRvcGxlZnQ6IEdsb2JhbFBvaW50LCB3OiBudW1iZXIsIGg6IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHRvcGxlZnQsIHV1aWQpO1xyXG4gICAgICAgIHRoaXMudyA9IHc7XHJcbiAgICAgICAgdGhpcy5oID0gaDtcclxuICAgIH1cclxuICAgIGdldEJhc2VEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHN1cGVyLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgdzogdGhpcy53LFxyXG4gICAgICAgICAgICBoOiB0aGlzLmhcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy5yZWZQb2ludCwgdGhpcy53LCB0aGlzLmgpO1xyXG4gICAgfVxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCA8PSBwb2ludC54ICYmICh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncpID49IHBvaW50LnggJiZcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55IDw9IHBvaW50LnkgJiYgKHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCkgPj0gcG9pbnQueTtcclxuICAgIH1cclxuICAgIGluQ29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCwgY29ybmVyOiBzdHJpbmcpIHtcclxuICAgICAgICBzd2l0Y2ggKGNvcm5lcikge1xyXG4gICAgICAgICAgICBjYXNlICduZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54ICsgdGhpcy53IC0gMyA8PSBwb2ludC54ICYmIHBvaW50LnggPD0gdGhpcy5yZWZQb2ludC54ICsgdGhpcy53ICsgMyAmJiB0aGlzLnJlZlBvaW50LnkgLSAzIDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB0aGlzLnJlZlBvaW50LnkgKyAzO1xyXG4gICAgICAgICAgICBjYXNlICdudyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54IC0gMyA8PSBwb2ludC54ICYmIHBvaW50LnggPD0gdGhpcy5yZWZQb2ludC54ICsgMyAmJiB0aGlzLnJlZlBvaW50LnkgLSAzIDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB0aGlzLnJlZlBvaW50LnkgKyAzO1xyXG4gICAgICAgICAgICBjYXNlICdzdyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54IC0gMyA8PSBwb2ludC54ICYmIHBvaW50LnggPD0gdGhpcy5yZWZQb2ludC54ICsgMyAmJiB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmggLSAzIDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmggKyAzO1xyXG4gICAgICAgICAgICBjYXNlICdzZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54ICsgdGhpcy53IC0gMyA8PSBwb2ludC54ICYmIHBvaW50LnggPD0gdGhpcy5yZWZQb2ludC54ICsgdGhpcy53ICsgMyAmJiB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmggLSAzIDw9IHBvaW50LnkgJiYgcG9pbnQueSA8PSB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmggKyAzO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmd8dW5kZWZpbmVkIHtcclxuICAgICAgICBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic2VcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInNlXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQge1xyXG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC5hZGQobmV3IFZlY3RvcjxHbG9iYWxQb2ludD4oe3g6IHRoaXMudy8yLCB5OiB0aGlzLmgvMn0pKTtcclxuICAgICAgICB0aGlzLnJlZlBvaW50LnggPSBjZW50ZXJQb2ludC54IC0gdGhpcy53IC8gMjtcclxuICAgICAgICB0aGlzLnJlZlBvaW50LnkgPSBjZW50ZXJQb2ludC55IC0gdGhpcy5oIC8gMjtcclxuICAgIH1cclxuXHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAhKGcybHgodGhpcy5yZWZQb2ludC54KSA+IGNhbnZhcy53aWR0aCB8fCBnMmx5KHRoaXMucmVmUG9pbnQueSkgPiBjYW52YXMuaGVpZ2h0IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgZzJseCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncpIDwgMCB8fCBnMmx5KHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCkgPCAwKTtcclxuICAgIH1cclxuICAgIHNuYXBUb0dyaWQoKSB7XHJcbiAgICAgICAgY29uc3QgZ3MgPSBTZXR0aW5ncy5ncmlkU2l6ZTtcclxuICAgICAgICBjb25zdCBjZW50ZXIgPSB0aGlzLmNlbnRlcigpO1xyXG4gICAgICAgIGNvbnN0IG14ID0gY2VudGVyLng7XHJcbiAgICAgICAgY29uc3QgbXkgPSBjZW50ZXIueTtcclxuICAgICAgICBpZiAoKHRoaXMudyAvIGdzKSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gTWF0aC5yb3VuZChteCAvIGdzKSAqIGdzIC0gdGhpcy53IC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnggPSAoTWF0aC5yb3VuZCgobXggKyAoZ3MgLyAyKSkgLyBncykgLSAoMSAvIDIpKSAqIGdzIC0gdGhpcy53IC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCh0aGlzLmggLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA9IE1hdGgucm91bmQobXkgLyBncykgKiBncyAtIHRoaXMuaCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gKE1hdGgucm91bmQoKG15ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHRoaXMuaCAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVzaXplVG9HcmlkKCkge1xyXG4gICAgICAgIGNvbnN0IGdzID0gU2V0dGluZ3MuZ3JpZFNpemU7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gTWF0aC5yb3VuZCh0aGlzLnJlZlBvaW50LnggLyBncykgKiBncztcclxuICAgICAgICB0aGlzLnJlZlBvaW50LnkgPSBNYXRoLnJvdW5kKHRoaXMucmVmUG9pbnQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgIHRoaXMudyA9IE1hdGgubWF4KE1hdGgucm91bmQodGhpcy53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICB0aGlzLmggPSBNYXRoLm1heChNYXRoLnJvdW5kKHRoaXMuaCAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICB9XHJcbiAgICByZXNpemUocmVzaXplZGlyOiBzdHJpbmcsIHBvaW50OiBMb2NhbFBvaW50KSB7XHJcbiAgICAgICAgY29uc3QgeiA9IFNldHRpbmdzLnpvb21GYWN0b3I7XHJcbiAgICAgICAgaWYgKHJlc2l6ZWRpciA9PT0gJ253Jykge1xyXG4gICAgICAgICAgICB0aGlzLncgPSBnMmx4KHRoaXMucmVmUG9pbnQueCkgKyB0aGlzLncgKiB6IC0gcG9pbnQueDtcclxuICAgICAgICAgICAgdGhpcy5oID0gZzJseSh0aGlzLnJlZlBvaW50LnkpICsgdGhpcy5oICogeiAtIHBvaW50Lnk7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQgPSBsMmcocG9pbnQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzaXplZGlyID09PSAnbmUnKSB7XHJcbiAgICAgICAgICAgIHRoaXMudyA9IHBvaW50LnggLSBnMmx4KHRoaXMucmVmUG9pbnQueCk7XHJcbiAgICAgICAgICAgIHRoaXMuaCA9IGcybHkodGhpcy5yZWZQb2ludC55KSArIHRoaXMuaCAqIHogLSBwb2ludC55O1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgPSBsMmd5KHBvaW50LnkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzaXplZGlyID09PSAnc2UnKSB7XHJcbiAgICAgICAgICAgIHRoaXMudyA9IHBvaW50LnggLSBnMmx4KHRoaXMucmVmUG9pbnQueCk7XHJcbiAgICAgICAgICAgIHRoaXMuaCA9IHBvaW50LnkgLSBnMmx5KHRoaXMucmVmUG9pbnQueSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChyZXNpemVkaXIgPT09ICdzdycpIHtcclxuICAgICAgICAgICAgdGhpcy53ID0gZzJseCh0aGlzLnJlZlBvaW50LngpICsgdGhpcy53ICogeiAtIHBvaW50Lng7XHJcbiAgICAgICAgICAgIHRoaXMuaCA9IHBvaW50LnkgLSBnMmx5KHRoaXMucmVmUG9pbnQueSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueCA9IGwyZ3gocG9pbnQueCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudyAvPSB6O1xyXG4gICAgICAgIHRoaXMuaCAvPSB6O1xyXG5cclxuICAgICAgICBpZiAodGhpcy53IDwgMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnggKz0gdGhpcy53O1xyXG4gICAgICAgICAgICB0aGlzLncgPSBNYXRoLmFicyh0aGlzLncpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5oIDwgMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgKz0gdGhpcy5oO1xyXG4gICAgICAgICAgICB0aGlzLmggPSBNYXRoLmFicyh0aGlzLmgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IGdldExpbmVzSW50ZXJzZWN0UG9pbnQsIGdldFBvaW50RGlzdGFuY2UsIEdsb2JhbFBvaW50LCBWZWN0b3IgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQm91bmRpbmdSZWN0IHtcclxuICAgIHR5cGUgPSBcImJvdW5kcmVjdFwiO1xyXG4gICAgcmVmUG9pbnQ6IEdsb2JhbFBvaW50O1xyXG4gICAgdzogbnVtYmVyO1xyXG4gICAgaDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHRvcGxlZnQ6IEdsb2JhbFBvaW50LCB3OiBudW1iZXIsIGg6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQgPSB0b3BsZWZ0O1xyXG4gICAgICAgIHRoaXMudyA9IHc7XHJcbiAgICAgICAgdGhpcy5oID0gaDtcclxuICAgIH1cclxuXHJcbiAgICBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludC54IDw9IHBvaW50LnggJiYgKHRoaXMucmVmUG9pbnQueCArIHRoaXMudykgPj0gcG9pbnQueCAmJlxyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgPD0gcG9pbnQueSAmJiAodGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSA+PSBwb2ludC55O1xyXG4gICAgfVxyXG5cclxuICAgIG9mZnNldCh2ZWN0b3I6IFZlY3RvcjxHbG9iYWxQb2ludD4pOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQuYWRkKHZlY3RvciksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnNlY3RzV2l0aChvdGhlcjogQm91bmRpbmdSZWN0KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuICEob3RoZXIucmVmUG9pbnQueCA+IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC54ICsgb3RoZXIudyA8IHRoaXMucmVmUG9pbnQueCB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC55ID4gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIHx8XHJcbiAgICAgICAgICAgIG90aGVyLnJlZlBvaW50LnkgKyBvdGhlci5oIDwgdGhpcy5yZWZQb2ludC55KTtcclxuICAgIH1cclxuICAgIGdldEludGVyc2VjdEFyZWFXaXRoUmVjdChvdGhlcjogQm91bmRpbmdSZWN0KTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICBjb25zdCB0b3BsZWZ0ID0gbmV3IEdsb2JhbFBvaW50KE1hdGgubWF4KHRoaXMucmVmUG9pbnQueCwgb3RoZXIucmVmUG9pbnQueCksIE1hdGgubWF4KHRoaXMucmVmUG9pbnQueSwgb3RoZXIucmVmUG9pbnQueSkpO1xyXG4gICAgICAgIGNvbnN0IHcgPSBNYXRoLm1pbih0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIG90aGVyLnJlZlBvaW50LnggKyBvdGhlci53KSAtIHRvcGxlZnQueDtcclxuICAgICAgICBjb25zdCBoID0gTWF0aC5taW4odGhpcy5yZWZQb2ludC55ICsgdGhpcy5oLCBvdGhlci5yZWZQb2ludC55ICsgb3RoZXIuaCkgLSB0b3BsZWZ0Lnk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodG9wbGVmdCwgdywgaCk7XHJcbiAgICB9XHJcbiAgICBnZXRJbnRlcnNlY3RXaXRoTGluZShsaW5lOiB7IHN0YXJ0OiBHbG9iYWxQb2ludDsgZW5kOiBHbG9iYWxQb2ludCB9KSB7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSBbXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55KSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCArIHRoaXMudywgdGhpcy5yZWZQb2ludC55KSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54LCB0aGlzLnJlZlBvaW50LnkpLCBuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54LCB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpLCBsaW5lLnN0YXJ0LCBsaW5lLmVuZCksXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCArIHRoaXMudywgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbGluZS5zdGFydCwgbGluZS5lbmQpXHJcbiAgICAgICAgXTtcclxuICAgICAgICBsZXQgbWluX2QgPSBJbmZpbml0eTtcclxuICAgICAgICBsZXQgbWluX2kgPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbCA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICBpZiAobC5pbnRlcnNlY3QgPT09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBjb25zdCBkID0gZ2V0UG9pbnREaXN0YW5jZShsaW5lLnN0YXJ0LCBsLmludGVyc2VjdCk7XHJcbiAgICAgICAgICAgIGlmIChtaW5fZCA+IGQpIHtcclxuICAgICAgICAgICAgICAgIG1pbl9kID0gZDtcclxuICAgICAgICAgICAgICAgIG1pbl9pID0gbC5pbnRlcnNlY3Q7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgaW50ZXJzZWN0OiBtaW5faSwgZGlzdGFuY2U6IG1pbl9kIH1cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQuYWRkKG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHt4OiB0aGlzLncvMiwgeTogdGhpcy5oLzJ9KSk7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgc3dpdGNoIChjb3JuZXIpIHtcclxuICAgICAgICAgICAgY2FzZSAnbmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnbncnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc3cnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc2UnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJud1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibndcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IHsgZzJsLCBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQsIExvY2FsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJDaXJjbGUgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaXJjbGUgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB0eXBlID0gXCJjaXJjbGVcIjtcclxuICAgIHI6IG51bWJlcjtcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IoY2VudGVyOiBHbG9iYWxQb2ludCwgcjogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcihjZW50ZXIsIHV1aWQpO1xyXG4gICAgICAgIHRoaXMuciA9IHIgfHwgMTtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH07XHJcbiAgICBhc0RpY3QoKTogU2VydmVyQ2lyY2xlIHtcclxuICAgICAgICAvLyBjb25zdCBiYXNlID0gPFNlcnZlckNpcmNsZT50aGlzLmdldEJhc2VEaWN0KCk7XHJcbiAgICAgICAgLy8gYmFzZS5yID0gdGhpcy5yO1xyXG4gICAgICAgIC8vIGJhc2UuYm9yZGVyID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgLy8gcmV0dXJuIGJhc2U7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHI6IHRoaXMucixcclxuICAgICAgICAgICAgYm9yZGVyOiB0aGlzLmJvcmRlclxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyQ2lyY2xlKSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgdGhpcy5yID0gZGF0YS5yO1xyXG4gICAgICAgIGlmKGRhdGEuYm9yZGVyKVxyXG4gICAgICAgICAgICB0aGlzLmJvcmRlciA9IGRhdGEuYm9yZGVyO1xyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54IC0gdGhpcy5yLCB0aGlzLnJlZlBvaW50LnkgLSB0aGlzLnIpLCB0aGlzLnIgKiAyLCB0aGlzLnIgKiAyKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XHJcbiAgICAgICAgY29uc3QgbG9jID0gZzJsKHRoaXMucmVmUG9pbnQpO1xyXG4gICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgIGlmICh0aGlzLmJvcmRlciAhPT0gXCJyZ2JhKDAsIDAsIDAsIDApXCIpIHtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIChwb2ludC54IC0gdGhpcy5yZWZQb2ludC54KSAqKiAyICsgKHBvaW50LnkgLSB0aGlzLnJlZlBvaW50LnkpICoqIDIgPCB0aGlzLnIgKiogMjtcclxuICAgIH1cclxuICAgIGluQ29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCwgY29ybmVyOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vVE9ET1xyXG4gICAgfVxyXG4gICAgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCkge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm5lXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJuZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInN3XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzd1wiO1xyXG4gICAgfVxyXG4gICAgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBHbG9iYWxQb2ludCk6IEdsb2JhbFBvaW50IHwgdm9pZCB7XHJcbiAgICAgICAgaWYgKGNlbnRlclBvaW50ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50O1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQgPSBjZW50ZXJQb2ludDtcclxuICAgIH1cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxuICAgIHNuYXBUb0dyaWQoKSB7XHJcbiAgICAgICAgY29uc3QgZ3MgPSBTZXR0aW5ncy5ncmlkU2l6ZTtcclxuICAgICAgICBpZiAoKDIgKiB0aGlzLnIgLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueCA9IE1hdGgucm91bmQodGhpcy5yZWZQb2ludC54IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gTWF0aC5yb3VuZCgodGhpcy5yZWZQb2ludC54IC0gKGdzLzIpKSAvIGdzKSAqIGdzICsgdGhpcy5yO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoKDIgKiB0aGlzLnIgLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA9IE1hdGgucm91bmQodGhpcy5yZWZQb2ludC55IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gTWF0aC5yb3VuZCgodGhpcy5yZWZQb2ludC55IC0gKGdzLzIpKSAvIGdzKSAqIGdzICsgdGhpcy5yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJlc2l6ZVRvR3JpZCgpIHtcclxuICAgICAgICBjb25zdCBncyA9IFNldHRpbmdzLmdyaWRTaXplO1xyXG4gICAgICAgIHRoaXMuciA9IE1hdGgubWF4KE1hdGgucm91bmQodGhpcy5yIC8gZ3MpICogZ3MsIGdzLzIpO1xyXG4gICAgfVxyXG4gICAgcmVzaXplKHJlc2l6ZWRpcjogc3RyaW5nLCBwb2ludDogTG9jYWxQb2ludCkge1xyXG4gICAgICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IGRpZmYgPSBsMmcocG9pbnQpLnN1YnRyYWN0KHRoaXMucmVmUG9pbnQpO1xyXG4gICAgICAgIHRoaXMuciA9IE1hdGguc3FydChNYXRoLnBvdyhkaWZmLmxlbmd0aCgpLCAyKSAvIDIpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5pbXBvcnQgeyB1dWlkdjQgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcG9wdWxhdGVFZGl0QXNzZXREaWFsb2coc2VsZjogU2hhcGUpIHtcclxuICAgICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoc2VsZi51dWlkKTtcclxuICAgIGNvbnN0IGRpYWxvZ19uYW1lID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1uYW1lXCIpO1xyXG4gICAgZGlhbG9nX25hbWUudmFsKHNlbGYubmFtZSk7XHJcbiAgICBkaWFsb2dfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgIHMubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGlhbG9nX2xpZ2h0YmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWxpZ2h0YmxvY2tlclwiKTtcclxuICAgIGRpYWxvZ19saWdodGJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYudmlzaW9uT2JzdHJ1Y3Rpb24pO1xyXG4gICAgZGlhbG9nX2xpZ2h0YmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgIHMudmlzaW9uT2JzdHJ1Y3Rpb24gPSBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgcy5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgY29uc3QgZGlhbG9nX21vdmVibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbW92ZWJsb2NrZXJcIik7XHJcbiAgICBkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICBkaWFsb2dfbW92ZWJsb2NrLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBzLnNldE1vdmVtZW50QmxvY2soZGlhbG9nX21vdmVibG9jay5wcm9wKFwiY2hlY2tlZFwiKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGFubm90YXRpb25fdGV4dCA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctYW5ub3RhdGlvbi10ZXh0YXJlYVwiKTtcclxuICAgIGFubm90YXRpb25fdGV4dC52YWwoc2VsZi5hbm5vdGF0aW9uKTtcclxuICAgIGFubm90YXRpb25fdGV4dC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgY29uc3QgaGFkX2Fubm90YXRpb24gPSBzLmFubm90YXRpb24gIT09ICcnO1xyXG4gICAgICAgICAgICBzLmFubm90YXRpb24gPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgIGlmIChzLmFubm90YXRpb24gIT09ICcnICYmICFoYWRfYW5ub3RhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMucHVzaChzLnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImRyYXdcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSEuaW52YWxpZGF0ZSh0cnVlKVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHMuYW5ub3RhdGlvbiA9PSAnJyAmJiBoYWRfYW5ub3RhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvbnMuc3BsaWNlKGdhbWVNYW5hZ2VyLmFubm90YXRpb25zLmZpbmRJbmRleChhbiA9PiBhbiA9PT0gcy51dWlkKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZHJhd1wiKSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpIS5pbnZhbGlkYXRlKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgb3duZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1vd25lcnNcIik7XHJcbiAgICBjb25zdCB0cmFja2VycyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdHJhY2tlcnNcIik7XHJcbiAgICBjb25zdCBhdXJhcyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctYXVyYXNcIik7XHJcbiAgICBjb25zdCBhbm5vdGF0aW9uID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1hbm5vdGF0aW9uXCIpO1xyXG4gICAgb3duZXJzLm5leHRVbnRpbCh0cmFja2VycykucmVtb3ZlKCk7XHJcbiAgICB0cmFja2Vycy5uZXh0VW50aWwoYXVyYXMpLnJlbW92ZSgpO1xyXG4gICAgYXVyYXMubmV4dFVudGlsKGFubm90YXRpb24pLnJlbW92ZSgpOyAgLy8oJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5maW5kKFwiZm9ybVwiKSkucmVtb3ZlKCk7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkT3duZXIob3duZXI6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IG93X25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLW5hbWU9XCIke293bmVyfVwiIHZhbHVlPVwiJHtvd25lcn1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgY29uc3Qgb3dfcmVtb3ZlID0gJChgPGRpdiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiByZW1vdmVcIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgIHRyYWNrZXJzLmJlZm9yZShvd19uYW1lLmFkZChvd19yZW1vdmUpKTtcclxuXHJcbiAgICAgICAgb3dfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG93X2kgPSBzZWxmLm93bmVycy5maW5kSW5kZXgobyA9PiBvID09PSAkKHRoaXMpLmRhdGEoJ25hbWUnKSk7XHJcbiAgICAgICAgICAgIGlmIChvd19pID49IDApXHJcbiAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5zcGxpY2Uob3dfaSwgMSwgPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgc2VsZi5vd25lcnMucHVzaCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi5vd25lcnMubGVuZ3RoIHx8IHNlbGYub3duZXJzW3NlbGYub3duZXJzLmxlbmd0aCAtIDFdICE9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgYWRkT3duZXIoXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBvd19yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG93X2kgPSBzZWxmLm93bmVycy5maW5kSW5kZXgobyA9PiBvID09PSAkKHRoaXMpLmRhdGEoJ25hbWUnKSk7XHJcbiAgICAgICAgICAgICQodGhpcykucHJldigpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLm93bmVycy5zcGxpY2Uob3dfaSwgMSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxmLm93bmVycy5mb3JFYWNoKGFkZE93bmVyKTtcclxuICAgIGlmICghc2VsZi5vd25lcnMubGVuZ3RoIHx8IHNlbGYub3duZXJzW3NlbGYub3duZXJzLmxlbmd0aCAtIDFdICE9PSAnJylcclxuICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRUcmFja2VyKHRyYWNrZXI6IFRyYWNrZXIpIHtcclxuICAgICAgICBjb25zdCB0cl9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgY29uc3QgdHJfdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJDdXJyZW50IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIudmFsdWV9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgdHJfbWF4dmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJNYXggdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci5tYXh2YWx1ZSB8fCBcIlwifVwiPmApO1xyXG4gICAgICAgIGNvbnN0IHRyX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICBjb25zdCB0cl9yZW1vdmUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgYXVyYXMuYmVmb3JlKFxyXG4gICAgICAgICAgICB0cl9uYW1lXHJcbiAgICAgICAgICAgICAgICAuYWRkKHRyX3ZhbClcclxuICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPi88L3NwYW4+YClcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfbWF4dmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAuYWRkKHRyX3Zpc2libGUpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgIC5hZGQodHJfcmVtb3ZlKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghdHJhY2tlci52aXNpYmxlKVxyXG4gICAgICAgICAgICB0cl92aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuXHJcbiAgICAgICAgdHJfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5hbWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ci5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi50cmFja2Vycy5sZW5ndGggfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgYWRkVHJhY2tlcihzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdHJfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmFsdWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ci52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX21heHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1henZhbHVlIGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHIubWF4dmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0ci5tYXh2YWx1ZSA/IGAke3RyLnZhbHVlfS8ke3RyLm1heHZhbHVlfWAgOiB0ci52YWx1ZTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0cl9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlbW92ZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRyLm5hbWUgPT09ICcnIHx8IHRyLnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHt0ci51dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgc2VsZi50cmFja2Vycy5zcGxpY2Uoc2VsZi50cmFja2Vycy5pbmRleE9mKHRyKSwgMSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0cl92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWaXNpYmlsaXR5IGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRyLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgIHRyLnZpc2libGUgPSAhdHIudmlzaWJsZTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZi50cmFja2Vycy5mb3JFYWNoKGFkZFRyYWNrZXIpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZEF1cmEoYXVyYTogQXVyYSkge1xyXG4gICAgICAgIGNvbnN0IGF1cmFfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLm5hbWV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJDdXJyZW50IHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEudmFsdWV9XCI+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9kaW12YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkRpbSB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLmRpbSB8fCBcIlwifVwiPmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfY29sb3VyID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJBdXJhIGNvbG91clwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfbGlnaHQgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWxpZ2h0YnVsYlwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAvLyAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmNoaWxkcmVuKCkubGFzdCgpLmFwcGVuZChcclxuICAgICAgICBhbm5vdGF0aW9uLmJlZm9yZShcclxuICAgICAgICAgICAgYXVyYV9uYW1lXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmFsKVxyXG4gICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+Lzwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX2RpbXZhbClcclxuICAgICAgICAgICAgICAgIC5hZGQoJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj5gKS5hcHBlbmQoYXVyYV9jb2xvdXIpLmFwcGVuZCgkKFwiPC9kaXY+XCIpKSlcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX2xpZ2h0KVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX3JlbW92ZSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWF1cmEudmlzaWJsZSlcclxuICAgICAgICAgICAgYXVyYV92aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICBpZiAoIWF1cmEubGlnaHRTb3VyY2UpXHJcbiAgICAgICAgICAgIGF1cmFfbGlnaHQuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICBhdXJhX2NvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogYXVyYS5jb2xvdXIsXHJcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIG1vdmUgdW5rbm93biBhdXJhIGNvbG91clwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBEbyBub3QgdXNlIGF1cmEgZGlyZWN0bHkgYXMgaXQgZG9lcyBub3Qgd29yayBwcm9wZXJseSBmb3IgbmV3IGF1cmFzXHJcbiAgICAgICAgICAgICAgICBhdS5jb2xvdXIgPSBjb2xvdXIudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGF1cmFfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgbmFtZSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5sZW5ndGggfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hdXJhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkdjQoKSxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogMCxcclxuICAgICAgICAgICAgICAgICAgICBkaW06IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGFkZEF1cmEoc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSB2YWx1ZSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUudmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdS5kaW0gPyBgJHthdS52YWx1ZX0vJHthdS5kaW19YCA6IGF1LnZhbHVlO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV9kaW12YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIGRpbXZhbHVlIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHJlbW92ZSB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGF1Lm5hbWUgPT09ICcnICYmIGF1LnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHthdS51dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgc2VsZi5hdXJhcy5zcGxpY2Uoc2VsZi5hdXJhcy5pbmRleE9mKGF1KSwgMSk7XHJcbiAgICAgICAgICAgIHNlbGYuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdG9nZ2xlIHZpc2liaWxpdHkgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1LnZpc2libGUgPSAhYXUudmlzaWJsZTtcclxuICAgICAgICAgICAgaWYgKGF1LnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfbGlnaHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgbGlnaHQgY2FwYWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUubGlnaHRTb3VyY2UgPSAhYXUubGlnaHRTb3VyY2U7XHJcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgICAgICBjb25zdCBpID0gbHMuZmluZEluZGV4KG8gPT4gby5hdXJhID09PSBhdS51dWlkKTtcclxuICAgICAgICAgICAgaWYgKGF1LmxpZ2h0U291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgIGlmIChpID09PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBscy5wdXNoKHsgc2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZCB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gMClcclxuICAgICAgICAgICAgICAgICAgICBscy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSlcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5hdXJhcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGFkZEF1cmEoc2VsZi5hdXJhc1tpXSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdhbWVNYW5hZ2VyLnNoYXBlU2VsZWN0aW9uRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcblxyXG4gICAgJCgnLnNlbGVjdGlvbi10cmFja2VyLXZhbHVlJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgIGNvbnN0IHRyYWNrZXIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgIGlmICh0cmFja2VyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdXBkYXRlIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBuZXdfdHJhY2tlciA9IHByb21wdChgTmV3ICAke3RyYWNrZXIubmFtZX0gdmFsdWU6IChhYnNvbHV0ZSBvciByZWxhdGl2ZSlgKTtcclxuICAgICAgICBpZiAobmV3X3RyYWNrZXIgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBpZiAodHJhY2tlci52YWx1ZSA9PT0gMClcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSA9IDA7XHJcbiAgICAgICAgaWYgKG5ld190cmFja2VyWzBdID09PSAnKycpIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSArPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXdfdHJhY2tlclswXSA9PT0gJy0nKSB7XHJcbiAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgLT0gcGFyc2VJbnQobmV3X3RyYWNrZXIuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgPSBwYXJzZUludChuZXdfdHJhY2tlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgfSk7XHJcbiAgICAkKCcuc2VsZWN0aW9uLWF1cmEtdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgY29uc3QgYXVyYSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKGF1cmEgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB1cGRhdGUgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG5ld19hdXJhID0gcHJvbXB0KGBOZXcgICR7YXVyYS5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgIGlmIChuZXdfYXVyYSA9PT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGlmIChhdXJhLnZhbHVlID09PSAwKVxyXG4gICAgICAgICAgICBhdXJhLnZhbHVlID0gMDtcclxuICAgICAgICBpZiAobmV3X2F1cmFbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlICs9IHBhcnNlSW50KG5ld19hdXJhLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5ld19hdXJhWzBdID09PSAnLScpIHtcclxuICAgICAgICAgICAgYXVyYS52YWx1ZSAtPSBwYXJzZUludChuZXdfYXVyYS5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXVyYS52YWx1ZSA9IHBhcnNlSW50KG5ld19hdXJhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdmFsID0gYXVyYS5kaW0gPyBgJHthdXJhLnZhbHVlfS8ke2F1cmEuZGltfWAgOiBhdXJhLnZhbHVlO1xyXG4gICAgICAgICQodGhpcykudGV4dCh2YWwpO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9KTtcclxufSIsImltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgeyBnMmx4LCBnMmx5IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbmUgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB0eXBlID0gXCJsaW5lXCI7XHJcbiAgICBlbmRQb2ludDogR2xvYmFsUG9pbnQ7XHJcbiAgICBjb25zdHJ1Y3RvcihzdGFydFBvaW50OiBHbG9iYWxQb2ludCwgZW5kUG9pbnQ6IEdsb2JhbFBvaW50LCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoc3RhcnRQb2ludCwgdXVpZCk7XHJcbiAgICAgICAgdGhpcy5lbmRQb2ludCA9IGVuZFBvaW50O1xyXG4gICAgfVxyXG4gICAgYXNEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICB4MjogdGhpcy5lbmRQb2ludC54LFxyXG4gICAgICAgICAgICB5MjogdGhpcy5lbmRQb2ludC55LFxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KFxyXG4gICAgICAgICAgICBuZXcgR2xvYmFsUG9pbnQoXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnJlZlBvaW50LngsIHRoaXMuZW5kUG9pbnQueCksXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnJlZlBvaW50LngsIHRoaXMuZW5kUG9pbnQueSksXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMucmVmUG9pbnQueCAtIHRoaXMuZW5kUG9pbnQueCksXHJcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMucmVmUG9pbnQueSAtIHRoaXMuZW5kUG9pbnQueSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyhnMmx4KHRoaXMucmVmUG9pbnQueCksIGcybHkodGhpcy5yZWZQb2ludC55KSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyhnMmx4KHRoaXMuZW5kUG9pbnQueCksIGcybHkodGhpcy5lbmRQb2ludC55KSk7XHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJ3JnYmEoMjU1LDAsMCwgMC41KSc7XHJcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDM7XHJcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgfVxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBHbG9iYWxQb2ludCk6IEdsb2JhbFBvaW50IHwgdm9pZCB7IH0gLy8gVE9ET1xyXG4gICAgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCk6IHN0cmluZ3x1bmRlZmluZWQgeyByZXR1cm4gXCJcIiB9OyAvLyBUT0RPXHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcbn0iLCJpbXBvcnQgQmFzZVJlY3QgZnJvbSBcIi4vYmFzZXJlY3RcIjtcclxuaW1wb3J0IHsgZzJsIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyUmVjdCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlY3QgZXh0ZW5kcyBCYXNlUmVjdCB7XHJcbiAgICB0eXBlID0gXCJyZWN0XCJcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IodG9wbGVmdDogR2xvYmFsUG9pbnQsIHc6IG51bWJlciwgaDogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB3LCBoLCB1dWlkKTtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgYm9yZGVyOiB0aGlzLmJvcmRlclxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBmcm9tRGljdChkYXRhOiBTZXJ2ZXJSZWN0KSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgaWYgKGRhdGEuYm9yZGVyKVxyXG4gICAgICAgICAgICB0aGlzLmJvcmRlciA9IGRhdGEuYm9yZGVyO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IGcybCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICBjdHguZmlsbFJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlUmVjdChsb2MueCwgbG9jLnksIHRoaXMudyAqIHosIHRoaXMuaCAqIHopO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCB7IHV1aWR2NCB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IGcybCwgZzJsciB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBwb3B1bGF0ZUVkaXRBc3NldERpYWxvZyB9IGZyb20gXCIuL2VkaXRkaWFsb2dcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQsIExvY2FsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJTaGFwZSB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuXHJcbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhYnN0cmFjdCBjbGFzcyBTaGFwZSB7XHJcbiAgICAvLyBVc2VkIHRvIGNyZWF0ZSBjbGFzcyBpbnN0YW5jZSBmcm9tIHNlcnZlciBzaGFwZSBkYXRhXHJcbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgdHlwZTogc3RyaW5nO1xyXG4gICAgLy8gVGhlIHVuaXF1ZSBJRCBvZiB0aGlzIHNoYXBlXHJcbiAgICB1dWlkOiBzdHJpbmc7XHJcbiAgICAvLyBUaGUgbGF5ZXIgdGhlIHNoYXBlIGlzIGN1cnJlbnRseSBvblxyXG4gICAgbGF5ZXIhOiBzdHJpbmc7XHJcblxyXG4gICAgLy8gQSByZWZlcmVuY2UgcG9pbnQgcmVnYXJkaW5nIHRoYXQgc3BlY2lmaWMgc2hhcGUncyBzdHJ1Y3R1cmVcclxuICAgIHJlZlBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIFxyXG4gICAgLy8gRmlsbCBjb2xvdXIgb2YgdGhlIHNoYXBlXHJcbiAgICBmaWxsOiBzdHJpbmcgPSAnIzAwMCc7XHJcbiAgICAvL1RoZSBvcHRpb25hbCBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2hhcGVcclxuICAgIG5hbWUgPSAnVW5rbm93biBzaGFwZSc7XHJcblxyXG4gICAgLy8gQXNzb2NpYXRlZCB0cmFja2Vycy9hdXJhcy9vd25lcnNcclxuICAgIHRyYWNrZXJzOiBUcmFja2VyW10gPSBbXTtcclxuICAgIGF1cmFzOiBBdXJhW10gPSBbXTtcclxuICAgIG93bmVyczogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICAvLyBCbG9jayBsaWdodCBzb3VyY2VzXHJcbiAgICB2aXNpb25PYnN0cnVjdGlvbiA9IGZhbHNlO1xyXG4gICAgLy8gUHJldmVudCBzaGFwZXMgZnJvbSBvdmVybGFwcGluZyB3aXRoIHRoaXMgc2hhcGVcclxuICAgIG1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBNb3VzZW92ZXIgYW5ub3RhdGlvblxyXG4gICAgYW5ub3RhdGlvbjogc3RyaW5nID0gJyc7XHJcblxyXG4gICAgLy8gRHJhdyBtb2R1cyB0byB1c2VcclxuICAgIGdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjogc3RyaW5nID0gXCJzb3VyY2Utb3ZlclwiO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJlZlBvaW50OiBHbG9iYWxQb2ludCwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQgPSByZWZQb2ludDtcclxuICAgICAgICB0aGlzLnV1aWQgPSB1dWlkIHx8IHV1aWR2NCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdDtcclxuXHJcbiAgICAvLyBJZiBpbldvcmxkQ29vcmQgaXMgXHJcbiAgICBhYnN0cmFjdCBjb250YWlucyhwb2ludDogR2xvYmFsUG9pbnQpOiBib29sZWFuO1xyXG5cclxuICAgIGFic3RyYWN0IGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGFic3RyYWN0IGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3QgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCk6IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuICAgIGFic3RyYWN0IHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbjtcclxuXHJcbiAgICBjaGVja0xpZ2h0U291cmNlcygpIHtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XHJcbiAgICAgICAgaWYgKHRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgdm9faSA9PT0gLTEpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnV1aWQpO1xyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5zcGxpY2Uodm9faSwgMSk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBsaWdodHNvdXJjZSBhdXJhcyBhcmUgaW4gdGhlIGdhbWVNYW5hZ2VyXHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdSkge1xyXG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcztcclxuICAgICAgICAgICAgY29uc3QgaSA9IGxzLmZpbmRJbmRleChvID0+IG8uYXVyYSA9PT0gYXUudXVpZCk7XHJcbiAgICAgICAgICAgIGlmIChhdS5saWdodFNvdXJjZSAmJiBpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgbHMucHVzaCh7IHNoYXBlOiBzZWxmLnV1aWQsIGF1cmE6IGF1LnV1aWQgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1LmxpZ2h0U291cmNlICYmIGkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgbHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55dGhpbmcgaW4gdGhlIGdhbWVNYW5hZ2VyIHJlZmVyZW5jaW5nIHRoaXMgc2hhcGUgaXMgaW4gZmFjdCBzdGlsbCBhIGxpZ2h0c291cmNlXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlc1tpXTtcclxuICAgICAgICAgICAgaWYgKGxzLnNoYXBlID09PSBzZWxmLnV1aWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5zb21lKGEgPT4gYS51dWlkID09PSBscy5hdXJhICYmIGEubGlnaHRTb3VyY2UpKVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TW92ZW1lbnRCbG9jayhibG9ja3NNb3ZlbWVudDogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGJsb2Nrc01vdmVtZW50IHx8IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IHZvX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmluZGV4T2YodGhpcy51dWlkKTtcclxuICAgICAgICBpZiAodGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgICAgICBlbHNlIGlmICghdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2Uodm9faSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3duZWRCeSh1c2VybmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIGlmICh1c2VybmFtZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IGdhbWVNYW5hZ2VyLnVzZXJuYW1lO1xyXG4gICAgICAgIHJldHVybiBnYW1lTWFuYWdlci5JU19ETSB8fCB0aGlzLm93bmVycy5pbmNsdWRlcyh1c2VybmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYWNrZXJzLmxlbmd0aCB8fCB0aGlzLnRyYWNrZXJzW3RoaXMudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKVxyXG4gICAgICAgICAgICB0aGlzLnRyYWNrZXJzLnB1c2goeyB1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAwLCBtYXh2YWx1ZTogMCwgdmlzaWJsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmF1cmFzLmxlbmd0aCB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgdGhpcy5hdXJhc1t0aGlzLmF1cmFzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKVxyXG4gICAgICAgICAgICB0aGlzLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogdXVpZHY0KCksXHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgZGltOiAwLFxyXG4gICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1uYW1lXCIpLnRleHQodGhpcy5uYW1lKTtcclxuICAgICAgICBjb25zdCB0cmFja2VycyA9ICQoXCIjc2VsZWN0aW9uLXRyYWNrZXJzXCIpO1xyXG4gICAgICAgIHRyYWNrZXJzLmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy50cmFja2Vycy5mb3JFYWNoKGZ1bmN0aW9uICh0cmFja2VyKSB7XHJcbiAgICAgICAgICAgIGlmICh0cmFja2VyLnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgICAgIHRyYWNrZXJzLmFwcGVuZCgkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLXRyYWNrZXItJHt0cmFja2VyLnV1aWR9LW5hbWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4ke3RyYWNrZXIubmFtZX08L2Rpdj5gKSk7XHJcbiAgICAgICAgICAgIHRyYWNrZXJzLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi10cmFja2VyLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBhdXJhcyA9ICQoXCIjc2VsZWN0aW9uLWF1cmFzXCIpO1xyXG4gICAgICAgIGF1cmFzLmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1cmEuZGltID8gYCR7YXVyYS52YWx1ZX0vJHthdXJhLmRpbX1gIDogYXVyYS52YWx1ZTtcclxuICAgICAgICAgICAgYXVyYXMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tYXVyYS0ke2F1cmEudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPiR7YXVyYS5uYW1lfTwvZGl2PmApKTtcclxuICAgICAgICAgICAgYXVyYXMuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS12YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIGNsYXNzPVwic2VsZWN0aW9uLWF1cmEtdmFsdWVcIj4ke3ZhbH08L2Rpdj5gKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuc2hvdygpO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnN0IGVkaXRidXR0b24gPSAkKFwiI3NlbGVjdGlvbi1lZGl0LWJ1dHRvblwiKTtcclxuICAgICAgICBpZiAoIXRoaXMub3duZWRCeSgpKVxyXG4gICAgICAgICAgICBlZGl0YnV0dG9uLmhpZGUoKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGVkaXRidXR0b24uc2hvdygpO1xyXG4gICAgICAgIGVkaXRidXR0b24ub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtwb3B1bGF0ZUVkaXRBc3NldERpYWxvZyhzZWxmKX0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0aW9uTG9zcygpIHtcclxuICAgICAgICAvLyAkKGAjc2hhcGVzZWxlY3Rpb25jb2ctJHt0aGlzLnV1aWR9YCkucmVtb3ZlKCk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbWVudVwiKS5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRG8gbm90IHByb3ZpZGUgZ2V0QmFzZURpY3QgYXMgdGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gdG8gZm9yY2UgdGhlIGltcGxlbWVudGF0aW9uXHJcbiAgICBhYnN0cmFjdCBhc0RpY3QoKTogU2VydmVyU2hhcGU7XHJcbiAgICBnZXRCYXNlRGljdCgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0eXBlOiB0aGlzLnR5cGUsXHJcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcclxuICAgICAgICAgICAgeDogdGhpcy5yZWZQb2ludC54LFxyXG4gICAgICAgICAgICB5OiB0aGlzLnJlZlBvaW50LnksXHJcbiAgICAgICAgICAgIGxheWVyOiB0aGlzLmxheWVyLFxyXG4gICAgICAgICAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uLFxyXG4gICAgICAgICAgICBtb3ZlbWVudE9ic3RydWN0aW9uOiB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24sXHJcbiAgICAgICAgICAgIHZpc2lvbk9ic3RydWN0aW9uOiB0aGlzLnZpc2lvbk9ic3RydWN0aW9uLFxyXG4gICAgICAgICAgICBhdXJhczogdGhpcy5hdXJhcyxcclxuICAgICAgICAgICAgdHJhY2tlcnM6IHRoaXMudHJhY2tlcnMsXHJcbiAgICAgICAgICAgIG93bmVyczogdGhpcy5vd25lcnMsXHJcbiAgICAgICAgICAgIGZpbGw6IHRoaXMuZmlsbCxcclxuICAgICAgICAgICAgbmFtZTogdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICBhbm5vdGF0aW9uOiB0aGlzLmFubm90YXRpb24sXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyU2hhcGUpIHtcclxuICAgICAgICB0aGlzLmxheWVyID0gZGF0YS5sYXllcjtcclxuICAgICAgICB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IGRhdGEuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGRhdGEubW92ZW1lbnRPYnN0cnVjdGlvbjtcclxuICAgICAgICB0aGlzLnZpc2lvbk9ic3RydWN0aW9uID0gZGF0YS52aXNpb25PYnN0cnVjdGlvbjtcclxuICAgICAgICB0aGlzLmF1cmFzID0gZGF0YS5hdXJhcztcclxuICAgICAgICB0aGlzLnRyYWNrZXJzID0gZGF0YS50cmFja2VycztcclxuICAgICAgICB0aGlzLm93bmVycyA9IGRhdGEub3duZXJzO1xyXG4gICAgICAgIGlmIChkYXRhLmFubm90YXRpb24pXHJcbiAgICAgICAgICAgIHRoaXMuYW5ub3RhdGlvbiA9IGRhdGEuYW5ub3RhdGlvbjtcclxuICAgICAgICBpZiAoZGF0YS5uYW1lKVxyXG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIGlmICh0aGlzLmxheWVyID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XHJcbiAgICAgICAgdGhpcy5kcmF3QXVyYXMoY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3QXVyYXMoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1cmEpIHtcclxuICAgICAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gYXVyYS5jb2xvdXI7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJmb3dcIikgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5jdHggPT09IGN0eClcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYyA9IGcybChzZWxmLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIGcybHIoYXVyYS52YWx1ZSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgaWYgKGF1cmEuZGltKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0YyA9IHRpbnljb2xvcihhdXJhLmNvbG91cik7XHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGMuc2V0QWxwaGEodGMuZ2V0QWxwaGEoKSAvIDIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSBnMmwoc2VsZi5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgZzJscihhdXJhLmRpbSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzaG93Q29udGV4dE1lbnUobW91c2U6IExvY2FsUG9pbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgbC5zZWxlY3Rpb24gPSBbdGhpc107XHJcbiAgICAgICAgdGhpcy5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgIGwuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICBjb25zdCBhc3NldCA9IHRoaXM7XHJcbiAgICAgICAgJG1lbnUuc2hvdygpO1xyXG4gICAgICAgICRtZW51LmVtcHR5KCk7XHJcbiAgICAgICAgJG1lbnUuY3NzKHsgbGVmdDogbW91c2UueCwgdG9wOiBtb3VzZS55IH0pO1xyXG4gICAgICAgIGxldCBkYXRhID0gXCJcIiArXHJcbiAgICAgICAgICAgIFwiPHVsPlwiICtcclxuICAgICAgICAgICAgXCI8bGk+TGF5ZXI8dWw+XCI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmxheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChsYXllcikge1xyXG4gICAgICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGFibGUpIHJldHVybjtcclxuICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIubmFtZSA9PT0gbC5uYW1lID8gXCIgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6YXF1YScgXCIgOiBcIiBcIjtcclxuICAgICAgICAgICAgZGF0YSArPSBgPGxpIGRhdGEtYWN0aW9uPSdzZXRMYXllcicgZGF0YS1sYXllcj0nJHtsYXllci5uYW1lfScgJHtzZWx9IGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+JHtsYXllci5uYW1lfTwvbGk+YDtcclxuICAgICAgICB9KTtcclxuICAgICAgICBkYXRhICs9IFwiPC91bD48L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J21vdmVUb0JhY2snIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBiYWNrPC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9Gcm9udCcgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGZyb250PC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdhZGRJbml0aWF0aXZlJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPkFkZCBpbml0aWF0aXZlPC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPC91bD5cIjtcclxuICAgICAgICAkbWVudS5odG1sKGRhdGEpO1xyXG4gICAgICAgICQoXCIuY29udGV4dC1jbGlja2FibGVcIikub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBhc3NldC5vbkNvbnRleHRNZW51KCQodGhpcykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgb25Db250ZXh0TWVudShtZW51OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgY29uc3QgYWN0aW9uID0gbWVudS5kYXRhKFwiYWN0aW9uXCIpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICAgICAgaWYgKGxheWVyID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgICAgICBjYXNlICdtb3ZlVG9Gcm9udCc6XHJcbiAgICAgICAgICAgICAgICBsYXllci5tb3ZlU2hhcGVPcmRlcih0aGlzLCBsYXllci5zaGFwZXMubGVuZ3RoIC0gMSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnbW92ZVRvQmFjayc6XHJcbiAgICAgICAgICAgICAgICBsYXllci5tb3ZlU2hhcGVPcmRlcih0aGlzLCAwLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzZXRMYXllcic6XHJcbiAgICAgICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihtZW51LmRhdGEoXCJsYXllclwiKSkhLmFkZFNoYXBlKHRoaXMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2FkZEluaXRpYXRpdmUnOlxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZSh0aGlzLmdldEluaXRpYXRpdmVSZXByKCksIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICRtZW51LmhpZGUoKTtcclxuICAgIH1cclxuICAgIGdldEluaXRpYXRpdmVSZXByKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcclxuICAgICAgICAgICAgdmlzaWJsZTogIWdhbWVNYW5hZ2VyLklTX0RNLFxyXG4gICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgIHNyYzogXCJcIixcclxuICAgICAgICAgICAgb3duZXJzOiB0aGlzLm93bmVyc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENvZGUgdG8gc25hcCBhIGdyaWQgdG8gdGhlIGdyaWRcclxuICAgIC8vIFRoaXMgaXMgc2hhcGUgZGVwZW5kZW50IGFzIHRoZSBzaGFwZSByZWZQb2ludHMgYXJlIHNoYXBlIHNwZWNpZmljIGluXHJcbiAgICBzbmFwVG9HcmlkKCkge307XHJcbiAgICByZXNpemVUb0dyaWQoKSB7fTtcclxuICAgIHJlc2l6ZShyZXNpemVEaXI6IHN0cmluZywgcG9pbnQ6IExvY2FsUG9pbnQpIHt9O1xyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgZzJsIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0IGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdHlwZSA9IFwidGV4dFwiO1xyXG4gICAgdGV4dDogc3RyaW5nO1xyXG4gICAgZm9udDogc3RyaW5nO1xyXG4gICAgYW5nbGU6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHBvc2l0aW9uOiBHbG9iYWxQb2ludCwgdGV4dDogc3RyaW5nLCBmb250OiBzdHJpbmcsIGFuZ2xlPzogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIocG9zaXRpb24sIHV1aWQpO1xyXG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XHJcbiAgICAgICAgdGhpcy5mb250ID0gZm9udDtcclxuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGUgfHwgMDtcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgdGV4dDogdGhpcy50ZXh0LFxyXG4gICAgICAgICAgICBmb250OiB0aGlzLmZvbnQsXHJcbiAgICAgICAgICAgIGFuZ2xlOiB0aGlzLmFuZ2xlXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy5yZWZQb2ludCwgNSwgNSk7IC8vIFRvZG86IGZpeCB0aGlzIGJvdW5kaW5nIGJveFxyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZm9udCA9IHRoaXMuZm9udDtcclxuICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgIGNvbnN0IGRlc3QgPSBnMmwodGhpcy5yZWZQb2ludCk7XHJcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgY3R4LnJvdGF0ZSh0aGlzLmFuZ2xlKTtcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gXCJjZW50ZXJcIjtcclxuICAgICAgICAvLyBjdHguZmlsbFRleHQodGhpcy50ZXh0LCAwLCAtNSk7XHJcbiAgICAgICAgdGhpcy5kcmF3V3JhcHBlZFRleHQoY3R4KTtcclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgfVxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBHbG9iYWxQb2ludCk6IEdsb2JhbFBvaW50IHwgdm9pZCB7IH0gLy8gVE9ET1xyXG4gICAgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7IHJldHVybiBcIlwiIH07IC8vIFRPRE9cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxuXHJcbiAgICBwcml2YXRlIGRyYXdXcmFwcGVkVGV4dChjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gdGhpcy50ZXh0LnNwbGl0KFwiXFxuXCIpO1xyXG4gICAgICAgIGNvbnN0IG1heFdpZHRoID0gY3R4LmNhbnZhcy53aWR0aDtcclxuICAgICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gMzA7XHJcbiAgICAgICAgY29uc3QgeCA9IDA7IC8vdGhpcy5yZWZQb2ludC54O1xyXG4gICAgICAgIGxldCB5ID0gLTU7IC8vdGhpcy5yZWZQb2ludC55O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IGxpbmVzLmxlbmd0aDsgbisrKSB7XHJcbiAgICAgICAgICAgIGxldCBsaW5lID0gJyc7XHJcbiAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gbGluZXNbbl0uc3BsaXQoXCIgXCIpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCB3ID0gMDsgdyA8IHdvcmRzLmxlbmd0aDsgdysrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXN0TGluZSA9IGxpbmUgKyB3b3Jkc1t3XSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQodGVzdExpbmUpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlc3RXaWR0aCA9IG1ldHJpY3Mud2lkdGg7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVzdFdpZHRoID4gbWF4V2lkdGggJiYgbiA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFRleHQobGluZSwgeCwgeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IHdvcmRzW3ddICsgXCIgXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgeSArPSBsaW5lSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lID0gdGVzdExpbmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmZpbGxUZXh0KGxpbmUsIHgsIHkpO1xyXG4gICAgICAgICAgICB5ICs9IGxpbmVIZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuL3JlY3RcIjtcclxuaW1wb3J0IENpcmNsZSBmcm9tIFwiLi9jaXJjbGVcIjtcclxuaW1wb3J0IExpbmUgZnJvbSBcIi4vbGluZVwiO1xyXG5pbXBvcnQgVGV4dCBmcm9tIFwiLi90ZXh0XCI7XHJcbmltcG9ydCBBc3NldCBmcm9tIFwiLi9hc3NldFwiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJTaGFwZSwgU2VydmVyUmVjdCwgU2VydmVyQ2lyY2xlLCBTZXJ2ZXJMaW5lLCBTZXJ2ZXJUZXh0LCBTZXJ2ZXJBc3NldCB9IGZyb20gXCIuLi9hcGlfdHlwZXNcIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlOiBTZXJ2ZXJTaGFwZSwgZHVtbXk/OiBib29sZWFuKSB7XHJcbiAgICAvLyB0b2RvIGlzIHRoaXMgZHVtbXkgc3R1ZmYgYWN0dWFsbHkgbmVlZGVkLCBkbyB3ZSBldmVyIHdhbnQgdG8gcmV0dXJuIHRoZSBsb2NhbCBzaGFwZT9cclxuICAgIGlmIChkdW1teSA9PT0gdW5kZWZpbmVkKSBkdW1teSA9IGZhbHNlO1xyXG4gICAgaWYgKCFkdW1teSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpXHJcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKTtcclxuXHJcbiAgICBsZXQgc2g6IFNoYXBlO1xyXG5cclxuICAgIC8vIEEgZnJvbUpTT04gYW5kIHRvSlNPTiBvbiBTaGFwZSB3b3VsZCBiZSBjbGVhbmVyIGJ1dCB0cyBkb2VzIG5vdCBhbGxvdyBmb3Igc3RhdGljIGFic3RyYWN0cyBzbyB5ZWFoLlxyXG5cclxuICAgIGNvbnN0IHJlZlBvaW50ID0gbmV3IEdsb2JhbFBvaW50KHNoYXBlLngsIHNoYXBlLnkpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdyZWN0Jykge1xyXG4gICAgICAgIGNvbnN0IHJlY3QgPSA8U2VydmVyUmVjdD5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBSZWN0KHJlZlBvaW50LCByZWN0LncsIHJlY3QuaCwgcmVjdC5maWxsLCByZWN0LmJvcmRlciwgcmVjdC51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2NpcmNsZScpIHtcclxuICAgICAgICBjb25zdCBjaXJjID0gPFNlcnZlckNpcmNsZT5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBDaXJjbGUocmVmUG9pbnQsIGNpcmMuciwgY2lyYy5maWxsLCBjaXJjLmJvcmRlciwgY2lyYy51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2xpbmUnKSB7XHJcbiAgICAgICAgY29uc3QgbGluZSA9IDxTZXJ2ZXJMaW5lPnNoYXBlO1xyXG4gICAgICAgIHNoID0gbmV3IExpbmUocmVmUG9pbnQsIG5ldyBHbG9iYWxQb2ludChsaW5lLngyLCBsaW5lLnkyKSwgbGluZS51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ3RleHQnKSB7XHJcbiAgICAgICAgY29uc3QgdGV4dCA9IDxTZXJ2ZXJUZXh0PnNoYXBlO1xyXG4gICAgICAgIHNoID0gbmV3IFRleHQocmVmUG9pbnQsIHRleHQudGV4dCwgdGV4dC5mb250LCB0ZXh0LmFuZ2xlLCB0ZXh0LnV1aWQpO1xyXG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSAnYXNzZXQnKSB7XHJcbiAgICAgICAgY29uc3QgYXNzZXQgPSA8U2VydmVyQXNzZXQ+c2hhcGU7XHJcbiAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKGFzc2V0LncsIGFzc2V0LmgpO1xyXG4gICAgICAgIGlmIChhc3NldC5zcmMuc3RhcnRzV2l0aChcImh0dHBcIikpXHJcbiAgICAgICAgICAgIGltZy5zcmMgPSBuZXcgVVJMKGFzc2V0LnNyYykucGF0aG5hbWU7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBpbWcuc3JjID0gYXNzZXQuc3JjXHJcbiAgICAgICAgc2ggPSBuZXcgQXNzZXQoaW1nLCByZWZQb2ludCwgYXNzZXQudywgYXNzZXQuaCwgYXNzZXQudXVpZCk7XHJcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHNoLmZyb21EaWN0KHNoYXBlKTtcclxuICAgIHJldHVybiBzaDtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGFscGhTb3J0IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgc2V0dXBUb29scyB9IGZyb20gXCIuL3Rvb2xzL3Rvb2xzXCI7XHJcbmltcG9ydCB7IENsaWVudE9wdGlvbnMsIExvY2F0aW9uT3B0aW9ucywgQXNzZXRMaXN0LCBTZXJ2ZXJTaGFwZSwgSW5pdGlhdGl2ZURhdGEsIEJvYXJkSW5mbyB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xyXG5cclxuY29uc3QgcHJvdG9jb2wgPSBkb2N1bWVudC5kb21haW4gPT09ICdsb2NhbGhvc3QnID8gXCJodHRwOi8vXCIgOiBcImh0dHBzOi8vXCI7XHJcbmNvbnN0IHNvY2tldCA9IGlvLmNvbm5lY3QocHJvdG9jb2wgKyBkb2N1bWVudC5kb21haW4gKyBcIjpcIiArIGxvY2F0aW9uLnBvcnQgKyBcIi9wbGFuYXJhbGx5XCIpO1xyXG5zb2NrZXQub24oXCJjb25uZWN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkXCIpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkRpc2Nvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcInJlZGlyZWN0XCIsIGZ1bmN0aW9uIChkZXN0aW5hdGlvbjogc3RyaW5nKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInJlZGlyZWN0aW5nXCIpO1xyXG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBkZXN0aW5hdGlvbjtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCByb29tIGluZm9cIiwgZnVuY3Rpb24gKGRhdGE6IHtuYW1lOiBzdHJpbmcsIGNyZWF0b3I6IHN0cmluZ30pIHtcclxuICAgIGdhbWVNYW5hZ2VyLnJvb21OYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIucm9vbUNyZWF0b3IgPSBkYXRhLmNyZWF0b3I7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgdXNlcm5hbWVcIiwgZnVuY3Rpb24gKHVzZXJuYW1lOiBzdHJpbmcpIHtcclxuICAgIGdhbWVNYW5hZ2VyLnVzZXJuYW1lID0gdXNlcm5hbWU7XHJcbiAgICBnYW1lTWFuYWdlci5JU19ETSA9IHVzZXJuYW1lID09PSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoXCIvXCIpWzJdO1xyXG4gICAgaWYgKCQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIikuaHRtbCgpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICBzZXR1cFRvb2xzKCk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgY2xpZW50T3B0aW9uc1wiLCBmdW5jdGlvbiAob3B0aW9uczogQ2xpZW50T3B0aW9ucykge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0Q2xpZW50T3B0aW9ucyhvcHRpb25zKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCBsb2NhdGlvblwiLCBmdW5jdGlvbiAoZGF0YToge25hbWU6c3RyaW5nLCBvcHRpb25zOiBMb2NhdGlvbk9wdGlvbnN9KSB7XHJcbiAgICBnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWUgPSBkYXRhLm5hbWU7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0T3B0aW9ucyhkYXRhLm9wdGlvbnMpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYXNzZXQgbGlzdFwiLCBmdW5jdGlvbiAoYXNzZXRzOiBBc3NldExpc3QpIHtcclxuICAgIGNvbnN0IG0gPSAkKFwiI21lbnUtdG9rZW5zXCIpO1xyXG4gICAgbS5lbXB0eSgpO1xyXG4gICAgbGV0IGggPSAnJztcclxuXHJcbiAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGVudHJ5OiBBc3NldExpc3QsIHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgTWFwKE9iamVjdC5lbnRyaWVzKGVudHJ5LmZvbGRlcnMpKTtcclxuICAgICAgICBmb2xkZXJzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcclxuICAgICAgICAgICAgaCArPSBcIjxidXR0b24gY2xhc3M9J2FjY29yZGlvbic+XCIgKyBrZXkgKyBcIjwvYnV0dG9uPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1wYW5lbCc+PGRpdiBjbGFzcz0nYWNjb3JkaW9uLXN1YnBhbmVsJz5cIjtcclxuICAgICAgICAgICAgcHJvY2Vzcyh2YWx1ZSwgcGF0aCArIGtleSArIFwiL1wiKTtcclxuICAgICAgICAgICAgaCArPSBcIjwvZGl2PjwvZGl2PlwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGVudHJ5LmZpbGVzLnNvcnQoYWxwaFNvcnQpO1xyXG4gICAgICAgIGVudHJ5LmZpbGVzLmZvckVhY2goZnVuY3Rpb24gKGFzc2V0KSB7XHJcbiAgICAgICAgICAgIGggKz0gXCI8ZGl2IGNsYXNzPSdkcmFnZ2FibGUgdG9rZW4nPjxpbWcgc3JjPScvc3RhdGljL2ltZy9hc3NldHMvXCIgKyBwYXRoICsgYXNzZXQgKyBcIicgd2lkdGg9JzM1Jz5cIiArIGFzc2V0ICsgXCI8aSBjbGFzcz0nZmFzIGZhLWNvZyc+PC9pPjwvZGl2PlwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHByb2Nlc3MoYXNzZXRzLCBcIlwiKTtcclxuICAgIG0uaHRtbChoKTtcclxuICAgICQoXCIuZHJhZ2dhYmxlXCIpLmRyYWdnYWJsZSh7XHJcbiAgICAgICAgaGVscGVyOiBcImNsb25lXCIsXHJcbiAgICAgICAgYXBwZW5kVG86IFwiI2JvYXJkXCJcclxuICAgIH0pO1xyXG4gICAgJCgnLmFjY29yZGlvbicpLmVhY2goZnVuY3Rpb24gKGlkeCkge1xyXG4gICAgICAgICQodGhpcykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoXCJhY2NvcmRpb24tYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLm5leHQoKS50b2dnbGUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYm9hcmQgaW5pdFwiLCBmdW5jdGlvbiAobG9jYXRpb25faW5mbzogQm9hcmRJbmZvKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXR1cEJvYXJkKGxvY2F0aW9uX2luZm8pXHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgZ3JpZHNpemVcIiwgZnVuY3Rpb24gKGdyaWRTaXplOiBudW1iZXIpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncmlkU2l6ZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJhZGQgc2hhcGVcIiwgZnVuY3Rpb24gKHNoYXBlOiBTZXJ2ZXJTaGFwZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuYWRkU2hhcGUoc2hhcGUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwicmVtb3ZlIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBhbiB1bmtub3duIHNoYXBlYCk7XHJcbiAgICAgICAgcmV0dXJuIDtcclxuICAgIH1cclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgbGF5ZXIucmVtb3ZlU2hhcGUoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpISwgZmFsc2UpO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJtb3ZlU2hhcGVPcmRlclwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IGluZGV4OiBudW1iZXIgfSkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoZGF0YS5zaGFwZS51dWlkKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gbW92ZSB0aGUgc2hhcGUgb3JkZXIgb2YgYW4gdW5rbm93biBzaGFwZWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihkYXRhLnNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9YCk7XHJcbiAgICAgICAgcmV0dXJuIDtcclxuICAgIH1cclxuICAgIGNvbnN0IHNoYXBlID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGRhdGEuc2hhcGUudXVpZCkhO1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCBkYXRhLmluZGV4LCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzaGFwZU1vdmVcIiwgZnVuY3Rpb24gKHNoYXBlOiBTZXJ2ZXJTaGFwZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIubW92ZVNoYXBlKHNoYXBlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInVwZGF0ZVNoYXBlXCIsIGZ1bmN0aW9uIChkYXRhOiB7IHNoYXBlOiBTZXJ2ZXJTaGFwZTsgcmVkcmF3OiBib29sZWFuIH0pIHtcclxuICAgIGdhbWVNYW5hZ2VyLnVwZGF0ZVNoYXBlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBmdW5jdGlvbiAoZGF0YTogSW5pdGlhdGl2ZURhdGEpIHtcclxuICAgIGlmIChkYXRhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCB8fCAoIWRhdGEub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0gJiYgIWRhdGEudmlzaWJsZSkpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShkYXRhLnV1aWQsIGZhbHNlLCB0cnVlKTtcclxuICAgIGVsc2VcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5hZGRJbml0aWF0aXZlKGRhdGEsIGZhbHNlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldEluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhW10pIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldEluaXRpYXRpdmUoZGF0YSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJjbGVhciB0ZW1wb3Jhcmllc1wiLCBmdW5jdGlvbiAoc2hhcGVzOiBTZXJ2ZXJTaGFwZVtdKSB7XHJcbiAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biB0ZW1wb3Jhcnkgc2hhcGVcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfWApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZWFsX3NoYXBlID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpITtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpIS5yZW1vdmVTaGFwZShyZWFsX3NoYXBlLCBmYWxzZSk7XHJcbiAgICB9KVxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNvY2tldDsiLCJpbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgUmVjdCBmcm9tIFwiLi4vc2hhcGVzL3JlY3RcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBUb29sIH0gZnJvbSBcIi4vdG9vbFwiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4uL3NoYXBlcy9zaGFwZVwiO1xyXG5pbXBvcnQgQ2lyY2xlIGZyb20gXCIuLi9zaGFwZXMvY2lyY2xlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRHJhd1Rvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgc2hhcGUhOiBTaGFwZTtcclxuICAgIGZpbGxDb2xvciA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgLz5cIik7XHJcbiAgICBib3JkZXJDb2xvciA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgLz5cIik7XHJcbiAgICBzaGFwZVNlbGVjdCA9ICQoXCI8c2VsZWN0PjxvcHRpb24gdmFsdWU9J3NxdWFyZSc+JiN4ZjBjODs8L29wdGlvbj48b3B0aW9uIHZhbHVlPSdjaXJjbGUnPiYjeGYxMTE7PC9vcHRpb24+PC9zZWxlY3Q+XCIpO1xyXG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5GaWxsPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5maWxsQ29sb3IpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5Cb3JkZXI8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLmJvcmRlckNvbG9yKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+U2hhcGU8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnNoYXBlU2VsZWN0KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmZpbGxDb2xvci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZWRcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICBjb25zdCBmaWxsQ29sb3IgPSB0aGlzLmZpbGxDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcclxuICAgICAgICBjb25zdCBmaWxsID0gZmlsbENvbG9yID09PSBudWxsID8gdGlueWNvbG9yKFwidHJhbnNwYXJlbnRcIikgOiBmaWxsQ29sb3I7XHJcbiAgICAgICAgY29uc3QgYm9yZGVyQ29sb3IgPSB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKFwiZ2V0XCIpO1xyXG4gICAgICAgIGNvbnN0IGJvcmRlciA9IGJvcmRlckNvbG9yID09PSBudWxsID8gdGlueWNvbG9yKFwidHJhbnNwYXJlbnRcIikgOiBib3JkZXJDb2xvcjtcclxuICAgICAgICBpZiAodGhpcy5zaGFwZVNlbGVjdC52YWwoKSA9PT0gJ3NxdWFyZScpXHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGUgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQuY2xvbmUoKSwgMCwgMCwgZmlsbC50b1JnYlN0cmluZygpLCBib3JkZXIudG9SZ2JTdHJpbmcoKSk7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5zaGFwZVNlbGVjdC52YWwoKSA9PT0gJ2NpcmNsZScpXHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGUgPSBuZXcgQ2lyY2xlKHRoaXMuc3RhcnRQb2ludC5jbG9uZSgpLCAwLCBmaWxsLnRvUmdiU3RyaW5nKCksIGJvcmRlci50b1JnYlN0cmluZygpKTtcclxuICAgICAgICB0aGlzLnNoYXBlLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICBpZiAobGF5ZXIubmFtZSA9PT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZS52aXNpb25PYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMuc2hhcGUsIHRydWUsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2hhcGVTZWxlY3QudmFsKCkgPT09ICdzcXVhcmUnKSB7XHJcbiAgICAgICAgICAgICg8UmVjdD50aGlzLnNoYXBlKS53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICAgICAgKDxSZWN0PnRoaXMuc2hhcGUpLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlLnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGUucmVmUG9pbnQueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2hhcGVTZWxlY3QudmFsKCkgPT09ICdjaXJjbGUnKSB7XHJcbiAgICAgICAgICAgICg8Q2lyY2xlPnRoaXMuc2hhcGUpLnIgPSBlbmRQb2ludC5zdWJ0cmFjdCh0aGlzLnN0YXJ0UG9pbnQpLmxlbmd0aCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiB0aGlzLnNoYXBlIS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZSB9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFRvb2wgfSBmcm9tIFwiLi90b29sXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4uL3NoYXBlcy9yZWN0XCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRk9XVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzdGFydFBvaW50ITogR2xvYmFsUG9pbnQ7XHJcbiAgICByZWN0ITogUmVjdDtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+UmV2ZWFsPC9kaXY+PGxhYmVsIGNsYXNzPSdzd2l0Y2gnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2Zvdy1yZXZlYWwnPjxzcGFuIGNsYXNzPSdzbGlkZXIgcm91bmQnPjwvc3Bhbj48L2xhYmVsPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LmNsb25lKCksIDAsIDAsIGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJlY3QsIHRydWUsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgaWYgKCQoXCIjZm93LXJldmVhbFwiKS5wcm9wKFwiY2hlY2tlZFwiKSlcclxuICAgICAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiZGVzdGluYXRpb24tb3V0XCI7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB0aGlzLnJlY3QuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWN0LncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdC5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICB0aGlzLnJlY3QucmVmUG9pbnQueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QucmVmUG9pbnQueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuXHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy5yZWN0LmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlIH0pO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgSW5pdGlhdGl2ZURhdGEgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbml0aWF0aXZlVHJhY2tlciB7XHJcbiAgICBkYXRhOiBJbml0aWF0aXZlRGF0YVtdID0gW107XHJcbiAgICBhZGRJbml0aWF0aXZlKGRhdGE6IEluaXRpYXRpdmVEYXRhLCBzeW5jOiBib29sZWFuKSB7XHJcbiAgICAgICAgLy8gT3BlbiB0aGUgaW5pdGlhdGl2ZSB0cmFja2VyIGlmIGl0IGlzIG5vdCBjdXJyZW50bHkgb3Blbi5cclxuICAgICAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCB8fCAhZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuICAgICAgICAvLyBJZiBubyBpbml0aWF0aXZlIGdpdmVuLCBhc3N1bWUgaXQgMFxyXG4gICAgICAgIGlmIChkYXRhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgZGF0YS5pbml0aWF0aXZlID0gMDtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgc2hhcGUgaXMgYWxyZWFkeSBiZWluZyB0cmFja2VkXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gZGF0YS51dWlkKTtcclxuICAgICAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4aXN0aW5nLCBkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkYXRhKTtcclxuICAgIH07XHJcbiAgICByZW1vdmVJbml0aWF0aXZlKHV1aWQ6IHN0cmluZywgc3luYzogYm9vbGVhbiwgc2tpcEdyb3VwQ2hlY2s6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCBkID0gdGhpcy5kYXRhLmZpbmRJbmRleChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKGQgPj0gMCkge1xyXG4gICAgICAgICAgICBpZiAoIXNraXBHcm91cENoZWNrICYmIHRoaXMuZGF0YVtkXS5ncm91cCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc3BsaWNlKGQsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgICAgICBpZiAoc3luYylcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCB7IHV1aWQ6IHV1aWQgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmRhdGEubGVuZ3RoID09PSAwICYmIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiaXNPcGVuXCIpKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImNsb3NlXCIpO1xyXG4gICAgfTtcclxuICAgIHJlZHJhdygpIHtcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgICAgIGlmIChhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIGlmIChiLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICByZXR1cm4gYi5pbml0aWF0aXZlIC0gYS5pbml0aWF0aXZlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLmZvckVhY2goZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEub3duZXJzID09PSB1bmRlZmluZWQpIGRhdGEub3duZXJzID0gW107XHJcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IGRhdGEuc3JjID09PSB1bmRlZmluZWQgPyAnJyA6ICQoYDxpbWcgc3JjPVwiJHtkYXRhLnNyY31cIiB3aWR0aD1cIjMwcHhcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj5gKTtcclxuICAgICAgICAgICAgLy8gY29uc3QgbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7c2gudXVpZH1cIiB2YWx1ZT1cIiR7c2gubmFtZX1cIiBkaXNhYmxlZD0nZGlzYWJsZWQnIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJ2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiIHZhbHVlPVwiJHtkYXRhLmluaXRpYXRpdmV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogdmFsdWVcIj5gKTtcclxuICAgICAgICAgICAgY29uc3QgdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICBjb25zdCBncm91cCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdXNlcnNcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIGRhdGEudmlzaWJsZSA/IFwiMS4wXCIgOiBcIjAuM1wiKTtcclxuICAgICAgICAgICAgZ3JvdXAuY3NzKFwib3BhY2l0eVwiLCBkYXRhLmdyb3VwID8gXCIxLjBcIiA6IFwiMC4zXCIpO1xyXG4gICAgICAgICAgICBpZiAoIWRhdGEub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pIHtcclxuICAgICAgICAgICAgICAgIHZhbC5wcm9wKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgICAgICAgIHJlbW92ZS5jc3MoXCJvcGFjaXR5XCIsIFwiMC4zXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmFwcGVuZChpbWcpLmFwcGVuZCh2YWwpLmFwcGVuZCh2aXNpYmxlKS5hcHBlbmQoZ3JvdXApLmFwcGVuZChyZW1vdmUpO1xyXG5cclxuICAgICAgICAgICAgdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBjaGFuZ2UgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkLmluaXRpYXRpdmUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpIHx8IDA7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZEluaXRpYXRpdmUoZCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpITtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgdmlzaWJsZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBkLnZpc2libGUgPSAhZC52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBncm91cC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBncm91cCB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBkLmdyb3VwID0gIWQuZ3JvdXA7XHJcbiAgICAgICAgICAgICAgICBpZiAoZC5ncm91cClcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyByZW1vdmUgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3V1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVJbml0aWF0aXZlKHV1aWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn0iLCJpbXBvcnQgeyBUb29sIH0gZnJvbSBcIi4vdG9vbFwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuLi9zaGFwZXMvcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgbDJnIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCBCYXNlUmVjdCBmcm9tIFwiLi4vc2hhcGVzL2Jhc2VyZWN0XCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTWFwVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzdGFydFBvaW50ITogR2xvYmFsUG9pbnQ7XHJcbiAgICByZWN0ITogUmVjdDtcclxuICAgIHhDb3VudCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9JzMnPlwiKTtcclxuICAgIHlDb3VudCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9JzMnPlwiKTtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1g8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnhDb3VudClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PiNZPC9kaXY+XCIpKS5hcHBlbmQodGhpcy55Q291bnQpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LCAwLCAwLCBcInJnYmEoMCwwLDAsMClcIiwgXCJibGFja1wiKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJlY3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgICAgICB0aGlzLnJlY3QudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIHRoaXMucmVjdC5yZWZQb2ludC54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdC5yZWZQb2ludC55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGggIT09IDEpIHtcclxuICAgICAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5yZWN0ISwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdyA9IHRoaXMucmVjdC53O1xyXG4gICAgICAgIGNvbnN0IGggPSB0aGlzLnJlY3QuaDtcclxuICAgICAgICBjb25zdCBzZWwgPSBsYXllci5zZWxlY3Rpb25bMF07XHJcblxyXG4gICAgICAgIGlmIChzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkge1xyXG4gICAgICAgICAgICBzZWwudyAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueENvdW50LnZhbCgpKSAqIFNldHRpbmdzLmdyaWRTaXplIC8gdztcclxuICAgICAgICAgICAgc2VsLmggKj0gcGFyc2VJbnQoPHN0cmluZz50aGlzLnlDb3VudC52YWwoKSkgKiBTZXR0aW5ncy5ncmlkU2l6ZSAvIGg7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRlZCBzZWxlY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBUb29sIH0gZnJvbSBcIi4vdG9vbFwiO1xyXG5pbXBvcnQgeyBMb2NhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQYW5Ub29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBwYW5TdGFydCA9IG5ldyBMb2NhbFBvaW50KDAsIDApO1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wYW5TdGFydCA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgIH07XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgY29uc3QgeiA9IFNldHRpbmdzLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBsMmcobW91c2Uuc3VidHJhY3QodGhpcy5wYW5TdGFydCkpLmRpcmVjdGlvbjtcclxuICAgICAgICBTZXR0aW5ncy5wYW5YICs9IE1hdGgucm91bmQoZGlzdGFuY2UueCk7XHJcbiAgICAgICAgU2V0dGluZ3MucGFuWSArPSBNYXRoLnJvdW5kKGRpc3RhbmNlLnkpO1xyXG4gICAgICAgIHRoaXMucGFuU3RhcnQgPSBtb3VzZTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgfTtcclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5wYW5TdGFydC54ID09PSBnZXRNb3VzZShlKS54ICYmIHRoaXMucGFuU3RhcnQueSA9PT0gZ2V0TW91c2UoZSkueSkgeyByZXR1cm4gfVxyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICBsb2NhdGlvbk9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIFtgJHtnYW1lTWFuYWdlci5yb29tTmFtZX0vJHtnYW1lTWFuYWdlci5yb29tQ3JlYXRvcn0vJHtnYW1lTWFuYWdlci5sb2NhdGlvbk5hbWV9YF06IHtcclxuICAgICAgICAgICAgICAgICAgICBwYW5YOiBTZXR0aW5ncy5wYW5YLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhblk6IFNldHRpbmdzLnBhbllcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIG9uQ29udGV4dE1lbnUoZTogTW91c2VFdmVudCkgeyB9O1xyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgTGluZSBmcm9tIFwiLi4vc2hhcGVzL2xpbmVcIjtcclxuaW1wb3J0IFRleHQgZnJvbSBcIi4uL3NoYXBlcy90ZXh0XCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUnVsZXJUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHJ1bGVyITogTGluZTtcclxuICAgIHRleHQhOiBUZXh0O1xyXG5cclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICB0aGlzLnJ1bGVyID0gbmV3IExpbmUodGhpcy5zdGFydFBvaW50LCB0aGlzLnN0YXJ0UG9pbnQpO1xyXG4gICAgICAgIHRoaXMudGV4dCA9IG5ldyBUZXh0KHRoaXMuc3RhcnRQb2ludC5jbG9uZSgpLCBcIlwiLCBcImJvbGQgMjBweCBzZXJpZlwiKTtcclxuICAgICAgICB0aGlzLnJ1bGVyLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICB0aGlzLnRleHQub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBkcmF3IGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5ydWxlci5lbmRQb2ludCA9IGVuZFBvaW50O1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMucnVsZXIhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpZmZzaWduID0gTWF0aC5zaWduKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCkgKiBNYXRoLnNpZ24oZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICBjb25zdCB4ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgY29uc3QgeWRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIGNvbnN0IGxhYmVsID0gTWF0aC5yb3VuZChNYXRoLnNxcnQoKHhkaWZmKSAqKiAyICsgKHlkaWZmKSAqKiAyKSAqIFNldHRpbmdzLnVuaXRTaXplIC8gU2V0dGluZ3MuZ3JpZFNpemUpICsgXCIgZnRcIjtcclxuICAgICAgICBsZXQgYW5nbGUgPSBNYXRoLmF0YW4yKGRpZmZzaWduICogeWRpZmYsIHhkaWZmKTtcclxuICAgICAgICBjb25zdCB4bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpICsgeGRpZmYgLyAyO1xyXG4gICAgICAgIGNvbnN0IHltaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSkgKyB5ZGlmZiAvIDI7XHJcbiAgICAgICAgdGhpcy50ZXh0LnJlZlBvaW50LnggPSB4bWlkO1xyXG4gICAgICAgIHRoaXMudGV4dC5yZWZQb2ludC55ID0geW1pZDtcclxuICAgICAgICB0aGlzLnRleHQudGV4dCA9IGxhYmVsO1xyXG4gICAgICAgIHRoaXMudGV4dC5hbmdsZSA9IGFuZ2xlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMudGV4dC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IFNlbGVjdE9wZXJhdGlvbnMsIGNhbGN1bGF0ZURlbHRhIH0gZnJvbSBcIi4vdG9vbHNcIjtcclxuaW1wb3J0IHsgVmVjdG9yLCBMb2NhbFBvaW50LCBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuLi9zaGFwZXMvcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgZ2V0TW91c2UgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgbDJnLCBnMmwsIGcybHgsIGcybHkgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IFRvb2wgfSBmcm9tIFwiLi90b29sXCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdFRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIG1vZGU6IFNlbGVjdE9wZXJhdGlvbnMgPSBTZWxlY3RPcGVyYXRpb25zLk5vb3A7XHJcbiAgICByZXNpemVkaXI6IHN0cmluZyA9IFwiXCI7XHJcbiAgICAvLyBCZWNhdXNlIHdlIG5ldmVyIGRyYWcgZnJvbSB0aGUgYXNzZXQncyAoMCwgMCkgY29vcmQgYW5kIHdhbnQgYSBzbW9vdGhlciBkcmFnIGV4cGVyaWVuY2VcclxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cclxuICAgIGRyYWc6IFZlY3RvcjxMb2NhbFBvaW50PiA9IG5ldyBWZWN0b3I8TG9jYWxQb2ludD4oeyB4OiAwLCB5OiAwIH0sIG5ldyBMb2NhbFBvaW50KDAsIDApKTtcclxuICAgIHNlbGVjdGlvblN0YXJ0UG9pbnQ6IEdsb2JhbFBvaW50ID0gbmV3IEdsb2JhbFBvaW50KC0xMDAwLCAtMTAwMCk7XHJcbiAgICBzZWxlY3Rpb25IZWxwZXI6IFJlY3QgPSBuZXcgUmVjdCh0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQsIDAsIDApO1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcblxyXG4gICAgICAgIGxldCBoaXQgPSBmYWxzZTtcclxuICAgICAgICAvLyB0aGUgc2VsZWN0aW9uU3RhY2sgYWxsb3dzIGZvciBsb3dlciBwb3NpdGlvbmVkIG9iamVjdHMgdGhhdCBhcmUgc2VsZWN0ZWQgdG8gaGF2ZSBwcmVjZWRlbmNlIGR1cmluZyBvdmVybGFwLlxyXG4gICAgICAgIGxldCBzZWxlY3Rpb25TdGFjaztcclxuICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2VsZWN0aW9uU3RhY2sgPSBsYXllci5zaGFwZXMuY29uY2F0KGxheWVyLnNlbGVjdGlvbik7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHNlbGVjdGlvblN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYXBlID0gc2VsZWN0aW9uU3RhY2tbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IGNvcm4gPSBzaGFwZS5nZXRCb3VuZGluZ0JveCgpLmdldENvcm5lcihsMmcobW91c2UpKTtcclxuICAgICAgICAgICAgaWYgKGNvcm4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3NoYXBlXTtcclxuICAgICAgICAgICAgICAgIHNoYXBlLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSBTZWxlY3RPcGVyYXRpb25zLlJlc2l6ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplZGlyID0gY29ybjtcclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUuY29udGFpbnMobDJnKG1vdXNlKSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbCA9IHNoYXBlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IFNldHRpbmdzLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmluZGV4T2Yoc2VsKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2VsXTtcclxuICAgICAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuRHJhZztcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZyA9IG1vdXNlLnN1YnRyYWN0KGcybChzZWwucmVmUG9pbnQpKTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhZy5vcmlnaW4gPSBnMmwoc2VsLnJlZlBvaW50KTtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhZy5kaXJlY3Rpb24gPSBtb3VzZS5zdWJ0cmFjdCh0aGlzLmRyYWcub3JpZ2luKTtcclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaGl0KSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbkxvc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnJlZlBvaW50ID0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50O1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IDA7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFt0aGlzLnNlbGVjdGlvbkhlbHBlcl07XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICBjb25zdCB6ID0gU2V0dGluZ3Muem9vbUZhY3RvcjtcclxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0KSB7XHJcbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSB0aGlzXHJcbiAgICAgICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKG1vdXNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC55KTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIucmVmUG9pbnQgPSBuZXcgR2xvYmFsUG9pbnQoXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCksXHJcbiAgICAgICAgICAgICAgICBNYXRoLm1pbih0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2cgPSBnMmwobGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS5yZWZQb2ludCk7XHJcbiAgICAgICAgICAgIGxldCBkZWx0YSA9IGwyZyhtb3VzZS5zdWJ0cmFjdChvZy5hZGQodGhpcy5kcmFnKSkpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkRyYWcpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHdlIGFyZSBvbiB0aGUgdG9rZW5zIGxheWVyIGRvIGEgbW92ZW1lbnQgYmxvY2sgY2hlY2suXHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIubmFtZSA9PT0gJ3Rva2VucycpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyLnNlbGVjdGlvbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBsYXllci5zZWxlY3Rpb25baV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWwudXVpZCA9PT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIudXVpZCkgY29udGludWU7IC8vIHRoZSBzZWxlY3Rpb24gaGVscGVyIHNob3VsZCBub3QgYmUgdHJlYXRlZCBhcyBhIHJlYWwgc2hhcGUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhID0gY2FsY3VsYXRlRGVsdGEoZGVsdGEsIHNlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQWN0dWFsbHkgYXBwbHkgdGhlIGRlbHRhIG9uIGFsbCBzaGFwZXNcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5yZWZQb2ludCA9IHNlbC5yZWZQb2ludC5hZGQoZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5yZXNpemUodGhpcy5yZXNpemVkaXIsIG1vdXNlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyLnNlbGVjdGlvbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLnNlbGVjdGlvbltpXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYiA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdtID0gbDJnKG1vdXNlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmIuaW5Db3JuZXIoZ20sIFwibndcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm53LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYmIuaW5Db3JuZXIoZ20sIFwibmVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm5lLXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYmIuaW5Db3JuZXIoZ20sIFwic2VcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInNlLXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYmIuaW5Db3JuZXIoZ20sIFwic3dcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInN3LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdCkge1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgbGF5ZXIuc2hhcGVzLmZvckVhY2goKHNoYXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUgPT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gc2hhcGUuZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnggPD0gYmJveC5yZWZQb2ludC54ICsgYmJveC53ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnJlZlBvaW50LnggKyB0aGlzLnNlbGVjdGlvbkhlbHBlciEudyA+PSBiYm94LnJlZlBvaW50LnggJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEucmVmUG9pbnQueSA8PSBiYm94LnJlZlBvaW50LnkgKyBiYm94LmggJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEucmVmUG9pbnQueSArIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5oID49IGJib3gucmVmUG9pbnQueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5wdXNoKHNoYXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXNoIHRoZSBzZWxlY3Rpb24gaGVscGVyIGFzIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIHNlbGVjdGlvblxyXG4gICAgICAgICAgICAvLyBUaGlzIG1ha2VzIHN1cmUgdGhhdCBpdCB3aWxsIGJlIHRoZSBmaXJzdCBvbmUgdG8gYmUgaGl0IGluIHRoZSBoaXQgZGV0ZWN0aW9uIG9uTW91c2VEb3duXHJcbiAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5wdXNoKHRoaXMuc2VsZWN0aW9uSGVscGVyKTtcclxuXHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKChzZWwpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuRHJhZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRyYWcub3JpZ2luIS54ID09PSBnMmx4KHNlbC5yZWZQb2ludC54KSAmJiB0aGlzLmRyYWcub3JpZ2luIS55ID09PSBnMmx5KHNlbC5yZWZQb2ludC55KSkgeyByZXR1cm4gfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChTZXR0aW5ncy51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuc25hcFRvR3JpZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFNldHRpbmdzLnVzZUdyaWQgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5yZXNpemVUb0dyaWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuTm9vcFxyXG4gICAgfTtcclxuICAgIG9uQ29udGV4dE1lbnUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xyXG4gICAgICAgIGxheWVyLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBpZiAoIWhpdCAmJiBzaGFwZS5jb250YWlucyhsMmcobW91c2UpKSkge1xyXG4gICAgICAgICAgICAgICAgc2hhcGUuc2hvd0NvbnRleHRNZW51KG1vdXNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufSIsImV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUb29sIHtcclxuICAgIGRldGFpbERpdj86IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZDtcclxuICAgIGFic3RyYWN0IG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7IH07XHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgU2VsZWN0VG9vbCB9IGZyb20gXCIuL3NlbGVjdFwiO1xyXG5pbXBvcnQgeyBQYW5Ub29sIH0gZnJvbSBcIi4vcGFuXCI7XHJcbmltcG9ydCB7IERyYXdUb29sIH0gZnJvbSBcIi4vZHJhd1wiO1xyXG5pbXBvcnQgeyBSdWxlclRvb2wgfSBmcm9tIFwiLi9ydWxlclwiO1xyXG5pbXBvcnQgeyBGT1dUb29sIH0gZnJvbSBcIi4vZm93XCI7XHJcbmltcG9ydCB7IE1hcFRvb2wgfSBmcm9tIFwiLi9tYXBcIjtcclxuaW1wb3J0IHsgVmVjdG9yLCBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi4vc2hhcGVzL3NoYXBlXCI7XHJcblxyXG5leHBvcnQgZW51bSBTZWxlY3RPcGVyYXRpb25zIHtcclxuICAgIE5vb3AsXHJcbiAgICBSZXNpemUsXHJcbiAgICBEcmFnLFxyXG4gICAgR3JvdXBTZWxlY3QsXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFRvb2xzKCk6IHZvaWQge1xyXG4gICAgY29uc3QgdG9vbHNlbGVjdERpdiA9ICQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIik7XHJcbiAgICB0b29scy5mb3JFYWNoKGZ1bmN0aW9uICh0b29sKSB7XHJcbiAgICAgICAgaWYgKCF0b29sLnBsYXllclRvb2wgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IHRvb2xJbnN0YW5jZSA9IG5ldyB0b29sLmNseigpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLnRvb2xzLnNldCh0b29sLm5hbWUsIHRvb2xJbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgZXh0cmEgPSB0b29sLmRlZmF1bHRTZWxlY3QgPyBcIiBjbGFzcz0ndG9vbC1zZWxlY3RlZCdcIiA6IFwiXCI7XHJcbiAgICAgICAgY29uc3QgdG9vbExpID0gJChcIjxsaSBpZD0ndG9vbC1cIiArIHRvb2wubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIHRvb2wubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgIHRvb2xzZWxlY3REaXYuYXBwZW5kKHRvb2xMaSk7XHJcbiAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhO1xyXG4gICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICBkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29sTGkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdG9vbHMuaW5kZXhPZih0b29sKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIHtcclxuICAgICAgICAgICAgICAgICQoJy50b29sLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9ICQoJyN0b29sZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmNoaWxkcmVuKCkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAgICB7IG5hbWU6IFwic2VsZWN0XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IHRydWUsIGhhc0RldGFpbDogZmFsc2UsIGNsejogU2VsZWN0VG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcInBhblwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBQYW5Ub29sIH0sXHJcbiAgICB7IG5hbWU6IFwiZHJhd1wiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IERyYXdUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwicnVsZXJcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogZmFsc2UsIGNsejogUnVsZXJUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwiZm93XCIsIHBsYXllclRvb2w6IGZhbHNlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IEZPV1Rvb2wgfSxcclxuICAgIHsgbmFtZTogXCJtYXBcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogTWFwVG9vbCB9LFxyXG5dO1xyXG5cclxuXHJcbi8vIEZpcnN0IGdvIHRocm91Z2ggZWFjaCBzaGFwZSBpbiB0aGUgc2VsZWN0aW9uIGFuZCBzZWUgaWYgdGhlIGRlbHRhIGhhcyB0byBiZSB0cnVuY2F0ZWQgZHVlIHRvIG1vdmVtZW50IGJsb2NrZXJzXHJcblxyXG4vLyBUaGlzIGlzIGRlZmluaXRlbHkgc3VwZXIgY29udm9sdXRlZCBhbmQgaW5lZmZpY2llbnQgYnV0IEkgd2FzIHRpcmVkIGFuZCByZWFsbHkgd2FudGVkIHRoZSBzbW9vdGggd2FsbCBzbGlkaW5nIGNvbGxpc2lvbiBzdHVmZiB0byB3b3JrXHJcbi8vIEFuZCBpdCBkb2VzIG5vdywgc28gaGV5IMKvXFxfKOODhClfL8KvXHJcbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVEZWx0YShkZWx0YTogVmVjdG9yPEdsb2JhbFBvaW50Piwgc2VsOiBTaGFwZSwgZG9uZT86IHN0cmluZ1tdKSB7XHJcbiAgICBpZiAoZG9uZSA9PT0gdW5kZWZpbmVkKSBkb25lID0gW107XHJcbiAgICBjb25zdCBvZ1NlbEJCb3ggPSBzZWwuZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgIGNvbnN0IG5ld1NlbEJCb3ggPSBvZ1NlbEJCb3gub2Zmc2V0KGRlbHRhKTtcclxuICAgIGxldCByZWZpbmUgPSBmYWxzZTtcclxuICAgIGZvciAobGV0IG1iID0gMDsgbWIgPCBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmxlbmd0aDsgbWIrKykge1xyXG4gICAgICAgIGlmIChkb25lLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnNbbWJdKSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgY29uc3QgYmxvY2tlciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzW21iXSkhO1xyXG4gICAgICAgIGNvbnN0IGJsb2NrZXJCQm94ID0gYmxvY2tlci5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBib3VuZGluZyBib3ggb2Ygb3VyIGRlc3RpbmF0aW9uIHdvdWxkIGludGVyc2VjdCB3aXRoIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIG1vdmVtZW50YmxvY2tlclxyXG4gICAgICAgIGlmIChibG9ja2VyQkJveC5pbnRlcnNlY3RzV2l0aChuZXdTZWxCQm94KSB8fCBibG9ja2VyQkJveC5nZXRJbnRlcnNlY3RXaXRoTGluZSh7IHN0YXJ0OiBvZ1NlbEJCb3gucmVmUG9pbnQuYWRkKGRlbHRhLm5vcm1hbGl6ZSgpKSwgZW5kOiBuZXdTZWxCQm94LnJlZlBvaW50IH0pLmludGVyc2VjdCkge1xyXG4gICAgICAgICAgICBjb25zdCBiQ2VudGVyID0gYmxvY2tlckJCb3guY2VudGVyKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNDZW50ZXIgPSBvZ1NlbEJCb3guY2VudGVyKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBkID0gc0NlbnRlci5zdWJ0cmFjdChiQ2VudGVyKTtcclxuICAgICAgICAgICAgY29uc3QgdXggPSBuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7IHg6IDEsIHk6IDAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHV5ID0gbmV3IFZlY3RvcjxHbG9iYWxQb2ludD4oeyB4OiAwLCB5OiAxIH0pO1xyXG4gICAgICAgICAgICBsZXQgZHggPSBkLmRvdCh1eCk7XHJcbiAgICAgICAgICAgIGxldCBkeSA9IGQuZG90KHV5KTtcclxuICAgICAgICAgICAgaWYgKGR4ID4gYmxvY2tlckJCb3gudyAvIDIpIGR4ID0gYmxvY2tlckJCb3gudyAvIDI7XHJcbiAgICAgICAgICAgIGlmIChkeCA8IC1ibG9ja2VyQkJveC53IC8gMikgZHggPSAtYmxvY2tlckJCb3gudyAvIDI7XHJcbiAgICAgICAgICAgIGlmIChkeSA+IGJsb2NrZXJCQm94LmggLyAyKSBkeSA9IGJsb2NrZXJCQm94LmggLyAyO1xyXG4gICAgICAgICAgICBpZiAoZHkgPCAtYmxvY2tlckJCb3guaCAvIDIpIGR5ID0gLWJsb2NrZXJCQm94LmggLyAyO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2xvc2VzdCBwb2ludCAvIGludGVyc2VjdGlvbiBwb2ludCBiZXR3ZWVuIHRoZSB0d28gYmJveGVzLiAgTm90IHRoZSBkZWx0YSBpbnRlcnNlY3QhXHJcbiAgICAgICAgICAgIGNvbnN0IHAgPSBiQ2VudGVyLmFkZCh1eC5tdWx0aXBseShkeCkpLmFkZCh1eS5tdWx0aXBseShkeSkpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHAueCA9PT0gb2dTZWxCQm94LnJlZlBvaW50LnggfHwgcC54ID09PSBvZ1NlbEJCb3gucmVmUG9pbnQueCArIG9nU2VsQkJveC53KVxyXG4gICAgICAgICAgICAgICAgZGVsdGEuZGlyZWN0aW9uLnggPSAwO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChwLnkgPT09IG9nU2VsQkJveC5yZWZQb2ludC55IHx8IHAueSA9PT0gb2dTZWxCQm94LnJlZlBvaW50LnkgKyBvZ1NlbEJCb3guaClcclxuICAgICAgICAgICAgICAgIGRlbHRhLmRpcmVjdGlvbi55ID0gMDtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocC54IDwgb2dTZWxCQm94LnJlZlBvaW50LngpXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEuZGlyZWN0aW9uLnggPSBwLnggLSBvZ1NlbEJCb3gucmVmUG9pbnQueDtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHAueCA+IG9nU2VsQkJveC5yZWZQb2ludC54ICsgb2dTZWxCQm94LncpXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEuZGlyZWN0aW9uLnggPSBwLnggLSAob2dTZWxCQm94LnJlZlBvaW50LnggKyBvZ1NlbEJCb3gudyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwLnkgPCBvZ1NlbEJCb3gucmVmUG9pbnQueSlcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueSA9IHAueSAtIG9nU2VsQkJveC5yZWZQb2ludC55O1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocC55ID4gb2dTZWxCQm94LnJlZlBvaW50LnkgKyBvZ1NlbEJCb3guaClcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueSA9IHAueSAtIChvZ1NlbEJCb3gucmVmUG9pbnQueSArIG9nU2VsQkJveC5oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZWZpbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBkb25lLnB1c2goZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vyc1ttYl0pO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAocmVmaW5lKVxyXG4gICAgICAgIGRlbHRhID0gY2FsY3VsYXRlRGVsdGEoZGVsdGEsIHNlbCwgZG9uZSk7XHJcbiAgICByZXR1cm4gZGVsdGE7XHJcbn0iLCJpbXBvcnQgeyBHbG9iYWxQb2ludCwgTG9jYWxQb2ludCwgVmVjdG9yIH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZzJsKG9iajogR2xvYmFsUG9pbnQpOiBMb2NhbFBvaW50IHtcclxuICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgY29uc3QgcGFuWCA9IFNldHRpbmdzLnBhblg7XHJcbiAgICBjb25zdCBwYW5ZID0gU2V0dGluZ3MucGFuWTtcclxuICAgIHJldHVybiBuZXcgTG9jYWxQb2ludCgob2JqLnggKyBwYW5YKSAqIHosIChvYmoueSArIHBhblkpICogeik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybChuZXcgR2xvYmFsUG9pbnQoeCwgMCkpLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx5KHk6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybChuZXcgR2xvYmFsUG9pbnQoMCwgeSkpLnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmx6KHo6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHogKiBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdERpc3RhbmNlKHI6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIChyIC8gU2V0dGluZ3MudW5pdFNpemUpICogU2V0dGluZ3MuZ3JpZFNpemU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmxyKHI6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGcybHooZ2V0VW5pdERpc3RhbmNlKHIpKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogTG9jYWxQb2ludCk6IEdsb2JhbFBvaW50O1xyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogVmVjdG9yPExvY2FsUG9pbnQ+KTogVmVjdG9yPEdsb2JhbFBvaW50PjtcclxuZXhwb3J0IGZ1bmN0aW9uIGwyZyhvYmo6IExvY2FsUG9pbnR8VmVjdG9yPExvY2FsUG9pbnQ+KTogR2xvYmFsUG9pbnR8VmVjdG9yPEdsb2JhbFBvaW50PiB7XHJcbiAgICBjb25zdCB6ID0gU2V0dGluZ3Muem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBwYW5YID0gU2V0dGluZ3MucGFuWDtcclxuICAgICAgICBjb25zdCBwYW5ZID0gU2V0dGluZ3MucGFuWTtcclxuICAgIGlmIChvYmogaW5zdGFuY2VvZiBMb2NhbFBvaW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBHbG9iYWxQb2ludCgob2JqLnggLyB6KSAtIHBhblgsIChvYmoueSAvIHopIC0gcGFuWSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7eDogb2JqLmRpcmVjdGlvbi54IC8geiwgeTogb2JqLmRpcmVjdGlvbi55IC8gen0sIG9iai5vcmlnaW4gPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGwyZyhvYmoub3JpZ2luKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMmd4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIGwyZyhuZXcgTG9jYWxQb2ludCh4LCAwKSkueDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyZ3koeTogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbDJnKG5ldyBMb2NhbFBvaW50KDAsIHkpKS55O1xyXG59IiwiaW1wb3J0IHsgTG9jYWxQb2ludCB9IGZyb20gXCIuL2dlb21cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRNb3VzZShlOiBNb3VzZUV2ZW50KTogTG9jYWxQb2ludCB7XHJcbiAgICByZXR1cm4gbmV3IExvY2FsUG9pbnQoZS5wYWdlWCwgZS5wYWdlWSk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWxwaFNvcnQoYTogc3RyaW5nLCBiOiBzdHJpbmcpIHtcclxuICAgIGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiAxO1xyXG59XHJcblxyXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XHJcbmV4cG9ydCBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgT3JkZXJlZE1hcDxLLCBWPiB7XHJcbiAgICBrZXlzOiBLW10gPSBbXTtcclxuICAgIHZhbHVlczogVltdID0gW107XHJcbiAgICBnZXQoa2V5OiBLKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW3RoaXMua2V5cy5pbmRleE9mKGtleSldO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5kZXhWYWx1ZShpZHg6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1tpZHhdO1xyXG4gICAgfVxyXG4gICAgZ2V0SW5kZXhLZXkoaWR4OiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlzW2lkeF07XHJcbiAgICB9XHJcbiAgICBzZXQoa2V5OiBLLCB2YWx1ZTogVikge1xyXG4gICAgICAgIHRoaXMua2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMucHVzaCh2YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBpbmRleE9mKGVsZW1lbnQ6IEspIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5rZXlzLmluZGV4T2YoZWxlbWVudCk7XHJcbiAgICB9XHJcbiAgICByZW1vdmUoZWxlbWVudDogSykge1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuaW5kZXhPZihlbGVtZW50KTtcclxuICAgICAgICB0aGlzLmtleXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICB9XHJcbn0iXSwic291cmNlUm9vdCI6IiJ9