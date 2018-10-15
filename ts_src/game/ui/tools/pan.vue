<template>
</template>

<script lang="ts">
import { mapState } from "vuex";

import gameManager from "../../manager";
import Tool from "./tool.vue";

import { sendClientOptions } from "../../comm/socket";
import { LocalPoint } from "../../geom";
import { getMouse } from "../../utils";

export default Tool.extend({
    data: () => ({
        name: "pan",
        panStart: new LocalPoint(0, 0),
        active: false,
    }),
    computed: {
        ...mapState(["zoomFactor", "panX", "panY"]),
    },
    methods: {
        onMouseDown(event: MouseEvent) {
            this.panStart = getMouse(event);
            this.active = true;
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active) return;
            const mouse = getMouse(event);
            const distance = mouse.subtract(this.panStart).multiply(1 / this.zoomFactor);
            this.$store.commit("increasePanX", Math.round(distance.x));
            this.$store.commit("increasePanY", Math.round(distance.y));
            this.panStart = mouse;
            gameManager.layerManager.invalidate();
        },
        onMouseUp(event: MouseEvent) {
            this.active = false;
            sendClientOptions();
        },
    },
});
</script>