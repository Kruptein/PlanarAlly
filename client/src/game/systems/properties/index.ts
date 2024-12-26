import { watch } from "vue";

import type { LocalId } from "../../../core/id";
import type { Sync } from "../../../core/models/types";
import type { ShapeSystem } from "../../../core/systems";
import { registerSystem } from "../../../core/systems";
import {
    sendShapeSetBlocksMovement,
    sendShapeSetBlocksVision,
    sendShapeSetCellFillColour,
    sendShapeSetCellStrokeColour,
    sendShapeSetCellStrokeWidth,
    sendShapeSetDefeated,
    sendShapeSetFillColour,
    sendShapeSetInvisible,
    sendShapeSetIsToken,
    sendShapeSetLocked,
    sendShapeSetName,
    sendShapeSetNameVisible,
    sendShapeSetOddHexOrientation,
    sendShapeSetShowBadge,
    sendShapeSetShowCells,
    sendShapeSetSize,
    sendShapeSetStrokeColour,
} from "../../api/emits/shape/options";
import { getGlobalId, getShape } from "../../id";
import { accessSystem } from "../access";
import { doorSystem } from "../logic/door";
import { selectedState } from "../selected/state";

import { checkMovementSources } from "./movement";
import { propertiesState } from "./state";
import type { ShapeProperties } from "./state";
import { VisionBlock } from "./types";
import { checkVisionSources } from "./vision";

const { mutable, mutableReactive: $, DEFAULT } = propertiesState;

class PropertiesSystem implements ShapeSystem {
    // Multiple sources might want to reactively load info on a shape.
    // To ensure that we do not remove data that is still in use, we keep track of the sources that are using the data.
    // at one point we might want to do something more fancy were we keep shapes that are often used always loaded.
    private shapeLeases = new Map<LocalId, Set<string>>();

    // BEHAVIOUR

    clear(): void {
        $.data.clear();
        mutable.data.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data?: Partial<ShapeProperties>): void {
        mutable.data.set(id, { ...DEFAULT(), ...data });
    }

    drop(id: LocalId): void {
        mutable.data.delete(id);
        $.data.delete(id);
    }

    loadState(id: LocalId, source: string): void {
        const data = mutable.data.get(id);
        if (data === undefined) return console.error("Attempt to load state for shape that has no state.");
        $.data.set(id, { ...data });

        if (!this.shapeLeases.has(id)) this.shapeLeases.set(id, new Set());
        this.shapeLeases.get(id)!.add(source);
    }

    dropState(id: LocalId, source: string): void {
        const leases = this.shapeLeases.get(id);
        if (leases === undefined) return console.error("Dropping state for shape without active lease.");
        leases.delete(source);
        if (leases.size === 0) {
            this.shapeLeases.delete(id);
            $.data.delete(id);
        }
    }

    setName(id: LocalId, name: string, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setName] Unknown local shape.");
        }

        shape.name = name;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetName({ shape, value: name });
        }

        const d = $.data.get(id);
        if (d) d.name = name;
    }

    setNameVisible(id: LocalId, visible: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setNameVisible] Unknown local shape.");
        }

        shape.nameVisible = visible;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetNameVisible({ shape, value: visible });
        }

        const d = $.data.get(id);
        if (d) d.nameVisible = visible;
    }

    setIsToken(id: LocalId, isToken: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setIsToken] Unknown local shape.");
        }

        shape.isToken = isToken;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetIsToken({ shape, value: isToken });
        }

        const d = $.data.get(id);
        if (d) d.isToken = isToken;

        if (accessSystem.hasAccessTo(id, false, { vision: true })) {
            if (isToken) accessSystem.addOwnedToken(id);
            else accessSystem.removeOwnedToken(id);
        }
        getShape(id)?.invalidate(false);
    }

    setIsInvisible(id: LocalId, isInvisible: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setIsInvisible] Unknown local shape.");
        }

        shape.isInvisible = isInvisible;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetInvisible({ shape, value: isInvisible });
        }

        const d = $.data.get(id);
        if (d) d.isInvisible = isInvisible;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
    }

    setStrokeColour(id: LocalId, strokeColour: string, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setStrokeColour] Unknown local shape.");
        }

        shape.strokeColour = [strokeColour];

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetStrokeColour({ shape, value: strokeColour });
        }

        const d = $.data.get(id);
        if (d) d.strokeColour = [strokeColour];

        getShape(id)?.invalidate(true);
    }

    setFillColour(id: LocalId, fillColour: string, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setFillColour] Unknown local shape.");
        }

        shape.fillColour = fillColour;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetFillColour({ shape, value: fillColour });
        }

        const d = $.data.get(id);
        if (d) d.fillColour = fillColour;

        getShape(id)?.invalidate(true);
    }

    setBlocksMovement(id: LocalId, blocksMovement: boolean, syncTo: Sync, recalculate = true): boolean {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            console.error("[Properties.setBlocksMovement] Unknown local shape.");
            return false;
        }

        shape.blocksMovement = blocksMovement;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetBlocksMovement({ shape, value: blocksMovement });
        }

        const d = $.data.get(id);
        if (d) d.blocksMovement = blocksMovement;

        const alteredMovement = checkMovementSources(id, blocksMovement, recalculate);
        doorSystem.checkCursorState(id);

        return alteredMovement;
    }

    setBlocksVision(id: LocalId, blocksVision: VisionBlock, syncTo: Sync, recalculate = true): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setBlocksVision] Unknown local shape.");
        }

        shape.blocksVision = blocksVision;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetBlocksVision({ shape, value: blocksVision });
        }

        const d = $.data.get(id);
        if (d) d.blocksVision = blocksVision;

        const alteredVision = checkVisionSources(id, blocksVision !== VisionBlock.No, recalculate);
        if (alteredVision && recalculate) getShape(id)?.invalidate(false);
        doorSystem.checkCursorState(id);
    }

    setShowBadge(id: LocalId, showBadge: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setShowBadge] Unknown local shape.");
        }

        shape.showBadge = showBadge;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetShowBadge({ shape, value: showBadge });
        }

        const d = $.data.get(id);
        if (d) d.showBadge = showBadge;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
    }

    setIsDefeated(id: LocalId, isDefeated: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setIsDefeated] Unknown local shape.");
        }

        shape.isDefeated = isDefeated;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetDefeated({ shape, value: isDefeated });
        }

        const d = $.data.get(id);
        if (d) d.isDefeated = isDefeated;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
    }

    setSize(id: LocalId, size: number, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setSize] Unknown local shape.");
        }

        if (size < 0) size = 0;

        shape.size = size;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetSize({ shape, value: size });
        }

        const d = $.data.get(id);
        if (d) d.size = size;

        getShape(id)?.invalidate(true);
    }

    setShowCells(id: LocalId, showCells: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setShowCell] Unknown local shape.");
        }

        shape.showCells = showCells;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetShowCells({ shape, value: showCells });
        }

        const d = $.data.get(id);
        if (d) d.showCells = showCells;

        getShape(id)?.invalidate(true);
    }

    setCellStrokeColour(id: LocalId, strokeColour: string, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setCellStrokeColour] Unknown local shape.");
        }

        shape.cellStrokeColour = strokeColour;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetCellStrokeColour({ shape, value: strokeColour });
        }

        const d = $.data.get(id);
        if (d) d.cellStrokeColour = strokeColour;

        getShape(id)?.invalidate(true);
    }

    setCellFillColour(id: LocalId, fillColour: string, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setCellFillColour] Unknown local shape.");
        }

        shape.cellFillColour = fillColour;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetCellFillColour({ shape, value: fillColour });
        }

        const d = $.data.get(id);
        if (d) d.cellFillColour = fillColour;

        getShape(id)?.invalidate(true);
    }

    setCellStrokeWidth(id: LocalId, strokeWidth: number, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setCellStrokeWidth] Unknown local shape.");
        }

        shape.cellStrokeWidth = strokeWidth;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetCellStrokeWidth({ shape, value: strokeWidth });
        }

        const d = $.data.get(id);
        if (d) d.cellStrokeWidth = strokeWidth;

        getShape(id)?.invalidate(true);
    }

    setOddHexOrientation(id: LocalId, oddHexOrientation: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setOddHexOrientation] Unknown local shape.");
        }

        shape.oddHexOrientation = oddHexOrientation;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetOddHexOrientation({ shape, value: oddHexOrientation });
        }

        const d = $.data.get(id);
        if (d) d.oddHexOrientation = oddHexOrientation;

        getShape(id)?.invalidate(true);
    }

    setLocked(id: LocalId, isLocked: boolean, syncTo: Sync): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setLocked] Unknown local shape.");
        }

        shape.isLocked = isLocked;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetLocked({ shape, value: isLocked });
        }

        const d = $.data.get(id);
        if (d) d.isLocked = isLocked;
    }
}

export const propertiesSystem = new PropertiesSystem();
registerSystem("properties", propertiesSystem, true, propertiesState);

// Properties System state is active whenever a shape is selected due to the quick selection info

watch(
    () => selectedState.reactive.focus,
    (newId, oldId) => {
        if (newId) propertiesSystem.loadState(newId, "selected-system");
        if (oldId) propertiesSystem.dropState(oldId, "selected-system");
    },
);
