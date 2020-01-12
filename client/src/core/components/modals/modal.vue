<template>
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

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

@Component
export default class Modal extends Vue {
    @Prop(Boolean) visible!: boolean;
    @Prop({ type: Boolean, default: true }) mask!: boolean;
    @Prop({ type: String, default: "white" }) colour!: string;

    $refs!: {
        container: HTMLElement;
    };

    positioned = false;
    offsetX = 0;
    offsetY = 0;
    screenX = 0;
    screenY = 0;
    dragging = false;

    // Example of mounted required: opening note
    mounted(): void {
        this.updatePosition();
    }
    // Example of updated required: opening initiative
    updated(): void {
        this.updatePosition();
    }

    close(_event: MouseEvent): void {
        this.$emit("close");
    }
    updatePosition(): void {
        if (!this.positioned) {
            const container = <any>this.$refs.container;
            if (container.offsetWidth === 0 && container.offsetHeight === 0) return;
            this.$refs.container.style.left = (window.innerWidth - container.offsetWidth) / 2 + "px";
            this.$refs.container.style.top = (window.innerHeight - container.offsetHeight) / 2 + "px";
            this.positioned = true;
        }
    }
    dragStart(event: DragEvent): void {
        if (event === null || event.dataTransfer === null) return;
        event.dataTransfer.setData("Hack", "");
        // Because the drag event is happening on the header, we have to change the drag image
        // in order to give the impression that the entire modal is dragged.
        event.dataTransfer.setDragImage(<Element>this.$refs.container, event.offsetX, event.offsetY);
        this.offsetX = event.offsetX;
        this.offsetY = event.offsetY;
        this.screenX = event.screenX;
        this.screenY = event.screenY;
        this.dragging = true;
    }
    dragEnd(event: DragEvent): void {
        this.dragging = false;
        let left = event.clientX - this.offsetX;
        let top = event.clientY - this.offsetY;
        if (event.clientX === 0 && event.clientY === 0 && event.pageX === 0 && event.pageY === 0) {
            left = parseInt(this.$refs.container.style.left!, 10) - (this.screenX - event.screenX);
            top = parseInt(this.$refs.container.style.top!, 10) - (this.screenY - event.screenY);
        }
        if (left < 0) left = 0;
        if (left > window.innerWidth - 100) left = window.innerWidth - 100;
        if (top < 0) top = 0;
        if (top > window.innerHeight - 100) top = window.innerHeight - 100;
        this.$refs.container.style.left = left + "px";
        this.$refs.container.style.top = top + "px";
        this.$refs.container.style.display = "block";
    }
    dragOver(_event: DragEvent): void {
        if (this.dragging) this.$refs.container.style.display = "none";
    }
}
</script>

<style scoped>
.hide {
    display: none;
}

.mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.dialog-mask {
    pointer-events: none;
}

.modal-mask {
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
    font-family: Helvetica, Arial, sans-serif;
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
