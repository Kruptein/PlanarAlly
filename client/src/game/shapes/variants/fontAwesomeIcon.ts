import { type IconLookup, findIconDefinition, icon, type IconDefinition } from "@fortawesome/fontawesome-svg-core";

import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import type { IAsset } from "../../interfaces/shapes/asset";
import type { SHAPE_TYPE } from "../types";

import { Asset } from "./asset";

const faBlobs = new Map<string, string>();

function getFaBlobUrl(iconDef: IconDefinition): string {
    const name = `${iconDef.prefix}-${iconDef.iconName}`;
    if (faBlobs.has(name)) return faBlobs.get(name)!;

    const svg = icon(iconDef).node[0] as SVGElement;
    const path = svg.firstChild as SVGTextPathElement;
    path.setAttribute("fill", "white");
    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "20");
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    faBlobs.set(name, url);
    return url;
}

export class FontAwesomeIcon extends Asset implements IAsset {
    type: SHAPE_TYPE = "fontawesome";

    constructor(
        icon: IconLookup,
        topleft: GlobalPoint,
        w: number,
        options?: { id?: LocalId; uuid?: GlobalId; isSnappable?: boolean; parentId?: LocalId },
    ) {
        const image = new Image();
        const iconDef = findIconDefinition(icon);
        const h = w * (iconDef.icon[1] / iconDef.icon[0]);
        image.src = getFaBlobUrl(iconDef);

        super(image, topleft, w, h, { isSnappable: false, ...options });
    }
}
