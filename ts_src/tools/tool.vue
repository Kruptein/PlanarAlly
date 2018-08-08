<template>
    <li 
        @click="$emit('select', name)"
        :class="{'tool-selected': selected}"
    >
        <a href='#'>{{ name }}</a>
    </li>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
    props: ['name', 'selected']
});
</script>