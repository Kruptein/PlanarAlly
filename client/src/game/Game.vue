<script lang="ts">
import throttle from "lodash/throttle";
import { defineComponent, onMounted, onUnmounted, watchEffect } from "vue";

import { useModal } from "../core/plugins/modals/plugin";
import { unloadRoomMods } from "../mods";
import { modEvents } from "../mods/events";
import { coreStore } from "../store/core";

import { createConnection, socket } from "./api/socket";
import { handleDropEvent } from "./dropAsset";
import { scrollZoom } from "./input/mouse";
import { clearUndoStacks } from "./operations/undo";
import { floorSystem } from "./systems/floors";
import { gameState } from "./systems/game/state";
import { playerSettingsState } from "./systems/settings/players/state";
import { setSelectionBoxFunction } from "./temp";
import {
    keyDown,
    keyUp,
    mouseDown,
    mouseLeave,
    mouseMove,
    mouseUp,
    touchEnd,
    touchMove,
    touchStart,
} from "./tools/events";
// import DebugInfo from "./ui/DebugInfo.vue";
import UI from "./ui/UI.vue";

import "./api/events";

export default defineComponent({
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Game",
    components: { UI }, // DebugInfo
    beforeRouteEnter(to, _from, next) {
        coreStore.setLoading(true);
        createConnection(to);
        next();
    },
    beforeRouteLeave(_to, _from, next) {
        socket.disconnect();
        next();
    },
    setup() {
        const modals = useModal();
        setSelectionBoxFunction(modals.selectionBox);

        const mediaQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
        let throttledMoveSet = false;
        let throttledMove: (event: MouseEvent) => void = (_event: MouseEvent) => {};
        let throttledTouchMoveSet = false;
        let throttledTouchMove: (event: TouchEvent) => void = (_event: TouchEvent) => {};

        watchEffect(() => {
            if (!gameState.reactive.boardInitialized) {
                throttledMoveSet = false;
                throttledTouchMoveSet = false;
            }
        });

        onMounted(async () => {
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            window.addEventListener("keyup", keyUp);
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            window.addEventListener("keydown", keyDown);
            window.addEventListener("resize", resizeWindow);
            clearUndoStacks();
            mediaQuery.addEventListener("change", resizeWindow);

            await modEvents.gameOpened();
        });

        onUnmounted(() => {
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            window.removeEventListener("keyup", keyUp);
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("resize", resizeWindow);
            mediaQuery.removeEventListener("change", resizeWindow);
            unloadRoomMods();
        });

        // Window events
        function zoom(event: WheelEvent): void {
            if (playerSettingsState.raw.disableScrollToZoom.value) return;
            throttle(scrollZoom)(event);
        }

        function resizeWindow(): void {
            floorSystem.resize(window.innerWidth, window.innerHeight);
        }

        // Touch events

        function touchmove(event: TouchEvent): void {
            // limit the number of touch moves to ease server load
            if (!throttledTouchMoveSet) {
                throttledTouchMoveSet = true;
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                throttledTouchMove = throttle(touchMove, 5);
            }
            // after throttling pass event to object
            throttledTouchMove(event);
        }

        function mousemove(event: MouseEvent): void {
            if (!throttledMoveSet) {
                throttledMoveSet = true;
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                throttledMove = throttle(mouseMove, 15);
            }
            throttledMove(event);
        }

        return {
            drop: handleDropEvent,
            gameState,
            mouseDown,
            mouseLeave,
            mousemove,
            mouseUp,
            touchStart,
            touchmove,
            touchEnd,
            zoom,
        };
    },
});
</script>

<template>
    <div id="main" @mouseleave="mouseLeave" @wheel.passive="zoom">
        <canvas id="babylon"></canvas>
        <div id="board" :class="{ disconnected: !gameState.reactive.isConnected }">
            <div
                id="layers"
                @mousedown="mouseDown"
                @mouseup="mouseUp"
                @mousemove="mousemove"
                @contextmenu.prevent.stop
                @dragover.prevent
                @drop.prevent.stop="drop"
                @touchmove="touchmove"
                @touchstart="touchStart"
                @touchend="touchEnd"
            ></div>
        </div>
        <UI ref="ui" />
        <!-- <DebugInfo /> -->
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

<style scoped lang="scss">
#main {
    display: flex;
    width: 100%;
    height: 100%;
}

#board {
    position: absolute;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    touch-action: none;

    &.disconnected {
        border: solid 5px red;
    }
}

#babylon {
    z-index: 11;
    pointer-events: none;
    width: 100%;
    height: 100vh;
}
</style>
