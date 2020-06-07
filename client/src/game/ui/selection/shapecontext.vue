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
import { Shape } from "@/game/shapes/shape";

@Component({
    components: {
        ContextMenu,
        Prompt,
    },
    computed: {
        ...mapState("game", ["activeFloorIndex", "markers"]),
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

    getSelection(): Shape[] {
        return this.getActiveLayer()!.selection;
    }

    hasSpawnToken(): boolean {
        return this.getSelection().some(s => gameSettingsStore.currentLocationOptions.spawnLocations!.includes(s.uuid));
    }

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
        if (gameStore.IS_DM) return layerManager.floors;
        return [];
    }
    getLocations(): { id: number; name: string }[] {
        if (!gameStore.IS_DM || this.hasSpawnToken()) return [];
        return gameStore.locations;
    }
    getLayers(): Layer[] {
        if (!gameStore.IS_DM || this.hasSpawnToken()) return [];
        return layerManager.floor?.layers.filter(l => l.selectable) || [];
    }
    getActiveLayer(): Layer | undefined {
        if (layerManager.floor !== undefined) return layerManager.getLayer(layerManager.floor.name);
    }
    getInitiativeWord(): string {
        const layer = this.getActiveLayer()!;
        if (layer.selection.length === 1) {
            return inInitiative(layer.selection[0].uuid)
                ? this.$t("game.ui.selection.shapecontext.show_initiative").toString()
                : this.$t("game.ui.selection.shapecontext.add_initiative").toString();
        } else {
            return layer.selection.every(shape => inInitiative(shape.uuid))
                ? this.$t("game.ui.selection.shapecontext.show_initiative").toString()
                : this.$t("game.ui.selection.shapecontext.add_all_initiative").toString();
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
        if (spawnLocations === 0) {
            await (<Game>(
                this.$parent.$parent.$parent
            )).$refs.confirm.open(
                "game.ui.selection.shapecontext.spawn_location_info",
                "game.ui.selection.shapecontext.spawn_location_info_msg",
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
    showInitiative(): boolean {
        return !this.hasSpawnToken();
    }
    showDelete(): boolean {
        if (this.hasSpawnToken()) return false;
        if (gameStore.IS_DM) return true;
        return this.getSelection().every(s => s.ownedBy({ editAccess: true }));
    }
    getLayerWord(layer: string): string {
        switch (layer) {
            case "map":
                return this.$t("layer.map").toString();

            case "tokens":
                return this.$t("layer.tokens").toString();

            case "dm":
                return this.$t("layer.dm").toString();

            case "fow":
                return this.$t("layer.fow").toString();

            default:
                return "";
        }
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
            {{ $t("common.floor") }}
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
            {{ $t("common.layer") }}
            <ul>
                <li
                    v-for="layer in getLayers()"
                    :key="layer.name"
                    :style="[getActiveLayer().name === layer.name ? { 'background-color': '#82c8a0' } : {}]"
                    @click="setLayer(layer.name)"
                >
                    {{ getLayerWord(layer.name) }}
                </li>
            </ul>
        </li>
        <li v-if="getLocations().length > 1">
            {{ $t("common.location") }}
            <ul>
                <li
                    v-for="location in getLocations()"
                    :key="location.id"
                    :style="[activeLocation === location.id ? { 'background-color': '#82c8a0' } : {}]"
                    @click="setLocation(location.id)"
                >
                    {{ location.name }}
                </li>
            </ul>
        </li>
        <li @click="moveToBack" v-t="'game.ui.selection.shapecontext.move_back'"></li>
        <li @click="moveToFront" v-t="'game.ui.selection.shapecontext.move_front'"></li>
        <li @click="addInitiative" v-if="showInitiative()">{{ getInitiativeWord() }}</li>
        <li @click="deleteSelection" v-if="showDelete()" v-t="'game.ui.selection.shapecontext.delete_shapes'"></li>
        <li v-if="hasSingleShape()" @click="openEditDialog" v-t="'game.ui.selection.shapecontext.show_props'"></li>
        <template v-if="hasSingleShape()">
            <li
                v-if="markers.includes(getMarker())"
                @click="deleteMarker"
                v-t="'game.ui.selection.shapecontext.remove_marker'"
            ></li>
            <li v-else @click="setMarker" v-t="'game.ui.selection.shapecontext.set_marker'"></li>
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
