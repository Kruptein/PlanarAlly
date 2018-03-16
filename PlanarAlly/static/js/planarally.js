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

                    const loc = {
                        x: parseInt(ui.offset.left - offset.left),
                        y: parseInt(ui.offset.top - offset.top)
                    };

                    if (settings_menu.is(":visible") && loc.x < settings_menu.width())
                        return;
                    if (locations_menu.is(":visible") && loc.y < locations_menu.width())
                        return;
                    // width = ui.helper[0].width;
                    // height = ui.helper[0].height;
                    const wloc = l2w(loc);
                    const img = ui.draggable[0].children[0];
                    const asset = new Asset(img, wloc.x, wloc.y, img.width, img.height);
                    asset.src = img.src;
                    l.addShape(asset, true);
                }
            });
        } else {
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
    shape = Object.assign(gameManager.layerManager.UUIDMap.get(shape.uuid), createShapeFromDict(shape, true));
    gameManager.layerManager.getLayer(shape.layer).onShapeMove(shape);
});
socket.on("updateShape", function (data) {
    Object.assign(gameManager.layerManager.UUIDMap.get(data.shape.uuid), createShapeFromDict(data.shape, true));
    if (data.redraw)
        gameManager.layerManager.getLayer(data.shape.layer).invalidate();
});
socket.on("clear temporaries", function (shapes) {
    shapes.forEach(function (shape) {
        gameManager.layerManager.getLayer(shape.layer).removeShape(shape, false);
    })
});

// **** BOARD ELEMENTS ****

function Shape() {
    this.layer = null;
    this.name = 'Unknown shape';
    this.trackers = [{'name': 'health', 'value': 50}];
    this.auras = [];
}
Shape.prototype.getBoundingBox = function () {};
Shape.prototype.onMouseUp = function () {
    // $(`#shapeselectioncog-${this.uuid}`).remove();
    // const cog = $(`<div id="shapeselectioncog-${this.uuid}"><i class='fa fa-cog' style='left:${this.x};top:${this.y + this.h + 10};z-index:50;position:absolute;'></i></div>`);
    // cog.on("click", function () {
    //     shapeSelectionDialog.dialog( "open" );
    // });
    // $("body").append(cog);
};
Shape.prototype.onSelection = function () {
    $("#selection-name").text(this.name);
    const trackers = $("#selection-trackers");
    trackers.empty();
    this.trackers.forEach(function (tracker) {
        trackers.append($(`<div id="selection-tracker-${tracker.name}-name">${tracker.name}</div>`));
        trackers.append(
            $(`<div id="selection-tracker-${tracker.name}-value" data-name="${tracker.name}" class="selection-tracker-value">${tracker.value}</div>`)
        );
    });
    const auras = $("#selection-auras");
    auras.empty();
    this.auras.forEach(function (aura) {
        auras.append($(`<div id="selection-aura-${aura.name}-name">${aura.name}</div>`));
        auras.append(
            $(`<div id="selection-aura-${aura.name}-value" data-name="${aura.name}" class="selection-aura-value">${aura.value}</div>`)
        );
    });
    $("#selection-menu").show();
    const self = this;
    $("#selection-edit-button").on("click", function (){
        shapeSelectionDialog.dialog( "open" );
    });
    $('.selection-tracker-value').on("click", function () {
        const name = $(this).data('name');
        const tracker = self.trackers.find(t => t.name === name);
        const new_tracker = prompt(`New  ${name} value: (absolute or relative)`);
        if (new_tracker[0] === '+') {
            tracker.value += parseInt(new_tracker.slice(1));
        } else if (new_tracker[0] === '-') {
            tracker.value -= parseInt(new_tracker.slice(1));
        } else {
            tracker.value = parseInt(new_tracker);
        }
        $(this).text(tracker.value);
        socket.emit("updateShape", {shape: self.asDict(), redraw:false});
    });
    $('.selection-aura-value').on("click", function () {
        const name = $(this).data('name');
        const aura = self.auras.find(t => t.name === name);
        const new_aura = prompt(`New  ${name} value: (absolute or relative)`);
        if (new_aura[0] === '+') {
            aura.value += parseInt(new_aura.slice(1));
        } else if (new_aura[0] === '-') {
            aura.value -= parseInt(new_aura.slice(1));
        } else {
            aura.value = parseInt(new_aura);
        }
        $(this).text(aura.value);
        socket.emit("updateShape", {shape: self.asDict(), redraw:true});
        gameManager.layerManager.getLayer(self.layer).invalidate();
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
    if (this.layer === 'fow' && gameManager.IS_DM && this.globalCompositeOperation === "destination-out")
        ctx.globalAlpha = 1.0;
    else if (this.layer === 'fow' && gameManager.IS_DM)
        ctx.globalAlpha = 0.3;
    if (this.globalCompositeOperation !== undefined)
        ctx.globalCompositeOperation = this.globalCompositeOperation;
    else
        ctx.globalCompositeOperation = "source-over";
    const self = this;
    this.auras.forEach(function (aura) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(20, 20, 20, 0.2)";
        const loc = w2l(self.center());
        ctx.arc(loc.x, loc.y, aura.value * gameManager.layerManager.unitSize, 0, 2 * Math.PI);
        ctx.fill();
    });
};
Shape.prototype.contains = function () {
    return false;
};
Shape.prototype.showContextMenu = function (mouse) {
    const l = gameManager.layerManager.getLayer();
    l.selection = [this];
    this.onSelection();
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

function BoundingRect(x, y, w, h) {
    this.type = "boundrect";
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

function Rect(x, y, w, h, fill, border, uuid) {
    Shape.call(this);
    this.type = "rect";
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.fill = fill || '#000';
    this.border = border || "rgba(0, 0, 0, 0)";
    this.uuid = uuid || uuidv4();
}

Rect.prototype = Object.create(Shape.prototype);
Rect.prototype.getBoundingBox = function () {
    return new BoundingRect(this.x, this.y, this.w, this.h);
};
Rect.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.fillStyle = this.fill;
    const z = gameManager.layerManager.zoomFactor;
    const loc = w2l({x: this.x, y: this.y});
    ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
    if (this.border !== "rgba(0, 0, 0, 0)") {
        ctx.strokeStyle = this.border;
        ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
    }
};
Rect.prototype.contains = function (mx, my) {
    return (w2lx(this.x) <= mx) && (w2lx(this.x + this.w) >= mx) &&
        (w2ly(this.y) <= my) && (w2ly(this.y + this.h) >= my);
};
Rect.prototype.inCorner = function (mx, my, corner) {
    switch (corner) {
        case 'ne':
            return w2lx(this.x + this.w - 3) <= mx && mx <= w2lx(this.x + this.w + 3) && w2ly(this.y - 3) <= my && my <= w2ly(this.y + 3);
        case 'nw':
            return w2lx(this.x - 3) <= mx && mx <= w2lx(this.x + 3) && w2ly(this.y - 3) <= my && my <= w2ly(this.y + 3);
        case 'sw':
            return w2lx(this.x - 3) <= mx && mx <= w2lx(this.x + 3) && w2ly(this.y + this.h - 3) <= my && my <= w2ly(this.y + this.h + 3);
        case 'se':
            return w2lx(this.x + this.w - 3) <= mx && mx <= w2lx(this.x + this.w + 3) && w2ly(this.y + this.h - 3) <= my && my <= w2ly(this.y + this.h + 3);
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
    Shape.call(this);
    this.type = "circle";
    this.x = x || 0;
    this.y = y || 0;
    this.r = r || 1;
    this.fill = fill || '#000';
    this.border = border || "rgba(0, 0, 0, 0)";
    this.uuid = uuid || uuidv4();
}

Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.getBoundingBox = function () {
    return new BoundingRect(this.x - this.r, this.x - this.r, this.r * 2, this.r * 2);
};
Circle.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.beginPath();
    ctx.fillStyle = this.fill;
    const loc = w2l({x: this.x, y: this.y});
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
    return (mx - w2lx(this.x)) ** 2 + (my - w2ly(this.y)) ** 2 < this.r ** 2;
};
Circle.prototype.inCorner = function (mx, my, corner) {
    switch (corner) {
        case 'ne':
            return w2lx(this.x + this.w - 3) <= mx && mx <= w2lx(this.x + this.w + 3) && w2ly(this.y - 3) <= my && my <= w2ly(this.y + 3);
        case 'nw':
            return w2lx(this.x - 3) <= mx && mx <= w2lx(this.x + 3) && w2ly(this.y - 3) <= my && my <= w2ly(this.y + 3);
        case 'sw':
            return w2lx(this.x - 3) <= mx && mx <= w2lx(this.x + 3) && w2ly(this.y + this.h - 3) <= my && my <= w2ly(this.y + this.h + 3);
        case 'se':
            return w2lx(this.x + this.w - 3) <= mx && mx <= w2lx(this.x + this.w + 3) && w2ly(this.y + this.h - 3) <= my && my <= w2ly(this.y + this.h + 3);
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
    Shape.call(this);
    this.type = "line";
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.uuid = uuid || uuidv4();
}

Line.prototype = Object.create(Shape.prototype);
Line.prototype.getBoundingBox = function () {
    return new BoundingRect(
        Math.min(this.x1, this.x2),
        Math.min(this.y1, this.y2),
        Math.abs(this.x1 - this.x2),
        Math.abs(this.y1 - this.y2)
    );
};
Line.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.beginPath();
    ctx.moveTo(w2lx(this.x1), w2ly(this.y1));
    ctx.lineTo(w2lx(this.x2), w2ly(this.y2));
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
    this.uuid = uuid || uuidv4();
}

Text.prototype = Object.create(Shape.prototype);
Text.prototype.getBoundingBox = function () {
    return new BoundingRect(this.x, this.y, 5, 5); // Todo: fix this bounding box
};
Text.prototype.draw = function (ctx) {
    Shape.prototype.draw.call(this, ctx);
    ctx.font = this.font;
    ctx.save();
    ctx.translate(w2lx(this.x), w2ly(this.y));
    ctx.rotate(this.angle);
    ctx.textAlign = "center";
    ctx.fillText(this.text, 0, -5);
    ctx.restore();
};

function Asset(img, x, y, w, h, uuid) {
    Shape.call(this);
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
    ctx.drawImage(this.img, w2lx(this.x), w2ly(this.y), this.w * z, this.h * z);
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

    // Refresh interval and redraw setter.
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
    shapes.forEach(function (shape) {
        const sh = createShapeFromDict(shape, self);
        sh.layer = self.name;
        gameManager.layerManager.UUIDMap.set(shape.uuid, sh);
        t.push(sh);
    });
    this.selection = []; // TODO: Fix keeping selection on those items that are not moved.
    this.shapes.data = t;
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

        this.shapes.data.forEach(function (shape) {
            if (w2lx(shape.x) > state.width || w2ly(shape.y) > state.height ||
                w2lx(shape.x + shape.w) < 0 || w2ly(shape.y + shape.h) < 0) return;
            shape.draw(ctx);
        });

        if (this.selection != null) {
            ctx.strokeStyle = this.selectionColor;
            ctx.lineWidth = this.selectionWidth;
            const z = gameManager.layerManager.zoomFactor;
            this.selection.forEach(function (sel) {
                ctx.strokeRect(w2lx(sel.x), w2ly(sel.y), sel.w * z, sel.h * z);

                // topright
                ctx.fillRect(w2lx(sel.x + sel.w - 3), w2ly(sel.y - 3), 6 * z, 6 * z);
                // topleft
                ctx.fillRect(w2lx(sel.x - 3), w2ly(sel.y - 3), 6 * z, 6 * z);
                // botright
                ctx.fillRect(w2lx(sel.x + sel.w - 3), w2ly(sel.y + sel.h - 3), 6 * z, 6 * z);
                // botleft
                ctx.fillRect(w2lx(sel.x - 3), w2ly(sel.y + sel.h - 3), 6 * z, 6 * z)
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

        layer.selection = [];
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
                layer.selection = [shape];
                shape.onSelection();
                layer.resizing = true;
                layer.resizedir = corn;
                layer.invalidate();
                hit = true;
                setSelectionInfo(shape);
                break;
            } else if (shape.contains(mx, my)) {
                const sel = shape;
                const z = gameManager.layerManager.zoomFactor;
                if (layer.selection.indexOf(sel) === -1) {
                    layer.selection = [sel];
                    sel.onSelection();
                }
                layer.dragging = true;
                layer.dragoffx = mx - sel.x * z;
                layer.dragoffy = my - sel.y * z;
                setSelectionInfo(shape);
                layer.invalidate();
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
            layer.selectionStartPoint = l2w(layer.getMouse(e));
            layer.selectionHelper = new Rect(layer.selectionStartPoint.x, layer.selectionStartPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
            layer.addShape(layer.selectionHelper, false, false);
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
    const mouse = layer.getMouse(e);
    const z = gameManager.layerManager.zoomFactor;
    if (layer.selecting) {
        if (this.selectionStartPoint === null) return;
        // Currently draw on active layer
        const endPoint = l2w(layer.getMouse(e));

        layer.selectionHelper.w = Math.abs(endPoint.x - layer.selectionStartPoint.x);
        layer.selectionHelper.h = Math.abs(endPoint.y - layer.selectionStartPoint.y);
        layer.selectionHelper.x = Math.min(layer.selectionStartPoint.x, endPoint.x);
        layer.selectionHelper.y = Math.min(layer.selectionStartPoint.y, endPoint.y);
        layer.invalidate();
    } else if (layer.panning) {
        gameManager.layerManager.panX += Math.round((mouse.x - layer.dragoffx) / z);
        gameManager.layerManager.panY += Math.round((mouse.y - layer.dragoffy) / z);
        layer.dragoffx = mouse.x;
        layer.dragoffy = mouse.y;
        gameManager.layerManager.invalidate();
    } else if (layer.selection.length) {
        const ogX = layer.selection[layer.selection.length - 1].x * z;
        const ogY = layer.selection[layer.selection.length - 1].y * z;
        layer.selection.forEach(function (sel) {
            const dx = mouse.x - (ogX + layer.dragoffx);
            const dy = mouse.y - (ogY + layer.dragoffy);
            if (layer.dragging) {
                sel.x += dx /z;
                sel.y += dy /z;
                socket.emit("shapeMove", {shape: sel.asDict(), temporary: true});
                setSelectionInfo(sel);
                layer.invalidate();
            } else if (layer.resizing) {
                if (layer.resizedir === 'nw') {
                    sel.w = w2lx(sel.x) + sel.w * z - mouse.x;
                    sel.h = w2ly(sel.y) + sel.h * z - mouse.y;
                    sel.x = l2wx(mouse.x);
                    sel.y = l2wy(mouse.y);
                } else if (layer.resizedir === 'ne') {
                    sel.w = mouse.x - w2lx(sel.x);
                    sel.h = w2ly(sel.y) + sel.h * z - mouse.y;
                    sel.y = l2wy(mouse.y);
                } else if (layer.resizedir === 'se') {
                    sel.w = mouse.x - w2lx(sel.x);
                    sel.h = mouse.y - w2ly(sel.y);
                } else if (layer.resizedir === 'sw') {
                    sel.w = w2lx(sel.x) + sel.w * z - mouse.x;
                    sel.h = mouse.y - w2ly(sel.y);
                    sel.x = l2wx(mouse.x);
                }
                sel.w /= z;
                sel.h /= z;
                socket.emit("shapeMove", {shape: sel.asDict(), temporary: true});
                setSelectionInfo(sel);
                layer.invalidate();
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
            }
        });
    } else {
        document.body.style.cursor = "default";
    }
};
LayerManager.prototype.onMouseUp = function (e) {
    const layer = gameManager.layerManager.getLayer();
    if (layer.selecting) {
        if (layer.selectionStartPoint === null) return;

        layer.shapes.data.forEach(function (shape) {
            if (shape === layer.selectionHelper) return;
            const bbox = shape.getBoundingBox();
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
        layer.invalidate();
    } else if (layer.selection.length) {
        layer.selection.forEach(function (sel) {
            if (!e.altKey && layer.dragging) {
                const orig = Object.assign({}, sel);
                const gs = gameManager.layerManager.gridSize;
                const mouse = {x: sel.x + sel.w / 2, y: sel.y + sel.h / 2};
                const mx = mouse.x;
                const my = mouse.y;
                if ((sel.w / gs) % 2 === 0) {
                    sel.x = Math.round(mx / gs) * gs - sel.w / 2;
                } else {
                    sel.x = (Math.round((mx + (gs / 2)) / gs) - (1 / 2)) * gs - sel.w / 2;
                }
                if ((sel.h / gs) % 2 === 0) {
                    sel.y = Math.round(my / gs) * gs - sel.h / 2;
                } else {
                    sel.y = (Math.round((my + (gs / 2)) / gs) - (1 / 2)) * gs - sel.h / 2;
                }
                sel.onMouseUp();
                if (orig.x !== sel.x || orig.y !== sel.y) {
                    if (sel !== layer.selectionHelper) {
                        socket.emit("shapeMove", {shape: sel.asDict(), temporary: false});
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
                if (!e.altKey) {
                    const gs = gameManager.layerManager.gridSize;
                    sel.x = Math.round(sel.x / gs) * gs;
                    sel.y = Math.round(sel.y / gs) * gs;
                    sel.w = Math.max(Math.round(sel.w / gs) * gs, gs);
                    sel.h = Math.max(Math.round(sel.h / gs) * gs, gs);
                }
                if (sel !== layer.selectionHelper) {
                    socket.emit("shapeMove", {shape: sel.asDict(), temporary: false});
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
    this.startPoint = l2w(layer.getMouse(e));
    const fillColor = this.fillColor.spectrum("get");
    const fill = fillColor === null ? tinycolor("transparent") : fillColor;
    const borderColor = this.borderColor.spectrum("get");
    const border = borderColor === null ? tinycolor("transparent") : borderColor;
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, fill.toRgbString(), border.toRgbString());
    layer.addShape(this.rect, true, false);
};
DrawTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = l2w(layer.getMouse(e));

    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
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
    this.startPoint = l2w(layer.getMouse(e));
    this.ruler = new Line(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new Text(this.startPoint.x, this.startPoint.y, "", "20px serif");
    layer.addShape(this.ruler, true, true);
    layer.addShape(this.text, true, true);
};
RulerTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("draw");
    const endPoint = l2w(layer.getMouse(e));

    this.ruler.x2 = endPoint.x;
    this.ruler.y2 = endPoint.y;
    socket.emit("shapeMove", {shape: this.ruler.asDict(), temporary: true});

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
    this.startPoint = l2w(layer.getMouse(e));
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, fowColour.spectrum("get").toRgbString());
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
    const endPoint = l2w(layer.getMouse(e));

    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);

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
    this.startPoint = l2w(layer.getMouse(e));
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
    layer.addShape(this.rect, false, false);
};
MapTool.prototype.onMouseMove = function (e) {
    if (this.startPoint === null) return;
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer();
    const endPoint = l2w(layer.getMouse(e));

    this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
    this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
    this.rect.x = Math.min(this.startPoint.x, endPoint.x);
    this.rect.y = Math.min(this.startPoint.y, endPoint.y);
    // socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
    layer.invalidate();
};
MapTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
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
    width: 'auto',
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
shapeSelectionDialog.find("form").on("submit", function(event) {
    event.preventDefault();
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
const layer_menu = $("#layerselect");
$("#selection-menu").hide();

$('#rm-settings').on("click", function () {
    // order of animation is important, it otherwise will sometimes show a small gap between the two objects
    if (settings_menu.is(":visible")) {
        $('#radialmenu').animate({left: "-=200px"});
        settings_menu.animate({width: 'toggle'});
        locations_menu.animate({left: "-=200px", width: "+=200px"});
        layer_menu.animate({left: "-=200px"});
    } else {
        settings_menu.animate({width: 'toggle'});
        $('#radialmenu').animate({left: "+=200px"});
        locations_menu.animate({left: "+=200px", width: "-=200px"});
        layer_menu.animate({left: "+=200px"});
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
        l.selection.forEach(function (sel) {
            l.removeShape(sel, true, false);
        });
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

function w2l(obj) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    return {
        x: (obj.x + panX) * z,
        y: (obj.y + panY) * z
    }
}

function w2lx(x) {
    return w2l({x: x, y: 0}).x;
}

function w2ly(y) {
    return w2l({x: 0, y: y}).y;
}

function l2w(obj) {
    const z = gameManager.layerManager.zoomFactor;
    const panX = gameManager.layerManager.panX;
    const panY = gameManager.layerManager.panY;
    return {
        x: (obj.x / z) - panX,
        y: (obj.y / z) - panY
    }
}

function l2wx(x) {
    return l2w({x: x, y: 0}).x;
}

function l2wy(y) {
    return l2w({x: 0, y: y}).y;
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