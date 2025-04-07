import type { ApiDataBlock } from "../../apiTypes";
import { socket } from "../api/socket";

import { getDataBlock } from ".";

socket.on("DataBlock.Saved", (data: ApiDataBlock) => {
    const { data: rawData, ...repr } = data;
    const db = getDataBlock(repr);
    if (db) {
        db.loadData(rawData);
    }
});
