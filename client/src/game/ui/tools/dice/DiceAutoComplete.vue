<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";

import type { LocalId } from "../../../../core/id";
import type { DistributiveOmit } from "../../../../core/types";
import { getShape } from "../../../id";
import type { IAsset } from "../../../interfaces/shapes/asset";
import { customDataState } from "../../../systems/customData/state";
import type { UiShapeCustomData } from "../../../systems/customData/types";
import { diceState } from "../../../systems/dice/state";
import { selectedState } from "../../../systems/selected/state";

const showAutoComplete = ref(false);
const autoCompleteSearchIndex = ref(0);
const autoCompleteSearchText = ref("");
type AutoCompleteOption = DistributiveOmit<UiShapeCustomData, "shapeId"> & { shapeId: LocalId; src: string };
const autoCompleteOptions = ref<AutoCompleteOption[]>([]);

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
        newVal.addEventListener("input", checkAutoComplete);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        newVal.addEventListener("keydown", handleAutoCompleteKey);
    },
    { immediate: true }, // needed for hot reloading
);

onUnmounted(() => {
    if (inputElement === null) return;
    inputElement.removeEventListener("input", checkAutoComplete);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    inputElement.removeEventListener("keydown", handleAutoCompleteKey);
});

function checkAutoComplete(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (value.length === 0) {
        showAutoComplete.value = false;
        return;
    }

    // figure out if we're typing a reference
    // look back until we find a {, the start of the input, or a different non-letter

    const end = (target.selectionStart ?? 0) - 1;
    let start = end;
    for (let i = end; i >= 0; i--) {
        if (target.value[i] === "{") {
            start = i + 1;
            break;
        } else if (value[i]!.match(/[a-z]/) === null) {
            break;
        }
    }

    autoCompleteSearchText.value = value.slice(start, end + 1);
    // Require at least 1 character after the { to search
    if (autoCompleteSearchText.value.length > 1) {
        autoCompleteOptions.value = getAutoCompleteOptions(autoCompleteSearchText.value);
        autoCompleteSearchIndex.value = 0;
        showAutoComplete.value = true;
    } else {
        showAutoComplete.value = false;
    }
}

async function completeAutoComplete(option: AutoCompleteOption): Promise<void> {
    if (inputElement === null) return;
    const start = (inputElement.selectionStart ?? 0) - autoCompleteSearchText.value.length - 1;

    const oldMessage = diceState.raw.textInput;
    diceState.mutableReactive.textInput =
        oldMessage.slice(0, start) + option.value + oldMessage.slice(start + autoCompleteSearchText.value.length + 1);

    showAutoComplete.value = false;

    const newStart = start + option.name.length + 3;

    await nextTick(() => {
        inputElement?.setSelectionRange(newStart, newStart);
        inputElement?.focus();
    });
}

async function handleAutoCompleteKey(event: KeyboardEvent): Promise<void> {
    if (event.key === "Enter") {
        if (showAutoComplete.value) {
            await completeAutoComplete(autoCompleteOptions.value[autoCompleteSearchIndex.value]!);
            event.preventDefault();
        } else {
            emit("roll");
        }
    } else if (event.key === "{" || event.key === "}") {
        autoCompleteSearchText.value = "";
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

function getAutoCompleteOptions(value: string): AutoCompleteOption[] {
    const options: AutoCompleteOption[] = [];
    for (const [shapeId, shapeData] of customDataState.readonly.data.entries()) {
        let shape: IAsset | undefined;
        for (const data of shapeData) {
            if (data.name.toLowerCase().startsWith(value.toLowerCase())) {
                if (shape === undefined) {
                    const sh = getShape(shapeId);
                    if (sh === undefined || sh.type !== "assetrect") continue;
                    shape = sh as IAsset;
                }
                options.push({ src: shape.src, ...data, shapeId });
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
    <div v-if="showAutoComplete" id="auto-complete">
        <div
            v-for="(option, i) of autoCompleteOptions"
            :key="`${option.shapeId}-${option.id}`"
            :class="{ selected: i === autoCompleteSearchIndex }"
        >
            <img :src="option.src" />
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
