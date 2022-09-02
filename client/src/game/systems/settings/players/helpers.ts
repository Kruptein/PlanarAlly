import type { PlayerOptions, ServerPlayerOptions } from "./models";

export function playerOptionsToClient(options: ServerPlayerOptions): PlayerOptions;
export function playerOptionsToClient(options: Partial<ServerPlayerOptions>): Partial<PlayerOptions>;
export function playerOptionsToClient(options: Partial<ServerPlayerOptions>): Partial<PlayerOptions> {
    return {
        fowColour: options.fow_colour,
        gridColour: options.grid_colour,
        rulerColour: options.ruler_colour,

        invertAlt: options.invert_alt,
        disableScrollToZoom: options.disable_scroll_to_zoom,

        useHighDpi: options.use_high_dpi,
        gridSize: options.grid_size,
        useAsPhysicalBoard: options.use_as_physical_board,
        miniSize: options.mini_size,
        ppi: options.ppi,

        initiativeCameraLock: options.initiative_camera_lock,
        initiativeVisionLock: options.initiative_vision_lock,
        initiativeEffectVisibility: options.initiative_effect_visibility,
    };
}
