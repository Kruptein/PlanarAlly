import gameManager from "./planarally";
import socket from "./socket";
import { uuidv4, Point } from "./utils";
import { getLinesIntersectPoint, getPointDistance } from "./geom";
import { l2wx, l2wy, w2l, w2lr, w2lx, w2ly } from "./units";
import { Layer } from "./layers";
import { ServerShape } from "./api_types";

const $menu = $('#contextMenu');

interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number | '';
    maxvalue: number | '';
}

interface Aura {
    uuid: string;
    lightSource: boolean;
    visible: boolean;
    name: string;
    value: number | '';
    dim: number | '';
    colour: string;
}

export abstract class Shape {
    type: string = "shape";
    uuid: string;
    globalCompositeOperation: string = "source-over";
    fill: string = '#000';
    layer: string = "";
    name = 'Unknown shape';
    trackers: Tracker[] = [];
    auras: Aura[] = [];
    owners: string[] = [];
    visionObstruction = false;
    movementObstruction = false;

    constructor(uuid?: string) {
        this.uuid = uuid || uuidv4();
    }

    abstract getBoundingBox(): BoundingRect;

    abstract contains(x: number, y: number, inWorldCoord: boolean): boolean;

    abstract center(): Point;
    abstract center(centerPoint: Point): void;
    // abstract center(centerPoint?: Point): Point|void;

    checkLightSources() {
        const self = this;
        const vo_i = gameManager.lightblockers.indexOf(this.uuid);
        if (this.visionObstruction && vo_i === -1)
            gameManager.lightblockers.push(this.uuid);
        else if (!this.visionObstruction && vo_i >= 0)
            gameManager.lightblockers.splice(vo_i, 1);

        // Check if the lightsource auras are in the gameManager
        this.auras.forEach(function (au) {
            const ls = gameManager.lightsources;
            const i = ls.findIndex(o => o.aura === au.uuid);
            if (au.lightSource && i === -1) {
                ls.push({ shape: self.uuid, aura: au.uuid });
            } else if (!au.lightSource && i >= 0) {
                ls.splice(i, 1);
            }
        });
        // Check if anything in the gameManager referencing this shape is in fact still a lightsource
        for (let i = gameManager.lightsources.length - 1; i >= 0; i--) {
            const ls = gameManager.lightsources[i];
            if (ls.shape === self.uuid) {
                if (!self.auras.some(a => a.uuid === ls.aura && a.lightSource))
                    gameManager.lightsources.splice(i, 1);
            }
        }
    }

    setMovementBlock(blocksMovement: boolean) {
        this.movementObstruction = blocksMovement || false;
        const vo_i = gameManager.movementblockers.indexOf(this.uuid);
        if (this.movementObstruction && vo_i === -1)
            gameManager.movementblockers.push(this.uuid);
        else if (!this.movementObstruction && vo_i >= 0)
            gameManager.movementblockers.splice(vo_i, 1);
    }

    ownedBy(username?: string) {
        if (username === undefined)
            username = gameManager.username;
        return gameManager.IS_DM || this.owners.includes(username);
    }

    onSelection() {
        // Zeer lang stuk code da irrelevant is :p
    }

    onSelectionLoss() {
        // $(`#shapeselectioncog-${this.uuid}`).remove();
        $("#selection-menu").hide();
    }

    asDict() {
        return Object.assign({}, this);
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.layer === 'fow') {
            this.fill = gameManager.fowColour.spectrum("get").toRgbString();
        }
        if (this.globalCompositeOperation !== undefined)
            ctx.globalCompositeOperation = this.globalCompositeOperation;
        else
            ctx.globalCompositeOperation = "source-over";
        this.drawAuras(ctx);
    }

    drawAuras(ctx: CanvasRenderingContext2D) {
        const self = this;
        this.auras.forEach(function (aura) {
            if (aura.value === '') return;
            ctx.beginPath();
            ctx.fillStyle = aura.colour;
            if (gameManager.layerManager.hasLayer("fow") && gameManager.layerManager.getLayer("fow")!.ctx === ctx)
                ctx.fillStyle = "black";
            const loc = w2l(self.center());
            ctx.arc(loc.x, loc.y, w2lr(aura.value), 0, 2 * Math.PI);
            ctx.fill();
            if (aura.dim) {
                const tc = tinycolor(aura.colour);
                ctx.beginPath();
                ctx.fillStyle = tc.setAlpha(tc.getAlpha() / 2).toRgbString();
                const loc = w2l(self.center());
                ctx.arc(loc.x, loc.y, w2lr(aura.dim), 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    showContextMenu(mouse: Point) {
        if (gameManager.layerManager.getLayer() === undefined) return;
        const l = gameManager.layerManager.getLayer()!;
        l.selection = [this];
        this.onSelection();
        l.invalidate(true);
        const asset = this;
        $menu.show();
        $menu.empty();
        $menu.css({ left: mouse.x, top: mouse.y });
        let data = "" +
            "<ul>" +
            "<li>Layer<ul>";
        gameManager.layerManager.layers.forEach(function (layer) {
            if (!layer.selectable) return;
            const sel = layer.name === l.name ? " style='background-color:aqua' " : " ";
            data += `<li data-action='setLayer' data-layer='${layer.name}' ${sel} class='context-clickable'>${layer.name}</li>`;
        });
        data += "</ul></li>" +
            "<li data-action='moveToBack' class='context-clickable'>Move to back</li>" +
            "<li data-action='moveToFront' class='context-clickable'>Move to front</li>" +
            "<li data-action='addInitiative' class='context-clickable'>Add initiative</li>" +
            "</ul>";
        $menu.html(data);
        $(".context-clickable").on('click', function () {
            handleContextMenu($(this), asset);
        });
    }
}

export class BoundingRect {
    type = "boundrect";
    x: number;
    y: number;
    w: number;
    h: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        if (inWorldCoord) {
            x = l2wx(x);
            y = l2wy(y);
        }
        return this.x <= x && (this.x + this.w) >= x &&
            this.y <= y && (this.y + this.h) >= y;
    }

    intersectsWith(other: BoundingRect): boolean {
        return !(other.x >= this.x + this.w ||
            other.x + other.w <= this.x ||
            other.y >= this.y + this.h ||
            other.y + other.h <= this.y);
    }
    getIntersectWithLine(line: { start: Point; end: Point }) {
        const lines = [
            getLinesIntersectPoint({ x: this.x, y: this.y }, { x: this.x + this.w, y: this.y }, line.start, line.end),
            getLinesIntersectPoint({ x: this.x + this.w, y: this.y }, {
                x: this.x + this.w,
                y: this.y + this.h
            }, line.start, line.end),
            getLinesIntersectPoint({ x: this.x, y: this.y }, { x: this.x, y: this.y + this.h }, line.start, line.end),
            getLinesIntersectPoint({ x: this.x, y: this.y + this.h }, {
                x: this.x + this.w,
                y: this.y + this.h
            }, line.start, line.end)
        ];
        let min_d = Infinity;
        let min_i = null;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === null || lines[i] === false) continue;
            const d = getPointDistance(line.start, <Point>lines[i]);
            if (min_d > d) {
                min_d = d;
                min_i = lines[i];
            }
        }
        return { intersect: min_i, distance: min_d }
    }
}

export class Rect extends Shape {
    x: number;
    y: number;
    w: number;
    h: number;
    border: string;

    constructor(x: number, y: number, w: number, h: number, fill?: string, border?: string, uuid?: string) {
        super(uuid);
        this.type = "rect";
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 1;
        this.h = h || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
        this.uuid = uuid || uuidv4();
    }
    getBoundingBox() {
        return new BoundingRect(this.x, this.y, this.w, this.h);
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.fillStyle = this.fill;
        const z = gameManager.layerManager.zoomFactor;
        const loc = w2l({ x: this.x, y: this.y });
        ctx.fillRect(loc.x, loc.y, this.w * z, this.h * z);
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.strokeStyle = this.border;
            ctx.strokeRect(loc.x, loc.y, this.w * z, this.h * z);
        }
    }
    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        if (inWorldCoord) {
            x = l2wx(x);
            y = l2wy(y);
        }
        return this.x <= x && (this.x + this.w) >= x &&
            this.y <= y && (this.y + this.h) >= y;
    }
    inCorner(x: number, y: number, corner: string) {
        switch (corner) {
            case 'ne':
                return w2lx(this.x + this.w - 3) <= x && x <= w2lx(this.x + this.w + 3) && w2ly(this.y - 3) <= y && y <= w2ly(this.y + 3);
            case 'nw':
                return w2lx(this.x - 3) <= x && x <= w2lx(this.x + 3) && w2ly(this.y - 3) <= y && y <= w2ly(this.y + 3);
            case 'sw':
                return w2lx(this.x - 3) <= x && x <= w2lx(this.x + 3) && w2ly(this.y + this.h - 3) <= y && y <= w2ly(this.y + this.h + 3);
            case 'se':
                return w2lx(this.x + this.w - 3) <= x && x <= w2lx(this.x + this.w + 3) && w2ly(this.y + this.h - 3) <= y && y <= w2ly(this.y + this.h + 3);
            default:
                return false;
        }
    }
    getCorner(x: number, y: number) {
        if (this.inCorner(x, y, "ne"))
            return "ne";
        else if (this.inCorner(x, y, "nw"))
            return "nw";
        else if (this.inCorner(x, y, "se"))
            return "se";
        else if (this.inCorner(x, y, "sw"))
            return "sw";
    }
    center(): Point;
    center(centerPoint: Point): void;
    center(centerPoint?: Point): Point | void {
        if (centerPoint === undefined)
            return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
        this.x = centerPoint.x - this.w / 2;
        this.y = centerPoint.y - this.h / 2;
    }
}

export class Circle extends Shape {
    x: number;
    y: number;
    r: number;
    border: string;
    constructor(x: number, y: number, r: number, fill?: string, border?: string, uuid?: string) {
        super(uuid);
        this.type = "circle";
        this.x = x || 0;
        this.y = y || 0;
        this.r = r || 1;
        this.fill = fill || '#000';
        this.border = border || "rgba(0, 0, 0, 0)";
        this.uuid = uuid || uuidv4();
    };
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.x - this.r, this.y - this.r, this.r * 2, this.r * 2);
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.fillStyle = this.fill;
        const loc = w2l({ x: this.x, y: this.y });
        ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
        if (this.border !== "rgba(0, 0, 0, 0)") {
            ctx.beginPath();
            ctx.strokeStyle = this.border;
            ctx.arc(loc.x, loc.y, this.r, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    contains(x: number, y: number): boolean {
        return (x - w2lx(this.x)) ** 2 + (y - w2ly(this.y)) ** 2 < this.r ** 2;
    }
    inCorner(x: number, y: number, corner: string) {
        return false; //TODO
    }
    getCorner(x: number, y: number) {
        if (this.inCorner(x, y, "ne"))
            return "ne";
        else if (this.inCorner(x, y, "nw"))
            return "nw";
        else if (this.inCorner(x, y, "se"))
            return "se";
        else if (this.inCorner(x, y, "sw"))
            return "sw";
    }
    center(): Point;
    center(centerPoint: Point): void;
    center(centerPoint?: Point): Point | void {
        if (centerPoint === undefined)
            return { x: this.x, y: this.y };
        this.x = centerPoint.x;
        this.y = centerPoint.y;
    }
}

export class Line extends Shape {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    constructor(x1: number, y1: number, x2: number, y2: number, uuid?: string) {
        super(uuid);
        this.type = "line";
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.uuid = uuid || uuidv4();
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(
            Math.min(this.x1, this.x2),
            Math.min(this.y1, this.y2),
            Math.abs(this.x1 - this.x2),
            Math.abs(this.y1 - this.y2)
        );
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(w2lx(this.x1), w2ly(this.y1));
        ctx.lineTo(w2lx(this.x2), w2ly(this.y2));
        ctx.strokeStyle = 'rgba(255,0,0, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        return false; // TODO
    }

    center(): Point;
    center(centerPoint: Point): void;
    center(centerPoint?: Point): Point | void { } // TODO
}

export class Text extends Shape {
    x: number;
    y: number;
    text: string;
    font: string;
    angle: number;
    constructor(x: number, y: number, text: string, font: string, angle?: number, uuid?: string) {
        super(uuid);
        this.type = "text";
        this.x = x;
        this.y = y;
        this.text = text;
        this.font = font;
        this.angle = angle || 0;
        this.uuid = uuid || uuidv4();
    }
    getBoundingBox(): BoundingRect {
        return new BoundingRect(this.x, this.y, 5, 5); // Todo: fix this bounding box
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        ctx.font = this.font;
        ctx.save();
        ctx.translate(w2lx(this.x), w2ly(this.y));
        ctx.rotate(this.angle);
        ctx.textAlign = "center";
        ctx.fillText(this.text, 0, -5);
        ctx.restore();
    }
    contains(x: number, y: number, inWorldCoord: boolean): boolean {
        return false; // TODO
    }

    center(): Point;
    center(centerPoint: Point): void;
    center(centerPoint?: Point): Point | void { } // TODO
}

export class Asset extends Rect {
    img: HTMLImageElement;
    src: string = '';
    constructor(img: HTMLImageElement, x: number, y: number, w: number, h: number, uuid?: string) {
        super(x, y, w, h);
        if (uuid !== undefined) this.uuid = uuid;
        this.type = "asset";
        this.img = img;
    }
    draw(ctx: CanvasRenderingContext2D) {
        super.draw(ctx);
        const z = gameManager.layerManager.zoomFactor;
        ctx.drawImage(this.img, w2lx(this.x), w2ly(this.y), this.w * z, this.h * z);
    }
}


export function createShapeFromDict(shape: ServerShape, dummy?: boolean) {
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
            gameManager.layerManager.getLayer(shape.layer)!.invalidate(false);
        };
    }
    return sh;
}

function handleContextMenu(menu: JQuery<HTMLElement>, shape: Shape) {
    const action = menu.data("action");
    const layer = gameManager.layerManager.getLayer();
    if (layer === undefined) return;
    switch (action) {
        case 'moveToFront':
            layer.moveShapeOrder(shape, layer.shapes.data.length - 1, true);
            break;
        case 'moveToBack':
            layer.moveShapeOrder(shape, 0, true);
            break;
        case 'setLayer':
            layer.removeShape(shape, true);
            gameManager.layerManager.getLayer(menu.data("layer"))!.addShape(shape, true);
            break;
        case 'addInitiative':
            let src = '';
            if (shape instanceof Asset) src = shape.src;
            gameManager.initiativeTracker.addInitiative(
                {
                    uuid: shape.uuid,
                    visible: !gameManager.IS_DM,
                    group: false,
                    src: src,
                    owners: shape.owners
                }, true);
            break;
    }
    $menu.hide();
}