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
            this.$t("ENTER {creator}/{room} TO CONFIRM SESSION REMOVAL[DOT]", {
                creator: gameStore.roomCreator,
                room: gameStore.roomName,
            }).toString(),
            this.$t("DELETING SESSION").toString(),
        );
        if (value !== `${gameStore.roomCreator}/${gameStore.roomName}`) return;
        socket.emit("Room.Delete");
        this.$router.push("/");
    }
}
</script>

<template>
    <div class="panel">
        <div class="spanrow header" v-t="'Players'"></div>
        <div class="row smallrow" v-for="player in players" :key="player.id">
            <div>{{ player.name }}</div>
            <div>
                <div @click="kickPlayer(player.id)" v-t="'Kick'"></div>
            </div>
        </div>
        <div class="row smallrow" v-if="Object.values(players).length === 0">
            <div class="spanrow" v-t="'There are no players yet, invite some using the link below!'"></div>
        </div>
        <div class="spanrow header" v-t="'Invite code'"></div>
        <div class="row">
            <div v-t="'Invitation URL:'"></div>
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
                <button v-t="'Refresh invitation code'"></button>
            </div>
        </div>
        <div class="spanrow header" v-t="'Danger[NBSP]Zone'"></div>
        <div class="row">
            <div>
                <template v-if="locked">{{ $t("Unlock") }}</template>
                <template v-else>{{ $t("Lock") }}</template>
                {{ $t("Session[NBSP]") }}
                <em v-t="'(DM access only)'"></em>
            </div>
            <div>
                <button class="danger" @click="toggleSessionLock">
                    <template v-if="locked">{{ $t("Unlock") }}</template>
                    <template v-else>{{ $t("Lock") }}</template>
                    {{ $t("this Session") }}
                </button>
            </div>
        </div>
        <div class="row">
            <div v-t="'Remove Session'"></div>
            <div>
                <button class="danger" @click="deleteSession" v-t="'Delete this Session'"></button>
            </div>
        </div>
    </div>
</template>
