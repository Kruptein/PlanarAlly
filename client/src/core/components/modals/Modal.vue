<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";

import WindowPortal from "../../../core/components/WindowPortal.vue";
import type { ModalIndex } from "../../../game/systems/modals/types";
import { clearDropCallback, registerDropCallback } from "../../../game/ui/firefox";

const props = withDefaults(
    defineProps<{
        colour?: string;
        mask?: boolean;
        visible: boolean;
        rightHanded?: boolean;
        modalIndex?: ModalIndex;
        // Extra class to add to the modal container
        // This can be useful when a :deep cannot be used due to
        // e.g. windowed modals no longer having the correct child chain
        extraClass?: string;
    }>(),
    {
        colour: "white",
        mask: true,
        // This changes the modal to use `right:` positioning instead of the default usage of left.
        // This is mostly useful for modals that can change size and need to remain aligned to their right side.
        // important to note however is that native resize behaviour will not work properly with this.
        // (see NoteDialog for a left-handed component that remains right aligned when resized)
        rightHanded: false,
        modalIndex: undefined,
        extraClass: "",
    },
);
const emit = defineEmits<{
    (e: "close" | "focus"): void;
    (e: "window-toggle", value: boolean): void;
}>();

const container = ref<HTMLDivElement | null>(null);

defineExpose({ container });

let positioned = false;
let dragging = false;
let offsetX = 0;
let offsetY = 0;
let screenX = 0;
let screenY = 0;

let containerX = 0;
let containerY = 0;
let containerWidth = 0;

function close(): void {
    emit("close");
}

async function positionCheck(): Promise<void> {
    if (props.visible && !positioned) {
        await nextTick(() => updatePosition());
    }
}

function setHorizontalAxis(left: number): void {
    if (props.rightHanded) {
        container.value!.style.right = `${window.innerWidth - (left + containerWidth)}px`;
    } else {
        container.value!.style.left = `${left}px`;
    }
}

function checkBounds(): void {
    if (containerX > window.innerWidth - 100) {
        containerX = window.innerWidth - 100;
        setHorizontalAxis(containerX);
    }
    if (containerY > window.innerHeight - 100) {
        containerY = window.innerHeight - 100;
        container.value!.style.top = `${containerY}px`;
    }
}

onMounted(async () => {
    window.addEventListener("resize", checkBounds);
    await positionCheck();
});
onUnmounted(() => window.removeEventListener("resize", checkBounds));
watch(
    () => props.visible,
    () => positionCheck(),
);
watchEffect(() => {
    if (props.visible) {
        emit("focus");
    }
});

function updatePosition(): void {
    const c = container.value;
    if (c === null || positioned) return;
    if (c.offsetWidth === 0 && c.offsetHeight === 0) return;

    containerX = (window.innerWidth - c.offsetWidth) / 2;
    containerY = (window.innerHeight - c.offsetHeight) / 2;
    containerWidth = c.offsetWidth;

    setHorizontalAxis(containerX);
    c.style.top = `${containerY}px`;
    positioned = true;
}

function dragStart(event: DragEvent): void {
    if (event === null || event.dataTransfer === null) return;

    emit("focus");

    registerDropCallback(dragEnd);
    event.dataTransfer.setData("Hack", "");
    // Because the drag event is happening on the header, we have to change the drag image
    // in order to give the impression that the entire modal is dragged.
    // If the modal container is scrolled we need some extra math to get the correct offset.
    let imageOffsetY = event.offsetY;
    if (container.value!.scrollTop > 0) {
        imageOffsetY += container.value!.scrollTop - (event.target as HTMLElement).offsetHeight;
    }
    event.dataTransfer.setDragImage(container.value!, event.offsetX, imageOffsetY);
    offsetX = event.offsetX;
    offsetY = event.offsetY;
    screenX = event.screenX;
    screenY = event.screenY;
    containerWidth = container.value!.offsetWidth;
    dragging = true;
}

function dragEnd(event: DragEvent): void {
    if (dragging) {
        dragging = false;
        clearDropCallback();
        containerX = event.clientX - offsetX;
        containerY = event.clientY - offsetY;
        const box = container.value!.getBoundingClientRect();
        if (event.clientX === 0 && event.clientY === 0 && event.pageX === 0 && event.pageY === 0) {
            containerX = box.left - (screenX - event.screenX);
            containerY = box.top - (screenY - event.screenY);
        }
        if (containerX < 0) containerX = 0;
        if (containerX > window.innerWidth - 100) containerX = window.innerWidth - 100;
        if (containerY < 0) containerY = 0;
        if (containerY > window.innerHeight - 100) containerY = window.innerHeight - 100;

        setHorizontalAxis(containerX);
        container.value!.style.top = `${containerY}px`;
        container.value!.style.display = "block";
    }
}

function dragOver(_event: DragEvent): void {
    if (dragging && container.value) container.value.style.display = "none";
}

// Windowed mode

const windowed = ref(false);
const preWindowState = { left: "", top: "" };
function toggleWindow(): void {
    if (!container.value) return;

    windowed.value = !windowed.value;
    emit("window-toggle", windowed.value);

    if (windowed.value) {
        preWindowState.left = container.value.style.left;
        preWindowState.top = container.value.style.top;
        container.value.style.left = "0.4rem";
        container.value.style.top = "0.4rem";
    } else {
        container.value.style.left = preWindowState.left;
        container.value.style.top = preWindowState.top;
    }
}
</script>

<template>
    <transition name="modal">
        <div
            v-show="visible"
            class="mask"
            :class="{ 'modal-mask': mask, 'dialog-mask': !mask }"
            @click="close"
            @dragover.prevent="dragOver"
        >
            <WindowPortal :visible="windowed" :modal-index="props.modalIndex">
                <div
                    ref="container"
                    class="modal-container"
                    :class="extraClass"
                    :style="{ backgroundColor: colour }"
                    @click.stop="emit('focus')"
                >
                    <slot
                        name="header"
                        :drag-start="dragStart"
                        :drag-end="dragEnd"
                        :toggle-window="toggleWindow"
                    ></slot>
                    <slot></slot>
                </div>
            </WindowPortal>
        </div>
    </transition>
</template>

<style scoped>
.hide {
    display: none;
}

.mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.dialog-mask {
    pointer-events: none;
}

.modal-mask {
    pointer-events: all;
    background-color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
}

/* Use a layer to ensure components can override these styles when passing an extraClass */
@layer base-modals {
    .modal-container {
        pointer-events: auto;
        position: absolute;
        width: auto;
        height: auto;
        border-radius: 2px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
        font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande",
            sans-serif;
    }
}

.modal-enter {
    opacity: 0;
}

.modal-leave-active {
    opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
}
</style>
