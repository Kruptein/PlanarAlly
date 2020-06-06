<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import VueMarkdown from "vue-markdown";
import { Prop } from "vue-property-decorator";

import Modal from "@/core/components/modals/modal.vue";

@Component({
    components: {
        Modal,
        VueMarkdown,
    },
})
export default class MarkdownModal extends Vue {
    @Prop(String) title!: string;

    visible = true;

    close(): void {
        this.visible = false;
    }
}
</script>

<template>
    <Modal :visible="visible" @close="close">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>{{ title }}</div>
            <div class="header-close" @click="close" :title="$t('common.close')">
                <i aria-hidden="true" class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body">
            <vue-markdown>
                <slot></slot>
            </vue-markdown>
        </div>
    </Modal>
</template>

<style scoped>
.modal-header {
    color: white;
    background-color: #7c253e;
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
    max-height: 50vh;
    max-width: 35vw;
    overflow-y: scroll;
    padding: 30px;
    display: flex;
    justify-content: space-between;
}
</style>
