<script setup lang="ts">
import { computed, ref, useTemplateRef, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { useModal } from "../../../../core/plugins/modals/plugin";
import { customDataSystem } from "../../../systems/customData";
import {
    customDataKindMap,
    type CustomDataKindInfo,
    type CustomDataKindMap,
    type UiShapeCustomData,
} from "../../../systems/customData/types";
import { getCustomDataReference } from "../../../systems/customData/utils";
import { selectedState } from "../../../systems/selected/state";

const props = defineProps<{
    data: UiShapeCustomData;
    depth: number;
}>();

const { t } = useI18n();
const modals = useModal();

const mode = ref<"edit" | "view">(props.data.pending !== undefined ? "edit" : "view");
const nameInput = useTemplateRef<HTMLInputElement>("nameInput");

watchEffect(() => {
    if (props.data.pending !== undefined && props.data.name === "") {
        nameInput.value?.focus();
    }
});

const types = ["number", "text", "boolean", "dice-expression"];

const floempie = computed(() => {
    return customDataKindMap[props.data.kind] as CustomDataKindInfo<UiShapeCustomData>;
});

function updateType(event: Event): void {
    const target = event.target as HTMLSelectElement;
    customDataSystem.updateKind(selectedState.raw.focus!, props.data.id, target.value as keyof CustomDataKindMap, true);
}

function syncName(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value.trim();
    if (newName === "") return;

    customDataSystem.setName(selectedState.raw.focus!, props.data.id, target.value, true);
}

function syncValue(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value.trim();
    if (newName === "") return;
    if (typeof floempie.value.editRender !== "function") return;

    customDataSystem.updateValue(
        selectedState.raw.focus!,
        props.data.id,
        floempie.value.editRender(props.data).onSave(target),
        true,
    );
}

function syncReference(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newReference = getCustomDataReference(target.value).trim();
    if (newReference === "") return;
    customDataSystem.setReference(selectedState.raw.focus!, props.data.id, target.value, true);
}

function syncDescription(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const newDescription = target.value.trim();
    if (newDescription === "") return;
    customDataSystem.setDescription(selectedState.raw.focus!, props.data.id, target.value, true);
}

async function removeElement(): Promise<void> {
    const result = await modals.confirm(
        t("game.ui.selection.edit_dialog.customData.removeElementTitle"),
        t("game.ui.selection.edit_dialog.customData.removeElementPrompt"),
    );
    if (result === true) customDataSystem.removeElement(selectedState.raw.focus!, props.data.id, true);
}
</script>

<template>
    <div class="leaf" :class="{ editing: mode === 'edit' }">
        <div class="main">
            <div class="name" :title="data.description" @click="mode = mode === 'view' ? 'edit' : 'view'">
                {{ data.name }}
            </div>
            <div style="flex: 1"></div>
            <div v-if="typeof floempie.format === 'function'" class="value">
                {{ floempie.format(data) }}
            </div>
            <component :is="floempie.format.component" v-else :element="data" />
            <font-awesome-icon icon="trash-alt" @click.stop="removeElement" />
        </div>
        <div v-if="mode === 'edit'" class="edit-form">
            <div>Name:</div>
            <input ref="nameInput" type="text" :value="data.name" @change="syncName" />
            <div>Type:</div>
            <select :value="data.kind" @change="updateType">
                <option v-for="type in types" :key="type" :value="type">{{ type }}</option>
            </select>
            <div>Value:</div>
            <input
                v-if="typeof floempie.editRender === 'function'"
                v-bind="floempie.editRender(data).attrs"
                @change="syncValue"
            />
            <component :is="floempie.editRender.component" v-else :element="data" />
            <div>Reference:</div>
            <input
                type="text"
                :placeholder="getCustomDataReference(data.name)"
                :value="data.reference"
                @change="syncReference"
            />
            <div>Description:</div>
            <textarea :value="data.description" @change="syncDescription" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.leaf {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 1rem;
    margin-left: 0.5rem;

    .main {
        display: flex;
        align-items: center;

        svg {
            margin-left: 0.5rem;
            visibility: hidden;
        }
    }

    &:hover .main svg {
        visibility: visible;
    }

    &.editing .main {
        font-weight: bold;
        border-bottom: 1px solid black;
        margin-top: 0.25rem;
        padding-bottom: 0.25rem;
        margin-bottom: 1rem;
    }

    .edit-form {
        display: grid;
        grid-template-columns: [name] 1fr [value] 1fr [end];
        grid-row-gap: 0.5rem;
    }

    &:hover,
    &.editing {
        background-color: rgba(235, 240, 245, 1);
        border-radius: 0.5rem;
    }

    &.editing {
        margin-bottom: 0.5rem;
    }

    .name {
        width: 10rem;

        &:hover {
            cursor: pointer;
        }
    }

    .value {
        margin-right: 0.25rem;
    }
}
</style>
