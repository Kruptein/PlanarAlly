import type { Vector3 } from "@babylonjs/core/Maths/math";
import { type Part, type RollResult, rollString } from "@planarally/dice/core";
import tinycolor from "tinycolor2";
import { reactive } from "vue";

import type { DiceRollResult } from "../../../apiTypes";
import { randomInterval } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { coreStore } from "../../../store/core";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { diceSystem, getDiceEnvironment } from "../../systems/dice";
import { sendDiceRollResult } from "../../systems/dice/emits";
import { diceState } from "../../systems/dice/state";
import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const babMath = () => import("@babylonjs/core/Maths/math");

async function generate3dOptions(): Promise<{
    color: string;
    physics: () => {
        angular: Vector3;
        linear: Vector3;
        position: Vector3;
    };
}> {
    const targetColor = playerSettingsState.raw.rulerColour.value;
    const color = tinycolor(targetColor).toHexString();

    const xDir = Math.random();
    const yDir = Math.random();
    const side = Math.random() > 0.5 ? true : false;
    const signX = Math.random() > 0.5 ? 1 : -1;
    const signY = Math.random() > 0.5 ? 1 : -1;

    const w = (diceState.raw.dimensions3d.width / 2) * 0.85;
    const h = (diceState.raw.dimensions3d.height / 2) * 0.85;

    const powerScale = Math.min(diceState.raw.dimensions3d.height, diceState.raw.dimensions3d.width) * 0.025;

    const { Vector3 } = await babMath();

    // Aim from side to center
    const physics = (): { angular: Vector3; linear: Vector3; position: Vector3 } => {
        const position = new Vector3(signX * (side ? 0.9 * w : xDir * w), 4.5, signY * (side ? yDir * h : 0.9 * h));
        const linear = Vector3.Zero()
            .subtract(position)
            // Slightly deviate from center
            .add(new Vector3(randomInterval(0, 20) - 10, randomInterval(0, 5) - 2.5, randomInterval(0, 20) - 10))
            // Power up
            .multiplyByFloats(randomInterval(6, 9) * powerScale, 1, randomInterval(6, 9) * powerScale);
        const angular = new Vector3(linear.x / 2, 0, 0);
        return { angular, linear, position };
    };

    return {
        color,
        physics,
    };
}

class DiceTool extends Tool implements ITool {
    readonly toolName = ToolName.Dice;
    readonly toolTranslation = i18n.global.t("tool.Dice");

    state = reactive<{
        shareWithAll: boolean;
        autoRoll: boolean;
        timeouts: Record<string, number>;
    }>({
        shareWithAll: false,
        autoRoll: true,
        timeouts: {},
    });

    async onSelect(): Promise<void> {
        await diceSystem.loadSystems();
    }

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }

    async roll(input: string, use3d: boolean, shareWith: DiceRollResult["shareWith"]): Promise<RollResult<Part>> {
        let roll: RollResult<Part>;
        if (use3d) {
            const dieDefaults = await generate3dOptions();
            const { diceThrower } = await getDiceEnvironment();
            roll = await rollString(input, diceState.raw.systems!["3d"], {
                thrower: diceThrower!,
                dieDefaults,
                d100Mode: 100 as const,
            });
        } else {
            roll = await rollString(input, diceState.raw.systems!["2d"], { d100Mode: 100 as const });
        }

        if (shareWith !== "none") {
            sendDiceRollResult({
                player: coreStore.state.username,
                roll: JSON.stringify(roll),
                shareWith,
            });
        }

        diceSystem.addToHistory(roll, coreStore.state.username);

        return roll;
    }
}

export const diceTool = new DiceTool();
