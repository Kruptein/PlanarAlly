import type { RouteParams } from "vue-router";

import { postRender } from "../messages/render";
import { HAS_WORKER } from "../messages/supported";

import { startRenderWorker } from "./worker";

export function startGameFromDom(params: RouteParams): void {
    if (HAS_WORKER) {
        startRenderWorker(params);
    }
    postRender("Game.Start", { params });
}

export function stopGameFromDom(): void {
    postRender("Game.Stop", {});
}
