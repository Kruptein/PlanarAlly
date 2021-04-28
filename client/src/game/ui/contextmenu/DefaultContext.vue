<script lang="ts">
import { defineComponent, toRef } from "vue";
import { useI18n } from "vue-i18n";

import ContextMenu from "../../../core/components/ContextMenu.vue";
import { l2g, l2gx, l2gy } from "../../../core/conversions";
import { LocalPoint } from "../../../core/geometry";
import { InvalidationMode, SyncMode } from "../../../core/models/types";
import { useModal } from "../../../core/plugins/modals/plugin";
import { baseAdjust, uuidv4 } from "../../../core/utils";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { gameStore } from "../../../store/game";
import { settingsStore } from "../../../store/settings";
import { UuidMap } from "../../../store/shapeMap";
import { sendBringPlayers } from "../../api/emits/players";
import { LayerName } from "../../models/floor";
import { Asset } from "../../shapes/variants/asset";
import { initiativeStore } from "../initiative/state";
import { openCreateTokenDialog } from "../tokendialog/state";

import { defaultContextLeft, defaultContextTop, showDefaultContextMenu } from "./state";

export default defineComponent({
    components: { ContextMenu },
    setup() {
        const { t } = useI18n();
        const modals = useModal();

        const gameState = gameStore.state;
        const isDm = toRef(gameState, "isDm");

        function close(): void {
            showDefaultContextMenu.value = false;
        }

        function bringPlayers(): void {
            if (!isDm.value) return;

            sendBringPlayers({
                floor: floorStore.currentFloor.value!.name,
                x: l2gx(defaultContextLeft.value),
                // eslint-disable-next-line no-undef
                y: l2gy(defaultContextTop.value),
                zoom: clientStore.state.zoomDisplay,
            });
            close();
        }

        async function createSpawnLocation(): Promise<void> {
            if (!isDm.value) return;

            const spawnLocations = settingsStore.spawnLocations.value;
            const spawnName = await modals.prompt(
                t("game.ui.tools.DefaultContext.new_spawn_question").toString(),
                t("game.ui.tools.DefaultContext.new_spawn_title").toString(),
                (value: string) => {
                    if (value === "") return { valid: false, reason: t("common.insert_one_character").toString() };
                    const spawnNames = spawnLocations.map((uuid) => UuidMap.get(uuid)?.name ?? "");
                    if (spawnNames.some((name) => name === value))
                        return { valid: false, reason: t("common.name_already_in_use").toString() };
                    return { valid: true };
                },
            );
            if (spawnName === undefined || spawnName === "") return;
            const uuid = uuidv4();

            const src = "/static/img/spawn.png";
            const img = new Image(64, 64);
            img.src = baseAdjust(src);

            const loc = new LocalPoint(defaultContextLeft.value, defaultContextTop.value);

            const shape = new Asset(img, l2g(loc), 50, 50, { uuid });
            shape.name = spawnName;
            shape.src = src;

            floorStore
                .getLayer(floorStore.currentFloor.value!, LayerName.Dm)!
                .addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO, false);
            img.onload = () => (gameState.boardInitialized ? shape.layer.invalidate(true) : undefined);

            settingsStore.setSpawnLocations([...spawnLocations, shape.uuid], settingsStore.state.activeLocation, true);
        }

        function showInitiativeDialog(): void {
            initiativeStore.show(true);
            close();
        }

        function showTokenDialog(): void {
            openCreateTokenDialog({ x: defaultContextLeft.value, y: defaultContextTop.value });
            close();
        }

        return {
            bringPlayers,
            close,
            createSpawnLocation,
            left: defaultContextLeft,
            isDm,
            showInitiativeDialog,
            showTokenDialog,
            top: defaultContextTop,
            visible: showDefaultContextMenu,
        };
    },
});
</script>

<template>
    <ContextMenu :visible="visible" :left="left" :top="top" @cm:close="close">
        <li @click="bringPlayers" v-if="isDm" v-t="'game.ui.tools.DefaultContext.bring_pl'"></li>
        <li @click="showTokenDialog" v-t="'game.ui.tools.DefaultContext.create_basic_token'"></li>
        <li @click="showInitiativeDialog" v-t="'game.ui.tools.DefaultContext.show_initiative'"></li>
        <li @click="createSpawnLocation" v-if="isDm" v-t="'game.ui.tools.DefaultContext.create_spawn_location'"></li>
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
