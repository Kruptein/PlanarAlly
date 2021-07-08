import { floorStore } from "../../../store/floor";
import { settingsStore } from "../../../store/settings";
import { FloorType } from "../../models/floor";

import { Layer } from "./layer";

export class MapLayer extends Layer {
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            this.clear();

            const floor = floorStore.getFloor({ id: this.floor });

            let background: string | null = null;

            if (floor?.backgroundValue === undefined) {
                if (floor?.type === FloorType.Air) {
                    background = settingsStore.airMapBackground.value;
                } else if (floor?.type === FloorType.Ground) {
                    background = settingsStore.groundMapBackground.value;
                } else {
                    background = settingsStore.undergroundMapBackground.value;
                }
            } else {
                background = floor.backgroundValue;
            }

            if (background !== null && background !== "none") {
                this.ctx.fillStyle = background;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            super.draw(false);
            this.valid = true;
        }
    }
}
