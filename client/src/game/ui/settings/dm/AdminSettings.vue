<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import InputCopyElement from "@/core/components/inputCopy.vue";
import Game from "../../../game.vue";
import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { gameStore, Player } from "@/game/store";

@Component({
    components: {
        InputCopyElement,
    },
})
export default class AdminSettings extends Vue {
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
        return window.location.protocol + "//" + window.location.host + "/invite/" + gameStore.invitationCode;
    }
    get locked(): boolean {
        return gameStore.isLocked;
    }

    get players(): Player[] {
        return gameStore.players.filter(p => p.role !== 1);
    }

    refreshInviteCode(): void {
        socket.emit("Room.Info.InviteCode.Refresh");
        this.refreshState = "pending";
        this.showRefreshState = true;
    }
    kickPlayer(id: number): void {
        socket.emit("Room.Info.Players.Kick", id);
        gameStore.kickPlayer(id);
    }
    toggleSessionLock(): void {
        gameStore.setIsLocked({ isLocked: !gameStore.isLocked, sync: true });
    }
    async deleteSession(): Promise<void> {
        const value = await (<Game>this.$parent.$parent.$parent.$parent.$parent).$refs.prompt.prompt(
            this.$t("game.ui.settings.dm.AdminSettings.delete_session_msg_CREATOR_ROOM", {
                creator: gameStore.roomCreator,
                room: gameStore.roomName,
            }).toString(),
            this.$t("game.ui.settings.dm.AdminSettings.deleting_session").toString(),
        );
        if (value !== `${gameStore.roomCreator}/${gameStore.roomName}`) return;
        socket.emit("Room.Delete");
        this.$router.push("/");
    }
}
</script>

<template>
    <div class="panel">
        <div class="spanrow header" v-t="'common.players'"></div>
        <div class="row smallrow" v-for="player in players" :key="player.id">
            <div>{{ player.name }}</div>
            <div>
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
            <div>
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
