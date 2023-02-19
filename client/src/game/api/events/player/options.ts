import type { PlayerOptionsSet } from "../../../../apiTypes";
import { colourHistory } from "../../../../core/components/store";
import { coreStore } from "../../../../store/core";
import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerOptionsToClient } from "../../../systems/settings/players/helpers";
import { socket } from "../../socket";

socket.on("Player.Options.Set", (options: PlayerOptionsSet) => {
    colourHistory.value = options.colour_history === null ? [] : (JSON.parse(options.colour_history) as string[]);

    const defaultOptions = playerOptionsToClient(options.default_user_options);
    const roomOptions =
        options.room_user_options !== undefined ? playerOptionsToClient(options.room_user_options) : undefined;

    const hasGameboard = coreStore.state.boardId !== undefined;

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

    // When using the gameboard ignore client settings from other sources and hardcode the correct values
    if (hasGameboard) {
        playerSettingsSystem.setUseAsPhysicalBoard(true, { sync: false, default: true });
        playerSettingsSystem.setPpi(123, { sync: false, default: 123 });
        playerSettingsSystem.setUseHighDpi(true, { sync: false, default: true });
    } else {
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
    }

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

    if (hasGameboard) {
        playerSettingsSystem.setRenderAllFloors(false, {
            sync: false,
            default: false,
        });
    } else {
        playerSettingsSystem.setRenderAllFloors(roomOptions?.renderAllFloors, {
            sync: false,
            default: defaultOptions.renderAllFloors,
        });
    }
});
