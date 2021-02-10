<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";

import LabelManager from "@/game/ui/labels.vue";

import { SyncTo } from "../../../../core/models/types";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { LabelManager } })
export default class AccessSettings extends Vue {
    @Prop() active!: boolean;

    $refs!: {
        labels: LabelManager;
        textarea: HTMLTextAreaElement;
    };

    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
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
}
</script>

<template>
    <div class="panel restore-panel">
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
    </div>
</template>

<style scoped lang="scss">
.panel {
    grid-template-columns: [name] 1fr [toggle] 30px [end];
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
