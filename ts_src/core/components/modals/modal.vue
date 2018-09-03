<template>
    <transition name="modal">
        <div class="modal-mask" @click="close" v-show="visible" @mousemove='drag'>
            <div
                class="modal-container"
                @click.stop
                ref="container"
                :style="{left:left + 'px', top:top + 'px'}"
            >
            <slot name='header' :startDrag="startDrag" :drag='drag' :stopDrag='stopDrag'></slot>
            <slot></slot>
            </div>
        </div>
    </transition>
</template>


<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: ['visible'],
    data: () => ({
        left: 0,
        top: 0,
        dragging: false,
        positioned: false
    }),
    mounted() {
        if (!this.positioned) {
            const container = (<any>this.$refs.container);
            if (container.offsetWidth === 0 && container.offsetHeight === 0) return;
            this.left = (window.innerWidth - container.offsetWidth)/2;
            this.top = (window.innerHeight - container.offsetHeight)/2;
            this.positioned = true;
        }
    },
    updated() {
        if (!this.positioned) {
            const container = (<any>this.$refs.container);
            if (container.offsetWidth === 0 && container.offsetHeight === 0) return;
            this.left = (window.innerWidth - container.offsetWidth)/2;
            this.top = (window.innerHeight - container.offsetHeight)/2;
            this.positioned = true;
        }
    },
    methods: {
        close: function () {
            this.$emit('close');
        },
        startDrag(event: MouseEvent) {
            this.dragging = true;
        },
        stopDrag(event: MouseEvent) {
            this.dragging = false;
        },
        drag(event: MouseEvent) {
            if (!this.dragging) return;
            this.left = event.clientX;
            this.top = event.clientY;
        }
    }
})
</script>

<style scoped>
.modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .5);
    transition: opacity .3s ease;
}

.modal-container {
    /* width: fit-content; */
    /* margin: 40px auto 0; */
    position: absolute;
    width: auto;
    height: auto;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
    transition: all .3s ease;
    font-family: Helvetica, Arial, sans-serif;
}

.modal-enter {
    opacity: 0;
}

.modal-leave-active {
    opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
}
</style>