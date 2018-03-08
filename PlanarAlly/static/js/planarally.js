// Removes violation errors on touchstart? https://stackoverflow.com/questions/46094912/added-non-passive-event-listener-to-a-scroll-blocking-touchstart-event
// This is only necessary due to the spectrum color picker
jQuery.event.special.touchstart = {
    setup: function (_, ns, handle) {
        if (ns.includes("noPreventDefault")) {
            this.addEventListener("touchstart", handle, {passive: false});
        } else {
            this.addEventListener("touchstart", handle, {passive: true});
        }
    }
};


// **** WebSocket ****

const protocol = document.domain === 'localhost' ? "http://" : "https://";
const socket = io.connect(protocol + document.domain + ":" + location.port + "/planarally");
let board_initialised = false;
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
        setupTools();
});
socket.on("set clientOptions", function (options) {
    if ("gridColour" in options)
        gridColour.spectrum("set", options.gridColour);
    if ("fowColour" in options)
        fowColour.spectrum("set", options.fowColour);
});
socket.on("asset list", function (assets) {
    const m = $("#menu-tokens");
    m.empty();
    let h = '';

    const process = function (entry, path) {
        path = path || "";
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
    process(assets);
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
socket.on("board init", function (room) {
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
                    const z = gameManager.layerManager.zoomFactor;
                    const panX = gameManager.layerManager.panX;
                    const panY = gameManager.layerManager.panY;
                    x = parseInt(ui.offset.left - offset.left);
                    y = parseInt(ui.offset.top - offset.top);
                    if (settings_menu.is(":visible") && x < settings_menu.width())
                        return;
                    if (locations_menu.is(":visible") && y < locations_menu.width())
                        return;
                    // width = ui.helper[0].width;
                    // height = ui.helper[0].height;
                    const img = ui.draggable[0].children[0];
                    const asset = new Asset(img, (x / z) - panX, (y / z) - panY, img.width, img.height);
                    asset.src = img.src;
                    l.addShape(asset, true);
                }
            });
        } else {
            l.setShapes(new_layer.shapes);
        }
    }
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
    } else {
        layerselectdiv.hide();
    }

});
socket.on("set gridsize", function (gridSize) {
    gameManager.layerManager.setGridSize(gridSize);
});
socket.on("add shape", function (shape) {
    gameManager.layerManager.getLayer(shape.layer).addShape(createShapeFromDict(shape), false);
});
socket.on("remove shape", function (shape) {
    gameManager.layerManager.getLayer(shape.layer).removeShape(gameManager.layerManager.UUIDMap.get(shape.uuid), false);
});
socket.on("moveShapeOrder", function (data) {
    gameManager.layerManager.getLayer(data.shape.layer).moveShapeOrder(gameManager.layerManager.UUIDMap.get(data.shape.uuid), data.index, false);
});
socket.on("shapeMove", function (shape) {
    Object.assign(gameManager.layerManager.UUIDMap.get(shape.uuid), createShapeFromDict(shape, true));
    gameManager.layerManager.getLayer(shape.layer).onShapeMove(shape);
});
socket.on("clear temporaries", function (shapes) {
    shapes.forEach(function (shape) {
        gameManager.layerManager.getLayer(shape.layer).removeShape(shape, false);
    })
});

// **** BOARD ELEMENTS ****

function Shape() {
    this.layer = null;
}

Shape.prototype.onMouseUp = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
    // const cog = $(`<div id="shapeselectioncog-${this.uuid}"><i class='fa fa-cog' style='left:${this.x};top:${this.y + this.h + 10};z-index:50;position:absolute;'></i></div>`);
    // cog.on("click", function () {
    //     shapeSelectionDialog.dialog( "open" );
    // });
    // $("body").append(cog);
};
Shape.prototype.onSelectionLoss = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
};
Shape.prototype.onRemove = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
};
Shape.prototype.asDict = function () {
    return Object.assign({}, this);
};
Shape.prototype.draw = function (ctx) {
    if (this.layer === 'fow' && gameManager.IS_DM && this.globalCompositeOperation === "destination-out")
        ctx.globalAlpha = 1.0;
    else if (this.layer === 'fow' && gameManager.IS_DM)
        ctx.globalAlpha = 0.3;
    if (this.globalCompositeOperation !== undefined)
        ctx.globalCompositeOperation = this.globalCompositeOperation;
    else
        ctx.globalCompositeOperation = "source-over";
};
Shape.prototype.contains = function () {
    return false;
};
Shape.prototype.showContextMenu = function (mouse) {
    const l = gameManager.layerManager.getLayer();
    l.selection = this;
    l.invalidate();
    const asset = this;
    $menu.show();
    $menu.empty();
    $menu.css({left: mouse.x, top: mouse.y});
    let data = "" +
        "<ul>" +
        "<li>Layer<ul>";
    gameManager.layerManager.layers.forEach(function (layer) {
        if (!layer.selectable) return;
        const sel = layer.name === l.name ? " style='background-color:aqua' " : " ";
        data += "<li data-action='setLayer' data-layer='" + layer.name + "'" + sel + "class='context-clickable'>" + layer.name + "</li>";
    });
    data += "</ul></li>" +
        "<li data-action='moveToBack' class='context-clickable'>Move to back</li>" +
        "<li data-action='moveToFront' class='context-clickable'>Move to front</li>" +
        "</ul>";
    $menu.html(data);
    $(".context-clickable").on('click', function () {
        handleContextMenu($(this), asset);
    });
};

function Rect(x, y, w, h, fill, border, uuid) {
    this.type = "rect";
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.fill = fill || '#000';
    this.border = border || "rgba(0, 0, 0, 0)";
    this.uuid = uuid || uuidv4();
    this.layer = null;
}

Rect.prototype = Object.create(Shape.prototype);
Rect.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.fillStyle = this.fill;
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    ctx.fillRect((this.x + panX) * z, (this.y + panY) * z, this.w * z, this.h * z);
    if (this.border !== "rgba(0, 0, 0, 0)") {
        ctx.strokeStyle = this.border;
        ctx.strokeRect((this.x + panX) * z, (this.y + panY) * z, this.w * z, this.h * z);
    }
};
Rect.prototype.contains = function (mx, my) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    return ((this.x + panX) * z <= mx) && ((this.x + this.w + panX) * z >= mx) &&
        ((this.y + panY) * z <= my) && ((this.y + this.h + panY) * z >= my);
};
Rect.prototype.inCorner = function (mx, my, corner) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    switch (corner) {
        case 'ne':
            return (this.x + this.w + panX - 3) * z <= mx && mx <= (this.x + this.w + panX + 3) * z && (this.y + panY - 3) * z <= my && my <= (this.y + panY + 3) * z;
        case 'nw':
            return (this.x + panX - 3) * z <= mx && mx <= (this.x + panX + 3) * z && (this.y + panY - 3) * z <= my && my <= (this.y + panY + 3) * z;
        case 'sw':
            return (this.x + panX - 3) * z <= mx && mx <= (this.x + panX + 3) * z && (this.y + this.h + panY - 3) * z <= my && my <= (this.y + this.h + panY + 3) * z;
        case 'se':
            return (this.x + this.w + panX - 3) * z <= mx && mx <= (this.x + this.w + panX + 3) * z && (this.y + this.h + panY - 3) * z <= my && my <= (this.y + this.h + panY + 3) * z;
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
        return {x: this.x + this.w / 2, y: this.y + this.h / 2};
    this.x = centerPoint.x - this.w / 2;
    this.y = centerPoint.y - this.h / 2;
};

function Circle(x, y, r, fill, border, uuid) {
    this.type = "circle";
    this.x = x || 0;
    this.y = y || 0;
    this.r = r || 1;
    this.fill = fill || '#000';
    this.border = border || "rgba(0, 0, 0, 0)";
    this.uuid = uuid || uuidv4();
    this.layer = null;
}

Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    ctx.beginPath();
    ctx.fillStyle = this.fill;
    ctx.arc((this.x + panX) * z, (this.y + panY) * z, this.r, 0, 2 * Math.PI);
    ctx.fill();
    if (this.border !== "rgba(0, 0, 0, 0)") {
        ctx.beginPath();
        ctx.strokeStyle = this.border;
        ctx.arc((this.x + panX) * z, (this.y + panY) * z, this.r, 0, 2 * Math.PI);
        ctx.stroke();
    }
};
Circle.prototype.contains = function (mx, my) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    const x = (this.x + panX) * z;
    const y = (this.y + panY) * z;
    return (mx - x) ** 2 + (my - y) ** 2 < this.r ** 2;
};
Circle.prototype.inCorner = function (mx, my, corner) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    switch (corner) {
        case 'ne':
            return (this.x + this.w + panX - 3) * z <= mx && mx <= (this.x + this.w + panX + 3) * z && (this.y + panY - 3) * z <= my && my <= (this.y + panY + 3) * z;
        case 'nw':
            return (this.x + panX - 3) * z <= mx && mx <= (this.x + panX + 3) * z && (this.y + panY - 3) * z <= my && my <= (this.y + panY + 3) * z;
        case 'sw':
            return (this.x + panX - 3) * z <= mx && mx <= (this.x + panX + 3) * z && (this.y + this.h + panY - 3) * z <= my && my <= (this.y + this.h + panY + 3) * z;
        case 'se':
            return (this.x + this.w + panX - 3) * z <= mx && mx <= (this.x + this.w + panX + 3) * z && (this.y + this.h + panY - 3) * z <= my && my <= (this.y + this.h + panY + 3) * z;
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
        return {x: this.x, y: this.y};
    this.x = centerPoint.x;
    this.y = centerPoint.y;
};

function Line(x1, y1, x2, y2, uuid) {
    this.type = "line";
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.uuid = uuid || uuidv4();
}

Line.prototype = Object.create(Shape.prototype);
Line.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
};

function Text(x, y, text, font, angle, uuid) {
    this.type = "text";
    this.x = x;
    this.y = y;
    this.text = text;
    this.font = font;
    this.angle = angle || 0;
    this.uuid = uuid || uuidv4();
}

Text.prototype = Object.create(Shape.prototype);
Text.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.font = this.font;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.textAlign = "center";
    ctx.fillText(this.text, 0, -5);
    ctx.restore();
};

function Asset(img, x, y, w, h, uuid) {
    this.type = "asset";
    this.uuid = uuid || uuidv4();
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    //this.vision = [new Rect(this.center().x - 30, this.center().y - 30, 60, 60, "rgba(20, 20, 20, 20)")];
    // this.vision = [new Circle(this.center().x, this.center().y, 30, "rgba(20, 20, 20, 0.2)")];
    this.vision = [];
}

Asset.prototype = Object.create(Rect.prototype);
Asset.prototype.draw = function (ctx) {
    this.vision.forEach(function (vis) {
        vis.draw(ctx);
    });
    Shape.prototype.draw.call(this, ctx);
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    ctx.drawImage(this.img, (this.x + panX) * z, (this.y + panY) * z, this.w * z, this.h * z);
};
Asset.prototype.onMouseUp = function () {
    const self = this;
    this.vision.forEach(function (vis) {
        vis.center(self.center());
    });
    Shape.prototype.onMouseUp.call(this);
};

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

    const html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    const state = this;

    this.valid = false;
    this.shapes = new OrderedMap();
    this.dragging = false;
    this.resizing = false;
    this.panning = false;
    this.resizedir = '';

    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;

    this.selectionColor = '#CC0000';
    this.selectionWidth = 2;
    this.interval = 30;
    setInterval(function () {
        state.draw();
    }, state.interval);
}

LayerState.prototype.invalidate = function () {
    this.valid = false;
};
LayerState.prototype.addShape = function (shape, sync, temporary) {
    if (sync === undefined) sync = false;
    if (temporary === undefined) temporary = false;
    shape.layer = this.name;
    this.shapes.push(shape);
    if (sync) socket.emit("add shape", {shape: shape.asDict(), temporary: temporary});
    gameManager.layerManager.UUIDMap.set(shape.uuid, shape);
    this.invalidate();
};
LayerState.prototype.setShapes = function (shapes) {
    const t = [];
    const self = this;
    let keepSelection = false;
    shapes.forEach(function (shape) {
        const sh = createShapeFromDict(shape, self);
        sh.layer = self.name;
        gameManager.layerManager.UUIDMap.set(shape.uuid, sh);
        t.push(sh);
        if (self.selection && sh.x === self.selection.x && sh.y === self.selection.y && sh.w === self.selection.w && sh.h === self.selection.h) keepSelection = true;
    });
    this.shapes.data = t;
    if (!keepSelection) this.selection = null;
    this.invalidate();
};
LayerState.prototype.removeShape = function (shape, sync, temporary) {
    if (sync === undefined) sync = false;
    if (temporary === undefined) temporary = false;
    shape.onRemove();
    this.shapes.remove(shape);
    if (sync) socket.emit("remove shape", {shape: shape, temporary: temporary});
    gameManager.layerManager.UUIDMap.delete(shape.uuid);
    if (this.selection === shape) this.selection = null;
    this.invalidate();
};
LayerState.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
};
LayerState.prototype.draw = function () {
    if (!this.valid) {
        const ctx = this.ctx;
        this.clear();

        const state = this;
        const panX = gameManager.layerManager.panX;
        const panY = gameManager.layerManager.panY;
        const z = gameManager.layerManager.zoomFactor;
        this.shapes.data.forEach(function (shape) {
            if ((shape.x + panX) * z > state.width || (shape.y + panY) * z > state.height ||
                (shape.x + shape.w + panX) * z < 0 || (shape.y + shape.h + panY) * z < 0) return;
            shape.draw(ctx);
        });

        if (this.selection != null) {
            const z = gameManager.layerManager.zoomFactor;
            const panX = gameManager.layerManager.panX;
            const panY = gameManager.layerManager.panY;
            ctx.strokeStyle = this.selectionColor;
            ctx.lineWidth = this.selectionWidth;
            const mySel = this.selection;
            ctx.strokeRect((mySel.x + panX) * z, (mySel.y + panY) * z, mySel.w * z, mySel.h * z);

            // topright
            ctx.fillRect((mySel.x + mySel.w + panX - 3) * z, (mySel.y + panY - 3) * z, 6 * z, 6 * z);
            // topleft
            ctx.fillRect((mySel.x + panX - 3) * z, (mySel.y + panY - 3) * z, 6 * z, 6 * z);
            // botright
            ctx.fillRect((mySel.x + mySel.w + panX - 3) * z, (mySel.y + mySel.h + panY - 3) * z, 6 * z, 6 * z);
            // botleft
            ctx.fillRect((mySel.x + panX - 3) * z, (mySel.y + mySel.h + panY - 3) * z, 6 * z, 6 * z)
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

    return {x: mx, y: my};
};
LayerState.prototype.moveShapeOrder = function (shape, destinationIndex, sync) {
    if (this.shapes.moveTo(shape, destinationIndex)) {
        if (sync) socket.emit("moveShapeOrder", {shape: shape.asDict(), index: destinationIndex});
        this.invalidate();
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
    shape.fill = fowColour.spectrum("get").toRgbString();
    LayerState.prototype.addShape.call(this, shape, sync, temporary);
};
FOWLayerState.prototype.setShapes = function (shapes) {
    const c = fowColour.spectrum("get").toRgbString();
    shapes.forEach(function (shape) {
        shape.fill = c;
    });
    LayerState.prototype.setShapes.call(this, shapes);
};
FOWLayerState.prototype.onShapeMove = function (shape) {
    shape.fill = fowColour.spectrum("get").toRgbString();
    LayerState.prototype.onShapeMove.call(this, shape);
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
    this.zoomFactor = 1;
    this.panX = 0;
    this.panY = 0;
}

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
    if (this.selectedLayer === null && layer.selectable) this.selectedLayer = layer.name;
};
LayerManager.prototype.getLayer = function (name) {
    name = (typeof name === 'undefined') ? this.selectedLayer : name;
    for (let i = 0; i < this.layers.length; i++) {
        if (this.layers[i].name === name) return this.layers[i];
    }
};
LayerManager.prototype.setLayer = function (name) {
    let found = false;
    const lm = this;
    this.layers.forEach(function (layer) {
        if (!layer.selectable) return;
        if (found) layer.ctx.globalAlpha = 0.3;
        else layer.ctx.globalAlpha = 1.0;

        if (name === layer.name) {
            lm.selectedLayer = name;
            found = true;
        }

        layer.selection = null;
        layer.invalidate();
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

    ctx.strokeStyle = gridColour.spectrum("get").toRgbString();
    ctx.lineWidth = 1;
    ctx.stroke();
    layer.valid = true;
};
LayerManager.prototype.setGridSize = function (gridSize) {
    if (gridSize !== this.gridSize) {
        this.gridSize = gridSize;
        this.drawGrid();
        $('#gridSizeInput').val(gridSize);
    }
};
LayerManager.prototype.invalidate = function () {
    for (let i = 0; i < this.layers.length; i++) {
        this.layers[i].invalidate();
    }
};
LayerManager.prototype.onMouseDown = function (e) {
    const layer = gameManager.layerManager.getLayer();
    const mouse = layer.getMouse(e);
    const mx = mouse.x;
    const my = mouse.y;

    if (tools[gameManager.selectedTool].name === 'select') {
        let hit = false;
        for (let i = layer.shapes.data.length - 1; i >= 0; i--) {
            const shape = layer.shapes.data[i];
            const corn = shape.getCorner(mx, my);
            if (corn !== undefined) {
                layer.selection = shape;
                layer.resizing = true;
                layer.resizedir = corn;
                layer.invalidate();
                hit = true;
                setSelectionInfo(shape);
                break;
            } else if (shape.contains(mx, my)) {
                const sel = shape;
                const z = gameManager.layerManager.zoomFactor;
                layer.selection = sel;
                layer.dragging = true;
                layer.dragoffx = mx - sel.x * z;
                layer.dragoffy = my - sel.y * z;
                setSelectionInfo(shape);
                layer.invalidate();
                hit = true;
                break;
            }
        }

        if (!hit && layer.selection) {
            layer.selection.onSelectionLoss();
            layer.selection = null;
            layer.invalidate();
        }
    } else if (tools[gameManager.selectedTool].name === 'pan') {
        layer.panning = true;
        layer.dragoffx = mx;
        layer.dragoffy = my;
    }

};
LayerManager.prototype.onMouseMove = function (e) {
    const layer = gameManager.layerManager.getLayer();
    const sel = layer.selection;
    const mouse = layer.getMouse(e);
    const z = gameManager.layerManager.zoomFactor;
    if (layer.dragging) {
        sel.x = (mouse.x - layer.dragoffx) / z;
        sel.y = (mouse.y - layer.dragoffy) / z;
        socket.emit("shapeMove", {shape: sel.asDict(), temporary: true});
        setSelectionInfo(sel);
        layer.invalidate();
    } else if (layer.resizing) {
        const panX = gameManager.layerManager.panX;
        const panY = gameManager.layerManager.panY;
        if (layer.resizedir === 'nw') {
            sel.w = (sel.x + panX) * z + sel.w * z - mouse.x;
            sel.h = (sel.y + panY) * z + sel.h * z - mouse.y;
            sel.x = (mouse.x / z) - panX;
            sel.y = (mouse.y / z) - panY;
        } else if (layer.resizedir === 'ne') {
            sel.w = mouse.x - (sel.x + panX) * z;
            sel.h = (sel.y + panY) * z + sel.h * z - mouse.y;
            sel.y = (mouse.y / z) - panY;
        } else if (layer.resizedir === 'se') {
            sel.w = mouse.x - (sel.x + panX) * z;
            sel.h = mouse.y - (sel.y + panY) * z;
        } else if (layer.resizedir === 'sw') {
            sel.w = (sel.x + panX) * z + sel.w * z - mouse.x;
            sel.h = mouse.y - (sel.y + panY) * z;
            sel.x = (mouse.x / z) - panX;
        }
        sel.w /= z;
        sel.h /= z;
        socket.emit("shapeMove", {shape: sel.asDict(), temporary: true});
        setSelectionInfo(sel);
        layer.invalidate();
    } else if (layer.panning) {
        const z = gameManager.layerManager.zoomFactor;
        gameManager.layerManager.panX += Math.round((mouse.x - layer.dragoffx) / z);
        gameManager.layerManager.panY += Math.round((mouse.y - layer.dragoffy) / z);
        layer.dragoffx = mouse.x;
        layer.dragoffy = mouse.y;
        gameManager.layerManager.invalidate();
    } else if (sel) {
        if (sel.inCorner(mouse.x, mouse.y, "nw")) {
            document.body.style.cursor = "nw-resize";
        } else if (sel.inCorner(mouse.x, mouse.y, "ne")) {
            document.body.style.cursor = "ne-resize";
        } else if (sel.inCorner(mouse.x, mouse.y, "se")) {
            document.body.style.cursor = "se-resize";
        } else if (sel.inCorner(mouse.x, mouse.y, "sw")) {
            document.body.style.cursor = "sw-resize";
        } else {
            document.body.style.cursor = "default";
        }
    } else {
        document.body.style.cursor = "default";
    }
};
LayerManager.prototype.onMouseUp = function (e) {
    const layer = gameManager.layerManager.getLayer();
    if (!e.altKey && layer.dragging) {
        const orig = Object.assign({}, layer.selection);
        const gs = gameManager.layerManager.gridSize;
        const mouse = {x: layer.selection.x + layer.selection.w / 2, y: layer.selection.y + layer.selection.h / 2};
        const mx = mouse.x;
        const my = mouse.y;
        if ((layer.selection.w / gs) % 2 === 0) {
            layer.selection.x = Math.round(mx / gs) * gs - layer.selection.w / 2;
        } else {
            layer.selection.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - layer.selection.w / 2;
        }
        if ((layer.selection.h / gs) % 2 === 0) {
            layer.selection.y = Math.round(my / gs) * gs - layer.selection.h / 2;
        } else {
            layer.selection.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - layer.selection.h / 2;
        }
        layer.selection.onMouseUp();
        if (orig.x !== layer.selection.x || orig.y !== layer.selection.y) {
            socket.emit("shapeMove", {shape: layer.selection.asDict(), temporary: false});
            setSelectionInfo(layer.selection);
            layer.invalidate();
        }
    }
    if (layer.resizing) {
        const sel = layer.selection;
        if (sel.w < 0) {
            sel.x += sel.w;
            sel.w = Math.abs(sel.w);
        }
        if (sel.h < 0) {
            sel.y += sel.h;
            sel.h = Math.abs(sel.h);
        }
        if (!e.altKey) {
            const gs = gameManager.layerManager.gridSize;
            sel.x = Math.round(sel.x / gs) * gs;
            sel.y = Math.round(sel.y / gs) * gs;
            sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
            sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
        }
        socket.emit("shapeMove", {shape: layer.selection.asDict(), temporary: false});
        setSelectionInfo(sel);
        layer.invalidate();
    }
    layer.dragging = false;
    layer.resizing = false;
    layer.panning = false;
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
    this.startPoint = layer.getMouse(e);
    const fillColor = this.fillColor.spectrum("get");
    const fill = fillColor === null ? tinycolor("transparent") : fillColor;
    const borderColor = this.borderColor.spectrum("get");
    const border = borderColor === null ? tinycolor("transparent") : borderColor;
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    this.rect = new Rect(this.startPoint.x / z - panX, this.startPoint.y / z - panY, 0, 0, fill.toRgbString(), border.toRgbString());
    layer.addShape(this.rect, true, false);
};
DrawTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = layer.getMouse(e);
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    const z = gameManager.layerManager.zoomFactor;

    this.rect.w = Math.abs(endPoint.x - this.startPoint.x) / z;
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y) / z;
    this.rect.x = Math.min(this.startPoint.x, endPoint.x) / z - panX;
    this.rect.y = Math.min(this.startPoint.y, endPoint.y) / z - panY;
    socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
    layer.invalidate();
};
DrawTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
    this.startPoint = null;
    this.rect = null;
};

function RulerTool() {
    this.startPoint = null;
}

RulerTool.prototype.onMouseDown = function (e) {
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("draw");
    this.startPoint = layer.getMouse(e);
    this.ruler = new Line(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new Text(this.startPoint.x, this.startPoint.y, "", "20px serif");
    layer.addShape(this.ruler, true, true);
    layer.addShape(this.text, true, true);
};
RulerTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("draw");
    const endPoint = layer.getMouse(e);
    const z = gameManager.layerManager.zoomFactor;

    this.ruler.x2 = endPoint.x;
    this.ruler.y2 = endPoint.y;
    socket.emit("shapeMove", {shape: this.ruler.asDict(), temporary: true});

    const xdiff = endPoint.x - this.startPoint.x;
    const ydiff = endPoint.y - this.startPoint.y;
    const label = Math.round(Math.sqrt((xdiff / z) ** 2 + (ydiff / z) ** 2) * gameManager.layerManager.unitSize / gameManager.layerManager.gridSize) + " ft";
    let angle = Math.atan2(ydiff, xdiff);
    const xmid = this.startPoint.x + xdiff / 2;
    const ymid = this.startPoint.y + ydiff / 2;
    this.text.x = xmid;
    this.text.y = ymid;
    this.text.text = label;
    this.text.angle = angle;
    socket.emit("shapeMove", {shape: this.text.asDict(), temporary: true});
    layer.invalidate();
};
RulerTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
    this.startPoint = null;
    const layer = gameManager.layerManager.getLayer("draw");
    layer.removeShape(this.ruler, true, true);
    layer.removeShape(this.text, true, true);
    this.ruler = null;
    this.text = null;
    layer.invalidate();
};

function FOWTool() {
    this.startPoint = null;
    this.detailDiv = $("<div>")
        .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
        .append($("</div>"));
}

FOWTool.prototype.onMouseDown = function (e) {
    const layer = gameManager.layerManager.getLayer("fow");
    this.startPoint = layer.getMouse(e);
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    this.rect = new Rect(this.startPoint.x / z - panX, this.startPoint.y / z - panY, 0, 0, fowColour.spectrum("get").toRgbString());
    layer.addShape(this.rect, true, false);

    if ($("#fow-reveal").prop("checked"))
        this.rect.globalCompositeOperation = "destination-out";
    else
        this.rect.globalCompositeOperation = "source-over";
};
FOWTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
    this.startPoint = null;
    this.rect = null;
};
FOWTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("fow");
    const endPoint = layer.getMouse(e);
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    const z = gameManager.layerManager.zoomFactor;

    this.rect.w = Math.abs(endPoint.x - this.startPoint.x) / z;
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y) / z;
    this.rect.x = Math.min(this.startPoint.x, endPoint.x) / z - panX;
    this.rect.y = Math.min(this.startPoint.y, endPoint.y) / z - panY;

    socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
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
    this.startPoint = layer.getMouse(e);
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    this.rect = new Rect(this.startPoint.x / z - panX, this.startPoint.y / z - panY, 0, 0, "rgba(0,0,0,0)", "black");
    layer.addShape(this.rect, false, false);
};
MapTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = layer.getMouse(e);
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    const z = gameManager.layerManager.zoomFactor;

    this.rect.w = Math.abs(endPoint.x - this.startPoint.x) / z;
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y) / z;
    this.rect.x = Math.min(this.startPoint.x, endPoint.x) / z - panX;
    this.rect.y = Math.min(this.startPoint.y, endPoint.y) / z - panY;
    // socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
    layer.invalidate();
};
MapTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
    const layer = gameManager.layerManager.getLayer();
    if (layer.selection === null) {
        layer.removeShape(this.rect, false, false);
        return;
    }

    const w = this.rect.w;
    const h = this.rect.h;
    layer.selection.w *= this.xCount.val() * gameManager.layerManager.gridSize / w;
    layer.selection.h *= this.yCount.val() * gameManager.layerManager.gridSize / h;
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
}


let gameManager = new GameManager();


// **** SETUP UI ****
const tools = [
    {name: "select", playerTool: true, defaultSelect: true, hasDetail: false, func: gameManager.layerManager},
    {name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, func: gameManager.layerManager},
    {name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, func: gameManager.drawTool},
    {name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, func: gameManager.rulerTool},
    {name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, func: gameManager.fowTool},
    {name: "map", playerTool: false, defaultSelect: false, hasDetail: true, func: gameManager.mapTool},
];

function setupTools() {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !gameManager.IS_DM) return;
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
                } else {
                    detail.hide();
                }
            }
        });
    });
}

const gridColour = $("#gridColour");
gridColour.spectrum({
    showInput: true,
    allowEmpty: true,
    showAlpha: true,
    color: "rgba(255,0,0, 0.5)",
    move: function () {
        gameManager.layerManager.drawGrid()
    },
    change: function (colour) {
        socket.emit("client set", {'gridColour': colour.toRgbString()});
    }
});
const fowColour = $("#fowColour");
fowColour.spectrum({
    showInput: true,
    color: "red",
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
        socket.emit("client set", {'fowColour': colour.toRgbString()});
    }
});

// prevent double clicking text selection
window.addEventListener('selectstart', function (e) {
    e.preventDefault();
    return false;
});

function onPointerDown(e) {
    if (!board_initialised) return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS') return;
    $menu.hide();
    tools[gameManager.selectedTool].func.onMouseDown(e);
}

function onPointerMove(e) {
    if (!board_initialised) return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS') return;
    tools[gameManager.selectedTool].func.onMouseMove(e);
}

function onPointerUp(e) {
    if (!board_initialised) return;
    if ((e.button !== 0 && e.button !== 1) || e.target.tagName !== 'CANVAS') return;
    tools[gameManager.selectedTool].func.onMouseUp(e);
}

window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

window.addEventListener('contextmenu', function (e) {
    if (!board_initialised) return;
    if (e.button !== 2 || e.target.tagName !== 'CANVAS') return;
    tools[gameManager.selectedTool].func.onContextMenu(e);
});

$("#zoomer").slider({
    orientation: "vertical",
    min: 0.5,
    max: 5.0,
    step: 0.1,
    value: 1.0,
    slide: function (event, ui) {
        gameManager.layerManager.zoomFactor = 1 / ui.value;
        gameManager.layerManager.invalidate();
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

const shapeSelectionDialog = $("#shapeselectiondialog").dialog({
    autoOpen: false,
    // height: 400,
    width: 350,
    buttons: {
        "Create an account": alert,
        Cancel: function () {
            shapeSelectionDialog.dialog("close");
        }
    },
    close: function () {
        // form[0].reset();
    }
});

function handleContextMenu(menu, shape) {
    const action = menu.data("action");
    const layer = gameManager.layerManager.getLayer();
    switch (action) {
        case 'moveToFront':
            layer.moveShapeOrder(shape, layer.shapes.data.length - 1, true);
            break;
        case 'moveToBack':
            layer.moveShapeOrder(shape, 0, true);
            break;
        case 'setLayer':
            layer.removeShape(shape, true);
            gameManager.layerManager.getLayer(menu.data("layer")).addShape(shape, true);
            break;
    }
    $menu.hide();
}

const settings_menu = $("#menu");
const locations_menu = $("#locations-menu");

$('#rm-settings').on("click", function () {
    // order of animation is important, it otherwise will sometimes show a small gap between the two objects
    if (settings_menu.is(":visible")) {
        $('#radialmenu').animate({left: "-=200px"});
        settings_menu.animate({width: 'toggle'});
        locations_menu.animate({left: "-=200px", width: "+=200px"});
    } else {
        settings_menu.animate({width: 'toggle'});
        $('#radialmenu').animate({left: "+=200px"});
        locations_menu.animate({left: "+=200px", width: "-=200px"});
    }
});

$('#rm-locations').on("click", function () {
    // order of animation is important, it otherwise will sometimes show a small gap between the two objects
    if (locations_menu.is(":visible")) {
        $('#radialmenu').animate({top: "-=100px"});
        locations_menu.animate({height: 'toggle'});
    } else {
        locations_menu.animate({height: 'toggle'});
        $('#radialmenu').animate({top: "+=100px"});
    }
});

window.onresize = function () {
    gameManager.layerManager.setWidth(window.innerWidth);
    gameManager.layerManager.setHeight(window.innerHeight);
    gameManager.layerManager.invalidate();
};

$('body').keyup(function (e) {
    if (e.keyCode === 46) {
        const l = gameManager.layerManager.getLayer();
        if (l.selection) {
            l.removeShape(l.selection, true, false);
        }
    }
});

$("#gridSizeInput").on("change", function (e) {
    const gs = parseInt(e.target.value);
    gameManager.layerManager.setGridSize(gs);
    socket.emit("set gridsize", gs);
});

// **** UTILS ****

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function alphSort(a, b) {
    if (a.toLowerCase() < b.toLowerCase())
        return -1;
    else
        return 1;
}

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
    if (oldIdx === idx) return false;
    this.data.splice(oldIdx, 1);
    this.data.splice(idx, 0, element);
    return true;
};

function createShapeFromDict(shape, dummy) {
    if (dummy === undefined) dummy = false;
    if (!dummy && gameManager.layerManager.UUIDMap.has(shape.uuid))
        return gameManager.layerManager.UUIDMap.get(shape.uuid);

    let sh;

    if (shape.type === 'rect') sh = Object.assign(new Rect(), shape);
    if (shape.type === 'circle') sh = Object.assign(new Circle(), shape);
    if (shape.type === 'line') sh = Object.assign(new Line(), shape);
    if (shape.type === 'text') sh = Object.assign(new Text(), shape);
    if (shape.type === 'asset') {
        const img = new Image(shape.w, shape.h);
        img.src = shape.src;
        sh = Object.assign(new Asset(), shape);
        sh.img = img;
        img.onload = function () {
            gameManager.layerManager.getLayer(shape.layer).invalidate();
        };
        for (let i = 0; i < sh.vision.length; i++) {
            sh.vision[i] = createShapeFromDict(sh.vision[i], true);
        }
    }
    return sh;
}