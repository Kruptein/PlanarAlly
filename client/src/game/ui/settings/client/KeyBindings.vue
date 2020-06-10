<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { gameStore } from "@/game/store";

@Component
export default class KeyBindings extends Vue {
    title = "KeybindSettings";
    categories = ["General", "Selection"];
    selection = 0;
    get invertAlt(): boolean {
        return gameStore.invertAlt;
    }
    set invertAlt(value: boolean) {
        gameStore.setInvertAlt({ invertAlt: value, sync: true });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Behavior</div>
        <div class="row">
            <label for="invertAlt" v-t="'game.ui.menu.menu.invert_alt_set'"></label>
            <div><input id="invertAlt" type="checkbox" v-model="invertAlt" /></div>
        </div>
        <div class="spanrow header">General</div>
        <div class="row">
            <div>Escape:</div>
            <div>Close and deselect all</div>
        </div>
        <div class="spanrow header">Movement</div>
        <div class="row">
            <div>With shapes selected:</div>
            <div>Move the shapes</div>
        </div>
        <div class="row">
            <div>Without shapes selected:</div>
            <div>Move the camera</div>
        </div>
        <div class="row">
            <div>Move up:</div>
            <div>Arrow up</div>
        </div>
        <div class="row">
            <div>Move down:</div>
            <div>Arrow down</div>
        </div>
        <div class="row">
            <div>Move left:</div>
            <div>Arrow left</div>
        </div>
        <div class="row">
            <div>Move right:</div>
            <div>Arrow right</div>
        </div>
        <div class="spanrow header">UI</div>
        <div class="row">
            <div>Hide/Show UI:</div>
            <div>Ctrl+U</div>
        </div>
        <div class="row">
            <div>Cut:</div>
            <div>Ctrl+X</div>
        </div>
        <div class="row">
            <div>Copy:</div>
            <div>Ctrl+C</div>
        </div>
        <div class="row">
            <div>Paste:</div>
            <div>Ctrl+V</div>
        </div>
        <div class="row">
            <div>Delete:</div>
            <div>Del</div>
        </div>
        <div class="row">
            <div>Deselect all:</div>
            <div>D</div>
        </div>
        <div class="spanrow header">Modifiers</div>
        <div class="row">
            <div>Add to selection:</div>
            <div>Hold Shift/Ctrl</div>
        </div>
    </div>
</template>

<style scoped>
* {
    box-sizing: border-box;
}
#categories {
    width: 7.5em;
    background-color: rgba(0, 0, 0, 0);
    border-right: solid 1px #82c8a0;
}
.category {
    border-bottom: solid 1px #82c8a0;
    padding: 5px;
    text-align: right;
    background-color: white;
    padding-right: 10px;
}
.selected,
.category:hover {
    background-color: #82c8a0;
    font-weight: bold;
    cursor: pointer;
    padding-right: 5px;
}
.panel {
    background-color: white;
    padding-left: 1em;
    padding-right: 1em;
    display: grid;
    grid-template-columns: [setting] 1fr [value] 1fr [end];
    /* align-items: center; */
    align-content: start;
    min-height: 10em;
}
.row {
    display: contents;
}
.row > *,
.panel > *:not(.row) {
    display: flex;
    /* justify-content: center; */
    align-items: center;
    padding: 0.5em;
}
.row:first-of-type > * {
    margin-top: 0.5em;
}
.row:last-of-type > * {
    margin-bottom: 0.5em;
}
.row:hover > * {
    cursor: pointer;
    text-shadow: 0px 0px 1px black;
}
.smallrow > * {
    padding: 0.2em;
}
.header {
    line-height: 0.1em;
    margin: 20px 0 15px;
    font-style: italic;
}
.header:after {
    position: relative;
    left: 5px;
    width: 100%;
    border-bottom: 1px solid #000;
    content: "";
}
.spanrow {
    grid-column: 1 / end;
}
.danger {
    color: #ff7052;
}
.danger:hover {
    text-shadow: 0px 0px 1px #ff7052;
    cursor: pointer;
}
input[type="checkbox"] {
    width: 16px;
    height: 23px;
    margin: 0;
    white-space: nowrap;
    display: inline-block;
}
input[type="number"],
input[type="text"] {
    width: 100%;
}
button {
    padding: 6px 12px;
    border: 1px solid lightgray;
    border-radius: 0.25em;
    background-color: rgb(235, 235, 228);
}
</style>
