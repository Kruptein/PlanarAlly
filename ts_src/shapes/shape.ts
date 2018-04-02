import { uuidv4 } from "../utils";
import BoundingRect from "./boundingrect";
import gameManager from "../planarally";
import socket from "../socket";
import { g2l, g2lr } from "../units";
import { populateEditAssetDialog } from "./editdialog";
import { GlobalPoint, LocalPoint } from "../geom";
import { ServerShape } from "../api_types";

const $menu = $('#contextMenu');

export default abstract class Shape {
    // Used to create class instance from server shape data
    type: string = "shape";
    // The unique ID of this shape
    uuid: string;
    // The layer the shape is currently on
    layer!: string;

    // A reference point regarding that specific shape's structure
    refPoint: GlobalPoint;
    
    // Fill colour of the shape
    fill: string = '#000';
    //The optional name associated with the shape
    name = 'Unknown shape';

    // Associated trackers/auras/owners
    trackers: Tracker[] = [];
    auras: Aura[] = [];
    owners: string[] = [];

    // Block light sources
    visionObstruction = false;
    // Prevent shapes from overlapping with this shape
    movementObstruction = false;

    // Draw modus to use
    globalCompositeOperation: string = "source-over";

    constructor(refPoint: GlobalPoint, uuid?: string) {
        this.refPoint = refPoint;
        this.uuid = uuid || uuidv4();
    }

    abstract getBoundingBox(): BoundingRect;

    // If inWorldCoord is 
    abstract contains(point: GlobalPoint): boolean;

    abstract center(): GlobalPoint;
    abstract center(centerPoint: GlobalPoint): void;
    abstract getCorner(point: GlobalPoint): string | undefined;
    abstract visibleInCanvas(canvas: HTMLCanvasElement): boolean;

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
        if (!this.trackers.length || this.trackers[this.trackers.length - 1].name !== '' || this.trackers[this.trackers.length - 1].value !== 0)
            this.trackers.push({ uuid: uuidv4(), name: '', value: 0, maxvalue: 0, visible: false });
        if (!this.auras.length || this.auras[this.auras.length - 1].name !== '' || this.auras[this.auras.length - 1].value !== 0)
            this.auras.push({
                uuid: uuidv4(),
                name: '',
                value: 0,
                dim: 0,
                lightSource: false,
                colour: 'rgba(0,0,0,0)',
                visible: false
            });
        $("#selection-name").text(this.name);
        const trackers = $("#selection-trackers");
        trackers.empty();
        this.trackers.forEach(function (tracker) {
            const val = tracker.maxvalue ? `${tracker.value}/${tracker.maxvalue}` : tracker.value;
            trackers.append($(`<div id="selection-tracker-${tracker.uuid}-name" data-uuid="${tracker.uuid}">${tracker.name}</div>`));
            trackers.append(
                $(`<div id="selection-tracker-${tracker.uuid}-value" data-uuid="${tracker.uuid}" class="selection-tracker-value">${val}</div>`)
            );
        });
        const auras = $("#selection-auras");
        auras.empty();
        this.auras.forEach(function (aura) {
            const val = aura.dim ? `${aura.value}/${aura.dim}` : aura.value;
            auras.append($(`<div id="selection-aura-${aura.uuid}-name" data-uuid="${aura.uuid}">${aura.name}</div>`));
            auras.append(
                $(`<div id="selection-aura-${aura.uuid}-value" data-uuid="${aura.uuid}" class="selection-aura-value">${val}</div>`)
            );
        });
        $("#selection-menu").show();
        const self = this;
        const editbutton = $("#selection-edit-button");
        if (!this.ownedBy())
            editbutton.hide();
        else
            editbutton.show();
        editbutton.on("click", function() {populateEditAssetDialog(self)});
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
            if (aura.value === 0) return;
            ctx.beginPath();
            ctx.fillStyle = aura.colour;
            if (gameManager.layerManager.hasLayer("fow") && gameManager.layerManager.getLayer("fow")!.ctx === ctx)
                ctx.fillStyle = "black";
            const loc = g2l(self.center());
            ctx.arc(loc.x, loc.y, g2lr(aura.value), 0, 2 * Math.PI);
            ctx.fill();
            if (aura.dim) {
                const tc = tinycolor(aura.colour);
                ctx.beginPath();
                ctx.fillStyle = tc.setAlpha(tc.getAlpha() / 2).toRgbString();
                const loc = g2l(self.center());
                ctx.arc(loc.x, loc.y, g2lr(aura.dim), 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }

    showContextMenu(mouse: LocalPoint) {
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
            asset.onContextMenu($(this));
        });
    }
    onContextMenu(menu: JQuery<HTMLElement>) {
        const action = menu.data("action");
        const layer = gameManager.layerManager.getLayer();
        if (layer === undefined) return;
        switch (action) {
            case 'moveToFront':
                layer.moveShapeOrder(this, layer.shapes.length - 1, true);
                break;
            case 'moveToBack':
                layer.moveShapeOrder(this, 0, true);
                break;
            case 'setLayer':
                layer.removeShape(this, true);
                gameManager.layerManager.getLayer(menu.data("layer"))!.addShape(this, true);
                break;
            case 'addInitiative':
                gameManager.initiativeTracker.addInitiative(this.getInitiativeRepr(), true);
                break;
        }
        $menu.hide();
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !gameManager.IS_DM,
            group: false,
            src: "",
            owners: this.owners
        }
    }
}