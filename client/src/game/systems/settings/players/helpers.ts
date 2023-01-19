import type { ApiUserOptions } from "../../../../apiTypes";
import type { InitiativeEffectMode } from "../../../models/initiative";

import type { PlayerOptions } from "./models";

export function playerOptionsToClient(options: ApiUserOptions): PlayerOptions;
export function playerOptionsToClient(options: Partial<ApiUserOptions>): Partial<PlayerOptions>;
export function playerOptionsToClient(options: Partial<ApiUserOptions>): Partial<PlayerOptions> {
    return {
        fowColour: options.fow_colour,
        gridColour: options.grid_colour,
        rulerColour: options.ruler_colour,
        useToolIcons: options.use_tool_icons,
        showTokenDirections: options.show_token_directions,

        invertAlt: options.invert_alt,
        disableScrollToZoom: options.disable_scroll_to_zoom,
        defaultTrackerMode: options.default_tracker_mode,
        mousePanMode: options.mouse_pan_mode,

        useHighDpi: options.use_high_dpi,
        gridSize: options.grid_size,
        useAsPhysicalBoard: options.use_as_physical_board,
        miniSize: options.mini_size,
        ppi: options.ppi,

        initiativeCameraLock: options.initiative_camera_lock,
        initiativeVisionLock: options.initiative_vision_lock,
        initiativeEffectVisibility: options.initiative_effect_visibility as InitiativeEffectMode | undefined,
        initiativeOpenOnActivate: options.initiative_open_on_activate,

        renderAllFloors: options.render_all_floors,
    };
}
