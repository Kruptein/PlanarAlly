<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { mapState } from "vuex";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import ContextMenu from "@/core/components/contextmenu.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import SelectionBox from "@/core/components/modals/SelectionBox.vue";

import { EventBus } from "@/game/event-bus";
import { layerManager } from "@/game/layers/manager";
import { gameStore } from "@/game/store";
import { deleteShapes } from "../../shapes/utils";
import { initiativeStore, inInitiative } from "../initiative/store";
import { Layer } from "../../layers/layer";
import { gameSettingsStore } from "../../settings";
import { Shape } from "@/game/shapes/shape";
import { floorStore } from "../../layers/store";
import { Floor } from "@/game/layers/floor";
import { moveFloor, moveLayer } from "../../layers/utils";
import { requestAssetOptions, sendAssetOptions } from "@/game/api/emits/asset";
import { requestSpawnInfo, sendLocationChange } from "@/game/api/emits/location";
import { sendShapesMove } from "@/game/api/emits/shape/core";
import { ServerAsset } from "@/game/comm/types/shapes";
import { AssetOptions } from "@/game/comm/types/asset";
import { toTemplate } from "@/game/shapes/template";
import { addGroupMembers, createNewGroupForShapes, getGroupSize, removeGroup } from "../../groups";

@Component({
    components: {
        ConfirmDialog,
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
        confirmDialog: ConfirmDialog;
        prompt: Prompt;
        selectionbox: SelectionBox;
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
        this.$nextTick(() => (this.$children[0].$el as HTMLElement).focus());
    }
    close(): void {
        if (this.$refs.prompt.visible || this.$refs.selectionbox.visible || this.$refs.confirmDialog.visible) return;
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
                await this.$refs.confirmDialog.open(
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
                if (choice === undefined) return;
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
        layer.getSelection().forEach(shape => layer.moveShapeOrder(shape, layer.size() - 1, true));
        this.close();
    }
    async addInitiative(): Promise<void> {
        const layer = this.getActiveLayer()!;
        const selection = layer.getSelection();
        let groupInitiatives = false;
        if (new Set(selection.map(s => s.groupId)).size < selection.length) {
            const answer = await this.$refs.confirmDialog.open(
                "Adding initiative",
                "Some of the selected shapes belong to the same group. Do you wish to add 1 entry for these?",
                { no: "no, create a separate entry for each", focus: "confirm" },
            );
            if (answer === undefined) return;
            groupInitiatives = answer;
        }
        const groupsProcessed = new Set();
        for (const shape of selection) {
            if (!groupInitiatives || shape.groupId === undefined || !groupsProcessed.has(shape.groupId)) {
                initiativeStore.addInitiative({
                    ...shape.getInitiativeRepr(),
                    group: groupInitiatives && shape.groupId !== undefined,
                });
                groupsProcessed.add(shape.groupId);
            }
        }
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
    showDmNonSpawnItem(): boolean {
        if (this.hasSpawnToken()) return false;
        return gameStore.IS_DM;
    }

    hasAsset(): boolean {
        return this.getActiveLayer()!
            .getSelection()
            .every(s => s.assetId !== undefined);
    }

    async saveTemplate(): Promise<void> {
        const shape = this.getSelection()[0];
        let assetOptions: AssetOptions = {
            version: "0",
            shape: shape.type,
            templates: { default: {} },
        };
        if (shape.assetId) {
            const response = await requestAssetOptions(shape.assetId);
            if (response.success && response.options) assetOptions = response.options;
        } else {
            console.warn("Templates are currently only supported for shapes with existing asset relations.");
            return;
        }
        const choices = Object.keys(assetOptions.templates);
        try {
            const choice = await this.$refs.selectionbox.open(this.$t("game.ui.templates.save").toString(), choices, {
                defaultButton: this.$t("game.ui.templates.overwrite").toString(),
                customButton: this.$t("game.ui.templates.create_new").toString(),
            });
            if (choice === undefined) return;
            assetOptions.templates[choice] = toTemplate(shape.asDict());
            sendAssetOptions(shape.assetId, assetOptions);
        } catch {
            // no-op ; action cancelled
        }
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

    getGroups(): string[] {
        return [
            ...new Set(
                this.getSelection()
                    .map(s => s.groupId)
                    .filter(g => g !== undefined),
            ),
        ] as string[];
    }

    hasEntireGroup(): boolean {
        const selection = this.getSelection();
        return selection.length === getGroupSize(selection[0].groupId!);
    }

    hasUngrouped(): boolean {
        return this.getSelection().some(s => s.groupId === undefined);
    }

    createGroup(): void {
        createNewGroupForShapes(this.getSelection().map(s => s.uuid));
        this.close();
    }

    async splitGroup(): Promise<void> {
        const keepBadges = await this.$refs.confirmDialog.open(
            "Splitting group",
            "Do you wish to keep the original badges?",
            {
                no: "No, reset them",
            },
        );
        if (keepBadges === undefined) return;
        createNewGroupForShapes(
            this.getSelection().map(s => s.uuid),
            keepBadges,
        );
        this.close();
    }

    async mergeGroups(): Promise<void> {
        const keepBadges = await this.$refs.confirmDialog.open(
            "Merging group",
            "Do you wish to keep the original badges? This can lead to duplicate badges!",
            {
                no: "No, reset them",
            },
        );
        if (keepBadges === undefined) return;
        let targetGroup: string | undefined;
        const membersToMove: { uuid: string; badge?: number }[] = [];
        for (const shape of this.getSelection()) {
            if (shape.groupId !== undefined) {
                if (targetGroup === undefined) {
                    targetGroup = shape.groupId;
                } else if (targetGroup === shape.groupId) {
                    continue;
                } else {
                    membersToMove.push({ uuid: shape.uuid, badge: keepBadges ? shape.badge : undefined });
                }
            }
        }
        addGroupMembers(targetGroup!, membersToMove, true);
        this.close();
    }

    removeGroup(): void {
        removeGroup(this.getSelection()[0].groupId!, true);
        this.close();
    }

    enlargeGroup(): void {
        const selection = this.getSelection();
        const groupId = selection.find(s => s.groupId !== undefined)!.groupId!;
        addGroupMembers(
            groupId,
            selection.filter(s => s.groupId === undefined).map(s => ({ uuid: s.uuid })),
            true,
        );
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
        <ConfirmDialog ref="confirmDialog"></ConfirmDialog>
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
        <template v-if="hasSingleShape()">
            <li
                v-if="markers.includes(getMarker())"
                @click="deleteMarker"
                v-t="'game.ui.selection.shapecontext.remove_marker'"
            ></li>
            <li v-else @click="setMarker" v-t="'game.ui.selection.shapecontext.set_marker'"></li>
            <li @click="saveTemplate" v-if="showDmNonSpawnItem() && hasAsset()" v-t="'game.ui.templates.save'"></li>
        </template>
        <template v-else>
            <li>
                Group
                <ul>
                    <li v-if="getGroups().length === 0" @click="createGroup">Create group</li>
                    <li v-if="getGroups().length === 1 && !hasUngrouped() && !hasEntireGroup()" @click="splitGroup">
                        Split from group
                    </li>
                    <li v-if="getGroups().length === 1 && !hasUngrouped() && hasEntireGroup()" @click="removeGroup">
                        Remove group
                    </li>
                    <li v-if="getGroups().length > 1" @click="mergeGroups">Merge groups</li>
                    <li v-if="getGroups().length === 1 && hasUngrouped()" @click="enlargeGroup">Enlarge group</li>
                </ul>
            </li>
        </template>
        <li v-if="hasSingleShape()" @click="openEditDialog" v-t="'game.ui.selection.shapecontext.show_props'"></li>
    </ContextMenu>
</template>

<style scoped lang="scss">
.ContextMenu ul {
    border: 1px solid #82c8a0;
    width: fit-content;

    li {
        border-bottom: 1px solid #82c8a0;

        &:hover {
            background-color: #82c8a0;
        }
    }
}
</style>
