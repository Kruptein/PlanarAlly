<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import ContextMenu from "@/core/components/contextmenu.vue";
import Prompt from "@/core/components/modals/prompt.vue";

import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { layerManager, Floor } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { deleteShapes } from "../../shapes/utils";
import { initiativeStore, inInitiative } from "../initiative/store";
import { Layer } from "../../layers/layer";
import { gameSettingsStore } from "../../settings";
import Game from "@/game/game.vue";
import { ServerAsset } from "../../comm/types/shapes";

@Component({
    components: {
        ContextMenu,
        Prompt,
    },
    computed: {
        ...mapState("game", ["activeFloorIndex", "locations", "markers"]),
        ...mapState("gameSettings", ["activeLocation"]),
    },
})
export default class ShapeContext extends Vue {
    $refs!: {
        prompt: InstanceType<typeof Prompt>;
    };

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
    getMarker(): string | undefined {
        const layer = this.getActiveLayer()!;
        if (layer.selection.length !== 1) return;
        return layer.selection[0].uuid;
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
    async setLocation(newLocation: number): Promise<void> {
        const selection = this.getActiveLayer()!.selection;

        const spawnLocations = (gameSettingsStore.locationOptions[newLocation]?.spawnLocations ?? []).length;
        console.log(spawnLocations);
        if (spawnLocations === 0) {
            await (<Game>this.$parent.$parent.$parent).$refs.confirm.open(
                "Spawn location info",
                "Since version 0.21 a concept of spawn locations has been introduced. The target location does not yet have a spawn location; Visit it manually first to autogenerate one.",
                { showNo: false, yes: "Ok" },
            );
            this.close();
            return;
        }

        socket.emit("Location.Spawn.Info.Get", newLocation);
        const spawnInfo = await new Promise((resolve: (value: ServerAsset[]) => void) =>
            socket.once("Location.Spawn.Info", resolve),
        );
        if (spawnInfo.length !== spawnLocations) {
            console.error("Spawn location info mismatch.");
            this.close();
            return;
        }
        const targetLocation = {
            floor: spawnInfo[0].floor,
            x: spawnInfo[0].x + spawnInfo[0].width / 2,
            y: spawnInfo[0].y + spawnInfo[0].height / 2,
        };
        // if (spawnLocations > 1) {
        //     // todo
        // }

        socket.emit("Shapes.Location.Move", {
            shapes: selection.map(s => s.uuid),
            target: { location: newLocation, ...targetLocation },
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
    setMarker(): void {
        const layer = this.getActiveLayer()!;
        if (layer.selection.length !== 1) return;
        const marker = layer.selection[0].uuid;
        gameStore.newMarker({ marker, sync: true });
        this.close();
    }
    deleteMarker(): void {
        const layer = this.getActiveLayer()!;
        if (layer.selection.length !== 1) return;
        const marker = layer.selection[0].uuid;
        gameStore.removeMarker({ marker, sync: true });
        this.close();
    }
}
</script>

<template>
    <ContextMenu
        v-if="getActiveLayer() !== undefined"
        :visible="visible"
        :left="x + 'px'"
        :top="y + 'px'"
        @close="close"
    >
        <Prompt ref="prompt"></Prompt>
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
                    :key="location.id"
                    :style="[activeLocation === location.id ? { 'background-color': '#82c8a0' } : {}]"
                    @click="setLocation(location.id)"
                >
                    {{ location.name }}
                </li>
            </ul>
        </li>
        <li @click="moveToBack">Move to back</li>
        <li @click="moveToFront">Move to front</li>
        <li @click="addInitiative">{{ getInitiativeWord() }} initiative</li>
        <li @click="deleteSelection">Delete shapes</li>
        <li v-if="hasSingleShape()" @click="openEditDialog">Show properties</li>
        <template v-if="hasSingleShape()">
            <li v-if="markers.includes(getMarker())" @click="deleteMarker">Remove marker</li>
            <li v-else @click="setMarker">Set marker</li>
        </template>
    </ContextMenu>
</template>

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
