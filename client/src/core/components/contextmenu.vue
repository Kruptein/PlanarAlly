<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: ["visible", "left", "top"],
})
export default class ContextMenu extends Vue {}
</script>

<template>
    <div class="ContextMenu" tabindex="-1" v-if="visible" :style="{ left: left, top: top }" @blur="$emit('close')">
        <ul>
            <slot></slot>
        </ul>
    </div>
</template>

<style lang="scss">
.ContextMenu {
    position: fixed;
    z-index: 11;

    ul {
        border: 1px solid #ff7052;
        border-radius: 5px;
        background: white;
        padding: 0;
        list-style: none;
        margin: 0;

        li {
            border-bottom: 1px solid #ff7052;
            padding: 5px;
            cursor: pointer;

            &:hover {
                background-color: #ff7052;
            }

            &::last-child {
                border-bottom: none;
            }
        }
    }

    > ul > li {
        clear: left;
        position: relative;

        ul {
            display: none;
            position: absolute;
            left: 100%;
            top: -1px;
        }

        &:hover ul {
            display: flex;
            flex-direction: column;
        }
    }
}
</style>
