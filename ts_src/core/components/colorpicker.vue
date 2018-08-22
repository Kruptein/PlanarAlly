// Extends vue-color functionality by providing an input picker
// This component works on basis of rgba strings only,
// and not the more general color object that vue-color itself uses
// This due to the canvas elements requiring rgba strings for their colours and thus avoiding extra conversion steps

<template>
    <div class='outer' @click="open">
        <!-- <div class='current-color' :style="'background-color: ' + color"></div> -->
        <div class='current-color' :style="transparent ? 'background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)' : 'background-color:' + color"></div>
        <chrome-picker
            :value="color"
            @input="updateColor"
            :style="{position: 'absolute', left:left + 'px', top:top + 'px'}"
            tabindex="-1"
            v-show="display"
            @blur.native="closePicker"
            ref="chromePicker"
        />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Chrome } from "vue-color";

export default Vue.component('colorpicker', {
	components: {
		'chrome-picker': Chrome,
    },
    props: ['color'],
	data: () => ({
        display: false,
        left: 0,
        top: 0,
        transparent: false,
    }),
    mounted() {
        this.transparent = (<any>this.$refs.chromePicker).val.rgba.a === 0;
        const rect = this.$el.getBoundingClientRect();
        // 15 is the width of the input color field
        // 224 is the width of the picker, 242 the height
        if (rect.right + 224 > window.innerWidth)
            this.left = -224;
        else
            this.left = 15;
        if (rect.bottom + 242 - 15 > window.innerHeight)
            this.top = -242 + 15;
        else
            this.top = 15;
    },
    methods: {
        open() {
            if (this.display) return; // click on the picker itself
            this.display = true
            this.$nextTick(() => this.$children[0].$el.focus());
        },
        updateColor(value: { rgba: {r: number, g: number, b: number, a: number}}) {
            this.transparent = value.rgba.a === 0
            const newColor = tinycolor(value.rgba).toRgbString();
            this.$emit('update:color', newColor)
            this.$emit("input", newColor);
        },
        closePicker() {
            this.display = false
            this.$emit("change", this.color);
        }
    }
});
</script>

<style scoped>
.outer {
    position: relative;
    padding: 5px;
    border: solid 1px black;
    border-radius: 3px;
    cursor: pointer;
}
.current-color {
	width: 13px;
	height: 13px;
	background-color: #000;
    border: solid 1px black;
}
</style>
