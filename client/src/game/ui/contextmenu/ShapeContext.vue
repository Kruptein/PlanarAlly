<script setup lang="ts">
import { computed, toRef } from "vue";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

import type { ApiSpawnInfo, CharacterCreate } from "../../../apiTypes";
import ContextMenu from "../../../core/components/ContextMenu.vue";
import { defined, guard, map } from "../../../core/iter";
import { SyncMode } from "../../../core/models/types";
import { useModal } from "../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../store/activeShape";
import { locationStore } from "../../../store/location";
import { requestAssetOptions, sendAssetOptions } from "../../api/emits/asset";
import { requestSpawnInfo } from "../../api/emits/location";
import { sendShapesMove } from "../../api/emits/shape/core";
import { socket } from "../../api/socket";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import type { ILayer } from "../../interfaces/layer";
import { compositeState } from "../../layers/state";
import type { AssetOptions } from "../../models/asset";
import type { Floor, LayerName } from "../../models/floor";
import { toTemplate } from "../../shapes/templates";
import { deleteShapes } from "../../shapes/utils";
import { accessSystem } from "../../systems/access";
import { characterState } from "../../systems/characters/state";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { groupSystem } from "../../systems/groups";
import { markerSystem } from "../../systems/markers";
import { markerState } from "../../systems/markers/state";
import { playerSystem } from "../../systems/players";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { selectedState } from "../../systems/selected/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { moveFloor, moveLayer } from "../../temp";
import { initiativeStore } from "../initiative/state";
import { layerTranslationMapping } from "../translations";

import { shapeContextLeft, shapeContextTop, showShapeContextMenu } from "./state";

const { t } = useI18n();
const modals = useModal();

const selectionIncludesSpawnToken = computed(() =>
    [...selectedState.reactive.selected].some((s) => {
        const gId = getGlobalId(s);
        if (gId === undefined) return false;
        return locationSettingsState.reactive.spawnLocations.value.includes(gId);
    }),
);

const isOwned = computed(() =>
    [...selectedState.reactive.selected].every((s) => accessSystem.hasAccessTo(s, false, { edit: true })),
);

function close(): void {
    showShapeContextMenu.value = false;
}

function openEditDialog(): void {
    if (selectedState.raw.selected.size !== 1) return;
    activeShapeStore.setShowEditDialog(true);
    close();
}

// MARKERS

const isMarker = computed(() => {
    const sel = selectedState.reactive.selected;
    if (sel.size !== 1) return false;
    return markerState.reactive.markers.has([...sel][0]!);
});

function deleteMarker(): void {
    const sel = selectedState.raw.selected;
    if (sel.size !== 1) return;
    markerSystem.removeMarker([...sel][0]!, true);
    close();
}

function setMarker(): void {
    const sel = selectedState.raw.selected;
    if (sel.size !== 1) return;
    markerSystem.newMarker([...sel][0]!, true);
    close();
}

// INITIATIVE

async function addToInitiative(): Promise<void> {
    let groupInitiatives = false;
    const selection = selectedSystem.get({ includeComposites: false });
    // First check if there are shapes with the same groupId
    const groupsFound = new Set();
    for (const shape of selection) {
        const group = groupSystem.getGroupId(shape.id);
        if (group === undefined) continue;
        if (groupsFound.has(group)) {
            const answer = await modals.confirm(
                "Adding initiative",
                "Some of the selected shapes belong to the same group. Do you wish to add 1 entry for these?",
                { no: "no, create a separate entry for each", focus: "confirm" },
            );
            if (answer === undefined) return;
            groupInitiatives = answer;
            break;
        } else {
            groupsFound.add(group);
        }
    }
    // Handle the actual initiative addition
    const groupsProcessed = new Set();
    for (const shape of selection) {
        const groupId = groupSystem.getGroupId(shape.id);
        if (!groupInitiatives || groupId === undefined || !groupsProcessed.has(groupId)) {
            initiativeStore.addInitiative(shape.id, groupInitiatives && groupId !== undefined);
            groupsProcessed.add(groupId);
        }
    }
    initiativeStore.show(true, true);
    close();
}

function getInitiativeWord(): string {
    const selection = selectedState.raw.selected;
    if (selection.size === 1) {
        return initiativeStore.state.locationData.some((i) => i.localId === [...selection][0])
            ? t("game.ui.selection.ShapeContext.show_initiative")
            : t("game.ui.selection.ShapeContext.add_initiative");
    } else {
        return [...selection].every((shape) => initiativeStore.state.locationData.some((i) => i.localId === shape))
            ? t("game.ui.selection.ShapeContext.show_initiative")
            : t("game.ui.selection.ShapeContext.add_all_initiative");
    }
}

// LAYERS

const layers = computed(() => {
    if (gameState.reactive.isDm && !selectionIncludesSpawnToken.value) {
        const currentFloor = floorState.currentFloor.value;
        if (currentFloor !== undefined) return floorSystem.getLayers(currentFloor).filter((l) => l.selectable);
    }
    return [];
});

function setLayer(newLayer: LayerName): void {
    const oldSelection = [...selectedSystem.get({ includeComposites: true })];
    selectedSystem.clear();
    moveLayer(oldSelection, floorSystem.getLayer(floorState.currentFloor.value!, newLayer)!, true);
    close();
}

function moveToBack(): void {
    const layer = floorState.currentLayer.value!;
    for (const shape of selectedSystem.get({ includeComposites: false })) {
        layer.moveShapeOrder(shape, 0, SyncMode.FULL_SYNC);
    }
    close();
}

function moveToFront(): void {
    const layer = floorState.currentLayer.value!;
    for (const shape of selectedSystem.get({ includeComposites: false })) {
        layer.moveShapeOrder(shape, layer.size({ includeComposites: true }) - 1, SyncMode.FULL_SYNC);
    }

    close();
}

// FLOORS

function setFloor(floor: Floor): void {
    moveFloor([...selectedSystem.get({ includeComposites: true })], floor, true);
    close();
}

// LOCATIONS

const locations = computed(() => {
    if (gameState.reactive.isDm && !selectionIncludesSpawnToken.value) {
        return locationStore.activeLocations.value;
    }
    return [];
});

async function setLocation(newLocation: number): Promise<void> {
    const shapes = selectedSystem.get({ includeComposites: true }).filter((s) => !getProperties(s.id)!.isLocked);
    if (shapes.length === 0) {
        return;
    }

    const spawnInfo = await requestSpawnInfo(newLocation);
    let spawnLocation: ApiSpawnInfo;

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
            spawnLocation = spawnInfo[0]!;
            break;
        default: {
            const choices = await modals.selectionBox(
                "Choose the desired spawn location",
                spawnInfo.map((s) => s.name),
            );
            if (choices === undefined) return;
            const choiceShape = spawnInfo.find((s) => s.name === choices[0]);
            if (choiceShape === undefined) return;
            spawnLocation = choiceShape;
            break;
        }
    }

    const targetPosition = {
        floor: spawnLocation.floor,
        x: spawnLocation.position.x,
        y: spawnLocation.position.y,
    };

    sendShapesMove({
        shapes: shapes.map((s) => getGlobalId(s.id)!),
        target: { location: newLocation, ...targetPosition },
    });
    if (locationSettingsState.raw.movePlayerOnTokenChange.value) {
        const users = new Set<string>();
        for (const shape of selectedSystem.get({ includeComposites: true })) {
            if (getProperties(shape.id)!.isLocked) continue;
            for (const owner of accessSystem.getOwners(shape.id)) users.add(owner);
        }
        playerSystem.updatePlayersLocation([...users], newLocation, true, { ...targetPosition });
    }

    close();
}

// SELECTION

const hasSingleSelection = computed(() => selectedState.reactive.selected.size === 1);

function deleteSelection(): void {
    deleteShapes(selectedSystem.get({ includeComposites: true }), SyncMode.FULL_SYNC);
    close();
}

// TEMPLATES

const canBeSaved = computed(() =>
    [...selectedState.reactive.selected].every(
        (s) => getShape(s)!.assetId !== undefined && compositeState.getCompositeParent(s) === undefined,
    ),
);

async function saveTemplate(): Promise<void> {
    const shape = selectedSystem.get({ includeComposites: false })[0];
    if (shape === undefined) return;

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
        const selection = await modals.selectionBox(t("game.ui.templates.save"), choices, {
            defaultButton: t("game.ui.templates.overwrite"),
            customButton: t("game.ui.templates.create_new"),
        });
        if (selection === undefined || selection.length === 0) return;
        assetOptions.templates[selection[0]!] = toTemplate(shape.asDict());
        sendAssetOptions(shape.assetId, assetOptions);
    } catch {
        // no-op ; action cancelled
    }
}

// CHARACTER
const hasCharacter = computed(() => characterState.reactive.activeCharacterId !== undefined);

function createCharacter(): void {
    close();
    const selectedId = [...selectedState.raw.selected].at(0);
    if (selectedId === undefined) return;
    const shape = getShape(selectedId);
    if (shape === undefined || shape.character !== undefined) return;
    const data: CharacterCreate = {
        shape: getGlobalId(selectedId)!,
        name: getProperties(selectedId)!.name,
    };
    socket.emit("Character.Create", data);
}

// GROUPS

const groups = computed(() => {
    const ids = map(selectedState.reactive.selected, (s) => groupSystem.getGroupId(s));
    const definedIds = guard(ids, defined);
    return new Set(definedIds);
});

const hasEntireGroup = computed(() => {
    const selection = selectedState.reactive.selected;
    const sel = [...selection][0];
    if (sel === undefined) return false;
    const groupId = groupSystem.getGroupId(sel);
    if (groupId === undefined) return false;
    return selection.size === groupSystem.getGroupSize(groupId);
});

const hasUngrouped = computed(() =>
    [...selectedState.reactive.selected].some((s) => groupSystem.getGroupId(s) === undefined),
);

function createGroup(): void {
    groupSystem.createNewGroupForShapes([...selectedState.raw.selected]);
    close();
}

async function splitGroup(): Promise<void> {
    const keepBadges = await modals.confirm("Splitting group", "Do you wish to keep the original badges?", {
        no: "No, reset them",
    });
    if (keepBadges === undefined) return;
    groupSystem.createNewGroupForShapes([...selectedState.raw.selected], keepBadges);
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
    for (const shape of selectedSystem.get({ includeComposites: false })) {
        const groupId = groupSystem.getGroupId(shape.id);
        if (groupId !== undefined) {
            if (targetGroup === undefined) {
                targetGroup = groupId;
            } else if (targetGroup === groupId) {
                continue;
            } else {
                const badge = groupSystem.getBadge(shape.id);
                membersToMove.push({ uuid: shape.id, badge: keepBadges ? badge : undefined });
            }
        }
    }
    groupSystem.addGroupMembers(targetGroup!, membersToMove, true);
    close();
}

function removeEntireGroup(): void {
    const shape = selectedSystem.get({ includeComposites: false })[0];
    if (shape !== undefined) {
        const groupId = groupSystem.getGroupId(shape.id);
        if (groupId !== undefined) {
            groupSystem.removeGroup(groupId, true);
        }
    }
    close();
}

function enlargeGroup(): void {
    const selection = selectedSystem
        .get({ includeComposites: false })
        .map((s) => ({ id: s.id, groupId: groupSystem.getGroupId(s.id) }));
    const shape = selection.find((s) => s.groupId !== undefined);
    if (shape?.groupId !== undefined) {
        groupSystem.addGroupMembers(
            shape.groupId,
            selection.filter((s) => s.groupId === undefined).map((s) => ({ uuid: s.id })),
            true,
        );
    }
    close();
}

const activeLayer = floorState.currentLayer as ComputedRef<ILayer>;
const activeLocation = toRef(locationSettingsState.reactive, "activeLocation");
const currentFloorIndex = toRef(floorState.reactive, "floorIndex");
const floors = toRef(floorState.reactive, "floors");
</script>

<template>
    <ContextMenu :visible="showShapeContextMenu" :left="shapeContextLeft" :top="shapeContextTop" @cm:close="close">
        <li v-if="gameState.reactive.isDm && floors.length > 1">
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
        <li v-if="isOwned" @click="moveToBack">{{ t("game.ui.selection.ShapeContext.move_back") }}</li>
        <li v-if="isOwned" @click="moveToFront">{{ t("game.ui.selection.ShapeContext.move_front") }}</li>
        <li v-if="isOwned && !selectionIncludesSpawnToken" @click="addToInitiative">{{ getInitiativeWord() }}</li>
        <li v-if="!selectionIncludesSpawnToken && (gameState.reactive.isDm || isOwned)" @click="deleteSelection">
            {{ t("game.ui.selection.ShapeContext.delete_shapes") }}
        </li>
        <template v-if="hasSingleSelection">
            <li v-if="isMarker" @click="deleteMarker">{{ t("game.ui.selection.ShapeContext.remove_marker") }}</li>
            <li v-else @click="setMarker">{{ t("game.ui.selection.ShapeContext.set_marker") }}</li>
            <li v-if="!selectionIncludesSpawnToken && gameState.reactive.isDm && canBeSaved" @click="saveTemplate">
                {{ t("game.ui.templates.save") }}
            </li>
            <li v-if="!hasCharacter" @click="createCharacter">Create character</li>
        </template>
        <template v-else>
            <li>
                Group
                <ul>
                    <li v-if="groups.size === 0" @click="createGroup">Create group</li>
                    <li v-if="groups.size === 1 && !hasUngrouped && !hasEntireGroup" @click="splitGroup">
                        Split from group
                    </li>
                    <li v-if="groups.size === 1 && !hasUngrouped && hasEntireGroup" @click="removeEntireGroup">
                        Remove group
                    </li>
                    <li v-if="groups.size > 1" @click="mergeGroups">Merge groups</li>
                    <li v-if="groups.size === 1 && hasUngrouped" @click="enlargeGroup">Enlarge group</li>
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
