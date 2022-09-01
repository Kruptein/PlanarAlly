import { registerSystem } from "../..";
import type { System } from "../..";
import { sendRoomClientOptions } from "../../../api/emits/client";
import { updateFogColour } from "../../../colour";
import type { InitiativeEffectMode } from "../../../models/initiative";
import { floorSystem } from "../../floors";
import { floorState } from "../../floors/state";

import { playerSettingsState } from "./state";

const { mutableReactive: $ } = playerSettingsState;

class PlayerSettingsSystem implements System {
    clear(partial: boolean): void {
        //
    }

    // APPEARANCE

    setGridColour(gridColour: string | undefined, options: { sync: boolean; default?: string }): void {
        $.gridColour.override = gridColour;
        if (options.default !== undefined) $.gridColour.default = options.default;
        $.gridColour.value = gridColour ?? $.gridColour.default;
        for (const floor of floorState.raw.floors) {
            floorSystem.getGridLayer(floor)!.invalidate();
        }
        if (options.sync) sendRoomClientOptions("grid_colour", gridColour, options.default);
    }

    setFowColour(fowColour: string | undefined, options: { sync: boolean; default?: string }): void {
        $.fowColour.override = fowColour;
        if (options.default !== undefined) $.fowColour.default = options.default;
        $.fowColour.value = fowColour ?? $.fowColour.default;
        updateFogColour();
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("fow_colour", fowColour, options.default);
    }

    setRulerColour(rulerColour: string | undefined, options: { sync: boolean; default?: string }): void {
        $.rulerColour.override = rulerColour;
        if (options.default !== undefined) $.rulerColour.default = options.default;
        $.rulerColour.value = rulerColour ?? $.rulerColour.default;
        if (options.sync) sendRoomClientOptions("ruler_colour", rulerColour, options.default);
    }

    // BEHAVIOUR

    setInvertAlt(invertAlt: boolean | undefined, options: { sync: boolean; default?: boolean }): void {
        $.invertAlt.override = invertAlt;
        if (options.default !== undefined) $.invertAlt.default = options.default;
        $.invertAlt.value = invertAlt ?? $.invertAlt.default;
        if (options.sync) sendRoomClientOptions("invert_alt", invertAlt, options.default);
    }

    setDisableScrollToZoom(
        disableScrollToZoom: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.disableScrollToZoom.override = disableScrollToZoom;
        if (options.default !== undefined) $.disableScrollToZoom.default = options.default;
        $.disableScrollToZoom.value = disableScrollToZoom ?? $.disableScrollToZoom.default;
        if (options.sync) sendRoomClientOptions("disable_scroll_to_zoom", disableScrollToZoom, options.default);
    }

    // DISPLAY

    setUseHighDpi(useHighDpi: boolean | undefined, options: { sync: boolean; default?: boolean }): void {
        $.useHighDpi.override = useHighDpi;
        if (options.default !== undefined) $.useHighDpi.default = options.default;
        $.useHighDpi.value = useHighDpi ?? $.useHighDpi.default;
        floorSystem.resize(window.innerWidth, window.innerHeight);
        if (options.sync) sendRoomClientOptions("use_high_dpi", useHighDpi, options.default);
    }

    setGridSize(gridSize: number | undefined, options: { sync: boolean; default?: number }): void {
        $.gridSize.override = gridSize;
        if (options.default !== undefined) $.gridSize.default = options.default;
        $.gridSize.value = gridSize ?? $.gridSize.default;
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("grid_size", gridSize, options.default);
    }

    setUseAsPhysicalBoard(
        useAsPhysicalBoard: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.useAsPhysicalBoard.override = useAsPhysicalBoard;
        if (options.default !== undefined) $.useAsPhysicalBoard.default = options.default;
        $.useAsPhysicalBoard.value = useAsPhysicalBoard ?? $.useAsPhysicalBoard.default;
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("use_as_physical_board", useAsPhysicalBoard, options.default);
    }

    setMiniSize(miniSize: number | undefined, options: { sync: boolean; default?: number }): void {
        $.miniSize.override = miniSize;
        if (options.default !== undefined) $.miniSize.default = options.default;
        $.miniSize.value = miniSize ?? $.miniSize.default;
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("mini_size", miniSize, options.default);
    }

    setPpi(ppi: number | undefined, options: { sync: boolean; default?: number }): void {
        $.ppi.override = ppi;
        if (options.default !== undefined) $.ppi.default = options.default;
        $.ppi.value = ppi ?? $.ppi.default;
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("ppi", ppi, options.default);
    }

    // INITIATIVE

    setInitiativeCameraLock(
        initiativeCameraLock: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.initiativeCameraLock.override = initiativeCameraLock;
        if (options.default !== undefined) $.initiativeCameraLock.default = options.default;
        $.initiativeCameraLock.value = initiativeCameraLock ?? $.initiativeCameraLock.default;
        if (options.sync) sendRoomClientOptions("initiative_camera_lock", initiativeCameraLock, options.default);
    }

    setInitiativeVisionLock(
        initiativeVisionLock: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.initiativeVisionLock.override = initiativeVisionLock;
        if (options.default !== undefined) $.initiativeVisionLock.default = options.default;
        $.initiativeVisionLock.value = initiativeVisionLock ?? $.initiativeVisionLock.default;
        if (options.sync) sendRoomClientOptions("initiative_vision_lock", initiativeVisionLock, options.default);
    }

    setInitiativeEffectVisibility(
        initiativeEffectVisibility: InitiativeEffectMode | undefined,
        options: { sync: boolean; default?: InitiativeEffectMode },
    ): void {
        $.initiativeEffectVisibility.override = initiativeEffectVisibility;
        if (options.default !== undefined) $.initiativeEffectVisibility.default = options.default;
        $.initiativeEffectVisibility.value = initiativeEffectVisibility ?? $.initiativeEffectVisibility.default;
        if (options.sync)
            sendRoomClientOptions("initiative_effect_visibility", initiativeEffectVisibility, options.default);
    }
}

export const playerSettingsSystem = new PlayerSettingsSystem();
registerSystem("playerSettings", playerSettingsSystem, false, playerSettingsState);
