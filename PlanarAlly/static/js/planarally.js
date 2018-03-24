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

/***/ "./PlanarAlly/client/src/geom.js":
/*!***************************************!*\
  !*** ./PlanarAlly/client/src/geom.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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

/***/ "./PlanarAlly/client/src/planarally.js":
/*!*********************************************!*\
  !*** ./PlanarAlly/client/src/planarally.js ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.js");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.js");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shapes */ "./PlanarAlly/client/src/shapes.js");



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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("add shape", { shape: shape.asDict(), temporary: temporary });
    gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
    this.invalidate(!sync);
};
LayerState.prototype.setShapes = function (shapes) {
    const t = [];
    const self = this;
    shapes.forEach(function (shape) {
        const sh = Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape, self);
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("remove shape", { shape: shape, temporary: temporary });
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
            if (Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(shape.x) > state.width || Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(shape.y) > state.height ||
                Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(shape.x + shape.w) < 0 || Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(shape.y + shape.h) < 0)
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
                ctx.strokeRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y), sel.w * z, sel.h * z);
                // topright
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y - 3), 6 * z, 6 * z);
                // topleft
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y - 3), 6 * z, 6 * z);
                // botright
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y + sel.h - 3), 6 * z, 6 * z);
                // botleft
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y + sel.h - 3), 6 * z, 6 * z);
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("moveShapeOrder", { shape: shape.asDict(), index: destinationIndex });
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
            const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2l"])(sh.center());
            const alm = 0.8 * Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lz"])(bb.w);
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
            const aura_length = Object(_units__WEBPACK_IMPORTED_MODULE_1__["getUnitDistance"])(aura.value);
            const center = sh.center();
            const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2l"])(center);
            const bbox = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Circle"](center.x, center.y, aura_length).getBoundingBox();
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
                        ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(center.x + aura_length * Math.cos(angle)), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(center.y + aura_length * Math.sin(angle)));
                    }
                    continue;
                }
                // If hit , first finish any ongoing arc, then move to the intersection point
                if (arc_start !== -1) {
                    ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lr"])(aura.value), arc_start, angle);
                    arc_start = -1;
                }
                let extraX = (shape_hit.w / 4) * Math.cos(angle);
                let extraY = (shape_hit.h / 4) * Math.sin(angle);
                // if (!shape_hit.contains(hit.intersect.x + extraX, hit.intersect.y + extraY, false)) {
                //     extraX = 0;
                //     extraY = 0;
                // }
                ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(hit.intersect.x + extraX), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(hit.intersect.y + extraY));
            }
            if (arc_start !== -1)
                ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lr"])(aura.value), arc_start, 2 * Math.PI);
            const alm = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lr"])(aura.value);
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
            layer.selectionStartPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
            layer.selectionHelper = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](layer.selectionStartPoint.x, layer.selectionStartPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
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
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
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
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    setSelectionInfo(sel);
                }
                layer.invalidate();
            }
            else if (layer.resizing) {
                if (layer.resizedir === 'nw') {
                    sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                    sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                    sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wx"])(mouse.x);
                    sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wy"])(mouse.y);
                }
                else if (layer.resizedir === 'ne') {
                    sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x);
                    sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                    sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wy"])(mouse.y);
                }
                else if (layer.resizedir === 'se') {
                    sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x);
                    sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y);
                }
                else if (layer.resizedir === 'sw') {
                    sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                    sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y);
                    sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wx"])(mouse.x);
                }
                sel.w /= z;
                sel.h /= z;
                if (sel !== layer.selectionHelper) {
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", {
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
                        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
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
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    const fillColor = this.fillColor.spectrum("get");
    const fill = fillColor === null ? tinycolor("transparent") : fillColor;
    const borderColor = this.borderColor.spectrum("get");
    const border = borderColor === null ? tinycolor("transparent") : borderColor;
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, fill.toRgbString(), border.toRgbString());
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
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.ruler = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Line"](this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Text"](this.startPoint.x, this.startPoint.y, "", "20px serif");
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
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.ruler.x2 = endPoint.x;
    this.ruler.y2 = endPoint.y;
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.ruler.asDict(), temporary: true });
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
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.text.asDict(), temporary: true });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, gameManager.fowColour.spectrum("get").toRgbString());
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
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
    layer.addShape(this.rect, false, false);
};
MapTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { 'gridColour': colour.toRgbString() });
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { 'fowColour': colour.toRgbString() });
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
    layer.addShape(Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape), false);
    layer.invalidate();
};
GameManager.prototype.moveShape = function (shape) {
    shape = Object.assign(gameManager.layerManager.UUIDMap.get(shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape, true));
    shape.checkLightSources();
    gameManager.layerManager.getLayer(shape.layer).onShapeMove(shape);
};
GameManager.prototype.updateShape = function (data) {
    const shape = Object.assign(gameManager.layerManager.UUIDMap.get(data.shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(data.shape, true));
    shape.checkLightSources();
    shape.setMovementBlock(shape.movementObstruction);
    if (data.redraw)
        gameManager.layerManager.getLayer(data.shape.layer).invalidate();
};
GameManager.prototype.setInitiative = function (data) {
    gameManager.initiativeTracker.data = data;
    gameManager.initiativeTracker.redraw();
    if (data.length > 0)
        gameManager.dialog("open");
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { zoomFactor: newZ, panX: gameManager.layerManager.panX, panY: gameManager.layerManager.panY });
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", data);
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", { uuid: uuid });
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", d);
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", d);
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
/* harmony default export */ __webpack_exports__["default"] = (gameManager);


/***/ }),

/***/ "./PlanarAlly/client/src/planarally.ts":
/*!*********************************************!*\
  !*** ./PlanarAlly/client/src/planarally.ts ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.js");
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.js");
/* harmony import */ var _shapes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./shapes */ "./PlanarAlly/client/src/shapes.js");



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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("add shape", { shape: shape.asDict(), temporary: temporary });
    gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
    this.invalidate(!sync);
};
LayerState.prototype.setShapes = function (shapes) {
    const t = [];
    const self = this;
    shapes.forEach(function (shape) {
        const sh = Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape, self);
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("remove shape", { shape: shape, temporary: temporary });
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
            if (Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(shape.x) > state.width || Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(shape.y) > state.height ||
                Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(shape.x + shape.w) < 0 || Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(shape.y + shape.h) < 0)
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
                ctx.strokeRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y), sel.w * z, sel.h * z);
                // topright
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y - 3), 6 * z, 6 * z);
                // topleft
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y - 3), 6 * z, 6 * z);
                // botright
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x + sel.w - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y + sel.h - 3), 6 * z, 6 * z);
                // botleft
                ctx.fillRect(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x - 3), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y + sel.h - 3), 6 * z, 6 * z);
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("moveShapeOrder", { shape: shape.asDict(), index: destinationIndex });
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
            const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2l"])(sh.center());
            const alm = 0.8 * Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lz"])(bb.w);
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
            const aura_length = Object(_units__WEBPACK_IMPORTED_MODULE_1__["getUnitDistance"])(aura.value);
            const center = sh.center();
            const lcenter = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2l"])(center);
            const bbox = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Circle"](center.x, center.y, aura_length).getBoundingBox();
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
                        ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(center.x + aura_length * Math.cos(angle)), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(center.y + aura_length * Math.sin(angle)));
                    }
                    continue;
                }
                // If hit , first finish any ongoing arc, then move to the intersection point
                if (arc_start !== -1) {
                    ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lr"])(aura.value), arc_start, angle);
                    arc_start = -1;
                }
                let extraX = (shape_hit.w / 4) * Math.cos(angle);
                let extraY = (shape_hit.h / 4) * Math.sin(angle);
                // if (!shape_hit.contains(hit.intersect.x + extraX, hit.intersect.y + extraY, false)) {
                //     extraX = 0;
                //     extraY = 0;
                // }
                ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(hit.intersect.x + extraX), Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(hit.intersect.y + extraY));
            }
            if (arc_start !== -1)
                ctx.arc(lcenter.x, lcenter.y, Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lr"])(aura.value), arc_start, 2 * Math.PI);
            const alm = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lr"])(aura.value);
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
            layer.selectionStartPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
            layer.selectionHelper = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](layer.selectionStartPoint.x, layer.selectionStartPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
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
        const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
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
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
                    setSelectionInfo(sel);
                }
                layer.invalidate();
            }
            else if (layer.resizing) {
                if (layer.resizedir === 'nw') {
                    sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                    sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                    sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wx"])(mouse.x);
                    sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wy"])(mouse.y);
                }
                else if (layer.resizedir === 'ne') {
                    sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x);
                    sel.h = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y) + sel.h * z - mouse.y;
                    sel.y = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wy"])(mouse.y);
                }
                else if (layer.resizedir === 'se') {
                    sel.w = mouse.x - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x);
                    sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y);
                }
                else if (layer.resizedir === 'sw') {
                    sel.w = Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2lx"])(sel.x) + sel.w * z - mouse.x;
                    sel.h = mouse.y - Object(_units__WEBPACK_IMPORTED_MODULE_1__["w2ly"])(sel.y);
                    sel.x = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2wx"])(mouse.x);
                }
                sel.w /= z;
                sel.h /= z;
                if (sel !== layer.selectionHelper) {
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: true });
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", {
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
                        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
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
                    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: sel.asDict(), temporary: false });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    const fillColor = this.fillColor.spectrum("get");
    const fill = fillColor === null ? tinycolor("transparent") : fillColor;
    const borderColor = this.borderColor.spectrum("get");
    const border = borderColor === null ? tinycolor("transparent") : borderColor;
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, fill.toRgbString(), border.toRgbString());
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
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.ruler = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Line"](this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Text"](this.startPoint.x, this.startPoint.y, "", "20px serif");
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
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.ruler.x2 = endPoint.x;
    this.ruler.y2 = endPoint.y;
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.ruler.asDict(), temporary: true });
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
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.text.asDict(), temporary: true });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, gameManager.fowColour.spectrum("get").toRgbString());
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
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("shapeMove", { shape: this.rect.asDict(), temporary: false });
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
    this.startPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
    this.rect = new _shapes__WEBPACK_IMPORTED_MODULE_2__["Rect"](this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
    layer.addShape(this.rect, false, false);
};
MapTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null)
        return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = Object(_units__WEBPACK_IMPORTED_MODULE_1__["l2w"])(layer.getMouse(e));
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { 'gridColour': colour.toRgbString() });
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { 'fowColour': colour.toRgbString() });
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
    layer.addShape(Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape), false);
    layer.invalidate();
};
GameManager.prototype.moveShape = function (shape) {
    shape = Object.assign(gameManager.layerManager.UUIDMap.get(shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(shape, true));
    shape.checkLightSources();
    gameManager.layerManager.getLayer(shape.layer).onShapeMove(shape);
};
GameManager.prototype.updateShape = function (data) {
    const shape = Object.assign(gameManager.layerManager.UUIDMap.get(data.shape.uuid), Object(_shapes__WEBPACK_IMPORTED_MODULE_2__["createShapeFromDict"])(data.shape, true));
    shape.checkLightSources();
    shape.setMovementBlock(shape.movementObstruction);
    if (data.redraw)
        gameManager.layerManager.getLayer(data.shape.layer).invalidate();
};
GameManager.prototype.setInitiative = function (data) {
    gameManager.initiativeTracker.data = data;
    gameManager.initiativeTracker.redraw();
    if (data.length > 0)
        gameManager.dialog("open");
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("set clientOptions", { zoomFactor: newZ, panX: gameManager.layerManager.panX, panY: gameManager.layerManager.panY });
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
        _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", data);
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", { uuid: uuid });
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", d);
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
            _socket__WEBPACK_IMPORTED_MODULE_0__["default"].emit("updateInitiative", d);
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
/* harmony default export */ __webpack_exports__["default"] = (gameManager);


/***/ }),

/***/ "./PlanarAlly/client/src/shapes.js":
/*!*****************************************!*\
  !*** ./PlanarAlly/client/src/shapes.js ***!
  \*****************************************/
/*! exports provided: BoundingRect, Rect, Circle, Line, Text, Asset, createShapeFromDict */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "BoundingRect", function() { return BoundingRect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Rect", function() { return Rect; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Circle", function() { return Circle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Line", function() { return Line; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Text", function() { return Text; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Asset", function() { return Asset; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createShapeFromDict", function() { return createShapeFromDict; });
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.js");
/* harmony import */ var _socket__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./socket */ "./PlanarAlly/client/src/socket.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils */ "./PlanarAlly/client/src/utils.js");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./geom */ "./PlanarAlly/client/src/geom.js");
/* harmony import */ var _geom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_geom__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _units__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./units */ "./PlanarAlly/client/src/units.js");





const $menu = $('#contextMenu');
function Shape() {
    this.layer = null;
    this.name = 'Unknown shape';
    this.trackers = [];
    this.auras = [];
    this.owners = [];
    this.visionObstruction = false;
    this.movementObstruction = false;
}
Shape.prototype.getBoundingBox = function () { };
Shape.prototype.checkLightSources = function () {
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
};
Shape.prototype.setMovementBlock = function (blocksMovement) {
    this.movementObstruction = blocksMovement || false;
    const vo_i = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.indexOf(this.uuid);
    if (this.movementObstruction && vo_i === -1)
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.push(this.uuid);
    else if (!this.movementObstruction && vo_i >= 0)
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].movementblockers.splice(vo_i, 1);
};
Shape.prototype.ownedBy = function (username) {
    if (username === undefined)
        username = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].username;
    return _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM || this.owners.includes(username);
};
Shape.prototype.onMouseUp = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
    // const cog = $(`<div id="shapeselectioncog-${this.uuid}"><i class='fa fa-cog' style='left:${this.x};top:${this.y + this.h + 10};z-index:50;position:absolute;'></i></div>`);
    // cog.on("click", function () {
    //     shapeSelectionDialog.dialog( "open" );
    // });
    // $("body").append(cog);
};
Shape.prototype.onSelection = function () {
    if (!this.trackers.length || this.trackers[this.trackers.length - 1].name !== '' || this.trackers[this.trackers.length - 1].value !== '')
        this.trackers.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(), name: '', value: '', maxvalue: '', visible: false });
    if (!this.auras.length || this.auras[this.auras.length - 1].name !== '' || this.auras[this.auras.length - 1].value !== '')
        this.auras.push({ uuid: Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])(), name: '', value: '', dim: '', lightSource: false, colour: 'rgba(0,0,0,0)', visible: false });
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
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(au.layer).invalidate();
            });
            aura_dimval.on("change", function () {
                const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                au.dim = $(this).val();
                const val = au.dim ? `${au.value}/${au.dim}` : au.value;
                $(`#selection-aura-${au.uuid}-value`).text(val);
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(au.layer).invalidate();
            });
            aura_remove.on("click", function () {
                const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                if (au.name === '' && au.value === '')
                    return;
                $(`[data-uuid=${au.uuid}]`).remove();
                self.auras.splice(self.auras.indexOf(au), 1);
                self.checkLightSources();
                _socket__WEBPACK_IMPORTED_MODULE_1__["default"].emit("updateShape", { shape: self.asDict(), redraw: true });
                _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(au.layer).invalidate();
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
                    fowl.invalidate();
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
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(self.layer).invalidate();
    });
};
Shape.prototype.onSelectionLoss = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
    $("#selection-menu").hide();
};
Shape.prototype.onRemove = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
};
Shape.prototype.asDict = function () {
    return Object.assign({}, this);
};
Shape.prototype.draw = function (ctx) {
    if (this.layer === 'fow') {
        this.fill = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].fowColour.spectrum("get").toRgbString();
    }
    if (this.globalCompositeOperation !== undefined)
        ctx.globalCompositeOperation = this.globalCompositeOperation;
    else
        ctx.globalCompositeOperation = "source-over";
    this.drawAuras(ctx);
};
Shape.prototype.drawAuras = function (ctx) {
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
};
Shape.prototype.contains = function () {
    return false;
};
Shape.prototype.showContextMenu = function (mouse) {
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
};
function BoundingRect(x, y, w, h) {
    this.type = "boundrect";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}
BoundingRect.prototype.contains = function (mx, my, world) {
    if (world === undefined || world === true) {
        mx = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wx"])(mx);
        my = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wy"])(my);
    }
    return this.x <= mx && (this.x + this.w) >= mx &&
        this.y <= my && (this.y + this.h) >= my;
};
BoundingRect.prototype.intersectsWith = function (other) {
    return !(other.x >= this.x + this.w ||
        other.x + other.w <= this.x ||
        other.y >= this.y + this.h ||
        other.y + other.h <= this.y);
};
BoundingRect.prototype.getIntersectWithLine = function (line) {
    const lines = [
        Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x, y: this.y }, { x: this.x + this.w, y: this.y }, line.start, line.end),
        Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x + this.w, y: this.y }, { x: this.x + this.w, y: this.y + this.h }, line.start, line.end),
        Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x, y: this.y }, { x: this.x, y: this.y + this.h }, line.start, line.end),
        Object(_geom__WEBPACK_IMPORTED_MODULE_3__["getLinesIntersectPoint"])({ x: this.x, y: this.y + this.h }, { x: this.x + this.w, y: this.y + this.h }, line.start, line.end)
    ];
    let min_d = Infinity;
    let min_i = null;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === null)
            continue;
        const d = getPointDistance(line.start, lines[i]);
        if (min_d > d) {
            min_d = d;
            min_i = lines[i];
        }
    }
    return { intersect: min_i, distance: min_d };
};
function Rect(x, y, w, h, fill, border, uuid) {
    Shape.call(this);
    this.type = "rect";
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.fill = fill || '#000';
    this.border = border || "rgba(0, 0, 0, 0)";
    this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
}
Rect.prototype = Object.create(Shape.prototype);
Rect.prototype.getBoundingBox = function () {
    return new BoundingRect(this.x, this.y, this.w, this.h);
};
Rect.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.fillStyle = this.fill;
    const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
    const loc = Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2l"])({ x: this.x, y: this.y });
    ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
    if (this.border !== "rgba(0, 0, 0, 0)") {
        ctx.strokeStyle = this.border;
        ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
    }
};
Rect.prototype.contains = function (mx, my, world) {
    if (world === undefined || world === true) {
        mx = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wx"])(mx);
        my = Object(_units__WEBPACK_IMPORTED_MODULE_4__["l2wy"])(my);
    }
    return this.x <= mx && (this.x + this.w) >= mx &&
        this.y <= my && (this.y + this.h) >= my;
};
Rect.prototype.inCorner = function (mx, my, corner) {
    switch (corner) {
        case 'ne':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + 3);
        case 'nw':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + 3);
        case 'sw':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h + 3);
        case 'se':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h + 3);
        default:
            return false;
    }
};
Rect.prototype.getCorner = function (mx, my) {
    if (this.inCorner(mx, my, "ne"))
        return "ne";
    else if (this.inCorner(mx, my, "nw"))
        return "nw";
    else if (this.inCorner(mx, my, "se"))
        return "se";
    else if (this.inCorner(mx, my, "sw"))
        return "sw";
};
Rect.prototype.center = function (centerPoint) {
    if (centerPoint === undefined)
        return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
    this.x = centerPoint.x - this.w / 2;
    this.y = centerPoint.y - this.h / 2;
};
function Circle(x, y, r, fill, border, uuid) {
    Shape.call(this);
    this.type = "circle";
    this.x = x || 0;
    this.y = y || 0;
    this.r = r || 1;
    this.fill = fill || '#000';
    this.border = border || "rgba(0, 0, 0, 0)";
    this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
}
Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.getBoundingBox = function () {
    return new BoundingRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
};
Circle.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
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
};
Circle.prototype.contains = function (mx, my) {
    return (mx - Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x)) ** 2 + (my - Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y)) ** 2 < this.r ** 2;
};
Circle.prototype.inCorner = function (mx, my, corner) {
    switch (corner) {
        case 'ne':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + 3);
        case 'nw':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + 3);
        case 'sw':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h + 3);
        case 'se':
            return Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w - 3) <= mx && mx <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x + this.w + 3) && Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h - 3) <= my && my <= Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y + this.h + 3);
        default:
            return false;
    }
};
Circle.prototype.getCorner = function (mx, my) {
    if (this.inCorner(mx, my, "ne"))
        return "ne";
    else if (this.inCorner(mx, my, "nw"))
        return "nw";
    else if (this.inCorner(mx, my, "se"))
        return "se";
    else if (this.inCorner(mx, my, "sw"))
        return "sw";
};
Circle.prototype.center = function (centerPoint) {
    if (centerPoint === undefined)
        return { x: this.x, y: this.y };
    this.x = centerPoint.x;
    this.y = centerPoint.y;
};
function Line(x1, y1, x2, y2, uuid) {
    Shape.call(this);
    this.type = "line";
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
}
Line.prototype = Object.create(Shape.prototype);
Line.prototype.getBoundingBox = function () {
    return new BoundingRect(Math.min(this.x1, this.x2), Math.min(this.y1, this.y2), Math.abs(this.x1 - this.x2), Math.abs(this.y1 - this.y2));
};
Line.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.beginPath();
    ctx.moveTo(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x1), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y1));
    ctx.lineTo(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x2), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y2));
    ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
};
function Text(x, y, text, font, angle, uuid) {
    Shape.call(this);
    this.type = "text";
    this.x = x;
    this.y = y;
    this.text = text;
    this.font = font;
    this.angle = angle || 0;
    this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
}
Text.prototype = Object.create(Shape.prototype);
Text.prototype.getBoundingBox = function () {
    return new BoundingRect(this.x, this.y, 5, 5); // Todo: fix this bounding box
};
Text.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.font = this.font;
    ctx.save();
    ctx.translate(Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y));
    ctx.rotate(this.angle);
    ctx.textAlign = "center";
    ctx.fillText(this.text, 0, -5);
    ctx.restore();
};
function Asset(img, x, y, w, h, uuid) {
    Shape.call(this);
    this.type = "asset";
    this.uuid = uuid || Object(_utils__WEBPACK_IMPORTED_MODULE_2__["uuidv4"])();
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}
Asset.prototype = Object.create(Rect.prototype);
Asset.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    const z = _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.zoomFactor;
    ctx.drawImage(this.img, Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2lx"])(this.x), Object(_units__WEBPACK_IMPORTED_MODULE_4__["w2ly"])(this.y), this.w * z, this.h * z);
};
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
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].layerManager.getLayer(shape.layer).invalidate();
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
            _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].initiativeTracker.addInitiative({ uuid: shape.uuid, visible: !_planarally__WEBPACK_IMPORTED_MODULE_0__["default"].IS_DM, group: false, src: shape.src, owners: shape.owners }, true);
            break;
    }
    $menu.hide();
}


/***/ }),

/***/ "./PlanarAlly/client/src/socket.js":
/*!*****************************************!*\
  !*** ./PlanarAlly/client/src/socket.js ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./PlanarAlly/client/src/utils.js");


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
        _planarally__WEBPACK_IMPORTED_MODULE_0__["default"].setupTools();
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
    layer.invalidate();
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

/***/ "./PlanarAlly/client/src/units.js":
/*!****************************************!*\
  !*** ./PlanarAlly/client/src/units.js ***!
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
/* harmony import */ var _planarally__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./planarally */ "./PlanarAlly/client/src/planarally.js");

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

/***/ "./PlanarAlly/client/src/utils.js":
/*!****************************************!*\
  !*** ./PlanarAlly/client/src/utils.js ***!
  \****************************************/
/*! exports provided: alphSort, uuidv4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "alphSort", function() { return alphSort; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "uuidv4", function() { return uuidv4; });
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

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vUGxhbmFyQWxseS9jbGllbnQvc3JjL2dlb20udHMiLCJ3ZWJwYWNrOi8vLy4vUGxhbmFyQWxseS9jbGllbnQvc3JjL3BsYW5hcmFsbHkudHMiLCJ3ZWJwYWNrOi8vLy4vUGxhbmFyQWxseS9jbGllbnQvc3JjL3NoYXBlcy50cyIsIndlYnBhY2s6Ly8vLi9QbGFuYXJBbGx5L2NsaWVudC9zcmMvc29ja2V0LnRzIiwid2VicGFjazovLy8uL1BsYW5hckFsbHkvY2xpZW50L3NyYy91bml0cy50cyIsIndlYnBhY2s6Ly8vLi9QbGFuYXJBbGx5L2NsaWVudC9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25FQSxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQzFCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUTtRQUN6QyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxH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QU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RCxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxHQUFHLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3ZFLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNiLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ25CLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RELEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7UUFDbkIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzFCLENBQUMsQ0FBQztBQUNGLFlBQVksQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLFVBQVUsUUFBUTtJQUNuRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7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QUFDLENBQUM7b0JBQzNCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0QixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFL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RyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xELE1BQU0sUUFBUSxHQUFHLGtEQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELCtDQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0lBQ3hFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFDRixRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRztJQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNyQixDQUFDLENBQUM7QUFFRjtJQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDekMsaUNBQWlDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hELElBQUksQ0FBQyxVQUFVLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLDRDQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksNENBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDN0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUM7QUFDRixTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFD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LEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELDJFQUEyRTtJQUMzRSxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDdkIsQ0FBQyxDQUFDO0FBQ0YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUc7SUFDMUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUM7UUFBQyxNQUFNLENBQUM7SUFDckMsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9CLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDO0lBQ1gsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2xGLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2xGLEtBQUssQ0FBQyxXQUFX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Q0FBQztBQUNGLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHO0lBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDO0lBQzlDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQzNDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQzNDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNkLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUVoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDdEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RCxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFF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LENBQUMsQ0FBQyxDQUFDO1FBRXhDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0UsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1RSxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDNUUsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxRQUFRLEdBQUcsS0FBSyxD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QUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxtREFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsbURBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDMUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5QixHQUFHLENBQUMsQ0FBQyxHQUFHLG1EQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUNELEdBQUcsQ0FB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USxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELCtDQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0lBQ3hFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFDRixRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRztJQUMzQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUNyQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztJQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNyQixDQUFDLENBQUM7QUFFRjtJQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDekMsaUNBQWlDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hELElBQUksQ0FBQyxVQUFVLEdBQUcsa0RBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLDRDQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksNENBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDN0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzVDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUM7QUFDRixTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7SUFDekMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUM7UUFBQyxNQUFNLENBQUM7SUFDckMsaUNBQWlDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hELE1BQU0sUUFBUSxHQUFHLGtEQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMzQiwrQ0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUV4RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNqSixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNqRSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2pF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UUFBUSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDO1FBQ3JJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxFQUFFLHFEQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztJQUM1RixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDdEgsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLEVBQUUscURBQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztJQUNqSSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQzFDLFFBQVEsQ0FB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SUFBSTtZQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsSSxLQUFLLElBQUk7WUFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNoSCxLQUFLLElBQUk7WUFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEksS0FBSyxJQUFJO1lBQ0wsTUFBTSxDQUFDLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwSjtZQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDckIsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsRUFBRSxFQUFFLEVBQUU7SUFDdkMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDcEIsQ0FBQyxDQUFDO0FBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxXQUFXO0lBQ3pDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7UUFDMUIsTUFBTSxDQUFDLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQztJQUM1RCxJQUFJLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEMsSUFBSSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQztBQUVJLGdCQUFpQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFLLEVBQUUsTUFBTyxFQUFFLElBQUs7SUFDakQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztJQUNyQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxNQUFNLENBQUM7SUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksa0JBQWtCLENBQUM7SUFDM0MsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUkscURBQU0sRUFBRSxDQUFDO0FBQ2pDLENBQUM7QUFFRCxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xELE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHO0lBQzlCLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdEYsQ0FBQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxHQUFHO0lBQ2pDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDckMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2hCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUMxQixNQUFNLEdBQUcsR0FBRyxrREFBRyxDQUFDLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDOUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ1gsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDckMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2hCLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUM5QixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNqQixDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxFQUFFLEVBQUUsRUFBRTtJQUN4QyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0UsQ0FBQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU07SUFDaEQsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNiLEtBQUssSUFBSTtZQUNMLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsSSxLQUFLLElBQUk7WUFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNoSCxLQUFLLElBQUk7WUFDTCxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEksS0FBSyxJQUFJO1lBQ0wsTUFBTSxDQUFDLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxtREFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwSjtZQUNJLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDckIsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUNGLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVUsRUFBRSxFQUFFLEVBQUU7SUFDekMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDcEIsQ0FBQyxDQUFDO0FBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxXQUFXO0lBQzNDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7UUFDMUIsTUFBTSxDQUFDLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUMsQ0FBQztJQUNsQyxJQUFJLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDdkIsSUFBSSxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQztBQUVJLGNBQWUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUs7SUFDdEMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztJQUNuQixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLHFEQUFNLEVBQUUsQ0FBQztBQUNqQyxDQUFDO0FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsR0FBRztJQUM1QixNQUFNLENBQUMsSUFBSSxZQUFZLENBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQzlCLENBQUM7QUFDTixDQUFDLENBQUM7QUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxVQUFVLEdBQUc7SUFDL0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNyQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDaEIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxtREFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxtREFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLEdBQUcsQ0FBQyxNQUFNLENBQUMsbURBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6QyxHQUFHLENBQUMsV0FBVyxHQUFHLG9CQUFvQixDQUFDO0lBQ3ZDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNqQixDQUFDLENBQUM7QUFFSSxjQUFlLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFNLEVBQUUsSUFBSztJQUNoRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO0lBQ25CLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUkscURBQU0sRUFBRSxDQUFDO0FBQ2pDLENBQUM7QUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHO0lBQzVCLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsOEJBQThCO0FBQ2pGLENBQUMsQ0FBQztBQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVUsR0FBRztJQUMvQixLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNyQixHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDWCxHQUFHLENBQUMsU0FBUyxDQUFDLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLG1EQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkIsR0FBRyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDekIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9CLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNsQixDQUFDLENBQUM7QUFFSSxlQUFnQixHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUs7SUFDeEMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztJQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxxREFBTSxFQUFFLENBQUM7SUFDN0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDZixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLENBQUM7QUFFRCxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2hELEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVUsR0FBRztJQUNoQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sQ0FBQyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQztJQUM5QyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsbURBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNoRixDQUFDLENBQUM7QUFHSSw2QkFBOEIsS0FBSyxFQUFFLEtBQU07SUFDN0MsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQztRQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksbURBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0QsTUFBTSxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTVELElBQUksRUFBRSxDQUFDO0lBRVAsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUM7UUFBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1FBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQztRQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLENBQUM7UUFBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QyxHQUFHLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDcEIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNiLEdBQUcsQ0FBQyxNQUFNLEdBQUc7WUFDVCxtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hFLENBQUMsQ0FBQztJQUNOLENBQUM7SUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO0FBQ2QsQ0FBQztBQUVELDJCQUEyQixJQUFJLEVBQUUsS0FBSztJQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLE1BQU0sS0FBSyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xELE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDYixLQUFLLGFBQWE7WUFDZCxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hFLEtBQUssQ0FBQztRQUNWLEtBQUssWUFBWTtZQUNiLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyQyxLQUFLLENBQUM7UUFDVixLQUFLLFVBQVU7WUFDWCxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQixtREFBVyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUUsS0FBSyxDQUFDO1FBQ1YsS0FBSyxlQUFlO1lBQ2hCLG1EQUFXLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUN2QyxFQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLG1EQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvRyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBQ0QsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2pCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1dEJzQztBQUNOO0FBRWpDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztBQUMxRSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxDQUFDO0FBQzVGLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFO0lBQ2pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRTtJQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxXQUFXO0lBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDO0FBQ3ZDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsVUFBVSxRQUFRO0lBQ3hDLG1EQUFXLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUNoQyxtREFBVyxDQUFDLEtBQUssR0FBRyxRQUFRLEtBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztRQUNoRCxtREFBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxVQUFVLE9BQU87SUFDNUMsbURBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsVUFBVSxPQUFPO0lBQzlDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQVUsTUFBTTtJQUNwQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ1YsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRVgsTUFBTSxPQUFPLEdBQUcsVUFBVSxLQUFLLEVBQUUsSUFBSTtRQUNqQyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxLQUFLLEVBQUUsR0FBRztZQUNoQyxDQUFDLElBQUksNEJBQTRCLEdBQUcsR0FBRyxHQUFHLHdFQUF3RSxDQUFDO1lBQ25ILE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNqQyxDQUFDLElBQUksY0FBYyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsK0NBQVEsQ0FBQyxDQUFDO1FBQzNCLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSztZQUMvQixDQUFDLElBQUksNERBQTRELEdBQUcsSUFBSSxHQUFHLEtBQUssR0FBRyxlQUFlLEdBQUcsS0FBSyxHQUFHLGtDQUFrQyxDQUFDO1FBQ3BKLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1YsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUN0QixNQUFNLEVBQUUsT0FBTztRQUNmLFFBQVEsRUFBRSxRQUFRO0tBQ3JCLENBQUMsQ0FBQztJQUNILENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHO1FBQzlCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ2hCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUN4QyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxhQUFhO0lBQzNDLG1EQUFXLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQztBQUN6QyxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLFVBQVUsUUFBUTtJQUN4QyxtREFBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFVLEtBQUs7SUFDbEMsbURBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxVQUFVLEtBQUs7SUFDckMsTUFBTSxLQUFLLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3RCxLQUFLLENBQUMsV0FBVyxDQUFDLG1EQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNFLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxJQUFJO0lBQ3RDLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQyxtREFBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNqSixDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLFVBQVUsS0FBSztJQUNsQyxtREFBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLFVBQVUsSUFBSTtJQUNuQyxtREFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQztBQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxJQUFJO0lBQ3hDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtREFBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsbURBQVcsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEgsbURBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRSxJQUFJO1FBQ0EsbURBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2pFLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsVUFBVSxJQUFJO0lBQ3JDLG1EQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQyxDQUFDO0FBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxVQUFVLE1BQU07SUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEtBQUs7UUFDMUIsbURBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUgsK0RBQWUsTUFBTSxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMvRmlCO0FBRWpDLGFBQWMsR0FBRztJQUNuQixNQUFNLENBQUMsR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7SUFDOUMsTUFBTSxJQUFJLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO0lBQzNDLE1BQU0sSUFBSSxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQztJQUMzQyxNQUFNLENBQUM7UUFDSCxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDckIsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ3hCO0FBQ0wsQ0FBQztBQUVLLGNBQWUsQ0FBQztJQUNsQixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUVLLGNBQWUsQ0FBQztJQUNsQixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUVLLGNBQWUsQ0FBQztJQUNsQixNQUFNLENBQUMsQ0FBQyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQztBQUNuRCxDQUFDO0FBRUsseUJBQTBCLENBQUM7SUFDN0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQztBQUN2RixDQUFDO0FBRUssY0FBZSxDQUFDO0lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFFSyxhQUFjLEdBQUc7SUFDbkIsTUFBTSxDQUFDLEdBQUcsbURBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDO0lBQzlDLE1BQU0sSUFBSSxHQUFHLG1EQUFXLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQztJQUMzQyxNQUFNLElBQUksR0FBRyxtREFBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDM0MsTUFBTSxDQUFDO1FBQ0gsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJO1FBQ3JCLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSTtLQUN4QjtBQUNMLENBQUM7QUFFSyxjQUFlLENBQUM7SUFDbEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFFSyxjQUFlLENBQUM7SUFDbEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUNoREQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsQyIsImZpbGUiOiJwbGFuYXJhbGx5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vUGxhbmFyQWxseS9jbGllbnQvc3JjL3BsYW5hcmFsbHkudHNcIik7XG4iLCJmdW5jdGlvbiBwb2ludEluTGluZShwLCBsMSwgbDIpIHtcclxuICAgIHJldHVybiBwLnggPj0gTWF0aC5taW4obDEueCwgbDIueCkgLSAwLjAwMDAwMSAmJlxyXG4gICAgICAgIHAueCA8PSBNYXRoLm1heChsMS54LCBsMi54KSArIDAuMDAwMDAxICYmXHJcbiAgICAgICAgcC55ID49IE1hdGgubWluKGwxLnksIGwyLnkpIC0gMC4wMDAwMDEgJiZcclxuICAgICAgICBwLnkgPD0gTWF0aC5tYXgobDEueSwgbDIueSkgKyAwLjAwMDAwMTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9pbnRJbkxpbmVzKHAsIHMxLCBlMSwgczIsIGUyKSB7XHJcbiAgICByZXR1cm4gcG9pbnRJbkxpbmUocCwgczEsIGUxKSAmJiBwb2ludEluTGluZShwLCBzMiwgZTIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGluZXNJbnRlcnNlY3RQb2ludChzMSwgZTEsIHMyLCBlMil7XHJcbiAgICAvLyBjb25zdCBzMSA9IE1hdGgubWluKFMxLCApXHJcbiAgICBjb25zdCBBMSA9IGUxLnktczEueTtcclxuICAgIGNvbnN0IEIxID0gczEueC1lMS54O1xyXG4gICAgY29uc3QgQTIgPSBlMi55LXMyLnk7XHJcbiAgICBjb25zdCBCMiA9IHMyLngtZTIueDtcclxuXHJcbiAgICAvLyBHZXQgZGVsdGEgYW5kIGNoZWNrIGlmIHRoZSBsaW5lcyBhcmUgcGFyYWxsZWxcclxuICAgIGNvbnN0IGRlbHRhID0gQTEqQjIgLSBBMipCMTtcclxuICAgIGlmKGRlbHRhID09PSAwKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgY29uc3QgQzIgPSBBMipzMi54K0IyKnMyLnk7XHJcbiAgICBjb25zdCBDMSA9IEExKnMxLngrQjEqczEueTtcclxuICAgIC8vaW52ZXJ0IGRlbHRhIHRvIG1ha2UgZGl2aXNpb24gY2hlYXBlclxyXG4gICAgY29uc3QgaW52ZGVsdGEgPSAxL2RlbHRhO1xyXG5cclxuICAgIGNvbnN0IGludGVyc2VjdCA9IHt4OiAoQjIqQzEgLSBCMSpDMikqaW52ZGVsdGEsIHk6IChBMSpDMiAtIEEyKkMxKSppbnZkZWx0YX07XHJcbiAgICBpZiAoIXBvaW50SW5MaW5lcyhpbnRlcnNlY3QsIHMxLCBlMSwgczIsIGUyKSlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIHJldHVybiBpbnRlcnNlY3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQb2ludERpc3RhbmNlKHAxLCBwMikge1xyXG4gICAgY29uc3QgYSA9IHAxLnggLSBwMi54O1xyXG4gICAgY29uc3QgYiA9IHAxLnkgLSBwMi55O1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCggYSphICsgYipiICk7XHJcbn0iLCJpbXBvcnQgc29ja2V0IGZyb20gJy4vc29ja2V0J1xyXG5pbXBvcnQge3cybCwgdzJseCwgdzJseSwgdzJseiwgdzJsciwgbDJ3LCBsMnd4LCBsMnd5LCBnZXRVbml0RGlzdGFuY2V9IGZyb20gXCIuL3VuaXRzXCI7XHJcbmltcG9ydCB7Q2lyY2xlLCBSZWN0LCBBc3NldCwgVGV4dCwgTGluZSwgY3JlYXRlU2hhcGVGcm9tRGljdH0gZnJvbSBcIi4vc2hhcGVzXCI7XHJcblxyXG4vLyBSZW1vdmVzIHZpb2xhdGlvbiBlcnJvcnMgb24gdG91Y2hzdGFydD8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNDYwOTQ5MTIvYWRkZWQtbm9uLXBhc3NpdmUtZXZlbnQtbGlzdGVuZXItdG8tYS1zY3JvbGwtYmxvY2tpbmctdG91Y2hzdGFydC1ldmVudFxyXG4vLyBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGR1ZSB0byB0aGUgc3BlY3RydW0gY29sb3IgcGlja2VyXHJcblxyXG4vLyAkLmV2ZW50cy5zcGVjaWFsLnRvdWNoc3RhcnQgPSB7XHJcbi8vICAgICBzZXR1cDogZnVuY3Rpb24gKF8sIG5zLCBoYW5kbGUpIHtcclxuLy8gICAgICAgICBpZiAobnMuaW5jbHVkZXMoXCJub1ByZXZlbnREZWZhdWx0XCIpKSB7XHJcbi8vICAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgaGFuZGxlLCB7cGFzc2l2ZTogZmFsc2V9KTtcclxuLy8gICAgICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIGhhbmRsZSwge3Bhc3NpdmU6IHRydWV9KTtcclxuLy8gICAgICAgICB9XHJcbi8vICAgICB9XHJcbi8vIH07XHJcblxyXG5sZXQgYm9hcmRfaW5pdGlhbGlzZWQgPSBmYWxzZTtcclxuXHJcblxyXG4vLyAqKioqIHNwZWNpZmljIExheWVyIFN0YXRlIE1hbmFnZW1lbnRcclxuXHJcbmZ1bmN0aW9uIExheWVyU3RhdGUoY2FudmFzLCBuYW1lKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xyXG4gICAgdGhpcy5jdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICBpZiAoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgIHRoaXMuc3R5bGVQYWRkaW5nTGVmdCA9IHBhcnNlSW50KGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoY2FudmFzLCBudWxsKVsncGFkZGluZ0xlZnQnXSwgMTApIHx8IDA7XHJcbiAgICAgICAgdGhpcy5zdHlsZVBhZGRpbmdUb3AgPSBwYXJzZUludChkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGNhbnZhcywgbnVsbClbJ3BhZGRpbmdUb3AnXSwgMTApIHx8IDA7XHJcbiAgICAgICAgdGhpcy5zdHlsZUJvcmRlckxlZnQgPSBwYXJzZUludChkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGNhbnZhcywgbnVsbClbJ2JvcmRlckxlZnRXaWR0aCddLCAxMCkgfHwgMDtcclxuICAgICAgICB0aGlzLnN0eWxlQm9yZGVyVG9wID0gcGFyc2VJbnQoZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShjYW52YXMsIG51bGwpWydib3JkZXJUb3BXaWR0aCddLCAxMCkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBodG1sID0gZG9jdW1lbnQuYm9keTtcclxuICAgIHRoaXMuaHRtbFRvcCA9IGh0bWwub2Zmc2V0VG9wO1xyXG4gICAgdGhpcy5odG1sTGVmdCA9IGh0bWwub2Zmc2V0TGVmdDtcclxuXHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXM7XHJcblxyXG4gICAgLy8gV2hlbiBzZXQgdG8gZmFsc2UsIHRoZSBsYXllciB3aWxsIGJlIHJlZHJhd24gb24gdGhlIG5leHQgdGlja1xyXG4gICAgdGhpcy52YWxpZCA9IGZhbHNlO1xyXG4gICAgLy8gVGhlIGNvbGxlY3Rpb24gb2Ygc2hhcGVzIHRoYXQgdGhpcyBsYXllciBjb250YWlucy5cclxuICAgIC8vIFRoZXNlIGFyZSBvcmRlcmVkIG9uIGEgZGVwdGggYmFzaXMuXHJcbiAgICB0aGlzLnNoYXBlcyA9IG5ldyBPcmRlcmVkTWFwKCk7XHJcblxyXG4gICAgLy8gU3RhdGUgdmFyaWFibGVzXHJcbiAgICB0aGlzLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLnJlc2l6aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLnBhbm5pbmcgPSBmYWxzZTtcclxuICAgIHRoaXMuc2VsZWN0aW5nID0gZmFsc2U7XHJcblxyXG4gICAgLy8gVGhpcyBpcyBhIGhlbHBlciB0byBpZGVudGlmeSB3aGljaCBjb3JuZXIgb3IgbW9yZSBzcGVjaWZpY2FsbHkgd2hpY2ggcmVzaXplIGRpcmVjdGlvbiBpcyBiZWluZyB1c2VkLlxyXG4gICAgdGhpcy5yZXNpemVkaXIgPSAnJztcclxuXHJcbiAgICAvLyBUaGlzIGlzIGEgcmVmZXJlbmNlIHRvIGFuIG9wdGlvbmFsIHJlY3Rhbmd1bGFyIG9iamVjdCB0aGF0IGlzIHVzZWQgdG8gc2VsZWN0IG11bHRpcGxlIHRva2Vuc1xyXG4gICAgdGhpcy5zZWxlY3Rpb25IZWxwZXIgPSBudWxsO1xyXG4gICAgdGhpcy5zZWxlY3Rpb25TdGFydFBvaW50ID0gbnVsbDtcclxuXHJcbiAgICAvLyBDb2xsZWN0aW9uIG9mIHNoYXBlcyB0aGF0IGFyZSBjdXJyZW50bHkgc2VsZWN0ZWRcclxuICAgIHRoaXMuc2VsZWN0aW9uID0gW107XHJcblxyXG4gICAgLy8gQmVjYXVzZSB3ZSBuZXZlciBkcmFnIGZyb20gdGhlIGFzc2V0J3MgKDAsIDApIGNvb3JkIGFuZCB3YW50IGEgc21vb3RoZXIgZHJhZyBleHBlcmllbmNlXHJcbiAgICAvLyB3ZSBrZWVwIHRyYWNrIG9mIHRoZSBhY3R1YWwgb2Zmc2V0IHdpdGhpbiB0aGUgYXNzZXQuXHJcbiAgICB0aGlzLmRyYWdvZmZ4ID0gMDtcclxuICAgIHRoaXMuZHJhZ29mZnkgPSAwO1xyXG5cclxuICAgIC8vIEV4dHJhIHNlbGVjdGlvbiBoaWdobGlnaHRpbmcgc2V0dGluZ3NcclxuICAgIHRoaXMuc2VsZWN0aW9uQ29sb3IgPSAnI0NDMDAwMCc7XHJcbiAgICB0aGlzLnNlbGVjdGlvbldpZHRoID0gMjtcclxufVxyXG5cclxuTGF5ZXJTdGF0ZS5wcm90b3R5cGUuaW52YWxpZGF0ZSA9IGZ1bmN0aW9uIChza2lwTGlnaHRVcGRhdGUpIHtcclxuICAgIHRoaXMudmFsaWQgPSBmYWxzZTtcclxuICAgIHNraXBMaWdodFVwZGF0ZSA9IHNraXBMaWdodFVwZGF0ZSB8fCBmYWxzZTtcclxuICAgIGlmKCFza2lwTGlnaHRVcGRhdGUgJiYgdGhpcy5uYW1lICE9PSBcImZvd1wiKSB7XHJcbiAgICAgICAgY29uc3QgZm93ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgIGlmIChmb3cgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgZm93LmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbn07XHJcbkxheWVyU3RhdGUucHJvdG90eXBlLmFkZFNoYXBlID0gZnVuY3Rpb24gKHNoYXBlLCBzeW5jLCB0ZW1wb3JhcnkpIHtcclxuICAgIGlmIChzeW5jID09PSB1bmRlZmluZWQpIHN5bmMgPSBmYWxzZTtcclxuICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICBzaGFwZS5sYXllciA9IHRoaXMubmFtZTtcclxuICAgIHRoaXMuc2hhcGVzLnB1c2goc2hhcGUpO1xyXG4gICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJhZGQgc2hhcGVcIiwge3NoYXBlOiBzaGFwZS5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0ZW1wb3Jhcnl9KTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaGFwZSk7XHJcbiAgICB0aGlzLmludmFsaWRhdGUoIXN5bmMpO1xyXG59O1xyXG5MYXllclN0YXRlLnByb3RvdHlwZS5zZXRTaGFwZXMgPSBmdW5jdGlvbiAoc2hhcGVzKSB7XHJcbiAgICBjb25zdCB0ID0gW107XHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgIGNvbnN0IHNoID0gY3JlYXRlU2hhcGVGcm9tRGljdChzaGFwZSwgc2VsZik7XHJcbiAgICAgICAgc2gubGF5ZXIgPSBzZWxmLm5hbWU7XHJcbiAgICAgICAgc2guY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICBzaC5zZXRNb3ZlbWVudEJsb2NrKHNoYXBlLm1vdmVtZW50T2JzdHJ1Y3Rpb24pO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLnNldChzaGFwZS51dWlkLCBzaCk7XHJcbiAgICAgICAgdC5wdXNoKHNoKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy5zZWxlY3Rpb24gPSBbXTsgLy8gVE9ETzogRml4IGtlZXBpbmcgc2VsZWN0aW9uIG9uIHRob3NlIGl0ZW1zIHRoYXQgYXJlIG5vdCBtb3ZlZC5cclxuICAgIHRoaXMuc2hhcGVzLmRhdGEgPSB0O1xyXG4gICAgdGhpcy5pbnZhbGlkYXRlKCk7XHJcbn07XHJcbkxheWVyU3RhdGUucHJvdG90eXBlLnJlbW92ZVNoYXBlID0gZnVuY3Rpb24gKHNoYXBlLCBzeW5jLCB0ZW1wb3JhcnkpIHtcclxuICAgIGlmIChzeW5jID09PSB1bmRlZmluZWQpIHN5bmMgPSBmYWxzZTtcclxuICAgIGlmICh0ZW1wb3JhcnkgPT09IHVuZGVmaW5lZCkgdGVtcG9yYXJ5ID0gZmFsc2U7XHJcbiAgICBzaGFwZS5vblJlbW92ZSgpO1xyXG4gICAgdGhpcy5zaGFwZXMucmVtb3ZlKHNoYXBlKTtcclxuICAgIGlmIChzeW5jKSBzb2NrZXQuZW1pdChcInJlbW92ZSBzaGFwZVwiLCB7c2hhcGU6IHNoYXBlLCB0ZW1wb3Jhcnk6IHRlbXBvcmFyeX0pO1xyXG4gICAgY29uc3QgbHNfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5maW5kSW5kZXgobHMgPT4gbHMuc2hhcGUgPT09IHNoYXBlLnV1aWQpO1xyXG4gICAgY29uc3QgbGJfaSA9IGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuZmluZEluZGV4KGxzID0+IGxzID09PSBzaGFwZS51dWlkKTtcclxuICAgIGNvbnN0IG1iX2kgPSBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLmZpbmRJbmRleChscyA9PiBscyA9PT0gc2hhcGUudXVpZCk7XHJcbiAgICBpZiAobHNfaSA+PSAwKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0c291cmNlcy5zcGxpY2UobHNfaSwgMSk7XHJcbiAgICBpZiAobGJfaSA+PSAwKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxpZ2h0YmxvY2tlcnMuc3BsaWNlKGxiX2ksIDEpO1xyXG4gICAgaWYgKG1iX2kgPj0gMClcclxuICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnNwbGljZShtYl9pLCAxKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmRlbGV0ZShzaGFwZS51dWlkKTtcclxuICAgIGlmICh0aGlzLnNlbGVjdGlvbiA9PT0gc2hhcGUpIHRoaXMuc2VsZWN0aW9uID0gbnVsbDtcclxuICAgIHRoaXMuaW52YWxpZGF0ZSghc3luYyk7XHJcbn07XHJcbkxheWVyU3RhdGUucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxufTtcclxuTGF5ZXJTdGF0ZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChkb0NsZWFyKSB7XHJcbiAgICBpZiAoYm9hcmRfaW5pdGlhbGlzZWQgJiYgIXRoaXMudmFsaWQpIHtcclxuICAgICAgICBjb25zdCBjdHggPSB0aGlzLmN0eDtcclxuICAgICAgICBkb0NsZWFyID0gZG9DbGVhciA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGRvQ2xlYXI7XHJcblxyXG4gICAgICAgIGlmIChkb0NsZWFyKVxyXG4gICAgICAgICAgICB0aGlzLmNsZWFyKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5zaGFwZXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgICAgICBpZiAodzJseChzaGFwZS54KSA+IHN0YXRlLndpZHRoIHx8IHcybHkoc2hhcGUueSkgPiBzdGF0ZS5oZWlnaHQgfHxcclxuICAgICAgICAgICAgICAgIHcybHgoc2hhcGUueCArIHNoYXBlLncpIDwgMCB8fCB3Mmx5KHNoYXBlLnkgKyBzaGFwZS5oKSA8IDApIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKHN0YXRlLm5hbWUgPT09ICdmb3cnICYmIHNoYXBlLnZpc2lvbk9ic3RydWN0aW9uICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpLm5hbWUgIT09IHN0YXRlLm5hbWUpIHJldHVybjtcclxuICAgICAgICAgICAgc2hhcGUuZHJhdyhjdHgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5zZWxlY3Rpb25Db2xvcjtcclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuc2VsZWN0aW9uV2lkdGg7XHJcbiAgICAgICAgICAgIGNvbnN0IHogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlUmVjdCh3Mmx4KHNlbC54KSwgdzJseShzZWwueSksIHNlbC53ICogeiwgc2VsLmggKiB6KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0b3ByaWdodFxyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggKyBzZWwudyAtIDMpLCB3Mmx5KHNlbC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAvLyB0b3BsZWZ0XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodzJseChzZWwueCAtIDMpLCB3Mmx5KHNlbC55IC0gMyksIDYgKiB6LCA2ICogeik7XHJcbiAgICAgICAgICAgICAgICAvLyBib3RyaWdodFxyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHcybHgoc2VsLnggKyBzZWwudyAtIDMpLCB3Mmx5KHNlbC55ICsgc2VsLmggLSAzKSwgNiAqIHosIDYgKiB6KTtcclxuICAgICAgICAgICAgICAgIC8vIGJvdGxlZnRcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh3Mmx4KHNlbC54IC0gMyksIHcybHkoc2VsLnkgKyBzZWwuaCAtIDMpLCA2ICogeiwgNiAqIHopXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy52YWxpZCA9IHRydWU7XHJcbiAgICB9XHJcbn07XHJcbkxheWVyU3RhdGUucHJvdG90eXBlLmdldE1vdXNlID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGxldCBlbGVtZW50ID0gdGhpcy5jYW52YXMsIG9mZnNldFggPSAwLCBvZmZzZXRZID0gMCwgbXgsIG15O1xyXG5cclxuICAgIC8vIENvbXB1dGUgdGhlIHRvdGFsIG9mZnNldFxyXG4gICAgaWYgKGVsZW1lbnQub2Zmc2V0UGFyZW50ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIG9mZnNldFggKz0gZWxlbWVudC5vZmZzZXRMZWZ0O1xyXG4gICAgICAgICAgICBvZmZzZXRZICs9IGVsZW1lbnQub2Zmc2V0VG9wO1xyXG4gICAgICAgIH0gd2hpbGUgKChlbGVtZW50ID0gZWxlbWVudC5vZmZzZXRQYXJlbnQpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgcGFkZGluZyBhbmQgYm9yZGVyIHN0eWxlIHdpZHRocyB0byBvZmZzZXRcclxuICAgIC8vIEFsc28gYWRkIHRoZSA8aHRtbD4gb2Zmc2V0cyBpbiBjYXNlIHRoZXJlJ3MgYSBwb3NpdGlvbjpmaXhlZCBiYXJcclxuICAgIG9mZnNldFggKz0gdGhpcy5zdHlsZVBhZGRpbmdMZWZ0ICsgdGhpcy5zdHlsZUJvcmRlckxlZnQgKyB0aGlzLmh0bWxMZWZ0O1xyXG4gICAgb2Zmc2V0WSArPSB0aGlzLnN0eWxlUGFkZGluZ1RvcCArIHRoaXMuc3R5bGVCb3JkZXJUb3AgKyB0aGlzLmh0bWxUb3A7XHJcblxyXG4gICAgbXggPSBlLnBhZ2VYIC0gb2Zmc2V0WDtcclxuICAgIG15ID0gZS5wYWdlWSAtIG9mZnNldFk7XHJcblxyXG4gICAgcmV0dXJuIHt4OiBteCwgeTogbXl9O1xyXG59O1xyXG5MYXllclN0YXRlLnByb3RvdHlwZS5tb3ZlU2hhcGVPcmRlciA9IGZ1bmN0aW9uIChzaGFwZSwgZGVzdGluYXRpb25JbmRleCwgc3luYykge1xyXG4gICAgaWYgKHRoaXMuc2hhcGVzLm1vdmVUbyhzaGFwZSwgZGVzdGluYXRpb25JbmRleCkpIHtcclxuICAgICAgICBpZiAoc3luYykgc29ja2V0LmVtaXQoXCJtb3ZlU2hhcGVPcmRlclwiLCB7c2hhcGU6IHNoYXBlLmFzRGljdCgpLCBpbmRleDogZGVzdGluYXRpb25JbmRleH0pO1xyXG4gICAgICAgIHRoaXMuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIH1cclxufTtcclxuTGF5ZXJTdGF0ZS5wcm90b3R5cGUub25TaGFwZU1vdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmludmFsaWRhdGUoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEdyaWRMYXllclN0YXRlKGNhbnZhcywgbmFtZSkge1xyXG4gICAgTGF5ZXJTdGF0ZS5jYWxsKHRoaXMsIGNhbnZhcywgbmFtZSk7XHJcbn1cclxuXHJcbkdyaWRMYXllclN0YXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGF5ZXJTdGF0ZS5wcm90b3R5cGUpO1xyXG5HcmlkTGF5ZXJTdGF0ZS5wcm90b3R5cGUuaW52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5kcmF3R3JpZCgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gRk9XTGF5ZXJTdGF0ZShjYW52YXMsIG5hbWUpIHtcclxuICAgIExheWVyU3RhdGUuY2FsbCh0aGlzLCBjYW52YXMsIG5hbWUpO1xyXG59XHJcblxyXG5GT1dMYXllclN0YXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTGF5ZXJTdGF0ZS5wcm90b3R5cGUpO1xyXG5GT1dMYXllclN0YXRlLnByb3RvdHlwZS5hZGRTaGFwZSA9IGZ1bmN0aW9uIChzaGFwZSwgc3luYywgdGVtcG9yYXJ5KSB7XHJcbiAgICBzaGFwZS5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICBMYXllclN0YXRlLnByb3RvdHlwZS5hZGRTaGFwZS5jYWxsKHRoaXMsIHNoYXBlLCBzeW5jLCB0ZW1wb3JhcnkpO1xyXG59O1xyXG5GT1dMYXllclN0YXRlLnByb3RvdHlwZS5zZXRTaGFwZXMgPSBmdW5jdGlvbiAoc2hhcGVzKSB7XHJcbiAgICBjb25zdCBjID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICBzaGFwZXMuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICBzaGFwZS5maWxsID0gYztcclxuICAgIH0pO1xyXG4gICAgTGF5ZXJTdGF0ZS5wcm90b3R5cGUuc2V0U2hhcGVzLmNhbGwodGhpcywgc2hhcGVzKTtcclxufTtcclxuRk9XTGF5ZXJTdGF0ZS5wcm90b3R5cGUub25TaGFwZU1vdmUgPSBmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgIHNoYXBlLmZpbGwgPSBnYW1lTWFuYWdlci5mb3dDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgIExheWVyU3RhdGUucHJvdG90eXBlLm9uU2hhcGVNb3ZlLmNhbGwodGhpcywgc2hhcGUpO1xyXG59O1xyXG5GT1dMYXllclN0YXRlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGJvYXJkX2luaXRpYWxpc2VkICYmICF0aGlzLnZhbGlkKSB7XHJcbiAgICAgICAgY29uc3QgY3R4ID0gdGhpcy5jdHg7XHJcbiAgICAgICAgY29uc3Qgb3JpZ19vcCA9IGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5mdWxsRk9XKXtcclxuICAgICAgICAgICAgY29uc3Qgb2dhbHBoYSA9IHRoaXMuY3R4Lmdsb2JhbEFscGhhO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBcImNvcHlcIjtcclxuICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZm93T3BhY2l0eTtcclxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IG9nYWxwaGE7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IG9yaWdfb3A7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgIExheWVyU3RhdGUucHJvdG90eXBlLmRyYXcuY2FsbCh0aGlzLCAhZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJ0b2tlbnNcIikuc2hhcGVzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoc2gpIHtcclxuICAgICAgICAgICAgaWYgKCFzaC5vd25lZEJ5KCkpIHJldHVybjtcclxuICAgICAgICAgICAgY29uc3QgYmIgPSBzaC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICBjb25zdCBsY2VudGVyID0gdzJsKHNoLmNlbnRlcigpKTtcclxuICAgICAgICAgICAgY29uc3QgYWxtID0gMC44ICogdzJseihiYi53KTtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0sIDAsIDIqTWF0aC5QSSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KGxjZW50ZXIueCwgbGNlbnRlci55LCBhbG0vMiwgbGNlbnRlci54LCBsY2VudGVyLnksIGFsbSk7XHJcbiAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgwLCAncmdiYSgwLCAwLCAwLCAxKScpO1xyXG4gICAgICAgICAgICBncmFkaWVudC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMCwgMCwgMCwgMCknKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGdyYWRpZW50O1xyXG4gICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0JztcclxuICAgICAgICBnYW1lTWFuYWdlci5saWdodHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAobHMpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2ggPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobHMuc2hhcGUpO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhID0gc2guYXVyYXMuZmluZChhID0+IGEudXVpZCA9PT0gbHMuYXVyYSk7XHJcbiAgICAgICAgICAgIGlmIChhdXJhID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT2xkIGxpZ2h0c291cmNlIHN0aWxsIGxpbmdlcmluZyBpbiB0aGUgZ2FtZU1hbmFnZXIgbGlzdFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBhdXJhX2xlbmd0aCA9IGdldFVuaXREaXN0YW5jZShhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgY29uc3QgY2VudGVyID0gc2guY2VudGVyKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxjZW50ZXIgPSB3MmwoY2VudGVyKTtcclxuICAgICAgICAgICAgY29uc3QgYmJveCA9IG5ldyBDaXJjbGUoY2VudGVyLngsIGNlbnRlci55LCBhdXJhX2xlbmd0aCkuZ2V0Qm91bmRpbmdCb3goKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdlIGZpcnN0IGNvbGxlY3QgYWxsIGxpZ2h0YmxvY2tlcnMgdGhhdCBhcmUgaW5zaWRlL2Nyb3NzIG91ciBhdXJhXHJcbiAgICAgICAgICAgIC8vIFRoaXMgdG8gcHJldmVudCBhcyBtYW55IHJheSBjYWxjdWxhdGlvbnMgYXMgcG9zc2libGVcclxuICAgICAgICAgICAgY29uc3QgbG9jYWxfbGlnaHRibG9ja2VycyA9IFtdO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLmZvckVhY2goZnVuY3Rpb24gKGxiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGIgPT09IHNoLnV1aWQpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxiX3NoID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGxiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxiX2JiID0gbGJfc2guZ2V0Qm91bmRpbmdCb3goKTtcclxuICAgICAgICAgICAgICAgIGlmIChsYl9iYi5pbnRlcnNlY3RzV2l0aChiYm94KSlcclxuICAgICAgICAgICAgICAgICAgICBsb2NhbF9saWdodGJsb2NrZXJzLnB1c2gobGJfYmIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhcmNfc3RhcnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FzdCByYXlzIGluIGV2ZXJ5IGRlZ3JlZVxyXG4gICAgICAgICAgICBmb3IgKGxldCBhbmdsZSA9IDA7IGFuZ2xlIDwgMiAqIE1hdGguUEk7IGFuZ2xlICs9ICgxLzE4MCkgKiBNYXRoLlBJKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBoaXQgd2l0aCBvYnN0cnVjdGlvblxyXG4gICAgICAgICAgICAgICAgbGV0IGhpdCA9IHtpbnRlcnNlY3Q6IG51bGwsIGRpc3RhbmNlOiBJbmZpbml0eX07XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hhcGVfaGl0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGxvY2FsX2xpZ2h0YmxvY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAobGJfYmIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBsYl9iYi5nZXRJbnRlcnNlY3RXaXRoTGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBjZW50ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogY2VudGVyLnggKyBhdXJhX2xlbmd0aCAqIE1hdGguY29zKGFuZ2xlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGNlbnRlci55ICsgYXVyYV9sZW5ndGggKiBNYXRoLnNpbihhbmdsZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuaW50ZXJzZWN0ICE9PSBudWxsICYmIHJlc3VsdC5kaXN0YW5jZSA8IGhpdC5kaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaXQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlX2hpdCA9IGxiX2JiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBubyBoaXQsIGNoZWNrIGlmIHdlIGNvbWUgZnJvbSBhIHByZXZpb3VzIGhpdCBzbyB0aGF0IHdlIGNhbiBnbyBiYWNrIHRvIHRoZSBhcmNcclxuICAgICAgICAgICAgICAgIGlmIChoaXQuaW50ZXJzZWN0ID09PSBudWxsKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJjX3N0YXJ0ID09PSAtMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyY19zdGFydCA9IGFuZ2xlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdzJseChjZW50ZXIueCArIGF1cmFfbGVuZ3RoICogTWF0aC5jb3MoYW5nbGUpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcybHkoY2VudGVyLnkgKyBhdXJhX2xlbmd0aCAqIE1hdGguc2luKGFuZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBoaXQgLCBmaXJzdCBmaW5pc2ggYW55IG9uZ29pbmcgYXJjLCB0aGVuIG1vdmUgdG8gdGhlIGludGVyc2VjdGlvbiBwb2ludFxyXG4gICAgICAgICAgICAgICAgaWYgKGFyY19zdGFydCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHguYXJjKGxjZW50ZXIueCwgbGNlbnRlci55LCB3MmxyKGF1cmEudmFsdWUpLCBhcmNfc3RhcnQsIGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmNfc3RhcnQgPSAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBleHRyYVggPSAoc2hhcGVfaGl0LncvNCkgKiBNYXRoLmNvcyhhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXh0cmFZID0gKHNoYXBlX2hpdC5oLzQpICogTWF0aC5zaW4oYW5nbGUpO1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCFzaGFwZV9oaXQuY29udGFpbnMoaGl0LmludGVyc2VjdC54ICsgZXh0cmFYLCBoaXQuaW50ZXJzZWN0LnkgKyBleHRyYVksIGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGV4dHJhWCA9IDA7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgZXh0cmFZID0gMDtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgIGN0eC5saW5lVG8odzJseChoaXQuaW50ZXJzZWN0LnggKyBleHRyYVgpLCB3Mmx5KGhpdC5pbnRlcnNlY3QueSArIGV4dHJhWSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChhcmNfc3RhcnQgIT09IC0xKVxyXG4gICAgICAgICAgICAgICAgY3R4LmFyYyhsY2VudGVyLngsIGxjZW50ZXIueSwgdzJscihhdXJhLnZhbHVlKSwgYXJjX3N0YXJ0LCAyKk1hdGguUEkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYWxtID0gdzJscihhdXJhLnZhbHVlKTtcclxuICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQobGNlbnRlci54LCBsY2VudGVyLnksIGFsbS8yLCBsY2VudGVyLngsIGxjZW50ZXIueSwgYWxtKTtcclxuICAgICAgICAgICAgZ3JhZGllbnQuYWRkQ29sb3JTdG9wKDAsICdyZ2JhKDAsIDAsIDAsIDEpJyk7XHJcbiAgICAgICAgICAgIGdyYWRpZW50LmFkZENvbG9yU3RvcCgxLCAncmdiYSgwLCAwLCAwLCAwKScpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZ3JhZGllbnQ7XHJcbiAgICAgICAgICAgIC8vIGN0eC5maWxsU3R5bGUgPSBcInJnYmEoMCwgMCwgMCwgMSlcIjtcclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoZ2FtZU1hbmFnZXIuSVNfRE0pXHJcbiAgICAgICAgICAgIExheWVyU3RhdGUucHJvdG90eXBlLmRyYXcuY2FsbCh0aGlzLCAhZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZ1bGxGT1cpO1xyXG4gICAgICAgIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSBvcmlnX29wO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gKioqKiBNYW5hZ2VyIGZvciB3b3JraW5nIHdpdGggbXVsdGlwbGUgbGF5ZXJzXHJcblxyXG5mdW5jdGlvbiBMYXllck1hbmFnZXIoKSB7XHJcbiAgICB0aGlzLmxheWVycyA9IFtdO1xyXG4gICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICB0aGlzLnNlbGVjdGVkTGF5ZXIgPSBudWxsO1xyXG5cclxuICAgIHRoaXMuVVVJRE1hcCA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICB0aGlzLmdyaWRTaXplID0gNTA7XHJcbiAgICB0aGlzLnVuaXRTaXplID0gNTtcclxuICAgIHRoaXMudXNlR3JpZCA9IHRydWU7XHJcbiAgICB0aGlzLmZ1bGxGT1cgPSBmYWxzZTtcclxuICAgIHRoaXMuZm93T3BhY2l0eSA9IDAuMztcclxuXHJcbiAgICB0aGlzLnpvb21GYWN0b3IgPSAxO1xyXG4gICAgdGhpcy5wYW5YID0gMDtcclxuICAgIHRoaXMucGFuWSA9IDA7XHJcblxyXG4gICAgLy8gUmVmcmVzaCBpbnRlcnZhbCBhbmQgcmVkcmF3IHNldHRlci5cclxuICAgIHRoaXMuaW50ZXJ2YWwgPSAzMDtcclxuICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmb3IgKGxldCBpPWxtLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICBsbS5sYXllcnNbaV0uZHJhdygpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHRoaXMuaW50ZXJ2YWwpO1xyXG59XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBpZiAoXCJ1bml0U2l6ZVwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVuaXRTaXplKG9wdGlvbnMudW5pdFNpemUpO1xyXG4gICAgaWYgKFwidXNlR3JpZFwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVzZUdyaWQob3B0aW9ucy51c2VHcmlkKTtcclxuICAgIGlmIChcImZ1bGxGT1dcIiBpbiBvcHRpb25zKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGdWxsRk9XKG9wdGlvbnMuZnVsbEZPVyk7XHJcbiAgICBpZiAoJ2Zvd09wYWNpdHknIGluIG9wdGlvbnMpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEZPV09wYWNpdHkob3B0aW9ucy5mb3dPcGFjaXR5KTtcclxuICAgIGlmIChcImZvd0NvbG91clwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxufTtcclxuTGF5ZXJNYW5hZ2VyLnByb3RvdHlwZS5zZXRXaWR0aCA9IGZ1bmN0aW9uICh3aWR0aCkge1xyXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmxheWVyc1tpXS5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIubGF5ZXJzW2ldLndpZHRoID0gd2lkdGg7XHJcbiAgICB9XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuc2V0SGVpZ2h0ID0gZnVuY3Rpb24gKGhlaWdodCkge1xyXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5sYXllcnNbaV0uY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLmxheWVyc1tpXS5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB9XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuYWRkTGF5ZXIgPSBmdW5jdGlvbiAobGF5ZXIpIHtcclxuICAgIHRoaXMubGF5ZXJzLnB1c2gobGF5ZXIpO1xyXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRMYXllciA9PT0gbnVsbCAmJiBsYXllci5zZWxlY3RhYmxlKSB0aGlzLnNlbGVjdGVkTGF5ZXIgPSBsYXllci5uYW1lO1xyXG59O1xyXG5MYXllck1hbmFnZXIucHJvdG90eXBlLmdldExheWVyID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgIG5hbWUgPSAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSA/IHRoaXMuc2VsZWN0ZWRMYXllciA6IG5hbWU7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzW2ldLm5hbWUgPT09IG5hbWUpIHJldHVybiB0aGlzLmxheWVyc1tpXTtcclxuICAgIH1cclxufTtcclxuTGF5ZXJNYW5hZ2VyLnByb3RvdHlwZS5zZXRMYXllciA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcclxuICAgIGNvbnN0IGxtID0gdGhpcztcclxuICAgIHRoaXMubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgaWYgKGZvdW5kKSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAwLjM7XHJcbiAgICAgICAgZWxzZSBsYXllci5jdHguZ2xvYmFsQWxwaGEgPSAxLjA7XHJcblxyXG4gICAgICAgIGlmIChuYW1lID09PSBsYXllci5uYW1lKSB7XHJcbiAgICAgICAgICAgIGxtLnNlbGVjdGVkTGF5ZXIgPSBuYW1lO1xyXG4gICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsYXllci5zZWxlY3Rpb24gPSBbXTtcclxuICAgICAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgfSk7XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuZ2V0R3JpZExheWVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZ2V0TGF5ZXIoXCJncmlkXCIpO1xyXG59O1xyXG5MYXllck1hbmFnZXIucHJvdG90eXBlLmRyYXdHcmlkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgbGF5ZXIgPSB0aGlzLmdldEdyaWRMYXllcigpO1xyXG4gICAgY29uc3QgY3R4ID0gbGF5ZXIuY3R4O1xyXG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgY29uc3QgcGFuWCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YO1xyXG4gICAgY29uc3QgcGFuWSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZO1xyXG4gICAgbGF5ZXIuY2xlYXIoKTtcclxuICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxheWVyLndpZHRoOyBpICs9IHRoaXMuZ3JpZFNpemUgKiB6KSB7XHJcbiAgICAgICAgY3R4Lm1vdmVUbyhpICsgKHBhblggJSB0aGlzLmdyaWRTaXplKSAqIHosIDApO1xyXG4gICAgICAgIGN0eC5saW5lVG8oaSArIChwYW5YICUgdGhpcy5ncmlkU2l6ZSkgKiB6LCBsYXllci5oZWlnaHQpO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8oMCwgaSArIChwYW5ZICUgdGhpcy5ncmlkU2l6ZSkgKiB6KTtcclxuICAgICAgICBjdHgubGluZVRvKGxheWVyLndpZHRoLCBpICsgKHBhblkgJSB0aGlzLmdyaWRTaXplKSAqIHopO1xyXG4gICAgfVxyXG5cclxuICAgIGN0eC5zdHJva2VTdHlsZSA9IGdhbWVNYW5hZ2VyLmdyaWRDb2xvdXIuc3BlY3RydW0oXCJnZXRcIikudG9SZ2JTdHJpbmcoKTtcclxuICAgIGN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgbGF5ZXIudmFsaWQgPSB0cnVlO1xyXG4gICAgY29uc3QgZm93bCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgZm93bC5pbnZhbGlkYXRlKCk7XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuc2V0R3JpZFNpemUgPSBmdW5jdGlvbiAoZ3JpZFNpemUpIHtcclxuICAgIGlmIChncmlkU2l6ZSAhPT0gdGhpcy5ncmlkU2l6ZSkge1xyXG4gICAgICAgIHRoaXMuZ3JpZFNpemUgPSBncmlkU2l6ZTtcclxuICAgICAgICB0aGlzLmRyYXdHcmlkKCk7XHJcbiAgICAgICAgJCgnI2dyaWRTaXplSW5wdXQnKS52YWwoZ3JpZFNpemUpO1xyXG4gICAgfVxyXG59O1xyXG5MYXllck1hbmFnZXIucHJvdG90eXBlLnNldFVuaXRTaXplID0gZnVuY3Rpb24gKHVuaXRTaXplKSB7XHJcbiAgICBpZiAodW5pdFNpemUgIT09IHRoaXMudW5pdFNpemUpIHtcclxuICAgICAgICB0aGlzLnVuaXRTaXplID0gdW5pdFNpemU7XHJcbiAgICAgICAgdGhpcy5kcmF3R3JpZCgpO1xyXG4gICAgICAgICQoJyN1bml0U2l6ZUlucHV0JykudmFsKHVuaXRTaXplKTtcclxuICAgIH1cclxufTtcclxuTGF5ZXJNYW5hZ2VyLnByb3RvdHlwZS5zZXRVc2VHcmlkID0gZnVuY3Rpb24gKHVzZUdyaWQpIHtcclxuICAgIGlmICh1c2VHcmlkICE9PSB0aGlzLnVzZUdyaWQpIHtcclxuICAgICAgICB0aGlzLnVzZUdyaWQgPSB1c2VHcmlkO1xyXG4gICAgICAgIGlmICh1c2VHcmlkKVxyXG4gICAgICAgICAgICAgJCgnI2dyaWQtbGF5ZXInKS5zaG93KCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkKCcjZ3JpZC1sYXllcicpLmhpZGUoKTtcclxuICAgICAgICAkKCcjdXNlR3JpZElucHV0JykucHJvcChcImNoZWNrZWRcIiwgdXNlR3JpZCk7XHJcbiAgICB9XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuc2V0RnVsbEZPVyA9IGZ1bmN0aW9uIChmdWxsRk9XKSB7XHJcbiAgICBpZiAoZnVsbEZPVyAhPT0gdGhpcy5mdWxsRk9XKSB7XHJcbiAgICAgICAgdGhpcy5mdWxsRk9XID0gZnVsbEZPVztcclxuICAgICAgICBjb25zdCBmb3dsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgIGlmIChmb3dsICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIGZvd2wuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgICQoJyN1c2VGT1dJbnB1dCcpLnByb3AoXCJjaGVja2VkXCIsIGZ1bGxGT1cpO1xyXG4gICAgfVxyXG59O1xyXG5MYXllck1hbmFnZXIucHJvdG90eXBlLnNldEZPV09wYWNpdHkgPSBmdW5jdGlvbiAoZm93T3BhY2l0eSkge1xyXG4gICAgdGhpcy5mb3dPcGFjaXR5ID0gZm93T3BhY2l0eTtcclxuICAgIGNvbnN0IGZvd2wgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICBpZiAoZm93bCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIGZvd2wuaW52YWxpZGF0ZSgpO1xyXG4gICAgJCgnI2Zvd09wYWNpdHknKS52YWwoZm93T3BhY2l0eSk7XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUuaW52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGZvciAobGV0IGkgPSB0aGlzLmxheWVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIHRoaXMubGF5ZXJzW2ldLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUub25Nb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgIGNvbnN0IG1vdXNlID0gbGF5ZXIuZ2V0TW91c2UoZSk7XHJcbiAgICBjb25zdCBteCA9IG1vdXNlLng7XHJcbiAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcblxyXG4gICAgaWYgKHRvb2xzW2dhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbF0ubmFtZSA9PT0gJ3NlbGVjdCcpIHtcclxuICAgICAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICAgICAgLy8gdGhlIHNlbGVjdGlvblN0YWNrIGFsbG93cyBmb3IgbG93d2VyIHBvc2l0aW9uZWQgb2JqZWN0cyB0aGF0IGFyZSBzZWxlY3RlZCB0byBoYXZlIHByZWNlZGVuY2UgZHVyaW5nIG92ZXJsYXAuXHJcbiAgICAgICAgbGV0IHNlbGVjdGlvblN0YWNrO1xyXG4gICAgICAgIGlmICghbGF5ZXIuc2VsZWN0aW9uLmxlbmd0aClcclxuICAgICAgICAgICAgc2VsZWN0aW9uU3RhY2sgPSBsYXllci5zaGFwZXMuZGF0YTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YWNrID0gbGF5ZXIuc2hhcGVzLmRhdGEuY29uY2F0KGxheWVyLnNlbGVjdGlvbik7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHNlbGVjdGlvblN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNoYXBlID0gc2VsZWN0aW9uU3RhY2tbaV07XHJcbiAgICAgICAgICAgIGNvbnN0IGNvcm4gPSBzaGFwZS5nZXRDb3JuZXIobXgsIG15KTtcclxuICAgICAgICAgICAgaWYgKGNvcm4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzaGFwZS5vd25lZEJ5KCkpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3NoYXBlXTtcclxuICAgICAgICAgICAgICAgIHNoYXBlLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBsYXllci5yZXNpemluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBsYXllci5yZXNpemVkaXIgPSBjb3JuO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25JbmZvKHNoYXBlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNoYXBlLmNvbnRhaW5zKG14LCBteSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghc2hhcGUub3duZWRCeSgpKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbCA9IHNoYXBlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLnNlbGVjdGlvbi5pbmRleE9mKHNlbCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW3NlbF07XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLm9uU2VsZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsYXllci5kcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBsYXllci5kcmFnb2ZmeCA9IG14IC0gc2VsLnggKiB6O1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuZHJhZ29mZnkgPSBteSAtIHNlbC55ICogejtcclxuICAgICAgICAgICAgICAgIGxheWVyLmRyYWdvcmlnID0gT2JqZWN0LmFzc2lnbih7fSwgc2VsKTtcclxuICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2hhcGUpO1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIGhpdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFoaXQpIHtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLmZvckVhY2goZnVuY3Rpb24gKHNlbCkge1xyXG4gICAgICAgICAgICAgICAgc2VsLm9uU2VsZWN0aW9uTG9zcygpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIgPSBuZXcgUmVjdChsYXllci5zZWxlY3Rpb25TdGFydFBvaW50LngsIGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQueSwgMCwgMCwgXCJyZ2JhKDAsMCwwLDApXCIsIFwiYmxhY2tcIik7XHJcbiAgICAgICAgICAgIGxheWVyLnNlbGVjdGlvbkhlbHBlci5vd25lcnMucHVzaChnYW1lTWFuYWdlci51c2VybmFtZSk7XHJcbiAgICAgICAgICAgIGxheWVyLmFkZFNoYXBlKGxheWVyLnNlbGVjdGlvbkhlbHBlciwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgbGF5ZXIuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKHRvb2xzW2dhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbF0ubmFtZSA9PT0gJ3BhbicpIHtcclxuICAgICAgICBsYXllci5wYW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICBsYXllci5kcmFnb2ZmeCA9IG14O1xyXG4gICAgICAgIGxheWVyLmRyYWdvZmZ5ID0gbXk7XHJcbiAgICB9XHJcblxyXG59O1xyXG5MYXllck1hbmFnZXIucHJvdG90eXBlLm9uTW91c2VNb3ZlID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICBjb25zdCBtb3VzZSA9IGxheWVyLmdldE1vdXNlKGUpO1xyXG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgaWYgKGxheWVyLnNlbGVjdGluZykge1xyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGlvblN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgICAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgICAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcblxyXG4gICAgICAgIGxheWVyLnNlbGVjdGlvbkhlbHBlci53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQueCk7XHJcbiAgICAgICAgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gbGF5ZXIuc2VsZWN0aW9uU3RhcnRQb2ludC55KTtcclxuICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIueCA9IE1hdGgubWluKGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICAgICAgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLnkgPSBNYXRoLm1pbihsYXllci5zZWxlY3Rpb25TdGFydFBvaW50LnksIGVuZFBvaW50LnkpO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9IGVsc2UgaWYgKGxheWVyLnBhbm5pbmcpIHtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCArPSBNYXRoLnJvdW5kKChtb3VzZS54IC0gbGF5ZXIuZHJhZ29mZngpIC8geik7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblkgKz0gTWF0aC5yb3VuZCgobW91c2UueSAtIGxheWVyLmRyYWdvZmZ5KSAvIHopO1xyXG4gICAgICAgIGxheWVyLmRyYWdvZmZ4ID0gbW91c2UueDtcclxuICAgICAgICBsYXllci5kcmFnb2ZmeSA9IG1vdXNlLnk7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgIH0gZWxzZSBpZiAobGF5ZXIuc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IG9nWCA9IGxheWVyLnNlbGVjdGlvbltsYXllci5zZWxlY3Rpb24ubGVuZ3RoIC0gMV0ueCAqIHo7XHJcbiAgICAgICAgY29uc3Qgb2dZID0gbGF5ZXIuc2VsZWN0aW9uW2xheWVyLnNlbGVjdGlvbi5sZW5ndGggLSAxXS55ICogejtcclxuICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGR4ID0gbW91c2UueCAtIChvZ1ggKyBsYXllci5kcmFnb2ZmeCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGR5ID0gbW91c2UueSAtIChvZ1kgKyBsYXllci5kcmFnb2ZmeSk7XHJcbiAgICAgICAgICAgIGlmIChsYXllci5kcmFnZ2luZykge1xyXG4gICAgICAgICAgICAgICAgc2VsLnggKz0gZHgvejtcclxuICAgICAgICAgICAgICAgIHNlbC55ICs9IGR5L3o7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIubmFtZSAhPT0gJ2ZvdycpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIHVzZSB0aGUgYWJvdmUgdXBkYXRlZCB2YWx1ZXMgZm9yIHRoZSBib3VuZGluZyBib3ggY2hlY2tcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGUgYm91bmRpbmcgYm94ZXMgb3ZlcmxhcCB0byBzdG9wIGNsb3NlIC8gcHJlY2lzZSBtb3ZlbWVudFxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBibG9ja2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmJveCA9IHNlbC5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrZXJzID0gZ2FtZU1hbmFnZXIubW92ZW1lbnRibG9ja2Vycy5maWx0ZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1iID0+IG1iICE9PSBzZWwudXVpZCAmJiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuVVVJRE1hcC5nZXQobWIpLmdldEJvdW5kaW5nQm94KCkuaW50ZXJzZWN0c1dpdGgoYmJveCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChibG9ja2Vycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERyYXcgYSBsaW5lIGZyb20gc3RhcnQgdG8gZW5kIHBvc2l0aW9uIGFuZCBzZWUgZm9yIGFueSBpbnRlcnNlY3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBzdG9wcyBzdWRkZW4gbGVhcHMgb3ZlciB3YWxscyEgY2hlZWt5IGJ1Z2dlcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IHtzdGFydDoge3g6IG9nWCAvIHosIHk6IG9nWSAvIHp9LCBlbmQ6IHt4OiBzZWwueCwgeTogc2VsLnl9fTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tlZCA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc29tZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1iID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChtYikuZ2V0Qm91bmRpbmdCb3goKS5nZXRJbnRlcnNlY3RXaXRoTGluZShsaW5lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWIgIT09IHNlbC51dWlkICYmIGludGVyLmludGVyc2VjdCAhPT0gbnVsbCAmJiBpbnRlci5kaXN0YW5jZSA+IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChibG9ja2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC54IC09IGR4IC8gejtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsLnkgLT0gZHkgLyB6O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gbGF5ZXIuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2VsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXllci5yZXNpemluZykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGxheWVyLnJlc2l6ZWRpciA9PT0gJ253Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC53ID0gdzJseChzZWwueCkgKyBzZWwudyAqIHogLSBtb3VzZS54O1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5oID0gdzJseShzZWwueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC54ID0gbDJ3eChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgICAgICBzZWwueSA9IGwyd3kobW91c2UueSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnJlc2l6ZWRpciA9PT0gJ25lJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC53ID0gbW91c2UueCAtIHcybHgoc2VsLngpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5oID0gdzJseShzZWwueSkgKyBzZWwuaCAqIHogLSBtb3VzZS55O1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC55ID0gbDJ3eShtb3VzZS55KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGF5ZXIucmVzaXplZGlyID09PSAnc2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBtb3VzZS54IC0gdzJseChzZWwueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBtb3VzZS55IC0gdzJseShzZWwueSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxheWVyLnJlc2l6ZWRpciA9PT0gJ3N3Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC53ID0gdzJseChzZWwueCkgKyBzZWwudyAqIHogLSBtb3VzZS54O1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC5oID0gbW91c2UueSAtIHcybHkoc2VsLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbC54ID0gbDJ3eChtb3VzZS54KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNlbC53IC89IHo7XHJcbiAgICAgICAgICAgICAgICBzZWwuaCAvPSB6O1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gbGF5ZXIuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGlvbkluZm8oc2VsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxheWVyLmludmFsaWRhdGUoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJud1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJudy1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsLmluQ29ybmVyKG1vdXNlLngsIG1vdXNlLnksIFwibmVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwibmUtcmVzaXplXCI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbC5pbkNvcm5lcihtb3VzZS54LCBtb3VzZS55LCBcInNlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcInNlLXJlc2l6ZVwiO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWwuaW5Db3JuZXIobW91c2UueCwgbW91c2UueSwgXCJzd1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJzdy1yZXNpemVcIjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImRlZmF1bHRcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xyXG4gICAgfVxyXG59O1xyXG5MYXllck1hbmFnZXIucHJvdG90eXBlLm9uTW91c2VVcCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgaWYgKGxheWVyLnNlbGVjdGluZykge1xyXG4gICAgICAgIGlmIChsYXllci5zZWxlY3Rpb25TdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxheWVyLnNoYXBlcy5kYXRhLmZvckVhY2goZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICAgICAgICAgIGlmIChzaGFwZSA9PT0gbGF5ZXIuc2VsZWN0aW9uSGVscGVyKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IGJib3ggPSBzaGFwZS5nZXRCb3VuZGluZ0JveCgpO1xyXG4gICAgICAgICAgICBpZiAoIXNoYXBlLm93bmVkQnkoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAobGF5ZXIuc2VsZWN0aW9uSGVscGVyLnggPD0gYmJveC54ICsgYmJveC53ICYmXHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIueCArIGxheWVyLnNlbGVjdGlvbkhlbHBlci53ID49IGJib3gueCAmJlxyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uSGVscGVyLnkgPD0gYmJveC55ICsgYmJveC5oICYmXHJcbiAgICAgICAgICAgICAgICBsYXllci5zZWxlY3Rpb25IZWxwZXIueSArIGxheWVyLnNlbGVjdGlvbkhlbHBlci5oID49IGJib3gueSkge1xyXG4gICAgICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2goc2hhcGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFB1c2ggdGhlIHNlbGVjdGlvbiBoZWxwZXIgYXMgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgc2VsZWN0aW9uXHJcbiAgICAgICAgLy8gVGhpcyBtYWtlcyBzdXJlIHRoYXQgaXQgd2lsbCBiZSB0aGUgZmlyc3Qgb25lIHRvIGJlIGhpdCBpbiB0aGUgaGl0IGRldGVjdGlvbiBvbk1vdXNlRG93blxyXG4gICAgICAgIGlmIChsYXllci5zZWxlY3Rpb24ubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgbGF5ZXIuc2VsZWN0aW9uLnB1c2gobGF5ZXIuc2VsZWN0aW9uSGVscGVyKTtcclxuXHJcbiAgICAgICAgbGF5ZXIucmVtb3ZlU2hhcGUobGF5ZXIuc2VsZWN0aW9uSGVscGVyLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgIGxheWVyLnNlbGVjdGlvblN0YXJ0UG9pbnQgPSBudWxsO1xyXG4gICAgICAgIGxheWVyLmludmFsaWRhdGUodHJ1ZSk7XHJcbiAgICB9IGVsc2UgaWYgKGxheWVyLnBhbm5pbmcpIHtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHtcclxuICAgICAgICAgICAgcGFuWDogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblgsXHJcbiAgICAgICAgICAgIHBhblk6IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZXHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICBsYXllci5zZWxlY3Rpb24uZm9yRWFjaChmdW5jdGlvbiAoc2VsKSB7XHJcbiAgICAgICAgICAgIGlmIChsYXllci5kcmFnZ2luZykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci51c2VHcmlkICYmICFlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGdzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdXNlID0ge3g6IHNlbC54ICsgc2VsLncgLyAyLCB5OiBzZWwueSArIHNlbC5oIC8gMn07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbXggPSBtb3VzZS54O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG15ID0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKHNlbC53IC8gZ3MpICUgMiA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueCA9IE1hdGgucm91bmQobXggLyBncykgKiBncyAtIHNlbC53IC8gMjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWwueCA9IChNYXRoLnJvdW5kKChteCArIChncyAvIDIpKSAvIGdzKSAtICgxIC8gMikpICogZ3MgLSBzZWwudyAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgoc2VsLmggLyBncykgJSAyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gTWF0aC5yb3VuZChteSAvIGdzKSAqIGdzIC0gc2VsLmggLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbC55ID0gKE1hdGgucm91bmQoKG15ICsgKGdzIC8gMikpIC8gZ3MpIC0gKDEgLyAyKSkgKiBncyAtIHNlbC5oIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZWwub25Nb3VzZVVwKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGF5ZXIuZHJhZ29yaWcueCAhPT0gc2VsLnggfHwgbGF5ZXIuZHJhZ29yaWcueSAhPT0gc2VsLnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsICE9PSBsYXllci5zZWxlY3Rpb25IZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2VsZWN0aW9uSW5mbyhzZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxheWVyLnJlc2l6aW5nKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsLncgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnggKz0gc2VsLnc7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLmFicyhzZWwudyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsLmggPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnkgKz0gc2VsLmg7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLmggPSBNYXRoLmFicyhzZWwuaCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQgJiYgIWUuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3MgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnggPSBNYXRoLnJvdW5kKHNlbC54IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLnkgPSBNYXRoLnJvdW5kKHNlbC55IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsLncgPSBNYXRoLm1heChNYXRoLnJvdW5kKHNlbC53IC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICBzZWwuaCA9IE1hdGgubWF4KE1hdGgucm91bmQoc2VsLmggLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHNlbCAhPT0gbGF5ZXIuc2VsZWN0aW9uSGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiBzZWwuYXNEaWN0KCksIHRlbXBvcmFyeTogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25JbmZvKHNlbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsYXllci5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGxheWVyLmRyYWdnaW5nID0gZmFsc2U7XHJcbiAgICBsYXllci5yZXNpemluZyA9IGZhbHNlO1xyXG4gICAgbGF5ZXIucGFubmluZyA9IGZhbHNlO1xyXG4gICAgbGF5ZXIuc2VsZWN0aW5nID0gZmFsc2U7XHJcbn07XHJcbkxheWVyTWFuYWdlci5wcm90b3R5cGUub25Db250ZXh0TWVudSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgIGNvbnN0IG1vdXNlID0gbGF5ZXIuZ2V0TW91c2UoZSk7XHJcbiAgICBjb25zdCBteCA9IG1vdXNlLng7XHJcbiAgICBjb25zdCBteSA9IG1vdXNlLnk7XHJcbiAgICBsZXQgaGl0ID0gZmFsc2U7XHJcbiAgICBsYXllci5zaGFwZXMuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgIGlmICghaGl0ICYmIHNoYXBlLmNvbnRhaW5zKG14LCBteSkpIHtcclxuICAgICAgICAgICAgc2hhcGUuc2hvd0NvbnRleHRNZW51KG1vdXNlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIERyYXdUb29sKCkge1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMuZGV0YWlsRGl2ID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmZpbGxDb2xvciA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgLz5cIik7XHJcbiAgICB0aGlzLmJvcmRlckNvbG9yID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyAvPlwiKTtcclxuICAgIHRoaXMuZGV0YWlsRGl2ID0gJChcIjxkaXY+XCIpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5GaWxsPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5maWxsQ29sb3IpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj5Cb3JkZXI8L2Rpdj5cIikpLmFwcGVuZCh0aGlzLmJvcmRlckNvbG9yKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbiAgICAvLyB0aGlzLmRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgLy8gICAgIC5hcHBlbmQoJChcIjxkaXY+XCIpLmFwcGVuZCgkKFwiPGRpdj5GaWxsPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5maWxsQ29sb3IpLmFwcGVuZCgkKFwiPC9kaXY+XCIpKSlcclxuICAgIC8vICAgICAuYXBwZW5kKCQoXCI8ZGl2PlwiKS5hcHBlbmQoJChcIjxkaXY+Qm9yZGVyPC9kaXY+XCIpKS5hcHBlbmQodGhpcy5ib3JkZXJDb2xvcikuYXBwZW5kKFwiPC9kaXY+XCIpKVxyXG4gICAgLy8gICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbiAgICB0aGlzLmZpbGxDb2xvci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgIGNvbG9yOiBcInJlZFwiXHJcbiAgICB9KTtcclxuICAgIHRoaXMuYm9yZGVyQ29sb3Iuc3BlY3RydW0oe1xyXG4gICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICBhbGxvd0VtcHR5OiB0cnVlLFxyXG4gICAgICAgIHNob3dBbHBoYTogdHJ1ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbkRyYXdUb29sLnByb3RvdHlwZS5vbk1vdXNlRG93biA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgY29uc3QgZmlsbENvbG9yID0gdGhpcy5maWxsQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICBjb25zdCBmaWxsID0gZmlsbENvbG9yID09PSBudWxsID8gdGlueWNvbG9yKFwidHJhbnNwYXJlbnRcIikgOiBmaWxsQ29sb3I7XHJcbiAgICBjb25zdCBib3JkZXJDb2xvciA9IHRoaXMuYm9yZGVyQ29sb3Iuc3BlY3RydW0oXCJnZXRcIik7XHJcbiAgICBjb25zdCBib3JkZXIgPSBib3JkZXJDb2xvciA9PT0gbnVsbCA/IHRpbnljb2xvcihcInRyYW5zcGFyZW50XCIpIDogYm9yZGVyQ29sb3I7XHJcbiAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIDAsIDAsIGZpbGwudG9SZ2JTdHJpbmcoKSwgYm9yZGVyLnRvUmdiU3RyaW5nKCkpO1xyXG4gICAgdGhpcy5yZWN0Lm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgIGlmIChsYXllci5uYW1lID09PSAnZm93Jykge1xyXG4gICAgICAgIHRoaXMucmVjdC52aXNpb25PYnN0cnVjdGlvbiA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5yZWN0Lm1vdmVtZW50T2JzdHJ1Y3Rpb24gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5wdXNoKHRoaXMucmVjdC51dWlkKTtcclxuICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgdHJ1ZSwgZmFsc2UpO1xyXG59O1xyXG5EcmF3VG9vbC5wcm90b3R5cGUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgIHRoaXMucmVjdC5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgIHRoaXMucmVjdC54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgdGhpcy5yZWN0LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5EcmF3VG9vbC5wcm90b3R5cGUub25Nb3VzZVVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMucmVjdCA9IG51bGw7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBSdWxlclRvb2woKSB7XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQgPSBudWxsO1xyXG59XHJcblxyXG5SdWxlclRvb2wucHJvdG90eXBlLm9uTW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJkcmF3XCIpO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuICAgIHRoaXMucnVsZXIgPSBuZXcgTGluZSh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIHRoaXMuc3RhcnRQb2ludC54LCB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICB0aGlzLnRleHQgPSBuZXcgVGV4dCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIFwiXCIsIFwiMjBweCBzZXJpZlwiKTtcclxuICAgIHRoaXMucnVsZXIub3duZXJzLnB1c2goZ2FtZU1hbmFnZXIudXNlcm5hbWUpO1xyXG4gICAgdGhpcy50ZXh0Lm93bmVycy5wdXNoKGdhbWVNYW5hZ2VyLnVzZXJuYW1lKTtcclxuICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucnVsZXIsIHRydWUsIHRydWUpO1xyXG4gICAgbGF5ZXIuYWRkU2hhcGUodGhpcy50ZXh0LCB0cnVlLCB0cnVlKTtcclxufTtcclxuUnVsZXJUb29sLnByb3RvdHlwZS5vbk1vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICAvLyBDdXJyZW50bHkgZHJhdyBvbiBhY3RpdmUgbGF5ZXJcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZHJhd1wiKTtcclxuICAgIGNvbnN0IGVuZFBvaW50ID0gbDJ3KGxheWVyLmdldE1vdXNlKGUpKTtcclxuXHJcbiAgICB0aGlzLnJ1bGVyLngyID0gZW5kUG9pbnQueDtcclxuICAgIHRoaXMucnVsZXIueTIgPSBlbmRQb2ludC55O1xyXG4gICAgc29ja2V0LmVtaXQoXCJzaGFwZU1vdmVcIiwge3NoYXBlOiB0aGlzLnJ1bGVyLmFzRGljdCgpLCB0ZW1wb3Jhcnk6IHRydWV9KTtcclxuXHJcbiAgICBjb25zdCBkaWZmc2lnbiA9IE1hdGguc2lnbihlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpICogTWF0aC5zaWduKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICBjb25zdCB4ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnggLSB0aGlzLnN0YXJ0UG9pbnQueCk7XHJcbiAgICBjb25zdCB5ZGlmZiA9IE1hdGguYWJzKGVuZFBvaW50LnkgLSB0aGlzLnN0YXJ0UG9pbnQueSk7XHJcbiAgICBjb25zdCBsYWJlbCA9IE1hdGgucm91bmQoTWF0aC5zcXJ0KCh4ZGlmZikgKiogMiArICh5ZGlmZikgKiogMikgKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ3JpZFNpemUpICsgXCIgZnRcIjtcclxuICAgIGxldCBhbmdsZSA9IE1hdGguYXRhbjIoZGlmZnNpZ24gKiB5ZGlmZiwgeGRpZmYpO1xyXG4gICAgY29uc3QgeG1pZCA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC54LCBlbmRQb2ludC54KSArIHhkaWZmIC8gMjtcclxuICAgIGNvbnN0IHltaWQgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSkgKyB5ZGlmZiAvIDI7XHJcbiAgICB0aGlzLnRleHQueCA9IHhtaWQ7XHJcbiAgICB0aGlzLnRleHQueSA9IHltaWQ7XHJcbiAgICB0aGlzLnRleHQudGV4dCA9IGxhYmVsO1xyXG4gICAgdGhpcy50ZXh0LmFuZ2xlID0gYW5nbGU7XHJcbiAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMudGV4dC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiB0cnVlfSk7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG59O1xyXG5SdWxlclRvb2wucHJvdG90eXBlLm9uTW91c2VVcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImRyYXdcIik7XHJcbiAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJ1bGVyLCB0cnVlLCB0cnVlKTtcclxuICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMudGV4dCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICB0aGlzLnJ1bGVyID0gbnVsbDtcclxuICAgIHRoaXMudGV4dCA9IG51bGw7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKHRydWUpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gRk9XVG9vbCgpIHtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICB0aGlzLmRldGFpbERpdiA9ICQoXCI8ZGl2PlwiKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXY+UmV2ZWFsPC9kaXY+PGxhYmVsIGNsYXNzPSdzd2l0Y2gnPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2Zvdy1yZXZlYWwnPjxzcGFuIGNsYXNzPSdzbGlkZXIgcm91bmQnPjwvc3Bhbj48L2xhYmVsPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8L2Rpdj5cIikpO1xyXG59XHJcblxyXG5GT1dUb29sLnByb3RvdHlwZS5vbk1vdXNlRG93biA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihcImZvd1wiKTtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcbiAgICB0aGlzLnJlY3QgPSBuZXcgUmVjdCh0aGlzLnN0YXJ0UG9pbnQueCwgdGhpcy5zdGFydFBvaW50LnksIDAsIDAsIGdhbWVNYW5hZ2VyLmZvd0NvbG91ci5zcGVjdHJ1bShcImdldFwiKS50b1JnYlN0cmluZygpKTtcclxuICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgdHJ1ZSwgZmFsc2UpO1xyXG5cclxuICAgIGlmICgkKFwiI2Zvdy1yZXZlYWxcIikucHJvcChcImNoZWNrZWRcIikpXHJcbiAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwiZGVzdGluYXRpb24tb3V0XCI7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgdGhpcy5yZWN0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLW92ZXJcIjtcclxufTtcclxuRk9XVG9vbC5wcm90b3R5cGUub25Nb3VzZVVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5zdGFydFBvaW50ID0gbnVsbDtcclxuICAgIHRoaXMucmVjdCA9IG51bGw7XHJcbn07XHJcbkZPV1Rvb2wucHJvdG90eXBlLm9uTW91c2VNb3ZlID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmICh0aGlzLnN0YXJ0UG9pbnQgPT09IG51bGwpIHJldHVybjtcclxuICAgIC8vIEN1cnJlbnRseSBkcmF3IG9uIGFjdGl2ZSBsYXllclxyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICBjb25zdCBlbmRQb2ludCA9IGwydyhsYXllci5nZXRNb3VzZShlKSk7XHJcblxyXG4gICAgdGhpcy5yZWN0LncgPSBNYXRoLmFicyhlbmRQb2ludC54IC0gdGhpcy5zdGFydFBvaW50LngpO1xyXG4gICAgdGhpcy5yZWN0LmggPSBNYXRoLmFicyhlbmRQb2ludC55IC0gdGhpcy5zdGFydFBvaW50LnkpO1xyXG4gICAgdGhpcy5yZWN0LnggPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueCwgZW5kUG9pbnQueCk7XHJcbiAgICB0aGlzLnJlY3QueSA9IE1hdGgubWluKHRoaXMuc3RhcnRQb2ludC55LCBlbmRQb2ludC55KTtcclxuXHJcbiAgICBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gTWFwVG9vbCgpIHtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICB0aGlzLnhDb3VudCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgdmFsdWU9JzMnPlwiKTtcclxuICAgIHRoaXMueUNvdW50ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyB2YWx1ZT0nMyc+XCIpO1xyXG4gICAgdGhpcy5kZXRhaWxEaXYgPSAkKFwiPGRpdj5cIilcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2PiNYPC9kaXY+XCIpKS5hcHBlbmQodGhpcy54Q291bnQpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdj4jWTwvZGl2PlwiKSkuYXBwZW5kKHRoaXMueUNvdW50KVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjwvZGl2PlwiKSk7XHJcbn1cclxuXHJcbk1hcFRvb2wucHJvdG90eXBlLm9uTW91c2VEb3duID0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IGxheWVyID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICB0aGlzLnN0YXJ0UG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG4gICAgdGhpcy5yZWN0ID0gbmV3IFJlY3QodGhpcy5zdGFydFBvaW50LngsIHRoaXMuc3RhcnRQb2ludC55LCAwLCAwLCBcInJnYmEoMCwwLDAsMClcIiwgXCJibGFja1wiKTtcclxuICAgIGxheWVyLmFkZFNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcclxufTtcclxuTWFwVG9vbC5wcm90b3R5cGUub25Nb3VzZU1vdmUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYgKHRoaXMuc3RhcnRQb2ludCA9PT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgLy8gQ3VycmVudGx5IGRyYXcgb24gYWN0aXZlIGxheWVyXHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgY29uc3QgZW5kUG9pbnQgPSBsMncobGF5ZXIuZ2V0TW91c2UoZSkpO1xyXG5cclxuICAgIHRoaXMucmVjdC53ID0gTWF0aC5hYnMoZW5kUG9pbnQueCAtIHRoaXMuc3RhcnRQb2ludC54KTtcclxuICAgIHRoaXMucmVjdC5oID0gTWF0aC5hYnMoZW5kUG9pbnQueSAtIHRoaXMuc3RhcnRQb2ludC55KTtcclxuICAgIHRoaXMucmVjdC54ID0gTWF0aC5taW4odGhpcy5zdGFydFBvaW50LngsIGVuZFBvaW50LngpO1xyXG4gICAgdGhpcy5yZWN0LnkgPSBNYXRoLm1pbih0aGlzLnN0YXJ0UG9pbnQueSwgZW5kUG9pbnQueSk7XHJcbiAgICAvLyBzb2NrZXQuZW1pdChcInNoYXBlTW92ZVwiLCB7c2hhcGU6IHRoaXMucmVjdC5hc0RpY3QoKSwgdGVtcG9yYXJ5OiBmYWxzZX0pO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5NYXBUb29sLnByb3RvdHlwZS5vbk1vdXNlVXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAodGhpcy5zdGFydFBvaW50ID09PSBudWxsKSByZXR1cm47XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgaWYgKGxheWVyLnNlbGVjdGlvbi5sZW5ndGggIT09IDEpIHtcclxuICAgICAgICBsYXllci5yZW1vdmVTaGFwZSh0aGlzLnJlY3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHcgPSB0aGlzLnJlY3QudztcclxuICAgIGNvbnN0IGggPSB0aGlzLnJlY3QuaDtcclxuICAgIGxheWVyLnNlbGVjdGlvblswXS53ICo9IHRoaXMueENvdW50LnZhbCgpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplIC8gdztcclxuICAgIGxheWVyLnNlbGVjdGlvblswXS5oICo9IHRoaXMueUNvdW50LnZhbCgpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplIC8gaDtcclxuICAgIGxheWVyLnJlbW92ZVNoYXBlKHRoaXMucmVjdCwgZmFsc2UsIGZhbHNlKTtcclxuICAgIHRoaXMuc3RhcnRQb2ludCA9IG51bGw7XHJcbiAgICB0aGlzLnJlY3QgPSBudWxsO1xyXG59O1xyXG5cclxuXHJcbmZ1bmN0aW9uIEdhbWVNYW5hZ2VyKCkge1xyXG4gICAgdGhpcy5sYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICB0aGlzLnNlbGVjdGVkVG9vbCA9IDA7XHJcbiAgICB0aGlzLnJ1bGVyVG9vbCA9IG5ldyBSdWxlclRvb2woKTtcclxuICAgIHRoaXMuZHJhd1Rvb2wgPSBuZXcgRHJhd1Rvb2woKTtcclxuICAgIHRoaXMuZm93VG9vbCA9IG5ldyBGT1dUb29sKCk7XHJcbiAgICB0aGlzLm1hcFRvb2wgPSBuZXcgTWFwVG9vbCgpO1xyXG5cclxuICAgIHRoaXMubGlnaHRzb3VyY2VzID0gW107XHJcbiAgICB0aGlzLmxpZ2h0YmxvY2tlcnMgPSBbXTtcclxuICAgIHRoaXMubW92ZW1lbnRibG9ja2VycyA9IFtdO1xyXG5cclxuICAgIHRoaXMuZ3JpZENvbG91ciA9ICQoXCIjZ3JpZENvbG91clwiKTtcclxuICAgIHRoaXMuZ3JpZENvbG91ci5zcGVjdHJ1bSh7XHJcbiAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgIGNvbG9yOiBcInJnYmEoMjU1LDAsMCwgMC41KVwiLFxyXG4gICAgICAgIG1vdmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmRyYXdHcmlkKClcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHsnZ3JpZENvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLmZvd0NvbG91ciA9ICQoXCIjZm93Q29sb3VyXCIpO1xyXG4gICAgdGhpcy5mb3dDb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgIHNob3dJbnB1dDogdHJ1ZSxcclxuICAgICAgICBjb2xvcjogXCJyZ2IoODIsIDgxLCA4MSlcIixcclxuICAgICAgICBtb3ZlOiBmdW5jdGlvbiAoY29sb3VyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoXCJmb3dcIik7XHJcbiAgICAgICAgICAgIGlmIChsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGwuc2hhcGVzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoc2hhcGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBzaGFwZS5maWxsID0gY29sb3VyLnRvUmdiU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGwuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjaGFuZ2U6IGZ1bmN0aW9uIChjb2xvdXIpIHtcclxuICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJzZXQgY2xpZW50T3B0aW9uc1wiLCB7J2Zvd0NvbG91cic6IGNvbG91ci50b1JnYlN0cmluZygpfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5pbml0aWF0aXZlVHJhY2tlciA9IG5ldyBJbml0aWF0aXZlVHJhY2tlcigpO1xyXG4gICAgdGhpcy5zaGFwZVNlbGVjdGlvbkRpYWxvZyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2dcIikuZGlhbG9nKHtcclxuICAgICAgICBhdXRvT3BlbjogZmFsc2UsXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5pbml0aWF0aXZlRGlhbG9nID0gJChcIiNpbml0aWF0aXZlZGlhbG9nXCIpLmRpYWxvZyh7XHJcbiAgICAgICAgYXV0b09wZW46IGZhbHNlLFxyXG4gICAgICAgIHdpZHRoOiAnMTYwcHgnXHJcbiAgICB9KTtcclxufVxyXG5HYW1lTWFuYWdlci5wcm90b3R5cGUuc2V0dXBCb2FyZCA9IGZ1bmN0aW9uIChyb29tKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIgPSBuZXcgTGF5ZXJNYW5hZ2VyKCk7XHJcbiAgICBjb25zdCBsYXllcnNkaXYgPSAkKCcjbGF5ZXJzJyk7XHJcbiAgICBsYXllcnNkaXYuZW1wdHkoKTtcclxuICAgIGNvbnN0IGxheWVyc2VsZWN0ZGl2ID0gJCgnI2xheWVyc2VsZWN0Jyk7XHJcbiAgICBsYXllcnNlbGVjdGRpdi5maW5kKFwidWxcIikuZW1wdHkoKTtcclxuICAgIGxldCBzZWxlY3RhYmxlX2xheWVycyA9IDA7XHJcblxyXG4gICAgY29uc3QgbG0gPSAkKFwiI2xvY2F0aW9ucy1tZW51XCIpLmZpbmQoXCJkaXZcIik7XHJcbiAgICBsbS5jaGlsZHJlbigpLm9mZigpO1xyXG4gICAgbG0uZW1wdHkoKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vbS5sb2NhdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBsb2MgPSAkKFwiPGRpdj5cIiArIHJvb20ubG9jYXRpb25zW2ldICsgXCI8L2Rpdj5cIik7XHJcbiAgICAgICAgbG0uYXBwZW5kKGxvYyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsbXBsdXMgPSAkKCc8ZGl2PjxpIGNsYXNzPVwiZmFzIGZhLXBsdXNcIj48L2k+PC9kaXY+Jyk7XHJcbiAgICBsbS5hcHBlbmQobG1wbHVzKTtcclxuICAgIGxtLmNoaWxkcmVuKCkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGlmIChlLnRhcmdldC50ZXh0Q29udGVudCA9PT0gJycpIHtcclxuICAgICAgICAgICAgY29uc3QgbG9jbmFtZSA9IHByb21wdChcIk5ldyBsb2NhdGlvbiBuYW1lXCIpO1xyXG4gICAgICAgICAgICBpZiAobG9jbmFtZSAhPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwibmV3IGxvY2F0aW9uXCIsIGxvY25hbWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwiY2hhbmdlIGxvY2F0aW9uXCIsIGUudGFyZ2V0LnRleHRDb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb20uYm9hcmQubGF5ZXJzLmxlbmd0aCA7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IG5ld19sYXllciA9IHJvb20uYm9hcmQubGF5ZXJzW2ldO1xyXG4gICAgICAgIC8vIFVJIGNoYW5nZXNcclxuICAgICAgICBsYXllcnNkaXYuYXBwZW5kKFwiPGNhbnZhcyBpZD0nXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiLWxheWVyJyBzdHlsZT0nei1pbmRleDogXCIgKyBpICsgXCInPjwvY2FudmFzPlwiKTtcclxuICAgICAgICBpZiAobmV3X2xheWVyLnNlbGVjdGFibGUpIHtcclxuICAgICAgICAgICAgbGV0IGV4dHJhID0gJyc7XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RhYmxlX2xheWVycyA9PT0gMCkgZXh0cmEgPSBcIiBjbGFzcz0nbGF5ZXItc2VsZWN0ZWQnXCI7XHJcbiAgICAgICAgICAgIGxheWVyc2VsZWN0ZGl2LmZpbmQoJ3VsJykuYXBwZW5kKFwiPGxpIGlkPSdzZWxlY3QtXCIgKyBuZXdfbGF5ZXIubmFtZSArIFwiJ1wiICsgZXh0cmEgKyBcIj48YSBocmVmPScjJz5cIiArIG5ld19sYXllci5uYW1lICsgXCI8L2E+PC9saT5cIik7XHJcbiAgICAgICAgICAgIHNlbGVjdGFibGVfbGF5ZXJzICs9IDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD4kKCcjJyArIG5ld19sYXllci5uYW1lICsgJy1sYXllcicpWzBdO1xyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgLy8gU3RhdGUgY2hhbmdlc1xyXG4gICAgICAgIGxldCBsO1xyXG4gICAgICAgIGlmIChuZXdfbGF5ZXIuZ3JpZClcclxuICAgICAgICAgICAgbCA9IG5ldyBHcmlkTGF5ZXJTdGF0ZShjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICBlbHNlIGlmIChuZXdfbGF5ZXIubmFtZSA9PT0gJ2ZvdycpXHJcbiAgICAgICAgICAgIGwgPSBuZXcgRk9XTGF5ZXJTdGF0ZShjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGwgPSBuZXcgTGF5ZXJTdGF0ZShjYW52YXMsIG5ld19sYXllci5uYW1lKTtcclxuICAgICAgICBsLnNlbGVjdGFibGUgPSBuZXdfbGF5ZXIuc2VsZWN0YWJsZTtcclxuICAgICAgICBsLnBsYXllcl9lZGl0YWJsZSA9IG5ld19sYXllci5wbGF5ZXJfZWRpdGFibGU7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmFkZExheWVyKGwpO1xyXG4gICAgICAgIGlmIChuZXdfbGF5ZXIuZ3JpZCkge1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUobmV3X2xheWVyLnNpemUpO1xyXG4gICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZHJhd0dyaWQoKTtcclxuICAgICAgICAgICAgJChcIiNncmlkLWxheWVyXCIpLmRyb3BwYWJsZSh7XHJcbiAgICAgICAgICAgICAgICBhY2NlcHQ6IFwiLmRyYWdnYWJsZVwiLFxyXG4gICAgICAgICAgICAgICAgZHJvcDogZnVuY3Rpb24gKGV2ZW50OiBNb3VzZUV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSAkKGwuY2FudmFzKS5vZmZzZXQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9jID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiB1aS5vZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiB1aS5vZmZzZXQudG9wIC0gb2Zmc2V0LnRvcFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXR0aW5nc19tZW51LmlzKFwiOnZpc2libGVcIikgJiYgbG9jLnggPCBzZXR0aW5nc19tZW51LndpZHRoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25zX21lbnUuaXMoXCI6dmlzaWJsZVwiKSAmJiBsb2MueSA8IGxvY2F0aW9uc19tZW51LndpZHRoKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAvLyB3aWR0aCA9IHVpLmhlbHBlclswXS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBoZWlnaHQgPSB1aS5oZWxwZXJbMF0uaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHdsb2MgPSBsMncobG9jKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbWcgPSA8SFRNTEltYWdlRWxlbWVudD51aS5kcmFnZ2FibGVbMF0uY2hpbGRyZW5bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXNzZXQgPSBuZXcgQXNzZXQoaW1nLCB3bG9jLngsIHdsb2MueSwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBhc3NldC5zcmMgPSBpbWcuc3JjO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnVzZUdyaWQgJiYgIWV2ZW50LmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5ncmlkU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXQueCA9IE1hdGgucm91bmQoYXNzZXQueCAvIGdzKSAqIGdzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldC55ID0gTWF0aC5yb3VuZChhc3NldC55IC8gZ3MpICogZ3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2V0LncgPSBNYXRoLm1heChNYXRoLnJvdW5kKGFzc2V0LncgLyBncykgKiBncywgZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NldC5oID0gTWF0aC5tYXgoTWF0aC5yb3VuZChhc3NldC5oIC8gZ3MpICogZ3MsIGdzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGwuYWRkU2hhcGUoYXNzZXQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsLnNldFNoYXBlcyhuZXdfbGF5ZXIuc2hhcGVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBGb3JjZSB0aGUgY29ycmVjdCBvcGFjaXR5IHJlbmRlciBvbiBvdGhlciBsYXllcnMuXHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0TGF5ZXIoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCkubmFtZSk7XHJcbiAgICAvLyBzb2NrZXQuZW1pdChcImNsaWVudCBpbml0aWFsaXNlZFwiKTtcclxuICAgIGJvYXJkX2luaXRpYWxpc2VkID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoc2VsZWN0YWJsZV9sYXllcnMgPiAxKSB7XHJcbiAgICAgICAgbGF5ZXJzZWxlY3RkaXYuZmluZChcImxpXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5pZC5zcGxpdChcIi1cIilbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IG9sZCA9IGxheWVyc2VsZWN0ZGl2LmZpbmQoXCIjc2VsZWN0LVwiICsgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpO1xyXG4gICAgICAgICAgICBpZiAobmFtZSAhPT0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNlbGVjdGVkTGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJsYXllci1zZWxlY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIG9sZC5yZW1vdmVDbGFzcyhcImxheWVyLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldExheWVyKG5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxheWVyc2VsZWN0ZGl2LmhpZGUoKTtcclxuICAgIH1cclxufTtcclxuR2FtZU1hbmFnZXIucHJvdG90eXBlLmFkZFNoYXBlID0gZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcik7XHJcbiAgICBsYXllci5hZGRTaGFwZShjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlKSwgZmFsc2UpO1xyXG4gICAgbGF5ZXIuaW52YWxpZGF0ZSgpO1xyXG59O1xyXG5HYW1lTWFuYWdlci5wcm90b3R5cGUubW92ZVNoYXBlID0gZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICBzaGFwZSA9IE9iamVjdC5hc3NpZ24oZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBjcmVhdGVTaGFwZUZyb21EaWN0KHNoYXBlLCB0cnVlKSk7XHJcbiAgICBzaGFwZS5jaGVja0xpZ2h0U291cmNlcygpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKHNoYXBlLmxheWVyKS5vblNoYXBlTW92ZShzaGFwZSk7XHJcbn07XHJcbkdhbWVNYW5hZ2VyLnByb3RvdHlwZS51cGRhdGVTaGFwZSA9IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBjb25zdCBzaGFwZSA9IE9iamVjdC5hc3NpZ24oZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KGRhdGEuc2hhcGUudXVpZCksIGNyZWF0ZVNoYXBlRnJvbURpY3QoZGF0YS5zaGFwZSwgdHJ1ZSkpO1xyXG4gICAgc2hhcGUuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgIHNoYXBlLnNldE1vdmVtZW50QmxvY2soc2hhcGUubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICBpZiAoZGF0YS5yZWRyYXcpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKGRhdGEuc2hhcGUubGF5ZXIpLmludmFsaWRhdGUoKTtcclxufTtcclxuR2FtZU1hbmFnZXIucHJvdG90eXBlLnNldEluaXRpYXRpdmUgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuZGF0YSA9IGRhdGE7XHJcbiAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5yZWRyYXcoKTtcclxuICAgIGlmIChkYXRhLmxlbmd0aCA+IDApXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuZGlhbG9nKFwib3BlblwiKTtcclxufTtcclxuR2FtZU1hbmFnZXIucHJvdG90eXBlLnNldENsaWVudE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgaWYgKFwiZ3JpZENvbG91clwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuZ3JpZENvbG91ci5zcGVjdHJ1bShcInNldFwiLCBvcHRpb25zLmdyaWRDb2xvdXIpO1xyXG4gICAgaWYgKFwiZm93Q29sb3VyXCIgaW4gb3B0aW9ucyl7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwic2V0XCIsIG9wdGlvbnMuZm93Q29sb3VyKTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKFwicGFuWFwiIGluIG9wdGlvbnMpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblggPSBvcHRpb25zLnBhblg7XHJcbiAgICBpZiAoXCJwYW5ZXCIgaW4gb3B0aW9ucylcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWSA9IG9wdGlvbnMucGFuWTtcclxuICAgIGlmIChcInpvb21GYWN0b3JcIiBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IgPSBvcHRpb25zLnpvb21GYWN0b3I7XHJcbiAgICAgICAgJChcIiN6b29tZXJcIikuc2xpZGVyKHt2YWx1ZTogMS9vcHRpb25zLnpvb21GYWN0b3J9KTtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0R3JpZExheWVyKCkuaW52YWxpZGF0ZSgpO1xyXG4gICAgfVxyXG59O1xyXG5HYW1lTWFuYWdlci5wcm90b3R5cGUuc2V0dXBUb29scyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGNvbnN0IHRvb2xzZWxlY3REaXYgPSAkKFwiI3Rvb2xzZWxlY3RcIikuZmluZChcInVsXCIpO1xyXG4gICAgdG9vbHMuZm9yRWFjaChmdW5jdGlvbiAodG9vbCkge1xyXG4gICAgICAgIGlmICghdG9vbC5wbGF5ZXJUb29sICYmICFnYW1lTWFuYWdlci5JU19ETSkgcmV0dXJuO1xyXG4gICAgICAgIGNvbnN0IGV4dHJhID0gdG9vbC5kZWZhdWx0U2VsZWN0ID8gXCIgY2xhc3M9J3Rvb2wtc2VsZWN0ZWQnXCIgOiBcIlwiO1xyXG4gICAgICAgIGNvbnN0IHRvb2xMaSA9ICQoXCI8bGkgaWQ9J3Rvb2wtXCIgKyB0b29sLm5hbWUgKyBcIidcIiArIGV4dHJhICsgXCI+PGEgaHJlZj0nIyc+XCIgKyB0b29sLm5hbWUgKyBcIjwvYT48L2xpPlwiKTtcclxuICAgICAgICB0b29sc2VsZWN0RGl2LmFwcGVuZCh0b29sTGkpO1xyXG4gICAgICAgIGlmICh0b29sLmhhc0RldGFpbCkge1xyXG4gICAgICAgICAgICBjb25zdCBkaXYgPSB0b29sLmZ1bmMuZGV0YWlsRGl2O1xyXG4gICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmFwcGVuZChkaXYpO1xyXG4gICAgICAgICAgICBkaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b29sTGkub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gdG9vbHMuaW5kZXhPZih0b29sKTtcclxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wpIHtcclxuICAgICAgICAgICAgICAgICQoJy50b29sLXNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoXCJ0b29sLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInRvb2wtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2wgPSBpbmRleDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9ICQoJyN0b29sZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAodG9vbC5oYXNEZXRhaWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjdG9vbGRldGFpbCcpLmNoaWxkcmVuKCkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvb2wuZnVuYy5kZXRhaWxEaXYuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbC5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbC5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuXHJcbmxldCBnYW1lTWFuYWdlciA9IG5ldyBHYW1lTWFuYWdlcigpO1xyXG5cclxuXHJcbi8vICoqKiogU0VUVVAgVUkgKioqKlxyXG5jb25zdCB0b29scyA9IFtcclxuICAgIHtuYW1lOiBcInNlbGVjdFwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiB0cnVlLCBoYXNEZXRhaWw6IGZhbHNlLCBmdW5jOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXJ9LFxyXG4gICAge25hbWU6IFwicGFuXCIsIHBsYXllclRvb2w6IHRydWUsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IGZhbHNlLCBmdW5jOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXJ9LFxyXG4gICAge25hbWU6IFwiZHJhd1wiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiB0cnVlLCBmdW5jOiBnYW1lTWFuYWdlci5kcmF3VG9vbH0sXHJcbiAgICB7bmFtZTogXCJydWxlclwiLCBwbGF5ZXJUb29sOiB0cnVlLCBkZWZhdWx0U2VsZWN0OiBmYWxzZSwgaGFzRGV0YWlsOiBmYWxzZSwgZnVuYzogZ2FtZU1hbmFnZXIucnVsZXJUb29sfSxcclxuICAgIHtuYW1lOiBcImZvd1wiLCBwbGF5ZXJUb29sOiBmYWxzZSwgZGVmYXVsdFNlbGVjdDogZmFsc2UsIGhhc0RldGFpbDogdHJ1ZSwgZnVuYzogZ2FtZU1hbmFnZXIuZm93VG9vbH0sXHJcbiAgICB7bmFtZTogXCJtYXBcIiwgcGxheWVyVG9vbDogZmFsc2UsIGRlZmF1bHRTZWxlY3Q6IGZhbHNlLCBoYXNEZXRhaWw6IHRydWUsIGZ1bmM6IGdhbWVNYW5hZ2VyLm1hcFRvb2x9LFxyXG5dO1xyXG5cclxuLy8gcHJldmVudCBkb3VibGUgY2xpY2tpbmcgdGV4dCBzZWxlY3Rpb25cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3NlbGVjdHN0YXJ0JywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBvblBvaW50ZXJEb3duKGUpIHtcclxuICAgIGlmICghYm9hcmRfaW5pdGlhbGlzZWQpIHJldHVybjtcclxuICAgIGlmICgoZS5idXR0b24gIT09IDAgJiYgZS5idXR0b24gIT09IDEpIHx8IGUudGFyZ2V0LnRhZ05hbWUgIT09ICdDQU5WQVMnKSByZXR1cm47XHJcbiAgICAkbWVudS5oaWRlKCk7XHJcbiAgICB0b29sc1tnYW1lTWFuYWdlci5zZWxlY3RlZFRvb2xdLmZ1bmMub25Nb3VzZURvd24oZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUG9pbnRlck1vdmUoZSkge1xyXG4gICAgaWYgKCFib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgZS50YXJnZXQudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIHRvb2xzW2dhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbF0uZnVuYy5vbk1vdXNlTW92ZShlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25Qb2ludGVyVXAoZSkge1xyXG4gICAgaWYgKCFib2FyZF9pbml0aWFsaXNlZCkgcmV0dXJuO1xyXG4gICAgaWYgKChlLmJ1dHRvbiAhPT0gMCAmJiBlLmJ1dHRvbiAhPT0gMSkgfHwgZS50YXJnZXQudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIHRvb2xzW2dhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbF0uZnVuYy5vbk1vdXNlVXAoZSk7XHJcbn1cclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG9uUG9pbnRlckRvd24pO1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvblBvaW50ZXJNb3ZlKTtcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIG9uUG9pbnRlclVwKTtcclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZiAoIWJvYXJkX2luaXRpYWxpc2VkKSByZXR1cm47XHJcbiAgICBpZiAoZS5idXR0b24gIT09IDIgfHwgKDxIVE1MRWxlbWVudD5lLnRhcmdldCkudGFnTmFtZSAhPT0gJ0NBTlZBUycpIHJldHVybjtcclxuICAgIHRvb2xzW2dhbWVNYW5hZ2VyLnNlbGVjdGVkVG9vbF0uZnVuYy5vbkNvbnRleHRNZW51KGUpO1xyXG59KTtcclxuXHJcbiQoXCIjem9vbWVyXCIpLnNsaWRlcih7XHJcbiAgICBvcmllbnRhdGlvbjogXCJ2ZXJ0aWNhbFwiLFxyXG4gICAgbWluOiAwLjUsXHJcbiAgICBtYXg6IDUuMCxcclxuICAgIHN0ZXA6IDAuMSxcclxuICAgIHZhbHVlOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcixcclxuICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgY29uc3Qgb3JpZ1ogPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxuICAgICAgICBjb25zdCBuZXdaID0gMSAvIHVpLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IG9yaWdYID0gd2luZG93LmlubmVyV2lkdGggLyBvcmlnWjtcclxuICAgICAgICBjb25zdCBuZXdYID0gd2luZG93LmlubmVyV2lkdGggLyBuZXdaO1xyXG4gICAgICAgIGNvbnN0IG9yaWdZID0gd2luZG93LmlubmVySGVpZ2h0IC8gb3JpZ1o7XHJcbiAgICAgICAgY29uc3QgbmV3WSA9IHdpbmRvdy5pbm5lckhlaWdodCAvIG5ld1o7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3IgPSBuZXdaO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YIC09IChvcmlnWCAtIG5ld1gpIC8gMjtcclxuICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWSAtPSAob3JpZ1kgLSBuZXdZKSAvIDI7XHJcbiAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmludmFsaWRhdGUoKTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcInNldCBjbGllbnRPcHRpb25zXCIsIHt6b29tRmFjdG9yOiBuZXdaLCBwYW5YOiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIucGFuWCwgcGFuWTogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhbll9KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5jb25zdCAkbWVudSA9ICQoJyNjb250ZXh0TWVudScpO1xyXG4kbWVudS5oaWRlKCk7XHJcblxyXG5jb25zdCBzZWxlY3Rpb25JbmZvID0ge1xyXG4gICAgeDogJCgnI3NlbGVjdGlvbkluZm9YJyksXHJcbiAgICB5OiAkKCcjc2VsZWN0aW9uSW5mb1knKSxcclxuICAgIHc6ICQoJyNzZWxlY3Rpb25JbmZvVycpLFxyXG4gICAgaDogJCgnI3NlbGVjdGlvbkluZm9IJylcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldFNlbGVjdGlvbkluZm8oc2hhcGUpIHtcclxuICAgIHNlbGVjdGlvbkluZm8ueC52YWwoc2hhcGUueCk7XHJcbiAgICBzZWxlY3Rpb25JbmZvLnkudmFsKHNoYXBlLnkpO1xyXG4gICAgc2VsZWN0aW9uSW5mby53LnZhbChzaGFwZS53KTtcclxuICAgIHNlbGVjdGlvbkluZm8uaC52YWwoc2hhcGUuaCk7XHJcbn1cclxuXHJcbmNvbnN0IHNldHRpbmdzX21lbnUgPSAkKFwiI21lbnVcIik7XHJcbmNvbnN0IGxvY2F0aW9uc19tZW51ID0gJChcIiNsb2NhdGlvbnMtbWVudVwiKTtcclxuY29uc3QgbGF5ZXJfbWVudSA9ICQoXCIjbGF5ZXJzZWxlY3RcIik7XHJcbiQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG5cclxuJCgnI3JtLXNldHRpbmdzJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBvcmRlciBvZiBhbmltYXRpb24gaXMgaW1wb3J0YW50LCBpdCBvdGhlcndpc2Ugd2lsbCBzb21ldGltZXMgc2hvdyBhIHNtYWxsIGdhcCBiZXR3ZWVuIHRoZSB0d28gb2JqZWN0c1xyXG4gICAgaWYgKHNldHRpbmdzX21lbnUuaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICQoJyNyYWRpYWxtZW51JykuYW5pbWF0ZSh7bGVmdDogXCItPTIwMHB4XCJ9KTtcclxuICAgICAgICBzZXR0aW5nc19tZW51LmFuaW1hdGUoe3dpZHRoOiAndG9nZ2xlJ30pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoe2xlZnQ6IFwiLT0yMDBweFwiLCB3aWR0aDogXCIrPTIwMHB4XCJ9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoe2xlZnQ6IFwiLT0yMDBweFwifSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldHRpbmdzX21lbnUuYW5pbWF0ZSh7d2lkdGg6ICd0b2dnbGUnfSk7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHtsZWZ0OiBcIis9MjAwcHhcIn0pO1xyXG4gICAgICAgIGxvY2F0aW9uc19tZW51LmFuaW1hdGUoe2xlZnQ6IFwiKz0yMDBweFwiLCB3aWR0aDogXCItPTIwMHB4XCJ9KTtcclxuICAgICAgICBsYXllcl9tZW51LmFuaW1hdGUoe2xlZnQ6IFwiKz0yMDBweFwifSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJCgnI3JtLWxvY2F0aW9ucycpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gb3JkZXIgb2YgYW5pbWF0aW9uIGlzIGltcG9ydGFudCwgaXQgb3RoZXJ3aXNlIHdpbGwgc29tZXRpbWVzIHNob3cgYSBzbWFsbCBnYXAgYmV0d2VlbiB0aGUgdHdvIG9iamVjdHNcclxuICAgIGlmIChsb2NhdGlvbnNfbWVudS5pcyhcIjp2aXNpYmxlXCIpKSB7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHt0b3A6IFwiLT0xMDBweFwifSk7XHJcbiAgICAgICAgbG9jYXRpb25zX21lbnUuYW5pbWF0ZSh7aGVpZ2h0OiAndG9nZ2xlJ30pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhdGlvbnNfbWVudS5hbmltYXRlKHtoZWlnaHQ6ICd0b2dnbGUnfSk7XHJcbiAgICAgICAgJCgnI3JhZGlhbG1lbnUnKS5hbmltYXRlKHt0b3A6IFwiKz0xMDBweFwifSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxud2luZG93Lm9ucmVzaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFdpZHRoKHdpbmRvdy5pbm5lcldpZHRoKTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRIZWlnaHQod2luZG93LmlubmVySGVpZ2h0KTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5pbnZhbGlkYXRlKCk7XHJcbn07XHJcblxyXG4kKCdib2R5Jykua2V5dXAoZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmIChlLmtleUNvZGUgPT09IDQ2ICYmIGUudGFyZ2V0LnRhZ05hbWUgIT09IFwiSU5QVVRcIikge1xyXG4gICAgICAgIGNvbnN0IGwgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoKTtcclxuICAgICAgICBsLnNlbGVjdGlvbi5mb3JFYWNoKGZ1bmN0aW9uIChzZWwpIHtcclxuICAgICAgICAgICAgbC5yZW1vdmVTaGFwZShzZWwsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIucmVtb3ZlSW5pdGlhdGl2ZShzZWwudXVpZCwgdHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuJChcIiNncmlkU2l6ZUlucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCBncyA9IHBhcnNlSW50KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldEdyaWRTaXplKGdzKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGdyaWRzaXplXCIsIGdzKTtcclxufSk7XHJcblxyXG4kKFwiI3VuaXRTaXplSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVzID0gcGFyc2VJbnQoKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS52YWx1ZSk7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0VW5pdFNpemUodXMpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsndW5pdFNpemUnOiB1c30pO1xyXG59KTtcclxuJChcIiN1c2VHcmlkSW5wdXRcIikub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgIGNvbnN0IHVnID0gKDxIVE1MSW5wdXRFbGVtZW50PmUudGFyZ2V0KS5jaGVja2VkO1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldFVzZUdyaWQodWcpO1xyXG4gICAgc29ja2V0LmVtaXQoXCJzZXQgbG9jYXRpb25PcHRpb25zXCIsIHsndXNlR3JpZCc6IHVnfSk7XHJcbn0pO1xyXG4kKFwiI3VzZUZPV0lucHV0XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBjb25zdCB1ZiA9ICg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkuY2hlY2tlZDtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGdWxsRk9XKHVmKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7J2Z1bGxGT1cnOiB1Zn0pO1xyXG59KTtcclxuJChcIiNmb3dPcGFjaXR5XCIpLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBsZXQgZm8gPSBwYXJzZUZsb2F0KCg8SFRNTElucHV0RWxlbWVudD5lLnRhcmdldCkudmFsdWUpO1xyXG4gICAgaWYgKGlzTmFOKGZvKSkge1xyXG4gICAgICAgICQoXCIjZm93T3BhY2l0eVwiKS52YWwoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmZvd09wYWNpdHkpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmIChmbyA8IDApIGZvID0gMDtcclxuICAgIGlmIChmbyA+IDEpIGZvID0gMTtcclxuICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5zZXRGT1dPcGFjaXR5KGZvKTtcclxuICAgIHNvY2tldC5lbWl0KFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCB7J2Zvd09wYWNpdHknOiBmb30pO1xyXG59KTtcclxuXHJcbi8vICoqKiogVVRJTFMgKioqKlxyXG5cclxuZnVuY3Rpb24gT3JkZXJlZE1hcCgpIHtcclxuICAgIHRoaXMuZGF0YSA9IFtdO1xyXG59XHJcblxyXG5PcmRlcmVkTWFwLnByb3RvdHlwZSA9IFtdO1xyXG5PcmRlcmVkTWFwLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcclxuICAgIHRoaXMuZGF0YS5wdXNoKGVsZW1lbnQpO1xyXG59O1xyXG5PcmRlcmVkTWFwLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xyXG4gICAgdGhpcy5kYXRhLnNwbGljZSh0aGlzLmRhdGEuaW5kZXhPZihlbGVtZW50KSwgMSk7XHJcbn07XHJcbk9yZGVyZWRNYXAucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5pbmRleE9mKGVsZW1lbnQpO1xyXG59O1xyXG5PcmRlcmVkTWFwLnByb3RvdHlwZS5tb3ZlVG8gPSBmdW5jdGlvbiAoZWxlbWVudCwgaWR4KSB7XHJcbiAgICBjb25zdCBvbGRJZHggPSB0aGlzLmluZGV4T2YoZWxlbWVudCk7XHJcbiAgICBpZiAob2xkSWR4ID09PSBpZHgpIHJldHVybiBmYWxzZTtcclxuICAgIHRoaXMuZGF0YS5zcGxpY2Uob2xkSWR4LCAxKTtcclxuICAgIHRoaXMuZGF0YS5zcGxpY2UoaWR4LCAwLCBlbGVtZW50KTtcclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gSW5pdGlhdGl2ZVRyYWNrZXIoKSB7XHJcbiAgICB0aGlzLmRhdGEgPSBbXTtcclxufVxyXG5Jbml0aWF0aXZlVHJhY2tlci5wcm90b3R5cGUuYWRkSW5pdGlhdGl2ZSA9IGZ1bmN0aW9uIChkYXRhLCBzeW5jKSB7XHJcbiAgICAvLyBPcGVuIHRoZSBpbml0aWF0aXZlIHRyYWNrZXIgaWYgaXQgaXMgbm90IGN1cnJlbnRseSBvcGVuLlxyXG4gICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgfHwgIWdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwiaXNPcGVuXCIpKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZGlhbG9nKFwib3BlblwiKTtcclxuICAgIC8vIElmIG5vIGluaXRpYXRpdmUgZ2l2ZW4sIGFzc3VtZSBpdCAwXHJcbiAgICBpZiAoZGF0YS5pbml0aWF0aXZlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgZGF0YS5pbml0aWF0aXZlID0gMDtcclxuICAgIC8vIENoZWNrIGlmIHRoZSBzaGFwZSBpcyBhbHJlYWR5IGJlaW5nIHRyYWNrZWRcclxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09IGRhdGEudXVpZCk7XHJcbiAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihleGlzdGluZywgZGF0YSk7XHJcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YSk7XHJcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcclxuICAgIH1cclxuICAgIGlmIChzeW5jKVxyXG4gICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkYXRhKTtcclxufTtcclxuSW5pdGlhdGl2ZVRyYWNrZXIucHJvdG90eXBlLnJlbW92ZUluaXRpYXRpdmUgPSBmdW5jdGlvbiAodXVpZCwgc3luYywgc2tpcEdyb3VwQ2hlY2spIHtcclxuICAgIHNraXBHcm91cENoZWNrID0gc2tpcEdyb3VwQ2hlY2sgfHwgZmFsc2U7XHJcbiAgICBjb25zdCBkID0gdGhpcy5kYXRhLmZpbmRJbmRleChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICBpZiAoZCA+PSAwKSB7XHJcbiAgICAgICAgaWYgKCFza2lwR3JvdXBDaGVjayAmJiB0aGlzLmRhdGFbZF0uZ3JvdXApIHJldHVybjtcclxuICAgICAgICB0aGlzLmRhdGEuc3BsaWNlKGQsIDEpO1xyXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgaWYgKHN5bmMpXHJcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCB7dXVpZDogdXVpZH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHRoaXMuZGF0YS5sZW5ndGggPT09IDAgJiYgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJpc09wZW5cIikpXHJcbiAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZURpYWxvZy5kaWFsb2coXCJjbG9zZVwiKTtcclxufTtcclxuSW5pdGlhdGl2ZVRyYWNrZXIucHJvdG90eXBlLnJlZHJhdyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVEaWFsb2cuZW1wdHkoKTtcclxuXHJcbiAgICB0aGlzLmRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgIHJldHVybiBiLmluaXRpYXRpdmUgLSBhLmluaXRpYXRpdmU7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuXHJcbiAgICB0aGlzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIGlmIChkYXRhLm93bmVycyA9PT0gdW5kZWZpbmVkKSBkYXRhLm93bmVycyA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGltZyA9IGRhdGEuc3JjID09PSB1bmRlZmluZWQgPyAnJyA6ICQoYDxpbWcgc3JjPVwiJHtkYXRhLnNyY31cIiB3aWR0aD1cIjMwcHhcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj5gKTtcclxuICAgICAgICAvLyBjb25zdCBuYW1lID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJuYW1lXCIgZGF0YS11dWlkPVwiJHtzaC51dWlkfVwiIHZhbHVlPVwiJHtzaC5uYW1lfVwiIGRpc2FibGVkPSdkaXNhYmxlZCcgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgIGNvbnN0IHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwidmFsdWVcIiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIiB2YWx1ZT1cIiR7ZGF0YS5pbml0aWF0aXZlfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHZhbHVlXCI+YCk7XHJcbiAgICAgICAgY29uc3QgdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHtkYXRhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgIGNvbnN0IGdyb3VwID0gJChgPGRpdiBkYXRhLXV1aWQ9XCIke2RhdGEudXVpZH1cIj48aSBjbGFzcz1cImZhcyBmYS11c2Vyc1wiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICBjb25zdCByZW1vdmUgPSAkKGA8ZGl2IHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IHJlbW92ZVwiIGRhdGEtdXVpZD1cIiR7ZGF0YS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgdmlzaWJsZS5jc3MoXCJvcGFjaXR5XCIsIGRhdGEudmlzaWJsZSA/IFwiMS4wXCIgOiBcIjAuM1wiKTtcclxuICAgICAgICBncm91cC5jc3MoXCJvcGFjaXR5XCIsIGRhdGEuZ3JvdXAgPyBcIjEuMFwiIDogXCIwLjNcIik7XHJcbiAgICAgICAgaWYgKCFkYXRhLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKSB7XHJcbiAgICAgICAgICAgIHZhbC5wcm9wKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcclxuICAgICAgICAgICAgcmVtb3ZlLmNzcyhcIm9wYWNpdHlcIiwgXCIwLjNcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlRGlhbG9nLmFwcGVuZChpbWcpLmFwcGVuZCh2YWwpLmFwcGVuZCh2aXNpYmxlKS5hcHBlbmQoZ3JvdXApLmFwcGVuZChyZW1vdmUpO1xyXG5cclxuICAgICAgICB2YWwub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICBkLmluaXRpYXRpdmUgPSBwYXJzZUludCg8c3RyaW5nPiQodGhpcykudmFsKCkpIHx8IDA7XHJcbiAgICAgICAgICAgIHNlbGYuYWRkSW5pdGlhdGl2ZShkLCB0cnVlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHNlbGYuZGF0YS5maW5kKGQgPT4gZC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICBpZighZC5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBkLnZpc2libGUgPSAhZC52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMS4wKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBkKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGdyb3VwLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkID0gc2VsZi5kYXRhLmZpbmQoZCA9PiBkLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGQuZ3JvdXAgPSAhZC5ncm91cDtcclxuICAgICAgICAgICAgICAgIGlmIChkLmdyb3VwKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVJbml0aWF0aXZlXCIsIGQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmVtb3ZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGQgPSBzZWxmLmRhdGEuZmluZChkID0+IGQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgICAgIGlmKCFkLm93bmVycy5pbmNsdWRlcyhnYW1lTWFuYWdlci51c2VybmFtZSkgJiYgIWdhbWVNYW5hZ2VyLklTX0RNKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAkKGBbZGF0YS11dWlkPSR7dXVpZH1dYCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYucmVtb3ZlSW5pdGlhdGl2ZSh1dWlkLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ2FtZU1hbmFnZXI7IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHNvY2tldCBmcm9tIFwiLi9zb2NrZXRcIjtcclxuaW1wb3J0IHt1dWlkdjR9IGZyb20gXCIuL3V0aWxzXCI7XHJcbmltcG9ydCB7Z2V0TGluZXNJbnRlcnNlY3RQb2ludCwgZ2V0UG9pbnREaXN0YW5jZX0gZnJvbSBcIi4vZ2VvbVwiO1xyXG5pbXBvcnQge2wyd3gsIGwyd3ksIHcybCwgdzJsciwgdzJseCwgdzJseX0gZnJvbSBcIi4vdW5pdHNcIjtcclxuXHJcbmNvbnN0ICRtZW51ID0gJCgnI2NvbnRleHRNZW51Jyk7XHJcblxyXG5mdW5jdGlvbiBTaGFwZSgpIHtcclxuICAgIHRoaXMubGF5ZXIgPSBudWxsO1xyXG4gICAgdGhpcy5uYW1lID0gJ1Vua25vd24gc2hhcGUnO1xyXG4gICAgdGhpcy50cmFja2VycyA9IFtdO1xyXG4gICAgdGhpcy5hdXJhcyA9IFtdO1xyXG4gICAgdGhpcy5vd25lcnMgPSBbXTtcclxuICAgIHRoaXMudmlzaW9uT2JzdHJ1Y3Rpb24gPSBmYWxzZTtcclxuICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGZhbHNlO1xyXG59XHJcblxyXG5TaGFwZS5wcm90b3R5cGUuZ2V0Qm91bmRpbmdCb3ggPSBmdW5jdGlvbiAoKSB7fTtcclxuU2hhcGUucHJvdG90eXBlLmNoZWNrTGlnaHRTb3VyY2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICBjb25zdCB2b19pID0gZ2FtZU1hbmFnZXIubGlnaHRibG9ja2Vycy5pbmRleE9mKHRoaXMudXVpZCk7XHJcbiAgICBpZiAodGhpcy52aXNpb25PYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgIGVsc2UgaWYgKCF0aGlzLnZpc2lvbk9ic3RydWN0aW9uICYmIHZvX2kgPj0gMClcclxuICAgICAgICBnYW1lTWFuYWdlci5saWdodGJsb2NrZXJzLnNwbGljZSh2b19pLCAxKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB0aGUgbGlnaHRzb3VyY2UgYXVyYXMgYXJlIGluIHRoZSBnYW1lTWFuYWdlclxyXG4gICAgdGhpcy5hdXJhcy5mb3JFYWNoKGZ1bmN0aW9uIChhdSkge1xyXG4gICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzO1xyXG4gICAgICAgIGNvbnN0IGkgPSBscy5maW5kSW5kZXgobyA9PiBvLmF1cmEgPT09IGF1LnV1aWQpO1xyXG4gICAgICAgIGlmIChhdS5saWdodFNvdXJjZSAmJiBpID09PSAtMSkge1xyXG4gICAgICAgICAgICBscy5wdXNoKHtzaGFwZTogc2VsZi51dWlkLCBhdXJhOiBhdS51dWlkfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICghYXUubGlnaHRTb3VyY2UgJiYgaSA+PSAwKSB7XHJcbiAgICAgICAgICAgIGxzLnNwbGljZShpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIENoZWNrIGlmIGFueXRoaW5nIGluIHRoZSBnYW1lTWFuYWdlciByZWZlcmVuY2luZyB0aGlzIHNoYXBlIGlzIGluIGZhY3Qgc3RpbGwgYSBsaWdodHNvdXJjZVxyXG4gICAgZm9yIChsZXQgaT1nYW1lTWFuYWdlci5saWdodHNvdXJjZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pe1xyXG4gICAgICAgIGNvbnN0IGxzID0gZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzW2ldO1xyXG4gICAgICAgIGlmIChscy5zaGFwZSA9PT0gc2VsZi51dWlkKSB7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5zb21lKGEgPT4gYS51dWlkID09PSBscy5hdXJhICYmIGEubGlnaHRTb3VyY2UpKVxyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGlnaHRzb3VyY2VzLnNwbGljZShpLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblNoYXBlLnByb3RvdHlwZS5zZXRNb3ZlbWVudEJsb2NrID0gZnVuY3Rpb24gKGJsb2Nrc01vdmVtZW50KXtcclxuICAgIHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiA9IGJsb2Nrc01vdmVtZW50IHx8IGZhbHNlO1xyXG4gICAgY29uc3Qgdm9faSA9IGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuaW5kZXhPZih0aGlzLnV1aWQpO1xyXG4gICAgaWYgKHRoaXMubW92ZW1lbnRPYnN0cnVjdGlvbiAmJiB2b19pID09PSAtMSlcclxuICAgICAgICBnYW1lTWFuYWdlci5tb3ZlbWVudGJsb2NrZXJzLnB1c2godGhpcy51dWlkKTtcclxuICAgIGVsc2UgaWYgKCF0aGlzLm1vdmVtZW50T2JzdHJ1Y3Rpb24gJiYgdm9faSA+PSAwKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLm1vdmVtZW50YmxvY2tlcnMuc3BsaWNlKHZvX2ksIDEpO1xyXG59O1xyXG5TaGFwZS5wcm90b3R5cGUub3duZWRCeSA9IGZ1bmN0aW9uICh1c2VybmFtZSkge1xyXG4gICAgaWYgKHVzZXJuYW1lID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgdXNlcm5hbWUgPSBnYW1lTWFuYWdlci51c2VybmFtZTtcclxuICAgIHJldHVybiBnYW1lTWFuYWdlci5JU19ETSB8fCB0aGlzLm93bmVycy5pbmNsdWRlcyh1c2VybmFtZSk7XHJcbn07XHJcblNoYXBlLnByb3RvdHlwZS5vbk1vdXNlVXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyAkKGAjc2hhcGVzZWxlY3Rpb25jb2ctJHt0aGlzLnV1aWR9YCkucmVtb3ZlKCk7XHJcbiAgICAvLyBjb25zdCBjb2cgPSAkKGA8ZGl2IGlkPVwic2hhcGVzZWxlY3Rpb25jb2ctJHt0aGlzLnV1aWR9XCI+PGkgY2xhc3M9J2ZhIGZhLWNvZycgc3R5bGU9J2xlZnQ6JHt0aGlzLnh9O3RvcDoke3RoaXMueSArIHRoaXMuaCArIDEwfTt6LWluZGV4OjUwO3Bvc2l0aW9uOmFic29sdXRlOyc+PC9pPjwvZGl2PmApO1xyXG4gICAgLy8gY29nLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gICAgIHNoYXBlU2VsZWN0aW9uRGlhbG9nLmRpYWxvZyggXCJvcGVuXCIgKTtcclxuICAgIC8vIH0pO1xyXG4gICAgLy8gJChcImJvZHlcIikuYXBwZW5kKGNvZyk7XHJcbn07XHJcblNoYXBlLnByb3RvdHlwZS5vblNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcy50cmFja2Vycy5sZW5ndGggfHwgdGhpcy50cmFja2Vyc1t0aGlzLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHRoaXMudHJhY2tlcnNbdGhpcy50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpXHJcbiAgICAgICAgdGhpcy50cmFja2Vycy5wdXNoKHt1dWlkOiB1dWlkdjQoKSwgbmFtZTogJycsIHZhbHVlOiAnJywgbWF4dmFsdWU6ICcnLCB2aXNpYmxlOiBmYWxzZX0pO1xyXG4gICAgaWYgKCF0aGlzLmF1cmFzLmxlbmd0aCB8fCB0aGlzLmF1cmFzW3RoaXMuYXVyYXMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgdGhpcy5hdXJhc1t0aGlzLmF1cmFzLmxlbmd0aCAtIDFdLnZhbHVlICE9PSAnJylcclxuICAgICAgICB0aGlzLmF1cmFzLnB1c2goe3V1aWQ6IHV1aWR2NCgpLCBuYW1lOiAnJywgdmFsdWU6ICcnLCBkaW06ICcnLCBsaWdodFNvdXJjZTogZmFsc2UsIGNvbG91cjogJ3JnYmEoMCwwLDAsMCknLCB2aXNpYmxlOiBmYWxzZX0pO1xyXG4gICAgJChcIiNzZWxlY3Rpb24tbmFtZVwiKS50ZXh0KHRoaXMubmFtZSk7XHJcbiAgICBjb25zdCB0cmFja2VycyA9ICQoXCIjc2VsZWN0aW9uLXRyYWNrZXJzXCIpO1xyXG4gICAgdHJhY2tlcnMuZW1wdHkoKTtcclxuICAgIHRoaXMudHJhY2tlcnMuZm9yRWFjaChmdW5jdGlvbiAodHJhY2tlcikge1xyXG4gICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgdHJhY2tlcnMuYXBwZW5kKCQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tbmFtZVwiIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPiR7dHJhY2tlci5uYW1lfTwvZGl2PmApKTtcclxuICAgICAgICB0cmFja2Vycy5hcHBlbmQoXHJcbiAgICAgICAgICAgICQoYDxkaXYgaWQ9XCJzZWxlY3Rpb24tdHJhY2tlci0ke3RyYWNrZXIudXVpZH0tdmFsdWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiBjbGFzcz1cInNlbGVjdGlvbi10cmFja2VyLXZhbHVlXCI+JHt2YWx9PC9kaXY+YClcclxuICAgICAgICApO1xyXG4gICAgfSk7XHJcbiAgICBjb25zdCBhdXJhcyA9ICQoXCIjc2VsZWN0aW9uLWF1cmFzXCIpO1xyXG4gICAgYXVyYXMuZW1wdHkoKTtcclxuICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgIGNvbnN0IHZhbCA9IGF1cmEuZGltID8gYCR7YXVyYS52YWx1ZX0vJHthdXJhLmRpbX1gIDogYXVyYS52YWx1ZTtcclxuICAgICAgICBhdXJhcy5hcHBlbmQoJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS1uYW1lXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+JHthdXJhLm5hbWV9PC9kaXY+YCkpO1xyXG4gICAgICAgIGF1cmFzLmFwcGVuZChcclxuICAgICAgICAgICAgJChgPGRpdiBpZD1cInNlbGVjdGlvbi1hdXJhLSR7YXVyYS51dWlkfS12YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIGNsYXNzPVwic2VsZWN0aW9uLWF1cmEtdmFsdWVcIj4ke3ZhbH08L2Rpdj5gKVxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxuICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuc2hvdygpO1xyXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XHJcbiAgICBjb25zdCBlZGl0YnV0dG9uID0gJChcIiNzZWxlY3Rpb24tZWRpdC1idXR0b25cIik7XHJcbiAgICBpZiAoIXRoaXMub3duZWRCeSgpKVxyXG4gICAgICAgIGVkaXRidXR0b24uaGlkZSgpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGVkaXRidXR0b24uc2hvdygpO1xyXG4gICAgZWRpdGJ1dHRvbi5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKHNlbGYudXVpZCk7XHJcbiAgICAgICAgY29uc3QgZGlhbG9nX25hbWUgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLW5hbWVcIik7XHJcbiAgICAgICAgZGlhbG9nX25hbWUudmFsKHNlbGYubmFtZSk7XHJcbiAgICAgICAgZGlhbG9nX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zdCBzID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KCQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctdXVpZFwiKS52YWwoKSk7XHJcbiAgICAgICAgICAgIHMubmFtZSA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICQoXCIjc2VsZWN0aW9uLW5hbWVcIikudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogcy5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZX0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc3QgZGlhbG9nX2xpZ2h0YmxvY2sgPSAkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLWxpZ2h0YmxvY2tlclwiKTtcclxuICAgICAgICBkaWFsb2dfbGlnaHRibG9jay5wcm9wKFwiY2hlY2tlZFwiLCBzZWxmLnZpc2lvbk9ic3RydWN0aW9uKTtcclxuICAgICAgICBkaWFsb2dfbGlnaHRibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCgkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCkpO1xyXG4gICAgICAgICAgICBzLnZpc2lvbk9ic3RydWN0aW9uID0gZGlhbG9nX2xpZ2h0YmxvY2sucHJvcChcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgIHMuY2hlY2tMaWdodFNvdXJjZXMoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBkaWFsb2dfbW92ZWJsb2NrID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy1tb3ZlYmxvY2tlclwiKTtcclxuICAgICAgICBkaWFsb2dfbW92ZWJsb2NrLnByb3AoXCJjaGVja2VkXCIsIHNlbGYubW92ZW1lbnRPYnN0cnVjdGlvbik7XHJcbiAgICAgICAgZGlhbG9nX21vdmVibG9jay5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldCgkKFwiI3NoYXBlc2VsZWN0aW9uZGlhbG9nLXV1aWRcIikudmFsKCkpO1xyXG4gICAgICAgICAgICBzLnNldE1vdmVtZW50QmxvY2soZGlhbG9nX21vdmVibG9jay5wcm9wKFwiY2hlY2tlZFwiKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IG93bmVycyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctb3duZXJzXCIpO1xyXG4gICAgICAgIGNvbnN0IHRyYWNrZXJzID0gJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZy10cmFja2Vyc1wiKTtcclxuICAgICAgICBjb25zdCBhdXJhcyA9ICQoXCIjc2hhcGVzZWxlY3Rpb25kaWFsb2ctYXVyYXNcIik7XHJcbiAgICAgICAgb3duZXJzLm5leHRVbnRpbCh0cmFja2VycykucmVtb3ZlKCk7XHJcbiAgICAgICAgdHJhY2tlcnMubmV4dFVudGlsKGF1cmFzKS5yZW1vdmUoKTtcclxuICAgICAgICBhdXJhcy5uZXh0VW50aWwoJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5maW5kKFwiZm9ybVwiKSkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZE93bmVyKG93bmVyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG93X25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLW5hbWU9XCIke293bmVyfVwiIHZhbHVlPVwiJHtvd25lcn1cIiBzdHlsZT1cImdyaWQtY29sdW1uLXN0YXJ0OiBuYW1lXCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG93X3JlbW92ZSA9ICQoYDxkaXYgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogcmVtb3ZlXCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgdHJhY2tlcnMuYmVmb3JlKG93X25hbWUuYWRkKG93X3JlbW92ZSkpO1xyXG5cclxuICAgICAgICAgICAgb3dfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvd19pID0gc2VsZi5vd25lcnMuZmluZEluZGV4KG8gPT4gbyA9PT0gJCh0aGlzKS5kYXRhKCduYW1lJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG93X2kgPj0gMClcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm93bmVycy5zcGxpY2Uob3dfaSwgMSwgJCh0aGlzKS52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vd25lcnMucHVzaCgkKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYub3duZXJzLmxlbmd0aCB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXS5uYW1lICE9PSAnJyB8fCBzZWxmLm93bmVyc1tzZWxmLm93bmVycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIG93X3JlbW92ZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG93ID0gc2VsZi5vd25lcnMuZmluZChvID0+IG8udXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5vd25lcnMuc3BsaWNlKHNlbGYub3duZXJzLmluZGV4T2Yob3cpLCAxKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZi5vd25lcnMuZm9yRWFjaChhZGRPd25lcik7XHJcbiAgICAgICAgaWYgKCFzZWxmLm93bmVycy5sZW5ndGggfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0ubmFtZSAhPT0gJycgfHwgc2VsZi5vd25lcnNbc2VsZi5vd25lcnMubGVuZ3RoIC0gMV0udmFsdWUgIT09ICcnKVxyXG4gICAgICAgICAgICBhZGRPd25lcihcIlwiKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkVHJhY2tlcih0cmFja2VyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyX25hbWUgPSAkKGA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIm5hbWVcIiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIiB2YWx1ZT1cIiR7dHJhY2tlci5uYW1lfVwiIHN0eWxlPVwiZ3JpZC1jb2x1bW4tc3RhcnQ6IG5hbWVcIj5gKTtcclxuICAgICAgICAgICAgY29uc3QgdHJfdmFsID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJDdXJyZW50IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIudmFsdWV9XCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRyX21heHZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiTWF4IHZhbHVlXCIgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCIgdmFsdWU9XCIke3RyYWNrZXIubWF4dmFsdWUgfHwgXCJcIn1cIj5gKTtcclxuICAgICAgICAgICAgY29uc3QgdHJfdmlzaWJsZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtZXllXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICBjb25zdCB0cl9yZW1vdmUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLXRyYXNoLWFsdFwiPjwvaT48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgICAgIGF1cmFzLmJlZm9yZShcclxuICAgICAgICAgICAgICAgIHRyX25hbWVcclxuICAgICAgICAgICAgICAgICAgICAuYWRkKHRyX3ZhbClcclxuICAgICAgICAgICAgICAgICAgICAuYWRkKGA8c3BhbiBkYXRhLXV1aWQ9XCIke3RyYWNrZXIudXVpZH1cIj4vPC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl9tYXh2YWwpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZChgPHNwYW4gZGF0YS11dWlkPVwiJHt0cmFja2VyLnV1aWR9XCI+PC9zcGFuPmApXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZCh0cl92aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7dHJhY2tlci51dWlkfVwiPjwvc3Bhbj5gKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGQodHJfcmVtb3ZlKVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYoIXRyYWNrZXIudmlzaWJsZSlcclxuICAgICAgICAgICAgICAgIHRyX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICAgICAgdHJfbmFtZS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgdHIubmFtZSA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS1uYW1lYCkudGV4dCg8c3RyaW5nPiQodGhpcykudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2V9KTtcclxuICAgICAgICAgICAgICAgIGlmICghc2VsZi50cmFja2Vycy5sZW5ndGggfHwgc2VsZi50cmFja2Vyc1tzZWxmLnRyYWNrZXJzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYudHJhY2tlcnNbc2VsZi50cmFja2Vycy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRyYWNrZXJzLnB1c2goe3V1aWQ6IHV1aWR2NCgpLCBuYW1lOiAnJywgdmFsdWU6ICcnLCBtYXh2YWx1ZTogJycsIHZpc2libGU6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRkVHJhY2tlcihzZWxmLnRyYWNrZXJzW3NlbGYudHJhY2tlcnMubGVuZ3RoIC0gMV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdHJfdmFsLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyID0gc2VsZi50cmFja2Vycy5maW5kKHQgPT4gdC51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICB0ci52YWx1ZSA9ICQodGhpcykudmFsKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSB0ci5tYXh2YWx1ZSA/IGAke3RyLnZhbHVlfS8ke3RyLm1heHZhbHVlfWAgOiB0ci52YWx1ZTtcclxuICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tdHJhY2tlci0ke3RyLnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2V9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRyX21heHZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgdHIubWF4dmFsdWUgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsID0gdHIubWF4dmFsdWUgPyBgJHt0ci52YWx1ZX0vJHt0ci5tYXh2YWx1ZX1gIDogdHIudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLXRyYWNrZXItJHt0ci51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IGZhbHNlfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0cl9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRyLm5hbWUgPT09ICcnIHx8IHRyLnZhbHVlID09PSAnJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke3RyLnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi50cmFja2Vycy5zcGxpY2Uoc2VsZi50cmFja2Vycy5pbmRleE9mKHRyKSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiBmYWxzZX0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdHJfdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHIgPSBzZWxmLnRyYWNrZXJzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGlmICh0ci52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgdHIudmlzaWJsZSA9ICF0ci52aXNpYmxlO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYudHJhY2tlcnMuZm9yRWFjaChhZGRUcmFja2VyKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gYWRkQXVyYShhdXJhKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1cmFfbmFtZSA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwibmFtZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLm5hbWV9XCIgc3R5bGU9XCJncmlkLWNvbHVtbi1zdGFydDogbmFtZVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhX3ZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiQ3VycmVudCB2YWx1ZVwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiIHZhbHVlPVwiJHthdXJhLnZhbHVlfVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhX2RpbXZhbCA9ICQoYDxpbnB1dCB0eXBlPVwidGV4dFwiIHRpdGxlPVwiRGltIHZhbHVlXCIgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCIgdmFsdWU9XCIke2F1cmEuZGltIHx8IFwiXCJ9XCI+YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1cmFfY29sb3VyID0gJChgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgdGl0bGU9XCJBdXJhIGNvbG91clwiIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPmApO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhX3Zpc2libGUgPSAkKGA8ZGl2IGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV5ZVwiPjwvaT48L2Rpdj5gKTtcclxuICAgICAgICAgICAgY29uc3QgYXVyYV9saWdodCA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtbGlnaHRidWxiXCI+PC9pPjwvZGl2PmApO1xyXG4gICAgICAgICAgICBjb25zdCBhdXJhX3JlbW92ZSA9ICQoYDxkaXYgZGF0YS11dWlkPVwiJHthdXJhLnV1aWR9XCI+PGkgY2xhc3M9XCJmYXMgZmEtdHJhc2gtYWx0XCI+PC9pPjwvZGl2PmApO1xyXG5cclxuICAgICAgICAgICAgJChcIiNzaGFwZXNlbGVjdGlvbmRpYWxvZ1wiKS5jaGlsZHJlbigpLmxhc3QoKS5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICBhdXJhX25hbWVcclxuICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmFsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGQoYDxzcGFuIGRhdGEtdXVpZD1cIiR7YXVyYS51dWlkfVwiPi88L3NwYW4+YClcclxuICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfZGltdmFsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGQoJChgPGRpdiBkYXRhLXV1aWQ9XCIke2F1cmEudXVpZH1cIj5gKS5hcHBlbmQoYXVyYV9jb2xvdXIpLmFwcGVuZCgkKFwiPC9kaXY+XCIpKSlcclxuICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfdmlzaWJsZSlcclxuICAgICAgICAgICAgICAgICAgICAuYWRkKGF1cmFfbGlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZChhdXJhX3JlbW92ZSlcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCFhdXJhLnZpc2libGUpXHJcbiAgICAgICAgICAgICAgICBhdXJhX3Zpc2libGUuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICBpZighYXVyYS5saWdodFNvdXJjZSlcclxuICAgICAgICAgICAgICAgIGF1cmFfbGlnaHQuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG5cclxuICAgICAgICAgICAgYXVyYV9jb2xvdXIuc3BlY3RydW0oe1xyXG4gICAgICAgICAgICAgICAgc2hvd0lucHV0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2hvd0FscGhhOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6IGF1cmEuY29sb3VyLFxyXG4gICAgICAgICAgICAgICAgbW92ZTogZnVuY3Rpb24gKGNvbG91cikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1ID0gc2VsZi5hdXJhcy5maW5kKGEgPT4gYS51dWlkID09PSAkKHRoaXMpLmRhdGEoJ3V1aWQnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gbm90IHVzZSBhdXJhIGRpcmVjdGx5IGFzIGl0IGRvZXMgbm90IHdvcmsgcHJvcGVybHkgZm9yIG5ldyBhdXJhc1xyXG4gICAgICAgICAgICAgICAgICAgIGF1LmNvbG91ciA9IGNvbG91ci50b1JnYlN0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKS5pbnZhbGlkYXRlKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNoYW5nZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWV9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBhdXJhX25hbWUub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQoYSA9PiBhLnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGF1Lm5hbWUgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgJChgI3NlbGVjdGlvbi1hdXJhLSR7YXUudXVpZH0tbmFtZWApLnRleHQoPHN0cmluZz4kKHRoaXMpLnZhbCgpKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWV9KTtcclxuICAgICAgICAgICAgICAgIGlmICghc2VsZi5hdXJhcy5sZW5ndGggfHwgc2VsZi5hdXJhc1tzZWxmLmF1cmFzLmxlbmd0aCAtIDFdLm5hbWUgIT09ICcnIHx8IHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXS52YWx1ZSAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmF1cmFzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkdjQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGltOiAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlnaHRTb3VyY2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvdXI6ICdyZ2JhKDAsMCwwLDApJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhZGRBdXJhKHNlbGYuYXVyYXNbc2VsZi5hdXJhcy5sZW5ndGggLSAxXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhdXJhX3ZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgYXUudmFsdWUgPSAkKHRoaXMpLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsID0gYXUuZGltID8gYCR7YXUudmFsdWV9LyR7YXUuZGltfWAgOiBhdS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICQoYCNzZWxlY3Rpb24tYXVyYS0ke2F1LnV1aWR9LXZhbHVlYCkudGV4dCh2YWwpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgICAgICAgICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKGF1LmxheWVyKS5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhdXJhX2RpbXZhbC5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgYXUuZGltID0gJCh0aGlzKS52YWwoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGF1LmRpbSA/IGAke2F1LnZhbHVlfS8ke2F1LmRpbX1gIDogYXUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAkKGAjc2VsZWN0aW9uLWF1cmEtJHthdS51dWlkfS12YWx1ZWApLnRleHQodmFsKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWV9KTtcclxuICAgICAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihhdS5sYXllcikuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYXVyYV9yZW1vdmUub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdSA9IHNlbGYuYXVyYXMuZmluZCh0ID0+IHQudXVpZCA9PT0gJCh0aGlzKS5kYXRhKCd1dWlkJykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF1Lm5hbWUgPT09ICcnICYmIGF1LnZhbHVlID09PSAnJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgJChgW2RhdGEtdXVpZD0ke2F1LnV1aWR9XWApLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5hdXJhcy5zcGxpY2Uoc2VsZi5hdXJhcy5pbmRleE9mKGF1KSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmNoZWNrTGlnaHRTb3VyY2VzKCk7XHJcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcInVwZGF0ZVNoYXBlXCIsIHtzaGFwZTogc2VsZi5hc0RpY3QoKSwgcmVkcmF3OiB0cnVlfSk7XHJcbiAgICAgICAgICAgICAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoYXUubGF5ZXIpLmludmFsaWRhdGUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGF1cmFfdmlzaWJsZS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGF1LnZpc2libGUgPSAhYXUudmlzaWJsZTtcclxuICAgICAgICAgICAgICAgIGlmIChhdS52aXNpYmxlKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAwLjMpO1xyXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgYXVyYV9saWdodC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXUgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09ICQodGhpcykuZGF0YSgndXVpZCcpKTtcclxuICAgICAgICAgICAgICAgIGF1LmxpZ2h0U291cmNlID0gIWF1LmxpZ2h0U291cmNlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbHMgPSBnYW1lTWFuYWdlci5saWdodHNvdXJjZXM7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpID0gbHMuZmluZEluZGV4KG8gPT4gby5hdXJhID09PSBhdS51dWlkKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdS5saWdodFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuY3NzKFwib3BhY2l0eVwiLCAxLjApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbHMucHVzaCh7c2hhcGU6IHNlbGYudXVpZCwgYXVyYTogYXUudXVpZH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmNzcyhcIm9wYWNpdHlcIiwgMC4zKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBscy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmb3dsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZvd2wgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICBmb3dsLmludmFsaWRhdGUoKTtcclxuICAgICAgICAgICAgICAgIHNvY2tldC5lbWl0KFwidXBkYXRlU2hhcGVcIiwge3NoYXBlOiBzZWxmLmFzRGljdCgpLCByZWRyYXc6IHRydWV9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYuYXVyYXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgYWRkQXVyYShzZWxmLmF1cmFzW2ldKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBnYW1lTWFuYWdlci5zaGFwZVNlbGVjdGlvbkRpYWxvZy5kaWFsb2coXCJvcGVuXCIpO1xyXG4gICAgfSk7XHJcbiAgICAkKCcuc2VsZWN0aW9uLXRyYWNrZXItdmFsdWUnKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zdCB1dWlkID0gJCh0aGlzKS5kYXRhKCd1dWlkJyk7XHJcbiAgICAgICAgY29uc3QgdHJhY2tlciA9IHNlbGYudHJhY2tlcnMuZmluZCh0ID0+IHQudXVpZCA9PT0gdXVpZCk7XHJcbiAgICAgICAgY29uc3QgbmV3X3RyYWNrZXIgPSBwcm9tcHQoYE5ldyAgJHt0cmFja2VyLm5hbWV9IHZhbHVlOiAoYWJzb2x1dGUgb3IgcmVsYXRpdmUpYCk7XHJcbiAgICAgICAgaWYgKG5ld190cmFja2VyWzBdID09PSAnKycpIHtcclxuICAgICAgICAgICAgdHJhY2tlci52YWx1ZSArPSBwYXJzZUludChuZXdfdHJhY2tlci5zbGljZSgxKSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXdfdHJhY2tlclswXSA9PT0gJy0nKSB7XHJcbiAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgLT0gcGFyc2VJbnQobmV3X3RyYWNrZXIuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRyYWNrZXIudmFsdWUgPSBwYXJzZUludChuZXdfdHJhY2tlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHZhbCA9IHRyYWNrZXIubWF4dmFsdWUgPyBgJHt0cmFja2VyLnZhbHVlfS8ke3RyYWNrZXIubWF4dmFsdWV9YCA6IHRyYWNrZXIudmFsdWU7XHJcbiAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogZmFsc2V9KTtcclxuICAgIH0pO1xyXG4gICAgJCgnLnNlbGVjdGlvbi1hdXJhLXZhbHVlJykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uc3QgdXVpZCA9ICQodGhpcykuZGF0YSgndXVpZCcpO1xyXG4gICAgICAgIGNvbnN0IGF1cmEgPSBzZWxmLmF1cmFzLmZpbmQodCA9PiB0LnV1aWQgPT09IHV1aWQpO1xyXG4gICAgICAgIGNvbnN0IG5ld19hdXJhID0gcHJvbXB0KGBOZXcgICR7YXVyYS5uYW1lfSB2YWx1ZTogKGFic29sdXRlIG9yIHJlbGF0aXZlKWApO1xyXG4gICAgICAgIGlmIChuZXdfYXVyYVswXSA9PT0gJysnKSB7XHJcbiAgICAgICAgICAgIGF1cmEudmFsdWUgKz0gcGFyc2VJbnQobmV3X2F1cmEuc2xpY2UoMSkpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobmV3X2F1cmFbMF0gPT09ICctJykge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlIC09IHBhcnNlSW50KG5ld19hdXJhLnNsaWNlKDEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhdXJhLnZhbHVlID0gcGFyc2VJbnQobmV3X2F1cmEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWwgPSBhdXJhLmRpbSA/IGAke2F1cmEudmFsdWV9LyR7YXVyYS5kaW19YCA6IGF1cmEudmFsdWU7XHJcbiAgICAgICAgJCh0aGlzKS50ZXh0KHZhbCk7XHJcbiAgICAgICAgc29ja2V0LmVtaXQoXCJ1cGRhdGVTaGFwZVwiLCB7c2hhcGU6IHNlbGYuYXNEaWN0KCksIHJlZHJhdzogdHJ1ZX0pO1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzZWxmLmxheWVyKS5pbnZhbGlkYXRlKCk7XHJcbiAgICB9KTtcclxufTtcclxuU2hhcGUucHJvdG90eXBlLm9uU2VsZWN0aW9uTG9zcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vICQoYCNzaGFwZXNlbGVjdGlvbmNvZy0ke3RoaXMudXVpZH1gKS5yZW1vdmUoKTtcclxuICAgICQoXCIjc2VsZWN0aW9uLW1lbnVcIikuaGlkZSgpO1xyXG59O1xyXG5TaGFwZS5wcm90b3R5cGUub25SZW1vdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyAkKGAjc2hhcGVzZWxlY3Rpb25jb2ctJHt0aGlzLnV1aWR9YCkucmVtb3ZlKCk7XHJcbn07XHJcblNoYXBlLnByb3RvdHlwZS5hc0RpY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XHJcbn07XHJcblNoYXBlLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgaWYgKHRoaXMubGF5ZXIgPT09ICdmb3cnKSB7XHJcbiAgICAgICAgdGhpcy5maWxsID0gZ2FtZU1hbmFnZXIuZm93Q29sb3VyLnNwZWN0cnVtKFwiZ2V0XCIpLnRvUmdiU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gIT09IHVuZGVmaW5lZClcclxuICAgICAgICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gdGhpcy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb247XHJcbiAgICBlbHNlXHJcbiAgICAgICAgY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9IFwic291cmNlLW92ZXJcIjtcclxuICAgIHRoaXMuZHJhd0F1cmFzKGN0eCk7XHJcbn07XHJcblNoYXBlLnByb3RvdHlwZS5kcmF3QXVyYXMgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBjb25zdCBzZWxmID0gdGhpcztcclxuICAgIHRoaXMuYXVyYXMuZm9yRWFjaChmdW5jdGlvbiAoYXVyYSkge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKFwiZm93XCIpLmN0eCA9PT0gY3R4ID8gXCJibGFja1wiIDogYXVyYS5jb2xvdXI7XHJcbiAgICAgICAgY29uc3QgbG9jID0gdzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgIGN0eC5hcmMobG9jLngsIGxvYy55LCB3MmxyKGF1cmEudmFsdWUpLCAwLCAyICogTWF0aC5QSSk7XHJcbiAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICBpZiAoYXVyYS5kaW0pIHtcclxuICAgICAgICAgICAgY29uc3QgdGMgPSB0aW55Y29sb3IoYXVyYS5jb2xvdXIpO1xyXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0Yy5zZXRBbHBoYSh0Yy5nZXRBbHBoYSgpIC8gMikudG9SZ2JTdHJpbmcoKTtcclxuICAgICAgICAgICAgY29uc3QgbG9jID0gdzJsKHNlbGYuY2VudGVyKCkpO1xyXG4gICAgICAgICAgICBjdHguYXJjKGxvYy54LCBsb2MueSwgdzJscihhdXJhLmRpbSksIDAsIDIgKiBNYXRoLlBJKTtcclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuU2hhcGUucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5TaGFwZS5wcm90b3R5cGUuc2hvd0NvbnRleHRNZW51ID0gZnVuY3Rpb24gKG1vdXNlKSB7XHJcbiAgICBjb25zdCBsID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKCk7XHJcbiAgICBsLnNlbGVjdGlvbiA9IFt0aGlzXTtcclxuICAgIHRoaXMub25TZWxlY3Rpb24oKTtcclxuICAgIGwuaW52YWxpZGF0ZSh0cnVlKTtcclxuICAgIGNvbnN0IGFzc2V0ID0gdGhpcztcclxuICAgICRtZW51LnNob3coKTtcclxuICAgICRtZW51LmVtcHR5KCk7XHJcbiAgICAkbWVudS5jc3Moe2xlZnQ6IG1vdXNlLngsIHRvcDogbW91c2UueX0pO1xyXG4gICAgbGV0IGRhdGEgPSBcIlwiICtcclxuICAgICAgICBcIjx1bD5cIiArXHJcbiAgICAgICAgXCI8bGk+TGF5ZXI8dWw+XCI7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIubGF5ZXJzLmZvckVhY2goZnVuY3Rpb24gKGxheWVyKSB7XHJcbiAgICAgICAgaWYgKCFsYXllci5zZWxlY3RhYmxlKSByZXR1cm47XHJcbiAgICAgICAgY29uc3Qgc2VsID0gbGF5ZXIubmFtZSA9PT0gbC5uYW1lID8gXCIgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6YXF1YScgXCIgOiBcIiBcIjtcclxuICAgICAgICBkYXRhICs9IGA8bGkgZGF0YS1hY3Rpb249J3NldExheWVyJyBkYXRhLWxheWVyPScke2xheWVyLm5hbWV9JyAke3NlbH0gY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz4ke2xheWVyLm5hbWV9PC9saT5gO1xyXG4gICAgfSk7XHJcbiAgICBkYXRhICs9IFwiPC91bD48L2xpPlwiICtcclxuICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvQmFjaycgY2xhc3M9J2NvbnRleHQtY2xpY2thYmxlJz5Nb3ZlIHRvIGJhY2s8L2xpPlwiICtcclxuICAgICAgICBcIjxsaSBkYXRhLWFjdGlvbj0nbW92ZVRvRnJvbnQnIGNsYXNzPSdjb250ZXh0LWNsaWNrYWJsZSc+TW92ZSB0byBmcm9udDwvbGk+XCIgK1xyXG4gICAgICAgIFwiPGxpIGRhdGEtYWN0aW9uPSdhZGRJbml0aWF0aXZlJyBjbGFzcz0nY29udGV4dC1jbGlja2FibGUnPkFkZCBpbml0aWF0aXZlPC9saT5cIiArXHJcbiAgICAgICAgXCI8L3VsPlwiO1xyXG4gICAgJG1lbnUuaHRtbChkYXRhKTtcclxuICAgICQoXCIuY29udGV4dC1jbGlja2FibGVcIikub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGhhbmRsZUNvbnRleHRNZW51KCQodGhpcyksIGFzc2V0KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEJvdW5kaW5nUmVjdCh4LCB5LCB3LCBoKSB7XHJcbiAgICB0aGlzLnR5cGUgPSBcImJvdW5kcmVjdFwiO1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgICB0aGlzLncgPSB3O1xyXG4gICAgdGhpcy5oID0gaDtcclxufVxyXG5Cb3VuZGluZ1JlY3QucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKG14LCBteSwgd29ybGQpIHtcclxuICAgIGlmICh3b3JsZCA9PT0gdW5kZWZpbmVkIHx8IHdvcmxkID09PSB0cnVlKXtcclxuICAgICAgICBteCA9IGwyd3gobXgpO1xyXG4gICAgICAgIG15ID0gbDJ3eShteSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy54IDw9IG14ICYmICh0aGlzLnggKyB0aGlzLncpID49IG14ICYmXHJcbiAgICAgICAgdGhpcy55IDw9IG15ICYmICh0aGlzLnkgKyB0aGlzLmgpID49IG15O1xyXG59O1xyXG5Cb3VuZGluZ1JlY3QucHJvdG90eXBlLmludGVyc2VjdHNXaXRoID0gZnVuY3Rpb24gKG90aGVyKSB7XHJcbiAgICByZXR1cm4gIShvdGhlci54ID49IHRoaXMueCArIHRoaXMudyB8fFxyXG4gICAgICAgICAgIG90aGVyLnggKyBvdGhlci53IDw9IHRoaXMueCB8fFxyXG4gICAgICAgICAgIG90aGVyLnkgPj0gdGhpcy55ICsgdGhpcy5oIHx8XHJcbiAgICAgICAgICAgb3RoZXIueSArIG90aGVyLmggPD0gdGhpcy55KTtcclxufTtcclxuQm91bmRpbmdSZWN0LnByb3RvdHlwZS5nZXRJbnRlcnNlY3RXaXRoTGluZSA9IGZ1bmN0aW9uIChsaW5lKSB7XHJcbiAgICBjb25zdCBsaW5lcyA9IFtcclxuICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHt4OiB0aGlzLngsIHk6IHRoaXMueX0sIHt4OiB0aGlzLnggKyB0aGlzLncsIHk6IHRoaXMueX0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHt4OiB0aGlzLnggKyB0aGlzLncsIHk6IHRoaXMueX0sIHt4OiB0aGlzLnggKyB0aGlzLncsIHk6IHRoaXMueSArIHRoaXMuaH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHt4OiB0aGlzLngsIHk6IHRoaXMueX0sIHt4OiB0aGlzLngsIHk6IHRoaXMueSArIHRoaXMuaH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKSxcclxuICAgICAgICBnZXRMaW5lc0ludGVyc2VjdFBvaW50KHt4OiB0aGlzLngsIHk6IHRoaXMueSArIHRoaXMuaH0sIHt4OiB0aGlzLnggKyB0aGlzLncsIHk6IHRoaXMueSArIHRoaXMuaH0sIGxpbmUuc3RhcnQsIGxpbmUuZW5kKVxyXG4gICAgXTtcclxuICAgIGxldCBtaW5fZCA9IEluZmluaXR5O1xyXG4gICAgbGV0IG1pbl9pID0gbnVsbDtcclxuICAgIGZvciAobGV0IGk9MDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICBpZiAobGluZXNbaV0gPT09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnN0IGQgPSBnZXRQb2ludERpc3RhbmNlKGxpbmUuc3RhcnQsIGxpbmVzW2ldKTtcclxuICAgICAgICBpZiAobWluX2QgPiBkKSB7XHJcbiAgICAgICAgICAgIG1pbl9kID0gZDtcclxuICAgICAgICAgICAgbWluX2kgPSBsaW5lc1tpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge2ludGVyc2VjdDogbWluX2ksIGRpc3RhbmNlOiBtaW5fZH1cclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBSZWN0KHgsIHksIHcsIGgsIGZpbGw/LCBib3JkZXI/LCB1dWlkPyk6IHZvaWQge1xyXG4gICAgU2hhcGUuY2FsbCh0aGlzKTtcclxuICAgIHRoaXMudHlwZSA9IFwicmVjdFwiO1xyXG4gICAgdGhpcy54ID0geCB8fCAwO1xyXG4gICAgdGhpcy55ID0geSB8fCAwO1xyXG4gICAgdGhpcy53ID0gdyB8fCAxO1xyXG4gICAgdGhpcy5oID0gaCB8fCAxO1xyXG4gICAgdGhpcy5maWxsID0gZmlsbCB8fCAnIzAwMCc7XHJcbiAgICB0aGlzLmJvcmRlciA9IGJvcmRlciB8fCBcInJnYmEoMCwgMCwgMCwgMClcIjtcclxuICAgIHRoaXMudXVpZCA9IHV1aWQgfHwgdXVpZHY0KCk7XHJcbn1cclxuXHJcblJlY3QucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTaGFwZS5wcm90b3R5cGUpO1xyXG5SZWN0LnByb3RvdHlwZS5nZXRCb3VuZGluZ0JveCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KHRoaXMueCwgdGhpcy55LCB0aGlzLncsIHRoaXMuaCk7XHJcbn07XHJcblJlY3QucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBTaGFwZS5wcm90b3R5cGUuZHJhdy5jYWxsKHRoaXMsIGN0eCk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgY29uc3QgbG9jID0gdzJsKHt4OiB0aGlzLngsIHk6IHRoaXMueX0pO1xyXG4gICAgY3R4LmZpbGxSZWN0KGxvYy54LCBsb2MueSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbiAgICBpZiAodGhpcy5ib3JkZXIgIT09IFwicmdiYSgwLCAwLCAwLCAwKVwiKSB7XHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QobG9jLngsIGxvYy55LCB0aGlzLncgKiB6LCB0aGlzLmggKiB6KTtcclxuICAgIH1cclxufTtcclxuUmVjdC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAobXgsIG15LCB3b3JsZCkge1xyXG4gICAgaWYgKHdvcmxkID09PSB1bmRlZmluZWQgfHwgd29ybGQgPT09IHRydWUpe1xyXG4gICAgICAgIG14ID0gbDJ3eChteCk7XHJcbiAgICAgICAgbXkgPSBsMnd5KG15KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLnggPD0gbXggJiYgKHRoaXMueCArIHRoaXMudykgPj0gbXggJiZcclxuICAgICAgICB0aGlzLnkgPD0gbXkgJiYgKHRoaXMueSArIHRoaXMuaCkgPj0gbXk7XHJcbn07XHJcblJlY3QucHJvdG90eXBlLmluQ29ybmVyID0gZnVuY3Rpb24gKG14LCBteSwgY29ybmVyKSB7XHJcbiAgICBzd2l0Y2ggKGNvcm5lcikge1xyXG4gICAgICAgIGNhc2UgJ25lJzpcclxuICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54ICsgdGhpcy53IC0gMykgPD0gbXggJiYgbXggPD0gdzJseCh0aGlzLnggKyB0aGlzLncgKyAzKSAmJiB3Mmx5KHRoaXMueSAtIDMpIDw9IG15ICYmIG15IDw9IHcybHkodGhpcy55ICsgMyk7XHJcbiAgICAgICAgY2FzZSAnbncnOlxyXG4gICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggLSAzKSA8PSBteCAmJiBteCA8PSB3Mmx4KHRoaXMueCArIDMpICYmIHcybHkodGhpcy55IC0gMykgPD0gbXkgJiYgbXkgPD0gdzJseSh0aGlzLnkgKyAzKTtcclxuICAgICAgICBjYXNlICdzdyc6XHJcbiAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCAtIDMpIDw9IG14ICYmIG14IDw9IHcybHgodGhpcy54ICsgMykgJiYgdzJseSh0aGlzLnkgKyB0aGlzLmggLSAzKSA8PSBteSAmJiBteSA8PSB3Mmx5KHRoaXMueSArIHRoaXMuaCArIDMpO1xyXG4gICAgICAgIGNhc2UgJ3NlJzpcclxuICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54ICsgdGhpcy53IC0gMykgPD0gbXggJiYgbXggPD0gdzJseCh0aGlzLnggKyB0aGlzLncgKyAzKSAmJiB3Mmx5KHRoaXMueSArIHRoaXMuaCAtIDMpIDw9IG15ICYmIG15IDw9IHcybHkodGhpcy55ICsgdGhpcy5oICsgMyk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59O1xyXG5SZWN0LnByb3RvdHlwZS5nZXRDb3JuZXIgPSBmdW5jdGlvbiAobXgsIG15KSB7XHJcbiAgICBpZiAodGhpcy5pbkNvcm5lcihteCwgbXksIFwibmVcIikpXHJcbiAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIobXgsIG15LCBcIm53XCIpKVxyXG4gICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKG14LCBteSwgXCJzZVwiKSlcclxuICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihteCwgbXksIFwic3dcIikpXHJcbiAgICAgICAgcmV0dXJuIFwic3dcIjtcclxufTtcclxuUmVjdC5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24gKGNlbnRlclBvaW50KSB7XHJcbiAgICBpZiAoY2VudGVyUG9pbnQgPT09IHVuZGVmaW5lZClcclxuICAgICAgICByZXR1cm4ge3g6IHRoaXMueCArIHRoaXMudyAvIDIsIHk6IHRoaXMueSArIHRoaXMuaCAvIDJ9O1xyXG4gICAgdGhpcy54ID0gY2VudGVyUG9pbnQueCAtIHRoaXMudyAvIDI7XHJcbiAgICB0aGlzLnkgPSBjZW50ZXJQb2ludC55IC0gdGhpcy5oIC8gMjtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBDaXJjbGUoeCwgeSwgciwgZmlsbD8sIGJvcmRlcj8sIHV1aWQ/KTogdm9pZCB7XHJcbiAgICBTaGFwZS5jYWxsKHRoaXMpO1xyXG4gICAgdGhpcy50eXBlID0gXCJjaXJjbGVcIjtcclxuICAgIHRoaXMueCA9IHggfHwgMDtcclxuICAgIHRoaXMueSA9IHkgfHwgMDtcclxuICAgIHRoaXMuciA9IHIgfHwgMTtcclxuICAgIHRoaXMuZmlsbCA9IGZpbGwgfHwgJyMwMDAnO1xyXG4gICAgdGhpcy5ib3JkZXIgPSBib3JkZXIgfHwgXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB0aGlzLnV1aWQgPSB1dWlkIHx8IHV1aWR2NCgpO1xyXG59XHJcblxyXG5DaXJjbGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTaGFwZS5wcm90b3R5cGUpO1xyXG5DaXJjbGUucHJvdG90eXBlLmdldEJvdW5kaW5nQm94ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIG5ldyBCb3VuZGluZ1JlY3QodGhpcy54IC0gdGhpcy5yLCB0aGlzLnkgLSB0aGlzLnIsIHRoaXMuciAqIDIsIHRoaXMuciAqIDIpO1xyXG59O1xyXG5DaXJjbGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBTaGFwZS5wcm90b3R5cGUuZHJhdy5jYWxsKHRoaXMsIGN0eCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsO1xyXG4gICAgY29uc3QgbG9jID0gdzJsKHt4OiB0aGlzLngsIHk6IHRoaXMueX0pO1xyXG4gICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgY3R4LmZpbGwoKTtcclxuICAgIGlmICh0aGlzLmJvcmRlciAhPT0gXCJyZ2JhKDAsIDAsIDAsIDApXCIpIHtcclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXI7XHJcbiAgICAgICAgY3R4LmFyYyhsb2MueCwgbG9jLnksIHRoaXMuciwgMCwgMiAqIE1hdGguUEkpO1xyXG4gICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgIH1cclxufTtcclxuQ2lyY2xlLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChteCwgbXkpIHtcclxuICAgIHJldHVybiAobXggLSB3Mmx4KHRoaXMueCkpICoqIDIgKyAobXkgLSB3Mmx5KHRoaXMueSkpICoqIDIgPCB0aGlzLnIgKiogMjtcclxufTtcclxuQ2lyY2xlLnByb3RvdHlwZS5pbkNvcm5lciA9IGZ1bmN0aW9uIChteCwgbXksIGNvcm5lcikge1xyXG4gICAgc3dpdGNoIChjb3JuZXIpIHtcclxuICAgICAgICBjYXNlICduZSc6XHJcbiAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCArIHRoaXMudyAtIDMpIDw9IG14ICYmIG14IDw9IHcybHgodGhpcy54ICsgdGhpcy53ICsgMykgJiYgdzJseSh0aGlzLnkgLSAzKSA8PSBteSAmJiBteSA8PSB3Mmx5KHRoaXMueSArIDMpO1xyXG4gICAgICAgIGNhc2UgJ253JzpcclxuICAgICAgICAgICAgcmV0dXJuIHcybHgodGhpcy54IC0gMykgPD0gbXggJiYgbXggPD0gdzJseCh0aGlzLnggKyAzKSAmJiB3Mmx5KHRoaXMueSAtIDMpIDw9IG15ICYmIG15IDw9IHcybHkodGhpcy55ICsgMyk7XHJcbiAgICAgICAgY2FzZSAnc3cnOlxyXG4gICAgICAgICAgICByZXR1cm4gdzJseCh0aGlzLnggLSAzKSA8PSBteCAmJiBteCA8PSB3Mmx4KHRoaXMueCArIDMpICYmIHcybHkodGhpcy55ICsgdGhpcy5oIC0gMykgPD0gbXkgJiYgbXkgPD0gdzJseSh0aGlzLnkgKyB0aGlzLmggKyAzKTtcclxuICAgICAgICBjYXNlICdzZSc6XHJcbiAgICAgICAgICAgIHJldHVybiB3Mmx4KHRoaXMueCArIHRoaXMudyAtIDMpIDw9IG14ICYmIG14IDw9IHcybHgodGhpcy54ICsgdGhpcy53ICsgMykgJiYgdzJseSh0aGlzLnkgKyB0aGlzLmggLSAzKSA8PSBteSAmJiBteSA8PSB3Mmx5KHRoaXMueSArIHRoaXMuaCArIDMpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuQ2lyY2xlLnByb3RvdHlwZS5nZXRDb3JuZXIgPSBmdW5jdGlvbiAobXgsIG15KSB7XHJcbiAgICBpZiAodGhpcy5pbkNvcm5lcihteCwgbXksIFwibmVcIikpXHJcbiAgICAgICAgcmV0dXJuIFwibmVcIjtcclxuICAgIGVsc2UgaWYgKHRoaXMuaW5Db3JuZXIobXgsIG15LCBcIm53XCIpKVxyXG4gICAgICAgIHJldHVybiBcIm53XCI7XHJcbiAgICBlbHNlIGlmICh0aGlzLmluQ29ybmVyKG14LCBteSwgXCJzZVwiKSlcclxuICAgICAgICByZXR1cm4gXCJzZVwiO1xyXG4gICAgZWxzZSBpZiAodGhpcy5pbkNvcm5lcihteCwgbXksIFwic3dcIikpXHJcbiAgICAgICAgcmV0dXJuIFwic3dcIjtcclxufTtcclxuQ2lyY2xlLnByb3RvdHlwZS5jZW50ZXIgPSBmdW5jdGlvbiAoY2VudGVyUG9pbnQpIHtcclxuICAgIGlmIChjZW50ZXJQb2ludCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgIHJldHVybiB7eDogdGhpcy54LCB5OiB0aGlzLnl9O1xyXG4gICAgdGhpcy54ID0gY2VudGVyUG9pbnQueDtcclxuICAgIHRoaXMueSA9IGNlbnRlclBvaW50Lnk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gTGluZSh4MSwgeTEsIHgyLCB5MiwgdXVpZD8pOiB2b2lkIHtcclxuICAgIFNoYXBlLmNhbGwodGhpcyk7XHJcbiAgICB0aGlzLnR5cGUgPSBcImxpbmVcIjtcclxuICAgIHRoaXMueDEgPSB4MTtcclxuICAgIHRoaXMueTEgPSB5MTtcclxuICAgIHRoaXMueDIgPSB4MjtcclxuICAgIHRoaXMueTIgPSB5MjtcclxuICAgIHRoaXMudXVpZCA9IHV1aWQgfHwgdXVpZHY0KCk7XHJcbn1cclxuXHJcbkxpbmUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTaGFwZS5wcm90b3R5cGUpO1xyXG5MaW5lLnByb3RvdHlwZS5nZXRCb3VuZGluZ0JveCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgQm91bmRpbmdSZWN0KFxyXG4gICAgICAgIE1hdGgubWluKHRoaXMueDEsIHRoaXMueDIpLFxyXG4gICAgICAgIE1hdGgubWluKHRoaXMueTEsIHRoaXMueTIpLFxyXG4gICAgICAgIE1hdGguYWJzKHRoaXMueDEgLSB0aGlzLngyKSxcclxuICAgICAgICBNYXRoLmFicyh0aGlzLnkxIC0gdGhpcy55MilcclxuICAgICk7XHJcbn07XHJcbkxpbmUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBTaGFwZS5wcm90b3R5cGUuZHJhdy5jYWxsKHRoaXMsIGN0eCk7XHJcbiAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICBjdHgubW92ZVRvKHcybHgodGhpcy54MSksIHcybHkodGhpcy55MSkpO1xyXG4gICAgY3R4LmxpbmVUbyh3Mmx4KHRoaXMueDIpLCB3Mmx5KHRoaXMueTIpKTtcclxuICAgIGN0eC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwwLDAsIDAuNSknO1xyXG4gICAgY3R4LmxpbmVXaWR0aCA9IDM7XHJcbiAgICBjdHguc3Ryb2tlKCk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVGV4dCh4LCB5LCB0ZXh0LCBmb250LCBhbmdsZT8sIHV1aWQ/KSB7XHJcbiAgICBTaGFwZS5jYWxsKHRoaXMpO1xyXG4gICAgdGhpcy50eXBlID0gXCJ0ZXh0XCI7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICAgIHRoaXMudGV4dCA9IHRleHQ7XHJcbiAgICB0aGlzLmZvbnQgPSBmb250O1xyXG4gICAgdGhpcy5hbmdsZSA9IGFuZ2xlIHx8IDA7XHJcbiAgICB0aGlzLnV1aWQgPSB1dWlkIHx8IHV1aWR2NCgpO1xyXG59XHJcblxyXG5UZXh0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2hhcGUucHJvdG90eXBlKTtcclxuVGV4dC5wcm90b3R5cGUuZ2V0Qm91bmRpbmdCb3ggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IEJvdW5kaW5nUmVjdCh0aGlzLngsIHRoaXMueSwgNSwgNSk7IC8vIFRvZG86IGZpeCB0aGlzIGJvdW5kaW5nIGJveFxyXG59O1xyXG5UZXh0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgU2hhcGUucHJvdG90eXBlLmRyYXcuY2FsbCh0aGlzLCBjdHgpO1xyXG4gICAgY3R4LmZvbnQgPSB0aGlzLmZvbnQ7XHJcbiAgICBjdHguc2F2ZSgpO1xyXG4gICAgY3R4LnRyYW5zbGF0ZSh3Mmx4KHRoaXMueCksIHcybHkodGhpcy55KSk7XHJcbiAgICBjdHgucm90YXRlKHRoaXMuYW5nbGUpO1xyXG4gICAgY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XHJcbiAgICBjdHguZmlsbFRleHQodGhpcy50ZXh0LCAwLCAtNSk7XHJcbiAgICBjdHgucmVzdG9yZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEFzc2V0KGltZywgeCwgeSwgdywgaCwgdXVpZD8pOiB2b2lkIHtcclxuICAgIFNoYXBlLmNhbGwodGhpcyk7XHJcbiAgICB0aGlzLnR5cGUgPSBcImFzc2V0XCI7XHJcbiAgICB0aGlzLnV1aWQgPSB1dWlkIHx8IHV1aWR2NCgpO1xyXG4gICAgdGhpcy5pbWcgPSBpbWc7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICAgIHRoaXMudyA9IHc7XHJcbiAgICB0aGlzLmggPSBoO1xyXG59XHJcblxyXG5Bc3NldC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlY3QucHJvdG90eXBlKTtcclxuQXNzZXQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICBTaGFwZS5wcm90b3R5cGUuZHJhdy5jYWxsKHRoaXMsIGN0eCk7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCB3Mmx4KHRoaXMueCksIHcybHkodGhpcy55KSwgdGhpcy53ICogeiwgdGhpcy5oICogeik7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNoYXBlRnJvbURpY3Qoc2hhcGUsIGR1bW15Pykge1xyXG4gICAgaWYgKGR1bW15ID09PSB1bmRlZmluZWQpIGR1bW15ID0gZmFsc2U7XHJcbiAgICBpZiAoIWR1bW15ICYmIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmhhcyhzaGFwZS51dWlkKSlcclxuICAgICAgICByZXR1cm4gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpO1xyXG5cclxuICAgIGxldCBzaDtcclxuXHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ3JlY3QnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IFJlY3QoKSwgc2hhcGUpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICdjaXJjbGUnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IENpcmNsZSgpLCBzaGFwZSk7XHJcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gJ2xpbmUnKSBzaCA9IE9iamVjdC5hc3NpZ24obmV3IExpbmUoKSwgc2hhcGUpO1xyXG4gICAgaWYgKHNoYXBlLnR5cGUgPT09ICd0ZXh0Jykgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBUZXh0KCksIHNoYXBlKTtcclxuICAgIGlmIChzaGFwZS50eXBlID09PSAnYXNzZXQnKSB7XHJcbiAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKHNoYXBlLncsIHNoYXBlLmgpO1xyXG4gICAgICAgIGltZy5zcmMgPSBzaGFwZS5zcmM7XHJcbiAgICAgICAgc2ggPSBPYmplY3QuYXNzaWduKG5ldyBBc3NldCgpLCBzaGFwZSk7XHJcbiAgICAgICAgc2guaW1nID0gaW1nO1xyXG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikuaW52YWxpZGF0ZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2g7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZUNvbnRleHRNZW51KG1lbnUsIHNoYXBlKSB7XHJcbiAgICBjb25zdCBhY3Rpb24gPSBtZW51LmRhdGEoXCJhY3Rpb25cIik7XHJcbiAgICBjb25zdCBsYXllciA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcigpO1xyXG4gICAgc3dpdGNoIChhY3Rpb24pIHtcclxuICAgICAgICBjYXNlICdtb3ZlVG9Gcm9udCc6XHJcbiAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCBsYXllci5zaGFwZXMuZGF0YS5sZW5ndGggLSAxLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnbW92ZVRvQmFjayc6XHJcbiAgICAgICAgICAgIGxheWVyLm1vdmVTaGFwZU9yZGVyKHNoYXBlLCAwLCB0cnVlKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnc2V0TGF5ZXInOlxyXG4gICAgICAgICAgICBsYXllci5yZW1vdmVTaGFwZShzaGFwZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihtZW51LmRhdGEoXCJsYXllclwiKSkuYWRkU2hhcGUoc2hhcGUsIHRydWUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdhZGRJbml0aWF0aXZlJzpcclxuICAgICAgICAgICAgZ2FtZU1hbmFnZXIuaW5pdGlhdGl2ZVRyYWNrZXIuYWRkSW5pdGlhdGl2ZShcclxuICAgICAgICAgICAgICAgIHt1dWlkOiBzaGFwZS51dWlkLCB2aXNpYmxlOiAhZ2FtZU1hbmFnZXIuSVNfRE0sIGdyb3VwOiBmYWxzZSwgc3JjOiBzaGFwZS5zcmMsIG93bmVyczogc2hhcGUub3duZXJzfSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgJG1lbnUuaGlkZSgpO1xyXG59IiwiaW1wb3J0IGdhbWVNYW5hZ2VyIGZyb20gXCIuL3BsYW5hcmFsbHlcIjtcclxuaW1wb3J0IHthbHBoU29ydH0gZnJvbSBcIi4vdXRpbHNcIjtcclxuXHJcbmNvbnN0IHByb3RvY29sID0gZG9jdW1lbnQuZG9tYWluID09PSAnbG9jYWxob3N0JyA/IFwiaHR0cDovL1wiIDogXCJodHRwczovL1wiO1xyXG5jb25zdCBzb2NrZXQgPSBpby5jb25uZWN0KHByb3RvY29sICsgZG9jdW1lbnQuZG9tYWluICsgXCI6XCIgKyBsb2NhdGlvbi5wb3J0ICsgXCIvcGxhbmFyYWxseVwiKTtcclxuc29ja2V0Lm9uKFwiY29ubmVjdFwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RlZFwiKTtcclxufSk7XHJcbnNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWRcIik7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJyZWRpcmVjdFwiLCBmdW5jdGlvbiAoZGVzdGluYXRpb24pIHtcclxuICAgIGNvbnNvbGUubG9nKFwicmVkaXJlY3RpbmdcIik7XHJcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGRlc3RpbmF0aW9uO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IHVzZXJuYW1lXCIsIGZ1bmN0aW9uICh1c2VybmFtZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIudXNlcm5hbWUgPSB1c2VybmFtZTtcclxuICAgIGdhbWVNYW5hZ2VyLklTX0RNID0gdXNlcm5hbWUgPT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdChcIi9cIilbMl07XHJcbiAgICBpZiAoJChcIiN0b29sc2VsZWN0XCIpLmZpbmQoXCJ1bFwiKS5odG1sKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLnNldHVwVG9vbHMoKTtcclxufSk7XHJcbnNvY2tldC5vbihcInNldCBjbGllbnRPcHRpb25zXCIsIGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXRDbGllbnRPcHRpb25zKG9wdGlvbnMpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0IGxvY2F0aW9uT3B0aW9uc1wiLCBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJhc3NldCBsaXN0XCIsIGZ1bmN0aW9uIChhc3NldHMpIHtcclxuICAgIGNvbnN0IG0gPSAkKFwiI21lbnUtdG9rZW5zXCIpO1xyXG4gICAgbS5lbXB0eSgpO1xyXG4gICAgbGV0IGggPSAnJztcclxuXHJcbiAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGVudHJ5LCBwYXRoKSB7XHJcbiAgICAgICAgY29uc3QgZm9sZGVycyA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoZW50cnkuZm9sZGVycykpO1xyXG4gICAgICAgIGZvbGRlcnMuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkge1xyXG4gICAgICAgICAgICBoICs9IFwiPGJ1dHRvbiBjbGFzcz0nYWNjb3JkaW9uJz5cIiArIGtleSArIFwiPC9idXR0b24+PGRpdiBjbGFzcz0nYWNjb3JkaW9uLXBhbmVsJz48ZGl2IGNsYXNzPSdhY2NvcmRpb24tc3VicGFuZWwnPlwiO1xyXG4gICAgICAgICAgICBwcm9jZXNzKHZhbHVlLCBwYXRoICsga2V5ICsgXCIvXCIpO1xyXG4gICAgICAgICAgICBoICs9IFwiPC9kaXY+PC9kaXY+XCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZW50cnkuZmlsZXMuc29ydChhbHBoU29ydCk7XHJcbiAgICAgICAgZW50cnkuZmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoYXNzZXQpIHtcclxuICAgICAgICAgICAgaCArPSBcIjxkaXYgY2xhc3M9J2RyYWdnYWJsZSB0b2tlbic+PGltZyBzcmM9Jy9zdGF0aWMvaW1nL2Fzc2V0cy9cIiArIHBhdGggKyBhc3NldCArIFwiJyB3aWR0aD0nMzUnPlwiICsgYXNzZXQgKyBcIjxpIGNsYXNzPSdmYXMgZmEtY29nJz48L2k+PC9kaXY+XCI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgcHJvY2Vzcyhhc3NldHMsIFwiXCIpO1xyXG4gICAgbS5odG1sKGgpO1xyXG4gICAgJChcIi5kcmFnZ2FibGVcIikuZHJhZ2dhYmxlKHtcclxuICAgICAgICBoZWxwZXI6IFwiY2xvbmVcIixcclxuICAgICAgICBhcHBlbmRUbzogXCIjYm9hcmRcIlxyXG4gICAgfSk7XHJcbiAgICAkKCcuYWNjb3JkaW9uJykuZWFjaChmdW5jdGlvbiAoaWR4KSB7XHJcbiAgICAgICAgJCh0aGlzKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS50b2dnbGVDbGFzcyhcImFjY29yZGlvbi1hY3RpdmVcIik7XHJcbiAgICAgICAgICAgICQodGhpcykubmV4dCgpLnRvZ2dsZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJib2FyZCBpbml0XCIsIGZ1bmN0aW9uIChsb2NhdGlvbl9pbmZvKSB7XHJcbiAgICBnYW1lTWFuYWdlci5zZXR1cEJvYXJkKGxvY2F0aW9uX2luZm8pXHJcbn0pO1xyXG5zb2NrZXQub24oXCJzZXQgZ3JpZHNpemVcIiwgZnVuY3Rpb24gKGdyaWRTaXplKSB7XHJcbiAgICBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuc2V0R3JpZFNpemUoZ3JpZFNpemUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwiYWRkIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuYWRkU2hhcGUoc2hhcGUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwicmVtb3ZlIHNoYXBlXCIsIGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgY29uc3QgbGF5ZXIgPSBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuZ2V0TGF5ZXIoc2hhcGUubGF5ZXIpO1xyXG4gICAgbGF5ZXIucmVtb3ZlU2hhcGUoZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLlVVSURNYXAuZ2V0KHNoYXBlLnV1aWQpLCBmYWxzZSk7XHJcbiAgICBsYXllci5pbnZhbGlkYXRlKCk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJtb3ZlU2hhcGVPcmRlclwiLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdldExheWVyKGRhdGEuc2hhcGUubGF5ZXIpLm1vdmVTaGFwZU9yZGVyKGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5VVUlETWFwLmdldChkYXRhLnNoYXBlLnV1aWQpLCBkYXRhLmluZGV4LCBmYWxzZSk7XHJcbn0pO1xyXG5zb2NrZXQub24oXCJzaGFwZU1vdmVcIiwgZnVuY3Rpb24gKHNoYXBlKSB7XHJcbiAgICBnYW1lTWFuYWdlci5tb3ZlU2hhcGUoc2hhcGUpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwidXBkYXRlU2hhcGVcIiwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgIGdhbWVNYW5hZ2VyLnVwZGF0ZVNoYXBlKGRhdGEpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwidXBkYXRlSW5pdGlhdGl2ZVwiLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgaWYgKGRhdGEuaW5pdGlhdGl2ZSA9PT0gdW5kZWZpbmVkIHx8ICghZGF0YS5vd25lcnMuaW5jbHVkZXMoZ2FtZU1hbmFnZXIudXNlcm5hbWUpICYmICFnYW1lTWFuYWdlci5JU19ETSAmJiAhZGF0YS52aXNpYmxlKSlcclxuICAgICAgICBnYW1lTWFuYWdlci5pbml0aWF0aXZlVHJhY2tlci5yZW1vdmVJbml0aWF0aXZlKGRhdGEudXVpZCwgZmFsc2UsIHRydWUpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmluaXRpYXRpdmVUcmFja2VyLmFkZEluaXRpYXRpdmUoZGF0YSwgZmFsc2UpO1xyXG59KTtcclxuc29ja2V0Lm9uKFwic2V0SW5pdGlhdGl2ZVwiLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgZ2FtZU1hbmFnZXIuc2V0SW5pdGlhdGl2ZShkYXRhKTtcclxufSk7XHJcbnNvY2tldC5vbihcImNsZWFyIHRlbXBvcmFyaWVzXCIsIGZ1bmN0aW9uIChzaGFwZXMpIHtcclxuICAgIHNoYXBlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaGFwZSkge1xyXG4gICAgICAgIGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5nZXRMYXllcihzaGFwZS5sYXllcikucmVtb3ZlU2hhcGUoc2hhcGUsIGZhbHNlKTtcclxuICAgIH0pXHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgc29ja2V0OyIsImltcG9ydCBnYW1lTWFuYWdlciBmcm9tIFwiLi9wbGFuYXJhbGx5XCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJsKG9iaikge1xyXG4gICAgY29uc3QgeiA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci56b29tRmFjdG9yO1xyXG4gICAgY29uc3QgcGFuWCA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5YO1xyXG4gICAgY29uc3QgcGFuWSA9IGdhbWVNYW5hZ2VyLmxheWVyTWFuYWdlci5wYW5ZO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB4OiAob2JqLnggKyBwYW5YKSAqIHosXHJcbiAgICAgICAgeTogKG9iai55ICsgcGFuWSkgKiB6XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3Mmx4KHgpIHtcclxuICAgIHJldHVybiB3Mmwoe3g6IHgsIHk6IDB9KS54O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJseSh5KSB7XHJcbiAgICByZXR1cm4gdzJsKHt4OiAwLCB5OiB5fSkueTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHcybHooeikge1xyXG4gICAgcmV0dXJuIHogKiBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIuem9vbUZhY3RvcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaXREaXN0YW5jZShyKSB7XHJcbiAgICByZXR1cm4gKHIgLyBnYW1lTWFuYWdlci5sYXllck1hbmFnZXIudW5pdFNpemUpICogZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLmdyaWRTaXplO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdzJscihyKSB7XHJcbiAgICByZXR1cm4gdzJseihnZXRVbml0RGlzdGFuY2UocikpXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMncob2JqKSB7XHJcbiAgICBjb25zdCB6ID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnpvb21GYWN0b3I7XHJcbiAgICBjb25zdCBwYW5YID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblg7XHJcbiAgICBjb25zdCBwYW5ZID0gZ2FtZU1hbmFnZXIubGF5ZXJNYW5hZ2VyLnBhblk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHg6IChvYmoueCAvIHopIC0gcGFuWCxcclxuICAgICAgICB5OiAob2JqLnkgLyB6KSAtIHBhbllcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGwyd3goeCkge1xyXG4gICAgcmV0dXJuIGwydyh7eDogeCwgeTogMH0pLng7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsMnd5KHkpIHtcclxuICAgIHJldHVybiBsMncoe3g6IDAsIHk6IHl9KS55O1xyXG59IiwiZXhwb3J0IGZ1bmN0aW9uIGFscGhTb3J0KGEsIGIpIHtcclxuICAgIGlmIChhLnRvTG93ZXJDYXNlKCkgPCBiLnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiAxO1xyXG59XHJcblxyXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XHJcbmV4cG9ydCBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgIH0pO1xyXG59Il0sInNvdXJjZVJvb3QiOiIifQ==