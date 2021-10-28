import { computed } from "vue";
import type { ComputedRef } from "vue";

import { g2l, l2g } from "../core/conversions";
import { addP, subtractP, toGP, Vector } from "../core/geometry";
import type { GlobalPoint } from "../core/geometry";
import { Store } from "../core/store";
import { toSnakeCase } from "../core/utils";
import { sendClientLocationOptions, sendDefaultClientOptions, sendRoomClientOptions } from "../game/api/emits/client";
import { InitiativeEffectMode } from "../game/models/initiative";
import type { UserOptions } from "../game/models/settings";

import { floorStore } from "./floor";

export const DEFAULT_GRID_SIZE = 50;
// export const ZOOM_1_SOLUTION = 0.194904;

interface State extends UserOptions {
    username: string;

    defaultClientOptions: UserOptions;

    panX: number;
    panY: number;
    zoomDisplay: number;
}

class ClientStore extends Store<State> {
    zoomFactor: ComputedRef<number>;
    gridSize: ComputedRef<number>;
    devicePixelRatio: ComputedRef<number>;

    constructor() {
        super();
        this.zoomFactor = computed(() => {
            const gf = this.gridSize.value / DEFAULT_GRID_SIZE;
            if (this._state.useAsPhysicalBoard) {
                return gf;
            } else {
                // Powercurve 0.2/3/10
                // Based on https://stackoverflow.com/a/17102320
                const zoomValue = 1 / (-5 / 3 + (28 / 15) * Math.exp(1.83 * this._state.zoomDisplay));
                return zoomValue * gf;
            }
        });
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
    setPanX(x: number): void {
        this._state.panX = x;
    }

    setPanY(y: number): void {
        this._state.panY = y;
    }

    increasePanX(increase: number): void {
        this._state.panX += increase;
    }

    increasePanY(increase: number): void {
        this._state.panY += increase;
    }

    // ZOOM

    setZoomDisplay(zoom: number): void {
        if (zoom === this._state.zoomDisplay) return;
        if (zoom < 0) zoom = 0;
        if (zoom > 1) zoom = 1;
        this._state.zoomDisplay = zoom;
        floorStore.invalidateAllFloors();
    }

    updateZoom(newZoomDisplay: number, zoomLocation: GlobalPoint): void {
        if (newZoomDisplay === this._state.zoomDisplay) return;
        if (newZoomDisplay < 0) newZoomDisplay = 0;
        if (newZoomDisplay > 1) newZoomDisplay = 1;
        const oldLoc = g2l(zoomLocation);
        this._state.zoomDisplay = newZoomDisplay;
        const newLoc = l2g(oldLoc);
        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = subtractP(newLoc, zoomLocation);
        this._state.panX += diff.x;
        this._state.panY += diff.y;
        floorStore.invalidateAllFloors();
        sendClientLocationOptions();
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
        floorStore.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ fow_colour: colour });
    }

    setGridColour(colour: string, sync: boolean): void {
        this._state.gridColour = colour;
        for (const floor of floorStore.state.floors) {
            floorStore.getGridLayer(floor)!.invalidate();
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
        floorStore.resize(window.innerWidth, window.innerHeight);
        if (sync) sendRoomClientOptions({ use_high_dpi: useHighDpi });
    }

    setGridSize(size: number, sync: boolean): void {
        this._state.gridSize = size;
        floorStore.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ grid_size: size });
    }

    setUseAsPhysicalBoard(useAsPhysicalBoard: boolean, sync: boolean): void {
        this._state.useAsPhysicalBoard = useAsPhysicalBoard;
        floorStore.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ use_as_physical_board: useAsPhysicalBoard });
    }

    setMiniSize(size: number, sync: boolean): void {
        this._state.miniSize = size;
        floorStore.invalidateAllFloors();
        if (sync) sendRoomClientOptions({ mini_size: size });
    }

    setPpi(ppi: number, sync: boolean): void {
        this._state.ppi = ppi;
        floorStore.invalidateAllFloors();
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
