<script lang="ts">
import { defineComponent, onMounted, ref, toRef, watch } from "vue";

import { selectionState } from "../../layers/selection";
import { selectTool } from "../../tools/variants/select";

import { useToolPosition } from "./toolPosition";

export default defineComponent({
    setup() {
        const right = ref("0px");
        const arrow = ref("0px");

        onMounted(() => {
            ({ right: right.value, arrow: arrow.value } = useToolPosition(selectTool.toolName));
            selectTool.setToolPermissions();
            watch(toRef(selectionState.state, "selection"), () => {
                selectTool.resetRotationHelper();
            });
        });

        function toggleShowRuler(event: { target: HTMLButtonElement }): void {
            const state = event.target.getAttribute("aria-pressed") ?? "false";
            selectTool.showRuler.value = state === "false";
            selectTool.setToolPermissions();
        }

        return {
            arrow,
            hasSelection: selectTool.hasSelection,
            right,
            selected: selectTool.isActiveTool,
            showRuler: selectTool.showRuler,
            toggleShowRuler,
        };
    },
});
</script>

<template>
    <div
        id="ruler"
        class="tool-detail"
        v-if="selected && hasSelection"
        :style="{ '--detailRight': right, '--detailArrow': arrow }"
    >
        <button @click="toggleShowRuler" :aria-pressed="showRuler">Show ruler</button>
    </div>
</template>

<style scoped lang="scss">
#ruler {
    display: flex;
}

button {
    display: block;
    box-sizing: border-box;
    border: none;
    color: inherit;
    background: none;
    font: inherit;
    line-height: inherit;
    text-align: left;
    padding: 0.4em 0 0.4em 4em;
    position: relative;
    outline: none;

    &:hover {
        &::before {
            box-shadow: 0 0 0.5em #333;
        }

        &::after {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='rgba(0,0,0,.25)'/%3E%3C/svg%3E");
            background-size: 30%;
            background-repeat: no-repeat;
            background-position: center center;
        }
    }

    &::before,
    &::after {
        content: "";
        position: absolute;
        height: 1.1em;
        transition: all 0.25s ease;
    }

    &::before {
        left: 0;
        top: 0.4em;
        width: 2.6em;
        border: 0.2em solid #767676;
        background: #767676;
        border-radius: 1.1em;
    }

    &::after {
        left: 0;
        top: 0.45em;
        background-color: #fff;
        background-position: center center;
        border-radius: 50%;
        width: 1.1em;
        border: 0.15em solid #767676;
    }

    &[aria-pressed="true"] {
        &::after {
            left: 1.6em;
            border-color: #36a829;
            color: #36a829;
        }

        &::before {
            background-color: #36a829;
            border-color: #36a829;
        }
    }
}
</style>
