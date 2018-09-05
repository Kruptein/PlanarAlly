<template>
    <transition name="modal">
        <div class="modal-mask" @click="close" v-show="visible" @dragover='dragOver'>
            <div
                class="modal-container"
                @click.stop
                ref="container"
            >
            <slot name='header' :dragStart='dragStart' :dragEnd='dragEnd'></slot>
            <slot></slot>
            </div>
        </div>
    </transition>
</template>


<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: ["visible"],
    data: () => ({
        positioned: false,
        offsetX: 0,
        offsetY: 0,
    }),
    // Example of mounted required: opening note
    mounted() {
        this.updatePosition();
    },
    // Example of updated required: opening initiative
    updated() {
        this.updatePosition();
    },
    methods: {
        close(event: MouseEvent) {
            this.$emit("close");
        },
        updatePosition() {
            if (!this.positioned) {
                const container = <any>this.$refs.container;
                if (container.offsetWidth === 0 && container.offsetHeight === 0) return;
                (<any>this.$refs.container).style.left = (window.innerWidth - container.offsetWidth) / 2 + "px";
                (<any>this.$refs.container).style.top = (window.innerHeight - container.offsetHeight) / 2 + "px";
                this.positioned = true;
            }
        },
        dragStart(event: DragEvent) {
            // Because the drag event is happening on the header, we have to change the drag image
            // in order to give the impression that the entire modal is dragged.
            event.dataTransfer.setDragImage(<Element>this.$refs.container, event.offsetX, event.offsetY);
            this.offsetX = event.offsetX;
            this.offsetY = event.offsetY;
        },
        dragEnd(event: DragEvent) {
            (<any>this.$refs.container).style.left = event.clientX - this.offsetX + "px";
            (<any>this.$refs.container).style.top = event.clientY - this.offsetY + "px";
            (<any>this.$refs.container).style.display = "block";
        },
        dragOver(event: DragEvent) {
            (<any>this.$refs.container).style.display = "none";
        },
    },
});
</script>

<style scoped>
.hide {
    display: none;
}

.modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
}

.modal-container {
    position: absolute;
    width: auto;
    height: auto;
    background-color: #fff;
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