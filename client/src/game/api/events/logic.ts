import { POSITION, useToast } from "vue-toastification";

import type { LogicRequestInfo } from "../../../apiTypes";
import { getLocalId } from "../../id";
import { doorSystem } from "../../systems/logic/door";
import { Access } from "../../systems/logic/models";
// eslint-disable-next-line import/default
import LogicRequestHandlerToast from "../../ui/toasts/LogicRequestHandlerToast.vue";
import { socket } from "../socket";

const toast = useToast();

socket.on("Logic.Request", (data: LogicRequestInfo) => {
    if (data.request.logic === "door") {
        const doorId = getLocalId(data.request.door);
        if (doorId === undefined) return;
        const canUse = doorSystem.canUse(doorId);
        if (canUse === Access.Enabled) {
            doorSystem.toggleDoor(doorId);
            return;
        } else if (canUse === Access.Disabled) {
            return;
        }
    }
    toast.info(
        { component: LogicRequestHandlerToast, props: { data } },
        {
            timeout: 30_000,
            position: POSITION.TOP_RIGHT,
            closeOnClick: false,
        },
    );
});

socket.on("Logic.Request.Declined", () => {
    toast.error("Request declined by DM", {
        position: POSITION.TOP_RIGHT,
    });
});
