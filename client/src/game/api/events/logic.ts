import { POSITION, useToast } from "vue-toastification";

import type { RequestTypeResponse } from "../../systems/logic/models";
import LogicRequestHandlerToast from "../../ui/toasts/LogicRequestHandlerToast.vue";
import { socket } from "../socket";

const toast = useToast();

socket.on("Logic.Request", (data: RequestTypeResponse) => {
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
