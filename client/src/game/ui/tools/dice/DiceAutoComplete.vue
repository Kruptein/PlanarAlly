<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";

import { baseAdjust } from "../../../../core/http";
import type { LocalId } from "../../../../core/id";
import type { DistributiveOmit } from "../../../../core/types";
import { getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { customDataState } from "../../../systems/customData/state";
import type { UiShapeCustomData } from "../../../systems/customData/types";
import { diceState } from "../../../systems/dice/state";
import { getProperties } from "../../../systems/properties/state";
import { selectedState } from "../../../systems/selected/state";

const showAutoComplete = ref(false);
const autoCompleteSearchIndex = ref(0);
type AutoCompleteOption = DistributiveOmit<UiShapeCustomData, "shapeId"> & {
    shapeId: LocalId;
    src?: string;
    letter?: string;
};
const autoCompleteOptions = ref<AutoCompleteOption[]>([]);

let autoCompleteSearchTextBackward = "";
let autoCompleteSearchTextForward = "";

const { inputElement } = defineProps<{
    inputElement: HTMLInputElement | null;
}>();

const emit = defineEmits<{
    (e: "roll"): void;
}>();

// hook up event listeners

watch(
    () => inputElement,
    (newVal) => {
        if (newVal === null) return;
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        newVal.addEventListener("keydown", handleAutoCompleteKey);
    },
    { immediate: true }, // needed for hot reloading
);

onUnmounted(() => {
    if (inputElement === null) return;
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    inputElement.removeEventListener("keydown", handleAutoCompleteKey);
});

watch(() => diceState.reactive.textInput, checkAutoComplete);

function checkAutoComplete(text: string): void {
    if (text.length === 0) {
        showAutoComplete.value = false;
        return;
    }

    // figure out if we're typing a reference
    // look back until we find a {, the start of the input, or a different non-letter
    // the only exception is if the last character is a }, we allow it

    let closedVariable = false;
    let end = diceState.raw.lastCursorPosition - 1;
    let start = end;
    for (let i = end; i >= 0; i--) {
        const char = text[i];
        if (char === "{") {
            start = i + 1;
            break;
        } else if (char?.match(/[a-z0-9[\]]/) === null) {
            if (i === text.length - 1 && char === "}") {
                closedVariable = true;
                continue;
            }
            break;
        }
    }

    autoCompleteSearchTextBackward = text.slice(start, end + 1);

    // When the reference is modified and there is a discriminator, we almost always want to remove it
    if (!closedVariable && autoCompleteSearchTextBackward.startsWith("[")) {
        const endIndex = autoCompleteSearchTextBackward.indexOf("]");
        if (endIndex !== -1) {
            diceState.mutableReactive.lastCursorPosition -= endIndex + 1;
            diceState.mutableReactive.textInput =
                diceState.raw.textInput.slice(0, start) + diceState.raw.textInput.slice(start + endIndex + 1);
            // this function will re-trigger
            return;
        }
    }

    // if we already have text behind the cursor, we also do a forwards search
    start = diceState.raw.lastCursorPosition;
    end = start;
    for (let i = start; i < text.length; i++) {
        if (text[i] === "}") {
            end = i;
            break;
        } else if (text[i]?.match(/[a-z0-9]/) === null) {
            break;
        }
    }

    autoCompleteSearchTextForward = text.slice(start, end);

    // Require at least 2 characters after the { to search
    if (autoCompleteSearchTextBackward.length > 1 && !closedVariable) {
        autoCompleteOptions.value = getAutoCompleteOptions();
        autoCompleteSearchIndex.value = 0;
        showAutoComplete.value = true;
    } else {
        showAutoComplete.value = false;
    }
}

async function completeAutoComplete(option?: AutoCompleteOption): Promise<void> {
    if (inputElement === null) return;
    option ??= autoCompleteOptions.value[autoCompleteSearchIndex.value]!;
    const start = diceState.raw.lastCursorPosition - autoCompleteSearchTextBackward.length - 1;

    const oldMessage = diceState.raw.textInput;
    const fullRef = "{" + `[${option.shapeId}]` + option.name + "}";
    diceState.mutableReactive.lastCursorPosition = start + fullRef.length;
    diceState.mutableReactive.textInput =
        oldMessage.slice(0, start) +
        fullRef +
        oldMessage.slice(start + autoCompleteSearchTextBackward.length + autoCompleteSearchTextForward.length + 2);

    showAutoComplete.value = false;

    await nextTick();
    const sel = document.getSelection();
    for (let i = 0; i < diceState.raw.lastCursorPosition; i++) {
        sel?.modify("move", "forward", "character");
    }
}

async function handleAutoCompleteKey(event: KeyboardEvent): Promise<void> {
    if (event.key === "Enter") {
        if (showAutoComplete.value) {
            await completeAutoComplete();
            event.preventDefault();
        } else {
            emit("roll");
        }
    } else if (event.key === "{" || event.key === "}") {
        if (event.key === "}") {
            await completeAutoComplete();
        }
        autoCompleteSearchTextBackward = "";
        autoCompleteSearchTextForward = "";
    } else if (event.key === "Escape") {
        showAutoComplete.value = false;
    } else if (event.key === "ArrowDown") {
        if (showAutoComplete.value) {
            event.preventDefault();
            autoCompleteSearchIndex.value = (autoCompleteSearchIndex.value + 1) % autoCompleteOptions.value.length;
        }
    } else if (event.key === "ArrowUp") {
        if (showAutoComplete.value) {
            event.preventDefault();
            autoCompleteSearchIndex.value =
                (autoCompleteSearchIndex.value - 1 + autoCompleteOptions.value.length) %
                autoCompleteOptions.value.length;
        }
    }
}

function getAutoCompleteOptions(): AutoCompleteOption[] {
    const options: AutoCompleteOption[] = [];

    // the regex is the discriminator part (see custom data utils)
    // for the autocompletion we're just ignoring it, as we might want to change to a different shape
    let pre = autoCompleteSearchTextBackward.toLowerCase().replace(/\[\d+\]/, "");
    const post = autoCompleteSearchTextForward.toLowerCase();
    if (pre.endsWith("}")) {
        pre = pre.slice(0, -1);
    }

    for (const [shapeId, shapeData] of customDataState.readonly.data.entries()) {
        const shape = getShape(shapeId);
        if (shape === undefined) continue;
        for (const data of shapeData) {
            if (data.name.toLowerCase().startsWith(pre) && data.name.toLowerCase().endsWith(post)) {
                if (shape.type === "assetrect") {
                    options.push({ src: baseAdjust((shape as IAsset).src), ...data, shapeId });
                } else {
                    const props = getProperties(shapeId);
                    if (props === undefined) continue;
                    options.push({ letter: props.name[0]!.toUpperCase(), ...data, shapeId });
                }
            }
        }
    }
    // sort results according to selection and focus
    const selection = selectedState.raw.selected;
    const focus = selectedState.raw.focus;
    return options.sort((a, b) => {
        const aSelected = selection.has(a.shapeId);
        const bSelected = selection.has(b.shapeId);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        if (aSelected && bSelected) {
            if (a.shapeId === focus) return -1;
            if (b.shapeId === focus) return 1;
        }
        return 0;
    });
}
</script>

<template>
    <div v-if="showAutoComplete && autoCompleteOptions.length > 0" id="auto-complete">
        <div
            v-for="(option, i) of autoCompleteOptions"
            :key="`${option.shapeId}-${option.id}`"
            :class="{ selected: i === autoCompleteSearchIndex }"
            @click="completeAutoComplete(option)"
        >
            <img v-if="option.src" :src="option.src" />
            <span v-else-if="option.letter" class="reference-letter">{{ option.letter }}</span>
            <div>
                <div class="ref-prefix">{{ option.prefix }}</div>
                <div>{{ option.name }}</div>
            </div>
            <div style="flex: 1"></div>
            <div class="ref-value">{{ option.value }}</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#auto-complete {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 1em;
    max-height: 12.5em;
    overflow-y: auto;

    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.5);

    display: flex;
    flex-direction: column;
    align-items: stretch;

    left: 0em;
    bottom: 2em;
    right: 0em;

    > div {
        display: flex;
        align-items: center;
        padding: 0 0.25em;

        > * {
            height: 100%;
            align-items: center;
        }

        > div:first-of-type {
            display: flex;
            flex-direction: column;
            align-items: flex-start;

            .ref-prefix {
                opacity: 0.5;
            }
        }

        .ref-value {
            font-weight: bold;
            padding-right: 0.5em;
        }

        &.selected,
        &:hover {
            background-color: #e0e0e0;
            cursor: pointer;
        }

        img {
            height: 2em;
            margin-right: 1em;
        }
    }
}
</style>
