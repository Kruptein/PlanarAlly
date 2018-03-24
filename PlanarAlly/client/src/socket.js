import gameManager from "./planarally";
import { alphSort } from "./utils";
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
    gameManager.username = username;
    gameManager.IS_DM = username === window.location.pathname.split("/")[2];
    if ($("#toolselect").find("ul").html().length === 0)
        gameManager.setupTools();
});
socket.on("set clientOptions", function (options) {
    gameManager.setClientOptions(options);
});
socket.on("set locationOptions", function (options) {
    gameManager.layerManager.setOptions(options);
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
        entry.files.sort(alphSort);
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
    gameManager.setupBoard(location_info);
});
socket.on("set gridsize", function (gridSize) {
    gameManager.layerManager.setGridSize(gridSize);
});
socket.on("add shape", function (shape) {
    gameManager.addShape(shape);
});
socket.on("remove shape", function (shape) {
    const layer = gameManager.layerManager.getLayer(shape.layer);
    layer.removeShape(gameManager.layerManager.UUIDMap.get(shape.uuid), false);
    layer.invalidate();
});
socket.on("moveShapeOrder", function (data) {
    gameManager.layerManager.getLayer(data.shape.layer).moveShapeOrder(gameManager.layerManager.UUIDMap.get(data.shape.uuid), data.index, false);
});
socket.on("shapeMove", function (shape) {
    gameManager.moveShape(shape);
});
socket.on("updateShape", function (data) {
    gameManager.updateShape(data);
});
socket.on("updateInitiative", function (data) {
    if (data.initiative === undefined || (!data.owners.includes(gameManager.username) && !gameManager.IS_DM && !data.visible))
        gameManager.initiativeTracker.removeInitiative(data.uuid, false, true);
    else
        gameManager.initiativeTracker.addInitiative(data, false);
});
socket.on("setInitiative", function (data) {
    gameManager.setInitiative(data);
});
socket.on("clear temporaries", function (shapes) {
    shapes.forEach(function (shape) {
        gameManager.layerManager.getLayer(shape.layer).removeShape(shape, false);
    });
});
export default socket;
//# sourceMappingURL=socket.js.map