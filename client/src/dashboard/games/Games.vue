<script setup lang="ts">
import { ref } from "vue";

import CreateGame from "./CreateGame.vue";
import GameList from "./GameList.vue";

const mode = ref(0);
</script>

<template>
    <GameList v-if="mode === 0" @create="mode++" />
    <CreateGame v-else-if="mode === 1" />
</template>
