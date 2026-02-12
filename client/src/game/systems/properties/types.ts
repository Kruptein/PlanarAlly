import type { ShapeSize } from "../../interfaces/shape";

// Order is important
export enum VisionBlock {
    No,
    Complete,
    Behind,
}

export const visionBlocks = [VisionBlock.No, VisionBlock.Complete, VisionBlock.Behind];

export interface ShapeProperties {
    name: string;
    nameVisible: boolean;
    isInvisible: boolean;
    strokeColour: string[];
    fillColour: string;
    blocksMovement: boolean;
    blocksVision: VisionBlock;
    showBadge: boolean;
    isDefeated: boolean;
    isLocked: boolean;
    // grid related
    size: ShapeSize; // if x and y are 0, infer size
    showCells: boolean;
    cellFillColour?: string;
    cellStrokeColour?: string;
    cellStrokeWidth?: number;
    oddHexOrientation: boolean;
}

export interface ServerShapeProperties {
    name: string;
    name_visible: boolean;
    is_invisible: boolean;
    stroke_colour: string;
    fill_colour: string;
    movement_obstruction: boolean;
    vision_obstruction: VisionBlock;
    show_badge: boolean;
    is_defeated: boolean;
    is_locked: boolean;
    // grid related
    size_x: number; // if 0, infer size
    size_y: number; // if 0, infer size
    show_cells: boolean;
    cell_fill_colour: string | null;
    cell_stroke_colour: string | null;
    cell_stroke_width: number | null;
    odd_hex_orientation: boolean;
}
