<script lang="ts">
import { defineComponent, type PropType } from "vue";

import type { ConfirmModal } from "../plugins/modals/confirm";
import type { PromptModal } from "../plugins/modals/prompt";
import type { SelectionBoxModal } from "../plugins/modals/selectionBox";

import ConfirmDialog from "./modals/ConfirmDialog.vue";
import Prompt from "./modals/Prompt.vue";
import SelectionBox from "./modals/SelectionBox.vue";

export default defineComponent({
    name: "PlanarAllyModals",
    components: { ConfirmDialog, Prompt, SelectionBox },
    props: {
        confirm: { type: Object as PropType<ConfirmModal>, required: true },
        prompt: { type: Object as PropType<PromptModal>, required: true },
        selectionBox: { type: Object as PropType<SelectionBoxModal>, required: true },
    },
});
</script>

<template>
    <ConfirmDialog
        :visible="confirm.visible.value"
        :yes="confirm.yes.value"
        :no="confirm.no.value"
        :show-no="confirm.showNo.value"
        :title="confirm.title.value"
        :text="confirm.text.value"
        :focus="confirm.focus.value"
        @close="confirm.close"
        @submit="confirm.submit"
    />
    <Prompt
        :visible="prompt.visible.value"
        :title="prompt.title.value"
        :question="prompt.question.value"
        :error="prompt.error.value"
        @close="prompt.close"
        @submit="prompt.submit"
    />
    <SelectionBox
        :visible="selectionBox.visible.value"
        :title="selectionBox.title.value"
        :choices="selectionBox.choices.value"
        :options="selectionBox.options?.value"
        @close="selectionBox.close"
        @submit="selectionBox.submit"
    />
</template>
