import { watch } from "vue";

import { g2l, l2g, zoomDisplayToFactor } from "../../../core/conversions";
import { addP, getPointDistance, subtractP, toGP, Vector } from "../../../core/geometry";
import type { GlobalPoint, LocalPoint } from "../../../core/geometry";
import { DEFAULT_GRID_SIZE } from "../../../core/grid";
import type { LocalId } from "../../../core/id";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems";
import { sendClientLocationOptions } from "../../api/emits/client";
import { getAllShapes, getShape, getShapeCount } from "../../id";
import type { IShape } from "../../interfaces/shape";
import type { FowLayer } from "../../layers/variants/fow";
import { LayerName } from "../../models/floor";
import { setCenterPosition } from "../../position";
import { visionState } from "../../vision/state";
import { accessState } from "../access/state";
import { clientSystem } from "../client";
import { floorSystem } from "../floors";
import { floorState } from "../floors/state";
import { gameState } from "../game/state";
import { locationSettingsState } from "../settings/location/state";
import { playerSettingsState } from "../settings/players/state";

import { positionState } from "./state";

const { mutable, readonly, mutableReactive: $ } = positionState;

class PositionSystem implements System {
    clear(): void {
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

    setPan(x: number, y: number, options: { updateSectors: boolean }): void {
        mutable.panX = x + readonly.gridOffset.x;
        mutable.panY = y + readonly.gridOffset.y;
        if (options.updateSectors) {
            floorSystem.invalidateSectors();
            mutable.performOobCheck = true;
        }
        floorSystem.updateIteration();
    }

    increasePan(x: number, y: number): void {
        mutable.panX += x;
        mutable.panY += y;
        floorSystem.invalidateSectors();
        floorSystem.updateIteration();
        mutable.performOobCheck = true;
    }

    // OFFSET

    setGridOffset(offset: { x: number; y: number }): void {
        console.log("Setting offset", offset);
        const deltaX = offset.x - readonly.gridOffset.x;
        const deltaY = offset.y - readonly.gridOffset.y;
        mutable.gridOffset = offset;
        this.increasePan(deltaX, deltaY);
        floorSystem.invalidateAllFloors();
    }

    // ZOOM

    private setZoomFactor(zoomDisplay: number): void {
        const gf = playerSettingsState.gridSize.value / DEFAULT_GRID_SIZE;
        if (playerSettingsState.raw.useAsPhysicalBoard.value) {
            if (readonly.zoom !== gf) {
                mutable.zoom = gf;
                floorSystem.updateIteration();
            }
        } else {
            mutable.zoom = zoomDisplayToFactor(zoomDisplay);
            floorSystem.updateIteration();
        }
    }

    setZoomDisplay(zoom: number, options: { invalidate: boolean; updateSectors: boolean; sync: boolean }): void {
        if (zoom < 0) zoom = 0;
        if (zoom > 1) zoom = 1;
        $.zoomDisplay = zoom;
        this.setZoomFactor(zoom);
        if (options.updateSectors) {
            floorSystem.invalidateSectors();
            mutable.performOobCheck = true;
        }
        if (options.invalidate) floorSystem.invalidateAllFloors();
        if (options.sync) {
            sendClientLocationOptions(false);
            clientSystem.updateZoomFactor();
        }
    }

    updateZoom(newZoomDisplay: number, zoomLocation: GlobalPoint): void {
        const oldLoc = g2l(zoomLocation);
        this.setZoomDisplay(newZoomDisplay, { invalidate: false, updateSectors: false, sync: false });
        const newLoc = l2g(oldLoc);
        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = subtractP(newLoc, zoomLocation);
        this.increasePan(diff.x, diff.y);
        floorSystem.invalidateAllFloors();
        sendClientLocationOptions(false);
        clientSystem.updateZoomFactor();
    }

    // This is used to recalculate the zoom factor when the grid size changes
    recalculateZoom(): void {
        this.setZoomFactor($.zoomDisplay);
    }

    // OOB

    checkOutOfBounds(): void {
        mutable.performOobCheck = false;
        // First check if there are any shapes at all
        // Displaying a "return to content" when there is no content is pretty silly.
        // We however don't want to iterate over _all_ shapes if there are a lot
        // Chances are extremely high that one of the shapes will have !skipDraw in that case
        if (getShapeCount() < 25) {
            let foundShape = false;
            for (const shape of getAllShapes()) {
                if (!(shape.options.skipDraw ?? false)) {
                    foundShape = true;
                    break;
                }
            }
            if (!foundShape) {
                $.outOfBounds = false;
                return;
            }
        }

        $.outOfBounds = true;
        const floor = floorState.currentFloor.value;
        if (floor !== undefined && !gameState.raw.isDm && locationSettingsState.raw.fullFow.value) {
            if (locationSettingsState.raw.fowLos.value) {
                const visionLayer = floorSystem.getLayer(floor, LayerName.Vision) as FowLayer;
                if (!visionLayer.isEmpty) {
                    $.outOfBounds = false;
                    return;
                }
            }
            const lightingLayer = floorSystem.getLayer(floor, LayerName.Lighting) as FowLayer;
            if (!lightingLayer.isEmpty) {
                $.outOfBounds = false;
                return;
            }

            if ($.outOfBounds) return;
        }
        for (const layer of floorState.raw.layers) {
            for (const sh of layer.shapesInSector) {
                if (!(sh.options.skipDraw ?? false)) {
                    $.outOfBounds = false;
                    return;
                }
            }
        }
    }

    returnToBounds(): void {
        let nearest: GlobalPoint | undefined;
        if (!gameState.raw.isDm && locationSettingsState.raw.fullFow.value) {
            if (locationSettingsState.raw.fowLos.value) {
                // find nearest token
                nearest = this.findNearest(accessState.activeTokens.value, (i) => getShape(i));
            }

            if (nearest === undefined) {
                // find nearest lightsource
                nearest = this.findNearest(visionState.getAllVisionSources(), (s) => getShape(s.shape));
            }
        }
        if (nearest === undefined) {
            // find nearest shape
            nearest = this.findNearest(getAllShapes(), (x) => x);
        }

        if (nearest !== undefined) {
            setCenterPosition(nearest);
            $.outOfBounds = false;
        }
    }

    private findNearest<T>(shapes: Iterable<T>, fn: (x: T) => IShape | undefined): GlobalPoint | undefined {
        let nearest: { position: GlobalPoint; distance: number } | null = null;
        for (const sh of shapes) {
            const shape = fn(sh);
            if (
                shape === undefined ||
                (shape.options.skipDraw ?? false) ||
                shape.floor !== floorState.currentFloor.value
            )
                continue;
            const distance = getPointDistance(this.screenCenter, shape.center);
            if (nearest === null || distance < nearest.distance) {
                nearest = { position: shape.center, distance };
            }
        }
        return nearest?.position;
    }

    // TOKEN DIRECTIONS

    setTokenDirection(token: LocalId, direction: LocalPoint | undefined): void {
        $.tokenDirections.set(token, direction);
    }
}

export const positionSystem = new PositionSystem();
registerSystem("position", positionSystem, false, positionState);

watch(playerSettingsState.gridSize, (gs) => {
    positionSystem.recalculateZoom();
});
