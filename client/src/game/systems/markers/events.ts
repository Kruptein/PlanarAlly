import { socket } from "../../api/socket";
import { getLocalId } from "../../id";
import type { GlobalId } from "../../id";

import { markerSystem } from ".";

socket.on("Markers.Set", (markers: GlobalId[]) => {
    for (const marker of markers) markerSystem.newMarker(getLocalId(marker)!, false);
});
