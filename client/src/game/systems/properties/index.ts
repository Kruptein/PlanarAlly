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

const { _, _$, DEFAULT } = propertiesState;

export class PropertiesSystem implements ShapeSystem {
    // BEHAVIOUR

    clear(): void {
        _$.id = undefined;
        _.data.clear();
    }

    // Inform the system about the state of a certain LocalId
    inform(id: LocalId, data?: Partial<ShapeProperties>): void {
        _.data.set(id, { ...DEFAULT(), ...data });
    }

    drop(id: LocalId): void {
        _.data.delete(id);
        if (_$.id === id) {
            _$.id = undefined;
        }
    }

    loadState(id: LocalId): void {
        const props = getProperties(id)!;
        Object.assign(_$, props);
        _$.id = id;
    }

    dropState(): void {
        _$.id = undefined;
    }

    setName(id: LocalId, name: string, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setName] Unknown local shape.");
        }

        shape.name = name;

        if (syncTo.server) sendShapeSetName({ shape: getGlobalId(id), value: name });
        if (_$.id === id) _$.name = name;
    }

    setNameVisible(id: LocalId, visible: boolean, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setNameVisible] Unknown local shape.");
        }

        shape.nameVisible = visible;

        if (syncTo.server) sendShapeSetNameVisible({ shape: getGlobalId(id), value: visible });
        if (_$.id === id) _$.nameVisible = visible;
    }

    setIsToken(id: LocalId, isToken: boolean, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setIsToken] Unknown local shape.");
        }

        shape.isToken = isToken;

        if (syncTo.server) sendShapeSetIsToken({ shape: getGlobalId(id), value: isToken });
        if (_$.id === id) _$.isToken = isToken;

        if (accessSystem.hasAccessTo(id, false, { vision: true })) {
            if (isToken) accessSystem.addOwnedToken(id);
            else accessSystem.removeOwnedToken(id);
        }
        getShape(id)?.invalidate(false);
    }

    setIsInvisible(id: LocalId, isInvisible: boolean, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setIsInvisible] Unknown local shape.");
        }

        shape.isInvisible = isInvisible;

        if (syncTo.server) sendShapeSetInvisible({ shape: getGlobalId(id), value: isInvisible });
        if (_$.id === id) _$.isInvisible = isInvisible;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
    }

    setStrokeColour(id: LocalId, strokeColour: string, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setStrokeColour] Unknown local shape.");
        }

        shape.strokeColour = [strokeColour];

        if (syncTo.server) sendShapeSetStrokeColour({ shape: getGlobalId(id), value: strokeColour });
        if (_$.id === id) _$.strokeColour = [strokeColour];

        getShape(id)?.invalidate(true);
    }

    setFillColour(id: LocalId, fillColour: string, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setFillColour] Unknown local shape.");
        }

        shape.fillColour = fillColour;

        if (syncTo.server) sendShapeSetFillColour({ shape: getGlobalId(id), value: fillColour });
        if (_$.id === id) _$.fillColour = fillColour;

        getShape(id)?.invalidate(true);
    }

    setBlocksMovement(id: LocalId, blocksMovement: boolean, syncTo: Sync, recalculate = true): boolean {
        const shape = _.data.get(id);
        if (shape === undefined) {
            console.error("[Properties.setBlocksMovement] Unknown local shape.");
            return false;
        }

        shape.blocksMovement = blocksMovement;

        if (syncTo.server) sendShapeSetBlocksMovement({ shape: getGlobalId(id), value: blocksMovement });
        if (_$.id === id) _$.blocksMovement = blocksMovement;

        const alteredMovement = checkMovementSources(id, blocksMovement, recalculate);
        doorSystem.checkCursorState(id);

        return alteredMovement;
    }

    setBlocksVision(id: LocalId, blocksVision: boolean, syncTo: Sync, recalculate = true): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setBlocksVision] Unknown local shape.");
        }

        shape.blocksVision = blocksVision;

        if (syncTo.server) sendShapeSetBlocksVision({ shape: getGlobalId(id), value: blocksVision });
        if (_$.id === id) _$.blocksVision = blocksVision;

        const alteredVision = checkVisionSources(id, blocksVision, recalculate);
        if (alteredVision && recalculate) getShape(id)?.invalidate(false);
        doorSystem.checkCursorState(id);
    }

    setShowBadge(id: LocalId, showBadge: boolean, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setShowBadge] Unknown local shape.");
        }

        shape.showBadge = showBadge;

        if (syncTo.server) sendShapeSetShowBadge({ shape: getGlobalId(id), value: showBadge });
        if (_$.id === id) _$.showBadge = showBadge;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
    }

    setIsDefeated(id: LocalId, isDefeated: boolean, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setIsDefeated] Unknown local shape.");
        }

        shape.isDefeated = isDefeated;

        if (syncTo.server) sendShapeSetDefeated({ shape: getGlobalId(id), value: isDefeated });
        if (_$.id === id) _$.isDefeated = isDefeated;

        const _shape = getShape(id)!;
        _shape.invalidate(!_shape.triggersVisionRecalc);
    }

    setLocked(id: LocalId, isLocked: boolean, syncTo: Sync): void {
        const shape = _.data.get(id);
        if (shape === undefined) {
            return console.error("[Properties.setLocked] Unknown local shape.");
        }

        shape.isLocked = isLocked;

        if (syncTo.server) sendShapeSetLocked({ shape: getGlobalId(id), value: isLocked });
        if (_$.id === id) _$.isLocked = isLocked;
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
