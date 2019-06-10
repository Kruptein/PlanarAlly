<template>
  <div id="input-copy" @mouseleave="showPopup=false">
    <input type="text" disabled="disabled" :value="value">
    <div v-show="showPopup" id="show-popup">{{ popupString }}</div>
    <div id="copy-button" @click="copy">
      <i class="far fa-copy"></i>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

@Component
export default class InputCopyElement extends Vue {
    @Prop() value!: String;

    borderColour = "lightgray";
    popupString = "";
    showPopup = false;

    copy() {
        (<any>navigator).clipboard.writeText(this.value).then(
            () => {
                this.popupString = "Copied!";
                this.showPopup = true;
            },
            () => {
                console.log("Could not copy to clipboard :(");
                this.popupString = "Error!";
                this.showPopup = true;
            },
        );
    }
}
</script>


<style scoped>
#input-copy {
    background-color: lightgray;
    border: solid 2px lightgray;
    border-radius: 10px;
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
