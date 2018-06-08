import {socket, sendClientOptions} from './socket'
import { l2g, g2l, getUnitDistance } from "./units";
import { LayerManager, Layer, GridLayer, FOWLayer } from "./layers";
import { ClientOptions, BoardInfo, ServerShape, InitiativeData } from './api_types';
import { OrderedMap, getMouse } from './utils';
import Asset from './shapes/asset';
import { createShapeFromDict } from './shapes/utils';
import { LocalPoint, GlobalPoint, Vector } from './geom';
import Text from './shapes/text';
import { Tool } from './tools/tool';
import { InitiativeTracker } from './tools/initiative';
import { Settings } from './settings';
import { throttle } from 'lodash';
import { capitalize } from './utils';
import { SelectTool } from './tools/select';

class GameManager {
    IS_DM = false;
    roomName!: string;
    roomCreator!: string;
    locationName!: string;
    username!: string;
    board_initialised = false;
    layerManager = new LayerManager();
    selectedTool: number = 0;
    tools: OrderedMap<string, Tool> = new OrderedMap();
    
    lightsources: { shape: string, aura: string }[] = [];
    lightblockers: string[] = [];
    annotations: string[] = [];
    movementblockers: string[] = [];
    ownedtokens: string[] = [];

    annotationText: Text = new Text(new GlobalPoint(0, 0), "", "bold 20px serif");
    gridColour = $("#gridColour");
    fowColour = $("#fowColour");
    initiativeTracker = new InitiativeTracker();
    shapeSelectionDialog = $("#shapeselectiondialog").dialog({
        autoOpen: false,
        width: 'auto'
    });
    initiativeDialog = $("#initiativedialog").dialog({
        autoOpen: false,
        width: '160px'
    });

    constructor() {
        this.gridColour.spectrum({
            showInput: true,
            allowEmpty: true,
            showAlpha: true,
            color: "rgba(255,0,0, 0.5)",
            move: function () {
                if(gameManager.layerManager.getGridLayer() !== undefined)
                    gameManager.layerManager.getGridLayer()!.drawGrid();
            },
            change: function (colour) {
                socket.emit("set clientOptions", { 'gridColour': colour.toRgbString() });
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
                socket.emit("set clientOptions", { 'fowColour': colour.toRgbString() });
            }
        });
    }

    setupBoard(room: BoardInfo): void {
        this.layerManager = new LayerManager();
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
                    socket.emit("new location", locname);
            } else {
                socket.emit("change location", e.target.textContent);
            }
        });

        for (let i = 0; i < room.board.layers.length; i++) {
            const new_layer = room.board.layers[i];
            // UI changes
            layersdiv.append("<canvas id='" + new_layer.name + "-layer' style='z-index: " + i + "'></canvas>");
            if (new_layer.selectable) {
                let extra = '';
                if (selectable_layers === 0) extra = " class='layer-selected'";
                layerselectdiv.find('ul').append("<li id='select-" + new_layer.name + "'" + extra + "><a href='#'>" + capitalize(new_layer.name) + "</a></li>");
                selectable_layers += 1;
            }
            const canvas = <HTMLCanvasElement>$('#' + new_layer.name + '-layer')[0];
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // State changes
            let l: Layer;
            if (new_layer.grid)
                l = new GridLayer(canvas, new_layer.name);
            else if (new_layer.name === 'fow')
                l = new FOWLayer(canvas, new_layer.name);
            else
                l = new Layer(canvas, new_layer.name);
            l.selectable = new_layer.selectable;
            l.player_editable = new_layer.player_editable;
            gameManager.layerManager.addLayer(l);
            if (new_layer.grid) {
                gameManager.layerManager.setGridSize(new_layer.size);
                $("#grid-layer").droppable({
                    accept: ".draggable",
                    drop: function (event, ui) {
                        if (gameManager.layerManager.getLayer() === undefined) {
                            console.log("No active layer to drop the token on");
                            return;
                        }
                        const l = gameManager.layerManager.getLayer()!;
                        const jCanvas = $(l.canvas);
                        if (jCanvas.length === 0) {
                            console.log("Canvas missing");
                            return;
                        }
                        const offset = jCanvas.offset()!;

                        const loc = new LocalPoint(ui.offset.left - offset.left, ui.offset.top - offset.top);

                        if (settings_menu.is(":visible") && loc.x < settings_menu.width()!)
                            return;
                        if (locations_menu.is(":visible") && loc.y < locations_menu.width()!)
                            return;
                        // width = ui.helper[0].width;
                        // height = ui.helper[0].height;
                        const wloc = l2g(loc);
                        const img = <HTMLImageElement>ui.draggable[0].children[0];
                        const asset = new Asset(img, wloc, img.width, img.height);
                        asset.src = new URL(img.src).pathname;

                        if (Settings.useGrid) {
                            const gs = Settings.gridSize;
                            asset.refPoint.x = Math.round(asset.refPoint.x / gs) * gs;
                            asset.refPoint.y = Math.round(asset.refPoint.y / gs) * gs;
                            asset.w = Math.max(Math.round(asset.w / gs) * gs, gs);
                            asset.h = Math.max(Math.round(asset.h / gs) * gs, gs);
                        }

                        l.addShape(asset, true);
                    }
                });
            } else {
                l.setShapes(new_layer.shapes);
            }
        }
        // Force the correct opacity render on other layers.
        gameManager.layerManager.setLayer(gameManager.layerManager.getLayer()!.name);
        
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
        } else {
            layerselectdiv.hide();
        }

        this.initiativeTracker.clear();

        this.board_initialised = true;
    }

    addShape(shape: ServerShape): void {
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const layer = this.layerManager.getLayer(shape.layer)!;
        const sh = createShapeFromDict(shape);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        layer.addShape(sh, false);
        layer.invalidate(false);
    }

    moveShape(shape: ServerShape): void {
        if (!gameManager.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        const real_shape = Object.assign(this.layerManager.UUIDMap.get(shape.uuid), sh);
        real_shape.checkLightSources();
        this.layerManager.getLayer(real_shape.layer)!.onShapeMove(real_shape);
    }

    updateShape(data: { shape: ServerShape; redraw: boolean; }): void {
        if (!gameManager.layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(data.shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${data.shape.type} could not be added`);
            return;
        }
        const shape = Object.assign(this.layerManager.UUIDMap.get(data.shape.uuid), sh);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        shape.setIsToken(shape.isToken);
        if (data.redraw)
            this.layerManager.getLayer(data.shape.layer)!.invalidate(false);
    }

    setInitiative(data: InitiativeData[]): void {
        this.initiativeTracker.data = data;
        this.initiativeTracker.redraw();
        if (data.length > 0)
            this.initiativeDialog.dialog("open");
    }

    setClientOptions(options: ClientOptions): void {
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
                    Settings.panX = loc.panX;
                if (loc.panY)
                    Settings.panY = loc.panY;
                if (loc.zoomFactor) {
                    Settings.zoomFactor = loc.zoomFactor;
                    $("#zoomer").slider({ value: loc.zoomFactor });
                }
                if (this.layerManager.getGridLayer() !== undefined)
                    this.layerManager.getGridLayer()!.invalidate();
            }
        }
    }

    setCenterPosition(position: GlobalPoint) {
        const l_pos = g2l(position);
        Settings.panX += ((window.innerWidth / 2) - l_pos.x) / Settings.zoomFactor;
        Settings.panY += ((window.innerHeight / 2) - l_pos.y) / Settings.zoomFactor;
        gameManager.layerManager.invalidate();
        sendClientOptions();
    }
}


let gameManager = new GameManager();
(<any>window).gameManager = gameManager;
(<any>window).Settings = Settings;

// **** SETUP UI ****

// prevent double clicking text selection
window.addEventListener('selectstart', function (e) {
    e.preventDefault();
    return false;
});

function onPointerDown(e: MouseEvent) {
    if (!gameManager.board_initialised) return;
    if (e.button == 1) {
        const panTool = gameManager.tools.get("pan");
        if (panTool !== undefined) {
            panTool.onMouseDown(e);
        }
    }
    if ((e.button !== 0) || (<HTMLElement>e.target).tagName !== 'CANVAS') return;
    $menu.hide();
    gameManager.tools.getIndexValue(gameManager.selectedTool)!.onMouseDown(e);
}

function onPointerMove(e: MouseEvent) {
    if (!gameManager.board_initialised) return;
    if ((e.buttons & 4) !== 0) {
        const panTool = gameManager.tools.get("pan");
        if (panTool !== undefined) {
            panTool.onMouseMove(e);
        }
    }
    if (((e.buttons & 1) > 1) || (<HTMLElement>e.target).tagName !== 'CANVAS') return;
    gameManager.tools.getIndexValue(gameManager.selectedTool)!.onMouseMove(e);
    // Annotation hover
    let found = false;
    for (let i = 0; i < gameManager.annotations.length; i++) {
        const uuid = gameManager.annotations[i];
        if (gameManager.layerManager.UUIDMap.has(uuid) && gameManager.layerManager.hasLayer("draw")) {
            const draw_layer = gameManager.layerManager.getLayer("draw")!;
            if (gameManager.annotationText.layer !== "draw")
                draw_layer.addShape(gameManager.annotationText, false);
            const shape = gameManager.layerManager.UUIDMap.get(uuid)!;
            if (shape.contains(l2g(getMouse(e)))) {
                found = true;
                gameManager.annotationText.text = shape.annotation;
                gameManager.annotationText.refPoint = l2g(new LocalPoint((draw_layer.canvas.width / 2) - shape.annotation.length / 2, 50));
                draw_layer.invalidate(true);
            }
        }
    }
    if (!found && gameManager.annotationText.text !== '') {
        gameManager.annotationText.text = '';
        gameManager.layerManager.getLayer("draw")!.invalidate(true);
    }
}

function onPointerUp(e: MouseEvent) {
    if (!gameManager.board_initialised) return;
    if (e.button == 1) {
        const panTool = gameManager.tools.get("pan");
        if (panTool !== undefined) {
            panTool.onMouseUp(e);
        }
    }
    if ((e.button !== 0 && e.button !== 1) || (<HTMLElement>e.target).tagName !== 'CANVAS') return;
    gameManager.tools.getIndexValue(gameManager.selectedTool)!.onMouseUp(e);
}

window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

window.addEventListener('contextmenu', function (e: MouseEvent) {
    if (!gameManager.board_initialised) return;
    if (e.button !== 2 || (<HTMLElement>e.target).tagName !== 'CANVAS') return;
    e.preventDefault();
    e.stopPropagation();
    gameManager.tools.getIndexValue(gameManager.selectedTool)!.onContextMenu(e);
});

$("#zoomer").slider({
    orientation: "vertical",
    min: 0.1,
    max: 5.0,
    step: 0.1,
    value: Settings.zoomFactor,
    slide: function (event, ui) {
        updateZoom(ui.value!, l2g(new LocalPoint(window.innerWidth / 2, window.innerHeight / 2)));
    }
});

const $menu = $('#contextMenu');
$menu.hide();

const settings_menu = $("#menu")!;
const locations_menu = $("#locations-menu")!;
const layer_menu = $("#layerselect")!;
$("#selection-menu").hide();

$('#rm-settings').on("click", function () {
    // order of animation is important, it otherwise will sometimes show a small gap between the two objects
    if (settings_menu.is(":visible")) {
        $('#radialmenu').animate({ left: "-=200px" });
        settings_menu.animate({ width: 'toggle' });
        locations_menu.animate({ left: "-=200px", width: "+=200px" });
        layer_menu.animate({ left: "-=200px" });
    } else {
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
    } else {
        locations_menu.animate({ height: 'toggle' });
        $('#radialmenu').animate({ top: "+=100px" });
    }
});

window.onresize = function () {
    gameManager.layerManager.setWidth(window.innerWidth);
    gameManager.layerManager.setHeight(window.innerHeight);
    gameManager.layerManager.invalidate();
};

function targetIsInput(e: JQuery.Event<HTMLElement, null>) {
    return ["INPUT", "TEXTAREA"].includes(e.target.tagName);
}

$('body').keyup(function (e) {
    if (e.keyCode === 46 && !targetIsInput(e)) {
        if (gameManager.layerManager.getLayer === undefined) {
            console.log("No active layer selected for delete operation");
            return;
        }
        const l = gameManager.layerManager.getLayer()!;
        l.selection.forEach(function (sel) {
            l.removeShape(sel, true, false);
            gameManager.initiativeTracker.removeInitiative(sel.uuid, true, false);
        });
    }
});
$('body').keydown(function (e) {
    // Arrow keys   37: left   38: up  39: right  40:down
    if (e.keyCode && !targetIsInput(e) && e.keyCode >= 37 && e.keyCode <= 40) {
        // todo: this should already be rounded
        const gridSize = Math.round(Settings.gridSize);
        let x_offset = gridSize * (e.keyCode % 2);
        let y_offset = gridSize * (e.keyCode % 2 ? 0 : 1);
        if (gameManager.layerManager.hasSelection()) {
            const selection = gameManager.layerManager.getSelection()!;
            x_offset *= (e.keyCode <= 38 ? -1 : 1);
            y_offset *= (e.keyCode <= 38 ? -1 : 1);
            let collision = false;
            if (!e.shiftKey || !gameManager.IS_DM) {
                // First check for collisions.  Using the smooth wall slide collision check used on mouse move is overkill here.
                for (let i=0; i<selection.length && !collision; i++) {
                    const sel = selection[i];
                    if (sel.uuid === (<SelectTool>gameManager.tools.get("select")!).selectionHelper.uuid)
                        continue;
                    const newSelBBox = sel.getBoundingBox().offset(new Vector({x: x_offset, y: y_offset}));
                    for (let mb = 0; mb < gameManager.movementblockers.length; mb++) {
                        const blocker = gameManager.layerManager.UUIDMap.get(gameManager.movementblockers[mb])!;
                        const blockerBBox = blocker.getBoundingBox();
                        // Check if the bounding box of our destination would intersect with the bounding box of the movementblocker
                        if (blockerBBox.intersectsWith(newSelBBox)) {
                            collision = true;
                            break;
                        }
                    }
                }
            }
            if (!collision) {
                for (let i=0; i<selection.length; i++) {
                    const sel = selection[i];
                    sel.refPoint.x += x_offset;
                    sel.refPoint.y += y_offset;
                }
                gameManager.layerManager.getLayer()!.invalidate(false);
            }
        } else {
            // The pan offsets should be in the opposite direction to give the correct feel.
            Settings.panX += x_offset * (e.keyCode <= 38 ? 1 : -1);
            Settings.panY += y_offset * (e.keyCode <= 38 ? 1 : -1);
            gameManager.layerManager.invalidate();
            sendClientOptions();
        }
    }
});

function scrollZoom(e: WheelEvent) {
    let delta: number;
    if (e.wheelDelta) {
        delta = Math.sign(e.wheelDelta) * 1;
    } else {
        delta = Math.sign(e.deltaY) * -1;
    }
    updateZoom(Settings.zoomFactor + 0.1 * delta, l2g(getMouse(e)));
}
window.addEventListener('wheel', throttle(scrollZoom));

$("#gridSizeInput").on("change", function (e) {
    const gs = parseInt((<HTMLInputElement>e.target).value);
    gameManager.layerManager.setGridSize(gs);
    socket.emit("set gridsize", gs);
});

$("#unitSizeInput").on("change", function (e) {
    const us = parseInt((<HTMLInputElement>e.target).value);
    gameManager.layerManager.setUnitSize(us);
    socket.emit("set locationOptions", { 'unitSize': us });
});
$("#useGridInput").on("change", function (e) {
    const ug = (<HTMLInputElement>e.target).checked;
    gameManager.layerManager.setUseGrid(ug);
    socket.emit("set locationOptions", { 'useGrid': ug });
});
$("#useFOWInput").on("change", function (e) {
    const uf = (<HTMLInputElement>e.target).checked;
    gameManager.layerManager.setFullFOW(uf);
    socket.emit("set locationOptions", { 'fullFOW': uf });
});
$("#fowOpacity").on("change", function (e) {
    let fo = parseFloat((<HTMLInputElement>e.target).value);
    if (isNaN(fo)) {
        $("#fowOpacity").val(Settings.fowOpacity);
        return;
    }
    if (fo < 0) fo = 0;
    if (fo > 1) fo = 1;
    gameManager.layerManager.setFOWOpacity(fo);
    socket.emit("set locationOptions", { 'fowOpacity': fo });
});

function updateZoom(newZoomValue: number, zoomLocation: GlobalPoint) {
    if (newZoomValue <= 0.01)
        newZoomValue = 0.01;

    const oldLoc = g2l(zoomLocation);
    
    Settings.zoomFactor = newZoomValue;

    const newLoc = l2g(oldLoc);

    // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
    const diff = newLoc.subtract(zoomLocation);
    Settings.panX += diff.direction.x;
    Settings.panY += diff.direction.y;

    gameManager.layerManager.invalidate();
    sendClientOptions();
    $("#zoomer").slider({ value: newZoomValue });
}

export default gameManager;