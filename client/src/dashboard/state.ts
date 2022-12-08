import { reactive } from "vue";

export const dashboardState = reactive({
    chunksProcessed: new Set<number>(),
    chunkLength: 0,
});
