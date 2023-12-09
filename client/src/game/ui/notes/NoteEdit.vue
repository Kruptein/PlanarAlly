<script setup lang="ts">
import { computed, onBeforeMount, ref } from "vue";
import VueMarkdown from "vue-markdown-render";

import { useModal } from "../../../core/plugins/modals/plugin";
import { mostReadable } from "../../../core/utils";
import { modalSystem } from "../../systems/modals";
import { noteSystem } from "../../systems/notes";
import { noteState } from "../../systems/notes/state";
import NoteDialog from "../NoteDialog.vue";

import { hasShape } from "./utils";

const emit = defineEmits<(e: "mode", mode: "list" | "map") => void>();

const modals = useModal();

const tabs = ["view", "edit", "_", "settings"] as const;
const activeTab = ref<(typeof tabs)[number]>("view");

const note = computed(() => noteState.reactive.notes.get(noteState.reactive.currentNote!));

onBeforeMount(() => {
    if (noteState.reactive.currentNote === undefined) emit("mode", "list");
});

function setTitle(event: Event): void {
    if (!note.value) return;
    noteSystem.setTitle(note.value.uuid, (event.target as HTMLInputElement).value, true);
}

function setText(event: Event): void {
    if (!note.value) return;
    noteSystem.setText(note.value.uuid, (event.target as HTMLTextAreaElement).value, true);
}

async function addTag(): Promise<void> {
    if (!note.value) return;
    const answer = await modals.prompt("Enter the name of the tag to add.", "New tag");
    if (answer !== undefined && answer.length > 0) await noteSystem.addTag(note.value.uuid, answer, true);
}

function removeTag(tag: string): void {
    if (!note.value) return;
    noteSystem.removeTag(note.value.uuid, tag, true);
}

function popout(): void {
    if (!note.value) return;
    modalSystem.addModal({
        component: NoteDialog,
        props: { uuid: note.value.uuid },
    });
}

async function remove(): Promise<void> {
    if (!note.value) return;
    const answer = await modals.confirm("Delete note", "Are you sure you want to delete this note?");
    if (answer === true) {
        noteSystem.removeNote(note.value.uuid, true);
        emit("mode", "list");
    }
}
</script>

<template>
    <template v-if="note">
        <header>
            <span id="return" title="Back to list" @click="$emit('mode', 'list')">↩</span>
            <input id="title" type="text" :value="note?.title ?? 'New note...'" @change="setTitle" />
            <font-awesome-icon v-if="hasShape(note)" icon="location-dot" />
            <font-awesome-icon icon="up-right-from-square" @click="popout" />
            <font-awesome-icon icon="trash-alt" @click="remove" />
        </header>
        <div id="tags">
            <div class="kind">{{ note.kind }}</div>
            <div
                v-for="tag of note.tags"
                :key="tag.name"
                class="tag"
                :style="{ color: mostReadable(tag.colour), backgroundColor: tag.colour }"
                @click="removeTag(tag.name)"
            >
                {{ tag.name }}
            </div>
            <div @click="addTag"><font-awesome-icon icon="plus" /></div>
        </div>
        <div id="tabs">
            <template v-for="tab of tabs" :key="tab">
                <div v-if="tab !== '_'" :title="tab" :class="{ active: activeTab === tab }" @click="activeTab = tab">
                    {{ tab }}
                </div>
                <div v-else style="flex-grow: 1; border: none"></div>
            </template>
        </div>
        <div id="editor">
            <VueMarkdown v-show="activeTab === 'view'" :source="note.text" :options="{ html: true }" />
            <template v-if="activeTab === 'edit'">
                <i>This input is markdown aware!</i>
                <textarea v-show="activeTab === 'edit'" :value="note.text" @change="setText"></textarea>
            </template>
        </div>
    </template>
</template>

<style scoped lang="scss">
header {
    display: flex;
    font-size: 1.75em;
    align-items: center;

    #return {
        margin-right: 1rem;

        &:hover {
            cursor: pointer;
            font-weight: bold;
        }
    }

    #title {
        flex-grow: 1;
        margin-right: 1rem;
        border: none;
        border-bottom: solid 1px black;
        font-weight: bold;
        font-size: inherit;
        padding: 0.5rem;

        &:hover {
            cursor: text;
        }
    }

    svg {
        margin-right: 0.5rem;
        font-size: 0.75em;

        &:last-child {
            margin-right: 1rem;
        }
    }
}

#tags {
    margin: 1rem;
    display: flex;

    > div {
        position: relative;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        margin-right: 0.5rem;

        &.tag:hover {
            cursor: pointer;

            &::after {
                content: "\00D7";
                position: absolute;
                color: red;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                top: -8px;
                right: -4px;
                pointer-events: auto;
            }
        }
    }

    > .kind {
        background-color: lightcoral;
        border-radius: 0.25rem;
    }
}

.note-color-div {
    display: grid;
    // align-items: center;
    grid-template-areas:
        "icon title"
        "icon content";

    padding: 1rem;
    border: solid 3px lightblue;
    border-radius: 1rem;

    > svg {
        font-size: 1.25rem;
        margin-right: 1rem;
        grid-area: icon;
    }

    .note-setting-title {
        grid-area: title;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
}

#note-access {
    border-color: bisque;
    background-color: rgba(255, 228, 196, 0.25);

    margin-right: 1rem;
}

#note-location-settings {
    border-color: lightblue;
    background-color: rgba(173, 216, 230, 0.25);

    #link-to-map {
        margin-left: 1rem;
        text-decoration: underline;

        &:hover {
            cursor: pointer;
        }
    }
}

#tabs {
    margin: 1rem;
    margin-bottom: 0;
    display: flex;

    > div {
        padding: 0.3rem 0.5rem;
        border: solid 1px black;
        border-bottom: none;
        border-top-left-radius: 0.5rem;
        border-top-right-radius: 0.5rem;
        margin-right: 0.25rem;
        background-color: white;

        &.active {
            margin-bottom: -0.1rem;
            z-index: 5;
        }

        &:hover {
            cursor: pointer;
        }
    }
}

#editor {
    border: solid 1px black;
    padding: 1rem;
    border-radius: 1rem;
    min-height: 30vh;

    overflow: auto;

    > i {
        display: block;
        margin-bottom: 0.5rem;
    }

    > textarea {
        width: 100%;
        min-height: inherit;
        padding: 0.5rem;
        font-size: 1.2em;
    }
}
</style>
