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
        if (!this.trackers.length || this.trackers[this.trackers.length - 1].name !== '' || this.trackers[this.trackers.length - 1].value !== '')
            this.trackers.push({ uuid: uuidv4(), name: '', value: '', maxvalue: '', visible: false });
        if (!this.auras.length || this.auras[this.auras.length - 1].name !== '' || this.auras[this.auras.length - 1].value !== '')
            this.auras.push({
                uuid: uuidv4(),
                name: '',
                value: '',
                dim: '',
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
                    if (!self.trackers.length || self.trackers[self.trackers.length - 1].name !== '' || self.trackers[self.trackers.length - 1].value !== '') {
                        self.trackers.push({ uuid: uuidv4(), name: '', value: '', maxvalue: '', visible: false });
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
                    if (tr.name === '' || tr.value === '') return;
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
                    if (!self.auras.length || self.auras[self.auras.length - 1].name !== '' || self.auras[self.auras.length - 1].value !== '') {
                        self.auras.push({
                            uuid: uuidv4(),
                            name: '',
                            value: '',
                            dim: '',
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
                    if (au.name === '' && au.value === '') return;
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
            if (tracker.value === '')
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
            if (aura.value === '')
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