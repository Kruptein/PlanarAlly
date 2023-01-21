import type { ApiOptionalUserOptions, ApiUserOptions } from "../../../../apiTypes";
import type { InitiativeEffectMode } from "../../../models/initiative";

import type { PlayerOptions } from "./models";

export function playerOptionsToClient(options: ApiUserOptions): PlayerOptions;
export function playerOptionsToClient(options: ApiOptionalUserOptions): Partial<PlayerOptions>;
export function playerOptionsToClient(options: ApiOptionalUserOptions): Partial<PlayerOptions> {
    return {
        fowColour: options.fow_colour ?? undefined,
        gridColour: options.grid_colour ?? undefined,
        rulerColour: options.ruler_colour ?? undefined,
        useToolIcons: options.use_tool_icons ?? undefined,
        showTokenDirections: options.show_token_directions ?? undefined,

        invertAlt: options.invert_alt ?? undefined,
        disableScrollToZoom: options.disable_scroll_to_zoom ?? undefined,
        defaultTrackerMode: options.default_tracker_mode ?? undefined,
        mousePanMode: options.mouse_pan_mode ?? undefined,

        useHighDpi: options.use_high_dpi ?? undefined,
        gridSize: options.grid_size ?? undefined,
        useAsPhysicalBoard: options.use_as_physical_board ?? undefined,
        miniSize: options.mini_size ?? undefined,
        ppi: options.ppi ?? undefined,

        initiativeCameraLock: options.initiative_camera_lock ?? undefined,
        initiativeVisionLock: options.initiative_vision_lock ?? undefined,
        initiativeEffectVisibility: (options.initiative_effect_visibility ?? undefined) as
            | InitiativeEffectMode
            | undefined,
        initiativeOpenOnActivate: options.initiative_open_on_activate ?? undefined,

        renderAllFloors: options.render_all_floors ?? undefined,
    };
}
