import { InitiativeData } from "../api_types";
import gameManager from "../planarally";
import socket from "../socket";
import Settings from "../settings";

export class InitiativeTracker {
    data: InitiativeData[] = [];
    active: string | null = null;
    roundCounter: number = 0;
    clear() {
        this.data = [];
        this.active = null;
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
    updateInitiativeOrder(newOrder: string[], sync: boolean) {
        this.data.sort(function (a, b) {
            return newOrder.indexOf(a.uuid) - newOrder.indexOf(b.uuid);
        });
        if (sync)
            socket.emit("updateInitiativeOrder", newOrder);
        this.redraw();
    };
    setRound(active: string|null, sync: boolean) {
        this.active = active;
        if (this.data[0].uuid === active)
            this.roundCounter++;
        if (sync)
            socket.emit("updateInitiativeRound", active);
        this.redraw();
    };
    nextRound() {
        const order = <string[]><any>$(".initiative-actor").map(function() {return $(this).data("uuid");}).get();
        if (this.active === null) {
            if (order.length === 0) return;
            this.active = order[order.length - 1];
        }
        this.setRound(order[(order.indexOf(this.active) + 1) % order.length], true)
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
        if (Settings.IS_DM) {
            initiativeList.sortable({
                axis: 'y',
                containment: 'parent',
                cancel: 'input,svg',
                tolerance: 'pointer',
                update: function (event, ui) {
                    const newOrder = <string[]><any>$(".initiative-actor").map(function() {return $(this).data("uuid");}).get();
                    self.updateInitiativeOrder(newOrder, true);
                }
            });
        }

        for(let i=0; i<this.data.length; i++) {
            const actor = this.data[i];
            const initiativeItem = $(`<div class='initiative-actor' data-uuid="${actor.uuid}"></div>`);
            if (actor.owners === undefined) actor.owners = [];
            // const active = this.active === i ? $(`<div style='width:20px;'><i class='fas fa-chevron-right'></i></div>`) : $("<div style='width:20px;'></div>");
            if (this.active === actor.uuid) initiativeItem.addClass("initiative-selected");
            const repr = actor.has_img
                ? $(`<img src="${actor.src}" width="30px" height="30px">`)
                : $(`<span style='width: auto;'>${actor.src}</span>`);
            const val = $(`<input type="text" placeholder="value" value="${actor.initiative}">`);
            const visible = $(`<div><i class="fas fa-eye"></i></div>`);
            const group = $(`<div><i class="fas fa-users"></i></div>`);
            const remove = $(`<div><i class="fas fa-trash-alt"></i></div>`);

            visible.css("opacity", actor.visible ? "1.0" : "0.3");
            group.css("opacity", actor.group ? "1.0" : "0.3");
            if (!actor.owners.includes(Settings.username) && !Settings.IS_DM) {
                val.prop("disabled", "disabled");
                remove.css("opacity", "0.3");
                val.addClass("notAllowed");
                visible.addClass("notAllowed");
                group.addClass("notAllowed");
                remove.addClass("notAllowed");
            }

            initiativeItem.append(repr).append(val).append(visible).append(group).append(remove);
            initiativeList.append(initiativeItem);

            val.on("change", function () {
                const d = self.data.find(d => d.uuid === $(this).parent().data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog change unknown uuid?");
                    return;
                }
                if (!d.owners.includes(Settings.username) && !Settings.IS_DM)
                    return;
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
                if (self.active === uuid) {
                    if (self.data.length > 1)
                        self.nextRound();
                    else
                        self.active = null;
                }
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

        const roundCounter = $(`<div id='initiative-round'>Round ${this.roundCounter}</div>`);
        const resetRound = $(`<div class='initiative-bar-button'><i class="fas fa-sync-alt"></i></div>`);
        const nextTurn = $(`<div class='initiative-bar-button'><i class="fas fa-chevron-right"></i></div>`);

        if (!Settings.IS_DM) {
            nextTurn.addClass("notAllowed");
            resetRound.addClass("notAllowed");
        } else {
            nextTurn.on("click", function() { self.nextRound() });
            resetRound.on("click", function() {self.roundCounter = 0; self.setRound(self.data[0].uuid, true)})
        }

        initiativeBar.append(roundCounter).append($("<div style='display:flex;'></div>").append(resetRound).append(nextTurn));

        gameManager.initiativeDialog.append(initiativeList).append(initiativeBar);
    }
}