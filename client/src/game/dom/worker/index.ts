import type { RouteParams } from "vue-router";

import { coreStore } from "../../../store/core";
import { postRender } from "../../messages/render";
import type { DomMessages } from "../../messages/types";
import { handleMessage } from "../../messages/ui/handlers";

import { setWorker } from "./instance";

export function startRenderWorker(params: RouteParams): void {
    const worker = new Worker(new URL("../../webworker/renderWorker", import.meta.url), {
        type: "module",
    });
    worker.onmessage = (e: MessageEvent<DomMessages>) => {
        handleMessage(e.data).catch((e) => console.error(e));
    };
    setWorker(worker);
    // todo fix
    void postRender("username", { username: coreStore.state.username });
}
