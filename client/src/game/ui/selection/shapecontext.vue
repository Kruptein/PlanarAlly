<template>
    <ContextMenu
        v-if="getActiveLayer() !== undefined"
        :visible="visible"
        :left="x + 'px'"
        :top="y + 'px'"
        @close="close"
    >
        <li v-if="getFloors().length > 1">
            Floor
            <ul>
                <li
                    v-for="(floor, idx) in getFloors()"
                    :key="floor.name"
                    :style="[idx === activeFloorIndex ? { 'background-color': '#82c8a0' } : {}]"
                    @click="setFloor(floor)"
                >
                    {{ floor.name }}
                </li>
            </ul>
        </li>
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

import { mapState, mapMutations } from "vuex";

import ContextMenu from "@/core/components/contextmenu.vue";

import { socket } from "@/game/api/socket";
import { ServerClient, ServerLocation } from "@/game/comm/types/general";
import { EventBus } from "@/game/event-bus";
import { layerManager, Floor } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { cutShapes, deleteShapes, pasteShapes } from "../../shapes/utils";
import { initiativeStore, inInitiative } from "../initiative/store";
import { Layer } from "../../layers/layer";

@Component({
    components: {
        ContextMenu,
    },
    computed: {
        ...mapState("game", ["activeFloorIndex", "assets", "locations", "notes"]),
        ...mapMutations("game", ["selectFloor"]),
    },
})
export default class ShapeContext extends Vue {
    visible = false;
    x = 0;
    y = 0;
    open(event: MouseEvent): void {
        this.visible = true;
        this.x = event.pageX;
        this.y = event.pageY;
        this.$nextTick(() => (<HTMLElement>this.$children[0].$el).focus());
    }
    close(): void {
        this.visible = false;
    }
    getFloors(): Floor[] {
        return layerManager.floors;
    }
    getLayers(): Layer[] {
        return layerManager.floor?.layers.filter(l => l.selectable && (gameStore.IS_DM || l.playerEditable)) || [];
    }
    getActiveLayer(): Layer | undefined {
        if (layerManager.floor !== undefined) return layerManager.getLayer(layerManager.floor.name);
    }
    getCurrentLocation(): string {
        return gameStore.locationName;
    }
    getInitiativeWord(): string {
        const layer = this.getActiveLayer()!;
        if (layer.selection.length === 1) {
            return inInitiative(layer.selection[0].uuid) ? "Show" : "Add";
        } else {
            return layer.selection.every(shape => inInitiative(shape.uuid)) ? "Show" : "Add all to";
        }
    }
    hasSingleShape(): boolean {
        const layer = this.getActiveLayer()!;
        return layer.selection.length === 1;
    }
    setFloor(floor: Floor): void {
        const layer = this.getActiveLayer()!;
        layer.selection.forEach(shape => shape.moveFloor(floor.name, true));
        this.close();
    }
    setLayer(newLayer: string): void {
        const layer = this.getActiveLayer()!;
        layer.selection.forEach(shape => shape.moveLayer(newLayer, true));
        layer.clearSelection();
        this.close();
    }
    setLocation(newLocation: string): void {
        const layer = this.getActiveLayer()!;
        cutShapes();
        // Request change to other location
        socket.emit("Location.Change", newLocation);
        socket.once("Location.Set", (_data: Partial<ServerLocation>) => {
            socket.once("Client.Options.Set", (_options: ServerClient) => {
                layer.selection = pasteShapes(layer.name);
                layerManager.selectLayer(layer.name);
            });
        });
        this.close();
    }
    moveToBack(): void {
        const layer = this.getActiveLayer()!;
        layer.selection.forEach(shape => layer.moveShapeOrder(shape, 0, true));
        this.close();
    }
    moveToFront(): void {
        const layer = this.getActiveLayer()!;
        layer.selection.forEach(shape => layer.moveShapeOrder(shape, layer.shapes.length - 1, true));
        this.close();
    }
    addInitiative(): void {
        const layer = this.getActiveLayer()!;
        layer.selection.forEach(shape => initiativeStore.addInitiative(shape.getInitiativeRepr()));
        EventBus.$emit("Initiative.Show");
        this.close();
    }
    deleteSelection(): void {
        deleteShapes();
        this.close();
    }
    openEditDialog(): void {
        const layer = this.getActiveLayer()!;
        if (layer.selection.length !== 1) return;
        EventBus.$emit("EditDialog.Open", layer.selection[0]);
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
