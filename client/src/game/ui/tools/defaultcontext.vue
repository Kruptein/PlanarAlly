<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { SyncMode, InvalidationMode } from "@/core/comm/types";
import ContextMenu from "@/core/components/contextmenu.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import { baseAdjust, uuidv4 } from "@/core/utils";
import { sendBringPlayers } from "@/game/api/emits/players";
import { EventBus } from "@/game/event-bus";
import { LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { floorStore } from "@/game/layers/store";
import { gameSettingsStore } from "@/game/settings";
import { Asset } from "@/game/shapes/variants/asset";
import { gameStore } from "@/game/store";
import { l2gx, l2gy, l2g } from "@/game/units";

import CreateTokenModal from "./createtoken_modal.vue";

@Component({
    components: {
        ContextMenu,
        CreateTokenModal,
        Prompt,
    },
})
export default class DefaultContext extends Vue {
    $refs!: {
        createtokendialog: CreateTokenModal;
        prompt: Prompt;
    };

    visible = false;
    x = 0;
    y = 0;

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    open(event: MouseEvent): void {
        this.visible = true;
        this.x = event.pageX;
        this.y = event.pageY;
        this.$nextTick(() => (this.$children[0].$el as HTMLElement).focus());
    }

    close(): void {
        if (this.$refs.createtokendialog.visible || this.$refs.prompt.visible) return;
        this.visible = false;
    }

    bringPlayers(): void {
        if (!gameStore.IS_DM) return;
        sendBringPlayers({
            floor: floorStore.currentFloor.name,
            x: l2gx(this.x),
            y: l2gy(this.y),
            zoom: gameStore.zoomDisplay,
        });
        this.close();
    }

    createToken(): void {
        this.$refs.createtokendialog.open(this.x, this.y);
    }

    async createSpawnLocation(): Promise<void> {
        if (!gameStore.IS_DM) return;
        const spawnLocations = gameSettingsStore.spawnLocations;
        const spawnName = await this.$refs.prompt.prompt(
            this.$t("game.ui.tools.defaultcontext.new_spawn_question").toString(),
            this.$t("game.ui.tools.defaultcontext.new_spawn_title").toString(),
            (value: string) => {
                if (value === "") return { valid: false, reason: this.$t("common.insert_one_character").toString() };
                const spawnNames = spawnLocations.map((uuid) => layerManager.UUIDMap.get(uuid)?.name ?? "");
                if (spawnNames.some((name) => name === value))
                    return { valid: false, reason: this.$t("common.name_already_in_use").toString() };
                return { valid: true };
            },
        );
        if (spawnName === undefined || spawnName === "") return;
        const uuid = uuidv4();

        const src = "/static/img/spawn.png";
        const img = new Image(64, 64);
        img.src = baseAdjust(src);

        const loc = new LocalPoint(this.x, this.y);

        const shape = new Asset(img, l2g(loc), 50, 50, { uuid });
        shape.name = spawnName;
        shape.src = src;

        layerManager
            .getLayer(floorStore.currentFloor, "dm")!
            .addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO, false);
        img.onload = () => (gameStore.boardInitialized ? shape.layer.invalidate(true) : undefined);

        gameSettingsStore.setSpawnLocations({
            spawnLocations: [...spawnLocations, shape.uuid],
            location: gameSettingsStore.activeLocation,
            sync: true,
        });
    }

    showInitiative(): void {
        EventBus.$emit("Initiative.Show");
        this.close();
    }
}
</script>

<template>
    <ContextMenu :visible="visible" :left="x + 'px'" :top="y + 'px'" @close="close">
        <CreateTokenModal ref="createtokendialog" @close="close"></CreateTokenModal>
        <Prompt ref="prompt" @close="close"></Prompt>

        <li @click="bringPlayers" v-if="IS_DM" v-t="'game.ui.tools.defaultcontext.bring_pl'"></li>
        <li @click="createToken" v-t="'game.ui.tools.defaultcontext.create_basic_token'"></li>
        <li @click="showInitiative" v-t="'game.ui.tools.defaultcontext.show_initiative'"></li>
        <li @click="createSpawnLocation" v-if="IS_DM" v-t="'game.ui.tools.defaultcontext.create_spawn_location'"></li>
    </ContextMenu>
</template>

<style scoped lang="scss">
.ContextMenu ul {
    border: 1px solid #82c8a0;

    li {
        border-bottom: 1px solid #82c8a0;

        &:hover {
            background-color: #82c8a0;
        }
    }
}
</style>
