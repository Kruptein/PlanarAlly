import { getImageSrcFromHash } from "../../../assets/utils";
import { FloorType } from "../../models/floor";
import { floorSystem } from "../../systems/floors";
import { positionState } from "../../systems/position/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { getPattern } from "../floor";

import { Layer } from "./layer";

const patternImages: Record<string, HTMLImageElement> = {};

export class MapLayer extends Layer {
    draw(_doClear?: boolean): void {
        if (!this.valid) {
            this.clear();

            const floor = floorSystem.getFloor({ id: this.floor });

            let floorBackground = floor?.backgroundValue;
            if (floorBackground === undefined) {
                if (floor?.type === FloorType.Air) {
                    floorBackground = locationSettingsState.raw.airMapBackground.value ?? undefined;
                } else if (floor?.type === FloorType.Ground) {
                    floorBackground = locationSettingsState.raw.groundMapBackground.value ?? undefined;
                } else {
                    floorBackground = locationSettingsState.raw.undergroundMapBackground.value ?? undefined;
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
            img.src = getImageSrcFromHash(hash);
            img.onload = () => {
                this.invalidate(true);
            };
        } else if (patternImage.loading) {
            const pattern = this.ctx.createPattern(patternImage, "repeat");
            const state = positionState.readonly;
            const panX = (patternData.offsetX + state.panX) * state.zoom;
            const panY = (patternData.offsetY + state.panY) * state.zoom;
            const scaleX = patternData.scaleX * state.zoom;
            const scaleY = patternData.scaleY * state.zoom;

            pattern?.setTransform(new DOMMatrix([scaleX, 0, 0, scaleY, panX, panY]));
            return pattern;
        }
        return null;
    }
}
