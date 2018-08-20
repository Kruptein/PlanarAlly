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
                    :key="'icon-' + owner"
                    @click="removeOwner(owner)"
                    style="grid-column-start: remove"
                >
                    <i class="fas fa-trash-alt"></i>
                </div>
            </template>
            <div class="spanrow header">Trackers</div>
            <div class="spanrow header">Auras</div>
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
        <div class='modal-footer'>
            <button @click="submit">Submit</button>
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
    },
    methods: {
        submit() {
        },
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

.modal-footer {
    padding-top: 0;
    padding: 10px;
    text-align: right;
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