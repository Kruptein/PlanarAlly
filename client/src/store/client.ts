import { computed } from "vue";
import type { ComputedRef } from "vue";

import { g2l, l2g, zoomDisplayToFactor } from "../core/conversions";
import { addP, subtractP, toGP, Vector } from "../core/geometry";
import type { GlobalPoint } from "../core/geometry";
import { Store } from "../core/store";
import { toSnakeCase } from "../core/utils";
import { sendClientLocationOptions, sendDefaultClientOptions, sendRoomClientOptions } from "../game/api/emits/client";
import { InitiativeEffectMode } from "../game/models/initiative";
import type { UserOptions } from "../game/models/settings";
import { clientSystem } from "../game/systems/client";
import { floorSystem } from "../game/systems/floors";
import { floorState } from "../game/systems/floors/state";

export const DEFAULT_GRID_SIZE = 50;
// export const ZOOM_1_SOLUTION = 0.194904;
export let GRID_OFFSET = { x: 0, y: 0 };
export let ZOOM = NaN;

export function clear(): void {
    GRID_OFFSET = { x: 0, y: 0 };
    ZOOM = NaN;
}

export function setGridOffset(offset: { x: number; y: number }): void {
    console.log("Setting offset", offset);
    GRID_OFFSET = offset;
    floorSystem.invalidateAllFloors();
}

interface State extends UserOptions {
    username: string;

    defaultClientOptions: UserOptions;

    panX: number;
    panY: number;
    zoomDisplay: number;
}

function setZoomFactor(zoomDisplay: number): void {
    const gf = clientStore.gridSize.value / DEFAULT_GRID_SIZE;
    if (clientStore.state.useAsPhysicalBoard) {
        if (ZOOM !== gf) {
            ZOOM = gf;
        }
    } else {
        ZOOM = zoomDisplayToFactor(zoomDisplay);
    }
}

class ClientStore extends Store<State> {
    gridSize: ComputedRef<number>;
    devicePixelRatio: ComputedRef<number>;

    constructor() {
        super();
        this.gridSize = computed(() => {
            if (this._state.useAsPhysicalBoard) {
                return (this._state.ppi * this._state.miniSize) / this.devicePixelRatio.value;
            } else {
                return this._state.gridSize;
            }
        });
        this.devicePixelRatio = computed(() => {
            if (this._state.useHighDpi) {
                return window.devicePixelRatio;
            } else {
                return 1;
            }
        });
    }

    protected data(): State {
        return {
            username: "",

            defaultClientOptions: {
                gridColour: "rgba(0, 0, 0, 1)",
                fowColour: "rgba(0, 0, 0, 1)",
                rulerColour: "rgba(255, 0, 0, 1)",

                invertAlt: false,
                disableScrollToZoom: false,

                useHighDpi: true,
                gridSize: DEFAULT_GRID_SIZE,
                useAsPhysicalBoard: false,
                miniSize: 1,
                ppi: 96,

                initiativeCameraLock: false,
                initiativeVisionLock: false,
                initiativeEffectVisibility: InitiativeEffectMode.ActiveAndHover,
            },

            fowColour: "rgba(0, 0, 0, 1)",
            gridColour: "rgba(0, 0, 0, 1)",
            rulerColour: "rgba(255, 0, 0, 1)",

            invertAlt: false,
            disableScrollToZoom: false,

            useHighDpi: true,
            gridSize: DEFAULT_GRID_SIZE,
            useAsPhysicalBoard: false,
            miniSize: 1,
            ppi: 96,

            initiativeCameraLock: false,
            initiativeVisionLock: false,
            initiativeEffectVisibility: InitiativeEffectMode.ActiveAndHover,

            panX: 0,
            panY: 0,
            zoomDisplay: 0.5,
        };
    }

    get screenTopLeft(): GlobalPoint {
        return toGP(-this._state.panX, -this._state.panY);
    }

    get screenCenter(): GlobalPoint {
        const halfScreen = new Vector(window.innerWidth / 2, window.innerHeight / 2);
        return l2g(addP(g2l(this.screenTopLeft), halfScreen));
    }

    setUsername(username: string): void {
        this._state.username = username;
    }

    // POSITION
    setPan(x: number, y: number, options: { needsOffset: boolean }): void {
        this._state.panX = x - (options.needsOffset ? GRID_OFFSET.x : 0);
        this._state.panY = y - (options.needsOffset ? GRID_OFFSET.y : 0);
    }

    increasePan(x: number, y: number): void {
        this._state.panX += x;
        this._state.panY += y;
    }

    // ZOOM

    setZoomDisplay(zoom: number, options: { invalidate: boolean; sync: boolean }): void {
        if (zoom < 0) zoom = 0;
        if (zoom > 1) zoom = 1;
        this._state.zoomDisplay = zoom;
        setZoomFactor(zoom);
        if (options.invalidate) floorSystem.invalidateAllFloors();
        if (options.sync) {
            sendClientLocationOptions(false);
            clientSystem.updateZoomFactor();
        }
    }

    updateZoom(newZoomDisplay: number, zoomLocation: GlobalPoint): void {
        const oldLoc = g2l(zoomLocation);
        this.setZoomDisplay(newZoomDisplay, { invalidate: false, sync: false });
        const newLoc = l2g(oldLoc);
        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = subtractP(newLoc, zoomLocation);
        this.increasePan(diff.x, diff.y);
        floorSystem.invalidateAllFloors();
        sendClientLocationOptions(false);
        clientSystem.updateZoomFactor();
    }

    // OPTIONS

    useSnapping(event: MouseEvent | TouchEvent): boolean {
        return this._state.invertAlt === event.altKey;
    }

    setDefaultClientOptions(clientOptions: UserOptions): void {
        this._state.defaultClientOptions = clientOptions;
    }

    setDefaultClientOption<K extends keyof UserOptions>(key: K, value: UserOptions[K], sync: boolean): void {
        this._state.defaultClientOptions[key] = value;
        if (sync) sendDefaultClientOptions({ [toSnakeCase(key)]: value });
    }

    // APPEARANCE

    setFowColour(colour: string, sync: boolean): void {
        this._state.fowColour = colour;
        floorSystem.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ fow_colour: colour });
    }

    setGridColour(colour: string, sync: boolean): void {
        this._state.gridColour = colour;
        for (const floor of floorState.raw.floors) {
            floorSystem.getGridLayer(floor)!.invalidate();
        }
        if (sync) sendRoomClientOptions({ grid_colour: colour });
    }

    setRulerColour(colour: string, sync: boolean): void {
        this._state.rulerColour = colour;
        if (sync) sendRoomClientOptions({ ruler_colour: colour });
    }

    // BEHAVIOUR

    setInvertAlt(invertAlt: boolean, sync: boolean): void {
        this._state.invertAlt = invertAlt;
        if (sync) sendRoomClientOptions({ invert_alt: invertAlt });
    }

    setDisableScrollToZoom(disable: boolean, sync: boolean): void {
        this._state.disableScrollToZoom = disable;
        if (sync) sendRoomClientOptions({ disable_scroll_to_zoom: disable });
    }

    // DISPLAY

    setUseHighDpi(useHighDpi: boolean, sync: boolean): void {
        this._state.useHighDpi = useHighDpi;
        floorSystem.resize(window.innerWidth, window.innerHeight);
        if (sync) sendRoomClientOptions({ use_high_dpi: useHighDpi });
    }

    setGridSize(size: number, sync: boolean): void {
        this._state.gridSize = size;
        floorSystem.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ grid_size: size });
    }

    setUseAsPhysicalBoard(useAsPhysicalBoard: boolean, sync: boolean): void {
        this._state.useAsPhysicalBoard = useAsPhysicalBoard;
        floorSystem.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ use_as_physical_board: useAsPhysicalBoard });
    }

    setMiniSize(size: number, sync: boolean): void {
        this._state.miniSize = size;
        floorSystem.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ mini_size: size });
    }

    setPpi(ppi: number, sync: boolean): void {
        this._state.ppi = ppi;
        floorSystem.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ ppi });
    }

    // INITIATIVE

    setInitiativeCameraLock(initiativeCameraLock: boolean, sync: boolean): void {
        this._state.initiativeCameraLock = initiativeCameraLock;
        if (sync) sendRoomClientOptions({ initiative_camera_lock: initiativeCameraLock });
    }

    setInitiativeVisionLock(initiativeVisionLock: boolean, sync: boolean): void {
        this._state.initiativeVisionLock = initiativeVisionLock;
        if (sync) sendRoomClientOptions({ initiative_vision_lock: initiativeVisionLock });
    }

    setInitiativeEffectVisibility(initiativeEffectVisibility: InitiativeEffectMode, sync: boolean): void {
        this._state.initiativeEffectVisibility = initiativeEffectVisibility;
        if (sync) sendRoomClientOptions({ initiative_effect_visibility: initiativeEffectVisibility });
    }
}

export const clientStore = new ClientStore();
(window as any).clientStore = clientStore;
