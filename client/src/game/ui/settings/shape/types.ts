import type { UiShapeCustomData } from "../../../systems/customData/types";

export type Branch = { prefix: string; name: string; children: (Branch | UiShapeCustomData)[] };
export type Tree = (Branch | UiShapeCustomData)[];
