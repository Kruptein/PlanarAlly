<script setup lang="ts">
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";

import Modal from "../../core/components/modals/Modal.vue";
import { uuidv4 } from "../../core/utils";
import { clientStore } from "../../store/client";
import { gameStore } from "../../store/game";
import { sendLabelVisibility } from "../api/emits/labels";
import type { Label } from "../shapes/interfaces";

const emit = defineEmits(["update:visible", "addLabel"]);
defineProps<{ visible: boolean }>();

const { t } = useI18n();

const state = reactive({
    newCategory: "",
    newName: "",
    search: "",
});

function close(): void {
    emit("update:visible", false);
}

const hasLabels = computed(() => gameStore.state.labels.size > 0);

const categories = computed(() => {
    const cat: Map<string, Label[]> = new Map();
    cat.set("", []);
    for (const label of gameStore.state.labels.values()) {
        if (label.user !== clientStore.state.username) continue;
        const fullName = `${label.category.toLowerCase()}${label.name.toLowerCase()}`;
        if (state.search.length > 0 && fullName.search(state.search.toLowerCase()) < 0) {
            continue;
        }
        if (!label.category) {
            cat.get("")!.push(label);
        } else {
            if (!cat.has(label.category)) {
                cat.set(label.category, []);
            }
            cat.get(label.category)!.push(label);
            cat.get(label.category)!.sort((a, b) => a.name.localeCompare(b.name));
        }
    }
    return cat;
});

function selectLabel(label: string): void {
    emit("addLabel", label);
    close();
}

function toggleVisibility(label: Label): void {
    label.visible = !label.visible;
    sendLabelVisibility({ uuid: label.uuid, visible: label.visible });
}

function addLabel(): void {
    if (state.newName === "") return;
    const label = {
        uuid: uuidv4(),
        category: state.newCategory,
        name: state.newName,
        visible: false,
        user: clientStore.state.username,
    };
    gameStore.addLabel(label, true);
    state.newCategory = "";
    state.newName = "";
}

function deleteLabel(uuid: string): void {
    gameStore.deleteLabel(uuid, true);
}
</script>

<template>
    <Modal :visible="visible" @close="close" :mask="false">
        <template v-slot:header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>{{ t("game.ui.LabelManager.title") }}</div>
                <div class="header-close" @click="close" :title="t('common.close')">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div class="grid">
                <div>
                    <abbr :title="t('game.ui.LabelManager.category')">{{ t("game.ui.LabelManager.cat_abbr") }}</abbr>
                </div>
                <div class="name">{{ t("common.name") }}</div>
                <div>
                    <abbr :title="t('game.ui.LabelManager.visible')">{{ t("game.ui.LabelManager.vis_abbr") }}</abbr>
                </div>
                <div>
                    <abbr :title="t('game.ui.LabelManager.delete')">{{ t("game.ui.LabelManager.del_abbr") }}</abbr>
                </div>
                <div class="separator spanrow" style="margin: 0 0 7px"></div>
                <input class="spanrow" type="text" :placeholder="t('common.search')" v-model="state.search" />
            </div>
            <div class="grid scroll">
                <template v-for="labels of categories.values()">
                    <template v-for="label of labels" :key="label.uuid">
                        <div class="row" @click="selectLabel(label.uuid)">
                            <template v-if="label.category">
                                <div :key="'cat-' + label.uuid">{{ label.category }}</div>
                                <div class="name" :key="'name-' + label.uuid">{{ label.name }}</div>
                            </template>
                            <template v-if="!label.category">
                                <div :key="'cat-' + label.uuid"></div>
                                <div class="name" :key="'name-' + label.uuid">{{ label.name }}</div>
                            </template>
                            <div
                                :key="'visible-' + label.uuid"
                                :style="{ textAlign: 'center' }"
                                :class="{ 'lower-opacity': !label.visible }"
                                @click.stop="toggleVisibility(label)"
                                :title="t('common.toggle_public_private')"
                            >
                                <font-awesome-icon icon="eye" />
                            </div>
                            <div
                                :key="'delete-' + label.uuid"
                                @click.stop="deleteLabel(label.uuid)"
                                :title="t('game.ui.LabelManager.delete_label')"
                            >
                                <font-awesome-icon icon="trash-alt" />
                            </div>
                        </div>
                    </template>
                </template>
                <template v-if="!hasLabels">
                    <div id="no-labels">{{ t("game.ui.LabelManager.no_exist_msg") }}</div>
                </template>
            </div>
            <div class="grid">
                <div class="separator spanrow"></div>
                <input type="text" v-model.trim="state.newCategory" />
                <input type="text" v-model.trim="state.newName" />
                <button id="addLabelButton" @click.stop="addLabel">{{ t("common.add") }}</button>
            </div>
        </div>
    </Modal>
</template>

<style scoped lang="scss">
abbr {
    text-decoration: none;
}

.scroll {
    max-height: 20em;
    overflow-y: auto;
}

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
    padding: 10px;
    max-width: 450px;
}

.separator {
    line-height: 0.1em;
    margin: 7px 0;

    &:after {
        position: absolute;
        left: 10px;
        right: 10px;
        border-bottom: 1px solid #000;
        content: "";
    }
}

.spanrow {
    grid-column: start / end;
}

.lower-opacity > * {
    opacity: 0.3;
}

.grid {
    display: grid;
    grid-template-columns: [start] 50px [name] 1fr [visible] 30px [remove] 30px [end];
    grid-row-gap: 5px;
    align-items: center;

    > * {
        text-align: center;
    }
}

.name {
    text-align: left !important;
}

.row {
    display: contents;

    > * {
        padding: 5px;
        height: 20px;
        border: solid 1px rgba(0, 0, 0, 0);
    }

    &:hover > * {
        cursor: pointer;
        border-top: solid 1px #ff7052;
        border-bottom: solid 1px #ff7052;
        background-color: rgba(0, 0, 0, 0.2);

        &:first-child {
            border-left: solid 1px #ff7052;
            border-top-left-radius: 10px;
            border-bottom-left-radius: 10px;
        }

        &:last-child {
            border-right: solid 1px #ff7052;
            border-top-right-radius: 10px;
            border-bottom-right-radius: 10px;
        }
    }
}

#no-labels {
    grid-column: start/end;
    font-style: italic;
    padding-left: 50px;
}

#addLabelButton {
    grid-column: visible/end;
}
</style>
