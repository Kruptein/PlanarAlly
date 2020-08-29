<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import ContextMenu from "@/core/components/contextmenu.vue";
import Prompt from "@/core/components/modals/prompt.vue";

import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { deleteShapes } from "../../shapes/utils";
import { initiativeStore, inInitiative } from "../initiative/store";
import { Layer } from "../../layers/layer";
import { gameSettingsStore } from "../../settings";
import Game from "@/game/Game.vue";
import { Shape } from "@/game/shapes/shape";
import { floorStore } from "../../layers/store";
import { Floor } from "@/game/layers/floor";
import { moveFloor, moveLayer } from "../../layers/utils";
import { requestSpawnInfo, sendLocationChange } from "@/game/api/emits/location";
import { sendShapesMove } from "@/game/api/emits/shape/core";
import SelectionBox from "@/core/components/modals/SelectionBox.vue";
import { ServerAsset } from "@/game/comm/types/shapes";

@Component({
    components: {
        ContextMenu,
        Prompt,
        SelectionBox,
    },
    computed: {
        ...mapState("game", ["activeFloorIndex", "markers"]),
        ...mapState("gameSettings", ["activeLocation"]),
    },
})
export default class ShapeContext extends Vue {
    $refs!: {
        prompt: InstanceType<typeof Prompt>;
        selectionbox: InstanceType<typeof SelectionBox>;
    };

    visible = false;
    x = 0;
    y = 0;

    getSelection(): readonly Shape[] {
        return this.getActiveLayer()!.getSelection();
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
        if (layer.getSelection().length !== 1) return;
        return layer.getSelection()[0].uuid;
    }
    getFloors(): readonly Floor[] {
        if (gameStore.IS_DM) return floorStore.floors;
        return [];
    }
    getLocations(): { id: number; name: string }[] {
        if (!gameStore.IS_DM || this.hasSpawnToken()) return [];
        return gameStore.locations;
    }
    getLayers(): Layer[] {
        if (!gameStore.IS_DM || this.hasSpawnToken()) return [];
        return layerManager.getLayers(floorStore.currentFloor).filter(l => l.selectable) || [];
    }
    getActiveLayer(): Layer | undefined {
        return gameStore.boardInitialized ? floorStore.currentLayer : undefined;
    }
    getInitiativeWord(): string {
        const layer = this.getActiveLayer()!;
        if (layer.getSelection().length === 1) {
            return inInitiative(layer.getSelection()[0].uuid)
                ? this.$t("game.ui.selection.shapecontext.show_initiative").toString()
                : this.$t("game.ui.selection.shapecontext.add_initiative").toString();
        } else {
            return layer.getSelection().every(shape => inInitiative(shape.uuid))
                ? this.$t("game.ui.selection.shapecontext.show_initiative").toString()
                : this.$t("game.ui.selection.shapecontext.add_all_initiative").toString();
        }
    }
    hasSingleShape(): boolean {
        const layer = this.getActiveLayer()!;
        return layer.getSelection().length === 1;
    }
    setFloor(floor: Floor): void {
        const layer = this.getActiveLayer()!;
        moveFloor([...layer.getSelection()], floor, true);
        this.close();
    }
    setLayer(newLayer: string): void {
        const layer = this.getActiveLayer()!;
        moveLayer([...layer.getSelection()], layerManager.getLayer(floorStore.currentFloor, newLayer)!, true);
        layer.clearSelection();
        this.close();
    }
    async setLocation(newLocation: number): Promise<void> {
        const selection = this.getActiveLayer()!.getSelection();
        const spawnInfo = await requestSpawnInfo(newLocation);
        let spawnLocation: ServerAsset;

        switch (spawnInfo.length) {
            case 0:
                await (<Game>this.$parent.$parent.$parent).$refs.confirm.open(
                    this.$t("game.ui.selection.shapecontext.no_spawn_set_title").toString(),
                    this.$t("game.ui.selection.shapecontext.no_spawn_set_text").toString(),
                    { showNo: false, yes: "Ok" },
                );
                this.close();
                return;
            case 1:
                spawnLocation = spawnInfo[0];
                break;
            default: {
                const choice = await this.$refs.selectionbox.open(
                    "Choose the desired spawn location",
                    spawnInfo.map(s => s.name),
                );
                const choiceShape = spawnInfo.find(s => s.name === choice);
                if (choiceShape === undefined) return;
                spawnLocation = choiceShape;
                break;
            }
        }

        const targetLocation = {
            floor: spawnLocation.floor,
            x: spawnLocation.x + spawnLocation.width / 2,
            y: spawnLocation.y + spawnLocation.height / 2,
        };

        sendShapesMove({
            shapes: selection.map(s => s.uuid),
            target: { location: newLocation, ...targetLocation },
        });
        if (gameSettingsStore.movePlayerOnTokenChange) {
            const users: Set<string> = new Set();
            for (const shape of selection) {
                for (const owner of shape.owners) users.add(owner.user);
            }
            sendLocationChange({ location: newLocation, users: [...users] });
        }

        this.close();
    }
    moveToBack(): void {
        const layer = this.getActiveLayer()!;
        layer.getSelection().forEach(shape => layer.moveShapeOrder(shape, 0, true));
        this.close();
    }
    moveToFront(): void {
        const layer = this.getActiveLayer()!;
        layer.getSelection().forEach(shape => layer.moveShapeOrder(shape, layer.getShapes().length - 1, true));
        this.close();
    }
    addInitiative(): void {
        const layer = this.getActiveLayer()!;
        layer.getSelection().forEach(shape => initiativeStore.addInitiative(shape.getInitiativeRepr()));
        EventBus.$emit("Initiative.Show");
        this.close();
    }
    deleteSelection(): void {
        deleteShapes();
        this.close();
    }
    openEditDialog(): void {
        const layer = this.getActiveLayer()!;
        if (layer.getSelection().length !== 1) return;
        EventBus.$emit("EditDialog.Open", layer.getSelection()[0]);
        this.close();
    }
    setMarker(): void {
        const layer = this.getActiveLayer()!;
        if (layer.getSelection().length !== 1) return;
        const marker = layer.getSelection()[0].uuid;
        gameStore.newMarker({ marker, sync: true });
        this.close();
    }
    deleteMarker(): void {
        const layer = this.getActiveLayer()!;
        if (layer.getSelection().length !== 1) return;
        const marker = layer.getSelection()[0].uuid;
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
        <SelectionBox ref="selectionbox"></SelectionBox>
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
