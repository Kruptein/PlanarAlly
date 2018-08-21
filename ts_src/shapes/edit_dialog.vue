<template>
    <modal :visible="visible" @close="visible = false">
        <div class='modal-header'>
            Edit asset
        </div>
        <div class='modal-body'>
            <label for="shapeselectiondialog-name">Name</label>
            <input
                type="text"
                id="shapeselectiondialog-name"
                v-model="shape.name"
                @change="updateShape(false)"
                style="grid-column: numerator / end"
            >
            <label for="shapeselectiondialog-istoken">Is a token</label>
            <input
                type="checkbox"
                id="shapeselectiondialog-istoken"
                :checked="shape.isToken"
                @click="setToken"
                style="grid-column-start: remove;width:15px;height:15px;"
            >
            <label for="shapeselectiondialog-lightblocker">Blocks vision/light</label>
            <input
                type="checkbox"
                id="shapeselectiondialog-lightblocker"
                v-model="shape.visionObstruction"
                @click="setLightBlocker"
                style="grid-column-start: remove;width:15px;height:15px;"
            >
            <label for="shapeselectiondialog-moveblocker">Blocks movement</label>
            <input
                type="checkbox"
                id="shapeselectiondialog-moveblocker"
                :checked="shape.movementObstruction"
                @click="setMovementBlocker"
                style="grid-column-start: remove;width:15px;height:15px;"
            >
            <div class="spanrow header">Access</div>
            <template v-for="owner in shape.owners">
                <input
                    :key="owner"
                    :value="owner"
                    @change="updateOwner($event, owner)"
                    type="text"
                    placeholder="name"
                    style="grid-column-start: name"
                >
                <div
                    v-if="owner !== ''"
                    :key="'remove-' + owner"
                    @click="removeOwner(owner)"
                    style="grid-column-start: remove"
                >
                    <i class="fas fa-trash-alt"></i>
                </div>
            </template>
            <div class="spanrow header">Trackers</div>
            <template v-for="tracker in shape.trackers">
                <input
                    :key="'name-'+tracker.uuid"
                    v-model="tracker.name"
                    @change="updateShape(false)"
                    type="text"
                    placeholder="name"
                    style="grid-column-start: name"
                >
                <input
                    :key="'value-'+tracker.uuid"
                    v-model.number="tracker.value"
                    @change="updateShape(false)"
                    type="text"
                    title="Current value"
                >
                <span :key="'fspan-'+tracker.uuid">/</span>
                <input
                    :key="'maxvalue-'+tracker.uuid"
                    v-model.number="tracker.maxvalue"
                    @change="updateShape(false)"
                    type="text"
                    title="Current value"
                >
                <span :key="'sspan-'+tracker.uuid"></span>
                <div
                    :key="'visibility-'+tracker.uuid"
                    :style="{opacity: tracker.visible ? 1.0 : 0.3}"
                    @click="tracker.visible = !tracker.visible;updateShape(false)"
                >
                    <i class="fas fa-eye"></i>
                </div>
                <span :key="'tspan-'+tracker.uuid"></span>
                <div
                    :key="'remove-'+tracker.uuid"
                    @click="removeTracker(tracker.uuid)"
                >
                    <i class="fas fa-trash-alt"></i>
                </div>
            </template>
            <div class="spanrow header">Auras</div>
            <template v-for="aura in shape.auras">
                <input
                    :key="'name-'+aura.uuid"
                    v-model="aura.name"
                    type="text"
                    placeholder="name"
                    style="grid-column-start: name"
                >
                <input
                    :key="'value-'+aura.uuid"
                    v-model="aura.value"
                    type="text"
                    title="Current value"
                >
                <span :key="'fspan-'+aura.uuid">/</span>
                <input
                    :key="'dimvalue-'+aura.uuid"
                    v-model="aura.dim"
                    type="text"
                    title="Dim value"
                >
                <color-picker :key="'colour-'+aura.uuid" :color.sync="aura.colour" :updateAsTinyColour="false" />
                <div
                    :key="'visibility-'+aura.uuid"
                    :style="{opacity: aura.visibile ? 1.0 : 0.3}"
                    @click="aura.visibile = !aura.visibile;updateShape(false)"
                >
                    <i class="fas fa-eye"></i>
                </div>
                <div
                    :key="'lightsource-'+aura.uuid"
                    :style="{opacity: aura.lightSource ? 1.0 : 0.3}"
                    @click="aura.lightSource = !aura.lightSource;updateShape(false)"
                >
                    <i class="fas fa-eye"></i>
                </div>
                <div
                    :key="'remove-'+aura.uuid"
                    @click="removeAura(aura.uuid)"
                >
                    <i class="fas fa-trash-alt"></i>
                </div>
            </template>
            <div class="spanrow header">Annotation</div>
            <textarea
                class="spanrow"
                @change="updateAnnotation"
            ></textarea>
            <!-- <label>Colours</label>
            <div class='colours'>
                <span>Fill:</span>
                <color-picker :color.sync="fillColour" />
                <span>Border:</span>
                <color-picker :color.sync="borderColour" />
            </div> -->
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import colorpicker from "../../vue/components/colorpicker.vue";
import modal from "../../vue/components/modals/modal.vue";

import { socket } from "../socket";
import Shape from "./shape";
import gameManager from "../planarally";
import { uuidv4 } from "../../core/utils";

export default Vue.component('edit-dialog', {
    components: {
        modal,
        'color-picker': colorpicker
    },
    props: {
        'shape': Object as () => Shape,  // to make it work with typescript
    },
    data: () => ({
        visible: false,
    }),
    mounted() {
        if (this.shape.owners[this.shape.owners.length - 1] !== '')
            this.shape.owners.push("");
        if (!this.shape.trackers.length || this.shape.trackers[this.shape.trackers.length - 1].name !== '' && this.shape.trackers[this.shape.trackers.length - 1].value !== 0)
            this.shape.trackers.push({ uuid: uuidv4(), name: '', value: 0, maxvalue: 0, visible: false });
        if (!this.shape.auras.length || this.shape.auras[this.shape.auras.length - 1].name !== '' && this.shape.auras[this.shape.auras.length - 1].value !== 0)
            this.shape.auras.push({
                uuid: uuidv4(),
                name: '',
                value: 0,
                dim: 0,
                lightSource: false,
                colour: 'rgba(0,0,0,0)',
                visible: false
            });
    },
    methods: {
        updateShape(redraw: boolean) {
            socket.emit("updateShape", {shape: this.shape.asDict(), redraw: redraw});
            if (redraw) gameManager.layerManager.invalidate();
        },
        setToken(event: { target: HTMLInputElement }) {
            this.shape.setIsToken(event.target.checked);
            this.updateShape(true);
        },
        setLightBlocker(event: { target: HTMLInputElement }) {
            this.shape.checkLightSources();
            this.updateShape(true);
        },
        setMovementBlocker(event: { target: HTMLInputElement }) {
            this.shape.setMovementBlock(event.target.checked);
            this.updateShape(false);
        },
        updateAnnotation(event: { target: HTMLInputElement }) {
            const had_annotation = this.shape.annotation !== '';
            this.shape.annotation = event.target.value;
            if (this.shape.annotation !== '' && !had_annotation) {
                gameManager.annotations.push(this.shape.uuid);
                if (gameManager.layerManager.hasLayer("draw"))
                    gameManager.layerManager.getLayer("draw")!.invalidate(true)
            } else if (this.shape.annotation == '' && had_annotation) {
                gameManager.annotations.splice(gameManager.annotations.findIndex(an => an === this.shape.uuid));
                if (gameManager.layerManager.hasLayer("draw"))
                    gameManager.layerManager.getLayer("draw")!.invalidate(true)
            }
            this.updateShape(false);
        },
        updateOwner(event: { target: HTMLInputElement }, oldValue: string) {
            const ow_i = this.shape.owners.findIndex(o => o === oldValue);
            if (ow_i >= 0)
                this.shape.owners.splice(ow_i, 1, event.target.value);
            else
                this.shape.owners.push(event.target.value);
            this.updateShape(false);
            if (!this.shape.owners.length || this.shape.owners[this.shape.owners.length - 1] !== '') {
                this.shape.owners.push("");
            }
        },
        removeOwner(value: string) {
            const ow_i = this.shape.owners.findIndex(o => o === value);
            this.shape.owners.splice(ow_i, 1);
            this.updateShape(false);
        },
        removeTracker(uuid: string) {
            this.shape.trackers = this.shape.trackers.filter(tr => tr.uuid !== uuid);
            this.updateShape(false);
        }
    }
})
</script>

<style scoped>
.modal-header {
    background-color: #FF7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
}

.modal-body {
    padding: 10px;
    display: grid;
    grid-template-columns: [name] 1fr [numerator] 30px [slash] 5px [denominator] 30px [colour] 40px [visible] 30px [light] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
}

.colours {
    display:flex;
    align-items: center;
    justify-content: space-between;
}

.header {
    line-height: 0.1em;
    margin: 20px 0 15px;
}

.header:after {
    position: absolute;
    right: 5px;
    width: 75%;
    border-bottom: 1px solid #000;
    content: '';
}
</style>