<script lang="ts">
import { defineComponent } from "vue";

import AssetPicker from "./modals/AssetPicker.vue";
import ConfirmDialog from "./modals/ConfirmDialog.vue";
import Prompt from "./modals/Prompt.vue";
import SelectionBox from "./modals/SelectionBox.vue";

export default defineComponent({
    name: "PlanarAllyModals",
    components: { AssetPicker, ConfirmDialog, Prompt, SelectionBox },
    props: ["assetPicker", "confirm", "prompt", "selectionBox"],
});
</script>

<template>
    <AssetPicker :visible="assetPicker.visible.value" @close="assetPicker.close" @submit="assetPicker.submit" />
    <ConfirmDialog
        :visible="confirm.visible.value"
        :yes="confirm.yes.value"
        :no="confirm.no.value"
        :showNo="confirm.showNo.value"
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
        @close="prompt.close"
        @submit="prompt.submit"
    />
    <SelectionBox
        :visible="selectionBox.visible.value"
        :title="selectionBox.title.value"
        :choices="selectionBox.choices.value"
        :options="selectionBox.options.value"
        @close="selectionBox.close"
        @submit="selectionBox.submit"
    />
</template>
