<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

import AssetPicker from "@/core/components/modals/AssetPicker.vue";
import LabelManager from "@/game/ui/LabelManager.vue";

import { InvalidationMode, SyncMode, SyncTo } from "../../../../core/models/types";
import { baseAdjustedFetch, uuidv4 } from "../../../../core/utils";
import { GlobalPoint } from "../../../geom";
import { layerManager } from "../../../layers/manager";
import { floorStore } from "../../../layers/store";
import { DDraftData } from "../../../models/ddraft";
import { gameSettingsStore } from "../../../settings";
import { Aura } from "../../../shapes/interfaces";
import { Asset } from "../../../shapes/variants/asset";
import { Circle } from "../../../shapes/variants/circle";
import { Polygon } from "../../../shapes/variants/polygon";
import { DEFAULT_GRID_SIZE, gameStore } from "../../../store";
import { l2gz } from "../../../units";
import { visibilityStore } from "../../../visibility/store";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { AssetPicker, LabelManager } })
export default class ExtraSettings extends Vue {
    @Prop() active!: boolean;
    hasPath = false;

    $refs!: {
        assetPicker: AssetPicker;
        labels: LabelManager;
        textarea: HTMLTextAreaElement;
    };

    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        this.hasPath = activeShapeStore.options?.svgPaths !== undefined;
        return activeShapeStore;
    }

    get showSvgSection(): boolean {
        return gameStore.IS_DM && this.shape.type === "assetrect";
    }

    get hasDDraftInfo(): boolean {
        return "ddraft_format" in (this.shape.options ?? {});
    }

    @Watch("active")
    panelActivated(active: boolean): void {
        if (active) this.calcHeight();
    }

    updateAnnotation(event: { target: HTMLInputElement }, sync = true): void {
        if (!this.owned) return;
        this.calcHeight();
        this.shape.setAnnotation({ annotation: event.target.value, syncTo: sync ? SyncTo.SERVER : SyncTo.SHAPE });
    }

    setAnnotationVisible(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setAnnotationVisible({ visible: event.target.checked, syncTo: SyncTo.SERVER });
    }

    openLabelManager(): void {
        this.$refs.labels.open();
    }

    addLabel(label: string): void {
        if (!this.owned) return;
        this.shape.addLabel({ label, syncTo: SyncTo.SERVER });
    }

    removeLabel(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeLabel({ label: uuid, syncTo: SyncTo.SERVER });
    }

    calcHeight(): void {
        if (this.$refs.textarea) {
            const el = this.$refs.textarea;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        }
    }

    async uploadSvg(): Promise<void> {
        const asset = await this.$refs.assetPicker.open();
        if (asset === undefined || asset.file_hash === undefined) return;

        const data = await baseAdjustedFetch(`/static/assets/${asset.file_hash}`);
        const svgText = await data.text();
        const template = document.createElement("template");
        template.innerHTML = svgText;
        const svgEl = template.content.children[0] as SVGSVGElement;
        const w = svgEl.width.baseVal.value;
        const h = svgEl.height.baseVal.value;
        const paths: string[] = [];

        for (const pathChild of svgEl.getElementsByTagNameNS("http://www.w3.org/2000/svg", "path")) {
            const path = pathChild.getAttribute("d");
            if (path !== null) paths.push(path);
        }
        const options = this.shape.options!;
        options.svgPaths = paths;
        options.svgWidth = w;
        options.svgHeight = h;
        this.shape.setOptions({ options, syncTo: SyncTo.SERVER });
        visibilityStore.recalculateVision(this.shape.floor!);
        this.hasPath = true;
    }

    removeSvg(): void {
        const options = this.shape.options!;
        delete options.svgPaths;
        delete options.svgWidth;
        delete options.svgHeight;
        this.shape.setOptions({ options, syncTo: SyncTo.SERVER });
        visibilityStore.recalculateVision(this.shape.floor!);
        this.hasPath = false;
    }

    applyDDraft(): void {
        const dDraftData = this.shape.options! as DDraftData;
        const size = dDraftData.ddraft_resolution.pixels_per_grid;

        const realShape = layerManager.UUIDMap.get(this.shape.uuid!)! as Asset;

        const targetRP = realShape.refPoint;

        const dW = realShape.w / (dDraftData.ddraft_resolution.map_size.x * size);
        const dH = realShape.h / (dDraftData.ddraft_resolution.map_size.y * size);

        const fowLayer = layerManager.getLayer(floorStore.currentFloor, "fow")!;

        for (const wall of dDraftData.ddraft_line_of_sight) {
            const points = wall.map((w) => new GlobalPoint(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH));
            const shape = new Polygon(points[0], points.slice(1), { openPolygon: true, strokeColour: "red" });
            shape.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.UI);

            shape.setVisionBlock(true, SyncTo.UI, false);
            shape.setMovementBlock(true, SyncTo.UI, false);
            fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
        }

        for (const portal of dDraftData.ddraft_portals) {
            const points = portal.bounds.map(
                (w) => new GlobalPoint(targetRP.x + w.x * size * dW, targetRP.y + w.y * size * dH),
            );
            const shape = new Polygon(points[0], points.slice(1), { openPolygon: true, strokeColour: "blue" });
            shape.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.UI);

            if (portal.closed) {
                shape.setVisionBlock(true, SyncTo.UI, false);
                shape.setMovementBlock(true, SyncTo.UI, false);
            }
            fowLayer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
        }

        for (const light of dDraftData.ddraft_lights) {
            const refPoint = new GlobalPoint(
                targetRP.x + light.position.x * size * dW,
                targetRP.y + light.position.y * size * dH,
            );

            const shape = new Circle(refPoint, l2gz(10));
            shape.isInvisible = true;

            const aura: Aura = {
                uuid: uuidv4(),
                active: true,
                visionSource: true,
                visible: true,
                name: "ddraft light source",
                value: light.range * gameSettingsStore.unitSize * (DEFAULT_GRID_SIZE / size),
                dim: 0,
                colour: `#${light.color}`,
                borderColour: "rgba(0, 0, 0, 0)",
                angle: 360,
                direction: 0,
            };

            shape.pushAura(aura, SyncTo.UI);
            shape.addOwner({ user: gameStore.username, access: { edit: true } }, SyncTo.UI);

            realShape.layer.addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
        }

        visibilityStore.recalculateVision(realShape.floor.id);
        visibilityStore.recalculateMovement(realShape.floor.id);
        fowLayer.invalidate(false);
        realShape.layer.invalidate(false);
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <AssetPicker ref="assetPicker" />
        <LabelManager ref="labels" @addLabel="addLabel"></LabelManager>
        <div class="spanrow header" v-t="'common.labels'"></div>
        <div id="labels" class="spanrow">
            <div v-for="label in shape.labels" class="label" :key="label.uuid">
                <template v-if="label.category">
                    <div class="label-user">{{ label.category }}</div>
                    <div class="label-main" @click="removeLabel(label.uuid)">{{ label.name }}</div>
                </template>
                <template v-if="!label.category">
                    <div class="label-main" @click="removeLabel(label.uuid)">{{ label.name }}</div>
                </template>
            </div>
            <div class="label" id="label-add" v-if="owned">
                <div class="label-main" @click="openLabelManager">+</div>
            </div>
        </div>
        <div class="spanrow header" v-t="'common.annotation'"></div>
        <label
            for="edit_dialog-extra-show_annotation"
            v-t="'game.ui.selection.edit_dialog.dialog.show_annotation'"
        ></label>
        <input
            id="edit_dialog-extra-show_annotation"
            type="checkbox"
            :checked="shape.annotationVisible"
            @click="setAnnotationVisible"
            class="styled-checkbox"
            :disabled="!owned"
        />
        <textarea
            class="spanrow"
            ref="textarea"
            :value="shape.annotation"
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
