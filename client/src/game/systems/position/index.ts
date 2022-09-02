import { registerSystem } from "..";
import type { System } from "..";
import { g2l, l2g, zoomDisplayToFactor } from "../../../core/conversions";
import { addP, subtractP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint } from "../../../core/geometry";
import { sendClientLocationOptions } from "../../api/emits/client";
import { clientSystem } from "../client";
import { floorSystem } from "../floors";
import { playerSettingsState } from "../settings/players/state";

import { DEFAULT_GRID_SIZE, positionState } from "./state";

const { mutable, readonly, mutableReactive: $ } = positionState;

class PositionSystem implements System {
    clear(partial: boolean): void {
        mutable.gridOffset = { x: 0, y: 0 };
        mutable.zoom = NaN;
    }

    get screenTopLeft(): GlobalPoint {
        return toGP(-readonly.panX, -readonly.panY);
    }

    get screenCenter(): GlobalPoint {
        const halfScreen = new Vector(window.innerWidth / 2, window.innerHeight / 2);
        return l2g(addP(g2l(this.screenTopLeft), halfScreen));
    }

    // PAN

    setPan(x: number, y: number, options: { needsOffset: boolean }): void {
        mutable.panX = x - (options.needsOffset ? readonly.gridOffset.x : 0);
        mutable.panY = y - (options.needsOffset ? readonly.gridOffset.y : 0);
    }

    increasePan(x: number, y: number): void {
        mutable.panX += x;
        mutable.panY += y;
    }

    // OFFSET

    setGridOffset(offset: { x: number; y: number }): void {
        console.log("Setting offset", offset);
        mutable.gridOffset = offset;
        floorSystem.invalidateAllFloors();
    }

    // ZOOM

    setZoomFactor(zoomDisplay: number): void {
        const gf = playerSettingsState.raw.gridSize.value / DEFAULT_GRID_SIZE;
        if (playerSettingsState.raw.useAsPhysicalBoard.value) {
            if (readonly.zoom !== gf) {
                mutable.zoom = gf;
            }
        } else {
            mutable.zoom = zoomDisplayToFactor(zoomDisplay);
        }
    }

    setZoomDisplay(zoom: number, options: { invalidate: boolean; sync: boolean }): void {
        if (zoom < 0) zoom = 0;
        if (zoom > 1) zoom = 1;
        $.zoomDisplay = zoom;
        this.setZoomFactor(zoom);
        if (options.invalidate) floorSystem.invalidateAllFloors();
        if (options.sync) {
            sendClientLocationOptions(false);
            clientSystem.updateZoomFactor();
        }
    }

    updateZoom(newZoomDisplay: number, zoomLocation: GlobalPoint): void {
        const oldLoc = g2l(zoomLocation);
        this.setZoomDisplay(newZoomDisplay, { invalidate: false, sync: false });
        const newLoc = l2g(oldLoc);
        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = subtractP(newLoc, zoomLocation);
        this.increasePan(diff.x, diff.y);
        floorSystem.invalidateAllFloors();
        sendClientLocationOptions(false);
        clientSystem.updateZoomFactor();
    }
}

export const positionSystem = new PositionSystem();
registerSystem("position", positionSystem, false, positionState);
