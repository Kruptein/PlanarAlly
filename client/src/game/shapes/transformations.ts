/**
 * Transformations between different forms of shape data
 *
 * The server has its own representation which is in the form of the main ApiShape (along with its subshapes),
 * but also data in other forms for specific systems that may not be stored on the shape itself.
 *
 * The client on the other hand has most of its data spread out over different systems, with a limited set of data stored in Shape itself.
 *
 * We sometimes need to transform between these different forms.
 * But we also sometimes just need an intermediate form. (e.g. copy-paste, creating a template, undoing a shape delete, ...)
 *
 * This file contains functions to move from Server form to the intermediate form (which we'll call CompactForm),
 * as well as from intermediate form to System form (which we'll call the local system data setup).
 *
 * It should also be noted that the functions that move from compact form to another form, have a `mode` parameter,
 * that will decide whether the data can be copied as is, or needs to have unique identifiers. (e.g. undoing a shape delete vs copy-paste)
 */

import cloneDeep from "lodash/cloneDeep";

import type {
    ApiAssetRectShape,
    ApiCircleShape,
    ApiCircularTokenShape,
    ApiCoreShape,
    ApiLineShape,
    ApiPolygonShape,
    ApiRectShape,
    ApiShape,
    ApiShapeAdd,
    ApiShapeCustomData,
    ApiTextShape,
    ApiToggleCompositeShape,
} from "../../apiTypes";
import type { AssetId } from "../../assets/models";
import { toGP } from "../../core/geometry";
import { baseAdjust } from "../../core/http";
import type { GlobalId, LocalId } from "../../core/id";
import { SyncMode } from "../../core/models/types";
import { getShapeSystems } from "../../core/systems";
import type { SystemInformMode } from "../../core/systems/models";
import { uuidv4 } from "../../core/utils";
import { sendShapeAdd } from "../api/emits/shape/core";
import { getGlobalId, getLocalId, getShape, reserveLocalId } from "../id";
import type { IShape } from "../interfaces/shape";
import type { FloorId, LayerName } from "../models/floor";
import type { ServerShapeOptions, ShapeOptions } from "../models/shapes";
import type { CharacterId } from "../systems/characters/models";
import { floorSystem } from "../systems/floors";
import { VisionBlock } from "../systems/properties/types";

import type { SHAPE_TYPE } from "./types";
import { Asset } from "./variants/asset";
import { Circle } from "./variants/circle";
import { CircularToken } from "./variants/circularToken";
import { Line } from "./variants/line";
import { Polygon } from "./variants/polygon";
import { Rect } from "./variants/rect";
import { Text } from "./variants/text";
import { ToggleComposite } from "./variants/toggleComposite";

export interface CompactForm {
    id: LocalId;
    core: CompactShapeCore;
    subShape: CompactSubShapeCore;
    systems: Record<string, unknown>;
    floor: FloorId;
    layer: LayerName;
}

/**
 * Grab all known data from a shape (spread over different systems) in a compact form.
 * This is used for data duplication/extraction purposes.
 *
 * NOTE: A structured clone is done around the data to ensure that we retain the exact state as it is at the moment of calling.
 */
export function fromSystemForm(shapeId: LocalId): CompactForm {
    const shape = getShape(shapeId);
    if (shape === undefined) throw new Error("Shape not found");
    const uuid = getGlobalId(shapeId);
    if (uuid === undefined) throw new Error("Global ID not found");
    if (shape.type === "fontawesome") throw new Error("FontAwesome shapes are not supported");

    const systems: Record<string, unknown> = {};
    for (const [name, system] of getShapeSystems()) {
        systems[name] = system.export?.(shapeId);
    }

    return cloneDeep({
        id: shapeId,
        floor: shape.floor!.id,
        layer: shape.layer!.name,
        core: {
            type_: shape.type,
            uuid,
            x: shape.refPoint.x,
            y: shape.refPoint.y,
            angle: shape.angle,
            drawOperator: shape.globalCompositeOperation,
            customData: [],
            strokeWidth: shape.strokeWidth,
            options: shape.options,
            assetId: shape.assetId ?? null,
            ignoreZoomSize: shape.ignoreZoomSize,
            character: shape.character ?? null,
        },
        subShape: shape.asCompact(),
        systems,
    });
}

/**
 * Instantiate a new shape based on a compact form.
 *
 * If the `mode` parameter is set to 'load', it will simply create the data as is,
 * otherwise it will re-generate unique identifiers.
 *
 * A shapeMap that maps old ids to new ids can be provided to help with duplicate remapping.
 * This is mostly needed for toggle composites.
 */
export function instantiateCompactForm(
    originalCompact: CompactForm,
    mode: SystemInformMode,
    layerAddCallback: (shape: IShape) => void,
    shapeMap?: Map<GlobalId, GlobalId>,
): IShape | undefined {
    // Ensure we don't end up mutating the original compact form
    // we can't use structuredClone, because we use Symbols :(
    const compact = cloneDeep(originalCompact);

    if (mode !== "load") {
        compact.core.uuid = uuidv4();

        if (compact.core.type_ === "togglecomposite") {
            const composite = compact.subShape as ToggleCompositeCompactCore;
            if (composite.active_variant !== null) {
                if (shapeMap === undefined) {
                    console.error("Shape map is required for duplicate mode of toggle composite");
                    return undefined;
                }
                // There is no point in trying to do any error recovery here if the shapeMap is incomplete
                composite.active_variant = shapeMap.get(composite.active_variant)!;
                composite.variants = composite.variants.map((v) => ({ ...v, uuid: shapeMap.get(v.uuid)! }));
            }
        }
    }

    const newShape = createShapeInstanceFromCore(compact);
    if (newShape === undefined) {
        console.error("Failed to create sub shape instance");
        return undefined;
    }

    // Ensure ID is in sync, should only differ in duplicate mode
    compact.id = newShape.id;

    return runImportSystems(newShape, compact, mode, layerAddCallback);
}

function importSystemForms(compact: CompactForm, mode: SystemInformMode, late: boolean = false): void {
    for (const [name, system] of getShapeSystems()) {
        const target = late ? system.importLate : system.import;
        target?.bind(system)(compact.id, compact.systems[name], mode);
    }
}

function runImportSystems(
    shape: IShape,
    compact: CompactForm,
    mode: SystemInformMode,
    layerAddCallback: (shape: IShape) => void,
): IShape | undefined {
    importSystemForms(compact, mode);

    layerAddCallback(shape);

    importSystemForms(compact, mode, true);

    return shape;
}

export async function loadFromServer(serverShape: ApiShape, floor: FloorId, layer: LayerName): Promise<CompactForm> {
    const id = reserveLocalId(serverShape.uuid);
    return await createCompactFromServerData(serverShape, id, floor, layer);
}

export function createOnServer(compact: CompactForm, sync: SyncMode): void {
    if (sync === SyncMode.NO_SYNC) return;

    const uuid = getGlobalId(compact.id);
    if (uuid === undefined) throw new Error("Global ID not found");
    const shape = createServerDataFromCompact(compact);
    let data: ApiShapeAdd;
    if (sync === SyncMode.TEMPLATE_SYNC) {
        data = {
            shape,
            template: true,
        };
    } else {
        let floor;
        if (compact.floor !== undefined) floor = floorSystem.getFloor({ id: compact.floor })?.name;
        if (floor === undefined) throw new Error("Floor not found");
        data = {
            shape,
            floor,
            layer: compact.layer,
            temporary: sync === SyncMode.TEMP_SYNC,
        };
    }

    sendShapeAdd(data);
    // call systems to create
}

interface CompactShapeCoreOptions {
    uuid: GlobalId;
    angle: number;
    drawOperator: GlobalCompositeOperation;
    customData: ApiShapeCustomData[];
    strokeWidth: number;
    options: Partial<ShapeOptions>;
    assetId: AssetId | null;
    ignoreZoomSize: boolean;
    character: CharacterId | null;
}

export interface CompactShapeCore extends CompactShapeCoreOptions {
    type_: SHAPE_TYPE;
    x: number;
    y: number;
}

export interface RectCompactCore {
    width: number;
    height: number;
}

export interface CircleCompactCore {
    radius: number;
    viewing_angle: number | null;
}

export interface CircularTokenCompactCore extends CircleCompactCore {
    text: string;
    font: string;
}

export interface LineCompactCore {
    x2: number;
    y2: number;
    line_width: number;
}

export interface PolygonCompactCore {
    vertices: [number, number][];
    open_polygon: boolean;
    line_width: number;
}

export interface TextCompactCore {
    text: string;
    font_size: number;
}

export interface AssetRectCompactCore extends RectCompactCore {
    src: string;
}

export interface ToggleCompositeCompactCore {
    active_variant: GlobalId;
    variants: { uuid: GlobalId; name: string }[];
}

export type CompactSubShapeCore =
    | RectCompactCore
    | CircleCompactCore
    | CircularTokenCompactCore
    | LineCompactCore
    | PolygonCompactCore
    | TextCompactCore
    | AssetRectCompactCore
    | ToggleCompositeCompactCore;

function createShapeInstanceFromCore(compact: CompactForm): IShape | undefined {
    const { core, subShape } = compact;

    let sh: IShape;

    try {
        const refPoint = toGP(core.x, core.y);
        const uuid = core.uuid;
        if (core.type_ === "rect") {
            const rect = subShape as RectCompactCore;
            sh = new Rect(refPoint, rect.width, rect.height, { uuid });
        } else if (core.type_ === "circle") {
            const circ = subShape as CircleCompactCore;
            sh = new Circle(refPoint, circ.radius, { uuid });
        } else if (core.type_ === "circulartoken") {
            const token = subShape as CircularTokenCompactCore;
            sh = new CircularToken(refPoint, token.radius, token.text, token.font, { uuid });
        } else if (core.type_ === "line") {
            const line = subShape as LineCompactCore;
            sh = new Line(refPoint, toGP(line.x2, line.y2), { uuid });
        } else if (core.type_ === "polygon") {
            const polygon = subShape as PolygonCompactCore;
            sh = new Polygon(
                refPoint,
                polygon.vertices.map((v) => toGP(v)),
                core,
            );
        } else if (core.type_ === "text") {
            const text = subShape as TextCompactCore;
            sh = new Text(refPoint, text.text, text.font_size, { uuid });
        } else if (core.type_ === "assetrect") {
            const asset = subShape as AssetRectCompactCore;
            const img = new Image(asset.width, asset.height);
            if (asset.src.startsWith("http")) img.src = baseAdjust(new URL(asset.src).pathname);
            else img.src = baseAdjust(asset.src);
            sh = new Asset(img, refPoint, asset.width, asset.height, { uuid });
            img.onload = () => {
                (sh as Asset).setLoaded();
            };
        } else if (core.type_ === "togglecomposite") {
            const toggleComposite = subShape as ToggleCompositeCompactCore;
            sh = new ToggleComposite(
                refPoint,
                getLocalId(toggleComposite.active_variant)!,
                toggleComposite.variants.map((v) => ({ id: reserveLocalId(v.uuid), name: v.name })),
                core,
            );
        } else {
            console.error(`Failed to create Shape with unknown type ${core.type_}`);
            return undefined;
        }
    } catch (exception) {
        console.error(`Failed to create Shape of type ${core.type_}`);
        console.error(exception);
        return undefined;
    }

    sh.fromCompact(core, subShape);

    return sh;
}

function createServerDataFromCompact(compact: CompactForm): ApiShape {
    const { core, id, subShape } = compact;

    // Create the core shape content + default values for all system related data
    const { drawOperator, customData, options, strokeWidth, ignoreZoomSize, assetId, ...rest } = core;
    const serverCoreShape: ApiCoreShape = {
        ...rest,
        draw_operator: drawOperator,
        custom_data: customData,
        stroke_width: strokeWidth,
        ignore_zoom_size: ignoreZoomSize,
        asset: assetId,
        name: "",
        name_visible: false,
        fill_colour: "",
        stroke_colour: "",
        vision_obstruction: VisionBlock.No,
        movement_obstruction: false,
        options: JSON.stringify(Object.entries(options)),
        badge: 0,
        show_badge: false,
        default_edit_access: false,
        default_vision_access: false,
        is_invisible: false,
        is_defeated: false,
        default_movement_access: false,
        is_locked: false,
        owners: [],
        trackers: [],
        notes: [],
        auras: [],
        odd_hex_orientation: false,
        size: 0,
        show_cells: false,
        cell_fill_colour: null,
        cell_stroke_colour: null,
        cell_stroke_width: null,
        group: null,
        is_door: false,
        is_teleport_zone: false,
    };

    // Augment the data with the correct system data
    for (const [, system] of getShapeSystems()) {
        system.toServerShape?.(id, serverCoreShape);
    }

    // Augment the data with the correct subshape data

    let serverShape: ApiShape;

    if (core.type_ === "rect") {
        const rect = subShape as RectCompactCore;
        serverShape = { ...serverCoreShape, ...rect } as ApiRectShape;
    } else if (core.type_ === "circle") {
        const circ = subShape as CircleCompactCore;
        serverShape = { ...serverCoreShape, ...circ } as ApiCircleShape;
    } else if (core.type_ === "circulartoken") {
        const token = subShape as CircularTokenCompactCore;
        serverShape = { ...serverCoreShape, ...token } as ApiCircularTokenShape;
    } else if (core.type_ === "line") {
        const line = subShape as LineCompactCore;
        serverShape = { ...serverCoreShape, ...line } as ApiLineShape;
    } else if (core.type_ === "polygon") {
        const polygon = subShape as PolygonCompactCore;
        serverShape = { ...serverCoreShape, ...polygon, vertices: JSON.stringify(polygon.vertices) } as ApiPolygonShape;
    } else if (core.type_ === "text") {
        const text = subShape as TextCompactCore;
        serverShape = { ...serverCoreShape, ...text } as ApiTextShape;
    } else if (core.type_ === "assetrect") {
        const asset = subShape as AssetRectCompactCore;
        serverShape = { ...serverCoreShape, ...asset } as ApiAssetRectShape;
    } else if (core.type_ === "togglecomposite") {
        const toggleComposite = subShape as ToggleCompositeCompactCore;
        serverShape = { ...serverCoreShape, ...toggleComposite } as ApiToggleCompositeShape;
    } else {
        throw new Error(`Failed to create Shape with unknown type ${core.type_}`);
    }

    return serverShape;
}

async function createCompactFromServerData(
    serverShape: ApiShape,
    id: LocalId,
    floor: FloorId,
    layer: LayerName,
): Promise<CompactForm> {
    const options: Partial<ServerShapeOptions> =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Object.fromEntries(JSON.parse(serverShape.options));

    let subShape: CompactSubShapeCore;

    if (serverShape.type_ === "rect") {
        subShape = serverShape as RectCompactCore;
    } else if (serverShape.type_ === "circle") {
        subShape = serverShape as CircleCompactCore;
    } else if (serverShape.type_ === "circulartoken") {
        subShape = serverShape as CircularTokenCompactCore;
    } else if (serverShape.type_ === "line") {
        subShape = serverShape as LineCompactCore;
    } else if (serverShape.type_ === "polygon") {
        const polygon = serverShape as ApiPolygonShape;
        subShape = {
            ...polygon,
            vertices: JSON.parse(polygon.vertices) as [number, number][],
        };
    } else if (serverShape.type_ === "text") {
        subShape = serverShape as TextCompactCore;
    } else if (serverShape.type_ === "assetrect") {
        subShape = serverShape as AssetRectCompactCore;
    } else if (serverShape.type_ === "togglecomposite") {
        subShape = serverShape as ToggleCompositeCompactCore;
    } else {
        throw new Error(`Failed to create Shape with unknown type ${serverShape.type_}`);
    }

    const compact: CompactForm = {
        id,
        floor,
        layer,
        core: {
            type_: serverShape.type_ as SHAPE_TYPE,
            uuid: serverShape.uuid,
            x: serverShape.x,
            y: serverShape.y,
            angle: serverShape.angle,
            drawOperator: serverShape.draw_operator as GlobalCompositeOperation,
            customData: serverShape.custom_data,
            assetId: serverShape.asset,
            ignoreZoomSize: serverShape.ignore_zoom_size,
            character: serverShape.character,
            strokeWidth: serverShape.stroke_width,
            options,
        },
        subShape,
        systems: {},
    };

    await Promise.all(
        getShapeSystems().map(async ([name, system]) => {
            compact.systems[name] = await system.fromServerShape?.(serverShape, options);
        }),
    );

    return compact;
}
