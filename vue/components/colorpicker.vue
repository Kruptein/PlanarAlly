<template>
    <div class='outer' @click="open">
        <div class='current-color' :style="'background-color: ' + colorValue"></div>
        <chrome-picker
            :value="color"
            @input="value => $emit('update:color', value)"
            :style="'position: absolute'"
            tabindex="-1"
            v-show="display"
            @blur.native="display = false"
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
	data() {
		return {
			display: false,
		}
    },
    computed: {
        colorValue(): string {
            return tinycolor(this.color.rgba).toRgbString();
        }
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
}
</style>
