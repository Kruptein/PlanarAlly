<!--
Extends vue-color functionality by providing an input picker.
This component works on basis of rgba strings only and not the more general color object that vue-color itself uses
this due to the canvas elements requiring rgba strings for their colours and thus avoiding extra conversion steps
-->

<script lang="ts">
import tinycolor from "tinycolor2";
import Vue from "vue";
import Component from "vue-class-component";

import { Chrome } from "vue-color";
import { Prop } from "vue-property-decorator";

@Component<ColorPicker>({
    components: {
        "chrome-picker": Chrome,
    },
})
export default class ColorPicker extends Vue {
    @Prop(String) color!: string;
    @Prop(Boolean) disabled!: boolean;

    display = false;
    left = 0;
    top = 0;
    transparent = false;

    mounted(): void {
        this.transparent = (<any>this.$refs.chromePicker).val.rgba.a === 0;
        this.setPosition();
    }

    open(): void {
        if (this.display || this.disabled) return; // click on the picker itself
        this.setPosition();
        this.display = true;
        this.$nextTick(() => (<HTMLElement>this.$children[0].$el).focus());
    }
    updateColor(value: { rgba: { r: number; g: number; b: number; a: number } }): void {
        this.transparent = value.rgba.a === 0;
        const newColor = tinycolor(value.rgba).toRgbString();
        this.$emit("update:color", newColor);
        this.$emit("input", newColor);
    }
    closePicker(): void {
        this.display = false;
        this.$emit("change", this.color);
    }
    setPosition(): void {
        const rect = this.$el.getBoundingClientRect();
        // 224 is the width of the picker, 242 the height
        if (rect.right + 224 > window.innerWidth) this.left = rect.left - 224;
        else this.left = rect.right;
        if (rect.bottom + 242 > window.innerHeight) this.top = rect.top - 242;
        else this.top = rect.bottom;
    }
}
</script>

<template>
    <div class="outer" @click.self="open">
        <div
            class="current-color"
            @click.self="open"
            :style="
                transparent
                    ? 'background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)'
                    : 'background-color:' + color
            "
        ></div>
        <div class="mask" v-show="display" @click.self="closePicker"></div>
        <chrome-picker
            :value="color"
            @input="updateColor"
            :style="{ position: 'fixed', left: left + 'px', top: top + 'px', 'z-index': 9999 }"
            tabindex="-1"
            v-show="display"
            ref="chromePicker"
        />
    </div>
</template>

<style scoped>
.outer {
    /* position: relative; */
    padding: 5px;
    border: solid 1px black;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}
.current-color {
    width: 13px;
    height: 13px;
    background-color: #000;
    border: solid 1px black;
}

.mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>
