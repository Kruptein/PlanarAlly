import { gameStore } from "../../../store/game";
import type { Label } from "../../shapes/interfaces";
import { socket } from "../socket";

socket.on("Labels.Set", (labels: Label[]) => {
    for (const label of labels) gameStore.addLabel(label, false);
});

socket.on("Label.Visibility.Set", (data: { user: string; uuid: string; visible: boolean }) => {
    gameStore.setLabelVisibility(data.uuid, data.visible);
});

socket.on("Label.Add", (data: Label) => {
    gameStore.addLabel(data, false);
});

socket.on("Label.Delete", (data: { user: string; uuid: string }) => {
    gameStore.deleteLabel(data.uuid, false);
});

socket.on("Labels.Filter.Add", (uuid: string) => {
    gameStore.addLabelFilter(uuid, false);
});

socket.on("Labels.Filter.Remove", (uuid: string) => {
    gameStore.removeLabelFilter(uuid, false);
});

socket.on("Labels.Filters.Set", (filters: string[]) => {
    gameStore.setLabelFilters(filters);
});
