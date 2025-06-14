<script setup lang="ts" generic="T extends { name: string; colour: string }">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { mostReadable } from "../../../core/utils";

const emit = defineEmits<{
    (e: "picked", payload: T): void;
    (e: "update:modelValue", payload: string): void;
}>();

const props = defineProps<{
    options: T[];
    placeholder: string;
    modelValue?: string;
}>();

const { t } = useI18n();

const searchQuery = ref(props.modelValue ?? "");

const searchBar = ref<HTMLInputElement | null>(null);

watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue !== undefined) {
            searchQuery.value = newValue;
        }
    },
);

const results = computed(() =>
    props.options.filter((option) => option.name.toLowerCase().includes(searchQuery.value.toLowerCase())),
);

const arrowCounter = ref(-1);
const isOpen = ref(false);

function isEmpty(str: string | null): boolean {
    if (str === null) return true;
    return !str.trim().length;
}

function onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    emit("update:modelValue", target.value);
    searchQuery.value = target.value;

    if (!isEmpty(target.value)) {
        isOpen.value = true;
    } else {
        isOpen.value = false;
    }
}

function chooseResult(result: T): void {
    emit("picked", result);
    searchBar.value?.focus();
}

function onFocusOut(event: FocusEvent): void {
    arrowCounter.value = -1;
    if (!event.currentTarget) {
        isOpen.value = false;
        return;
    }
    const elem = event.currentTarget as HTMLDivElement;
    if (!elem.contains(event.relatedTarget as Node)) {
        isOpen.value = false;
    }
}
function onFocusIn(event: FocusEvent): void {
    if (searchQuery.value.length > 0) {
        isOpen.value = true;
    }
}

function shouldShowResults(): boolean {
    return isOpen.value && results.value.length > 0;
}

function clearSearchBar(): void {
    emit("update:modelValue", "");
    searchQuery.value = "";
    searchBar.value?.focus();
}

function handleKeyDown(): void {
    if (isOpen.value && arrowCounter.value < results.value.length - 1) {
        arrowCounter.value += 1;
    }
    isOpen.value = true;
}

function handleKeyUp(): void {
    if (arrowCounter.value > -1) {
        arrowCounter.value -= 1;
    } else {
        isOpen.value = false;
    }
}

function handleKeyLeft(): void {
    if (arrowCounter.value > 0) {
        arrowCounter.value -= 1;
    } else if (isOpen.value && arrowCounter.value < 0) {
        arrowCounter.value = 0;
    }
}

function handleKeyRight(): void {
    if (isOpen.value && arrowCounter.value < results.value.length - 1) {
        arrowCounter.value += 1;
    }
}

function handleEnter(): void {
    if (arrowCounter.value > -1) {
        emit("picked", results.value[arrowCounter.value] as T);
    }
}
</script>

<template>
    <div class="autocomplete" @focusout="onFocusOut">
        <div class="searchbar">
            <input
                id="search-input"
                ref="searchBar"
                :value="searchQuery"
                type="text"
                :placeholder="placeholder"
                @input="onInput"
                @keydown.down="handleKeyDown"
                @keydown.up="handleKeyUp"
                @keydown.left="handleKeyLeft"
                @keydown.right="handleKeyRight"
                @keydown.enter="handleEnter"
                @focusin="onFocusIn"
            />
            <div v-show="searchQuery.length > 0" id="clear-button" @click.stop="clearSearchBar">
                <font-awesome-icon icon="circle-xmark" :title="t('game.ui.notes.NoteList.clear_search')" />
            </div>
        </div>
        <div v-show="shouldShowResults()" id="autocomplete-results" tabindex="0">
            <div
                v-for="(result, i) in results"
                :key="i"
                :tabindex="i"
                class="tag-bubble"
                :class="{ 'is-active': i === arrowCounter }"
                :style="{ color: mostReadable(result.colour), backgroundColor: result.colour }"
                @click="chooseResult(result)"
            >
                {{ result.name }}
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.autocomplete {
    position: relative;
    width: 100%;
}
.searchbar {
    display: flex;
    align-items: center;
    width: 100%;
    border: solid 1px black;
    border-radius: 1rem;
}
#search-input {
    padding: 0.25rem 0.5rem;
    outline: none;
    border: none;
    border-radius: 1rem;
    flex: 1 1 auto;
    width: 0;
}
#clear-button {
    border: 0;
    cursor: pointer;
    padding: 0 0.5rem;
    font-size: 75%;
}
#search-tags {
    margin-left: 1rem;
    margin-right: -0.5rem;
    display: flex;
    flex-direction: row;
}
.search-tag {
    flex: 0 0 auto;
}

#autocomplete-results {
    position: absolute;
    display: flex;
    padding: 0.5rem;
    margin: 0 0.7rem;

    flex-direction: row;
    flex-wrap: wrap;
    row-gap: 0.5rem;

    border: 1px solid black;
    border-top: 0;
    box-shadow: 0 0.1rem 0.675rem 0 rgba(0, 0, 0, 0.5);
    border-radius: 0 0 0.5rem 0.5rem;
    clip-path: inset(0 -1rem -1rem -1rem);

    background: white;
    width: calc(100% - 1.4rem);
    z-index: 1;
}

.tag-bubble {
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    margin-right: 0.5rem;
    cursor: pointer;
    word-break: break-word;
}

.tag-bubble.is-active,
.tag-bubble:hover {
    filter: brightness(85%);
}
</style>
