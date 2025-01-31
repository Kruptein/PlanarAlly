<script setup lang="ts">
import { computed, toRef } from "vue";
import type { ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

import type { ApiSpawnInfo, CharacterCreate } from "../../../apiTypes";
import ContextMenu from "../../../core/components/contextMenu/ContextMenu.vue";
import type { Section } from "../../../core/components/contextMenu/types";
import type { LocalId } from "../../../core/id";
import { defined, guard, map } from "../../../core/iter";
import { SyncMode } from "../../../core/models/types";
import { useModal } from "../../../core/plugins/modals/plugin";
import { activeShapeStore } from "../../../store/activeShape";
import { locationStore } from "../../../store/location";
import { requestAssetOptions, sendAssetOptions } from "../../api/emits/asset";
import { requestSpawnInfo } from "../../api/emits/location";
import { sendShapePositionUpdate, sendShapesMove } from "../../api/emits/shape/core";
import { getGlobalId, getShape } from "../../id";
import type { ILayer } from "../../interfaces/layer";
import type { IShape } from "../../interfaces/shape";
import { compositeState } from "../../layers/state";
import type { AssetOptions } from "../../models/asset";
import type { Floor, LayerName } from "../../models/floor";
import { toTemplate } from "../../shapes/templates";
import { deleteShapes } from "../../shapes/utils";
import { accessSystem } from "../../systems/access";
import { sendCreateCharacter } from "../../systems/characters/emits";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { groupSystem } from "../../systems/groups";
import { markerSystem } from "../../systems/markers";
import { markerState } from "../../systems/markers/state";
import { noteState } from "../../systems/notes/state";
import { NoteManagerMode } from "../../systems/notes/types";
import { openNoteManager } from "../../systems/notes/ui";
import { playerSystem } from "../../systems/players";
import { getProperties } from "../../systems/properties/state";
import { selectedSystem } from "../../systems/selected";
import { collapseSelection, expandSelection } from "../../systems/selected/collapse";
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

function openEditDialog(): boolean {
    if (selectedState.raw.selected.size !== 1) return false;
    activeShapeStore.setShowEditDialog(true);
    return true;
}

function openNotes(): boolean {
    if (selectedState.raw.selected.size !== 1) return false;
    openNoteManager(NoteManagerMode.List, [...selectedState.raw.selected][0]);
    return true;
}

// MARKERS

const isMarker = computed(() => {
    const sel = selectedState.reactive.selected;
    if (sel.size !== 1) return false;
    return markerState.reactive.markers.has([...sel][0]!);
});

function deleteMarker(): boolean {
    const sel = selectedState.raw.selected;
    if (sel.size !== 1) return false;
    markerSystem.removeMarker([...sel][0]!, true);
    return true;
}

function setMarker(): boolean {
    const sel = selectedState.raw.selected;
    if (sel.size !== 1) return false;
    markerSystem.newMarker([...sel][0]!, true);
    return true;
}

// INITIATIVE

async function addToInitiative(): Promise<boolean> {
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
            if (answer === undefined) return false;
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
    return true;
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

function setLayer(newLayer: LayerName): boolean {
    const oldSelection = [...selectedSystem.get({ includeComposites: true })];
    selectedSystem.clear();
    moveLayer(oldSelection, floorSystem.getLayer(floorState.currentFloor.value!, newLayer)!, true);
    return true;
}

function moveToBack(): boolean {
    const layer = floorState.currentLayer.value!;
    for (const shape of selectedSystem.get({ includeComposites: false })) {
        layer.moveShapeOrder(shape, 0, SyncMode.FULL_SYNC);
    }
    return true;
}

function moveToFront(): boolean {
    const layer = floorState.currentLayer.value!;
    for (const shape of selectedSystem.get({ includeComposites: false })) {
        layer.moveShapeOrder(shape, layer.size({ includeComposites: true, onlyInView: false }) - 1, SyncMode.FULL_SYNC);
    }

    return true;
}

// FLOORS

function setFloor(floor: Floor): boolean {
    moveFloor([...selectedSystem.get({ includeComposites: true })], floor, true);
    return true;
}

// LOCATIONS

const locations = computed(() => {
    if (gameState.reactive.isDm && !selectionIncludesSpawnToken.value) {
        return locationStore.activeLocations.value;
    }
    return [];
});

async function setLocation(newLocation: number): Promise<boolean> {
    const shapes = selectedSystem.get({ includeComposites: true }).filter((s) => !getProperties(s.id)!.isLocked);
    if (shapes.length === 0) {
        return false;
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
            return true;
        case 1:
            spawnLocation = spawnInfo[0]!;
            break;
        default: {
            const choices = await modals.selectionBox(
                "Choose the desired spawn location",
                spawnInfo.map((s) => s.name),
            );
            if (choices === undefined) return false;
            const choiceShape = spawnInfo.find((s) => s.name === choices[0]);
            if (choiceShape === undefined) return false;
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

    return true;
}

// SELECTION

const hasSingleSelection = computed(() => selectedState.reactive.selected.size === 1);

function deleteSelection(): boolean {
    deleteShapes(selectedSystem.get({ includeComposites: true }), SyncMode.FULL_SYNC);
    return true;
}

// TEMPLATES

const canBeSaved = computed(() =>
    [...selectedState.reactive.selected].every(
        (s) => getShape(s)!.assetId !== undefined && compositeState.getCompositeParent(s) === undefined,
    ),
);

async function saveTemplate(): Promise<boolean> {
    const shape = selectedSystem.get({ includeComposites: false })[0];
    if (shape === undefined) return false;

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
        return false;
    }
    const choices = Object.keys(assetOptions.templates);
    try {
        const selection = await modals.selectionBox(t("game.ui.templates.save"), choices, {
            defaultButton: t("game.ui.templates.overwrite"),
            customButton: t("game.ui.templates.create_new"),
        });
        if (selection === undefined || selection.length === 0) return false;
        const notes = noteState.raw.shapeNotes.get1(shape.id);
        if (notes !== undefined) {
            shape.options.templateNoteIds = notes.map((n) => n);
        } else if (shape.options.templateNoteIds !== undefined) {
            delete shape.options.templateNoteIds;
        }
        assetOptions.templates[selection[0]!] = toTemplate(shape.asDict());
        sendAssetOptions(shape.assetId, assetOptions);
    } catch {
        // no-op ; action cancelled
    }
    return true;
}

// CHARACTER
const canHaveCharacter = computed(() => {
    const selection = selectedState.reactive.selected;
    if (selection.size !== 1) return false;
    const shapeId = [...selection][0]!;
    const compParent = compositeState.getCompositeParent(shapeId);
    if (compParent?.variants.some((v) => getShape(v.id)?.character !== undefined) ?? false) return false;
    const shape = getShape(shapeId);
    if (shape?.assetId === undefined) return false;
    return true;
});

function createCharacter(): boolean {
    const selectedId = [...selectedState.raw.selected].at(0);
    if (selectedId === undefined) return false;
    const shape = getShape(selectedId);
    if (shape === undefined || shape.character !== undefined) return false;
    const data: CharacterCreate = {
        shape: getGlobalId(selectedId)!,
        name: getProperties(selectedId)!.name,
    };
    sendCreateCharacter(data);
    return true;
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

function createGroup(): boolean {
    groupSystem.createNewGroupForShapes([...selectedState.raw.selected]);
    return true;
}

async function splitGroup(): Promise<boolean> {
    const keepBadges = await modals.confirm("Splitting group", "Do you wish to keep the original badges?", {
        no: "No, reset them",
    });
    if (keepBadges === undefined) return false;
    groupSystem.createNewGroupForShapes([...selectedState.raw.selected], keepBadges);
    return true;
}

async function mergeGroups(): Promise<boolean> {
    const keepBadges = await modals.confirm(
        "Merging group",
        "Do you wish to keep the original badges? This can lead to duplicate badges!",
        {
            no: "No, reset them",
        },
    );
    if (keepBadges === undefined) return false;
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
    return true;
}

function removeEntireGroup(): boolean {
    const shape = selectedSystem.get({ includeComposites: false })[0];
    if (shape !== undefined) {
        const groupId = groupSystem.getGroupId(shape.id);
        if (groupId !== undefined) {
            groupSystem.removeGroup(groupId, true);
        }
    }
    return true;
}

function enlargeGroup(): boolean {
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
    return true;
}

function _collapseSelection(): boolean {
    collapseSelection();
    return true;
}

async function _expandSelection(): Promise<boolean> {
    const updateList: IShape[] = [];
    await expandSelection(updateList);
    sendShapePositionUpdate(updateList, false);

    return true;
}

const activeLayer = floorState.currentLayer as ComputedRef<ILayer>;
const activeLocation = toRef(locationSettingsState.reactive, "activeLocation");
const currentFloorIndex = toRef(floorState.reactive, "floorIndex");
const floors = toRef(floorState.reactive, "floors");

const sections = computed(() => {
    // MOVE [group A] >
    const moveGroupA = [];
    if (gameState.reactive.isDm && floors.value.length > 1) {
        moveGroupA.push({
            title: t("common.floor"),
            subitems: floors.value.map((floor, idx) => ({
                title: floor.name,
                action: () => setFloor(floor),
                selected: idx === currentFloorIndex.value,
            })),
        });
    }
    if (layers.value.length > 1) {
        moveGroupA.push({
            title: t("common.layer"),
            subitems: layers.value.map((layer) => ({
                title: layerTranslationMapping[layer.name] ?? "",
                action: () => setLayer(layer.name),
                selected: layer.name === activeLayer.value.name,
            })),
        });
    }
    if (locations.value.length > 1) {
        moveGroupA.push({
            title: t("common.location"),
            subitems: locations.value.map((location) => ({
                title: location.name,
                action: () => setLocation(location.id),
                selected: location.id === activeLocation.value,
            })),
        });
    }

    // MOVE [group B] >
    const moveGroupB = [
        {
            title: t("game.ui.selection.ShapeContext.move_back"),
            action: moveToBack,
            disabled: !isOwned.value,
        },
        {
            title: t("game.ui.selection.ShapeContext.move_front"),
            action: moveToFront,
            disabled: !isOwned.value,
        },
    ];

    const moveSection = [moveGroupA, moveGroupB];

    const groupsSection = [];
    if (!hasSingleSelection.value) {
        const groupSize = groups.value.size;
        if (groupSize === 0) {
            groupsSection.push({
                title: "Create group",
                action: createGroup,
            });
        } else if (groupSize === 1) {
            if (hasUngrouped.value) {
                groupsSection.push({
                    title: "Enlarge group",
                    action: enlargeGroup,
                });
            } else {
                if (hasEntireGroup.value) {
                    groupsSection.push({
                        title: "Remove group",
                        action: removeEntireGroup,
                    });
                } else if (!hasEntireGroup.value) {
                    groupsSection.push({
                        title: "Split from group",
                        action: splitGroup,
                    });
                }
            }
        } else {
            groupsSection.push({
                title: "Merge groups",
                action: mergeGroups,
            });
        }
    }

    const rootGroupA: Section[] = [
        {
            title: "Move",
            subitems: moveSection,
        },
        {
            title: "Group",
            subitems: groupsSection,
        },
    ];

    if (hasSingleSelection.value) {
        const selection = selectedState.reactive.focus!;
        if ((getShape(selection)?.options?.collapsedIds?.length ?? 0) > 0) {
            rootGroupA.push({
                title: "Expand",
                action: _expandSelection,
            });
        }
    } else {
        rootGroupA.push({
            title: "Collapse",
            action: _collapseSelection,
        });
    }

    const rootGroupB: Section[] = [];

    if (isOwned.value && !selectionIncludesSpawnToken.value) {
        rootGroupB.push({
            title: getInitiativeWord(),
            action: addToInitiative,
        });
    }

    if (hasSingleSelection.value) {
        if (isMarker.value) {
            rootGroupB.push({
                title: t("game.ui.selection.ShapeContext.remove_marker"),
                action: deleteMarker,
            });
        } else {
            rootGroupB.push({
                title: t("game.ui.selection.ShapeContext.set_marker"),
                action: setMarker,
            });
        }

        if (!selectionIncludesSpawnToken.value && gameState.reactive.isDm && canBeSaved.value) {
            rootGroupB.push({
                title: t("game.ui.templates.save"),
                action: saveTemplate,
            });
        }

        if (isOwned.value && canHaveCharacter.value) {
            rootGroupB.push({
                title: "Create character",
                action: createCharacter,
            });
        }
    }

    const rootGroupC: Section[] = [];
    if (!selectionIncludesSpawnToken.value && (gameState.reactive.isDm || isOwned.value)) {
        rootGroupC.push({
            title: t("game.ui.selection.ShapeContext.delete_shapes"),
            action: deleteSelection,
        });
    }

    const rootGroupD: Section[] = [];

    if (hasSingleSelection.value) {
        rootGroupD.push([
            {
                title: t("game.ui.selection.ShapeContext.show_props"),
                action: openEditDialog,
            },
            {
                title: "Open notes",
                action: openNotes,
            },
        ]);
    }

    return [rootGroupA, rootGroupB, rootGroupC, rootGroupD];
});
</script>

<template>
    <ContextMenu
        :visible="showShapeContextMenu"
        :left="shapeContextLeft"
        :top="shapeContextTop"
        :sections="sections"
        @cm:close="close"
    />
</template>

<style scoped lang="scss">
.ContextMenu ul {
    width: -moz-fit-content;
    width: fit-content;
}
</style>
