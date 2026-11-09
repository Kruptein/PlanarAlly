import type { ApiDataBlock, ApiDataBlockWithAccess } from "../../apiTypes";
import type { DistributiveOmit } from "../../core/types";
import { socket } from "../api/socket";

import { forgetDataBlock, updateDataBlock } from ".";

socket.on("DataBlock.Created", ({ dataBlock, access }: ApiDataBlockWithAccess) => {
    const { data: rawData, ...repr } = dataBlock;
    updateDataBlock(repr, rawData, access);
});

socket.on("DataBlock.Saved", (data: ApiDataBlock) => {
    const { data: rawData, ...repr } = data;
    updateDataBlock(repr, rawData);
});

socket.on("DataBlock.Access.Updated", ({ dataBlock, access }: ApiDataBlockWithAccess) => {
    const { data: rawData, ...repr } = dataBlock;
    updateDataBlock(repr, rawData, access);
});

socket.on("DataBlock.Revoked", (repr: DistributiveOmit<ApiDataBlock, "data">) => {
    forgetDataBlock(repr);
});
