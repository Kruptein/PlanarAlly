import { router } from "../../router";
import { coreStore } from "../../store/core";

import type { RoomInfo } from "./types";

export async function open(session: RoomInfo): Promise<void> {
    coreStore.setLoading(true);
    await router.push(`/game/${encodeURIComponent(session.creator)}/${encodeURIComponent(session.name)}`);
}
