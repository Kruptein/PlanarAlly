<template>
    <contextmenu :visible="visible" :left="left" :top="top" @close="close">
        <li>Rename</li>
        <li>Remove</li>
    </contextmenu>
</template>

<script lang="ts">
import Vue from "vue";
import contextmenu from "../../vue/components/contextmenu.vue";

export default Vue.component('selectcontext', {
    components: {
        contextmenu
    },
    data: () => ({
        visible: false,
        left: '0px',
        top: '0px'
    }),
    methods: {
        open(event: MouseEvent) {
            console.log(this);
            this.visible = true;
            this.left = `${event.pageX}px`;
            this.top = `${event.pageY}px`;
            this.$nextTick(() => this.$children[0].$el.focus());
        },
        close() {
            this.visible = false;
        },
    }
})
</script>