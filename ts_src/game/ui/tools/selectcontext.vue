<template>
    <contextmenu :visible="visible" :left="x + 'px'" :top="y + 'px'" @close="close">
        <li @click="bringPlayers" v-if="IS_DM">Bring players</li>
        <li @click="createToken">Create basic token</li>
        <li @click="showInitiative">Show initiative</li>
    </contextmenu>
</template>

<script lang="ts">
import Vue from "vue";

import { mapState } from "vuex";

import contextmenu from "../../../core/components/contextmenu.vue";
import gameManager from "../../manager";

import { socket } from "../../comm/socket";
import { l2gx, l2gy } from "../../units";

export default Vue.component("select-context", {
    components: {
        contextmenu,
    },
    data: () => ({
        visible: false,
        x: 0,
        y: 0,
    }),
    computed: {
        ...mapState(["IS_DM"]),
    },
    methods: {
        open(event: MouseEvent) {
            this.visible = true;
            this.x = event.pageX;
            this.y = event.pageY;
            this.$nextTick(() => this.$children[0].$el.focus());
        },
        close() {
            this.visible = false;
        },
        bringPlayers() {
            if (!this.IS_DM) return;
            socket.emit("Players.Bring", { x: l2gx(this.x), y: l2gy(this.y) });
            this.close();
        },
        createToken() {
            (<any>this.$parent.$parent.$refs.createtokendialog).open(this.x, this.y);
            this.close();
        },
        showInitiative() {
            (<any>this.$root.$refs.initiative).visible = true;
            this.close();
        },
    },
});
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