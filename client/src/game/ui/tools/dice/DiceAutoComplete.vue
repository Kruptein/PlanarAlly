<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";

import { getImageSrcFromHash } from "../../../../assets/utils";
import type { LocalId } from "../../../../core/id";
import type { DistributiveOmit } from "../../../../core/types";
import { getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { customDataState } from "../../../systems/customData/state";
import type { UiShapeCustomData } from "../../../systems/customData/types";
import { getCustomDataFullReference } from "../../../systems/customData/utils";
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
        } else if (char?.match(/[^{}\s]/) === null) {
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
        } else if (text[i]?.match(/\w/) === null) {
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
    const fullRef = `{[${option.shapeId}]${getCustomDataFullReference(option)}}`;
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

    // the regexes are the discriminator, source and prefix parts (see custom data utils)
    // for the autocompletion we're ignoring the discriminator and prefix, as we might want to change to a different shape or branch
    // a typed source is used to narrow down the options
    let pre = autoCompleteSearchTextBackward.toLowerCase().replace(/\[\d+\]/, "");
    let source: string | undefined;
    const sourceEnd = pre.indexOf(":");
    if (sourceEnd !== -1) {
        source = pre.slice(0, sourceEnd);
        pre = pre.slice(sourceEnd + 1);
    }
    pre = pre.replace(/^.*\//, "");
    const post = autoCompleteSearchTextForward.toLowerCase();
    if (pre.endsWith("}")) {
        pre = pre.slice(0, -1);
    }

    for (const [shapeId, shapeData] of customDataState.readonly.data.entries()) {
        const shape = getShape(shapeId);
        if (shape === undefined) continue;
        for (const data of shapeData) {
            if (data.pending !== undefined) continue;
            if (source !== undefined && !data.source.toLowerCase().startsWith(source)) continue;
            if (data.name.toLowerCase().startsWith(pre) && data.name.toLowerCase().endsWith(post)) {
                if (shape.type === "assetrect") {
                    options.push({ src: getImageSrcFromHash((shape as IAsset).assetHash), ...data, shapeId });
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
            :title="`{${getCustomDataFullReference(option)}}\n${option.value}`"
            @click="completeAutoComplete(option)"
        >
            <img v-if="option.src" :src="option.src" />
            <span v-else-if="option.letter" class="reference-letter">{{ option.letter }}</span>
            <div class="ref-name">
                <div class="ref-prefix">{{ option.prefix }}</div>
                <div>{{ option.name }}</div>
            </div>
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
    overflow-x: hidden;
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
        gap: 0.5em;
        padding: 0.25em 0.5em 0.25em 0.25em;

        > * {
            flex-shrink: 0;
        }

        .ref-name,
        .ref-value {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .ref-name {
            flex: 1 1 auto;

            > div {
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .ref-prefix {
                opacity: 0.5;
                font-size: 0.8em;
            }
        }

        .ref-value {
            flex: 0 1 auto;
            max-width: 50%;
            font-weight: bold;
        }

        &.selected,
        &:hover {
            background-color: #e0e0e0;
            cursor: pointer;
        }

        img {
            height: 2em;
        }
    }
}
</style>
