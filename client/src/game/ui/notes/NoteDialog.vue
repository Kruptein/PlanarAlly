<script setup lang="ts">
import { ref, onMounted, type Ref } from "vue";
import VueMarkdown from "vue-markdown-render";

import Modal from "../../../core/components/modals/Modal.vue";
import { modalSystem } from "../../systems/modals";
import type { ModalIndex } from "../../systems/modals/types";
import { noteState } from "../../systems/notes/state";

const props = defineProps<{ modalIndex: ModalIndex; uuid: string }>();
defineExpose({ close });

const modal = ref<{ container: Ref<HTMLDivElement> } | null>(null);

const note = noteState.reactive.notes.get(props.uuid);

onMounted(() => {
    if (modal.value) {
        const container = modal.value.container;
        if ((100 * container.offsetWidth) / window.innerWidth > 30) {
            container.style.width = "30vw";
        }
        if ((100 * container.offsetHeight) / window.innerHeight > 30) {
            container.style.height = "40vh";
        }
    }
});

function close(): void {
    modalSystem.close(props.modalIndex, true);
}
</script>

<template>
    <Modal v-if="note !== undefined" ref="modal" :visible="true" :mask="false" @close="close">
        <template #header="m">
            <header draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ note.title }}</div>
            </header>
        </template>

        <font-awesome-icon class="close-note" :icon="['far', 'window-close']" @click="close" />
        <div class="note-body">
            <VueMarkdown :source="note.text" :options="{ html: true }" />
        </div>
    </Modal>
</template>

<style scoped lang="scss">
:deep(.modal-container) {
    display: flex;
    flex-direction: column;

    border-radius: 1rem;
    resize: both;

    min-width: 5rem;
    min-height: 5rem;
    // width: min(auto, 30vw);
    overflow: auto;

    .close-note {
        position: absolute;

        top: 0.75rem;
        right: 0.75rem;

        font-size: 1.25rem;
    }
}

header {
    display: flex;
    padding: 1.5rem 2rem;

    &:hover {
        cursor: move;
    }

    > :first-child {
        flex-grow: 1;
        margin-right: 1rem;
        border-bottom: solid 1px black;
        font-weight: bold;
        font-size: 1.75em;
    }
}

.note-body {
    padding: 1.5rem 2rem;
    padding-top: 0;
}
</style>
