<template>
    <div class='outer' @click="open">
        <div class='current-color' :style="'background-color: ' + colorValue"></div>
        <chrome-picker
            :value="color"
            @input="value => $emit('update:color', value)"
            :style="{position: 'absolute', left:left + 'px', top:top + 'px'}"
            tabindex="-1"
            v-show="display"
            @blur.native="display = false"
        />
    </div>
</template>

// -224px
// //; top: -242px}"

<script lang="ts">
import Vue from 'vue'
import { Chrome } from "vue-color";

export default Vue.component('colorpicker', {
	components: {
		'chrome-picker': Chrome,
    },
    props: ['color'],
	data() {
		return {
            display: false,
            left: 0,
            top: 0,
		}
    },
    mounted() {
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
    computed: {
        colorValue(): string {
            return tinycolor(this.color.rgba).toRgbString();
        },
    },
    methods: {
        open() {
            if (this.display) return; // click on the picker itself
            this.display = true
            this.$nextTick(() => this.$children[0].$el.focus());
        },
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
