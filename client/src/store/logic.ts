// import type { DeepReadonly } from "vue";
// import { POSITION, useToast } from "vue-toastification";
// import type { ToastID } from "vue-toastification/dist/types/types";

// import SingleButtonToast from "../core/components/toasts/SingleButtonToast.vue";
// import { Store } from "../core/store";
// import { sendRequest } from "../game/api/emits/logic";
// import { requestShapeInfo, sendShapesMove } from "../game/api/emits/shape/core";
// import { getGlobalId, getLocalId, getShape } from "../game/id";
// import type { GlobalId, LocalId } from "../game/id";
// import { LayerName } from "../game/models/floor";
// import { setCenterPosition } from "../game/position";
// import type { IShape } from "../game/shapes/interfaces";

// import { floorStore } from "./floor";
// import { gameStore } from "./game";
// import { settingsStore } from "./settings";

// const toast = useToast();

// interface LogicState {
//     teleportZones: Record<LocalId, ToastID | undefined>;
// }

// export function copyConditions(conditions: DeepReadonly<Conditions>): Conditions {
//     return {
//         enabled: [...conditions.enabled],
//         request: [...conditions.request],
//         disabled: [...conditions.disabled],
//     };
// }

// class LogicStore extends Store<LogicState> {
//     protected data(): LogicState {
//         return {
//             teleportZones: {},
//         };
//     }

//     addTeleportZone(shape: LocalId): void {
//         this._state.teleportZones[shape] = undefined;
//     }

//     removeTeleportZone(shape: LocalId): void {
//         const toastId = this._state.teleportZones[shape];
//         if (toastId !== undefined) toast.dismiss(toastId);
//         delete this._state.teleportZones[shape];
//     }

// }

// export const logicStore = new LogicStore();
// (window as any).logicStore = logicStore;
