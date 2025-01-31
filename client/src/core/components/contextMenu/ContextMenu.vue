<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import ContextMenuSection from "./ContextMenuSection.vue";
import type { Section } from "./types";

defineEmits<(e: "cm:close") => void>();
const props = defineProps<{ left: number; top: number; sections: Section[]; visible: boolean }>();

const menu = ref<HTMLDivElement | null>(null);

const deltaLeft = ref(0);
const deltaTop = ref(0);

// Ensure the content is visible when we are at the bottom or right hand side
watch(
    () => props.visible,
    async (visible) => {
        if (visible) {
            await nextTick(() => {
                const el = menu.value!;
                deltaLeft.value = 0;
                if (props.left + el.clientWidth > window.innerWidth) {
                    deltaLeft.value = el.clientWidth;
                }
                deltaTop.value = 0;
                if (props.top + el.clientHeight > window.innerHeight) {
                    deltaTop.value = el.clientHeight;
                }
                el.focus();
            });
        }
    },
);

function isVisible(section: Section): boolean {
    if (Array.isArray(section)) return section.some((item) => isVisible(item));
    else if ("subitems" in section) return section.subitems.some((section) => isVisible(section));
    return !(section.disabled ?? false);
}

const visibleSections = computed(() => props.sections.filter((section) => isVisible(section)));
</script>

<template>
    <div
        v-show="visible"
        ref="menu"
        class="ContextMenu"
        tabindex="-1"
        :style="{ left: `${left - deltaLeft}px`, top: `${top - deltaTop}px` }"
        @blur="$emit('cm:close')"
        @contextmenu.stop.prevent
    >
        <ul>
            <ContextMenuSection :sections="visibleSections" @cm:close="$emit('cm:close')" />
        </ul>
    </div>
</template>

<style lang="scss">
@layer base-context {
    .ContextMenu {
        position: fixed;
        pointer-events: auto;

        &:focus-visible {
            outline: none;
        }

        ul {
            border-radius: 5px;
            background: white;
            list-style: none;
            padding: 0.5rem 0;
            margin: 0;
            width: max-content;

            box-shadow: 0 0 13px rgba(0, 0, 0, 0.5);

            li {
                padding: 0.5rem 1.5rem;
                cursor: pointer;

                display: grid;
                grid-template-columns: 1fr auto;
                align-items: center;

                &.selected {
                    background-color: rgba(0, 0, 0, 0.1);
                }

                &:not(.divider):hover {
                    background-color: lightblue;
                }

                &.divider {
                    border-bottom: 1px solid rgba(0, 0, 0, 0.3);
                    padding-top: 0.25rem;
                    padding-bottom: 0;
                    margin-bottom: 0.25rem;
                }

                > span:has(+ svg) {
                    min-width: 5rem;
                }
            }
        }

        ul > li {
            clear: left;
            position: relative;

            ul {
                display: none;
                position: absolute;
                left: 100%;
                top: -1px;
            }

            &:hover > ul {
                display: flex;
                flex-direction: column;
            }
        }
    }
}
</style>
