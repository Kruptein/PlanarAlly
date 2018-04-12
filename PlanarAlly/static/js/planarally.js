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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2V0dGluZ3MudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9hc3NldC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2Jhc2VyZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvYm91bmRpbmdyZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvY2lyY2xlLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvZWRpdGRpYWxvZy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzL2xpbmUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy9yZWN0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvc2hhcGUudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NoYXBlcy90ZXh0LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zaGFwZXMvdXRpbHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3NvY2tldC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvZHJhdy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvZm93LnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9pbml0aWF0aXZlLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy90b29scy9tYXAudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzL3Bhbi50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvcnVsZXIudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzL3NlbGVjdC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvdG9vbC50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdG9vbHMvdG9vbHMudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3VuaXRzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7O0FBR0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbkVBO0FBQUE7Ozs7RUFJRTtBQUVGO0lBR0ksWUFBWSxDQUFTLEVBQUUsQ0FBUTtRQUMzQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUNELEdBQUcsQ0FBQyxHQUFpQjtRQUNqQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUNELFFBQVEsQ0FBQyxLQUFZO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxFQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FB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QUFnRDtJQUNoRCxNQUFNLEtBQUssR0FBRyxFQUFFLEdBQUMsRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUM7SUFDNUIsRUFBRSxFQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQztJQUV6RCxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzQixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMzQix1Q0FBdUM7SUFDdkMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFDLEtBQUssQ0FBQztJQUV6QixNQUFNLFNBQVMsR0FBTSxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQyxHQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUMsRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUMsR0FBQyxRQUFRLEVBQUMsQ0FBQztJQUNoRixFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekMsTUFBTSxDQUFDLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUM7SUFDOUMsTUFBTSxDQUFDLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDLENBQUM7QUFDbkQsQ0FBQztBQUVLLDBCQUEyQixFQUFTLEVBQUUsRUFBUztJQUNqRCxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcsRUFB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SUFDRCxjQUFjO1FBQ1YsTUFBTSxDQUFDLElBQUkscURBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFDRCxRQUFRLENBQUMsS0FBa0I7UUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFDRCxRQUFRLENBQUMsS0FBa0IsRUFBRSxNQUFjO1FBQ3ZDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDYixLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsSyxLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2hKLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xLLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwTDtnQkFDSSxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3JCLENBQUM7SUFDTCxDQUFDO0lBQ0QsU0FBUyxDQUFDLEtBQWtCO1FBQ3hCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUdELE1BQU0sQ0FBQyxXQUF5QjtRQUM1QixFQUFFLENBQUMsQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDRDQUFNLENBQWMsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsZUFBZSxDQUFDLE1BQXlCO1FBQ3JDLE1BQU0sQ0FBQyxDQUFDLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNO1lBQzFFLG1EQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMxRixDQUFDO0lBQ0QsVUFBVTtRQUNOLE1BQU0sRUFBRSxHQUFHLGtEQUFRLENBQUMsUUFBUSxDQUFDO1FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM3QixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyRixDQUFDO0lBQ0wsQ0FBQztJQUNELFlBQVk7UUFDUixNQUFNLEVBQUUsR0FBRyxrREFBUSxDQUFDLFFBQVEsQ0FBQztRQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4RCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4RCxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBQ0QsTUFBTSxDQUFDLFNBQWlCLEVBQUUsS0FBaUI7UUFDdkMsTUFBTSxDQUFDLEdBQUcsa0RBQVEsQ0FBQyxVQUFVLENBQUM7UUFDOUIsRUFBRSxDQUFDLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxRQUFRLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVaLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNiLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBQ0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7SUFDTCxDQUFDO0NBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7QUNySHVGO0FBRTFFO0lBTVYsWUFBWSxPQUFvQixFQUFFLENBQVMsRUFBRSxDQUFTO1FBTHRELFNBQUksR0FBRyxXQUFXLENBQUM7UUFNZixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUFrQjtRQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUEyQjtRQUM5QixNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELGNBQWMsQ0FBQyxLQUFtQjtRQUM5QixNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ2hELEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzNDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBQ0Qsd0JBQXdCLENBQUMsS0FBbUI7UUFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxpREFBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxSCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDckYsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFDRCxvQkFBb0IsQ0FBQyxJQUE4QztRQUMvRCxNQUFNLEtBQUssR0FBRztZQUNWLG9FQUFzQixDQUFDLElBQUksaURBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksaURBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzNKLG9FQUFzQixDQUFDLElBQUksaURBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxpREFBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM3SyxvRUFBc0IsQ0FBQyxJQUFJLGlEQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLGlEQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUMzSixvRUFBc0IsQ0FBQyxJQUFJLGlEQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksaURBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7U0FDaEwsQ0FBQztRQUNGLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQztRQUNyQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDcEMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25CLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDO2dCQUFDLFFBQVEsQ0FBQztZQUNuQyxNQUFNLENBQUMsR0FBRyw4REFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWixLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNWLEtBQUssR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3hCLENBQUM7UUFDTCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFO0lBQ2hELENBQUM7SUFJRCxNQUFNLENBQUMsV0FBeUI7UUFDNUIsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSw0Q0FBTSxDQUFjLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUNELFFBQVEsQ0FBQyxLQUFrQixFQUFFLE1BQWM7UUFDdkMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNiLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xLLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEosS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEssS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BMO2dCQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDckIsQ0FBQztJQUNMLENBQUM7SUFDRCxTQUFTLENBQUMsS0FBa0I7UUFDeEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFD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UUFJVCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLENBQUM7UUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksa0JBQWtCLENBQUM7SUFDL0MsQ0FBQztJQUNELE1BQU07UUFDRixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDckMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1NBQ3RCLENBQUM7SUFDTixDQUFDO0lBQ0QsUUFBUSxDQUFDLElBQWdCO1FBQ3JCLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUNaLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNsQyxDQUFDO0lBQ0QsSUFBSSxDQUFDLEdBQTZCO1FBQzlCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxHQUFHLGtEQUFRLENBQUMsVUFBVSxDQUFDO1FBQzlCLE1BQU0sR0FBRyxHQUFHLGtEQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDckMsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzlCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElB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QyxDQUFDLENBQUM7WUFDN0MsZ0NBQWdDO1lBQ2hDLE1BQU0sUUFBUSxHQUFHLGtEQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFNUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxHQUFHLElBQUksaURBQVcsQ0FDM0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFDaEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FDbkQsQ0FBQztZQUNGLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxFQUFFLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JFLElBQUksS0FBSyxHQUFHLGtEQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyx1REFBZ0Is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LElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELE1BQU0sQ0FBQyxPQUFVO1FBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUM7Q0FDSiIsImZpbGUiOiJwbGFuYXJhbGx5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vdHNfc3JjL3BsYW5hcmFsbHkudHNcIik7XG4iLCIvKlxyXG5UaGlzIG1vZHVsZSBkZWZpbmVzIHNvbWUgUG9pbnQgY2xhc3Nlcy5cclxuQSBzdHJvbmcgZm9jdXMgaXMgbWFkZSB0byBlbnN1cmUgdGhhdCBhdCBubyB0aW1lIGEgZ2xvYmFsIGFuZCBhIGxvY2FsIHBvaW50IGFyZSBpbiBzb21lIHdheSB1c2VkIGluc3RlYWQgb2YgdGhlIG90aGVyLlxyXG5UaGlzIGFkZHMgc29tZSBhdCBmaXJzdCBnbGFuY2Ugd2VpcmQgbG9va2luZyBoYWNrcyBhcyB0cyBkb2VzIG5vdCBzdXBwb3J0IG5vbWluYWwgdHlwaW5nLlxyXG4qL1xyXG5cclxuY2xhc3MgUG9pbnQge1xyXG4gICAgeDogbnVtYmVyO1xyXG4gICAgeTogbnVtYmVyO1xyXG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5Om51bWJlcikge1xyXG4gICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgdGhpcy55ID0geTtcclxuICAgIH1cclxuICAgIGFkZCh2ZWM6IFZlY3Rvcjx0aGlzPikge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICsgdmVjLmRpcmVjdGlvbi54LCB0aGlzLnkgKyB2ZWMuZGlyZWN0aW9uLnkpO1xyXG4gICAgfVxyXG4gICAgc3VidHJhY3Qob3RoZXI6IFBvaW50KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3Ioe3g6IHRoaXMueCAtIG90aGVyLngsIHk6IHRoaXMueSAtIG90aGVyLnl9LCB0aGlzKTtcclxuICAgIH1cclxuICAgIGNsb25lKCk6IFBvaW50IHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCwgdGhpcy55KTtcclxuICAgIH1cclxufVxyXG5leHBvcnQgY2xhc3MgR2xvYmFsUG9pbnQgZXh0ZW5kcyBQb2ludCB7XHJcbiAgICAvLyB0aGlzIGlzIHRvIGRpZmZlcmVudGlhdGUgd2l0aCBMb2NhbFBvaW50LCBpcyBhY3R1YWxseSBuZXZlciB1c2VkXHJcbiAgICAvLyBXZSBkbyAhIHRvIHByZXZlbnQgZXJyb3JzIHRoYXQgaXQgZ2V0cyBuZXZlciBpbml0aWFsaXplZCBiZWNhdXNlIHllYWguXHJcbiAgICBfR2xvYmFsUG9pbnQhOiBzdHJpbmc7XHJcbiAgICBhZGQodmVjOiBWZWN0b3I8dGhpcz4pOiBHbG9iYWxQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIDxHbG9iYWxQb2ludD5zdXBlci5hZGQodmVjKTtcclxuICAgIH1cclxuICAgIHN1YnRyYWN0KG90aGVyOiBHbG9iYWxQb2ludCk6IFZlY3Rvcjx0aGlzPiB7XHJcbiAgICAgICAgIHJldHVybiBzdXBlci5zdWJ0cmFjdChvdGhlcik7XHJcbiAgICB9XHJcbiAgICBjbG9uZSgpOiBHbG9iYWxQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIDxHbG9iYWxQb2ludD5zdXBlci5jbG9uZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTG9jYWxQb2ludCBleHRlbmRzIFBvaW50IHtcclxuICAgIC8vIHRoaXMgaXMgdG8gZGlmZmVyZW50aWF0ZSB3aXRoIEdsb2JhbFBvaW50LCBpcyBhY3R1YWxseSBuZXZlciB1c2VkXHJcbiAgICAvLyBXZSBkbyAhIHRvIHByZXZlbnQgZXJyb3JzIHRoYXQgaXQgZ2V0cyBuZXZlciBpbml0aWFsaXplZCBiZWNhdXNlIHllYWguXHJcbiAgICBfTG9jYWxQb2ludCE6IHN0cmluZztcclxuICAgIGFkZCh2ZWM6IFZlY3Rvcjx0aGlzPik6IExvY2FsUG9pbnQge1xyXG4gICAgICAgIHJldHVybiA8TG9jYWxQb2ludD5zdXBlci5hZGQodmVjKTtcclxuICAgIH1cclxuICAgIHN1YnRyYWN0KG90aGVyOiBMb2NhbFBvaW50KTogVmVjdG9yPHRoaXM+IHtcclxuICAgICAgICByZXR1cm4gc3VwZXIuc3VidHJhY3Qob3RoZXIpO1xyXG4gICAgfVxyXG4gICAgY2xvbmUoKTogTG9jYWxQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIDxMb2NhbFBvaW50PnN1cGVyLmNsb25lKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWZWN0b3I8VCBleHRlbmRzIFBvaW50PiB7XHJcbiAgICBkaXJlY3Rpb246IHt4OiBudW1iZXIsIHk6bnVtYmVyfTtcclxuICAgIG9yaWdpbj86IFQ7XHJcbiAgICBjb25zdHJ1Y3RvcihkaXJlY3Rpb246IHt4OiBudW1iZXIsIHk6bnVtYmVyfSwgb3JpZ2luPzogVCkge1xyXG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xyXG4gICAgICAgIHRoaXMub3JpZ2luID0gb3JpZ2luO1xyXG4gICAgfVxyXG4gICAgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codGhpcy5kaXJlY3Rpb24ueCwgMikgKyBNYXRoLnBvdyh0aGlzLmRpcmVjdGlvbi55LCAyKSk7XHJcbiAgICB9XHJcbiAgICBub3JtYWxpemUoKSB7XHJcbiAgICAgICAgY29uc3QgbCA9IHRoaXMubGVuZ3RoKClcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjxUPih7eDogdGhpcy5kaXJlY3Rpb24ueCAvIGwsIHk6IHRoaXMuZGlyZWN0aW9uLnkgLyBsfSwgdGhpcy5vcmlnaW4pO1xyXG4gICAgfVxyXG4gICAgcmV2ZXJzZSgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZlY3RvcjxUPih7eDogLXRoaXMuZGlyZWN0aW9uLngsIHk6IC10aGlzLmRpcmVjdGlvbi55fSwgdGhpcy5vcmlnaW4pO1xyXG4gICAgfVxyXG4gICAgbXVsdGlwbHkoc2NhbGU6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiBuZXcgVmVjdG9yPFQ+KHt4OiB0aGlzLmRpcmVjdGlvbi54ICogc2NhbGUsIHk6IHRoaXMuZGlyZWN0aW9uLnkgKiBzY2FsZX0sIHRoaXMub3JpZ2luKTtcclxuICAgIH1cclxuICAgIGRvdChvdGhlcjogVmVjdG9yPFQ+KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlyZWN0aW9uLnggKiBvdGhlci5kaXJlY3Rpb24ueCArIHRoaXMuZGlyZWN0aW9uLnkgKiBvdGhlci5kaXJlY3Rpb24ueTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmU8VCBleHRlbmRzIFBvaW50PihwOiBULCBsMTogVCwgbDI6IFQpIHtcclxuICAgIHJldHVybiBwLnggPj0gTWF0aC5taW4obDEueCwgbDIueCkgLSAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueCA8PSBNYXRoLm1heChsMS54LCBsMi54KSArIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55ID49IE1hdGgubWluKGwxLnksIGwyLnkpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnkgPD0gTWF0aC5tYXgobDEueSwgbDIueSkgKyAwLjAwMDAwMTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmVzPFQgZXh0ZW5kcyBQb2ludD4ocDogVCwgczE6IFQsIGUxOiBULCBzMjogVCwgZTI6IFQpIHtcclxuICAgIHJldHVybiBwb2ludEluTGluZShwLCBzMSwgZTEpICYmIHBvaW50SW5MaW5lKHAsIHMyLCBlMik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMaW5lc0ludGVyc2VjdFBvaW50PFQgZXh0ZW5kcyBQb2ludD4oczE6IFQsIGUxOiBULCBzMjogVCwgZTI6IFQpIHtcclxuICAgIC8vIGNvbnN0IHMxID0gTWF0aC5taW4oUzEsIClcclxuICAgIGNvbnN0IEExID0gZTEueS1zMS55O1xyXG4gICAgY29uc3QgQjEgPSBzMS54LWUxLng7XHJcbiAgICBjb25zdCBBMiA9IGUyLnktczIueTtcclxuICAgIGNvbnN0IEIyID0gczIueC1lMi54O1xyXG5cclxuICAgIC8vIEdldCBkZWx0YSBhbmQgY2hlY2sgaWYgdGhlIGxpbmVzIGFyZSBwYXJhbGxlbFxyXG4gICAgY29uc3QgZGVsdGEgPSBBMSpCMiAtIEEyKkIxO1xyXG4gICAgaWYoZGVsdGEgPT09IDApIHJldHVybiB7aW50ZXJzZWN0OiBudWxsLCBwYXJhbGxlbDogdHJ1ZX07XHJcblxyXG4gICAgY29uc3QgQzIgPSBBMipzMi54K0IyKnMyLnk7XHJcbiAgICBjb25zdCBDMSA9IEExKnMxLngrQjEqczEueTtcclxuICAgIC8vaW52ZXJ0IGRlbHRhIHRvIG1ha2UgZGl2aXNpb24gY2hlYXBlclxyXG4gICAgY29uc3QgaW52ZGVsdGEgPSAxL2RlbHRhO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdCA9IDxUPnt4OiAoQjIqQzEgLSBCMSpDMikqaW52ZGVsdGEsIHk6IChBMSpDMiAtIEEyKkMxKSppbnZkZWx0YX07XHJcbiAgICBpZiAoIXBvaW50SW5MaW5lcyhpbnRlcnNlY3QsIHMxLCBlMSwgczIsIGUyKSlcclxuICAgICAgICByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IGZhbHNlfTtcclxuICAgIHJldHVybiB7aW50ZXJzZWN0OiBpbnRlcnNlY3QsIHBhcmFsbGVsOiBmYWxzZX07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQb2ludERpc3RhbmNlKHAxOiBQb2ludCwgcDI6IFBvaW50KSB7XHJcbiAgICBjb25zdCBhID0gcDEueCAtIHAyLng7XHJcbiAgICBjb25zdCBiID0gcDEueSAtIHAyLnk7XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCBhKmEgKyBiKmIgKTtcclxufSIsImltcG9ydCB7Z2V0VW5pdERpc3RhbmNlLCBnMmwsIGcybHosIGcybHIsIGcybHgsIGcybHl9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7R2xvYmFsUG9pbnR9IGZyb20gXCIuL2dlb21cIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgTG9jYXRpb25PcHRpb25zLCBTZXJ2ZXJTaGFwZSB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVzL3NoYXBlXCI7XHJcbmltcG9ydCBDaXJjbGUgZnJvbSBcIi4vc2hhcGVzL2NpcmNsZVwiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL3NoYXBlcy9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IHsgY3JlYXRlU2hhcGVGcm9tRGljdCB9IGZyb20gXCIuL3NoYXBlcy91dGlsc1wiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXJNYW5hZ2VyIHtcclxuICAgIGxheWVyczogTGF5ZXJbXSA9IFtdO1xyXG4gICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIHNlbGVjdGVkTGF5ZXI6IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgVVVJRE1hcDogTWFwPHN0cmluZywgU2hhcGU+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIC8vIFJlZnJlc2ggaW50ZXJ2YWwgYW5kIHJlZHJhdyBzZXR0ZXIuXHJcbiAgICBpbnRlcnZhbCA9IDMwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBsbS5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGxtLmxheWVyc1tpXS5kcmF3KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLmludGVydmFsKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRPcHRpb25zKG9wdGlvbnM6IExvY2F0aW9uT3B0aW9ucyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChcInVuaXRTaXplXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRVbml0U2l6ZShvcHRpb25zLnVuaXRTaXplKTtcclxuICAgICAgICBpZiAoXCJ1c2VHcmlkXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRVc2VHcmlkKG9wdGlvbnMudXNlR3JpZCk7XHJcbiAgICAgICAgaWYgKFwiZnVsbEZPV1wiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0RnVsbEZPVyhvcHRpb25zLmZ1bGxGT1cpO1xyXG4gICAgICAgIGlmICgnZm93T3BhY2l0eScgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRGT1dPcGFjaXR5KG9wdGlvbnMuZm93T3BhY2l0eSk7XHJcbiAgICAgICAgaWYgKFwiZm93Q29sb3VyXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRXaWR0aCh3aWR0aDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEhlaWdodChoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRMYXllcihsYXllcjogTGF5ZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcclxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExheWVyID09PSBcIlwiICYmIGxheWVyLnNlbGVjdGFibGUpIHRoaXMuc2VsZWN0ZWRMYXllciA9IGxheWVyLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzTGF5ZXIobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzLnNvbWUobCA9PiBsLm5hbWUgPT09IG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldExheWVyKG5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICBuYW1lID0gKG5hbWUgPT09IHVuZGVmaW5lZCkgPyB0aGlzLnNlbGVjdGVkTGF5ZXIgOiBuYW1lO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLm5hbWUgPT09IG5hbWUpIHJldHVybiB0aGlzLmxheWVyc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy90b2RvIHJlbmFtZSB0byBzZWxlY3RMYXllclxyXG4gICAgc2V0TGF5ZXIobmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoZm91bmQgJiYgbGF5ZXIubmFtZSAhPT0gJ2ZvdycpIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDAuMztcclxuICAgICAgICAgICAgZWxzZSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAxLjA7XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbGF5ZXIubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbG0uc2VsZWN0ZWRMYXllciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEdyaWRMYXllcigpOiBMYXllcnx1bmRlZmluZWQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldExheWVyKFwiZ3JpZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3R3JpZCgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMuZ2V0R3JpZExheWVyKCk7XHJcbiAgICAgICAgaWYgKGxheWVyID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjb25zdCBjdHggPSBsYXllci5jdHg7XHJcbiAgICAgICAgbGF5ZXIuY2xlYXIoKTtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIud2lkdGg7IGkgKz0gU2V0dGluZ3MuZ3JpZFNpemUgKiBTZXR0aW5ncy56b29tRmFjdG9yKSB7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oaSArIChTZXR0aW5ncy5wYW5YICUgU2V0dGluZ3MuZ3JpZFNpemUpICogU2V0dGluZ3Muem9vbUZhY3RvciwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8oaSArIChTZXR0aW5ncy5wYW5YICUgU2V0dGluZ3MuZ3JpZFNpemUpICogU2V0dGluZ3Muem9vbUZhY3RvciwgbGF5ZXIuaGVpZ2h0KTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbygwLCBpICsgKFNldHRpbmdzLnBhblkgJSBTZXR0aW5ncy5ncmlkU2l6ZSkgKiBTZXR0aW5ncy56b29tRmFjdG9yKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyhsYXllci53aWR0aCwgaSArIChTZXR0aW5ncy5wYW5ZICUgU2V0dGluZ3MuZ3JpZFNpemUpICogU2V0dGluZ3Muem9vbUZhY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lTWFuYWdlci5ncmlkQ29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIGxheWVyLnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5oYXNMYXllcihcImZvd1wiKSlcclxuICAgICAgICAgICAgdGhpcy5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRHcmlkU2l6ZShncmlkU2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdyaWRTaXplICE9PSBncmlkU2l6ZSkge1xyXG4gICAgICAgICAgICBncmlkU2l6ZSA9IGdyaWRTaXplO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICQoJyNncmlkU2l6ZUlucHV0JykudmFsKGdyaWRTaXplKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VW5pdFNpemUodW5pdFNpemU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGlmICh1bml0U2l6ZSAhPT0gU2V0dGluZ3MudW5pdFNpemUpIHtcclxuICAgICAgICAgICAgU2V0dGluZ3MudW5pdFNpemUgPSB1bml0U2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjdW5pdFNpemVJbnB1dCcpLnZhbCh1bml0U2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVzZUdyaWQodXNlR3JpZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh1c2VHcmlkICE9PSBTZXR0aW5ncy51c2VHcmlkKSB7XHJcbiAgICAgICAgICAgIFNldHRpbmdzLnVzZUdyaWQgPSB1c2VHcmlkO1xyXG4gICAgICAgICAgICBpZiAodXNlR3JpZClcclxuICAgICAgICAgICAgICAgICQoJyNncmlkLWxheWVyJykuc2hvdygpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLmhpZGUoKTtcclxuICAgICAgICAgICAgJCgnI3VzZUdyaWRJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIHVzZUdyaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRGdWxsRk9XKGZ1bGxGT1c6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZnVsbEZPVyAhPT0gU2V0dGluZ3MuZnVsbEZPVykge1xyXG4gICAgICAgICAgICBTZXR0aW5ncy5mdWxsRk9XID0gZnVsbEZPVztcclxuICAgICAgICAgICAgY29uc3QgZm93bCA9IHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAkKCcjdXNlRk9XSW5wdXQnKS5wcm9wKFwiY2hlY2tlZFwiLCBmdWxsRk9XKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Rk9XT3BhY2l0eShmb3dPcGFjaXR5OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBTZXR0aW5ncy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcclxuICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICQoJyNmb3dPcGFjaXR5JykudmFsKGZvd09wYWNpdHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubGF5ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXIge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgd2lkdGg6IG51bWJlcjtcclxuICAgIGhlaWdodDogbnVtYmVyO1xyXG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHNlbGVjdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHBsYXllcl9lZGl0YWJsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFdoZW4gc2V0IHRvIGZhbHNlLCB0aGUgbGF5ZXIgd2lsbCBiZSByZWRyYXduIG9uIHRoZSBuZXh0IHRpY2tcclxuICAgIHZhbGlkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAvLyBUaGUgY29sbGVjdGlvbiBvZiBzaGFwZXMgdGhhdCB0aGlzIGxheWVyIGNvbnRhaW5zLlxyXG4gICAgLy8gVGhlc2UgYXJlIG9yZGVyZWQgb24gYSBkZXB0aCBiYXNpcy5cclxuICAgIHNoYXBlczogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIENvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgYXJlIGN1cnJlbnRseSBzZWxlY3RlZFxyXG4gICAgc2VsZWN0aW9uOiBTaGFwZVtdID0gW107XHJcblxyXG4gICAgLy8gRXh0cmEgc2VsZWN0aW9uIGhpZ2hsaWdodGluZyBzZXR0aW5nc1xyXG4gICAgc2VsZWN0aW9uQ29sb3IgPSAnI0NDMDAwMCc7XHJcbiAgICBzZWxlY3Rpb25XaWR0aCA9IDI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKHNraXBMaWdodFVwZGF0ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIXNraXBMaWdodFVwZGF0ZSAmJiB0aGlzLm5hbWUgIT09IFwiZm93XCIgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICBzaGFwZS5sYXllciA9IHRoaXMubmFtZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKHNoYXBlKTtcclxuICAgICAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgaWYgKHNoYXBlLmFubm90YXRpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5wdXNoKHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcImFkZCBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaGFwZSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRTaGFwZXMoc2hhcGVzOiBTZXJ2ZXJTaGFwZVtdKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgdDogU2hhcGVbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpO1xyXG4gICAgICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNoLmxheWVyID0gc2VsZi5uYW1lO1xyXG4gICAgICAgICAgICBzaC5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICBzaC5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoc2guYW5ub3RhdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5wdXNoKHNoLnV1aWQpO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5zZXQoc2hhcGUudXVpZCwgc2gpO1xyXG4gICAgICAgICAgICB0LnB1c2goc2gpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW107IC8vIFRPRE86IEZpeCBrZWVwaW5nIHNlbGVjdGlvbiBvbiB0aG9zZSBpdGVtcyB0aGF0IGFyZSBub3QgbW92ZWQuXHJcbiAgICAgICAgdGhpcy5zaGFwZXMgPSB0O1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UodGhpcy5zaGFwZXMuaW5kZXhPZihzaGFwZSksIDEpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcInJlbW92ZSBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgICAgIGNvbnN0IGxzX2kgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZmluZEluZGV4KGxzID0+IGxzLnNoYXBlID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBjb25zdCBsYl9pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IG1iX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgY29uc3QgYW5faSA9IGdhbWVNYW5hZ2VyLmFubm90YXRpb25zLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgaWYgKGxzX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShsc19pLCAxKTtcclxuICAgICAgICBpZiAobGJfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZShsYl9pLCAxKTtcclxuICAgICAgICBpZiAobWJfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZShtYl9pLCAxKTtcclxuICAgICAgICBpZiAoYW5faSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5zcGxpY2UoYW5faSwgMSk7XHJcblxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmRlbGV0ZShzaGFwZS51dWlkKTtcclxuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnNlbGVjdGlvbi5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAoaW5kZXggPj0gMClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhkb0NsZWFyPzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCAmJiAhdGhpcy52YWxpZCkge1xyXG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcclxuICAgICAgICAgICAgZG9DbGVhciA9IGRvQ2xlYXIgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBkb0NsZWFyO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRvQ2xlYXIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzdGF0ZSA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUudmlzaWJsZUluQ2FudmFzKHN0YXRlLmNhbnZhcykpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5uYW1lID09PSAnZm93JyAmJiBzaGFwZS52aXNpb25PYnN0cnVjdGlvbiAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSEubmFtZSAhPT0gc3RhdGUubmFtZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgc2hhcGUuZHJhdyhjdHgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5zZWxlY3Rpb25XaWR0aDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmIgPSBzZWwuZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBSRUZBQ1RPUiBUSElTIFRPIFNoYXBlLmRyYXdTZWxlY3Rpb24oY3R4KTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlUmVjdChnMmx4KGJiLnJlZlBvaW50LngpLCBnMmx5KGJiLnJlZlBvaW50LnkpLCBiYi53ICogeiwgYmIuaCAqIHopO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB0b3ByaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdChnMmx4KGJiLnJlZlBvaW50LnggKyBiYi53IC0gMyksIGcybHkoYmIucmVmUG9pbnQueSAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChiYi5yZWZQb2ludC54IC0gMyksIGcybHkoYmIucmVmUG9pbnQueSAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJvdHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KGcybHgoYmIucmVmUG9pbnQueCArIGJiLncgLSAzKSwgZzJseShiYi5yZWZQb2ludC55ICsgYmIuaCAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJvdGxlZnRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoZzJseChiYi5yZWZQb2ludC54IC0gMyksIGcybHkoYmIucmVmUG9pbnQueSArIGJiLmggLSAzKSwgNiAqIHosIDYgKiB6KVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlU2hhcGVPcmRlcihzaGFwZTogU2hhcGUsIGRlc3RpbmF0aW9uSW5kZXg6IG51bWJlciwgc3luYzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IG9sZElkeCA9IHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpO1xyXG4gICAgICAgIGlmIChvbGRJZHggPT09IGRlc3RpbmF0aW9uSW5kZXgpIHJldHVybjtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2Uob2xkSWR4LCAxKTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoZGVzdGluYXRpb25JbmRleCwgMCwgc2hhcGUpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcIm1vdmVTaGFwZU9yZGVyXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIGluZGV4OiBkZXN0aW5hdGlvbkluZGV4fSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblNoYXBlTW92ZShzaGFwZT86IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRMYXllciBleHRlbmRzIExheWVyIHtcclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dMYXllciBleHRlbmRzIExheWVyIHtcclxuXHJcbiAgICBhZGRTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc3VwZXIuYWRkU2hhcGUoc2hhcGUsIHN5bmMsIHRlbXBvcmFyeSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0U2hhcGVzKHNoYXBlczogU2VydmVyU2hhcGVbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGMgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgc2hhcGUuZmlsbCA9IGM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3VwZXIuc2V0U2hhcGVzKHNoYXBlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU6IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLm9uU2hhcGVNb3ZlKHNoYXBlKTtcclxuICAgIH07XHJcblxyXG4gICAgZHJhdygpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdfb3AgPSBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgICAgICBpZiAoU2V0dGluZ3MuZnVsbEZPVykge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2dhbHBoYSA9IHRoaXMuY3R4Lmdsb2JhbEFscGhhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJjb3B5XCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBTZXR0aW5ncy5mb3dPcGFjaXR5O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gb2dhbHBoYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9yaWdfb3A7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgIHN1cGVyLmRyYXcoIVNldHRpbmdzLmZ1bGxGT1cpO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJ0b2tlbnNcIikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcInRva2Vuc1wiKSEuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaC5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYiA9IHNoLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IGcybChzaC5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxtID0gMC44ICogZzJseihiYi53KTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAobHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxzLnNoYXBlKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPbGQgbGlnaHRzb3VyY2Ugc3RpbGwgbGluZ2VyaW5nIGluIHRoZSBnYW1lTWFuYWdlciBsaXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbGVuZ3RoID0gZ2V0VW5pdERpc3RhbmNlKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsY2VudGVyID0gZzJsKGNlbnRlcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gbmV3IENpcmNsZShjZW50ZXIsIGF1cmFfbGVuZ3RoKS5nZXRCb3VuZGluZ0JveCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNvbGxlY3QgYWxsIGxpZ2h0YmxvY2tlcnMgdGhhdCBhcmUgaW5zaWRlL2Nyb3NzIG91ciBhdXJhXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHRvIHByZXZlbnQgYXMgbWFueSByYXkgY2FsY3VsYXRpb25zIGFzIHBvc3NpYmxlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbF9saWdodGJsb2NrZXJzOiBCb3VuZGluZ1JlY3RbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5mb3JFYWNoKGZ1bmN0aW9uIChsYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYiA9PT0gc2gudXVpZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX3NoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbGJfc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfYmIuaW50ZXJzZWN0c1dpdGgoYmJveCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2xpZ2h0YmxvY2tlcnMucHVzaChsYl9iYik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyY19zdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FzdCByYXlzIGluIGV2ZXJ5IGRlZ3JlZVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYW5nbGUgPSAwOyBhbmdsZSA8IDIgKiBNYXRoLlBJOyBhbmdsZSArPSAoMSAvIDE4MCkgKiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaGl0IHdpdGggb2JzdHJ1Y3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgaGl0OiB7aW50ZXJzZWN0OiBHbG9iYWxQb2ludHxudWxsLCBkaXN0YW5jZTpudW1iZXJ9ID0ge2ludGVyc2VjdDogbnVsbCwgZGlzdGFuY2U6IEluZmluaXR5fTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0OiBudWxsfEJvdW5kaW5nUmVjdCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPGxvY2FsX2xpZ2h0YmxvY2tlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfYmIgPSBsb2NhbF9saWdodGJsb2NrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsYl9iYi5nZXRJbnRlcnNlY3RXaXRoTGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogY2VudGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBuZXcgR2xvYmFsUG9pbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXIueSArIGF1cmFfbGVuZ3RoICogTWF0aC5zaW4oYW5nbGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmludGVyc2VjdCAhPT0gbnVsbCAmJiByZXN1bHQuZGlzdGFuY2UgPCBoaXQuZGlzdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlX2hpdCA9IGxiX2JiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgbm8gaGl0LCBjaGVjayBpZiB3ZSBjb21lIGZyb20gYSBwcmV2aW91cyBoaXQgc28gdGhhdCB3ZSBjYW4gZ28gYmFjayB0byB0aGUgYXJjXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpdC5pbnRlcnNlY3QgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IGFuZ2xlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzdCA9IGcybChuZXcgR2xvYmFsUG9pbnQoY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSwgY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGhpdCAsIGZpcnN0IGZpbmlzaCBhbnkgb25nb2luZyBhcmMsIHRoZW4gbW92ZSB0byB0aGUgaW50ZXJzZWN0aW9uIHBvaW50XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgZzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCBhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFYID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGVfaGl0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhWCA9IChzaGFwZV9oaXQudyAvIDEwKSAqIE1hdGguY29zKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFZID0gKHNoYXBlX2hpdC5oIC8gMTApICogTWF0aC5zaW4oYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoIXNoYXBlX2hpdC5jb250YWlucyhoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgsIGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSwgZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc3QgPSBnMmwobmV3IEdsb2JhbFBvaW50KGhpdC5pbnRlcnNlY3QueCArIGV4dHJhWCwgaGl0LmludGVyc2VjdC55ICsgZXh0cmFZKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhkZXN0LngsIGRlc3QueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ICE9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCBnMmxyKGF1cmEudmFsdWUpLCBhcmNfc3RhcnQsIDIgKiBNYXRoLlBJKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbG0gPSBnMmxyKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsIDAsIDAsIDEpJyk7XHJcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgIC8vIGN0eC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMCwgMCwgMSlcIjtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFTZXR0aW5ncy5mdWxsRk9XKTtcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9yaWdfb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHNvY2tldCBmcm9tICcuL3NvY2tldCdcclxuaW1wb3J0IHsgbDJnIH0gZnJvbSBcIi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgTGF5ZXJNYW5hZ2VyLCBMYXllciwgR3JpZExheWVyLCBGT1dMYXllciB9IGZyb20gXCIuL2xheWVyc1wiO1xyXG5pbXBvcnQgeyBDbGllbnRPcHRpb25zLCBCb2FyZEluZm8sIFNlcnZlclNoYXBlLCBJbml0aWF0aXZlRGF0YSB9IGZyb20gJy4vYXBpX3R5cGVzJztcclxuaW1wb3J0IHsgT3JkZXJlZE1hcCwgZ2V0TW91c2UgfSBmcm9tICcuL3V0aWxzJztcclxuaW1wb3J0IEFzc2V0IGZyb20gJy4vc2hhcGVzL2Fzc2V0JztcclxuaW1wb3J0IHtjcmVhdGVTaGFwZUZyb21EaWN0fSBmcm9tICcuL3NoYXBlcy91dGlscyc7XHJcbmltcG9ydCB7IExvY2FsUG9pbnQsIEdsb2JhbFBvaW50IH0gZnJvbSAnLi9nZW9tJztcclxuaW1wb3J0IFRleHQgZnJvbSAnLi9zaGFwZXMvdGV4dCc7XHJcbmltcG9ydCB7IFRvb2wgfSBmcm9tICcuL3Rvb2xzL3Rvb2wnO1xyXG5pbXBvcnQgeyBJbml0aWF0aXZlVHJhY2tlciB9IGZyb20gJy4vdG9vbHMvaW5pdGlhdGl2ZSc7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSAnLi9zZXR0aW5ncyc7XHJcblxyXG5jbGFzcyBHYW1lTWFuYWdlciB7XHJcbiAgICBJU19ETSA9IGZhbHNlO1xyXG4gICAgcm9vbU5hbWUhOiBzdHJpbmc7XHJcbiAgICByb29tQ3JlYXRvciE6IHN0cmluZztcclxuICAgIGxvY2F0aW9uTmFtZSE6IHN0cmluZztcclxuICAgIHVzZXJuYW1lITogc3RyaW5nO1xyXG4gICAgYm9hcmRfaW5pdGlhbGlzZWQgPSBmYWxzZTtcclxuICAgIGxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgIHNlbGVjdGVkVG9vbDogbnVtYmVyID0gMDtcclxuICAgIHRvb2xzOiBPcmRlcmVkTWFwPHN0cmluZywgVG9vbD4gPSBuZXcgT3JkZXJlZE1hcCgpO1xyXG4gICAgbGlnaHRzb3VyY2VzOiB7IHNoYXBlOiBzdHJpbmcsIGF1cmE6IHN0cmluZyB9W10gPSBbXTtcclxuICAgIGxpZ2h0YmxvY2tlcnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBhbm5vdGF0aW9uczogc3RyaW5nW10gPSBbXTtcclxuICAgIGFubm90YXRpb25UZXh0OiBUZXh0ID0gbmV3IFRleHQobmV3IEdsb2JhbFBvaW50KDAsIDApLCBcIlwiLCBcImJvbGQgMjBweCBzZXJpZlwiKTtcclxuICAgIG1vdmVtZW50YmxvY2tlcnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBncmlkQ29sb3VyID0gJChcIiNncmlkQ29sb3VyXCIpO1xyXG4gICAgZm93Q29sb3VyID0gJChcIiNmb3dDb2xvdXJcIik7XHJcbiAgICBpbml0aWF0aXZlVHJhY2tlciA9IG5ldyBJbml0aWF0aXZlVHJhY2tlcigpO1xyXG4gICAgc2hhcGVTZWxlY3Rpb25EaWFsb2cgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmRpYWxvZyh7XHJcbiAgICAgICAgYXV0b09wZW46IGZhbHNlLFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0pO1xyXG4gICAgaW5pdGlhdGl2ZURpYWxvZyA9ICQoXCIjaW5pdGlhdGl2ZWRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJzE2MHB4J1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5ncmlkQ29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBcInJnYmEoMjU1LDAsMCwgMC41KVwiLFxyXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwgeyAnZ3JpZENvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5mb3dDb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbG9yOiBcInJnYig4MiwgODEsIDgxKVwiLFxyXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGwuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlLmZpbGwgPSBjb2xvdXIudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwgeyAnZm93Q29sb3VyJzogY29sb3VyLnRvUmdiU3RyaW5nKCkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEJvYXJkKHJvb206IEJvYXJkSW5mbyk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcigpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyc2RpdiA9ICQoJyNsYXllcnMnKTtcclxuICAgICAgICBsYXllcnNkaXYuZW1wdHkoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNlbGVjdGRpdiA9ICQoJyNsYXllcnNlbGVjdCcpO1xyXG4gICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoXCJ1bFwiKS5lbXB0eSgpO1xyXG4gICAgICAgIGxldCBzZWxlY3RhYmxlX2xheWVycyA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxtID0gJChcIiNsb2NhdGlvbnMtbWVudVwiKS5maW5kKFwiZGl2XCIpO1xyXG4gICAgICAgIGxtLmNoaWxkcmVuKCkub2ZmKCk7XHJcbiAgICAgICAgbG0uZW1wdHkoKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb20ubG9jYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYyA9ICQoXCI8ZGl2PlwiICsgcm9vbS5sb2NhdGlvbnNbaV0gKyBcIjwvZGl2PlwiKTtcclxuICAgICAgICAgICAgbG0uYXBwZW5kKGxvYyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxtcGx1cyA9ICQoJzxkaXY+PGkgY2xhc3M9XCJmYXMgZmEtcGx1c1wiPjwvaT48L2Rpdj4nKTtcclxuICAgICAgICBsbS5hcHBlbmQobG1wbHVzKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LnRleHRDb250ZW50ID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jbmFtZSA9IHByb21wdChcIk5ldyBsb2NhdGlvbiBuYW1lXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvY25hbWUgIT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJuZXcgbG9jYXRpb25cIiwgbG9jbmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcImNoYW5nZSBsb2NhdGlvblwiLCBlLnRhcmdldC50ZXh0Q29udGVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmJvYXJkLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBuZXdfbGF5ZXIgPSByb29tLmJvYXJkLmxheWVyc1tpXTtcclxuICAgICAgICAgICAgLy8gVUkgY2hhbmdlc1xyXG4gICAgICAgICAgICBsYXllcnNkaXYuYXBwZW5kKFwiPGNhbnZhcyBpZD0nXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiLWxheWVyJyBzdHlsZT0nei1pbmRleDogXCIgKyBpICsgXCInPjwvY2FudmFzPlwiKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5zZWxlY3RhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXh0cmEgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RhYmxlX2xheWVycyA9PT0gMCkgZXh0cmEgPSBcIiBjbGFzcz0nbGF5ZXItc2VsZWN0ZWQnXCI7XHJcbiAgICAgICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKCd1bCcpLmFwcGVuZChcIjxsaSBpZD0nc2VsZWN0LVwiICsgbmV3X2xheWVyLm5hbWUgKyBcIidcIiArIGV4dHJhICsgXCI+PGEgaHJlZj0nIyc+XCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZV9sYXllcnMgKz0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+JCgnIycgKyBuZXdfbGF5ZXIubmFtZSArICctbGF5ZXInKVswXTtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIFN0YXRlIGNoYW5nZXNcclxuICAgICAgICAgICAgbGV0IGw6IExheWVyO1xyXG4gICAgICAgICAgICBpZiAobmV3X2xheWVyLmdyaWQpXHJcbiAgICAgICAgICAgICAgICBsID0gbmV3IEdyaWRMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAobmV3X2xheWVyLm5hbWUgPT09ICdmb3cnKVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBGT1dMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICAgICAgbC5zZWxlY3RhYmxlID0gbmV3X2xheWVyLnNlbGVjdGFibGU7XHJcbiAgICAgICAgICAgIGwucGxheWVyX2VkaXRhYmxlID0gbmV3X2xheWVyLnBsYXllcl9lZGl0YWJsZTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmFkZExheWVyKGwpO1xyXG4gICAgICAgICAgICBpZiAobmV3X2xheWVyLmdyaWQpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShuZXdfbGF5ZXIuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgICAgICQoXCIjZ3JpZC1sYXllclwiKS5kcm9wcGFibGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdDogXCIuZHJhZ2dhYmxlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZHJvcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIgdG8gZHJvcCB0aGUgdG9rZW4gb25cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgakNhbnZhcyA9ICQobC5jYW52YXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoakNhbnZhcy5sZW5ndGggPT09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJDYW52YXMgbWlzc2luZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSBqQ2FudmFzLm9mZnNldCgpITtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IG5ldyBMb2NhbFBvaW50KHVpLm9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQsIHVpLm9mZnNldC50b3AgLSBvZmZzZXQudG9wKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnggPCBzZXR0aW5nc19tZW51LndpZHRoKCkhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSAmJiBsb2MueSA8IGxvY2F0aW9uc19tZW51LndpZHRoKCkhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWR0aCA9IHVpLmhlbHBlclswXS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGVpZ2h0ID0gdWkuaGVscGVyWzBdLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2xvYyA9IGwyZyhsb2MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWcgPSA8SFRNTEltYWdlRWxlbWVudD51aS5kcmFnZ2FibGVbMF0uY2hpbGRyZW5bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gbmV3IEFzc2V0KGltZywgd2xvYywgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQuc3JjID0gbmV3IFVSTChpbWcuc3JjKS5wYXRobmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChTZXR0aW5ncy51c2VHcmlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IFNldHRpbmdzLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQucmVmUG9pbnQueCA9IE1hdGgucm91bmQoYXNzZXQucmVmUG9pbnQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQucmVmUG9pbnQueSA9IE1hdGgucm91bmQoYXNzZXQucmVmUG9pbnQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQudyA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbC5hZGRTaGFwZShhc3NldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsLnNldFNoYXBlcyhuZXdfbGF5ZXIuc2hhcGVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb3JjZSB0aGUgY29ycmVjdCBvcGFjaXR5IHJlbmRlciBvbiBvdGhlciBsYXllcnMuXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpIS5uYW1lKTtcclxuICAgICAgICAvLyBzb2NrZXQuZW1pdChcImNsaWVudCBpbml0aWFsaXNlZFwiKTtcclxuICAgICAgICB0aGlzLmJvYXJkX2luaXRpYWxpc2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGFibGVfbGF5ZXJzID4gMSkge1xyXG4gICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwibGlcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5pZC5zcGxpdChcIi1cIilbMV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSBsYXllcnNlbGVjdGRpdi5maW5kKFwiI3NlbGVjdC1cIiArIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKTtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lICE9PSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2VsZWN0ZWRMYXllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBvbGQucmVtb3ZlQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIobmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNlcnZlclNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHNoLCBmYWxzZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVNoYXBlKHNoYXBlOiBTZXJ2ZXJTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biB0eXBlICR7c2hhcGUudHlwZX0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBzaCk7XHJcbiAgICAgICAgcmVhbF9zaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKHJlYWxfc2hhcGUubGF5ZXIpIS5vblNoYXBlTW92ZShyZWFsX3NoYXBlKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVTaGFwZShkYXRhOiB7c2hhcGU6IFNlcnZlclNoYXBlOyByZWRyYXc6IGJvb2xlYW47fSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChkYXRhLnNoYXBlLCB0cnVlKTtcclxuICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIHR5cGUgJHtkYXRhLnNoYXBlLnR5cGV9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSwgc2gpO1xyXG4gICAgICAgIHNoYXBlLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgc2hhcGUuc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICBpZiAoZGF0YS5yZWRyYXcpXHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKGRhdGEuc2hhcGUubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRJbml0aWF0aXZlKGRhdGE6IEluaXRpYXRpdmVEYXRhW10pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmluaXRpYXRpdmVUcmFja2VyLmRhdGEgPSBkYXRhO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhdGl2ZVRyYWNrZXIucmVkcmF3KCk7XHJcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgdGhpcy5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2xpZW50T3B0aW9ucyhvcHRpb25zOiBDbGllbnRPcHRpb25zKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ3JpZENvbG91cilcclxuICAgICAgICAgICAgdGhpcy5ncmlkQ29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZ3JpZENvbG91cik7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZm93Q29sb3VyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbk9wdGlvbnMpIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25PcHRpb25zW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jID0gb3B0aW9ucy5sb2NhdGlvbk9wdGlvbnNbYCR7Z2FtZU1hbmFnZXIucm9vbU5hbWV9LyR7Z2FtZU1hbmFnZXIucm9vbUNyZWF0b3J9LyR7Z2FtZU1hbmFnZXIubG9jYXRpb25OYW1lfWBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYy5wYW5YKVxyXG4gICAgICAgICAgICAgICAgICAgIFNldHRpbmdzLnBhblggPSBsb2MucGFuWDtcclxuICAgICAgICAgICAgICAgIGlmIChsb2MucGFuWSlcclxuICAgICAgICAgICAgICAgICAgICBTZXR0aW5ncy5wYW5ZID0gbG9jLnBhblk7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9jLnpvb21GYWN0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBTZXR0aW5ncy56b29tRmFjdG9yID0gbG9jLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiN6b29tZXJcIikuc2xpZGVyKHsgdmFsdWU6IDEgLyBsb2Muem9vbUZhY3RvciB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldEdyaWRMYXllcigpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmxldCBnYW1lTWFuYWdlciA9IG5ldyBHYW1lTWFuYWdlcigpO1xyXG4oPGFueT53aW5kb3cpLmdhbWVNYW5hZ2VyID0gZ2FtZU1hbmFnZXI7XHJcbig8YW55PndpbmRvdykuR1AgPSBHbG9iYWxQb2ludDtcclxuKDxhbnk+d2luZG93KS5Bc3NldCA9IEFzc2V0O1xyXG5cclxuLy8gKioqKiBTRVRVUCBVSSAqKioqXHJcblxyXG4vLyBwcmV2ZW50IGRvdWJsZSBjbGlja2luZyB0ZXh0IHNlbGVjdGlvblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59KTtcclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlckRvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgICRtZW51LmhpZGUoKTtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZURvd24oZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlck1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZU1vdmUoZSk7XHJcbiAgICAvLyBBbm5vdGF0aW9uIGhvdmVyXHJcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgIGZvciAobGV0IGk9MDsgaSA8IGdhbWVNYW5hZ2VyLmFubm90YXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IGdhbWVNYW5hZ2VyLmFubm90YXRpb25zW2ldO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZHJhd1wiKSl7XHJcbiAgICAgICAgICAgIGNvbnN0IGRyYXdfbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmFubm90YXRpb25UZXh0LmxheWVyICE9PSBcImRyYXdcIilcclxuICAgICAgICAgICAgICAgIGRyYXdfbGF5ZXIuYWRkU2hhcGUoZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQsIGZhbHNlKTtcclxuICAgICAgICAgICAgY29uc3Qgc2hhcGUgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBpZiAoc2hhcGUuY29udGFpbnMobDJnKGdldE1vdXNlKGUpKSkpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmFubm90YXRpb25UZXh0LnRleHQgPSBzaGFwZS5hbm5vdGF0aW9uO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQucmVmUG9pbnQgPSBsMmcobmV3IExvY2FsUG9pbnQoKGRyYXdfbGF5ZXIuY2FudmFzLndpZHRoIC8gMikgLSBzaGFwZS5hbm5vdGF0aW9uLmxlbmd0aC8yLCA1MCkpO1xyXG4gICAgICAgICAgICAgICAgZHJhd19sYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKCFmb3VuZCAmJiBnYW1lTWFuYWdlci5hbm5vdGF0aW9uVGV4dC50ZXh0ICE9PSAnJyl7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuYW5ub3RhdGlvblRleHQudGV4dCA9ICcnO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlclVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VVcChlKTtcclxufVxyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgb25Qb2ludGVyRG93bik7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uUG9pbnRlck1vdmUpO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Qb2ludGVyVXApO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmIChlLmJ1dHRvbiAhPT0gMiB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Db250ZXh0TWVudShlKTtcclxufSk7XHJcblxyXG4kKFwiI3pvb21lclwiKS5zbGlkZXIoe1xyXG4gICAgb3JpZW50YXRpb246IFwidmVydGljYWxcIixcclxuICAgIG1pbjogMC41LFxyXG4gICAgbWF4OiA1LjAsXHJcbiAgICBzdGVwOiAwLjEsXHJcbiAgICB2YWx1ZTogU2V0dGluZ3Muem9vbUZhY3RvcixcclxuICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IG5ld1ogPSAxIC8gdWkudmFsdWUhO1xyXG4gICAgICAgIGNvbnN0IG9yaWdYID0gd2luZG93LmlubmVyV2lkdGggLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdYID0gd2luZG93LmlubmVyV2lkdGggLyBuZXdaO1xyXG4gICAgICAgIGNvbnN0IG9yaWdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gb3JpZ1o7XHJcbiAgICAgICAgY29uc3QgbmV3WSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIG5ld1o7XHJcbiAgICAgICAgU2V0dGluZ3Muem9vbUZhY3RvciA9IG5ld1o7XHJcbiAgICAgICAgU2V0dGluZ3MucGFuWCAtPSAob3JpZ1ggLSBuZXdYKSAvIDI7XHJcbiAgICAgICAgU2V0dGluZ3MucGFuWSAtPSAob3JpZ1kgLSBuZXdZKSAvIDI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHtcclxuICAgICAgICAgICAgbG9jYXRpb25PcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBbYCR7Z2FtZU1hbmFnZXIucm9vbU5hbWV9LyR7Z2FtZU1hbmFnZXIucm9vbUNyZWF0b3J9LyR7Z2FtZU1hbmFnZXIubG9jYXRpb25OYW1lfWBdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFuWDogU2V0dGluZ3MucGFuWCxcclxuICAgICAgICAgICAgICAgICAgICBwYW5ZOiBTZXR0aW5ncy5wYW5ZLFxyXG4gICAgICAgICAgICAgICAgICAgIHpvb21GYWN0b3I6IG5ld1osXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG4kbWVudS5oaWRlKCk7XHJcblxyXG5jb25zdCBzZXR0aW5nc19tZW51ID0gJChcIiNtZW51XCIpITtcclxuY29uc3QgbG9jYXRpb25zX21lbnUgPSAkKFwiI2xvY2F0aW9ucy1tZW51XCIpITtcclxuY29uc3QgbGF5ZXJfbWVudSA9ICQoXCIjbGF5ZXJzZWxlY3RcIikhO1xyXG4kKFwiI3NlbGVjdGlvbi1tZW51XCIpLmhpZGUoKTtcclxuXHJcbiQoJyNybS1zZXR0aW5ncycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gb3JkZXIgb2YgYW5pbWF0aW9uIGlzIGltcG9ydGFudCwgaXQgb3RoZXJ3aXNlIHdpbGwgc29tZXRpbWVzIHNob3cgYSBzbWFsbCBnYXAgYmV0d2VlbiB0aGUgdHdvIG9iamVjdHNcclxuICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiB9KTtcclxuICAgICAgICBzZXR0aW5nc19tZW51LmFuaW1hdGUoeyB3aWR0aDogJ3RvZ2dsZScgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiLCB3aWR0aDogXCIrPTIwMHB4XCIgfSk7XHJcbiAgICAgICAgbGF5ZXJfbWVudS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgbGVmdDogXCIrPTIwMHB4XCIsIHdpZHRoOiBcIi09MjAwcHhcIiB9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG4kKCcjcm0tbG9jYXRpb25zJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyB0b3A6IFwiLT0xMDBweFwiIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBoZWlnaHQ6ICd0b2dnbGUnIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgaGVpZ2h0OiAndG9nZ2xlJyB9KTtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyB0b3A6IFwiKz0xMDBweFwiIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRXaWR0aCh3aW5kb3cuaW5uZXJXaWR0aCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0SGVpZ2h0KHdpbmRvdy5pbm5lckhlaWdodCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5cclxuJCgnYm9keScpLmtleXVwKGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAoZS5rZXlDb2RlID09PSA0NiAmJiBlLnRhcmdldC50YWdOYW1lICE9PSBcIklOUFVUXCIpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIgc2VsZWN0ZWQgZm9yIGRlbGV0ZSBvcGVyYXRpb25cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBsLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgbC5yZW1vdmVTaGFwZShzZWwsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShzZWwudXVpZCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoXCIjZ3JpZFNpemVJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgZ3MgPSBwYXJzZUludCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBncmlkc2l6ZVwiLCBncyk7XHJcbn0pO1xyXG5cclxuJChcIiN1bml0U2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1cyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVuaXRTaXplKHVzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICd1bml0U2l6ZSc6IHVzIH0pO1xyXG59KTtcclxuJChcIiN1c2VHcmlkSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVnID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVzZUdyaWQodWcpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VzZUdyaWQnOiB1ZyB9KTtcclxufSk7XHJcbiQoXCIjdXNlRk9XSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVmID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZ1bGxGT1codWYpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ2Z1bGxGT1cnOiB1ZiB9KTtcclxufSk7XHJcbiQoXCIjZm93T3BhY2l0eVwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgbGV0IGZvID0gcGFyc2VGbG9hdCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGlmIChpc05hTihmbykpIHtcclxuICAgICAgICAkKFwiI2Zvd09wYWNpdHlcIikudmFsKFNldHRpbmdzLmZvd09wYWNpdHkpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChmbyA8IDApIGZvID0gMDtcclxuICAgIGlmIChmbyA+IDEpIGZvID0gMTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGT1dPcGFjaXR5KGZvKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICdmb3dPcGFjaXR5JzogZm8gfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZU1hbmFnZXI7IiwiZXhwb3J0IGNsYXNzIFNldHRpbmdzIHtcclxuICAgIHN0YXRpYyBncmlkU2l6ZSA9IDUwO1xyXG4gICAgc3RhdGljIHVuaXRTaXplID0gNTtcclxuICAgIHN0YXRpYyB1c2VHcmlkID0gdHJ1ZTtcclxuICAgIHN0YXRpYyBmdWxsRk9XID0gZmFsc2U7XHJcbiAgICBzdGF0aWMgZm93T3BhY2l0eSA9IDAuMztcclxuICAgIFxyXG4gICAgc3RhdGljIHpvb21GYWN0b3IgPSAxO1xyXG4gICAgc3RhdGljIHBhblggPSAwO1xyXG4gICAgc3RhdGljIHBhblkgPSAwO1xyXG59IiwiaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL2Jhc2VyZWN0XCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBnMmx4LCBnMmx5LCBnMmx6IH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyQXNzZXQgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBc3NldCBleHRlbmRzIEJhc2VSZWN0IHtcclxuICAgIHR5cGUgPSBcImFzc2V0XCI7XHJcbiAgICBpbWc6IEhUTUxJbWFnZUVsZW1lbnQ7XHJcbiAgICBzcmM6IHN0cmluZyA9ICcnO1xyXG4gICAgY29uc3RydWN0b3IoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCB0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB3LCBoKTtcclxuICAgICAgICBpZiAodXVpZCAhPT0gdW5kZWZpbmVkKSB0aGlzLnV1aWQgPSB1dWlkO1xyXG4gICAgICAgIHRoaXMuaW1nID0gaW1nO1xyXG4gICAgfVxyXG4gICAgYXNEaWN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICBzcmM6IHRoaXMuc3JjXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlckFzc2V0KSB7XHJcbiAgICAgICAgc3VwZXIuZnJvbURpY3QoZGF0YSk7XHJcbiAgICAgICAgdGhpcy5zcmMgPSBkYXRhLnNyYztcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgZzJseCh0aGlzLnJlZlBvaW50LngpLCBnMmx5KHRoaXMucmVmUG9pbnQueSksIGcybHoodGhpcy53KSwgZzJseih0aGlzLmgpKTtcclxuICAgIH1cclxuICAgIGdldEluaXRpYXRpdmVSZXByKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHV1aWQ6IHRoaXMudXVpZCxcclxuICAgICAgICAgICAgdmlzaWJsZTogIWdhbWVNYW5hZ2VyLklTX0RNLFxyXG4gICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgIHNyYzogdGhpcy5zcmMsXHJcbiAgICAgICAgICAgIG93bmVyczogdGhpcy5vd25lcnNcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQsIFZlY3RvciwgTG9jYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGcybHgsIGcybHksIGwyZywgbDJneSwgbDJneCB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgQmFzZVJlY3QgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB3OiBudW1iZXI7XHJcbiAgICBoOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih0b3BsZWZ0LCB1dWlkKTtcclxuICAgICAgICB0aGlzLncgPSB3O1xyXG4gICAgICAgIHRoaXMuaCA9IGg7XHJcbiAgICB9XHJcbiAgICBnZXRCYXNlRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihzdXBlci5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHc6IHRoaXMudyxcclxuICAgICAgICAgICAgaDogdGhpcy5oXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQsIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggPD0gcG9pbnQueCAmJiAodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA+PSBwb2ludC54ICYmXHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA8PSBwb2ludC55ICYmICh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpID49IHBvaW50Lnk7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgc3dpdGNoIChjb3JuZXIpIHtcclxuICAgICAgICAgICAgY2FzZSAnbmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnbncnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55IC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc3cnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgY2FzZSAnc2UnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCArIHRoaXMudyAtIDMgPD0gcG9pbnQueCAmJiBwb2ludC54IDw9IHRoaXMucmVmUG9pbnQueCArIHRoaXMudyArIDMgJiYgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oIC0gMyA8PSBwb2ludC55ICYmIHBvaW50LnkgPD0gdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oICsgMztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBnZXRDb3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50KTogc3RyaW5nfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJud1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibndcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbiAgICBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IEdsb2JhbFBvaW50KTogR2xvYmFsUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQuYWRkKG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHt4OiB0aGlzLncvMiwgeTogdGhpcy5oLzJ9KSk7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcblxyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gIShnMmx4KHRoaXMucmVmUG9pbnQueCkgPiBjYW52YXMud2lkdGggfHwgZzJseSh0aGlzLnJlZlBvaW50LnkpID4gY2FudmFzLmhlaWdodCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGcybHgodGhpcy5yZWZQb2ludC54ICsgdGhpcy53KSA8IDAgfHwgZzJseSh0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpIDwgMCk7XHJcbiAgICB9XHJcbiAgICBzbmFwVG9HcmlkKCkge1xyXG4gICAgICAgIGNvbnN0IGdzID0gU2V0dGluZ3MuZ3JpZFNpemU7XHJcbiAgICAgICAgY29uc3QgY2VudGVyID0gdGhpcy5jZW50ZXIoKTtcclxuICAgICAgICBjb25zdCBteCA9IGNlbnRlci54O1xyXG4gICAgICAgIGNvbnN0IG15ID0gY2VudGVyLnk7XHJcbiAgICAgICAgaWYgKCh0aGlzLncgLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueCA9IE1hdGgucm91bmQobXggLyBncykgKiBncyAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC54ID0gKE1hdGgucm91bmQoKG14ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICgodGhpcy5oIC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgPSBNYXRoLnJvdW5kKG15IC8gZ3MpICogZ3MgLSB0aGlzLmggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA9IChNYXRoLnJvdW5kKChteSArIChncyAvIDIpKSAvIGdzKSAtICgxIC8gMikpICogZ3MgLSB0aGlzLmggLyAyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJlc2l6ZVRvR3JpZCgpIHtcclxuICAgICAgICBjb25zdCBncyA9IFNldHRpbmdzLmdyaWRTaXplO1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQueCA9IE1hdGgucm91bmQodGhpcy5yZWZQb2ludC54IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gTWF0aC5yb3VuZCh0aGlzLnJlZlBvaW50LnkgLyBncykgKiBncztcclxuICAgICAgICB0aGlzLncgPSBNYXRoLm1heChNYXRoLnJvdW5kKHRoaXMudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgdGhpcy5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZCh0aGlzLmggLyBncykgKiBncywgZ3MpO1xyXG4gICAgfVxyXG4gICAgcmVzaXplKHJlc2l6ZWRpcjogc3RyaW5nLCBwb2ludDogTG9jYWxQb2ludCkge1xyXG4gICAgICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGlmIChyZXNpemVkaXIgPT09ICdudycpIHtcclxuICAgICAgICAgICAgdGhpcy53ID0gZzJseCh0aGlzLnJlZlBvaW50LngpICsgdGhpcy53ICogeiAtIHBvaW50Lng7XHJcbiAgICAgICAgICAgIHRoaXMuaCA9IGcybHkodGhpcy5yZWZQb2ludC55KSArIHRoaXMuaCAqIHogLSBwb2ludC55O1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50ID0gbDJnKHBvaW50KTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc2l6ZWRpciA9PT0gJ25lJykge1xyXG4gICAgICAgICAgICB0aGlzLncgPSBwb2ludC54IC0gZzJseCh0aGlzLnJlZlBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLmggPSBnMmx5KHRoaXMucmVmUG9pbnQueSkgKyB0aGlzLmggKiB6IC0gcG9pbnQueTtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55ID0gbDJneShwb2ludC55KTtcclxuICAgICAgICB9IGVsc2UgaWYgKHJlc2l6ZWRpciA9PT0gJ3NlJykge1xyXG4gICAgICAgICAgICB0aGlzLncgPSBwb2ludC54IC0gZzJseCh0aGlzLnJlZlBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLmggPSBwb2ludC55IC0gZzJseSh0aGlzLnJlZlBvaW50LnkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmVzaXplZGlyID09PSAnc3cnKSB7XHJcbiAgICAgICAgICAgIHRoaXMudyA9IGcybHgodGhpcy5yZWZQb2ludC54KSArIHRoaXMudyAqIHogLSBwb2ludC54O1xyXG4gICAgICAgICAgICB0aGlzLmggPSBwb2ludC55IC0gZzJseSh0aGlzLnJlZlBvaW50LnkpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnggPSBsMmd4KHBvaW50LngpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLncgLz0gejtcclxuICAgICAgICB0aGlzLmggLz0gejtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudyA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC54ICs9IHRoaXMudztcclxuICAgICAgICAgICAgdGhpcy53ID0gTWF0aC5hYnModGhpcy53KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuaCA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55ICs9IHRoaXMuaDtcclxuICAgICAgICAgICAgdGhpcy5oID0gTWF0aC5hYnModGhpcy5oKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBnZXRMaW5lc0ludGVyc2VjdFBvaW50LCBnZXRQb2ludERpc3RhbmNlLCBHbG9iYWxQb2ludCwgVmVjdG9yIH0gZnJvbSBcIi4uL2dlb21cIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJvdW5kaW5nUmVjdCB7XHJcbiAgICB0eXBlID0gXCJib3VuZHJlY3RcIjtcclxuICAgIHJlZlBvaW50OiBHbG9iYWxQb2ludDtcclxuICAgIHc6IG51bWJlcjtcclxuICAgIGg6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBHbG9iYWxQb2ludCwgdzogbnVtYmVyLCBoOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gdG9wbGVmdDtcclxuICAgICAgICB0aGlzLncgPSB3O1xyXG4gICAgICAgIHRoaXMuaCA9IGg7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmUG9pbnQueCA8PSBwb2ludC54ICYmICh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncpID49IHBvaW50LnggJiZcclxuICAgICAgICAgICAgdGhpcy5yZWZQb2ludC55IDw9IHBvaW50LnkgJiYgKHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCkgPj0gcG9pbnQueTtcclxuICAgIH1cclxuXHJcbiAgICBvZmZzZXQodmVjdG9yOiBWZWN0b3I8R2xvYmFsUG9pbnQ+KTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLnJlZlBvaW50LmFkZCh2ZWN0b3IpLCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJzZWN0c1dpdGgob3RoZXI6IEJvdW5kaW5nUmVjdCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAhKG90aGVyLnJlZlBvaW50LnggPiB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgfHxcclxuICAgICAgICAgICAgb3RoZXIucmVmUG9pbnQueCArIG90aGVyLncgPCB0aGlzLnJlZlBvaW50LnggfHxcclxuICAgICAgICAgICAgb3RoZXIucmVmUG9pbnQueSA+IHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCB8fFxyXG4gICAgICAgICAgICBvdGhlci5yZWZQb2ludC55ICsgb3RoZXIuaCA8IHRoaXMucmVmUG9pbnQueSk7XHJcbiAgICB9XHJcbiAgICBnZXRJbnRlcnNlY3RBcmVhV2l0aFJlY3Qob3RoZXI6IEJvdW5kaW5nUmVjdCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgY29uc3QgdG9wbGVmdCA9IG5ldyBHbG9iYWxQb2ludChNYXRoLm1heCh0aGlzLnJlZlBvaW50LngsIG90aGVyLnJlZlBvaW50LngpLCBNYXRoLm1heCh0aGlzLnJlZlBvaW50LnksIG90aGVyLnJlZlBvaW50LnkpKTtcclxuICAgICAgICBjb25zdCB3ID0gTWF0aC5taW4odGhpcy5yZWZQb2ludC54ICsgdGhpcy53LCBvdGhlci5yZWZQb2ludC54ICsgb3RoZXIudykgLSB0b3BsZWZ0Lng7XHJcbiAgICAgICAgY29uc3QgaCA9IE1hdGgubWluKHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCwgb3RoZXIucmVmUG9pbnQueSArIG90aGVyLmgpIC0gdG9wbGVmdC55O1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRvcGxlZnQsIHcsIGgpO1xyXG4gICAgfVxyXG4gICAgZ2V0SW50ZXJzZWN0V2l0aExpbmUobGluZTogeyBzdGFydDogR2xvYmFsUG9pbnQ7IGVuZDogR2xvYmFsUG9pbnQgfSkge1xyXG4gICAgICAgIGNvbnN0IGxpbmVzID0gW1xyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LngsIHRoaXMucmVmUG9pbnQueSksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludChuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54ICsgdGhpcy53LCB0aGlzLnJlZlBvaW50LnkpLCBuZXcgR2xvYmFsUG9pbnQodGhpcy5yZWZQb2ludC54ICsgdGhpcy53LCB0aGlzLnJlZlBvaW50LnkgKyB0aGlzLmgpLCBsaW5lLnN0YXJ0LCBsaW5lLmVuZCksXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55KSwgbmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCwgdGhpcy5yZWZQb2ludC55ICsgdGhpcy5oKSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LngsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIG5ldyBHbG9iYWxQb2ludCh0aGlzLnJlZlBvaW50LnggKyB0aGlzLncsIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCksIGxpbmUuc3RhcnQsIGxpbmUuZW5kKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IG1pbl9kID0gSW5maW5pdHk7XHJcbiAgICAgICAgbGV0IG1pbl9pID0gbnVsbDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGwgPSBsaW5lc1tpXTtcclxuICAgICAgICAgICAgaWYgKGwuaW50ZXJzZWN0ID09PSBudWxsKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgZCA9IGdldFBvaW50RGlzdGFuY2UobGluZS5zdGFydCwgbC5pbnRlcnNlY3QpO1xyXG4gICAgICAgICAgICBpZiAobWluX2QgPiBkKSB7XHJcbiAgICAgICAgICAgICAgICBtaW5fZCA9IGQ7XHJcbiAgICAgICAgICAgICAgICBtaW5faSA9IGwuaW50ZXJzZWN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IGludGVyc2VjdDogbWluX2ksIGRpc3RhbmNlOiBtaW5fZCB9XHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCk6IEdsb2JhbFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBHbG9iYWxQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBHbG9iYWxQb2ludCk6IEdsb2JhbFBvaW50IHwgdm9pZCB7XHJcbiAgICAgICAgaWYgKGNlbnRlclBvaW50ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LmFkZChuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7eDogdGhpcy53LzIsIHk6IHRoaXMuaC8yfSkpO1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQueCA9IGNlbnRlclBvaW50LnggLSB0aGlzLncgLyAyO1xyXG4gICAgICAgIHRoaXMucmVmUG9pbnQueSA9IGNlbnRlclBvaW50LnkgLSB0aGlzLmggLyAyO1xyXG4gICAgfVxyXG4gICAgaW5Db3JuZXIocG9pbnQ6IEdsb2JhbFBvaW50LCBjb3JuZXI6IHN0cmluZykge1xyXG4gICAgICAgIHN3aXRjaCAoY29ybmVyKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ25lJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgKyAzICYmIHRoaXMucmVmUG9pbnQueSAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIDM7XHJcbiAgICAgICAgICAgIGNhc2UgJ253JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyAzICYmIHRoaXMucmVmUG9pbnQueSAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIDM7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N3JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyAzICYmIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCArIDM7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgLSAzIDw9IHBvaW50LnggJiYgcG9pbnQueCA8PSB0aGlzLnJlZlBvaW50LnggKyB0aGlzLncgKyAzICYmIHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCAtIDMgPD0gcG9pbnQueSAmJiBwb2ludC55IDw9IHRoaXMucmVmUG9pbnQueSArIHRoaXMuaCArIDM7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2V0Q29ybmVyKHBvaW50OiBHbG9iYWxQb2ludCk6IHN0cmluZ3x1bmRlZmluZWQge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm5lXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJuZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcInN3XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzd1wiO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IFNoYXBlIGZyb20gXCIuL3NoYXBlXCI7XHJcbmltcG9ydCBCb3VuZGluZ1JlY3QgZnJvbSBcIi4vYm91bmRpbmdyZWN0XCI7XHJcbmltcG9ydCB7IGcybCwgbDJnIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyQ2lyY2xlIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2lyY2xlIGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdHlwZSA9IFwiY2lyY2xlXCI7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBib3JkZXI6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKGNlbnRlcjogR2xvYmFsUG9pbnQsIHI6IG51bWJlciwgZmlsbD86IHN0cmluZywgYm9yZGVyPzogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoY2VudGVyLCB1dWlkKTtcclxuICAgICAgICB0aGlzLnIgPSByIHx8IDE7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICAgICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB9O1xyXG4gICAgYXNEaWN0KCk6IFNlcnZlckNpcmNsZSB7XHJcbiAgICAgICAgLy8gY29uc3QgYmFzZSA9IDxTZXJ2ZXJDaXJjbGU+dGhpcy5nZXRCYXNlRGljdCgpO1xyXG4gICAgICAgIC8vIGJhc2UuciA9IHRoaXMucjtcclxuICAgICAgICAvLyBiYXNlLmJvcmRlciA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgIC8vIHJldHVybiBiYXNlO1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHRoaXMuZ2V0QmFzZURpY3QoKSwge1xyXG4gICAgICAgICAgICByOiB0aGlzLnIsXHJcbiAgICAgICAgICAgIGJvcmRlcjogdGhpcy5ib3JkZXJcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlckNpcmNsZSkge1xyXG4gICAgICAgIHN1cGVyLmZyb21EaWN0KGRhdGEpO1xyXG4gICAgICAgIHRoaXMuciA9IGRhdGEucjtcclxuICAgICAgICBpZihkYXRhLmJvcmRlcilcclxuICAgICAgICAgICAgdGhpcy5ib3JkZXIgPSBkYXRhLmJvcmRlcjtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QobmV3IEdsb2JhbFBvaW50KHRoaXMucmVmUG9pbnQueCAtIHRoaXMuciwgdGhpcy5yZWZQb2ludC55IC0gdGhpcy5yKSwgdGhpcy5yICogMiwgdGhpcy5yICogMik7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IGcybCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdGhpcy5yLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAocG9pbnQueCAtIHRoaXMucmVmUG9pbnQueCkgKiogMiArIChwb2ludC55IC0gdGhpcy5yZWZQb2ludC55KSAqKiAyIDwgdGhpcy5yICoqIDI7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcihwb2ludDogR2xvYmFsUG9pbnQsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvL1RPRE9cclxuICAgIH1cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHBvaW50LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIocG9pbnQsIFwic2VcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInNlXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihwb2ludCwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQge1xyXG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWZQb2ludDtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gY2VudGVyUG9pbnQ7XHJcbiAgICB9XHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcbiAgICBzbmFwVG9HcmlkKCkge1xyXG4gICAgICAgIGNvbnN0IGdzID0gU2V0dGluZ3MuZ3JpZFNpemU7XHJcbiAgICAgICAgaWYgKCgyICogdGhpcy5yIC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnggPSBNYXRoLnJvdW5kKHRoaXMucmVmUG9pbnQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueCA9IE1hdGgucm91bmQoKHRoaXMucmVmUG9pbnQueCAtIChncy8yKSkgLyBncykgKiBncyArIHRoaXMucjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCgyICogdGhpcy5yIC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlZlBvaW50LnkgPSBNYXRoLnJvdW5kKHRoaXMucmVmUG9pbnQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVmUG9pbnQueSA9IE1hdGgucm91bmQoKHRoaXMucmVmUG9pbnQueSAtIChncy8yKSkgLyBncykgKiBncyArIHRoaXMucjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXNpemVUb0dyaWQoKSB7XHJcbiAgICAgICAgY29uc3QgZ3MgPSBTZXR0aW5ncy5ncmlkU2l6ZTtcclxuICAgICAgICB0aGlzLnIgPSBNYXRoLm1heChNYXRoLnJvdW5kKHRoaXMuciAvIGdzKSAqIGdzLCBncy8yKTtcclxuICAgIH1cclxuICAgIHJlc2l6ZShyZXNpemVkaXI6IHN0cmluZywgcG9pbnQ6IExvY2FsUG9pbnQpIHtcclxuICAgICAgICBjb25zdCB6ID0gU2V0dGluZ3Muem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBkaWZmID0gbDJnKHBvaW50KS5zdWJ0cmFjdCh0aGlzLnJlZlBvaW50KTtcclxuICAgICAgICB0aGlzLnIgPSBNYXRoLnNxcnQoTWF0aC5wb3coZGlmZi5sZW5ndGgoKSwgMikgLyAyKTtcclxuICAgIH1cclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgdXVpZHY0IH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBvcHVsYXRlRWRpdEFzc2V0RGlhbG9nKHNlbGY6IFNoYXBlKSB7XHJcbiAgICAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKHNlbGYudXVpZCk7XHJcbiAgICBjb25zdCBkaWFsb2dfbmFtZSA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbmFtZVwiKTtcclxuICAgIGRpYWxvZ19uYW1lLnZhbChzZWxmLm5hbWUpO1xyXG4gICAgZGlhbG9nX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBzLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoXCIjc2VsZWN0aW9uLW5hbWVcIikudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRpYWxvZ19saWdodGJsb2NrID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1saWdodGJsb2NrZXJcIik7XHJcbiAgICBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLnZpc2lvbk9ic3RydWN0aW9uKTtcclxuICAgIGRpYWxvZ19saWdodGJsb2NrLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICBzLnZpc2lvbk9ic3RydWN0aW9uID0gZGlhbG9nX2xpZ2h0YmxvY2sucHJvcChcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgIHMuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGRpYWxvZ19tb3ZlYmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW1vdmVibG9ja2VyXCIpO1xyXG4gICAgZGlhbG9nX21vdmVibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgZGlhbG9nX21vdmVibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgcy5zZXRNb3ZlbWVudEJsb2NrKGRpYWxvZ19tb3ZlYmxvY2sucHJvcChcImNoZWNrZWRcIikpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBhbm5vdGF0aW9uX3RleHQgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWFubm90YXRpb24tdGV4dGFyZWFcIik7XHJcbiAgICBhbm5vdGF0aW9uX3RleHQudmFsKHNlbGYuYW5ub3RhdGlvbik7XHJcbiAgICBhbm5vdGF0aW9uX3RleHQub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhZF9hbm5vdGF0aW9uID0gcy5hbm5vdGF0aW9uICE9PSAnJztcclxuICAgICAgICAgICAgcy5hbm5vdGF0aW9uID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICBpZiAocy5hbm5vdGF0aW9uICE9PSAnJyAmJiAhaGFkX2Fubm90YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmFubm90YXRpb25zLnB1c2gocy51dWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJkcmF3XCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhLmludmFsaWRhdGUodHJ1ZSlcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzLmFubm90YXRpb24gPT0gJycgJiYgaGFkX2Fubm90YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmFubm90YXRpb25zLnNwbGljZShnYW1lTWFuYWdlci5hbm5vdGF0aW9ucy5maW5kSW5kZXgoYW4gPT4gYW4gPT09IHMudXVpZCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImRyYXdcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSEuaW52YWxpZGF0ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IG93bmVycyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctb3duZXJzXCIpO1xyXG4gICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXRyYWNrZXJzXCIpO1xyXG4gICAgY29uc3QgYXVyYXMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWF1cmFzXCIpO1xyXG4gICAgY29uc3QgYW5ub3RhdGlvbiA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctYW5ub3RhdGlvblwiKTtcclxuICAgIG93bmVycy5uZXh0VW50aWwodHJhY2tlcnMpLnJlbW92ZSgpO1xyXG4gICAgdHJhY2tlcnMubmV4dFVudGlsKGF1cmFzKS5yZW1vdmUoKTtcclxuICAgIGF1cmFzLm5leHRVbnRpbChhbm5vdGF0aW9uKS5yZW1vdmUoKTsgIC8vKCQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuZmluZChcImZvcm1cIikpLnJlbW92ZSgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFkZE93bmVyKG93bmVyOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBvd19uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS1uYW1lPVwiJHtvd25lcn1cIiB2YWx1ZT1cIiR7b3duZXJ9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgIGNvbnN0IG93X3JlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICB0cmFja2Vycy5iZWZvcmUob3dfbmFtZS5hZGQob3dfcmVtb3ZlKSk7XHJcblxyXG4gICAgICAgIG93X25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xyXG4gICAgICAgICAgICBpZiAob3dfaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5vd25lcnMuc3BsaWNlKG93X2ksIDEsIDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnB1c2goPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb3dfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnByZXYoKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgc2VsZi5vd25lcnMuc3BsaWNlKG93X2ksIDEpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZi5vd25lcnMuZm9yRWFjaChhZGRPd25lcik7XHJcbiAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXSAhPT0gJycpXHJcbiAgICAgICAgYWRkT3duZXIoXCJcIik7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkVHJhY2tlcih0cmFja2VyOiBUcmFja2VyKSB7XHJcbiAgICAgICAgY29uc3QgdHJfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLm5hbWV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgIGNvbnN0IHRyX3ZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiQ3VycmVudCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLnZhbHVlfVwiPmApO1xyXG4gICAgICAgIGNvbnN0IHRyX21heHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiTWF4IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubWF4dmFsdWUgfHwgXCJcIn1cIj5gKTtcclxuICAgICAgICBjb25zdCB0cl92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgY29uc3QgdHJfcmVtb3ZlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgIGF1cmFzLmJlZm9yZShcclxuICAgICAgICAgICAgdHJfbmFtZVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl92YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAuYWRkKHRyX21heHZhbClcclxuICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgLmFkZCh0cl92aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAuYWRkKHRyX3JlbW92ZSlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIXRyYWNrZXIudmlzaWJsZSlcclxuICAgICAgICAgICAgdHJfdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcblxyXG4gICAgICAgIHRyX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJOYW1lIGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHIubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBpZiAoIXNlbGYudHJhY2tlcnMubGVuZ3RoIHx8IHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCBzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudHJhY2tlcnMucHVzaCh7IHV1aWQ6IHV1aWR2NCgpLCBuYW1lOiAnJywgdmFsdWU6IDAsIG1heHZhbHVlOiAwLCB2aXNpYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgIGFkZFRyYWNrZXIoc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRyX3ZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZhbHVlIGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHIudmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0ci5tYXh2YWx1ZSA/IGAke3RyLnZhbHVlfS8ke3RyLm1heHZhbHVlfWAgOiB0ci52YWx1ZTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0cl9tYXh2YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJNYXp2YWx1ZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyLm1heHZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdHJfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZW1vdmUgb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ci5uYW1lID09PSAnJyB8fCB0ci52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dHIudXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYudHJhY2tlcnMuc3BsaWNlKHNlbGYudHJhY2tlcnMuaW5kZXhPZih0ciksIDEpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdHJfdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmlzaWJpbGl0eSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0ci52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICB0ci52aXNpYmxlID0gIXRyLnZpc2libGU7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGYudHJhY2tlcnMuZm9yRWFjaChhZGRUcmFja2VyKTtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRBdXJhKGF1cmE6IEF1cmEpIHtcclxuICAgICAgICBjb25zdCBhdXJhX25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS5uYW1lfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX3ZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiQ3VycmVudCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLnZhbHVlfVwiPmApO1xyXG4gICAgICAgIGNvbnN0IGF1cmFfZGltdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJEaW0gdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS5kaW0gfHwgXCJcIn1cIj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX2NvbG91ciA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiQXVyYSBjb2xvdXJcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICBjb25zdCBhdXJhX2xpZ2h0ID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1saWdodGJ1bGJcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgY29uc3QgYXVyYV9yZW1vdmUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgLy8gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5jaGlsZHJlbigpLmxhc3QoKS5hcHBlbmQoXHJcbiAgICAgICAgYW5ub3RhdGlvbi5iZWZvcmUoXHJcbiAgICAgICAgICAgIGF1cmFfbmFtZVxyXG4gICAgICAgICAgICAgICAgLmFkZChhdXJhX3ZhbClcclxuICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPi88L3NwYW4+YClcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV9kaW12YWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkKCQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCkuYXBwZW5kKGF1cmFfY29sb3VyKS5hcHBlbmQoJChcIjwvZGl2PlwiKSkpXHJcbiAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV9saWdodClcclxuICAgICAgICAgICAgICAgIC5hZGQoYXVyYV9yZW1vdmUpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCFhdXJhLnZpc2libGUpXHJcbiAgICAgICAgICAgIGF1cmFfdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgaWYgKCFhdXJhLmxpZ2h0U291cmNlKVxyXG4gICAgICAgICAgICBhdXJhX2xpZ2h0LmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuXHJcbiAgICAgICAgYXVyYV9jb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IGF1cmEuY29sb3VyLFxyXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBtb3ZlIHVua25vd24gYXVyYSBjb2xvdXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gRG8gbm90IHVzZSBhdXJhIGRpcmVjdGx5IGFzIGl0IGRvZXMgbm90IHdvcmsgcHJvcGVybHkgZm9yIG5ldyBhdXJhc1xyXG4gICAgICAgICAgICAgICAgYXUuY29sb3VyID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhdXJhX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIG5hbWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1Lm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LW5hbWVgKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoIXNlbGYuYXVyYXMubGVuZ3RoIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCBzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuYXVyYXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZHY0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgZGltOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpZ2h0U291cmNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvdXI6ICdyZ2JhKDAsMCwwLDApJyxcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBhZGRBdXJhKHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX3ZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgdmFsdWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1LnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfZGltdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSBkaW12YWx1ZSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXUudmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdS5kaW0gPyBgJHthdS52YWx1ZX0vJHthdS5kaW19YCA6IGF1LnZhbHVlO1xyXG4gICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXVyYV9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byByZW1vdmUgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChhdS5uYW1lID09PSAnJyAmJiBhdS52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7YXUudXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYuYXVyYXMuc3BsaWNlKHNlbGYuYXVyYXMuaW5kZXhPZihhdSksIDEpO1xyXG4gICAgICAgICAgICBzZWxmLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGF1cmFfdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHRvZ2dsZSB2aXNpYmlsaXR5IG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhdS52aXNpYmxlID0gIWF1LnZpc2libGU7XHJcbiAgICAgICAgICAgIGlmIChhdS52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBhdXJhX2xpZ2h0Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdG9nZ2xlIGxpZ2h0IGNhcGFiaWxpdHkgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF1LmxpZ2h0U291cmNlID0gIWF1LmxpZ2h0U291cmNlO1xyXG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcztcclxuICAgICAgICAgICAgY29uc3QgaSA9IGxzLmZpbmRJbmRleChvID0+IG8uYXVyYSA9PT0gYXUudXVpZCk7XHJcbiAgICAgICAgICAgIGlmIChhdS5saWdodFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgbHMucHVzaCh7IHNoYXBlOiBzZWxmLnV1aWQsIGF1cmE6IGF1LnV1aWQgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIGlmIChpID49IDApXHJcbiAgICAgICAgICAgICAgICAgICAgbHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJmb3dcIikpXHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYuYXVyYXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBhZGRBdXJhKHNlbGYuYXVyYXNbaV0pO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnYW1lTWFuYWdlci5zaGFwZVNlbGVjdGlvbkRpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG5cclxuICAgICQoJy5zZWxlY3Rpb24tdHJhY2tlci12YWx1ZScpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICBjb25zdCB0cmFja2VyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICBpZiAodHJhY2tlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbmV3X3RyYWNrZXIgPSBwcm9tcHQoYE5ldyAgJHt0cmFja2VyLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XHJcbiAgICAgICAgaWYgKG5ld190cmFja2VyID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgaWYgKHRyYWNrZXIudmFsdWUgPT09IDApXHJcbiAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgPSAwO1xyXG4gICAgICAgIGlmIChuZXdfdHJhY2tlclswXSA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgKz0gcGFyc2VJbnQobmV3X3RyYWNrZXIuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlIC09IHBhcnNlSW50KG5ld190cmFja2VyLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0cmFja2VyLnZhbHVlID0gcGFyc2VJbnQobmV3X3RyYWNrZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWwgPSB0cmFja2VyLm1heHZhbHVlID8gYCR7dHJhY2tlci52YWx1ZX0vJHt0cmFja2VyLm1heHZhbHVlfWAgOiB0cmFja2VyLnZhbHVlO1xyXG4gICAgICAgICQodGhpcykudGV4dCh2YWwpO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgIH0pO1xyXG4gICAgJCgnLnNlbGVjdGlvbi1hdXJhLXZhbHVlJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgIGNvbnN0IGF1cmEgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgIGlmIChhdXJhID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdXBkYXRlIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBuZXdfYXVyYSA9IHByb21wdChgTmV3ICAke2F1cmEubmFtZX0gdmFsdWU6IChhYnNvbHV0ZSBvciByZWxhdGl2ZSlgKTtcclxuICAgICAgICBpZiAobmV3X2F1cmEgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBpZiAoYXVyYS52YWx1ZSA9PT0gMClcclxuICAgICAgICAgICAgYXVyYS52YWx1ZSA9IDA7XHJcbiAgICAgICAgaWYgKG5ld19hdXJhWzBdID09PSAnKycpIHtcclxuICAgICAgICAgICAgYXVyYS52YWx1ZSArPSBwYXJzZUludChuZXdfYXVyYS5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXdfYXVyYVswXSA9PT0gJy0nKSB7XHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgLT0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgPSBwYXJzZUludChuZXdfYXVyYSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbCA9IGF1cmEuZGltID8gYCR7YXVyYS52YWx1ZX0vJHthdXJhLmRpbX1gIDogYXVyYS52YWx1ZTtcclxuICAgICAgICAkKHRoaXMpLnRleHQodmFsKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfSk7XHJcbn0iLCJpbXBvcnQgU2hhcGUgZnJvbSBcIi4vc2hhcGVcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IHsgZzJseCwgZzJseSB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5lIGV4dGVuZHMgU2hhcGUge1xyXG4gICAgdHlwZSA9IFwibGluZVwiO1xyXG4gICAgZW5kUG9pbnQ6IEdsb2JhbFBvaW50O1xyXG4gICAgY29uc3RydWN0b3Ioc3RhcnRQb2ludDogR2xvYmFsUG9pbnQsIGVuZFBvaW50OiBHbG9iYWxQb2ludCwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHN0YXJ0UG9pbnQsIHV1aWQpO1xyXG4gICAgICAgIHRoaXMuZW5kUG9pbnQgPSBlbmRQb2ludDtcclxuICAgIH1cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLmdldEJhc2VEaWN0KCksIHtcclxuICAgICAgICAgICAgeDI6IHRoaXMuZW5kUG9pbnQueCxcclxuICAgICAgICAgICAgeTI6IHRoaXMuZW5kUG9pbnQueSxcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdChcclxuICAgICAgICAgICAgbmV3IEdsb2JhbFBvaW50KFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5yZWZQb2ludC54LCB0aGlzLmVuZFBvaW50LngpLFxyXG4gICAgICAgICAgICAgICAgTWF0aC5taW4odGhpcy5yZWZQb2ludC54LCB0aGlzLmVuZFBvaW50LnkpLFxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLnJlZlBvaW50LnggLSB0aGlzLmVuZFBvaW50LngpLFxyXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLnJlZlBvaW50LnkgLSB0aGlzLmVuZFBvaW50LnkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8oZzJseCh0aGlzLnJlZlBvaW50LngpLCBnMmx5KHRoaXMucmVmUG9pbnQueSkpO1xyXG4gICAgICAgIGN0eC5saW5lVG8oZzJseCh0aGlzLmVuZFBvaW50LngpLCBnMmx5KHRoaXMuZW5kUG9pbnQueSkpO1xyXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwwLDAsIDAuNSknO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAzO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xyXG4gICAgfVxyXG5cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQgeyB9IC8vIFRPRE9cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmd8dW5kZWZpbmVkIHsgcmV0dXJuIFwiXCIgfTsgLy8gVE9ET1xyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xyXG59IiwiaW1wb3J0IEJhc2VSZWN0IGZyb20gXCIuL2Jhc2VyZWN0XCI7XHJcbmltcG9ydCB7IGcybCB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IFNlcnZlclJlY3QgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWN0IGV4dGVuZHMgQmFzZVJlY3Qge1xyXG4gICAgdHlwZSA9IFwicmVjdFwiXHJcbiAgICBib3JkZXI6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKHRvcGxlZnQ6IEdsb2JhbFBvaW50LCB3OiBudW1iZXIsIGg6IG51bWJlciwgZmlsbD86IHN0cmluZywgYm9yZGVyPzogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIodG9wbGVmdCwgdywgaCwgdXVpZCk7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICAgICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIGJvcmRlcjogdGhpcy5ib3JkZXJcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZnJvbURpY3QoZGF0YTogU2VydmVyUmVjdCkge1xyXG4gICAgICAgIHN1cGVyLmZyb21EaWN0KGRhdGEpO1xyXG4gICAgICAgIGlmIChkYXRhLmJvcmRlcilcclxuICAgICAgICAgICAgdGhpcy5ib3JkZXIgPSBkYXRhLmJvcmRlcjtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcclxuICAgICAgICBjb25zdCB6ID0gU2V0dGluZ3Muem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBsb2MgPSBnMmwodGhpcy5yZWZQb2ludCk7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICAgICAgaWYgKHRoaXMuYm9yZGVyICE9PSBcInJnYmEoMCwgMCwgMCwgMClcIikge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyB1dWlkdjQgfSBmcm9tIFwiLi4vdXRpbHNcIjtcclxuaW1wb3J0IEJvdW5kaW5nUmVjdCBmcm9tIFwiLi9ib3VuZGluZ3JlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBnMmwsIGcybHIgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgcG9wdWxhdGVFZGl0QXNzZXREaWFsb2cgfSBmcm9tIFwiLi9lZGl0ZGlhbG9nXCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgU2VydmVyU2hhcGUgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYWJzdHJhY3QgY2xhc3MgU2hhcGUge1xyXG4gICAgLy8gVXNlZCB0byBjcmVhdGUgY2xhc3MgaW5zdGFuY2UgZnJvbSBzZXJ2ZXIgc2hhcGUgZGF0YVxyXG4gICAgcHJvdGVjdGVkIGFic3RyYWN0IHR5cGU6IHN0cmluZztcclxuICAgIC8vIFRoZSB1bmlxdWUgSUQgb2YgdGhpcyBzaGFwZVxyXG4gICAgdXVpZDogc3RyaW5nO1xyXG4gICAgLy8gVGhlIGxheWVyIHRoZSBzaGFwZSBpcyBjdXJyZW50bHkgb25cclxuICAgIGxheWVyITogc3RyaW5nO1xyXG5cclxuICAgIC8vIEEgcmVmZXJlbmNlIHBvaW50IHJlZ2FyZGluZyB0aGF0IHNwZWNpZmljIHNoYXBlJ3Mgc3RydWN0dXJlXHJcbiAgICByZWZQb2ludDogR2xvYmFsUG9pbnQ7XHJcbiAgICBcclxuICAgIC8vIEZpbGwgY29sb3VyIG9mIHRoZSBzaGFwZVxyXG4gICAgZmlsbDogc3RyaW5nID0gJyMwMDAnO1xyXG4gICAgLy9UaGUgb3B0aW9uYWwgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNoYXBlXHJcbiAgICBuYW1lID0gJ1Vua25vd24gc2hhcGUnO1xyXG5cclxuICAgIC8vIEFzc29jaWF0ZWQgdHJhY2tlcnMvYXVyYXMvb3duZXJzXHJcbiAgICB0cmFja2VyczogVHJhY2tlcltdID0gW107XHJcbiAgICBhdXJhczogQXVyYVtdID0gW107XHJcbiAgICBvd25lcnM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgLy8gQmxvY2sgbGlnaHQgc291cmNlc1xyXG4gICAgdmlzaW9uT2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuICAgIC8vIFByZXZlbnQgc2hhcGVzIGZyb20gb3ZlcmxhcHBpbmcgd2l0aCB0aGlzIHNoYXBlXHJcbiAgICBtb3ZlbWVudE9ic3RydWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgLy8gTW91c2VvdmVyIGFubm90YXRpb25cclxuICAgIGFubm90YXRpb246IHN0cmluZyA9ICcnO1xyXG5cclxuICAgIC8vIERyYXcgbW9kdXMgdG8gdXNlXHJcbiAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHN0cmluZyA9IFwic291cmNlLW92ZXJcIjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihyZWZQb2ludDogR2xvYmFsUG9pbnQsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLnJlZlBvaW50ID0gcmVmUG9pbnQ7XHJcbiAgICAgICAgdGhpcy51dWlkID0gdXVpZCB8fCB1dWlkdjQoKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Q7XHJcblxyXG4gICAgLy8gSWYgaW5Xb3JsZENvb3JkIGlzIFxyXG4gICAgYWJzdHJhY3QgY29udGFpbnMocG9pbnQ6IEdsb2JhbFBvaW50KTogYm9vbGVhbjtcclxuXHJcbiAgICBhYnN0cmFjdCBjZW50ZXIoKTogR2xvYmFsUG9pbnQ7XHJcbiAgICBhYnN0cmFjdCBjZW50ZXIoY2VudGVyUG9pbnQ6IEdsb2JhbFBvaW50KTogdm9pZDtcclxuICAgIGFic3RyYWN0IGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICBhYnN0cmFjdCB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW47XHJcblxyXG4gICAgY2hlY2tMaWdodFNvdXJjZXMoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3Qgdm9faSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuaW5kZXhPZih0aGlzLnV1aWQpO1xyXG4gICAgICAgIGlmICh0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgICAgICBlbHNlIGlmICghdGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgbGlnaHRzb3VyY2UgYXVyYXMgYXJlIGluIHRoZSBnYW1lTWFuYWdlclxyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXUpIHtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UgJiYgaSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGxzLnB1c2goeyBzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFhdS5saWdodFNvdXJjZSAmJiBpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIGFueXRoaW5nIGluIHRoZSBnYW1lTWFuYWdlciByZWZlcmVuY2luZyB0aGlzIHNoYXBlIGlzIGluIGZhY3Qgc3RpbGwgYSBsaWdodHNvdXJjZVxyXG4gICAgICAgIGZvciAobGV0IGkgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChscy5zaGFwZSA9PT0gc2VsZi51dWlkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuYXVyYXMuc29tZShhID0+IGEudXVpZCA9PT0gbHMuYXVyYSAmJiBhLmxpZ2h0U291cmNlKSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE1vdmVtZW50QmxvY2soYmxvY2tzTW92ZW1lbnQ6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBibG9ja3NNb3ZlbWVudCB8fCBmYWxzZTtcclxuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XHJcbiAgICAgICAgaWYgKHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIG93bmVkQnkodXNlcm5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodXNlcm5hbWUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdXNlcm5hbWUgPSBnYW1lTWFuYWdlci51c2VybmFtZTtcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIuSVNfRE0gfHwgdGhpcy5vd25lcnMuaW5jbHVkZXModXNlcm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0aW9uKCkge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFja2Vycy5sZW5ndGggfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMClcclxuICAgICAgICAgICAgdGhpcy50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xyXG4gICAgICAgIGlmICghdGhpcy5hdXJhcy5sZW5ndGggfHwgdGhpcy5hdXJhc1t0aGlzLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMClcclxuICAgICAgICAgICAgdGhpcy5hdXJhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogMCxcclxuICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgIGxpZ2h0U291cmNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLFxyXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KHRoaXMubmFtZSk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NlbGVjdGlvbi10cmFja2Vyc1wiKTtcclxuICAgICAgICB0cmFja2Vycy5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMudHJhY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAodHJhY2tlcikge1xyXG4gICAgICAgICAgICBpZiAodHJhY2tlci52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmFja2VyLm1heHZhbHVlID8gYCR7dHJhY2tlci52YWx1ZX0vJHt0cmFja2VyLm1heHZhbHVlfWAgOiB0cmFja2VyLnZhbHVlO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi10cmFja2VyLSR7dHJhY2tlci51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+JHt0cmFja2VyLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLXRyYWNrZXItJHt0cmFja2VyLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tdHJhY2tlci12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgYXVyYXMgPSAkKFwiI3NlbGVjdGlvbi1hdXJhc1wiKTtcclxuICAgICAgICBhdXJhcy5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgICAgICBpZiAoYXVyYS52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgICAgIGF1cmFzLmFwcGVuZCgkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLWF1cmEtJHthdXJhLnV1aWR9LW5hbWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4ke2F1cmEubmFtZX08L2Rpdj5gKSk7XHJcbiAgICAgICAgICAgIGF1cmFzLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tYXVyYS0ke2F1cmEudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi1hdXJhLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1tZW51XCIpLnNob3coKTtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zdCBlZGl0YnV0dG9uID0gJChcIiNzZWxlY3Rpb24tZWRpdC1idXR0b25cIik7XHJcbiAgICAgICAgaWYgKCF0aGlzLm93bmVkQnkoKSlcclxuICAgICAgICAgICAgZWRpdGJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlZGl0YnV0dG9uLnNob3coKTtcclxuICAgICAgICBlZGl0YnV0dG9uLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7cG9wdWxhdGVFZGl0QXNzZXREaWFsb2coc2VsZil9KTtcclxuICAgIH1cclxuXHJcbiAgICBvblNlbGVjdGlvbkxvc3MoKSB7XHJcbiAgICAgICAgLy8gJChgI3NoYXBlc2VsZWN0aW9uY29nLSR7dGhpcy51dWlkfWApLnJlbW92ZSgpO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERvIG5vdCBwcm92aWRlIGdldEJhc2VEaWN0IGFzIHRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHRvIGZvcmNlIHRoZSBpbXBsZW1lbnRhdGlvblxyXG4gICAgYWJzdHJhY3QgYXNEaWN0KCk6IFNlcnZlclNoYXBlO1xyXG4gICAgZ2V0QmFzZURpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHlwZTogdGhpcy50eXBlLFxyXG4gICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXHJcbiAgICAgICAgICAgIHg6IHRoaXMucmVmUG9pbnQueCxcclxuICAgICAgICAgICAgeTogdGhpcy5yZWZQb2ludC55LFxyXG4gICAgICAgICAgICBsYXllcjogdGhpcy5sYXllcixcclxuICAgICAgICAgICAgZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uOiB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbixcclxuICAgICAgICAgICAgbW92ZW1lbnRPYnN0cnVjdGlvbjogdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uLFxyXG4gICAgICAgICAgICB2aXNpb25PYnN0cnVjdGlvbjogdGhpcy52aXNpb25PYnN0cnVjdGlvbixcclxuICAgICAgICAgICAgYXVyYXM6IHRoaXMuYXVyYXMsXHJcbiAgICAgICAgICAgIHRyYWNrZXJzOiB0aGlzLnRyYWNrZXJzLFxyXG4gICAgICAgICAgICBvd25lcnM6IHRoaXMub3duZXJzLFxyXG4gICAgICAgICAgICBmaWxsOiB0aGlzLmZpbGwsXHJcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubmFtZSxcclxuICAgICAgICAgICAgYW5ub3RhdGlvbjogdGhpcy5hbm5vdGF0aW9uLFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZyb21EaWN0KGRhdGE6IFNlcnZlclNoYXBlKSB7XHJcbiAgICAgICAgdGhpcy5sYXllciA9IGRhdGEubGF5ZXI7XHJcbiAgICAgICAgdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBkYXRhLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBkYXRhLm1vdmVtZW50T2JzdHJ1Y3Rpb247XHJcbiAgICAgICAgdGhpcy52aXNpb25PYnN0cnVjdGlvbiA9IGRhdGEudmlzaW9uT2JzdHJ1Y3Rpb247XHJcbiAgICAgICAgdGhpcy5hdXJhcyA9IGRhdGEuYXVyYXM7XHJcbiAgICAgICAgdGhpcy50cmFja2VycyA9IGRhdGEudHJhY2tlcnM7XHJcbiAgICAgICAgdGhpcy5vd25lcnMgPSBkYXRhLm93bmVycztcclxuICAgICAgICBpZiAoZGF0YS5hbm5vdGF0aW9uKVxyXG4gICAgICAgICAgICB0aGlzLmFubm90YXRpb24gPSBkYXRhLmFubm90YXRpb247XHJcbiAgICAgICAgaWYgKGRhdGEubmFtZSlcclxuICAgICAgICAgICAgdGhpcy5uYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBpZiAodGhpcy5sYXllciA9PT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgdGhpcy5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgICAgIHRoaXMuZHJhd0F1cmFzKGN0eCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0F1cmFzKGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGF1cmEuY29sb3VyO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuY3R4ID09PSBjdHgpXHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSBnMmwoc2VsZi5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCBnMmxyKGF1cmEudmFsdWUpLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLmRpbSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGMgPSB0aW55Y29sb3IoYXVyYS5jb2xvdXIpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRjLnNldEFscGhhKHRjLmdldEFscGhhKCkgLyAyKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jID0gZzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIGcybHIoYXVyYS5kaW0pLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0NvbnRleHRNZW51KG1vdXNlOiBMb2NhbFBvaW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGwuc2VsZWN0aW9uID0gW3RoaXNdO1xyXG4gICAgICAgIHRoaXMub25TZWxlY3Rpb24oKTtcclxuICAgICAgICBsLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzO1xyXG4gICAgICAgICRtZW51LnNob3coKTtcclxuICAgICAgICAkbWVudS5lbXB0eSgpO1xyXG4gICAgICAgICRtZW51LmNzcyh7IGxlZnQ6IG1vdXNlLngsIHRvcDogbW91c2UueSB9KTtcclxuICAgICAgICBsZXQgZGF0YSA9IFwiXCIgK1xyXG4gICAgICAgICAgICBcIjx1bD5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpPkxheWVyPHVsPlwiO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5sYXllcnMuZm9yRWFjaChmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLm5hbWUgPT09IGwubmFtZSA/IFwiIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOmFxdWEnIFwiIDogXCIgXCI7XHJcbiAgICAgICAgICAgIGRhdGEgKz0gYDxsaSBkYXRhLWFjdGlvbj0nc2V0TGF5ZXInIGRhdGEtbGF5ZXI9JyR7bGF5ZXIubmFtZX0nICR7c2VsfSBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPiR7bGF5ZXIubmFtZX08L2xpPmA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGF0YSArPSBcIjwvdWw+PC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9CYWNrJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPk1vdmUgdG8gYmFjazwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvRnJvbnQnIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBmcm9udDwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nYWRkSW5pdGlhdGl2ZScgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5BZGQgaW5pdGlhdGl2ZTwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjwvdWw+XCI7XHJcbiAgICAgICAgJG1lbnUuaHRtbChkYXRhKTtcclxuICAgICAgICAkKFwiLmNvbnRleHQtY2xpY2thYmxlXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYXNzZXQub25Db250ZXh0TWVudSgkKHRoaXMpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIG9uQ29udGV4dE1lbnUobWVudTogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IG1lbnUuZGF0YShcImFjdGlvblwiKTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgICAgIGlmIChsYXllciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSAnbW92ZVRvRnJvbnQnOlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIodGhpcywgbGF5ZXIuc2hhcGVzLmxlbmd0aCAtIDEsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ21vdmVUb0JhY2snOlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIodGhpcywgMCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc2V0TGF5ZXInOlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIobWVudS5kYXRhKFwibGF5ZXJcIikpIS5hZGRTaGFwZSh0aGlzLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdhZGRJbml0aWF0aXZlJzpcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLmFkZEluaXRpYXRpdmUodGhpcy5nZXRJbml0aWF0aXZlUmVwcigpLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkbWVudS5oaWRlKCk7XHJcbiAgICB9XHJcbiAgICBnZXRJbml0aWF0aXZlUmVwcigpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB1dWlkOiB0aGlzLnV1aWQsXHJcbiAgICAgICAgICAgIHZpc2libGU6ICFnYW1lTWFuYWdlci5JU19ETSxcclxuICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICBzcmM6IFwiXCIsXHJcbiAgICAgICAgICAgIG93bmVyczogdGhpcy5vd25lcnNcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBDb2RlIHRvIHNuYXAgYSBncmlkIHRvIHRoZSBncmlkXHJcbiAgICAvLyBUaGlzIGlzIHNoYXBlIGRlcGVuZGVudCBhcyB0aGUgc2hhcGUgcmVmUG9pbnRzIGFyZSBzaGFwZSBzcGVjaWZpYyBpblxyXG4gICAgc25hcFRvR3JpZCgpIHt9O1xyXG4gICAgcmVzaXplVG9HcmlkKCkge307XHJcbiAgICByZXNpemUocmVzaXplRGlyOiBzdHJpbmcsIHBvaW50OiBMb2NhbFBvaW50KSB7fTtcclxufSIsImltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgQm91bmRpbmdSZWN0IGZyb20gXCIuL2JvdW5kaW5ncmVjdFwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGcybCB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGV4dCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHR5cGUgPSBcInRleHRcIjtcclxuICAgIHRleHQ6IHN0cmluZztcclxuICAgIGZvbnQ6IHN0cmluZztcclxuICAgIGFuZ2xlOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcihwb3NpdGlvbjogR2xvYmFsUG9pbnQsIHRleHQ6IHN0cmluZywgZm9udDogc3RyaW5nLCBhbmdsZT86IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHBvc2l0aW9uLCB1dWlkKTtcclxuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xyXG4gICAgICAgIHRoaXMuZm9udCA9IGZvbnQ7XHJcbiAgICAgICAgdGhpcy5hbmdsZSA9IGFuZ2xlIHx8IDA7XHJcbiAgICB9XHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24odGhpcy5nZXRCYXNlRGljdCgpLCB7XHJcbiAgICAgICAgICAgIHRleHQ6IHRoaXMudGV4dCxcclxuICAgICAgICAgICAgZm9udDogdGhpcy5mb250LFxyXG4gICAgICAgICAgICBhbmdsZTogdGhpcy5hbmdsZVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMucmVmUG9pbnQsIDUsIDUpOyAvLyBUb2RvOiBmaXggdGhpcyBib3VuZGluZyBib3hcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZvbnQgPSB0aGlzLmZvbnQ7XHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjb25zdCBkZXN0ID0gZzJsKHRoaXMucmVmUG9pbnQpO1xyXG4gICAgICAgIGN0eC50cmFuc2xhdGUoZGVzdC54LCBkZXN0LnkpO1xyXG4gICAgICAgIGN0eC5yb3RhdGUodGhpcy5hbmdsZSk7XHJcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XHJcbiAgICAgICAgLy8gY3R4LmZpbGxUZXh0KHRoaXMudGV4dCwgMCwgLTUpO1xyXG4gICAgICAgIHRoaXMuZHJhd1dyYXBwZWRUZXh0KGN0eCk7XHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHBvaW50OiBHbG9iYWxQb2ludCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xyXG4gICAgfVxyXG5cclxuICAgIGNlbnRlcigpOiBHbG9iYWxQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogR2xvYmFsUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogR2xvYmFsUG9pbnQpOiBHbG9iYWxQb2ludCB8IHZvaWQgeyB9IC8vIFRPRE9cclxuICAgIGdldENvcm5lcihwb2ludDogR2xvYmFsUG9pbnQpOiBzdHJpbmcgfCB1bmRlZmluZWQgeyByZXR1cm4gXCJcIiB9OyAvLyBUT0RPXHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3V3JhcHBlZFRleHQoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBjb25zdCBsaW5lcyA9IHRoaXMudGV4dC5zcGxpdChcIlxcblwiKTtcclxuICAgICAgICBjb25zdCBtYXhXaWR0aCA9IGN0eC5jYW52YXMud2lkdGg7XHJcbiAgICAgICAgY29uc3QgbGluZUhlaWdodCA9IDMwO1xyXG4gICAgICAgIGNvbnN0IHggPSAwOyAvL3RoaXMucmVmUG9pbnQueDtcclxuICAgICAgICBsZXQgeSA9IC01OyAvL3RoaXMucmVmUG9pbnQueTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBsaW5lcy5sZW5ndGg7IG4rKykge1xyXG4gICAgICAgICAgICBsZXQgbGluZSA9ICcnO1xyXG4gICAgICAgICAgICBjb25zdCB3b3JkcyA9IGxpbmVzW25dLnNwbGl0KFwiIFwiKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgdyA9IDA7IHcgPCB3b3Jkcy5sZW5ndGg7IHcrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGVzdExpbmUgPSBsaW5lICsgd29yZHNbd10gKyBcIiBcIjtcclxuICAgICAgICAgICAgICAgIHZhciBtZXRyaWNzID0gY3R4Lm1lYXN1cmVUZXh0KHRlc3RMaW5lKTtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXN0V2lkdGggPSBtZXRyaWNzLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRlc3RXaWR0aCA+IG1heFdpZHRoICYmIG4gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KGxpbmUsIHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSB3b3Jkc1t3XSArIFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHkgKz0gbGluZUhlaWdodDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IHRlc3RMaW5lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5maWxsVGV4dChsaW5lLCB4LCB5KTtcclxuICAgICAgICAgICAgeSArPSBsaW5lSGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgUmVjdCBmcm9tIFwiLi9yZWN0XCI7XHJcbmltcG9ydCBDaXJjbGUgZnJvbSBcIi4vY2lyY2xlXCI7XHJcbmltcG9ydCBMaW5lIGZyb20gXCIuL2xpbmVcIjtcclxuaW1wb3J0IFRleHQgZnJvbSBcIi4vdGV4dFwiO1xyXG5pbXBvcnQgQXNzZXQgZnJvbSBcIi4vYXNzZXRcIjtcclxuaW1wb3J0IHsgU2VydmVyU2hhcGUsIFNlcnZlclJlY3QsIFNlcnZlckNpcmNsZSwgU2VydmVyTGluZSwgU2VydmVyVGV4dCwgU2VydmVyQXNzZXQgfSBmcm9tIFwiLi4vYXBpX3R5cGVzXCI7XHJcbmltcG9ydCBTaGFwZSBmcm9tIFwiLi9zaGFwZVwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZTogU2VydmVyU2hhcGUsIGR1bW15PzogYm9vbGVhbikge1xyXG4gICAgLy8gdG9kbyBpcyB0aGlzIGR1bW15IHN0dWZmIGFjdHVhbGx5IG5lZWRlZCwgZG8gd2UgZXZlciB3YW50IHRvIHJldHVybiB0aGUgbG9jYWwgc2hhcGU/XHJcbiAgICBpZiAoZHVtbXkgPT09IHVuZGVmaW5lZCkgZHVtbXkgPSBmYWxzZTtcclxuICAgIGlmICghZHVtbXkgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKVxyXG4gICAgICAgIHJldHVybiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgbGV0IHNoOiBTaGFwZTtcclxuXHJcbiAgICAvLyBBIGZyb21KU09OIGFuZCB0b0pTT04gb24gU2hhcGUgd291bGQgYmUgY2xlYW5lciBidXQgdHMgZG9lcyBub3QgYWxsb3cgZm9yIHN0YXRpYyBhYnN0cmFjdHMgc28geWVhaC5cclxuXHJcbiAgICBjb25zdCByZWZQb2ludCA9IG5ldyBHbG9iYWxQb2ludChzaGFwZS54LCBzaGFwZS55KTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHtcclxuICAgICAgICBjb25zdCByZWN0ID0gPFNlcnZlclJlY3Q+c2hhcGU7XHJcbiAgICAgICAgc2ggPSBuZXcgUmVjdChyZWZQb2ludCwgcmVjdC53LCByZWN0LmgsIHJlY3QuZmlsbCwgcmVjdC5ib3JkZXIsIHJlY3QudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdjaXJjbGUnKSB7XHJcbiAgICAgICAgY29uc3QgY2lyYyA9IDxTZXJ2ZXJDaXJjbGU+c2hhcGU7XHJcbiAgICAgICAgc2ggPSBuZXcgQ2lyY2xlKHJlZlBvaW50LCBjaXJjLnIsIGNpcmMuZmlsbCwgY2lyYy5ib3JkZXIsIGNpcmMudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICdsaW5lJykge1xyXG4gICAgICAgIGNvbnN0IGxpbmUgPSA8U2VydmVyTGluZT5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBMaW5lKHJlZlBvaW50LCBuZXcgR2xvYmFsUG9pbnQobGluZS54MiwgbGluZS55MiksIGxpbmUudXVpZCk7XHJcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09ICd0ZXh0Jykge1xyXG4gICAgICAgIGNvbnN0IHRleHQgPSA8U2VydmVyVGV4dD5zaGFwZTtcclxuICAgICAgICBzaCA9IG5ldyBUZXh0KHJlZlBvaW50LCB0ZXh0LnRleHQsIHRleHQuZm9udCwgdGV4dC5hbmdsZSwgdGV4dC51dWlkKTtcclxuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gJ2Fzc2V0Jykge1xyXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gPFNlcnZlckFzc2V0PnNoYXBlO1xyXG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZShhc3NldC53LCBhc3NldC5oKTtcclxuICAgICAgICBpZiAoYXNzZXQuc3JjLnN0YXJ0c1dpdGgoXCJodHRwXCIpKVxyXG4gICAgICAgICAgICBpbWcuc3JjID0gbmV3IFVSTChhc3NldC5zcmMpLnBhdGhuYW1lO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgaW1nLnNyYyA9IGFzc2V0LnNyY1xyXG4gICAgICAgIHNoID0gbmV3IEFzc2V0KGltZywgcmVmUG9pbnQsIGFzc2V0LncsIGFzc2V0LmgsIGFzc2V0LnV1aWQpO1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBzaC5mcm9tRGljdChzaGFwZSk7XHJcbiAgICByZXR1cm4gc2g7XHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBhbHBoU29ydCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IHNldHVwVG9vbHMgfSBmcm9tIFwiLi90b29scy90b29sc1wiO1xyXG5pbXBvcnQgeyBDbGllbnRPcHRpb25zLCBMb2NhdGlvbk9wdGlvbnMsIEFzc2V0TGlzdCwgU2VydmVyU2hhcGUsIEluaXRpYXRpdmVEYXRhLCBCb2FyZEluZm8gfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuXHJcbmNvbnN0IHByb3RvY29sID0gZG9jdW1lbnQuZG9tYWluID09PSAnbG9jYWxob3N0JyA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xyXG5jb25zdCBzb2NrZXQgPSBpby5jb25uZWN0KHByb3RvY29sICsgZG9jdW1lbnQuZG9tYWluICsgXCI6XCIgKyBsb2NhdGlvbi5wb3J0ICsgXCIvcGxhbmFyYWxseVwiKTtcclxuc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJyZWRpcmVjdFwiLCBmdW5jdGlvbiAoZGVzdGluYXRpb246IHN0cmluZykge1xyXG4gICAgY29uc29sZS5sb2coXCJyZWRpcmVjdGluZ1wiKTtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gZGVzdGluYXRpb247XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgcm9vbSBpbmZvXCIsIGZ1bmN0aW9uIChkYXRhOiB7bmFtZTogc3RyaW5nLCBjcmVhdG9yOiBzdHJpbmd9KSB7XHJcbiAgICBnYW1lTWFuYWdlci5yb29tTmFtZSA9IGRhdGEubmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLnJvb21DcmVhdG9yID0gZGF0YS5jcmVhdG9yO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHVzZXJuYW1lXCIsIGZ1bmN0aW9uICh1c2VybmFtZTogc3RyaW5nKSB7XHJcbiAgICBnYW1lTWFuYWdlci51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIuSVNfRE0gPSB1c2VybmFtZSA9PT0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVsyXTtcclxuICAgIGlmICgkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpLmh0bWwoKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgc2V0dXBUb29scygpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGNsaWVudE9wdGlvbnNcIiwgZnVuY3Rpb24gKG9wdGlvbnM6IENsaWVudE9wdGlvbnMpIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldENsaWVudE9wdGlvbnMob3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgbG9jYXRpb25cIiwgZnVuY3Rpb24gKGRhdGE6IHtuYW1lOnN0cmluZywgb3B0aW9uczogTG9jYXRpb25PcHRpb25zfSkge1xyXG4gICAgZ2FtZU1hbmFnZXIubG9jYXRpb25OYW1lID0gZGF0YS5uYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldE9wdGlvbnMoZGF0YS5vcHRpb25zKTtcclxufSk7XHJcbnNvY2tldC5vbihcImFzc2V0IGxpc3RcIiwgZnVuY3Rpb24gKGFzc2V0czogQXNzZXRMaXN0KSB7XHJcbiAgICBjb25zdCBtID0gJChcIiNtZW51LXRva2Vuc1wiKTtcclxuICAgIG0uZW1wdHkoKTtcclxuICAgIGxldCBoID0gJyc7XHJcblxyXG4gICAgY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uIChlbnRyeTogQXNzZXRMaXN0LCBwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBmb2xkZXJzID0gbmV3IE1hcChPYmplY3QuZW50cmllcyhlbnRyeS5mb2xkZXJzKSk7XHJcbiAgICAgICAgZm9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICAgIGggKz0gXCI8YnV0dG9uIGNsYXNzPSdhY2NvcmRpb24nPlwiICsga2V5ICsgXCI8L2J1dHRvbj48ZGl2IGNsYXNzPSdhY2NvcmRpb24tcGFuZWwnPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1zdWJwYW5lbCc+XCI7XHJcbiAgICAgICAgICAgIHByb2Nlc3ModmFsdWUsIHBhdGggKyBrZXkgKyBcIi9cIik7XHJcbiAgICAgICAgICAgIGggKz0gXCI8L2Rpdj48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5zb3J0KGFscGhTb3J0KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChhc3NldCkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGRpdiBjbGFzcz0nZHJhZ2dhYmxlIHRva2VuJz48aW1nIHNyYz0nL3N0YXRpYy9pbWcvYXNzZXRzL1wiICsgcGF0aCArIGFzc2V0ICsgXCInIHdpZHRoPSczNSc+XCIgKyBhc3NldCArIFwiPGkgY2xhc3M9J2ZhcyBmYS1jb2cnPjwvaT48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBwcm9jZXNzKGFzc2V0cywgXCJcIik7XHJcbiAgICBtLmh0bWwoaCk7XHJcbiAgICAkKFwiLmRyYWdnYWJsZVwiKS5kcmFnZ2FibGUoe1xyXG4gICAgICAgIGhlbHBlcjogXCJjbG9uZVwiLFxyXG4gICAgICAgIGFwcGVuZFRvOiBcIiNib2FyZFwiXHJcbiAgICB9KTtcclxuICAgICQoJy5hY2NvcmRpb24nKS5lYWNoKGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgICAkKHRoaXMpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKFwiYWNjb3JkaW9uLWFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5uZXh0KCkudG9nZ2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcbnNvY2tldC5vbihcImJvYXJkIGluaXRcIiwgZnVuY3Rpb24gKGxvY2F0aW9uX2luZm86IEJvYXJkSW5mbykge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0dXBCb2FyZChsb2NhdGlvbl9pbmZvKVxyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGdyaWRzaXplXCIsIGZ1bmN0aW9uIChncmlkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3JpZFNpemUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYWRkIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmFkZFNoYXBlKHNoYXBlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInJlbW92ZSBzaGFwZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biBzaGFwZWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgIGxheWVyLnJlbW92ZVNoYXBlKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSEsIGZhbHNlKTtcclxuICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwibW92ZVNoYXBlT3JkZXJcIiwgZnVuY3Rpb24gKGRhdGE6IHsgc2hhcGU6IFNlcnZlclNoYXBlOyBpbmRleDogbnVtYmVyIH0pIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKGRhdGEuc2hhcGUudXVpZCkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIG1vdmUgdGhlIHNoYXBlIG9yZGVyIG9mIGFuIHVua25vd24gc2hhcGVgKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoZGF0YS5zaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpITtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XHJcbiAgICBsYXllci5tb3ZlU2hhcGVPcmRlcihzaGFwZSwgZGF0YS5pbmRleCwgZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2hhcGVNb3ZlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLm1vdmVTaGFwZShzaGFwZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVTaGFwZVwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbiB9KSB7XHJcbiAgICBnYW1lTWFuYWdlci51cGRhdGVTaGFwZShkYXRhKTtcclxufSk7XHJcbnNvY2tldC5vbihcInVwZGF0ZUluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQgfHwgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNICYmICFkYXRhLnZpc2libGUpKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoZGF0YS51dWlkLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShkYXRhLCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXRJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhOiBJbml0aWF0aXZlRGF0YVtdKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRJbml0aWF0aXZlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiY2xlYXIgdGVtcG9yYXJpZXNcIiwgZnVuY3Rpb24gKHNoYXBlczogU2VydmVyU2hhcGVbXSkge1xyXG4gICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIGFuIHVua25vd24gdGVtcG9yYXJ5IHNoYXBlXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVhbF9zaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSE7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSEucmVtb3ZlU2hhcGUocmVhbF9zaGFwZSwgZmFsc2UpO1xyXG4gICAgfSlcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzb2NrZXQ7IiwiaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4uL3NoYXBlcy9yZWN0XCI7XHJcbmltcG9ydCB7IEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuLi9zaGFwZXMvc2hhcGVcIjtcclxuaW1wb3J0IENpcmNsZSBmcm9tIFwiLi4vc2hhcGVzL2NpcmNsZVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIERyYXdUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YXJ0UG9pbnQhOiBHbG9iYWxQb2ludDtcclxuICAgIHNoYXBlITogU2hhcGU7XHJcbiAgICBmaWxsQ29sb3IgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIC8+XCIpO1xyXG4gICAgYm9yZGVyQ29sb3IgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIC8+XCIpO1xyXG4gICAgc2hhcGVTZWxlY3QgPSAkKFwiPHNlbGVjdD48b3B0aW9uIHZhbHVlPSdzcXVhcmUnPiYjeGYwYzg7PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0nY2lyY2xlJz4mI3hmMTExOzwvb3B0aW9uPjwvc2VsZWN0PlwiKTtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+RmlsbDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuZmlsbENvbG9yKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+Qm9yZGVyPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5ib3JkZXJDb2xvcilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PlNoYXBlPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5zaGFwZVNlbGVjdClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmVkXCJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcbiAgICAgICAgY29uc3QgZmlsbENvbG9yID0gdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICAgICAgY29uc3QgZmlsbCA9IGZpbGxDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogZmlsbENvbG9yO1xyXG4gICAgICAgIGNvbnN0IGJvcmRlckNvbG9yID0gdGhpcy5ib3JkZXJDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcclxuICAgICAgICBjb25zdCBib3JkZXIgPSBib3JkZXJDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogYm9yZGVyQ29sb3I7XHJcbiAgICAgICAgaWYgKHRoaXMuc2hhcGVTZWxlY3QudmFsKCkgPT09ICdzcXVhcmUnKVxyXG4gICAgICAgICAgICB0aGlzLnNoYXBlID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LmNsb25lKCksIDAsIDAsIGZpbGwudG9SZ2JTdHJpbmcoKSwgYm9yZGVyLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc2hhcGVTZWxlY3QudmFsKCkgPT09ICdjaXJjbGUnKVxyXG4gICAgICAgICAgICB0aGlzLnNoYXBlID0gbmV3IENpcmNsZSh0aGlzLnN0YXJ0UG9pbnQuY2xvbmUoKSwgMCwgZmlsbC50b1JnYlN0cmluZygpLCBib3JkZXIudG9SZ2JTdHJpbmcoKSk7XHJcbiAgICAgICAgdGhpcy5zaGFwZS5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgaWYgKGxheWVyLm5hbWUgPT09ICdmb3cnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGUudmlzaW9uT2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnB1c2godGhpcy5zaGFwZS51dWlkKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnNoYXBlLCB0cnVlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNoYXBlU2VsZWN0LnZhbCgpID09PSAnc3F1YXJlJykge1xyXG4gICAgICAgICAgICAoPFJlY3Q+dGhpcy5zaGFwZSkudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgICAgICg8UmVjdD50aGlzLnNoYXBlKS5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICAgICAgdGhpcy5zaGFwZS5yZWZQb2ludC54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlLnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNoYXBlU2VsZWN0LnZhbCgpID09PSAnY2lyY2xlJykge1xyXG4gICAgICAgICAgICAoPENpcmNsZT50aGlzLnNoYXBlKS5yID0gZW5kUG9pbnQuc3VidHJhY3QodGhpcy5zdGFydFBvaW50KS5sZW5ndGgoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy5zaGFwZSEuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBUb29sIH0gZnJvbSBcIi4vdG9vbFwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCBSZWN0IGZyb20gXCIuLi9zaGFwZXMvcmVjdFwiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgbDJnIH0gZnJvbSBcIi4uL3VuaXRzXCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4uL3NvY2tldFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZPV1Rvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcmVjdCE6IFJlY3Q7XHJcbiAgICBkZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PlJldmVhbDwvZGl2PjxsYWJlbCBjbGFzcz0nc3dpdGNoJz48aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdmb3ctcmV2ZWFsJz48c3BhbiBjbGFzcz0nc2xpZGVyIHJvdW5kJz48L3NwYW4+PC9sYWJlbD5cIikpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludC5jbG9uZSgpLCAwLCAwLCBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKSk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIGlmICgkKFwiI2Zvdy1yZXZlYWxcIikucHJvcChcImNoZWNrZWRcIikpXHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW91dFwiO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLW92ZXJcIjtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwyZyhnZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0LnJlZlBvaW50LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcblxyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHRoaXMucmVjdC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZSB9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEluaXRpYXRpdmVEYXRhIH0gZnJvbSBcIi4uL2FwaV90eXBlc1wiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhdGl2ZVRyYWNrZXIge1xyXG4gICAgZGF0YTogSW5pdGlhdGl2ZURhdGFbXSA9IFtdO1xyXG4gICAgYWRkSW5pdGlhdGl2ZShkYXRhOiBJbml0aWF0aXZlRGF0YSwgc3luYzogYm9vbGVhbikge1xyXG4gICAgICAgIC8vIE9wZW4gdGhlIGluaXRpYXRpdmUgdHJhY2tlciBpZiBpdCBpcyBub3QgY3VycmVudGx5IG9wZW4uXHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgfHwgIWdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiaXNPcGVuXCIpKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcbiAgICAgICAgLy8gSWYgbm8gaW5pdGlhdGl2ZSBnaXZlbiwgYXNzdW1lIGl0IDBcclxuICAgICAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGRhdGEuaW5pdGlhdGl2ZSA9IDA7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNoYXBlIGlzIGFscmVhZHkgYmVpbmcgdHJhY2tlZFxyXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09IGRhdGEudXVpZCk7XHJcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGlzdGluZywgZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzeW5jKVxyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgZGF0YSk7XHJcbiAgICB9O1xyXG4gICAgcmVtb3ZlSW5pdGlhdGl2ZSh1dWlkOiBzdHJpbmcsIHN5bmM6IGJvb2xlYW4sIHNraXBHcm91cENoZWNrOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgZCA9IHRoaXMuZGF0YS5maW5kSW5kZXgoZCA9PiBkLnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgIGlmIChkID49IDApIHtcclxuICAgICAgICAgICAgaWYgKCFza2lwR3JvdXBDaGVjayAmJiB0aGlzLmRhdGFbZF0uZ3JvdXApIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNwbGljZShkLCAxKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgeyB1dWlkOiB1dWlkIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCAmJiBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImlzT3BlblwiKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJjbG9zZVwiKTtcclxuICAgIH07XHJcbiAgICByZWRyYXcoKSB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5lbXB0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICBpZiAoYS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpIHJldHVybiAxO1xyXG4gICAgICAgICAgICBpZiAoYi5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpIHJldHVybiAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIGIuaW5pdGlhdGl2ZSAtIGEuaW5pdGlhdGl2ZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLm93bmVycyA9PT0gdW5kZWZpbmVkKSBkYXRhLm93bmVycyA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBpbWcgPSBkYXRhLnNyYyA9PT0gdW5kZWZpbmVkID8gJycgOiAkKGA8aW1nIHNyYz1cIiR7ZGF0YS5zcmN9XCIgd2lkdGg9XCIzMHB4XCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+YCk7XHJcbiAgICAgICAgICAgIC8vIGNvbnN0IG5hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3NoLnV1aWR9XCIgdmFsdWU9XCIke3NoLm5hbWV9XCIgZGlzYWJsZWQ9J2Rpc2FibGVkJyBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwidmFsdWVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIiB2YWx1ZT1cIiR7ZGF0YS5pbml0aWF0aXZlfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHZhbHVlXCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXVzZXJzXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICBjb25zdCByZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgICAgIHZpc2libGUuY3NzKFwib3BhY2l0eVwiLCBkYXRhLnZpc2libGUgPyBcIjEuMFwiIDogXCIwLjNcIik7XHJcbiAgICAgICAgICAgIGdyb3VwLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS5ncm91cCA/IFwiMS4wXCIgOiBcIjAuM1wiKTtcclxuICAgICAgICAgICAgaWYgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwucHJvcChcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgICAgICAgICByZW1vdmUuY3NzKFwib3BhY2l0eVwiLCBcIjAuM1wiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5hcHBlbmQoaW1nKS5hcHBlbmQodmFsKS5hcHBlbmQodmlzaWJsZSkuYXBwZW5kKGdyb3VwKS5hcHBlbmQocmVtb3ZlKTtcclxuXHJcbiAgICAgICAgICAgIHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgY2hhbmdlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZC5pbml0aWF0aXZlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRJbml0aWF0aXZlKGQsIHRydWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKSE7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIHZpc2libGUgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZC52aXNpYmxlID0gIWQudmlzaWJsZTtcclxuICAgICAgICAgICAgICAgIGlmIChkLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgZ3JvdXAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgZ3JvdXAgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgZC5ncm91cCA9ICFkLmdyb3VwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQuZ3JvdXApXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgcmVtb3ZlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHt1dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlSW5pdGlhdGl2ZSh1dWlkLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59IiwiaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IHsgR2xvYmFsUG9pbnQgfSBmcm9tIFwiLi4vZ2VvbVwiO1xyXG5pbXBvcnQgUmVjdCBmcm9tIFwiLi4vc2hhcGVzL3JlY3RcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgQmFzZVJlY3QgZnJvbSBcIi4uL3NoYXBlcy9iYXNlcmVjdFwiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1hcFRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcmVjdCE6IFJlY3Q7XHJcbiAgICB4Q291bnQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIHZhbHVlPSczJz5cIik7XHJcbiAgICB5Q291bnQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIHZhbHVlPSczJz5cIik7XHJcbiAgICBkZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PiNYPC9kaXY+XCIpKS5hcHBlbmQodGhpcy54Q291bnQpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWTwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueUNvdW50KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludCwgMCwgMCwgXCJyZ2JhKDAsMCwwLDApXCIsIFwiYmxhY2tcIik7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWN0LncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdC5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICB0aGlzLnJlY3QucmVmUG9pbnQueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QucmVmUG9pbnQueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoICE9PSAxKSB7XHJcbiAgICAgICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucmVjdCEsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLnJlY3QudztcclxuICAgICAgICBjb25zdCBoID0gdGhpcy5yZWN0Lmg7XHJcbiAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uWzBdO1xyXG5cclxuICAgICAgICBpZiAoc2VsIGluc3RhbmNlb2YgQmFzZVJlY3QpIHtcclxuICAgICAgICAgICAgc2VsLncgKj0gcGFyc2VJbnQoPHN0cmluZz50aGlzLnhDb3VudC52YWwoKSkgKiBTZXR0aW5ncy5ncmlkU2l6ZSAvIHc7XHJcbiAgICAgICAgICAgIHNlbC5oICo9IHBhcnNlSW50KDxzdHJpbmc+dGhpcy55Q291bnQudmFsKCkpICogU2V0dGluZ3MuZ3JpZFNpemUgLyBoO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVwZGF0ZWQgc2VsZWN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5yZWN0LCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IHsgTG9jYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBsMmcgfSBmcm9tIFwiLi4vdW5pdHNcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUGFuVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgcGFuU3RhcnQgPSBuZXcgTG9jYWxQb2ludCgwLCAwKTtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucGFuU3RhcnQgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IGRpc3RhbmNlID0gbDJnKG1vdXNlLnN1YnRyYWN0KHRoaXMucGFuU3RhcnQpKS5kaXJlY3Rpb247XHJcbiAgICAgICAgU2V0dGluZ3MucGFuWCArPSBNYXRoLnJvdW5kKGRpc3RhbmNlLngpO1xyXG4gICAgICAgIFNldHRpbmdzLnBhblkgKz0gTWF0aC5yb3VuZChkaXN0YW5jZS55KTtcclxuICAgICAgICB0aGlzLnBhblN0YXJ0ID0gbW91c2U7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgIH07XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7XHJcbiAgICAgICAgICAgIGxvY2F0aW9uT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgW2Ake2dhbWVNYW5hZ2VyLnJvb21OYW1lfS8ke2dhbWVNYW5hZ2VyLnJvb21DcmVhdG9yfS8ke2dhbWVNYW5hZ2VyLmxvY2F0aW9uTmFtZX1gXToge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhblg6IFNldHRpbmdzLnBhblgsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFuWTogU2V0dGluZ3MucGFuWVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7IH07XHJcbn0iLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4uL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IGwyZyB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgeyBnZXRNb3VzZSB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBUb29sIH0gZnJvbSBcIi4vdG9vbFwiO1xyXG5pbXBvcnQgeyBHbG9iYWxQb2ludCB9IGZyb20gXCIuLi9nZW9tXCI7XHJcbmltcG9ydCBMaW5lIGZyb20gXCIuLi9zaGFwZXMvbGluZVwiO1xyXG5pbXBvcnQgVGV4dCBmcm9tIFwiLi4vc2hhcGVzL3RleHRcIjtcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSdWxlclRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc3RhcnRQb2ludCE6IEdsb2JhbFBvaW50O1xyXG4gICAgcnVsZXIhOiBMaW5lO1xyXG4gICAgdGV4dCE6IFRleHQ7XHJcblxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucnVsZXIgPSBuZXcgTGluZSh0aGlzLnN0YXJ0UG9pbnQsIHRoaXMuc3RhcnRQb2ludCk7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gbmV3IFRleHQodGhpcy5zdGFydFBvaW50LmNsb25lKCksIFwiXCIsIFwiYm9sZCAyMHB4IHNlcmlmXCIpO1xyXG4gICAgICAgIHRoaXMucnVsZXIub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIHRoaXMudGV4dC5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5ydWxlciwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy50ZXh0LCB0cnVlLCB0cnVlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGRyYXcgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMmcoZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgICAgICB0aGlzLnJ1bGVyLmVuZFBvaW50ID0gZW5kUG9pbnQ7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy5ydWxlciEuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgZGlmZnNpZ24gPSBNYXRoLnNpZ24oZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KSAqIE1hdGguc2lnbihlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIGNvbnN0IHhkaWZmID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICBjb25zdCB5ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgY29uc3QgbGFiZWwgPSBNYXRoLnJvdW5kKE1hdGguc3FydCgoeGRpZmYpICoqIDIgKyAoeWRpZmYpICoqIDIpICogU2V0dGluZ3MudW5pdFNpemUgLyBTZXR0aW5ncy5ncmlkU2l6ZSkgKyBcIiBmdFwiO1xyXG4gICAgICAgIGxldCBhbmdsZSA9IE1hdGguYXRhbjIoZGlmZnNpZ24gKiB5ZGlmZiwgeGRpZmYpO1xyXG4gICAgICAgIGNvbnN0IHhtaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCkgKyB4ZGlmZiAvIDI7XHJcbiAgICAgICAgY29uc3QgeW1pZCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KSArIHlkaWZmIC8gMjtcclxuICAgICAgICB0aGlzLnRleHQucmVmUG9pbnQueCA9IHhtaWQ7XHJcbiAgICAgICAgdGhpcy50ZXh0LnJlZlBvaW50LnkgPSB5bWlkO1xyXG4gICAgICAgIHRoaXMudGV4dC50ZXh0ID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy50ZXh0LmFuZ2xlID0gYW5nbGU7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogdGhpcy50ZXh0LmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5ydWxlciwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy50ZXh0LCB0cnVlLCB0cnVlKTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgU2VsZWN0T3BlcmF0aW9ucywgY2FsY3VsYXRlRGVsdGEgfSBmcm9tIFwiLi90b29sc1wiO1xyXG5pbXBvcnQgeyBWZWN0b3IsIExvY2FsUG9pbnQsIEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IFJlY3QgZnJvbSBcIi4uL3NoYXBlcy9yZWN0XCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBnZXRNb3VzZSB9IGZyb20gXCIuLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBsMmcsIGcybCwgZzJseCwgZzJseSB9IGZyb20gXCIuLi91bml0c1wiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgVG9vbCB9IGZyb20gXCIuL3Rvb2xcIjtcclxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU2VsZWN0VG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgbW9kZTogU2VsZWN0T3BlcmF0aW9ucyA9IFNlbGVjdE9wZXJhdGlvbnMuTm9vcDtcclxuICAgIHJlc2l6ZWRpcjogc3RyaW5nID0gXCJcIjtcclxuICAgIC8vIEJlY2F1c2Ugd2UgbmV2ZXIgZHJhZyBmcm9tIHRoZSBhc3NldCdzICgwLCAwKSBjb29yZCBhbmQgd2FudCBhIHNtb290aGVyIGRyYWcgZXhwZXJpZW5jZVxyXG4gICAgLy8gd2Uga2VlcCB0cmFjayBvZiB0aGUgYWN0dWFsIG9mZnNldCB3aXRoaW4gdGhlIGFzc2V0LlxyXG4gICAgZHJhZzogVmVjdG9yPExvY2FsUG9pbnQ+ID0gbmV3IFZlY3RvcjxMb2NhbFBvaW50Pih7IHg6IDAsIHk6IDAgfSwgbmV3IExvY2FsUG9pbnQoMCwgMCkpO1xyXG4gICAgc2VsZWN0aW9uU3RhcnRQb2ludDogR2xvYmFsUG9pbnQgPSBuZXcgR2xvYmFsUG9pbnQoLTEwMDAsIC0xMDAwKTtcclxuICAgIHNlbGVjdGlvbkhlbHBlcjogUmVjdCA9IG5ldyBSZWN0KHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludCwgMCwgMCk7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuXHJcbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xyXG4gICAgICAgIC8vIHRoZSBzZWxlY3Rpb25TdGFjayBhbGxvd3MgZm9yIGxvd2VyIHBvc2l0aW9uZWQgb2JqZWN0cyB0aGF0IGFyZSBzZWxlY3RlZCB0byBoYXZlIHByZWNlZGVuY2UgZHVyaW5nIG92ZXJsYXAuXHJcbiAgICAgICAgbGV0IHNlbGVjdGlvblN0YWNrO1xyXG4gICAgICAgIGlmICghbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgc2VsZWN0aW9uU3RhY2sgPSBsYXllci5zaGFwZXM7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzZWxlY3Rpb25TdGFjayA9IGxheWVyLnNoYXBlcy5jb25jYXQobGF5ZXIuc2VsZWN0aW9uKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gc2VsZWN0aW9uU3RhY2subGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3Qgc2hhcGUgPSBzZWxlY3Rpb25TdGFja1tpXTtcclxuICAgICAgICAgICAgY29uc3QgY29ybiA9IHNoYXBlLmdldEJvdW5kaW5nQm94KCkuZ2V0Q29ybmVyKGwyZyhtb3VzZSkpO1xyXG4gICAgICAgICAgICBpZiAoY29ybiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2hhcGVdO1xyXG4gICAgICAgICAgICAgICAgc2hhcGUub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVkaXIgPSBjb3JuO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaGFwZS5jb250YWlucyhsMmcobW91c2UpKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gc2hhcGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gU2V0dGluZ3Muem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24uaW5kZXhPZihzZWwpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtzZWxdO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnID0gbW91c2Uuc3VidHJhY3QoZzJsKHNlbC5yZWZQb2ludCkpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmFnLm9yaWdpbiA9IGcybChzZWwucmVmUG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmFnLmRpcmVjdGlvbiA9IG1vdXNlLnN1YnRyYWN0KHRoaXMuZHJhZy5vcmlnaW4pO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFoaXQpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgc2VsLm9uU2VsZWN0aW9uTG9zcygpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50ID0gbDJnKGdldE1vdXNlKGUpKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIucmVmUG9pbnQgPSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQ7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLncgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5oID0gMDtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3RoaXMuc2VsZWN0aW9uSGVscGVyXTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3QpIHtcclxuICAgICAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIHRoaXNcclxuICAgICAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMmcobW91c2UpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LnkpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5yZWZQb2ludCA9IG5ldyBHbG9iYWxQb2ludChcclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC54LCBlbmRQb2ludC54KSxcclxuICAgICAgICAgICAgICAgIE1hdGgubWluKHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC55LCBlbmRQb2ludC55KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBvZyA9IGcybChsYXllci5zZWxlY3Rpb25bbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAtIDFdLnJlZlBvaW50KTtcclxuICAgICAgICAgICAgbGV0IGRlbHRhID0gbDJnKG1vdXNlLnN1YnRyYWN0KG9nLmFkZCh0aGlzLmRyYWcpKSk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuRHJhZykge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgYXJlIG9uIHRoZSB0b2tlbnMgbGF5ZXIgZG8gYSBtb3ZlbWVudCBibG9jayBjaGVjay5cclxuICAgICAgICAgICAgICAgIGlmIChsYXllci5uYW1lID09PSAndG9rZW5zJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLnNlbGVjdGlvbltpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC51dWlkID09PSB0aGlzLnNlbGVjdGlvbkhlbHBlci51dWlkKSBjb250aW51ZTsgLy8gdGhlIHNlbGVjdGlvbiBoZWxwZXIgc2hvdWxkIG5vdCBiZSB0cmVhdGVkIGFzIGEgcmVhbCBzaGFwZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSBjYWxjdWxhdGVEZWx0YShkZWx0YSwgc2VsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBBY3R1YWxseSBhcHBseSB0aGUgZGVsdGEgb24gYWxsIHNoYXBlc1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXllci5zZWxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBsYXllci5zZWxlY3Rpb25baV07XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnJlZlBvaW50ID0gc2VsLnJlZlBvaW50LmFkZChkZWx0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwgeyBzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLlJlc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXllci5zZWxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBsYXllci5zZWxlY3Rpb25baV07XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnJlc2l6ZSh0aGlzLnJlc2l6ZWRpciwgbW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHsgc2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIuc2VsZWN0aW9uW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJiID0gc2VsLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ20gPSBsMmcobW91c2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiYi5pbkNvcm5lcihnbSwgXCJud1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwibnctcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChiYi5pbkNvcm5lcihnbSwgXCJuZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwibmUtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChiYi5pbkNvcm5lcihnbSwgXCJzZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic2UtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChiYi5pbkNvcm5lcihnbSwgXCJzd1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic3ctcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBnZXRNb3VzZShlKTtcclxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0KSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5zaGFwZXMuZm9yRWFjaCgoc2hhcGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzaGFwZSA9PT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBzaGFwZS5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbkhlbHBlciEucmVmUG9pbnQueCA8PSBiYm94LnJlZlBvaW50LnggKyBiYm94LncgJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEucmVmUG9pbnQueCArIHRoaXMuc2VsZWN0aW9uSGVscGVyIS53ID49IGJib3gucmVmUG9pbnQueCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5yZWZQb2ludC55IDw9IGJib3gucmVmUG9pbnQueSArIGJib3guaCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5yZWZQb2ludC55ICsgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLmggPj0gYmJveC5yZWZQb2ludC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2goc2hhcGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFB1c2ggdGhlIHNlbGVjdGlvbiBoZWxwZXIgYXMgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgc2VsZWN0aW9uXHJcbiAgICAgICAgICAgIC8vIFRoaXMgbWFrZXMgc3VyZSB0aGF0IGl0IHdpbGwgYmUgdGhlIGZpcnN0IG9uZSB0byBiZSBoaXQgaW4gdGhlIGhpdCBkZXRlY3Rpb24gb25Nb3VzZURvd25cclxuICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2godGhpcy5zZWxlY3Rpb25IZWxwZXIpO1xyXG5cclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goKHNlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZHJhZy5vcmlnaW4hLnggPT09IGcybHgoc2VsLnJlZlBvaW50LngpICYmIHRoaXMuZHJhZy5vcmlnaW4hLnkgPT09IGcybHkoc2VsLnJlZlBvaW50LnkpKSB7IHJldHVybiB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFNldHRpbmdzLnVzZUdyaWQgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5zbmFwVG9HcmlkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoU2V0dGluZ3MudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnJlc2l6ZVRvR3JpZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7IHNoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5Ob29wXHJcbiAgICB9O1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgY29uc3QgbXggPSBtb3VzZS54O1xyXG4gICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgbGF5ZXIuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGlmICghaGl0ICYmIHNoYXBlLmNvbnRhaW5zKGwyZyhtb3VzZSkpKSB7XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5zaG93Q29udGV4dE1lbnUobW91c2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59IiwiZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRvb2wge1xyXG4gICAgZGV0YWlsRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGFic3RyYWN0IG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHsgfTtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBTZWxlY3RUb29sIH0gZnJvbSBcIi4vc2VsZWN0XCI7XHJcbmltcG9ydCB7IFBhblRvb2wgfSBmcm9tIFwiLi9wYW5cIjtcclxuaW1wb3J0IHsgRHJhd1Rvb2wgfSBmcm9tIFwiLi9kcmF3XCI7XHJcbmltcG9ydCB7IFJ1bGVyVG9vbCB9IGZyb20gXCIuL3J1bGVyXCI7XHJcbmltcG9ydCB7IEZPV1Rvb2wgfSBmcm9tIFwiLi9mb3dcIjtcclxuaW1wb3J0IHsgTWFwVG9vbCB9IGZyb20gXCIuL21hcFwiO1xyXG5pbXBvcnQgeyBWZWN0b3IsIEdsb2JhbFBvaW50IH0gZnJvbSBcIi4uL2dlb21cIjtcclxuaW1wb3J0IFNoYXBlIGZyb20gXCIuLi9zaGFwZXMvc2hhcGVcIjtcclxuXHJcbmV4cG9ydCBlbnVtIFNlbGVjdE9wZXJhdGlvbnMge1xyXG4gICAgTm9vcCxcclxuICAgIFJlc2l6ZSxcclxuICAgIERyYWcsXHJcbiAgICBHcm91cFNlbGVjdCxcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwVG9vbHMoKTogdm9pZCB7XHJcbiAgICBjb25zdCB0b29sc2VsZWN0RGl2ID0gJChcIiN0b29sc2VsZWN0XCIpLmZpbmQoXCJ1bFwiKTtcclxuICAgIHRvb2xzLmZvckVhY2goZnVuY3Rpb24gKHRvb2wpIHtcclxuICAgICAgICBpZiAoIXRvb2wucGxheWVyVG9vbCAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgdG9vbEluc3RhbmNlID0gbmV3IHRvb2wuY2x6KCk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIudG9vbHMuc2V0KHRvb2wubmFtZSwgdG9vbEluc3RhbmNlKTtcclxuICAgICAgICBjb25zdCBleHRyYSA9IHRvb2wuZGVmYXVsdFNlbGVjdCA/IFwiIGNsYXNzPSd0b29sLXNlbGVjdGVkJ1wiIDogXCJcIjtcclxuICAgICAgICBjb25zdCB0b29sTGkgPSAkKFwiPGxpIGlkPSd0b29sLVwiICsgdG9vbC5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgdG9vbC5uYW1lICsgXCI8L2E+PC9saT5cIik7XHJcbiAgICAgICAgdG9vbHNlbGVjdERpdi5hcHBlbmQodG9vbExpKTtcclxuICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgY29uc3QgZGl2ID0gdG9vbEluc3RhbmNlLmRldGFpbERpdiE7XHJcbiAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuYXBwZW5kKGRpdik7XHJcbiAgICAgICAgICAgIGRpdi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvb2xMaS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0b29scy5pbmRleE9mKHRvb2wpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkge1xyXG4gICAgICAgICAgICAgICAgJCgnLnRvb2wtc2VsZWN0ZWQnKS5yZW1vdmVDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwidG9vbC1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCA9IGluZGV4O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gJCgnI3Rvb2xkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgIGlmICh0b29sLmhhc0RldGFpbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuY2hpbGRyZW4oKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbEluc3RhbmNlLmRldGFpbERpdiEuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbC5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbC5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICAgIHsgbmFtZTogXCJzZWxlY3RcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogdHJ1ZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBTZWxlY3RUb29sIH0sXHJcbiAgICB7IG5hbWU6IFwicGFuXCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IGZhbHNlLCBjbHo6IFBhblRvb2wgfSxcclxuICAgIHsgbmFtZTogXCJkcmF3XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogRHJhd1Rvb2wgfSxcclxuICAgIHsgbmFtZTogXCJydWxlclwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBSdWxlclRvb2wgfSxcclxuICAgIHsgbmFtZTogXCJmb3dcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogRk9XVG9vbCB9LFxyXG4gICAgeyBuYW1lOiBcIm1hcFwiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBNYXBUb29sIH0sXHJcbl07XHJcblxyXG5cclxuLy8gRmlyc3QgZ28gdGhyb3VnaCBlYWNoIHNoYXBlIGluIHRoZSBzZWxlY3Rpb24gYW5kIHNlZSBpZiB0aGUgZGVsdGEgaGFzIHRvIGJlIHRydW5jYXRlZCBkdWUgdG8gbW92ZW1lbnQgYmxvY2tlcnNcclxuXHJcbi8vIFRoaXMgaXMgZGVmaW5pdGVseSBzdXBlciBjb252b2x1dGVkIGFuZCBpbmVmZmljaWVudCBidXQgSSB3YXMgdGlyZWQgYW5kIHJlYWxseSB3YW50ZWQgdGhlIHNtb290aCB3YWxsIHNsaWRpbmcgY29sbGlzaW9uIHN0dWZmIHRvIHdvcmtcclxuLy8gQW5kIGl0IGRvZXMgbm93LCBzbyBoZXkgwq9cXF8o44OEKV8vwq9cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbGN1bGF0ZURlbHRhKGRlbHRhOiBWZWN0b3I8R2xvYmFsUG9pbnQ+LCBzZWw6IFNoYXBlLCBkb25lPzogc3RyaW5nW10pIHtcclxuICAgIGlmIChkb25lID09PSB1bmRlZmluZWQpIGRvbmUgPSBbXTtcclxuICAgIGNvbnN0IG9nU2VsQkJveCA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgY29uc3QgbmV3U2VsQkJveCA9IG9nU2VsQkJveC5vZmZzZXQoZGVsdGEpO1xyXG4gICAgbGV0IHJlZmluZSA9IGZhbHNlO1xyXG4gICAgZm9yIChsZXQgbWIgPSAwOyBtYiA8IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMubGVuZ3RoOyBtYisrKSB7XHJcbiAgICAgICAgaWYgKGRvbmUuaW5jbHVkZXMoZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vyc1ttYl0pKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICBjb25zdCBibG9ja2VyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnNbbWJdKSE7XHJcbiAgICAgICAgY29uc3QgYmxvY2tlckJCb3ggPSBibG9ja2VyLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGJvdW5kaW5nIGJveCBvZiBvdXIgZGVzdGluYXRpb24gd291bGQgaW50ZXJzZWN0IHdpdGggdGhlIGJvdW5kaW5nIGJveCBvZiB0aGUgbW92ZW1lbnRibG9ja2VyXHJcbiAgICAgICAgaWYgKGJsb2NrZXJCQm94LmludGVyc2VjdHNXaXRoKG5ld1NlbEJCb3gpIHx8IGJsb2NrZXJCQm94LmdldEludGVyc2VjdFdpdGhMaW5lKHsgc3RhcnQ6IG9nU2VsQkJveC5yZWZQb2ludC5hZGQoZGVsdGEubm9ybWFsaXplKCkpLCBlbmQ6IG5ld1NlbEJCb3gucmVmUG9pbnQgfSkuaW50ZXJzZWN0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJDZW50ZXIgPSBibG9ja2VyQkJveC5jZW50ZXIoKTtcclxuICAgICAgICAgICAgY29uc3Qgc0NlbnRlciA9IG9nU2VsQkJveC5jZW50ZXIoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBzQ2VudGVyLnN1YnRyYWN0KGJDZW50ZXIpO1xyXG4gICAgICAgICAgICBjb25zdCB1eCA9IG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHsgeDogMSwgeTogMCB9KTtcclxuICAgICAgICAgICAgY29uc3QgdXkgPSBuZXcgVmVjdG9yPEdsb2JhbFBvaW50Pih7IHg6IDAsIHk6IDEgfSk7XHJcbiAgICAgICAgICAgIGxldCBkeCA9IGQuZG90KHV4KTtcclxuICAgICAgICAgICAgbGV0IGR5ID0gZC5kb3QodXkpO1xyXG4gICAgICAgICAgICBpZiAoZHggPiBibG9ja2VyQkJveC53IC8gMikgZHggPSBibG9ja2VyQkJveC53IC8gMjtcclxuICAgICAgICAgICAgaWYgKGR4IDwgLWJsb2NrZXJCQm94LncgLyAyKSBkeCA9IC1ibG9ja2VyQkJveC53IC8gMjtcclxuICAgICAgICAgICAgaWYgKGR5ID4gYmxvY2tlckJCb3guaCAvIDIpIGR5ID0gYmxvY2tlckJCb3guaCAvIDI7XHJcbiAgICAgICAgICAgIGlmIChkeSA8IC1ibG9ja2VyQkJveC5oIC8gMikgZHkgPSAtYmxvY2tlckJCb3guaCAvIDI7XHJcblxyXG4gICAgICAgICAgICAvLyBDbG9zZXN0IHBvaW50IC8gaW50ZXJzZWN0aW9uIHBvaW50IGJldHdlZW4gdGhlIHR3byBiYm94ZXMuICBOb3QgdGhlIGRlbHRhIGludGVyc2VjdCFcclxuICAgICAgICAgICAgY29uc3QgcCA9IGJDZW50ZXIuYWRkKHV4Lm11bHRpcGx5KGR4KSkuYWRkKHV5Lm11bHRpcGx5KGR5KSk7XHJcblxyXG4gICAgICAgICAgICBpZiAocC54ID09PSBvZ1NlbEJCb3gucmVmUG9pbnQueCB8fCBwLnggPT09IG9nU2VsQkJveC5yZWZQb2ludC54ICsgb2dTZWxCQm94LncpXHJcbiAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueCA9IDA7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHAueSA9PT0gb2dTZWxCQm94LnJlZlBvaW50LnkgfHwgcC55ID09PSBvZ1NlbEJCb3gucmVmUG9pbnQueSArIG9nU2VsQkJveC5oKVxyXG4gICAgICAgICAgICAgICAgZGVsdGEuZGlyZWN0aW9uLnkgPSAwO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChwLnggPCBvZ1NlbEJCb3gucmVmUG9pbnQueClcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueCA9IHAueCAtIG9nU2VsQkJveC5yZWZQb2ludC54O1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocC54ID4gb2dTZWxCQm94LnJlZlBvaW50LnggKyBvZ1NlbEJCb3gudylcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YS5kaXJlY3Rpb24ueCA9IHAueCAtIChvZ1NlbEJCb3gucmVmUG9pbnQueCArIG9nU2VsQkJveC53KTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHAueSA8IG9nU2VsQkJveC5yZWZQb2ludC55KVxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhLmRpcmVjdGlvbi55ID0gcC55IC0gb2dTZWxCQm94LnJlZlBvaW50Lnk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChwLnkgPiBvZ1NlbEJCb3gucmVmUG9pbnQueSArIG9nU2VsQkJveC5oKVxyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhLmRpcmVjdGlvbi55ID0gcC55IC0gKG9nU2VsQkJveC5yZWZQb2ludC55ICsgb2dTZWxCQm94LmgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlZmluZSA9IHRydWU7XHJcbiAgICAgICAgICAgIGRvbmUucHVzaChnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzW21iXSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChyZWZpbmUpXHJcbiAgICAgICAgZGVsdGEgPSBjYWxjdWxhdGVEZWx0YShkZWx0YSwgc2VsLCBkb25lKTtcclxuICAgIHJldHVybiBkZWx0YTtcclxufSIsImltcG9ydCB7IEdsb2JhbFBvaW50LCBMb2NhbFBvaW50LCBWZWN0b3IgfSBmcm9tIFwiLi9nZW9tXCI7XHJcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnMmwob2JqOiBHbG9iYWxQb2ludCk6IExvY2FsUG9pbnQge1xyXG4gICAgY29uc3QgeiA9IFNldHRpbmdzLnpvb21GYWN0b3I7XHJcbiAgICBjb25zdCBwYW5YID0gU2V0dGluZ3MucGFuWDtcclxuICAgIGNvbnN0IHBhblkgPSBTZXR0aW5ncy5wYW5ZO1xyXG4gICAgcmV0dXJuIG5ldyBMb2NhbFBvaW50KChvYmoueCArIHBhblgpICogeiwgKG9iai55ICsgcGFuWSkgKiB6KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGcybHgoeDogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gZzJsKG5ldyBHbG9iYWxQb2ludCh4LCAwKSkueDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGcybHkoeTogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gZzJsKG5ldyBHbG9iYWxQb2ludCgwLCB5KSkueTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGcybHooejogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4geiAqIFNldHRpbmdzLnpvb21GYWN0b3I7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbml0RGlzdGFuY2UocjogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gKHIgLyBTZXR0aW5ncy51bml0U2l6ZSkgKiBTZXR0aW5ncy5ncmlkU2l6ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGcybHIocjogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gZzJseihnZXRVbml0RGlzdGFuY2UocikpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMmcob2JqOiBMb2NhbFBvaW50KTogR2xvYmFsUG9pbnQ7XHJcbmV4cG9ydCBmdW5jdGlvbiBsMmcob2JqOiBWZWN0b3I8TG9jYWxQb2ludD4pOiBWZWN0b3I8R2xvYmFsUG9pbnQ+O1xyXG5leHBvcnQgZnVuY3Rpb24gbDJnKG9iajogTG9jYWxQb2ludHxWZWN0b3I8TG9jYWxQb2ludD4pOiBHbG9iYWxQb2ludHxWZWN0b3I8R2xvYmFsUG9pbnQ+IHtcclxuICAgIGNvbnN0IHogPSBTZXR0aW5ncy56b29tRmFjdG9yO1xyXG4gICAgICAgIGNvbnN0IHBhblggPSBTZXR0aW5ncy5wYW5YO1xyXG4gICAgICAgIGNvbnN0IHBhblkgPSBTZXR0aW5ncy5wYW5ZO1xyXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIExvY2FsUG9pbnQpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEdsb2JhbFBvaW50KChvYmoueCAvIHopIC0gcGFuWCwgKG9iai55IC8geikgLSBwYW5ZKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3I8R2xvYmFsUG9pbnQ+KHt4OiBvYmouZGlyZWN0aW9uLnggLyB6LCB5OiBvYmouZGlyZWN0aW9uLnkgLyB6fSwgb2JqLm9yaWdpbiA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogbDJnKG9iai5vcmlnaW4pKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyZ3goeDogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbDJnKG5ldyBMb2NhbFBvaW50KHgsIDApKS54O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJneSh5OiBudW1iZXIpIHtcclxuICAgIHJldHVybiBsMmcobmV3IExvY2FsUG9pbnQoMCwgeSkpLnk7XHJcbn0iLCJpbXBvcnQgeyBMb2NhbFBvaW50IH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vdXNlKGU6IE1vdXNlRXZlbnQpOiBMb2NhbFBvaW50IHtcclxuICAgIHJldHVybiBuZXcgTG9jYWxQb2ludChlLnBhZ2VYLCBlLnBhZ2VZKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbHBoU29ydChhOiBzdHJpbmcsIGI6IHN0cmluZykge1xyXG4gICAgaWYgKGEudG9Mb3dlckNhc2UoKSA8IGIudG9Mb3dlckNhc2UoKSlcclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcclxuZXhwb3J0IGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBPcmRlcmVkTWFwPEssIFY+IHtcclxuICAgIGtleXM6IEtbXSA9IFtdO1xyXG4gICAgdmFsdWVzOiBWW10gPSBbXTtcclxuICAgIGdldChrZXk6IEspIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbdGhpcy5rZXlzLmluZGV4T2Yoa2V5KV07XHJcbiAgICB9XHJcbiAgICBnZXRJbmRleFZhbHVlKGlkeDogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2lkeF07XHJcbiAgICB9XHJcbiAgICBnZXRJbmRleEtleShpZHg6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmtleXNbaWR4XTtcclxuICAgIH1cclxuICAgIHNldChrZXk6IEssIHZhbHVlOiBWKSB7XHJcbiAgICAgICAgdGhpcy5rZXlzLnB1c2goa2V5KTtcclxuICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGluZGV4T2YoZWxlbWVudDogSykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmtleXMuaW5kZXhPZihlbGVtZW50KTtcclxuICAgIH1cclxuICAgIHJlbW92ZShlbGVtZW50OiBLKSB7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5pbmRleE9mKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMua2V5cy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB0aGlzLnZhbHVlcy5zcGxpY2UoaWR4LCAxKTtcclxuICAgIH1cclxufSJdLCJzb3VyY2VSb290IjoiIn0=