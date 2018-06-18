import { uuidv4 } from "../utils";
import BoundingRect from "./boundingrect";
import gameManager from "../planarally";
import socket from "../socket";
import { g2l, g2lr } from "../units";
import { populateEditAssetDialog } from "./editdialog";
import { GlobalPoint, LocalPoint } from "../geom";
import { ServerShape } from "../api_types";
import Settings from "../settings";

export default abstract class Shape {
    // Used to create class instance from server shape data
    protected abstract type: string;
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
    // Does this shape represent a playable token
    isToken = false;

    // Mouseover annotation
    annotation: string = '';

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

    invalidate(skipLightUpdate: boolean) {
        const l = gameManager.layerManager.getLayer(this.layer);
        if (l) l.invalidate(skipLightUpdate);
    }

    checkLightSources() {
        const self = this;
        const vo_i = gameManager.lightblockers.indexOf(this.uuid);
        let changeBV = false;
        if (this.visionObstruction && vo_i === -1) {
            gameManager.lightblockers.push(this.uuid);
            changeBV = true;

        } else if (!this.visionObstruction && vo_i >= 0){
            gameManager.lightblockers.splice(vo_i, 1);
            changeBV = true;
        }
        if (changeBV)
            gameManager.recalculateBoundingVolume();

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

    setIsToken(isToken: boolean) {
        this.isToken = isToken;
        const i = gameManager.ownedtokens.indexOf(this.uuid);
        if (this.isToken && i === -1)
            gameManager.ownedtokens.push(this.uuid);
        else if (!this.isToken && i >= 0)
            gameManager.ownedtokens.splice(i, 1);
    }

    ownedBy(username?: string) {
        if (username === undefined)
            username = Settings.username;
        return Settings.IS_DM || this.owners.includes(username);
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
            if (tracker.value === 0) return;
            const val = tracker.maxvalue ? `${tracker.value}/${tracker.maxvalue}` : tracker.value;
            trackers.append($(`<div id="selection-tracker-${tracker.uuid}-name" data-uuid="${tracker.uuid}">${tracker.name}</div>`));
            trackers.append(
                $(`<div id="selection-tracker-${tracker.uuid}-value" data-uuid="${tracker.uuid}" class="selection-tracker-value">${val}</div>`)
            );
        });
        const auras = $("#selection-auras");
        auras.empty();
        this.auras.forEach(function (aura) {
            if (aura.value === 0) return;
            const val = aura.dim ? `${aura.value}/${aura.dim}` : aura.value;
            auras.append($(`<div id="selection-aura-${aura.uuid}-name" data-uuid="${aura.uuid}">${aura.name}</div>`));
            auras.append(
                $(`<div id="selection-aura-${aura.uuid}-value" data-uuid="${aura.uuid}" class="selection-aura-value">${val}</div>`)
            );
        });
        $("#selection-menu").show();

        $('.selection-tracker-value').on("click", function () {
            const uuid = $(this).data('uuid');
            const tracker = self.trackers.find(t => t.uuid === uuid);
            if (tracker === undefined) {
                console.log("Attempted to update unknown tracker");
                return;
            }
            const new_tracker = prompt(`New  ${tracker.name} value: (absolute or relative)`);
            if (new_tracker === null)
                return;
            if (tracker.value === 0)
                tracker.value = 0;
            if (new_tracker[0] === '+') {
                tracker.value += parseInt(new_tracker.slice(1));
            } else if (new_tracker[0] === '-') {
                tracker.value -= parseInt(new_tracker.slice(1));
            } else {
                tracker.value = parseInt(new_tracker);
            }
            const val = tracker.maxvalue ? `${tracker.value}/${tracker.maxvalue}` : tracker.value;
            $(this).text(val);
            socket.emit("updateShape", { shape: self.asDict(), redraw: false });
        });
        $('.selection-aura-value').on("click", function () {
            const uuid = $(this).data('uuid');
            const aura = self.auras.find(t => t.uuid === uuid);
            if (aura === undefined) {
                console.log("Attempted to update unknown aura");
                return;
            }
            const new_aura = prompt(`New  ${aura.name} value: (absolute or relative)`);
            if (new_aura === null)
                return;
            if (aura.value === 0)
                aura.value = 0;
            if (new_aura[0] === '+') {
                aura.value += parseInt(new_aura.slice(1));
            } else if (new_aura[0] === '-') {
                aura.value -= parseInt(new_aura.slice(1));
            } else {
                aura.value = parseInt(new_aura);
            }
            const val = aura.dim ? `${aura.value}/${aura.dim}` : aura.value;
            $(this).text(val);
            socket.emit("updateShape", { shape: self.asDict(), redraw: true });
            if (gameManager.layerManager.hasLayer(self.layer))
                gameManager.layerManager.getLayer(self.layer)!.invalidate(false);
        });

        const self = this;
        const editbutton = $("#selection-edit-button");
        if (!this.ownedBy())
            editbutton.hide();
        else
            editbutton.show();
        // We want to remove all earlier bindings!
        editbutton.off("click");
        editbutton.on("click", function() {populateEditAssetDialog(self)});
    }

    onSelectionLoss() {
        // $(`#shapeselectioncog-${this.uuid}`).remove();
        $("#selection-menu").hide();
    }

    // Do not provide getBaseDict as the default implementation to force the implementation
    abstract asDict(): ServerShape;
    getBaseDict() {
        return {
            type: this.type,
            uuid: this.uuid,
            x: this.refPoint.x,
            y: this.refPoint.y,
            layer: this.layer,
            globalCompositeOperation: this.globalCompositeOperation,
            movementObstruction: this.movementObstruction,
            visionObstruction: this.visionObstruction,
            auras: this.auras,
            trackers: this.trackers,
            owners: this.owners,
            fill: this.fill,
            name: this.name,
            annotation: this.annotation,
            isToken: this.isToken,
        }
    }
    fromDict(data: ServerShape) {
        this.layer = data.layer;
        this.globalCompositeOperation = data.globalCompositeOperation;
        this.movementObstruction = data.movementObstruction;
        this.visionObstruction = data.visionObstruction;
        this.auras = data.auras;
        this.trackers = data.trackers;
        this.owners = data.owners;
        this.isToken = data.isToken;
        if (data.annotation)
            this.annotation = data.annotation;
        if (data.name)
            this.name = data.name;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // if (this.layer === 'fow') {
        //     this.fill = gameManager.fowColour.spectrum("get").toRgbString();
        // }
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
            // if (gameManager.layerManager.hasLayer("fow") && gameManager.layerManager.getLayer("fow")!.ctx === ctx)
            //     ctx.fillStyle = "black";
            const loc = g2l(self.center());
            if (aura.lastPath === undefined) {
                ctx.arc(loc.x, loc.y, g2lr(aura.value), 0, 2 * Math.PI);
                ctx.fill();
            } else {
                ctx.fill(aura.lastPath);
            }
            if (aura.dim) {
                const tc = tinycolor(aura.colour);
                ctx.beginPath();
                ctx.fillStyle = tc.setAlpha(tc.getAlpha() / 2).toRgbString();
                const loc = g2l(self.center());
                if (aura.lastPath === undefined) {
                    ctx.arc(loc.x, loc.y, g2lr(aura.value), 0, 2 * Math.PI);
                    ctx.fill();
                } else {
                    ctx.fill(aura.lastPath);
                }
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
        const $menu = $('#contextMenu');
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
            "<li data-action='addInitiative' class='context-clickable'>" + (gameManager.initiativeTracker.contains(this.uuid) ? "Show" : "Add") + " initiative</li>" +
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
                if (gameManager.initiativeTracker.contains(this.uuid)) gameManager.initiativeTracker.show();
                gameManager.initiativeTracker.addInitiative(this.getInitiativeRepr(), true);
                break;
        }
        $('#contextMenu').hide();
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !Settings.IS_DM,
            group: false,
            src: this.name,
            owners: this.owners,
            has_img: false
        }
    }
    // Code to snap a shape to the grid
    // This is shape dependent as the shape refPoints are shape specific in
    snapToGrid() {};
    resizeToGrid() {};
    resize(resizeDir: string, point: LocalPoint) {};
}