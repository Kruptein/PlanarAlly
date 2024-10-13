<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { GridType } from "../../../core/grid";
import { baseAdjust } from "../../../core/http";
import { selectedState } from "../../systems/selected/state";
import { locationSettingsState } from "../../systems/settings/location/state";
import { SpellShape, spellTool } from "../../tools/variants/spell";

const { t } = useI18n();

const selected = spellTool.isActiveTool;

const isHexGrid = computed(() => locationSettingsState.reactive.gridType.value !== GridType.Square);

const shapes = computed(() =>
    isHexGrid.value ? [SpellShape.Hex] : [SpellShape.Square, SpellShape.Circle, SpellShape.Cone],
);

const canConeBeCast = computed(() => selectedState.reactive.selected.size > 0);

const translationMapping = {
    [SpellShape.Square]: t("game.ui.tools.DrawTool.square"),
    [SpellShape.Circle]: t("game.ui.tools.DrawTool.circle"),
    [SpellShape.Cone]: t("game.ui.tools.DrawTool.cone"),
    [SpellShape.Hex]: t("game.ui.tools.DrawTool.square"),
};

const stepSize = computed(() => {
    if (isHexGrid.value && spellTool.state.selectedSpellShape === SpellShape.Hex) {
        return 1;
    }
    return 5;
});

async function selectShape(shape: SpellShape): Promise<void> {
    spellTool.state.selectedSpellShape = shape;
    await spellTool.drawShape();
}
</script>

<template>
    <div v-if="selected" class="tool-detail">
        <div v-if="!isHexGrid" class="selectgroup">
            <div
                v-for="shape in shapes"
                :key="shape"
                class="option"
                :class="{
                    'option-selected': spellTool.state.selectedSpellShape === shape,
                    disabled: !canConeBeCast && shape === SpellShape.Cone,
                }"
                :title="translationMapping[shape]"
                @click="selectShape(shape)"
            >
                <font-awesome-icon v-if="shape !== 'cone'" :icon="shape" />
                <img v-else :src="baseAdjust('static/img/cone.svg')" />
            </div>
        </div>
        <div id="grid">
            <label for="size" style="flex: 5">{{ t("game.ui.tools.SpellTool.size") }}</label>
            <input
                id="size"
                v-model.number="spellTool.state.size"
                type="number"
                style="flex: 1; align-self: center"
                min="0"
                :step="stepSize"
            />
            <template v-if="isHexGrid">
                <label for="oddHexOrientation" style="flex: 5">Odd Hex Orientation</label>
                <input
                    id="oddHexOrientation"
                    v-model.number="spellTool.state.oddHexOrientation"
                    type="checkbox"
                    style="flex: 1; align-self: center"
                />
            </template>
            <label for="colour" style="flex: 5">{{ t("common.fill_color") }}</label>
            <ColourPicker
                v-model:colour="spellTool.state.colour"
                class="option"
                :title="t('game.ui.tools.DrawTool.background_color')"
            />
            <label for="public" style="flex: 5">{{ t("game.ui.selection.edit_dialog.dialog.show_annotation") }}</label>
            <button
                id="public"
                class="slider-checkbox"
                :aria-pressed="spellTool.state.showPublic"
                @click="spellTool.state.showPublic = !spellTool.state.showPublic"
            ></button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.option {
    padding: 6px;
    border: solid 1px #82c8a0;
    border-radius: 0;
    flex: 1 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
    min-width: 25px;

    img {
        width: 1.25em;
    }
}

.option-selected,
.option:hover {
    background-color: #82c8a0;
    cursor: pointer;
}

.selectgroup {
    display: flex;
    margin-bottom: 10px;

    > .option:first-of-type {
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
    }

    > .option:last-of-type {
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
    }
}

#grid {
    display: grid;
    grid-template-columns: 1fr 0.5fr;
    row-gap: 5px;
    align-items: center;
}

.disabled {
    /* the cone svg is not inlined so just setting color does not work */
    filter: invert(52%) sepia(18%) saturate(268%) hue-rotate(173deg) brightness(92%) contrast(87%);
    cursor: not-allowed;

    &:hover,
    &:hover * {
        cursor: not-allowed;
        background-color: inherit;
    }
}
</style>

<style scoped lang="scss">
.tool-detail {
    display: block;
}
</style>
