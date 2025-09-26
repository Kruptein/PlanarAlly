<script setup lang="ts">
import { computed, type ComputedRef } from "vue";

import { customDataState } from "../../../systems/customData/state";
import { ShapeCustomDataPending } from "../../../systems/customData/types";

import DataSettingsBranch from "./DataSettingsBranch.vue";
import { type Tree } from "./types";

defineProps<{
    tabSelected: ComputedRef<string>;
}>();
defineEmits<(e: "close") => void>();

const tree = computed(() => {
    const tree: Tree = [];
    for (const element of customDataState.reactive.data) {
        const parts = element.prefix.split("/");
        let currentBranch = tree;
        let prefix = "/";
        for (const part of parts) {
            if (part === "") continue;
            let branch = currentBranch.find((b) => b.name === part);
            if (!branch) {
                branch = { prefix, name: part, children: [] };
                currentBranch.push(branch);
            }
            if ("children" in branch) {
                currentBranch = branch.children;
            }
            prefix += part + "/";
        }
        if (element.pending === ShapeCustomDataPending.Branch) continue;
        currentBranch.push(element);
    }
    return tree;
});
</script>

<template>
    <DataSettingsBranch :children="tree" />
</template>
