import gameManager from "./planarally";
import { alphSort } from "../core/utils";
import { setupTools } from "./tools/tools";
import { ClientOptions, LocationOptions, Notes, AssetList, ServerShape, InitiativeData, BoardInfo, InitiativeEffect, AssetFileList } from "./api_types";
import { GlobalPoint } from "./geom";
import Settings from "./settings";

export const socket = io.connect(location.protocol + "//" + location.host + "/planarally");
socket.on("connect", function () {
    console.log("Connected");
});
socket.on("disconnect", function () {
    console.log("Disconnected");
});
socket.on("redirect", function (destination: string) {
    console.log("redirecting");
    window.location.href = destination;
});
socket.on("set room info", function (data: {name: string, creator: string}) {
    Settings.roomName = data.name;
    Settings.roomCreator = data.creator;
});
socket.on("set username", function (username: string) {
    Settings.username = username;
    Settings.IS_DM = username === window.location.pathname.split("/")[2];
    setupTools();
});
socket.on("set clientOptions", function (options: ClientOptions) {
    gameManager.setClientOptions(options);
});
socket.on("set locationOptions", function (options: LocationOptions) {
    Settings.setOptions(options);
});
socket.on("set location", function (data: {name:string, options: LocationOptions}) {
    Settings.locationName = data.name;
    Settings.setOptions(data.options);
});
socket.on("set position", function (data: {x: number, y: number}) {
    gameManager.setCenterPosition(new GlobalPoint(data.x, data.y));
});
socket.on("set notes", function (notes: Notes[]) {
    for (let n of notes) {
        gameManager.newNote(n.name, n.text, false, false, n.uuid);
    };
});
socket.on("asset list", function (assets: AssetList) {
    const m = $("#menu-tokens");
    m.empty();
    let h = '';

    const process = function (entry: AssetList) {
        const folders = Object.keys(entry).filter(el => !['__files'].includes(el)).sort(alphSort);
        for (let name of folders) {
            h += "<li class='folder'>" + name + "<ul>";
            process((<AssetList>entry[name]));
            h += "</ul></li>";
        }
        let files: AssetFileList[] = [];
        if (entry['__files'])
            files = (<AssetFileList[]>entry['__files']).concat().sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
        for (let asset of files)
            h += `<li class='file draggable token' data-img='/static/assets/${asset.hash}'>${asset.name}</li>`;
    };
    process(assets);
    m.html(h);
    $(".draggable").draggable({
        helper: function() {
            return $( `<img src='${$(this).data("img")}' class='asset-preview-image'>` );
        },
        appendTo: "#board"
    });
    
    $('.folder').on("click", function (e) {
        $(this).children().toggle();
        e.stopPropagation();
    });
    $('.file').hover(
        function(e) {
            $("body").append(`<p id='preview'><img src='${$(this).data("img")}' class='asset-preview-image'></p>`); 
            $("#preview")
                .css("top",(e.pageY) + "px")
                .css("left",(e.pageX) + "px")
                .fadeIn("fast");	
        },
        function(e) {
            $("#preview").remove();
        }
    );
    $('.file').on("mousemove", function(e) {
        $("#preview")
			.css("top",(e.pageY) + "px")
			.css("left",(e.pageX) + "px");
    });
    $('.accordion').on("click", function () {
        $(this).toggleClass("accordion-active");
        $(this).next().toggle();
    });
});
socket.on("board init", function (location_info: BoardInfo) {
    gameManager.setupBoard(location_info)
});
socket.on("set gridsize", function (gridSize: number) {
    Settings.setGridSize(gridSize, false);
});
socket.on("add shape", function (shape: ServerShape) {
    gameManager.addShape(shape);
});
socket.on("remove shape", function (shape: ServerShape) {
    if (!gameManager.layerManager.UUIDMap.has(shape.uuid)){
        console.log(`Attempted to remove an unknown shape`);
        return ;
    }
    if (!gameManager.layerManager.hasLayer(shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
        return ;
    }
    const layer = gameManager.layerManager.getLayer(shape.layer)!;
    layer.removeShape(gameManager.layerManager.UUIDMap.get(shape.uuid)!, false);
    layer.invalidate(false);
});
socket.on("moveShapeOrder", function (data: { shape: ServerShape; index: number }) {
    if (!gameManager.layerManager.UUIDMap.has(data.shape.uuid)) {
        console.log(`Attempted to move the shape order of an unknown shape`);
        return ;
    }
    if (!gameManager.layerManager.hasLayer(data.shape.layer)) {
        console.log(`Attempted to remove shape from an unknown layer ${data.shape.layer}`);
        return ;
    }
    const shape = gameManager.layerManager.UUIDMap.get(data.shape.uuid)!;
    const layer = gameManager.layerManager.getLayer(shape.layer)!;
    layer.moveShapeOrder(shape, data.index, false);
});
socket.on("shapeMove", function (shape: ServerShape) {
    gameManager.moveShape(shape);
});
socket.on("updateShape", function (data: { shape: ServerShape; redraw: boolean }) {
    gameManager.updateShape(data);
});
socket.on("updateInitiative", function (data: InitiativeData) {
    if (data.initiative === undefined || (!data.owners.includes(Settings.username) && !Settings.IS_DM && !data.visible))
        gameManager.initiativeTracker.removeInitiative(data.uuid, false, true);
    else
        gameManager.initiativeTracker.addInitiative(data, false);
});
socket.on("setInitiative", function (data: InitiativeData[]) {
    gameManager.initiativeTracker.setData(data);
});
socket.on("updateInitiativeOrder", function (data: string[]) {
    gameManager.initiativeTracker.updateInitiativeOrder(data, false);
});
socket.on("updateInitiativeTurn", function (data: string) {
    gameManager.initiativeTracker.setTurn(data, false);
});
socket.on("updateInitiativeRound", function (data: number) {
    gameManager.initiativeTracker.setRound(data, false);
});
socket.on("Initiative.Effect.New", function (data: {actor: string, effect: InitiativeEffect}) {
    gameManager.initiativeTracker.createNewEffect(data.actor, data.effect, false)
});
socket.on("Initiative.Effect.Update", function (data: {actor: string, effect: InitiativeEffect}) {
    gameManager.initiativeTracker.updateEffect(data.actor, data.effect, false)
});
socket.on("clear temporaries", function (shapes: ServerShape[]) {
    shapes.forEach(function (shape) {
        if (!gameManager.layerManager.UUIDMap.has(shape.uuid)) {
            console.log("Attempted to remove an unknown temporary shape");
            return ;
        }
        if (!gameManager.layerManager.hasLayer(shape.layer)){
            console.log(`Attempted to remove shape from an unknown layer ${shape.layer}`);
            return ;
        }
        const real_shape = gameManager.layerManager.UUIDMap.get(shape.uuid)!;
        gameManager.layerManager.getLayer(shape.layer)!.removeShape(real_shape, false);
    })
});

export function sendClientOptions() {
    socket.emit("set clientOptions", {
        locationOptions: {
            [`${Settings.roomName}/${Settings.roomCreator}/${Settings.locationName}`]: {
                panX: Settings.panX,
                panY: Settings.panY,
                zoomFactor: Settings.zoomFactor,
            }
        }
    });
}

export default socket;
