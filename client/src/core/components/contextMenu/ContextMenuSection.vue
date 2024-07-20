<script setup lang="ts">
import { defineProps } from "vue";

import type { Section } from "./types";

defineProps<{ sections: Section[]; addDivider?: boolean }>();
</script>

<template>
    <template v-for="(section, i) in sections" :key="Array.isArray(section) ? i : section.title">
        <template v-if="Array.isArray(section)">
            <ContextMenuSection v-if="section.length" :sections="section" :add-divider="i < sections.length - 1" />
        </template>
        <template v-else-if="'subitems' in section">
            <li v-if="section.subitems.length">
                {{ section.title }}
                <font-awesome-icon icon="angle-right" />
                <ul>
                    <ContextMenuSection :sections="section.subitems" />
                </ul>
            </li>
        </template>
        <template v-else>
            <li :class="{ selected: section.selected }" @click="section.action()">
                <span>{{ section.title }}</span>
            </li>
        </template>
    </template>
    <li v-if="addDivider" class="divider"></li>
</template>
