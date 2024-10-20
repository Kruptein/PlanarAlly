<script setup lang="ts">
/**
 * This component is adapted from https://stackoverflow.com/questions/49657462/open-a-vuejs-component-on-a-new-window/58534753#58534753
 */

import { nextTick, onMounted, onBeforeUnmount, ref, watch } from "vue";

import { modalState } from "../../game/systems/modals/state";
import type { ModalIndex } from "../../game/systems/modals/types";

const props = defineProps<{ modalIndex?: ModalIndex; visible: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

let windowRef: Window | null = null;
let originalParent: HTMLElement | null = null;
const portal = ref<HTMLElement | null>(null);

const copyStyles = (sourceDoc: Document, targetDoc: Document): void => {
    for (const styleSheet of Array.from(sourceDoc.styleSheets)) {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (styleSheet.cssRules) {
            // for <style> elements
            const nwStyleElement = sourceDoc.createElement("style");

            for (const cssRule of Array.from(styleSheet.cssRules)) {
                // write the text of each rule into the body of the style element
                nwStyleElement.append(sourceDoc.createTextNode(cssRule.cssText));
            }

            targetDoc.head.append(nwStyleElement);
        } else if (styleSheet.href !== null) {
            // for <link> elements loading CSS from a URL
            const nwLinkElement = sourceDoc.createElement("link");

            nwLinkElement.rel = "stylesheet";
            nwLinkElement.href = styleSheet.href;
            targetDoc.head.append(nwLinkElement);
        }
    }
};

const openPortal = async (): Promise<void> => {
    if (props.modalIndex) {
        // When popped out, we no longer care about focus order for this modal,
        // so we track this
        modalState.mutableReactive.poppedModals.add(props.modalIndex);
    }

    await nextTick();

    const height = portal.value?.children[0]?.clientHeight ?? 0;
    const width = portal.value?.children[0]?.clientWidth ?? 0;

    // We add 2 times 0.4 * 16px as we use 0.4rem as a small offset (see Modal.vue)
    windowRef = window.open("", "", `popup=true,height=${height + 0.8 * 16}px,width=${width + 0.8 * 16}px`);
    if (!windowRef || portal.value === null) return;

    originalParent = portal.value.parentElement;

    // Append the portal to the new window, removing it from the old one
    windowRef.document.body.append(portal.value);

    // Ensure CSS is up to date
    copyStyles(window.document, windowRef.document);

    // Close the portal when the parent window closes and when the portal itself is closed
    window.addEventListener("beforeunload", closePortal);
    windowRef.addEventListener("beforeunload", closePortal);
};

const closePortal = (): void => {
    if (props.modalIndex) {
        modalState.mutableReactive.poppedModals.delete(props.modalIndex);
    }
    if (windowRef) {
        windowRef.close();
        windowRef = null;
        emit("close");
    }
};

watch(props, async () => {
    if (props.visible) {
        await openPortal();
    } else {
        if (originalParent) {
            originalParent.append(portal.value!);
        }
        closePortal();
    }
});

onMounted(async () => {
    if (props.visible) {
        await openPortal();
    }
});
onBeforeUnmount(() => {
    if (windowRef) {
        closePortal();
    }
});
</script>

<template>
    <div ref="portal">
        <slot />
    </div>
</template>
