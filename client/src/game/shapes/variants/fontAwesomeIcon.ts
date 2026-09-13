import {
    type IconLookup,
    findIconDefinition,
    icon as faIcon,
    type IconDefinition,
    type IconPrefix,
    type IconName,
} from "@fortawesome/fontawesome-svg-core";
import type { DeepReadonly } from "vue";

import type { GlobalPoint } from "../../../core/geometry";
import type { GlobalId, LocalId } from "../../../core/id";
import { getProperties } from "../../systems/properties/state";
import type { ShapeProperties } from "../../systems/properties/types";
import type { CompactShapeCore, FontAwesomeCompactCore } from "../transformations";
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
    for (const child of svg.children) {
        child.setAttribute("fill", styleOptions.fill);
        child.setAttribute("stroke", styleOptions.stroke);
        child.setAttribute("stroke-width", styleOptions.strokeWidth.toString());
        child.setAttribute("stroke-linejoin", "round");
    }

    const sw = 2 * styleOptions.strokeWidth;
    if (sw > 0) {
        const [iconW, iconH] = iconDef.icon;
        svg.setAttribute("viewBox", `${-sw} ${-sw} ${iconW + sw * 2} ${iconH + sw * 2}`);
    }

    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    faBlobs.set(name, url);
    return url;
}

function setupImage(
    iconDef: IconDefinition,
    properties?: Partial<DeepReadonly<ShapeProperties>>,
    strokeWidth?: number,
): string {
    const fillColour = properties?.fillColour ?? "black";
    const strokeColour = properties?.strokeColour ?? ["white"];
    return getFaBlobUrl(iconDef, {
        fill: fillColour,
        stroke: strokeColour[0]!,
        strokeWidth: strokeWidth ?? 10,
    });
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
            strokeWidth?: number;
        },
        properties?: Partial<ShapeProperties>,
    ) {
        const image = new Image();
        const iconDef = findIconDefinition(icon);
        const h = w * (iconDef.icon[1] / iconDef.icon[0]);
        image.src = setupImage(iconDef, properties, options?.strokeWidth);

        super(image, topleft, w, h, { isSnappable: false, loaded: false, ...options }, properties);
    }

    asCompact(): FontAwesomeCompactCore {
        return { ...super.asCompact(), iconPrefix: this.icon.prefix, iconName: this.icon.iconName };
    }

    fromCompact(core: CompactShapeCore, subShape: FontAwesomeCompactCore): void {
        super.fromCompact(core, subShape);
        this.icon = { prefix: subShape.iconPrefix as IconPrefix, iconName: subShape.iconName as IconName };
    }

    onSystemsLoaded(): void {
        const props = getProperties(this.id);
        this.img.src = setupImage(findIconDefinition(this.icon), props, this.strokeWidth);
    }
}
