<template>
    <Modal :visible="visible" @close="visible = false" :mask="false">
        <div
            class="modal-header"
            slot="header"
            slot-scope="m"
            draggable="true"
            @dragstart="m.dragStart"
            @dragend="m.dragEnd"
        >
            <div>Edit asset</div>
            <div class="header-close" @click="visible = false">
                <i class="far fa-window-close"></i>
            </div>
        </div>
        <div class="modal-body">
            <div class="grid">
                <label for="shapeselectiondialog-name">Name</label>
                <input
                    type="text"
                    id="shapeselectiondialog-name"
                    v-model="shape.name"
                    @change="updateShape(false)"
                    :disabled="!owned"
                    style="grid-column: numerator / remove"
                />
                <div
                    :style="{ opacity: shape.nameVisible ? 1.0 : 0.3, textAlign: 'center' }"
                    @click="
                        shape.nameVisible = !shape.nameVisible;
                        updateShape(false);
                    "
                    :disabled="!owned"
                >
                    <i class="fas fa-eye"></i>
                </div>
                <label for="shapeselectiondialog-istoken">Is a token</label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-istoken"
                    :checked="shape.isToken"
                    @click="setToken"
                    style="grid-column-start: remove;"
                    class="styled-checkbox"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-showBadge">Show badge</label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-showBadge"
                    :checked="shape.showBadge"
                    @click="toggleBadge"
                    style="grid-column-start: remove;"
                    class="styled-checkbox"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-visionblocker">Blocks vision/light</label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-visionblocker"
                    v-model="shape.visionObstruction"
                    @change="setVisionBlocker"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-moveblocker">Blocks movement</label>
                <input
                    type="checkbox"
                    id="shapeselectiondialog-moveblocker"
                    :checked="shape.movementObstruction"
                    @click="setMovementBlocker"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-strokecolour">Border colour</label>
                <color-picker
                    :color.sync="shape.strokeColour"
                    @input="updateShape(true, true)"
                    @change="updateShape(true)"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <label for="shapeselectiondialog-fillcolour">Fill colour</label>
                <color-picker
                    :color.sync="shape.fillColour"
                    @input="updateShape(true, true)"
                    @change="updateShape(true)"
                    style="grid-column-start: remove;"
                    :disabled="!owned"
                />
                <div class="spanrow header">Access</div>
                <template v-for="owner in shape.owners">
                    <input
                        :key="owner"
                        :value="owner"
                        @change="updateOwner($event, owner)"
                        type="text"
                        placeholder="name"
                        style="grid-column-start: name"
                        :disabled="!owned"
                    />
                    <div
                        v-if="owner !== ''"
                        :key="'remove-' + owner"
                        @click="removeOwner(owner)"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center', gridColumnStart: 'remove' }"
                        :disabled="!owned"
                    >
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </template>
                <div class="spanrow header">Trackers</div>
                <template v-for="tracker in shape.trackers">
                    <input
                        :key="'name-' + tracker.uuid"
                        v-model="tracker.name"
                        @change="updateShape(false)"
                        type="text"
                        placeholder="name"
                        style="grid-column-start: name"
                        :disabled="!owned"
                    />
                    <input
                        :key="'value-' + tracker.uuid"
                        v-model.number="tracker.value"
                        @change="updateShape(false)"
                        type="text"
                        title="Current value"
                        :disabled="!owned"
                    />
                    <span :key="'fspan-' + tracker.uuid">/</span>
                    <input
                        :key="'maxvalue-' + tracker.uuid"
                        v-model.number="tracker.maxvalue"
                        @change="updateShape(false)"
                        type="text"
                        title="Current value"
                        :disabled="!owned"
                    />
                    <span :key="'sspan-' + tracker.uuid"></span>
                    <div
                        :key="'visibility-' + tracker.uuid"
                        :style="{ opacity: tracker.visible ? 1.0 : 0.3, textAlign: 'center' }"
                        @click="
                            tracker.visible = !tracker.visible;
                            updateShape(false);
                        "
                        :disabled="!owned"
                    >
                        <i class="fas fa-eye"></i>
                    </div>
                    <span :key="'tspan-' + tracker.uuid"></span>
                    <div
                        v-if="tracker.name !== '' || tracker.value !== 0"
                        :key="'remove-' + tracker.uuid"
                        @click="removeTracker(tracker.uuid)"
                        :disabled="!owned"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                    >
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </template>
                <div class="spanrow header">Auras</div>
                <template v-for="aura in shape.auras">
                    <input
                        :key="'name-' + aura.uuid"
                        v-model="aura.name"
                        @change="updateShape(false)"
                        type="text"
                        placeholder="name"
                        style="grid-column-start: name"
                        :disabled="!owned"
                    />
                    <input
                        :key="'value-' + aura.uuid"
                        v-model.number="aura.value"
                        @change="updateShape(true)"
                        type="text"
                        title="Current value"
                        :disabled="!owned"
                    />
                    <span :key="'fspan-' + aura.uuid">/</span>
                    <input
                        :key="'dimvalue-' + aura.uuid"
                        v-model.number="aura.dim"
                        @change="updateShape(true)"
                        type="text"
                        title="Dim value"
                        :disabled="!owned"
                    />
                    <color-picker
                        :key="'colour-' + aura.uuid"
                        :color.sync="aura.colour"
                        @input="updateAuraColour(aura, $event)"
                        @change="updateShape(true)"
                        :disabled="!owned"
                    />
                    <div
                        :key="'visibility-' + aura.uuid"
                        :style="{ opacity: aura.visible ? 1.0 : 0.3, textAlign: 'center' }"
                        @click="
                            aura.visible = !aura.visible;
                            updateShape(true);
                        "
                        :disabled="!owned"
                    >
                        <i class="fas fa-eye"></i>
                    </div>
                    <div
                        :key="'visionsource-' + aura.uuid"
                        :style="{ opacity: aura.visionSource ? 1.0 : 0.3, textAlign: 'center' }"
                        @click="updateAuraVisionSource(aura)"
                        :disabled="!owned"
                    >
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div
                        v-if="aura.name !== '' || aura.value !== 0"
                        :key="'remove-' + aura.uuid"
                        @click="removeAura(aura.uuid)"
                        :disabled="!owned"
                        :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center' }"
                    >
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </template>
                <div class="spanrow header">Labels</div>
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
                <div class="spanrow header">Annotation</div>
                <textarea
                    class="spanrow"
                    :value="shape.annotation"
                    @change="updateAnnotation"
                    :disabled="!owned"
                ></textarea>
            </div>
        </div>
    </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import ColorPicker from "@/core/components/colorpicker.vue";
import Modal from "@/core/components/modals/modal.vue";

import { uuidv4 } from "@/core/utils";
import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { getVisionSources, addVisionSource, sliceVisionSources } from "@/game/visibility/utils";

@Component({
    components: {
        Modal,
        "color-picker": ColorPicker,
    },
})
export default class EditDialog extends Vue {
    @Prop() shape!: Shape;

    visible = false;

    get owned(): boolean {
        return this.shape.ownedBy();
    }

    mounted(): void {
        EventBus.$on("EditDialog.Open", (shape: Shape) => {
            this.shape = shape;
            this.visible = true;
        });
        EventBus.$on("EditDialog.AddLabel", (label: string) => {
            if (this.visible) {
                this.shape.labels.push(gameStore.labels[label]);
                this.updateShape(true);
            }
        });
    }

    beforeDestroy(): void {
        EventBus.$off("EditDialog.Open");
        EventBus.$off("EditDialog.AddLabel");
    }

    updated(): void {
        this.addEmpty();
    }

    addEmpty(): void {
        if (this.shape.owners[this.shape.owners.length - 1] !== "") this.shape.addOwner("");
        if (
            !this.shape.trackers.length ||
            this.shape.trackers[this.shape.trackers.length - 1].name !== "" ||
            this.shape.trackers[this.shape.trackers.length - 1].value !== 0
        )
            this.shape.trackers.push({ uuid: uuidv4(), name: "", value: 0, maxvalue: 0, visible: false });
        if (
            !this.shape.auras.length ||
            this.shape.auras[this.shape.auras.length - 1].name !== "" ||
            this.shape.auras[this.shape.auras.length - 1].value !== 0
        )
            this.shape.auras.push({
                uuid: uuidv4(),
                name: "",
                value: 0,
                dim: 0,
                visionSource: false,
                colour: "rgba(0,0,0,0)",
                visible: false,
            });
    }
    updateShape(redraw: boolean, temporary = false): void {
        if (!this.owned) return;
        socket.emit("Shape.Update", { shape: this.shape.asDict(), redraw, temporary });
        if (redraw) layerManager.invalidate(this.shape.floor);
        this.addEmpty();
    }
    setToken(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setIsToken(event.target.checked);
        this.updateShape(true);
    }
    toggleBadge(_event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        const groupMembers = this.shape.getGroupMembers();
        for (const [i, shape] of groupMembers.entries()) {
            shape.showBadge = !shape.showBadge;
            socket.emit("Shape.Update", {
                shape: shape.asDict(),
                redraw: groupMembers.length === i + 1,
                temporary: false,
            });
        }
        layerManager.invalidate(this.shape.floor);
    }
    setVisionBlocker(_event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.checkVisionSources();
        this.updateShape(true);
    }
    setMovementBlocker(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        this.shape.setMovementBlock(event.target.checked);
        this.updateShape(false);
    }
    updateAnnotation(event: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        const hadAnnotation = this.shape.annotation !== "";
        this.shape.annotation = event.target.value;
        if (this.shape.annotation !== "" && !hadAnnotation) {
            gameStore.annotations.push(this.shape.uuid);
            if (layerManager.hasLayer(layerManager.floor!.name, "draw"))
                layerManager.getLayer(layerManager.floor!.name, "draw")!.invalidate(true);
        } else if (this.shape.annotation === "" && hadAnnotation) {
            gameStore.annotations.splice(gameStore.annotations.findIndex(an => an === this.shape.uuid));
            if (layerManager.hasLayer(layerManager.floor!.name, "draw"))
                layerManager.getLayer(layerManager.floor!.name, "draw")!.invalidate(true);
        }
        this.updateShape(false);
    }
    updateOwner(event: { target: HTMLInputElement }, oldValue: string): void {
        if (!this.owned) return;
        this.shape.updateOwner(oldValue, event.target.value);
        this.updateShape(gameStore.fowLOS);
    }
    removeOwner(value: string): void {
        if (!this.owned) return;
        this.shape.removeOwner(value);
        this.updateShape(gameStore.fowLOS);
    }
    removeTracker(uuid: string): void {
        if (!this.owned) return;
        this.shape.trackers = this.shape.trackers.filter(tr => tr.uuid !== uuid);
        this.updateShape(false);
    }
    removeAura(uuid: string): void {
        if (!this.owned) return;
        this.shape.auras = this.shape.auras.filter(au => au.uuid !== uuid);
        this.shape.checkVisionSources();
        this.updateShape(true);
    }
    updateAuraVisionSource(aura: Aura): void {
        if (!this.owned) return;
        aura.visionSource = !aura.visionSource;
        const visionSources = getVisionSources(this.shape.floor);
        const i = visionSources.findIndex(ls => ls.aura === aura.uuid);
        if (aura.visionSource && i === -1)
            addVisionSource({ shape: this.shape.uuid, aura: aura.uuid }, this.shape.floor);
        else if (!aura.visionSource && i >= 0) sliceVisionSources(i, this.shape.floor);
        this.updateShape(true);
    }
    updateAuraColour(aura: Aura, _colour: string): void {
        if (!this.owned) return;
        const layer = layerManager.getLayer(this.shape.floor, this.shape.layer);
        if (layer === undefined) return;
        layer.invalidate(!aura.visionSource);
    }
    openLabelManager(): void {
        EventBus.$emit("LabelManager.Open");
    }
    removeLabel(uuid: string): void {
        if (!this.owned) return;
        this.shape.labels = this.shape.labels.filter(l => l.uuid !== uuid);
        this.updateShape(true);
    }
}
</script>

<style scoped>
.modal-header {
    background-color: #ff7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: move;
}

.header-close {
    position: absolute;
    top: 5px;
    right: 5px;
}

.modal-body {
    padding: 10px;
    max-width: 450px;
}

.grid {
    display: grid;
    grid-template-columns: [name] 1fr [numerator] 30px [slash] 5px [denominator] 30px [colour] 40px [visible] 30px [light] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
}

.colours {
    display: flex;
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
    content: "";
}

.spanrow {
    grid-column: 1 / end;
}

#labels {
    flex-wrap: wrap;
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

#label-add:hover > .label-main {
    pointer-events: auto;
    cursor: pointer;
    color: white;
    font-weight: bold;
    background-color: #ff7052;
}

#label-add:hover > .label-main::before {
    content: "";
}

.label-user {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    background-color: #ff7052;
    border: solid 1px #ff7052;
    padding: 5px;
}

.label-main {
    border: solid 1px #ff7052;
    border-radius: 10px;
    padding: 5px;
    pointer-events: none;
}

.label-user + .label-main {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0 8px 0 8px;
    white-space: nowrap;
    display: inline-block;
}
</style>
