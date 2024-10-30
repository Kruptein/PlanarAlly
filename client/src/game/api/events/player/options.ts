import type { PlayerOptionsSet } from "../../../../apiTypes";
import { colourHistory } from "../../../../core/components/store";
import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerOptionsToClient } from "../../../systems/settings/players/helpers";
import { socket } from "../../socket";

socket.on("Player.Options.Set", (options: PlayerOptionsSet) => {
    colourHistory.value = options.colour_history === null ? [] : (JSON.parse(options.colour_history) as string[]);

    const defaultOptions = playerOptionsToClient(options.default_user_options);
    const roomOptions =
        options.room_user_options !== null ? playerOptionsToClient(options.room_user_options) : undefined;

    // Appearance
    playerSettingsSystem.setGridColour(roomOptions?.gridColour, {
        sync: false,
        default: defaultOptions.gridColour,
    });
    playerSettingsSystem.setFowColour(roomOptions?.fowColour, {
        sync: false,
        default: defaultOptions.fowColour,
    });
    playerSettingsSystem.setRulerColour(roomOptions?.rulerColour, {
        sync: false,
        default: defaultOptions.rulerColour,
    });
    playerSettingsSystem.setUseToolIcons(roomOptions?.useToolIcons, {
        sync: false,
        default: defaultOptions.useToolIcons,
    });
    playerSettingsSystem.setShowTokenDirections(roomOptions?.showTokenDirections, {
        sync: false,
        default: defaultOptions.showTokenDirections,
    });
    playerSettingsSystem.setGridModeLabelFormat(roomOptions?.gridModeLabelFormat, {
        sync: false,
        default: defaultOptions.gridModeLabelFormat,
    });
    playerSettingsSystem.setDefaultWallColour(roomOptions?.defaultWallColour, {
        sync: false,
        default: defaultOptions.defaultWallColour,
    });
    playerSettingsSystem.setDefaultWindowColour(roomOptions?.defaultWindowColour, {
        sync: false,
        default: defaultOptions.defaultWindowColour,
    });
    playerSettingsSystem.setDefaultClosedDoorColour(roomOptions?.defaultClosedDoorColour, {
        sync: false,
        default: defaultOptions.defaultClosedDoorColour,
    });
    playerSettingsSystem.setDefaultOpenDoorColour(roomOptions?.defaultOpenDoorColour, {
        sync: false,
        default: defaultOptions.defaultOpenDoorColour,
    });

    // Behaviour
    playerSettingsSystem.setInvertAlt(roomOptions?.invertAlt, {
        sync: false,
        default: defaultOptions.invertAlt,
    });
    playerSettingsSystem.setDisableScrollToZoom(roomOptions?.disableScrollToZoom, {
        sync: false,
        default: defaultOptions.disableScrollToZoom,
    });
    playerSettingsSystem.setDefaultTrackerMode(roomOptions?.defaultTrackerMode, {
        sync: false,
        default: defaultOptions.defaultTrackerMode,
    });
    playerSettingsSystem.setMousePanMode(roomOptions?.mousePanMode, {
        sync: false,
        default: defaultOptions.mousePanMode,
    });

    // Display
    playerSettingsSystem.setGridSize(roomOptions?.gridSize, {
        sync: false,
        default: defaultOptions.gridSize,
    });

    playerSettingsSystem.setUseAsPhysicalBoard(roomOptions?.useAsPhysicalBoard, {
        sync: false,
        default: defaultOptions.useAsPhysicalBoard,
    });
    playerSettingsSystem.setMiniSize(roomOptions?.miniSize, {
        sync: false,
        default: defaultOptions.miniSize,
    });
    playerSettingsSystem.setPpi(roomOptions?.ppi, {
        sync: false,
        default: defaultOptions.ppi,
    });
    playerSettingsSystem.setUseHighDpi(roomOptions?.useHighDpi, {
        sync: false,
        default: defaultOptions.useHighDpi,
    });

    // Initiative
    playerSettingsSystem.setInitiativeCameraLock(roomOptions?.initiativeCameraLock, {
        sync: false,
        default: defaultOptions.initiativeCameraLock,
    });
    playerSettingsSystem.setInitiativeVisionLock(roomOptions?.initiativeVisionLock, {
        sync: false,
        default: defaultOptions.initiativeVisionLock,
    });
    playerSettingsSystem.setInitiativeEffectVisibility(roomOptions?.initiativeEffectVisibility, {
        sync: false,
        default: defaultOptions.initiativeEffectVisibility,
    });
    playerSettingsSystem.setInitiativeOpenOnActivate(roomOptions?.initiativeOpenOnActivate, {
        sync: false,
        default: defaultOptions.initiativeOpenOnActivate,
    });

    // Performance

    playerSettingsSystem.setRenderAllFloors(roomOptions?.renderAllFloors, {
        sync: false,
        default: defaultOptions.renderAllFloors,
    });
});
