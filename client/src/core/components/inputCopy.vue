<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

@Component
export default class InputCopyElement extends Vue {
    @Prop() value!: string;

    borderColour = "lightgray";
    popupString = "";
    showPopup = false;

    async copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.value);
            this.popupString = this.$t("core.components.inputCopy.copied").toString();
        } catch {
            console.log("Could not copy to clipboard :(");
            this.popupString = this.$t("common.error_msg").toString();
        }
        this.showPopup = true;
    }
}
</script>

<template>
    <div id="input-copy" @mouseleave="showPopup = false">
        <input type="text" disabled="disabled" :value="value" id="input-element" />
        <div v-show="showPopup" id="show-popup">{{ popupString }}</div>
        <div id="copy-button" @click="copy" :title="$t('core.components.inputCopy.copy')">
            <i aria-hidden="true" class="far fa-copy"></i>
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
