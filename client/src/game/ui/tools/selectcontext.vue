<template>
  <ContextMenu :visible="visible" :left="x + 'px'" :top="y + 'px'" @close="close">
    <li @click="bringPlayers" v-if="IS_DM">Bring players</li>
    <li @click="createToken">Create basic token</li>
    <li @click="showInitiative">Show initiative</li>
  </ContextMenu>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ContextMenu from "@/core/components/contextmenu.vue";

import { socket } from "@/game/api/socket";
import { EventBus } from "@/game/event-bus";
import { gameStore } from "@/game/store";
import { l2gx, l2gy } from "@/game/units";

@Component({
    components: {
        ContextMenu,
    },
})
export default class SelectContext extends Vue {
    visible = false;
    x = 0;
    y = 0;

    get IS_DM(): boolean {
        return gameStore.IS_DM;
    }

    open(event: MouseEvent) {
        this.visible = true;
        this.x = event.pageX;
        this.y = event.pageY;
        this.$nextTick(() => (<HTMLElement>this.$children[0].$el).focus());
    }
    close() {
        this.visible = false;
    }
    bringPlayers() {
        if (!gameStore.IS_DM) return;
        socket.emit("Players.Bring", { x: l2gx(this.x), y: l2gy(this.y) });
        this.close();
    }
    createToken() {
        (<any>this.$parent.$parent.$refs.createtokendialog).open(this.x, this.y);
        this.close();
    }
    showInitiative() {
        EventBus.$emit("Initiative.Show");
        this.close();
    }
}
</script>

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