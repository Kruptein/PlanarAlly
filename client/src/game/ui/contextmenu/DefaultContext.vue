<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ContextMenu from "../../../core/components/contextMenu/ContextMenu.vue";
import type { Section } from "../../../core/components/contextMenu/types";
import { l2g, l2gx, l2gy } from "../../../core/conversions";
import { toLP } from "../../../core/geometry";
import { baseAdjust } from "../../../core/http";
import { InvalidationMode, NO_SYNC, SyncMode } from "../../../core/models/types";
import { useModal } from "../../../core/plugins/modals/plugin";
import { uuidv4 } from "../../../core/utils";
import { sendBringPlayers } from "../../api/emits/players";
import { getGlobalId, getLocalId } from "../../id";
import { LayerName } from "../../models/floor";
import { Asset } from "../../shapes/variants/asset";
import { floorSystem } from "../../systems/floors";
import { floorState } from "../../systems/floors/state";
import { gameState } from "../../systems/game/state";
import { propertiesSystem } from "../../systems/properties";
import { getProperties } from "../../systems/properties/state";
import { locationSettingsSystem } from "../../systems/settings/location";
import { locationSettingsState } from "../../systems/settings/location/state";
import { initiativeStore } from "../initiative/state";
import { openCreateTokenDialog } from "../tokendialog/state";

import { defaultContextLeft, defaultContextTop, showDefaultContextMenu } from "./state";

const { t } = useI18n();
const modals = useModal();

function close(): void {
    showDefaultContextMenu.value = false;
}

function bringPlayers(): boolean {
    if (!gameState.raw.isDm) return false;

    sendBringPlayers({
        floor: floorState.currentFloor.value!.name,
        x: l2gx(defaultContextLeft.value),
        y: l2gy(defaultContextTop.value),
    });
    return true;
}

async function createSpawnLocation(): Promise<boolean> {
    if (!gameState.raw.isDm) return false;

    const spawnLocations = locationSettingsState.raw.spawnLocations.value;
    const spawnName = await modals.prompt(
        t("game.ui.tools.DefaultContext.new_spawn_question").toString(),
        t("game.ui.tools.DefaultContext.new_spawn_title").toString(),
        (value: string) => {
            if (value === "") return { valid: false, reason: t("common.insert_one_character").toString() };
            const spawnNames = spawnLocations
                .map((uuid) => getLocalId(uuid))
                .map((i) => (i ? getProperties(i)?.name : undefined) ?? "");
            if (spawnNames.some((name) => name === value))
                return { valid: false, reason: t("common.name_already_in_use").toString() };
            return { valid: true };
        },
    );
    if (spawnName === undefined || spawnName === "") return false;
    const uuid = uuidv4();

    const src = "/static/img/spawn.png";
    const img = new Image(64, 64);
    img.src = baseAdjust(src);

    const loc = toLP(defaultContextLeft.value, defaultContextTop.value);

    const shape = new Asset(img, l2g(loc), 50, 50, { uuid, isSnappable: false });
    propertiesSystem.setName(shape.id, spawnName, NO_SYNC);
    shape.src = src;

    floorSystem
        .getLayer(floorState.currentFloor.value!, LayerName.Dm)!
        .addShape(shape, SyncMode.FULL_SYNC, InvalidationMode.NO);
    img.onload = () => (gameState.raw.boardInitialized ? shape.layer?.invalidate(true) : undefined);

    const gId = getGlobalId(shape.id);

    if (gId)
        locationSettingsSystem.setSpawnLocations(
            [...spawnLocations, gId],
            locationSettingsState.raw.activeLocation,
            true,
        );
    return true;
}

function showInitiativeDialog(): boolean {
    initiativeStore.show(true, true);
    return true;
}

function showTokenDialog(): boolean {
    openCreateTokenDialog({ x: defaultContextLeft.value, y: defaultContextTop.value });
    return true;
}

const sections = computed<Section[]>(() => {
    return [
        {
            title: t("game.ui.tools.DefaultContext.bring_pl"),
            action: bringPlayers,
            disabled: !gameState.reactive.isDm,
        },
        {
            title: t("game.ui.tools.DefaultContext.create_basic_token"),
            action: showTokenDialog,
        },
        {
            title: t("game.ui.tools.DefaultContext.show_initiative"),
            action: showInitiativeDialog,
        },
        {
            title: t("game.ui.tools.DefaultContext.create_spawn_location"),
            action: createSpawnLocation,
            disabled: !gameState.reactive.isDm,
        },
    ];
});
</script>

<template>
    <ContextMenu
        :visible="showDefaultContextMenu"
        :left="defaultContextLeft"
        :top="defaultContextTop"
        :sections="sections"
        @cm:close="close"
    />
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
