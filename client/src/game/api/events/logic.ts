import { POSITION, useToast } from "vue-toastification";

import type { LogicRequestInfo } from "../../../apiTypes";
import { defined, filter, guard, map } from "../../../core/iter";
import { getLocalId } from "../../id";
import { doorSystem } from "../../systems/logic/door";
import { Access } from "../../systems/logic/models";
import { teleportZoneSystem } from "../../systems/logic/tp";
import { teleport } from "../../systems/logic/tp/core";
// eslint-disable-next-line import/default
import LogicRequestHandlerToast from "../../ui/toasts/LogicRequestHandlerToast.vue";
import { socket } from "../socket";

const toast = useToast();

function showRequestHandler(data: LogicRequestInfo): void {
    toast.info(
        { component: LogicRequestHandlerToast, props: { data } },
        {
            timeout: 30_000,
            position: POSITION.TOP_RIGHT,
            closeOnClick: false,
        },
    );
}

socket.on("Logic.Request", async (data: LogicRequestInfo) => {
    if (data.request.logic === "door") {
        const doorId = getLocalId(data.request.door);
        if (doorId === undefined) return;

        const canUse = doorSystem.canUse(doorId, data.requester);

        if (canUse === Access.Enabled) {
            doorSystem.toggleDoor(doorId);
        } else if (canUse === Access.Request) {
            showRequestHandler(data);
        }
    } else {
        const tpId = getLocalId(data.request.fromZone);
        if (tpId === undefined) return;

        const canUse = teleportZoneSystem.canUse(tpId, data.requester);

        if (canUse === Access.Enabled) {
            const targets = guard(
                filter(
                    map(data.request.transfers, (m) => getLocalId(m)),
                    (i) => i !== undefined,
                ),
                defined,
            );
            await teleport(tpId, data.request.toZone, [...targets]);
        } else if (canUse === Access.Request) {
            showRequestHandler(data);
        }
    }
});

socket.on("Logic.Request.Declined", () => {
    toast.error("Request declined by DM", {
        position: POSITION.TOP_RIGHT,
    });
});
