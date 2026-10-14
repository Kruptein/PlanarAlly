<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import VueMarkdown from "vue-markdown-render";

import { compendiumSystem } from "../../systems/compendium";
import { rulePlugins } from "../../systems/compendium/markdown";
import { compendiumState } from "../../systems/compendium/state";

const { t } = useI18n();
const card = ref<HTMLElement | null>(null);

const popover = compendiumState.reactive.popover;

const entry = computed(() => (popover.ref === null ? undefined : compendiumSystem.getEntry(popover.ref)));

const position = computed(() => ({
    left: `${Math.min(popover.x, window.innerWidth - 360)}px`,
    top: `${Math.min(popover.y + 8, window.innerHeight - 240)}px`,
}));

function onPointerDown(event: PointerEvent): void {
    if (popover.ref === null) return;
    const target = event.target;
    if (target instanceof Node && card.value?.contains(target)) return;
    compendiumSystem.closeRule();
}

onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onUnmounted(() => document.removeEventListener("pointerdown", onPointerDown));
</script>

<template>
    <div v-if="popover.ref" id="rule-popover" ref="card" :style="position" @click="compendiumSystem.ruleClick">
        <button type="button" @click="compendiumSystem.closeRule">×</button>
        <template v-if="entry">
            <h2>{{ entry.name }}</h2>
            <VueMarkdown :source="entry.body" :plugins="rulePlugins" />
        </template>
        <p v-else>{{ t("game.ui.compendium.missing") }}</p>
    </div>
</template>

<style lang="scss">
a.pa-rule {
    color: #7a2940;
    text-decoration: underline dotted;
    cursor: pointer;

    &.is-missing {
        color: #888;
    }
}

#rule-popover {
    position: fixed;
    z-index: 30;
    width: min(22rem, 80vw);
    max-height: 16rem;
    overflow: auto;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: white;
    color: #222;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    pointer-events: auto;

    h2 {
        margin: 0 1.5rem 0.5rem 0;
        font-size: 1.1rem;
    }

    button {
        position: absolute;
        top: 0.25rem;
        right: 0.4rem;
        border: none;
        background: transparent;
        font-size: 1.2rem;
        cursor: pointer;
    }
}
</style>
