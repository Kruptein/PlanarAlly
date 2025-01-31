import { registerSystem } from "../../../../core/systems";
import type { System } from "../../../../core/systems";
import { sendRoomClientOptions } from "../../../api/emits/client";
import { Colour, registerColour, updateFogColour } from "../../../colour";
import { LayerName } from "../../../models/floor";
import type { InitiativeEffectMode } from "../../../models/initiative";
import { floorSystem } from "../../floors";
import { floorState } from "../../floors/state";

import type { GridModeLabelFormat, PlayerOptions } from "./models";
import { playerSettingsState } from "./state";

const { mutableReactive: $ } = playerSettingsState;

class PlayerSettingsSystem implements System {
    clear(): void {}

    // This is a utility function to simplify a lot of the settings UI code
    getSetter<T extends keyof PlayerOptions>(
        setting: T,
    ): (value: PlayerOptions[T] | undefined, options: { sync: boolean; default?: PlayerOptions[T] }) => void {
        const settingMap = {
            defaultClosedDoorColour: this.setDefaultClosedDoorColour.bind(this),
            defaultOpenDoorColour: this.setDefaultOpenDoorColour.bind(this),
            defaultTrackerMode: this.setDefaultTrackerMode.bind(this),
            defaultWallColour: this.setDefaultWallColour.bind(this),
            defaultWindowColour: this.setDefaultWindowColour.bind(this),
            disableScrollToZoom: this.setDisableScrollToZoom.bind(this),
            fowColour: this.setFowColour.bind(this),
            gridColour: this.setGridColour.bind(this),
            gridModeLabelFormat: this.setGridModeLabelFormat.bind(this),
            gridSize: this.setGridSize.bind(this),
            initiativeCameraLock: this.setInitiativeCameraLock.bind(this),
            initiativeEffectVisibility: this.setInitiativeEffectVisibility.bind(this),
            initiativeOpenOnActivate: this.setInitiativeOpenOnActivate.bind(this),
            initiativeVisionLock: this.setInitiativeVisionLock.bind(this),
            invertAlt: this.setInvertAlt.bind(this),
            miniSize: this.setMiniSize.bind(this),
            mousePanMode: this.setMousePanMode.bind(this),
            ppi: this.setPpi.bind(this),
            renderAllFloors: this.setRenderAllFloors.bind(this),
            rulerColour: this.setRulerColour.bind(this),
            showTokenDirections: this.setShowTokenDirections.bind(this),
            useAsPhysicalBoard: this.setUseAsPhysicalBoard.bind(this),
            useHighDpi: this.setUseHighDpi.bind(this),
            useToolIcons: this.setUseToolIcons.bind(this),
        } as Record<keyof PlayerOptions, this[keyof this]>;

        if (setting in settingMap) {
            return settingMap[setting] as (
                value: PlayerOptions[T] | undefined,
                options: { sync: boolean; default?: PlayerOptions[T] },
            ) => void;
        }
        throw new Error(`Unknown setting: ${setting}`);
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

    setUseToolIcons(useToolIcons: boolean | undefined, options: { sync: boolean; default?: boolean }): void {
        $.useToolIcons.override = useToolIcons;
        if (options.default !== undefined) $.useToolIcons.default = options.default;
        $.useToolIcons.value = useToolIcons ?? $.useToolIcons.default;
        if (options.sync) sendRoomClientOptions("use_tool_icons", useToolIcons, options.default);
    }

    setShowTokenDirections(
        showTokenDirections: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.showTokenDirections.override = showTokenDirections;
        if (options.default !== undefined) $.showTokenDirections.default = options.default;
        $.showTokenDirections.value = showTokenDirections ?? $.showTokenDirections.default;
        const floor = floorState.currentFloor.value;
        if (floor !== undefined) floorSystem.getLayer(floor, LayerName.Draw)?.invalidate(true);
        if (options.sync) sendRoomClientOptions("show_token_directions", showTokenDirections, options.default);
    }

    setGridModeLabelFormat(
        gridModeLabelFormat: GridModeLabelFormat | undefined,
        options: { sync: boolean; default?: GridModeLabelFormat },
    ): void {
        $.gridModeLabelFormat.override = gridModeLabelFormat;
        if (options.default !== undefined) $.gridModeLabelFormat.default = options.default;
        $.gridModeLabelFormat.value = gridModeLabelFormat ?? $.gridModeLabelFormat.default;
        if (options.sync) sendRoomClientOptions("grid_mode_label_format", gridModeLabelFormat, options.default);
    }

    setDefaultWallColour(defaultWallColour: string | undefined, options: { sync: boolean; default?: string }): void {
        $.defaultWallColour.override = defaultWallColour;
        if (options.default !== undefined) $.defaultWallColour.default = options.default;
        $.defaultWallColour.value = defaultWallColour ?? $.defaultWallColour.default;
        registerColour(Colour.Wall, $.defaultWallColour.value);
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("default_wall_colour", defaultWallColour, options.default);
    }

    setDefaultWindowColour(
        defaultWindowColour: string | undefined,
        options: { sync: boolean; default?: string },
    ): void {
        $.defaultWindowColour.override = defaultWindowColour;
        if (options.default !== undefined) $.defaultWindowColour.default = options.default;
        $.defaultWindowColour.value = defaultWindowColour ?? $.defaultWindowColour.default;
        registerColour(Colour.Window, $.defaultWindowColour.value);
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("default_window_colour", defaultWindowColour, options.default);
    }

    setDefaultClosedDoorColour(
        defaultClosedDoorColour: string | undefined,
        options: { sync: boolean; default?: string },
    ): void {
        $.defaultClosedDoorColour.override = defaultClosedDoorColour;
        if (options.default !== undefined) $.defaultClosedDoorColour.default = options.default;
        $.defaultClosedDoorColour.value = defaultClosedDoorColour ?? $.defaultClosedDoorColour.default;
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("default_closed_door_colour", defaultClosedDoorColour, options.default);
    }

    setDefaultOpenDoorColour(
        defaultOpenDoorColour: string | undefined,
        options: { sync: boolean; default?: string },
    ): void {
        $.defaultOpenDoorColour.override = defaultOpenDoorColour;
        if (options.default !== undefined) $.defaultOpenDoorColour.default = options.default;
        $.defaultOpenDoorColour.value = defaultOpenDoorColour ?? $.defaultOpenDoorColour.default;
        floorSystem.invalidateAllFloors();
        if (options.sync) sendRoomClientOptions("default_open_door_colour", defaultOpenDoorColour, options.default);
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

    setDefaultTrackerMode(
        defaultTrackerMode: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.defaultTrackerMode.override = defaultTrackerMode;
        if (options.default !== undefined) $.defaultTrackerMode.default = options.default;
        $.defaultTrackerMode.value = defaultTrackerMode ?? $.defaultTrackerMode.default;
        if (options.sync) sendRoomClientOptions("default_tracker_mode", defaultTrackerMode, options.default);
    }

    setMousePanMode(mousePanMode: number | undefined, options: { sync: boolean; default?: number }): void {
        $.mousePanMode.override = mousePanMode;
        if (options.default !== undefined) $.mousePanMode.default = options.default;
        $.mousePanMode.value = mousePanMode ?? $.mousePanMode.default;
        if (options.sync) sendRoomClientOptions("mouse_pan_mode", mousePanMode, options.default);
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
        if (gridSize !== undefined && gridSize < 1) return;

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
        if (miniSize !== undefined && miniSize < 1) return;

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

    setInitiativeOpenOnActivate(
        initiativeOpenOnActivate: boolean | undefined,
        options: { sync: boolean; default?: boolean },
    ): void {
        $.initiativeOpenOnActivate.override = initiativeOpenOnActivate;
        if (options.default !== undefined) $.initiativeOpenOnActivate.default = options.default;
        $.initiativeOpenOnActivate.value = initiativeOpenOnActivate ?? $.initiativeOpenOnActivate.default;
        if (options.sync)
            sendRoomClientOptions("initiative_open_on_activate", initiativeOpenOnActivate, options.default);
    }

    // PERFORMANCE

    setRenderAllFloors(renderAllFloors: boolean | undefined, options: { sync: boolean; default?: boolean }): void {
        $.renderAllFloors.override = renderAllFloors;
        if (options.default !== undefined) $.renderAllFloors.default = options.default;
        $.renderAllFloors.value = renderAllFloors ?? $.renderAllFloors.default;

        floorSystem.updateLayerVisibility();
        floorSystem.invalidateAllFloors();

        if (options.sync) sendRoomClientOptions("render_all_floors", renderAllFloors, options.default);
    }
}

export const playerSettingsSystem = new PlayerSettingsSystem();
registerSystem("playerSettings", playerSettingsSystem, false, playerSettingsState);
