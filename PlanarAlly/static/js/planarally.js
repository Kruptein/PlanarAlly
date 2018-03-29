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
        super();
        this.mode = SelectOperations.Noop;
        this.resizedir = "";
        // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
        // we keep track of the actual offset within the asset.
        this.dragoffx = 0;
        this.dragoffy = 0;
        this.dragorig = { x: 0, y: 0 };
        this.selectionHelper = new _shapes__WEBPACK_IMPORTED_MODULE_1__["Rect"](-1000, -1000, 0, 0);
        this.selectionStartPoint = { x: -1000, y: -1000 };
        this.selectionHelper.owners.push(_planarally__WEBPACK_IMPORTED_MODULE_2__["default"].username);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL2xheWVycy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvcGxhbmFyYWxseS50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvc2hhcGVzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy9zb2NrZXQudHMiLCJ3ZWJwYWNrOi8vLy4vdHNfc3JjL3Rvb2xzLnRzIiwid2VicGFjazovLy8uL3RzX3NyYy91bml0cy50cyIsIndlYnBhY2s6Ly8vLi90c19zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7OztBQ2pFQTtBQUFBLHFCQUFxQixDQUFRLEVBQUUsRUFBUyxFQUFFLEVBQVM7SUFDL0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3pDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRO1FBQ3RDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7QUFDL0MsQ0FBQztBQUVELHNCQUFzQixDQUFRLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTLEVBQUUsRUFBUztJQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBVyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVLLGdDQUFpQyxFQUFTLEVBQUUsRUFBUyxFQUFFLEVBQVMsRUFBRSxFQUFTO0lBQzdFLDRCQUE0QjtJQUM1QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNyQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckIsZ0RBQWdEO0lBQ2hELE1BQU0sS0FBSyxHQUFHLEVBQUUsR0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFDLEVBQUUsQ0FBQztJQUM1QixFQUFFLEVBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUFDLE1BQU0sQ0FBQyxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFD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LElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUgsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVHLEtBQUssSUFBSTtnQkFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDOUgsS0FBSyxJQUFJO2dCQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEo7Z0JBQ0ksTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQztJQUNELFNBQVMsQ0FBQyxDQUFTLEVBQUUsQ0FBUztRQUMxQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNwQixDQUFDO0lBR0QsTUFBTSxDQUFDLFdBQW1CO1FBQ3RCLEVBQUUsQ0FBQyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7WUFDMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUM5RCxJQUFJLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxlQUFlLENBQUMsTUFBeUI7UUFDckMsTUFBTSxDQUFDLENBQUMsQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNO1lBQ3hELG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztDQUNKO0FBRUssVUFBWSxTQUFRLFFBQVE7SUFFOUIsWUFBWSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsSUFBYSxFQUFFLE1BQWUsRUFBRSxJQUFhO1FBQ2pHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLGtCQUFrQixDQUFDO0lBQy9DLENBQUM7SUFDRCxJQUFJLENBQUMsR0FBNkI7UUFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQixHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDMUIsTUFBTSxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDO1FBQzlDLE1BQU0sR0FBRyxHQUFHLGtEQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNyQyxHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDOUIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN6RCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUssWUFBYyxTQUFRLEtBQUs7SUFLN0IsWUFBWSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxJQUFhLEVBQUUsTUFBZSxFQUFFLElBQWE7UUFDdEYsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7UUFDckIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLGtCQUFrQixDQUFDO0lBQy9DLENBQUM7SUFBQSxDQUFDO0lBQ0YsY0FBYztRQUNWLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdEYsQ0FBQztJQUNELElBQUksQ0FBQyxHQUE2QjtRQUM5QixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDMUIsTUFBTSxHQUFHLEdBQUcsa0RBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNYLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNoQixHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDOUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDakIsQ0FBQztJQUNMLENBQUM7SUFDRCxRQUFRLENBQUMsQ0FBUyxFQUFFLENBQVM7UUFDekIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFDRCxRQUFRLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxNQUFjO1FBQ3pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNO0lBQ3hCLENBQUM7SUFDRCxTQUFTLENBQUMsQ0FBUyxFQUFFLENBQVM7UUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUdELE1BQU0sQ0FBQyxXQUFtQjtRQUN0QixFQUFFLENBQUMsQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDcEMsSUFBSSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBQ0QsZUFBZSxDQUFDLE1BQXlCLElBQWEsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0NBQy9FO0FBRUssVUFBWSxTQUFRLEtBQUs7SUFLM0IsWUFBWSxFQUFVLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxFQUFVLEVBQUUsSUFBYTtRQUNyRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNuQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBQ0QsY0FBYztRQUNWLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsRUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FDOUIsQ0FBQztJQUNOLENBQUM7SUFDRCxJQUFJLENBQUMsR0FBNkI7UUFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQixHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxtREFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QyxHQUFHLENBQUMsV0FBVyxHQUFHLG9CQUFvQixDQUFDO1FBQ3ZDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBQ0QsUUFBUSxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsWUFBcUI7UUFDaEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU87SUFDekIsQ0FBQztJQUlELE1BQU0sQ0FBQyxXQUFtQixJQUFrQixDQUFDLENBQUMsT0FBTztJQUNyRCxTQUFTLENBQUMsQ0FBUyxFQUFFLENBQVEsSUFBc0IsTUFBTSxDQUFDLEVBQUUsRUFBQyxDQUFDO0lBQUEsQ0FBQyxDQUFDLE9BQU87SUFDdkUsZUFBZSxDQUFDLE1BQXlCLElBQWEsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPO0NBQy9FO0FBRUssVUFBWSxTQUFRLEtBQUs7SUFNM0IsWUFBWSxDQUFTLEVBQUUsQ0FBUyxFQUFFLElBQVksRUFBRSxJQUFZLEVBQUUsS0FBYyxFQUFFLElBQWE7UUFDdkYsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsY0FBYztRQUNWLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsOEJBQThCO0lBQ2pGLENBQUM7SUFDRCxJQUFJLENBQUMsR0FBNkI7UUFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQixHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDckIsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1gsR0FBRyxDQUFDLFNBQVMsQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUNELFFBQVEsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLFlBQXFCO1FBQ2hELE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPO0lBQ3pCLENBQUM7SUFJRCxNQUFNLENBQUMsV0FBbUIsSUFBa0IsQ0FBQyxDQUFDLE9BQU87SUFDckQsU0FBUyxDQUFDLENBQVMsRUFBRSxDQUFRLElBQXNCLE1BQU0sQ0FBQyxFQUFFLEVBQUMsQ0FBQztJQUFBLENBQUMsQ0FBQyxPQUFPO0lBQ3ZFLGVBQWUsQ0FBQyxNQUF5QixJQUFhLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTztDQUMvRTtBQUVLLFdBQWEsU0FBUSxRQUFRO0lBRy9CLFlBQVksR0FBcUIsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsSUFBYTtRQUN4RixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFGdEIsUUFBRyxHQUFXLEVBQUUsQ0FBQztRQUdiLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7WUFBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUN6QyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUNwQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBQ0QsSUFBSSxDQUFDLEdBQTZCO1FBQzlCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEIsTUFBTSxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7Q0FDSjtBQUdLLDZCQUE4QixLQUFrQixFQUFFLEtBQWU7SUFDbkUsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQztRQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0QsTUFBTSxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTVELElBQUksRUFBRSxDQUFDO0lBRVAsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUM7UUFBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1FBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQztRQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUM7UUFBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxHQUFHLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDcEIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNiLEdBQUcsQ0FBQyxNQUFNLEdBQUc7WUFDVCxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUM7SUFDTixDQUFDO0lBQ0QsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFRCwyQkFBMkIsSUFBeUIsRUFBRSxLQUFZO0lBQzlELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsTUFBTSxLQUFLLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDbEQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUNoQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ2IsS0FBSyxhQUFhO1lBQ2QsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzNELEtBQUssQ0FBQztRQUNWLEtBQUssWUFBWTtZQUNiLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyQyxLQUFLLENBQUM7UUFDVixLQUFLLFVBQVU7WUFDWCxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQixtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0UsS0FBSyxDQUFDO1FBQ1YsS0FBSyxlQUFlO1lBQ2hCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUNiLEVBQUUsQ0FBQyxDQUFDLEtBQUssWUFBWSxLQUFLLENBQUM7Z0JBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7WUFDNUMsbURBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQ3ZDO2dCQUNJLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtnQkFDaEIsT0FBTyxFQUFFLENBQUMsbURBQVcsQ0FBQyxLQUFLO2dCQUMzQixLQUFLLEVBQUUsS0FBSztnQkFDWixHQUFHLEVBQUUsR0FBRztnQkFDUixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07YUFDdkIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNiLEtBQUssQ0FBQztJQUNkLENBQUM7SUFDRCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDakIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1NUJzQztBQUNKO0FBQ0U7QUFHckMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQzFFLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLENBQUM7QUFDNUYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUU7SUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFO0lBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLFdBQW1CO0lBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsVUFBVSxRQUFnQjtJQUNoRCxtREFBVyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDaEMsbURBQVcsQ0FBQyxLQUFLLEdBQUcsUUFBUSxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7UUFDaEQseURBQVUsRUFBRSxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxVQUFVLE9BQXNCO0lBQzNELG1EQUFXLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLFVBQVUsT0FBd0I7SUFDL0QsbURBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxNQUFpQjtJQUMvQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ1YsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRVgsTUFBTSxPQUFPLEdBQUcsVUFBVSxLQUFnQixFQUFFLElBQVk7UUFDcEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN2RCxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSyxFQUFFLEdBQUc7WUFDaEMsQ0FBQyxJQUFJLDRCQUE0QixHQUFHLEdBQUcsR0FBRyx3RUFBd0UsQ0FBQztZQUNuSCxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDakMsQ0FBQyxJQUFJLGNBQWMsQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLCtDQUFRLENBQUMsQ0FBQztRQUMzQixLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUs7WUFDL0IsQ0FBQyxJQUFJLDREQUE0RCxHQUFHLElBQUksR0FBRyxLQUFLLEdBQUcsZUFBZSxHQUFHLEtBQUssR0FBRyxrQ0FBa0MsQ0FBQztRQUNwSixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQztJQUNGLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNWLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdEIsTUFBTSxFQUFFLE9BQU87UUFDZixRQUFRLEVBQUUsUUFBUTtLQUNyQixDQUFDLENBQUM7SUFDSCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRztRQUM5QixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUNoQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQVUsYUFBd0I7SUFDdEQsbURBQVcsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDO0FBQ3pDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsVUFBVSxRQUFnQjtJQUNoRCxtREFBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFVLEtBQWtCO0lBQy9DLG1EQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsVUFBVSxLQUFrQjtJQUNsRCxFQUFFLENBQUMsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7UUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBRTtJQUNaLENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsbURBQW1ELEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sQ0FBRTtJQUNaLENBQUM7SUFDRCxNQUFNLEtBQUssR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFDO0lBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxJQUEyQztJQUM3RSxFQUFFLENBQUMsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sQ0FBRTtJQUNaLENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLG1EQUFtRCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDbkYsTUFBTSxDQUFFO0lBQ1osQ0FBQztJQUNELE1BQU0sS0FBSyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBQztJQUNyRSxNQUFNLEtBQUssR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBRSxDQUFDO0lBQzlELEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFVLEtBQWtCO0lBQy9DLG1EQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsVUFBVSxJQUE2QztJQUM1RSxtREFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxJQUFvQjtJQUN4RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsbURBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLG1EQUFXLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RILG1EQUFXLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0UsSUFBSTtRQUNBLG1EQUFXLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNqRSxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLFVBQVUsSUFBc0I7SUFDdkQsbURBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLFVBQVUsTUFBcUI7SUFDMUQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUs7UUFDMUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBRTtRQUNaLENBQUM7UUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQztZQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLG1EQUFtRCxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUU7UUFDWixDQUFDO1FBQ0QsTUFBTSxVQUFVLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLENBQUM7UUFDckUsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25GLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUgsK0RBQWUsTUFBTSxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1SGdFO0FBQzNCO0FBQ3BCO0FBQ1Q7QUFJeEI7SUFLRixhQUFhLENBQUMsQ0FBYSxJQUFHLENBQUM7SUFBQSxDQUFDO0NBQ25DO0FBRUQsSUFBSyxnQkFLSjtBQUxELFdBQUssZ0JBQWdCO0lBQ2pCLHVEQUFJO0lBQ0osMkRBQU07SUFDTix1REFBSTtJQUNKLHFFQUFXO0FBQ2YsQ0FBQyxFQUxJLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFLcEI7QUFFSyxnQkFBa0IsU0FBUSxJQUFJO0lBVWhDO1FBQ0ksS0FBSyxFQUFFLENBQUM7UUFWWixTQUFJLEdBQXFCLGdCQUFnQixDQUFDLElBQUksQ0FBQztRQUMvQyxjQUFTLEdBQVcsRUFBRSxDQUFDO1FBQ3ZCLDBGQUEwRjtRQUMxRix1REFBdUQ7UUFDdkQsYUFBUSxHQUFHLENBQUMsQ0FBQztRQUNiLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFDYixhQUFRLEdBQVUsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQztRQUM3QixvQkFBZSxHQUFTLElBQUksNENBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckQsd0JBQW1CLEdBQVUsRUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFDLENBQUM7UUFHOUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1EQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUNELFdBQVcsQ0FBQyxDQUFhO1FBQ3JCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDbkIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNuQixFQUFFLENBQUMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUU7UUFDWixDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFHLENBQUM7UUFFbkQsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDO1FBQ2hCLDhHQUE4RztRQUM5RyxJQUFJLGNBQWMsQ0FBQztRQUNuQixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1lBQ3hCLGNBQWMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ2xDLElBQUk7WUFDQSxjQUFjLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNsRCxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUFDLFFBQVEsQ0FBQztnQkFDL0IsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztnQkFDdEIsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkIsR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDWCxLQUFLLENBQUM7WUFDVixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUFDLFFBQVEsQ0FBQztnQkFDL0IsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDO2dCQUNsQixNQUFNLENBQUMsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7Z0JBQzlDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN4QixHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUM7Z0JBQ3JDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZCLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQ1gsS0FBSyxDQUFDO1lBQ1YsQ0FBQztRQUNMLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDUCxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUc7Z0JBQ2pDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMxQixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrREFBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQixLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3pDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztJQUNMLENBQUM7SUFBQSxDQUFDO0lBQ0YsV0FBVyxDQUFDLENBQWE7UUFDckIsRUFBRSxDQUFDLENBQUMsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFFO1FBQ1osQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRyxDQUFDO1FBQ25ELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEMsTUFBTSxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUM3QyxnQ0FBZ0M7WUFDaEMsTUFBTSxRQUFRLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUU1QixJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0UsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFFLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5RCxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUM1QixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLGdEQUFRLENBQUMsQ0FBQztvQkFBQyxNQUFNLENBQUMsQ0FBQyxPQUFPO2dCQUMvQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDdEMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ2hCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDdkIscUVBQXFFO3dCQUNyRSw2RUFBNkU7d0JBQzdFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQzt3QkFDcEIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDO3dCQUNsQyxNQUFNLFFBQVEsR0FBRyxtREFBVyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FDaEQsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQzFKLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdEIsT0FBTyxHQUFHLElBQUksQ0FBQzt3QkFDbkIsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSixtRUFBbUU7NEJBQ25FLHFEQUFxRDs0QkFDckQsTUFBTSxJQUFJLEdBQUcsRUFBQyxLQUFLLEVBQUUsRUFBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBQyxFQUFFLEdBQUcsRUFBRSxFQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFDLEVBQUMsQ0FBQzs0QkFDMUUsT0FBTyxHQUFHLG1EQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUN2QyxFQUFFLENBQUMsRUFBRTtnQ0FDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7b0NBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQ0FDNUQsTUFBTSxLQUFLLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQ0FDcEcsTUFBTSxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssSUFBSSxJQUFJLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDOzRCQUM3RSxDQUFDLENBQ0osQ0FBQzt3QkFDTixDQUFDO3dCQUNELEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7NEJBQ1YsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDOzRCQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7NEJBQ2hCLE1BQU0sQ0FBQzt3QkFDWCxDQUFDO29CQUNMLENBQUM7b0JBQ0QsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO3dCQUMvQiwrQ0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO29CQUNyRSxDQUFDO29CQUNELEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDL0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUMxQixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQzFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDdEIsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNqQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztvQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUNqQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEMsQ0FBQztvQkFB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LENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDO3dCQUMzRCxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUNuQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3pCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNqRCxDQUFDO3dCQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNKLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzFFLENBQUM7d0JBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN6QixHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDakQsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSixHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FB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Q0FBQyxZQUFZLENBQUMsUUFBUSxFQUFHLENBQUM7UUFDbkQsTUFBTSxRQUFRLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLElBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsK0NBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7UUFDekUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsU0FBUyxDQUFDLENBQVk7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBR0ssZUFBaUIsU0FBUSxJQUFJO0lBQW5DOztRQUNJLGVBQVUsR0FBZSxJQUFJLENBQUM7UUFDOUIsVUFBSyxHQUFjLElBQUksQ0FB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QUMsR0FBTSxFQUFFLEtBQVE7UUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUNELE9BQU8sQ0FBQyxPQUFVO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxNQUFNLENBQUMsT0FBVTtRQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDO0NBQ0oiLCJmaWxlIjoicGxhbmFyYWxseS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3RzX3NyYy9wbGFuYXJhbGx5LnRzXCIpO1xuIiwiaW1wb3J0IHsgUG9pbnQgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5mdW5jdGlvbiBwb2ludEluTGluZShwOiBQb2ludCwgbDE6IFBvaW50LCBsMjogUG9pbnQpIHtcbiAgICByZXR1cm4gcC54ID49IE1hdGgubWluKGwxLngsIGwyLngpIC0gMC4wMDAwMDEgJiZcbiAgICAgICAgcC54IDw9IE1hdGgubWF4KGwxLngsIGwyLngpICsgMC4wMDAwMDEgJiZcbiAgICAgICAgcC55ID49IE1hdGgubWluKGwxLnksIGwyLnkpIC0gMC4wMDAwMDEgJiZcbiAgICAgICAgcC55IDw9IE1hdGgubWF4KGwxLnksIGwyLnkpICsgMC4wMDAwMDE7XG59XG5cbmZ1bmN0aW9uIHBvaW50SW5MaW5lcyhwOiBQb2ludCwgczE6IFBvaW50LCBlMTogUG9pbnQsIHMyOiBQb2ludCwgZTI6IFBvaW50KSB7XG4gICAgcmV0dXJuIHBvaW50SW5MaW5lKHAsIHMxLCBlMSkgJiYgcG9pbnRJbkxpbmUocCwgczIsIGUyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoczE6IFBvaW50LCBlMTogUG9pbnQsIHMyOiBQb2ludCwgZTI6IFBvaW50KSB7XG4gICAgLy8gY29uc3QgczEgPSBNYXRoLm1pbihTMSwgKVxuICAgIGNvbnN0IEExID0gZTEueS1zMS55O1xuICAgIGNvbnN0IEIxID0gczEueC1lMS54O1xuICAgIGNvbnN0IEEyID0gZTIueS1zMi55O1xuICAgIGNvbnN0IEIyID0gczIueC1lMi54O1xuXG4gICAgLy8gR2V0IGRlbHRhIGFuZCBjaGVjayBpZiB0aGUgbGluZXMgYXJlIHBhcmFsbGVsXG4gICAgY29uc3QgZGVsdGEgPSBBMSpCMiAtIEEyKkIxO1xuICAgIGlmKGRlbHRhID09PSAwKSByZXR1cm4ge2ludGVyc2VjdDogbnVsbCwgcGFyYWxsZWw6IHRydWV9O1xuXG4gICAgY29uc3QgQzIgPSBBMipzMi54K0IyKnMyLnk7XG4gICAgY29uc3QgQzEgPSBBMSpzMS54K0IxKnMxLnk7XG4gICAgLy9pbnZlcnQgZGVsdGEgdG8gbWFrZSBkaXZpc2lvbiBjaGVhcGVyXG4gICAgY29uc3QgaW52ZGVsdGEgPSAxL2RlbHRhO1xuXG4gICAgY29uc3QgaW50ZXJzZWN0OiBQb2ludCA9IHt4OiAoQjIqQzEgLSBCMSpDMikqaW52ZGVsdGEsIHk6IChBMSpDMiAtIEEyKkMxKSppbnZkZWx0YX07XG4gICAgaWYgKCFwb2ludEluTGluZXMoaW50ZXJzZWN0LCBzMSwgZTEsIHMyLCBlMikpXG4gICAgICAgIHJldHVybiB7aW50ZXJzZWN0OiBudWxsLCBwYXJhbGxlbDogZmFsc2V9O1xuICAgIHJldHVybiB7aW50ZXJzZWN0OiBpbnRlcnNlY3QsIHBhcmFsbGVsOiBmYWxzZX07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb2ludERpc3RhbmNlKHAxOiBQb2ludCwgcDI6IFBvaW50KSB7XG4gICAgY29uc3QgYSA9IHAxLnggLSBwMi54O1xuICAgIGNvbnN0IGIgPSBwMS55IC0gcDIueTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCBhKmEgKyBiKmIgKTtcbn0iLCJpbXBvcnQge2dldFVuaXREaXN0YW5jZSwgbDJ3LCBsMnd4LCBsMnd5LCB3MmwsIHcybHIsIHcybHgsIHcybHksIHcybHp9IGZyb20gXCIuL3VuaXRzXCI7XG5pbXBvcnQge1NoYXBlLCBDaXJjbGUsIGNyZWF0ZVNoYXBlRnJvbURpY3QsIFJlY3QsIEJvdW5kaW5nUmVjdCwgQmFzZVJlY3R9IGZyb20gXCIuL3NoYXBlc1wiO1xuaW1wb3J0IHtQb2ludH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XG5pbXBvcnQgc29ja2V0IGZyb20gXCIuL3NvY2tldFwiO1xuaW1wb3J0IHsgTG9jYXRpb25PcHRpb25zLCBTZXJ2ZXJTaGFwZSB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xuXG5leHBvcnQgY2xhc3MgTGF5ZXJNYW5hZ2VyIHtcbiAgICBsYXllcnM6IExheWVyW10gPSBbXTtcbiAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBzZWxlY3RlZExheWVyOiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgVVVJRE1hcDogTWFwPHN0cmluZywgU2hhcGU+ID0gbmV3IE1hcCgpO1xuXG4gICAgZ3JpZFNpemUgPSA1MDtcbiAgICB1bml0U2l6ZSA9IDU7XG4gICAgdXNlR3JpZCA9IHRydWU7XG4gICAgZnVsbEZPVyA9IGZhbHNlO1xuICAgIGZvd09wYWNpdHkgPSAwLjM7XG5cbiAgICB6b29tRmFjdG9yID0gMTtcbiAgICBwYW5YID0gMDtcbiAgICBwYW5ZID0gMDtcblxuICAgIC8vIFJlZnJlc2ggaW50ZXJ2YWwgYW5kIHJlZHJhdyBzZXR0ZXIuXG4gICAgaW50ZXJ2YWwgPSAzMDtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBjb25zdCBsbSA9IHRoaXM7XG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBsbS5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBsbS5sYXllcnNbaV0uZHJhdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzLmludGVydmFsKTtcbiAgICB9XG5cbiAgICBzZXRPcHRpb25zKG9wdGlvbnM6IExvY2F0aW9uT3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoXCJ1bml0U2l6ZVwiIGluIG9wdGlvbnMpXG4gICAgICAgICAgICB0aGlzLnNldFVuaXRTaXplKG9wdGlvbnMudW5pdFNpemUpO1xuICAgICAgICBpZiAoXCJ1c2VHcmlkXCIgaW4gb3B0aW9ucylcbiAgICAgICAgICAgIHRoaXMuc2V0VXNlR3JpZChvcHRpb25zLnVzZUdyaWQpO1xuICAgICAgICBpZiAoXCJmdWxsRk9XXCIgaW4gb3B0aW9ucylcbiAgICAgICAgICAgIHRoaXMuc2V0RnVsbEZPVyhvcHRpb25zLmZ1bGxGT1cpO1xuICAgICAgICBpZiAoJ2Zvd09wYWNpdHknIGluIG9wdGlvbnMpXG4gICAgICAgICAgICB0aGlzLnNldEZPV09wYWNpdHkob3B0aW9ucy5mb3dPcGFjaXR5KTtcbiAgICAgICAgaWYgKFwiZm93Q29sb3VyXCIgaW4gb3B0aW9ucylcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmZvd0NvbG91cik7XG4gICAgfVxuXG4gICAgc2V0V2lkdGgod2lkdGg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0ud2lkdGggPSB3aWR0aDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEhlaWdodChoZWlnaHQ6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZExheWVyKGxheWVyOiBMYXllcik6IHZvaWQge1xuICAgICAgICB0aGlzLmxheWVycy5wdXNoKGxheWVyKTtcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRMYXllciA9PT0gXCJcIiAmJiBsYXllci5zZWxlY3RhYmxlKSB0aGlzLnNlbGVjdGVkTGF5ZXIgPSBsYXllci5uYW1lO1xuICAgIH1cblxuICAgIGhhc0xheWVyKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXllcnMuc29tZShsID0+IGwubmFtZSA9PT0gbmFtZSk7XG4gICAgfVxuXG4gICAgZ2V0TGF5ZXIobmFtZT86IHN0cmluZykge1xuICAgICAgICBuYW1lID0gKG5hbWUgPT09IHVuZGVmaW5lZCkgPyB0aGlzLnNlbGVjdGVkTGF5ZXIgOiBuYW1lO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sYXllcnNbaV0ubmFtZSA9PT0gbmFtZSkgcmV0dXJuIHRoaXMubGF5ZXJzW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy90b2RvIHJlbmFtZSB0byBzZWxlY3RMYXllclxuICAgIHNldExheWVyKG5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgY29uc3QgbG0gPSB0aGlzO1xuICAgICAgICB0aGlzLmxheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChsYXllcikge1xuICAgICAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZm91bmQgJiYgbGF5ZXIubmFtZSAhPT0gJ2ZvdycpIGxheWVyLmN0eC5nbG9iYWxBbHBoYSA9IDAuMztcbiAgICAgICAgICAgIGVsc2UgbGF5ZXIuY3R4Lmdsb2JhbEFscGhhID0gMS4wO1xuXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbGF5ZXIubmFtZSkge1xuICAgICAgICAgICAgICAgIGxtLnNlbGVjdGVkTGF5ZXIgPSBuYW1lO1xuICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRHcmlkTGF5ZXIoKTogTGF5ZXJ8dW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXIoXCJncmlkXCIpO1xuICAgIH1cblxuICAgIGRyYXdHcmlkKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMuZ2V0R3JpZExheWVyKCk7XG4gICAgICAgIGlmIChsYXllciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGN0eCA9IGxheWVyLmN0eDtcbiAgICAgICAgbGF5ZXIuY2xlYXIoKTtcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGF5ZXIud2lkdGg7IGkgKz0gdGhpcy5ncmlkU2l6ZSAqIHRoaXMuem9vbUZhY3Rvcikge1xuICAgICAgICAgICAgY3R4Lm1vdmVUbyhpICsgKHRoaXMucGFuWCAlIHRoaXMuZ3JpZFNpemUpICogdGhpcy56b29tRmFjdG9yLCAwKTtcbiAgICAgICAgICAgIGN0eC5saW5lVG8oaSArICh0aGlzLnBhblggJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3RvciwgbGF5ZXIuaGVpZ2h0KTtcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oMCwgaSArICh0aGlzLnBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHRoaXMuem9vbUZhY3Rvcik7XG4gICAgICAgICAgICBjdHgubGluZVRvKGxheWVyLndpZHRoLCBpICsgKHRoaXMucGFuWSAlIHRoaXMuZ3JpZFNpemUpICogdGhpcy56b29tRmFjdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IGdhbWVNYW5hZ2VyLmdyaWRDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgbGF5ZXIudmFsaWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5oYXNMYXllcihcImZvd1wiKSlcbiAgICAgICAgICAgIHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIikhLmludmFsaWRhdGUodHJ1ZSk7XG4gICAgfVxuXG4gICAgc2V0R3JpZFNpemUoZ3JpZFNpemU6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAoZ3JpZFNpemUgIT09IHRoaXMuZ3JpZFNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZFNpemUgPSBncmlkU2l6ZTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0dyaWQoKTtcbiAgICAgICAgICAgICQoJyNncmlkU2l6ZUlucHV0JykudmFsKGdyaWRTaXplKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFVuaXRTaXplKHVuaXRTaXplOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgaWYgKHVuaXRTaXplICE9PSB0aGlzLnVuaXRTaXplKSB7XG4gICAgICAgICAgICB0aGlzLnVuaXRTaXplID0gdW5pdFNpemU7XG4gICAgICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XG4gICAgICAgICAgICAkKCcjdW5pdFNpemVJbnB1dCcpLnZhbCh1bml0U2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRVc2VHcmlkKHVzZUdyaWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKHVzZUdyaWQgIT09IHRoaXMudXNlR3JpZCkge1xuICAgICAgICAgICAgdGhpcy51c2VHcmlkID0gdXNlR3JpZDtcbiAgICAgICAgICAgIGlmICh1c2VHcmlkKVxuICAgICAgICAgICAgICAgICQoJyNncmlkLWxheWVyJykuc2hvdygpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICQoJyNncmlkLWxheWVyJykuaGlkZSgpO1xuICAgICAgICAgICAgJCgnI3VzZUdyaWRJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIHVzZUdyaWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0RnVsbEZPVyhmdWxsRk9XOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGlmIChmdWxsRk9XICE9PSB0aGlzLmZ1bGxGT1cpIHtcbiAgICAgICAgICAgIHRoaXMuZnVsbEZPVyA9IGZ1bGxGT1c7XG4gICAgICAgICAgICBjb25zdCBmb3dsID0gdGhpcy5nZXRMYXllcihcImZvd1wiKTtcbiAgICAgICAgICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgZm93bC5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICAgICAgICAgICQoJyN1c2VGT1dJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIGZ1bGxGT1cpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Rk9XT3BhY2l0eShmb3dPcGFjaXR5OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcbiAgICAgICAgY29uc3QgZm93bCA9IHRoaXMuZ2V0TGF5ZXIoXCJmb3dcIik7XG4gICAgICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoZmFsc2UpO1xuICAgICAgICAkKCcjZm93T3BhY2l0eScpLnZhbChmb3dPcGFjaXR5KTtcbiAgICB9XG5cbiAgICBpbnZhbGlkYXRlKCk6IHZvaWQge1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5sYXllcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMubGF5ZXJzW2ldLmludmFsaWRhdGUodHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMYXllciB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHdpZHRoOiBudW1iZXI7XG4gICAgaGVpZ2h0OiBudW1iZXI7XG4gICAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcblxuICAgIHNlbGVjdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwbGF5ZXJfZWRpdGFibGU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIC8vIFdoZW4gc2V0IHRvIGZhbHNlLCB0aGUgbGF5ZXIgd2lsbCBiZSByZWRyYXduIG9uIHRoZSBuZXh0IHRpY2tcbiAgICB2YWxpZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIC8vIFRoZSBjb2xsZWN0aW9uIG9mIHNoYXBlcyB0aGF0IHRoaXMgbGF5ZXIgY29udGFpbnMuXG4gICAgLy8gVGhlc2UgYXJlIG9yZGVyZWQgb24gYSBkZXB0aCBiYXNpcy5cbiAgICBzaGFwZXM6IFNoYXBlW10gPSBbXTtcblxuICAgIC8vIENvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgYXJlIGN1cnJlbnRseSBzZWxlY3RlZFxuICAgIHNlbGVjdGlvbjogU2hhcGVbXSA9IFtdO1xuXG4gICAgLy8gRXh0cmEgc2VsZWN0aW9uIGhpZ2hsaWdodGluZyBzZXR0aW5nc1xuICAgIHNlbGVjdGlvbkNvbG9yID0gJyNDQzAwMDAnO1xuICAgIHNlbGVjdGlvbldpZHRoID0gMjtcblxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgICB0aGlzLmN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcbiAgICB9XG5cbiAgICBpbnZhbGlkYXRlKHNraXBMaWdodFVwZGF0ZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLnZhbGlkID0gZmFsc2U7XG4gICAgICAgIGlmICghc2tpcExpZ2h0VXBkYXRlICYmIHRoaXMubmFtZSAhPT0gXCJmb3dcIiAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoXCJmb3dcIikpIHtcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZFNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAodGVtcG9yYXJ5ID09PSB1bmRlZmluZWQpIHRlbXBvcmFyeSA9IGZhbHNlO1xuICAgICAgICBzaGFwZS5sYXllciA9IHRoaXMubmFtZTtcbiAgICAgICAgdGhpcy5zaGFwZXMucHVzaChzaGFwZSk7XG4gICAgICAgIHNoYXBlLmNoZWNrTGlnaHRTb3VyY2VzKCk7XG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XG4gICAgICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcImFkZCBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5zZXQoc2hhcGUudXVpZCwgc2hhcGUpO1xuICAgICAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xuICAgIH1cblxuICAgIHNldFNoYXBlcyhzaGFwZXM6IFNlcnZlclNoYXBlW10pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgdDogU2hhcGVbXSA9IFtdO1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XG4gICAgICAgICAgICBjb25zdCBzaCA9IGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpO1xuICAgICAgICAgICAgc2gubGF5ZXIgPSBzZWxmLm5hbWU7XG4gICAgICAgICAgICBzaC5jaGVja0xpZ2h0U291cmNlcygpO1xuICAgICAgICAgICAgc2guc2V0TW92ZW1lbnRCbG9jayhzaGFwZS5tb3ZlbWVudE9ic3RydWN0aW9uKTtcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaCk7XG4gICAgICAgICAgICB0LnB1c2goc2gpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBbXTsgLy8gVE9ETzogRml4IGtlZXBpbmcgc2VsZWN0aW9uIG9uIHRob3NlIGl0ZW1zIHRoYXQgYXJlIG5vdCBtb3ZlZC5cbiAgICAgICAgdGhpcy5zaGFwZXMgPSB0O1xuICAgICAgICB0aGlzLmludmFsaWRhdGUoZmFsc2UpO1xuICAgIH1cblxuICAgIHJlbW92ZVNoYXBlKHNoYXBlOiBTaGFwZSwgc3luYzogYm9vbGVhbiwgdGVtcG9yYXJ5PzogYm9vbGVhbikge1xuICAgICAgICBpZiAodGVtcG9yYXJ5ID09PSB1bmRlZmluZWQpIHRlbXBvcmFyeSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UodGhpcy5zaGFwZXMuaW5kZXhPZihzaGFwZSksIDEpO1xuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJyZW1vdmUgc2hhcGVcIiwge3NoYXBlOiBzaGFwZSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcbiAgICAgICAgY29uc3QgbHNfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5maW5kSW5kZXgobHMgPT4gbHMuc2hhcGUgPT09IHNoYXBlLnV1aWQpO1xuICAgICAgICBjb25zdCBsYl9pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xuICAgICAgICBjb25zdCBtYl9pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maW5kSW5kZXgobHMgPT4gbHMgPT09IHNoYXBlLnV1aWQpO1xuICAgICAgICBpZiAobHNfaSA+PSAwKVxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShsc19pLCAxKTtcbiAgICAgICAgaWYgKGxiX2kgPj0gMClcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKGxiX2ksIDEpO1xuICAgICAgICBpZiAobWJfaSA+PSAwKVxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5zcGxpY2UobWJfaSwgMSk7XG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmRlbGV0ZShzaGFwZS51dWlkKTtcblxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuc2VsZWN0aW9uLmluZGV4T2Yoc2hhcGUpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMClcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSghc3luYyk7XG4gICAgfVxuXG4gICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfVxuXG4gICAgZHJhdyhkb0NsZWFyPzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGN0eCA9IHRoaXMuY3R4O1xuICAgICAgICAgICAgZG9DbGVhciA9IGRvQ2xlYXIgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBkb0NsZWFyO1xuXG4gICAgICAgICAgICBpZiAoZG9DbGVhcilcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmICghc2hhcGUudmlzaWJsZUluQ2FudmFzKHN0YXRlLmNhbnZhcykpIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUubmFtZSA9PT0gJ2ZvdycgJiYgc2hhcGUudmlzaW9uT2JzdHJ1Y3Rpb24gJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhLm5hbWUgIT09IHN0YXRlLm5hbWUpIHJldHVybjtcbiAgICAgICAgICAgICAgICBzaGFwZS5kcmF3KGN0eCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLnNlbGVjdGlvbldpZHRoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoc2VsIGluc3RhbmNlb2YgQmFzZVJlY3QpKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KHcybHgoc2VsLngpLCB3Mmx5KHNlbC55KSwgc2VsLncgKiB6LCBzZWwuaCAqIHopO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvcHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54ICsgc2VsLncgLSAzKSwgdzJseShzZWwueSAtIDMpLCA2ICogeiwgNiAqIHopO1xuICAgICAgICAgICAgICAgICAgICAvLyB0b3BsZWZ0XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54IC0gMyksIHcybHkoc2VsLnkgLSAzKSwgNiAqIHosIDYgKiB6KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90cmlnaHRcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggKyBzZWwudyAtIDMpLCB3Mmx5KHNlbC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gYm90bGVmdFxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodzJseChzZWwueCAtIDMpLCB3Mmx5KHNlbC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldE1vdXNlKGU6IE1vdXNlRXZlbnQpOiBQb2ludCB7XG4gICAgICAgIHJldHVybiB7eDogZS5wYWdlWCwgeTogZS5wYWdlWX07XG4gICAgfTtcblxuICAgIG1vdmVTaGFwZU9yZGVyKHNoYXBlOiBTaGFwZSwgZGVzdGluYXRpb25JbmRleDogbnVtYmVyLCBzeW5jOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IG9sZElkeCA9IHRoaXMuc2hhcGVzLmluZGV4T2Yoc2hhcGUpO1xuICAgICAgICBpZiAob2xkSWR4ID09PSBkZXN0aW5hdGlvbkluZGV4KSByZXR1cm47XG4gICAgICAgIHRoaXMuc2hhcGVzLnNwbGljZShvbGRJZHgsIDEpO1xuICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoZGVzdGluYXRpb25JbmRleCwgMCwgc2hhcGUpO1xuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJtb3ZlU2hhcGVPcmRlclwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCBpbmRleDogZGVzdGluYXRpb25JbmRleH0pO1xuICAgICAgICB0aGlzLmludmFsaWRhdGUodHJ1ZSk7XG4gICAgfTtcblxuICAgIG9uU2hhcGVNb3ZlKHNoYXBlPzogU2hhcGUpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG4gICAgaW52YWxpZGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKCk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRk9XTGF5ZXIgZXh0ZW5kcyBMYXllciB7XG5cbiAgICBhZGRTaGFwZShzaGFwZTogU2hhcGUsIHN5bmM6IGJvb2xlYW4sIHRlbXBvcmFyeT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgc2hhcGUuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xuICAgICAgICBzdXBlci5hZGRTaGFwZShzaGFwZSwgc3luYywgdGVtcG9yYXJ5KTtcbiAgICB9XG5cbiAgICBzZXRTaGFwZXMoc2hhcGVzOiBTZXJ2ZXJTaGFwZVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGMgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcbiAgICAgICAgc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XG4gICAgICAgICAgICBzaGFwZS5maWxsID0gYztcbiAgICAgICAgfSk7XG4gICAgICAgIHN1cGVyLnNldFNoYXBlcyhzaGFwZXMpO1xuICAgIH1cblxuICAgIG9uU2hhcGVNb3ZlKHNoYXBlOiBTaGFwZSk6IHZvaWQge1xuICAgICAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XG4gICAgICAgIHN1cGVyLm9uU2hhcGVNb3ZlKHNoYXBlKTtcbiAgICB9O1xuXG4gICAgZHJhdygpOiB2b2lkIHtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkICYmICF0aGlzLnZhbGlkKSB7XG4gICAgICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdfb3AgPSBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mdWxsRk9XKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2dhbHBoYSA9IHRoaXMuY3R4Lmdsb2JhbEFscGhhO1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiY29weVwiO1xuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5JU19ETSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZm93T3BhY2l0eTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IG9nYWxwaGE7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ2FtZU1hbmFnZXIuSVNfRE0pXG4gICAgICAgICAgICAgICAgc3VwZXIuZHJhdyghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnO1xuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcInRva2Vuc1wiKSkge1xuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcInRva2Vuc1wiKSEuc2hhcGVzLmZvckVhY2goZnVuY3Rpb24gKHNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2gub3duZWRCeSgpKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJiID0gc2guZ2V0Qm91bmRpbmdCb3goKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IHcybChzaC5jZW50ZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsbSA9IDAuOCAqIHcybHooYmIudyk7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsIDAsIDAsIDEpJyk7XG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCc7XG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAobHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChscy5zaGFwZSk7XG4gICAgICAgICAgICAgICAgaWYgKHNoID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XG4gICAgICAgICAgICAgICAgaWYgKGF1cmEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk9sZCBsaWdodHNvdXJjZSBzdGlsbCBsaW5nZXJpbmcgaW4gdGhlIGdhbWVNYW5hZ2VyIGxpc3RcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9sZW5ndGggPSBnZXRVbml0RGlzdGFuY2UoYXVyYS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGNlbnRlciA9IHcybChjZW50ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBuZXcgQ2lyY2xlKGNlbnRlci54LCBjZW50ZXIueSwgYXVyYV9sZW5ndGgpLmdldEJvdW5kaW5nQm94KCk7XG5cbiAgICAgICAgICAgICAgICAvLyBXZSBmaXJzdCBjb2xsZWN0IGFsbCBsaWdodGJsb2NrZXJzIHRoYXQgYXJlIGluc2lkZS9jcm9zcyBvdXIgYXVyYVxuICAgICAgICAgICAgICAgIC8vIFRoaXMgdG8gcHJldmVudCBhcyBtYW55IHJheSBjYWxjdWxhdGlvbnMgYXMgcG9zc2libGVcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NhbF9saWdodGJsb2NrZXJzOiBCb3VuZGluZ1JlY3RbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAobGIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiID09PSBzaC51dWlkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxiX3NoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxiX3NoID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGJfYmIgPSBsYl9zaC5nZXRCb3VuZGluZ0JveCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGJfYmIuaW50ZXJzZWN0c1dpdGgoYmJveCkpXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbF9saWdodGJsb2NrZXJzLnB1c2gobGJfYmIpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGFyY19zdGFydCA9IDA7XG5cbiAgICAgICAgICAgICAgICAvLyBDYXN0IHJheXMgaW4gZXZlcnkgZGVncmVlXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYW5nbGUgPSAwOyBhbmdsZSA8IDIgKiBNYXRoLlBJOyBhbmdsZSArPSAoMSAvIDE4MCkgKiBNYXRoLlBJKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGhpdCB3aXRoIG9ic3RydWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGxldCBoaXQ6IHtpbnRlcnNlY3Q6IFBvaW50fG51bGwsIGRpc3RhbmNlOm51bWJlcn0gPSB7aW50ZXJzZWN0OiBudWxsLCBkaXN0YW5jZTogSW5maW5pdHl9O1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0OiBudWxsfEJvdW5kaW5nUmVjdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxsb2NhbF9saWdodGJsb2NrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYl9iYiA9IGxvY2FsX2xpZ2h0YmxvY2tlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsYl9iYi5nZXRJbnRlcnNlY3RXaXRoTGluZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IGNlbnRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5pbnRlcnNlY3QgIT09IG51bGwgJiYgcmVzdWx0LmRpc3RhbmNlIDwgaGl0LmRpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGl0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlX2hpdCA9IGxiX2JiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGhhdmUgbm8gaGl0LCBjaGVjayBpZiB3ZSBjb21lIGZyb20gYSBwcmV2aW91cyBoaXQgc28gdGhhdCB3ZSBjYW4gZ28gYmFjayB0byB0aGUgYXJjXG4gICAgICAgICAgICAgICAgICAgIGlmIChoaXQuaW50ZXJzZWN0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IGFuZ2xlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcybHgoY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcybHkoY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgaGl0ICwgZmlyc3QgZmluaXNoIGFueSBvbmdvaW5nIGFyYywgdGhlbiBtb3ZlIHRvIHRoZSBpbnRlcnNlY3Rpb24gcG9pbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5hcmMobGNlbnRlci54LCBsY2VudGVyLnksIHcybHIoYXVyYS52YWx1ZSksIGFyY19zdGFydCwgYW5nbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJjX3N0YXJ0ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4dHJhWCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGxldCBleHRyYVkgPSAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGVfaGl0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleHRyYVggPSAoc2hhcGVfaGl0LncgLyA0KSAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhWSA9IChzaGFwZV9oaXQuaCAvIDQpICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICghc2hhcGVfaGl0LmNvbnRhaW5zKGhpdC5pbnRlcnNlY3QueCArIGV4dHJhWCwgaGl0LmludGVyc2VjdC55ICsgZXh0cmFZLCBmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBleHRyYVkgPSAwO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8odzJseChoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgpLCB3Mmx5KGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ICE9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgdzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCAyICogTWF0aC5QSSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBhbG0gPSB3MmxyKGF1cmEudmFsdWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0gLyAyLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMCwgJ3JnYmEoMCwgMCwgMCwgMSknKTtcbiAgICAgICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XG4gICAgICAgICAgICAgICAgLy8gY3R4LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxKVwiO1xuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5JU19ETSlcbiAgICAgICAgICAgICAgICBzdXBlci5kcmF3KCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZnVsbEZPVyk7XG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gb3JpZ19vcDtcbiAgICAgICAgfVxuICAgIH1cbn0iLCJpbXBvcnQgc29ja2V0IGZyb20gJy4vc29ja2V0J1xuaW1wb3J0IHsgbDJ3IH0gZnJvbSBcIi4vdW5pdHNcIjtcbmltcG9ydCB7IFNoYXBlLCBBc3NldCwgY3JlYXRlU2hhcGVGcm9tRGljdCB9IGZyb20gXCIuL3NoYXBlc1wiO1xuaW1wb3J0IHsgRHJhd1Rvb2wsIFJ1bGVyVG9vbCwgTWFwVG9vbCwgRk9XVG9vbCwgSW5pdGlhdGl2ZVRyYWNrZXIsIFRvb2wgfSBmcm9tIFwiLi90b29sc1wiO1xuaW1wb3J0IHsgTGF5ZXJNYW5hZ2VyLCBMYXllciwgR3JpZExheWVyLCBGT1dMYXllciB9IGZyb20gXCIuL2xheWVyc1wiO1xuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgQm9hcmRJbmZvLCBTZXJ2ZXJTaGFwZSwgSW5pdGlhdGl2ZURhdGEgfSBmcm9tICcuL2FwaV90eXBlcyc7XG5pbXBvcnQgeyBPcmRlcmVkTWFwIH0gZnJvbSAnLi91dGlscyc7XG5cbmNsYXNzIEdhbWVNYW5hZ2VyIHtcbiAgICBJU19ETSA9IGZhbHNlO1xuICAgIHVzZXJuYW1lOiBzdHJpbmcgPSBcIlwiO1xuICAgIGJvYXJkX2luaXRpYWxpc2VkID0gZmFsc2U7XG4gICAgbGF5ZXJNYW5hZ2VyID0gbmV3IExheWVyTWFuYWdlcigpO1xuICAgIHNlbGVjdGVkVG9vbDogbnVtYmVyID0gMDtcbiAgICB0b29sczogT3JkZXJlZE1hcDxzdHJpbmcsIFRvb2w+ID0gbmV3IE9yZGVyZWRNYXAoKTtcbiAgICBsaWdodHNvdXJjZXM6IHsgc2hhcGU6IHN0cmluZywgYXVyYTogc3RyaW5nIH1bXSA9IFtdO1xuICAgIGxpZ2h0YmxvY2tlcnM6IHN0cmluZ1tdID0gW107XG4gICAgbW92ZW1lbnRibG9ja2Vyczogc3RyaW5nW10gPSBbXTtcbiAgICBncmlkQ29sb3VyID0gJChcIiNncmlkQ29sb3VyXCIpO1xuICAgIGZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xuICAgIGluaXRpYXRpdmVUcmFja2VyID0gbmV3IEluaXRpYXRpdmVUcmFja2VyKCk7XG4gICAgc2hhcGVTZWxlY3Rpb25EaWFsb2cgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmRpYWxvZyh7XG4gICAgICAgIGF1dG9PcGVuOiBmYWxzZSxcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xuICAgIH0pO1xuICAgIGluaXRpYXRpdmVEaWFsb2cgPSAkKFwiI2luaXRpYXRpdmVkaWFsb2dcIikuZGlhbG9nKHtcbiAgICAgICAgYXV0b09wZW46IGZhbHNlLFxuICAgICAgICB3aWR0aDogJzE2MHB4J1xuICAgIH0pO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XG4gICAgICAgICAgICBzaG93SW5wdXQ6IHRydWUsXG4gICAgICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxuICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxuICAgICAgICAgICAgY29sb3I6IFwicmdiYSgyNTUsMCwwLCAwLjUpXCIsXG4gICAgICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uIChjb2xvdXIpIHtcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsgJ2dyaWRDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm93Q29sb3VyLnNwZWN0cnVtKHtcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcbiAgICAgICAgICAgIGNvbG9yOiBcInJnYig4MiwgODEsIDgxKVwiLFxuICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIik7XG4gICAgICAgICAgICAgICAgaWYgKGwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBsLnNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGUuZmlsbCA9IGNvbG91ci50b1JnYlN0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgbC5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2hhbmdlOiBmdW5jdGlvbiAoY29sb3VyKSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7ICdmb3dDb2xvdXInOiBjb2xvdXIudG9SZ2JTdHJpbmcoKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0dXBCb2FyZChyb29tOiBCb2FyZEluZm8pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5sYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XG4gICAgICAgIGNvbnN0IGxheWVyc2RpdiA9ICQoJyNsYXllcnMnKTtcbiAgICAgICAgbGF5ZXJzZGl2LmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IGxheWVyc2VsZWN0ZGl2ID0gJCgnI2xheWVyc2VsZWN0Jyk7XG4gICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoXCJ1bFwiKS5lbXB0eSgpO1xuICAgICAgICBsZXQgc2VsZWN0YWJsZV9sYXllcnMgPSAwO1xuXG4gICAgICAgIGNvbnN0IGxtID0gJChcIiNsb2NhdGlvbnMtbWVudVwiKS5maW5kKFwiZGl2XCIpO1xuICAgICAgICBsbS5jaGlsZHJlbigpLm9mZigpO1xuICAgICAgICBsbS5lbXB0eSgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb20ubG9jYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBsb2MgPSAkKFwiPGRpdj5cIiArIHJvb20ubG9jYXRpb25zW2ldICsgXCI8L2Rpdj5cIik7XG4gICAgICAgICAgICBsbS5hcHBlbmQobG9jKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsbXBsdXMgPSAkKCc8ZGl2PjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9kaXY+Jyk7XG4gICAgICAgIGxtLmFwcGVuZChsbXBsdXMpO1xuICAgICAgICBsbS5jaGlsZHJlbigpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsb2NuYW1lID0gcHJvbXB0KFwiTmV3IGxvY2F0aW9uIG5hbWVcIik7XG4gICAgICAgICAgICAgICAgaWYgKGxvY25hbWUgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwibmV3IGxvY2F0aW9uXCIsIGxvY25hbWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcImNoYW5nZSBsb2NhdGlvblwiLCBlLnRhcmdldC50ZXh0Q29udGVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5ib2FyZC5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5ld19sYXllciA9IHJvb20uYm9hcmQubGF5ZXJzW2ldO1xuICAgICAgICAgICAgLy8gVUkgY2hhbmdlc1xuICAgICAgICAgICAgbGF5ZXJzZGl2LmFwcGVuZChcIjxjYW52YXMgaWQ9J1wiICsgbmV3X2xheWVyLm5hbWUgKyBcIi1sYXllcicgc3R5bGU9J3otaW5kZXg6IFwiICsgaSArIFwiJz48L2NhbnZhcz5cIik7XG4gICAgICAgICAgICBpZiAobmV3X2xheWVyLnNlbGVjdGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgZXh0cmEgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPT09IDApIGV4dHJhID0gXCIgY2xhc3M9J2xheWVyLXNlbGVjdGVkJ1wiO1xuICAgICAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoJ3VsJykuYXBwZW5kKFwiPGxpIGlkPSdzZWxlY3QtXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIG5ld19sYXllci5uYW1lICsgXCI8L2E+PC9saT5cIik7XG4gICAgICAgICAgICAgICAgc2VsZWN0YWJsZV9sYXllcnMgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD4kKCcjJyArIG5ld19sYXllci5uYW1lICsgJy1sYXllcicpWzBdO1xuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICAgICAgLy8gU3RhdGUgY2hhbmdlc1xuICAgICAgICAgICAgbGV0IGw6IExheWVyO1xuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKVxuICAgICAgICAgICAgICAgIGwgPSBuZXcgR3JpZExheWVyKGNhbnZhcywgbmV3X2xheWVyLm5hbWUpO1xuICAgICAgICAgICAgZWxzZSBpZiAobmV3X2xheWVyLm5hbWUgPT09ICdmb3cnKVxuICAgICAgICAgICAgICAgIGwgPSBuZXcgRk9XTGF5ZXIoY2FudmFzLCBuZXdfbGF5ZXIubmFtZSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbCA9IG5ldyBMYXllcihjYW52YXMsIG5ld19sYXllci5uYW1lKTtcbiAgICAgICAgICAgIGwuc2VsZWN0YWJsZSA9IG5ld19sYXllci5zZWxlY3RhYmxlO1xuICAgICAgICAgICAgbC5wbGF5ZXJfZWRpdGFibGUgPSBuZXdfbGF5ZXIucGxheWVyX2VkaXRhYmxlO1xuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmFkZExheWVyKGwpO1xuICAgICAgICAgICAgaWYgKG5ld19sYXllci5ncmlkKSB7XG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKG5ld19sYXllci5zaXplKTtcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKTtcbiAgICAgICAgICAgICAgICAkKFwiI2dyaWQtbGF5ZXJcIikuZHJvcHBhYmxlKHtcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0OiBcIi5kcmFnZ2FibGVcIixcbiAgICAgICAgICAgICAgICAgICAgZHJvcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciB0byBkcm9wIHRoZSB0b2tlbiBvblwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgakNhbnZhcyA9ICQobC5jYW52YXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGpDYW52YXMubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNhbnZhcyBtaXNzaW5nXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGpDYW52YXMub2Zmc2V0KCkhO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsb2MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdWkub2Zmc2V0LmxlZnQgLSBvZmZzZXQubGVmdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB1aS5vZmZzZXQudG9wIC0gb2Zmc2V0LnRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNldHRpbmdzX21lbnUuaXMoXCI6dmlzaWJsZVwiKSAmJiBsb2MueCA8IHNldHRpbmdzX21lbnUud2lkdGgoKSEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnkgPCBsb2NhdGlvbnNfbWVudS53aWR0aCgpISlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWR0aCA9IHVpLmhlbHBlclswXS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlaWdodCA9IHVpLmhlbHBlclswXS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB3bG9jID0gbDJ3KGxvYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWcgPSA8SFRNTEltYWdlRWxlbWVudD51aS5kcmFnZ2FibGVbMF0uY2hpbGRyZW5bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IG5ldyBBc3NldChpbWcsIHdsb2MueCwgd2xvYy55LCBpbWcud2lkdGgsIGltZy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQuc3JjID0gaW1nLnNyYztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQueCA9IE1hdGgucm91bmQoYXNzZXQueCAvIGdzKSAqIGdzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LnkgPSBNYXRoLnJvdW5kKGFzc2V0LnkgLyBncykgKiBncztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC53ID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC53IC8gZ3MpICogZ3MsIGdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbC5hZGRTaGFwZShhc3NldCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbC5zZXRTaGFwZXMobmV3X2xheWVyLnNoYXBlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gRm9yY2UgdGhlIGNvcnJlY3Qgb3BhY2l0eSByZW5kZXIgb24gb3RoZXIgbGF5ZXJzLlxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhLm5hbWUpO1xuICAgICAgICAvLyBzb2NrZXQuZW1pdChcImNsaWVudCBpbml0aWFsaXNlZFwiKTtcbiAgICAgICAgdGhpcy5ib2FyZF9pbml0aWFsaXNlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKHNlbGVjdGFibGVfbGF5ZXJzID4gMSkge1xuICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZChcImxpXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmlkLnNwbGl0KFwiLVwiKVsxXTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGQgPSBsYXllcnNlbGVjdGRpdi5maW5kKFwiI3NlbGVjdC1cIiArIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZWxlY3RlZExheWVyKTtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSAhPT0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcImxheWVyLXNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICBvbGQucmVtb3ZlQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGF5ZXJzZWxlY3RkaXYuaGlkZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYWRkU2hhcGUoc2hhcGU6IFNlcnZlclNoYXBlKTogdm9pZCB7XG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKHNoYXBlLmxheWVyKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFNoYXBlIHdpdGggdW5rbm93biBsYXllciAke3NoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllciA9IHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XG4gICAgICAgIGxheWVyLmFkZFNoYXBlKGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUpLCBmYWxzZSk7XG4gICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xuICAgIH1cblxuICAgIG1vdmVTaGFwZShzaGFwZTogU2VydmVyU2hhcGUpOiB2b2lkIHtcbiAgICAgICAgaWYgKCFnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2hhcGUubGF5ZXIpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgU2hhcGUgd2l0aCB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9IGNvdWxkIG5vdCBiZSBhZGRlZGApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBPYmplY3QuYXNzaWduKHRoaXMubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlLCB0cnVlKSk7XG4gICAgICAgIHJlYWxfc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcbiAgICAgICAgdGhpcy5sYXllck1hbmFnZXIuZ2V0TGF5ZXIocmVhbF9zaGFwZS5sYXllcikhLm9uU2hhcGVNb3ZlKHJlYWxfc2hhcGUpO1xuICAgIH1cblxuICAgIHVwZGF0ZVNoYXBlKGRhdGE6IHtzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbjt9KTogdm9pZCB7XG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTaGFwZSB3aXRoIHVua25vd24gbGF5ZXIgJHtkYXRhLnNoYXBlLmxheWVyfSBjb3VsZCBub3QgYmUgYWRkZWRgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24odGhpcy5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoZGF0YS5zaGFwZS51dWlkKSwgY3JlYXRlU2hhcGVGcm9tRGljdChkYXRhLnNoYXBlLCB0cnVlKSk7XG4gICAgICAgIHNoYXBlLmNoZWNrTGlnaHRTb3VyY2VzKCk7XG4gICAgICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XG4gICAgICAgIGlmIChkYXRhLnJlZHJhdylcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLmdldExheWVyKGRhdGEuc2hhcGUubGF5ZXIpIS5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICB9XG5cbiAgICBzZXRJbml0aWF0aXZlKGRhdGE6IEluaXRpYXRpdmVEYXRhW10pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlci5yZWRyYXcoKTtcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xuICAgIH1cblxuICAgIHNldENsaWVudE9wdGlvbnMob3B0aW9uczogQ2xpZW50T3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoXCJncmlkQ29sb3VyXCIgaW4gb3B0aW9ucylcbiAgICAgICAgICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmdyaWRDb2xvdXIpO1xuICAgICAgICBpZiAoXCJmb3dDb2xvdXJcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmZvd0NvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmZvd0NvbG91cik7XG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwicGFuWFwiIGluIG9wdGlvbnMpXG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5wYW5YID0gb3B0aW9ucy5wYW5YO1xuICAgICAgICBpZiAoXCJwYW5ZXCIgaW4gb3B0aW9ucylcbiAgICAgICAgICAgIHRoaXMubGF5ZXJNYW5hZ2VyLnBhblkgPSBvcHRpb25zLnBhblk7XG4gICAgICAgIGlmIChcInpvb21GYWN0b3JcIiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gb3B0aW9ucy56b29tRmFjdG9yO1xuICAgICAgICAgICAgJChcIiN6b29tZXJcIikuc2xpZGVyKHsgdmFsdWU6IDEgLyBvcHRpb25zLnpvb21GYWN0b3IgfSk7XG4gICAgICAgICAgICBpZiAodGhpcy5sYXllck1hbmFnZXIuZ2V0R3JpZExheWVyKCkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICB0aGlzLmxheWVyTWFuYWdlci5nZXRHcmlkTGF5ZXIoKSEuaW52YWxpZGF0ZShmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxubGV0IGdhbWVNYW5hZ2VyID0gbmV3IEdhbWVNYW5hZ2VyKCk7XG4oPGFueT53aW5kb3cpLmdhbWVNYW5hZ2VyID0gZ2FtZU1hbmFnZXI7XG5cbi8vICoqKiogU0VUVVAgVUkgKioqKlxuXG4vLyBwcmV2ZW50IGRvdWJsZSBjbGlja2luZyB0ZXh0IHNlbGVjdGlvblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcmV0dXJuIGZhbHNlO1xufSk7XG5cbmZ1bmN0aW9uIG9uUG9pbnRlckRvd24oZTogTW91c2VFdmVudCkge1xuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcbiAgICBpZiAoKGUuYnV0dG9uICE9PSAwICYmIGUuYnV0dG9uICE9PSAxKSB8fCAoPEhUTUxFbGVtZW50PmUudGFyZ2V0KS50YWdOYW1lICE9PSAnQ0FOVkFTJykgcmV0dXJuO1xuICAgICRtZW51LmhpZGUoKTtcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VEb3duKGUpO1xufVxuXG5mdW5jdGlvbiBvblBvaW50ZXJNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uTW91c2VNb3ZlKGUpO1xufVxuXG5mdW5jdGlvbiBvblBvaW50ZXJVcChlOiBNb3VzZUV2ZW50KSB7XG4gICAgaWYgKCFnYW1lTWFuYWdlci5ib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8ICg8SFRNTEVsZW1lbnQ+ZS50YXJnZXQpLnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XG4gICAgZ2FtZU1hbmFnZXIudG9vbHMuZ2V0SW5kZXhWYWx1ZShnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIS5vbk1vdXNlVXAoZSk7XG59XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG9uUG9pbnRlckRvd24pO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Qb2ludGVyTW92ZSk7XG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgb25Qb2ludGVyVXApO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCBmdW5jdGlvbiAoZTogTW91c2VFdmVudCkge1xuICAgIGlmICghZ2FtZU1hbmFnZXIuYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcbiAgICBpZiAoZS5idXR0b24gIT09IDIgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBnYW1lTWFuYWdlci50b29scy5nZXRJbmRleFZhbHVlKGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkhLm9uQ29udGV4dE1lbnUoZSk7XG59KTtcblxuJChcIiN6b29tZXJcIikuc2xpZGVyKHtcbiAgICBvcmllbnRhdGlvbjogXCJ2ZXJ0aWNhbFwiLFxuICAgIG1pbjogMC41LFxuICAgIG1heDogNS4wLFxuICAgIHN0ZXA6IDAuMSxcbiAgICB2YWx1ZTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IsXG4gICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcbiAgICAgICAgY29uc3Qgb3JpZ1ogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcbiAgICAgICAgY29uc3QgbmV3WiA9IDEgLyB1aS52YWx1ZSE7XG4gICAgICAgIGNvbnN0IG9yaWdYID0gd2luZG93LmlubmVyV2lkdGggLyBvcmlnWjtcbiAgICAgICAgY29uc3QgbmV3WCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gbmV3WjtcbiAgICAgICAgY29uc3Qgb3JpZ1kgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyBvcmlnWjtcbiAgICAgICAgY29uc3QgbmV3WSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIG5ld1o7XG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yID0gbmV3WjtcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblggLT0gKG9yaWdYIC0gbmV3WCkgLyAyO1xuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWSAtPSAob3JpZ1kgLSBuZXdZKSAvIDI7XG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xuICAgICAgICAgICAgem9vbUZhY3RvcjogbmV3WixcbiAgICAgICAgICAgIHBhblg6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YLFxuICAgICAgICAgICAgcGFuWTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhbllcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XG4kbWVudS5oaWRlKCk7XG5cbmNvbnN0IHNldHRpbmdzX21lbnUgPSAkKFwiI21lbnVcIikhO1xuY29uc3QgbG9jYXRpb25zX21lbnUgPSAkKFwiI2xvY2F0aW9ucy1tZW51XCIpITtcbmNvbnN0IGxheWVyX21lbnUgPSAkKFwiI2xheWVyc2VsZWN0XCIpITtcbiQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xuXG4kKCcjcm0tc2V0dGluZ3MnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xuICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgbGVmdDogXCItPTIwMHB4XCIgfSk7XG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiLCB3aWR0aDogXCIrPTIwMHB4XCIgfSk7XG4gICAgICAgIGxheWVyX21lbnUuYW5pbWF0ZSh7IGxlZnQ6IFwiLT0yMDBweFwiIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7IHdpZHRoOiAndG9nZ2xlJyB9KTtcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgbGVmdDogXCIrPTIwMHB4XCIgfSk7XG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiwgd2lkdGg6IFwiLT0yMDBweFwiIH0pO1xuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoeyBsZWZ0OiBcIis9MjAwcHhcIiB9KTtcbiAgICB9XG59KTtcblxuJCgnI3JtLWxvY2F0aW9ucycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgIC8vIG9yZGVyIG9mIGFuaW1hdGlvbiBpcyBpbXBvcnRhbnQsIGl0IG90aGVyd2lzZSB3aWxsIHNvbWV0aW1lcyBzaG93IGEgc21hbGwgZ2FwIGJldHdlZW4gdGhlIHR3byBvYmplY3RzXG4gICAgaWYgKGxvY2F0aW9uc19tZW51LmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHsgdG9wOiBcIi09MTAwcHhcIiB9KTtcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGhlaWdodDogJ3RvZ2dsZScgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7IGhlaWdodDogJ3RvZ2dsZScgfSk7XG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7IHRvcDogXCIrPTEwMHB4XCIgfSk7XG4gICAgfVxufSk7XG5cbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0V2lkdGgod2luZG93LmlubmVyV2lkdGgpO1xuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRIZWlnaHQod2luZG93LmlubmVySGVpZ2h0KTtcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xufTtcblxuJCgnYm9keScpLmtleXVwKGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gNDYgJiYgZS50YXJnZXQudGFnTmFtZSAhPT0gXCJJTlBVVFwiKSB7XG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIgc2VsZWN0ZWQgZm9yIGRlbGV0ZSBvcGVyYXRpb25cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcbiAgICAgICAgbC5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XG4gICAgICAgICAgICBsLnJlbW92ZVNoYXBlKHNlbCwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShzZWwudXVpZCwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuJChcIiNncmlkU2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgY29uc3QgZ3MgPSBwYXJzZUludCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3MpO1xuICAgIHNvY2tldC5lbWl0KFwic2V0IGdyaWRzaXplXCIsIGdzKTtcbn0pO1xuXG4kKFwiI3VuaXRTaXplSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICBjb25zdCB1cyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRVbml0U2l6ZSh1cyk7XG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ3VuaXRTaXplJzogdXMgfSk7XG59KTtcbiQoXCIjdXNlR3JpZElucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgY29uc3QgdWcgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLmNoZWNrZWQ7XG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVzZUdyaWQodWcpO1xuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICd1c2VHcmlkJzogdWcgfSk7XG59KTtcbiQoXCIjdXNlRk9XSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICBjb25zdCB1ZiA9ICg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0RnVsbEZPVyh1Zik7XG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsgJ2Z1bGxGT1cnOiB1ZiB9KTtcbn0pO1xuJChcIiNmb3dPcGFjaXR5XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgbGV0IGZvID0gcGFyc2VGbG9hdCgoPEhUTUxJbnB1dEVsZW1lbnQ+ZS50YXJnZXQpLnZhbHVlKTtcbiAgICBpZiAoaXNOYU4oZm8pKSB7XG4gICAgICAgICQoXCIjZm93T3BhY2l0eVwiKS52YWwoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHkpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChmbyA8IDApIGZvID0gMDtcbiAgICBpZiAoZm8gPiAxKSBmbyA9IDE7XG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZPV09wYWNpdHkoZm8pO1xuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7ICdmb3dPcGFjaXR5JzogZm8gfSk7XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZ2FtZU1hbmFnZXI7IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XG5pbXBvcnQgeyB1dWlkdjQsIFBvaW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7IGdldExpbmVzSW50ZXJzZWN0UG9pbnQsIGdldFBvaW50RGlzdGFuY2UgfSBmcm9tIFwiLi9nZW9tXCI7XG5pbXBvcnQgeyBsMnd4LCBsMnd5LCB3MmwsIHcybHIsIHcybHgsIHcybHkgfSBmcm9tIFwiLi91bml0c1wiO1xuaW1wb3J0IHsgTGF5ZXIgfSBmcm9tIFwiLi9sYXllcnNcIjtcbmltcG9ydCB7IFNlcnZlclNoYXBlIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XG5cbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XG5cbmludGVyZmFjZSBUcmFja2VyIHtcbiAgICB1dWlkOiBzdHJpbmc7XG4gICAgdmlzaWJsZTogYm9vbGVhbjtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdmFsdWU6IG51bWJlcjtcbiAgICBtYXh2YWx1ZTogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgQXVyYSB7XG4gICAgdXVpZDogc3RyaW5nO1xuICAgIGxpZ2h0U291cmNlOiBib29sZWFuO1xuICAgIHZpc2libGU6IGJvb2xlYW47XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHZhbHVlOiBudW1iZXI7XG4gICAgZGltOiBudW1iZXI7XG4gICAgY29sb3VyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaGFwZSB7XG4gICAgdHlwZTogc3RyaW5nID0gXCJzaGFwZVwiO1xuICAgIHV1aWQ6IHN0cmluZztcbiAgICBnbG9iYWxDb21wb3NpdGVPcGVyYXRpb246IHN0cmluZyA9IFwic291cmNlLW92ZXJcIjtcbiAgICBmaWxsOiBzdHJpbmcgPSAnIzAwMCc7XG4gICAgbGF5ZXI6IHN0cmluZyA9IFwiXCI7XG4gICAgbmFtZSA9ICdVbmtub3duIHNoYXBlJztcbiAgICB0cmFja2VyczogVHJhY2tlcltdID0gW107XG4gICAgYXVyYXM6IEF1cmFbXSA9IFtdO1xuICAgIG93bmVyczogc3RyaW5nW10gPSBbXTtcbiAgICB2aXNpb25PYnN0cnVjdGlvbiA9IGZhbHNlO1xuICAgIG1vdmVtZW50T2JzdHJ1Y3Rpb24gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy51dWlkID0gdXVpZCB8fCB1dWlkdjQoKTtcbiAgICB9XG5cbiAgICBhYnN0cmFjdCBnZXRCb3VuZGluZ0JveCgpOiBCb3VuZGluZ1JlY3Q7XG5cbiAgICBhYnN0cmFjdCBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbjtcblxuICAgIGFic3RyYWN0IGNlbnRlcigpOiBQb2ludDtcbiAgICBhYnN0cmFjdCBjZW50ZXIoY2VudGVyUG9pbnQ6IFBvaW50KTogdm9pZDtcbiAgICBhYnN0cmFjdCBnZXRDb3JuZXIoeDogbnVtYmVyLCB5Om51bWJlcik6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgYWJzdHJhY3QgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuO1xuXG4gICAgY2hlY2tMaWdodFNvdXJjZXMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XG4gICAgICAgIGlmICh0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPT09IC0xKVxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMudXVpZCk7XG4gICAgICAgIGVsc2UgaWYgKCF0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBsaWdodHNvdXJjZSBhdXJhcyBhcmUgaW4gdGhlIGdhbWVNYW5hZ2VyXG4gICAgICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xuICAgICAgICAgICAgY29uc3QgaSA9IGxzLmZpbmRJbmRleChvID0+IG8uYXVyYSA9PT0gYXUudXVpZCk7XG4gICAgICAgICAgICBpZiAoYXUubGlnaHRTb3VyY2UgJiYgaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBscy5wdXNoKHsgc2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZCB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWF1LmxpZ2h0U291cmNlICYmIGkgPj0gMCkge1xuICAgICAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIENoZWNrIGlmIGFueXRoaW5nIGluIHRoZSBnYW1lTWFuYWdlciByZWZlcmVuY2luZyB0aGlzIHNoYXBlIGlzIGluIGZhY3Qgc3RpbGwgYSBsaWdodHNvdXJjZVxuICAgICAgICBmb3IgKGxldCBpID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBscyA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlc1tpXTtcbiAgICAgICAgICAgIGlmIChscy5zaGFwZSA9PT0gc2VsZi51dWlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLmF1cmFzLnNvbWUoYSA9PiBhLnV1aWQgPT09IGxzLmF1cmEgJiYgYS5saWdodFNvdXJjZSkpXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRNb3ZlbWVudEJsb2NrKGJsb2Nrc01vdmVtZW50OiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGJsb2Nrc01vdmVtZW50IHx8IGZhbHNlO1xuICAgICAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XG4gICAgICAgIGlmICh0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gJiYgdm9faSA9PT0gLTEpXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcbiAgICAgICAgZWxzZSBpZiAoIXRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID49IDApXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcbiAgICB9XG5cbiAgICBvd25lZEJ5KHVzZXJuYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIGlmICh1c2VybmFtZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgdXNlcm5hbWUgPSBnYW1lTWFuYWdlci51c2VybmFtZTtcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLklTX0RNIHx8IHRoaXMub3duZXJzLmluY2x1ZGVzKHVzZXJuYW1lKTtcbiAgICB9XG5cbiAgICBvblNlbGVjdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRyYWNrZXJzLmxlbmd0aCB8fCB0aGlzLnRyYWNrZXJzW3RoaXMudHJhY2tlcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAwKVxuICAgICAgICAgICAgdGhpcy50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xuICAgICAgICBpZiAoIXRoaXMuYXVyYXMubGVuZ3RoIHx8IHRoaXMuYXVyYXNbdGhpcy5hdXJhcy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0udmFsdWUgIT09IDApXG4gICAgICAgICAgICB0aGlzLmF1cmFzLnB1c2goe1xuICAgICAgICAgICAgICAgIHV1aWQ6IHV1aWR2NCgpLFxuICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxuICAgICAgICAgICAgICAgIGRpbTogMCxcbiAgICAgICAgICAgICAgICBsaWdodFNvdXJjZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29sb3VyOiAncmdiYSgwLDAsMCwwKScsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAkKFwiI3NlbGVjdGlvbi1uYW1lXCIpLnRleHQodGhpcy5uYW1lKTtcbiAgICAgICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NlbGVjdGlvbi10cmFja2Vyc1wiKTtcbiAgICAgICAgdHJhY2tlcnMuZW1wdHkoKTtcbiAgICAgICAgdGhpcy50cmFja2Vycy5mb3JFYWNoKGZ1bmN0aW9uICh0cmFja2VyKSB7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmFja2VyLm1heHZhbHVlID8gYCR7dHJhY2tlci52YWx1ZX0vJHt0cmFja2VyLm1heHZhbHVlfWAgOiB0cmFja2VyLnZhbHVlO1xuICAgICAgICAgICAgdHJhY2tlcnMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPiR7dHJhY2tlci5uYW1lfTwvZGl2PmApKTtcbiAgICAgICAgICAgIHRyYWNrZXJzLmFwcGVuZChcbiAgICAgICAgICAgICAgICAkKGA8ZGl2IGlkPVwic2VsZWN0aW9uLXRyYWNrZXItJHt0cmFja2VyLnV1aWR9LXZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgY2xhc3M9XCJzZWxlY3Rpb24tdHJhY2tlci12YWx1ZVwiPiR7dmFsfTwvZGl2PmApXG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgYXVyYXMgPSAkKFwiI3NlbGVjdGlvbi1hdXJhc1wiKTtcbiAgICAgICAgYXVyYXMuZW1wdHkoKTtcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XG4gICAgICAgICAgICBhdXJhcy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+JHthdXJhLm5hbWV9PC9kaXY+YCkpO1xuICAgICAgICAgICAgYXVyYXMuYXBwZW5kKFxuICAgICAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tYXVyYS0ke2F1cmEudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi1hdXJhLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKFwiI3NlbGVjdGlvbi1tZW51XCIpLnNob3coKTtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGVkaXRidXR0b24gPSAkKFwiI3NlbGVjdGlvbi1lZGl0LWJ1dHRvblwiKTtcbiAgICAgICAgaWYgKCF0aGlzLm93bmVkQnkoKSlcbiAgICAgICAgICAgIGVkaXRidXR0b24uaGlkZSgpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlZGl0YnV0dG9uLnNob3coKTtcbiAgICAgICAgZWRpdGJ1dHRvbi5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoc2VsZi51dWlkKTtcbiAgICAgICAgICAgIGNvbnN0IGRpYWxvZ19uYW1lID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1uYW1lXCIpO1xuICAgICAgICAgICAgZGlhbG9nX25hbWUudmFsKHNlbGYubmFtZSk7XG4gICAgICAgICAgICBkaWFsb2dfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XG4gICAgICAgICAgICAgICAgICAgIHMubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZGlhbG9nX2xpZ2h0YmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWxpZ2h0YmxvY2tlclwiKTtcbiAgICAgICAgICAgIGRpYWxvZ19saWdodGJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYudmlzaW9uT2JzdHJ1Y3Rpb24pO1xuICAgICAgICAgICAgZGlhbG9nX2xpZ2h0YmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9IDxzdHJpbmc+JChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy11dWlkXCIpLnZhbCgpO1xuICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5oYXModXVpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCh1dWlkKSE7XG4gICAgICAgICAgICAgICAgICAgIHMudmlzaW9uT2JzdHJ1Y3Rpb24gPSBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgcy5jaGVja0xpZ2h0U291cmNlcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3QgZGlhbG9nX21vdmVibG9jayA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctbW92ZWJsb2NrZXJcIik7XG4gICAgICAgICAgICBkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYubW92ZW1lbnRPYnN0cnVjdGlvbik7XG4gICAgICAgICAgICBkaWFsb2dfbW92ZWJsb2NrLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSA8c3RyaW5nPiQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKTtcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHV1aWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQodXVpZCkhO1xuICAgICAgICAgICAgICAgICAgICBzLnNldE1vdmVtZW50QmxvY2soZGlhbG9nX21vdmVibG9jay5wcm9wKFwiY2hlY2tlZFwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG93bmVycyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctb3duZXJzXCIpO1xuICAgICAgICAgICAgY29uc3QgdHJhY2tlcnMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXRyYWNrZXJzXCIpO1xuICAgICAgICAgICAgY29uc3QgYXVyYXMgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWF1cmFzXCIpO1xuICAgICAgICAgICAgb3duZXJzLm5leHRVbnRpbCh0cmFja2VycykucmVtb3ZlKCk7XG4gICAgICAgICAgICB0cmFja2Vycy5uZXh0VW50aWwoYXVyYXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgYXVyYXMubmV4dFVudGlsKCQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuZmluZChcImZvcm1cIikpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRPd25lcihvd25lcjogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3dfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtbmFtZT1cIiR7b3duZXJ9XCIgdmFsdWU9XCIke293bmVyfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvd19yZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcblxuICAgICAgICAgICAgICAgIHRyYWNrZXJzLmJlZm9yZShvd19uYW1lLmFkZChvd19yZW1vdmUpKTtcblxuICAgICAgICAgICAgICAgIG93X25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAob3dfaSA+PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vd25lcnMuc3BsaWNlKG93X2ksIDEsIDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3duZXJzLnB1c2goPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZE93bmVyKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgb3dfcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnByZXYoKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vd25lcnMuc3BsaWNlKG93X2ksIDEpO1xuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYub3duZXJzLmZvckVhY2goYWRkT3duZXIpO1xuICAgICAgICAgICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0gIT09ICcnKVxuICAgICAgICAgICAgICAgIGFkZE93bmVyKFwiXCIpO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBhZGRUcmFja2VyKHRyYWNrZXI6IFRyYWNrZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0cl9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJfdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJDdXJyZW50IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIudmFsdWV9XCI+YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJfbWF4dmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJNYXggdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci5tYXh2YWx1ZSB8fCBcIlwifVwiPmApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cl9yZW1vdmUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcblxuICAgICAgICAgICAgICAgIGF1cmFzLmJlZm9yZShcbiAgICAgICAgICAgICAgICAgICAgdHJfbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl92YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4vPC9zcGFuPmApXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKHRyX21heHZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjwvc3Bhbj5gKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl92aXNpYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PC9zcGFuPmApXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKHRyX3JlbW92ZSlcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0cmFja2VyLnZpc2libGUpXG4gICAgICAgICAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xuXG4gICAgICAgICAgICAgICAgdHJfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5hbWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0ci5uYW1lID0gPHN0cmluZz4kKHRoaXMpLnZhbCgpO1xuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi50cmFja2Vycy5sZW5ndGggfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5wdXNoKHsgdXVpZDogdXVpZHY0KCksIG5hbWU6ICcnLCB2YWx1ZTogMCwgbWF4dmFsdWU6IDAsIHZpc2libGU6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkVHJhY2tlcihzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdHJfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmFsdWUgY2hhbmdlIG9uIHVua25vd24gdHJhY2tlclwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0ci52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyLm1heHZhbHVlID8gYCR7dHIudmFsdWV9LyR7dHIubWF4dmFsdWV9YCA6IHRyLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRyX21heHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1henZhbHVlIGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdHIubWF4dmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSB0ci5tYXh2YWx1ZSA/IGAke3RyLnZhbHVlfS8ke3RyLm1heHZhbHVlfWAgOiB0ci52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi10cmFja2VyLSR7dHIudXVpZH0tdmFsdWVgKS50ZXh0KHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0cl9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlbW92ZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyLm5hbWUgPT09ICcnIHx8IHRyLnZhbHVlID09PSAwKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHt0ci51dWlkfV1gKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5zcGxpY2Uoc2VsZi50cmFja2Vycy5pbmRleE9mKHRyKSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZSB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0cl92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWaXNpYmlsaXR5IGNoYW5nZSBvbiB1bmtub3duIHRyYWNrZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyLnZpc2libGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XG4gICAgICAgICAgICAgICAgICAgIHRyLnZpc2libGUgPSAhdHIudmlzaWJsZTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYudHJhY2tlcnMuZm9yRWFjaChhZGRUcmFja2VyKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gYWRkQXVyYShhdXJhOiBBdXJhKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9uYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEubmFtZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV92YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkN1cnJlbnQgdmFsdWVcIiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIiB2YWx1ZT1cIiR7YXVyYS52YWx1ZX1cIj5gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhdXJhX2RpbXZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiRGltIHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEuZGltIHx8IFwiXCJ9XCI+YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9jb2xvdXIgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiB0aXRsZT1cIkF1cmEgY29sb3VyXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV92aXNpYmxlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS1leWVcIj48L2k+PC9kaXY+YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYXVyYV9saWdodCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtbGlnaHRidWxiXCI+PC9pPjwvZGl2PmApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGF1cmFfcmVtb3ZlID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XG5cbiAgICAgICAgICAgICAgICAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nXCIpLmNoaWxkcmVuKCkubGFzdCgpLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgYXVyYV9uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+Lzwvc3Bhbj5gKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX2RpbXZhbClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj5gKS5hcHBlbmQoYXVyYV9jb2xvdXIpLmFwcGVuZCgkKFwiPC9kaXY+XCIpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hZGQoYXVyYV92aXNpYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX2xpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX3JlbW92ZSlcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFhdXJhLnZpc2libGUpXG4gICAgICAgICAgICAgICAgICAgIGF1cmFfdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XG4gICAgICAgICAgICAgICAgaWYgKCFhdXJhLmxpZ2h0U291cmNlKVxuICAgICAgICAgICAgICAgICAgICBhdXJhX2xpZ2h0LmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcblxuICAgICAgICAgICAgICAgIGF1cmFfY29sb3VyLnNwZWN0cnVtKHtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzaG93QWxwaGE6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBhdXJhLmNvbG91cixcbiAgICAgICAgICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gbW92ZSB1bmtub3duIGF1cmEgY29sb3VyXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvIG5vdCB1c2UgYXVyYSBkaXJlY3RseSBhcyBpdCBkb2VzIG5vdCB3b3JrIHByb3Blcmx5IGZvciBuZXcgYXVyYXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGF1cmFfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byBjaGFuZ2UgbmFtZSBvZiB1bmtub3duIGF1cmFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXUubmFtZSA9IDxzdHJpbmc+JCh0aGlzKS52YWwoKTtcbiAgICAgICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5sZW5ndGggfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hdXJhcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkdjQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaW06IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZEF1cmEoc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGF1cmFfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIGNoYW5nZSB2YWx1ZSBvZiB1bmtub3duIGF1cmFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXUudmFsdWUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBhdS5kaW0gPyBgJHthdS52YWx1ZX0vJHthdS5kaW19YCA6IGF1LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYXVyYV9kaW12YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gY2hhbmdlIGRpbXZhbHVlIG9mIHVua25vd24gYXVyYVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhdS52YWx1ZSA9IHBhcnNlSW50KDxzdHJpbmc+JCh0aGlzKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNlbGYubGF5ZXIpIS5pbnZhbGlkYXRlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdXJhIGNvbG91ciB0YXJnZXQgaGFzIG5vIGFzc29jaWF0ZWQgbGF5ZXJcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBhdXJhX3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHJlbW92ZSB1bmtub3duIGF1cmFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1Lm5hbWUgPT09ICcnICYmIGF1LnZhbHVlID09PSAwKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICQoYFtkYXRhLXV1aWQ9JHthdS51dWlkfV1gKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hdXJhcy5zcGxpY2Uoc2VsZi5hdXJhcy5pbmRleE9mKGF1KSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2hlY2tMaWdodFNvdXJjZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7IHNoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaGFzTGF5ZXIoc2VsZi5sYXllcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKSEuaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXVyYSBjb2xvdXIgdGFyZ2V0IGhhcyBubyBhc3NvY2lhdGVkIGxheWVyXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYXVyYV92aXNpYmxlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gdG9nZ2xlIHZpc2liaWxpdHkgb2YgdW5rbm93biBhdXJhXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGF1LnZpc2libGUgPSAhYXUudmlzaWJsZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1LnZpc2libGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDAuMyk7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGF1cmFfbGlnaHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhdSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRlZCB0byB0b2dnbGUgbGlnaHQgY2FwYWJpbGl0eSBvZiB1bmtub3duIGF1cmFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXUubGlnaHRTb3VyY2UgPSAhYXUubGlnaHRTb3VyY2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpID0gbHMuZmluZEluZGV4KG8gPT4gby5hdXJhID09PSBhdS51dWlkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF1LmxpZ2h0U291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBscy5wdXNoKHsgc2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPj0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBscy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSEuaW52YWxpZGF0ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYuYXVyYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhZGRBdXJhKHNlbGYuYXVyYXNbaV0pO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLnNoYXBlU2VsZWN0aW9uRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuc2VsZWN0aW9uLXRyYWNrZXItdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrZXIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xuICAgICAgICAgICAgaWYgKHRyYWNrZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIHRyYWNrZXJcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3X3RyYWNrZXIgPSBwcm9tcHQoYE5ldyAgJHt0cmFja2VyLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XG4gICAgICAgICAgICBpZiAobmV3X3RyYWNrZXIgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRyYWNrZXIudmFsdWUgPT09IDApXG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSA9IDA7XG4gICAgICAgICAgICBpZiAobmV3X3RyYWNrZXJbMF0gPT09ICcrJykge1xuICAgICAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgKz0gcGFyc2VJbnQobmV3X3RyYWNrZXIuc2xpY2UoMSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdfdHJhY2tlclswXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgdHJhY2tlci52YWx1ZSAtPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgPSBwYXJzZUludChuZXdfdHJhY2tlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmFja2VyLm1heHZhbHVlID8gYCR7dHJhY2tlci52YWx1ZX0vJHt0cmFja2VyLm1heHZhbHVlfWAgOiB0cmFja2VyLnZhbHVlO1xuICAgICAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHsgc2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2UgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuc2VsZWN0aW9uLWF1cmEtdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkKHRoaXMpLmRhdGEoJ3V1aWQnKTtcbiAgICAgICAgICAgIGNvbnN0IGF1cmEgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xuICAgICAgICAgICAgaWYgKGF1cmEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQXR0ZW1wdGVkIHRvIHVwZGF0ZSB1bmtub3duIGF1cmFcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbmV3X2F1cmEgPSBwcm9tcHQoYE5ldyAgJHthdXJhLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XG4gICAgICAgICAgICBpZiAobmV3X2F1cmEgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGF1cmEudmFsdWUgPT09IDApXG4gICAgICAgICAgICAgICAgYXVyYS52YWx1ZSA9IDA7XG4gICAgICAgICAgICBpZiAobmV3X2F1cmFbMF0gPT09ICcrJykge1xuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdfYXVyYVswXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgYXVyYS52YWx1ZSAtPSBwYXJzZUludChuZXdfYXVyYS5zbGljZSgxKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF1cmEudmFsdWUgPSBwYXJzZUludChuZXdfYXVyYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XG4gICAgICAgICAgICAkKHRoaXMpLnRleHQodmFsKTtcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwgeyBzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlIH0pO1xuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzZWxmLmxheWVyKSlcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2VsZi5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvblNlbGVjdGlvbkxvc3MoKSB7XG4gICAgICAgIC8vICQoYCNzaGFwZXNlbGVjdGlvbmNvZy0ke3RoaXMudXVpZH1gKS5yZW1vdmUoKTtcbiAgICAgICAgJChcIiNzZWxlY3Rpb24tbWVudVwiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgYXNEaWN0KCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XG4gICAgfVxuXG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xuICAgICAgICBpZiAodGhpcy5sYXllciA9PT0gJ2ZvdycpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsbCA9IGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IHRoaXMuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gXCJzb3VyY2Utb3ZlclwiO1xuICAgICAgICB0aGlzLmRyYXdBdXJhcyhjdHgpO1xuICAgIH1cblxuICAgIGRyYXdBdXJhcyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdXJhKSB7XG4gICAgICAgICAgICBpZiAoYXVyYS52YWx1ZSA9PT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGF1cmEuY29sb3VyO1xuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihcImZvd1wiKSAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhLmN0eCA9PT0gY3R4KVxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgICAgICAgICBjb25zdCBsb2MgPSB3Mmwoc2VsZi5jZW50ZXIoKSk7XG4gICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdzJscihhdXJhLnZhbHVlKSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgICAgIGlmIChhdXJhLmRpbSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRjID0gdGlueWNvbG9yKGF1cmEuY29sb3VyKTtcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRjLnNldEFscGhhKHRjLmdldEFscGhhKCkgLyAyKS50b1JnYlN0cmluZygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvYyA9IHcybChzZWxmLmNlbnRlcigpKTtcbiAgICAgICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdzJscihhdXJhLmRpbSksIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzaG93Q29udGV4dE1lbnUobW91c2U6IFBvaW50KSB7XG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XG4gICAgICAgIGwuc2VsZWN0aW9uID0gW3RoaXNdO1xuICAgICAgICB0aGlzLm9uU2VsZWN0aW9uKCk7XG4gICAgICAgIGwuaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzO1xuICAgICAgICAkbWVudS5zaG93KCk7XG4gICAgICAgICRtZW51LmVtcHR5KCk7XG4gICAgICAgICRtZW51LmNzcyh7IGxlZnQ6IG1vdXNlLngsIHRvcDogbW91c2UueSB9KTtcbiAgICAgICAgbGV0IGRhdGEgPSBcIlwiICtcbiAgICAgICAgICAgIFwiPHVsPlwiICtcbiAgICAgICAgICAgIFwiPGxpPkxheWVyPHVsPlwiO1xuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XG4gICAgICAgICAgICBpZiAoIWxheWVyLnNlbGVjdGFibGUpIHJldHVybjtcbiAgICAgICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLm5hbWUgPT09IGwubmFtZSA/IFwiIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOmFxdWEnIFwiIDogXCIgXCI7XG4gICAgICAgICAgICBkYXRhICs9IGA8bGkgZGF0YS1hY3Rpb249J3NldExheWVyJyBkYXRhLWxheWVyPScke2xheWVyLm5hbWV9JyAke3NlbH0gY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz4ke2xheWVyLm5hbWV9PC9saT5gO1xuICAgICAgICB9KTtcbiAgICAgICAgZGF0YSArPSBcIjwvdWw+PC9saT5cIiArXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvQmFjaycgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGJhY2s8L2xpPlwiICtcbiAgICAgICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdtb3ZlVG9Gcm9udCcgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGZyb250PC9saT5cIiArXG4gICAgICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nYWRkSW5pdGlhdGl2ZScgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5BZGQgaW5pdGlhdGl2ZTwvbGk+XCIgK1xuICAgICAgICAgICAgXCI8L3VsPlwiO1xuICAgICAgICAkbWVudS5odG1sKGRhdGEpO1xuICAgICAgICAkKFwiLmNvbnRleHQtY2xpY2thYmxlXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGhhbmRsZUNvbnRleHRNZW51KCQodGhpcyksIGFzc2V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQm91bmRpbmdSZWN0IHtcbiAgICB0eXBlID0gXCJib3VuZHJlY3RcIjtcbiAgICB4OiBudW1iZXI7XG4gICAgeTogbnVtYmVyO1xuICAgIHc6IG51bWJlcjtcbiAgICBoOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy53ID0gdztcbiAgICAgICAgdGhpcy5oID0gaDtcbiAgICB9XG5cbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChpbldvcmxkQ29vcmQpIHtcbiAgICAgICAgICAgIHggPSBsMnd4KHgpO1xuICAgICAgICAgICAgeSA9IGwyd3koeSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMueCA8PSB4ICYmICh0aGlzLnggKyB0aGlzLncpID49IHggJiZcbiAgICAgICAgICAgIHRoaXMueSA8PSB5ICYmICh0aGlzLnkgKyB0aGlzLmgpID49IHk7XG4gICAgfVxuXG4gICAgaW50ZXJzZWN0c1dpdGgob3RoZXI6IEJvdW5kaW5nUmVjdCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gIShvdGhlci54ID49IHRoaXMueCArIHRoaXMudyB8fFxuICAgICAgICAgICAgb3RoZXIueCArIG90aGVyLncgPD0gdGhpcy54IHx8XG4gICAgICAgICAgICBvdGhlci55ID49IHRoaXMueSArIHRoaXMuaCB8fFxuICAgICAgICAgICAgb3RoZXIueSArIG90aGVyLmggPD0gdGhpcy55KTtcbiAgICB9XG4gICAgZ2V0SW50ZXJzZWN0V2l0aExpbmUobGluZTogeyBzdGFydDogUG9pbnQ7IGVuZDogUG9pbnQgfSkge1xuICAgICAgICBjb25zdCBsaW5lcyA9IFtcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9LCB7IHg6IHRoaXMueCArIHRoaXMudywgeTogdGhpcy55IH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcbiAgICAgICAgICAgIGdldExpbmVzSW50ZXJzZWN0UG9pbnQoeyB4OiB0aGlzLnggKyB0aGlzLncsIHk6IHRoaXMueSB9LCB7XG4gICAgICAgICAgICAgICAgeDogdGhpcy54ICsgdGhpcy53LFxuICAgICAgICAgICAgICAgIHk6IHRoaXMueSArIHRoaXMuaFxuICAgICAgICAgICAgfSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7IHg6IHRoaXMueCwgeTogdGhpcy55IH0sIHsgeDogdGhpcy54LCB5OiB0aGlzLnkgKyB0aGlzLmggfSwgbGluZS5zdGFydCwgbGluZS5lbmQpLFxuICAgICAgICAgICAgZ2V0TGluZXNJbnRlcnNlY3RQb2ludCh7IHg6IHRoaXMueCwgeTogdGhpcy55ICsgdGhpcy5oIH0sIHtcbiAgICAgICAgICAgICAgICB4OiB0aGlzLnggKyB0aGlzLncsXG4gICAgICAgICAgICAgICAgeTogdGhpcy55ICsgdGhpcy5oXG4gICAgICAgICAgICB9LCBsaW5lLnN0YXJ0LCBsaW5lLmVuZClcbiAgICAgICAgXTtcbiAgICAgICAgbGV0IG1pbl9kID0gSW5maW5pdHk7XG4gICAgICAgIGxldCBtaW5faSA9IG51bGw7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGwgPSBsaW5lc1tpXTtcbiAgICAgICAgICAgIGlmIChsLmludGVyc2VjdCA9PT0gbnVsbCkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBkID0gZ2V0UG9pbnREaXN0YW5jZShsaW5lLnN0YXJ0LCBsLmludGVyc2VjdCk7XG4gICAgICAgICAgICBpZiAobWluX2QgPiBkKSB7XG4gICAgICAgICAgICAgICAgbWluX2QgPSBkO1xuICAgICAgICAgICAgICAgIG1pbl9pID0gbC5pbnRlcnNlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgaW50ZXJzZWN0OiBtaW5faSwgZGlzdGFuY2U6IG1pbl9kIH1cbiAgICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUmVjdCBleHRlbmRzIFNoYXBlIHtcbiAgICB4OiBudW1iZXI7XG4gICAgeTogbnVtYmVyO1xuICAgIHc6IG51bWJlcjtcbiAgICBoOiBudW1iZXI7XG4gICAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHc6IG51bWJlciwgaDogbnVtYmVyLCB1dWlkPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKHV1aWQpO1xuICAgICAgICB0aGlzLnR5cGUgPSBcImJhc2VyZWN0XCI7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMudyA9IHc7XG4gICAgICAgIHRoaXMuaCA9IGg7XG4gICAgfVxuICAgIGdldEJvdW5kaW5nQm94KCkge1xuICAgICAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLngsIHRoaXMueSwgdGhpcy53LCB0aGlzLmgpO1xuICAgIH1cbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgICAgIGlmIChpbldvcmxkQ29vcmQpIHtcbiAgICAgICAgICAgIHggPSBsMnd4KHgpO1xuICAgICAgICAgICAgeSA9IGwyd3koeSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMueCA8PSB4ICYmICh0aGlzLnggKyB0aGlzLncpID49IHggJiZcbiAgICAgICAgICAgIHRoaXMueSA8PSB5ICYmICh0aGlzLnkgKyB0aGlzLmgpID49IHk7XG4gICAgfVxuICAgIGluQ29ybmVyKHg6IG51bWJlciwgeTogbnVtYmVyLCBjb3JuZXI6IHN0cmluZykge1xuICAgICAgICBzd2l0Y2ggKGNvcm5lcikge1xuICAgICAgICAgICAgY2FzZSAnbmUnOlxuICAgICAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCArIHRoaXMudyAtIDMpIDw9IHggJiYgeCA8PSB3Mmx4KHRoaXMueCArIHRoaXMudyArIDMpICYmIHcybHkodGhpcy55IC0gMykgPD0geSAmJiB5IDw9IHcybHkodGhpcy55ICsgMyk7XG4gICAgICAgICAgICBjYXNlICdudyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54IC0gMykgPD0geCAmJiB4IDw9IHcybHgodGhpcy54ICsgMykgJiYgdzJseSh0aGlzLnkgLSAzKSA8PSB5ICYmIHkgPD0gdzJseSh0aGlzLnkgKyAzKTtcbiAgICAgICAgICAgIGNhc2UgJ3N3JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggLSAzKSA8PSB4ICYmIHggPD0gdzJseCh0aGlzLnggKyAzKSAmJiB3Mmx5KHRoaXMueSArIHRoaXMuaCAtIDMpIDw9IHkgJiYgeSA8PSB3Mmx5KHRoaXMueSArIHRoaXMuaCArIDMpO1xuICAgICAgICAgICAgY2FzZSAnc2UnOlxuICAgICAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCArIHRoaXMudyAtIDMpIDw9IHggJiYgeCA8PSB3Mmx4KHRoaXMueCArIHRoaXMudyArIDMpICYmIHcybHkodGhpcy55ICsgdGhpcy5oIC0gMykgPD0geSAmJiB5IDw9IHcybHkodGhpcy55ICsgdGhpcy5oICsgMyk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRDb3JuZXIoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJuZVwiKSlcbiAgICAgICAgICAgIHJldHVybiBcIm5lXCI7XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJud1wiKSlcbiAgICAgICAgICAgIHJldHVybiBcIm53XCI7XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzZVwiKSlcbiAgICAgICAgICAgIHJldHVybiBcInNlXCI7XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIoeCwgeSwgXCJzd1wiKSlcbiAgICAgICAgICAgIHJldHVybiBcInN3XCI7XG4gICAgfVxuICAgIGNlbnRlcigpOiBQb2ludDtcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IFBvaW50KTogdm9pZDtcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBQb2ludCk6IFBvaW50IHwgdm9pZCB7XG4gICAgICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHsgeDogdGhpcy54ICsgdGhpcy53IC8gMiwgeTogdGhpcy55ICsgdGhpcy5oIC8gMiB9O1xuICAgICAgICB0aGlzLnggPSBjZW50ZXJQb2ludC54IC0gdGhpcy53IC8gMjtcbiAgICAgICAgdGhpcy55ID0gY2VudGVyUG9pbnQueSAtIHRoaXMuaCAvIDI7XG4gICAgfVxuXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICEodzJseCh0aGlzLngpID4gY2FudmFzLndpZHRoIHx8IHcybHkodGhpcy55KSA+IGNhbnZhcy5oZWlnaHQgfHxcbiAgICAgICAgICAgICAgICAgICAgdzJseCh0aGlzLnggKyB0aGlzLncpIDwgMCB8fCB3Mmx5KHRoaXMueSArIHRoaXMuaCkgPCAwKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZWN0IGV4dGVuZHMgQmFzZVJlY3Qge1xuICAgIGJvcmRlcjogc3RyaW5nO1xuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB3OiBudW1iZXIsIGg6IG51bWJlciwgZmlsbD86IHN0cmluZywgYm9yZGVyPzogc3RyaW5nLCB1dWlkPzogc3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKHgsIHksIHcsIGgsIHV1aWQpO1xuICAgICAgICB0aGlzLnR5cGUgPSBcInJlY3RcIjtcbiAgICAgICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XG4gICAgICAgIHRoaXMuYm9yZGVyID0gYm9yZGVyIHx8IFwicmdiYSgwLCAwLCAwLCAwKVwiO1xuICAgIH1cbiAgICBkcmF3KGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEKSB7XG4gICAgICAgIHN1cGVyLmRyYXcoY3R4KTtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xuICAgICAgICBjb25zdCBsb2MgPSB3MmwoeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9KTtcbiAgICAgICAgY3R4LmZpbGxSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XG4gICAgICAgIGlmICh0aGlzLmJvcmRlciAhPT0gXCJyZ2JhKDAsIDAsIDAsIDApXCIpIHtcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyO1xuICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENpcmNsZSBleHRlbmRzIFNoYXBlIHtcbiAgICB4OiBudW1iZXI7XG4gICAgeTogbnVtYmVyO1xuICAgIHI6IG51bWJlcjtcbiAgICBib3JkZXI6IHN0cmluZztcbiAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgcjogbnVtYmVyLCBmaWxsPzogc3RyaW5nLCBib3JkZXI/OiBzdHJpbmcsIHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIodXVpZCk7XG4gICAgICAgIHRoaXMudHlwZSA9IFwiY2lyY2xlXCI7XG4gICAgICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICAgICAgdGhpcy55ID0geSB8fCAwO1xuICAgICAgICB0aGlzLnIgPSByIHx8IDE7XG4gICAgICAgIHRoaXMuZmlsbCA9IGZpbGwgfHwgJyMwMDAnO1xuICAgICAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcbiAgICB9O1xuICAgIGdldEJvdW5kaW5nQm94KCk6IEJvdW5kaW5nUmVjdCB7XG4gICAgICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMueCAtIHRoaXMuciwgdGhpcy55IC0gdGhpcy5yLCB0aGlzLnIgKiAyLCB0aGlzLnIgKiAyKTtcbiAgICB9XG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbDtcbiAgICAgICAgY29uc3QgbG9jID0gdzJsKHsgeDogdGhpcy54LCB5OiB0aGlzLnkgfSk7XG4gICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB0aGlzLnIsIDAsIDIgKiBNYXRoLlBJKTtcbiAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgaWYgKHRoaXMuYm9yZGVyICE9PSBcInJnYmEoMCwgMCwgMCwgMClcIikge1xuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XG4gICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdGhpcy5yLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuICh4IC0gdzJseCh0aGlzLngpKSAqKiAyICsgKHkgLSB3Mmx5KHRoaXMueSkpICoqIDIgPCB0aGlzLnIgKiogMjtcbiAgICB9XG4gICAgaW5Db3JuZXIoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvcm5lcjogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy9UT0RPXG4gICAgfVxuICAgIGdldENvcm5lcih4OiBudW1iZXIsIHk6IG51bWJlcikge1xuICAgICAgICBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcIm5lXCIpKVxuICAgICAgICAgICAgcmV0dXJuIFwibmVcIjtcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcIm53XCIpKVxuICAgICAgICAgICAgcmV0dXJuIFwibndcIjtcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcInNlXCIpKVxuICAgICAgICAgICAgcmV0dXJuIFwic2VcIjtcbiAgICAgICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcih4LCB5LCBcInN3XCIpKVxuICAgICAgICAgICAgcmV0dXJuIFwic3dcIjtcbiAgICB9XG4gICAgY2VudGVyKCk6IFBvaW50O1xuICAgIGNlbnRlcihjZW50ZXJQb2ludDogUG9pbnQpOiB2b2lkO1xuICAgIGNlbnRlcihjZW50ZXJQb2ludD86IFBvaW50KTogUG9pbnQgfCB2b2lkIHtcbiAgICAgICAgaWYgKGNlbnRlclBvaW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4geyB4OiB0aGlzLngsIHk6IHRoaXMueSB9O1xuICAgICAgICB0aGlzLnggPSBjZW50ZXJQb2ludC54O1xuICAgICAgICB0aGlzLnkgPSBjZW50ZXJQb2ludC55O1xuICAgIH1cbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXG59XG5cbmV4cG9ydCBjbGFzcyBMaW5lIGV4dGVuZHMgU2hhcGUge1xuICAgIHgxOiBudW1iZXI7XG4gICAgeTE6IG51bWJlcjtcbiAgICB4MjogbnVtYmVyO1xuICAgIHkyOiBudW1iZXI7XG4gICAgY29uc3RydWN0b3IoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgdXVpZD86IHN0cmluZykge1xuICAgICAgICBzdXBlcih1dWlkKTtcbiAgICAgICAgdGhpcy50eXBlID0gXCJsaW5lXCI7XG4gICAgICAgIHRoaXMueDEgPSB4MTtcbiAgICAgICAgdGhpcy55MSA9IHkxO1xuICAgICAgICB0aGlzLngyID0geDI7XG4gICAgICAgIHRoaXMueTIgPSB5MjtcbiAgICB9XG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QoXG4gICAgICAgICAgICBNYXRoLm1pbih0aGlzLngxLCB0aGlzLngyKSxcbiAgICAgICAgICAgIE1hdGgubWluKHRoaXMueTEsIHRoaXMueTIpLFxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy54MSAtIHRoaXMueDIpLFxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy55MSAtIHRoaXMueTIpXG4gICAgICAgICk7XG4gICAgfVxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8odzJseCh0aGlzLngxKSwgdzJseSh0aGlzLnkxKSk7XG4gICAgICAgIGN0eC5saW5lVG8odzJseCh0aGlzLngyKSwgdzJseSh0aGlzLnkyKSk7XG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwwLDAsIDAuNSknO1xuICAgICAgICBjdHgubGluZVdpZHRoID0gMztcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbiAgICBjb250YWlucyh4OiBudW1iZXIsIHk6IG51bWJlciwgaW5Xb3JsZENvb3JkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gVE9ET1xuICAgIH1cblxuICAgIGNlbnRlcigpOiBQb2ludDtcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ6IFBvaW50KTogdm9pZDtcbiAgICBjZW50ZXIoY2VudGVyUG9pbnQ/OiBQb2ludCk6IFBvaW50IHwgdm9pZCB7IH0gLy8gVE9ET1xuICAgIGdldENvcm5lcih4OiBudW1iZXIsIHk6bnVtYmVyKTogc3RyaW5nfHVuZGVmaW5lZCB7IHJldHVybiBcIlwiIH07IC8vIFRPRE9cbiAgICB2aXNpYmxlSW5DYW52YXMoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfSAvLyBUT0RPXG59XG5cbmV4cG9ydCBjbGFzcyBUZXh0IGV4dGVuZHMgU2hhcGUge1xuICAgIHg6IG51bWJlcjtcbiAgICB5OiBudW1iZXI7XG4gICAgdGV4dDogc3RyaW5nO1xuICAgIGZvbnQ6IHN0cmluZztcbiAgICBhbmdsZTogbnVtYmVyO1xuICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyLCB0ZXh0OiBzdHJpbmcsIGZvbnQ6IHN0cmluZywgYW5nbGU/OiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIodXVpZCk7XG4gICAgICAgIHRoaXMudHlwZSA9IFwidGV4dFwiO1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgICAgICB0aGlzLmZvbnQgPSBmb250O1xuICAgICAgICB0aGlzLmFuZ2xlID0gYW5nbGUgfHwgMDtcbiAgICB9XG4gICAgZ2V0Qm91bmRpbmdCb3goKTogQm91bmRpbmdSZWN0IHtcbiAgICAgICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy54LCB0aGlzLnksIDUsIDUpOyAvLyBUb2RvOiBmaXggdGhpcyBib3VuZGluZyBib3hcbiAgICB9XG4gICAgZHJhdyhjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCkge1xuICAgICAgICBzdXBlci5kcmF3KGN0eCk7XG4gICAgICAgIGN0eC5mb250ID0gdGhpcy5mb250O1xuICAgICAgICBjdHguc2F2ZSgpO1xuICAgICAgICBjdHgudHJhbnNsYXRlKHcybHgodGhpcy54KSwgdzJseSh0aGlzLnkpKTtcbiAgICAgICAgY3R4LnJvdGF0ZSh0aGlzLmFuZ2xlKTtcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgIGN0eC5maWxsVGV4dCh0aGlzLnRleHQsIDAsIC01KTtcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICB9XG4gICAgY29udGFpbnMoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluV29ybGRDb29yZDogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7IC8vIFRPRE9cbiAgICB9XG5cbiAgICBjZW50ZXIoKTogUG9pbnQ7XG4gICAgY2VudGVyKGNlbnRlclBvaW50OiBQb2ludCk6IHZvaWQ7XG4gICAgY2VudGVyKGNlbnRlclBvaW50PzogUG9pbnQpOiBQb2ludCB8IHZvaWQgeyB9IC8vIFRPRE9cbiAgICBnZXRDb3JuZXIoeDogbnVtYmVyLCB5Om51bWJlcik6IHN0cmluZ3x1bmRlZmluZWQgeyByZXR1cm4gXCJcIiB9OyAvLyBUT0RPXG4gICAgdmlzaWJsZUluQ2FudmFzKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpOiBib29sZWFuIHsgcmV0dXJuIHRydWU7IH0gLy8gVE9ET1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXQgZXh0ZW5kcyBCYXNlUmVjdCB7XG4gICAgaW1nOiBIVE1MSW1hZ2VFbGVtZW50O1xuICAgIHNyYzogc3RyaW5nID0gJyc7XG4gICAgY29uc3RydWN0b3IoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCB4OiBudW1iZXIsIHk6IG51bWJlciwgdzogbnVtYmVyLCBoOiBudW1iZXIsIHV1aWQ/OiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoeCwgeSwgdywgaCk7XG4gICAgICAgIGlmICh1dWlkICE9PSB1bmRlZmluZWQpIHRoaXMudXVpZCA9IHV1aWQ7XG4gICAgICAgIHRoaXMudHlwZSA9IFwiYXNzZXRcIjtcbiAgICAgICAgdGhpcy5pbWcgPSBpbWc7XG4gICAgfVxuICAgIGRyYXcoY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQpIHtcbiAgICAgICAgc3VwZXIuZHJhdyhjdHgpO1xuICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XG4gICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHcybHgodGhpcy54KSwgdzJseSh0aGlzLnkpLCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcbiAgICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGU6IFNlcnZlclNoYXBlLCBkdW1teT86IGJvb2xlYW4pIHtcbiAgICBpZiAoZHVtbXkgPT09IHVuZGVmaW5lZCkgZHVtbXkgPSBmYWxzZTtcbiAgICBpZiAoIWR1bW15ICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSlcbiAgICAgICAgcmV0dXJuIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChzaGFwZS51dWlkKTtcblxuICAgIGxldCBzaDtcblxuICAgIGlmIChzaGFwZS50eXBlID09PSAncmVjdCcpIHNoID0gT2JqZWN0LmFzc2lnbihuZXcgUmVjdCgpLCBzaGFwZSk7XG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdjaXJjbGUnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IENpcmNsZSgpLCBzaGFwZSk7XG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdsaW5lJykgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBMaW5lKCksIHNoYXBlKTtcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3RleHQnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IFRleHQoKSwgc2hhcGUpO1xuICAgIGlmIChzaGFwZS50eXBlID09PSAnYXNzZXQnKSB7XG4gICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZShzaGFwZS53LCBzaGFwZS5oKTtcbiAgICAgICAgaW1nLnNyYyA9IHNoYXBlLnNyYztcbiAgICAgICAgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBBc3NldCgpLCBzaGFwZSk7XG4gICAgICAgIHNoLmltZyA9IGltZztcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikhLmludmFsaWRhdGUoZmFsc2UpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gc2g7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUNvbnRleHRNZW51KG1lbnU6IEpRdWVyeTxIVE1MRWxlbWVudD4sIHNoYXBlOiBTaGFwZSkge1xuICAgIGNvbnN0IGFjdGlvbiA9IG1lbnUuZGF0YShcImFjdGlvblwiKTtcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xuICAgIGlmIChsYXllciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgY2FzZSAnbW92ZVRvRnJvbnQnOlxuICAgICAgICAgICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIoc2hhcGUsIGxheWVyLnNoYXBlcy5sZW5ndGggLSAxLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb3ZlVG9CYWNrJzpcbiAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCAwLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzZXRMYXllcic6XG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZShzaGFwZSwgdHJ1ZSk7XG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIobWVudS5kYXRhKFwibGF5ZXJcIikpIS5hZGRTaGFwZShzaGFwZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWRkSW5pdGlhdGl2ZSc6XG4gICAgICAgICAgICBsZXQgc3JjID0gJyc7XG4gICAgICAgICAgICBpZiAoc2hhcGUgaW5zdGFuY2VvZiBBc3NldCkgc3JjID0gc2hhcGUuc3JjO1xuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHV1aWQ6IHNoYXBlLnV1aWQsXG4gICAgICAgICAgICAgICAgICAgIHZpc2libGU6ICFnYW1lTWFuYWdlci5JU19ETSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzcmM6IHNyYyxcbiAgICAgICAgICAgICAgICAgICAgb3duZXJzOiBzaGFwZS5vd25lcnNcbiAgICAgICAgICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICAkbWVudS5oaWRlKCk7XG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcbmltcG9ydCB7IGFscGhTb3J0IH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7IHNldHVwVG9vbHMgfSBmcm9tIFwiLi90b29sc1wiO1xuaW1wb3J0IHsgQ2xpZW50T3B0aW9ucywgTG9jYXRpb25PcHRpb25zLCBBc3NldExpc3QsIFNlcnZlclNoYXBlLCBJbml0aWF0aXZlRGF0YSwgQm9hcmRJbmZvIH0gZnJvbSBcIi4vYXBpX3R5cGVzXCI7XG5cbmNvbnN0IHByb3RvY29sID0gZG9jdW1lbnQuZG9tYWluID09PSAnbG9jYWxob3N0JyA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xuY29uc3Qgc29ja2V0ID0gaW8uY29ubmVjdChwcm90b2NvbCArIGRvY3VtZW50LmRvbWFpbiArIFwiOlwiICsgbG9jYXRpb24ucG9ydCArIFwiL3BsYW5hcmFsbHlcIik7XG5zb2NrZXQub24oXCJjb25uZWN0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZFwiKTtcbn0pO1xuc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWRcIik7XG59KTtcbnNvY2tldC5vbihcInJlZGlyZWN0XCIsIGZ1bmN0aW9uIChkZXN0aW5hdGlvbjogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coXCJyZWRpcmVjdGluZ1wiKTtcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGRlc3RpbmF0aW9uO1xufSk7XG5zb2NrZXQub24oXCJzZXQgdXNlcm5hbWVcIiwgZnVuY3Rpb24gKHVzZXJuYW1lOiBzdHJpbmcpIHtcbiAgICBnYW1lTWFuYWdlci51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIGdhbWVNYW5hZ2VyLklTX0RNID0gdXNlcm5hbWUgPT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMl07XG4gICAgaWYgKCQoXCIjdG9vbHNlbGVjdFwiKS5maW5kKFwidWxcIikuaHRtbCgpLmxlbmd0aCA9PT0gMClcbiAgICAgICAgc2V0dXBUb29scygpO1xufSk7XG5zb2NrZXQub24oXCJzZXQgY2xpZW50T3B0aW9uc1wiLCBmdW5jdGlvbiAob3B0aW9uczogQ2xpZW50T3B0aW9ucykge1xuICAgIGdhbWVNYW5hZ2VyLnNldENsaWVudE9wdGlvbnMob3B0aW9ucyk7XG59KTtcbnNvY2tldC5vbihcInNldCBsb2NhdGlvbk9wdGlvbnNcIiwgZnVuY3Rpb24gKG9wdGlvbnM6IExvY2F0aW9uT3B0aW9ucykge1xuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRPcHRpb25zKG9wdGlvbnMpO1xufSk7XG5zb2NrZXQub24oXCJhc3NldCBsaXN0XCIsIGZ1bmN0aW9uIChhc3NldHM6IEFzc2V0TGlzdCkge1xuICAgIGNvbnN0IG0gPSAkKFwiI21lbnUtdG9rZW5zXCIpO1xuICAgIG0uZW1wdHkoKTtcbiAgICBsZXQgaCA9ICcnO1xuXG4gICAgY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uIChlbnRyeTogQXNzZXRMaXN0LCBwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgZm9sZGVycyA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoZW50cnkuZm9sZGVycykpO1xuICAgICAgICBmb2xkZXJzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIGggKz0gXCI8YnV0dG9uIGNsYXNzPSdhY2NvcmRpb24nPlwiICsga2V5ICsgXCI8L2J1dHRvbj48ZGl2IGNsYXNzPSdhY2NvcmRpb24tcGFuZWwnPjxkaXYgY2xhc3M9J2FjY29yZGlvbi1zdWJwYW5lbCc+XCI7XG4gICAgICAgICAgICBwcm9jZXNzKHZhbHVlLCBwYXRoICsga2V5ICsgXCIvXCIpO1xuICAgICAgICAgICAgaCArPSBcIjwvZGl2PjwvZGl2PlwiO1xuICAgICAgICB9KTtcbiAgICAgICAgZW50cnkuZmlsZXMuc29ydChhbHBoU29ydCk7XG4gICAgICAgIGVudHJ5LmZpbGVzLmZvckVhY2goZnVuY3Rpb24gKGFzc2V0KSB7XG4gICAgICAgICAgICBoICs9IFwiPGRpdiBjbGFzcz0nZHJhZ2dhYmxlIHRva2VuJz48aW1nIHNyYz0nL3N0YXRpYy9pbWcvYXNzZXRzL1wiICsgcGF0aCArIGFzc2V0ICsgXCInIHdpZHRoPSczNSc+XCIgKyBhc3NldCArIFwiPGkgY2xhc3M9J2ZhcyBmYS1jb2cnPjwvaT48L2Rpdj5cIjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBwcm9jZXNzKGFzc2V0cywgXCJcIik7XG4gICAgbS5odG1sKGgpO1xuICAgICQoXCIuZHJhZ2dhYmxlXCIpLmRyYWdnYWJsZSh7XG4gICAgICAgIGhlbHBlcjogXCJjbG9uZVwiLFxuICAgICAgICBhcHBlbmRUbzogXCIjYm9hcmRcIlxuICAgIH0pO1xuICAgICQoJy5hY2NvcmRpb24nKS5lYWNoKGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgJCh0aGlzKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykudG9nZ2xlQ2xhc3MoXCJhY2NvcmRpb24tYWN0aXZlXCIpO1xuICAgICAgICAgICAgJCh0aGlzKS5uZXh0KCkudG9nZ2xlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5zb2NrZXQub24oXCJib2FyZCBpbml0XCIsIGZ1bmN0aW9uIChsb2NhdGlvbl9pbmZvOiBCb2FyZEluZm8pIHtcbiAgICBnYW1lTWFuYWdlci5zZXR1cEJvYXJkKGxvY2F0aW9uX2luZm8pXG59KTtcbnNvY2tldC5vbihcInNldCBncmlkc2l6ZVwiLCBmdW5jdGlvbiAoZ3JpZFNpemU6IG51bWJlcikge1xuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRHcmlkU2l6ZShncmlkU2l6ZSk7XG59KTtcbnNvY2tldC5vbihcImFkZCBzaGFwZVwiLCBmdW5jdGlvbiAoc2hhcGU6IFNlcnZlclNoYXBlKSB7XG4gICAgZ2FtZU1hbmFnZXIuYWRkU2hhcGUoc2hhcGUpO1xufSk7XG5zb2NrZXQub24oXCJyZW1vdmUgc2hhcGVcIiwgZnVuY3Rpb24gKHNoYXBlOiBTZXJ2ZXJTaGFwZSkge1xuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKHNoYXBlLnV1aWQpKXtcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgYW4gdW5rbm93biBzaGFwZWApO1xuICAgICAgICByZXR1cm4gO1xuICAgIH1cbiAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpIHtcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgc2hhcGUgZnJvbSBhbiB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9YCk7XG4gICAgICAgIHJldHVybiA7XG4gICAgfVxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XG4gICAgbGF5ZXIucmVtb3ZlU2hhcGUoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpISwgZmFsc2UpO1xuICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xufSk7XG5zb2NrZXQub24oXCJtb3ZlU2hhcGVPcmRlclwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IGluZGV4OiBudW1iZXIgfSkge1xuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKGRhdGEuc2hhcGUudXVpZCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byBtb3ZlIHRoZSBzaGFwZSBvcmRlciBvZiBhbiB1bmtub3duIHNoYXBlYCk7XG4gICAgICAgIHJldHVybiA7XG4gICAgfVxuICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmhhc0xheWVyKGRhdGEuc2hhcGUubGF5ZXIpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0ZWQgdG8gcmVtb3ZlIHNoYXBlIGZyb20gYW4gdW5rbm93biBsYXllciAke2RhdGEuc2hhcGUubGF5ZXJ9YCk7XG4gICAgICAgIHJldHVybiA7XG4gICAgfVxuICAgIGNvbnN0IHNoYXBlID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGRhdGEuc2hhcGUudXVpZCkhO1xuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKSE7XG4gICAgbGF5ZXIubW92ZVNoYXBlT3JkZXIoc2hhcGUsIGRhdGEuaW5kZXgsIGZhbHNlKTtcbn0pO1xuc29ja2V0Lm9uKFwic2hhcGVNb3ZlXCIsIGZ1bmN0aW9uIChzaGFwZTogU2VydmVyU2hhcGUpIHtcbiAgICBnYW1lTWFuYWdlci5tb3ZlU2hhcGUoc2hhcGUpO1xufSk7XG5zb2NrZXQub24oXCJ1cGRhdGVTaGFwZVwiLCBmdW5jdGlvbiAoZGF0YTogeyBzaGFwZTogU2VydmVyU2hhcGU7IHJlZHJhdzogYm9vbGVhbiB9KSB7XG4gICAgZ2FtZU1hbmFnZXIudXBkYXRlU2hhcGUoZGF0YSk7XG59KTtcbnNvY2tldC5vbihcInVwZGF0ZUluaXRpYXRpdmVcIiwgZnVuY3Rpb24gKGRhdGE6IEluaXRpYXRpdmVEYXRhKSB7XG4gICAgaWYgKGRhdGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkIHx8ICghZGF0YS5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSAmJiAhZGF0YS52aXNpYmxlKSlcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShkYXRhLnV1aWQsIGZhbHNlLCB0cnVlKTtcbiAgICBlbHNlXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLmFkZEluaXRpYXRpdmUoZGF0YSwgZmFsc2UpO1xufSk7XG5zb2NrZXQub24oXCJzZXRJbml0aWF0aXZlXCIsIGZ1bmN0aW9uIChkYXRhOiBJbml0aWF0aXZlRGF0YVtdKSB7XG4gICAgZ2FtZU1hbmFnZXIuc2V0SW5pdGlhdGl2ZShkYXRhKTtcbn0pO1xuc29ja2V0Lm9uKFwiY2xlYXIgdGVtcG9yYXJpZXNcIiwgZnVuY3Rpb24gKHNoYXBlczogU2VydmVyU2hhcGVbXSkge1xuICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBdHRlbXB0ZWQgdG8gcmVtb3ZlIGFuIHVua25vd24gdGVtcG9yYXJ5IHNoYXBlXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5oYXNMYXllcihzaGFwZS5sYXllcikpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEF0dGVtcHRlZCB0byByZW1vdmUgc2hhcGUgZnJvbSBhbiB1bmtub3duIGxheWVyICR7c2hhcGUubGF5ZXJ9YCk7XG4gICAgICAgICAgICByZXR1cm4gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlYWxfc2hhcGUgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQoc2hhcGUudXVpZCkhO1xuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpIS5yZW1vdmVTaGFwZShyZWFsX3NoYXBlLCBmYWxzZSk7XG4gICAgfSlcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBzb2NrZXQ7IiwiaW1wb3J0IHtnZXRVbml0RGlzdGFuY2UsIGwydywgbDJ3eCwgbDJ3eSwgdzJsLCB3MmxyLCB3Mmx4LCB3Mmx5LCB3Mmx6fSBmcm9tIFwiLi91bml0c1wiO1xuaW1wb3J0IHtTaGFwZSwgTGluZSwgUmVjdCwgVGV4dCwgQmFzZVJlY3R9IGZyb20gXCIuL3NoYXBlc1wiO1xuaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcbmltcG9ydCBzb2NrZXQgZnJvbSBcIi4vc29ja2V0XCI7XG5pbXBvcnQgeyBQb2ludCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBJbml0aWF0aXZlRGF0YSB9IGZyb20gXCIuL2FwaV90eXBlc1wiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVG9vbCB7XG4gICAgZGV0YWlsRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcbiAgICBhYnN0cmFjdCBvbk1vdXNlRG93bihlOiBNb3VzZUV2ZW50KTogdm9pZDtcbiAgICBhYnN0cmFjdCBvbk1vdXNlTW92ZShlOiBNb3VzZUV2ZW50KTogdm9pZDtcbiAgICBhYnN0cmFjdCBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQ7XG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7fTtcbn1cblxuZW51bSBTZWxlY3RPcGVyYXRpb25zIHtcbiAgICBOb29wLFxuICAgIFJlc2l6ZSxcbiAgICBEcmFnLFxuICAgIEdyb3VwU2VsZWN0LFxufVxuXG5leHBvcnQgY2xhc3MgU2VsZWN0VG9vbCBleHRlbmRzIFRvb2wge1xuICAgIG1vZGU6IFNlbGVjdE9wZXJhdGlvbnMgPSBTZWxlY3RPcGVyYXRpb25zLk5vb3A7XG4gICAgcmVzaXplZGlyOiBzdHJpbmcgPSBcIlwiO1xuICAgIC8vIEJlY2F1c2Ugd2UgbmV2ZXIgZHJhZyBmcm9tIHRoZSBhc3NldCdzICgwLCAwKSBjb29yZCBhbmQgd2FudCBhIHNtb290aGVyIGRyYWcgZXhwZXJpZW5jZVxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cbiAgICBkcmFnb2ZmeCA9IDA7XG4gICAgZHJhZ29mZnkgPSAwO1xuICAgIGRyYWdvcmlnOiBQb2ludCA9IHt4OjAsIHk6MH07XG4gICAgc2VsZWN0aW9uSGVscGVyOiBSZWN0ID0gbmV3IFJlY3QoLTEwMDAsIC0xMDAwLCAwLCAwKTtcbiAgICBzZWxlY3Rpb25TdGFydFBvaW50OiBQb2ludCA9IHt4OiAtMTAwMCwgeTogLTEwMDB9O1xuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcbiAgICB9XG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgICBjb25zdCBteCA9IGUucGFnZVg7XG4gICAgICAgIGNvbnN0IG15ID0gZS5wYWdlWTtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcbiAgICAgICAgICAgIHJldHVybiA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XG5cbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xuICAgICAgICAvLyB0aGUgc2VsZWN0aW9uU3RhY2sgYWxsb3dzIGZvciBsb3dlciBwb3NpdGlvbmVkIG9iamVjdHMgdGhhdCBhcmUgc2VsZWN0ZWQgdG8gaGF2ZSBwcmVjZWRlbmNlIGR1cmluZyBvdmVybGFwLlxuICAgICAgICBsZXQgc2VsZWN0aW9uU3RhY2s7XG4gICAgICAgIGlmICghbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aClcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxlY3Rpb25TdGFjayA9IGxheWVyLnNoYXBlcy5jb25jYXQobGF5ZXIuc2VsZWN0aW9uKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IHNlbGVjdGlvblN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBzaGFwZSA9IHNlbGVjdGlvblN0YWNrW2ldO1xuICAgICAgICAgICAgY29uc3QgY29ybiA9IHNoYXBlLmdldENvcm5lcihteCwgbXkpO1xuICAgICAgICAgICAgaWYgKGNvcm4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbc2hhcGVdO1xuICAgICAgICAgICAgICAgIHNoYXBlLm9uU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemU7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemVkaXIgPSBjb3JuO1xuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2hhcGUuY29udGFpbnMobXgsIG15LCB0cnVlKSkge1xuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWwgPSBzaGFwZTtcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5pbmRleE9mKHNlbCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbiA9IFtzZWxdO1xuICAgICAgICAgICAgICAgICAgICBzZWwub25TZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlID0gU2VsZWN0T3BlcmF0aW9ucy5EcmFnO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ29mZnggPSBteCAtIHNlbC54ICogejtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdvZmZ5ID0gbXkgLSBzZWwueSAqIHo7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmFnb3JpZyA9IHt4OiBzZWwueCwgeTogc2VsLnl9O1xuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGl0KSB7XG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XG4gICAgICAgICAgICAgICAgc2VsLm9uU2VsZWN0aW9uTG9zcygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLm1vZGUgPSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0O1xuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnggPSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueDtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnkgPSB0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLncgPSAwO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIuaCA9IDA7XG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbdGhpcy5zZWxlY3Rpb25IZWxwZXJdO1xuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcbiAgICAgICAgY29uc3QgbW91c2UgPSBsYXllci5nZXRNb3VzZShlKTtcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xuICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkdyb3VwU2VsZWN0KSB7XG4gICAgICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgdGhpc1xuICAgICAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobW91c2UpO1xuXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlci53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC54KTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50LnkpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIueCA9IE1hdGgubWluKHRoaXMuc2VsZWN0aW9uU3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyLnkgPSBNYXRoLm1pbih0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IG9nWCA9IGxheWVyLnNlbGVjdGlvbltsYXllci5zZWxlY3Rpb24ubGVuZ3RoIC0gMV0ueCAqIHo7XG4gICAgICAgICAgICBjb25zdCBvZ1kgPSBsYXllci5zZWxlY3Rpb25bbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCAtIDFdLnkgKiB6O1xuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goKHNlbCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghKHNlbCBpbnN0YW5jZW9mIEJhc2VSZWN0KSkgcmV0dXJuOyAvLyBUT0RPXG4gICAgICAgICAgICAgICAgY29uc3QgZHggPSBtb3VzZS54IC0gKG9nWCArIHRoaXMuZHJhZ29mZngpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR5ID0gbW91c2UueSAtIChvZ1kgKyB0aGlzLmRyYWdvZmZ5KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb2RlID09PSBTZWxlY3RPcGVyYXRpb25zLkRyYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsLnggKz0gZHggLyB6O1xuICAgICAgICAgICAgICAgICAgICBzZWwueSArPSBkeSAvIHo7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXllci5uYW1lICE9PSAnZm93Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byB1c2UgdGhlIGFib3ZlIHVwZGF0ZWQgdmFsdWVzIGZvciB0aGUgYm91bmRpbmcgYm94IGNoZWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGUgYm91bmRpbmcgYm94ZXMgb3ZlcmxhcCB0byBzdG9wIGNsb3NlIC8gcHJlY2lzZSBtb3ZlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJsb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJib3ggPSBzZWwuZ2V0Qm91bmRpbmdCb3goKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrZXJzID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWIgPT4gbWIgIT09IHNlbC51dWlkICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhtYikgJiYgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KG1iKSEuZ2V0Qm91bmRpbmdCb3goKS5pbnRlcnNlY3RzV2l0aChiYm94KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmxvY2tlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEcmF3IGEgbGluZSBmcm9tIHN0YXJ0IHRvIGVuZCBwb3NpdGlvbiBhbmQgc2VlIGZvciBhbnkgaW50ZXJzZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBzdG9wcyBzdWRkZW4gbGVhcHMgb3ZlciB3YWxscyEgY2hlZWt5IGJ1Z2dlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0ge3N0YXJ0OiB7eDogb2dYIC8geiwgeTogb2dZIC8gen0sIGVuZDoge3g6IHNlbC54LCB5OiBzZWwueX19O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNvbWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1iID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuaGFzKG1iKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW50ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobWIpIS5nZXRCb3VuZGluZ0JveCgpLmdldEludGVyc2VjdFdpdGhMaW5lKGxpbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1iICE9PSBzZWwudXVpZCAmJiBpbnRlci5pbnRlcnNlY3QgIT09IG51bGwgJiYgaW50ZXIuZGlzdGFuY2UgPiAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChibG9ja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggLT0gZHggLyB6O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55IC09IGR5IC8gejtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gdGhpcy5zZWxlY3Rpb25IZWxwZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogc2VsLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzaXplZGlyID09PSAnbncnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IHcybHgoc2VsLngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gdzJseShzZWwueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBsMnd4KG1vdXNlLngpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBsMnd5KG1vdXNlLnkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplZGlyID09PSAnbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IG1vdXNlLnggLSB3Mmx4KHNlbC54KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gdzJseShzZWwueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBsMnd5KG1vdXNlLnkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplZGlyID09PSAnc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IG1vdXNlLnggLSB3Mmx4KHNlbC54KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gbW91c2UueSAtIHcybHkoc2VsLnkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVzaXplZGlyID09PSAnc3cnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IHcybHgoc2VsLngpICsgc2VsLncgKiB6IC0gbW91c2UueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gbW91c2UueSAtIHcybHkoc2VsLnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBsMnd4KG1vdXNlLngpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbC53IC89IHo7XG4gICAgICAgICAgICAgICAgICAgIHNlbC5oIC89IHo7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcIm53XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwibnctcmVzaXplXCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKG1vdXNlLngsIG1vdXNlLnksIFwibmVcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJuZS1yZXNpemVcIjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJzZVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInNlLXJlc2l6ZVwiO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcInN3XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwic3ctcmVzaXplXCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcbiAgICAgICAgY29uc3QgbW91c2UgPSBsYXllci5nZXRNb3VzZShlKTtcbiAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5Hcm91cFNlbGVjdCkge1xuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XG4gICAgICAgICAgICBsYXllci5zaGFwZXMuZm9yRWFjaCgoc2hhcGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGUgPT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNoYXBlLmdldEJvdW5kaW5nQm94KCk7XG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb25IZWxwZXIhLnggPD0gYmJveC54ICsgYmJveC53ICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS54ICsgdGhpcy5zZWxlY3Rpb25IZWxwZXIhLncgPj0gYmJveC54ICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uSGVscGVyIS55IDw9IGJib3gueSArIGJib3guaCAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkhlbHBlciEueSArIHRoaXMuc2VsZWN0aW9uSGVscGVyIS5oID49IGJib3gueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2goc2hhcGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBQdXNoIHRoZSBzZWxlY3Rpb24gaGVscGVyIGFzIHRoZSBsYXN0IGVsZW1lbnQgb2YgdGhlIHNlbGVjdGlvblxuICAgICAgICAgICAgLy8gVGhpcyBtYWtlcyBzdXJlIHRoYXQgaXQgd2lsbCBiZSB0aGUgZmlyc3Qgb25lIHRvIGJlIGhpdCBpbiB0aGUgaGl0IGRldGVjdGlvbiBvbk1vdXNlRG93blxuICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGggPiAwKVxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2godGhpcy5zZWxlY3Rpb25IZWxwZXIpO1xuXG4gICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbi5mb3JFYWNoKChzZWwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIShzZWwgaW5zdGFuY2VvZiBCYXNlUmVjdCkpIHJldHVybjsgLy8gVE9ET1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1vZGUgPT09IFNlbGVjdE9wZXJhdGlvbnMuRHJhZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kcmFnb3JpZy54ID09PSBzZWwueCAmJiB0aGlzLmRyYWdvcmlnLnkgPT09IHNlbC55KSB7IHJldHVybiB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW91c2UgPSB7eDogc2VsLnggKyBzZWwudyAvIDIsIHk6IHNlbC55ICsgc2VsLmggLyAyfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG14ID0gbW91c2UueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc2VsLncgLyBncykgJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBNYXRoLnJvdW5kKG14IC8gZ3MpICogZ3MgLSBzZWwudyAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54ID0gKE1hdGgucm91bmQoKG14ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHNlbC53IC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc2VsLmggLyBncykgJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBNYXRoLnJvdW5kKG15IC8gZ3MpICogZ3MgLSBzZWwuaCAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gKE1hdGgucm91bmQoKG15ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHNlbC5oIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSB0aGlzLnNlbGVjdGlvbkhlbHBlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW9kZSA9PT0gU2VsZWN0T3BlcmF0aW9ucy5SZXNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbC53IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggKz0gc2VsLnc7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwudyA9IE1hdGguYWJzKHNlbC53KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsLmggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSArPSBzZWwuaDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC5oID0gTWF0aC5hYnMoc2VsLmgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudXNlR3JpZCAmJiAhZS5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBNYXRoLnJvdW5kKHNlbC54IC8gZ3MpICogZ3M7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueSA9IE1hdGgucm91bmQoc2VsLnkgLyBncykgKiBncztcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC53ID0gTWF0aC5tYXgoTWF0aC5yb3VuZChzZWwudyAvIGdzKSAqIGdzLCBncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IE1hdGgubWF4KE1hdGgucm91bmQoc2VsLmggLyBncykgKiBncywgZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWwgIT09IHRoaXMuc2VsZWN0aW9uSGVscGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHNlbC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubW9kZSA9IFNlbGVjdE9wZXJhdGlvbnMuTm9vcFxuICAgIH07XG4gICAgb25Db250ZXh0TWVudShlOiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XG4gICAgICAgICAgICByZXR1cm4gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkhO1xuICAgICAgICBjb25zdCBtb3VzZSA9IGxheWVyLmdldE1vdXNlKGUpO1xuICAgICAgICBjb25zdCBteCA9IG1vdXNlLng7XG4gICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcbiAgICAgICAgbGV0IGhpdCA9IGZhbHNlO1xuICAgICAgICBsYXllci5zaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcbiAgICAgICAgICAgIGlmICghaGl0ICYmIHNoYXBlLmNvbnRhaW5zKG14LCBteSwgdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICBzaGFwZS5zaG93Q29udGV4dE1lbnUobW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG5leHBvcnQgY2xhc3MgUGFuVG9vbCBleHRlbmRzIFRvb2wge1xuICAgIC8vIEJlY2F1c2Ugd2UgbmV2ZXIgZHJhZyBmcm9tIHRoZSBhc3NldCdzICgwLCAwKSBjb29yZCBhbmQgd2FudCBhIHNtb290aGVyIGRyYWcgZXhwZXJpZW5jZVxuICAgIC8vIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFjdHVhbCBvZmZzZXQgd2l0aGluIHRoZSBhc3NldC5cbiAgICBkcmFnb2ZmeCA9IDA7XG4gICAgZHJhZ29mZnkgPSAwO1xuICAgIGRyYWdvcmlnOiBQb2ludCA9IHt4OjAsIHk6MH07XG4gICAgYWN0aXZlOiBib29sZWFuID0gZmFsc2U7XG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRyYWdvZmZ4ID0gZS5wYWdlWDtcbiAgICAgICAgdGhpcy5kcmFnb2ZmeSA9IGUucGFnZVk7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB9O1xuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBtb3VzZSA9IHt4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZfTtcbiAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCArPSBNYXRoLnJvdW5kKChtb3VzZS54IC0gdGhpcy5kcmFnb2ZmeCkgLyB6KTtcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgKz0gTWF0aC5yb3VuZCgobW91c2UueSAtIHRoaXMuZHJhZ29mZnkpIC8geik7XG4gICAgICAgIHRoaXMuZHJhZ29mZnggPSBtb3VzZS54O1xuICAgICAgICB0aGlzLmRyYWdvZmZ5ID0gbW91c2UueTtcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcbiAgICB9O1xuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHNvY2tldC5lbWl0KFwic2V0IGNsaWVudE9wdGlvbnNcIiwge1xuICAgICAgICAgICAgcGFuWDogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblgsXG4gICAgICAgICAgICBwYW5ZOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIG9uQ29udGV4dE1lbnUoZTogTW91c2VFdmVudCkge307XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXR1cFRvb2xzKCk6IHZvaWQge1xuICAgIGNvbnN0IHRvb2xzZWxlY3REaXYgPSAkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpO1xuICAgIHRvb2xzLmZvckVhY2goZnVuY3Rpb24gKHRvb2wpIHtcbiAgICAgICAgaWYgKCF0b29sLnBsYXllclRvb2wgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgdG9vbEluc3RhbmNlID0gbmV3IHRvb2wuY2x6KCk7XG4gICAgICAgIGdhbWVNYW5hZ2VyLnRvb2xzLnNldCh0b29sLm5hbWUsIHRvb2xJbnN0YW5jZSk7XG4gICAgICAgIGNvbnN0IGV4dHJhID0gdG9vbC5kZWZhdWx0U2VsZWN0ID8gXCIgY2xhc3M9J3Rvb2wtc2VsZWN0ZWQnXCIgOiBcIlwiO1xuICAgICAgICBjb25zdCB0b29sTGkgPSAkKFwiPGxpIGlkPSd0b29sLVwiICsgdG9vbC5uYW1lICsgXCInXCIgKyBleHRyYSArIFwiPjxhIGhyZWY9JyMnPlwiICsgdG9vbC5uYW1lICsgXCI8L2E+PC9saT5cIik7XG4gICAgICAgIHRvb2xzZWxlY3REaXYuYXBwZW5kKHRvb2xMaSk7XG4gICAgICAgIGlmICh0b29sLmhhc0RldGFpbCkge1xuICAgICAgICAgICAgY29uc3QgZGl2ID0gdG9vbEluc3RhbmNlLmRldGFpbERpdiE7XG4gICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmFwcGVuZChkaXYpO1xuICAgICAgICAgICAgZGl2LmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0b29sTGkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRvb2xzLmluZGV4T2YodG9vbCk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCkge1xuICAgICAgICAgICAgICAgICQoJy50b29sLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbCA9IGluZGV4O1xuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9ICQoJyN0b29sZGV0YWlsJyk7XG4gICAgICAgICAgICAgICAgaWYgKHRvb2wuaGFzRGV0YWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyN0b29sZGV0YWlsJykuY2hpbGRyZW4oKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRvb2xJbnN0YW5jZS5kZXRhaWxEaXYhLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsLnNob3coKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWwuaGlkZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBEcmF3VG9vbCBleHRlbmRzIFRvb2wge1xuICAgIHN0YXJ0UG9pbnQ6IFBvaW50fG51bGwgPSBudWxsO1xuICAgIHJlY3Q6IFJlY3R8bnVsbCA9IG51bGw7XG4gICAgZmlsbENvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcbiAgICBib3JkZXJDb2xvciA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgLz5cIik7XG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXG4gICAgICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PkZpbGw8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLmZpbGxDb2xvcilcbiAgICAgICAgICAgIC5hcHBlbmQoJChcIjxkaXY+Qm9yZGVyPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5ib3JkZXJDb2xvcilcbiAgICAgICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oe1xuICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxuICAgICAgICAgICAgYWxsb3dFbXB0eTogdHJ1ZSxcbiAgICAgICAgICAgIHNob3dBbHBoYTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbG9yOiBcInJlZFwiXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJvcmRlckNvbG9yLnNwZWN0cnVtKHtcbiAgICAgICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcbiAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXG4gICAgICAgICAgICBzaG93QWxwaGE6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcbiAgICAgICAgICAgIHJldHVybiA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XG4gICAgICAgIGNvbnN0IGZpbGxDb2xvciA9IHRoaXMuZmlsbENvbG9yLnNwZWN0cnVtKFwiZ2V0XCIpO1xuICAgICAgICBjb25zdCBmaWxsID0gZmlsbENvbG9yID09PSBudWxsID8gdGlueWNvbG9yKFwidHJhbnNwYXJlbnRcIikgOiBmaWxsQ29sb3I7XG4gICAgICAgIGNvbnN0IGJvcmRlckNvbG9yID0gdGhpcy5ib3JkZXJDb2xvci5zcGVjdHJ1bShcImdldFwiKTtcbiAgICAgICAgY29uc3QgYm9yZGVyID0gYm9yZGVyQ29sb3IgPT09IG51bGwgPyB0aW55Y29sb3IoXCJ0cmFuc3BhcmVudFwiKSA6IGJvcmRlckNvbG9yO1xuICAgICAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIDAsIDAsIGZpbGwudG9SZ2JTdHJpbmcoKSwgYm9yZGVyLnRvUmdiU3RyaW5nKCkpO1xuICAgICAgICB0aGlzLnJlY3Qub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xuICAgICAgICBpZiAobGF5ZXIubmFtZSA9PT0gJ2ZvdycpIHtcbiAgICAgICAgICAgIHRoaXMucmVjdC52aXNpb25PYnN0cnVjdGlvbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnJlY3QubW92ZW1lbnRPYnN0cnVjdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMucmVjdC51dWlkKTtcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy5yZWN0LCB0cnVlLCBmYWxzZSk7XG4gICAgfVxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcbiAgICAgICAgICAgIHJldHVybiA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XG4gICAgICAgIGNvbnN0IGVuZFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcbiAgICBcbiAgICAgICAgdGhpcy5yZWN0IS53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcbiAgICAgICAgdGhpcy5yZWN0IS5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcbiAgICAgICAgdGhpcy5yZWN0IS54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xuICAgICAgICB0aGlzLnJlY3QhLnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XG4gICAgICAgIHNvY2tldC5lbWl0KFwic2hhcGVNb3ZlXCIsIHtzaGFwZTogdGhpcy5yZWN0IS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xuICAgICAgICBsYXllci5pbnZhbGlkYXRlKGZhbHNlKTtcbiAgICB9XG4gICAgb25Nb3VzZVVwKGU6TW91c2VFdmVudCkge1xuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlY3QgPSBudWxsO1xuICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgUnVsZXJUb29sIGV4dGVuZHMgVG9vbCB7XG4gICAgc3RhcnRQb2ludDogUG9pbnR8bnVsbCA9IG51bGw7XG4gICAgcnVsZXI6IExpbmV8bnVsbCA9IG51bGw7XG4gICAgdGV4dDogVGV4dHxudWxsID0gbnVsbDtcblxuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcbiAgICAgICAgICAgIHJldHVybiA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpITtcbiAgICAgICAgdGhpcy5zdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcbiAgICAgICAgdGhpcy5ydWxlciA9IG5ldyBMaW5lKHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSwgdGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55KTtcbiAgICAgICAgdGhpcy50ZXh0ID0gbmV3IFRleHQodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCBcIlwiLCBcIjIwcHggc2VyaWZcIik7XG4gICAgICAgIHRoaXMucnVsZXIub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xuICAgICAgICB0aGlzLnRleHQub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJ1bGVyLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgbGF5ZXIuYWRkU2hhcGUodGhpcy50ZXh0LCB0cnVlLCB0cnVlKTtcbiAgICB9XG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIikhO1xuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XG4gICAgXG4gICAgICAgIHRoaXMucnVsZXIhLngyID0gZW5kUG9pbnQueDtcbiAgICAgICAgdGhpcy5ydWxlciEueTIgPSBlbmRQb2ludC55O1xuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucnVsZXIhLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWV9KTtcbiAgICBcbiAgICAgICAgY29uc3QgZGlmZnNpZ24gPSBNYXRoLnNpZ24oZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KSAqIE1hdGguc2lnbihlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xuICAgICAgICBjb25zdCB4ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XG4gICAgICAgIGNvbnN0IHlkaWZmID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcbiAgICAgICAgY29uc3QgbGFiZWwgPSBNYXRoLnJvdW5kKE1hdGguc3FydCgoeGRpZmYpICoqIDIgKyAoeWRpZmYpICoqIDIpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVuaXRTaXplIC8gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplKSArIFwiIGZ0XCI7XG4gICAgICAgIGxldCBhbmdsZSA9IE1hdGguYXRhbjIoZGlmZnNpZ24gKiB5ZGlmZiwgeGRpZmYpO1xuICAgICAgICBjb25zdCB4bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpICsgeGRpZmYgLyAyO1xuICAgICAgICBjb25zdCB5bWlkID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpICsgeWRpZmYgLyAyO1xuICAgICAgICB0aGlzLnRleHQhLnggPSB4bWlkO1xuICAgICAgICB0aGlzLnRleHQhLnkgPSB5bWlkO1xuICAgICAgICB0aGlzLnRleHQhLnRleHQgPSBsYWJlbDtcbiAgICAgICAgdGhpcy50ZXh0IS5hbmdsZSA9IGFuZ2xlO1xuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMudGV4dCEuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZX0pO1xuICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xuICAgIH1cbiAgICBvbk1vdXNlVXAoZTogTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XG4gICAgICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKSE7XG4gICAgICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucnVsZXIhLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUodGhpcy50ZXh0ISwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIHRoaXMucnVsZXIgPSBudWxsO1xuICAgICAgICB0aGlzLnRleHQgPSBudWxsO1xuICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZPV1Rvb2wgZXh0ZW5kcyBUb29sIHtcbiAgICBzdGFydFBvaW50OiBQb2ludHxudWxsID0gbnVsbDtcbiAgICByZWN0OiBSZWN0fG51bGwgPSBudWxsO1xuICAgIGRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PlJldmVhbDwvZGl2PjxsYWJlbCBjbGFzcz0nc3dpdGNoJz48aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdmb3ctcmV2ZWFsJz48c3BhbiBjbGFzcz0nc2xpZGVyIHJvdW5kJz48L3NwYW4+PC9sYWJlbD5cIikpXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XG4gICAgb25Nb3VzZURvd24oZTogTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKSE7XG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSwgMCwgMCwgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCkpO1xuICAgICAgICBsYXllci5hZGRTaGFwZSh0aGlzLnJlY3QsIHRydWUsIGZhbHNlKTtcblxuICAgICAgICBpZiAoJChcIiNmb3ctcmV2ZWFsXCIpLnByb3AoXCJjaGVja2VkXCIpKVxuICAgICAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiZGVzdGluYXRpb24tb3V0XCI7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHRoaXMucmVjdC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcInNvdXJjZS1vdmVyXCI7XG4gICAgfVxuICAgIG9uTW91c2VNb3ZlKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcbiAgICAgICAgICAgIHJldHVybiA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIikhO1xuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XG4gICAgXG4gICAgICAgIHRoaXMucmVjdCEudyA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XG4gICAgICAgIHRoaXMucmVjdCEuaCA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XG4gICAgICAgIHRoaXMucmVjdCEueCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KTtcbiAgICAgICAgdGhpcy5yZWN0IS55ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xuICAgIFxuICAgICAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdCEuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7ICAgICAgICBcbiAgICB9XG4gICAgb25Nb3VzZVVwKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlY3QgPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1hcFRvb2wgZXh0ZW5kcyBUb29sIHtcbiAgICBzdGFydFBvaW50OiBQb2ludHxudWxsID0gbnVsbDtcbiAgICByZWN0OiBSZWN0fG51bGwgPSBudWxsO1xuICAgIHhDb3VudCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9JzMnPlwiKTtcbiAgICB5Q291bnQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIHZhbHVlPSczJz5cIik7XG4gICAgZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+I1g8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLnhDb3VudClcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWTwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueUNvdW50KVxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xuICAgIG9uTW91c2VEb3duKGU6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm8gYWN0aXZlIGxheWVyIVwiKTtcbiAgICAgICAgICAgIHJldHVybiA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XG4gICAgICAgIHRoaXMucmVjdCA9IG5ldyBSZWN0KHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSwgMCwgMCwgXCJyZ2JhKDAsMCwwLDApXCIsIFwiYmxhY2tcIik7XG4gICAgICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcbiAgICB9XG4gICAgb25Nb3VzZU1vdmUoZTogTW91c2VFdmVudCkge1xuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBhY3RpdmUgbGF5ZXIhXCIpO1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxuICAgICAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpITtcbiAgICAgICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xuICAgIFxuICAgICAgICB0aGlzLnJlY3QhLncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xuICAgICAgICB0aGlzLnJlY3QhLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xuICAgICAgICB0aGlzLnJlY3QhLnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XG4gICAgICAgIHRoaXMucmVjdCEueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcbiAgICAgICAgLy8gc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnJlY3QuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcbiAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZShmYWxzZSk7XG4gICAgfVxuICAgIG9uTW91c2VVcChlOiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGlmIChnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIGFjdGl2ZSBsYXllciFcIik7XG4gICAgICAgICAgICByZXR1cm4gO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKSE7XG4gICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QhLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLnJlY3QhLnc7XG4gICAgICAgIGNvbnN0IGggPSB0aGlzLnJlY3QhLmg7XG4gICAgICAgIGNvbnN0IHNlbCA9IGxheWVyLnNlbGVjdGlvblswXTtcblxuICAgICAgICBpZiAoc2VsIGluc3RhbmNlb2YgUmVjdCl7XG4gICAgICAgICAgICBzZWwudyAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueENvdW50LnZhbCgpKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIHc7XG4gICAgICAgICAgICBzZWwuaCAqPSBwYXJzZUludCg8c3RyaW5nPnRoaXMueUNvdW50LnZhbCgpKSAqIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZSAvIGg7XG4gICAgICAgIH1cblxuICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QhLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlY3QgPSBudWxsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEluaXRpYXRpdmVUcmFja2VyIHtcbiAgICBkYXRhOiBJbml0aWF0aXZlRGF0YVtdID0gW107XG4gICAgYWRkSW5pdGlhdGl2ZShkYXRhOiBJbml0aWF0aXZlRGF0YSwgc3luYzogYm9vbGVhbikge1xuICAgICAgICAvLyBPcGVuIHRoZSBpbml0aWF0aXZlIHRyYWNrZXIgaWYgaXQgaXMgbm90IGN1cnJlbnRseSBvcGVuLlxuICAgICAgICBpZiAodGhpcy5kYXRhLmxlbmd0aCA9PT0gMCB8fCAhZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcIm9wZW5cIik7XG4gICAgICAgIC8vIElmIG5vIGluaXRpYXRpdmUgZ2l2ZW4sIGFzc3VtZSBpdCAwXG4gICAgICAgIGlmIChkYXRhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIGRhdGEuaW5pdGlhdGl2ZSA9IDA7XG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBzaGFwZSBpcyBhbHJlYWR5IGJlaW5nIHRyYWNrZWRcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gZGF0YS51dWlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihleGlzdGluZywgZGF0YSk7XG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YSk7XG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzeW5jKVxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGRhdGEpO1xuICAgIH07XG4gICAgcmVtb3ZlSW5pdGlhdGl2ZSh1dWlkOiBzdHJpbmcsIHN5bmM6IGJvb2xlYW4sIHNraXBHcm91cENoZWNrOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IGQgPSB0aGlzLmRhdGEuZmluZEluZGV4KGQgPT4gZC51dWlkID09PSB1dWlkKTtcbiAgICAgICAgaWYgKGQgPj0gMCkge1xuICAgICAgICAgICAgaWYgKCFza2lwR3JvdXBDaGVjayAmJiB0aGlzLmRhdGFbZF0uZ3JvdXApIHJldHVybjtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5zcGxpY2UoZCwgMSk7XG4gICAgICAgICAgICB0aGlzLnJlZHJhdygpO1xuICAgICAgICAgICAgaWYgKHN5bmMpXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIHt1dWlkOiB1dWlkfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgJiYgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmRpYWxvZyhcImNsb3NlXCIpO1xuICAgIH07XG4gICAgcmVkcmF3KCkge1xuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmVtcHR5KCk7XG5cbiAgICAgICAgdGhpcy5kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIGlmIChhLmluaXRpYXRpdmUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDE7XG4gICAgICAgICAgICBpZiAoYi5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpIHJldHVybiAtMTtcbiAgICAgICAgICAgIHJldHVybiBiLmluaXRpYXRpdmUgLSBhLmluaXRpYXRpdmU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5vd25lcnMgPT09IHVuZGVmaW5lZCkgZGF0YS5vd25lcnMgPSBbXTtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IGRhdGEuc3JjID09PSB1bmRlZmluZWQgPyAnJyA6ICQoYDxpbWcgc3JjPVwiJHtkYXRhLnNyY31cIiB3aWR0aD1cIjMwcHhcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj5gKTtcbiAgICAgICAgICAgIC8vIGNvbnN0IG5hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3NoLnV1aWR9XCIgdmFsdWU9XCIke3NoLm5hbWV9XCIgZGlzYWJsZWQ9J2Rpc2FibGVkJyBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cInZhbHVlXCIgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCIgdmFsdWU9XCIke2RhdGEuaW5pdGlhdGl2ZX1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiB2YWx1ZVwiPmApO1xuICAgICAgICAgICAgY29uc3QgdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xuICAgICAgICAgICAgY29uc3QgZ3JvdXAgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXVzZXJzXCI+PC9pPjwvZGl2PmApO1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlID0gJChgPGRpdiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiByZW1vdmVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS10cmFzaC1hbHRcIj48L2k+PC9kaXY+YCk7XG5cbiAgICAgICAgICAgIHZpc2libGUuY3NzKFwib3BhY2l0eVwiLCBkYXRhLnZpc2libGUgPyBcIjEuMFwiIDogXCIwLjNcIik7XG4gICAgICAgICAgICBncm91cC5jc3MoXCJvcGFjaXR5XCIsIGRhdGEuZ3JvdXAgPyBcIjEuMFwiIDogXCIwLjNcIik7XG4gICAgICAgICAgICBpZiAoIWRhdGEub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pIHtcbiAgICAgICAgICAgICAgICB2YWwucHJvcChcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgICAgICAgICAgICAgcmVtb3ZlLmNzcyhcIm9wYWNpdHlcIiwgXCIwLjNcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuYXBwZW5kKGltZykuYXBwZW5kKHZhbCkuYXBwZW5kKHZpc2libGUpLmFwcGVuZChncm91cCkuYXBwZW5kKHJlbW92ZSk7XG5cbiAgICAgICAgICAgIHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcbiAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSW5pdGlhdGl2ZWRpYWxvZyBjaGFuZ2UgdW5rbm93biB1dWlkP1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkLmluaXRpYXRpdmUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpIHx8IDA7XG4gICAgICAgICAgICAgICAgc2VsZi5hZGRJbml0aWF0aXZlKGQsIHRydWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHZpc2libGUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSkhO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgdmlzaWJsZSB1bmtub3duIHV1aWQ/XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBkLnZpc2libGUgPSAhZC52aXNpYmxlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZC52aXNpYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5jc3MoXCJvcGFjaXR5XCIsIDEuMCk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZUluaXRpYXRpdmVcIiwgZCk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGdyb3VwLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgZ3JvdXAgdW5rbm93biB1dWlkP1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZighZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgZC5ncm91cCA9ICFkLmdyb3VwO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZC5ncm91cClcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gdXVpZCk7XG4gICAgICAgICAgICAgICAgaWYgKGQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkluaXRpYXRpdmVkaWFsb2cgcmVtb3ZlIHVua25vd24gdXVpZD9cIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoIWQub3duZXJzLmluY2x1ZGVzKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKSAmJiAhZ2FtZU1hbmFnZXIuSVNfRE0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dXVpZH1dYCkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVJbml0aWF0aXZlKHV1aWQsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbmNvbnN0IHRvb2xzID0gW1xuICAgIHtuYW1lOiBcInNlbGVjdFwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiB0cnVlLCBoYXNEZXRhaWw6IGZhbHNlLCBjbHo6IFNlbGVjdFRvb2x9LFxuICAgIHtuYW1lOiBcInBhblwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgY2x6OiBQYW5Ub29sfSxcbiAgICB7bmFtZTogXCJkcmF3XCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGNsejogRHJhd1Rvb2x9LFxuICAgIHtuYW1lOiBcInJ1bGVyXCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IGZhbHNlLCBjbHo6IFJ1bGVyVG9vbH0sXG4gICAge25hbWU6IFwiZm93XCIsIHBsYXllclRvb2w6IGZhbHNlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBjbHo6IEZPV1Rvb2x9LFxuICAgIHtuYW1lOiBcIm1hcFwiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgY2x6OiBNYXBUb29sfSxcbl07IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcbmltcG9ydCB7IFBvaW50IH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHcybChvYmo6IFBvaW50KSB7XG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xuICAgIGNvbnN0IHBhblggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWDtcbiAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogKG9iai54ICsgcGFuWCkgKiB6LFxuICAgICAgICB5OiAob2JqLnkgKyBwYW5ZKSAqIHpcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3Mmx4KHg6IG51bWJlcikge1xuICAgIHJldHVybiB3Mmwoe3g6IHgsIHk6IDB9KS54O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdzJseSh5OiBudW1iZXIpIHtcbiAgICByZXR1cm4gdzJsKHt4OiAwLCB5OiB5fSkueTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHcybHooejogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHogKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3Rvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXREaXN0YW5jZShyOiBudW1iZXIpIHtcbiAgICByZXR1cm4gKHIgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdzJscihyOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdzJseihnZXRVbml0RGlzdGFuY2UocikpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsMncob2JqOiBQb2ludCkge1xuICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcbiAgICBjb25zdCBwYW5YID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblg7XG4gICAgY29uc3QgcGFuWSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZO1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IChvYmoueCAvIHopIC0gcGFuWCxcbiAgICAgICAgeTogKG9iai55IC8geikgLSBwYW5ZXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbDJ3eCh4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gbDJ3KHt4OiB4LCB5OiAwfSkueDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGwyd3koeTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIGwydyh7eDogMCwgeTogeX0pLnk7XG59IiwiaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZXNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQb2ludCB7XG4gICAgeDogbnVtYmVyO1xuICAgIHk6IG51bWJlcjtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWxwaFNvcnQoYTogc3RyaW5nLCBiOiBzdHJpbmcpIHtcbiAgICBpZiAoYS50b0xvd2VyQ2FzZSgpIDwgYi50b0xvd2VyQ2FzZSgpKVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgZWxzZVxuICAgICAgICByZXR1cm4gMTtcbn1cblxuLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuZXhwb3J0IGZ1bmN0aW9uIHV1aWR2NCgpIHtcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgT3JkZXJlZE1hcDxLLCBWPiB7XG4gICAga2V5czogS1tdID0gW107XG4gICAgdmFsdWVzOiBWW10gPSBbXTtcbiAgICBnZXQoa2V5OiBLKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlc1t0aGlzLmtleXMuaW5kZXhPZihrZXkpXTtcbiAgICB9XG4gICAgZ2V0SW5kZXhWYWx1ZShpZHg6IG51bWJlcikge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZXNbaWR4XTtcbiAgICB9XG4gICAgZ2V0SW5kZXhLZXkoaWR4OiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5c1tpZHhdO1xuICAgIH1cbiAgICBzZXQoa2V5OiBLLCB2YWx1ZTogVikge1xuICAgICAgICB0aGlzLmtleXMucHVzaChrZXkpO1xuICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgaW5kZXhPZihlbGVtZW50OiBLKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleXMuaW5kZXhPZihlbGVtZW50KTtcbiAgICB9XG4gICAgcmVtb3ZlKGVsZW1lbnQ6IEspIHtcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5pbmRleE9mKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLmtleXMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIHRoaXMudmFsdWVzLnNwbGljZShpZHgsIDEpO1xuICAgIH1cbn0iXSwic291cmNlUm9vdCI6IiJ9