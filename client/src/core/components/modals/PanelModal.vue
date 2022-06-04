<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import Modal from "./Modal.vue";

const props = withDefaults(
    defineProps<{ visible: boolean; categories: string[]; applyTranslation?: boolean; initialSelection?: string }>(),
    { applyTranslation: false },
);
const emit = defineEmits<{
    (e: "update:visible", visible: boolean): void;
    (e: "update:selection", selection: string): void;
}>();

const { t } = useI18n();

const selection = ref(props.categories[0]);

watchEffect(() => {
    if (props.initialSelection !== undefined && props.categories.includes(props.initialSelection)) {
        selection.value = props.initialSelection;
    }
});

function setSelection(category: string): void {
    selection.value = category;
    emit("update:selection", category);
}

function hideModal(): void {
    emit("update:visible", false);
}
</script>

<template>
    <Modal :visible="visible" :colour="'rgba(255, 255, 255, 0.8)'" :mask="false">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div><slot name="title"></slot></div>
                <div class="header-close" @click="hideModal" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div id="categories">
                <div
                    class="category"
                    :class="{ selected: selection === category }"
                    v-for="category in categories"
                    :key="category"
                    @click="setSelection(category)"
                >
                    {{ applyTranslation ? t(category) : category }}
                </div>
            </div>
            <slot :selection="selection"></slot>
        </div>
    </Modal>
</template>

<style scoped lang="scss">
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

* {
    box-sizing: border-box;
}

#categories {
    width: 7.5em;
    background-color: rgba(0, 0, 0, 0);
    border-right: solid 1px #82c8a0;
}

.category {
    border-bottom: solid 1px #82c8a0;
    padding: 5px;
    text-align: right;
    background-color: white;
    padding-right: 10px;
}

.selected,
.category:hover {
    background-color: #82c8a0;
    font-weight: bold;
    cursor: pointer;
    padding-right: 5px;
}

:deep() {
    .panel {
        background-color: white;
        padding: 1em;
        display: grid;
        grid-template-columns: [setting] 1fr [value] 1fr [end];
        /* align-items: center; */
        align-content: start;
        min-height: 10em;

        button {
            padding: 6px 12px;
            border: 1px solid lightgray;
            border-radius: 0.25em;
            background-color: rgb(235, 235, 228);
        }

        input[type="number"],
        input[type="text"] {
            width: 100%;
        }
    }

    .row {
        display: contents;

        &:first-of-type > * {
            margin-top: 0.5em;
        }

        &:last-of-type > * {
            margin-bottom: 0.5em;
        }

        &:hover > * {
            cursor: pointer;
            text-shadow: 0px 0px 1px black;
        }
    }

    .row > *,
    .panel > *:not(.row) {
        display: flex;
        /* justify-content: center; */
        align-items: center;
        margin: 0.4em 0;
    }

    .smallrow > * {
        padding: 0.2em;
    }

    .header {
        line-height: 0.1em;
        margin: 20px 0 15px;
        font-style: italic;
        overflow: hidden;
        padding: 0.5em;

        &:after {
            position: relative;
            width: 100%;
            border-bottom: 1px solid #000;
            content: "";
            margin-right: -100%;
            margin-left: 10px;
            display: inline-block;
        }
    }

    .danger {
        color: #ff7052;

        &:hover {
            text-shadow: 0px 0px 1px #ff7052;
            cursor: pointer;
        }
    }

    .spanrow {
        grid-column: 1 / end;
        justify-self: normal;
        font-weight: bold;
    }

    input[type="checkbox"] {
        width: 16px;
        height: 23px;
        margin: 0;
        white-space: nowrap;
        display: inline-block;
    }

    .color-picker {
        margin: 0.5em 0 !important;
    }
}
</style>
