import { baseAdjust } from "../../../core/http";
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

            let floorBackground = floor?.backgroundValue;
            if (floorBackground === undefined) {
                if (floor?.type === FloorType.Air) {
                    floorBackground = settingsStore.airMapBackground.value ?? undefined;
                } else if (floor?.type === FloorType.Ground) {
                    floorBackground = settingsStore.groundMapBackground.value ?? undefined;
                } else {
                    floorBackground = settingsStore.undergroundMapBackground.value ?? undefined;
                }
            }

            if (floorBackground !== undefined && floorBackground !== "none") {
                let background: string | CanvasPattern | null = null;

                if (floorBackground.startsWith("rgb")) {
                    background = floorBackground;
                } else if (floorBackground.startsWith("pattern")) {
                    background = this.getPatternBackground(floorBackground);
                }

                if (background !== null) {
                    this.ctx.fillStyle = background;
                    this.ctx.fillRect(0, 0, this.width, this.height);
                }
            }

            super.draw(false);
            this.valid = true;
        }
    }

    private getPatternBackground(backgroundValue: string): CanvasPattern | null {
        const patternData = getPattern(backgroundValue);
        if (patternData === undefined) return null;

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
            return pattern;
        }
        return null;
    }
}
