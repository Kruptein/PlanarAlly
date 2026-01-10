import type { ServerShapeProperties, ShapeProperties } from "./types";

export function propertiesToServer(properties: ShapeProperties): ServerShapeProperties {
    return {
        movement_obstruction: properties.blocksMovement,
        vision_obstruction: properties.blocksVision,
        name: properties.name,
        name_visible: properties.nameVisible,
        is_invisible: properties.isInvisible,
        stroke_colour: properties.strokeColour[0]!,
        fill_colour: properties.fillColour,
        show_badge: properties.showBadge,
        is_defeated: properties.isDefeated,
        is_locked: properties.isLocked,
        odd_hex_orientation: properties.oddHexOrientation,
        size: properties.size,
        show_cells: properties.showCells,
        cell_fill_colour: properties.cellFillColour ?? null,
        cell_stroke_colour: properties.cellStrokeColour ?? null,
        cell_stroke_width: properties.cellStrokeWidth ?? null,
    };
}

export function propertiesFromServer(properties: ServerShapeProperties): ShapeProperties {
    return {
        blocksMovement: properties.movement_obstruction,
        blocksVision: properties.vision_obstruction,
        name: properties.name,
        nameVisible: properties.name_visible,
        isInvisible: properties.is_invisible,
        strokeColour: [properties.stroke_colour],
        fillColour: properties.fill_colour,
        showBadge: properties.show_badge,
        isDefeated: properties.is_defeated,
        isLocked: properties.is_locked,
        oddHexOrientation: properties.odd_hex_orientation,
        size: properties.size,
        showCells: properties.show_cells,
        ...(properties.cell_fill_colour !== null ? { cellFillColour: properties.cell_fill_colour } : {}),
        ...(properties.cell_stroke_colour !== null ? { cellStrokeColour: properties.cell_stroke_colour } : {}),
        ...(properties.cell_stroke_width !== null ? { cellStrokeWidth: properties.cell_stroke_width } : {}),
    };
}
