<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import InputCopyElement from "../../../../core/components/InputCopyElement.vue";
import { baseAdjust } from "../../../../core/http";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { coreStore } from "../../../../store/core";
import { sendDeleteRoom, sendRefreshInviteCode } from "../../../api/emits/room";
import { getRoles } from "../../../models/role";
import { gameSystem } from "../../../systems/game";
import { gameState } from "../../../systems/game/state";
import { playerSystem } from "../../../systems/players";
import type { PlayerId } from "../../../systems/players/models";
import { playerState } from "../../../systems/players/state";

const { t } = useI18n();
const modals = useModal();
const route = useRoute();
const router = useRouter();

const roles = getRoles();
const refreshState = ref("pending");
const showRefreshState = ref(false);

const players = toRef(playerState.reactive, "players");

watch(
    () => gameState.reactive.invitationCode,
    () => (showRefreshState.value = false),
);

const invitationUrl = computed(
    () => `${gameState.reactive.clientUrl}${baseAdjust("/invite/")}${gameState.reactive.invitationCode}`,
);

const creator = computed(() => route.params.creator);
const username = toRef(coreStore.state, "username");

function refreshInviteCode(): void {
    sendRefreshInviteCode();
    refreshState.value = "pending";
    showRefreshState.value = true;
}

async function kickPlayer(playerId: PlayerId): Promise<void> {
    const value = await modals.confirm("Kicking player", "Are you sure you wish to kick this player?");
    if (value === true) playerSystem.kickPlayer(playerId);
}

function changePlayerRole(event: Event, player: PlayerId): void {
    const value = (event.target as HTMLSelectElement).value;
    const role = parseInt(value);
    if (isNaN(role) || role < 0 || role >= roles.length) return;

    playerSystem.setPlayerRole(player, role, true);
}

function togglePlayerRect(player: PlayerId): void {
    const p = playerSystem.getPlayer(player)?.showRect;
    if (p === undefined) return;

    playerSystem.setShowPlayerRect(player, !p);
}

async function deleteSession(): Promise<void> {
    const value = await modals.prompt(
        t("game.ui.settings.dm.AdminSettings.delete_session_msg_CREATOR_ROOM", {
            creator: gameState.raw.roomCreator,
            room: gameState.raw.roomName,
        }),
        t("game.ui.settings.dm.AdminSettings.deleting_session"),
    );
    if (value !== `${gameState.raw.roomCreator}/${gameState.raw.roomName}`) return;
    sendDeleteRoom();
    await router.push("/");
}

const toggleLock = (): void => gameSystem.setIsLocked(!gameState.raw.isLocked, true);
</script>

<template>
    <div class="panel">
        <div class="spanrow header">{{ t("common.players") }}</div>
        <div v-for="player of players.values()" :key="player.id" class="row smallrow">
            <div>{{ player.name }}</div>
            <div class="player-actions">
                <select
                    :disabled="username !== creator && player.name === creator"
                    @change="changePlayerRole($event, player.id)"
                >
                    <option
                        v-for="[i, role] of roles.entries()"
                        :key="'role-' + i + '-' + player.id"
                        :value="i"
                        :selected="player.role === i"
                    >
                        {{ role }}
                    </option>
                </select>
                <div
                    title="Show player viewport"
                    :style="{ opacity: player.showRect ? 1 : 0.3 }"
                    @click="togglePlayerRect(player.id)"
                >
                    <font-awesome-icon icon="eye" />
                </div>
                <div
                    :style="{ opacity: username !== creator && player.name === creator ? 0.3 : 1.0 }"
                    @click="kickPlayer(player.id)"
                >
                    {{ t("game.ui.settings.dm.AdminSettings.kick") }}
                </div>
            </div>
        </div>
        <div v-if="players.size === 0" class="row smallrow">
            <div class="spanrow">{{ t("game.ui.settings.dm.AdminSettings.no_players_invite_msg") }}</div>
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.dm.AdminSettings.invite_code") }}</div>
        <div class="row">
            <div>{{ t("game.ui.settings.dm.AdminSettings.invitation_url") }}</div>
            <template v-if="showRefreshState">
                <InputCopyElement :value="refreshState" />
            </template>
            <template v-else>
                <InputCopyElement :value="invitationUrl" />
            </template>
        </div>
        <div class="row" @click="refreshInviteCode">
            <div></div>
            <div>
                <button>{{ t("game.ui.settings.dm.AdminSettings.refresh_invitation_code") }}</button>
            </div>
        </div>
        <div class="spanrow header">{{ t("game.ui.settings.dm.AdminSettings.danger_NBSP_zone") }}</div>
        <div class="row">
            <div style="margin-right: 0.5em">
                <template v-if="gameState.reactive.isLocked">
                    {{ t("game.ui.settings.dm.AdminSettings.unlock_NBSP_Session_NBSP") }}
                </template>
                <template v-else>{{ t("game.ui.settings.dm.AdminSettings.lock_NBSP_Session_NBSP") }}</template>
                <em>{{ t("game.ui.settings.dm.AdminSettings.dm_access_only") }}</em>
            </div>
            <div>
                <button class="danger" @click="toggleLock">
                    <template v-if="gameState.reactive.isLocked">
                        {{ t("game.ui.settings.dm.AdminSettings.unlock_this_session") }}
                    </template>
                    <template v-else>{{ t("game.ui.settings.dm.AdminSettings.lock_this_session") }}</template>
                </button>
            </div>
        </div>
        <div class="row">
            <div>{{ t("game.ui.settings.dm.AdminSettings.remove_session") }}</div>
            <div>
                <button class="danger" @click="deleteSession">
                    {{ t("game.ui.settings.dm.AdminSettings.delete_session") }}
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.player-actions {
    display: flex;

    * {
        margin: 0 10px;
    }

    select {
        margin-right: 20%;
    }
}
</style>
