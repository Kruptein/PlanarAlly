<script lang="ts">
import { computed, defineComponent, onMounted, reactive, toRef, toRefs } from "vue";
import { useI18n } from "vue-i18n";

import ColourPicker from "../../../core/components/ColourPicker.vue";
import { baseAdjust } from "../../../core/utils";
import { selectionState } from "../../layers/selection";
import { SpellShape, spellTool } from "../../tools/variants/spell";

import { useToolPosition } from "./toolPosition";

export default defineComponent({
    components: { ColourPicker },
    setup() {
        const { t } = useI18n();

        const state = reactive({
            arrow: "0px",
            right: "0px",
        });

        onMounted(() => {
            ({ right: state.right, arrow: state.arrow } = useToolPosition(spellTool.toolName));
        });

        const canConeBeCast = computed(() => selectionState.state.selection.size > 0 && spellTool.state.range === 0);

        const translationMapping = {
            [SpellShape.Square]: t("game.ui.tools.DrawTool.square"),
            [SpellShape.Circle]: t("game.ui.tools.DrawTool.circle"),
            [SpellShape.Cone]: t("game.ui.tools.DrawTool.cone"),
        };

        function selectShape(shape: SpellShape): void {
            spellTool.state.selectedSpellShape = shape;
            spellTool.drawShape();
        }

        return {
            ...toRefs(state),
            ...toRefs(spellTool.state),
            baseAdjust,
            SpellShape,
            t,
            selected: spellTool.isActiveTool,
            selection: toRef(selectionState.state, "selection"),
            shapes: Object.values(SpellShape),

            canConeBeCast,
            selectShape,
            translationMapping,
        };
    },
});
</script>

<template>
    <div class="tool-detail" v-if="selected" :style="{ '--detailRight': right, '--detailArrow': arrow }">
        <div class="selectgroup">
            <div
                v-for="shape in shapes"
                :key="shape"
                class="option"
                :class="{
                    'option-selected': selectedSpellShape === shape,
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
            <label for="size" style="flex: 5" v-t="'game.ui.tools.SpellTool.size'"></label>
            <input type="number" id="size" style="flex: 1; align-self: center" v-model.number="size" min="0" step="5" />
            <label
                for="range"
                style="flex: 5"
                v-t="'game.ui.tools.SpellTool.range'"
                :class="{ disabled: selection.size === 0 }"
            ></label>
            <input
                type="number"
                id="range"
                style="flex: 1; align-self: center"
                min="0"
                step="5"
                v-model.number="range"
                :disabled="selection.size === 0"
                :class="{ disabled: selection.size === 0 }"
            />
            <label for="colour" style="flex: 5" v-t="'common.fill_color'"></label>
            <ColourPicker
                class="option"
                v-model:colour="colour"
                :title="t('game.ui.tools.DrawTool.background_color')"
            />
            <label for="range" style="flex: 5" v-t="'game.ui.selection.edit_dialog.dialog.show_annotation'"></label>
            <button class="slider-checkbox" :aria-pressed="showPublic" @click="showPublic = !showPublic"></button>
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
