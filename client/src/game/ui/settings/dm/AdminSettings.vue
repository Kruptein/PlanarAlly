<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import InputCopyElement from "../../../../core/components/InputCopyElement.vue";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { coreStore } from "../../../../store/core";
import { gameStore } from "../../../../store/game";
import { sendDeleteRoom, sendRefreshInviteCode } from "../../../api/emits/room";
import { getRoles } from "../../../models/role";

const { t } = useI18n();
const modals = useModal();
const route = useRoute();
const router = useRouter();

const gameState = gameStore.state;

const roles = getRoles();
const refreshState = ref("pending");
const showRefreshState = ref(false);

const players = toRef(gameState, "players");
const locked = toRef(gameState, "isLocked");

watch(
    () => gameState.invitationCode,
    () => (showRefreshState.value = false),
);

const invitationUrl = computed(
    () => `${window.location.protocol}//${gameState.publicName}/invite/${gameState.invitationCode}`,
);

const creator = computed(() => route.params.creator);
const username = toRef(coreStore.state, "username");

function refreshInviteCode(): void {
    sendRefreshInviteCode();
    refreshState.value = "pending";
    showRefreshState.value = true;
}

async function kickPlayer(playerId: number): Promise<void> {
    const value = await modals.confirm("Kicking player", "Are you sure you wish to kick this player?");
    if (value === true) gameStore.kickPlayer(playerId);
}

function changePlayerRole(event: Event, player: number): void {
    const value = (event.target as HTMLSelectElement).value;
    const role = parseInt(value);
    if (isNaN(role) || role < 0 || role >= roles.length) return;

    gameStore.setPlayerRole(player, role, true);
}

function togglePlayerRect(player: number): void {
    const p = gameStore.state.players.find((p) => p.id === player)?.showRect;
    if (p === undefined) return;

    gameStore.setShowPlayerRect(player, !p);
}

async function deleteSession(): Promise<void> {
    const value = await modals.prompt(
        t("game.ui.settings.dm.AdminSettings.delete_session_msg_CREATOR_ROOM", {
            creator: gameState.roomCreator,
            room: gameState.roomName,
        }),
        t("game.ui.settings.dm.AdminSettings.deleting_session"),
    );
    if (value !== `${gameState.roomCreator}/${gameState.roomName}`) return;
    sendDeleteRoom();
    await router.push("/");
}

const toggleLock = (): void => gameStore.setIsLocked(!gameState.isLocked, true);
</script>

<template>
    <div class="panel">
        <div class="spanrow header">{{ t("common.players") }}</div>
        <div class="row smallrow" v-for="player of players" :key="player.id">
            <div>{{ player.name }}</div>
            <div class="player-actions">
                <select
                    @change="changePlayerRole($event, player.id)"
                    :disabled="username !== creator && player.name === creator"
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
                    @click="kickPlayer(player.id)"
                    :style="{ opacity: username !== creator && player.name === creator ? 0.3 : 1.0 }"
                >
                    {{ t("game.ui.settings.dm.AdminSettings.kick") }}
                </div>
            </div>
        </div>
        <div class="row smallrow" v-if="players.length === 0">
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
                <template v-if="locked">
                    {{ t("game.ui.settings.dm.AdminSettings.unlock_NBSP_Session_NBSP") }}
                </template>
                <template v-else>{{ t("game.ui.settings.dm.AdminSettings.lock_NBSP_Session_NBSP") }}</template>
                <em>{{ t("game.ui.settings.dm.AdminSettings.dm_access_only") }}</em>
            </div>
            <div>
                <button class="danger" @click="toggleLock">
                    <template v-if="locked">{{ t("game.ui.settings.dm.AdminSettings.unlock_this_session") }}</template>
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
