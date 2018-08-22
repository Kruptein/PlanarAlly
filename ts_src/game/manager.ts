import { g2l } from "./units";
import { ClientOptions, BoardInfo, ServerShape } from './api_types';
import { createShapeFromDict } from './shapes/utils';
import { InitiativeTracker } from './ui/tools/initiative';
import { GlobalPoint } from "./geom";
import { socket, sendClientOptions } from "./socket";
import { uuidv4, OrderedMap } from "../core/utils";
import Note from "./note";
import AnnotationManager from "./ui/tools/annotation";
import BoundingVolume from "./bvh/bvh";
import { LayerManager } from "./layers/manager";
import gameManager from "./planarally";
import store from "./store";

export class GameManager {
    layerManager = new LayerManager();
    selectedTool: number = 0;
    notes: OrderedMap<string, Note> = new OrderedMap();
    
    lightsources: { shape: string, aura: string }[] = [];
    lightblockers: string[] = [];
    annotations: string[] = [];
    movementblockers: string[] = [];
    ownedtokens: string[] = [];

    initiativeTracker = new InitiativeTracker();
    annotationManager = new AnnotationManager();
    shapeSelectionDialog = $("#shapeselectiondialog").dialog({
        autoOpen: false,
        width: 'auto'
    });
    initiativeDialog = $("#initiativedialog").dialog({
        autoOpen: false,
        width: 'auto',
        
    });

    BV!: BoundingVolume;

    constructor() {
        this.recalculateBoundingVolume();
        // this.gridColour.spectrum({
        //     showInput: true,
        //     allowEmpty: true,
        //     showAlpha: true,
        //     color: "rgba(255,0,0, 0.5)",
        //     move: function () {
        //         if(gameManager.layerManager.getGridLayer() !== undefined)
        //             gameManager.layerManager.getGridLayer()!.drawGrid();
        //     },
        //     change: function (colour) {
        //         socket.emit("set clientOptions", { 'gridColour': colour.toRgbString() });
        //     }
        // });
        // this.fowColour.spectrum({
        //     showInput: true,
        //     color: "rgb(82, 81, 81)",
        //     move: function (colour) {
        //         const l = gameManager.layerManager.getLayer("fow");
        //         if (l !== undefined) {
        //             l.shapes.forEach(function (shape) {
        //                 shape.fill = colour.toRgbString();
        //             });
        //             l.invalidate(false);
        //         }
        //     },
        //     change: function (colour) {
        //         socket.emit("set clientOptions", { 'fowColour': colour.toRgbString() });
        //     }
        // });
    }

    recalculateBoundingVolume() {
        this.BV = new BoundingVolume(this.lightblockers);
    }

    setupBoard(room: BoardInfo): void {
        // this.layerManager = new LayerManager();
        // const layersdiv = $('#layers');
        // layersdiv.empty();
        // const layerselectdiv = $('#layerselect');
        // layerselectdiv.find("ul").empty();

        // const lm = $("#locations-menu").find("div");
        // lm.children().off();
        // lm.empty();
        // for (let i = 0; i < room.locations.length; i++) {
        //     const loc = $("<div>" + room.locations[i] + "</div>");
        //     lm.append(loc);
        // }
        // const lmplus = $('<div><i class="fas fa-plus"></i></div>');
        // lm.append(lmplus);
        // lm.children().on("click", function (e) {
        //     if (e.target.textContent === '') {
        //         const locname = prompt("New location name");
        //         if (locname !== null)
        //             socket.emit("new location", locname);
        //     } else {
        //         socket.emit("change location", e.target.textContent);
        //     }
        // });

        // for (let i = 0; i < room.board.layers.length; i++) {
        //     this.layerManager.createLayer(room.board.layers[i]);
        // }
        // // Force the correct opacity render on other layers.
        // this.layerManager.setLayer(this.layerManager.getLayer()!.name);
        
        // if (this.layerManager.layers.reduce((acc, val) => acc + (val.selectable ? 1 : 0), 0) > 1) {
        //     layerselectdiv.find("li").on("click", function () {
        //         const name = this.id.split("-")[1];
        //         const old = layerselectdiv.find("#select-" + gameManager.layerManager.selectedLayer);
        //         if (name !== gameManager.layerManager.selectedLayer) {
        //             $(this).addClass("layer-selected");
        //             old.removeClass("layer-selected");
        //             gameManager.layerManager.setLayer(name);
        //         }
        //     });
        // } else {
        //     layerselectdiv.hide();
        // }

        // this.initiativeTracker.clear();
    }

    newNote(name: string, text: string, show: boolean, sync: boolean, uuid?:string): void {
        const id: string = uuid || uuidv4();

        const note = new Note(name, text, id);

        if (sync) {
            socket.emit("newNote", note.asDict());
        }

        this.notes.set(id, note);

        const button = $('<button>' + note.name + '</button>');

        button.attr('note-id', id);
        button.click(function() {
            gameManager.notes.get(id).show();
        });
        $('#menu-notes').append(button);

        if (show) {
            note.show();
        }
    }

    addShape(shape: ServerShape): void {
        if (!this.layerManager.hasLayer(shape.layer)) {
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
        if (!this.layerManager.hasLayer(shape.layer)) {
            console.log(`Shape with unknown layer ${shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${shape.type} could not be added`);
            return;
        }
        const real_shape = Object.assign(this.layerManager.UUIDMap.get(shape.uuid), sh);
        this.layerManager.getLayer(real_shape.layer)!.onShapeMove(real_shape);
    }

    updateShape(data: { shape: ServerShape; redraw: boolean; }): void {
        if (!this.layerManager.hasLayer(data.shape.layer)) {
            console.log(`Shape with unknown layer ${data.shape.layer} could not be added`);
            return;
        }
        const sh = createShapeFromDict(data.shape, true);
        if (sh === undefined) {
            console.log(`Shape with unknown type ${data.shape.type} could not be added`);
            return;
        }
        const oldShape = this.layerManager.UUIDMap.get(data.shape.uuid);
        if (oldShape === undefined) {
            console.log(`Shape with unknown id could not be updated`);
            return;
        }
        const redrawInitiative = sh.owners !== oldShape.owners;
        const shape = Object.assign(oldShape, sh);
        shape.checkLightSources();
        shape.setMovementBlock(shape.movementObstruction);
        shape.setIsToken(shape.isToken);
        if (data.redraw)
            this.layerManager.getLayer(data.shape.layer)!.invalidate(false);
        if (redrawInitiative)
            gameManager.initiativeTracker.redraw();
    }

    setClientOptions(options: ClientOptions): void {
        if (options.gridColour)
            store.commit("setGridColour", options.gridColour);
        if (options.fowColour) {
            store.commit("setFOWColour", options.fowColour);
        }
        if (options.locationOptions) {
            if (options.locationOptions[`${store.state.roomName}/${store.state.roomCreator}/${store.state.locationName}`]) {
                const loc = options.locationOptions[`${store.state.roomName}/${store.state.roomCreator}/${store.state.locationName}`];
                if (loc.panX)
                    store.commit("setPanX", loc.panX);
                if (loc.panY)
                store.commit("setPanY", loc.panY);
                if (loc.zoomFactor) {
                    store.commit("setZoomFactor", loc.zoomFactor);
                    $("#zoomer").slider({ value: loc.zoomFactor });
                }
                if (this.layerManager.getGridLayer() !== undefined)
                    this.layerManager.getGridLayer()!.invalidate();
            }
        }
    }

    setCenterPosition(position: GlobalPoint) {
        const l_pos = g2l(position);
        store.commit("increasePanX", ((window.innerWidth / 2) - l_pos.x) / store.state.zoomFactor);
        store.commit("increasePanY", ((window.innerHeight / 2) - l_pos.y) / store.state.zoomFactor);
        this.layerManager.invalidate();
        sendClientOptions();
    }
}