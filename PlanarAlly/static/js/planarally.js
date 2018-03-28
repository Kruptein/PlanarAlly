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
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shapes */ "./ts_src/shapes.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./socket */ "./ts_src/socket.ts");




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
            const sh = Object(_shapes__WEBPACK_IMPORTED_MODULE_1__["createShapeFromDict"])(shape);
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
                    if (!(sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["BaseRect"]))
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
        return { x: e.pageX, y: e.pageY };
    }
    ;
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
                const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2l"])(center);
                const bbox = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Circle"](center.x, center.y, aura_length).getBoundingBox();
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
                            end: {
                                x: center.x + aura_length * Math.cos(angle),
                                y: center.y + aura_length * Math.sin(angle)
                            }
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
                            ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(center.x + aura_length * Math.cos(angle)), Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(center.y + aura_length * Math.sin(angle)));
                        }
                        continue;
                    }
                    // If hit , first finish any ongoing arc, then move to the intersection point
                    if (arc_start !== -1) {
                        ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lr"])(aura.value), arc_start, angle);
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
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shapes */ "./ts_src/shapes.ts");
/* harmony import */ var _tools__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tools */ "./ts_src/tools.ts");
/* harmony import */ var _layers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./layers */ "./ts_src/layers.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils */ "./ts_src/utils.ts");






class GameManager {
    constructor() {
        this.IS_DM = false;
        this.username = "";
        this.board_initialised = false;
        this.layerManager = new _layers__WEBPACK_IMPORTED_MODULE_4__["LayerManager"]();
        this.selectedTool = 0;
        this.tools = new _utils__WEBPACK_IMPORTED_MODULE_5__["OrderedMap"]();
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
                        if (gameManager.layerManager.useGrid) {
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
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = this.layerManager.getLayer(shape.layer);
        layer.addShape(Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape), false);
        layer.invalidate(false);
    }
    moveShape(shape) {
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const real_shape = Object.assign(this.layerManager.UUIDMap.get(shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape, true));
        real_shape.checkLightSources();
        this.layerManager.getLayer(real_shape.layer).onShapeMove(real_shape);
    }
    updateShape(data) {
        if (!gameManager.layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
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
            if (this.layerManager.getGridLayer() !== undefined)
                this.layerManager.getGridLayer().invalidate(false);
        }
    }
}
let gameManager = new GameManager();
window.gameManager = gameManager;
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

/***/ "./ts_src/shapes.ts":
/*!**************************!*\
  !*** ./ts_src/shapes.ts ***!
  \**************************/
/*! exports provided: Shape, BoundingRect, BaseRect, Rect, Circle, Line, Text, Asset, createShapeFromDict */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Shape", function() { return Shape; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BoundingRect", function() { return BoundingRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BaseRect", function() { return BaseRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Rect", function() { return Rect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Circle", function() { return Circle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return Line; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Text", function() { return Text; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Asset", function() { return Asset; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createShapeFromDict", function() { return createShapeFromDict; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./socket */ "./ts_src/socket.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils */ "./ts_src/utils.ts");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./geom */ "./ts_src/geom.ts");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./units */ "./ts_src/units.ts");





const $menu = $('#contextMenu');
class Shape {
    constructor(uuid) {
        this.type = "shape";
        this.globalCompositeOperation = "source-over";
        this.fill = '#000';
        this.layer = "";
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
        if (!this.trackers.length || this.trackers[this.trackers.length - 1].name !== '' || this.trackers[this.trackers.length - 1].value !== 0)
            this.trackers.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(), name: '', value: 0, maxvalue: 0, visible: false });
        if (!this.auras.length || this.auras[this.auras.length - 1].name !== '' || this.auras[this.auras.length - 1].value !== 0)
            this.auras.push({
                uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(),
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
        editbutton.on("click", function () {
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
        });
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
            if (aura.value === 0)
                return;
            ctx.beginPath();
            ctx.fillStyle = aura.colour;
            if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.hasLayer("fow") && _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer("fow").ctx === ctx)
                ctx.fillStyle = "black";
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
        if (_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer() === undefined)
            return;
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
            const l = lines[i];
            if (l.intersect === null)
                continue;
            const d = Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getPointDistance"])(line.start, l.intersect);
            if (min_d > d) {
                min_d = d;
                min_i = l.intersect;
            }
        }
        return { intersect: min_i, distance: min_d };
    }
}
class BaseRect extends Shape {
    constructor(x, y, w, h, uuid) {
        super(uuid);
        this.type = "baserect";
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    getBoundingBox() {
        return new BoundingRect(this.x, this.y, this.w, this.h);
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
    visibleInCanvas(canvas) {
        return !(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x) > canvas.width || Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y) > canvas.height ||
            Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w) < 0 || Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h) < 0);
    }
}
class Rect extends BaseRect {
    constructor(x, y, w, h, fill, border, uuid) {
        super(x, y, w, h, uuid);
        this.type = "rect";
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
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
    visibleInCanvas(canvas) { return true; } // TODO
}
class Line extends Shape {
    constructor(x1, y1, x2, y2, uuid) {
        super(uuid);
        this.type = "line";
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
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
    getCorner(x, y) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
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
    getCorner(x, y) { return ""; }
    ; // TODO
    visibleInCanvas(canvas) { return true; } // TODO
}
class Asset extends BaseRect {
    constructor(img, x, y, w, h, uuid) {
        super(x, y, w, h);
        this.src = '';
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
    if (layer === undefined)
        return;
    switch (action) {
        case 'moveToFront':
            layer.moveShapeOrder(shape, layer.shapes.length - 1, true);
            break;
        case 'moveToBack':
            layer.moveShapeOrder(shape, 0, true);
            break;
        case 'setLayer':
            layer.removeShape(shape, true);
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(menu.data("layer")).addShape(shape, true);
            break;
        case 'addInitiative':
            let src = '';
            if (shape instanceof Asset)
                src = shape.src;
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeTracker.addInitiative({
                uuid: shape.uuid,
                visible: !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM,
                group: false,
                src: src,
                owners: shape.owners
            }, true);
            break;
    }
    $menu.hide();
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
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shapes */ "./ts_src/shapes.ts");
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./socket */ "./ts_src/socket.ts");




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
        super(...arguments);
        this.mode = SelectOperations.Noop;
        this.resizedir = "";
        // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
        // we keep track of the actual offset within the asset.
        this.dragoffx = 0;
        this.dragoffy = 0;
        this.dragorig = { x: 0, y: 0 };
        this.selectionHelper = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](-1000, -1000, 0, 0);
        this.selectionStartPoint = { x: -1000, y: -1000 };
    }
    onMouseDown(e) {
        const mx = e.pageX;
        const my = e.pageY;
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        let hit = false;
        // the selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
        let selectionStack;
        if (!layer.selection.length)
            selectionStack = layer.shapes;
        else
            selectionStack = layer.shapes.concat(layer.selection);
        for (let i = selectionStack.length - 1; i >= 0; i--) {
            const shape = selectionStack[i];
            const corn = shape.getCorner(mx, my);
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
            else if (shape.contains(mx, my, true)) {
                if (!shape.ownedBy())
                    continue;
                const sel = shape;
                const z = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                this.mode = SelectOperations.Drag;
                this.dragoffx = mx - sel.x * z;
                this.dragoffy = my - sel.y * z;
                this.dragorig = { x: sel.x, y: sel.y };
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
            this.selectionStartPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
            this.selectionHelper.x = this.selectionStartPoint.x;
            this.selectionHelper.y = this.selectionStartPoint.y;
            this.selectionHelper.w = 0;
            this.selectionHelper.h = 0;
            layer.selection = [this.selectionHelper];
            layer.invalidate(true);
        }
    }
    ;
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        const mouse = layer.getMouse(e);
        const z = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.zoomFactor;
        if (this.mode === SelectOperations.GroupSelect) {
            // Currently draw on active this
            const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(mouse);
            this.selectionHelper.w = Math.abs(endPoint.x - this.selectionStartPoint.x);
            this.selectionHelper.h = Math.abs(endPoint.y - this.selectionStartPoint.y);
            this.selectionHelper.x = Math.min(this.selectionStartPoint.x, endPoint.x);
            this.selectionHelper.y = Math.min(this.selectionStartPoint.y, endPoint.y);
            layer.invalidate(true);
        }
        else if (layer.selection.length) {
            const ogX = layer.selection[layer.selection.length - 1].x * z;
            const ogY = layer.selection[layer.selection.length - 1].y * z;
            layer.selection.forEach((sel) => {
                if (!(sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["BaseRect"]))
                    return; // TODO
                const dx = mouse.x - (ogX + this.dragoffx);
                const dy = mouse.y - (ogY + this.dragoffy);
                if (this.mode === SelectOperations.Drag) {
                    sel.x += dx / z;
                    sel.y += dy / z;
                    if (layer.name !== 'fow') {
                        // We need to use the above updated values for the bounding box check
                        // First check if the bounding boxes overlap to stop close / precise movement
                        let blocked = false;
                        const bbox = sel.getBoundingBox();
                        const blockers = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].movementblockers.filter(mb => mb !== sel.uuid && _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.has(mb) && _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.get(mb).getBoundingBox().intersectsWith(bbox));
                        if (blockers.length > 0) {
                            blocked = true;
                        }
                        else {
                            // Draw a line from start to end position and see for any intersect
                            // This stops sudden leaps over walls! cheeky buggers
                            const line = { start: { x: ogX / z, y: ogY / z }, end: { x: sel.x, y: sel.y } };
                            blocked = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].movementblockers.some(mb => {
                                if (!_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.has(mb))
                                    return false;
                                const inter = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.UUIDMap.get(mb).getBoundingBox().getIntersectWithLine(line);
                                return mb !== sel.uuid && inter.intersect !== null && inter.distance > 0;
                            });
                        }
                        if (blocked) {
                            sel.x -= dx / z;
                            sel.y -= dy / z;
                            return;
                        }
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    }
                    layer.invalidate(false);
                }
                else if (this.mode === SelectOperations.Resize) {
                    if (this.resizedir === 'nw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                        sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wx"])(mouse.x);
                        sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wy"])(mouse.y);
                    }
                    else if (this.resizedir === 'ne') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x);
                        sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                        sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wy"])(mouse.y);
                    }
                    else if (this.resizedir === 'se') {
                        sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x);
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y);
                    }
                    else if (this.resizedir === 'sw') {
                        sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                        sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_0__["w2ly"])(sel.y);
                        sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2wx"])(mouse.x);
                    }
                    sel.w /= z;
                    sel.h /= z;
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
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
    ;
    onMouseUp(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        const mouse = layer.getMouse(e);
        if (this.mode === SelectOperations.GroupSelect) {
            layer.selection = [];
            layer.shapes.forEach((shape) => {
                if (shape === this.selectionHelper)
                    return;
                const bbox = shape.getBoundingBox();
                if (!shape.ownedBy())
                    return;
                if (this.selectionHelper.x <= bbox.x + bbox.w &&
                    this.selectionHelper.x + this.selectionHelper.w >= bbox.x &&
                    this.selectionHelper.y <= bbox.y + bbox.h &&
                    this.selectionHelper.y + this.selectionHelper.h >= bbox.y) {
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
                if (!(sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["BaseRect"]))
                    return; // TODO
                if (this.mode === SelectOperations.Drag) {
                    if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize;
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
                    if (this.dragorig.x !== sel.x || this.dragorig.y !== sel.y) {
                        if (sel !== this.selectionHelper) {
                            _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                        }
                        layer.invalidate(false);
                    }
                }
                if (this.mode === SelectOperations.Resize) {
                    if (sel.w < 0) {
                        sel.x += sel.w;
                        sel.w = Math.abs(sel.w);
                    }
                    if (sel.h < 0) {
                        sel.y += sel.h;
                        sel.h = Math.abs(sel.h);
                    }
                    if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.useGrid && !e.altKey) {
                        const gs = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize;
                        sel.x = Math.round(sel.x / gs) * gs;
                        sel.y = Math.round(sel.y / gs) * gs;
                        sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                        sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                    }
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
                }
            });
        }
        this.mode = SelectOperations.Noop;
    }
    ;
    onContextMenu(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        const mouse = layer.getMouse(e);
        const mx = mouse.x;
        const my = mouse.y;
        let hit = false;
        layer.shapes.forEach(function (shape) {
            if (!hit && shape.contains(mx, my, true)) {
                shape.showContextMenu(mouse);
            }
        });
    }
    ;
}
class PanTool extends Tool {
    constructor() {
        super(...arguments);
        // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
        // we keep track of the actual offset within the asset.
        this.dragoffx = 0;
        this.dragoffy = 0;
        this.dragorig = { x: 0, y: 0 };
        this.active = false;
    }
    onMouseDown(e) {
        this.dragoffx = e.pageX;
        this.dragoffy = e.pageY;
        this.active = true;
    }
    ;
    onMouseMove(e) {
        if (!this.active)
            return;
        const mouse = { x: e.pageX, y: e.pageY };
        const z = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.zoomFactor;
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.panX += Math.round((mouse.x - this.dragoffx) / z);
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.panY += Math.round((mouse.y - this.dragoffy) / z);
        this.dragoffx = mouse.x;
        this.dragoffy = mouse.y;
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.invalidate();
    }
    ;
    onMouseUp(e) {
        this.active = false;
        _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("set clientOptions", {
            panX: _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.panX,
            panY: _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.panY
        });
    }
    ;
    onContextMenu(e) { }
    ;
}
function setupTools() {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
            return;
        const toolInstance = new tool.clz();
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].tools.set(tool.name, toolInstance);
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
            if (index !== _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].selectedTool) {
                $('.tool-selected').removeClass("tool-selected");
                $(this).addClass("tool-selected");
                _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].selectedTool = index;
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
        this.startPoint = null;
        this.rect = null;
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
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
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
    }
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
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
    }
    onMouseUp(e) {
        this.startPoint = null;
        this.rect = null;
    }
}
class RulerTool extends Tool {
    constructor() {
        super(...arguments);
        this.startPoint = null;
        this.ruler = null;
        this.text = null;
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("draw");
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
        this.ruler = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Line"](this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
        this.text = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Text"](this.startPoint.x, this.startPoint.y, "", "20px serif");
        this.ruler.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
        this.text.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
        layer.addShape(this.ruler, true, true);
        layer.addShape(this.text, true, true);
    }
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
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
    }
    onMouseUp(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        if (this.startPoint === null)
            return;
        this.startPoint = null;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("draw");
        layer.removeShape(this.ruler, true, true);
        layer.removeShape(this.text, true, true);
        this.ruler = null;
        this.text = null;
        layer.invalidate(true);
    }
}
class FOWTool extends Tool {
    constructor() {
        super(...arguments);
        this.startPoint = null;
        this.rect = null;
        this.detailDiv = $("<div>")
            .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
            .append($("</div>"));
    }
    onMouseDown(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer("fow");
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
        this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].fowColour.spectrum("get").toRgbString());
        layer.addShape(this.rect, true, false);
        if ($("#fow-reveal").prop("checked"))
            this.rect.globalCompositeOperation = "destination-out";
        else
            this.rect.globalCompositeOperation = "source-over";
    }
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
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
    }
    onMouseUp(e) {
        if (this.startPoint === null)
            return;
        this.startPoint = null;
        this.rect = null;
    }
}
class MapTool extends Tool {
    constructor() {
        super(...arguments);
        this.startPoint = null;
        this.rect = null;
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
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_0__["l2w"])(layer.getMouse(e));
        this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, false, false);
    }
    onMouseMove(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
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
    }
    onMouseUp(e) {
        if (_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return;
        }
        if (this.startPoint === null)
            return;
        const layer = _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.getLayer();
        if (layer.selection.length !== 1) {
            layer.removeShape(this.rect, false, false);
            return;
        }
        const w = this.rect.w;
        const h = this.rect.h;
        const sel = layer.selection[0];
        if (sel instanceof _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"]) {
            sel.w *= parseInt(this.xCount.val()) * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize / w;
            sel.h *= parseInt(this.yCount.val()) * _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].layerManager.gridSize / h;
        }
        layer.removeShape(this.rect, false, false);
        this.startPoint = null;
        this.rect = null;
    }
}
class InitiativeTracker {
    constructor() {
        this.data = [];
    }
    addInitiative(data, sync) {
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
                _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("updateInitiative", { uuid: uuid });
        }
        if (this.data.length === 0 && _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.dialog("isOpen"))
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.dialog("close");
    }
    ;
    redraw() {
        _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.empty();
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
            if (!data.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM) {
                val.prop("disabled", "disabled");
                remove.css("opacity", "0.3");
            }
            _planarally__WEBPACK_IMPORTED_MODULE_2__["default"].initiativeDialog.append(img).append(val).append(visible).append(group).append(remove);
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
                if (d === undefined) {
                    console.log("Initiativedialog group unknown uuid?");
                    return;
                }
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
                if (d === undefined) {
                    console.log("Initiativedialog remove unknown uuid?");
                    return;
                }
                if (!d.owners.includes(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username) && !_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].IS_DM)
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
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./ts_src/planarally.ts");

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

/***/ "./ts_src/utils.ts":
/*!*************************!*\
  !*** ./ts_src/utils.ts ***!
  \*************************/
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zb2NrZXQudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy91bml0cy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ2pFQTtBQUFBLHFCQUFxQixDQUFRLEVBQUUsRUFBUyxFQUFFLEVBQVM7SUFDL0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3pDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7QUFDL0MsQ0FBQztBQUVELHNCQUFzQixDQUFRLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTLEVBQUUsRUFBUztJQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVLLGdDQUFpQyxFQUFTLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTO0lBQzdFLDRCQUE0QjtJQUM1QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckIsZ0RBQWdEO0lBQ2hELE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQztJQUM1QixFQUFFLEVBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDO0lBRXpELE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNCLHVDQUF1QztJQUN2QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUMsS0FBSyxDQUFDO0lBRXpCLE1BQU0sU0FBUyxHQUFVLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUMsRUFBRSxDQUFDLEdBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQyxHQUFDLFFBQVEsRUFBQyxDQUFDO0lBQ3BGLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQztJQUM5QyxNQUFNLENBQUMsRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUssMEJBQTJCLEVBQVMsRUFBRSxFQUFTO0lBQ2pELE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN0QixNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLEdBQUMsQ0FBQyxDQUFFLENBQUM7QUFDbEMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3ZDcUY7QUFDSTtBQUVuRDtBQUNUO0FBR3hCO0lBcUJGO1FBcEJBLFdBQU0sR0FBWSxFQUFFLENBQUM7UUFDckIsVUFBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDMUIsV0FBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDNUIsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFFM0IsWUFBTyxHQUF1QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXhDLGFBQVEsR0FBRyxFQUFFLENBQUM7UUFDZCxhQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2IsWUFBTyxHQUFHLElBQUksQ0FBQztRQUNmLFlBQU8sR0FBRyxLQUFLLENBQUM7UUFDaEIsZUFBVSxHQUFHLEdBQUcsQ0FBQztRQUVqQixlQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsU0FBSSxHQUFHLENBQUMsQ0FBQztRQUNULFNBQUksR0FBRyxDQUFDLENBQUM7UUFFVCxzQ0FBc0M7UUFDdEMsYUFBUSxHQUFHLEVBQUUsQ0FBQztRQUdWLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztRQUNoQixXQUFXLENBQUM7WUFDUixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hCLENBQUM7UUFDTCxDQUFDLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxVQUFVLENBQUMsT0FBd0I7UUFDL0IsRUFBRSxDQUFDLENBQUMsVUFBVSxJQUFJLE9BQU8sQ0FBQztZQUN0QixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUM7WUFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsRUFBRSxDQUFDLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxFQUFFLENBQUMsQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDO1lBQ3ZCLG1EQUFXLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBYTtRQUNsQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDakMsQ0FBQztJQUNMLENBQUM7SUFFRCxTQUFTLENBQUMsTUFBYztRQUNwQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDbkMsQ0FBQztJQUNMLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBWTtRQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDO1lBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBWTtRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxRQUFRLENBQUMsSUFBYTtRQUNsQixJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN4RCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDMUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELENBQUM7SUFDTCxDQUFDO0lBRUQsNEJBQTRCO0lBQzVCLFFBQVEsQ0FBQyxJQUFZO1FBQ2pCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNsQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxLQUFLO1lBQy9CLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQztnQkFBQyxNQUFNLENBQUM7WUFDOUIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUN2QyxJQUFJO2dCQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztZQUVqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLEVBQUUsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO2dCQUN4QixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLENBQUM7WUFFRCxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztZQUNyQixLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFlBQVk7UUFDUixNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsUUFBUTtRQUNKLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNsQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQ2hDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDdEIsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2QsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRWhCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELEdBQUcsQ0FBQyxXQUFXLEdBQUcsbURBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZFLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNiLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELFdBQVcsQ0FBQyxRQUFnQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0wsQ0FBQztJQUVELFdBQVcsQ0FBQyxRQUFnQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0QyxDQUFDO0lBQ0wsQ0FBQztJQUVELFVBQVUsQ0FBQyxPQUFnQjtRQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDO2dCQUNSLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QixJQUFJO2dCQUNBLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUM1QixDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0wsQ0FBQztJQUVELFVBQVUsQ0FBQyxPQUFnQjtRQUN2QixFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO2dCQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLENBQUM7SUFDTCxDQUFDO0lBRUQsYUFBYSxDQUFDLFVBQWtCO1FBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzdCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQztZQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELFVBQVU7UUFDTixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFSztJQXVCRixZQUFZLE1BQXlCLEVBQUUsSUFBWTtRQWhCbkQsZUFBVSxHQUFZLEtBQUssQ0FBQztRQUM1QixvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUVqQyxnRUFBZ0U7UUFDaEUsVUFBSyxHQUFZLEtBQUssQ0FBQztRQUN2QixxREFBcUQ7UUFDckQsc0NBQXNDO1FBQ3RDLFdBQU0sR0FBWSxFQUFFLENBQUM7UUFFckIsbURBQW1EO1FBQ25ELGNBQVMsR0FBWSxFQUFFLENBQUM7UUFFeEIsd0NBQXdDO1FBQ3hDLG1CQUFjLEdBQUcsU0FBUyxDQUFDO1FBQzNCLG1CQUFjLEdBQUcsQ0FBQyxDQUFDO1FBR2YsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVELFVBQVUsQ0FBQyxlQUF3QjtRQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0QsQ0FBQztJQUNMLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBWSxFQUFFLElBQWEsRUFBRSxTQUFtQjtRQUNyRCxFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDO1lBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUMvQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2xELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUFDLCtDQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxDQUFDLENBQUM7UUFDbEYsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsU0FBUyxDQUFDLE1BQXFCO1FBQzNCLE1BQU0sQ0FBQyxHQUFZLEVBQUUsQ0FBQztRQUN0QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUs7WUFDMUIsTUFBTSxFQUFFLEdBQUcsbUVBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEMsRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3ZCLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUMvQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckQsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxpRUFBaUU7UUFDdEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsV0FBVyxDQUFDLEtBQVksRUFBRSxJQUFhLEVBQUUsU0FBbUI7UUFDeEQsRUFBRSxDQUFDLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQztZQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQUMsK0NBQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFDLENBQUMsQ0FBQztRQUM1RSxNQUFNLElBQUksR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvRSxNQUFNLElBQUksR0FBRyxtREFBVyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFFLE1BQU0sSUFBSSxHQUFHLG1EQUFXLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RSxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ1YsbURBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ1YsbURBQVcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ1YsbURBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXBELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxLQUFLO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsSUFBSSxDQUFDLE9BQWlCO1FBQ2xCLEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsaUJBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3JCLE9BQU8sR0FBRyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUVqRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUM7Z0JBQ1IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRWpCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQztZQUVuQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUs7Z0JBQy9CLEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLFNBQVMsQ0FBQztvQkFBQyxNQUFNLENBQUM7Z0JBQzlELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQUMsTUFBTSxDQUFDO2dCQUNqRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxLQUFLLENBQUMsaUJBQWlCLElBQUksbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFHLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQUMsTUFBTSxDQUFDO2dCQUN4SCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxDQUFDO1lBRUgsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7Z0JBQ3BDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztnQkFDdEMsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRztvQkFDaEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxnREFBUSxDQUFDLENBQUM7d0JBQUMsTUFBTSxDQUFDO29CQUN2QyxHQUFHLENBQUMsVUFBVSxDQUFDLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBRS9ELFdBQVc7b0JBQ1gsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3JFLFVBQVU7b0JBQ1YsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUM3RCxXQUFXO29CQUNYLEdBQUcsQ0FBQyxRQUFRLENBQUMsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzdFLFVBQVU7b0JBQ1YsR0FBRyxDQUFDLFFBQVEsQ0FBQyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4RSxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO0lBQ0wsQ0FBQztJQUVELFFBQVEsQ0FBQyxDQUFhO1FBQ2xCLE1BQU0sQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFDLENBQUM7SUFDcEMsQ0FBQztJQUFBLENBQUM7SUFFRixjQUFjLENBQUMsS0FBWSxFQUFFLGdCQUF3QixFQUFFLElBQWE7UUFDaEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLGdCQUFnQixDQUFDO1lBQUMsTUFBTSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQUMsK0NBQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBQyxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQUEsQ0FBQztJQUVGLFdBQVcsQ0FBQyxLQUFhO1FBQ3JCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsQ0FBQztDQUNKO0FBRUssZUFBaUIsU0FBUSxLQUFLO0lBQ2hDLFVBQVU7UUFDTixtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0NBQ0o7QUFFSyxjQUFnQixTQUFRLEtBQUs7SUFFL0IsUUFBUSxDQUFDLEtBQVksRUFBRSxJQUFhLEVBQUUsU0FBbUI7UUFDckQsS0FBSyxDQUFDLElBQUksR0FBRyxtREFBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxTQUFTLENBQUMsTUFBcUI7UUFDM0IsTUFBTSxDQUFDLEdBQUcsbURBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzlELE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxLQUFLO1lBQzFCLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQsV0FBVyxDQUFDLEtBQVk7UUFDcEIsS0FBSyxDQUFDLElBQUksR0FBRyxtREFBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBQUEsQ0FBQztJQUVGLElBQUk7UUFDQSxFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLGlCQUFpQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNyQixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsd0JBQXdCLENBQUM7WUFDN0MsRUFBRSxDQUFDLENBQUMsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEdBQUcsTUFBTSxDQUFDO2dCQUMzQyxFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLEtBQUssQ0FBQztvQkFDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDO2dCQUMvRCxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxtREFBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pFLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO2dCQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLHdCQUF3QixHQUFHLE9BQU8sQ0FBQztZQUNoRCxDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxtREFBVyxDQUFDLEtBQUssQ0FBQztnQkFDbkIsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELEdBQUcsQ0FBQyx3QkFBd0IsR0FBRyxpQkFBaUIsQ0FBQztZQUNqRCxFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7b0JBQ3BFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUFDLE1BQU0sQ0FBQztvQkFDMUIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUMvQixNQUFNLE9BQU8sR0FBRyxrREFBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUNqQyxNQUFNLEdBQUcsR0FBRyxHQUFHLEdBQUcsbURBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdCLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDaEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNuRCxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUNwRyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUM3QyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO29CQUM3QyxHQUFHLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztvQkFDekIsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUNELEdBQUcsQ0FBQyx3QkFBd0IsR0FBRyxpQkFBaUIsQ0FBQztZQUNqRCxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO2dCQUN6QyxNQUFNLEVBQUUsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUQsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQztvQkFBQyxNQUFNLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7b0JBQ3ZFLE1BQU0sQ0FBQztnQkFDWCxDQUFDO2dCQUNELE1BQU0sV0FBVyxHQUFHLDhEQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sT0FBTyxHQUFHLGtEQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksOENBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBRTFFLG9FQUFvRTtnQkFDcEUsdURBQXVEO2dCQUN2RCxNQUFNLG1CQUFtQixHQUFtQixFQUFFLENBQUM7Z0JBQy9DLG1EQUFXLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUU7b0JBQzFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDO3dCQUFDLE1BQU0sQ0FBQztvQkFDM0IsTUFBTSxLQUFLLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQzt3QkFBQyxNQUFNLENBQUM7b0JBQ2hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDckMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDM0IsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxDQUFDLENBQUMsQ0FBQztnQkFFSCxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBRWhCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztnQkFFbEIsNEJBQTRCO2dCQUM1QixHQUFHLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3BFLDZCQUE2QjtvQkFDN0IsSUFBSSxHQUFHLEdBQTZDLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLENBQUM7b0JBQzFGLElBQUksU0FBUyxHQUFzQixJQUFJLENBQUM7b0JBQ3hDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQzlDLE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNyQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUM7NEJBQ3RDLEtBQUssRUFBRSxNQUFNOzRCQUNiLEdBQUcsRUFBRTtnQ0FDRCxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7Z0NBQzNDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFHLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQzs2QkFDOUM7eUJBQ0osQ0FBQyxDQUFDO3dCQUNILEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEtBQUssSUFBSSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7NEJBQzlELEdBQUcsR0FBRyxNQUFNLENBQUM7NEJBQ2IsU0FBUyxHQUFHLEtBQUssQ0FBQzt3QkFDdEIsQ0FBQztvQkFDTCxDQUFDO29CQUNELDRGQUE0RjtvQkFDNUYsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUN6QixFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNuQixTQUFTLEdBQUcsS0FBSyxDQUFDOzRCQUNsQixHQUFHLENBQUMsTUFBTSxDQUNOLG1EQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUM5QyxtREFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FDakQsQ0FBQzt3QkFDTixDQUFDO3dCQUNELFFBQVEsQ0FBQztvQkFDYixDQUFDO29CQUNELDZFQUE2RTtvQkFDN0UsRUFBRSxDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNsRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ25CLENBQUM7b0JBQ0QsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUNmLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDZixFQUFFLENBQUMsQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDckIsTUFBTSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM3QyxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2pELENBQUM7b0JBQ0Qsd0ZBQXdGO29CQUN4RixrQkFBa0I7b0JBQ2xCLGtCQUFrQjtvQkFDbEIsSUFBSTtvQkFDSixHQUFHLENBQUMsTUFBTSxDQUFDLG1EQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsbURBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxDQUFDO2dCQUNELEVBQUUsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDakIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTVFLE1BQU0sR0FBRyxHQUFHLG1EQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNwRyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dCQUM3QyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dCQUM3QyxHQUFHLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztnQkFDekIsc0NBQXNDO2dCQUN0QyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUNILEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsS0FBSyxDQUFDO2dCQUNsQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEQsR0FBRyxDQUFDLHdCQUF3QixHQUFHLE9BQU8sQ0FBQztRQUMzQyxDQUFDO0lBQ0wsQ0FBQztDQUNKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQy9kNEI7QUFDQztBQUMrQjtBQUM0QjtBQUNyQjtBQUUvQjtBQUVyQztJQXNCSTtRQXJCQSxVQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2QsYUFBUSxHQUFXLEVBQUUsQ0FBQztRQUN0QixzQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFDMUIsaUJBQVksR0FBRyxJQUFJLG9EQUFZLEVBQUUsQ0FBQztRQUNsQyxpQkFBWSxHQUFXLENBQUMsQ0FBQztRQUN6QixVQUFLLEdBQTZCLElBQUksaURBQVUsRUFBRSxDQUFDO1FBQ25ELGlCQUFZLEdBQXNDLEVBQUUsQ0FBQztRQUNyRCxrQkFBYSxHQUFhLEVBQUUsQ0FBQztRQUM3QixxQkFBZ0IsR0FBYSxFQUFFLENBQUM7UUFDaEMsZUFBVSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5QixjQUFTLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzVCLHNCQUFpQixHQUFHLElBQUksd0RBQWlCLEVBQUUsQ0FBQztRQUM1Qyx5QkFBb0IsR0FBRyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDckQsUUFBUSxFQUFFLEtBQUs7WUFDZixLQUFLLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxxQkFBZ0IsR0FBRyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDN0MsUUFBUSxFQUFFLEtBQUs7WUFDZixLQUFLLEVBQUUsT0FBTztTQUNqQixDQUFDLENBQUM7UUFHQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztZQUNyQixTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsS0FBSyxFQUFFLG9CQUFvQjtZQUMzQixJQUFJLEVBQUU7Z0JBQ0YsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUU7WUFDdkMsQ0FBQztZQUNELE1BQU0sRUFBRSxVQUFVLE1BQU07Z0JBQ3BCLCtDQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0UsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQ3BCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsS0FBSyxFQUFFLGlCQUFpQjtZQUN4QixJQUFJLEVBQUUsVUFBVSxNQUFNO2dCQUNsQixNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSzt3QkFDNUIsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3RDLENBQUMsQ0FBQyxDQUFDO29CQUNILENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxFQUFFLFVBQVUsTUFBTTtnQkFDcEIsK0NBQU0sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1RSxDQUFDO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFVBQVUsQ0FBQyxJQUFlO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxvREFBWSxFQUFFLENBQUM7UUFDdkMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9CLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsQixNQUFNLGNBQWMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDekMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsQyxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztRQUUxQixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNYLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDdEQsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7UUFDM0QsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQixFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUM7WUFDakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQzVDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUM7b0JBQ2pCLCtDQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osK0NBQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN6RCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGFBQWE7WUFDYixTQUFTLENBQUMsTUFBTSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUMsSUFBSSxHQUFHLDBCQUEwQixHQUFHLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQztZQUNuRyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDdkIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUNmLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixLQUFLLENBQUMsQ0FBQztvQkFBQyxLQUFLLEdBQUcseUJBQXlCLENBQUM7Z0JBQy9ELGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLFNBQVMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxlQUFlLEdBQUcsU0FBUyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsQ0FBQztnQkFDcEksaUJBQWlCLElBQUksQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBc0IsQ0FBQyxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNqQyxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDbkMsZ0JBQWdCO1lBQ2hCLElBQUksQ0FBUSxDQUFDO1lBQ2IsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDZixDQUFDLEdBQUcsSUFBSSxpREFBUyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDO2dCQUM5QixDQUFDLEdBQUcsSUFBSSxnREFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsSUFBSTtnQkFDQSxDQUFDLEdBQUcsSUFBSSw2Q0FBSyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQztZQUM5QyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakIsV0FBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyRCxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUN2QixNQUFNLEVBQUUsWUFBWTtvQkFDcEIsSUFBSSxFQUFFLFVBQVUsS0FBSyxFQUFFLEVBQUU7d0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDOzRCQUNwRCxNQUFNLENBQUM7d0JBQ1gsQ0FBQzt3QkFDRCxNQUFNLENBQUMsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRyxDQUFDO3dCQUMvQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUM1QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFDOzRCQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7NEJBQzlCLE1BQU0sQ0FBQzt3QkFDWCxDQUFDO3dCQUNELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUcsQ0FBQzt3QkFFakMsTUFBTSxHQUFHLEdBQUc7NEJBQ1IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJOzRCQUMvQixDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUc7eUJBQ2hDLENBQUM7d0JBRUYsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxLQUFLLEVBQUcsQ0FBQzs0QkFDL0QsTUFBTSxDQUFDO3dCQUNYLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFHLENBQUM7NEJBQ2pFLE1BQU0sQ0FBQzt3QkFDWCw4QkFBOEI7d0JBQzlCLGdDQUFnQzt3QkFDaEMsTUFBTSxJQUFJLEdBQUcsa0RBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDdEIsTUFBTSxHQUFHLEdBQXFCLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUMxRCxNQUFNLEtBQUssR0FBRyxJQUFJLDZDQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3QkFDcEUsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO3dCQUVwQixFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ25DLE1BQU0sRUFBRSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDOzRCQUM3QyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQ3hDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDeEMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ3RELEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMxRCxDQUFDO3dCQUVELENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUM1QixDQUFDO2lCQUNKLENBQUMsQ0FBQztZQUNQLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixDQUFDLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0wsQ0FBQztRQUNELG9EQUFvRDtRQUNwRCxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdFLHFDQUFxQztRQUNyQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBRTlCLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO2dCQUNsQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDckYsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDbEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNuQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7b0JBQ2xDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztJQUNMLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBa0I7UUFDdkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEtBQUssQ0FBQyxLQUFLLHFCQUFxQixDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDO1FBQ1gsQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQztRQUN2RCxLQUFLLENBQUMsUUFBUSxDQUFDLG1FQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVELFNBQVMsQ0FBQyxLQUFrQjtRQUN4QixFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsS0FBSyxDQUFDLEtBQUsscUJBQXFCLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUM7UUFDWCxDQUFDO1FBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLG1FQUFtQixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlHLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVELFdBQVcsQ0FBQyxJQUE0QztRQUNwRCxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQztZQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUsscUJBQXFCLENBQUMsQ0FBQztZQUMvRSxNQUFNLENBQUM7UUFDWCxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxtRUFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkgsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2xELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDWixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQsYUFBYSxDQUFDLElBQXNCO1FBQ2hDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNoQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxPQUFzQjtRQUNuQyxFQUFFLENBQUMsQ0FBQyxZQUFZLElBQUksT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEQsRUFBRSxDQUFDLENBQUMsV0FBVyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUMsRUFBRSxDQUFDLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQztZQUNsQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQzFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7WUFDbEQsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDdkQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsS0FBSyxTQUFTLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVELENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFHRCxJQUFJLFdBQVcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQzlCLE1BQU8sQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0FBRXhDLHFCQUFxQjtBQUVyQix5Q0FBeUM7QUFDekMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUM7SUFDOUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ25CLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUM7QUFFSCx1QkFBdUIsQ0FBYTtJQUNoQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMzQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQWtCLENBQUMsQ0FBQyxNQUFPLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMvRixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDYixXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlFLENBQUM7QUFFRCx1QkFBdUIsQ0FBYTtJQUNoQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMzQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQWtCLENBQUMsQ0FBQyxNQUFPLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMvRixXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlFLENBQUM7QUFFRCxxQkFBcUIsQ0FBYTtJQUM5QixFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMzQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQWtCLENBQUMsQ0FBQyxNQUFPLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMvRixXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDcEQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUVoRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBYTtJQUMxRCxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUMzQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBa0IsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxPQUFPLEtBQUssUUFBUSxDQUFDO1FBQUMsTUFBTSxDQUFDO0lBQzNFLFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEYsQ0FBQyxDQUFDLENBQUM7QUFFSCxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQ2hCLFdBQVcsRUFBRSxVQUFVO0lBQ3ZCLEdBQUcsRUFBRSxHQUFHO0lBQ1IsR0FBRyxFQUFFLEdBQUc7SUFDUixJQUFJLEVBQUUsR0FBRztJQUNULEtBQUssRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLFVBQVU7SUFDMUMsS0FBSyxFQUFFLFVBQVUsS0FBSyxFQUFFLEVBQUU7UUFDdEIsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7UUFDbEQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFNLENBQUM7UUFDM0IsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDekMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDdkMsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQzNDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEQsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QywrQ0FBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtZQUM3QixVQUFVLEVBQUUsSUFBSTtZQUNoQixJQUFJLEVBQUUsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO1lBQ25DLElBQUksRUFBRSxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUk7U0FDdEMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKLENBQUMsQ0FBQztBQUVILE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNoQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7QUFFYixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFFLENBQUM7QUFDbEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFFLENBQUM7QUFDN0MsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBRSxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBRTVCLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO0lBQzFCLHdHQUF3RztJQUN4RyxFQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDOUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQzlELFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQzlELFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtJQUMzQix3R0FBd0c7SUFDeEcsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDN0MsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILE1BQU0sQ0FBQyxRQUFRLEdBQUc7SUFDZCxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDckQsV0FBVyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3ZELFdBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDMUMsQ0FBQyxDQUFDO0FBRUYsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUM7SUFDdkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNuRCxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0NBQStDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUM7UUFDWCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUcsQ0FBQztRQUMvQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUc7WUFDN0IsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDO0lBQ3hDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBb0IsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4RCxXQUFXLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6QywrQ0FBTSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUM7QUFFSCxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQztJQUN4QyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQW9CLENBQUMsQ0FBQyxNQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsV0FBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDekMsK0NBQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQztJQUN2QyxNQUFNLEVBQUUsR0FBc0IsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxPQUFPLENBQUM7SUFDaEQsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEMsK0NBQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQztJQUN0QyxNQUFNLEVBQUUsR0FBc0IsQ0FBQyxDQUFDLE1BQU8sQ0FBQyxPQUFPLENBQUM7SUFDaEQsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDeEMsK0NBQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMxRCxDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQztJQUNyQyxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQW9CLENBQUMsQ0FBQyxNQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNaLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRCxNQUFNLENBQUM7SUFDWCxDQUFDO0lBQ0QsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkIsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkIsV0FBVyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDM0MsK0NBQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RCxDQUFDLENBQUMsQ0FBQztBQUVILCtEQUFlLFdBQVcsRUFBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3pZWTtBQUNUO0FBQ1U7QUFDMEI7QUFDTjtBQUk1RCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7QUFvQjFCO0lBYUYsWUFBWSxJQUFhO1FBWnpCLFNBQUksR0FBVyxPQUFPLENBQUM7UUFFdkIsNkJBQXdCLEdBQVcsYUFBYSxDQUFDO1FBQ2pELFNBQUksR0FBVyxNQUFNLENBQUM7UUFDdEIsVUFBSyxHQUFXLEVBQUUsQ0FBQztRQUNuQixTQUFJLEdBQUcsZUFBZSxDQUFDO1FBQ3ZCLGFBQVEsR0FBYyxFQUFFLENBQUM7UUFDekIsVUFBSyxHQUFXLEVBQUUsQ0FBQztRQUNuQixXQUFNLEdBQWEsRUFBRSxDQUFDO1FBQ3RCLHNCQUFpQixHQUFHLEtBQUssQ0FBQztRQUMxQix3QkFBbUIsR0FBRyxLQUFLLENBQUM7UUFHeEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUkscURBQU0sRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFXRCxpQkFBaUI7UUFDYixNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsTUFBTSxJQUFJLEdBQUcsbURBQVcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLG1EQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksSUFBSSxDQUFDLENBQUM7WUFDMUMsbURBQVcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUU5Qyx3REFBd0Q7UUFDeEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQzNCLE1BQU0sRUFBRSxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILDZGQUE2RjtRQUM3RixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM1RCxNQUFNLEVBQUUsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDM0QsbURBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxjQUF1QjtRQUNwQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsY0FBYyxJQUFJLEtBQUssQ0FBQztRQUNuRCxNQUFNLElBQUksR0FBRyxtREFBVyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN4QyxtREFBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksSUFBSSxDQUFDLENBQUM7WUFDNUMsbURBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxPQUFPLENBQUMsUUFBaUI7UUFDckIsRUFBRSxDQUFDLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztZQUN2QixRQUFRLEdBQUcsbURBQVcsQ0FBQyxRQUFRLENBQUM7UUFDcEMsTUFBTSxDQUFDLG1EQUFXLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxXQUFXO1FBQ1AsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO1lBQ3BJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLHFEQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM1RixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7WUFDckgsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ1osSUFBSSxFQUFFLHFEQUFNLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLEVBQUU7Z0JBQ1IsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsR0FBRyxFQUFFLENBQUM7Z0JBQ04sV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLE1BQU0sRUFBRSxlQUFlO2dCQUN2QixPQUFPLEVBQUUsS0FBSzthQUNqQixDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLE9BQU87WUFDbkMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUN0RixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyw4QkFBOEIsT0FBTyxDQUFDLElBQUkscUJBQXFCLE9BQU8sQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN6SCxRQUFRLENBQUMsTUFBTSxDQUNYLENBQUMsQ0FBQyw4QkFBOEIsT0FBTyxDQUFDLElBQUksc0JBQXNCLE9BQU8sQ0FBQyxJQUFJLHFDQUFxQyxHQUFHLFFBQVEsQ0FBQyxDQUNsSSxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNwQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUk7WUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNoRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQywyQkFBMkIsSUFBSSxDQUFDLElBQUkscUJBQXFCLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMxRyxLQUFLLENBQUMsTUFBTSxDQUNSLENBQUMsQ0FBQywyQkFBMkIsSUFBSSxDQUFDLElBQUksc0JBQXNCLElBQUksQ0FBQyxJQUFJLGtDQUFrQyxHQUFHLFFBQVEsQ0FBQyxDQUN0SCxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDL0MsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLElBQUk7WUFDQSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDbkIsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUNwRCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQixXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtnQkFDckIsTUFBTSxJQUFJLEdBQVcsQ0FBQyxDQUFDLDRCQUE0QixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzNELEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3QyxNQUFNLENBQUMsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRSxDQUFDO29CQUN0RCxDQUFDLENBQUMsSUFBSSxHQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDL0IsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUNqRCwrQ0FBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQztnQkFDcEUsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsb0NBQW9DLENBQUMsQ0FBQztZQUNsRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzFELGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7Z0JBQzFCLE1BQU0sSUFBSSxHQUFXLENBQUMsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMzRCxFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQztvQkFDdEQsQ0FBQyxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDeEQsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzFCLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDaEUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUMzRCxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO2dCQUN6QixNQUFNLElBQUksR0FBVyxDQUFDLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDM0QsRUFBRSxDQUFDLENBQUMsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLE1BQU0sQ0FBQyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUM7b0JBQ3RELENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekQsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDakQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7WUFDckQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25DLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFbEUsa0JBQWtCLEtBQWE7Z0JBQzNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxvREFBb0QsS0FBSyxZQUFZLEtBQUssb0NBQW9DLENBQUMsQ0FBQztnQkFDbEksTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLCtFQUErRSxDQUFDLENBQUM7Z0JBRXJHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUV4QyxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtvQkFDakIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO3dCQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ3ZELElBQUk7d0JBQ0EsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQzVDLCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQ3BFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNwRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2pCLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsU0FBUyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7b0JBQ2xCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDcEUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN4QixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDNUIsK0NBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDeEUsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbEUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRWpCLG9CQUFvQixPQUFnQjtnQkFDaEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLG9EQUFvRCxPQUFPLENBQUMsSUFBSSxZQUFZLE9BQU8sQ0FBQyxJQUFJLG9DQUFvQyxDQUFDLENBQUM7Z0JBQ2hKLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyx1REFBdUQsT0FBTyxDQUFDLElBQUksWUFBWSxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztnQkFDbkgsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLG1EQUFtRCxPQUFPLENBQUMsSUFBSSxZQUFZLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDM0gsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLG1CQUFtQixPQUFPLENBQUMsSUFBSSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUMxRixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsbUJBQW1CLE9BQU8sQ0FBQyxJQUFJLDBDQUEwQyxDQUFDLENBQUM7Z0JBRS9GLEtBQUssQ0FBQyxNQUFNLENBQ1IsT0FBTztxQkFDRixHQUFHLENBQUMsTUFBTSxDQUFDO3FCQUNYLEdBQUcsQ0FBQyxvQkFBb0IsT0FBTyxDQUFDLElBQUksWUFBWSxDQUFDO3FCQUNqRCxHQUFHLENBQUMsU0FBUyxDQUFDO3FCQUNkLEdBQUcsQ0FBQyxvQkFBb0IsT0FBTyxDQUFDLElBQUksV0FBVyxDQUFDO3FCQUNoRCxHQUFHLENBQUMsVUFBVSxDQUFDO3FCQUNmLEdBQUcsQ0FBQyxvQkFBb0IsT0FBTyxDQUFDLElBQUksV0FBVyxDQUFDO3FCQUNoRCxHQUFHLENBQUMsU0FBUyxDQUFDLENBQ3RCLENBQUM7Z0JBRUYsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO29CQUNqQixVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFbkMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUU7b0JBQ2pCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7d0JBQzlDLE1BQU0sQ0FBQztvQkFDWCxDQUFDO29CQUNELEVBQUUsQ0FBQyxJQUFJLEdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNoQyxDQUFDLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDcEUsK0NBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztvQkFDcEUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdEksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUscURBQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUN4RixVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO29CQUNoQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO3dCQUMvQyxNQUFNLENBQUM7b0JBQ1gsQ0FBQztvQkFDRCxFQUFFLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDM0MsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztvQkFDbEUsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ25ELCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLENBQUMsQ0FBQyxDQUFDO2dCQUNILFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO29CQUNuQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO3dCQUNsRCxNQUFNLENBQUM7b0JBQ1gsQ0FBQztvQkFDRCxFQUFFLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDOUMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztvQkFDbEUsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ25ELCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLENBQUMsQ0FBQyxDQUFDO2dCQUNILFNBQVMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO29CQUNsQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO3dCQUN6QyxNQUFNLENBQUM7b0JBQ1gsQ0FBQztvQkFDRCxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQzt3QkFBQyxNQUFNLENBQUM7b0JBQzdDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNyQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDbkQsK0NBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDeEUsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7b0JBQ25CLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7d0JBQ3BELE1BQU0sQ0FBQztvQkFDWCxDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUM7d0JBQ1gsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ2hDLElBQUk7d0JBQ0EsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ2hDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDO29CQUN6QiwrQ0FBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVsQyxpQkFBaUIsSUFBVTtnQkFDdkIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLG9EQUFvRCxJQUFJLENBQUMsSUFBSSxZQUFZLElBQUksQ0FBQyxJQUFJLG9DQUFvQyxDQUFDLENBQUM7Z0JBQzVJLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyx1REFBdUQsSUFBSSxDQUFDLElBQUksWUFBWSxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztnQkFDL0csTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLG1EQUFtRCxJQUFJLENBQUMsSUFBSSxZQUFZLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEgsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLHFEQUFxRCxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDMUYsTUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDLG1CQUFtQixJQUFJLENBQUMsSUFBSSxvQ0FBb0MsQ0FBQyxDQUFDO2dCQUN6RixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFJLDBDQUEwQyxDQUFDLENBQUM7Z0JBQzdGLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLElBQUksMENBQTBDLENBQUMsQ0FBQztnQkFFOUYsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUMvQyxTQUFTO3FCQUNKLEdBQUcsQ0FBQyxRQUFRLENBQUM7cUJBQ2IsR0FBRyxDQUFDLG9CQUFvQixJQUFJLENBQUMsSUFBSSxZQUFZLENBQUM7cUJBQzlDLEdBQUcsQ0FBQyxXQUFXLENBQUM7cUJBQ2hCLEdBQUcsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7cUJBQ2hGLEdBQUcsQ0FBQyxZQUFZLENBQUM7cUJBQ2pCLEdBQUcsQ0FBQyxVQUFVLENBQUM7cUJBQ2YsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUN4QixDQUFDO2dCQUVGLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztvQkFDZCxZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDckMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO29CQUNsQixVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFbkMsV0FBVyxDQUFDLFFBQVEsQ0FBQztvQkFDakIsU0FBUyxFQUFFLElBQUk7b0JBQ2YsU0FBUyxFQUFFLElBQUk7b0JBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNO29CQUNsQixJQUFJLEVBQUUsVUFBVSxNQUFNO3dCQUNsQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNqRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzs0QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDOzRCQUNyRCxNQUFNLENBQUM7d0JBQ1gsQ0FBQzt3QkFDRCxzRUFBc0U7d0JBQ3RFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNqQyxFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDaEQsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3BFLENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO3dCQUM5RCxDQUFDO29CQUNMLENBQUM7b0JBQ0QsTUFBTSxFQUFFO3dCQUNKLCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ3ZFLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2dCQUVILFNBQVMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO29CQUNuQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNqRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO3dCQUN4RCxNQUFNLENBQUM7b0JBQ1gsQ0FBQztvQkFDRCxFQUFFLENBQUMsSUFBSSxHQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDaEMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ2pFLCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ25FLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZILElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDOzRCQUNaLElBQUksRUFBRSxxREFBTSxFQUFFOzRCQUNkLElBQUksRUFBRSxFQUFFOzRCQUNSLEtBQUssRUFBRSxDQUFDOzRCQUNSLEdBQUcsRUFBRSxDQUFDOzRCQUNOLFdBQVcsRUFBRSxLQUFLOzRCQUNsQixNQUFNLEVBQUUsZUFBZTs0QkFDdkIsT0FBTyxFQUFFLEtBQUs7eUJBQ2pCLENBQUMsQ0FBQzt3QkFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNILFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFO29CQUNsQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNqRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO3dCQUN6RCxNQUFNLENBQUM7b0JBQ1gsQ0FBQztvQkFDRCxFQUFFLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztvQkFDM0MsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztvQkFDeEQsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2hELCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ25FLEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoRCxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDcEUsQ0FBQztvQkFBQyxJQUFJLENBQUMsQ0FBQzt3QkFDSixPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7b0JBQzlELENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsV0FBVyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUU7b0JBQ3JCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7d0JBQzVELE1BQU0sQ0FBQztvQkFDWCxDQUFDO29CQUNELEVBQUUsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUMzQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUN4RCxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEQsK0NBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDbkUsRUFBRSxDQUFDLENBQUMsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2hELG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNwRSxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsNENBQTRDLENBQUMsQ0FBQztvQkFDOUQsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFDSCxXQUFXLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtvQkFDcEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDakUsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7d0JBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQzt3QkFDaEQsTUFBTSxDQUFDO29CQUNYLENBQUM7b0JBQ0QsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7d0JBQUMsTUFBTSxDQUFDO29CQUM3QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO29CQUN6QiwrQ0FBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUNuRSxFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDaEQsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3BFLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO29CQUM5RCxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNILFlBQVksQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO29CQUNyQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUNqRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO3dCQUM5RCxNQUFNLENBQUM7b0JBQ1gsQ0FBQztvQkFDRCxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQztvQkFDekIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQzt3QkFDWCxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDaEMsSUFBSTt3QkFDQSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDaEMsK0NBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDdkUsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7b0JBQ25CLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7d0JBQ3BFLE1BQU0sQ0FBQztvQkFDWCxDQUFDO29CQUNELEVBQUUsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDO29CQUNqQyxNQUFNLEVBQUUsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQztvQkFDcEMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNoRCxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDakIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7d0JBQzVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzs0QkFDVCxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUNyRCxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUM1QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNQLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN4QixDQUFDO29CQUNELEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDekMsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEUsK0NBQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDdkUsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN6QyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFHRCxtREFBVyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztRQUNILENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDekQsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDO1lBQ1gsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxRQUFRLE9BQU8sQ0FBQyxJQUFJLGdDQUFnQyxDQUFDLENBQUM7WUFDakYsRUFBRSxDQUFDLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQztnQkFDckIsTUFBTSxDQUFDO1lBQ1gsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixPQUFPLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUN0RixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLCtDQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ25DLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQ25ELEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQztZQUNYLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQzNFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQztZQUNYLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNuQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDaEUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQiwrQ0FBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELGVBQWU7UUFDWCxpREFBaUQ7UUFDakQsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELE1BQU07UUFDRixNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELElBQUksQ0FBQyxHQUE2QjtRQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxtREFBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDcEUsQ0FBQztRQUNELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxTQUFTLENBQUM7WUFDNUMsR0FBRyxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztRQUNqRSxJQUFJO1lBQ0EsR0FBRyxDQUFDLHdCQUF3QixHQUFHLGFBQWEsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCxTQUFTLENBQUMsR0FBNkI7UUFDbkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsSUFBSTtZQUM3QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztnQkFBQyxNQUFNLENBQUM7WUFDN0IsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM1QixFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUM7Z0JBQ2xHLEdBQUcsQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO1lBQzVCLE1BQU0sR0FBRyxHQUFHLGtEQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDL0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEQsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1gsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixHQUFHLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM3RCxNQUFNLEdBQUcsR0FBRyxrREFBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxtREFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEQsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2YsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELGVBQWUsQ0FBQyxLQUFZO1FBQ3hCLEVBQUUsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLFNBQVMsQ0FBQztZQUFDLE1BQU0sQ0FBQztRQUM5RCxNQUFNLENBQUMsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUcsQ0FBQztRQUMvQyxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNiLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDM0MsSUFBSSxJQUFJLEdBQUcsRUFBRTtZQUNULE1BQU07WUFDTixlQUFlLENBQUM7UUFDcEIsbURBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUs7WUFDbkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO2dCQUFDLE1BQU0sQ0FBQztZQUM5QixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDNUUsSUFBSSxJQUFJLDBDQUEwQyxLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsOEJBQThCLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQztRQUN4SCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksSUFBSSxZQUFZO1lBQ2hCLDBFQUEwRTtZQUMxRSw0RUFBNEU7WUFDNUUsK0VBQStFO1lBQy9FLE9BQU8sQ0FBQztRQUNaLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUNoQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFFSztJQU9GLFlBQVksQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQU50RCxTQUFJLEdBQUcsV0FBVyxDQUFDO1FBT2YsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDZixDQUFDO0lBRUQsUUFBUSxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsWUFBcUI7UUFDaEQsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNmLENBQUMsR0FBRyxtREFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1osQ0FBQyxHQUFHLG1EQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEIsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDeEMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELGNBQWMsQ0FBQyxLQUFtQjtRQUM5QixNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUMvQixLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7WUFDM0IsS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzFCLEtBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUNELG9CQUFvQixDQUFDLElBQWtDO1FBQ25ELE1BQU0sS0FBSyxHQUFHO1lBQ1Ysb0VBQXNCLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUN6RyxvRUFBc0IsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDdEQsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ2xCLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2FBQ3JCLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3hCLG9FQUFzQixDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDekcsb0VBQXNCLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RELENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUNsQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQzthQUNyQixFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUMzQixDQUFDO1FBQ0YsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ3JCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztRQUNqQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNwQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUM7Z0JBQUMsUUFBUSxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxHQUFHLDhEQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNaLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ1YsS0FBSyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDeEIsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUU7SUFDaEQsQ0FBQztDQUNKO0FBRUssY0FBeUIsU0FBUSxLQUFLO0lBS3hDLFlBQVksQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLElBQWE7UUFDakUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7UUFDdkIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQ0QsY0FBYztRQUNWLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUNELFFBQVEsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLFlBQXFCO1FBQ2hELEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDZixDQUFDLEdBQUcsbURBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNaLENBQUMsR0FBRyxtREFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hCLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFDRCxRQUFRLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxNQUFjO1FBQ3pDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDYixLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlILEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1RyxLQUFLLElBQUk7Z0JBQ0wsTUFBTSxDQUFDLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlILEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxD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QWM7UUFDVixNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFDRCxJQUFJLENBQUMsR0FBNkI7UUFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQixHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQzFCLE1BQU0sR0FBRyxHQUFHLGtEQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5QyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNyQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDaEIsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzlCLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FB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QUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0QixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2pDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUMxQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2pDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2pDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5QixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQixDQUFDO29CQUNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNYLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNYLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQzt3QkFDL0IsK0NBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztvQkFDckUsQ0FBQztvQkFDRCxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QixDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNiLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdkMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztvQkFDN0MsQ0FBQztvQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5QyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO29CQUM3QyxDQUFDO29CQUFDLElBQUksQ0FBQyxFQUFFLENBQUMs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QUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxNQUFNLENBQUMsT0FBVTtRQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0NBQ0oiLCJmaWxlIjoicGxhbmFyYWxseS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3RzX3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiaW1wb3J0IHsgUG9pbnQgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmUocDogUG9pbnQsIGwxOiBQb2ludCwgbDI6IFBvaW50KSB7XHJcbiAgICByZXR1cm4gcC54ID49IE1hdGgubWluKGwxLngsIGwyLngpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnggPD0gTWF0aC5tYXgobDEueCwgbDIueCkgKyAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueSA+PSBNYXRoLm1pbihsMS55LCBsMi55KSAtIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55IDw9IE1hdGgubWF4KGwxLnksIGwyLnkpICsgMC4wMDAwMDE7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lcyhwOiBQb2ludCwgczE6IFBvaW50LCBlMTogUG9pbnQsIHMyOiBQb2ludCwgZTI6IFBvaW50KSB7XHJcbiAgICByZXR1cm4gcG9pbnRJbkxpbmUocCwgczEsIGUxKSAmJiBwb2ludEluTGluZShwLCBzMiwgZTIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGluZXNJbnRlcnNlY3RQb2ludChzMTogUG9pbnQsIGUxOiBQb2ludCwgczI6IFBvaW50LCBlMjogUG9pbnQpIHtcclxuICAgIC8vIGNvbnN0IHMxID0gTWF0aC5taW4oUzEsIClcclxuICAgIGNvbnN0IEExID0gZTEueS1zMS55O1xyXG4gICAgY29uc3QgQjEgPSBzMS54LWUxLng7XHJcbiAgICBjb25zdCBBMiA9IGUyLnktczIueTtcclxuICAgIGNvbnN0IEIyID0gczIueC1lMi54O1xyXG5cclxuICAgIC8vIEdldCBkZWx0YSBhbmQgY2hlY2sgaWYgdGhlIGxpbmVzIGFyZSBwYXJhbGxlbFxyXG4gICAgY29uc3QgZGVsdGEgPSBBMSpCMiAtIEEyKkIxO1xyXG4gICAgaWYoZGVsdGEgPT09IDApIHJldHVybiB7aW50ZXJzZWN0OiBudWxsLCBwYXJhbGxlbDogdHJ1ZX07XHJcblxyXG4gICAgY29uc3QgQzIgPSBBMipzMi54K0IyKnMyLnk7XHJcbiAgICBjb25zdCBDMSA9IEExKnMxLngrQjEqczEueTtcclxuICAgIC8vaW52ZXJ0IGRlbHRhIHRvIG1ha2UgZGl2aXNpb24gY2hlYXBlclxyXG4gICAgY29uc3QgaW52ZGVsdGEgPSAxL2RlbHRhO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdDogUG9pbnQgPSB7eDogKEIyKkMxIC0gQjEqQzIpKmludmRlbHRhLCB5OiAoQTEqQzIgLSBBMipDMSkqaW52ZGVsdGF9O1xyXG4gICAgaWYgKCFwb2ludEluTGluZXMoaW50ZXJzZWN0LCBzMSwgZTEsIHMyLCBlMikpXHJcbiAgICAgICAgcmV0dXJuIHtpbnRlcnNlY3Q6IG51bGwsIHBhcmFsbGVsOiBmYWxzZX07XHJcbiAgICByZXR1cm4ge2ludGVyc2VjdDogaW50ZXJzZWN0LCBwYXJhbGxlbDogZmFsc2V9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UG9pbnREaXN0YW5jZShwMTogUG9pbnQsIHAyOiBQb2ludCkge1xyXG4gICAgY29uc3QgYSA9IHAxLnggLSBwMi54O1xyXG4gICAgY29uc3QgYiA9IHAxLnkgLSBwMi55O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggYSphICsgYipiICk7XHJcbn0iLCJpbXBvcnQge2dldFVuaXREaXN0YW5jZSwgbDJ3LCBsMnd4LCBsMnd5LCB3MmwsIHcybHIsIHcybHgsIHcybHksIHcybHp9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7U2hhcGUsIENpcmNsZSwgY3JlYXRlU2hhcGVGcm9tRGljdCwgUmVjdCwgQm91bmRpbmdSZWN0LCBCYXNlUmVjdH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcbmltcG9ydCB7UG9pbnR9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IExvY2F0aW9uT3B0aW9ucywgU2VydmVyU2hhcGUgfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBMYXllck1hbmFnZXIge1xyXG4gICAgbGF5ZXJzOiBMYXllcltdID0gW107XHJcbiAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgc2VsZWN0ZWRMYXllcjogc3RyaW5nID0gXCJcIjtcclxuXHJcbiAgICBVVUlETWFwOiBNYXA8c3RyaW5nLCBTaGFwZT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgZ3JpZFNpemUgPSA1MDtcclxuICAgIHVuaXRTaXplID0gNTtcclxuICAgIHVzZUdyaWQgPSB0cnVlO1xyXG4gICAgZnVsbEZPVyA9IGZhbHNlO1xyXG4gICAgZm93T3BhY2l0eSA9IDAuMztcclxuXHJcbiAgICB6b29tRmFjdG9yID0gMTtcclxuICAgIHBhblggPSAwO1xyXG4gICAgcGFuWSA9IDA7XHJcblxyXG4gICAgLy8gUmVmcmVzaCBpbnRlcnZhbCBhbmQgcmVkcmF3IHNldHRlci5cclxuICAgIGludGVydmFsID0gMzA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGxtLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgbG0ubGF5ZXJzW2ldLmRyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMuaW50ZXJ2YWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE9wdGlvbnMob3B0aW9uczogTG9jYXRpb25PcHRpb25zKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKFwidW5pdFNpemVcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldFVuaXRTaXplKG9wdGlvbnMudW5pdFNpemUpO1xyXG4gICAgICAgIGlmIChcInVzZUdyaWRcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldFVzZUdyaWQob3B0aW9ucy51c2VHcmlkKTtcclxuICAgICAgICBpZiAoXCJmdWxsRk9XXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRGdWxsRk9XKG9wdGlvbnMuZnVsbEZPVyk7XHJcbiAgICAgICAgaWYgKCdmb3dPcGFjaXR5JyBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLnNldEZPV09wYWNpdHkob3B0aW9ucy5mb3dPcGFjaXR5KTtcclxuICAgICAgICBpZiAoXCJmb3dDb2xvdXJcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5mb3dDb2xvdXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFdpZHRoKHdpZHRoOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZExheWVyKGxheWVyOiBMYXllcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLnB1c2gobGF5ZXIpO1xyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkTGF5ZXIgPT09IFwiXCIgJiYgbGF5ZXIuc2VsZWN0YWJsZSkgdGhpcy5zZWxlY3RlZExheWVyID0gbGF5ZXIubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBoYXNMYXllcihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sYXllcnMuc29tZShsID0+IGwubmFtZSA9PT0gbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TGF5ZXIobmFtZT86IHN0cmluZykge1xyXG4gICAgICAgIG5hbWUgPSAobmFtZSA9PT0gdW5kZWZpbmVkKSA/IHRoaXMuc2VsZWN0ZWRMYXllciA6IG5hbWU7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMubGF5ZXJzW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL3RvZG8gcmVuYW1lIHRvIHNlbGVjdExheWVyXHJcbiAgICBzZXRMYXllcihuYW1lOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgICAgICBjb25zdCBsbSA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5sYXllcnMuZm9yRWFjaChmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCkgbGF5ZXIuY3R4Lmdsb2JhbEFscGhhID0gMC4zO1xyXG4gICAgICAgICAgICBlbHNlIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDEuMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBsYXllci5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBsbS5zZWxlY3RlZExheWVyID0gbmFtZTtcclxuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0R3JpZExheWVyKCk6IExheWVyfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXIoXCJncmlkXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdHcmlkKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5nZXRHcmlkTGF5ZXIoKTtcclxuICAgICAgICBpZiAobGF5ZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGN0eCA9IGxheWVyLmN0eDtcclxuICAgICAgICBsYXllci5jbGVhcigpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXllci53aWR0aDsgaSArPSB0aGlzLmdyaWRTaXplICogdGhpcy56b29tRmFjdG9yKSB7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgMCk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgbGF5ZXIuaGVpZ2h0KTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbygwLCBpICsgKHRoaXMucGFuWSAlIHRoaXMuZ3JpZFNpemUpICogdGhpcy56b29tRmFjdG9yKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyhsYXllci53aWR0aCwgaSArICh0aGlzLnBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3Rvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBnYW1lTWFuYWdlci5ncmlkQ29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIGxheWVyLnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5oYXNMYXllcihcImZvd1wiKSlcclxuICAgICAgICAgICAgdGhpcy5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRHcmlkU2l6ZShncmlkU2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdyaWRTaXplICE9PSB0aGlzLmdyaWRTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JpZFNpemUgPSBncmlkU2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjZ3JpZFNpemVJbnB1dCcpLnZhbChncmlkU2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVuaXRTaXplKHVuaXRTaXplOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBpZiAodW5pdFNpemUgIT09IHRoaXMudW5pdFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy51bml0U2l6ZSA9IHVuaXRTaXplO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICQoJyN1bml0U2l6ZUlucHV0JykudmFsKHVuaXRTaXplKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VXNlR3JpZCh1c2VHcmlkOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHVzZUdyaWQgIT09IHRoaXMudXNlR3JpZCkge1xyXG4gICAgICAgICAgICB0aGlzLnVzZUdyaWQgPSB1c2VHcmlkO1xyXG4gICAgICAgICAgICBpZiAodXNlR3JpZClcclxuICAgICAgICAgICAgICAgICQoJyNncmlkLWxheWVyJykuc2hvdygpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLmhpZGUoKTtcclxuICAgICAgICAgICAgJCgnI3VzZUdyaWRJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIHVzZUdyaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRGdWxsRk9XKGZ1bGxGT1c6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZnVsbEZPVyAhPT0gdGhpcy5mdWxsRk9XKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnVsbEZPVyA9IGZ1bGxGT1c7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvd2wgPSB0aGlzLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgJCgnI3VzZUZPV0lucHV0JykucHJvcChcImNoZWNrZWRcIiwgZnVsbEZPVyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEZPV09wYWNpdHkoZm93T3BhY2l0eTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcclxuICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICQoJyNmb3dPcGFjaXR5JykudmFsKGZvd09wYWNpdHkpO1xyXG4gICAgfVxyXG5cclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubGF5ZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXIge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgd2lkdGg6IG51bWJlcjtcclxuICAgIGhlaWdodDogbnVtYmVyO1xyXG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHNlbGVjdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHBsYXllcl9lZGl0YWJsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFdoZW4gc2V0IHRvIGZhbHNlLCB0aGUgbGF5ZXIgd2lsbCBiZSByZWRyYXduIG9uIHRoZSBuZXh0IHRpY2tcclxuICAgIHZhbGlkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAvLyBUaGUgY29sbGVjdGlvbiBvZiBzaGFwZXMgdGhhdCB0aGlzIGxheWVyIGNvbnRhaW5zLlxyXG4gICAgLy8gVGhlc2UgYXJlIG9yZGVyZWQgb24gYSBkZXB0aCBiYXNpcy5cclxuICAgIHNoYXBlczogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIENvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgYXJlIGN1cnJlbnRseSBzZWxlY3RlZFxyXG4gICAgc2VsZWN0aW9uOiBTaGFwZVtdID0gW107XHJcblxyXG4gICAgLy8gRXh0cmEgc2VsZWN0aW9uIGhpZ2hsaWdodGluZyBzZXR0aW5nc1xyXG4gICAgc2VsZWN0aW9uQ29sb3IgPSAnI0NDMDAwMCc7XHJcbiAgICBzZWxlY3Rpb25XaWR0aCA9IDI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgbmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKHNraXBMaWdodFVwZGF0ZTogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAoIXNraXBMaWdodFVwZGF0ZSAmJiB0aGlzLm5hbWUgIT09IFwiZm93XCIgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICBzaGFwZS5sYXllciA9IHRoaXMubmFtZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5wdXNoKHNoYXBlKTtcclxuICAgICAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgaWYgKHN5bmMpIHNvY2tldC5lbWl0KFwiYWRkIHNoYXBlXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIHRlbXBvcmFyeTogdGVtcG9yYXJ5fSk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoYXBlKTtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNlcnZlclNoYXBlW10pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB0OiBTaGFwZVtdID0gW107XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSk7XHJcbiAgICAgICAgICAgIHNoLmxheWVyID0gc2VsZi5uYW1lO1xyXG4gICAgICAgICAgICBzaC5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICBzaC5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5zZXQoc2hhcGUudXVpZCwgc2gpO1xyXG4gICAgICAgICAgICB0LnB1c2goc2gpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW107IC8vIFRPRE86IEZpeCBrZWVwaW5nIHNlbGVjdGlvbiBvbiB0aG9zZSBpdGVtcyB0aGF0IGFyZSBub3QgbW92ZWQuXHJcbiAgICAgICAgdGhpcy5zaGFwZXMgPSB0O1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRlbXBvcmFyeSA9PT0gdW5kZWZpbmVkKSB0ZW1wb3JhcnkgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UodGhpcy5zaGFwZXMuaW5kZXhPZihzaGFwZSksIDEpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcInJlbW92ZSBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgICAgIGNvbnN0IGxzX2kgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZmluZEluZGV4KGxzID0+IGxzLnNoYXBlID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBjb25zdCBsYl9pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGNvbnN0IG1iX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgaWYgKGxzX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShsc19pLCAxKTtcclxuICAgICAgICBpZiAobGJfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZShsYl9pLCAxKTtcclxuICAgICAgICBpZiAobWJfaSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZShtYl9pLCAxKTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5kZWxldGUoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zZWxlY3Rpb24uaW5kZXhPZihzaGFwZSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID49IDApXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoZG9DbGVhcj86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGRvQ2xlYXIgPSBkb0NsZWFyID09PSB1bmRlZmluZWQgPyB0cnVlIDogZG9DbGVhcjtcclxuXHJcbiAgICAgICAgICAgIGlmIChkb0NsZWFyKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNoYXBlLnZpc2libGVJbkNhbnZhcyhzdGF0ZS5jYW52YXMpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUubmFtZSA9PT0gJ2ZvdycgJiYgc2hhcGUudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhLm5hbWUgIT09IHN0YXRlLm5hbWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHNoYXBlLmRyYXcoY3R4KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuc2VsZWN0aW9uQ29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuc2VsZWN0aW9uV2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjdHguc3Ryb2tlUmVjdCh3Mmx4KHNlbC54KSwgdzJseShzZWwueSksIHNlbC53ICogeiwgc2VsLmggKiB6KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9wcmlnaHRcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodzJseChzZWwueCArIHNlbC53IC0gMyksIHcybHkoc2VsLnkgLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0b3BsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggLSAzKSwgdzJseShzZWwueSAtIDMpLCA2ICogeiwgNiAqIHopO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGJvdHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggKyBzZWwudyAtIDMpLCB3Mmx5KHNlbC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBib3RsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggLSAzKSwgdzJseShzZWwueSArIHNlbC5oIC0gMyksIDYgKiB6LCA2ICogeilcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TW91c2UoZTogTW91c2VFdmVudCk6IFBvaW50IHtcclxuICAgICAgICByZXR1cm4ge3g6IGUucGFnZVgsIHk6IGUucGFnZVl9O1xyXG4gICAgfTtcclxuXHJcbiAgICBtb3ZlU2hhcGVPcmRlcihzaGFwZTogU2hhcGUsIGRlc3RpbmF0aW9uSW5kZXg6IG51bWJlciwgc3luYzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IG9sZElkeCA9IHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpO1xyXG4gICAgICAgIGlmIChvbGRJZHggPT09IGRlc3RpbmF0aW9uSW5kZXgpIHJldHVybjtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2Uob2xkSWR4LCAxKTtcclxuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoZGVzdGluYXRpb25JbmRleCwgMCwgc2hhcGUpO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcIm1vdmVTaGFwZU9yZGVyXCIsIHtzaGFwZTogc2hhcGUuYXNEaWN0KCksIGluZGV4OiBkZXN0aW5hdGlvbkluZGV4fSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICBvblNoYXBlTW92ZShzaGFwZT86IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdyaWRMYXllciBleHRlbmRzIExheWVyIHtcclxuICAgIGludmFsaWRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dMYXllciBleHRlbmRzIExheWVyIHtcclxuXHJcbiAgICBhZGRTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc3VwZXIuYWRkU2hhcGUoc2hhcGUsIHN5bmMsIHRlbXBvcmFyeSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0U2hhcGVzKHNoYXBlczogU2VydmVyU2hhcGVbXSk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGMgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgc2hhcGUuZmlsbCA9IGM7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc3VwZXIuc2V0U2hhcGVzKHNoYXBlcyk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU6IFNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLm9uU2hhcGVNb3ZlKHNoYXBlKTtcclxuICAgIH07XHJcblxyXG4gICAgZHJhdygpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgICAgIGNvbnN0IG9yaWdfb3AgPSBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9nYWxwaGEgPSB0aGlzLmN0eC5nbG9iYWxBbHBoYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiY29weVwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBvZ2FscGhhO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJ0b2tlbnNcIikpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcInRva2Vuc1wiKSEuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaC5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYiA9IHNoLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IHcybChzaC5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWxtID0gMC44ICogdzJseihiYi53KTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAobHMpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxzLnNoYXBlKTtcclxuICAgICAgICAgICAgICAgIGlmIChzaCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXVyYSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPbGQgbGlnaHRzb3VyY2Ugc3RpbGwgbGluZ2VyaW5nIGluIHRoZSBnYW1lTWFuYWdlciBsaXN0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbGVuZ3RoID0gZ2V0VW5pdERpc3RhbmNlKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsY2VudGVyID0gdzJsKGNlbnRlcik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gbmV3IENpcmNsZShjZW50ZXIueCwgY2VudGVyLnksIGF1cmFfbGVuZ3RoKS5nZXRCb3VuZGluZ0JveCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNvbGxlY3QgYWxsIGxpZ2h0YmxvY2tlcnMgdGhhdCBhcmUgaW5zaWRlL2Nyb3NzIG91ciBhdXJhXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHRvIHByZXZlbnQgYXMgbWFueSByYXkgY2FsY3VsYXRpb25zIGFzIHBvc3NpYmxlXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbF9saWdodGJsb2NrZXJzOiBCb3VuZGluZ1JlY3RbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5mb3JFYWNoKGZ1bmN0aW9uIChsYikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYiA9PT0gc2gudXVpZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX3NoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbGJfc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGJfYmIuaW50ZXJzZWN0c1dpdGgoYmJveCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsX2xpZ2h0YmxvY2tlcnMucHVzaChsYl9iYik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyY19zdGFydCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FzdCByYXlzIGluIGV2ZXJ5IGRlZ3JlZVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYW5nbGUgPSAwOyBhbmdsZSA8IDIgKiBNYXRoLlBJOyBhbmdsZSArPSAoMSAvIDE4MCkgKiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaGl0IHdpdGggb2JzdHJ1Y3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBsZXQgaGl0OiB7aW50ZXJzZWN0OiBQb2ludHxudWxsLCBkaXN0YW5jZTpudW1iZXJ9ID0ge2ludGVyc2VjdDogbnVsbCwgZGlzdGFuY2U6IEluZmluaXR5fTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0OiBudWxsfEJvdW5kaW5nUmVjdCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaT0wOyBpPGxvY2FsX2xpZ2h0YmxvY2tlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfYmIgPSBsb2NhbF9saWdodGJsb2NrZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsYl9iYi5nZXRJbnRlcnNlY3RXaXRoTGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogY2VudGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBjZW50ZXIueSArIGF1cmFfbGVuZ3RoICogTWF0aC5zaW4oYW5nbGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmludGVyc2VjdCAhPT0gbnVsbCAmJiByZXN1bHQuZGlzdGFuY2UgPCBoaXQuZGlzdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpdCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlX2hpdCA9IGxiX2JiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgbm8gaGl0LCBjaGVjayBpZiB3ZSBjb21lIGZyb20gYSBwcmV2aW91cyBoaXQgc28gdGhhdCB3ZSBjYW4gZ28gYmFjayB0byB0aGUgYXJjXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpdC5pbnRlcnNlY3QgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IGFuZ2xlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3Mmx4KGNlbnRlci54ICsgYXVyYV9sZW5ndGggKiBNYXRoLmNvcyhhbmdsZSkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcybHkoY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIGhpdCAsIGZpcnN0IGZpbmlzaCBhbnkgb25nb2luZyBhcmMsIHRoZW4gbW92ZSB0byB0aGUgaW50ZXJzZWN0aW9uIHBvaW50XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgdzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCBhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFYID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGVfaGl0ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhWCA9IChzaGFwZV9oaXQudyAvIDQpICogTWF0aC5jb3MoYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYVkgPSAoc2hhcGVfaGl0LmggLyA0KSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCFzaGFwZV9oaXQuY29udGFpbnMoaGl0LmludGVyc2VjdC54ICsgZXh0cmFYLCBoaXQuaW50ZXJzZWN0LnkgKyBleHRyYVksIGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVggPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVkgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHcybHgoaGl0LmludGVyc2VjdC54ICsgZXh0cmFYKSwgdzJseShoaXQuaW50ZXJzZWN0LnkgKyBleHRyYVkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgIT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIHcybHIoYXVyYS52YWx1ZSksIGFyY19zdGFydCwgMiAqIE1hdGguUEkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGFsbSA9IHcybHIoYXVyYS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBncmFkaWVudCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtIC8gMiwgbGNlbnRlci54LCBsY2VudGVyLnksIGFsbSk7XHJcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwgMCwgMCwgMSknKTtcclxuICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xyXG4gICAgICAgICAgICAgICAgLy8gY3R4LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxKVwiO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgIHN1cGVyLmRyYXcoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mdWxsRk9XKTtcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9yaWdfb3A7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHNvY2tldCBmcm9tICcuL3NvY2tldCdcclxuaW1wb3J0IHsgbDJ3IH0gZnJvbSBcIi4vdW5pdHNcIjtcclxuaW1wb3J0IHsgU2hhcGUsIEFzc2V0LCBjcmVhdGVTaGFwZUZyb21EaWN0IH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcbmltcG9ydCB7IERyYXdUb29sLCBSdWxlclRvb2wsIE1hcFRvb2wsIEZPV1Rvb2wsIEluaXRpYXRpdmVUcmFja2VyLCBUb29sIH0gZnJvbSBcIi4vdG9vbHNcIjtcclxuaW1wb3J0IHsgTGF5ZXJNYW5hZ2VyLCBMYXllciwgR3JpZExheWVyLCBGT1dMYXllciB9IGZyb20gXCIuL2xheWVyc1wiO1xyXG5pbXBvcnQgeyBDbGllbnRPcHRpb25zLCBCb2FyZEluZm8sIFNlcnZlclNoYXBlLCBJbml0aWF0aXZlRGF0YSB9IGZyb20gJy4vYXBpX3R5cGVzJztcclxuaW1wb3J0IHsgT3JkZXJlZE1hcCB9IGZyb20gJy4vdXRpbHMnO1xyXG5cclxuY2xhc3MgR2FtZU1hbmFnZXIge1xyXG4gICAgSVNfRE0gPSBmYWxzZTtcclxuICAgIHVzZXJuYW1lOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgYm9hcmRfaW5pdGlhbGlzZWQgPSBmYWxzZTtcclxuICAgIGxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgIHNlbGVjdGVkVG9vbDogbnVtYmVyID0gMDtcclxuICAgIHRvb2xzOiBPcmRlcmVkTWFwPHN0cmluZywgVG9vbD4gPSBuZXcgT3JkZXJlZE1hcCgpO1xyXG4gICAgbGlnaHRzb3VyY2VzOiB7IHNoYXBlOiBzdHJpbmcsIGF1cmE6IHN0cmluZyB9W10gPSBbXTtcclxuICAgIGxpZ2h0YmxvY2tlcnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBtb3ZlbWVudGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgZ3JpZENvbG91ciA9ICQoXCIjZ3JpZENvbG91clwiKTtcclxuICAgIGZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xyXG4gICAgaW5pdGlhdGl2ZVRyYWNrZXIgPSBuZXcgSW5pdGlhdGl2ZVRyYWNrZXIoKTtcclxuICAgIHNoYXBlU2VsZWN0aW9uRGlhbG9nID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5kaWFsb2coe1xyXG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9KTtcclxuICAgIGluaXRpYXRpdmVEaWFsb2cgPSAkKFwiI2luaXRpYXRpdmVkaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICcxNjBweCdcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2JhKDI1NSwwLDAsIDAuNSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2dyaWRDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZ2IoODIsIDgxLCA4MSlcIixcclxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5maWxsID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2Zvd0NvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0dXBCb2FyZChyb29tOiBCb2FyZEluZm8pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlciA9IG5ldyBMYXllck1hbmFnZXIoKTtcclxuICAgICAgICBjb25zdCBsYXllcnNkaXYgPSAkKCcjbGF5ZXJzJyk7XHJcbiAgICAgICAgbGF5ZXJzZGl2LmVtcHR5KCk7XHJcbiAgICAgICAgY29uc3QgbGF5ZXJzZWxlY3RkaXYgPSAkKCcjbGF5ZXJzZWxlY3QnKTtcclxuICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwidWxcIikuZW1wdHkoKTtcclxuICAgICAgICBsZXQgc2VsZWN0YWJsZV9sYXllcnMgPSAwO1xyXG5cclxuICAgICAgICBjb25zdCBsbSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikuZmluZChcImRpdlwiKTtcclxuICAgICAgICBsbS5jaGlsZHJlbigpLm9mZigpO1xyXG4gICAgICAgIGxtLmVtcHR5KCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb29tLmxvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSAkKFwiPGRpdj5cIiArIHJvb20ubG9jYXRpb25zW2ldICsgXCI8L2Rpdj5cIik7XHJcbiAgICAgICAgICAgIGxtLmFwcGVuZChsb2MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsbXBsdXMgPSAkKCc8ZGl2PjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9kaXY+Jyk7XHJcbiAgICAgICAgbG0uYXBwZW5kKGxtcGx1cyk7XHJcbiAgICAgICAgbG0uY2hpbGRyZW4oKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvY25hbWUgPSBwcm9tcHQoXCJOZXcgbG9jYXRpb24gbmFtZVwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2NuYW1lICE9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwibmV3IGxvY2F0aW9uXCIsIGxvY25hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJjaGFuZ2UgbG9jYXRpb25cIiwgZS50YXJnZXQudGV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5ib2FyZC5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3X2xheWVyID0gcm9vbS5ib2FyZC5sYXllcnNbaV07XHJcbiAgICAgICAgICAgIC8vIFVJIGNoYW5nZXNcclxuICAgICAgICAgICAgbGF5ZXJzZGl2LmFwcGVuZChcIjxjYW52YXMgaWQ9J1wiICsgbmV3X2xheWVyLm5hbWUgKyBcIi1sYXllcicgc3R5bGU9J3otaW5kZXg6IFwiICsgaSArIFwiJz48L2NhbnZhcz5cIik7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuc2VsZWN0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGV4dHJhID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPT09IDApIGV4dHJhID0gXCIgY2xhc3M9J2xheWVyLXNlbGVjdGVkJ1wiO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZCgndWwnKS5hcHBlbmQoXCI8bGkgaWQ9J3NlbGVjdC1cIiArIG5ld19sYXllci5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgbmV3X2xheWVyLm5hbWUgKyBcIjwvYT48L2xpPlwiKTtcclxuICAgICAgICAgICAgICAgIHNlbGVjdGFibGVfbGF5ZXJzICs9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PiQoJyMnICsgbmV3X2xheWVyLm5hbWUgKyAnLWxheWVyJylbMF07XHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBTdGF0ZSBjaGFuZ2VzXHJcbiAgICAgICAgICAgIGxldCBsOiBMYXllcjtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKVxyXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBHcmlkTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld19sYXllci5uYW1lID09PSAnZm93JylcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgRk9XTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XHJcbiAgICAgICAgICAgIGwuc2VsZWN0YWJsZSA9IG5ld19sYXllci5zZWxlY3RhYmxlO1xyXG4gICAgICAgICAgICBsLnBsYXllcl9lZGl0YWJsZSA9IG5ld19sYXllci5wbGF5ZXJfZWRpdGFibGU7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5hZGRMYXllcihsKTtcclxuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUobmV3X2xheWVyLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgICAgICAgICAkKFwiI2dyaWQtbGF5ZXJcIikuZHJvcHBhYmxlKHtcclxuICAgICAgICAgICAgICAgICAgICBhY2NlcHQ6IFwiLmRyYWdnYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyb3A6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIHRvIGRyb3AgdGhlIHRva2VuIG9uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpDYW52YXMgPSAkKGwuY2FudmFzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGpDYW52YXMubGVuZ3RoID09PSAwKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ2FudmFzIG1pc3NpbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gakNhbnZhcy5vZmZzZXQoKSE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB1aS5vZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogdWkub2Zmc2V0LnRvcCAtIG9mZnNldC50b3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnggPCBzZXR0aW5nc19tZW51LndpZHRoKCkhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSAmJiBsb2MueSA8IGxvY2F0aW9uc19tZW51LndpZHRoKCkhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWR0aCA9IHVpLmhlbHBlclswXS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGVpZ2h0ID0gdWkuaGVscGVyWzBdLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2xvYyA9IGwydyhsb2MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWcgPSA8SFRNTEltYWdlRWxlbWVudD51aS5kcmFnZ2FibGVbMF0uY2hpbGRyZW5bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gbmV3IEFzc2V0KGltZywgd2xvYy54LCB3bG9jLnksIGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnNyYyA9IGltZy5zcmM7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQueCA9IE1hdGgucm91bmQoYXNzZXQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQueSA9IE1hdGgucm91bmQoYXNzZXQueSAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQudyA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbC5hZGRTaGFwZShhc3NldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsLnNldFNoYXBlcyhuZXdfbGF5ZXIuc2hhcGVzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb3JjZSB0aGUgY29ycmVjdCBvcGFjaXR5IHJlbmRlciBvbiBvdGhlciBsYXllcnMuXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpIS5uYW1lKTtcclxuICAgICAgICAvLyBzb2NrZXQuZW1pdChcImNsaWVudCBpbml0aWFsaXNlZFwiKTtcclxuICAgICAgICB0aGlzLmJvYXJkX2luaXRpYWxpc2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGFibGVfbGF5ZXJzID4gMSkge1xyXG4gICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwibGlcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5pZC5zcGxpdChcIi1cIilbMV07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSBsYXllcnNlbGVjdGRpdi5maW5kKFwiI3NlbGVjdC1cIiArIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKTtcclxuICAgICAgICAgICAgICAgIGlmIChuYW1lICE9PSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2VsZWN0ZWRMYXllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBvbGQucmVtb3ZlQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIobmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNlcnZlclNoYXBlKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn0gY291bGQgbm90IGJlIGFkZGVkYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpLCBmYWxzZSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVNoYXBlKHNoYXBlOiBTZXJ2ZXJTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlLCB0cnVlKSk7XHJcbiAgICAgICAgcmVhbF9zaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKHJlYWxfc2hhcGUubGF5ZXIpIS5vblNoYXBlTW92ZShyZWFsX3NoYXBlKTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVTaGFwZShkYXRhOiB7c2hhcGU6IFNlcnZlclNoYXBlOyByZWRyYXc6IGJvb2xlYW47fSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHNoYXBlID0gT2JqZWN0LmFzc2lnbih0aGlzLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpLCBjcmVhdGVTaGFwZUZyb21EaWN0KGRhdGEuc2hhcGUsIHRydWUpKTtcclxuICAgICAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgaWYgKGRhdGEucmVkcmF3KVxyXG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihkYXRhLnNoYXBlLmxheWVyKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SW5pdGlhdGl2ZShkYXRhOiBJbml0aWF0aXZlRGF0YVtdKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5kYXRhID0gZGF0YTtcclxuICAgICAgICB0aGlzLmluaXRpYXRpdmVUcmFja2VyLnJlZHJhdygpO1xyXG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENsaWVudE9wdGlvbnMob3B0aW9uczogQ2xpZW50T3B0aW9ucyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChcImdyaWRDb2xvdXJcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgICAgICB0aGlzLmdyaWRDb2xvdXIuc3BlY3RydW0oXCJzZXRcIiwgb3B0aW9ucy5ncmlkQ29sb3VyKTtcclxuICAgICAgICBpZiAoXCJmb3dDb2xvdXJcIiBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXCJwYW5YXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIucGFuWCA9IG9wdGlvbnMucGFuWDtcclxuICAgICAgICBpZiAoXCJwYW5ZXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIucGFuWSA9IG9wdGlvbnMucGFuWTtcclxuICAgICAgICBpZiAoXCJ6b29tRmFjdG9yXCIgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gb3B0aW9ucy56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAkKFwiI3pvb21lclwiKS5zbGlkZXIoeyB2YWx1ZTogMSAvIG9wdGlvbnMuem9vbUZhY3RvciB9KTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJNYW5hZ2VyLmdldEdyaWRMYXllcigpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubGV0IGdhbWVNYW5hZ2VyID0gbmV3IEdhbWVNYW5hZ2VyKCk7XHJcbig8YW55PndpbmRvdykuZ2FtZU1hbmFnZXIgPSBnYW1lTWFuYWdlcjtcclxuXHJcbi8vICoqKiogU0VUVVAgVUkgKioqKlxyXG5cclxuLy8gcHJldmVudCBkb3VibGUgY2xpY2tpbmcgdGV4dCBzZWxlY3Rpb25cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICAkbWVudS5oaWRlKCk7XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VEb3duKGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VNb3ZlKGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlVXAoZSk7XHJcbn1cclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG9uUG9pbnRlckRvd24pO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvblBvaW50ZXJNb3ZlKTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uUG9pbnRlclVwKTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uIChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoZS5idXR0b24gIT09IDIgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Db250ZXh0TWVudShlKTtcclxufSk7XHJcblxyXG4kKFwiI3pvb21lclwiKS5zbGlkZXIoe1xyXG4gICAgb3JpZW50YXRpb246IFwidmVydGljYWxcIixcclxuICAgIG1pbjogMC41LFxyXG4gICAgbWF4OiA1LjAsXHJcbiAgICBzdGVwOiAwLjEsXHJcbiAgICB2YWx1ZTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IsXHJcbiAgICBzbGlkZTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIGNvbnN0IG9yaWdaID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgbmV3WiA9IDEgLyB1aS52YWx1ZSE7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG9yaWdaO1xyXG4gICAgICAgIGNvbnN0IG5ld1ggPSB3aW5kb3cuaW5uZXJXaWR0aCAvIG5ld1o7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gbmV3WjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvciA9IG5ld1o7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblggLT0gKG9yaWdYIC0gbmV3WCkgLyAyO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZIC09IChvcmlnWSAtIG5ld1kpIC8gMjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICB6b29tRmFjdG9yOiBuZXdaLFxyXG4gICAgICAgICAgICBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCxcclxuICAgICAgICAgICAgcGFuWTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhbllcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG4kbWVudS5oaWRlKCk7XHJcblxyXG5jb25zdCBzZXR0aW5nc19tZW51ID0gJChcIiNtZW51XCIpITtcclxuY29uc3QgbG9jYXRpb25zX21lbnUgPSAkKFwiI2xvY2F0aW9ucy1tZW51XCIpITtcclxuY29uc3QgbGF5ZXJfbWVudSA9ICQoXCIjbGF5ZXJzZWxlY3RcIikhO1xyXG4kKFwiI3NlbGVjdGlvbi1tZW51XCIpLmhpZGUoKTtcclxuXHJcbiQoJyNybS1zZXR0aW5ncycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gb3JkZXIgb2YgYW5pbWF0aW9uIGlzIGltcG9ydGFudCwgaXQgb3RoZXJ3aXNlIHdpbGwgc29tZXRpbWVzIHNob3cgYSBzbWFsbCBnYXAgYmV0d2VlbiB0aGUgdHdvIG9iamVjdHNcclxuICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiB9KTtcclxuICAgICAgICBzZXR0aW5nc19tZW51LmFuaW1hdGUoeyB3aWR0aDogJ3RvZ2dsZScgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiLCB3aWR0aDogXCIrPTIwMHB4XCIgfSk7XHJcbiAgICAgICAgbGF5ZXJfbWVudS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgbGVmdDogXCIrPTIwMHB4XCIsIHdpZHRoOiBcIi09MjAwcHhcIiB9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG4kKCcjcm0tbG9jYXRpb25zJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyB0b3A6IFwiLT0xMDBweFwiIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBoZWlnaHQ6ICd0b2dnbGUnIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgaGVpZ2h0OiAndG9nZ2xlJyB9KTtcclxuICAgICAgICAkKCcjcmFkaWFsbWVudScpLmFuaW1hdGUoeyB0b3A6IFwiKz0xMDBweFwiIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRXaWR0aCh3aW5kb3cuaW5uZXJXaWR0aCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0SGVpZ2h0KHdpbmRvdy5pbm5lckhlaWdodCk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5cclxuJCgnYm9keScpLmtleXVwKGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAoZS5rZXlDb2RlID09PSA0NiAmJiBlLnRhcmdldC50YWdOYW1lICE9PSBcIklOUFVUXCIpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIgc2VsZWN0ZWQgZm9yIGRlbGV0ZSBvcGVyYXRpb25cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBsLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgbC5yZW1vdmVTaGFwZShzZWwsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShzZWwudXVpZCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoXCIjZ3JpZFNpemVJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgZ3MgPSBwYXJzZUludCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBncmlkc2l6ZVwiLCBncyk7XHJcbn0pO1xyXG5cclxuJChcIiN1bml0U2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1cyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVuaXRTaXplKHVzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICd1bml0U2l6ZSc6IHVzIH0pO1xyXG59KTtcclxuJChcIiN1c2VHcmlkSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVnID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVzZUdyaWQodWcpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VzZUdyaWQnOiB1ZyB9KTtcclxufSk7XHJcbiQoXCIjdXNlRk9XSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVmID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZ1bGxGT1codWYpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ2Z1bGxGT1cnOiB1ZiB9KTtcclxufSk7XHJcbiQoXCIjZm93T3BhY2l0eVwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgbGV0IGZvID0gcGFyc2VGbG9hdCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcclxuICAgIGlmIChpc05hTihmbykpIHtcclxuICAgICAgICAkKFwiI2Zvd09wYWNpdHlcIikudmFsKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mb3dPcGFjaXR5KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZiAoZm8gPCAwKSBmbyA9IDA7XHJcbiAgICBpZiAoZm8gPiAxKSBmbyA9IDE7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0Rk9XT3BhY2l0eShmbyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAnZm93T3BhY2l0eSc6IGZvIH0pO1xyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdhbWVNYW5hZ2VyOyIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IHV1aWR2NCwgUG9pbnQgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBnZXRMaW5lc0ludGVyc2VjdFBvaW50LCBnZXRQb2ludERpc3RhbmNlIH0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5pbXBvcnQgeyBsMnd4LCBsMnd5LCB3MmwsIHcybHIsIHcybHgsIHcybHkgfSBmcm9tIFwiLi91bml0c1wiO1xyXG5pbXBvcnQgeyBMYXllciB9IGZyb20gXCIuL2xheWVyc1wiO1xyXG5pbXBvcnQgeyBTZXJ2ZXJTaGFwZSB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xyXG5cclxuY29uc3QgJG1lbnUgPSAkKCcjY29udGV4dE1lbnUnKTtcclxuXHJcbmludGVyZmFjZSBUcmFja2VyIHtcclxuICAgIHV1aWQ6IHN0cmluZztcclxuICAgIHZpc2libGU6IGJvb2xlYW47XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICB2YWx1ZTogbnVtYmVyO1xyXG4gICAgbWF4dmFsdWU6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIEF1cmEge1xyXG4gICAgdXVpZDogc3RyaW5nO1xyXG4gICAgbGlnaHRTb3VyY2U6IGJvb2xlYW47XHJcbiAgICB2aXNpYmxlOiBib29sZWFuO1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgdmFsdWU6IG51bWJlcjtcclxuICAgIGRpbTogbnVtYmVyO1xyXG4gICAgY29sb3VyOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaGFwZSB7XHJcbiAgICB0eXBlOiBzdHJpbmcgPSBcInNoYXBlXCI7XHJcbiAgICB1dWlkOiBzdHJpbmc7XHJcbiAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHN0cmluZyA9IFwic291cmNlLW92ZXJcIjtcclxuICAgIGZpbGw6IHN0cmluZyA9ICcjMDAwJztcclxuICAgIGxheWVyOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgbmFtZSA9ICdVbmtub3duIHNoYXBlJztcclxuICAgIHRyYWNrZXJzOiBUcmFja2VyW10gPSBbXTtcclxuICAgIGF1cmFzOiBBdXJhW10gPSBbXTtcclxuICAgIG93bmVyczogc3RyaW5nW10gPSBbXTtcclxuICAgIHZpc2lvbk9ic3RydWN0aW9uID0gZmFsc2U7XHJcbiAgICBtb3ZlbWVudE9ic3RydWN0aW9uID0gZmFsc2U7XHJcblxyXG4gICAgY29uc3RydWN0b3IodXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMudXVpZCA9IHV1aWQgfHwgdXVpZHY0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0O1xyXG5cclxuICAgIGFic3RyYWN0IGNvbnRhaW5zKHg6IG51bWJlciwgeTogbnVtYmVyLCBpbldvcmxkQ29vcmQ6IGJvb2xlYW4pOiBib29sZWFuO1xyXG5cclxuICAgIGFic3RyYWN0IGNlbnRlcigpOiBQb2ludDtcclxuICAgIGFic3RyYWN0IGNlbnRlcihjZW50ZXJQb2ludDogUG9pbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3QgZ2V0Q29ybmVyKHg6IG51bWJlciwgeTpudW1iZXIpOiBzdHJpbmd8dW5kZWZpbmVkO1xyXG4gICAgYWJzdHJhY3QgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuO1xyXG5cclxuICAgIGNoZWNrTGlnaHRTb3VyY2VzKCkge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnN0IHZvX2kgPSBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmluZGV4T2YodGhpcy51dWlkKTtcclxuICAgICAgICBpZiAodGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgdm9faSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGxpZ2h0c291cmNlIGF1cmFzIGFyZSBpbiB0aGUgZ2FtZU1hbmFnZXJcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgICAgICBjb25zdCBpID0gbHMuZmluZEluZGV4KG8gPT4gby5hdXJhID09PSBhdS51dWlkKTtcclxuICAgICAgICAgICAgaWYgKGF1LmxpZ2h0U291cmNlICYmIGkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBscy5wdXNoKHsgc2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZCB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghYXUubGlnaHRTb3VyY2UgJiYgaSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBscy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBDaGVjayBpZiBhbnl0aGluZyBpbiB0aGUgZ2FtZU1hbmFnZXIgcmVmZXJlbmNpbmcgdGhpcyBzaGFwZSBpcyBpbiBmYWN0IHN0aWxsIGEgbGlnaHRzb3VyY2VcclxuICAgICAgICBmb3IgKGxldCBpID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzW2ldO1xyXG4gICAgICAgICAgICBpZiAobHMuc2hhcGUgPT09IHNlbGYudXVpZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLmF1cmFzLnNvbWUoYSA9PiBhLnV1aWQgPT09IGxzLmF1cmEgJiYgYS5saWdodFNvdXJjZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRNb3ZlbWVudEJsb2NrKGJsb2Nrc01vdmVtZW50OiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy5tb3ZlbWVudE9ic3RydWN0aW9uID0gYmxvY2tzTW92ZW1lbnQgfHwgZmFsc2U7XHJcbiAgICAgICAgY29uc3Qgdm9faSA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuaW5kZXhPZih0aGlzLnV1aWQpO1xyXG4gICAgICAgIGlmICh0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gJiYgdm9faSA9PT0gLTEpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMucHVzaCh0aGlzLnV1aWQpO1xyXG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gJiYgdm9faSA+PSAwKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBvd25lZEJ5KHVzZXJuYW1lPzogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHVzZXJuYW1lID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHVzZXJuYW1lID0gZ2FtZU1hbmFnZXIudXNlcm5hbWU7XHJcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLklTX0RNIHx8IHRoaXMub3duZXJzLmluY2x1ZGVzKHVzZXJuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNlbGVjdGlvbigpIHtcclxuICAgICAgICBpZiAoIXRoaXMudHJhY2tlcnMubGVuZ3RoIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCB0aGlzLnRyYWNrZXJzW3RoaXMudHJhY2tlcnMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApXHJcbiAgICAgICAgICAgIHRoaXMudHJhY2tlcnMucHVzaCh7IHV1aWQ6IHV1aWR2NCgpLCBuYW1lOiAnJywgdmFsdWU6IDAsIG1heHZhbHVlOiAwLCB2aXNpYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICBpZiAoIXRoaXMuYXVyYXMubGVuZ3RoIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApXHJcbiAgICAgICAgICAgIHRoaXMuYXVyYXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB1dWlkOiB1dWlkdjQoKSxcclxuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IDAsXHJcbiAgICAgICAgICAgICAgICBkaW06IDAsXHJcbiAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBjb2xvdXI6ICdyZ2JhKDAsMCwwLDApJyxcclxuICAgICAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW5hbWVcIikudGV4dCh0aGlzLm5hbWUpO1xyXG4gICAgICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzZWxlY3Rpb24tdHJhY2tlcnNcIik7XHJcbiAgICAgICAgdHJhY2tlcnMuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLnRyYWNrZXJzLmZvckVhY2goZnVuY3Rpb24gKHRyYWNrZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPiR7dHJhY2tlci5uYW1lfTwvZGl2PmApKTtcclxuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChgPGRpdiBpZD1cInNlbGVjdGlvbi10cmFja2VyLSR7dHJhY2tlci51dWlkfS12YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIGNsYXNzPVwic2VsZWN0aW9uLXRyYWNrZXItdmFsdWVcIj4ke3ZhbH08L2Rpdj5gKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IGF1cmFzID0gJChcIiNzZWxlY3Rpb24tYXVyYXNcIik7XHJcbiAgICAgICAgYXVyYXMuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1cmEpIHtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gYXVyYS5kaW0gPyBgJHthdXJhLnZhbHVlfS8ke2F1cmEuZGltfWAgOiBhdXJhLnZhbHVlO1xyXG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+JHthdXJhLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLWF1cmEtJHthdXJhLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tYXVyYS12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbWVudVwiKS5zaG93KCk7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3QgZWRpdGJ1dHRvbiA9ICQoXCIjc2VsZWN0aW9uLWVkaXQtYnV0dG9uXCIpO1xyXG4gICAgICAgIGlmICghdGhpcy5vd25lZEJ5KCkpXHJcbiAgICAgICAgICAgIGVkaXRidXR0b24uaGlkZSgpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWRpdGJ1dHRvbi5zaG93KCk7XHJcbiAgICAgICAgZWRpdGJ1dHRvbi5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbChzZWxmLnV1aWQpO1xyXG4gICAgICAgICAgICBjb25zdCBkaWFsb2dfbmFtZSA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbmFtZVwiKTtcclxuICAgICAgICAgICAgZGlhbG9nX25hbWUudmFsKHNlbGYubmFtZSk7XHJcbiAgICAgICAgICAgIGRpYWxvZ19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgICAgICAgICBzLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb25zdCBkaWFsb2dfbGlnaHRibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbGlnaHRibG9ja2VyXCIpO1xyXG4gICAgICAgICAgICBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLnZpc2lvbk9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgZGlhbG9nX2xpZ2h0YmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgcy52aXNpb25PYnN0cnVjdGlvbiA9IGRpYWxvZ19saWdodGJsb2NrLnByb3AoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHMuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpYWxvZ19tb3ZlYmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW1vdmVibG9ja2VyXCIpO1xyXG4gICAgICAgICAgICBkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgICAgIGRpYWxvZ19tb3ZlYmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gPHN0cmluZz4kKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgcy5zZXRNb3ZlbWVudEJsb2NrKGRpYWxvZ19tb3ZlYmxvY2sucHJvcChcImNoZWNrZWRcIikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG93bmVycyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctb3duZXJzXCIpO1xyXG4gICAgICAgICAgICBjb25zdCB0cmFja2VycyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdHJhY2tlcnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1cmFzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1hdXJhc1wiKTtcclxuICAgICAgICAgICAgb3duZXJzLm5leHRVbnRpbCh0cmFja2VycykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHRyYWNrZXJzLm5leHRVbnRpbChhdXJhcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIGF1cmFzLm5leHRVbnRpbCgkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmZpbmQoXCJmb3JtXCIpKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZE93bmVyKG93bmVyOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG93X25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLW5hbWU9XCIke293bmVyfVwiIHZhbHVlPVwiJHtvd25lcn1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvd19yZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0cmFja2Vycy5iZWZvcmUob3dfbmFtZS5hZGQob3dfcmVtb3ZlKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgb3dfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3dfaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5zcGxpY2Uob3dfaSwgMSwgPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnB1c2goPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgb3dfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG93X2kgPSBzZWxmLm93bmVycy5maW5kSW5kZXgobyA9PiBvID09PSAkKHRoaXMpLmRhdGEoJ25hbWUnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5zcGxpY2Uob3dfaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYub3duZXJzLmZvckVhY2goYWRkT3duZXIpO1xyXG4gICAgICAgICAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXSAhPT0gJycpXHJcbiAgICAgICAgICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZFRyYWNrZXIodHJhY2tlcjogVHJhY2tlcikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHJfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLm5hbWV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHJfdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJDdXJyZW50IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIudmFsdWV9XCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl9tYXh2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIk1heCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiIHZhbHVlPVwiJHt0cmFja2VyLm1heHZhbHVlIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl9yZW1vdmUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhdXJhcy5iZWZvcmUoXHJcbiAgICAgICAgICAgICAgICAgICAgdHJfbmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKHRyX3ZhbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+Lzwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKHRyX21heHZhbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQodHJfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQodHJfcmVtb3ZlKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRyYWNrZXIudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICB0cl92aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0cl9uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTmFtZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRyLm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWxmLnRyYWNrZXJzLmxlbmd0aCB8fCBzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudHJhY2tlcnMucHVzaCh7IHV1aWQ6IHV1aWR2NCgpLCBuYW1lOiAnJywgdmFsdWU6IDAsIG1heHZhbHVlOiAwLCB2aXNpYmxlOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkVHJhY2tlcihzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdHJfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmFsdWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0ci52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0cl9tYXh2YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJNYXp2YWx1ZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRyLm1heHZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSB0ci5tYXh2YWx1ZSA/IGAke3RyLnZhbHVlfS8ke3RyLm1heHZhbHVlfWAgOiB0ci52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRyX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVtb3ZlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHIubmFtZSA9PT0gJycgfHwgdHIudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dHIudXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5zcGxpY2Uoc2VsZi50cmFja2Vycy5pbmRleE9mKHRyKSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0cl92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWaXNpYmlsaXR5IGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdHIudmlzaWJsZSA9ICF0ci52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYudHJhY2tlcnMuZm9yRWFjaChhZGRUcmFja2VyKTtcclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGFkZEF1cmEoYXVyYTogQXVyYSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX3ZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiQ3VycmVudCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLnZhbHVlfVwiPmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9kaW12YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkRpbSB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLmRpbSB8fCBcIlwifVwiPmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9jb2xvdXIgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkF1cmEgY29sb3VyXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfbGlnaHQgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWxpZ2h0YnVsYlwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfcmVtb3ZlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5jaGlsZHJlbigpLmxhc3QoKS5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAgICAgYXVyYV9uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92YWwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPi88L3NwYW4+YClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX2RpbXZhbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCgkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApLmFwcGVuZChhdXJhX2NvbG91cikuYXBwZW5kKCQoXCI8L2Rpdj5cIikpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX2xpZ2h0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfcmVtb3ZlKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWF1cmEudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICBhdXJhX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFhdXJhLmxpZ2h0U291cmNlKVxyXG4gICAgICAgICAgICAgICAgICAgIGF1cmFfbGlnaHQuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1cmFfY29sb3VyLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBhdXJhLmNvbG91cixcclxuICAgICAgICAgICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBtb3ZlIHVua25vd24gYXVyYSBjb2xvdXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG8gbm90IHVzZSBhdXJhIGRpcmVjdGx5IGFzIGl0IGRvZXMgbm90IHdvcmsgcHJvcGVybHkgZm9yIG5ldyBhdXJhc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdS5jb2xvdXIgPSBjb2xvdXIudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhdXJhX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIG5hbWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGF1Lm5hbWUgPSA8c3RyaW5nPiQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYuYXVyYXMubGVuZ3RoIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCBzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hdXJhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpZ2h0U291cmNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEF1cmEoc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGF1cmFfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSB2YWx1ZSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYXUudmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBhdXJhX2RpbXZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgZGltdmFsdWUgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGF1LnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBhdS5kaW0gPyBgJHthdS52YWx1ZX0vJHthdS5kaW19YCA6IGF1LnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXVyYV9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byByZW1vdmUgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdS5uYW1lID09PSAnJyAmJiBhdS52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHthdS51dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmF1cmFzLnNwbGljZShzZWxmLmF1cmFzLmluZGV4T2YoYXUpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBhdXJhX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgdmlzaWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYXUudmlzaWJsZSA9ICFhdS52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdS52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBhdXJhX2xpZ2h0Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdG9nZ2xlIGxpZ2h0IGNhcGFiaWxpdHkgb2YgdW5rbm93biBhdXJhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGF1LmxpZ2h0U291cmNlID0gIWF1LmxpZ2h0U291cmNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdS5saWdodFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbHMucHVzaCh7IHNoYXBlOiBzZWxmLnV1aWQsIGF1cmE6IGF1LnV1aWQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID49IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBscy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJmb3dcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxmLmF1cmFzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBhZGRBdXJhKHNlbGYuYXVyYXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuc2hhcGVTZWxlY3Rpb25EaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKCcuc2VsZWN0aW9uLXRyYWNrZXItdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgICAgICBjb25zdCB0cmFja2VyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICAgICAgaWYgKHRyYWNrZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdXBkYXRlIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdfdHJhY2tlciA9IHByb21wdChgTmV3ICAke3RyYWNrZXIubmFtZX0gdmFsdWU6IChhYnNvbHV0ZSBvciByZWxhdGl2ZSlgKTtcclxuICAgICAgICAgICAgaWYgKG5ld190cmFja2VyID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAodHJhY2tlci52YWx1ZSA9PT0gMClcclxuICAgICAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgPSAwO1xyXG4gICAgICAgICAgICBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSArPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSAtPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VyLnZhbHVlID0gcGFyc2VJbnQobmV3X3RyYWNrZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgICAgICQodGhpcykudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgJCgnLnNlbGVjdGlvbi1hdXJhLXZhbHVlJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcclxuICAgICAgICAgICAgY29uc3QgYXVyYSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgICAgIGlmIChhdXJhID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmV3X2F1cmEgPSBwcm9tcHQoYE5ldyAgJHthdXJhLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XHJcbiAgICAgICAgICAgIGlmIChuZXdfYXVyYSA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApXHJcbiAgICAgICAgICAgICAgICBhdXJhLnZhbHVlID0gMDtcclxuICAgICAgICAgICAgaWYgKG5ld19hdXJhWzBdID09PSAnKycpIHtcclxuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5ld19hdXJhWzBdID09PSAnLScpIHtcclxuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgLT0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXVyYS52YWx1ZSA9IHBhcnNlSW50KG5ld19hdXJhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgICAgICQodGhpcykudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSlcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3Rpb25Mb3NzKCkge1xyXG4gICAgICAgIC8vICQoYCNzaGFwZXNlbGVjdGlvbmNvZy0ke3RoaXMudXVpZH1gKS5yZW1vdmUoKTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1tZW51XCIpLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc0RpY3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBpZiAodGhpcy5sYXllciA9PT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgdGhpcy5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgICAgIHRoaXMuZHJhd0F1cmFzKGN0eCk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0F1cmFzKGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGF1cmEuY29sb3VyO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwiZm93XCIpICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuY3R4ID09PSBjdHgpXHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJibGFja1wiO1xyXG4gICAgICAgICAgICBjb25zdCBsb2MgPSB3Mmwoc2VsZi5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB3MmxyKGF1cmEudmFsdWUpLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIGlmIChhdXJhLmRpbSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGMgPSB0aW55Y29sb3IoYXVyYS5jb2xvdXIpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRjLnNldEFscGhhKHRjLmdldEFscGhhKCkgLyAyKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jID0gdzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHcybHIoYXVyYS5kaW0pLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0NvbnRleHRNZW51KG1vdXNlOiBQb2ludCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBsLnNlbGVjdGlvbiA9IFt0aGlzXTtcclxuICAgICAgICB0aGlzLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgbC5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcztcclxuICAgICAgICAkbWVudS5zaG93KCk7XHJcbiAgICAgICAgJG1lbnUuZW1wdHkoKTtcclxuICAgICAgICAkbWVudS5jc3MoeyBsZWZ0OiBtb3VzZS54LCB0b3A6IG1vdXNlLnkgfSk7XHJcbiAgICAgICAgbGV0IGRhdGEgPSBcIlwiICtcclxuICAgICAgICAgICAgXCI8dWw+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaT5MYXllcjx1bD5cIjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zdCBzZWwgPSBsYXllci5uYW1lID09PSBsLm5hbWUgPyBcIiBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjphcXVhJyBcIiA6IFwiIFwiO1xyXG4gICAgICAgICAgICBkYXRhICs9IGA8bGkgZGF0YS1hY3Rpb249J3NldExheWVyJyBkYXRhLWxheWVyPScke2xheWVyLm5hbWV9JyAke3NlbH0gY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz4ke2xheWVyLm5hbWV9PC9saT5gO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGRhdGEgKz0gXCI8L3VsPjwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvQmFjaycgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGJhY2s8L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J21vdmVUb0Zyb250JyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPk1vdmUgdG8gZnJvbnQ8L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8bGkgZGF0YS1hY3Rpb249J2FkZEluaXRpYXRpdmUnIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+QWRkIGluaXRpYXRpdmU8L2xpPlwiICtcclxuICAgICAgICAgICAgXCI8L3VsPlwiO1xyXG4gICAgICAgICRtZW51Lmh0bWwoZGF0YSk7XHJcbiAgICAgICAgJChcIi5jb250ZXh0LWNsaWNrYWJsZVwiKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZUNvbnRleHRNZW51KCQodGhpcyksIGFzc2V0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJvdW5kaW5nUmVjdCB7XHJcbiAgICB0eXBlID0gXCJib3VuZHJlY3RcIjtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIHc6IG51bWJlcjtcclxuICAgIGg6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgdGhpcy53ID0gdztcclxuICAgICAgICB0aGlzLmggPSBoO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRhaW5zKHg6IG51bWJlciwgeTogbnVtYmVyLCBpbldvcmxkQ29vcmQ6IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoaW5Xb3JsZENvb3JkKSB7XHJcbiAgICAgICAgICAgIHggPSBsMnd4KHgpO1xyXG4gICAgICAgICAgICB5ID0gbDJ3eSh5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCA8PSB4ICYmICh0aGlzLnggKyB0aGlzLncpID49IHggJiZcclxuICAgICAgICAgICAgdGhpcy55IDw9IHkgJiYgKHRoaXMueSArIHRoaXMuaCkgPj0geTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcnNlY3RzV2l0aChvdGhlcjogQm91bmRpbmdSZWN0KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuICEob3RoZXIueCA+PSB0aGlzLnggKyB0aGlzLncgfHxcclxuICAgICAgICAgICAgb3RoZXIueCArIG90aGVyLncgPD0gdGhpcy54IHx8XHJcbiAgICAgICAgICAgIG90aGVyLnkgPj0gdGhpcy55ICsgdGhpcy5oIHx8XHJcbiAgICAgICAgICAgIG90aGVyLnkgKyBvdGhlci5oIDw9IHRoaXMueSk7XHJcbiAgICB9XHJcbiAgICBnZXRJbnRlcnNlY3RXaXRoTGluZShsaW5lOiB7IHN0YXJ0OiBQb2ludDsgZW5kOiBQb2ludCB9KSB7XHJcbiAgICAgICAgY29uc3QgbGluZXMgPSBbXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9LCB7IHg6IHRoaXMueCArIHRoaXMudywgeTogdGhpcy55IH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7IHg6IHRoaXMueCArIHRoaXMudywgeTogdGhpcy55IH0sIHtcclxuICAgICAgICAgICAgICAgIHg6IHRoaXMueCArIHRoaXMudyxcclxuICAgICAgICAgICAgICAgIHk6IHRoaXMueSArIHRoaXMuaFxyXG4gICAgICAgICAgICB9LCBsaW5lLnN0YXJ0LCBsaW5lLmVuZCksXHJcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9LCB7IHg6IHRoaXMueCwgeTogdGhpcy55ICsgdGhpcy5oIH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7IHg6IHRoaXMueCwgeTogdGhpcy55ICsgdGhpcy5oIH0sIHtcclxuICAgICAgICAgICAgICAgIHg6IHRoaXMueCArIHRoaXMudyxcclxuICAgICAgICAgICAgICAgIHk6IHRoaXMueSArIHRoaXMuaFxyXG4gICAgICAgICAgICB9LCBsaW5lLnN0YXJ0LCBsaW5lLmVuZClcclxuICAgICAgICBdO1xyXG4gICAgICAgIGxldCBtaW5fZCA9IEluZmluaXR5O1xyXG4gICAgICAgIGxldCBtaW5faSA9IG51bGw7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBsID0gbGluZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChsLmludGVyc2VjdCA9PT0gbnVsbCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBnZXRQb2ludERpc3RhbmNlKGxpbmUuc3RhcnQsIGwuaW50ZXJzZWN0KTtcclxuICAgICAgICAgICAgaWYgKG1pbl9kID4gZCkge1xyXG4gICAgICAgICAgICAgICAgbWluX2QgPSBkO1xyXG4gICAgICAgICAgICAgICAgbWluX2kgPSBsLmludGVyc2VjdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBpbnRlcnNlY3Q6IG1pbl9pLCBkaXN0YW5jZTogbWluX2QgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQmFzZVJlY3QgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB4OiBudW1iZXI7XHJcbiAgICB5OiBudW1iZXI7XHJcbiAgICB3OiBudW1iZXI7XHJcbiAgICBoOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih1dWlkKTtcclxuICAgICAgICB0aGlzLnR5cGUgPSBcImJhc2VyZWN0XCI7XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMudyA9IHc7XHJcbiAgICAgICAgdGhpcy5oID0gaDtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYgKGluV29ybGRDb29yZCkge1xyXG4gICAgICAgICAgICB4ID0gbDJ3eCh4KTtcclxuICAgICAgICAgICAgeSA9IGwyd3koeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnggPD0geCAmJiAodGhpcy54ICsgdGhpcy53KSA+PSB4ICYmXHJcbiAgICAgICAgICAgIHRoaXMueSA8PSB5ICYmICh0aGlzLnkgKyB0aGlzLmgpID49IHk7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcih4OiBudW1iZXIsIHk6IG51bWJlciwgY29ybmVyOiBzdHJpbmcpIHtcclxuICAgICAgICBzd2l0Y2ggKGNvcm5lcikge1xyXG4gICAgICAgICAgICBjYXNlICduZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggKyB0aGlzLncgLSAzKSA8PSB4ICYmIHggPD0gdzJseCh0aGlzLnggKyB0aGlzLncgKyAzKSAmJiB3Mmx5KHRoaXMueSAtIDMpIDw9IHkgJiYgeSA8PSB3Mmx5KHRoaXMueSArIDMpO1xyXG4gICAgICAgICAgICBjYXNlICdudyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggLSAzKSA8PSB4ICYmIHggPD0gdzJseCh0aGlzLnggKyAzKSAmJiB3Mmx5KHRoaXMueSAtIDMpIDw9IHkgJiYgeSA8PSB3Mmx5KHRoaXMueSArIDMpO1xyXG4gICAgICAgICAgICBjYXNlICdzdyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggLSAzKSA8PSB4ICYmIHggPD0gdzJseCh0aGlzLnggKyAzKSAmJiB3Mmx5KHRoaXMueSArIHRoaXMuaCAtIDMpIDw9IHkgJiYgeSA8PSB3Mmx5KHRoaXMueSArIHRoaXMuaCArIDMpO1xyXG4gICAgICAgICAgICBjYXNlICdzZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggKyB0aGlzLncgLSAzKSA8PSB4ICYmIHggPD0gdzJseCh0aGlzLnggKyB0aGlzLncgKyAzKSAmJiB3Mmx5KHRoaXMueSArIHRoaXMuaCAtIDMpIDw9IHkgJiYgeSA8PSB3Mmx5KHRoaXMueSArIHRoaXMuaCArIDMpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGdldENvcm5lcih4OiBudW1iZXIsIHk6IG51bWJlcik6IHN0cmluZ3x1bmRlZmluZWQge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbiAgICBjZW50ZXIoKTogUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IFBvaW50KTogUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHsgeDogdGhpcy54ICsgdGhpcy53IC8gMiwgeTogdGhpcy55ICsgdGhpcy5oIC8gMiB9O1xyXG4gICAgICAgIHRoaXMueCA9IGNlbnRlclBvaW50LnggLSB0aGlzLncgLyAyO1xyXG4gICAgICAgIHRoaXMueSA9IGNlbnRlclBvaW50LnkgLSB0aGlzLmggLyAyO1xyXG4gICAgfVxyXG5cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuICEodzJseCh0aGlzLngpID4gY2FudmFzLndpZHRoIHx8IHcybHkodGhpcy55KSA+IGNhbnZhcy5oZWlnaHQgfHxcclxuICAgICAgICAgICAgICAgICAgICB3Mmx4KHRoaXMueCArIHRoaXMudykgPCAwIHx8IHcybHkodGhpcy55ICsgdGhpcy5oKSA8IDApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVjdCBleHRlbmRzIEJhc2VSZWN0IHtcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih4LCB5LCB3LCBoLCB1dWlkKTtcclxuICAgICAgICB0aGlzLnR5cGUgPSBcInJlY3RcIjtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgY29uc3QgbG9jID0gdzJsKHsgeDogdGhpcy54LCB5OiB0aGlzLnkgfSk7XHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICAgICAgaWYgKHRoaXMuYm9yZGVyICE9PSBcInJnYmEoMCwgMCwgMCwgMClcIikge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDaXJjbGUgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB4OiBudW1iZXI7XHJcbiAgICB5OiBudW1iZXI7XHJcbiAgICByOiBudW1iZXI7XHJcbiAgICBib3JkZXI6IHN0cmluZztcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCByOiBudW1iZXIsIGZpbGw/OiBzdHJpbmcsIGJvcmRlcj86IHN0cmluZywgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHV1aWQpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwiY2lyY2xlXCI7XHJcbiAgICAgICAgdGhpcy54ID0geCB8fCAwO1xyXG4gICAgICAgIHRoaXMueSA9IHkgfHwgMDtcclxuICAgICAgICB0aGlzLnIgPSByIHx8IDE7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICAgICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB9O1xyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLnggLSB0aGlzLnIsIHRoaXMueSAtIHRoaXMuciwgdGhpcy5yICogMiwgdGhpcy5yICogMik7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IGxvYyA9IHcybCh7IHg6IHRoaXMueCwgeTogdGhpcy55IH0pO1xyXG4gICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgIGlmICh0aGlzLmJvcmRlciAhPT0gXCJyZ2JhKDAsIDAsIDAsIDApXCIpIHtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmJvcmRlcjtcclxuICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gKHggLSB3Mmx4KHRoaXMueCkpICoqIDIgKyAoeSAtIHcybHkodGhpcy55KSkgKiogMiA8IHRoaXMuciAqKiAyO1xyXG4gICAgfVxyXG4gICAgaW5Db3JuZXIoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvcm5lcjogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvL1RPRE9cclxuICAgIH1cclxuICAgIGdldENvcm5lcih4OiBudW1iZXIsIHk6IG51bWJlcikge1xyXG4gICAgICAgIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwibmVcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcIm53XCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJud1wiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwic3dcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XHJcbiAgICB9XHJcbiAgICBjZW50ZXIoKTogUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IFBvaW50KTogUG9pbnQgfCB2b2lkIHtcclxuICAgICAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHsgeDogdGhpcy54LCB5OiB0aGlzLnkgfTtcclxuICAgICAgICB0aGlzLnggPSBjZW50ZXJQb2ludC54O1xyXG4gICAgICAgIHRoaXMueSA9IGNlbnRlclBvaW50Lnk7XHJcbiAgICB9XHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBMaW5lIGV4dGVuZHMgU2hhcGUge1xyXG4gICAgeDE6IG51bWJlcjtcclxuICAgIHkxOiBudW1iZXI7XHJcbiAgICB4MjogbnVtYmVyO1xyXG4gICAgeTI6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih1dWlkKTtcclxuICAgICAgICB0aGlzLnR5cGUgPSBcImxpbmVcIjtcclxuICAgICAgICB0aGlzLngxID0geDE7XHJcbiAgICAgICAgdGhpcy55MSA9IHkxO1xyXG4gICAgICAgIHRoaXMueDIgPSB4MjtcclxuICAgICAgICB0aGlzLnkyID0geTI7XHJcbiAgICB9XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KFxyXG4gICAgICAgICAgICBNYXRoLm1pbih0aGlzLngxLCB0aGlzLngyKSxcclxuICAgICAgICAgICAgTWF0aC5taW4odGhpcy55MSwgdGhpcy55MiksXHJcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMueDEgLSB0aGlzLngyKSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy55MSAtIHRoaXMueTIpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odzJseCh0aGlzLngxKSwgdzJseSh0aGlzLnkxKSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh3Mmx4KHRoaXMueDIpLCB3Mmx5KHRoaXMueTIpKTtcclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsMCwwLCAwLjUpJztcclxuICAgICAgICBjdHgubGluZVdpZHRoID0gMztcclxuICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCk6IFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBQb2ludCk6IFBvaW50IHwgdm9pZCB7IH0gLy8gVE9ET1xyXG4gICAgZ2V0Q29ybmVyKHg6IG51bWJlciwgeTpudW1iZXIpOiBzdHJpbmd8dW5kZWZpbmVkIHsgcmV0dXJuIFwiXCIgfTsgLy8gVE9ET1xyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIHRleHQ6IHN0cmluZztcclxuICAgIGZvbnQ6IHN0cmluZztcclxuICAgIGFuZ2xlOiBudW1iZXI7XHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgdGV4dDogc3RyaW5nLCBmb250OiBzdHJpbmcsIGFuZ2xlPzogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIodXVpZCk7XHJcbiAgICAgICAgdGhpcy50eXBlID0gXCJ0ZXh0XCI7XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XHJcbiAgICAgICAgdGhpcy5mb250ID0gZm9udDtcclxuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGUgfHwgMDtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy54LCB0aGlzLnksIDUsIDUpOyAvLyBUb2RvOiBmaXggdGhpcyBib3VuZGluZyBib3hcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmZvbnQgPSB0aGlzLmZvbnQ7XHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjdHgudHJhbnNsYXRlKHcybHgodGhpcy54KSwgdzJseSh0aGlzLnkpKTtcclxuICAgICAgICBjdHgucm90YXRlKHRoaXMuYW5nbGUpO1xyXG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSBcImNlbnRlclwiO1xyXG4gICAgICAgIGN0eC5maWxsVGV4dCh0aGlzLnRleHQsIDAsIC01KTtcclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgfVxyXG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluV29ybGRDb29yZDogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xyXG4gICAgfVxyXG5cclxuICAgIGNlbnRlcigpOiBQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogUG9pbnQpOiBQb2ludCB8IHZvaWQgeyB9IC8vIFRPRE9cclxuICAgIGdldENvcm5lcih4OiBudW1iZXIsIHk6bnVtYmVyKTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiBcIlwiIH07IC8vIFRPRE9cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFzc2V0IGV4dGVuZHMgQmFzZVJlY3Qge1xyXG4gICAgaW1nOiBIVE1MSW1hZ2VFbGVtZW50O1xyXG4gICAgc3JjOiBzdHJpbmcgPSAnJztcclxuICAgIGNvbnN0cnVjdG9yKGltZzogSFRNTEltYWdlRWxlbWVudCwgeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoeCwgeSwgdywgaCk7XHJcbiAgICAgICAgaWYgKHV1aWQgIT09IHVuZGVmaW5lZCkgdGhpcy51dWlkID0gdXVpZDtcclxuICAgICAgICB0aGlzLnR5cGUgPSBcImFzc2V0XCI7XHJcbiAgICAgICAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgICB9XHJcbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XHJcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB3Mmx4KHRoaXMueCksIHcybHkodGhpcy55KSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZTogU2VydmVyU2hhcGUsIGR1bW15PzogYm9vbGVhbikge1xyXG4gICAgaWYgKGR1bW15ID09PSB1bmRlZmluZWQpIGR1bW15ID0gZmFsc2U7XHJcbiAgICBpZiAoIWR1bW15ICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSlcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpO1xyXG5cclxuICAgIGxldCBzaDtcclxuXHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IFJlY3QoKSwgc2hhcGUpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdjaXJjbGUnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IENpcmNsZSgpLCBzaGFwZSk7XHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ2xpbmUnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IExpbmUoKSwgc2hhcGUpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICd0ZXh0Jykgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBUZXh0KCksIHNoYXBlKTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAnYXNzZXQnKSB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKHNoYXBlLncsIHNoYXBlLmgpO1xyXG4gICAgICAgIGltZy5zcmMgPSBzaGFwZS5zcmM7XHJcbiAgICAgICAgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBBc3NldCgpLCBzaGFwZSk7XHJcbiAgICAgICAgc2guaW1nID0gaW1nO1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2g7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUNvbnRleHRNZW51KG1lbnU6IEpRdWVyeTxIVE1MRWxlbWVudD4sIHNoYXBlOiBTaGFwZSkge1xyXG4gICAgY29uc3QgYWN0aW9uID0gbWVudS5kYXRhKFwiYWN0aW9uXCIpO1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgIGlmIChsYXllciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICBzd2l0Y2ggKGFjdGlvbikge1xyXG4gICAgICAgIGNhc2UgJ21vdmVUb0Zyb250JzpcclxuICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIoc2hhcGUsIGxheWVyLnNoYXBlcy5sZW5ndGggLSAxLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnbW92ZVRvQmFjayc6XHJcbiAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCAwLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2V0TGF5ZXInOlxyXG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZShzaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihtZW51LmRhdGEoXCJsYXllclwiKSkhLmFkZFNoYXBlKHNoYXBlLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnYWRkSW5pdGlhdGl2ZSc6XHJcbiAgICAgICAgICAgIGxldCBzcmMgPSAnJztcclxuICAgICAgICAgICAgaWYgKHNoYXBlIGluc3RhbmNlb2YgQXNzZXQpIHNyYyA9IHNoYXBlLnNyYztcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB1dWlkOiBzaGFwZS51dWlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGU6ICFnYW1lTWFuYWdlci5JU19ETSxcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBzcmMsXHJcbiAgICAgICAgICAgICAgICAgICAgb3duZXJzOiBzaGFwZS5vd25lcnNcclxuICAgICAgICAgICAgICAgIH0sIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgICRtZW51LmhpZGUoKTtcclxufSIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IGFscGhTb3J0IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgc2V0dXBUb29scyB9IGZyb20gXCIuL3Rvb2xzXCI7XHJcbmltcG9ydCB7IENsaWVudE9wdGlvbnMsIExvY2F0aW9uT3B0aW9ucywgQXNzZXRMaXN0LCBTZXJ2ZXJTaGFwZSwgSW5pdGlhdGl2ZURhdGEsIEJvYXJkSW5mbyB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xyXG5cclxuY29uc3QgcHJvdG9jb2wgPSBkb2N1bWVudC5kb21haW4gPT09ICdsb2NhbGhvc3QnID8gXCJodHRwOi8vXCIgOiBcImh0dHBzOi8vXCI7XHJcbmNvbnN0IHNvY2tldCA9IGlvLmNvbm5lY3QocHJvdG9jb2wgKyBkb2N1bWVudC5kb21haW4gKyBcIjpcIiArIGxvY2F0aW9uLnBvcnQgKyBcIi9wbGFuYXJhbGx5XCIpO1xyXG5zb2NrZXQub24oXCJjb25uZWN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkXCIpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkRpc2Nvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcInJlZGlyZWN0XCIsIGZ1bmN0aW9uIChkZXN0aW5hdGlvbjogc3RyaW5nKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcInJlZGlyZWN0aW5nXCIpO1xyXG4gICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBkZXN0aW5hdGlvbjtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCB1c2VybmFtZVwiLCBmdW5jdGlvbiAodXNlcm5hbWU6IHN0cmluZykge1xyXG4gICAgZ2FtZU1hbmFnZXIudXNlcm5hbWUgPSB1c2VybmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLklTX0RNID0gdXNlcm5hbWUgPT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMl07XHJcbiAgICBpZiAoJChcIiN0b29sc2VsZWN0XCIpLmZpbmQoXCJ1bFwiKS5odG1sKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIHNldHVwVG9vbHMoKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCBjbGllbnRPcHRpb25zXCIsIGZ1bmN0aW9uIChvcHRpb25zOiBDbGllbnRPcHRpb25zKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRDbGllbnRPcHRpb25zKG9wdGlvbnMpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCBmdW5jdGlvbiAob3B0aW9uczogTG9jYXRpb25PcHRpb25zKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcclxufSk7XHJcbnNvY2tldC5vbihcImFzc2V0IGxpc3RcIiwgZnVuY3Rpb24gKGFzc2V0czogQXNzZXRMaXN0KSB7XHJcbiAgICBjb25zdCBtID0gJChcIiNtZW51LXRva2Vuc1wiKTtcclxuICAgIG0uZW1wdHkoKTtcclxuICAgIGxldCBoID0gJyc7XHJcblxyXG4gICAgY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uIChlbnRyeTogQXNzZXRMaXN0LCBwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBmb2xkZXJzID0gbmV3IE1hcChPYmplY3QuZW50cmllcyhlbnRyeS5mb2xkZXJzKSk7XHJcbiAgICAgICAgZm9sZGVycy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAgICAgIGggKz0gXCI8YnV0dG9uIGNsYXNzPSdhY2NvcmRpb24nPlwiICsga2V5ICsgXCI8L2J1dHRvbj48ZGl2IGNsYXNzPSdhY2NvcmRpb24tcGFuZWwnPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1zdWJwYW5lbCc+XCI7XHJcbiAgICAgICAgICAgIHByb2Nlc3ModmFsdWUsIHBhdGggKyBrZXkgKyBcIi9cIik7XHJcbiAgICAgICAgICAgIGggKz0gXCI8L2Rpdj48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5zb3J0KGFscGhTb3J0KTtcclxuICAgICAgICBlbnRyeS5maWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChhc3NldCkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGRpdiBjbGFzcz0nZHJhZ2dhYmxlIHRva2VuJz48aW1nIHNyYz0nL3N0YXRpYy9pbWcvYXNzZXRzL1wiICsgcGF0aCArIGFzc2V0ICsgXCInIHdpZHRoPSczNSc+XCIgKyBhc3NldCArIFwiPGkgY2xhc3M9J2ZhcyBmYS1jb2cnPjwvaT48L2Rpdj5cIjtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBwcm9jZXNzKGFzc2V0cywgXCJcIik7XHJcbiAgICBtLmh0bWwoaCk7XHJcbiAgICAkKFwiLmRyYWdnYWJsZVwiKS5kcmFnZ2FibGUoe1xyXG4gICAgICAgIGhlbHBlcjogXCJjbG9uZVwiLFxyXG4gICAgICAgIGFwcGVuZFRvOiBcIiNib2FyZFwiXHJcbiAgICB9KTtcclxuICAgICQoJy5hY2NvcmRpb24nKS5lYWNoKGZ1bmN0aW9uIChpZHgpIHtcclxuICAgICAgICAkKHRoaXMpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKHRoaXMpLnRvZ2dsZUNsYXNzKFwiYWNjb3JkaW9uLWFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgJCh0aGlzKS5uZXh0KCkudG9nZ2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufSk7XHJcbnNvY2tldC5vbihcImJvYXJkIGluaXRcIiwgZnVuY3Rpb24gKGxvY2F0aW9uX2luZm86IEJvYXJkSW5mbykge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0dXBCb2FyZChsb2NhdGlvbl9pbmZvKVxyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGdyaWRzaXplXCIsIGZ1bmN0aW9uIChncmlkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3JpZFNpemUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYWRkIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmFkZFNoYXBlKHNoYXBlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInJlbW92ZSBzaGFwZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biBzaGFwZWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgIGxheWVyLnJlbW92ZVNoYXBlKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSEsIGZhbHNlKTtcclxuICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwibW92ZVNoYXBlT3JkZXJcIiwgZnVuY3Rpb24gKGRhdGE6IHsgc2hhcGU6IFNlcnZlclNoYXBlOyBpbmRleDogbnVtYmVyIH0pIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKGRhdGEuc2hhcGUudXVpZCkpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIG1vdmUgdGhlIHNoYXBlIG9yZGVyIG9mIGFuIHVua25vd24gc2hhcGVgKTtcclxuICAgICAgICByZXR1cm4gO1xyXG4gICAgfVxyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoZGF0YS5zaGFwZS5sYXllcikpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBjb25zdCBzaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpITtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XHJcbiAgICBsYXllci5tb3ZlU2hhcGVPcmRlcihzaGFwZSwgZGF0YS5pbmRleCwgZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2hhcGVNb3ZlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGdhbWVNYW5hZ2VyLm1vdmVTaGFwZShzaGFwZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJ1cGRhdGVTaGFwZVwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbiB9KSB7XHJcbiAgICBnYW1lTWFuYWdlci51cGRhdGVTaGFwZShkYXRhKTtcclxufSk7XHJcbnNvY2tldC5vbihcInVwZGF0ZUluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhKSB7XHJcbiAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQgfHwgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNICYmICFkYXRhLnZpc2libGUpKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLnJlbW92ZUluaXRpYXRpdmUoZGF0YS51dWlkLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShkYXRhLCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXRJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhOiBJbml0aWF0aXZlRGF0YVtdKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRJbml0aWF0aXZlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiY2xlYXIgdGVtcG9yYXJpZXNcIiwgZnVuY3Rpb24gKHNoYXBlczogU2VydmVyU2hhcGVbXSkge1xyXG4gICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoc2hhcGUudXVpZCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIGFuIHVua25vd24gdGVtcG9yYXJ5IHNoYXBlXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBzaGFwZSBmcm9tIGFuIHVua25vd24gbGF5ZXIgJHtzaGFwZS5sYXllcn1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcmVhbF9zaGFwZSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSE7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSEucmVtb3ZlU2hhcGUocmVhbF9zaGFwZSwgZmFsc2UpO1xyXG4gICAgfSlcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzb2NrZXQ7IiwiaW1wb3J0IHtnZXRVbml0RGlzdGFuY2UsIGwydywgbDJ3eCwgbDJ3eSwgdzJsLCB3MmxyLCB3Mmx4LCB3Mmx5LCB3Mmx6fSBmcm9tIFwiLi91bml0c1wiO1xyXG5pbXBvcnQge1NoYXBlLCBMaW5lLCBSZWN0LCBUZXh0LCBCYXNlUmVjdH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgSW5pdGlhdGl2ZURhdGEgfSBmcm9tIFwiLi9hcGlfdHlwZXNcIjtcclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUb29sIHtcclxuICAgIGRldGFpbERpdj86IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZDtcclxuICAgIGFic3RyYWN0IG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7fTtcclxufVxyXG5cclxuZW51bSBTZWxlY3RPcGVyYXRpb25zIHtcclxuICAgIE5vb3AsXHJcbiAgICBSZXNpemUsXHJcbiAgICBEcmFnLFxyXG4gICAgR3JvdXBTZWxlY3QsXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTZWxlY3RUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBtb2RlOiBTZWxlY3RPcGVyYXRpb25zID0gU2VsZWN0T3BlcmF0aW9ucy5Ob29wO1xyXG4gICAgcmVzaXplZGlyOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgLy8gQmVjYXVzZSB3ZSBuZXZlciBkcmFnIGZyb20gdGhlIGFzc2V0J3MgKDAsIDApIGNvb3JkIGFuZCB3YW50IGEgc21vb3RoZXIgZHJhZyBleHBlcmllbmNlXHJcbiAgICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBhY3R1YWwgb2Zmc2V0IHdpdGhpbiB0aGUgYXNzZXQuXHJcbiAgICBkcmFnb2ZmeCA9IDA7XHJcbiAgICBkcmFnb2ZmeSA9IDA7XHJcbiAgICBkcmFnb3JpZzogUG9pbnQgPSB7eDowLCB5OjB9O1xyXG4gICAgc2VsZWN0aW9uSGVscGVyOiBSZWN0ID0gbmV3IFJlY3QoLTEwMDAsIC0xMDAwLCAwLCAwKTtcclxuICAgIHNlbGVjdGlvblN0YXJ0UG9pbnQ6IFBvaW50ID0ge3g6IC0xMDAwLCB5OiAtMTAwMH07XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgbXggPSBlLnBhZ2VYO1xyXG4gICAgICAgIGNvbnN0IG15ID0gZS5wYWdlWTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG5cclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgLy8gdGhlIHNlbGVjdGlvblN0YWNrIGFsbG93cyBmb3IgbG93ZXIgcG9zaXRpb25lZCBvYmplY3RzIHRoYXQgYXJlIHNlbGVjdGVkIHRvIGhhdmUgcHJlY2VkZW5jZSBkdXJpbmcgb3ZlcmxhcC5cclxuICAgICAgICBsZXQgc2VsZWN0aW9uU3RhY2s7XHJcbiAgICAgICAgaWYgKCFsYXllci5zZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICBzZWxlY3Rpb25TdGFjayA9IGxheWVyLnNoYXBlcztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzLmNvbmNhdChsYXllci5zZWxlY3Rpb24pO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSBzZWxlY3Rpb25TdGFjay5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHNlbGVjdGlvblN0YWNrW2ldO1xyXG4gICAgICAgICAgICBjb25zdCBjb3JuID0gc2hhcGUuZ2V0Q29ybmVyKG14LCBteSk7XHJcbiAgICAgICAgICAgIGlmIChjb3JuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtzaGFwZV07XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5vblNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZWRpciA9IGNvcm47XHJcbiAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLmNvbnRhaW5zKG14LCBteSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbCA9IHNoYXBlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5pbmRleE9mKHNlbCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3NlbF07XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSBTZWxlY3RPcGVyYXRpb25zLkRyYWc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdvZmZ4ID0gbXggLSBzZWwueCAqIHo7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdvZmZ5ID0gbXkgLSBzZWwueSAqIHo7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdvcmlnID0ge3g6IHNlbC54LCB5OiBzZWwueX07XHJcbiAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWhpdCkge1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb25Mb3NzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGUgPSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0O1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci54ID0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50Lng7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnkgPSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIudyA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLmggPSAwO1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbdGhpcy5zZWxlY3Rpb25IZWxwZXJdO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGxheWVyLmdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0KSB7XHJcbiAgICAgICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSB0aGlzXHJcbiAgICAgICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJ3KG1vdXNlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC55KTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIueCA9IE1hdGgubWluKHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIueSA9IE1hdGgubWluKHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY29uc3Qgb2dYID0gbGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS54ICogejtcclxuICAgICAgICAgICAgY29uc3Qgb2dZID0gbGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS55ICogejtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goKHNlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoc2VsIGluc3RhbmNlb2YgQmFzZVJlY3QpKSByZXR1cm47IC8vIFRPRE9cclxuICAgICAgICAgICAgICAgIGNvbnN0IGR4ID0gbW91c2UueCAtIChvZ1ggKyB0aGlzLmRyYWdvZmZ4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGR5ID0gbW91c2UueSAtIChvZ1kgKyB0aGlzLmRyYWdvZmZ5KTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuRHJhZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC54ICs9IGR4IC8gejtcclxuICAgICAgICAgICAgICAgICAgICBzZWwueSArPSBkeSAvIHo7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxheWVyLm5hbWUgIT09ICdmb3cnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gdXNlIHRoZSBhYm92ZSB1cGRhdGVkIHZhbHVlcyBmb3IgdGhlIGJvdW5kaW5nIGJveCBjaGVja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGUgYm91bmRpbmcgYm94ZXMgb3ZlcmxhcCB0byBzdG9wIGNsb3NlIC8gcHJlY2lzZSBtb3ZlbWVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYmxvY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gc2VsLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrZXJzID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maWx0ZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYiA9PiBtYiAhPT0gc2VsLnV1aWQgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKG1iKSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobWIpIS5nZXRCb3VuZGluZ0JveCgpLmludGVyc2VjdHNXaXRoKGJib3gpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRHJhdyBhIGxpbmUgZnJvbSBzdGFydCB0byBlbmQgcG9zaXRpb24gYW5kIHNlZSBmb3IgYW55IGludGVyc2VjdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBzdG9wcyBzdWRkZW4gbGVhcHMgb3ZlciB3YWxscyEgY2hlZWt5IGJ1Z2dlcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpbmUgPSB7c3RhcnQ6IHt4OiBvZ1ggLyB6LCB5OiBvZ1kgLyB6fSwgZW5kOiB7eDogc2VsLngsIHk6IHNlbC55fX07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2VkID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zb21lKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1iID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMobWIpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGludGVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KG1iKSEuZ2V0Qm91bmRpbmdCb3goKS5nZXRJbnRlcnNlY3RXaXRoTGluZShsaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1iICE9PSBzZWwudXVpZCAmJiBpbnRlci5pbnRlcnNlY3QgIT09IG51bGwgJiYgaW50ZXIuZGlzdGFuY2UgPiAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54IC09IGR4IC8gejtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55IC09IGR5IC8gejtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzaXplZGlyID09PSAnbncnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gdzJseChzZWwueCkgKyBzZWwudyAqIHogLSBtb3VzZS54O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IHcybHkoc2VsLnkpICsgc2VsLmggKiB6IC0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBsMnd4KG1vdXNlLngpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IGwyd3kobW91c2UueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJlc2l6ZWRpciA9PT0gJ25lJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IG1vdXNlLnggLSB3Mmx4KHNlbC54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSB3Mmx5KHNlbC55KSArIHNlbC5oICogeiAtIG1vdXNlLnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gbDJ3eShtb3VzZS55KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplZGlyID09PSAnc2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gbW91c2UueCAtIHcybHgoc2VsLngpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IG1vdXNlLnkgLSB3Mmx5KHNlbC55KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplZGlyID09PSAnc3cnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gdzJseChzZWwueCkgKyBzZWwudyAqIHogLSBtb3VzZS54O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IG1vdXNlLnkgLSB3Mmx5KHNlbC55KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBsMnd4KG1vdXNlLngpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBzZWwudyAvPSB6O1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5oIC89IHo7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcIm53XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJudy1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcIm5lXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJuZS1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcInNlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJzZS1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcInN3XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJzdy1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gbGF5ZXIuZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdCkge1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICAgICAgbGF5ZXIuc2hhcGVzLmZvckVhY2goKHNoYXBlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUgPT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiYm94ID0gc2hhcGUuZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb25IZWxwZXIhLnggPD0gYmJveC54ICsgYmJveC53ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLnggKyB0aGlzLnNlbGVjdGlvbkhlbHBlciEudyA+PSBiYm94LnggJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEueSA8PSBiYm94LnkgKyBiYm94LmggJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEueSArIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5oID49IGJib3gueSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24ucHVzaChzaGFwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUHVzaCB0aGUgc2VsZWN0aW9uIGhlbHBlciBhcyB0aGUgbGFzdCBlbGVtZW50IG9mIHRoZSBzZWxlY3Rpb25cclxuICAgICAgICAgICAgLy8gVGhpcyBtYWtlcyBzdXJlIHRoYXQgaXQgd2lsbCBiZSB0aGUgZmlyc3Qgb25lIHRvIGJlIGhpdCBpbiB0aGUgaGl0IGRldGVjdGlvbiBvbk1vdXNlRG93blxyXG4gICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5wdXNoKHRoaXMuc2VsZWN0aW9uSGVscGVyKTtcclxuXHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKChzZWwpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSkgcmV0dXJuOyAvLyBUT0RPXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkRyYWcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3VzZSA9IHt4OiBzZWwueCArIHNlbC53IC8gMiwgeTogc2VsLnkgKyBzZWwuaCAvIDJ9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBteCA9IG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChzZWwudyAvIGdzKSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gTWF0aC5yb3VuZChteCAvIGdzKSAqIGdzIC0gc2VsLncgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSAoTWF0aC5yb3VuZCgobXggKyAoZ3MgLyAyKSkgLyBncykgLSAoMSAvIDIpKSAqIGdzIC0gc2VsLncgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc2VsLmggLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IE1hdGgucm91bmQobXkgLyBncykgKiBncyAtIHNlbC5oIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gKE1hdGgucm91bmQoKG15ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHNlbC5oIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kcmFnb3JpZy54ICE9PSBzZWwueCB8fCB0aGlzLmRyYWdvcmlnLnkgIT09IHNlbC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuUmVzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC53IDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueCArPSBzZWwudztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLmFicyhzZWwudyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwuaCA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgKz0gc2VsLmg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gTWF0aC5hYnMoc2VsLmgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueCA9IE1hdGgucm91bmQoc2VsLnggLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBNYXRoLnJvdW5kKHNlbC55IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gTWF0aC5tYXgoTWF0aC5yb3VuZChzZWwudyAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChzZWwuaCAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5Ob29wXHJcbiAgICB9O1xyXG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IGxheWVyLmdldE1vdXNlKGUpO1xyXG4gICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcclxuICAgICAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xyXG4gICAgICAgIGxheWVyLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBpZiAoIWhpdCAmJiBzaGFwZS5jb250YWlucyhteCwgbXksIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5zaG93Q29udGV4dE1lbnUobW91c2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFuVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgLy8gQmVjYXVzZSB3ZSBuZXZlciBkcmFnIGZyb20gdGhlIGFzc2V0J3MgKDAsIDApIGNvb3JkIGFuZCB3YW50IGEgc21vb3RoZXIgZHJhZyBleHBlcmllbmNlXHJcbiAgICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBhY3R1YWwgb2Zmc2V0IHdpdGhpbiB0aGUgYXNzZXQuXHJcbiAgICBkcmFnb2ZmeCA9IDA7XHJcbiAgICBkcmFnb2ZmeSA9IDA7XHJcbiAgICBkcmFnb3JpZzogUG9pbnQgPSB7eDowLCB5OjB9O1xyXG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kcmFnb2ZmeCA9IGUucGFnZVg7XHJcbiAgICAgICAgdGhpcy5kcmFnb2ZmeSA9IGUucGFnZVk7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSB7eDogZS5wYWdlWCwgeTogZS5wYWdlWX07XHJcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YICs9IE1hdGgucm91bmQoKG1vdXNlLnggLSB0aGlzLmRyYWdvZmZ4KSAvIHopO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZICs9IE1hdGgucm91bmQoKG1vdXNlLnkgLSB0aGlzLmRyYWdvZmZ5KSAvIHopO1xyXG4gICAgICAgIHRoaXMuZHJhZ29mZnggPSBtb3VzZS54O1xyXG4gICAgICAgIHRoaXMuZHJhZ29mZnkgPSBtb3VzZS55O1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xyXG4gICAgICAgICAgICBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCxcclxuICAgICAgICAgICAgcGFuWTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhbllcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHt9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBUb29scygpOiB2b2lkIHtcclxuICAgIGNvbnN0IHRvb2xzZWxlY3REaXYgPSAkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpO1xyXG4gICAgdG9vbHMuZm9yRWFjaChmdW5jdGlvbiAodG9vbCkge1xyXG4gICAgICAgIGlmICghdG9vbC5wbGF5ZXJUb29sICYmICFnYW1lTWFuYWdlci5JU19ETSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBjb25zdCB0b29sSW5zdGFuY2UgPSBuZXcgdG9vbC5jbHooKTtcclxuICAgICAgICBnYW1lTWFuYWdlci50b29scy5zZXQodG9vbC5uYW1lLCB0b29sSW5zdGFuY2UpO1xyXG4gICAgICAgIGNvbnN0IGV4dHJhID0gdG9vbC5kZWZhdWx0U2VsZWN0ID8gXCIgY2xhc3M9J3Rvb2wtc2VsZWN0ZWQnXCIgOiBcIlwiO1xyXG4gICAgICAgIGNvbnN0IHRvb2xMaSA9ICQoXCI8bGkgaWQ9J3Rvb2wtXCIgKyB0b29sLm5hbWUgKyBcIidcIiArIGV4dHJhICsgXCI+PGEgaHJlZj0nIyc+XCIgKyB0b29sLm5hbWUgKyBcIjwvYT48L2xpPlwiKTtcclxuICAgICAgICB0b29sc2VsZWN0RGl2LmFwcGVuZCh0b29sTGkpO1xyXG4gICAgICAgIGlmICh0b29sLmhhc0RldGFpbCkge1xyXG4gICAgICAgICAgICBjb25zdCBkaXYgPSB0b29sSW5zdGFuY2UuZGV0YWlsRGl2ITtcclxuICAgICAgICAgICAgJCgnI3Rvb2xkZXRhaWwnKS5hcHBlbmQoZGl2KTtcclxuICAgICAgICAgICAgZGl2LmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdG9vbExpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRvb2xzLmluZGV4T2YodG9vbCk7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSB7XHJcbiAgICAgICAgICAgICAgICAkKCcudG9vbC1zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKFwidG9vbC1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sID0gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXRhaWwgPSAkKCcjdG9vbGRldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI3Rvb2xkZXRhaWwnKS5jaGlsZHJlbigpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB0b29sSW5zdGFuY2UuZGV0YWlsRGl2IS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsLnNob3coKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEcmF3VG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgc3RhcnRQb2ludDogUG9pbnR8bnVsbCA9IG51bGw7XHJcbiAgICByZWN0OiBSZWN0fG51bGwgPSBudWxsO1xyXG4gICAgZmlsbENvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGJvcmRlckNvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PkZpbGw8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLmZpbGxDb2xvcilcclxuICAgICAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5Cb3JkZXI8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLmJvcmRlckNvbG9yKVxyXG4gICAgICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmVkXCJcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKHtcclxuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICAgICAgY29uc3QgZmlsbENvbG9yID0gdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICAgICAgY29uc3QgZmlsbCA9IGZpbGxDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogZmlsbENvbG9yO1xyXG4gICAgICAgIGNvbnN0IGJvcmRlckNvbG9yID0gdGhpcy5ib3JkZXJDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcclxuICAgICAgICBjb25zdCBib3JkZXIgPSBib3JkZXJDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogYm9yZGVyQ29sb3I7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCAwLCAwLCBmaWxsLnRvUmdiU3RyaW5nKCksIGJvcmRlci50b1JnYlN0cmluZygpKTtcclxuICAgICAgICB0aGlzLnJlY3Qub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGlmIChsYXllci5uYW1lID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLnJlY3QudmlzaW9uT2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnJlY3QubW92ZW1lbnRPYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMucHVzaCh0aGlzLnJlY3QudXVpZCk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5yZWN0IS53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QhLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIHRoaXMucmVjdCEueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QhLnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnJlY3QhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlVXAoZTpNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJlY3QgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFJ1bGVyVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgc3RhcnRQb2ludDogUG9pbnR8bnVsbCA9IG51bGw7XHJcbiAgICBydWxlcjogTGluZXxudWxsID0gbnVsbDtcclxuICAgIHRleHQ6IFRleHR8bnVsbCA9IG51bGw7XHJcblxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucnVsZXIgPSBuZXcgTGluZSh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gbmV3IFRleHQodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCBcIlwiLCBcIjIwcHggc2VyaWZcIik7XHJcbiAgICAgICAgdGhpcy5ydWxlci5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgdGhpcy50ZXh0Lm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJ1bGVyLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnRleHQsIHRydWUsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5ydWxlciEueDIgPSBlbmRQb2ludC54O1xyXG4gICAgICAgIHRoaXMucnVsZXIhLnkyID0gZW5kUG9pbnQueTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucnVsZXIhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWV9KTtcclxuICAgIFxyXG4gICAgICAgIGNvbnN0IGRpZmZzaWduID0gTWF0aC5zaWduKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCkgKiBNYXRoLnNpZ24oZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICBjb25zdCB4ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgY29uc3QgeWRpZmYgPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIGNvbnN0IGxhYmVsID0gTWF0aC5yb3VuZChNYXRoLnNxcnQoKHhkaWZmKSAqKiAyICsgKHlkaWZmKSAqKiAyKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51bml0U2l6ZSAvIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSkgKyBcIiBmdFwiO1xyXG4gICAgICAgIGxldCBhbmdsZSA9IE1hdGguYXRhbjIoZGlmZnNpZ24gKiB5ZGlmZiwgeGRpZmYpO1xyXG4gICAgICAgIGNvbnN0IHhtaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCkgKyB4ZGlmZiAvIDI7XHJcbiAgICAgICAgY29uc3QgeW1pZCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KSArIHlkaWZmIC8gMjtcclxuICAgICAgICB0aGlzLnRleHQhLnggPSB4bWlkO1xyXG4gICAgICAgIHRoaXMudGV4dCEueSA9IHltaWQ7XHJcbiAgICAgICAgdGhpcy50ZXh0IS50ZXh0ID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy50ZXh0IS5hbmdsZSA9IGFuZ2xlO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogdGhpcy50ZXh0IS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucnVsZXIhLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnRleHQhLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICB0aGlzLnJ1bGVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLnRleHQgPSBudWxsO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGT1dUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBzdGFydFBvaW50OiBQb2ludHxudWxsID0gbnVsbDtcclxuICAgIHJlY3Q6IFJlY3R8bnVsbCA9IG51bGw7XHJcbiAgICBkZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PlJldmVhbDwvZGl2PjxsYWJlbCBjbGFzcz0nc3dpdGNoJz48aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdmb3ctcmV2ZWFsJz48c3BhbiBjbGFzcz0nc2xpZGVyIHJvdW5kJz48L3NwYW4+PC9sYWJlbD5cIikpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpITtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSwgMCwgMCwgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgdHJ1ZSwgZmFsc2UpO1xyXG5cclxuICAgICAgICBpZiAoJChcIiNmb3ctcmV2ZWFsXCIpLnByb3AoXCJjaGVja2VkXCIpKVxyXG4gICAgICAgICAgICB0aGlzLnJlY3QuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJkZXN0aW5hdGlvbi1vdXRcIjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhO1xyXG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuICAgIFxyXG4gICAgICAgIHRoaXMucmVjdCEudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0IS5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICB0aGlzLnJlY3QhLnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgdGhpcy5yZWN0IS55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG4gICAgXHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnJlY3QhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7ICAgICAgICBcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1hcFRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIHN0YXJ0UG9pbnQ6IFBvaW50fG51bGwgPSBudWxsO1xyXG4gICAgcmVjdDogUmVjdHxudWxsID0gbnVsbDtcclxuICAgIHhDb3VudCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9JzMnPlwiKTtcclxuICAgIHlDb3VudCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9JzMnPlwiKTtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1g8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnhDb3VudClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PiNZPC9kaXY+XCIpKS5hcHBlbmQodGhpcy55Q291bnQpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPC9kaXY+XCIpKTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCAwLCAwLCBcInJnYmEoMCwwLDAsMClcIiwgXCJibGFja1wiKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJlY3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5yZWN0IS53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QhLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIHRoaXMucmVjdCEueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QhLnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgLy8gc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnJlY3QuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGggIT09IDEpIHtcclxuICAgICAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5yZWN0ISwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLnJlY3QhLnc7XHJcbiAgICAgICAgY29uc3QgaCA9IHRoaXMucmVjdCEuaDtcclxuICAgICAgICBjb25zdCBzZWwgPSBsYXllci5zZWxlY3Rpb25bMF07XHJcblxyXG4gICAgICAgIGlmIChzZWwgaW5zdGFuY2VvZiBSZWN0KXtcclxuICAgICAgICAgICAgc2VsLncgKj0gcGFyc2VJbnQoPHN0cmluZz50aGlzLnhDb3VudC52YWwoKSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemUgLyB3O1xyXG4gICAgICAgICAgICBzZWwuaCAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueUNvdW50LnZhbCgpKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QhLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEluaXRpYXRpdmVUcmFja2VyIHtcclxuICAgIGRhdGE6IEluaXRpYXRpdmVEYXRhW10gPSBbXTtcclxuICAgIGFkZEluaXRpYXRpdmUoZGF0YTogSW5pdGlhdGl2ZURhdGEsIHN5bmM6IGJvb2xlYW4pIHtcclxuICAgICAgICAvLyBPcGVuIHRoZSBpbml0aWF0aXZlIHRyYWNrZXIgaWYgaXQgaXMgbm90IGN1cnJlbnRseSBvcGVuLlxyXG4gICAgICAgIGlmICh0aGlzLmRhdGEubGVuZ3RoID09PSAwIHx8ICFnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImlzT3BlblwiKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgICAgIC8vIElmIG5vIGluaXRpYXRpdmUgZ2l2ZW4sIGFzc3VtZSBpdCAwXHJcbiAgICAgICAgaWYgKGRhdGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBkYXRhLmluaXRpYXRpdmUgPSAwO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBzaGFwZSBpcyBhbHJlYWR5IGJlaW5nIHRyYWNrZWRcclxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSBkYXRhLnV1aWQpO1xyXG4gICAgICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGlzdGluZywgZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzeW5jKVxyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgZGF0YSk7XHJcbiAgICB9O1xyXG4gICAgcmVtb3ZlSW5pdGlhdGl2ZSh1dWlkOiBzdHJpbmcsIHN5bmM6IGJvb2xlYW4sIHNraXBHcm91cENoZWNrOiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3QgZCA9IHRoaXMuZGF0YS5maW5kSW5kZXgoZCA9PiBkLnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgIGlmIChkID49IDApIHtcclxuICAgICAgICAgICAgaWYgKCFza2lwR3JvdXBDaGVjayAmJiB0aGlzLmRhdGFbZF0uZ3JvdXApIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnNwbGljZShkLCAxKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwge3V1aWQ6IHV1aWR9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgJiYgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiY2xvc2VcIik7XHJcbiAgICB9O1xyXG4gICAgcmVkcmF3KCkge1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgICAgICAgICAgaWYgKGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgaWYgKGIuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIHJldHVybiBiLmluaXRpYXRpdmUgLSBhLmluaXRpYXRpdmU7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5vd25lcnMgPT09IHVuZGVmaW5lZCkgZGF0YS5vd25lcnMgPSBbXTtcclxuICAgICAgICAgICAgY29uc3QgaW1nID0gZGF0YS5zcmMgPT09IHVuZGVmaW5lZCA/ICcnIDogJChgPGltZyBzcmM9XCIke2RhdGEuc3JjfVwiIHdpZHRoPVwiMzBweFwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPmApO1xyXG4gICAgICAgICAgICAvLyBjb25zdCBuYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHtzaC51dWlkfVwiIHZhbHVlPVwiJHtzaC5uYW1lfVwiIGRpc2FibGVkPSdkaXNhYmxlZCcgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cInZhbHVlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCIgdmFsdWU9XCIke2RhdGEuaW5pdGlhdGl2ZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiB2YWx1ZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCB2aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS11c2Vyc1wiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gJChgPGRpdiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiByZW1vdmVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgICAgICB2aXNpYmxlLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS52aXNpYmxlID8gXCIxLjBcIiA6IFwiMC4zXCIpO1xyXG4gICAgICAgICAgICBncm91cC5jc3MoXCJvcGFjaXR5XCIsIGRhdGEuZ3JvdXAgPyBcIjEuMFwiIDogXCIwLjNcIik7XHJcbiAgICAgICAgICAgIGlmICghZGF0YS5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSkge1xyXG4gICAgICAgICAgICAgICAgdmFsLnByb3AoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlLmNzcyhcIm9wYWNpdHlcIiwgXCIwLjNcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuYXBwZW5kKGltZykuYXBwZW5kKHZhbCkuYXBwZW5kKHZpc2libGUpLmFwcGVuZChncm91cCkuYXBwZW5kKHJlbW92ZSk7XHJcblxyXG4gICAgICAgICAgICB2YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgY2hhbmdlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZC5pbml0aWF0aXZlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRJbml0aWF0aXZlKGQsIHRydWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKSE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgdmlzaWJsZSB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgZC52aXNpYmxlID0gIWQudmlzaWJsZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZC52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgZ3JvdXAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKXtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBncm91cCB1bmtub3duIHV1aWQ/XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgZC5ncm91cCA9ICFkLmdyb3VwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkLmdyb3VwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgcmVtb3ZlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3V1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVJbml0aWF0aXZlKHV1aWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gICAge25hbWU6IFwic2VsZWN0XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IHRydWUsIGhhc0RldGFpbDogZmFsc2UsIGNsejogU2VsZWN0VG9vbH0sXHJcbiAgICB7bmFtZTogXCJwYW5cIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogZmFsc2UsIGNsejogUGFuVG9vbH0sXHJcbiAgICB7bmFtZTogXCJkcmF3XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogRHJhd1Rvb2x9LFxyXG4gICAge25hbWU6IFwicnVsZXJcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogZmFsc2UsIGNsejogUnVsZXJUb29sfSxcclxuICAgIHtuYW1lOiBcImZvd1wiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBGT1dUb29sfSxcclxuICAgIHtuYW1lOiBcIm1hcFwiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBNYXBUb29sfSxcclxuXTsiLCJpbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJsKG9iajogUG9pbnQpIHtcclxuICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogKG9iai54ICsgcGFuWCkgKiB6LFxyXG4gICAgICAgIHk6IChvYmoueSArIHBhblkpICogelxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJseCh4OiBudW1iZXIpIHtcclxuICAgIHJldHVybiB3Mmwoe3g6IHgsIHk6IDB9KS54O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJseSh5OiBudW1iZXIpIHtcclxuICAgIHJldHVybiB3Mmwoe3g6IDAsIHk6IHl9KS55O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJseih6OiBudW1iZXIpIHtcclxuICAgIHJldHVybiB6ICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbml0RGlzdGFuY2UocjogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gKHIgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJscihyOiBudW1iZXIpIHtcclxuICAgIHJldHVybiB3Mmx6KGdldFVuaXREaXN0YW5jZShyKSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwydyhvYmo6IFBvaW50KSB7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICBjb25zdCBwYW5YID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblg7XHJcbiAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IChvYmoueCAvIHopIC0gcGFuWCxcclxuICAgICAgICB5OiAob2JqLnkgLyB6KSAtIHBhbllcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyd3goeDogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbDJ3KHt4OiB4LCB5OiAwfSkueDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyd3koeTogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbDJ3KHt4OiAwLCB5OiB5fSkueTtcclxufSIsImltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBvaW50IHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbHBoU29ydChhOiBzdHJpbmcsIGI6IHN0cmluZykge1xyXG4gICAgaWYgKGEudG9Mb3dlckNhc2UoKSA8IGIudG9Mb3dlckNhc2UoKSlcclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbn1cclxuXHJcbi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcclxuZXhwb3J0IGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBPcmRlcmVkTWFwPEssIFY+IHtcclxuICAgIGtleXM6IEtbXSA9IFtdO1xyXG4gICAgdmFsdWVzOiBWW10gPSBbXTtcclxuICAgIGdldChrZXk6IEspIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbdGhpcy5rZXlzLmluZGV4T2Yoa2V5KV07XHJcbiAgICB9XHJcbiAgICBnZXRJbmRleFZhbHVlKGlkeDogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVzW2lkeF07XHJcbiAgICB9XHJcbiAgICBnZXRJbmRleEtleShpZHg6IG51bWJlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmtleXNbaWR4XTtcclxuICAgIH1cclxuICAgIHNldChrZXk6IEssIHZhbHVlOiBWKSB7XHJcbiAgICAgICAgdGhpcy5rZXlzLnB1c2goa2V5KTtcclxuICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgIH1cclxuICAgIGluZGV4T2YoZWxlbWVudDogSykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmtleXMuaW5kZXhPZihlbGVtZW50KTtcclxuICAgIH1cclxuICAgIHJlbW92ZShlbGVtZW50OiBLKSB7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5pbmRleE9mKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMua2V5cy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB0aGlzLnZhbHVlcy5zcGxpY2UoaWR4LCAxKTtcclxuICAgIH1cclxufSJdLCJzb3VyY2VSb290IjoiIn0=