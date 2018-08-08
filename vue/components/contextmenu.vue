<template>
    <div id='contextMenu' tabindex="-1" v-show="visible" v-bind:style="{left:left, top:top}" @blur="$emit('close')">
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
#contextMenu {
    position: absolute;
    z-index: 11;
}

#contextMenu ul {
    border: 1px solid #FF7052;
    border-radius: 5px;
    background: white;
    padding: 0;
    list-style: none;
    margin: 0;
}

#contextMenu ul li {
    border-bottom: 1px solid #FF7052;
    padding: 5px;
}

#contextMenu ul li:hover {
    background-color: #FF7052;
}

#contextMenu ul li:last-child {
    border-bottom: none;
}

#contextMenu > ul > li {
    clear: left;
    position: relative;
}

#contextMenu > ul > li ul {
    display: none;
    position: absolute;
    left: 119px;
    top: -1px;
}

#contextMenu > ul > li:hover ul {
    display: flex;
    flex-direction: column;
}
</style>
