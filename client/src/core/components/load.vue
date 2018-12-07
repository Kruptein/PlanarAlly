<template>
  <div>{{ message }}</div>
</template>


<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class LoadComponent extends Vue {
    message = "Loading...";
}
</script>