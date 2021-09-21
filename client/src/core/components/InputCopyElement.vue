<script setup lang="ts">
import { reactive } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps<{ value: string }>();

const state = reactive({
    showPopup: false,
    popupString: "",
});

async function copy(): Promise<void> {
    try {
        await navigator.clipboard.writeText(props.value);
        state.popupString = t("core.components.InputCopyElement.copied");
    } catch {
        console.log("Could not copy to clipboard :(");
        state.popupString = t("common.error_msg");
    }
    state.showPopup = true;
}
</script>

<template>
    <div id="input-copy" @mouseleave="state.showPopup = false">
        <input type="text" disabled :value="value" id="input-element" />
        <div v-show="state.showPopup" id="show-popup">{{ state.popupString }}</div>
        <div id="copy-button" @click="copy" :title="t('core.components.InputCopyElement.copy')">
            <font-awesome-icon :icon="['far', 'copy']" />
        </div>
    </div>
</template>

<style scoped>
#input-copy {
    background-color: lightgray;
    border: solid 1px lightgray;
    border-radius: 5px;
    padding: 0;
    position: relative;
}
#input-copy > * {
    box-sizing: border-box;
    border: none;
    height: 30px;
    margin: 0;
    padding: 0.3em;
}
#copy-button {
    padding-left: 0.5em;
}
#input-element {
    width: 100%;
    margin: 0.1em;
}
#input-copy:hover {
    border-color: #ff7052;
    background-color: #ff7052;
}
#show-popup {
    background-color: #ff7052;
    right: 20px;
    position: absolute;
}
</style>
