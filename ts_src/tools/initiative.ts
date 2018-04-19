import { InitiativeData } from "../api_types";
import gameManager from "../planarally";
import socket from "../socket";

export class InitiativeTracker {
    data: InitiativeData[] = [];
    clear() {
        this.data = [];
        this.redraw();
    }
    addInitiative(data: InitiativeData, sync: boolean) {
        // Open the initiative tracker if it is not currently open.
        if (this.data.length === 0 || !gameManager.initiativeDialog.dialog("isOpen"))
            gameManager.initiativeDialog.dialog("open");
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

            val.on("change", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog change unknown uuid?");
                    return;
                }
                d.initiative = parseInt(<string>$(this).val()) || 0;
                self.addInitiative(d, true);
            });

            visible.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'))!;
                if (d === undefined) {
                    console.log("Initiativedialog visible unknown uuid?");
                    return;
                }
                if (!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                    return;
                d.visible = !d.visible;
                if (d.visible)
                    $(this).css("opacity", 1.0);
                else
                    $(this).css("opacity", 0.3);
                socket.emit("updateInitiative", d);
            });

            group.on("click", function () {
                const d = self.data.find(d => d.uuid === $(this).data('uuid'));
                if (d === undefined) {
                    console.log("Initiativedialog group unknown uuid?");
                    return;
                }
                if (!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
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
                if (!d.owners.includes(gameManager.username) && !gameManager.IS_DM)
                    return;
                $(`[data-uuid=${uuid}]`).remove();
                self.removeInitiative(uuid, true, true);
            });
        });
    };
}