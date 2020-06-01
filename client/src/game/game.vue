<script lang="ts">
import throttle from "lodash/throttle";
import Vue from "vue";
import Component from "vue-class-component";

import "@/game/api/events";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import Prompt from "@/core/components/modals/prompt.vue";
import Initiative from "@/game/ui/initiative/initiative.vue";
import LabelManager from "@/game/ui/labels.vue";
import NoteDialog from "@/game/ui/note.vue";
import UI from "./ui/ui.vue";

import { createConnection, socket } from "@/game/api/socket";
import { onKeyDown, onKeyUp } from "@/game/events/keyboard";
import { scrollZoom } from "@/game/events/mouse";
import { layerManager } from "@/game/layers/manager";
import { dropAsset } from "./layers/utils";
import { coreStore } from "@/core/store";

@Component({
    components: {
        "prompt-dialog": Prompt,
        "confirm-dialog": ConfirmDialog,
        "initiative-dialog": Initiative,
        "note-dialog": NoteDialog,
        "label-dialog": LabelManager,
        ui: UI,
    },
    beforeRouteEnter(to, from, next) {
        coreStore.setLoading(true);
        createConnection(to);
        next();
    },
    beforeRouteLeave(to, from, next) {
        socket.disconnect();
        next();
    },
})
export default class Game extends Vue {
    $refs!: {
        confirm: InstanceType<typeof ConfirmDialog>;
        note: InstanceType<typeof NoteDialog>;
        prompt: InstanceType<typeof Prompt>;
        ui: InstanceType<typeof UI>;
    };

    ready = {
        manager: false,
    };

    throttledmoveSet = false;
    throttledmove: (event: MouseEvent) => void = (_event: MouseEvent) => {};

    throttledtouchmoveSet = false;
    throttledtouchmove: (event: TouchEvent) => void = (_event: TouchEvent) => {};

    mounted(): void {
        window.addEventListener("resize", this.resizeWindow);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);
        this.ready.manager = true;
    }

    destroyed(): void {
        window.removeEventListener("resize", this.resizeWindow);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("keydown", onKeyDown);
        this.ready.manager = false;
    }

    // Window events

    zoom(event: WheelEvent): void {
        throttle(scrollZoom)(event);
    }

    resizeWindow(): void {
        layerManager.setWidth(window.innerWidth);
        layerManager.setHeight(window.innerHeight);
        layerManager.invalidateAllFloors();
    }

    // Touch events

    touchend(event: TouchEvent): void {
        this.$refs.ui.$refs.tools.touchend(event);
    }

    touchstart(event: TouchEvent): void {
        this.$refs.ui.$refs.tools.touchstart(event);
    }

    touchmove(event: TouchEvent): void {
        // limit the number of touch moves to ease server load
        if (!this.throttledtouchmoveSet) {
            this.throttledtouchmoveSet = true;
            this.throttledtouchmove = throttle(this.$refs.ui.$refs.tools.touchmove, 5);
        }
        // after throttling pass event to object
        this.throttledtouchmove(event);
    }

    // Mouse events

    mousedown(event: MouseEvent): void {
        this.$refs.ui.$refs.tools.mousedown(event);
    }

    mouseup(event: MouseEvent): void {
        this.$refs.ui.$refs.tools.mouseup(event);
    }

    mousemove(event: MouseEvent): void {
        if (!this.throttledmoveSet) {
            this.throttledmoveSet = true;
            this.throttledmove = throttle(this.$refs.ui.$refs.tools.mousemove, 15);
        }
        this.throttledmove(event);
    }

    mouseleave(event: MouseEvent): void {
        this.$refs.ui.$refs.tools.mouseleave(event);
    }

    contextmenu(event: MouseEvent): void {
        this.$refs.ui.$refs.tools.contextmenu(event);
    }

    async drop(event: DragEvent): Promise<void> {
        if (event === null || event.dataTransfer === null) return;
        if (event.dataTransfer.files.length > 0) {
            await this.$refs.confirm.open("Warning", "Uploading files should be done through the asset manager.", {
                yes: "Ok",
                showNo: false,
            });
        } else if (event.dataTransfer.getData("text/plain") === "") {
            return;
        } else {
            dropAsset(event);
        }
    }
}
</script>

<template>
    <div id="main" @mouseleave="mouseleave" @wheel="zoom">
        <ui ref="ui" v-if="ready.manager"></ui>
        <div id="board">
            <div
                id="layers"
                @mousedown="mousedown"
                @mouseup="mouseup"
                @mousemove="mousemove"
                @contextmenu.prevent.stop="contextmenu"
                @dragover.prevent
                @drop.prevent.stop="drop"
                @touchmove="touchmove"
                @touchstart="touchstart"
                @touchend="touchend"
            ></div>
        </div>
        <initiative-dialog ref="initiative" id="initiativedialog"></initiative-dialog>
        <note-dialog ref="note"></note-dialog>
        <label-dialog ref="labels"></label-dialog>
        <prompt-dialog ref="prompt"></prompt-dialog>
        <confirm-dialog ref="confirm"></confirm-dialog>
    </div>
</template>

<style>
a,
a:visited,
a:hover,
a:active {
    color: inherit;
}

svg {
    cursor: pointer;
}

.notAllowed,
.notAllowed > * {
    cursor: not-allowed !important;
}

#layers,
#layers canvas {
    z-index: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    overflow: hidden;
}
</style>

<style scoped>
#main {
    display: flex;
    width: 100%;
    height: 100%;
}

#board {
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>
