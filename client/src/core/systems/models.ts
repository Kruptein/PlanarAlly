import type { ApiCoreShape } from "../../apiTypes";
import type { ServerShapeOptions } from "../../game/models/shapes";
import type { LocalId } from "../id";
import type { MaybePromise } from "../types";

export type SystemClearReason = "full-loading" | "partial-loading" | "leaving" | "logging-out";

/**
 * The manner in which the shape is being imported into the system.
 * - load: the shape is being loaded, usually directly from the server on startup. It's data should be taken as is.
 * - create: a new shape is being created, using the data as a base, identifiers should be generated to make them unique to the shape where relevant.
 * - duplicate: this is very similar to create, but gives systems the option to have special diverging behaviour when duplicating.
 *
 * An example in different logic between create and duplicate is the handling of group information.
 * When duplicating a shape, the shape is auto-added to the same group as the original shape.
 * When creating a shape, the shape is not added to any group by default.
 */
export type SystemInformMode = "load" | "duplicate" | "create";

export interface System {
    clear: (reason: SystemClearReason) => void;
    drop?: (id: LocalId) => void;
}

export interface ShapeSystem<T> extends System {
    // Drop the shape from the system.
    // Note that this does not necessarily mean the shape is being deleted from the game!
    drop: (id: LocalId) => void;

    // Conversions between the system representation and compact-form data.
    export: (id: LocalId) => T;
    import?: (id: LocalId, data: T, mode: SystemInformMode) => void;
    importLate?: (id: LocalId, data: T, mode: SystemInformMode) => void;

    // Conversion between compact form data and the server data.
    toServerShape?: (id: LocalId, shape: ApiCoreShape) => void;
    fromServerShape?: (shape: ApiCoreShape, serverOptions: Partial<ServerShapeOptions>) => MaybePromise<T>;
}
