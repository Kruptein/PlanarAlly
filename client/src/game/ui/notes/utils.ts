import type { DeepReadonly } from "vue";

import type { ClientNote } from "../../systems/notes/types";

export function hasShape(note: DeepReadonly<ClientNote>): boolean {
    return note.kind === "shape" || (note.kind === "location" && note.shape !== undefined);
}
