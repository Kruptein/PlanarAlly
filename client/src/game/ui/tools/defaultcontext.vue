<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ContextMenu from "@/core/components/contextmenu.vue";

import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { gameStore } from "@/game/store";
import { l2gx, l2gy } from "@/game/units";
import { layerManager } from "../../layers/manager";

@Component({
    components: {
        ContextMenu,
    },
})
export default class DefaultContext extends Vue {
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
        this.$nextTick(() => (<HTMLElement>this.$children[0].$el).focus());
    }
    close(): void {
        this.visible = false;
    }
    bringPlayers(): void {
        if (!gameStore.IS_DM) return;
        socket.emit("Players.Bring", {
            floor: layerManager.floor!.name,
            x: l2gx(this.x),
            y: l2gy(this.y),
            zoom: gameStore.zoomDisplay,
        });
        this.close();
    }
    createToken(): void {
        (<any>this.$parent.$refs.createtokendialog).open(this.x, this.y);
        this.close();
    }
    showInitiative(): void {
        EventBus.$emit("Initiative.Show");
        this.close();
    }
}
</script>

<template>
    <ContextMenu :visible="visible" :left="x + 'px'" :top="y + 'px'" @close="close">
        <li @click="bringPlayers" v-if="IS_DM" v-t="'game.ui.tools.defaultcontext.bring_pl'"></li>
        <li @click="createToken" v-t="'game.ui.tools.defaultcontext.create_basic_token'"></li>
        <li @click="showInitiative" v-t="'game.ui.tools.defaultcontext.show_initiative'"></li>
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
