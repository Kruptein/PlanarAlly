import type { ApiDataBlock } from "../../apiTypes";
import { socket } from "../api/socket";

import { updateDataBlock } from ".";

socket.on("DataBlock.Created", (data: ApiDataBlock) => {
    const { data: rawData, ...repr } = data;
    updateDataBlock(repr, rawData);
});

socket.on("DataBlock.Saved", (data: ApiDataBlock) => {
    const { data: rawData, ...repr } = data;
    updateDataBlock(repr, rawData);
});
