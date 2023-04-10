/// <reference lib="WebWorker" />

import { handleMessage } from "../messages/render/handlers";
import type { WorkerMessages } from "../messages/types";

onmessage = (e: MessageEvent<WorkerMessages>) => {
    handleMessage(e.data).catch((e) => console.error(e));
};
