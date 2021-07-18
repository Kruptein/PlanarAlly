import { baseAdjust } from "../../../core/utils";
import { clientStore } from "../../../store/client";
import { floorStore } from "../../../store/floor";
import { settingsStore } from "../../../store/settings";
import { FloorType } from "../../models/floor";
import { getPattern } from "../floor";

import { Layer } from "./layer";

const patternImages: Record<string, HTMLImageElement> = {};

export class MapLayer extends Layer {
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            this.clear();

            const floor = floorStore.getFloor({ id: this.floor });

            let background: string | CanvasPattern | null = null;

            if (floor?.backgroundValue === undefined) {
                if (floor?.type === FloorType.Air) {
                    background = settingsStore.airMapBackground.value;
                } else if (floor?.type === FloorType.Ground) {
                    background = settingsStore.groundMapBackground.value;
                } else {
                    background = settingsStore.undergroundMapBackground.value;
                }
            } else if (floor?.backgroundValue.startsWith("rgb")) {
                background = floor.backgroundValue;
            } else if (floor?.backgroundValue.startsWith("pattern")) {
                const patternData = getPattern(floor?.backgroundValue);
                if (patternData !== undefined) {
                    const hash = patternData.hash;
                    const patternImage = patternImages[hash];
                    if (patternImage === undefined) {
                        const img = new Image();
                        patternImages[hash] = img;
                        img.src = baseAdjust("/static/assets/" + hash);
                        img.onload = () => {
                            this.invalidate(true);
                        };
                    } else if (patternImage.loading) {
                        const pattern = this.ctx.createPattern(patternImage, "repeat");
                        const panX = (patternData.offsetX + clientStore.state.panX) * clientStore.zoomFactor.value;
                        const panY = (patternData.offsetY + clientStore.state.panY) * clientStore.zoomFactor.value;
                        const scaleX = patternData.scaleX * clientStore.zoomFactor.value;
                        const scaleY = patternData.scaleY * clientStore.zoomFactor.value;

                        pattern?.setTransform(new DOMMatrix([scaleX, 0, 0, scaleY, panX, panY]));
                        background = pattern;
                    }
                }
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
