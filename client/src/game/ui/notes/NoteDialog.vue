<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import VueMarkdown from "vue-markdown-render";

import Modal from "../../../core/components/modals/Modal.vue";
import { coreStore } from "../../../store/core";
import { modalSystem } from "../../systems/modals";
import type { ModalIndex } from "../../systems/modals/types";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import { editNote } from "../../systems/notes/ui";

const props = defineProps<{ modalIndex: ModalIndex; uuid: string }>();
defineExpose({ close });

const { t } = useI18n();

const editing = ref(false);
const collapsed = reactive({ active: false, width: 0, height: 0 });
const modal = ref<{ container: Ref<HTMLDivElement> } | null>(null);

const note = noteState.reactive.notes.get(props.uuid);

const canEdit = computed(() => {
    if (!note) return false;
    const username = coreStore.state.username;
    if (note.creator === username) return true;
    return note.access.some((a) => (a.name === username || a.name === "default") && a.can_edit);
});

onMounted(() => {
    if (modal.value) {
        constrainInitialLoadDimensions();

        const container = modal.value.container;
        container.addEventListener("scroll", scrollHandler);

        // Images can change the size of the container after our initial check above
        // so we need to check again after they load
        for (const image of container.getElementsByTagName("img")) {
            image.addEventListener("load", imageLoadHandler);
        }
    }
});

onUnmounted(() => {
    if (modal.value) {
        modal.value.container.removeEventListener("scroll", scrollHandler);
    }
});

function constrainInitialLoadDimensions(): void {
    if (!modal.value) return;

    const container = modal.value.container;
    // If the width is set, it was manually resized already,
    // so we don't want to suddenly change it again if an image was slow to load
    if (container.style.width !== "") return;

    // Put an initial size limit, it can be resized manually afterwards
    if ((100 * container.offsetWidth) / window.innerWidth > 30) {
        container.style.width = "30vw";
    }
    if ((100 * container.offsetHeight) / window.innerHeight > 30) {
        container.style.height = "40vh";
    }
}

function imageLoadHandler(event: Event): void {
    (event.target as HTMLImageElement).removeEventListener("load", imageLoadHandler);
    constrainInitialLoadDimensions();
}

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

function setText(event: Event, sync: boolean): void {
    noteSystem.setText(props.uuid, (event.target as HTMLTextAreaElement).value, sync, !sync);
}

const isWindowed = ref(false);
const previousWindowState = { width: "", height: "" };
function windowToggle(windowed: boolean): void {
    isWindowed.value = windowed;
    if (windowed) {
        previousWindowState.width = modal.value!.container.style.width;
        previousWindowState.height = modal.value!.container.style.height;
        modal.value!.container.style.width = "auto";
        modal.value!.container.style.height = "auto";
    } else {
        modal.value!.container.style.width = previousWindowState.width;
        modal.value!.container.style.height = previousWindowState.height;
    }
}
</script>

<template>
    <Modal
        v-if="note !== undefined"
        ref="modal"
        :visible="true"
        :mask="false"
        :modal-index="props.modalIndex"
        extra-class="note-dialog"
        @close="close"
        @window-toggle="windowToggle"
    >
        <template #header="m">
            <header draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>
                    <div>{{ note.title }}</div>

                    <font-awesome-icon
                        v-if="collapsed.active"
                        class="close-note"
                        :icon="['far', 'square-plus']"
                        @click="expand"
                    />
                    <font-awesome-icon
                        v-else
                        :icon="['far', 'square-minus']"
                        :title="t('game.ui.notes.NoteDialog.collapse')"
                        @click="collapse"
                    />
                    <font-awesome-icon
                        :icon="['far', 'window-restore']"
                        :title="`${isWindowed ? t('game.ui.notes.NoteDialog.restore') : t('game.ui.notes.NoteDialog.pop_out')}`"
                        @click="m.toggleWindow"
                    />
                    <font-awesome-icon
                        :icon="['far', 'window-close']"
                        :title="t('game.ui.notes.NoteDialog.close')"
                        @click="close"
                    />
                </div>
                <div>
                    <div v-if="!editing" @click="editing = true">
                        [{{ canEdit ? t("game.ui.notes.NoteDialog.edit") : t("game.ui.notes.NoteDialog.view_source") }}]
                    </div>
                    <div v-else @click="editing = false">[{{ t("game.ui.notes.NoteDialog.show") }}]</div>
                    <div @click.stop="editNote(uuid)">[{{ t("game.ui.notes.NoteDialog.open_in_manager") }}]</div>
                </div>
            </header>
        </template>

        <div v-if="!collapsed.active" class="note-body">
            <VueMarkdown v-if="!editing" :source="note.text" :options="{ html: true }" />
            <textarea
                v-else
                v-model="note.text"
                :readonly="!canEdit"
                @input="setText($event, false)"
                @change="setText($event, true)"
            />
        </div>
    </Modal>
</template>

<style lang="scss">
.note-dialog {
    display: flex;
    flex-direction: column;

    border-radius: 1rem;
    resize: both;

    min-width: 5rem;
    min-height: 5rem;
    overflow: auto;
}
</style>

<style scoped lang="scss">
header {
    position: sticky;
    top: 0;

    display: flex;
    flex-direction: column;

    padding-top: 1.5rem;
    padding-bottom: 1rem;
    padding-left: 2rem;
    padding-right: 0.5rem;

    background-color: white;

    &:hover {
        cursor: move;
    }

    > div:first-child {
        display: flex;

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

    > div:last-child {
        display: flex;
        margin-top: 0.5rem;

        > div {
            margin-right: 0.5rem;

            &:hover {
                text-decoration: underline;
                cursor: pointer;
            }
        }
    }
}

.note-body {
    padding: 1.5rem 2rem;
    padding-top: 0;
    height: 100%;

    textarea {
        width: 100%;
        height: inherit;
        padding: 0.5rem;
        font-size: 1.2em;
        resize: none;
    }
}
</style>
