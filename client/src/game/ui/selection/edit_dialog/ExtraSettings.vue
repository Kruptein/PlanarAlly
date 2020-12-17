<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop, Watch } from "vue-property-decorator";

import LabelManager from "@/game/ui/labels.vue";

import { Shape } from "@/game/shapes/shape";

@Component({ components: { LabelManager } })
export default class AccessSettings extends Vue {
    @Prop() owned!: boolean;
    @Prop() shape!: Shape;
    @Prop() active!: boolean;

    $refs!: {
        labels: LabelManager;
        textarea: HTMLTextAreaElement;
    };

    @Watch("active")
    panelActivated(active: boolean): void {
        if (active) this.calcHeight();
    }

    updateAnnotation(event: { target: HTMLInputElement }, sync = true): void {
        this.calcHeight();
        if (!this.owned) return;
        this.shape.setAnnotation(event.target.value, sync);
    }

    openLabelManager(): void {
        this.$refs.labels.open();
    }

    removeLabel(uuid: string): void {
        if (!this.owned) return;
        this.shape.removeLabel(uuid, true);
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
        <LabelManager ref="labels"></LabelManager>
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
    grid-template-columns: [name] 1fr [edit] 30px [move] 30px [vision] 30px [remove] 30px [end];
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
