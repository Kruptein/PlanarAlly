<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

import AssetPicker from "@/core/components/modals/AssetPicker.vue";
import LabelManager from "@/game/ui/labels.vue";

import { SyncTo } from "../../../../core/models/types";
import { baseAdjustedFetch } from "../../../../core/utils";
import { gameStore } from "../../../store";
import { visibilityStore } from "../../../visibility/store";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { AssetPicker, LabelManager } })
export default class AccessSettings extends Vue {
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
