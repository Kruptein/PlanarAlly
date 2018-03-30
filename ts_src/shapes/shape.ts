import {uuidv4, Point} from "../utils";
import { BoundingRect } from "./boundingrect";
import gameManager from "../planarally";
import socket from "../socket";
import { w2l, w2lr } from "../units";
import { Asset } from "./asset";
import { Rect } from "./rect";
import { Circle } from "./circle";
import { Line } from "./line";
import { Text } from "./text";

const $menu = $('#contextMenu');

interface Tracker {
    uuid: string;
    visible: boolean;
    name: string;
    value: number;
    maxvalue: number;
}

interface Aura {
    uuid: string;
    lightSource: boolean;
    visible: boolean;
    name: string;
    value: number;
    dim: number;
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
    abstract getCorner(x: number, y:number): string|undefined;
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
        editbutton.on("click", function () {
            $("#shapeselectiondialog-uuid").val(self.uuid);
            const dialog_name = $("#shapeselectiondialog-name");
            dialog_name.val(self.name);
            dialog_name.on("change", function () {
                const uuid = <string>$("#shapeselectiondialog-uuid").val();
                if (gameManager.layerManager.UUIDMap.has(uuid)) {
                    const s = gameManager.layerManager.UUIDMap.get(uuid)!;
                    s.name = <string>$(this).val();
                    $("#selection-name").text(<string>$(this).val());
                    socket.emit("updateShape", { shape: s.asDict(), redraw: false })
                }
            });
            const dialog_lightblock = $("#shapeselectiondialog-lightblocker");
            dialog_lightblock.prop("checked", self.visionObstruction);
            dialog_lightblock.on("click", function () {
                const uuid = <string>$("#shapeselectiondialog-uuid").val();
                if (gameManager.layerManager.UUIDMap.has(uuid)) {
                    const s = gameManager.layerManager.UUIDMap.get(uuid)!;
                    s.visionObstruction = dialog_lightblock.prop("checked");
                    s.checkLightSources();
                }
            });
            const dialog_moveblock = $("#shapeselectiondialog-moveblocker");
            dialog_moveblock.prop("checked", self.movementObstruction);
            dialog_moveblock.on("click", function () {
                const uuid = <string>$("#shapeselectiondialog-uuid").val();
                if (gameManager.layerManager.UUIDMap.has(uuid)) {
                    const s = gameManager.layerManager.UUIDMap.get(uuid)!;
                    s.setMovementBlock(dialog_moveblock.prop("checked"));
                }
            });

            const owners = $("#shapeselectiondialog-owners");
            const trackers = $("#shapeselectiondialog-trackers");
            const auras = $("#shapeselectiondialog-auras");
            owners.nextUntil(trackers).remove();
            trackers.nextUntil(auras).remove();
            auras.nextUntil($("#shapeselectiondialog").find("form")).remove();

            function addOwner(owner: string) {
                const ow_name = $(`<input type="text" placeholder="name" data-name="${owner}" value="${owner}" style="grid-column-start: name">`);
                const ow_remove = $(`<div style="grid-column-start: remove"><i class="fas fa-trash-alt"></i></div>`);

                trackers.before(ow_name.add(ow_remove));

                ow_name.on("change", function () {
                    const ow_i = self.owners.findIndex(o => o === $(this).data('name'));
                    if (ow_i >= 0)
                        self.owners.splice(ow_i, 1, <string>$(this).val());
                    else
                        self.owners.push(<string>$(this).val());
                    socket.emit("updateShape", { shape: self.asDict(), redraw: false });
                    if (!self.owners.length || self.owners[self.owners.length - 1] !== '') {
                        addOwner("");
                    }
                });
                ow_remove.on("click", function () {
                    const ow_i = self.owners.findIndex(o => o === $(this).data('name'));
                    $(this).prev().remove();
                    $(this).remove();
                    self.owners.splice(ow_i, 1);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: false });
                });
            }

            self.owners.forEach(addOwner);
            if (!self.owners.length || self.owners[self.owners.length - 1] !== '')
                addOwner("");

            function addTracker(tracker: Tracker) {
                const tr_name = $(`<input type="text" placeholder="name" data-uuid="${tracker.uuid}" value="${tracker.name}" style="grid-column-start: name">`);
                const tr_val = $(`<input type="text" title="Current value" data-uuid="${tracker.uuid}" value="${tracker.value}">`);
                const tr_maxval = $(`<input type="text" title="Max value" data-uuid="${tracker.uuid}" value="${tracker.maxvalue || ""}">`);
                const tr_visible = $(`<div data-uuid="${tracker.uuid}"><i class="fas fa-eye"></i></div>`);
                const tr_remove = $(`<div data-uuid="${tracker.uuid}"><i class="fas fa-trash-alt"></i></div>`);

                auras.before(
                    tr_name
                        .add(tr_val)
                        .add(`<span data-uuid="${tracker.uuid}">/</span>`)
                        .add(tr_maxval)
                        .add(`<span data-uuid="${tracker.uuid}"></span>`)
                        .add(tr_visible)
                        .add(`<span data-uuid="${tracker.uuid}"></span>`)
                        .add(tr_remove)
                );

                if (!tracker.visible)
                    tr_visible.css("opacity", 0.3);

                tr_name.on("change", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr === undefined) {
                        console.log("Name change on unknown tracker");
                        return;
                    }
                    tr.name = <string>$(this).val();
                    $(`#selection-tracker-${tr.uuid}-name`).text(<string>$(this).val());
                    socket.emit("updateShape", { shape: self.asDict(), redraw: false });
                    if (!self.trackers.length || self.trackers[self.trackers.length - 1].name !== '' || self.trackers[self.trackers.length - 1].value !== 0) {
                        self.trackers.push({ uuid: uuidv4(), name: '', value: 0, maxvalue: 0, visible: false });
                        addTracker(self.trackers[self.trackers.length - 1]);
                    }
                });
                tr_val.on("change", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr === undefined) {
                        console.log("Value change on unknown tracker");
                        return;
                    }
                    tr.value = parseInt(<string>$(this).val());
                    const val = tr.maxvalue ? `${tr.value}/${tr.maxvalue}` : tr.value;
                    $(`#selection-tracker-${tr.uuid}-value`).text(val);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: false });
                });
                tr_maxval.on("change", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr === undefined) {
                        console.log("Mazvalue change on unknown tracker");
                        return;
                    }
                    tr.maxvalue = parseInt(<string>$(this).val());
                    const val = tr.maxvalue ? `${tr.value}/${tr.maxvalue}` : tr.value;
                    $(`#selection-tracker-${tr.uuid}-value`).text(val);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: false });
                });
                tr_remove.on("click", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr === undefined) {
                        console.log("Remove on unknown tracker");
                        return;
                    }
                    if (tr.name === '' || tr.value === 0) return;
                    $(`[data-uuid=${tr.uuid}]`).remove();
                    self.trackers.splice(self.trackers.indexOf(tr), 1);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: false });
                });
                tr_visible.on("click", function () {
                    const tr = self.trackers.find(t => t.uuid === $(this).data('uuid'));
                    if (tr === undefined) {
                        console.log("Visibility change on unknown tracker");
                        return;
                    }
                    if (tr.visible)
                        $(this).css("opacity", 0.3);
                    else
                        $(this).css("opacity", 1.0);
                    tr.visible = !tr.visible;
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                });
            }

            self.trackers.forEach(addTracker);

            function addAura(aura: Aura) {
                const aura_name = $(`<input type="text" placeholder="name" data-uuid="${aura.uuid}" value="${aura.name}" style="grid-column-start: name">`);
                const aura_val = $(`<input type="text" title="Current value" data-uuid="${aura.uuid}" value="${aura.value}">`);
                const aura_dimval = $(`<input type="text" title="Dim value" data-uuid="${aura.uuid}" value="${aura.dim || ""}">`);
                const aura_colour = $(`<input type="text" title="Aura colour" data-uuid="${aura.uuid}">`);
                const aura_visible = $(`<div data-uuid="${aura.uuid}"><i class="fas fa-eye"></i></div>`);
                const aura_light = $(`<div data-uuid="${aura.uuid}"><i class="fas fa-lightbulb"></i></div>`);
                const aura_remove = $(`<div data-uuid="${aura.uuid}"><i class="fas fa-trash-alt"></i></div>`);

                $("#shapeselectiondialog").children().last().append(
                    aura_name
                        .add(aura_val)
                        .add(`<span data-uuid="${aura.uuid}">/</span>`)
                        .add(aura_dimval)
                        .add($(`<div data-uuid="${aura.uuid}">`).append(aura_colour).append($("</div>")))
                        .add(aura_visible)
                        .add(aura_light)
                        .add(aura_remove)
                );

                if (!aura.visible)
                    aura_visible.css("opacity", 0.3);
                if (!aura.lightSource)
                    aura_light.css("opacity", 0.3);

                aura_colour.spectrum({
                    showInput: true,
                    showAlpha: true,
                    color: aura.colour,
                    move: function (colour) {
                        const au = self.auras.find(a => a.uuid === $(this).data('uuid'));
                        if (au === undefined) {
                            console.log("Attempted to move unknown aura colour");
                            return;
                        }
                        // Do not use aura directly as it does not work properly for new auras
                        au.colour = colour.toRgbString();
                        if (gameManager.layerManager.hasLayer(self.layer)) {
                            gameManager.layerManager.getLayer(self.layer)!.invalidate(true);
                        } else {
                            console.log("Aura colour target has no associated layer");
                        }
                    },
                    change: function () {
                        socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                    }
                });

                aura_name.on("change", function () {
                    const au = self.auras.find(a => a.uuid === $(this).data('uuid'));
                    if (au === undefined) {
                        console.log("Attempted to change name of unknown aura");
                        return;
                    }
                    au.name = <string>$(this).val();
                    $(`#selection-aura-${au.uuid}-name`).text(<string>$(this).val());
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                    if (!self.auras.length || self.auras[self.auras.length - 1].name !== '' || self.auras[self.auras.length - 1].value !== 0) {
                        self.auras.push({
                            uuid: uuidv4(),
                            name: '',
                            value: 0,
                            dim: 0,
                            lightSource: false,
                            colour: 'rgba(0,0,0,0)',
                            visible: false
                        });
                        addAura(self.auras[self.auras.length - 1]);
                    }
                });
                aura_val.on("change", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    if (au === undefined) {
                        console.log("Attempted to change value of unknown aura");
                        return;
                    }
                    au.value = parseInt(<string>$(this).val());
                    const val = au.dim ? `${au.value}/${au.dim}` : au.value;
                    $(`#selection-aura-${au.uuid}-value`).text(val);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                    if (gameManager.layerManager.hasLayer(self.layer)) {
                        gameManager.layerManager.getLayer(self.layer)!.invalidate(true);
                    } else {
                        console.log("Aura colour target has no associated layer");
                    }
                });
                aura_dimval.on("change", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    if (au === undefined) {
                        console.log("Attempted to change dimvalue of unknown aura");
                        return;
                    }
                    au.value = parseInt(<string>$(this).val());
                    const val = au.dim ? `${au.value}/${au.dim}` : au.value;
                    $(`#selection-aura-${au.uuid}-value`).text(val);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                    if (gameManager.layerManager.hasLayer(self.layer)) {
                        gameManager.layerManager.getLayer(self.layer)!.invalidate(true);
                    } else {
                        console.log("Aura colour target has no associated layer");
                    }
                });
                aura_remove.on("click", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    if (au === undefined) {
                        console.log("Attempted to remove unknown aura");
                        return;
                    }
                    if (au.name === '' && au.value === 0) return;
                    $(`[data-uuid=${au.uuid}]`).remove();
                    self.auras.splice(self.auras.indexOf(au), 1);
                    self.checkLightSources();
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                    if (gameManager.layerManager.hasLayer(self.layer)) {
                        gameManager.layerManager.getLayer(self.layer)!.invalidate(true);
                    } else {
                        console.log("Aura colour target has no associated layer");
                    }
                });
                aura_visible.on("click", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    if (au === undefined) {
                        console.log("Attempted to toggle visibility of unknown aura");
                        return;
                    }
                    au.visible = !au.visible;
                    if (au.visible)
                        $(this).css("opacity", 1.0);
                    else
                        $(this).css("opacity", 0.3);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                });
                aura_light.on("click", function () {
                    const au = self.auras.find(t => t.uuid === $(this).data('uuid'));
                    if (au === undefined) {
                        console.log("Attempted to toggle light capability of unknown aura");
                        return;
                    }
                    au.lightSource = !au.lightSource;
                    const ls = gameManager.lightsources;
                    const i = ls.findIndex(o => o.aura === au.uuid);
                    if (au.lightSource) {
                        $(this).css("opacity", 1.0);
                        if (i === -1)
                            ls.push({ shape: self.uuid, aura: au.uuid });
                    } else {
                        $(this).css("opacity", 0.3);
                        if (i >= 0)
                            ls.splice(i, 1);
                    }
                    if (gameManager.layerManager.hasLayer("fow"))
                        gameManager.layerManager.getLayer("fow")!.invalidate(false);
                    socket.emit("updateShape", { shape: self.asDict(), redraw: true });
                });
            }

            for (let i = 0; i < self.auras.length; i++) {
                addAura(self.auras[i]);
            }


            gameManager.shapeSelectionDialog.dialog("open");
        });
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
            layer.moveShapeOrder(shape, layer.shapes.length - 1, true);
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