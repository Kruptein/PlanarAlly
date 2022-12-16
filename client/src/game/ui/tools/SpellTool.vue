<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { baseAdjust } from "../../../core/http";
import { selectedSystem } from "../../systems/selected";
import { SpellShape, spellTool } from "../../tools/variants/spell";

const { t } = useI18n();

const selected = spellTool.isActiveTool;
const selection = selectedSystem.$;
const shapes = Object.values(SpellShape);

const canConeBeCast = computed(() => selection.value.size > 0 && spellTool.state.range === 0);

const translationMapping = {
    [SpellShape.Square]: t("game.ui.tools.DrawTool.square"),
    [SpellShape.Circle]: t("game.ui.tools.DrawTool.circle"),
    [SpellShape.Cone]: t("game.ui.tools.DrawTool.cone"),
};

function selectShape(shape: SpellShape): void {
    spellTool.state.selectedSpellShape = shape;
    spellTool.drawShape();
}
</script>

<template>
    <div class="tool-detail" v-if="selected">
        <div class="selectgroup">
            <div
                v-for="shape in shapes"
                :key="shape"
                class="option"
                :class="{
                    'option-selected': spellTool.state.selectedSpellShape === shape,
                    disabled: !canConeBeCast && shape === SpellShape.Cone,
                }"
                @click="selectShape(shape)"
                :title="translationMapping[shape]"
            >
                <font-awesome-icon v-if="shape !== 'cone'" :icon="shape" />
                <img v-else :src="baseAdjust('static/img/cone.svg')" />
            </div>
        </div>
        <div id="grid">
            <label for="size" style="flex: 5">{{ t("game.ui.tools.SpellTool.size") }}</label>
            <input
                type="number"
                id="size"
                style="flex: 1; align-self: center"
                v-model.number="spellTool.state.size"
                min="0"
                step="5"
            />
            <label for="range" style="flex: 5" :class="{ disabled: selection.size === 0 }">
                {{ t("game.ui.tools.SpellTool.range") }}
            </label>
            <input
                type="number"
                id="range"
                style="flex: 1; align-self: center"
                min="0"
                step="5"
                v-model.number="spellTool.state.range"
                :disabled="selection.size === 0"
                :class="{ disabled: selection.size === 0 }"
            />
            <label for="colour" style="flex: 5">{{ t("common.fill_color") }}</label>
            <ColourPicker
                class="option"
                v-model:colour="spellTool.state.colour"
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
