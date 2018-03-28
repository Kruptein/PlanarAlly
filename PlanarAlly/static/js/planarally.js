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
                    if (this.dragorig.x === sel.x && this.dragorig.y === sel.y) {
                        return;
                    }
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
                    if (sel !== this.selectionHelper) {
                        _socket__WEBPACK_IMPORTED_MODULE_3__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
                    }
                    layer.invalidate(false);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zb2NrZXQudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy91bml0cy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ2pFQTtBQUFBLHFCQUFxQixDQUFRLEVBQUUsRUFBUyxFQUFFLEVBQVM7SUFDL0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3pDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7QUFDL0MsQ0FBQztBQUVELHNCQUFzQixDQUFRLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTLEVBQUUsRUFBUztJQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVLLGdDQUFpQyxFQUFTLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTO0lBQzdFLDRCQUE0QjtJQUM1QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckIsZ0RBQWdEO0lBQ2hELE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQztJQUM1QixFQUFFLEVBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFD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LElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUgsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVHLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUgsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMs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QUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQzFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3RCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLENBQUM7b0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDakMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5QixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQzFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLENBQUM7b0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDakMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM5QixHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLENBQUM7b0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDakMsR0FBRyxDQUFDLENBQUMs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QkFDbkIsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN6QixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDakQsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSixHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMxRSxDQUFDO3dCQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDekIsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2pELENBQUM7d0JBQUMsSUFBSSxDQUFDLENBQUM7NEJBQ0osR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENB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O1FBQ3JDLGlDQUFpQztRQUNqQyxNQUFNLEtBQUssR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFFLENBQUM7UUFDeEQsTUFBTSxRQUFRLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFdkQsK0NBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7UUFDekUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsU0FBUyxDQUFDLENBQWE7UUFDbkIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUM7WUFBQyxNQUFNLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFBSSxD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LENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFDRCxPQUFPLENBQUMsT0FBVTtRQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsTUFBTSxDQUFDLE9BQVU7UUFDYixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0IsQ0FBQztDQUNKIiwiZmlsZSI6InBsYW5hcmFsbHkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi90c19zcmMvcGxhbmFyYWxseS50c1wiKTtcbiIsImltcG9ydCB7IFBvaW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmZ1bmN0aW9uIHBvaW50SW5MaW5lKHA6IFBvaW50LCBsMTogUG9pbnQsIGwyOiBQb2ludCkge1xyXG4gICAgcmV0dXJuIHAueCA+PSBNYXRoLm1pbihsMS54LCBsMi54KSAtIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC54IDw9IE1hdGgubWF4KGwxLngsIGwyLngpICsgMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnkgPj0gTWF0aC5taW4obDEueSwgbDIueSkgLSAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueSA8PSBNYXRoLm1heChsMS55LCBsMi55KSArIDAuMDAwMDAxO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwb2ludEluTGluZXMocDogUG9pbnQsIHMxOiBQb2ludCwgZTE6IFBvaW50LCBzMjogUG9pbnQsIGUyOiBQb2ludCkge1xyXG4gICAgcmV0dXJuIHBvaW50SW5MaW5lKHAsIHMxLCBlMSkgJiYgcG9pbnRJbkxpbmUocCwgczIsIGUyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoczE6IFBvaW50LCBlMTogUG9pbnQsIHMyOiBQb2ludCwgZTI6IFBvaW50KSB7XHJcbiAgICAvLyBjb25zdCBzMSA9IE1hdGgubWluKFMxLCApXHJcbiAgICBjb25zdCBBMSA9IGUxLnktczEueTtcclxuICAgIGNvbnN0IEIxID0gczEueC1lMS54O1xyXG4gICAgY29uc3QgQTIgPSBlMi55LXMyLnk7XHJcbiAgICBjb25zdCBCMiA9IHMyLngtZTIueDtcclxuXHJcbiAgICAvLyBHZXQgZGVsdGEgYW5kIGNoZWNrIGlmIHRoZSBsaW5lcyBhcmUgcGFyYWxsZWxcclxuICAgIGNvbnN0IGRlbHRhID0gQTEqQjIgLSBBMipCMTtcclxuICAgIGlmKGRlbHRhID09PSAwKSByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IHRydWV9O1xyXG5cclxuICAgIGNvbnN0IEMyID0gQTIqczIueCtCMipzMi55O1xyXG4gICAgY29uc3QgQzEgPSBBMSpzMS54K0IxKnMxLnk7XHJcbiAgICAvL2ludmVydCBkZWx0YSB0byBtYWtlIGRpdmlzaW9uIGNoZWFwZXJcclxuICAgIGNvbnN0IGludmRlbHRhID0gMS9kZWx0YTtcclxuXHJcbiAgICBjb25zdCBpbnRlcnNlY3Q6IFBvaW50ID0ge3g6IChCMipDMSAtIEIxKkMyKSppbnZkZWx0YSwgeTogKEExKkMyIC0gQTIqQzEpKmludmRlbHRhfTtcclxuICAgIGlmICghcG9pbnRJbkxpbmVzKGludGVyc2VjdCwgczEsIGUxLCBzMiwgZTIpKVxyXG4gICAgICAgIHJldHVybiB7aW50ZXJzZWN0OiBudWxsLCBwYXJhbGxlbDogZmFsc2V9O1xyXG4gICAgcmV0dXJuIHtpbnRlcnNlY3Q6IGludGVyc2VjdCwgcGFyYWxsZWw6IGZhbHNlfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBvaW50RGlzdGFuY2UocDE6IFBvaW50LCBwMjogUG9pbnQpIHtcclxuICAgIGNvbnN0IGEgPSBwMS54IC0gcDIueDtcclxuICAgIGNvbnN0IGIgPSBwMS55IC0gcDIueTtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoIGEqYSArIGIqYiApO1xyXG59IiwiaW1wb3J0IHtnZXRVbml0RGlzdGFuY2UsIGwydywgbDJ3eCwgbDJ3eSwgdzJsLCB3MmxyLCB3Mmx4LCB3Mmx5LCB3Mmx6fSBmcm9tIFwiLi91bml0c1wiO1xyXG5pbXBvcnQge1NoYXBlLCBDaXJjbGUsIGNyZWF0ZVNoYXBlRnJvbURpY3QsIFJlY3QsIEJvdW5kaW5nUmVjdCwgQmFzZVJlY3R9IGZyb20gXCIuL3NoYXBlc1wiO1xyXG5pbXBvcnQge1BvaW50fSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgZ2FtZU1hbmFnZXIgZnJvbSBcIi4vcGxhbmFyYWxseVwiO1xyXG5pbXBvcnQgc29ja2V0IGZyb20gXCIuL3NvY2tldFwiO1xyXG5pbXBvcnQgeyBMb2NhdGlvbk9wdGlvbnMsIFNlcnZlclNoYXBlIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTGF5ZXJNYW5hZ2VyIHtcclxuICAgIGxheWVyczogTGF5ZXJbXSA9IFtdO1xyXG4gICAgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgIHNlbGVjdGVkTGF5ZXI6IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgVVVJRE1hcDogTWFwPHN0cmluZywgU2hhcGU+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIGdyaWRTaXplID0gNTA7XHJcbiAgICB1bml0U2l6ZSA9IDU7XHJcbiAgICB1c2VHcmlkID0gdHJ1ZTtcclxuICAgIGZ1bGxGT1cgPSBmYWxzZTtcclxuICAgIGZvd09wYWNpdHkgPSAwLjM7XHJcblxyXG4gICAgem9vbUZhY3RvciA9IDE7XHJcbiAgICBwYW5YID0gMDtcclxuICAgIHBhblkgPSAwO1xyXG5cclxuICAgIC8vIFJlZnJlc2ggaW50ZXJ2YWwgYW5kIHJlZHJhdyBzZXR0ZXIuXHJcbiAgICBpbnRlcnZhbCA9IDMwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBsbS5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGxtLmxheWVyc1tpXS5kcmF3KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCB0aGlzLmludGVydmFsKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRPcHRpb25zKG9wdGlvbnM6IExvY2F0aW9uT3B0aW9ucyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChcInVuaXRTaXplXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRVbml0U2l6ZShvcHRpb25zLnVuaXRTaXplKTtcclxuICAgICAgICBpZiAoXCJ1c2VHcmlkXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRVc2VHcmlkKG9wdGlvbnMudXNlR3JpZCk7XHJcbiAgICAgICAgaWYgKFwiZnVsbEZPV1wiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0RnVsbEZPVyhvcHRpb25zLmZ1bGxGT1cpO1xyXG4gICAgICAgIGlmICgnZm93T3BhY2l0eScgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5zZXRGT1dPcGFjaXR5KG9wdGlvbnMuZm93T3BhY2l0eSk7XHJcbiAgICAgICAgaWYgKFwiZm93Q29sb3VyXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRXaWR0aCh3aWR0aDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEhlaWdodChoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhZGRMYXllcihsYXllcjogTGF5ZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcclxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExheWVyID09PSBcIlwiICYmIGxheWVyLnNlbGVjdGFibGUpIHRoaXMuc2VsZWN0ZWRMYXllciA9IGxheWVyLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzTGF5ZXIobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubGF5ZXJzLnNvbWUobCA9PiBsLm5hbWUgPT09IG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldExheWVyKG5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICBuYW1lID0gKG5hbWUgPT09IHVuZGVmaW5lZCkgPyB0aGlzLnNlbGVjdGVkTGF5ZXIgOiBuYW1lO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLm5hbWUgPT09IG5hbWUpIHJldHVybiB0aGlzLmxheWVyc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy90b2RvIHJlbmFtZSB0byBzZWxlY3RMYXllclxyXG4gICAgc2V0TGF5ZXIobmFtZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xyXG4gICAgICAgIHRoaXMubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgICAgIGlmICghbGF5ZXIuc2VsZWN0YWJsZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoZm91bmQgJiYgbGF5ZXIubmFtZSAhPT0gJ2ZvdycpIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDAuMztcclxuICAgICAgICAgICAgZWxzZSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAxLjA7XHJcblxyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbGF5ZXIubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgbG0uc2VsZWN0ZWRMYXllciA9IG5hbWU7XHJcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEdyaWRMYXllcigpOiBMYXllcnx1bmRlZmluZWQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldExheWVyKFwiZ3JpZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3R3JpZCgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMuZ2V0R3JpZExheWVyKCk7XHJcbiAgICAgICAgaWYgKGxheWVyID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjb25zdCBjdHggPSBsYXllci5jdHg7XHJcbiAgICAgICAgbGF5ZXIuY2xlYXIoKTtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIud2lkdGg7IGkgKz0gdGhpcy5ncmlkU2l6ZSAqIHRoaXMuem9vbUZhY3Rvcikge1xyXG4gICAgICAgICAgICBjdHgubW92ZVRvKGkgKyAodGhpcy5wYW5YICUgdGhpcy5ncmlkU2l6ZSkgKiB0aGlzLnpvb21GYWN0b3IsIDApO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGkgKyAodGhpcy5wYW5YICUgdGhpcy5ncmlkU2l6ZSkgKiB0aGlzLnpvb21GYWN0b3IsIGxheWVyLmhlaWdodCk7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oMCwgaSArICh0aGlzLnBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3Rvcik7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8obGF5ZXIud2lkdGgsIGkgKyAodGhpcy5wYW5ZICUgdGhpcy5ncmlkU2l6ZSkgKiB0aGlzLnpvb21GYWN0b3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gZ2FtZU1hbmFnZXIuZ3JpZENvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICBsYXllci52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzTGF5ZXIoXCJmb3dcIikpXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R3JpZFNpemUoZ3JpZFNpemU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGlmIChncmlkU2l6ZSAhPT0gdGhpcy5ncmlkU2l6ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmdyaWRTaXplID0gZ3JpZFNpemU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgJCgnI2dyaWRTaXplSW5wdXQnKS52YWwoZ3JpZFNpemUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRVbml0U2l6ZSh1bml0U2l6ZTogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHVuaXRTaXplICE9PSB0aGlzLnVuaXRTaXplKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdFNpemUgPSB1bml0U2l6ZTtcclxuICAgICAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAkKCcjdW5pdFNpemVJbnB1dCcpLnZhbCh1bml0U2l6ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVzZUdyaWQodXNlR3JpZDogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh1c2VHcmlkICE9PSB0aGlzLnVzZUdyaWQpIHtcclxuICAgICAgICAgICAgdGhpcy51c2VHcmlkID0gdXNlR3JpZDtcclxuICAgICAgICAgICAgaWYgKHVzZUdyaWQpXHJcbiAgICAgICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLnNob3coKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJCgnI2dyaWQtbGF5ZXInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICQoJyN1c2VHcmlkSW5wdXQnKS5wcm9wKFwiY2hlY2tlZFwiLCB1c2VHcmlkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RnVsbEZPVyhmdWxsRk9XOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGZ1bGxGT1cgIT09IHRoaXMuZnVsbEZPVykge1xyXG4gICAgICAgICAgICB0aGlzLmZ1bGxGT1cgPSBmdWxsRk9XO1xyXG4gICAgICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcclxuICAgICAgICAgICAgaWYgKGZvd2wgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIGZvd2wuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICQoJyN1c2VGT1dJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIGZ1bGxGT1cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRGT1dPcGFjaXR5KGZvd09wYWNpdHk6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZm93T3BhY2l0eSA9IGZvd09wYWNpdHk7XHJcbiAgICAgICAgY29uc3QgZm93bCA9IHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgaWYgKGZvd2wgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAkKCcjZm93T3BhY2l0eScpLnZhbChmb3dPcGFjaXR5KTtcclxuICAgIH1cclxuXHJcbiAgICBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExheWVyIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHdpZHRoOiBudW1iZXI7XHJcbiAgICBoZWlnaHQ6IG51bWJlcjtcclxuICAgIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHJcbiAgICBzZWxlY3RhYmxlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwbGF5ZXJfZWRpdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBXaGVuIHNldCB0byBmYWxzZSwgdGhlIGxheWVyIHdpbGwgYmUgcmVkcmF3biBvbiB0aGUgbmV4dCB0aWNrXHJcbiAgICB2YWxpZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgLy8gVGhlIGNvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgdGhpcyBsYXllciBjb250YWlucy5cclxuICAgIC8vIFRoZXNlIGFyZSBvcmRlcmVkIG9uIGEgZGVwdGggYmFzaXMuXHJcbiAgICBzaGFwZXM6IFNoYXBlW10gPSBbXTtcclxuXHJcbiAgICAvLyBDb2xsZWN0aW9uIG9mIHNoYXBlcyB0aGF0IGFyZSBjdXJyZW50bHkgc2VsZWN0ZWRcclxuICAgIHNlbGVjdGlvbjogU2hhcGVbXSA9IFtdO1xyXG5cclxuICAgIC8vIEV4dHJhIHNlbGVjdGlvbiBoaWdobGlnaHRpbmcgc2V0dGluZ3NcclxuICAgIHNlbGVjdGlvbkNvbG9yID0gJyNDQzAwMDAnO1xyXG4gICAgc2VsZWN0aW9uV2lkdGggPSAyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XHJcbiAgICB9XHJcblxyXG4gICAgaW52YWxpZGF0ZShza2lwTGlnaHRVcGRhdGU6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFza2lwTGlnaHRVcGRhdGUgJiYgdGhpcy5uYW1lICE9PSBcImZvd1wiICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSkge1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbik6IHZvaWQge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgc2hhcGUubGF5ZXIgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMucHVzaChzaGFwZSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcImFkZCBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaGFwZSk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKCFzeW5jKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRTaGFwZXMoc2hhcGVzOiBTZXJ2ZXJTaGFwZVtdKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgdDogU2hhcGVbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpO1xyXG4gICAgICAgICAgICBzaC5sYXllciA9IHNlbGYubmFtZTtcclxuICAgICAgICAgICAgc2guY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgc2guc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuc2V0KHNoYXBlLnV1aWQsIHNoKTtcclxuICAgICAgICAgICAgdC5wdXNoKHNoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdOyAvLyBUT0RPOiBGaXgga2VlcGluZyBzZWxlY3Rpb24gb24gdGhvc2UgaXRlbXMgdGhhdCBhcmUgbm90IG1vdmVkLlxyXG4gICAgICAgIHRoaXMuc2hhcGVzID0gdDtcclxuICAgICAgICB0aGlzLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbikge1xyXG4gICAgICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpLCAxKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJyZW1vdmUgc2hhcGVcIiwge3NoYXBlOiBzaGFwZSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcclxuICAgICAgICBjb25zdCBsc19pID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmZpbmRJbmRleChscyA9PiBscy5zaGFwZSA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICAgICAgY29uc3QgbGJfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZmluZEluZGV4KGxzID0+IGxzID09PSBzaGFwZS51dWlkKTtcclxuICAgICAgICBjb25zdCBtYl9pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgICAgIGlmIChsc19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UobHNfaSwgMSk7XHJcbiAgICAgICAgaWYgKGxiX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5zcGxpY2UobGJfaSwgMSk7XHJcbiAgICAgICAgaWYgKG1iX2kgPj0gMClcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2UobWJfaSwgMSk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZGVsZXRlKHNoYXBlLnV1aWQpO1xyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuc2VsZWN0aW9uLmluZGV4T2Yoc2hhcGUpO1xyXG4gICAgICAgIGlmIChpbmRleCA+PSAwKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSghc3luYyk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGRvQ2xlYXI/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkICYmICF0aGlzLnZhbGlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuY3R4O1xyXG4gICAgICAgICAgICBkb0NsZWFyID0gZG9DbGVhciA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGRvQ2xlYXI7XHJcblxyXG4gICAgICAgICAgICBpZiAoZG9DbGVhcilcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS52aXNpYmxlSW5DYW52YXMoc3RhdGUuY2FudmFzKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLm5hbWUgPT09ICdmb3cnICYmIHNoYXBlLnZpc2lvbk9ic3RydWN0aW9uICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpIS5uYW1lICE9PSBzdGF0ZS5uYW1lKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBzaGFwZS5kcmF3KGN0eCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcclxuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLnNlbGVjdGlvbldpZHRoO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoc2VsIGluc3RhbmNlb2YgQmFzZVJlY3QpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QodzJseChzZWwueCksIHcybHkoc2VsLnkpLCBzZWwudyAqIHosIHNlbC5oICogeik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggKyBzZWwudyAtIDMpLCB3Mmx5KHNlbC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9wbGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54IC0gMyksIHcybHkoc2VsLnkgLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBib3RyaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54ICsgc2VsLncgLSAzKSwgdzJseShzZWwueSArIHNlbC5oIC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90bGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54IC0gMyksIHcybHkoc2VsLnkgKyBzZWwuaCAtIDMpLCA2ICogeiwgNiAqIHopXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldE1vdXNlKGU6IE1vdXNlRXZlbnQpOiBQb2ludCB7XHJcbiAgICAgICAgcmV0dXJuIHt4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZfTtcclxuICAgIH07XHJcblxyXG4gICAgbW92ZVNoYXBlT3JkZXIoc2hhcGU6IFNoYXBlLCBkZXN0aW5hdGlvbkluZGV4OiBudW1iZXIsIHN5bmM6IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBvbGRJZHggPSB0aGlzLnNoYXBlcy5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAob2xkSWR4ID09PSBkZXN0aW5hdGlvbkluZGV4KSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKG9sZElkeCwgMSk7XHJcbiAgICAgICAgdGhpcy5zaGFwZXMuc3BsaWNlKGRlc3RpbmF0aW9uSW5kZXgsIDAsIHNoYXBlKTtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJtb3ZlU2hhcGVPcmRlclwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCBpbmRleDogZGVzdGluYXRpb25JbmRleH0pO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH07XHJcblxyXG4gICAgb25TaGFwZU1vdmUoc2hhcGU/OiBTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBMYXllciB7XHJcbiAgICBpbnZhbGlkYXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5kcmF3R3JpZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRk9XTGF5ZXIgZXh0ZW5kcyBMYXllciB7XHJcblxyXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNoYXBlLCBzeW5jOiBib29sZWFuLCB0ZW1wb3Jhcnk/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xyXG4gICAgICAgIHN1cGVyLmFkZFNoYXBlKHNoYXBlLCBzeW5jLCB0ZW1wb3JhcnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNlcnZlclNoYXBlW10pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBjID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIHNoYXBlLmZpbGwgPSBjO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHN1cGVyLnNldFNoYXBlcyhzaGFwZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2hhcGVNb3ZlKHNoYXBlOiBTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIHNoYXBlLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICBzdXBlci5vblNoYXBlTW92ZShzaGFwZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGRyYXcoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkICYmICF0aGlzLnZhbGlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuY3R4O1xyXG4gICAgICAgICAgICBjb25zdCBvcmlnX29wID0gY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mdWxsRk9XKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvZ2FscGhhID0gdGhpcy5jdHguZ2xvYmFsQWxwaGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImNvcHlcIjtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mb3dPcGFjaXR5O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gb2dhbHBoYTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9yaWdfb3A7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgIHN1cGVyLmRyYXcoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mdWxsRk9XKTtcclxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKFwidG9rZW5zXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJ0b2tlbnNcIikhLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2gub3duZWRCeSgpKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmIgPSBzaC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxjZW50ZXIgPSB3Mmwoc2guY2VudGVyKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsbSA9IDAuOCAqIHcybHooYmIudyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcclxuICAgICAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwgMCwgMCwgMSknKTtcclxuICAgICAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcclxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKGxzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChscy5zaGFwZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYSA9IHNoLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09IGxzLmF1cmEpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF1cmEgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT2xkIGxpZ2h0c291cmNlIHN0aWxsIGxpbmdlcmluZyBpbiB0aGUgZ2FtZU1hbmFnZXIgbGlzdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX2xlbmd0aCA9IGdldFVuaXREaXN0YW5jZShhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlciA9IHNoLmNlbnRlcigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IHcybChjZW50ZXIpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IG5ldyBDaXJjbGUoY2VudGVyLngsIGNlbnRlci55LCBhdXJhX2xlbmd0aCkuZ2V0Qm91bmRpbmdCb3goKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBXZSBmaXJzdCBjb2xsZWN0IGFsbCBsaWdodGJsb2NrZXJzIHRoYXQgYXJlIGluc2lkZS9jcm9zcyBvdXIgYXVyYVxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyB0byBwcmV2ZW50IGFzIG1hbnkgcmF5IGNhbGN1bGF0aW9ucyBhcyBwb3NzaWJsZVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jYWxfbGlnaHRibG9ja2VyczogQm91bmRpbmdSZWN0W10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAobGIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGIgPT09IHNoLnV1aWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYl9zaCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChsYik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiX3NoID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYl9iYiA9IGxiX3NoLmdldEJvdW5kaW5nQm94KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiX2JiLmludGVyc2VjdHNXaXRoKGJib3gpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbF9saWdodGJsb2NrZXJzLnB1c2gobGJfYmIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhcmNfc3RhcnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhc3QgcmF5cyBpbiBldmVyeSBkZWdyZWVcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGFuZ2xlID0gMDsgYW5nbGUgPCAyICogTWF0aC5QSTsgYW5nbGUgKz0gKDEgLyAxODApICogTWF0aC5QSSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGhpdCB3aXRoIG9ic3RydWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhpdDoge2ludGVyc2VjdDogUG9pbnR8bnVsbCwgZGlzdGFuY2U6bnVtYmVyfSA9IHtpbnRlcnNlY3Q6IG51bGwsIGRpc3RhbmNlOiBJbmZpbml0eX07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNoYXBlX2hpdDogbnVsbHxCb3VuZGluZ1JlY3QgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxsb2NhbF9saWdodGJsb2NrZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbG9jYWxfbGlnaHRibG9ja2Vyc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbGJfYmIuZ2V0SW50ZXJzZWN0V2l0aExpbmUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGNlbnRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGNlbnRlci54ICsgYXVyYV9sZW5ndGggKiBNYXRoLmNvcyhhbmdsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5pbnRlcnNlY3QgIT09IG51bGwgJiYgcmVzdWx0LmRpc3RhbmNlIDwgaGl0LmRpc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaXQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZV9oaXQgPSBsYl9iYjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIG5vIGhpdCwgY2hlY2sgaWYgd2UgY29tZSBmcm9tIGEgcHJldmlvdXMgaGl0IHNvIHRoYXQgd2UgY2FuIGdvIGJhY2sgdG8gdGhlIGFyY1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaXQuaW50ZXJzZWN0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSBhbmdsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdzJseChjZW50ZXIueCArIGF1cmFfbGVuZ3RoICogTWF0aC5jb3MoYW5nbGUpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3Mmx5KGNlbnRlci55ICsgYXVyYV9sZW5ndGggKiBNYXRoLnNpbihhbmdsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBoaXQgLCBmaXJzdCBmaW5pc2ggYW55IG9uZ29pbmcgYXJjLCB0aGVuIG1vdmUgdG8gdGhlIGludGVyc2VjdGlvbiBwb2ludFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIHcybHIoYXVyYS52YWx1ZSksIGFyY19zdGFydCwgYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4dHJhWCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4dHJhWSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoYXBlX2hpdCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYVggPSAoc2hhcGVfaGl0LncgLyA0KSAqIE1hdGguY29zKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFZID0gKHNoYXBlX2hpdC5oIC8gNCkgKiBNYXRoLnNpbihhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICghc2hhcGVfaGl0LmNvbnRhaW5zKGhpdC5pbnRlcnNlY3QueCArIGV4dHJhWCwgaGl0LmludGVyc2VjdC55ICsgZXh0cmFZLCBmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZXh0cmFYID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh3Mmx4KGhpdC5pbnRlcnNlY3QueCArIGV4dHJhWCksIHcybHkoaGl0LmludGVyc2VjdC55ICsgZXh0cmFZKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ICE9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCB3MmxyKGF1cmEudmFsdWUpLCBhcmNfc3RhcnQsIDIgKiBNYXRoLlBJKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbG0gPSB3MmxyKGF1cmEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbSAvIDIsIGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0pO1xyXG4gICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsIDAsIDAsIDEpJyk7XHJcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmFkaWVudDtcclxuICAgICAgICAgICAgICAgIC8vIGN0eC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMCwgMCwgMSlcIjtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVyk7XHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsImltcG9ydCBzb2NrZXQgZnJvbSAnLi9zb2NrZXQnXHJcbmltcG9ydCB7IGwydyB9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7IFNoYXBlLCBBc3NldCwgY3JlYXRlU2hhcGVGcm9tRGljdCB9IGZyb20gXCIuL3NoYXBlc1wiO1xyXG5pbXBvcnQgeyBEcmF3VG9vbCwgUnVsZXJUb29sLCBNYXBUb29sLCBGT1dUb29sLCBJbml0aWF0aXZlVHJhY2tlciwgVG9vbCB9IGZyb20gXCIuL3Rvb2xzXCI7XHJcbmltcG9ydCB7IExheWVyTWFuYWdlciwgTGF5ZXIsIEdyaWRMYXllciwgRk9XTGF5ZXIgfSBmcm9tIFwiLi9sYXllcnNcIjtcclxuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgQm9hcmRJbmZvLCBTZXJ2ZXJTaGFwZSwgSW5pdGlhdGl2ZURhdGEgfSBmcm9tICcuL2FwaV90eXBlcyc7XHJcbmltcG9ydCB7IE9yZGVyZWRNYXAgfSBmcm9tICcuL3V0aWxzJztcclxuXHJcbmNsYXNzIEdhbWVNYW5hZ2VyIHtcclxuICAgIElTX0RNID0gZmFsc2U7XHJcbiAgICB1c2VybmFtZTogc3RyaW5nID0gXCJcIjtcclxuICAgIGJvYXJkX2luaXRpYWxpc2VkID0gZmFsc2U7XHJcbiAgICBsYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICBzZWxlY3RlZFRvb2w6IG51bWJlciA9IDA7XHJcbiAgICB0b29sczogT3JkZXJlZE1hcDxzdHJpbmcsIFRvb2w+ID0gbmV3IE9yZGVyZWRNYXAoKTtcclxuICAgIGxpZ2h0c291cmNlczogeyBzaGFwZTogc3RyaW5nLCBhdXJhOiBzdHJpbmcgfVtdID0gW107XHJcbiAgICBsaWdodGJsb2NrZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgbW92ZW1lbnRibG9ja2Vyczogc3RyaW5nW10gPSBbXTtcclxuICAgIGdyaWRDb2xvdXIgPSAkKFwiI2dyaWRDb2xvdXJcIik7XHJcbiAgICBmb3dDb2xvdXIgPSAkKFwiI2Zvd0NvbG91clwiKTtcclxuICAgIGluaXRpYXRpdmVUcmFja2VyID0gbmV3IEluaXRpYXRpdmVUcmFja2VyKCk7XHJcbiAgICBzaGFwZVNlbGVjdGlvbkRpYWxvZyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSk7XHJcbiAgICBpbml0aWF0aXZlRGlhbG9nID0gJChcIiNpbml0aWF0aXZlZGlhbG9nXCIpLmRpYWxvZyh7XHJcbiAgICAgICAgYXV0b09wZW46IGZhbHNlLFxyXG4gICAgICAgIHdpZHRoOiAnMTYwcHgnXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmdyaWRDb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmdiYSgyNTUsMCwwLCAwLjUpXCIsXHJcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5kcmF3R3JpZCgpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7ICdncmlkQ29sb3VyJzogY29sb3VyLnRvUmdiU3RyaW5nKCkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmZvd0NvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgY29sb3I6IFwicmdiKDgyLCA4MSwgODEpXCIsXHJcbiAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAobCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbC5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGUuZmlsbCA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGwuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7ICdmb3dDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNldHVwQm9hcmQocm9vbTogQm9hcmRJbmZvKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5sYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICAgICAgY29uc3QgbGF5ZXJzZGl2ID0gJCgnI2xheWVycycpO1xyXG4gICAgICAgIGxheWVyc2Rpdi5lbXB0eSgpO1xyXG4gICAgICAgIGNvbnN0IGxheWVyc2VsZWN0ZGl2ID0gJCgnI2xheWVyc2VsZWN0Jyk7XHJcbiAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZChcInVsXCIpLmVtcHR5KCk7XHJcbiAgICAgICAgbGV0IHNlbGVjdGFibGVfbGF5ZXJzID0gMDtcclxuXHJcbiAgICAgICAgY29uc3QgbG0gPSAkKFwiI2xvY2F0aW9ucy1tZW51XCIpLmZpbmQoXCJkaXZcIik7XHJcbiAgICAgICAgbG0uY2hpbGRyZW4oKS5vZmYoKTtcclxuICAgICAgICBsbS5lbXB0eSgpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5sb2NhdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbG9jID0gJChcIjxkaXY+XCIgKyByb29tLmxvY2F0aW9uc1tpXSArIFwiPC9kaXY+XCIpO1xyXG4gICAgICAgICAgICBsbS5hcHBlbmQobG9jKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbG1wbHVzID0gJCgnPGRpdj48aSBjbGFzcz1cImZhcyBmYS1wbHVzXCI+PC9pPjwvZGl2PicpO1xyXG4gICAgICAgIGxtLmFwcGVuZChsbXBsdXMpO1xyXG4gICAgICAgIGxtLmNoaWxkcmVuKCkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQudGV4dENvbnRlbnQgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NuYW1lID0gcHJvbXB0KFwiTmV3IGxvY2F0aW9uIG5hbWVcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9jbmFtZSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcIm5ldyBsb2NhdGlvblwiLCBsb2NuYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwiY2hhbmdlIGxvY2F0aW9uXCIsIGUudGFyZ2V0LnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb20uYm9hcmQubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld19sYXllciA9IHJvb20uYm9hcmQubGF5ZXJzW2ldO1xyXG4gICAgICAgICAgICAvLyBVSSBjaGFuZ2VzXHJcbiAgICAgICAgICAgIGxheWVyc2Rpdi5hcHBlbmQoXCI8Y2FudmFzIGlkPSdcIiArIG5ld19sYXllci5uYW1lICsgXCItbGF5ZXInIHN0eWxlPSd6LWluZGV4OiBcIiArIGkgKyBcIic+PC9jYW52YXM+XCIpO1xyXG4gICAgICAgICAgICBpZiAobmV3X2xheWVyLnNlbGVjdGFibGUpIHtcclxuICAgICAgICAgICAgICAgIGxldCBleHRyYSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGFibGVfbGF5ZXJzID09PSAwKSBleHRyYSA9IFwiIGNsYXNzPSdsYXllci1zZWxlY3RlZCdcIjtcclxuICAgICAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoJ3VsJykuYXBwZW5kKFwiPGxpIGlkPSdzZWxlY3QtXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIG5ld19sYXllci5uYW1lICsgXCI8L2E+PC9saT5cIik7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RhYmxlX2xheWVycyArPSAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD4kKCcjJyArIG5ld19sYXllci5uYW1lICsgJy1sYXllcicpWzBdO1xyXG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgICAgICAgICAgLy8gU3RhdGUgY2hhbmdlc1xyXG4gICAgICAgICAgICBsZXQgbDogTGF5ZXI7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuZ3JpZClcclxuICAgICAgICAgICAgICAgIGwgPSBuZXcgR3JpZExheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChuZXdfbGF5ZXIubmFtZSA9PT0gJ2ZvdycpXHJcbiAgICAgICAgICAgICAgICBsID0gbmV3IEZPV0xheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBsID0gbmV3IExheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xyXG4gICAgICAgICAgICBsLnNlbGVjdGFibGUgPSBuZXdfbGF5ZXIuc2VsZWN0YWJsZTtcclxuICAgICAgICAgICAgbC5wbGF5ZXJfZWRpdGFibGUgPSBuZXdfbGF5ZXIucGxheWVyX2VkaXRhYmxlO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuYWRkTGF5ZXIobCk7XHJcbiAgICAgICAgICAgIGlmIChuZXdfbGF5ZXIuZ3JpZCkge1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKG5ld19sYXllci5zaXplKTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5kcmF3R3JpZCgpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNncmlkLWxheWVyXCIpLmRyb3BwYWJsZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0OiBcIi5kcmFnZ2FibGVcIixcclxuICAgICAgICAgICAgICAgICAgICBkcm9wOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciB0byBkcm9wIHRoZSB0b2tlbiBvblwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBqQ2FudmFzID0gJChsLmNhbnZhcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqQ2FudmFzLmxlbmd0aCA9PT0gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNhbnZhcyBtaXNzaW5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGpDYW52YXMub2Zmc2V0KCkhO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9jID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdWkub2Zmc2V0LmxlZnQgLSBvZmZzZXQubGVmdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHVpLm9mZnNldC50b3AgLSBvZmZzZXQudG9wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2V0dGluZ3NfbWVudS5pcyhcIjp2aXNpYmxlXCIpICYmIGxvYy54IDwgc2V0dGluZ3NfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnkgPCBsb2NhdGlvbnNfbWVudS53aWR0aCgpISlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lkdGggPSB1aS5oZWxwZXJbMF0ud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCA9IHVpLmhlbHBlclswXS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHdsb2MgPSBsMncobG9jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW1nID0gPEhUTUxJbWFnZUVsZW1lbnQ+dWkuZHJhZ2dhYmxlWzBdLmNoaWxkcmVuWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldChpbWcsIHdsb2MueCwgd2xvYy55LCBpbWcud2lkdGgsIGltZy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5zcmMgPSBpbWcuc3JjO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnggPSBNYXRoLnJvdW5kKGFzc2V0LnggLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnkgPSBNYXRoLnJvdW5kKGFzc2V0LnkgLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LncgPSBNYXRoLm1heChNYXRoLnJvdW5kKGFzc2V0LncgLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQuaCA9IE1hdGgubWF4KE1hdGgucm91bmQoYXNzZXQuaCAvIGdzKSAqIGdzLCBncyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGwuYWRkU2hhcGUoYXNzZXQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbC5zZXRTaGFwZXMobmV3X2xheWVyLnNoYXBlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9yY2UgdGhlIGNvcnJlY3Qgb3BhY2l0eSByZW5kZXIgb24gb3RoZXIgbGF5ZXJzLlxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRMYXllcihnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSEubmFtZSk7XHJcbiAgICAgICAgLy8gc29ja2V0LmVtaXQoXCJjbGllbnQgaW5pdGlhbGlzZWRcIik7XHJcbiAgICAgICAgdGhpcy5ib2FyZF9pbml0aWFsaXNlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3RhYmxlX2xheWVycyA+IDEpIHtcclxuICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZChcImxpXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMuaWQuc3BsaXQoXCItXCIpWzFdO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkID0gbGF5ZXJzZWxlY3RkaXYuZmluZChcIiNzZWxlY3QtXCIgKyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2VsZWN0ZWRMYXllcik7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZSAhPT0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwibGF5ZXItc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgb2xkLnJlbW92ZUNsYXNzKFwibGF5ZXItc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXllcnNlbGVjdGRpdi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFNoYXBlKHNoYXBlOiBTZXJ2ZXJTaGFwZSk6IHZvaWQge1xyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgICAgICBsYXllci5hZGRTaGFwZShjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlKSwgZmFsc2UpO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vdmVTaGFwZShzaGFwZTogU2VydmVyU2hhcGUpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZWFsX3NoYXBlID0gT2JqZWN0LmFzc2lnbih0aGlzLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKSwgY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSwgdHJ1ZSkpO1xyXG4gICAgICAgIHJlYWxfc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRMYXllcihyZWFsX3NoYXBlLmxheWVyKSEub25TaGFwZU1vdmUocmVhbF9zaGFwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlU2hhcGUoZGF0YToge3NoYXBlOiBTZXJ2ZXJTaGFwZTsgcmVkcmF3OiBib29sZWFuO30pOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihkYXRhLnNoYXBlLmxheWVyKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSwgY3JlYXRlU2hhcGVGcm9tRGljdChkYXRhLnNoYXBlLCB0cnVlKSk7XHJcbiAgICAgICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaGFwZS5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGlmIChkYXRhLnJlZHJhdylcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoZGF0YS5zaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEluaXRpYXRpdmUoZGF0YTogSW5pdGlhdGl2ZURhdGFbXSk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaW5pdGlhdGl2ZVRyYWNrZXIuZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5yZWRyYXcoKTtcclxuICAgICAgICBpZiAoZGF0YS5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDbGllbnRPcHRpb25zKG9wdGlvbnM6IENsaWVudE9wdGlvbnMpOiB2b2lkIHtcclxuICAgICAgICBpZiAoXCJncmlkQ29sb3VyXCIgaW4gb3B0aW9ucylcclxuICAgICAgICAgICAgdGhpcy5ncmlkQ29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZ3JpZENvbG91cik7XHJcbiAgICAgICAgaWYgKFwiZm93Q29sb3VyXCIgaW4gb3B0aW9ucykge1xyXG4gICAgICAgICAgICB0aGlzLmZvd0NvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmZvd0NvbG91cik7XHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFwicGFuWFwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnBhblggPSBvcHRpb25zLnBhblg7XHJcbiAgICAgICAgaWYgKFwicGFuWVwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnBhblkgPSBvcHRpb25zLnBhblk7XHJcbiAgICAgICAgaWYgKFwiem9vbUZhY3RvclwiIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuem9vbUZhY3RvciA9IG9wdGlvbnMuem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgJChcIiN6b29tZXJcIikuc2xpZGVyKHsgdmFsdWU6IDEgLyBvcHRpb25zLnpvb21GYWN0b3IgfSk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0R3JpZExheWVyKCkhLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmxldCBnYW1lTWFuYWdlciA9IG5ldyBHYW1lTWFuYWdlcigpO1xyXG4oPGFueT53aW5kb3cpLmdhbWVNYW5hZ2VyID0gZ2FtZU1hbmFnZXI7XHJcblxyXG4vLyAqKioqIFNFVFVQIFVJICoqKipcclxuXHJcbi8vIHByZXZlbnQgZG91YmxlIGNsaWNraW5nIHRleHQgc2VsZWN0aW9uXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzZWxlY3RzdGFydCcsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgJG1lbnUuaGlkZSgpO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlRG93bihlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlTW92ZShlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyVXAoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIGdhbWVNYW5hZ2VyLnRvb2xzLmdldEluZGV4VmFsdWUoZ2FtZU1hbmFnZXIuc2VsZWN0ZWRUb29sKSEub25Nb3VzZVVwKGUpO1xyXG59XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBvblBvaW50ZXJEb3duKTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVyTW92ZSk7XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCBvblBvaW50ZXJVcCk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZTogTW91c2VFdmVudCkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKGUuYnV0dG9uICE9PSAyIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbkNvbnRleHRNZW51KGUpO1xyXG59KTtcclxuXHJcbiQoXCIjem9vbWVyXCIpLnNsaWRlcih7XHJcbiAgICBvcmllbnRhdGlvbjogXCJ2ZXJ0aWNhbFwiLFxyXG4gICAgbWluOiAwLjUsXHJcbiAgICBtYXg6IDUuMCxcclxuICAgIHN0ZXA6IDAuMSxcclxuICAgIHZhbHVlOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcixcclxuICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBuZXdaID0gMSAvIHVpLnZhbHVlITtcclxuICAgICAgICBjb25zdCBvcmlnWCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gb3JpZ1o7XHJcbiAgICAgICAgY29uc3QgbmV3WCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gbmV3WjtcclxuICAgICAgICBjb25zdCBvcmlnWSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIG9yaWdaO1xyXG4gICAgICAgIGNvbnN0IG5ld1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBuZXdaO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gbmV3WjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCAtPSAob3JpZ1ggLSBuZXdYKSAvIDI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgLT0gKG9yaWdZIC0gbmV3WSkgLyAyO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7XHJcbiAgICAgICAgICAgIHpvb21GYWN0b3I6IG5ld1osXHJcbiAgICAgICAgICAgIHBhblg6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YLFxyXG4gICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XHJcbiRtZW51LmhpZGUoKTtcclxuXHJcbmNvbnN0IHNldHRpbmdzX21lbnUgPSAkKFwiI21lbnVcIikhO1xyXG5jb25zdCBsb2NhdGlvbnNfbWVudSA9ICQoXCIjbG9jYXRpb25zLW1lbnVcIikhO1xyXG5jb25zdCBsYXllcl9tZW51ID0gJChcIiNsYXllcnNlbGVjdFwiKSE7XHJcbiQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG5cclxuJCgnI3JtLXNldHRpbmdzJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKHNldHRpbmdzX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIsIHdpZHRoOiBcIis9MjAwcHhcIiB9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIi09MjAwcHhcIiB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0dGluZ3NfbWVudS5hbmltYXRlKHsgd2lkdGg6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiwgd2lkdGg6IFwiLT0yMDBweFwiIH0pO1xyXG4gICAgICAgIGxheWVyX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiKz0yMDBweFwiIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiQoJyNybS1sb2NhdGlvbnMnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIG9yZGVyIG9mIGFuaW1hdGlvbiBpcyBpbXBvcnRhbnQsIGl0IG90aGVyd2lzZSB3aWxsIHNvbWV0aW1lcyBzaG93IGEgc21hbGwgZ2FwIGJldHdlZW4gdGhlIHR3byBvYmplY3RzXHJcbiAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCItPTEwMHB4XCIgfSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGhlaWdodDogJ3RvZ2dsZScgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBoZWlnaHQ6ICd0b2dnbGUnIH0pO1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCIrPTEwMHB4XCIgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxud2luZG93Lm9ucmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFdpZHRoKHdpbmRvdy5pbm5lcldpZHRoKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRIZWlnaHQod2luZG93LmlubmVySGVpZ2h0KTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbn07XHJcblxyXG4kKCdib2R5Jykua2V5dXAoZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmIChlLmtleUNvZGUgPT09IDQ2ICYmIGUudGFyZ2V0LnRhZ05hbWUgIT09IFwiSU5QVVRcIikge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciBzZWxlY3RlZCBmb3IgZGVsZXRlIG9wZXJhdGlvblwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGwuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICBsLnJlbW92ZVNoYXBlKHNlbCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5yZW1vdmVJbml0aWF0aXZlKHNlbC51dWlkLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJChcIiNncmlkU2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCBncyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKGdzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGdyaWRzaXplXCIsIGdzKTtcclxufSk7XHJcblxyXG4kKFwiI3VuaXRTaXplSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVzID0gcGFyc2VJbnQoKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZSk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VW5pdFNpemUodXMpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VuaXRTaXplJzogdXMgfSk7XHJcbn0pO1xyXG4kKFwiI3VzZUdyaWRJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWcgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VXNlR3JpZCh1Zyk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAndXNlR3JpZCc6IHVnIH0pO1xyXG59KTtcclxuJChcIiN1c2VGT1dJbnB1dFwiKS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgdWYgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0RnVsbEZPVyh1Zik7XHJcbiAgICBzb2NrZXQuZW1pdChcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgeyAnZnVsbEZPVyc6IHVmIH0pO1xyXG59KTtcclxuJChcIiNmb3dPcGFjaXR5XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBsZXQgZm8gPSBwYXJzZUZsb2F0KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgaWYgKGlzTmFOKGZvKSkge1xyXG4gICAgICAgICQoXCIjZm93T3BhY2l0eVwiKS52YWwoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHkpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChmbyA8IDApIGZvID0gMDtcclxuICAgIGlmIChmbyA+IDEpIGZvID0gMTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGT1dPcGFjaXR5KGZvKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICdmb3dPcGFjaXR5JzogZm8gfSk7XHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZU1hbmFnZXI7IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgdXVpZHY0LCBQb2ludCB9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7IGdldExpbmVzSW50ZXJzZWN0UG9pbnQsIGdldFBvaW50RGlzdGFuY2UgfSBmcm9tIFwiLi9nZW9tXCI7XHJcbmltcG9ydCB7IGwyd3gsIGwyd3ksIHcybCwgdzJsciwgdzJseCwgdzJseSB9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7IExheWVyIH0gZnJvbSBcIi4vbGF5ZXJzXCI7XHJcbmltcG9ydCB7IFNlcnZlclNoYXBlIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG5cclxuaW50ZXJmYWNlIFRyYWNrZXIge1xyXG4gICAgdXVpZDogc3RyaW5nO1xyXG4gICAgdmlzaWJsZTogYm9vbGVhbjtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHZhbHVlOiBudW1iZXI7XHJcbiAgICBtYXh2YWx1ZTogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQXVyYSB7XHJcbiAgICB1dWlkOiBzdHJpbmc7XHJcbiAgICBsaWdodFNvdXJjZTogYm9vbGVhbjtcclxuICAgIHZpc2libGU6IGJvb2xlYW47XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICB2YWx1ZTogbnVtYmVyO1xyXG4gICAgZGltOiBudW1iZXI7XHJcbiAgICBjb2xvdXI6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNoYXBlIHtcclxuICAgIHR5cGU6IHN0cmluZyA9IFwic2hhcGVcIjtcclxuICAgIHV1aWQ6IHN0cmluZztcclxuICAgIGdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjogc3RyaW5nID0gXCJzb3VyY2Utb3ZlclwiO1xyXG4gICAgZmlsbDogc3RyaW5nID0gJyMwMDAnO1xyXG4gICAgbGF5ZXI6IHN0cmluZyA9IFwiXCI7XHJcbiAgICBuYW1lID0gJ1Vua25vd24gc2hhcGUnO1xyXG4gICAgdHJhY2tlcnM6IFRyYWNrZXJbXSA9IFtdO1xyXG4gICAgYXVyYXM6IEF1cmFbXSA9IFtdO1xyXG4gICAgb3duZXJzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgdmlzaW9uT2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuICAgIG1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy51dWlkID0gdXVpZCB8fCB1dWlkdjQoKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Q7XHJcblxyXG4gICAgYWJzdHJhY3QgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluV29ybGRDb29yZDogYm9vbGVhbik6IGJvb2xlYW47XHJcblxyXG4gICAgYWJzdHJhY3QgY2VudGVyKCk6IFBvaW50O1xyXG4gICAgYWJzdHJhY3QgY2VudGVyKGNlbnRlclBvaW50OiBQb2ludCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBnZXRDb3JuZXIoeDogbnVtYmVyLCB5Om51bWJlcik6IHN0cmluZ3x1bmRlZmluZWQ7XHJcbiAgICBhYnN0cmFjdCB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW47XHJcblxyXG4gICAgY2hlY2tMaWdodFNvdXJjZXMoKSB7XHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc3Qgdm9faSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuaW5kZXhPZih0aGlzLnV1aWQpO1xyXG4gICAgICAgIGlmICh0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgICAgICBlbHNlIGlmICghdGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgbGlnaHRzb3VyY2UgYXVyYXMgYXJlIGluIHRoZSBnYW1lTWFuYWdlclxyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXUpIHtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UgJiYgaSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGxzLnB1c2goeyBzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFhdS5saWdodFNvdXJjZSAmJiBpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIGFueXRoaW5nIGluIHRoZSBnYW1lTWFuYWdlciByZWZlcmVuY2luZyB0aGlzIHNoYXBlIGlzIGluIGZhY3Qgc3RpbGwgYSBsaWdodHNvdXJjZVxyXG4gICAgICAgIGZvciAobGV0IGkgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXNbaV07XHJcbiAgICAgICAgICAgIGlmIChscy5zaGFwZSA9PT0gc2VsZi51dWlkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuYXVyYXMuc29tZShhID0+IGEudXVpZCA9PT0gbHMuYXVyYSAmJiBhLmxpZ2h0U291cmNlKSlcclxuICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldE1vdmVtZW50QmxvY2soYmxvY2tzTW92ZW1lbnQ6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBibG9ja3NNb3ZlbWVudCB8fCBmYWxzZTtcclxuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XHJcbiAgICAgICAgaWYgKHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XHJcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID49IDApXHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIG93bmVkQnkodXNlcm5hbWU/OiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodXNlcm5hbWUgPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgdXNlcm5hbWUgPSBnYW1lTWFuYWdlci51c2VybmFtZTtcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIuSVNfRE0gfHwgdGhpcy5vd25lcnMuaW5jbHVkZXModXNlcm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0aW9uKCkge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFja2Vycy5sZW5ndGggfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMClcclxuICAgICAgICAgICAgdGhpcy50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xyXG4gICAgICAgIGlmICghdGhpcy5hdXJhcy5sZW5ndGggfHwgdGhpcy5hdXJhc1t0aGlzLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMClcclxuICAgICAgICAgICAgdGhpcy5hdXJhcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogMCxcclxuICAgICAgICAgICAgICAgIGRpbTogMCxcclxuICAgICAgICAgICAgICAgIGxpZ2h0U291cmNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLFxyXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KHRoaXMubmFtZSk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NlbGVjdGlvbi10cmFja2Vyc1wiKTtcclxuICAgICAgICB0cmFja2Vycy5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMudHJhY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAodHJhY2tlcikge1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmFja2VyLm1heHZhbHVlID8gYCR7dHJhY2tlci52YWx1ZX0vJHt0cmFja2VyLm1heHZhbHVlfWAgOiB0cmFja2VyLnZhbHVlO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi10cmFja2VyLSR7dHJhY2tlci51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+JHt0cmFja2VyLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgICAgICB0cmFja2Vycy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLXRyYWNrZXItJHt0cmFja2VyLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tdHJhY2tlci12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgYXVyYXMgPSAkKFwiI3NlbGVjdGlvbi1hdXJhc1wiKTtcclxuICAgICAgICBhdXJhcy5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgICAgIGF1cmFzLmFwcGVuZCgkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLWF1cmEtJHthdXJhLnV1aWR9LW5hbWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj4ke2F1cmEubmFtZX08L2Rpdj5gKSk7XHJcbiAgICAgICAgICAgIGF1cmFzLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tYXVyYS0ke2F1cmEudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi1hdXJhLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKFwiI3NlbGVjdGlvbi1tZW51XCIpLnNob3coKTtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zdCBlZGl0YnV0dG9uID0gJChcIiNzZWxlY3Rpb24tZWRpdC1idXR0b25cIik7XHJcbiAgICAgICAgaWYgKCF0aGlzLm93bmVkQnkoKSlcclxuICAgICAgICAgICAgZWRpdGJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlZGl0YnV0dG9uLnNob3coKTtcclxuICAgICAgICBlZGl0YnV0dG9uLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKHNlbGYudXVpZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpYWxvZ19uYW1lID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1uYW1lXCIpO1xyXG4gICAgICAgICAgICBkaWFsb2dfbmFtZS52YWwoc2VsZi5uYW1lKTtcclxuICAgICAgICAgICAgZGlhbG9nX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyh1dWlkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xyXG4gICAgICAgICAgICAgICAgICAgIHMubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKFwiI3NlbGVjdGlvbi1uYW1lXCIpLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHMuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpYWxvZ19saWdodGJsb2NrID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1saWdodGJsb2NrZXJcIik7XHJcbiAgICAgICAgICAgIGRpYWxvZ19saWdodGJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYudmlzaW9uT2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgICAgICBkaWFsb2dfbGlnaHRibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgICAgICAgICBzLnZpc2lvbk9ic3RydWN0aW9uID0gZGlhbG9nX2xpZ2h0YmxvY2sucHJvcChcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgcy5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc3QgZGlhbG9nX21vdmVibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbW92ZWJsb2NrZXJcIik7XHJcbiAgICAgICAgICAgIGRpYWxvZ19tb3ZlYmxvY2sucHJvcChcImNoZWNrZWRcIiwgc2VsZi5tb3ZlbWVudE9ic3RydWN0aW9uKTtcclxuICAgICAgICAgICAgZGlhbG9nX21vdmVibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHV1aWQpITtcclxuICAgICAgICAgICAgICAgICAgICBzLnNldE1vdmVtZW50QmxvY2soZGlhbG9nX21vdmVibG9jay5wcm9wKFwiY2hlY2tlZFwiKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb3duZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1vd25lcnNcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy10cmFja2Vyc1wiKTtcclxuICAgICAgICAgICAgY29uc3QgYXVyYXMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWF1cmFzXCIpO1xyXG4gICAgICAgICAgICBvd25lcnMubmV4dFVudGlsKHRyYWNrZXJzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgdHJhY2tlcnMubmV4dFVudGlsKGF1cmFzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgYXVyYXMubmV4dFVudGlsKCQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuZmluZChcImZvcm1cIikpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkT3duZXIob3duZXI6IHN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3dfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtbmFtZT1cIiR7b3duZXJ9XCIgdmFsdWU9XCIke293bmVyfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG93X3JlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyYWNrZXJzLmJlZm9yZShvd19uYW1lLmFkZChvd19yZW1vdmUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBvd19uYW1lLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvd19pID49IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxLCA8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vd25lcnMucHVzaCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkT3duZXIoXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBvd19yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3dfaSA9IHNlbGYub3duZXJzLmZpbmRJbmRleChvID0+IG8gPT09ICQodGhpcykuZGF0YSgnbmFtZScpKTtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnByZXYoKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnNwbGljZShvd19pLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5vd25lcnMuZm9yRWFjaChhZGRPd25lcik7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi5vd25lcnMubGVuZ3RoIHx8IHNlbGYub3duZXJzW3NlbGYub3duZXJzLmxlbmd0aCAtIDFdICE9PSAnJylcclxuICAgICAgICAgICAgICAgIGFkZE93bmVyKFwiXCIpO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkVHJhY2tlcih0cmFja2VyOiBUcmFja2VyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0cl92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci52YWx1ZX1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyX21heHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiTWF4IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubWF4dmFsdWUgfHwgXCJcIn1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1cmFzLmJlZm9yZShcclxuICAgICAgICAgICAgICAgICAgICB0cl9uYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQodHJfdmFsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQodHJfbWF4dmFsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl92aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj48L3NwYW4+YClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl9yZW1vdmUpXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghdHJhY2tlci52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRyX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJOYW1lIGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHIubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYudHJhY2tlcnMubGVuZ3RoIHx8IHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCBzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRUcmFja2VyKHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0cl92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWYWx1ZSBjaGFuZ2Ugb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRyLnZhbHVlID0gcGFyc2VJbnQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSB0ci5tYXh2YWx1ZSA/IGAke3RyLnZhbHVlfS8ke3RyLm1heHZhbHVlfWAgOiB0ci52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRyX21heHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1henZhbHVlIGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHIubWF4dmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdHJfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZW1vdmUgb24gdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ci5uYW1lID09PSAnJyB8fCB0ci52YWx1ZSA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHt0ci51dWlkfV1gKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnNwbGljZShzZWxmLnRyYWNrZXJzLmluZGV4T2YodHIpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRyX3Zpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZpc2liaWxpdHkgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHIudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgICAgICB0ci52aXNpYmxlID0gIXRyLnZpc2libGU7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi50cmFja2Vycy5mb3JFYWNoKGFkZFRyYWNrZXIpO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkQXVyYShhdXJhOiBBdXJhKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS5uYW1lfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJDdXJyZW50IHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEudmFsdWV9XCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX2RpbXZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiRGltIHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEuZGltIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX2NvbG91ciA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiQXVyYSBjb2xvdXJcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj5gKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9saWdodCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtbGlnaHRidWxiXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9yZW1vdmUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmNoaWxkcmVuKCkubGFzdCgpLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICAgICBhdXJhX25hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX3ZhbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+Lzwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfZGltdmFsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKCQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCkuYXBwZW5kKGF1cmFfY29sb3VyKS5hcHBlbmQoJChcIjwvZGl2PlwiKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfbGlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYXVyYV9yZW1vdmUpXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghYXVyYS52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgIGF1cmFfdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWF1cmEubGlnaHRTb3VyY2UpXHJcbiAgICAgICAgICAgICAgICAgICAgYXVyYV9saWdodC5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYXVyYV9jb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGF1cmEuY29sb3VyLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdmU6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIG1vdmUgdW5rbm93biBhdXJhIGNvbG91clwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEbyBub3QgdXNlIGF1cmEgZGlyZWN0bHkgYXMgaXQgZG9lcyBub3Qgd29yayBwcm9wZXJseSBmb3IgbmV3IGF1cmFzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1cmFfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgbmFtZSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYXUubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5sZW5ndGggfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogdXVpZHY0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGltOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW3NlbGYuYXVyYXMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXVyYV92YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIHZhbHVlIG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhdS52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGF1cmFfZGltdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSBkaW12YWx1ZSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYXUudmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBhdXJhX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHJlbW92ZSB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1Lm5hbWUgPT09ICcnICYmIGF1LnZhbHVlID09PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke2F1LnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXVyYXMuc3BsaWNlKHNlbGYuYXVyYXMuaW5kZXhPZihhdSksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF1cmEgY29sb3VyIHRhcmdldCBoYXMgbm8gYXNzb2NpYXRlZCBsYXllclwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGF1cmFfdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHRvZ2dsZSB2aXNpYmlsaXR5IG9mIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhdS52aXNpYmxlID0gIWF1LnZpc2libGU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1LnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGF1cmFfbGlnaHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgbGlnaHQgY2FwYWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYXUubGlnaHRTb3VyY2UgPSAhYXUubGlnaHRTb3VyY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaSA9IGxzLmZpbmRJbmRleChvID0+IG8uYXVyYSA9PT0gYXUudXVpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1LmxpZ2h0U291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBscy5wdXNoKHsgc2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZCB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPj0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYuYXVyYXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGFkZEF1cmEoc2VsZi5hdXJhc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5zaGFwZVNlbGVjdGlvbkRpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJy5zZWxlY3Rpb24tdHJhY2tlci12YWx1ZScpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrZXIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgICAgICBpZiAodHJhY2tlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB1cGRhdGUgdW5rbm93biB0cmFja2VyXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld190cmFja2VyID0gcHJvbXB0KGBOZXcgICR7dHJhY2tlci5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgICAgICBpZiAobmV3X3RyYWNrZXIgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGlmICh0cmFja2VyLnZhbHVlID09PSAwKVxyXG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSA9IDA7XHJcbiAgICAgICAgICAgIGlmIChuZXdfdHJhY2tlclswXSA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VyLnZhbHVlICs9IHBhcnNlSW50KG5ld190cmFja2VyLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdfdHJhY2tlclswXSA9PT0gJy0nKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFja2VyLnZhbHVlIC09IHBhcnNlSW50KG5ld190cmFja2VyLnNsaWNlKDEpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgPSBwYXJzZUludChuZXdfdHJhY2tlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJhY2tlci5tYXh2YWx1ZSA/IGAke3RyYWNrZXIudmFsdWV9LyR7dHJhY2tlci5tYXh2YWx1ZX1gIDogdHJhY2tlci52YWx1ZTtcclxuICAgICAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkKCcuc2VsZWN0aW9uLWF1cmEtdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSB1dWlkKTtcclxuICAgICAgICAgICAgaWYgKGF1cmEgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdXBkYXRlIHVua25vd24gYXVyYVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdfYXVyYSA9IHByb21wdChgTmV3ICAke2F1cmEubmFtZX0gdmFsdWU6IChhYnNvbHV0ZSBvciByZWxhdGl2ZSlgKTtcclxuICAgICAgICAgICAgaWYgKG5ld19hdXJhID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoYXVyYS52YWx1ZSA9PT0gMClcclxuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgPSAwO1xyXG4gICAgICAgICAgICBpZiAobmV3X2F1cmFbMF0gPT09ICcrJykge1xyXG4gICAgICAgICAgICAgICAgYXVyYS52YWx1ZSArPSBwYXJzZUludChuZXdfYXVyYS5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmV3X2F1cmFbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICAgICAgYXVyYS52YWx1ZSAtPSBwYXJzZUludChuZXdfYXVyYS5zbGljZSgxKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhdXJhLnZhbHVlID0gcGFyc2VJbnQobmV3X2F1cmEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1cmEuZGltID8gYCR7YXVyYS52YWx1ZX0vJHthdXJhLmRpbX1gIDogYXVyYS52YWx1ZTtcclxuICAgICAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNlbGYubGF5ZXIpKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvblNlbGVjdGlvbkxvc3MoKSB7XHJcbiAgICAgICAgLy8gJChgI3NoYXBlc2VsZWN0aW9uY29nLSR7dGhpcy51dWlkfWApLnJlbW92ZSgpO1xyXG4gICAgICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzRGljdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIGlmICh0aGlzLmxheWVyID09PSAnZm93Jykge1xyXG4gICAgICAgICAgICB0aGlzLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSB0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbjtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XHJcbiAgICAgICAgdGhpcy5kcmF3QXVyYXMoY3R4KTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3QXVyYXMoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgICAgICB0aGlzLmF1cmFzLmZvckVhY2goZnVuY3Rpb24gKGF1cmEpIHtcclxuICAgICAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApIHJldHVybjtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gYXVyYS5jb2xvdXI7XHJcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJmb3dcIikgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpIS5jdHggPT09IGN0eClcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYyA9IHcybChzZWxmLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHcybHIoYXVyYS52YWx1ZSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgaWYgKGF1cmEuZGltKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0YyA9IHRpbnljb2xvcihhdXJhLmNvbG91cik7XHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGMuc2V0QWxwaGEodGMuZ2V0QWxwaGEoKSAvIDIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSB3Mmwoc2VsZi5jZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdzJscihhdXJhLmRpbSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzaG93Q29udGV4dE1lbnUobW91c2U6IFBvaW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGwuc2VsZWN0aW9uID0gW3RoaXNdO1xyXG4gICAgICAgIHRoaXMub25TZWxlY3Rpb24oKTtcclxuICAgICAgICBsLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzO1xyXG4gICAgICAgICRtZW51LnNob3coKTtcclxuICAgICAgICAkbWVudS5lbXB0eSgpO1xyXG4gICAgICAgICRtZW51LmNzcyh7IGxlZnQ6IG1vdXNlLngsIHRvcDogbW91c2UueSB9KTtcclxuICAgICAgICBsZXQgZGF0YSA9IFwiXCIgK1xyXG4gICAgICAgICAgICBcIjx1bD5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpPkxheWVyPHVsPlwiO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5sYXllcnMuZm9yRWFjaChmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLm5hbWUgPT09IGwubmFtZSA/IFwiIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOmFxdWEnIFwiIDogXCIgXCI7XHJcbiAgICAgICAgICAgIGRhdGEgKz0gYDxsaSBkYXRhLWFjdGlvbj0nc2V0TGF5ZXInIGRhdGEtbGF5ZXI9JyR7bGF5ZXIubmFtZX0nICR7c2VsfSBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPiR7bGF5ZXIubmFtZX08L2xpPmA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZGF0YSArPSBcIjwvdWw+PC9saT5cIiArXHJcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9CYWNrJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPk1vdmUgdG8gYmFjazwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvRnJvbnQnIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBmcm9udDwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nYWRkSW5pdGlhdGl2ZScgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5BZGQgaW5pdGlhdGl2ZTwvbGk+XCIgK1xyXG4gICAgICAgICAgICBcIjwvdWw+XCI7XHJcbiAgICAgICAgJG1lbnUuaHRtbChkYXRhKTtcclxuICAgICAgICAkKFwiLmNvbnRleHQtY2xpY2thYmxlXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaGFuZGxlQ29udGV4dE1lbnUoJCh0aGlzKSwgYXNzZXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQm91bmRpbmdSZWN0IHtcclxuICAgIHR5cGUgPSBcImJvdW5kcmVjdFwiO1xyXG4gICAgeDogbnVtYmVyO1xyXG4gICAgeTogbnVtYmVyO1xyXG4gICAgdzogbnVtYmVyO1xyXG4gICAgaDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgdGhpcy55ID0geTtcclxuICAgICAgICB0aGlzLncgPSB3O1xyXG4gICAgICAgIHRoaXMuaCA9IGg7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluV29ybGRDb29yZDogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmIChpbldvcmxkQ29vcmQpIHtcclxuICAgICAgICAgICAgeCA9IGwyd3goeCk7XHJcbiAgICAgICAgICAgIHkgPSBsMnd5KHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy54IDw9IHggJiYgKHRoaXMueCArIHRoaXMudykgPj0geCAmJlxyXG4gICAgICAgICAgICB0aGlzLnkgPD0geSAmJiAodGhpcy55ICsgdGhpcy5oKSA+PSB5O1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyc2VjdHNXaXRoKG90aGVyOiBCb3VuZGluZ1JlY3QpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gIShvdGhlci54ID49IHRoaXMueCArIHRoaXMudyB8fFxyXG4gICAgICAgICAgICBvdGhlci54ICsgb3RoZXIudyA8PSB0aGlzLnggfHxcclxuICAgICAgICAgICAgb3RoZXIueSA+PSB0aGlzLnkgKyB0aGlzLmggfHxcclxuICAgICAgICAgICAgb3RoZXIueSArIG90aGVyLmggPD0gdGhpcy55KTtcclxuICAgIH1cclxuICAgIGdldEludGVyc2VjdFdpdGhMaW5lKGxpbmU6IHsgc3RhcnQ6IFBvaW50OyBlbmQ6IFBvaW50IH0pIHtcclxuICAgICAgICBjb25zdCBsaW5lcyA9IFtcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7IHg6IHRoaXMueCwgeTogdGhpcy55IH0sIHsgeDogdGhpcy54ICsgdGhpcy53LCB5OiB0aGlzLnkgfSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHsgeDogdGhpcy54ICsgdGhpcy53LCB5OiB0aGlzLnkgfSwge1xyXG4gICAgICAgICAgICAgICAgeDogdGhpcy54ICsgdGhpcy53LFxyXG4gICAgICAgICAgICAgICAgeTogdGhpcy55ICsgdGhpcy5oXHJcbiAgICAgICAgICAgIH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7IHg6IHRoaXMueCwgeTogdGhpcy55IH0sIHsgeDogdGhpcy54LCB5OiB0aGlzLnkgKyB0aGlzLmggfSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxyXG4gICAgICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHsgeDogdGhpcy54LCB5OiB0aGlzLnkgKyB0aGlzLmggfSwge1xyXG4gICAgICAgICAgICAgICAgeDogdGhpcy54ICsgdGhpcy53LFxyXG4gICAgICAgICAgICAgICAgeTogdGhpcy55ICsgdGhpcy5oXHJcbiAgICAgICAgICAgIH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKVxyXG4gICAgICAgIF07XHJcbiAgICAgICAgbGV0IG1pbl9kID0gSW5maW5pdHk7XHJcbiAgICAgICAgbGV0IG1pbl9pID0gbnVsbDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGwgPSBsaW5lc1tpXTtcclxuICAgICAgICAgICAgaWYgKGwuaW50ZXJzZWN0ID09PSBudWxsKSBjb250aW51ZTtcclxuICAgICAgICAgICAgY29uc3QgZCA9IGdldFBvaW50RGlzdGFuY2UobGluZS5zdGFydCwgbC5pbnRlcnNlY3QpO1xyXG4gICAgICAgICAgICBpZiAobWluX2QgPiBkKSB7XHJcbiAgICAgICAgICAgICAgICBtaW5fZCA9IGQ7XHJcbiAgICAgICAgICAgICAgICBtaW5faSA9IGwuaW50ZXJzZWN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IGludGVyc2VjdDogbWluX2ksIGRpc3RhbmNlOiBtaW5fZCB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUmVjdCBleHRlbmRzIFNoYXBlIHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIHc6IG51bWJlcjtcclxuICAgIGg6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHV1aWQpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwiYmFzZXJlY3RcIjtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgdGhpcy53ID0gdztcclxuICAgICAgICB0aGlzLmggPSBoO1xyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy54LCB0aGlzLnksIHRoaXMudywgdGhpcy5oKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHg6IG51bWJlciwgeTogbnVtYmVyLCBpbldvcmxkQ29vcmQ6IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoaW5Xb3JsZENvb3JkKSB7XHJcbiAgICAgICAgICAgIHggPSBsMnd4KHgpO1xyXG4gICAgICAgICAgICB5ID0gbDJ3eSh5KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCA8PSB4ICYmICh0aGlzLnggKyB0aGlzLncpID49IHggJiZcclxuICAgICAgICAgICAgdGhpcy55IDw9IHkgJiYgKHRoaXMueSArIHRoaXMuaCkgPj0geTtcclxuICAgIH1cclxuICAgIGluQ29ybmVyKHg6IG51bWJlciwgeTogbnVtYmVyLCBjb3JuZXI6IHN0cmluZykge1xyXG4gICAgICAgIHN3aXRjaCAoY29ybmVyKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ25lJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCArIHRoaXMudyAtIDMpIDw9IHggJiYgeCA8PSB3Mmx4KHRoaXMueCArIHRoaXMudyArIDMpICYmIHcybHkodGhpcy55IC0gMykgPD0geSAmJiB5IDw9IHcybHkodGhpcy55ICsgMyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ253JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCAtIDMpIDw9IHggJiYgeCA8PSB3Mmx4KHRoaXMueCArIDMpICYmIHcybHkodGhpcy55IC0gMykgPD0geSAmJiB5IDw9IHcybHkodGhpcy55ICsgMyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N3JzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCAtIDMpIDw9IHggJiYgeCA8PSB3Mmx4KHRoaXMueCArIDMpICYmIHcybHkodGhpcy55ICsgdGhpcy5oIC0gMykgPD0geSAmJiB5IDw9IHcybHkodGhpcy55ICsgdGhpcy5oICsgMyk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3NlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCArIHRoaXMudyAtIDMpIDw9IHggJiYgeCA8PSB3Mmx4KHRoaXMueCArIHRoaXMudyArIDMpICYmIHcybHkodGhpcy55ICsgdGhpcy5oIC0gMykgPD0geSAmJiB5IDw9IHcybHkodGhpcy55ICsgdGhpcy5oICsgMyk7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZ2V0Q29ybmVyKHg6IG51bWJlciwgeTogbnVtYmVyKTogc3RyaW5nfHVuZGVmaW5lZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcigpOiBQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogUG9pbnQpOiBQb2ludCB8IHZvaWQge1xyXG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4geyB4OiB0aGlzLnggKyB0aGlzLncgLyAyLCB5OiB0aGlzLnkgKyB0aGlzLmggLyAyIH07XHJcbiAgICAgICAgdGhpcy54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICAgICAgdGhpcy55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XHJcbiAgICB9XHJcblxyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gISh3Mmx4KHRoaXMueCkgPiBjYW52YXMud2lkdGggfHwgdzJseSh0aGlzLnkpID4gY2FudmFzLmhlaWdodCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHcybHgodGhpcy54ICsgdGhpcy53KSA8IDAgfHwgdzJseSh0aGlzLnkgKyB0aGlzLmgpIDwgMCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZWN0IGV4dGVuZHMgQmFzZVJlY3Qge1xyXG4gICAgYm9yZGVyOiBzdHJpbmc7XHJcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIGZpbGw/OiBzdHJpbmcsIGJvcmRlcj86IHN0cmluZywgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHgsIHksIHcsIGgsIHV1aWQpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwicmVjdFwiO1xyXG4gICAgICAgIHRoaXMuZmlsbCA9IGZpbGwgfHwgJyMwMDAnO1xyXG4gICAgICAgIHRoaXMuYm9yZGVyID0gYm9yZGVyIHx8IFwicmdiYSgwLCAwLCAwLCAwKVwiO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBsb2MgPSB3MmwoeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9KTtcclxuICAgICAgICBjdHguZmlsbFJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgICAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlUmVjdChsb2MueCwgbG9jLnksIHRoaXMudyAqIHosIHRoaXMuaCAqIHopO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENpcmNsZSBleHRlbmRzIFNoYXBlIHtcclxuICAgIHg6IG51bWJlcjtcclxuICAgIHk6IG51bWJlcjtcclxuICAgIHI6IG51bWJlcjtcclxuICAgIGJvcmRlcjogc3RyaW5nO1xyXG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHI6IG51bWJlciwgZmlsbD86IHN0cmluZywgYm9yZGVyPzogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIodXVpZCk7XHJcbiAgICAgICAgdGhpcy50eXBlID0gXCJjaXJjbGVcIjtcclxuICAgICAgICB0aGlzLnggPSB4IHx8IDA7XHJcbiAgICAgICAgdGhpcy55ID0geSB8fCAwO1xyXG4gICAgICAgIHRoaXMuciA9IHIgfHwgMTtcclxuICAgICAgICB0aGlzLmZpbGwgPSBmaWxsIHx8ICcjMDAwJztcclxuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIH07XHJcbiAgICBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Qge1xyXG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMueCAtIHRoaXMuciwgdGhpcy55IC0gdGhpcy5yLCB0aGlzLnIgKiAyLCB0aGlzLnIgKiAyKTtcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGw7XHJcbiAgICAgICAgY29uc3QgbG9jID0gdzJsKHsgeDogdGhpcy54LCB5OiB0aGlzLnkgfSk7XHJcbiAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuYm9yZGVyICE9PSBcInJnYmEoMCwgMCwgMCwgMClcIikge1xyXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyO1xyXG4gICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdGhpcy5yLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAoeCAtIHcybHgodGhpcy54KSkgKiogMiArICh5IC0gdzJseSh0aGlzLnkpKSAqKiAyIDwgdGhpcy5yICoqIDI7XHJcbiAgICB9XHJcbiAgICBpbkNvcm5lcih4OiBudW1iZXIsIHk6IG51bWJlciwgY29ybmVyOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vVE9ET1xyXG4gICAgfVxyXG4gICAgZ2V0Q29ybmVyKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJuZVwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgICAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKHgsIHksIFwibndcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcInNlXCIpKVxyXG4gICAgICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzd1wiKSlcclxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcclxuICAgIH1cclxuICAgIGNlbnRlcigpOiBQb2ludDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludDogUG9pbnQpOiB2b2lkO1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogUG9pbnQpOiBQb2ludCB8IHZvaWQge1xyXG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICByZXR1cm4geyB4OiB0aGlzLngsIHk6IHRoaXMueSB9O1xyXG4gICAgICAgIHRoaXMueCA9IGNlbnRlclBvaW50Lng7XHJcbiAgICAgICAgdGhpcy55ID0gY2VudGVyUG9pbnQueTtcclxuICAgIH1cclxuICAgIHZpc2libGVJbkNhbnZhcyhjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KTogYm9vbGVhbiB7IHJldHVybiB0cnVlOyB9IC8vIFRPRE9cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExpbmUgZXh0ZW5kcyBTaGFwZSB7XHJcbiAgICB4MTogbnVtYmVyO1xyXG4gICAgeTE6IG51bWJlcjtcclxuICAgIHgyOiBudW1iZXI7XHJcbiAgICB5MjogbnVtYmVyO1xyXG4gICAgY29uc3RydWN0b3IoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgdXVpZD86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHV1aWQpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwibGluZVwiO1xyXG4gICAgICAgIHRoaXMueDEgPSB4MTtcclxuICAgICAgICB0aGlzLnkxID0geTE7XHJcbiAgICAgICAgdGhpcy54MiA9IHgyO1xyXG4gICAgICAgIHRoaXMueTIgPSB5MjtcclxuICAgIH1cclxuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QoXHJcbiAgICAgICAgICAgIE1hdGgubWluKHRoaXMueDEsIHRoaXMueDIpLFxyXG4gICAgICAgICAgICBNYXRoLm1pbih0aGlzLnkxLCB0aGlzLnkyKSxcclxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy54MSAtIHRoaXMueDIpLFxyXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLnkxIC0gdGhpcy55MilcclxuICAgICAgICApO1xyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyh3Mmx4KHRoaXMueDEpLCB3Mmx5KHRoaXMueTEpKTtcclxuICAgICAgICBjdHgubGluZVRvKHcybHgodGhpcy54MiksIHcybHkodGhpcy55MikpO1xyXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwwLDAsIDAuNSknO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAzO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgIH1cclxuICAgIGNvbnRhaW5zKHg6IG51bWJlciwgeTogbnVtYmVyLCBpbldvcmxkQ29vcmQ6IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cclxuICAgIH1cclxuXHJcbiAgICBjZW50ZXIoKTogUG9pbnQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IFBvaW50KTogdm9pZDtcclxuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IFBvaW50KTogUG9pbnQgfCB2b2lkIHsgfSAvLyBUT0RPXHJcbiAgICBnZXRDb3JuZXIoeDogbnVtYmVyLCB5Om51bWJlcik6IHN0cmluZ3x1bmRlZmluZWQgeyByZXR1cm4gXCJcIiB9OyAvLyBUT0RPXHJcbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUZXh0IGV4dGVuZHMgU2hhcGUge1xyXG4gICAgeDogbnVtYmVyO1xyXG4gICAgeTogbnVtYmVyO1xyXG4gICAgdGV4dDogc3RyaW5nO1xyXG4gICAgZm9udDogc3RyaW5nO1xyXG4gICAgYW5nbGU6IG51bWJlcjtcclxuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB0ZXh0OiBzdHJpbmcsIGZvbnQ6IHN0cmluZywgYW5nbGU/OiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih1dWlkKTtcclxuICAgICAgICB0aGlzLnR5cGUgPSBcInRleHRcIjtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcclxuICAgICAgICB0aGlzLmZvbnQgPSBmb250O1xyXG4gICAgICAgIHRoaXMuYW5nbGUgPSBhbmdsZSB8fCAwO1xyXG4gICAgfVxyXG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcclxuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLngsIHRoaXMueSwgNSwgNSk7IC8vIFRvZG86IGZpeCB0aGlzIGJvdW5kaW5nIGJveFxyXG4gICAgfVxyXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xyXG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcclxuICAgICAgICBjdHguZm9udCA9IHRoaXMuZm9udDtcclxuICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgIGN0eC50cmFuc2xhdGUodzJseCh0aGlzLngpLCB3Mmx5KHRoaXMueSkpO1xyXG4gICAgICAgIGN0eC5yb3RhdGUodGhpcy5hbmdsZSk7XHJcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XHJcbiAgICAgICAgY3R4LmZpbGxUZXh0KHRoaXMudGV4dCwgMCwgLTUpO1xyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICB9XHJcbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBUT0RPXHJcbiAgICB9XHJcblxyXG4gICAgY2VudGVyKCk6IFBvaW50O1xyXG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBQb2ludCk6IHZvaWQ7XHJcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBQb2ludCk6IFBvaW50IHwgdm9pZCB7IH0gLy8gVE9ET1xyXG4gICAgZ2V0Q29ybmVyKHg6IG51bWJlciwgeTpudW1iZXIpOiBzdHJpbmd8dW5kZWZpbmVkIHsgcmV0dXJuIFwiXCIgfTsgLy8gVE9ET1xyXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXNzZXQgZXh0ZW5kcyBCYXNlUmVjdCB7XHJcbiAgICBpbWc6IEhUTUxJbWFnZUVsZW1lbnQ7XHJcbiAgICBzcmM6IHN0cmluZyA9ICcnO1xyXG4gICAgY29uc3RydWN0b3IoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCB4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcclxuICAgICAgICBzdXBlcih4LCB5LCB3LCBoKTtcclxuICAgICAgICBpZiAodXVpZCAhPT0gdW5kZWZpbmVkKSB0aGlzLnV1aWQgPSB1dWlkO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFwiYXNzZXRcIjtcclxuICAgICAgICB0aGlzLmltZyA9IGltZztcclxuICAgIH1cclxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcclxuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XHJcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHcybHgodGhpcy54KSwgdzJseSh0aGlzLnkpLCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlOiBTZXJ2ZXJTaGFwZSwgZHVtbXk/OiBib29sZWFuKSB7XHJcbiAgICBpZiAoZHVtbXkgPT09IHVuZGVmaW5lZCkgZHVtbXkgPSBmYWxzZTtcclxuICAgIGlmICghZHVtbXkgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKVxyXG4gICAgICAgIHJldHVybiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCk7XHJcblxyXG4gICAgbGV0IHNoO1xyXG5cclxuICAgIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHNoID0gT2JqZWN0LmFzc2lnbihuZXcgUmVjdCgpLCBzaGFwZSk7XHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ2NpcmNsZScpIHNoID0gT2JqZWN0LmFzc2lnbihuZXcgQ2lyY2xlKCksIHNoYXBlKTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAnbGluZScpIHNoID0gT2JqZWN0LmFzc2lnbihuZXcgTGluZSgpLCBzaGFwZSk7XHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3RleHQnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IFRleHQoKSwgc2hhcGUpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdhc3NldCcpIHtcclxuICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2Uoc2hhcGUudywgc2hhcGUuaCk7XHJcbiAgICAgICAgaW1nLnNyYyA9IHNoYXBlLnNyYztcclxuICAgICAgICBzaCA9IE9iamVjdC5hc3NpZ24obmV3IEFzc2V0KCksIHNoYXBlKTtcclxuICAgICAgICBzaC5pbWcgPSBpbWc7XHJcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSEuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBzaDtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFuZGxlQ29udGV4dE1lbnUobWVudTogSlF1ZXJ5PEhUTUxFbGVtZW50Piwgc2hhcGU6IFNoYXBlKSB7XHJcbiAgICBjb25zdCBhY3Rpb24gPSBtZW51LmRhdGEoXCJhY3Rpb25cIik7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgaWYgKGxheWVyID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgIHN3aXRjaCAoYWN0aW9uKSB7XHJcbiAgICAgICAgY2FzZSAnbW92ZVRvRnJvbnQnOlxyXG4gICAgICAgICAgICBsYXllci5tb3ZlU2hhcGVPcmRlcihzaGFwZSwgbGF5ZXIuc2hhcGVzLmxlbmd0aCAtIDEsIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdtb3ZlVG9CYWNrJzpcclxuICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIoc2hhcGUsIDAsIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdzZXRMYXllcic6XHJcbiAgICAgICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHNoYXBlLCB0cnVlKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKG1lbnUuZGF0YShcImxheWVyXCIpKSEuYWRkU2hhcGUoc2hhcGUsIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdhZGRJbml0aWF0aXZlJzpcclxuICAgICAgICAgICAgbGV0IHNyYyA9ICcnO1xyXG4gICAgICAgICAgICBpZiAoc2hhcGUgaW5zdGFuY2VvZiBBc3NldCkgc3JjID0gc2hhcGUuc3JjO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5hZGRJbml0aWF0aXZlKFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHNoYXBlLnV1aWQsXHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogIWdhbWVNYW5hZ2VyLklTX0RNLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBzcmM6IHNyYyxcclxuICAgICAgICAgICAgICAgICAgICBvd25lcnM6IHNoYXBlLm93bmVyc1xyXG4gICAgICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgJG1lbnUuaGlkZSgpO1xyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHsgYWxwaFNvcnQgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBzZXR1cFRvb2xzIH0gZnJvbSBcIi4vdG9vbHNcIjtcclxuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgTG9jYXRpb25PcHRpb25zLCBBc3NldExpc3QsIFNlcnZlclNoYXBlLCBJbml0aWF0aXZlRGF0YSwgQm9hcmRJbmZvIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XHJcblxyXG5jb25zdCBwcm90b2NvbCA9IGRvY3VtZW50LmRvbWFpbiA9PT0gJ2xvY2FsaG9zdCcgPyBcImh0dHA6Ly9cIiA6IFwiaHR0cHM6Ly9cIjtcclxuY29uc3Qgc29ja2V0ID0gaW8uY29ubmVjdChwcm90b2NvbCArIGRvY3VtZW50LmRvbWFpbiArIFwiOlwiICsgbG9jYXRpb24ucG9ydCArIFwiL3BsYW5hcmFsbHlcIik7XHJcbnNvY2tldC5vbihcImNvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJDb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiRGlzY29ubmVjdGVkXCIpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwicmVkaXJlY3RcIiwgZnVuY3Rpb24gKGRlc3RpbmF0aW9uOiBzdHJpbmcpIHtcclxuICAgIGNvbnNvbGUubG9nKFwicmVkaXJlY3RpbmdcIik7XHJcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGRlc3RpbmF0aW9uO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHVzZXJuYW1lXCIsIGZ1bmN0aW9uICh1c2VybmFtZTogc3RyaW5nKSB7XHJcbiAgICBnYW1lTWFuYWdlci51c2VybmFtZSA9IHVzZXJuYW1lO1xyXG4gICAgZ2FtZU1hbmFnZXIuSVNfRE0gPSB1c2VybmFtZSA9PT0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KFwiL1wiKVsyXTtcclxuICAgIGlmICgkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpLmh0bWwoKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgc2V0dXBUb29scygpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGNsaWVudE9wdGlvbnNcIiwgZnVuY3Rpb24gKG9wdGlvbnM6IENsaWVudE9wdGlvbnMpIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldENsaWVudE9wdGlvbnMob3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIGZ1bmN0aW9uIChvcHRpb25zOiBMb2NhdGlvbk9wdGlvbnMpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYXNzZXQgbGlzdFwiLCBmdW5jdGlvbiAoYXNzZXRzOiBBc3NldExpc3QpIHtcclxuICAgIGNvbnN0IG0gPSAkKFwiI21lbnUtdG9rZW5zXCIpO1xyXG4gICAgbS5lbXB0eSgpO1xyXG4gICAgbGV0IGggPSAnJztcclxuXHJcbiAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGVudHJ5OiBBc3NldExpc3QsIHBhdGg6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGZvbGRlcnMgPSBuZXcgTWFwKE9iamVjdC5lbnRyaWVzKGVudHJ5LmZvbGRlcnMpKTtcclxuICAgICAgICBmb2xkZXJzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcclxuICAgICAgICAgICAgaCArPSBcIjxidXR0b24gY2xhc3M9J2FjY29yZGlvbic+XCIgKyBrZXkgKyBcIjwvYnV0dG9uPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1wYW5lbCc+PGRpdiBjbGFzcz0nYWNjb3JkaW9uLXN1YnBhbmVsJz5cIjtcclxuICAgICAgICAgICAgcHJvY2Vzcyh2YWx1ZSwgcGF0aCArIGtleSArIFwiL1wiKTtcclxuICAgICAgICAgICAgaCArPSBcIjwvZGl2PjwvZGl2PlwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGVudHJ5LmZpbGVzLnNvcnQoYWxwaFNvcnQpO1xyXG4gICAgICAgIGVudHJ5LmZpbGVzLmZvckVhY2goZnVuY3Rpb24gKGFzc2V0KSB7XHJcbiAgICAgICAgICAgIGggKz0gXCI8ZGl2IGNsYXNzPSdkcmFnZ2FibGUgdG9rZW4nPjxpbWcgc3JjPScvc3RhdGljL2ltZy9hc3NldHMvXCIgKyBwYXRoICsgYXNzZXQgKyBcIicgd2lkdGg9JzM1Jz5cIiArIGFzc2V0ICsgXCI8aSBjbGFzcz0nZmFzIGZhLWNvZyc+PC9pPjwvZGl2PlwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHByb2Nlc3MoYXNzZXRzLCBcIlwiKTtcclxuICAgIG0uaHRtbChoKTtcclxuICAgICQoXCIuZHJhZ2dhYmxlXCIpLmRyYWdnYWJsZSh7XHJcbiAgICAgICAgaGVscGVyOiBcImNsb25lXCIsXHJcbiAgICAgICAgYXBwZW5kVG86IFwiI2JvYXJkXCJcclxuICAgIH0pO1xyXG4gICAgJCgnLmFjY29yZGlvbicpLmVhY2goZnVuY3Rpb24gKGlkeCkge1xyXG4gICAgICAgICQodGhpcykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoXCJhY2NvcmRpb24tYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLm5leHQoKS50b2dnbGUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYm9hcmQgaW5pdFwiLCBmdW5jdGlvbiAobG9jYXRpb25faW5mbzogQm9hcmRJbmZvKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXR1cEJvYXJkKGxvY2F0aW9uX2luZm8pXHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgZ3JpZHNpemVcIiwgZnVuY3Rpb24gKGdyaWRTaXplOiBudW1iZXIpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncmlkU2l6ZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJhZGQgc2hhcGVcIiwgZnVuY3Rpb24gKHNoYXBlOiBTZXJ2ZXJTaGFwZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuYWRkU2hhcGUoc2hhcGUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwicmVtb3ZlIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhgQXR0ZW1wdGVkIHRvIHJlbW92ZSBhbiB1bmtub3duIHNoYXBlYCk7XHJcbiAgICAgICAgcmV0dXJuIDtcclxuICAgIH1cclxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhO1xyXG4gICAgbGF5ZXIucmVtb3ZlU2hhcGUoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpISwgZmFsc2UpO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJtb3ZlU2hhcGVPcmRlclwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IGluZGV4OiBudW1iZXIgfSkge1xyXG4gICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMoZGF0YS5zaGFwZS51dWlkKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gbW92ZSB0aGUgc2hhcGUgb3JkZXIgb2YgYW4gdW5rbm93biBzaGFwZWApO1xyXG4gICAgICAgIHJldHVybiA7XHJcbiAgICB9XHJcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihkYXRhLnNoYXBlLmxheWVyKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9YCk7XHJcbiAgICAgICAgcmV0dXJuIDtcclxuICAgIH1cclxuICAgIGNvbnN0IHNoYXBlID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGRhdGEuc2hhcGUudXVpZCkhO1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpITtcclxuICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCBkYXRhLmluZGV4LCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzaGFwZU1vdmVcIiwgZnVuY3Rpb24gKHNoYXBlOiBTZXJ2ZXJTaGFwZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIubW92ZVNoYXBlKHNoYXBlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInVwZGF0ZVNoYXBlXCIsIGZ1bmN0aW9uIChkYXRhOiB7IHNoYXBlOiBTZXJ2ZXJTaGFwZTsgcmVkcmF3OiBib29sZWFuIH0pIHtcclxuICAgIGdhbWVNYW5hZ2VyLnVwZGF0ZVNoYXBlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBmdW5jdGlvbiAoZGF0YTogSW5pdGlhdGl2ZURhdGEpIHtcclxuICAgIGlmIChkYXRhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCB8fCAoIWRhdGEub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0gJiYgIWRhdGEudmlzaWJsZSkpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShkYXRhLnV1aWQsIGZhbHNlLCB0cnVlKTtcclxuICAgIGVsc2VcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5hZGRJbml0aWF0aXZlKGRhdGEsIGZhbHNlKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldEluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhW10pIHtcclxuICAgIGdhbWVNYW5hZ2VyLnNldEluaXRpYXRpdmUoZGF0YSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJjbGVhciB0ZW1wb3Jhcmllc1wiLCBmdW5jdGlvbiAoc2hhcGVzOiBTZXJ2ZXJTaGFwZVtdKSB7XHJcbiAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biB0ZW1wb3Jhcnkgc2hhcGVcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfWApO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZWFsX3NoYXBlID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpITtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpIS5yZW1vdmVTaGFwZShyZWFsX3NoYXBlLCBmYWxzZSk7XHJcbiAgICB9KVxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNvY2tldDsiLCJpbXBvcnQge2dldFVuaXREaXN0YW5jZSwgbDJ3LCBsMnd4LCBsMnd5LCB3MmwsIHcybHIsIHcybHgsIHcybHksIHcybHp9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7U2hhcGUsIExpbmUsIFJlY3QsIFRleHQsIEJhc2VSZWN0fSBmcm9tIFwiLi9zaGFwZXNcIjtcclxuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi9zb2NrZXRcIjtcclxuaW1wb3J0IHsgUG9pbnQgfSBmcm9tIFwiLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBJbml0aWF0aXZlRGF0YSB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRvb2wge1xyXG4gICAgZGV0YWlsRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGFic3RyYWN0IG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBhYnN0cmFjdCBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQ7XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHt9O1xyXG59XHJcblxyXG5lbnVtIFNlbGVjdE9wZXJhdGlvbnMge1xyXG4gICAgTm9vcCxcclxuICAgIFJlc2l6ZSxcclxuICAgIERyYWcsXHJcbiAgICBHcm91cFNlbGVjdCxcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdFRvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIG1vZGU6IFNlbGVjdE9wZXJhdGlvbnMgPSBTZWxlY3RPcGVyYXRpb25zLk5vb3A7XHJcbiAgICByZXNpemVkaXI6IHN0cmluZyA9IFwiXCI7XHJcbiAgICAvLyBCZWNhdXNlIHdlIG5ldmVyIGRyYWcgZnJvbSB0aGUgYXNzZXQncyAoMCwgMCkgY29vcmQgYW5kIHdhbnQgYSBzbW9vdGhlciBkcmFnIGV4cGVyaWVuY2VcclxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cclxuICAgIGRyYWdvZmZ4ID0gMDtcclxuICAgIGRyYWdvZmZ5ID0gMDtcclxuICAgIGRyYWdvcmlnOiBQb2ludCA9IHt4OjAsIHk6MH07XHJcbiAgICBzZWxlY3Rpb25IZWxwZXI6IFJlY3QgPSBuZXcgUmVjdCgtMTAwMCwgLTEwMDAsIDAsIDApO1xyXG4gICAgc2VsZWN0aW9uU3RhcnRQb2ludDogUG9pbnQgPSB7eDogLTEwMDAsIHk6IC0xMDAwfTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBteCA9IGUucGFnZVg7XHJcbiAgICAgICAgY29uc3QgbXkgPSBlLnBhZ2VZO1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcblxyXG4gICAgICAgIGxldCBoaXQgPSBmYWxzZTtcclxuICAgICAgICAvLyB0aGUgc2VsZWN0aW9uU3RhY2sgYWxsb3dzIGZvciBsb3dlciBwb3NpdGlvbmVkIG9iamVjdHMgdGhhdCBhcmUgc2VsZWN0ZWQgdG8gaGF2ZSBwcmVjZWRlbmNlIGR1cmluZyBvdmVybGFwLlxyXG4gICAgICAgIGxldCBzZWxlY3Rpb25TdGFjaztcclxuICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc2VsZWN0aW9uU3RhY2sgPSBsYXllci5zaGFwZXMuY29uY2F0KGxheWVyLnNlbGVjdGlvbik7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHNlbGVjdGlvblN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYXBlID0gc2VsZWN0aW9uU3RhY2tbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IGNvcm4gPSBzaGFwZS5nZXRDb3JuZXIobXgsIG15KTtcclxuICAgICAgICAgICAgaWYgKGNvcm4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3NoYXBlXTtcclxuICAgICAgICAgICAgICAgIHNoYXBlLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGUgPSBTZWxlY3RPcGVyYXRpb25zLlJlc2l6ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplZGlyID0gY29ybjtcclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUuY29udGFpbnMobXgsIG15LCB0cnVlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsID0gc2hhcGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmluZGV4T2Yoc2VsKSA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2VsXTtcclxuICAgICAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuRHJhZztcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ29mZnggPSBteCAtIHNlbC54ICogejtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ29mZnkgPSBteSAtIHNlbC55ICogejtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ29yaWcgPSB7eDogc2VsLngsIHk6IHNlbC55fTtcclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBoaXQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaGl0KSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgICAgIHNlbC5vblNlbGVjdGlvbkxvc3MoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3Q7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnggPSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIueSA9IHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC55O1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IDA7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFt0aGlzLnNlbGVjdGlvbkhlbHBlcl07XHJcbiAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gbGF5ZXIuZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuR3JvdXBTZWxlY3QpIHtcclxuICAgICAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIHRoaXNcclxuICAgICAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobW91c2UpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LnkpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci54ID0gTWF0aC5taW4odGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci55ID0gTWF0aC5taW4odGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBvZ1ggPSBsYXllci5zZWxlY3Rpb25bbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAtIDFdLnggKiB6O1xyXG4gICAgICAgICAgICBjb25zdCBvZ1kgPSBsYXllci5zZWxlY3Rpb25bbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAtIDFdLnkgKiB6O1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaCgoc2VsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZHggPSBtb3VzZS54IC0gKG9nWCArIHRoaXMuZHJhZ29mZngpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZHkgPSBtb3VzZS55IC0gKG9nWSArIHRoaXMuZHJhZ29mZnkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnggKz0gZHggLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC55ICs9IGR5IC8gejtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGF5ZXIubmFtZSAhPT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byB1c2UgdGhlIGFib3ZlIHVwZGF0ZWQgdmFsdWVzIGZvciB0aGUgYm91bmRpbmcgYm94IGNoZWNrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBib3VuZGluZyBib3hlcyBvdmVybGFwIHRvIHN0b3AgY2xvc2UgLyBwcmVjaXNlIG1vdmVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBibG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBzZWwuZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmxvY2tlcnMgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmZpbHRlcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1iID0+IG1iICE9PSBzZWwudXVpZCAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXMobWIpICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChtYikhLmdldEJvdW5kaW5nQm94KCkuaW50ZXJzZWN0c1dpdGgoYmJveCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2tlcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IGEgbGluZSBmcm9tIHN0YXJ0IHRvIGVuZCBwb3NpdGlvbiBhbmQgc2VlIGZvciBhbnkgaW50ZXJzZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIHN0b3BzIHN1ZGRlbiBsZWFwcyBvdmVyIHdhbGxzISBjaGVla3kgYnVnZ2Vyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IHtzdGFydDoge3g6IG9nWCAvIHosIHk6IG9nWSAvIHp9LCBlbmQ6IHt4OiBzZWwueCwgeTogc2VsLnl9fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhtYikpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW50ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobWIpIS5nZXRCb3VuZGluZ0JveCgpLmdldEludGVyc2VjdFdpdGhMaW5lKGxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWIgIT09IHNlbC51dWlkICYmIGludGVyLmludGVyc2VjdCAhPT0gbnVsbCAmJiBpbnRlci5kaXN0YW5jZSA+IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggLT0gZHggLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgLT0gZHkgLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWV9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNpemVkaXIgPT09ICdudycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSB3Mmx4KHNlbC54KSArIHNlbC53ICogeiAtIG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gdzJseShzZWwueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueCA9IGwyd3gobW91c2UueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gbDJ3eShtb3VzZS55KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplZGlyID09PSAnbmUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gbW91c2UueCAtIHcybHgoc2VsLngpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IHcybHkoc2VsLnkpICsgc2VsLmggKiB6IC0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBsMnd5KG1vdXNlLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5yZXNpemVkaXIgPT09ICdzZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBtb3VzZS54IC0gdzJseChzZWwueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gbW91c2UueSAtIHcybHkoc2VsLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5yZXNpemVkaXIgPT09ICdzdycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSB3Mmx4KHNlbC54KSArIHNlbC53ICogeiAtIG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gbW91c2UueSAtIHcybHkoc2VsLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueCA9IGwyd3gobW91c2UueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbC53IC89IHo7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLmggLz0gejtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLmluQ29ybmVyKG1vdXNlLngsIG1vdXNlLnksIFwibndcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm53LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKG1vdXNlLngsIG1vdXNlLnksIFwibmVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIm5lLXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKG1vdXNlLngsIG1vdXNlLnksIFwic2VcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInNlLXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKG1vdXNlLngsIG1vdXNlLnksIFwic3dcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInN3LXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgY29uc3QgbW91c2UgPSBsYXllci5nZXRNb3VzZShlKTtcclxuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0KSB7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICBsYXllci5zaGFwZXMuZm9yRWFjaCgoc2hhcGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChzaGFwZSA9PT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBzaGFwZS5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbkhlbHBlciEueCA8PSBiYm94LnggKyBiYm94LncgJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEueCArIHRoaXMuc2VsZWN0aW9uSGVscGVyIS53ID49IGJib3gueCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS55IDw9IGJib3gueSArIGJib3guaCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS55ICsgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLmggPj0gYmJveC55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5wdXNoKHNoYXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBQdXNoIHRoZSBzZWxlY3Rpb24gaGVscGVyIGFzIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIHNlbGVjdGlvblxyXG4gICAgICAgICAgICAvLyBUaGlzIG1ha2VzIHN1cmUgdGhhdCBpdCB3aWxsIGJlIHRoZSBmaXJzdCBvbmUgdG8gYmUgaGl0IGluIHRoZSBoaXQgZGV0ZWN0aW9uIG9uTW91c2VEb3duXHJcbiAgICAgICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2godGhpcy5zZWxlY3Rpb25IZWxwZXIpO1xyXG5cclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goKHNlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoc2VsIGluc3RhbmNlb2YgQmFzZVJlY3QpKSByZXR1cm47IC8vIFRPRE9cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuRHJhZykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRyYWdvcmlnLnggPT09IHNlbC54ICYmIHRoaXMuZHJhZ29yaWcueSA9PT0gc2VsLnkpIHsgcmV0dXJuIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3VzZSA9IHt4OiBzZWwueCArIHNlbC53IC8gMiwgeTogc2VsLnkgKyBzZWwuaCAvIDJ9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBteCA9IG1vdXNlLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChzZWwudyAvIGdzKSAlIDIgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gTWF0aC5yb3VuZChteCAvIGdzKSAqIGdzIC0gc2VsLncgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSAoTWF0aC5yb3VuZCgobXggKyAoZ3MgLyAyKSkgLyBncykgLSAoMSAvIDIpKSAqIGdzIC0gc2VsLncgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc2VsLmggLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IE1hdGgucm91bmQobXkgLyBncykgKiBncyAtIHNlbC5oIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gKE1hdGgucm91bmQoKG15ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHNlbC5oIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLncgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ICs9IHNlbC53O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IE1hdGguYWJzKHNlbC53KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC5oIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSArPSBzZWwuaDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLmFicyhzZWwuaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gTWF0aC5yb3VuZChzZWwueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IE1hdGgucm91bmQoc2VsLnkgLyBncykgKiBncztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vZGUgPSBTZWxlY3RPcGVyYXRpb25zLk5vb3BcclxuICAgIH07XHJcbiAgICBvbkNvbnRleHRNZW51KGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xyXG4gICAgICAgIGNvbnN0IG1vdXNlID0gbGF5ZXIuZ2V0TW91c2UoZSk7XHJcbiAgICAgICAgY29uc3QgbXggPSBtb3VzZS54O1xyXG4gICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgbGF5ZXIuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGlmICghaGl0ICYmIHNoYXBlLmNvbnRhaW5zKG14LCBteSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHNoYXBlLnNob3dDb250ZXh0TWVudShtb3VzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQYW5Ub29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICAvLyBCZWNhdXNlIHdlIG5ldmVyIGRyYWcgZnJvbSB0aGUgYXNzZXQncyAoMCwgMCkgY29vcmQgYW5kIHdhbnQgYSBzbW9vdGhlciBkcmFnIGV4cGVyaWVuY2VcclxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cclxuICAgIGRyYWdvZmZ4ID0gMDtcclxuICAgIGRyYWdvZmZ5ID0gMDtcclxuICAgIGRyYWdvcmlnOiBQb2ludCA9IHt4OjAsIHk6MH07XHJcbiAgICBhY3RpdmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmRyYWdvZmZ4ID0gZS5wYWdlWDtcclxuICAgICAgICB0aGlzLmRyYWdvZmZ5ID0gZS5wYWdlWTtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XHJcbiAgICB9O1xyXG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUpIHJldHVybjtcclxuICAgICAgICBjb25zdCBtb3VzZSA9IHt4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZfTtcclxuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblggKz0gTWF0aC5yb3VuZCgobW91c2UueCAtIHRoaXMuZHJhZ29mZngpIC8geik7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgKz0gTWF0aC5yb3VuZCgobW91c2UueSAtIHRoaXMuZHJhZ29mZnkpIC8geik7XHJcbiAgICAgICAgdGhpcy5kcmFnb2ZmeCA9IG1vdXNlLng7XHJcbiAgICAgICAgdGhpcy5kcmFnb2ZmeSA9IG1vdXNlLnk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgIH07XHJcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7XHJcbiAgICAgICAgICAgIHBhblg6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YLFxyXG4gICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIG9uQ29udGV4dE1lbnUoZTogTW91c2VFdmVudCkge307XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFRvb2xzKCk6IHZvaWQge1xyXG4gICAgY29uc3QgdG9vbHNlbGVjdERpdiA9ICQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIik7XHJcbiAgICB0b29scy5mb3JFYWNoKGZ1bmN0aW9uICh0b29sKSB7XHJcbiAgICAgICAgaWYgKCF0b29sLnBsYXllclRvb2wgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSByZXR1cm47XHJcblxyXG4gICAgICAgIGNvbnN0IHRvb2xJbnN0YW5jZSA9IG5ldyB0b29sLmNseigpO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLnRvb2xzLnNldCh0b29sLm5hbWUsIHRvb2xJbnN0YW5jZSk7XHJcbiAgICAgICAgY29uc3QgZXh0cmEgPSB0b29sLmRlZmF1bHRTZWxlY3QgPyBcIiBjbGFzcz0ndG9vbC1zZWxlY3RlZCdcIiA6IFwiXCI7XHJcbiAgICAgICAgY29uc3QgdG9vbExpID0gJChcIjxsaSBpZD0ndG9vbC1cIiArIHRvb2wubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIHRvb2wubmFtZSArIFwiPC9hPjwvbGk+XCIpO1xyXG4gICAgICAgIHRvb2xzZWxlY3REaXYuYXBwZW5kKHRvb2xMaSk7XHJcbiAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhO1xyXG4gICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICBkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29sTGkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdG9vbHMuaW5kZXhPZih0b29sKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIHtcclxuICAgICAgICAgICAgICAgICQoJy50b29sLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9ICQoJyN0b29sZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmNoaWxkcmVuKCkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERyYXdUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBzdGFydFBvaW50OiBQb2ludHxudWxsID0gbnVsbDtcclxuICAgIHJlY3Q6IFJlY3R8bnVsbCA9IG51bGw7XHJcbiAgICBmaWxsQ29sb3IgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIC8+XCIpO1xyXG4gICAgYm9yZGVyQ29sb3IgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIC8+XCIpO1xyXG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJChcIjxkaXY+RmlsbDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuZmlsbENvbG9yKVxyXG4gICAgICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PkJvcmRlcjwvZGl2PlwiKSkuYXBwZW5kKHRoaXMuYm9yZGVyQ29sb3IpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmZpbGxDb2xvci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICBjb2xvcjogXCJyZWRcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXHJcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuICAgICAgICBjb25zdCBmaWxsQ29sb3IgPSB0aGlzLmZpbGxDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcclxuICAgICAgICBjb25zdCBmaWxsID0gZmlsbENvbG9yID09PSBudWxsID8gdGlueWNvbG9yKFwidHJhbnNwYXJlbnRcIikgOiBmaWxsQ29sb3I7XHJcbiAgICAgICAgY29uc3QgYm9yZGVyQ29sb3IgPSB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKFwiZ2V0XCIpO1xyXG4gICAgICAgIGNvbnN0IGJvcmRlciA9IGJvcmRlckNvbG9yID09PSBudWxsID8gdGlueWNvbG9yKFwidHJhbnNwYXJlbnRcIikgOiBib3JkZXJDb2xvcjtcclxuICAgICAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIDAsIDAsIGZpbGwudG9SZ2JTdHJpbmcoKSwgYm9yZGVyLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgICAgIHRoaXMucmVjdC5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgaWYgKGxheWVyLm5hbWUgPT09ICdmb3cnKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVjdC52aXNpb25PYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5tb3ZlbWVudE9ic3RydWN0aW9uID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMucmVjdC51dWlkKTtcclxuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJlY3QsIHRydWUsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICBcclxuICAgICAgICB0aGlzLnJlY3QhLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdCEuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0IS54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdCEueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdCEuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VVcChlOk1vdXNlRXZlbnQpIHtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xyXG4gICAgICAgIHRoaXMucmVjdCA9IG51bGw7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUnVsZXJUb29sIGV4dGVuZHMgVG9vbCB7XHJcbiAgICBzdGFydFBvaW50OiBQb2ludHxudWxsID0gbnVsbDtcclxuICAgIHJ1bGVyOiBMaW5lfG51bGwgPSBudWxsO1xyXG4gICAgdGV4dDogVGV4dHxudWxsID0gbnVsbDtcclxuXHJcbiAgICBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5ydWxlciA9IG5ldyBMaW5lKHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSwgdGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgICAgICB0aGlzLnRleHQgPSBuZXcgVGV4dCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIFwiXCIsIFwiMjBweCBzZXJpZlwiKTtcclxuICAgICAgICB0aGlzLnJ1bGVyLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgICAgICB0aGlzLnRleHQub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICBcclxuICAgICAgICB0aGlzLnJ1bGVyIS54MiA9IGVuZFBvaW50Lng7XHJcbiAgICAgICAgdGhpcy5ydWxlciEueTIgPSBlbmRQb2ludC55O1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogdGhpcy5ydWxlciEuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZX0pO1xyXG4gICAgXHJcbiAgICAgICAgY29uc3QgZGlmZnNpZ24gPSBNYXRoLnNpZ24oZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KSAqIE1hdGguc2lnbihlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIGNvbnN0IHhkaWZmID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICBjb25zdCB5ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgY29uc3QgbGFiZWwgPSBNYXRoLnJvdW5kKE1hdGguc3FydCgoeGRpZmYpICoqIDIgKyAoeWRpZmYpICoqIDIpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVuaXRTaXplIC8gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplKSArIFwiIGZ0XCI7XHJcbiAgICAgICAgbGV0IGFuZ2xlID0gTWF0aC5hdGFuMihkaWZmc2lnbiAqIHlkaWZmLCB4ZGlmZik7XHJcbiAgICAgICAgY29uc3QgeG1pZCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KSArIHhkaWZmIC8gMjtcclxuICAgICAgICBjb25zdCB5bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpICsgeWRpZmYgLyAyO1xyXG4gICAgICAgIHRoaXMudGV4dCEueCA9IHhtaWQ7XHJcbiAgICAgICAgdGhpcy50ZXh0IS55ID0geW1pZDtcclxuICAgICAgICB0aGlzLnRleHQhLnRleHQgPSBsYWJlbDtcclxuICAgICAgICB0aGlzLnRleHQhLmFuZ2xlID0gYW5nbGU7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnRleHQhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWV9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xyXG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy5ydWxlciEsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMudGV4dCEsIHRydWUsIHRydWUpO1xyXG4gICAgICAgIHRoaXMucnVsZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMudGV4dCA9IG51bGw7XHJcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZPV1Rvb2wgZXh0ZW5kcyBUb29sIHtcclxuICAgIHN0YXJ0UG9pbnQ6IFBvaW50fG51bGwgPSBudWxsO1xyXG4gICAgcmVjdDogUmVjdHxudWxsID0gbnVsbDtcclxuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+UmV2ZWFsPC9kaXY+PGxhYmVsIGNsYXNzPSdzd2l0Y2gnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2Zvdy1yZXZlYWwnPjxzcGFuIGNsYXNzPSdzbGlkZXIgcm91bmQnPjwvc3Bhbj48L2xhYmVsPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICAgICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCAwLCAwLCBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKSk7XHJcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIGlmICgkKFwiI2Zvdy1yZXZlYWxcIikucHJvcChcImNoZWNrZWRcIikpXHJcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImRlc3RpbmF0aW9uLW91dFwiO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLW92ZXJcIjtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSE7XHJcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy5yZWN0IS53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QhLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgICAgIHRoaXMucmVjdCEueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcclxuICAgICAgICB0aGlzLnJlY3QhLnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICBcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdCEuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTsgICAgICAgIFxyXG4gICAgfVxyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJlY3QgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFwVG9vbCBleHRlbmRzIFRvb2wge1xyXG4gICAgc3RhcnRQb2ludDogUG9pbnR8bnVsbCA9IG51bGw7XHJcbiAgICByZWN0OiBSZWN0fG51bGwgPSBudWxsO1xyXG4gICAgeENvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgeUNvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWDwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueENvdW50KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1k8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnlDb3VudClcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcclxuICAgICAgICAgICAgcmV0dXJuIDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuICAgICAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIDAsIDAsIFwicmdiYSgwLDAsMCwwKVwiLCBcImJsYWNrXCIpO1xyXG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICBcclxuICAgICAgICB0aGlzLnJlY3QhLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdCEuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICAgICAgdGhpcy5yZWN0IS54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgICAgIHRoaXMucmVjdCEueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuICAgICAgICAvLyBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xyXG4gICAgfVxyXG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XHJcbiAgICAgICAgICAgIHJldHVybiA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcclxuICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QhLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgY29uc3QgdyA9IHRoaXMucmVjdCEudztcclxuICAgICAgICBjb25zdCBoID0gdGhpcy5yZWN0IS5oO1xyXG4gICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLnNlbGVjdGlvblswXTtcclxuXHJcbiAgICAgICAgaWYgKHNlbCBpbnN0YW5jZW9mIFJlY3Qpe1xyXG4gICAgICAgICAgICBzZWwudyAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueENvdW50LnZhbCgpKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIHc7XHJcbiAgICAgICAgICAgIHNlbC5oICo9IHBhcnNlSW50KDxzdHJpbmc+dGhpcy55Q291bnQudmFsKCkpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplIC8gaDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucmVjdCEsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLnJlY3QgPSBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSW5pdGlhdGl2ZVRyYWNrZXIge1xyXG4gICAgZGF0YTogSW5pdGlhdGl2ZURhdGFbXSA9IFtdO1xyXG4gICAgYWRkSW5pdGlhdGl2ZShkYXRhOiBJbml0aWF0aXZlRGF0YSwgc3luYzogYm9vbGVhbikge1xyXG4gICAgICAgIC8vIE9wZW4gdGhlIGluaXRpYXRpdmUgdHJhY2tlciBpZiBpdCBpcyBub3QgY3VycmVudGx5IG9wZW4uXHJcbiAgICAgICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgfHwgIWdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiaXNPcGVuXCIpKVxyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XHJcbiAgICAgICAgLy8gSWYgbm8gaW5pdGlhdGl2ZSBnaXZlbiwgYXNzdW1lIGl0IDBcclxuICAgICAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGRhdGEuaW5pdGlhdGl2ZSA9IDA7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHNoYXBlIGlzIGFscmVhZHkgYmVpbmcgdHJhY2tlZFxyXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09IGRhdGEudXVpZCk7XHJcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4aXN0aW5nLCBkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkYXRhKTtcclxuICAgIH07XHJcbiAgICByZW1vdmVJbml0aWF0aXZlKHV1aWQ6IHN0cmluZywgc3luYzogYm9vbGVhbiwgc2tpcEdyb3VwQ2hlY2s6IGJvb2xlYW4pIHtcclxuICAgICAgICBjb25zdCBkID0gdGhpcy5kYXRhLmZpbmRJbmRleChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgaWYgKGQgPj0gMCkge1xyXG4gICAgICAgICAgICBpZiAoIXNraXBHcm91cENoZWNrICYmIHRoaXMuZGF0YVtkXS5ncm91cCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEuc3BsaWNlKGQsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xyXG4gICAgICAgICAgICBpZiAoc3luYylcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCB7dXVpZDogdXVpZH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCAmJiBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImlzT3BlblwiKSlcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJjbG9zZVwiKTtcclxuICAgIH07XHJcbiAgICByZWRyYXcoKSB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5lbXB0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICBpZiAoYS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpIHJldHVybiAxO1xyXG4gICAgICAgICAgICBpZiAoYi5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpIHJldHVybiAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIGIuaW5pdGlhdGl2ZSAtIGEuaW5pdGlhdGl2ZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLm93bmVycyA9PT0gdW5kZWZpbmVkKSBkYXRhLm93bmVycyA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBpbWcgPSBkYXRhLnNyYyA9PT0gdW5kZWZpbmVkID8gJycgOiAkKGA8aW1nIHNyYz1cIiR7ZGF0YS5zcmN9XCIgd2lkdGg9XCIzMHB4XCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+YCk7XHJcbiAgICAgICAgICAgIC8vIGNvbnN0IG5hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3NoLnV1aWR9XCIgdmFsdWU9XCIke3NoLm5hbWV9XCIgZGlzYWJsZWQ9J2Rpc2FibGVkJyBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwidmFsdWVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIiB2YWx1ZT1cIiR7ZGF0YS5pbml0aWF0aXZlfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHZhbHVlXCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXVzZXJzXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICBjb25zdCByZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgICAgIHZpc2libGUuY3NzKFwib3BhY2l0eVwiLCBkYXRhLnZpc2libGUgPyBcIjEuMFwiIDogXCIwLjNcIik7XHJcbiAgICAgICAgICAgIGdyb3VwLmNzcyhcIm9wYWNpdHlcIiwgZGF0YS5ncm91cCA/IFwiMS4wXCIgOiBcIjAuM1wiKTtcclxuICAgICAgICAgICAgaWYgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSB7XHJcbiAgICAgICAgICAgICAgICB2YWwucHJvcChcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XHJcbiAgICAgICAgICAgICAgICByZW1vdmUuY3NzKFwib3BhY2l0eVwiLCBcIjAuM1wiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5hcHBlbmQoaW1nKS5hcHBlbmQodmFsKS5hcHBlbmQodmlzaWJsZSkuYXBwZW5kKGdyb3VwKS5hcHBlbmQocmVtb3ZlKTtcclxuXHJcbiAgICAgICAgICAgIHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBjaGFuZ2UgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBkLmluaXRpYXRpdmUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpIHx8IDA7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZEluaXRpYXRpdmUoZCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpITtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyB2aXNpYmxlIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBkLnZpc2libGUgPSAhZC52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBncm91cC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJbml0aWF0aXZlZGlhbG9nIGdyb3VwIHVua25vd24gdXVpZD9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBkLmdyb3VwID0gIWQuZ3JvdXA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGQuZ3JvdXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyByZW1vdmUgdW5rbm93biB1dWlkP1wiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZighZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUluaXRpYXRpdmUodXVpZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5cclxuY29uc3QgdG9vbHMgPSBbXHJcbiAgICB7bmFtZTogXCJzZWxlY3RcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogdHJ1ZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBTZWxlY3RUb29sfSxcclxuICAgIHtuYW1lOiBcInBhblwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBQYW5Ub29sfSxcclxuICAgIHtuYW1lOiBcImRyYXdcIiwgcGxheWVyVG9vbDogdHJ1ZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBEcmF3VG9vbH0sXHJcbiAgICB7bmFtZTogXCJydWxlclwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBSdWxlclRvb2x9LFxyXG4gICAge25hbWU6IFwiZm93XCIsIHBsYXllclRvb2w6IGZhbHNlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IEZPV1Rvb2x9LFxyXG4gICAge25hbWU6IFwibWFwXCIsIHBsYXllclRvb2w6IGZhbHNlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IE1hcFRvb2x9LFxyXG5dOyIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcbmltcG9ydCB7IFBvaW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmwob2JqOiBQb2ludCkge1xyXG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgY29uc3QgcGFuWCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YO1xyXG4gICAgY29uc3QgcGFuWSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4OiAob2JqLnggKyBwYW5YKSAqIHosXHJcbiAgICAgICAgeTogKG9iai55ICsgcGFuWSkgKiB6XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmx4KHg6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHcybCh7eDogeCwgeTogMH0pLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmx5KHk6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHcybCh7eDogMCwgeTogeX0pLnk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmx6KHo6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHogKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXREaXN0YW5jZShyOiBudW1iZXIpIHtcclxuICAgIHJldHVybiAociAvIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51bml0U2l6ZSkgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3MmxyKHI6IG51bWJlcikge1xyXG4gICAgcmV0dXJuIHcybHooZ2V0VW5pdERpc3RhbmNlKHIpKVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJ3KG9iajogUG9pbnQpIHtcclxuICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcclxuICAgIGNvbnN0IHBhblkgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogKG9iai54IC8geikgLSBwYW5YLFxyXG4gICAgICAgIHk6IChvYmoueSAvIHopIC0gcGFuWVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJ3eCh4OiBudW1iZXIpIHtcclxuICAgIHJldHVybiBsMncoe3g6IHgsIHk6IDB9KS54O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbDJ3eSh5OiBudW1iZXIpIHtcclxuICAgIHJldHVybiBsMncoe3g6IDAsIHk6IHl9KS55O1xyXG59IiwiaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZXNcIjtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xyXG4gICAgeDogbnVtYmVyO1xyXG4gICAgeTogbnVtYmVyO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFscGhTb3J0KGE6IHN0cmluZywgYjogc3RyaW5nKSB7XHJcbiAgICBpZiAoYS50b0xvd2VyQ2FzZSgpIDwgYi50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIGVsc2VcclxuICAgICAgICByZXR1cm4gMTtcclxufVxyXG5cclxuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxyXG5leHBvcnQgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE9yZGVyZWRNYXA8SywgVj4ge1xyXG4gICAga2V5czogS1tdID0gW107XHJcbiAgICB2YWx1ZXM6IFZbXSA9IFtdO1xyXG4gICAgZ2V0KGtleTogSykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1t0aGlzLmtleXMuaW5kZXhPZihrZXkpXTtcclxuICAgIH1cclxuICAgIGdldEluZGV4VmFsdWUoaWR4OiBudW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaWR4XTtcclxuICAgIH1cclxuICAgIGdldEluZGV4S2V5KGlkeDogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5c1tpZHhdO1xyXG4gICAgfVxyXG4gICAgc2V0KGtleTogSywgdmFsdWU6IFYpIHtcclxuICAgICAgICB0aGlzLmtleXMucHVzaChrZXkpO1xyXG4gICAgICAgIHRoaXMudmFsdWVzLnB1c2godmFsdWUpO1xyXG4gICAgfVxyXG4gICAgaW5kZXhPZihlbGVtZW50OiBLKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5cy5pbmRleE9mKGVsZW1lbnQpO1xyXG4gICAgfVxyXG4gICAgcmVtb3ZlKGVsZW1lbnQ6IEspIHtcclxuICAgICAgICBjb25zdCBpZHggPSB0aGlzLmluZGV4T2YoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5rZXlzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIHRoaXMudmFsdWVzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiIifQ==