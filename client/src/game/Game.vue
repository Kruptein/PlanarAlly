<script lang="ts">
import throttle from "lodash/throttle";
import Vue from "vue";
import Component from "vue-class-component";

import "@/game/api/events";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import SelectionBox from "@/core/components/modals/SelectionBox.vue";
import Initiative from "@/game/ui/initiative/initiative.vue";
import UI from "./ui/ui.vue";

import { createConnection, socket } from "@/game/api/socket";
import { onKeyDown, onKeyUp } from "@/game/input/keyboard";
import { scrollZoom } from "@/game/input/mouse";
import { layerManager } from "@/game/layers/manager";
import { dropAsset } from "./layers/utils";
import { coreStore } from "@/core/store";
import { mapGetters } from "vuex";
import { Watch } from "vue-property-decorator";
import { requestAssetOptions } from "./api/emits/asset";
import { BaseTemplate } from "./comm/types/templates";

@Component({
    components: {
        ConfirmDialog,
        Initiative,
        SelectionBox,
        UI,
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
    computed: {
        ...mapGetters("game", ["isBoardInitialized"]),
    },
})
export default class Game extends Vue {
    $refs!: {
        confirm: ConfirmDialog;
        selectionbox: SelectionBox;
        ui: UI;
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

    @Watch("isBoardInitialized")
    onBoardInitialized(newValue: boolean): void {
        if (!newValue) {
            this.throttledmoveSet = false;
            this.throttledtouchmoveSet = false;
        }
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
        if (this.$refs.ui === undefined) return;
        this.$refs.ui.$refs.tools.touchend(event);
    }

    touchstart(event: TouchEvent): void {
        if (this.$refs.ui === undefined) return;
        this.$refs.ui.$refs.tools.touchstart(event);
    }

    touchmove(event: TouchEvent): void {
        if (this.$refs.ui === undefined) return;
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
        if (this.$refs.ui === undefined) return;
        this.$refs.ui.$refs.tools.mousedown(event);
    }

    mouseup(event: MouseEvent): void {
        if (this.$refs.ui === undefined) return;
        this.$refs.ui.$refs.tools.mouseup(event);
    }

    mousemove(event: MouseEvent): void {
        if (this.$refs.ui === undefined) return;
        if (!this.throttledmoveSet) {
            this.throttledmoveSet = true;
            this.throttledmove = throttle(this.$refs.ui.$refs.tools.mousemove, 15);
        }
        this.throttledmove(event);
    }

    mouseleave(event: MouseEvent): void {
        if (this.$refs.ui === undefined) return;
        this.$refs.ui.$refs.tools.mouseleave(event);
    }

    contextmenu(event: MouseEvent): void {
        if (this.$refs.ui === undefined) return;
        this.$refs.ui.$refs.tools.contextmenu(event);
    }

    async drop(event: DragEvent): Promise<void> {
        if (event === null || event.dataTransfer === null) return;
        if (event.dataTransfer.files.length > 0) {
            await this.$refs.confirm.open("Warning", "Uploading files should be done through the asset manager.", {
                yes: "Ok",
                showNo: false,
            });
        } else if (event.dataTransfer.getData("text/plain") === "" || event === null || event.dataTransfer === null) {
            return;
        } else {
            const { imageSource, assetId }: { imageSource: string; assetId: number } = JSON.parse(
                event.dataTransfer.getData("text/plain"),
            );
            let options: BaseTemplate | undefined;
            if (assetId) {
                const response = await requestAssetOptions(assetId);
                if (response.success) {
                    const choices = Object.keys(response.options?.templates ?? {});
                    if (choices.length > 0) {
                        try {
                            const choice = await this.$refs.selectionbox.open(
                                this.$t("game.ui.templates.choose").toString(),
                                choices,
                            );
                            if (choice === undefined) return;
                            options = response.options!.templates[choice];
                        } catch {
                            // no-op ; action cancelled
                        }
                    }
                }
            }
            dropAsset({ imageSource, assetId }, { x: event.clientX, y: event.clientY }, options);
        }
    }
}
</script>

<template>
    <div id="main" @mouseleave="mouseleave" @wheel="zoom">
        <UI v-if="$store.state.game.boardInitialized" ref="ui"></UI>
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
        <Initiative ref="initiative" id="initiativedialog"></Initiative>
        <ConfirmDialog ref="confirm"></ConfirmDialog>
        <SelectionBox ref="selectionbox"></SelectionBox>
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
