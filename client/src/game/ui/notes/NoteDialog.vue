<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, type Ref } from "vue";
import VueMarkdown from "vue-markdown-render";

import Modal from "../../../core/components/modals/Modal.vue";
import { modalSystem } from "../../systems/modals";
import type { ModalIndex } from "../../systems/modals/types";
import { noteState } from "../../systems/notes/state";

const props = defineProps<{ modalIndex: ModalIndex; uuid: string }>();
defineExpose({ close });

const collapsed = reactive({ active: false, width: 0, height: 0 });
const modal = ref<{ container: Ref<HTMLDivElement> } | null>(null);

const note = noteState.reactive.notes.get(props.uuid);

onMounted(() => {
    if (modal.value) {
        const container = modal.value.container;
        container.addEventListener("scroll", scrollHandler);
        // Put an initial size limit, it can be resized manually afterwards
        if ((100 * container.offsetWidth) / window.innerWidth > 30) {
            container.style.width = "30vw";
        }
        if ((100 * container.offsetHeight) / window.innerHeight > 30) {
            container.style.height = "40vh";
        }
    }
});

onUnmounted(() => {
    if (modal.value) {
        modal.value.container.removeEventListener("scroll", scrollHandler);
    }
});

function scrollHandler(): void {
    if (!modal.value) return;
    const header = modal.value.container.getElementsByTagName("header")[0]!;
    if (modal.value.container.scrollTop > 0) {
        header.style.boxShadow = "0 0 0.5rem black";
    } else {
        header.style.boxShadow = "none";
    }
}

async function collapse(): Promise<void> {
    if (!modal.value) return;
    const container = modal.value.container;

    // Keep track of original dimensions as they can be resized manually
    collapsed.height = container.offsetHeight;
    collapsed.width = container.offsetWidth;

    // Ensure that the right side remains in the same place
    // It makes more sense that collapse/expand remain in the same place
    const right = container.offsetLeft + container.offsetWidth;
    container.style.height = "auto";
    container.style.width = "auto";
    collapsed.active = true;

    await nextTick(() => {
        container.style.left = right - container.offsetWidth + "px";
    });
}

function expand(): void {
    if (!modal.value) return;
    const container = modal.value.container;

    // Ensure that the right side remains in the same place
    container.style.left = container.offsetLeft + container.offsetWidth - collapsed.width + "px";
    container.style.height = `${collapsed.height}px`;
    container.style.width = `${collapsed.width}px`;

    collapsed.active = false;
}

function close(): void {
    modalSystem.close(props.modalIndex, true);
}
</script>

<template>
    <Modal v-if="note !== undefined" ref="modal" :visible="true" :mask="false" @close="close">
        <template #header="m">
            <header draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ note.title }}</div>

                <font-awesome-icon
                    v-if="collapsed.active"
                    class="close-note"
                    :icon="['far', 'square-plus']"
                    @click="expand"
                />
                <font-awesome-icon v-else :icon="['far', 'square-minus']" @click="collapse" />
                <font-awesome-icon :icon="['far', 'window-close']" @click="close" />
            </header>
        </template>

        <div v-if="!collapsed.active" class="note-body">
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
    overflow: auto;
}

header {
    display: flex;
    padding: 1.5rem 2rem;
    padding-right: 0.5rem;
    position: sticky;
    top: 0;
    background-color: white;

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

    svg {
        font-size: 1.25rem;
        margin-left: 0.25rem;
    }
}

.note-body {
    padding: 1.5rem 2rem;
    padding-top: 0;
}
</style>
