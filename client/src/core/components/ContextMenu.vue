<script lang="ts">
import { defineComponent, nextTick, ref, watchEffect } from "vue";

export default defineComponent({
    emits: ["cm:close"],
    props: {
        left: { type: Number, required: true },
        top: { type: Number, required: true },
        visible: { type: Boolean, required: true },
    },
    setup(props) {
        const menu = ref<HTMLDivElement | null>(null);

        const deltaLeft = ref(0);
        const deltaTop = ref(0);

        // Ensure the content is visible when we are at the bottom or right hand side
        watchEffect(() => {
            if (props.visible) {
                nextTick(() => {
                    const el = menu.value!;
                    deltaLeft.value = 0;
                    if (props.left + el.clientWidth > window.innerWidth) {
                        deltaLeft.value = el.clientWidth;
                    }
                    deltaTop.value = 0;
                    if (props.top + el.clientHeight > window.innerHeight) {
                        deltaTop.value = el.clientHeight;
                    }
                    el.focus();
                });
            }
        });

        return { deltaLeft, deltaTop, menu };
    },
});
</script>

<template>
    <div
        ref="menu"
        class="ContextMenu"
        tabindex="-1"
        v-if="visible"
        :style="{ left: `${left - deltaLeft}px`, top: `${top - deltaTop}px` }"
        @blur="$emit('cm:close')"
    >
        <ul>
            <slot></slot>
        </ul>
    </div>
</template>

<style lang="scss">
.ContextMenu {
    position: fixed;
    pointer-events: auto;

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

            &:last-child {
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
