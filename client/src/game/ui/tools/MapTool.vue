<script setup lang="ts">
import { reactive, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { map } from "../../../core/iter";
import { getShape } from "../../id";
import { DEFAULT_GRID_SIZE } from "../../systems/position/state";
import { selectedSystem } from "../../systems/selected";
import { mapTool } from "../../tools/variants/map";

const { t } = useI18n();

const state = reactive({
    lock: false,
});

const selected = mapTool.isActiveTool;
const removeRect = (): void => mapTool.removeRect();
const skipManualDrag = (): void => mapTool.skipManualDrag();

watchEffect(() => {
    if (state.lock) {
        mapTool.state.aspectRatio = mapTool.shape!.w / mapTool.shape!.h;
    }
});

watchEffect(() => {
    const selection = map(selectedSystem.$.value, (s) => getShape(s)!);
    mapTool.setSelection([...selection]);
});

function apply(): void {
    mapTool.preview(false);
    mapTool.removeRect(false);
}

function updateGridX(): void {
    if (state.lock) {
        if (mapTool.state.manualDrag) {
            mapTool.state.gridY = mapTool.state.gridX / (mapTool.rect!.w / mapTool.rect!.h);
        } else {
            mapTool.state.gridY = mapTool.state.gridX / mapTool.state.aspectRatio;
        }
        mapTool.state.sizeY = mapTool.state.gridY * DEFAULT_GRID_SIZE;
    }
    mapTool.state.sizeX = mapTool.state.gridX * DEFAULT_GRID_SIZE;
    if (!mapTool.state.manualDrag && mapTool.state.gridX > 0) mapTool.preview(true);
}

function updateGridY(): void {
    if (state.lock) {
        if (mapTool.state.manualDrag) {
            mapTool.state.gridX = mapTool.state.gridY * (mapTool.rect!.w / mapTool.rect!.h);
        } else {
            mapTool.state.gridX = mapTool.state.gridY * mapTool.state.aspectRatio;
        }
        mapTool.state.sizeX = mapTool.state.gridX * DEFAULT_GRID_SIZE;
    }
    mapTool.state.sizeY = mapTool.state.gridY * DEFAULT_GRID_SIZE;
    if (!mapTool.state.manualDrag && mapTool.state.gridY > 0) mapTool.preview(true);
}

function updateSizeX(): void {
    if (state.lock) {
        mapTool.state.sizeY = mapTool.state.sizeX / mapTool.state.aspectRatio;
        mapTool.state.gridY = mapTool.state.sizeY / DEFAULT_GRID_SIZE;
    }
    mapTool.state.gridX = mapTool.state.sizeX / DEFAULT_GRID_SIZE;
    if (mapTool.state.sizeX > 0) mapTool.preview(true);
}

function updateSizeY(): void {
    if (state.lock) {
        mapTool.state.sizeX = mapTool.state.sizeY * mapTool.state.aspectRatio;
        mapTool.state.gridX = mapTool.state.sizeX / DEFAULT_GRID_SIZE;
    }
    mapTool.state.gridY = mapTool.state.sizeY / DEFAULT_GRID_SIZE;
    if (mapTool.state.sizeY > 0) mapTool.preview(true);
}
</script>
<template>
    <div v-if="selected" class="tool-detail map">
        <template v-if="mapTool.state.hasShape">
            <div class="row">{{ mapTool.state.error }}</div>
            <template v-if="!mapTool.state.hasRect && mapTool.state.manualDrag === true">
                <div id="map-selection-choice">
                    <div>{{ t("game.ui.tools.MapTool.drag_to_resize") }}</div>
                    <div id="next" @click="skipManualDrag">
                        Scale full image instead
                        <font-awesome-icon icon="arrow-right" />
                    </div>
                </div>
            </template>
            <template v-else>
                <div id="map-grid">
                    <div class="explanation">{{ t("game.ui.tools.MapTool.set_target_grid_cells") }}</div>
                    <div class="map-lock" title="(Un)lock aspect ratio" @click="state.lock = !state.lock">
                        <font-awesome-icon v-if="state.lock" icon="link" />
                        <font-awesome-icon v-else icon="unlink" />
                    </div>
                    <label for="map-g-x">{{ t("game.ui.tools.MapTool.horizontal") }}</label>
                    <input
                        id="map-g-x"
                        v-model.number="mapTool.state.gridX"
                        type="number"
                        class="hinput"
                        @input="updateGridX"
                    />
                    <label for="map-g-y">{{ t("game.ui.tools.MapTool.vertical") }}</label>
                    <input
                        id="map-g-y"
                        v-model.number="mapTool.state.gridY"
                        type="number"
                        class="vinput"
                        @input="updateGridY"
                    />
                </div>
                <div id="map-separator"></div>
                <div v-show="!mapTool.state.manualDrag" id="map-size">
                    <div class="explanation">Set target pixels</div>

                    <div class="map-lock" title="(Un)lock aspect ratio" @click="state.lock = !state.lock">
                        <font-awesome-icon v-if="state.lock" icon="link" />
                        <font-awesome-icon v-else icon="unlink" />
                    </div>
                    <label for="map-s-x">{{ t("game.ui.tools.MapTool.horizontal") }}</label>
                    <input
                        id="map-s-x"
                        v-model.number="mapTool.state.sizeX"
                        type="number"
                        class="hinput"
                        @input="updateSizeX"
                    />
                    <label for="map-s-y">{{ t("game.ui.tools.MapTool.vertical") }}</label>
                    <input
                        id="map-s-y"
                        v-model.number="mapTool.state.sizeY"
                        type="number"
                        class="vinput"
                        @input="updateSizeY"
                    />
                </div>
                <div id="map-buttons">
                    <div class="button apply" @click="apply">{{ t("game.ui.tools.MapTool.apply") }}</div>
                    <div style="width: 25px"></div>
                    <div class="button cancel" @click="removeRect">{{ t("game.ui.tools.MapTool.cancel") }}</div>
                </div>
            </template>
        </template>
        <template v-else>{{ t("game.ui.tools.MapTool.select_shape_msg") }}</template>
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
