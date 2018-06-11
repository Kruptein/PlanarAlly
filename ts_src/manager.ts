import { l2g, g2l } from "./units";
import { OrderedMap } from './utils';
import { LayerManager, Layer, GridLayer, FOWLayer } from "./layers";
import { ClientOptions, BoardInfo, ServerShape, InitiativeData } from './api_types';
import Asset from './shapes/asset';
import { createShapeFromDict } from './shapes/utils';
import Text from './shapes/text';
import { Tool } from './tools/tool';
import { InitiativeTracker } from './tools/initiative';
import { capitalize } from './utils';
import { GlobalPoint, LocalPoint } from "./geom";
import gameManager from "./planarally";
import { socket, sendClientOptions } from "./socket";
import Settings from "./settings";

export class GameManager {
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
                Settings.setGridSize(new_layer.size, false);
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

                        const settings_menu = $("#menu")!;
                        const locations_menu = $("#locations-menu")!;

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
                        asset.isToken = true;

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

        Settings.board_initialised = true;
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
            if (options.locationOptions[`${Settings.roomName}/${Settings.roomCreator}/${Settings.locationName}`]) {
                const loc = options.locationOptions[`${Settings.roomName}/${Settings.roomCreator}/${Settings.locationName}`];
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