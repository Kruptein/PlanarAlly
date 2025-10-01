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

    const isRemove = event.key === "Backspace" || event.key === "Delete";
    const isModifierKey = event.ctrlKey || event.metaKey || event.altKey;

    if ((isModifierKey || !/^.$/u.test(event.key)) && !isRemove) {
        // non unicode character or modifier key
        return;
    }
    event.preventDefault();

    if (isRemove && isModifierKey) {
        const sel = document.getSelection();
        if (sel === null) return;
        sel.modify("extend", "backward", "word");
    }

    await handleText(event.key, isRemove, event.key === "Backspace");
}

async function handlePaste(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (text.length === 0) return;

    await handleText(text, false, false);
}

function getCursorPositions(
    node: Node,
    offset: number,
    text: string,
    isRemove: boolean,
): { state: number; visual: number } {
    // First we need to determine how these positions translate to the state input
    // we do this based on the segment info. The active segment is a data attribute
    const parentElement = node.parentElement;
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
    statePos += offset;
    visualPos += offset;

    if (isReferenceNode) {
        const segment = segments.value[segmentIndexInt]!;
        // just like with the preceding segments we need to account for the ref syntax
        // for the node itself however, there is an extra space added to the front by the template engine
        // so that already accounts for the preceding {, the ending } should only be added if we're at the end of the node
        visualPos -= 1; // for the visual pos, the space is however ignored when doing the move forward by 1 character
        if (segment.isVariable && segment.discriminator !== undefined) statePos += segment.discriminator.length;
        if ((text === " " || isRemove) && offset === node.textContent!.length) {
            // if we're at the end of the node and we add a space, we want to go to the next segment,
            // so we add 1 as if the ending } was handled
            statePos += 1;
        }
    }

    return { state: statePos, visual: visualPos };
}

async function handleText(text: string, isRemove: boolean, isBackspace: boolean): Promise<void> {
    const sel = document.getSelection();
    if (sel === null) return;

    const isCollapsed = sel.isCollapsed ?? false;

    if (sel.anchorNode === sel.focusNode) {
        if (sel.anchorNode === null) return;
        if (sel.anchorNode.nodeName !== "#text") {
            // There is different behavior when a node is a text node vs other nodes
            // the selection offset has a different meaning in this context, which makes the logic annoying.
            // We force the selection to work in text node mode, by moving the selection back and forth.
            // This works, because the non-text mode only works if the selection is at the end of a section.
            // In firefox this happens more frequently, but in chrome it can also happen (e.g. when using the home/end keys).
            if (sel.anchorOffset !== 0) {
                sel.modify("move", "backward", "character");
                sel.modify("move", "forward", "character");
            } else {
                sel.modify("move", "forward", "character");
                sel.modify("move", "backward", "character");
            }
        }
    }

    // Get start positions of the selection, we always operate in a left to right manner
    const startPos: [Node | null, number] =
        sel.direction === "forward" ? [sel.anchorNode, sel.anchorOffset] : [sel.focusNode, sel.focusOffset];
    const endPos: [Node | null, number] =
        sel.direction === "forward" ? [sel.focusNode, sel.focusOffset] : [sel.anchorNode, sel.anchorOffset];

    sel.collapseToStart();

    if (startPos[0] === null || endPos[0] === null) return;

    // We first need to determine how the cursor positions translate to the state input
    // Grab the state and visual positions of the start and end positions
    // The end position calculation is doing some double work, but it shouldn't occur often and it's not worth the complexity
    const startPositions = getCursorPositions(startPos[0], startPos[1], text, isRemove);
    let endPositions = startPositions;
    if (endPos[0] !== startPos[0] || endPos[1] !== startPos[1]) {
        endPositions = getCursorPositions(endPos[0], endPos[1], text, isRemove);
    }

    // If we have no selection (i.e. it's collapsed) and we're doing a backspace
    // we move the cursor back one character so that we can use the same logic as we do for the delete key
    if (isCollapsed && isBackspace) {
        startPositions.state--;
        startPositions.visual--;
    }

    // Start actual text manipulation
    // We use a temporary variable while manipulating as both removal and addition might occur at the same time

    let newText = diceState.raw.textInput;

    if (!isCollapsed || isRemove) {
        // If a key is pressed while there is a selection, we need to delete the selection
        // This also needs to happen if we're using a regular remove operation (backspace or delete)
        // If the start and end positions are the same, we have no selection but are using delete
        // so we need to ensure we're actually removing a character so we add 1
        newText =
            newText.slice(0, startPositions.state) +
            newText.slice(endPositions.state + (endPositions.state === startPositions.state ? 1 : 0));
    }

    // Add whatever text we're inserting to our pending text
    if (!isRemove) {
        newText = newText.slice(0, startPositions.state) + text + newText.slice(startPositions.state);
        startPositions.state += text.length;
        startPositions.visual += text.length;
    }

    // Update state
    diceState.mutableReactive.lastCursorPosition = startPositions.state;
    diceState.mutableReactive.textInput = newText;

    await nextTick();

    // Update the visual cursor position
    // it's possible that due to refrence interaction, this is no longer accurate
    for (let i = 0; i < startPositions.visual; i++) {
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
