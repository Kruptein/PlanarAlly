<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import InputCopyElement from "@/core/components/InputCopyElement.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import { sendDeleteRoom, sendRefreshInviteCode } from "@/game/api/emits/room";
import { EventBus } from "@/game/event-bus";
import { getRoles } from "@/game/models/role";
import { gameStore, Player } from "@/game/store";

@Component({
    components: {
        InputCopyElement,
        Prompt,
    },
})
export default class AdminSettings extends Vue {
    $refs!: {
        prompt: Prompt;
    };

    showRefreshState = false;
    refreshState = "pending";

    mounted(): void {
        EventBus.$on("DmSettings.RefreshedInviteCode", () => {
            this.showRefreshState = false;
        });
    }

    beforeDestroy(): void {
        EventBus.$off("DmSettings.RefreshedInviteCode");
    }

    get invitationUrl(): string {
        return window.location.protocol + "//" + gameStore.publicName + "/invite/" + gameStore.invitationCode;
    }
    get locked(): boolean {
        return gameStore.isLocked;
    }

    get players(): Player[] {
        return gameStore.players.filter((p) => p.name !== gameStore.username);
    }

    get roles(): string[] {
        return getRoles();
    }

    refreshInviteCode(): void {
        sendRefreshInviteCode();
        this.refreshState = "pending";
        this.showRefreshState = true;
    }

    kickPlayer(id: number): void {
        gameStore.kickPlayer(id);
    }
    toggleSessionLock(): void {
        gameStore.setIsLocked({ isLocked: !gameStore.isLocked, sync: true });
    }
    async deleteSession(): Promise<void> {
        const value = await this.$refs.prompt.prompt(
            this.$t("game.ui.settings.dm.AdminSettings.delete_session_msg_CREATOR_ROOM", {
                creator: gameStore.roomCreator,
                room: gameStore.roomName,
            }).toString(),
            this.$t("game.ui.settings.dm.AdminSettings.deleting_session").toString(),
        );
        if (value !== `${gameStore.roomCreator}/${gameStore.roomName}`) return;
        sendDeleteRoom();
        this.$router.push("/");
    }

    changePlayerRole(event: { target: HTMLSelectElement }, player: number): void {
        const value = event.target.value;
        const role = parseInt(value);
        if (isNaN(role) || role < 0 || role >= this.roles.length) return;

        gameStore.setPlayerRole({ player, role, sync: true });
    }
}
</script>

<template>
    <div class="panel">
        <Prompt ref="prompt"></Prompt>
        <div class="spanrow header" v-t="'common.players'"></div>
        <div class="row smallrow" v-for="player of players" :key="player.id">
            <div>{{ player.name }}</div>
            <div class="player-actions">
                <select @change="changePlayerRole($event, player.id)">
                    <option
                        v-for="[i, role] of roles.entries()"
                        :key="'role-' + i + '-' + player.id"
                        :value="i"
                        :selected="player.role === i"
                    >
                        {{ role }}
                    </option>
                </select>
                <div @click="kickPlayer(player.id)" v-t="'game.ui.settings.dm.AdminSettings.kick'"></div>
            </div>
        </div>
        <div class="row smallrow" v-if="Object.values(players).length === 0">
            <div class="spanrow" v-t="'game.ui.settings.dm.AdminSettings.no_players_invite_msg'"></div>
        </div>
        <div class="spanrow header" v-t="'game.ui.settings.dm.AdminSettings.invite_code'"></div>
        <div class="row">
            <div v-t="'game.ui.settings.dm.AdminSettings.invitation_url'"></div>
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
                <button v-t="'game.ui.settings.dm.AdminSettings.refresh_invitation_code'"></button>
            </div>
        </div>
        <div class="spanrow header" v-t="'game.ui.settings.dm.AdminSettings.danger_NBSP_zone'"></div>
        <div class="row">
            <div style="margin-right: 0.5em">
                <template v-if="locked">
                    {{ $t("game.ui.settings.dm.AdminSettings.unlock_NBSP_Session_NBSP") }}
                </template>
                <template v-else>{{ $t("game.ui.settings.dm.AdminSettings.lock_NBSP_Session_NBSP") }}</template>
                <em v-t="'game.ui.settings.dm.AdminSettings.dm_access_only'"></em>
            </div>
            <div>
                <button class="danger" @click="toggleSessionLock">
                    <template v-if="locked">{{ $t("game.ui.settings.dm.AdminSettings.unlock_this_session") }}</template>
                    <template v-else>{{ $t("game.ui.settings.dm.AdminSettings.lock_this_session") }}</template>
                </button>
            </div>
        </div>
        <div class="row">
            <div v-t="'game.ui.settings.dm.AdminSettings.remove_session'"></div>
            <div>
                <button
                    class="danger"
                    @click="deleteSession"
                    v-t="'game.ui.settings.dm.AdminSettings.delete_session'"
                ></button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.player-actions {
    display: flex;

    select {
        margin-right: 20%;
    }
}
</style>
