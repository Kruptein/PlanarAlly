import {
    type IconLookup,
    findIconDefinition,
    icon as faIcon,
    type IconDefinition,
    IconPrefix,
    IconName,
} from "@fortawesome/fontawesome-svg-core";

import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { CompactShapeCore, FontAwesomeCompactCore } from "../transformations";
import type { SHAPE_TYPE } from "../types";

import { IImage } from "./_image";

const faBlobs = new Map<string, string>();

function getFaBlobUrl(
    iconDef: IconDefinition,
    styleOptions: { fill: string; stroke: string; strokeWidth: number },
): string {
    const name = `${iconDef.prefix}-${iconDef.iconName}-${styleOptions.fill}-${styleOptions.stroke}-${styleOptions.strokeWidth}`;
    if (faBlobs.has(name)) return faBlobs.get(name)!;

    const svg = faIcon(iconDef).node[0] as SVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const path = svg.firstChild as SVGTextPathElement;
    path.setAttribute("fill", styleOptions.fill);
    path.setAttribute("stroke", styleOptions.stroke);
    path.setAttribute("stroke-width", styleOptions.strokeWidth.toString());
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    faBlobs.set(name, url);
    return url;
}

export class FontAwesomeIcon extends IImage {
    type: SHAPE_TYPE = "fontawesome";

    constructor(
        private icon: IconLookup,
        topleft: GlobalPoint,
        w: number,
        options?: {
            id?: LocalId;
            uuid?: GlobalId;
            isSnappable?: boolean;
            parentId?: LocalId;
            fillColour?: string;
            strokeColour?: string;
            strokeWidth?: number;
        },
    ) {
        const fillColour = options?.fillColour ?? "black";
        const strokeColour = options?.strokeColour ?? "white";
        const strokeWidth = options?.strokeWidth ?? 10;
        const image = new Image();
        const iconDef = findIconDefinition(icon);
        const h = w * (iconDef.icon[1] / iconDef.icon[0]);
        image.src = getFaBlobUrl(iconDef, { fill: fillColour, stroke: strokeColour, strokeWidth: strokeWidth });

        super(image, topleft, w, h, { isSnappable: false, ...options });
    }

    asCompact(): FontAwesomeCompactCore {
        return { ...super.asCompact(), iconPrefix: this.icon.prefix, iconName: this.icon.iconName };
    }

    fromCompact(core: CompactShapeCore, subShape: FontAwesomeCompactCore): void {
        super.fromCompact(core, subShape);
        this.icon = { prefix: subShape.iconPrefix as IconPrefix, iconName: subShape.iconName as IconName };
    }
}
