<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import VueMarkdown from "vue-markdown-render";

import { i18n } from "../../../i18n";
import { map } from "../../iter";
import type { SelectionBoxOptions } from "../../plugins/modals/selectionBox";

import Modal from "./Modal.vue";

const emit = defineEmits<{ (e: "submit", choices: string[]): void; (e: "close"): void }>();
const props = defineProps<{
    visible: boolean;
    title: string;
    choices: string[];
    options?: SelectionBoxOptions;
}>();

// don't use useI18n here, the modals plugin is loaded earlier
const t = i18n.global.t;

interface State {
    activeSelection: Set<number>;
    customName: string;
    error: string;
}

const state: State = reactive({
    activeSelection: new Set(),
    customName: "",
    error: "",
});

const customButton = computed(() => props.options?.customButton ?? "");
const defaultButton = computed(() => props.options?.defaultButton ?? t("common.select"));
const text = computed(() => props.options?.text ?? "");

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            for (const option of props.options?.defaultSelect ?? []) {
                state.activeSelection.add(props.choices.indexOf(option));
            }
        }
    },
);

function close(): void {
    emit("close");
    state.activeSelection.clear();
    state.activeSelection.add(0);
    state.customName = "";
    state.error = "";
}

function toggle(index: number): void {
    if (props.options?.multiSelect === true) {
        if (state.activeSelection.has(index)) {
            state.activeSelection.delete(index);
        } else {
            state.activeSelection.add(index);
        }
    } else {
        state.activeSelection.clear();
        state.activeSelection.add(index);
    }
}

function create(): void {
    if (state.customName === "") {
        state.error = t("core.components.selectionbox.non_empty_warning").toString();
    } else if (props.choices.includes(state.customName)) {
        state.error = t("core.components.selectionbox.already_exists_warning").toString();
    } else {
        emit("submit", [state.customName]);
        close();
    }
}

function submit(): void {
    emit("submit", [...map(state.activeSelection, (i) => props.choices[i]!)]);
}

function clear(): void {
    state.activeSelection.clear();
}

function selectAll(): void {
    for (let i = 0; i < props.choices.length; i++) {
        state.activeSelection.add(i);
    }
}
</script>

<template>
    <Modal :visible="visible" @close="close">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                {{ title }}
            </div>
        </template>
        <div class="modal-body">
            <VueMarkdown :source="text" />
            <div v-if="state.error.length > 0" id="error">{{ state.error }}</div>
            <template v-if="choices.length > 0">
                <div id="selectionbox">
                    <template v-for="[i, choice] of choices.entries()" :key="choice">
                        <div :class="{ selected: state.activeSelection.has(i) }" @click="toggle(i)">
                            {{ choice }}
                        </div>
                    </template>
                </div>
                <div v-if="options?.multiSelect" class="small-actions">
                    <div @click="clear">clear</div>
                    <div @click="selectAll">select all</div>
                </div>
                <div class="button" @click="submit">{{ defaultButton }}</div>
                <template v-if="customButton.length > 0">
                    <h4>
                        <span>
                            {{ t("common.or").toLocaleUpperCase().toString() }}
                        </span>
                    </h4>
                    <input v-model="state.customName" type="text" class="input" />
                    <div class="button" @click="create">{{ customButton }}</div>
                </template>
            </template>
            <template v-else>
                <div>No possible selection targets found</div>
                <div class="button" @click="close">Ok</div>
            </template>
        </div>
    </Modal>
</template>

<style scoped lang="scss">
.modal-header {
    background-color: #7c253e;
    color: white;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.modal-body {
    padding: 10px;
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
}

#error {
    margin: 10px;
    color: #7c253e;
}

#selectionbox {
    display: flex;
    flex-direction: column;

    max-height: 60vh;
    overflow: auto;

    div {
        padding: 10px 25px;
        padding-left: 15px;
        border: solid 1px black;
        border-top: none;

        &:first-child {
            border-top: solid 1px black;
            border-top-left-radius: 15px;
            border-top-right-radius: 15px;
        }

        &:last-child {
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
        }
    }
}

.small-actions {
    display: flex;

    margin-top: 0.25rem;
    margin-left: 0.5rem;

    font-size: small;

    div:first-child {
        margin-right: 0.5rem;
    }

    &:hover {
        cursor: pointer;
    }
}

.selected,
.button:hover,
#selectionbox div:hover {
    color: white;
    background-color: #9c455e;
    cursor: pointer;
}

.button {
    border: solid 1px black;
    border-radius: 20px;
    padding: 5px 10px;
    margin: 10px;
    margin-right: 0;
    margin-top: 0.5rem;
    align-self: flex-end;
}

.input {
    border: solid 1px black;
    border-radius: 20px;
    padding: 5px 10px;
}

h4 {
    font-weight: normal;
    background-color: white;
    text-align: center;
    border-bottom: 1px solid #000;
    line-height: 0.1em;

    span {
        background: #fff;
        padding: 0 10px;
    }
}
</style>
