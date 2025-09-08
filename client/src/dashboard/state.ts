import { reactive } from "vue";

export const dashboardState = reactive({
    adminEnabled: false,
    chunksProcessed: new Set<number>(),
    chunkLength: 0,
});
