import gameManager from "../planarally";
import socket from "../socket";
import { uuidv4 } from "../utils";
import Shape from "./shape";

export function populateEditAssetDialog(self: Shape) {
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
            socket.emit("updateShape", { shape: s.asDict(), redraw: true })
        }
    });
    const dialog_moveblock = $("#shapeselectiondialog-moveblocker");
    dialog_moveblock.prop("checked", self.movementObstruction);
    dialog_moveblock.on("click", function () {
        const uuid = <string>$("#shapeselectiondialog-uuid").val();
        if (gameManager.layerManager.UUIDMap.has(uuid)) {
            const s = gameManager.layerManager.UUIDMap.get(uuid)!;
            s.setMovementBlock(dialog_moveblock.prop("checked"));
            socket.emit("updateShape", { shape: s.asDict(), redraw: false })
        }
    });

    const annotation_text = $("#shapeselectiondialog-annotation-textarea");
    annotation_text.val(self.annotation);
    annotation_text.on("change", function() {
        const uuid = <string>$("#shapeselectiondialog-uuid").val();
        if (gameManager.layerManager.UUIDMap.has(uuid)) {
            const s = gameManager.layerManager.UUIDMap.get(uuid)!;
            const had_annotation = s.annotation !== '';
            s.annotation = <string>$(this).val();
            if (s.annotation !== '' && !had_annotation) {
                gameManager.annotations.push(s.uuid);
                if (gameManager.layerManager.hasLayer("draw"))
                    gameManager.layerManager.getLayer("draw")!.invalidate(true)
            } else if (s.annotation == '' && had_annotation) {
                gameManager.annotations.splice(gameManager.annotations.findIndex(an => an === s.uuid));
                if (gameManager.layerManager.hasLayer("draw"))
                    gameManager.layerManager.getLayer("draw")!.invalidate(true)
            }
            socket.emit("updateShape", { shape: s.asDict(), redraw: false })
        }
    });

    const owners = $("#shapeselectiondialog-owners");
    const trackers = $("#shapeselectiondialog-trackers");
    const auras = $("#shapeselectiondialog-auras");
    const annotation = $("#shapeselectiondialog-annotation");
    owners.nextUntil(trackers).remove();
    trackers.nextUntil(auras).remove();
    auras.nextUntil(annotation).remove();  //($("#shapeselectiondialog").find("form")).remove();

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

        // $("#shapeselectiondialog").children().last().append(
        annotation.before(
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
            au.dim = parseInt(<string>$(this).val());
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
}