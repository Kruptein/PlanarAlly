<script lang="ts">
import Component from "vue-class-component";

import { sendShapePositionUpdate, sendShapeSizeUpdate } from "@/game/api/emits/shape/core";
import { EventBus } from "@/game/event-bus";
import { GlobalPoint, Vector, LocalPoint } from "@/game/geom";
import { layerManager } from "@/game/layers/manager";
import { floorStore } from "@/game/layers/store";
import { Shape } from "@/game/shapes/shape";
import { Rect } from "@/game/shapes/variants/rect";
import Tool from "@/game/ui/tools/tool.vue";
import { l2g } from "@/game/units";

import { SyncMode, InvalidationMode } from "../../../core/models/types";
import { DEFAULT_GRID_SIZE } from "../../store";

import { SelectFeatures } from "./select.vue";
import { ToolBasics } from "./ToolBasics";
import { ToolName, ToolPermission } from "./utils";

@Component
export default class MapTool extends Tool implements ToolBasics {
    name = ToolName.Map;
    active = false;
    gridX = 3;
    gridY = 3;
    sizeX = 0;
    sizeY = 0;

    // used for region selection
    factorX = 1;
    factorY = 1;

    startPoint: GlobalPoint | undefined = undefined;
    rect: Rect | undefined = undefined;
    shape: Rect | undefined = undefined;
    error = "";

    ogRP: GlobalPoint | undefined = undefined;
    ogW: number | null = null;
    ogH: number | null = null;

    manualDrag = true;
    lock = true;
    aspectRatio = 1;

    hasShape = false;
    hasRect = false;

    permittedTools_: ToolPermission[] = [
        { name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } },
    ];

    get permittedTools(): ToolPermission[] {
        return this.permittedTools_;
    }
    // Life cycle

    mounted(): void {
        EventBus.$on("SelectionInfo.Shapes.Set", (shapes: Shape[]) => {
            this.setSelection(shapes);
        });
    }

    beforeDestroy(): void {
        EventBus.$off("SelectionInfo.Shapes.Set");
    }

    // End life cycle

    setSelection(shapes: readonly Shape[]): void {
        if (shapes.length === 1 && this.shape === undefined && ["assetrect", "rect"].includes(shapes[0].type)) {
            this.shape = shapes[0] as Rect;
            this.hasShape = true;
            this.ogRP = this.shape.refPoint;
            this.ogW = this.shape.w;
            this.ogH = this.shape.h;
            this.aspectRatio = this.shape.w / this.shape.h;
        } else if (shapes.length === 0) {
            this.removeRect();
        }
    }

    skipManualDrag(): void {
        if (this.shape === undefined) return;

        this.manualDrag = false;
        this.gridX = this.shape.w / DEFAULT_GRID_SIZE;
        this.gridY = this.shape.h / DEFAULT_GRID_SIZE;
        this.sizeX = this.shape.w;
        this.sizeY = this.shape.h;
    }

    removeRect(reset = true): void {
        if (this.shape && reset && this.active) {
            this.shape.refPoint = this.ogRP!;
            this.shape.w = this.ogW!;
            this.shape.h = this.ogH!;

            sendShapePositionUpdate([this.shape], true);
            sendShapeSizeUpdate({ shape: this.shape, temporary: true });
            this.shape.invalidate(true);
        }
        if (this.rect) {
            const layer = floorStore.currentLayer!;
            layer.removeShape(this.rect, SyncMode.NO_SYNC, true);
            this.rect = undefined;
            this.hasRect = false;
        }
        this.permittedTools_ = [{ name: ToolName.Select, features: { enabled: [SelectFeatures.ChangeSelection] } }];
        this.shape = undefined;
        this.hasShape = false;
        this.error = "";
        this.manualDrag = true;
    }

    preview(temporary: boolean): void {
        if (this.shape === undefined || (this.rect === undefined && this.manualDrag)) return;
        if (!Number.isFinite(this.gridX) || !Number.isFinite(this.gridY) || this.gridX <= 0 || this.gridY <= 0) {
            this.error = "Input should be a positive number";
            return;
        }

        if (this.rect !== undefined) {
            const xFactor = (this.gridX * DEFAULT_GRID_SIZE) / this.rect.w;
            const yFactor = (this.gridY * DEFAULT_GRID_SIZE) / this.rect.h;

            this.shape.w *= xFactor;
            this.shape.h *= yFactor;

            const oldRefpoint = this.shape.refPoint;
            const oldCenter = this.rect.center();

            const delta = oldCenter.subtract(oldRefpoint);
            const newCenter = oldRefpoint.add(new Vector(xFactor * delta.x, yFactor * delta.y));
            this.shape.refPoint = this.shape.refPoint.add(oldCenter.subtract(newCenter));
        } else {
            this.shape.w = this.sizeX;
            this.shape.h = this.sizeY;
        }

        sendShapePositionUpdate([this.shape], temporary);
        sendShapeSizeUpdate({ shape: this.shape, temporary: temporary });
        this.shape.invalidate(true);
    }

    apply(): void {
        this.preview(false);
        this.removeRect(false);
    }

    onSelect(): void {
        this.setSelection(layerManager.getSelection({ includeComposites: false }));
    }

    onDeselect(): void {
        this.removeRect();
    }

    onDown(lp: LocalPoint): void {
        if (!this.manualDrag) return;
        if (this.rect !== undefined || !layerManager.hasSelection()) return;

        const startPoint = l2g(lp);

        this.startPoint = startPoint;
        const layer = floorStore.currentLayer;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = true;

        this.rect = new Rect(this.startPoint.clone(), 0, 0, { fillColour: "rgba(0,0,0,0)", strokeColour: "black" });
        this.hasRect = true;
        this.rect.preventSync = true;
        layer.addShape(this.rect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        layer.setSelection(this.rect);
        console.log(this.rect);
    }

    onMove(lp: LocalPoint): void {
        if (!this.active || this.rect === undefined || this.startPoint === undefined) return;

        const endPoint = l2g(lp);

        const layer = floorStore.currentLayer;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }

        this.rect.w = Math.abs(endPoint.x - this.startPoint.x);
        this.rect.h = Math.abs(endPoint.y - this.startPoint.y);
        this.rect.refPoint = new GlobalPoint(
            Math.min(this.startPoint.x, endPoint.x),
            Math.min(this.startPoint.y, endPoint.y),
        );
        layer.invalidate(false);
    }

    onUp(): void {
        if (!this.active || this.rect === undefined) return;
        const layer = floorStore.currentLayer;
        if (layer === undefined) {
            console.log("No active layer!");
            return;
        }
        this.active = false;

        if (layer.getSelection({ includeComposites: false }).length !== 1) {
            this.removeRect();
            return;
        }

        this.permittedTools_ = [
            { name: ToolName.Select, features: { enabled: [SelectFeatures.Drag, SelectFeatures.Resize] } },
        ];
    }

    toggleLock(): void {
        this.lock = !this.lock;
        if (this.lock) this.aspectRatio = this.shape!.w / this.shape!.h;
    }

    updateGridX(): void {
        if (this.lock) {
            if (this.manualDrag) {
                this.gridY = this.gridX / (this.rect!.w / this.rect!.h);
            } else {
                this.gridY = this.gridX / this.aspectRatio;
            }
            this.sizeY = this.gridY * DEFAULT_GRID_SIZE;
        }
        this.sizeX = this.gridX * DEFAULT_GRID_SIZE;
        if (!this.manualDrag && this.gridX > 0) this.preview(true);
    }

    updateGridY(): void {
        if (this.lock) {
            if (this.manualDrag) {
                this.gridX = this.gridY * (this.rect!.w / this.rect!.h);
            } else {
                this.gridX = this.gridY * this.aspectRatio;
            }
            this.sizeX = this.gridX * DEFAULT_GRID_SIZE;
        }
        this.sizeY = this.gridY * DEFAULT_GRID_SIZE;
        if (!this.manualDrag && this.gridY > 0) this.preview(true);
    }

    updateSizeX(): void {
        if (this.lock) {
            this.sizeY = this.sizeX / this.aspectRatio;
            this.gridY = this.sizeY / DEFAULT_GRID_SIZE;
        }
        this.gridX = this.sizeX / DEFAULT_GRID_SIZE;
        if (this.sizeX > 0) this.preview(true);
    }

    updateSizeY(): void {
        if (this.lock) {
            this.sizeX = this.sizeY * this.aspectRatio;
            this.gridX = this.sizeX / DEFAULT_GRID_SIZE;
        }
        this.gridY = this.sizeY / DEFAULT_GRID_SIZE;
        if (this.sizeY > 0) this.preview(true);
    }
}
</script>

<template>
    <div
        class="tool-detail map"
        v-if="selected"
        :style="{ '--detailRight': detailRight(), '--detailArrow': detailArrow }"
    >
        <template v-if="hasShape">
            <div class="row">{{ error }}</div>
            <template v-if="!hasRect && manualDrag === true">
                <div id="map-selection-choice">
                    <div>{{ $t("game.ui.tools.map.drag_to_resize") }}</div>
                    <div id="next" @click="skipManualDrag">
                        Scale full image instead
                        <font-awesome-icon icon="arrow-right" />
                    </div>
                </div>
            </template>
            <template v-else>
                <div id="map-grid">
                    <div class="explanation" v-t="'game.ui.tools.map.set_target_grid_cells'"></div>
                    <div class="map-lock" @click="toggleLock" title="(Un)lock aspect ratio">
                        <font-awesome-icon v-show="lock" icon="link" />
                        <font-awesome-icon v-show="!lock" icon="unlink" />
                    </div>
                    <label for="map-g-x" v-t="'game.ui.tools.map.horizontal'"></label>
                    <input id="map-g-x" type="number" @input="updateGridX" v-model.number="gridX" class="hinput" />
                    <label for="map-g-y" v-t="'game.ui.tools.map.vertical'"></label>
                    <input id="map-g-y" type="number" @input="updateGridY" v-model.number="gridY" class="vinput" />
                </div>
                <div id="map-separator"></div>
                <div id="map-size" v-show="!manualDrag">
                    <div class="explanation">Set target pixels</div>

                    <div class="map-lock" @click="toggleLock" title="(Un)lock aspect ratio">
                        <font-awesome-icon v-show="lock" icon="link" />
                        <font-awesome-icon v-show="!lock" icon="unlink" />
                    </div>
                    <label for="map-s-x" v-t="'game.ui.tools.map.horizontal'"></label>
                    <input id="map-s-x" type="number" @input="updateSizeX" v-model.number="sizeX" class="hinput" />
                    <label for="map-s-y" v-t="'game.ui.tools.map.vertical'"></label>
                    <input id="map-s-y" type="number" @input="updateSizeY" v-model.number="sizeY" class="vinput" />
                </div>
                <div id="map-buttons">
                    <div class="button apply" @click="apply" v-t="'game.ui.tools.map.apply'"></div>
                    <div style="width: 25px"></div>
                    <div class="button cancel" @click="removeRect" v-t="'game.ui.tools.map.cancel'"></div>
                </div>
            </template>
        </template>
        <template v-else>{{ $t("game.ui.tools.map.select_shape_msg") }}</template>
    </div>
</template>

<style scoped lang="scss">
.map {
    display: grid;
    grid-template-areas:
        "error   error   error"
        "grid    or      size"
        "buttons buttons buttons";

    #map-grid {
        grid-area: grid;
    }

    #map-size {
        grid-area: size;
    }

    #map-grid,
    #map-size {
        display: grid;
        grid-template-areas:
            "text text text"
            "hlabel hinput lock"
            "vlabel vinput lock";

        .explanation {
            grid-area: text;
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid black;
        }

        .map-lock {
            grid-area: lock;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-end;
            position: relative;
            width: 20px;

            &::before {
                content: "";
                position: absolute;
                background-color: transparent;
                border: solid 1px black;
                border-left: none;
                border-radius: 3px;
                right: 7px;
                top: 10px;
                width: 30px;
                height: 30px;
                z-index: -1;
            }

            &::after {
                content: "";
                background-color: white;
                position: absolute;
                right: 16px;
                width: 4px;
                height: 32px;
            }

            svg {
                background-color: white;
                transform: rotate(135deg);
            }
        }
    }

    #map-separator {
        grid-area: or;
    }

    #map-buttons {
        grid-area: buttons;
        justify-self: center;
        align-items: center;
        display: flex;

        .button {
            margin-top: 10px;
            margin-bottom: 5px;
            padding: 5px;
            padding-right: 8px;
            font-size: 15px;
            font-weight: bold;
            text-align: center;
            font-style: italic;
            border: solid 1px black;

            &:hover {
                font-style: normal;
                cursor: pointer;
                margin-top: 8px;
                margin-bottom: 7px;
                box-shadow: 1px 3px;
            }
        }

        .apply {
            font-weight: bold;
            box-shadow: 1px 1px 0px black;
        }

        .cancel {
            color: lightcoral;
            border-color: lightcoral;
            box-shadow: 1px 1px lightcoral;
        }
    }

    #map-selection-choice {
        display: flex;
        flex-direction: column;
        align-items: center;

        #next {
            margin-top: 7px;
            padding: 7px;
            border-radius: 7px;
            border: solid 1px #7c253e;

            &:hover {
                color: white;
                background-color: #7c253e;
                cursor: pointer;
            }
        }
    }
}

.row {
    grid-column: 1 / span 3;
}

label {
    padding: 2px;
}

input[type="number"] {
    width: 75px;
    padding: 2px;
}
</style>
