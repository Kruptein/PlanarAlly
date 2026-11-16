import type { InitiativeEffectMode } from "../../initiative/models";

export interface PlayerOptions {
    // Appearance
    gridColour: string;
    fowColour: string;
    rulerColour: string;
    useToolIcons: boolean;
    showTokenDirections: boolean;
    gridModeLabelFormat: GridModeLabelFormat;
    defaultWallColour: string;
    defaultWindowColour: string;
    defaultClosedDoorColour: string;
    defaultOpenDoorColour: string;

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

// Order must match with en.json!
export enum GridModeLabelFormat {
    Both,
    Distance,
    Cells,
}
