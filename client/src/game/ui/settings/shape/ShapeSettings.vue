<script setup lang="ts">
import { type Component, computed, type DeepReadonly, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import Modal from "../../../../core/components/modals/Modal.vue";
import { activeShapeStore } from "../../../../store/activeShape";
import { accessSystem } from "../../../systems/access";
import { accessState } from "../../../systems/access/state";
import { selectedState } from "../../../systems/selected/state";
import { uiState } from "../../../systems/ui/state";

import AccessSettings from "./AccessSettings.vue";
import ExtraSettings from "./ExtraSettings.vue";
import GroupSettings from "./GroupSettings.vue";
import LogicSettings from "./LogicSettings.vue";
import PropertySettings from "./PropertySettings.vue";
import TrackerSettings from "./TrackerSettings.vue";
import VariantSwitcher from "./VariantSwitcher.vue";

const { t } = useI18n();

const visible = computed({
    get() {
        return activeShapeStore.state.showEditDialog;
    },
    set(visible: boolean) {
        activeShapeStore.setShowEditDialog(visible);
    },
});

watchEffect(() => {
    const id = selectedState.reactive.focus;
    if (id !== undefined) {
        accessSystem.loadState(id);
    } else {
        accessSystem.dropState();
    }
});

function close(): void {
    visible.value = false;
}
defineExpose({ close });

const hasShape = computed(() => activeShapeStore.state.id !== undefined);
const owned = accessState.hasEditAccess;

const components = computed(() => {
    const comps: DeepReadonly<{ name: string; component: Component }>[] = [];
    if (!hasShape.value) return comps;
    comps.push(
        { name: "Properties", component: PropertySettings },
        { name: "Trackers", component: TrackerSettings },
        { name: "Access", component: AccessSettings },
        { name: "Logic", component: LogicSettings },
    );
    if (owned.value) {
        comps.push({ name: "Groups", component: GroupSettings }, { name: "Extra", component: ExtraSettings });
    }
    for (const charTab of uiState.reactive.characterTabs) {
        if (charTab.filter?.(activeShapeStore.state.id!) ?? true) comps.push(charTab);
    }

    return comps;
});
const active = ref(0);
</script>

<template>
    <Modal :visible="visible" :colour="'rgba(255, 255, 255, 0.8)'" :mask="false">
        <template #header="m">
            <div class="modal-header" draggable="true" @dragstart="m.dragStart" @dragend="m.dragEnd">
                <div>Shape Settings</div>
                <div class="header-close" :title="t('common.close')" @click.stop="close">
                    <font-awesome-icon :icon="['far', 'window-close']" />
                </div>
            </div>
        </template>
        <div class="modal-body">
            <div id="categories">
                <div
                    v-for="(component, i) of components"
                    :key="component.name"
                    class="category"
                    :class="{ selected: i === active }"
                    @click="active = i"
                >
                    {{ component.name }}
                </div>
            </div>
            <div style="display: flex; flex-direction: column">
                <template v-if="components[active]">
                    <KeepAlive><component :is="components[active]!.component" :active-selection="true" /></KeepAlive>
                </template>
                <template v-if="owned">
                    <div style="flex-grow: 1"></div>
                    <VariantSwitcher />
                </template>
            </div>
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

@layer {
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
}
</style>
