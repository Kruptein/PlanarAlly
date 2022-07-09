import { reactive, readonly } from "vue";
import type { DeepReadonly } from "vue";

import type { LocalId } from "../../id";

export interface ShapeProperties {
    name: string;
    nameVisible: boolean;
    isToken: boolean;
    isInvisible: boolean;
    strokeColour: string[];
    fillColour: string;
    blocksMovement: boolean;
    blocksVision: boolean;
    showBadge: boolean;
    isDefeated: boolean;
    isLocked: boolean;
}

type ReactivePropertiesState = Omit<ShapeProperties, "fillColour" | "strokeColour"> & {
    id: LocalId | undefined;
    strokeColour: string[] | undefined;
    fillColour: string | undefined;
};

const reactiveState = reactive<ReactivePropertiesState>({
    id: undefined,
    name: "Unknown Shape",
    nameVisible: false,
    isToken: false,
    isInvisible: false,
    strokeColour: undefined,
    fillColour: undefined,
    blocksMovement: false,
    blocksVision: false,
    showBadge: false,
    isDefeated: false,
    isLocked: false,
});

interface PropertiesState {
    data: Map<LocalId, ShapeProperties>;
}

const state: PropertiesState = {
    data: new Map(),
};

const DEFAULT_PROPERTIES: () => ShapeProperties = () => ({
    name: "Unknown Shape",
    nameVisible: true,
    isToken: false,
    isInvisible: false,
    isDefeated: false,
    isLocked: false,
    fillColour: "#000",
    strokeColour: ["rgba(0, 0, 0, 0)"],
    blocksMovement: false,
    blocksVision: false,
    showBadge: false,
});

export function getProperties(id: LocalId): DeepReadonly<ShapeProperties> | undefined {
    return state.data.get(id);
}

export const propertiesState = {
    $: readonly(reactiveState),
    _$: reactiveState,
    _: state,
    DEFAULT: DEFAULT_PROPERTIES,
};
