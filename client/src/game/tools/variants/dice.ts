import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Dice, DieOptions } from "@planarally/dice";
import tinycolor from "tinycolor2";
import { reactive, watch } from "vue";

import { randomInterval } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { diceStore } from "../../dice/state";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class DiceTool extends Tool {
    readonly toolName = ToolName.Dice;
    readonly toolTranslation = i18n.global.t("tool.Dice");

    state = reactive<{
        shareWithAll: boolean;
        autoRoll: boolean;
        history: { roll: string; result: number; player: string }[];
    }>({
        shareWithAll: false,
        autoRoll: true,
        history: [],
    });

    constructor() {
        super();
        watch(
            () => diceStore.state.showUi,
            async (showUi) => {
                if (!showUi) {
                    (await diceStore.getDiceThrower()).reset();
                }
            },
        );
    }

    async onSelect(): Promise<void> {
        if (diceStore.state.loaded === false) {
            await diceStore.loadEnv();
        }
    }

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }

    async roll(inp: string): Promise<number> {
        diceStore.setIsPending(true);
        const xDir = Math.random();
        const yDir = Math.random();
        const side = Math.random() > 0.5 ? true : false;
        const signX = Math.random() > 0.5 ? 1 : -1;
        const signY = Math.random() > 0.5 ? 1 : -1;

        const w = (diceStore.state.dimensions.width / 2) * 0.85;
        const h = (diceStore.state.dimensions.height / 2) * 0.85;

        const color = tinycolor(playerSettingsState.raw.rulerColour.value).toHexString();

        const position = new Vector3(signX * (side ? w : xDir * w), 4.5, signY * (side ? yDir * h : h));

        // Aim from side to center
        const linear = Vector3.Zero()
            .subtract(position)
            // Slightly deviate from center
            .add(new Vector3(randomInterval(0, 20) - 10, randomInterval(0, 5) - 2.5, randomInterval(0, 20) - 10))
            // Power up
            .multiplyByFloats(randomInterval(3, 6), 1, randomInterval(3, 6));
        const options: Omit<DieOptions, "die"> = {
            position,
            linear,
            angular: new Vector3(linear.x / 2, 0, 0),
            color,
        };

        const parser = await diceStore.getDndParser();
        const results = await parser.fromString(inp, options, (die, mesh) => this.addShadow(die, mesh));
        diceStore.setResults(results);
        diceStore.setIsPending(false);
        diceStore.setShowDiceResults(true);
        return results[0].total;
    }

    addShadow(die: Dice, mesh: Mesh): void {
        ((window as any).shadowGenerator as ShadowGenerator).addShadowCaster(mesh);
        ((window as any).shadowGenerator as ShadowGenerator).useExponentialShadowMap = true;
    }
}

export const diceTool = new DiceTool();
