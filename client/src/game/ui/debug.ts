import { reactive } from "vue";

interface DebugState {
    // socketLatencies: number[];
    // renderLatencies: number[];
    // layerLatencies: Record<string, number>;
    render: string;
}

export const debugState = reactive<DebugState>({
    // socketLatencies: [0],
    // renderLatencies: [0],
    // layerLatencies: {},
    render: "0",
});

const render: number[] = [];
const layers: Record<string, string[]> = {};

// eslint-disable-next-line import/no-unused-modules
export const debugInfo = {
    addSocketLatency(_latency: number): void {
        // debugState.socketLatencies.push(latency);
        // if (debugState.socketLatencies.length > 10) debugState.socketLatencies.shift();
    },
    addRenderLatency(latency: number): void {
        render.push(latency);
        if (render.length > 10) render.shift();
        const avg = render.reduce((a, b) => a + b, 0) / render.length;
        debugState.render = (1000 / avg).toFixed(0);
        // debugState.renderLatencies.push(latency);
        // if (debugState.renderLatencies.length > 50) debugState.renderLatencies.shift();
    },
    addLayerLatency(layer: string, latency: number): void {
        if (latency < 2) return;
        let layerInfo = layers[layer];
        if (layerInfo === undefined) {
            layerInfo = [];
            layers[layer] = layerInfo;
        }
        layerInfo.push(latency.toFixed(2));
    },
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
(window as any).layers = layers;
