import { HAS_WORKER } from "../supported";
import type { DomMessages } from "../types";

type Keys = DomMessages["msg"];
type TypeForKey<K extends Keys> = Extract<DomMessages, { msg: K }>;
export async function postUi<T extends Keys, X extends TypeForKey<T>>(msg: T, options: X["options"]): Promise<void> {
    if (HAS_WORKER) {
        // Happy flow, call the main thread
        postMessage({ msg, options });
    } else if (h === undefined) {
        // Load callback handlers on main thread
        // We don't want to load these by default as they should not be used on the main thread in a webworker context.
        h = await import("./handlers");
        await h.handleMessage({ msg, options } as DomMessages);
    } else {
        // Callback handlers have been loaded already
        await h?.handleMessage({ msg, options } as DomMessages);
    }
}

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let h: typeof import("./handlers") | undefined = undefined;
