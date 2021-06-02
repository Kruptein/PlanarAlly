<script lang="ts">
import { defineComponent, nextTick, onMounted, ref, watch } from "vue";

export default defineComponent({
    props: {
        colour: { type: String, default: "white" },
        mask: { type: Boolean, default: true },
        visible: { type: Boolean, required: true },
    },
    emits: ["close"],
    setup(props, { emit }) {
        const container = ref<HTMLDivElement | null>(null);

        let positioned = false;
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let screenX = 0;
        let screenY = 0;

        function close(): void {
            emit("close");
        }

        function positionCheck(): void {
            if (props.visible && !positioned) {
                nextTick(() => updatePosition());
            }
        }
        onMounted(() => positionCheck());
        watch(
            () => props.visible,
            () => positionCheck(),
        );

        function updatePosition(): void {
            if (container.value === undefined) return;
            if (!positioned) {
                if (container.value!.offsetWidth === 0 && container.value!.offsetHeight === 0) return;
                container.value!.style.left = (window.innerWidth - container.value!.offsetWidth) / 2 + "px";
                container.value!.style.top = (window.innerHeight - container.value!.offsetHeight) / 2 + "px";
                positioned = true;
            }
        }

        function dragStart(event: DragEvent): void {
            if (event === null || event.dataTransfer === null) return;
            event.dataTransfer.setData("Hack", "");
            // Because the drag event is happening on the header, we have to change the drag image
            // in order to give the impression that the entire modal is dragged.
            event.dataTransfer.setDragImage(container.value!, event.offsetX, event.offsetY);
            offsetX = event.offsetX;
            offsetY = event.offsetY;
            screenX = event.screenX;
            screenY = event.screenY;
            dragging = true;
        }

        function dragEnd(event: DragEvent): void {
            dragging = false;
            let left = event.clientX - offsetX;
            let top = event.clientY - offsetY;
            if (event.clientX === 0 && event.clientY === 0 && event.pageX === 0 && event.pageY === 0) {
                left = parseInt(container.value!.style.left, 10) - (screenX - event.screenX);
                top = parseInt(container.value!.style.top, 10) - (screenY - event.screenY);
            }
            if (left < 0) left = 0;
            if (left > window.innerWidth - 100) left = window.innerWidth - 100;
            if (top < 0) top = 0;
            if (top > window.innerHeight - 100) top = window.innerHeight - 100;
            container.value!.style.left = left + "px";
            container.value!.style.top = top + "px";
            container.value!.style.display = "block";
        }

        function dragOver(_event: DragEvent): void {
            if (dragging && container.value) container.value.style.display = "none";
        }

        return { close, container, dragEnd, dragOver, dragStart };
    },
});
</script>

<template>
    <div ref="test"></div>
    <transition name="modal">
        <div
            class="mask"
            :class="{ 'modal-mask': mask, 'dialog-mask': !mask }"
            @click="close"
            v-show="visible"
            @dragover.prevent="dragOver"
        >
            <div class="modal-container" @click.stop ref="container" :style="{ 'background-color': colour }">
                <slot name="header" :dragStart="dragStart" :dragEnd="dragEnd"></slot>
                <slot></slot>
            </div>
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
