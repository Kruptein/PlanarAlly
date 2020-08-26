import { layerManager } from "../../layers/manager";
import { gameStore } from "../../store";
import { socket } from "../socket";

socket.on("Labels.Set", (labels: Label[]) => {
    for (const label of labels) gameStore.addLabel(label);
});

socket.on("Label.Visibility.Set", (data: { user: string; uuid: string; visible: boolean }) => {
    gameStore.setLabelVisibility(data);
});

socket.on("Label.Add", (data: Label) => {
    gameStore.addLabel(data);
});

socket.on("Label.Delete", (data: { user: string; uuid: string }) => {
    gameStore.deleteLabel(data);
});

socket.on("Labels.Filter.Add", (uuid: string) => {
    gameStore.labelFilters.push(uuid);
    layerManager.invalidateAllFloors();
});

socket.on("Labels.Filter.Remove", (uuid: string) => {
    const idx = gameStore.labelFilters.indexOf(uuid);
    if (idx >= 0) {
        gameStore.labelFilters.splice(idx, 1);
        layerManager.invalidateAllFloors();
    }
});

socket.on("Labels.Filters.Set", (filters: string[]) => {
    gameStore.setLabelFilters(filters);
});
