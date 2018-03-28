import {l2w} from "./units";
import {Shape, Line, Rect, Text} from "./shapes";
import gameManager from "./planarally";
import socket from "./socket";
import { Point } from "./utils";
import { InitiativeData } from "./api_types";

export abstract class Tool {
    detailDiv?: JQuery<HTMLElement>;
    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
    onContextMenu(e: MouseEvent) {};
}

export function setupTools(): void {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !gameManager.IS_DM) return;

        const toolInstance = new tool.clz();
        gameManager.tools.set(tool.name, toolInstance);
        const extra = tool.defaultSelect ? " class='tool-selected'" : "";
        const toolLi = $("<li id='tool-" + tool.name + "'" + extra + "><a href='#'>" + tool.name + "</a></li>");
        toolselectDiv.append(toolLi);
        if (tool.hasDetail) {
            const div = toolInstance.detailDiv!;
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
                    toolInstance.detailDiv!.show();
                    detail.show();
                } else {
                    detail.hide();
                }
            }
        });
    });
}

export class DrawTool extends Tool {
    startPoint: Point|null = null;
    rect: Rect|null = null;
    fillColor = $("<input type='text' />");
    borderColor = $("<input type='text' />");
    detailDiv = $("<div>")
            .append($("<div>Fill</div>")).append(this.fillColor)
            .append($("<div>Border</div>")).append(this.borderColor)
            .append($("</div>"));

    constructor() {
        super();
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
    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        const layer = gameManager.layerManager.getLayer()!;
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
    }
    onMouseMove(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        if (this.startPoint === null) return;
        // Currently draw on active layer
        const layer = gameManager.layerManager.getLayer()!;
        const endPoint = l2w(layer.getMouse(e));
    
        this.rect!.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect!.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect!.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect!.y = Math.min(this.startPoint.y, endPoint.y);
        socket.emit("shapeMove", {shape: this.rect!.asDict(), temporary: false});
        layer.invalidate(false);
    }
    onMouseUp(e:MouseEvent) {
        this.startPoint = null;
        this.rect = null;
    }
}


export class RulerTool extends Tool {
    startPoint: Point|null = null;
    ruler: Line|null = null;
    text: Text|null = null;

    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        const layer = gameManager.layerManager.getLayer("draw")!;
        this.startPoint = l2w(layer.getMouse(e));
        this.ruler = new Line(this.startPoint.x, this.startPoint.y, this.startPoint.x, this.startPoint.y);
        this.text = new Text(this.startPoint.x, this.startPoint.y, "", "20px serif");
        this.ruler.owners.push(gameManager.username);
        this.text.owners.push(gameManager.username);
        layer.addShape(this.ruler, true, true);
        layer.addShape(this.text, true, true);
    }
    onMouseMove(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        if (this.startPoint === null) return;
        // Currently draw on active layer
        const layer = gameManager.layerManager.getLayer("draw")!;
        const endPoint = l2w(layer.getMouse(e));
    
        this.ruler!.x2 = endPoint.x;
        this.ruler!.y2 = endPoint.y;
        socket.emit("shapeMove", {shape: this.ruler!.asDict(), temporary: true});
    
        const diffsign = Math.sign(endPoint.x - this.startPoint.x) * Math.sign(endPoint.y - this.startPoint.y);
        const xdiff = Math.abs(endPoint.x - this.startPoint.x);
        const ydiff = Math.abs(endPoint.y - this.startPoint.y);
        const label = Math.round(Math.sqrt((xdiff) ** 2 + (ydiff) ** 2) * gameManager.layerManager.unitSize / gameManager.layerManager.gridSize) + " ft";
        let angle = Math.atan2(diffsign * ydiff, xdiff);
        const xmid = Math.min(this.startPoint.x, endPoint.x) + xdiff / 2;
        const ymid = Math.min(this.startPoint.y, endPoint.y) + ydiff / 2;
        this.text!.x = xmid;
        this.text!.y = ymid;
        this.text!.text = label;
        this.text!.angle = angle;
        socket.emit("shapeMove", {shape: this.text!.asDict(), temporary: true});
        layer.invalidate(true);
    }
    onMouseUp(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        if (this.startPoint === null) return;
        this.startPoint = null;
        const layer = gameManager.layerManager.getLayer("draw")!;
        layer.removeShape(this.ruler!, true, true);
        layer.removeShape(this.text!, true, true);
        this.ruler = null;
        this.text = null;
        layer.invalidate(true);
    }
}

export class FOWTool extends Tool {
    startPoint: Point|null = null;
    rect: Rect|null = null;
    detailDiv = $("<div>")
        .append($("<div>Reveal</div><label class='switch'><input type='checkbox' id='fow-reveal'><span class='slider round'></span></label>"))
        .append($("</div>"));
    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        const layer = gameManager.layerManager.getLayer("fow")!;
        this.startPoint = l2w(layer.getMouse(e));
        this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, gameManager.fowColour.spectrum("get").toRgbString());
        layer.addShape(this.rect, true, false);

        if ($("#fow-reveal").prop("checked"))
            this.rect.globalCompositeOperation = "destination-out";
        else
            this.rect.globalCompositeOperation = "source-over";
    }
    onMouseMove(e: MouseEvent) {
        if (this.startPoint === null) return;
        this.startPoint = null;
        this.rect = null;
    }
    onMouseUp(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        if (this.startPoint === null) return;
        // Currently draw on active layer
        const layer = gameManager.layerManager.getLayer("fow")!;
        const endPoint = l2w(layer.getMouse(e));
    
        this.rect!.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect!.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect!.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect!.y = Math.min(this.startPoint.y, endPoint.y);
    
        socket.emit("shapeMove", {shape: this.rect!.asDict(), temporary: false});
        layer.invalidate(false);        
    }
}

export class MapTool extends Tool {
    startPoint: Point|null = null;
    rect: Rect|null = null;
    xCount = $("<input type='text' value='3'>");
    yCount = $("<input type='text' value='3'>");
    detailDiv = $("<div>")
        .append($("<div>#X</div>")).append(this.xCount)
        .append($("<div>#Y</div>")).append(this.yCount)
        .append($("</div>"));
    onMouseDown(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        const layer = gameManager.layerManager.getLayer()!;
        this.startPoint = l2w(layer.getMouse(e));
        this.rect = new Rect(this.startPoint.x, this.startPoint.y, 0, 0, "rgba(0,0,0,0)", "black");
        layer.addShape(this.rect, false, false);
    }
    onMouseMove(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        if (this.startPoint === null) return;
        // Currently draw on active layer
        const layer = gameManager.layerManager.getLayer()!;
        const endPoint = l2w(layer.getMouse(e));
    
        this.rect!.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect!.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect!.x = Math.min(this.startPoint.x, endPoint.x);
        this.rect!.y = Math.min(this.startPoint.y, endPoint.y);
        // socket.emit("shapeMove", {shape: this.rect.asDict(), temporary: false});
        layer.invalidate(false);
    }
    onMouseUp(e: MouseEvent) {
        if (gameManager.layerManager.getLayer() === undefined) {
            console.log("No active layer!");
            return ;
        }
        if (this.startPoint === null) return;
        const layer = gameManager.layerManager.getLayer()!;
        if (layer.selection.length !== 1) {
            layer.removeShape(this.rect!, false, false);
            return;
        }
    
        const w = this.rect!.w;
        const h = this.rect!.h;
        layer.selection[0].w *= parseInt(<string>this.xCount.val()) * gameManager.layerManager.gridSize / w;
        layer.selection[0].h *= parseInt(<string>this.yCount.val()) * gameManager.layerManager.gridSize / h;
        layer.removeShape(this.rect!, false, false);
        this.startPoint = null;
        this.rect = null;
    }
}

export class InitiativeTracker {
    data: InitiativeData[] = [];
    addInitiative(data: InitiativeData, sync: boolean) {
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
    removeInitiative(uuid: string, sync: boolean, skipGroupCheck: boolean) {
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
    redraw() {
        gameManager.initiativeDialog.empty();

        this.data.sort(function (a, b) {
            if (a.initiative === undefined) return 1;
            if (b.initiative === undefined) return -1;
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
                if (d === undefined) {
                    console.log("Initiativedialog change unknown uuid?");
                    return;
                }
                d.initiative = parseInt(<string>$(this).val()) || 0;
                self.addInitiative(d, true);
            });

            visible.on("click", function (){
                    const d = self.data.find(d => d.uuid === $(this).data('uuid'))!;
                    if (d === undefined) {
                        console.log("Initiativedialog visible unknown uuid?");
                        return;
                    }
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
                    if (d === undefined) {
                        console.log("Initiativedialog group unknown uuid?");
                        return;
                    }
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
                if (d === undefined) {
                    console.log("Initiativedialog remove unknown uuid?");
                    return;
                }
                if(!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                    return;
                $(`[data-uuid=${uuid}]`).remove();
                self.removeInitiative(uuid, true, true);
            });
        });
    };
}

const tools = [
    //{name: "select", playerTool: true, defaultSelect: true, hasDetail: false, clz: SelectTool},
    //{name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, clz: PanTool},
    {name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, clz: DrawTool},
    {name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, clz: RulerTool},
    {name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, clz: FOWTool},
    {name: "map", playerTool: false, defaultSelect: false, hasDetail: true, clz: MapTool},
];