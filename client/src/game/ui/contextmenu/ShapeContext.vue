<script setup lang="ts">
import { computed, toRef } from "vue";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

import ContextMenu from "../../../core/components/ContextMenu.vue";
import { SyncMode } from "../../../core/models/types";
import { useModal } from "../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../store/activeShape";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { locationStore } from "../../../store/location";
import { settingsStore } from "../../../store/settings";
import { requestAssetOptions, sendAssetOptions } from "../../api/emits/asset";
import { requestSpawnInfo } from "../../api/emits/location";
import { sendShapesMove } from "../../api/emits/shape/core";
import { addGroupMembers, createNewGroupForShapes, getGroupSize, removeGroup } from "../../groups";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { selectionState } from "../../layers/selection";
import { compositeState } from "../../layers/state";
import type { Layer } from "../../layers/variants/layer";
import type { AssetOptions } from "../../models/asset";
import type { Floor, LayerName } from "../../models/floor";
import type { ServerAsset } from "../../models/shapes";
import { toTemplate } from "../../shapes/templates";
import { deleteShapes } from "../../shapes/utils";
import { accessSystem } from "../../systems/access";
import { moveFloor, moveLayer } from "../../temp";
import { initiativeStore } from "../initiative/state";
import { layerTranslationMapping } from "../translations";

import { shapeContextLeft, shapeContextTop, showShapeContextMenu } from "./state";

const { t } = useI18n();
const modals = useModal();

const floorState = floorStore.state;
const isDm = toRef(gameStore.state, "isDm");

const selectionIncludesSpawnToken = computed(() =>
    [...selectionState.state.selection].some(
        (s) => settingsStore.currentLocationOptions.value.spawnLocations?.includes(s) ?? false,
    ),
);

const isOwned = computed(() =>
    [...selectionState.state.selection].every((s) => accessSystem.hasAccessTo(s, false, { edit: true })),
);

function close(): void {
    showShapeContextMenu.value = false;
}

function openEditDialog(): void {
    if (selectionState.state.selection.size !== 1) return;
    activeShapeStore.setShowEditDialog(true);
    close();
}

// MARKERS

const isMarker = computed(() => {
    const sel = selectionState.state.selection;
    if (sel.size !== 1) return false;
    return gameStore.state.markers.has([...sel][0]);
});

function deleteMarker(): void {
    const sel = selectionState.state.selection;
    if (sel.size !== 1) return;
    gameStore.removeMarker([...sel][0], true);
    close();
}

function setMarker(): void {
    const sel = selectionState.state.selection;
    if (sel.size !== 1) return;
    gameStore.newMarker([...sel][0], true);
    close();
}

// INITIATIVE

async function addToInitiative(): Promise<void> {
    let groupInitiatives = false;
    const selection = selectionState.get({ includeComposites: false });
    if (new Set(selection.map((s) => s.groupId)).size < selectionState.state.selection.size) {
        const answer = await modals.confirm(
            "Adding initiative",
            "Some of the selected shapes belong to the same group. Do you wish to add 1 entry for these?",
            { no: "no, create a separate entry for each", focus: "confirm" },
        );
        if (answer === undefined) return;
        groupInitiatives = answer;
    }
    const groupsProcessed = new Set();
    for (const shape of selection) {
        if (!groupInitiatives || shape.groupId === undefined || !groupsProcessed.has(shape.groupId)) {
            initiativeStore.addInitiative(shape.id, undefined, groupInitiatives && shape.groupId !== undefined);
            groupsProcessed.add(shape.groupId);
        }
    }
    initiativeStore.show(true);
    close();
}

function getInitiativeWord(): string {
    const selection = selectionState.state.selection;
    if (selection.size === 1) {
        return initiativeStore.state.locationData.some((i) => i.shape === [...selection][0])
            ? t("game.ui.selection.ShapeContext.show_initiative")
            : t("game.ui.selection.ShapeContext.add_initiative");
    } else {
        return [...selection].every((shape) => initiativeStore.state.locationData.some((i) => i.shape === shape))
            ? t("game.ui.selection.ShapeContext.show_initiative")
            : t("game.ui.selection.ShapeContext.add_all_initiative");
    }
}

// LAYERS

const layers = computed(() => {
    if (isDm.value && !selectionIncludesSpawnToken.value) {
        return floorStore.getLayers(floorStore.currentFloor.value!).filter((l) => l.selectable);
    }
    return [];
});

function setLayer(newLayer: LayerName): void {
    const oldSelection = [...selectionState.get({ includeComposites: true })];
    selectionState.clear();
    moveLayer(oldSelection, floorStore.getLayer(floorStore.currentFloor.value!, newLayer)!, true);
    close();
}

function moveToBack(): void {
    const layer = floorStore.currentLayer.value!;
    for (const shape of selectionState.get({ includeComposites: false })) {
        layer.moveShapeOrder(shape, 0, SyncMode.FULL_SYNC);
    }
    close();
}

function moveToFront(): void {
    const layer = floorStore.currentLayer.value!;
    for (const shape of selectionState.get({ includeComposites: false })) {
        layer.moveShapeOrder(shape, layer.size({ includeComposites: true }) - 1, SyncMode.FULL_SYNC);
    }

    close();
}

// FLOORS

function setFloor(floor: Floor): void {
    moveFloor([...selectionState.get({ includeComposites: true })], floor, true);
    close();
}

// LOCATIONS

const locations = computed(() => {
    if (isDm.value && !selectionIncludesSpawnToken.value) {
        return locationStore.activeLocations.value;
    }
    return [];
});

async function setLocation(newLocation: number): Promise<void> {
    const shapes = selectionState.get({ includeComposites: true }).filter((s) => !s.isLocked);
    if (shapes.length === 0) {
        return;
    }

    const spawnInfo = await requestSpawnInfo(newLocation);
    let spawnLocation: ServerAsset;

    switch (spawnInfo.length) {
        case 0:
            await modals.confirm(
                t("game.ui.selection.ShapeContext.no_spawn_set_title"),
                t("game.ui.selection.ShapeContext.no_spawn_set_text"),
                { showNo: false, yes: "Ok" },
            );
            close();
            return;
        case 1:
            spawnLocation = spawnInfo[0];
            break;
        default: {
            const choice = await modals.selectionBox(
                "Choose the desired spawn location",
                spawnInfo.map((s) => s.name),
            );
            if (choice === undefined) return;
            const choiceShape = spawnInfo.find((s) => s.name === choice[0]);
            if (choiceShape === undefined) return;
            spawnLocation = choiceShape;
            break;
        }
    }

    const targetPosition = {
        floor: spawnLocation.floor,
        x: spawnLocation.x + spawnLocation.width / 2,
        y: spawnLocation.y + spawnLocation.height / 2,
    };

    sendShapesMove({
        shapes: shapes.map((s) => getGlobalId(s.id)),
        target: { location: newLocation, ...targetPosition },
        tp_zone: false,
    });
    if (settingsStore.movePlayerOnTokenChange.value) {
        const users: Set<string> = new Set();
        for (const shape of selectionState.get({ includeComposites: true })) {
            if (shape.isLocked) continue;
            for (const owner of accessSystem.getOwners(shape.id)) users.add(owner);
        }
        gameStore.updatePlayersLocation([...users], newLocation, true, { ...targetPosition });
    }

    close();
}

// SELECTION

const hasSingleSelection = computed(() => selectionState.state.selection.size === 1);

function deleteSelection(): void {
    deleteShapes(selectionState.get({ includeComposites: true }), SyncMode.FULL_SYNC);
    close();
}

// TEMPLATES

const canBeSaved = computed(() =>
    [...selectionState.state.selection].every(
        (s) => getShape(s)!.assetId !== undefined && compositeState.getCompositeParent(s) === undefined,
    ),
);

async function saveTemplate(): Promise<void> {
    const shape = selectionState.get({ includeComposites: false })[0];
    let assetOptions: AssetOptions = {
        version: "0",
        shape: shape.type,
        templates: { default: {} },
    };
    if (shape.assetId !== undefined) {
        const response = await requestAssetOptions(shape.assetId);
        if (response.success && response.options) assetOptions = response.options;
    } else {
        console.warn("Templates are currently only supported for shapes with existing asset relations.");
        return;
    }
    const choices = Object.keys(assetOptions.templates);
    try {
        const choice = await modals.selectionBox(t("game.ui.templates.save"), choices, {
            defaultButton: t("game.ui.templates.overwrite"),
            customButton: t("game.ui.templates.create_new"),
        });
        if (choice === undefined) return;
        assetOptions.templates[choice[0]] = toTemplate(shape.asDict());
        sendAssetOptions(shape.assetId, assetOptions);
    } catch {
        // no-op ; action cancelled
    }
}

// GROUPS

const groups = computed(() =>
    [...selectionState.state.selection].map((s) => getShape(s)!.groupId).filter((g) => g !== undefined),
) as ComputedRef<string[]>;

const hasEntireGroup = computed(() => {
    const selection = selectionState.state.selection;
    return selection.size === getGroupSize(getShape([...selection][0])!.groupId!);
});

const hasUngrouped = computed(() =>
    [...selectionState.state.selection].some((s) => getShape(s)!.groupId === undefined),
);

function createGroup(): void {
    createNewGroupForShapes([...selectionState.state.selection]);
    close();
}

async function splitGroup(): Promise<void> {
    const keepBadges = await modals.confirm("Splitting group", "Do you wish to keep the original badges?", {
        no: "No, reset them",
    });
    if (keepBadges === undefined) return;
    createNewGroupForShapes([...selectionState.state.selection], keepBadges);
    close();
}

async function mergeGroups(): Promise<void> {
    const keepBadges = await modals.confirm(
        "Merging group",
        "Do you wish to keep the original badges? This can lead to duplicate badges!",
        {
            no: "No, reset them",
        },
    );
    if (keepBadges === undefined) return;
    let targetGroup: string | undefined;
    const membersToMove: { uuid: LocalId; badge?: number }[] = [];
    for (const shape of selectionState.get({ includeComposites: false })) {
        if (shape.groupId !== undefined) {
            if (targetGroup === undefined) {
                targetGroup = shape.groupId;
            } else if (targetGroup === shape.groupId) {
                continue;
            } else {
                membersToMove.push({ uuid: shape.id, badge: keepBadges ? shape.badge : undefined });
            }
        }
    }
    addGroupMembers(targetGroup!, membersToMove, true);
    close();
}

function removeEntireGroup(): void {
    removeGroup(selectionState.get({ includeComposites: false })[0].groupId!, true);
    close();
}

function enlargeGroup(): void {
    const selection = selectionState.get({ includeComposites: false });
    const groupId = selection.find((s) => s.groupId !== undefined)!.groupId!;
    addGroupMembers(
        groupId,
        selection.filter((s) => s.groupId === undefined).map((s) => ({ uuid: s.id })),
        true,
    );
    close();
}

const activeLayer = floorStore.currentLayer as ComputedRef<Layer>;
const activeLocation = toRef(settingsStore.state, "activeLocation");
const currentFloorIndex = toRef(floorState, "floorIndex");
const floors = toRef(floorState, "floors");
</script>

<template>
    <ContextMenu :visible="showShapeContextMenu" :left="shapeContextLeft" :top="shapeContextTop" @cm:close="close">
        <li v-if="isDm && floors.length > 1">
            {{ t("common.floor") }}
            <ul>
                <li
                    v-for="(floor, idx) in floors"
                    :key="floor.name"
                    :style="[idx === currentFloorIndex ? { backgroundColor: '#82c8a0' } : {}]"
                    @click="setFloor(floor)"
                >
                    {{ floor.name }}
                </li>
            </ul>
        </li>
        <li v-if="layers.length > 1">
            {{ t("common.layer") }}
            <ul>
                <li
                    v-for="layer in layers"
                    :key="layer.name"
                    :style="[layer.name === activeLayer.name ? { backgroundColor: '#82c8a0' } : {}]"
                    @click="setLayer(layer.name)"
                >
                    {{ layerTranslationMapping[layer.name] }}
                </li>
            </ul>
        </li>
        <li v-if="locations.length > 1">
            {{ t("common.location") }}
            <ul>
                <li
                    v-for="location in locations"
                    :key="location.id"
                    :style="[activeLocation === location.id ? { backgroundColor: '#82c8a0' } : {}]"
                    @click="setLocation(location.id)"
                >
                    {{ location.name }}
                </li>
            </ul>
        </li>
        <li @click="moveToBack" v-if="isOwned">{{ t("game.ui.selection.ShapeContext.move_back") }}</li>
        <li @click="moveToFront" v-if="isOwned">{{ t("game.ui.selection.ShapeContext.move_front") }}</li>
        <li @click="addToInitiative" v-if="isOwned && !selectionIncludesSpawnToken">{{ getInitiativeWord() }}</li>
        <li @click="deleteSelection" v-if="!selectionIncludesSpawnToken && (isDm || isOwned)">
            {{ t("game.ui.selection.ShapeContext.delete_shapes") }}
        </li>
        <template v-if="hasSingleSelection">
            <li v-if="isMarker" @click="deleteMarker">{{ t("game.ui.selection.ShapeContext.remove_marker") }}</li>
            <li v-else @click="setMarker">{{ t("game.ui.selection.ShapeContext.set_marker") }}</li>
            <li @click="saveTemplate" v-if="!selectionIncludesSpawnToken && isDm && canBeSaved">
                {{ t("game.ui.templates.save") }}
            </li>
        </template>
        <template v-else>
            <li>
                Group
                <ul>
                    <li v-if="groups.length === 0" @click="createGroup">Create group</li>
                    <li v-if="groups.length === 1 && !hasUngrouped && !hasEntireGroup" @click="splitGroup">
                        Split from group
                    </li>
                    <li v-if="groups.length === 1 && !hasUngrouped && hasEntireGroup" @click="removeEntireGroup">
                        Remove group
                    </li>
                    <li v-if="groups.length > 1" @click="mergeGroups">Merge groups</li>
                    <li v-if="groups.length === 1 && hasUngrouped" @click="enlargeGroup">Enlarge group</li>
                </ul>
            </li>
        </template>
        <li v-if="hasSingleSelection" @click="openEditDialog">{{ t("game.ui.selection.ShapeContext.show_props") }}</li>
    </ContextMenu>
</template>

<style scoped lang="scss">
.ContextMenu ul {
    border: 1px solid #82c8a0;
    width: -moz-fit-content;
    width: fit-content;

    li {
        border-bottom: 1px solid #82c8a0;

        &:hover {
            background-color: #82c8a0;
        }
    }
}
</style>
