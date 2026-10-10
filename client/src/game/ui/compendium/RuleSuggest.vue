<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";

import { type IndexedEntry, compendiumSystem } from "../../systems/compendium";
import { ruleMarkdown } from "../../systems/compendium/markdown";

const props = defineProps<{ input: HTMLTextAreaElement | null }>();

const open = ref(false);
const active = ref(0);
const matches = ref<IndexedEntry[]>([]);
let queryStart = -1;

function close(): void {
    open.value = false;
    matches.value = [];
}

function onInput(): void {
    const input = props.input;
    if (input === null) return;
    const cursor = input.selectionStart;
    const before = input.value.slice(0, cursor);
    const start = before.lastIndexOf("[[");
    if (start === -1 || before.slice(start).includes("\n")) {
        close();
        return;
    }
    queryStart = start;
    matches.value = compendiumSystem.searchEntries(before.slice(start + 2)).slice(0, 8);
    active.value = 0;
    open.value = matches.value.length > 0;
}

function apply(entry: IndexedEntry): void {
    const input = props.input;
    if (input === null || queryStart < 0) return;
    const cursor = input.selectionStart;
    const link = ruleMarkdown(entry);
    input.value = input.value.slice(0, queryStart) + link + input.value.slice(cursor);
    const next = queryStart + link.length;
    input.setSelectionRange(next, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    close();
}

function onKey(event: KeyboardEvent): void {
    if (!open.value) return;
    if (event.key === "ArrowDown") {
        active.value = (active.value + 1) % matches.value.length;
        event.preventDefault();
        event.stopPropagation();
    } else if (event.key === "ArrowUp") {
        active.value = (active.value - 1 + matches.value.length) % matches.value.length;
        event.preventDefault();
        event.stopPropagation();
    } else if (event.key === "Enter" && !event.shiftKey) {
        const entry = matches.value[active.value];
        if (entry !== undefined) apply(entry);
        event.preventDefault();
        event.stopPropagation();
    } else if (event.key === "Escape") {
        close();
        event.preventDefault();
        event.stopPropagation();
    }
}

function bind(input: HTMLTextAreaElement | null | undefined): void {
    input?.addEventListener("input", onInput);
    input?.addEventListener("keydown", onKey, true);
}

function unbind(input: HTMLTextAreaElement | null | undefined): void {
    input?.removeEventListener("input", onInput);
    input?.removeEventListener("keydown", onKey, true);
}

watch(
    () => props.input,
    (input, previous) => {
        unbind(previous);
        bind(input);
    },
    { immediate: true },
);

onUnmounted(() => unbind(props.input));
</script>

<template>
    <ul v-if="open" class="rule-suggest">
        <li
            v-for="(entry, index) of matches"
            :key="entry.ref"
            :class="{ active: index === active }"
            @mousedown.prevent="apply(entry)"
        >
            {{ entry.name }}
            <small>{{ entry.mod }}</small>
        </li>
    </ul>
</template>

<style scoped lang="scss">
.rule-suggest {
    z-index: 5;
    margin: 0 0 0.25rem;
    padding: 0.25rem 0;
    max-height: 12rem;
    overflow: auto;
    list-style: none;
    background: white;
    color: #222;
    border-radius: 0.4rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    pointer-events: auto;

    li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.3rem 0.6rem;
        cursor: pointer;

        &.active,
        &:hover {
            background: #f3e4e8;
        }

        small {
            color: #777;
        }
    }
}
</style>
