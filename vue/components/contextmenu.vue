<template>
    <div class='ContextMenu' tabindex="-1" v-if="visible" v-bind:style="{left:left, top:top}" @blur="$emit('close')">
        <ul>
            <slot></slot>
        </ul>
    </div>
</template>

<script>
export default {
    props: ['visible', 'left', 'top'],
}
</script>

<style scoped>
.ContextMenu {
    position: fixed;
    z-index: 11;
}

.ContextMenu ul {
    border: 1px solid #FF7052;
    border-radius: 5px;
    background: white;
    padding: 0;
    list-style: none;
    margin: 0;
}

.ContextMenu ul li {
    border-bottom: 1px solid #FF7052;
    padding: 5px;
}

.ContextMenu ul li:hover {
    background-color: #FF7052;
}

.ContextMenu ul li:last-child {
    border-bottom: none;
}

.ContextMenu > ul > li {
    clear: left;
    position: relative;
}

.ContextMenu > ul > li ul {
    display: none;
    position: absolute;
    left: 119px;
    top: -1px;
}

.ContextMenu > ul > li:hover ul {
    display: flex;
    flex-direction: column;
}
</style>
