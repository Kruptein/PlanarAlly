<template>
    <Modal ref="modal" :visible="visible" :colour="'rgba(255, 255, 255, 0.8)'" @close="close" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>{{ displayTitle || title }}</div>
            <div class="header-close" @click="close">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body" @click="handleClick">
            <slot></slot>
        </div>
    </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import InputCopyElement from "@/core/components/inputCopy.vue";
import Modal from "@/core/components/modals/modal.vue";
import { modalsStore } from "@/core/components/modals/store";

import { EventBus } from "@/game/event-bus";

@Component({
    components: {
        InputCopyElement,
        Modal,
    },
})
export default class CloseableModal extends Vue {
    @Prop({ type: String, required: true }) title!: string;
    @Prop({ type: String, default: undefined }) displayTitle?: string;
    visible = false;

    mounted() {
        EventBus.$on(`${this.title}.Toggle`, () => {
            if (this.visible && modalsStore.topModal === this.$refs.modal) {
                this.close();
            } else {
                this.visible = true;
                modalsStore.setTopModal(this.$refs.modal as Modal);
            }
        });
        EventBus.$on(`${this.title}.Open`, () => {
            this.visible = true;
            modalsStore.setTopModal(this.$refs.modal as Modal);
        });
        EventBus.$on(`${this.title}.Close`, ({ fromModal = false }: { fromModal: boolean }) => {
            if (!fromModal) {
                this.close();
            }
        });
    }

    beforeDestroy() {
        EventBus.$off(`${this.title}.Toggle`);
        EventBus.$off(`${this.title}.Open`);
        EventBus.$off(`${this.title}.Close`);
    }

    handleClick(event: { target: HTMLElement }) {
        const child = event.target.firstElementChild;
        if (child instanceof HTMLInputElement) {
            child.click();
        }
    }
    close() {
        this.visible = false;
        EventBus.$emit(`${this.title}.Close`, { fromModal: true });
        modalsStore.removeFromModals(this.$refs.modal as Modal);
    }
}
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    display: flex;
    flex-direction: row;
}
</style>
