<script setup lang="ts">
import tinycolor from "tinycolor2";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { assetState } from "../../../../assets/state";
import { l2gz } from "../../../../core/conversions";
import { toGP } from "../../../../core/geometry";
import { DEFAULT_GRID_SIZE } from "../../../../core/grid";
import { InvalidationMode, NO_SYNC, SERVER_SYNC, SyncMode, UI_SYNC } from "../../../../core/models/types";
import { uuidv4 } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import { getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import type { DDraftData } from "../../../models/ddraft";
import { LayerName } from "../../../models/floor";
import { Circle } from "../../../shapes/variants/circle";
import { Polygon } from "../../../shapes/variants/polygon";
import { accessSystem } from "../../../systems/access";
import { pickAsset } from "../../../systems/assets/ui";
import { auraSystem } from "../../../systems/auras";
import type { Aura, AuraId } from "../../../systems/auras/models";
import { floorSystem } from "../../../systems/floors";
import { floorState } from "../../../systems/floors/state";
import { gameState } from "../../../systems/game/state";
import { playerSystem } from "../../../systems/players";
import { propertiesSystem } from "../../../systems/properties";
import { VisionBlock } from "../../../systems/properties/types";
import { locationSettingsState } from "../../../systems/settings/location/state";
import { visionState } from "../../../vision/state";

const { t } = useI18n();

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
const showSvgSection = computed(() => gameState.reactive.isDm && activeShapeStore.state.type === "assetrect");

async function uploadSvg(): Promise<void> {
    const assetId = await pickAsset();
    if (assetId === null) return;

    const assetInfo = assetState.raw.idMap.get(assetId);
    if (assetInfo === undefined || assetInfo.fileHash === null) return;

    const shape = getShape(activeShapeStore.state.id!);
    if (shape === undefined) return;
    if (shape.options === undefined) {
        shape.options = {};
    }
    await activeShapeStore.setSvgAsset(assetInfo.fileHash, SERVER_SYNC);
}

async function removeSvg(): Promise<void> {
    const shape = getShape(activeShapeStore.state.id!)!;
    if (shape.options === undefined) {
        shape.options = {};
    }
    delete shape.options.svgPaths;
    delete shape.options.svgWidth;
    delete shape.options.svgHeight;
    delete shape.options.svgAsset;
    await activeShapeStore.setSvgAsset(undefined, SERVER_SYNC);
}

function applyDDraft(): void {
    const dDraftData = activeShapeStore.state.options as DDraftData;
    const size = dDraftData.ddraft_resolution.pixels_per_grid;

    const realShape = getShape(activeShapeStore.state.id!) as IAsset;

    const targetRP = realShape.refPoint;

    const dW = realShape.w / (dDraftData.ddraft_resolution.map_size.x * size);
    const dH = realShape.h / (dDraftData.ddraft_resolution.map_size.y * size);

    const tokenLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Tokens)!;
    const fowLayer = floorSystem.getLayer(floorState.currentFloor.value!, LayerName.Lighting)!;

    for (const wall of dDraftData.ddraft_line_of_sight) {
        const points = wall.map((w) => toGP(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
        if (points.length === 0) continue;

        const shape = new Polygon(points[0]!, points.slice(1), { openPolygon: true }, { strokeColour: ["red"] });
        accessSystem.addAccess(
            shape.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            UI_SYNC,
        );

        propertiesSystem.setBlocksVision(shape.id, VisionBlock.Complete, NO_SYNC, false);
        propertiesSystem.setBlocksMovement(shape.id, true, NO_SYNC, false);
        fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    for (const portal of dDraftData.ddraft_portals) {
        const points = portal.bounds.map((w) => toGP(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
        if (points.length === 0) continue;

        const shape = new Polygon(points[0]!, points.slice(1), { openPolygon: true }, { strokeColour: ["blue"] });
        accessSystem.addAccess(
            shape.id,
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            UI_SYNC,
        );

        if (portal.closed) {
            propertiesSystem.setBlocksVision(shape.id, VisionBlock.Complete, NO_SYNC, false);
            propertiesSystem.setBlocksMovement(shape.id, true, NO_SYNC, false);
        }
        fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    }

    for (const light of dDraftData.ddraft_lights) {
        const refPoint = toGP(targetRP.x + light.position.x * size * dW, targetRP.y + light.position.y * size * dH);

        const shape = new Circle(refPoint, l2gz(10));
        propertiesSystem.setIsInvisible(shape.id, true, NO_SYNC);

        const aura: Aura = {
            uuid: uuidv4() as unknown as AuraId,
            active: true,
            visionSource: true,
            visible: true,
            name: "ddraft light source",
            value: (light.range * DEFAULT_GRID_SIZE) / locationSettingsState.raw.unitSize.value,
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
            playerSystem.getCurrentPlayer()!.name,
            { edit: true, movement: true, vision: true },
            SERVER_SYNC,
        );
    }

    const layer = realShape.layer;
    if (layer !== undefined) {
        visionState.recalculateVision(layer.floor);
        visionState.recalculateMovement(layer.floor);
        fowLayer.invalidate(false);
        layer.invalidate(false);
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <template v-if="showSvgSection">
            <div class="spanrow header">{{ t("game.ui.selection.edit_dialog.extra.lighting_vision") }}</div>
            <template v-if="!hasPath">
                <label for="edit_dialog-extra-upload_walls">
                    {{ t("game.ui.selection.edit_dialog.extra.upload_walls") }} (svg)
                </label>
                <button id="edit_dialog-extra-upload_walls" @click="uploadSvg">{{ t("common.upload") }}</button>
            </template>
            <template v-else>
                <label for="edit_dialog-extra-upload_walls">
                    {{ t("game.ui.selection.edit_dialog.extra.remove_walls") }} (svg)
                </label>
                <button id="edit_dialog-extra-upload_walls" @click="removeSvg">{{ t("common.remove") }}</button>
            </template>
            <template v-if="hasDDraftInfo">
                <label for="edit_dialog-extra-upload_walls">
                    {{ t("game.ui.selection.edit_dialog.extra.apply_draft_info") }}
                </label>
                <button id="edit_dialog-extra-upload_walls" @click="applyDDraft">{{ t("common.apply") }}</button>
            </template>
        </template>
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
