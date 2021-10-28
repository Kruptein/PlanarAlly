<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { l2gz } from "../../../../core/conversions";
import { toGP } from "../../../../core/geometry";
import { InvalidationMode, SyncMode, SyncTo } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { getChecked, getValue, uuidv4 } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { clientStore, DEFAULT_GRID_SIZE } from "../../../../store/client";
import { floorStore } from "../../../../store/floor";
import { gameStore } from "../../../../store/game";
import { settingsStore } from "../../../../store/settings";
import { UuidMap } from "../../../../store/shapeMap";
import type { DDraftData } from "../../../models/ddraft";
import { LayerName } from "../../../models/floor";
import type { ShapeOptions } from "../../../models/shapes";
import type { Aura } from "../../../shapes/interfaces";
import type { Asset } from "../../../shapes/variants/asset";
import { Circle } from "../../../shapes/variants/circle";
import { Polygon } from "../../../shapes/variants/polygon";
import { visionState } from "../../../vision/state";
import LabelManager from "../../LabelManager.vue";

const { t } = useI18n();
const modals = useModal();

const textarea = ref<HTMLTextAreaElement | null>(null);

const owned = activeShapeStore.hasEditAccess;

// ANNOTATIONS

function calcHeight(): void {
    if (textarea.value !== null) {
        textarea.value.style.height = "auto";
        textarea.value.style.height = textarea.value.scrollHeight + "px";
    }
}

function updateAnnotation(event: Event, sync = true): void {
    if (!owned.value) return;
    calcHeight();
    activeShapeStore.setAnnotation(getValue(event), sync ? SyncTo.SERVER : SyncTo.SHAPE);
}

function setAnnotationVisible(event: Event): void {
    if (!owned.value) return;
    activeShapeStore.setAnnotationVisible(getChecked(event), SyncTo.SERVER);
}

// LABELS

const showLabelManager = ref(false);

function addLabel(label: string): void {
    if (!owned.value) return;
    activeShapeStore.addLabel(label, SyncTo.SERVER);
}

function removeLabel(uuid: string): void {
    if (!owned.value) return;
    activeShapeStore.removeLabel(uuid, SyncTo.SERVER);
}

// SVG / DDRAFT

const hasDDraftInfo = computed(() => "ddraft_format" in (activeShapeStore.state.options ?? {}));
const hasPath = computed(
    () => "svgPaths" in (activeShapeStore.state.options ?? {}) || "svgAsset" in (activeShapeStore.state.options ?? {}),
);
const showSvgSection = computed(() => gameStore.state.isDm && activeShapeStore.state.type === "assetrect");

async function uploadSvg(): Promise<void> {
    const asset = await modals.assetPicker();
    if (asset === undefined || asset.file_hash === undefined) return;

    const options: Partial<Omit<ShapeOptions, "svgPaths">> = {
        ...activeShapeStore.state.options!,
        svgAsset: asset.file_hash,
    };
    activeShapeStore.setOptions(options, SyncTo.SERVER);
    (UuidMap.get(activeShapeStore.state.uuid!)! as Asset).loadSvgs();
}

function removeSvg(): void {
    const options = { ...activeShapeStore.state.options! };
    delete options.svgPaths;
    delete options.svgWidth;
    delete options.svgHeight;
    delete options.svgAsset;
    activeShapeStore.setOptions(options as Omit<ShapeOptions, "svgPaths">, SyncTo.SERVER);
    visionState.recalculateVision(activeShapeStore.floor.value!);
    floorStore.invalidate({ id: activeShapeStore.floor.value! });
}

function applyDDraft(): void {
    const dDraftData = activeShapeStore.state.options! as DDraftData;
    const size = dDraftData.ddraft_resolution.pixels_per_grid;

    const realShape = UuidMap.get(activeShapeStore.state.uuid!)! as Asset;

    const targetRP = realShape.refPoint;

    const dW = realShape.w / (dDraftData.ddraft_resolution.map_size.x * size);
    const dH = realShape.h / (dDraftData.ddraft_resolution.map_size.y * size);

    const fowLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Lighting)!;

    for (const wall of dDraftData.ddraft_line_of_sight) {
        const points = wall.map((w) => toGP(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
        const shape = new Polygon(points[0], points.slice(1), { openPolygon: true, strokeColour: "red" });
        shape.addOwner({ user: clientStore.state.username, access: { edit: true } }, SyncTo.UI);

        shape.setBlocksVision(true, SyncTo.UI, false);
        shape.setBlocksMovement(true, SyncTo.UI, false);
        fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    for (const portal of dDraftData.ddraft_portals) {
        const points = portal.bounds.map((w) => toGP(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
        const shape = new Polygon(points[0], points.slice(1), { openPolygon: true, strokeColour: "blue" });
        shape.addOwner({ user: clientStore.state.username, access: { edit: true } }, SyncTo.UI);

        if (portal.closed) {
            shape.setBlocksVision(true, SyncTo.UI, false);
            shape.setBlocksMovement(true, SyncTo.UI, false);
        }
        fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    for (const light of dDraftData.ddraft_lights) {
        const refPoint = toGP(targetRP.x + light.position.x * size * dW, targetRP.y + light.position.y * size * dH);

        const shape = new Circle(refPoint, l2gz(10));
        shape.isInvisible = true;

        const aura: Aura = {
            uuid: uuidv4(),
            active: true,
            visionSource: true,
            visible: true,
            name: "ddraft light source",
            value: light.range * settingsStore.unitSize.value * (DEFAULT_GRID_SIZE / size),
            dim: 0,
            colour: `#${light.color}`,
            borderColour: "rgba(0, 0, 0, 0)",
            angle: 360,
            direction: 0,
        };

        shape.pushAura(aura, SyncTo.UI);
        shape.addOwner({ user: clientStore.state.username, access: { edit: true } }, SyncTo.UI);

        realShape.layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    visionState.recalculateVision(realShape.floor.id);
    visionState.recalculateMovement(realShape.floor.id);
    fowLayer.invalidate(false);
    realShape.layer.invalidate(false);
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">{{ t("common.labels") }}</div>
        <div id="labels" class="spanrow">
            <div v-for="label in activeShapeStore.state.labels" class="label" :key="label.uuid">
                <template v-if="label.category">
                    <div class="label-user">{{ label.category }}</div>
                    <div class="label-main" @click="removeLabel(label.uuid)">{{ label.name }}</div>
                </template>
                <template v-if="!label.category">
                    <div class="label-main" @click="removeLabel(label.uuid)">{{ label.name }}</div>
                </template>
            </div>
            <div class="label" id="label-add" v-if="owned">
                <div class="label-main" @click="showLabelManager = true">+</div>
            </div>
        </div>
        <div class="spanrow header">{{ t("common.annotation") }}</div>
        <label for="edit_dialog-extra-show_annotation">
            {{ t("game.ui.selection.edit_dialog.dialog.show_annotation") }}
        </label>
        <input
            id="edit_dialog-extra-show_annotation"
            type="checkbox"
            :checked="activeShapeStore.state.annotationVisible"
            @click="setAnnotationVisible"
            class="styled-checkbox"
            :disabled="!owned"
        />
        <textarea
            class="spanrow"
            ref="textarea"
            :value="activeShapeStore.state.annotation"
            @input="updateAnnotation($event, false)"
            @change="updateAnnotation"
            :disabled="!owned"
        ></textarea>
        <template v-if="showSvgSection">
            <div class="spanrow header">Lighting & Vision</div>
            <template v-if="!hasPath">
                <label for="edit_dialog-extra-upload_walls">Upload walls (svg)</label>
                <button id="edit_dialog-extra-upload_walls" @click="uploadSvg">Upload</button>
            </template>
            <template v-else>
                <label for="edit_dialog-extra-upload_walls">Remove walls (svg)</label>
                <button id="edit_dialog-extra-upload_walls" @click="removeSvg">Remove</button>
            </template>
            <template v-if="hasDDraftInfo">
                <label for="edit_dialog-extra-upload_walls">Apply ddraft info</label>
                <button id="edit_dialog-extra-upload_walls" @click="applyDDraft">Apply</button>
            </template>
        </template>
        <teleport to="#teleport-modals" v-if="showLabelManager">
            <LabelManager v-model:visible="showLabelManager" @addLabel="addLabel" />
        </teleport>
    </div>
</template>

<style scoped lang="scss">
.panel {
    grid-template-columns: [name] 1fr [toggle] auto [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
}

.label {
    display: inline-flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    background-color: white;
    font-size: 13px;
    margin: 5px;
}

textarea {
    grid-column-start: name;
    padding: 5px;
    min-height: 100px;
    width: 300px;
    max-height: 30vh;
}

.label:hover > .label-main::before {
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

#label-add:hover {
    > .label-main {
        pointer-events: auto;
        cursor: pointer;
        color: white;
        font-weight: bold;
        background-color: #ff7052;
    }

    > .label-main::before {
        content: "";
    }
}

.label-user {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    background-color: #ff7052;
    border: solid 1px #ff7052;
    padding: 5px;

    + .label-main {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
}

.label-main {
    border: solid 1px #ff7052;
    border-radius: 10px;
    padding: 5px;
    pointer-events: none;
}
</style>
