<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

import { baseAdjust } from "../../../../core/http";
import type { GlobalId } from "../../../../core/id";
import { getLocalId, getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { getVariableSegments } from "../../../systems/customData/utils";
import { diceState } from "../../../systems/dice/state";

import DiceAutoComplete from "./DiceAutoComplete.vue";

const { t } = useI18n();

const inputElement = useTemplateRef<HTMLInputElement>("inputElement");

const emit = defineEmits<{
    (e: "clear" | "roll"): void;
}>();

// Update the scroll position of the input element when the text input changes
// This is only set when the input was changed explicitly through the dice system
// manual text changes will not trigger this (on purpose)
watch(
    () => diceState.reactive.updateTextInputScroll,
    async (value) => {
        if (!value) return;
        await nextTick();
        inputElement.value!.scrollLeft = inputElement.value!.scrollWidth;
        inputElement.value!.focus();
        diceState.mutableReactive.updateTextInputScroll = false;
    },
);

const segments = computed(() => {
    return getVariableSegments(diceState.reactive.textInput);
});

async function handleKey(event: KeyboardEvent): Promise<void> {
    const isDeleteKey = event.key === "Backspace" || event.key === "Delete";
    const isModifierKey = event.ctrlKey || event.metaKey || event.altKey;

    if (event.key === "Enter") {
        event.preventDefault();
        // roll is handled by the DiceAutoComplete component
        return;
    } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const sel = document.getSelection();
        if (sel === null) return;
        // This was only moving the cursor within the sub-elements.
        // So we select all children and then collapse to the start or end
        sel.selectAllChildren(inputElement.value!);
        if (event.key === "Home") {
            sel.collapseToStart();
        } else {
            sel.collapseToEnd();
        }
        return;
    }

    if (isModifierKey || (!/^.$/u.test(event.key) && !isDeleteKey)) {
        // non unicode character or modifier key
        return;
    }
    event.preventDefault();

    await handleText(event.key, isDeleteKey, event.key === "Backspace");
}

async function handlePaste(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (text.length === 0) return;

    await handleText(text, false, false);
}

async function handleText(text: string, isDelete: boolean, isBackspace: boolean): Promise<void> {
    const sel = document.getSelection();
    if (sel === null) return;

    const isCollapsed = sel.isCollapsed ?? false;
    const selectionLength = isCollapsed ? 1 : (sel.toString().length ?? 0);
    sel.collapseToStart();

    // First we need to determine the position of the cursor in the state input
    // we do this based on the segments and selection anchor info + modifications for references that have modified visuals
    if (sel.anchorNode === null) return;
    if (sel.anchorNode.nodeName !== "#text") {
        // firefox shenanigans
        // sometimes firefox decides that we don't need to have the anchor be the deepest element,
        // but rather the main input element, which makes the anchorOffset mean something completely different
        // FF can only do this if the selection is at the very end, so we force it to re-evaluate by moving backward and forward
        sel.modify("move", "backward", "character");
        sel.modify("move", "forward", "character");
    }
    const parentElement = sel.anchorNode.parentElement;
    const segmentIndex = parentElement?.getAttribute("data-offset");
    const isReferenceNode = parentElement?.classList.contains("reference") ?? false;

    let segmentIndexInt = 0;
    if (segmentIndex !== null && segmentIndex !== undefined) {
        segmentIndexInt = parseInt(segmentIndex);
    }

    // We keep track of two positions:
    // - statePos: The position in the state text input
    // - visualPos: The position in the visual text input
    let statePos = 0;
    let visualPos = 0;
    // handle all preceding segments
    for (let i = 0; i < segmentIndexInt; i++) {
        const segment = segments.value[i];
        if (segment === undefined) continue;
        statePos += segment.text.length;
        // If we're dealing with a reference, we need to add 2 for the { and }
        if (segment.isVariable) {
            statePos += 2;
            if (segment.discriminator !== undefined) statePos += segment.discriminator.length;
        }
    }
    statePos += sel.anchorOffset;
    visualPos += sel.anchorOffset;

    if (isReferenceNode) {
        const segment = segments.value[segmentIndexInt]!;
        // just like with the preceding segments we need to account for the ref syntax
        // for the node itself however, there is an extra space added to the front by the template engine
        // so that already accounts for the preceding {, the ending } should only be added if we're at the end of the node
        visualPos -= 1; // for the visual pos, the space is however ignored when doing the move forward by 1 character
        if (segment.isVariable && segment.discriminator !== undefined) statePos += segment.discriminator.length;
        if (text === " " && sel.anchorOffset === sel.anchorNode.textContent!.length) {
            // if we're at the end of the node and we add a space, we want to go to the next segment,
            // so we add 1 as if the ending } was handled
            statePos += 1;
        }
    }

    if (isCollapsed && isBackspace) {
        statePos--;
        visualPos--;
    }

    // Start actual text manipulation

    let newText = diceState.raw.textInput;

    if (!isCollapsed || isDelete) {
        // If a key is pressed while there is a selection, we need to delete the selection
        // It's a known bug that the selectionLength does not account for the reference syntax,
        // so it will sometimes delete too little
        newText = newText.slice(0, statePos) + newText.slice(statePos + selectionLength);
    }

    if (!isDelete) {
        newText = newText.slice(0, statePos) + text + newText.slice(statePos);
        statePos += text.length;
        visualPos += text.length;
    }

    diceState.mutableReactive.textInput = newText;
    diceState.mutableReactive.lastCursorPosition = statePos;

    await nextTick();

    for (let i = 0; i < visualPos; i++) {
        sel.modify("move", "forward", "character");
    }
}

function getImage(shapeId: GlobalId): string {
    const local = getLocalId(shapeId);
    if (local === undefined) return "";
    const shape = getShape(local);
    if (shape === undefined || shape.type !== "assetrect") return "";
    return baseAdjust((shape as IAsset).src);
}
</script>

<template>
    <div id="input-bar">
        <div
            id="input"
            ref="inputElement"
            contenteditable="true"
            spellcheck="false"
            @keydown="handleKey($event as KeyboardEvent)"
            @paste="handlePaste($event as ClipboardEvent)"
        >
            <template v-for="(segment, index) of segments" :key="index">
                <div v-if="segment.isVariable" class="reference" :data-offset="index">
                    <img v-if="segment.ref?.shapeId" :src="getImage(segment.ref.shapeId)" />
                    {{ segment.text }}
                </div>
                <span v-else-if="segment.text.length > 0" :data-offset="index">{{ segment.text }}</span>
            </template>
        </div>
        <font-awesome-icon
            v-show="diceState.reactive.textInput.length > 0"
            id="clear-input-icon"
            icon="circle-xmark"
            :title="t('game.ui.tools.DiceTool.clear_selection_title')"
            @click.stop="emit('clear')"
        />
        <DiceAutoComplete :input-element="inputElement" @roll="emit('roll')" />
    </div>
</template>

<style scoped lang="scss">
#input-bar {
    position: relative;
    flex: 1 0 0;
    display: flex;
    align-items: center;
    border: solid 1px black;
    border-radius: 0.5rem;
    padding: 0.25rem 0.5rem;
    margin: 0 0.5rem;

    > #input {
        border-radius: 0.5rem;
        font-size: 110%;
        outline: none;
        border: none;
        flex: 1 1 auto;
        white-space: pre-wrap;

        display: flex;
        align-items: center;

        min-height: 24px;

        .reference {
            display: flex;
            align-items: center;
            white-space: normal;

            border: solid 1px rgb(255, 168, 191);
            border-radius: 0.5rem;
            padding: 0.25rem;
            background-color: rgba(255, 168, 191, 0.5);

            img {
                margin-right: 0.5rem;
                width: 1.5rem;
            }
        }
    }

    > #clear-input-icon {
        padding: 0.25rem 0.25rem;
        font-size: 85%;
    }
}
</style>
