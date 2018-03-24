// import gameManager from './planarally'
//
// const protocol = document.domain === 'localhost' ? "http://" : "https://";
// const socket = io.connect(protocol + document.domain + ":" + location.port + "/planarally");
// let board_initialised = false;
// socket.on("connect", function () {
//     console.log("Connected");
// });
// socket.on("disconnect", function () {
//     console.log("Disconnected");
// });
// socket.on("redirect", function (destination) {
//     console.log("redirecting");
//     window.location.href = destination;
// });
// socket.on("set username", function (username) {
//     gameManager.username = username;
//     gameManager.IS_DM = username === window.location.pathname.split("/")[2];
//     if ($("#toolselect").find("ul").html().length === 0)
//         gameManager.setupTools();
// });
// socket.on("set clientOptions", function (options) {
//     gameManager.setClientOptions(options);
// });
// socket.on("set locationOptions", function (options) {
//     gameManager.layerManager.setOptions(options);
// });
// socket.on("asset list", function (assets) {
//     const m = $("#menu-tokens");
//     m.empty();
//     let h = '';
//
//     const process = function (entry, path) {
//         path = path || "";
//         const folders = new Map(Object.entries(entry.folders));
//         folders.forEach(function (value, key) {
//             h += "<button class='accordion'>" + key + "</button><div class='accordion-panel'><div class='accordion-subpanel'>";
//             process(value, path + key + "/");
//             h += "</div></div>";
//         });
//         entry.files.sort(alphSort);
//         entry.files.forEach(function (asset) {
//             h += "<div class='draggable token'><img src='/static/img/assets/" + path + asset + "' width='35'>" + asset + "<i class='fas fa-cog'></i></div>";
//         });
//     };
//     process(assets);
//     m.html(h);
//     $(".draggable").draggable({
//         helper: "clone",
//         appendTo: "#board"
//     });
//     $('.accordion').each(function (idx) {
//         $(this).on("click", function () {
//             $(this).toggleClass("accordion-active");
//             $(this).next().toggle();
//         });
//     });
// });
// socket.on("board init", function (room) {
//     gameManager.layerManager = new LayerManager();
//     const layersdiv = $('#layers');
//     layersdiv.empty();
//     const layerselectdiv = $('#layerselect');
//     layerselectdiv.find("ul").empty();
//     let selectable_layers = 0;
//
//     const lm = $("#locations-menu").find("div");
//     lm.children().off();
//     lm.empty();
//     for (let i = 0; i < room.locations.length; i++) {
//         const loc = $("<div>" + room.locations[i] + "</div>");
//         lm.append(loc);
//     }
//     const lmplus = $('<div><i class="fas fa-plus"></i></div>');
//     lm.append(lmplus);
//     lm.children().on("click", function (e) {
//         if (e.target.textContent === '') {
//             const locname = prompt("New location name");
//             if (locname !== null)
//                 socket.emit("new location", locname);
//         } else {
//             socket.emit("change location", e.target.textContent);
//         }
//     });
//
//     for (let i = 0; i < room.board.layers.length ; i++) {
//         const new_layer = room.board.layers[i];
//         // UI changes
//         layersdiv.append("<canvas id='" + new_layer.name + "-layer' style='z-index: " + i + "'></canvas>");
//         if (new_layer.selectable) {
//             let extra = '';
//             if (selectable_layers === 0) extra = " class='layer-selected'";
//             layerselectdiv.find('ul').append("<li id='select-" + new_layer.name + "'" + extra + "><a href='#'>" + new_layer.name + "</a></li>");
//             selectable_layers += 1;
//         }
//         const canvas = $('#' + new_layer.name + '-layer')[0];
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;
//         // State changes
//         let l;
//         if (new_layer.grid)
//             l = new GridLayerState(canvas, new_layer.name);
//         else if (new_layer.name === 'fow')
//             l = new FOWLayerState(canvas, new_layer.name);
//         else
//             l = new LayerState(canvas, new_layer.name);
//         l.selectable = new_layer.selectable;
//         l.player_editable = new_layer.player_editable;
//         gameManager.layerManager.addLayer(l);
//         if (new_layer.grid) {
//             gameManager.layerManager.setGridSize(new_layer.size);
//             gameManager.layerManager.drawGrid();
//             $("#grid-layer").droppable({
//                 accept: ".draggable",
//                 drop: function (event, ui) {
//                     const l = gameManager.layerManager.getLayer();
//                     const offset = $(l.canvas).offset();
//
//                     const loc = {
//                         x: parseInt(ui.offset.left - offset.left),
//                         y: parseInt(ui.offset.top - offset.top)
//                     };
//
//                     if (settings_menu.is(":visible") && loc.x < settings_menu.width())
//                         return;
//                     if (locations_menu.is(":visible") && loc.y < locations_menu.width())
//                         return;
//                     // width = ui.helper[0].width;
//                     // height = ui.helper[0].height;
//                     const wloc = l2w(loc);
//                     const img = ui.draggable[0].children[0];
//                     const asset = new Asset(img, wloc.x, wloc.y, img.width, img.height);
//                     asset.src = img.src;
//
//                     if (gameManager.layerManager.useGrid && !event.altKey) {
//                         const gs = gameManager.layerManager.gridSize;
//                         asset.x = Math.round(asset.x / gs) * gs;
//                         asset.y = Math.round(asset.y / gs) * gs;
//                         asset.w = Math.max(Math.round(asset.w / gs) * gs, gs);
//                         asset.h = Math.max(Math.round(asset.h / gs) * gs, gs);
//                     }
//
//                     l.addShape(asset, true);
//                 }
//             });
//         } else {
//             l.setShapes(new_layer.shapes);
//         }
//     }
//     // Force the correct opacity render on other layers.
//     gameManager.layerManager.setLayer(gameManager.layerManager.getLayer().name);
//     // socket.emit("client initialised");
//     board_initialised = true;
//
//     if (selectable_layers > 1) {
//         layerselectdiv.find("li").on("click", function () {
//             const name = this.id.split("-")[1];
//             const old = layerselectdiv.find("#select-" + gameManager.layerManager.selectedLayer);
//             if (name !== gameManager.layerManager.selectedLayer) {
//                 $(this).addClass("layer-selected");
//                 old.removeClass("layer-selected");
//                 gameManager.layerManager.setLayer(name);
//             }
//         });
//     } else {
//         layerselectdiv.hide();
//     }
//
// });
// socket.on("set gridsize", function (gridSize) {
//     gameManager.layerManager.setGridSize(gridSize);
// });
// socket.on("add shape", function (shape) {
//     const layer = gameManager.layerManager.getLayer(shape.layer);
//     layer.addShape(createShapeFromDict(shape), false);
//     layer.invalidate();
// });
// socket.on("remove shape", function (shape) {
//     const layer = gameManager.layerManager.getLayer(shape.layer);
//     layer.removeShape(gameManager.layerManager.UUIDMap.get(shape.uuid), false);
//     layer.invalidate();
// });
// socket.on("moveShapeOrder", function (data) {
//     gameManager.layerManager.getLayer(data.shape.layer).moveShapeOrder(gameManager.layerManager.UUIDMap.get(data.shape.uuid), data.index, false);
// });
// socket.on("shapeMove", function (shape) {
//     shape = Object.assign(gameManager.layerManager.UUIDMap.get(shape.uuid), createShapeFromDict(shape, true));
//     shape.checkLightSources();
//     gameManager.layerManager.getLayer(shape.layer).onShapeMove(shape);
// });
// socket.on("updateShape", function (data) {
//     const shape = Object.assign(gameManager.layerManager.UUIDMap.get(data.shape.uuid), createShapeFromDict(data.shape, true));
//     shape.checkLightSources();
//     shape.setMovementBlock(shape.movementObstruction);
//     if (data.redraw)
//         gameManager.layerManager.getLayer(data.shape.layer).invalidate();
// });
// socket.on("updateInitiative", function (data) {
//     if (data.initiative === undefined || (!data.owners.includes(gameManager.username) && !gameManager.IS_DM && !data.visible))
//         gameManager.initiativeTracker.removeInitiative(data.uuid, false, true);
//     else
//         gameManager.initiativeTracker.addInitiative(data, false);
// });
// socket.on("setInitiative", function (data) {
//     gameManager.initiativeTracker.data = data;
//     gameManager.initiativeTracker.redraw();
//     if (data.length > 0)
//         initiativeDialog.dialog("open");
// });
// socket.on("clear temporaries", function (shapes) {
//     shapes.forEach(function (shape) {
//         gameManager.layerManager.getLayer(shape.layer).removeShape(shape, false);
//     })
// });
//
// export default socket;