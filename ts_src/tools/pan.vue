<template>
</template>

<script lang="ts">
import Tool from "./tool.vue";

import { LocalPoint } from "../geom";
import { getMouse } from "../utils";
import Settings from "../settings";
import gameManager from "../planarally";
import { sendClientOptions } from "../socket";

export default Tool.extend({
    data: () => ({
        name: "pan",
        panStart: new LocalPoint(0, 0),
        active: false
    }),
    methods: {
        onMouseDown(event: MouseEvent) {
            this.panStart = getMouse(event);
            this.active = true;
        },
        onMouseMove(event: MouseEvent) {
            if (!this.active) return;
            const mouse = getMouse(event);
            const distance = mouse.subtract(this.panStart).multiply(1/Settings.zoomFactor);
            Settings.panX += Math.round(distance.x);
            Settings.panY += Math.round(distance.y);
            this.panStart = mouse;
            gameManager.layerManager.invalidate();
        },
        onMouseUp(event: MouseEvent) {
            this.active = false;
            sendClientOptions();
        }
    }
})
</script>