import { renderWorker } from "../../dom/worker/instance";
import { HAS_WORKER } from "../supported";
import type { WorkerMessages } from "../types";

type Keys = WorkerMessages["msg"];
type TypeForKey<K extends Keys> = Extract<WorkerMessages, { msg: K }>;
export async function postRender<T extends Keys, X extends TypeForKey<T>>(
    msg: T,
    options: X["options"],
    transfer?: (Transferable | OffscreenCanvas)[],
): Promise<void> {
    if (HAS_WORKER) {
        // Happy flow, call the webworker
        renderWorker?.postMessage({ msg, options }, transfer);
    } else if (h === undefined) {
        // Load callback handlers on main thread
        // We don't want to load these by default as they should not be used on the main thread in a webworker context.
        h = await import("./handlers");
        await h.handleMessage({ msg, options } as WorkerMessages);
    } else {
        // Callback handlers have been loaded already
        await h?.handleMessage({ msg, options } as WorkerMessages);
    }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let h: typeof import("./handlers") | undefined = undefined;
