import { type IconLookup, findIconDefinition, icon, type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import type { IAsset } from "../../interfaces/shapes/asset";
import type { SHAPE_TYPE } from "../types";

type SvgDisplayOverrides = {
    fill: string;
    stroke: string;
    strokeWidth: string;
};

import { Asset } from "./asset";

const faBlobs = new Map<string, string>();

function getFaBlobUrl(iconDef: IconDefinition, displayOverrides: SvgDisplayOverrides = { fill: "white", stroke: "black", strokeWidth: "20" }): string {
    const name = `${iconDef.prefix}-${iconDef.iconName}`;
    if (faBlobs.has(name)) return faBlobs.get(name)!;

    const svg = icon(iconDef).node[0] as SVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const path = svg.firstChild as SVGTextPathElement;
    path.setAttribute("fill", displayOverrides.fill);
    path.setAttribute("stroke", displayOverrides.stroke);
    path.setAttribute("stroke-width", displayOverrides.strokeWidth);
    console.log(svg.outerHTML)
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    console.log(url);
    faBlobs.set(name, url);
    return url;
}

export class FontAwesomeIcon extends Asset implements IAsset {
    type: SHAPE_TYPE = "fontawesome";

    constructor(
        icon: IconLookup,
        topleft: GlobalPoint,
        w: number,
        options?: { id?: LocalId; uuid?: GlobalId; isSnappable?: boolean; parentId?: LocalId; svgDisplayOverrides?: SvgDisplayOverrides },
    ) {
        const image = new Image();
        const iconDef = findIconDefinition(icon);
        const h = w * (iconDef.icon[1] / iconDef.icon[0]);
        image.src = getFaBlobUrl(iconDef, options?.svgDisplayOverrides);
        super(image, topleft, w, h, { isSnappable: false, ...options });
    }
}
