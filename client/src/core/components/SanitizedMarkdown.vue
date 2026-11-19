<script setup lang="ts">
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import type { MarkdownIt as MarkdownItInstance } from "markdown-it";
import { computed } from "vue";

const props = defineProps<{ source: string; plugins?: ((md: MarkdownItInstance) => void)[] }>();

// The content can be written by other users, so all raw html is passed through DOMPurify.
// Style and form elements are dropped as well, as they can restyle the page or be used for phishing.
const md = new MarkdownIt({ html: true });
for (const plugin of props.plugins ?? []) md.use(plugin);

const content = computed(() =>
    DOMPurify.sanitize(md.render(props.source), { FORBID_TAGS: ["style", "form", "input", "button", "textarea"] }),
);
</script>

<template>
    <div v-html="content"></div>
</template>
