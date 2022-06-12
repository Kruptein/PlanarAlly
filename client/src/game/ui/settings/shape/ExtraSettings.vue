<script setup lang="ts">
import tinycolor from "tinycolor2";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { l2gz } from "../../../../core/conversions";
import { toGP } from "../../../../core/geometry";
import { InvalidationMode, NO_SYNC, SERVER_SYNC, SyncMode, UI_SYNC } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { getChecked, getValue, uuidv4 } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { clientStore, DEFAULT_GRID_SIZE } from "../../../../store/client";
import { floorStore } from "../../../../store/floor";
import { gameStore } from "../../../../store/game";
import { settingsStore } from "../../../../store/settings";
import { getShape } from "../../../id";
import type { DDraftData } from "../../../models/ddraft";
import { LayerName } from "../../../models/floor";
import type { Asset } from "../../../shapes/variants/asset";
import { Circle } from "../../../shapes/variants/circle";
import { Polygon } from "../../../shapes/variants/polygon";
import { accessSystem } from "../../../systems/access";
import { auraSystem } from "../../../systems/auras";
import type { Aura, AuraId } from "../../../systems/auras/models";
import { visionState } from "../../../vision/state";
import LabelManager from "../../LabelManager.vue";

const { t } = useI18n();
const modals = useModal();

const textarea = ref<HTMLTextAreaElement | null>(null);

const owned = accessSystem.$.hasEditAccess;

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
    activeShapeStore.setAnnotation(getValue(event), sync ? SERVER_SYNC : NO_SYNC);
}

function setAnnotationVisible(event: Event): void {
    if (!owned.value) return;
    activeShapeStore.setAnnotationVisible(getChecked(event), SERVER_SYNC);
}

// LABELS

const showLabelManager = ref(false);

function addLabel(label: string): void {
    if (!owned.value) return;
    activeShapeStore.addLabel(label, SERVER_SYNC);
}

function removeLabel(uuid: string): void {
    if (!owned.value) return;
    activeShapeStore.removeLabel(uuid, SERVER_SYNC);
}

// SVG / DDRAFT

const hasDDraftInfo = computed(() => "ddraft_format" in (activeShapeStore.state.options ?? {}));
const hasPath = computed(() => {
    if ("svgPaths" in (activeShapeStore.state.options ?? {})) {
        return activeShapeStore.state.options?.svgPaths !== undefined;
    } else if ("svgAsset" in (activeShapeStore.state.options ?? {})) {
        return activeShapeStore.state.options?.svgAsset !== undefined;
    }
    return false;
});
const showSvgSection = computed(() => gameStore.state.isDm && activeShapeStore.state.type === "assetrect");

async function uploadSvg(): Promise<void> {
    const asset = await modals.assetPicker();
    if (asset === undefined || asset.file_hash === undefined) return;

    const shape = getShape(activeShapeStore.state.id!)!;
    if (shape.options === undefined) {
        shape.options = {};
    }
    activeShapeStore.setSvgAsset(asset.file_hash, SERVER_SYNC);
}

function removeSvg(): void {
    const shape = getShape(activeShapeStore.state.id!)!;
    if (shape.options === undefined) {
        shape.options = {};
    }
    delete shape.options.svgPaths;
    delete shape.options.svgWidth;
    delete shape.options.svgHeight;
    delete shape.options.svgAsset;
    activeShapeStore.setSvgAsset(undefined, SERVER_SYNC);
}

function applyDDraft(): void {
    const dDraftData = activeShapeStore.state.options! as DDraftData;
    const size = dDraftData.ddraft_resolution.pixels_per_grid;

    const realShape = getShape(activeShapeStore.state.id!)! as Asset;

    const targetRP = realShape.refPoint;

    const dW = realShape.w / (dDraftData.ddraft_resolution.map_size.x * size);
    const dH = realShape.h / (dDraftData.ddraft_resolution.map_size.y * size);

    const tokenLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Tokens)!;
    const fowLayer = floorStore.getLayer(floorStore.currentFloor.value!, LayerName.Lighting)!;

    for (const wall of dDraftData.ddraft_line_of_sight) {
        const points = wall.map((w) => toGP(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
        const shape = new Polygon(points[0], points.slice(1), { openPolygon: true, strokeColour: ["red"] });
        accessSystem.addAccess(
            shape.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            UI_SYNC,
        );

        shape.setBlocksVision(true, NO_SYNC, false);
        shape.setBlocksMovement(true, NO_SYNC, false);
        fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    for (const portal of dDraftData.ddraft_portals) {
        const points = portal.bounds.map((w) => toGP(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
        const shape = new Polygon(points[0], points.slice(1), { openPolygon: true, strokeColour: ["blue"] });
        accessSystem.addAccess(
            shape.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            UI_SYNC,
        );

        if (portal.closed) {
            shape.setBlocksVision(true, NO_SYNC, false);
            shape.setBlocksMovement(true, NO_SYNC, false);
        }
        fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    for (const light of dDraftData.ddraft_lights) {
        const refPoint = toGP(targetRP.x + light.position.x * size * dW, targetRP.y + light.position.y * size * dH);

        const shape = new Circle(refPoint, l2gz(10));
        shape.isInvisible = true;

        const aura: Aura = {
            uuid: uuidv4() as unknown as AuraId,
            active: true,
            visionSource: true,
            visible: true,
            name: "ddraft light source",
            value: (light.range * DEFAULT_GRID_SIZE) / settingsStore.unitSize.value,
            dim: 0,
            colour: tinycolor(light.color)
                .setAlpha(0.05 * light.intensity)
                .toRgbString(),
            borderColour: "rgba(0, 0, 0, 0)",
            angle: 360,
            direction: 0,
        };

        tokenLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);

        auraSystem.add(shape.id, aura, SERVER_SYNC);
        accessSystem.addAccess(
            shape.id,
            clientStore.state.username,
            { edit: true, movement: true, vision: true },
            SERVER_SYNC,
        );
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
