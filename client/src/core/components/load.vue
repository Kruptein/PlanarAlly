<template>
    <div> {{ message }} </div>
</template>


<script lang="ts">
import Vue from "vue";

export default Vue.component("Load", {
    data: () => ({
        message: "Loading...",
    }),
});
</script>