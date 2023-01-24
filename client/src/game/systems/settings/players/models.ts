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
