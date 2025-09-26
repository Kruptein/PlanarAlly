<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { useModal } from "../../../../core/plugins/modals/plugin";
import { getGlobalId } from "../../../id";
import { customDataSystem } from "../../../systems/customData";
import { ShapeCustomDataPending, type UiShapeCustomData } from "../../../systems/customData/types";
import { selectedState } from "../../../systems/selected/state";

import DataSettingsLeaf from "./DataSettingsLeaf.vue";
import { type Branch } from "./types";

const { t } = useI18n();

const {
    children,
    name,
    prefix,
    depth = 0,
} = defineProps<{
    children: (Branch | UiShapeCustomData)[];
    prefix?: string;
    name?: string;
    depth?: number;
}>();

const visible = ref(depth < 3 || children.length === 0);

const modals = useModal();

function addBranch(): void {
    const newName = window.prompt(t("game.ui.selection.edit_dialog.customData.newBranchPrompt"));
    if (newName === null || newName.trim() === "") return;
    visible.value = true;
    customDataSystem.addBranch(
        selectedState.raw.focus!,
        depth === 0 ? `/${newName}` : `${prefix ?? "/"}${name}/${newName}`,
    );
}

function addElement(): void {
    const shapeId = getGlobalId(selectedState.raw.focus!);
    if (shapeId === undefined) return;
    customDataSystem.addElement(
        {
            shapeId,
            source: "planarally",
            prefix: (prefix ?? "/") + (name ?? ""),
            name: "",
            kind: "text",
            value: "",
            reference: null,
            description: null,
            pending: ShapeCustomDataPending.Leaf,
        },
        true,
    );
}

async function removeBranch(): Promise<void> {
    const result = await modals.confirm(
        t("game.ui.selection.edit_dialog.customData.removeBranchTitle"),
        t("game.ui.selection.edit_dialog.customData.removeBranchPrompt"),
    );
    if (result === true) customDataSystem.removeBranch(selectedState.raw.focus!, `${prefix}${name}`);
}
</script>

<template>
    <div class="branch" :class="{ root: depth === 0 }">
        <template v-if="name">
            <div class="name" @click="visible = !visible">
                <font-awesome-icon v-if="visible" icon="chevron-down" />
                <font-awesome-icon v-else icon="chevron-right" />
                {{ name }}
                <span style="flex: 1; min-width: 1rem"></span>
                <font-awesome-icon icon="folder-tree" class="hover-only" @click.stop="addBranch" />
                <font-awesome-icon icon="plus" class="hover-only" @click.stop="addElement" />
                <font-awesome-icon icon="trash-alt" class="hover-only" @click.stop="removeBranch" />
            </div>
        </template>
        <div v-show="visible" class="children">
            <template v-for="entry of children" :key="'id' in entry ? entry.id : entry.name">
                <template v-if="'children' in entry">
                    <DataSettingsBranch
                        :children="entry.children"
                        :name="entry.name"
                        :depth="depth + 1"
                        :prefix="entry.prefix"
                    />
                </template>
                <template v-else>
                    <DataSettingsLeaf :data="entry" :depth="depth + 1" />
                </template>
            </template>
        </div>
        <template v-if="depth === 0">
            <div v-if="children.length === 0" style="white-space: pre-wrap">
                {{ t("game.ui.selection.edit_dialog.customData.noChildren") }}
            </div>
            <div style="flex: 1"></div>
            <div id="root-buttons">
                <button @click="addBranch">
                    <font-awesome-icon icon="folder-tree" />
                    {{ t("game.ui.selection.edit_dialog.customData.addBranch") }}
                </button>
                <button @click="addElement">
                    <font-awesome-icon icon="plus" />
                    {{ t("game.ui.selection.edit_dialog.customData.addElement") }}
                </button>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.branch {
    display: flex;
    flex-direction: column;

    .name {
        display: flex;
        align-items: center;

        font-size: 1.25em;
        font-weight: bold;
        margin-top: 0.5rem;
        padding-left: 0.5rem;

        svg {
            font-size: 0.8rem;
            background-color: #ffa8bf;
            padding: 0.3rem;
            margin-right: 0.5rem;
            border-radius: 0.3rem;
        }
    }

    .hover-only {
        visibility: hidden;
    }

    &:hover:not(:has(.branch:hover)) > .name .hover-only {
        visibility: visible;
    }

    .children {
        display: flex;
        flex-direction: column;

        border-left: 3px solid #ffa8bf;
        margin-left: 1rem;
        padding-top: 0.5rem;
    }

    &.root {
        padding: 0.5rem 1rem;
        background-color: white;

        height: 100%;

        max-height: 70vh;
        overflow-y: auto;

        > .children {
            border-left: none;
            padding-left: 0;
            margin-left: 0;
        }

        #root-buttons {
            display: flex;
            justify-content: space-between;
            gap: 1rem;

            button {
                display: flex;
                background-color: rgba(255, 168, 191, 0.5);
                border: none;
                padding: 0.5rem;
                margin-top: 1rem;
                cursor: pointer;
                border-radius: 0.5rem;

                &:hover {
                    background-color: #ffa8bf;
                }

                svg {
                    margin-right: 0.5rem;
                }
            }
        }
    }
}
</style>
