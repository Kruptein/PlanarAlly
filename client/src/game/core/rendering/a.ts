import type { Ref } from "vue";
import { ref } from "vue";

export interface UseRafFnCallbackArguments {
    /**
     * Time elapsed between this and the last frame.
     */
    delta: number;

    /**
     * Time elapsed since the creation of the web page. See {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp#the_time_origin Time origin}.
     */
    timestamp: DOMHighResTimeStamp;
}

/**
 * Call function on every `requestAnimationFrame`. With controls of pausing and resuming.
 *
 * @see https://vueuse.org/useRafFn
 * @param fn
 * @param options
 */
export function useRafFn(fn: (args: UseRafFnCallbackArguments) => void): void {
    const isActive = ref(false);
    let previousFrameTimestamp = 0;

    function loop(timestamp: DOMHighResTimeStamp): void {
        if (!isActive.value) return;

        const delta = timestamp - previousFrameTimestamp;
        fn({ delta, timestamp });

        previousFrameTimestamp = timestamp;
        requestAnimationFrame(loop);
    }

    //   function resume() {
    //     if (!isActive.value && window) {
    //       isActive.value = true
    //       rafId = window.requestAnimationFrame(loop)
    //     }
    //   }

    //   function pause() {
    //     isActive.value = false
    //     if (rafId != null && window) {
    //       window.cancelAnimationFrame(rafId)
    //       rafId = null
    //     }
    //   }

    //   if (immediate)
    // resume()
    isActive.value = true;
    requestAnimationFrame(loop);

    //   tryOnScopeDispose(pause)

    //   return {
    // isActive: readonly(isActive),
    // pause,
    // resume,
    //   }
}

export function useFps(): Ref<number> {
    const fps = ref(0);
    const every = 30;

    let last = performance.now();
    let ticks = 0;

    useRafFn(() => {
        ticks += 1;
        if (ticks >= every) {
            const now = performance.now();
            const diff = now - last;
            fps.value = Math.round(1000 / (diff / ticks));
            last = now;
            ticks = 0;
        }
    });

    return fps;
}
