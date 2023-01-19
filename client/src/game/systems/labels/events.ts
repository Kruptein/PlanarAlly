import type { ApiLabel } from "../../../apiTypes";
import { socket } from "../../api/socket";

import { labelSystem } from ".";

socket.on("Labels.Set", (labels: ApiLabel[]) => {
    for (const label of labels) labelSystem.createLabel(label, false);
});

socket.on("Label.Visibility.Set", (data: { user: string; uuid: string; visible: boolean }) => {
    labelSystem.setLabelVisibility(data.uuid, data.visible);
});

socket.on("Label.Add", (data: ApiLabel) => {
    labelSystem.createLabel(data, false);
});

socket.on("Label.Delete", (data: { user: string; uuid: string }) => {
    labelSystem.deleteLabel(data.uuid, false);
});

socket.on("Labels.Filter.Add", (uuid: string) => {
    labelSystem.addLabelFilter(uuid, false);
});

socket.on("Labels.Filter.Remove", (uuid: string) => {
    labelSystem.removeLabelFilter(uuid, false);
});

socket.on("Labels.Filters.Set", (filters: string[]) => {
    labelSystem.setLabelFilters(filters);
});
