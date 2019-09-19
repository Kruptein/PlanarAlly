<template>
    <ContextMenu
        v-if="getActiveLayer() !== undefined"
        :visible="visible"
        :left="x + 'px'"
        :top="y + 'px'"
        @close="close"
    >
        <li v-if="getLayers().length > 1">
            Layer
            <ul>
                <li
                    v-for="layer in getLayers()"
                    :key="layer.name"
                    :style="[getActiveLayer().name === layer.name ? { 'background-color': '#82c8a0' } : {}]"
                    @click="setLayer(layer.name)"
                >
                    {{ layer.name }}
                </li>
            </ul>
        </li>
        <li v-if="locations.length > 1">
            Location
            <ul>
                <li
                    v-for="location in locations"
                    :key="location"
                    :style="[getCurrentLocation() === location ? { 'background-color': '#82c8a0' } : {}]"
                    @click="setLocation(location)"
                >
                    {{ location }}
                </li>
            </ul>
        </li>
        <li @click="moveToBack">Move to back</li>
        <li @click="moveToFront">Move to front</li>
        <li @click="addInitiative">{{ getInitiativeWord() }} initiative</li>
        <li @click="deleteSelection">Delete shapes</li>
        <li v-if="hasSingleShape()" @click="openEditDialog">Show properties</li>
    </ContextMenu>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import ContextMenu from "@/core/components/contextmenu.vue";

import { socket } from "@/game/api/socket";
import { ServerLocation } from "@/game/comm/types/general";
import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { cutShapes, deleteShapes, pasteShapes } from "../../shapes/utils";
import { initiativeStore, inInitiative } from "../initiative/store";

@Component({
    components: {
        ContextMenu,
    },
    computed: {
        ...mapState("game", ["locations", "assets", "notes"]),
    },
})
export default class ShapeContext extends Vue {
    visible = false;
    x = 0;
    y = 0;
    shapes: Shape[] | null = null;
    get activeLayer(): string {
        const layer = layerManager.getLayer();
        return layer === undefined ? "" : layer.name;
    }
    open(event: MouseEvent, shapes: Shape[]) {
        this.visible = true;
        this.x = event.pageX;
        this.y = event.pageY;
        this.shapes = shapes;
        this.$nextTick(() => (<HTMLElement>this.$children[0].$el).focus());
    }
    close() {
        this.visible = false;
        this.shapes = null;
    }
    getLayers() {
        return layerManager.layers.filter(l => l.selectable && (gameStore.IS_DM || l.playerEditable));
    }
    getActiveLayer() {
        return layerManager.getLayer();
    }
    getCurrentLocation() {
        return gameStore.locationName;
    }
    getInitiativeWord() {
        if (this.shapes === null) return "";
        if (this.shapes.length === 1) {
            return inInitiative(this.shapes[0].uuid) ? "Show" : "Add";
        } else {
            return this.shapes.every(shape => inInitiative(shape.uuid)) ? "Show" : "Add all to";
        }
    }
    hasSingleShape(): boolean {
        return this.shapes !== null && this.shapes.length === 1;
    }
    setLayer(newLayer: string) {
        if (this.shapes === null) return;
        this.shapes.forEach(shape => shape.moveLayer(newLayer, true));
        this.close();
    }
    setLocation(newLocation: string) {
        if (this.shapes === null) return;
        const layer = layerManager.getLayer()!;
        layer.selection = this.shapes;
        cutShapes();
        // Request change to other location
        socket.emit("Location.Change", newLocation);
        socket.once("Location.Set", (_data: Partial<ServerLocation>) => {
            // Paste when location changes
            // TODO: Shapes are pasted to map layer independently of where they come from. Fix this
            this.shapes = pasteShapes(false);
            // Workaround to force the shapes to the right layer
            this.setLayer(layer.name);
        });
        this.close();
    }
    moveToBack() {
        if (this.shapes === null) return;
        const layer = this.getActiveLayer()!;
        this.shapes.forEach(shape => layer.moveShapeOrder(shape, 0, true));
        this.close();
    }
    moveToFront() {
        if (this.shapes === null) return;
        const layer = this.getActiveLayer()!;
        this.shapes.forEach(shape => layer.moveShapeOrder(shape, layer.shapes.length - 1, true));
        this.close();
    }
    addInitiative() {
        if (this.shapes === null) return;
        this.shapes.forEach(shape => initiativeStore.addInitiative(shape.getInitiativeRepr()));
        EventBus.$emit("Initiative.Show");
        this.close();
    }
    deleteSelection() {
        if (this.shapes === null) return;
        deleteShapes();
        this.close();
    }
    openEditDialog() {
        if (this.shapes === null || this.shapes.length !== 1) return;
        EventBus.$emit("EditDialog.Open", this.shapes[0]);
        this.close();
    }
}
</script>

<style scoped>
.ContextMenu ul {
    border: 1px solid #82c8a0;
}
.ContextMenu ul li {
    border-bottom: 1px solid #82c8a0;
}
.ContextMenu ul li:hover {
    background-color: #82c8a0;
}
</style>
