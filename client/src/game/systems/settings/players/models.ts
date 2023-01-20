import type { InitiativeEffectMode } from "../../../models/initiative";

export interface PlayerOptions {
    // Appearance
    gridColour: string;
    fowColour: string;
    rulerColour: string;
    useToolIcons: boolean;
    showTokenDirections: boolean;

    // Behaviour
    invertAlt: boolean;
    disableScrollToZoom: boolean;
    defaultTrackerMode: boolean;
    mousePanMode: number;

    // Display
    useHighDpi: boolean;
    useAsPhysicalBoard: boolean;
    gridSize: number;
    miniSize: number;
    ppi: number;

    // Initiative
    initiativeCameraLock: boolean;
    initiativeVisionLock: boolean;
    initiativeEffectVisibility: InitiativeEffectMode;
    initiativeOpenOnActivate: boolean;

    // Performance
    renderAllFloors: boolean;
}

export interface ServerPlayerOptions {
    grid_colour: string;
    fow_colour: string;
    ruler_colour: string;
    use_tool_icons: boolean;
    show_token_directions: boolean;

    invert_alt: boolean;
    disable_scroll_to_zoom: boolean;
    default_tracker_mode: boolean;
    mouse_pan_mode: number;

    use_high_dpi: boolean;
    grid_size: number;
    use_as_physical_board: boolean;
    mini_size: number;
    ppi: number;

    initiative_camera_lock: boolean;
    initiative_vision_lock: boolean;
    initiative_effect_visibility: InitiativeEffectMode;
    initiative_open_on_activate: boolean;

    render_all_floors: boolean;
}
