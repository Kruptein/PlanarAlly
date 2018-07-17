import { InitiativeData } from "../api_types";
import gameManager from "../planarally";
import socket from "../socket";
import Settings from "../settings";

export class InitiativeTracker {
    data: InitiativeData[] = [];
    active: number = 0;
    roundCounter: number = 0;
    clear() {
        this.data = [];
        this.active = 0;
        this.roundCounter = 0;
        this.redraw();
    }
    contains(uuid: string) {
        return this.data.some((d) => d.uuid === uuid);
    }
    show() {
        if (this.data.length === 0 || !gameManager.initiativeDialog.dialog("isOpen"))
            gameManager.initiativeDialog.dialog("open");
    }
    hide() {
        if (this.data.length === 0 && gameManager.initiativeDialog.dialog("isOpen"))
            gameManager.initiativeDialog.dialog("close");
    }
    addInitiative(data: InitiativeData, sync: boolean) {
        // Open the initiative tracker if it is not currently open.
        this.show();
        // If no initiative given, assume it 0
        if (data.initiative === undefined)
            data.initiative = 0;
        // Check if the shape is already being tracked
        const existing = this.data.find(d => d.uuid === data.uuid);
        if (existing !== undefined) {
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
                socket.emit("updateInitiative", { uuid: uuid });
        }
        this.hide();
    };
    redraw() {
        gameManager.initiativeDialog.empty();

        this.data.sort(function (a, b) {
            if (a.initiative === undefined) return 1;
            if (b.initiative === undefined) return -1;
            return b.initiative - a.initiative;
        });

        const self = this;

        const initiativeList = $("<div id='initiative-list'></div>");

        for(let i=0; i<this.data.length; i++) {
            const actor = this.data[i];
            const initiativeItem = $(`<div class='initiative-actor' data-uuid="${actor.uuid}"></div>`);
            if (actor.owners === undefined) actor.owners = [];
            // const active = this.active === i ? $(`<div style='width:20px;'><i class='fas fa-chevron-right'></i></div>`) : $("<div style='width:20px;'></div>");
            if (this.active === i) initiativeItem.addClass("initiative-selected");
            const repr = actor.has_img
                ? $(`<img src="${actor.src}" width="30px" height="30px" style="grid-column-start: img">`)
                : $(`<span style='grid-column-start: img'>${actor.src}</span>`);
            const val = $(`<input type="text" placeholder="value" value="${actor.initiative}" style="grid-column-start: value">`);
            const visible = $(`<div><i class="fas fa-eye"></i></div>`);
            const group = $(`<div><i class="fas fa-users"></i></div>`);
            const remove = $(`<div style="grid-column-start: remove"><i class="fas fa-trash-alt"></i></div>`);

            visible.css("opacity", actor.visible ? "1.0" : "0.3");
            group.css("opacity", actor.group ? "1.0" : "0.3");
            if (!actor.owners.includes(Settings.username) && !Settings.IS_DM) {
                val.prop("disabled", "disabled");
                remove.css("opacity", "0.3");
            }

            initiativeItem.append(repr).append(val).append(visible).append(group).append(remove);
            initiativeList.append(initiativeItem);

            val.on("change", function () {
                const d = self.data.find(d => d.uuid === $(this).parent().data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog change unknown uuid?");
                    return;
                }
                d.initiative = parseInt(<string>$(this).val()) || 0;
                self.addInitiative(d, true);
            });

            visible.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).parent().data('uuid'))!;
                if (d === undefined) {
                    console.log("Initiativedialog visible unknown uuid?");
                    return;
                }
                if (!d.owners.includes(Settings.username) && !Settings.IS_DM)
                    return;
                d.visible = !d.visible;
                if (d.visible)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                socket.emit("updateInitiative", d);
            });

            group.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).parent().data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog group unknown uuid?");
                    return;
                }
                if (!d.owners.includes(Settings.username) && !Settings.IS_DM)
                    return;
                d.group = !d.group;
                if (d.group)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                socket.emit("updateInitiative", d);
            });

            remove.on("click", function () {
                const uuid = $(this).parent().data('uuid');
                const d = self.data.find(d => d.uuid === uuid);
                if (d === undefined) {
                    console.log("Initiativedialog remove unknown uuid?");
                    return;
                }
                if (!d.owners.includes(Settings.username) && !Settings.IS_DM)
                    return;
                $(`[data-uuid=${uuid}]`).remove();
                self.removeInitiative(uuid, true, true);
            });
        }

        const initiativeBar = $(`<div id='initiative-bar'></div>`);

        const nextTurn = $(`<div id='initiative-next'>Next</div>`);

        nextTurn.on("click", function() { self.nextRound() });

        initiativeBar.append(nextTurn);

        gameManager.initiativeDialog.append(initiativeList).append(initiativeBar);
    }

    nextRound() {
        this.active = ++this.active % this.data.length;
        this.redraw();
    }
}