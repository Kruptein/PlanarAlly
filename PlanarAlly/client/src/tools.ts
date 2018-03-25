import {l2w} from "./units";
import {Line, Rect, Text} from "./shapes";
import gameManager from "./planarally";
import socket from "./socket";

const tools = [
    {name: "select", playerTool: true, defaultSelect: true, hasDetail: false, func: undefined},
    {name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, func: undefined},
    {name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, func: undefined},
    {name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, func: undefined},
    {name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, func: undefined},
    {name: "map", playerTool: false, defaultSelect: false, hasDetail: true, func: undefined},
];

export function setupTools(): void {
    // TODO: FIX THIS TEMPORARY SHIT, this is a quickfix after the js>ts transition
    tools[0].func = gameManager.layerManager;
    tools[1].func = gameManager.layerManager;
    tools[2].func = gameManager.drawTool;
    tools[3].func = gameManager.rulerTool;
    tools[4].func = gameManager.fowTool;
    tools[5].func = gameManager.mapTool;
    gameManager.tools = tools;
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

export function DrawTool() {
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
    this.rect.owners.push(gameManager.username);
    if (layer.name === 'fow') {
        this.rect.visionObstruction = true;
        this.rect.movementObstruction = true;
    }
    gameManager.lightblockers.push(this.rect.uuid);
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
    layer.invalidate(false);
};
DrawTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
    this.startPoint = null;
    this.rect = null;
};

export function RulerTool() {
    this.startPoint = null;
}

RulerTool.prototype.onMouseDown = function (e) {
    // Currently draw on active layer
    const layer = gameManager.layerManager.getLayer("draw");
    this.startPoint = l2w(layer.getMouse(e));
    this.ruler = new Line(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
    this.text = new Text(this.startPoint.x, this.startPoint.y, "", "20px serif");
    this.ruler.owners.push(gameManager.username);
    this.text.owners.push(gameManager.username);
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
    layer.invalidate(true);
};
RulerTool.prototype.onMouseUp = function () {
    if (this.startPoint === null) return;
    this.startPoint = null;
    const layer = gameManager.layerManager.getLayer("draw");
    layer.removeShape(this.ruler, true, true);
    layer.removeShape(this.text, true, true);
    this.ruler = null;
    this.text = null;
    layer.invalidate(true);
};

export function FOWTool() {
    this.startPoint = null;
    this.detailDiv = $("<div>")
        .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
        .append($("</div>"));
}

FOWTool.prototype.onMouseDown = function (e) {
    const layer = gameManager.layerManager.getLayer("fow");
    this.startPoint = l2w(layer.getMouse(e));
    this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, gameManager.fowColour.spectrum("get").toRgbString());
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
    layer.invalidate(false);
};

export function MapTool() {
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
    layer.invalidate(false);
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

export function InitiativeTracker() {
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
    if (existing !== undefined){
        Object.assign(existing, data);
        this.redraw();
    } else {
        this.data.push(data);
        this.redraw();
    }
    if (sync)
        socket.emit("updateInitiative", data);
};
InitiativeTracker.prototype.removeInitiative = function (uuid, sync, skipGroupCheck) {
    skipGroupCheck = skipGroupCheck || false;
    const d = this.data.findIndex(d => d.uuid === uuid);
    if (d >= 0) {
        if (!skipGroupCheck && this.data[d].group) return;
        this.data.splice(d, 1);
        this.redraw();
        if (sync)
            socket.emit("updateInitiative", {uuid: uuid});
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
        if (data.owners === undefined) data.owners = [];
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

        val.on("change", function() {
            const d = self.data.find(d => d.uuid === $(this).data('uuid'));
            d.initiative = parseInt(<string>$(this).val()) || 0;
            self.addInitiative(d, true);
        });

        visible.on("click", function (){
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if(!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                    return;
                d.visible = !d.visible;
                if (d.visible)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                socket.emit("updateInitiative", d);
            });

        group.on("click", function (){
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if(!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                    return;
                d.group = !d.group;
                if (d.group)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                socket.emit("updateInitiative", d);
            });

        remove.on("click", function () {
            const uuid = $(this).data('uuid');
            const d = self.data.find(d => d.uuid === uuid);
            if(!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                return;
            $(`[data-uuid=${uuid}]`).remove();
            self.removeInitiative(uuid, true, true);
        });
    });
};