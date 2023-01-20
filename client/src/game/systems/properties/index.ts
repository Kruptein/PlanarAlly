import { watchEffect } from "vue";

import type { ShapeSystem } from "..";
import { registerSystem } from "..";
import type { Sync } from "../../../core/models/types";
import {
    sendShapeSetBlocksMovement,
    sendShapeSetBlocksVision,
    sendShapeSetDefeated,
    sendShapeSetFillColour,
    sendShapeSetInvisible,
    sendShapeSetIsToken,
    sendShapeSetLocked,
    sendShapeSetName,
    sendShapeSetNameVisible,
    sendShapeSetShowBadge,
    sendShapeSetStrokeColour,
} from "../../api/emits/shape/options";
import { getGlobalId, getShape } from "../../id";
import type { LocalId } from "../../id";
import { accessSystem } from "../access";
import { doorSystem } from "../logic/door";
import { selectedSystem } from "../selected";

import { checkMovementSources } from "./movement";
import { getProperties, propertiesState } from "./state";
import type { ShapeProperties } from "./state";
import { checkVisionSources } from "./vision";

const { mutable, mutableReactive: $, DEFAULT } = propertiesState;

class PropertiesSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        $.id = undefined;
        mutable.data.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data?: Partial<ShapeProperties>): void {
        mutable.data.set(id, { ...DEFAULT(), ...data });
    }

    drop(id: LocalId): void {
        mutable.data.delete(id);
        if ($.id === id) {
            $.id = undefined;
        }
    }

    loadState(id: LocalId): void {
        const props = getProperties(id)!;
        Object.assign($, props);
        $.id = id;
    }

    dropState(): void {
        $.id = undefined;
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
        if ($.id === id) $.name = name;
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
        if ($.id === id) $.nameVisible = visible;
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
        if ($.id === id) $.isToken = isToken;

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
        if ($.id === id) $.isInvisible = isInvisible;

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
        if ($.id === id) $.strokeColour = [strokeColour];

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
        if ($.id === id) $.fillColour = fillColour;

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
        if ($.id === id) $.blocksMovement = blocksMovement;

        const alteredMovement = checkMovementSources(id, blocksMovement, recalculate);
        doorSystem.checkCursorState(id);

        return alteredMovement;
    }

    setBlocksVision(id: LocalId, blocksVision: boolean, syncTo: Sync, recalculate = true): void {
        const shape = mutable.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setBlocksVision] Unknown local shape.");
        }

        shape.blocksVision = blocksVision;

        if (syncTo.server) {
            const shape = getGlobalId(id);
            if (shape) sendShapeSetBlocksVision({ shape, value: blocksVision });
        }
        if ($.id === id) $.blocksVision = blocksVision;

        const alteredVision = checkVisionSources(id, blocksVision, recalculate);
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
        if ($.id === id) $.showBadge = showBadge;

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
        if ($.id === id) $.isDefeated = isDefeated;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
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
        if ($.id === id) $.isLocked = isLocked;
    }
}

export const propertiesSystem = new PropertiesSystem();
registerSystem("properties", propertiesSystem, true, propertiesState);

// Properties System state is active whenever a shape is selected due to the quick selection info

watchEffect(() => {
    const id = selectedSystem.getFocus();
    if (id.value) {
        propertiesSystem.loadState(id.value);
    } else propertiesSystem.dropState();
});
