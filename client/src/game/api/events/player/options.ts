import { colourHistory } from "../../../../core/components/store";
import { playerSettingsSystem } from "../../../systems/settings/players";
import { playerOptionsToClient } from "../../../systems/settings/players/helpers";
import type { ServerPlayerInfo } from "../../../systems/settings/players/models";
import { socket } from "../../socket";

socket.on("Player.Options.Set", (options: ServerPlayerInfo) => {
    colourHistory.value = options.colour_history === null ? [] : JSON.parse(options.colour_history);

    const defaultOptions = playerOptionsToClient(options.default_user_options);
    const roomOptions =
        options.room_user_options !== undefined ? playerOptionsToClient(options.room_user_options) : undefined;

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

    // Behaviour
    playerSettingsSystem.setInvertAlt(roomOptions?.invertAlt, {
        sync: false,
        default: defaultOptions.invertAlt,
    });
    playerSettingsSystem.setDisableScrollToZoom(roomOptions?.disableScrollToZoom, {
        sync: false,
        default: defaultOptions.disableScrollToZoom,
    });

    // Display
    playerSettingsSystem.setUseHighDpi(roomOptions?.useHighDpi, {
        sync: false,
        default: defaultOptions.useHighDpi,
    });
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

    // Performance

    playerSettingsSystem.setRenderAllFloors(roomOptions?.renderAllFloors, {
        sync: false,
        default: defaultOptions.renderAllFloors,
    });
});
