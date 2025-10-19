import type { ApiNote } from "../../../apiTypes";
import { word2color } from "../../../core/utils";
import { reserveLocalId } from "../../id";

import type { ClientNote } from "./types";

export async function noteFromServer(note: ApiNote): Promise<ClientNote> {
    return {
        ...note,
        tags: await Promise.all(note.tags.map(async (tag) => ({ name: tag, colour: await word2color(tag) }))),
        // We also receive notes from different locations, hence the local ids might not exist yet
        shapes: note.shapes.map((s) => reserveLocalId(s)).filter((s) => s !== undefined),
    };
}
