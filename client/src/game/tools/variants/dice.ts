import type { Vector3 } from "@babylonjs/core/Maths/math";
import { type RollResult, rollString } from "@planarally/dice/core";
import type { DxSegment } from "@planarally/dice/systems/dx";
import tinycolor from "tinycolor2";
import { reactive } from "vue";

import type { LocalId } from "../../../core/id";
import { randomInterval } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { coreStore } from "../../../store/core";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
import { convertVariables, getDisplayExpression } from "../../systems/customData/utils";
import { diceSystem } from "../../systems/dice";
import { sendDiceRollResult } from "../../systems/dice/emits";
import { DiceMathError, dxMathSyntax, resolveDiceMath } from "../../systems/dice/math";
import { type ShareResultSetting, diceState } from "../../systems/dice/state";
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
    const side = Math.random() > 0.5;
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

export interface DiceRollOptions {
    // Shape that unqualified references resolve against, defaults to the focused shape
    shape?: LocalId;
    // Shown instead of the expression in the history and to other players
    label?: string;
    // Default to the player's dice tool settings
    use3d?: boolean;
    shareWith?: ShareResultSetting;
}

export interface DiceRoll {
    roll: RollResult<DxSegment>;
    // The expression shown in the history and to other players
    display: string;
    // The expression that was rolled, after resolving variables and math
    resolved: string;
    used3d: boolean;
    shareWith: ShareResultSetting;
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
        return [
            {
                name: ToolName.Select,
                features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] },
            },
        ];
    }

    // Every roll made by this player goes through here, whether it comes from the dice tool UI or a mod.
    // The input can contain variable references, these are resolved before rolling.
    async roll(input: string, options: DiceRollOptions = {}): Promise<DiceRoll> {
        if (input.trim().length === 0) {
            throw new DiceMathError(i18n.global.t("game.ui.tools.DiceTool.math_errors.empty"));
        }
        const shareWith = options.shareWith ?? diceState.raw.shareResult;
        const display = options.label ?? getDisplayExpression(input);
        const resolved = await resolveDiceMath(convertVariables(input, options.shape), dxMathSyntax);

        await diceSystem.loadSystems();
        const systems = diceState.raw.systems!;
        const thrower = (options.use3d ?? diceState.raw.dice3d !== "off") ? await diceSystem.getThrower() : undefined;

        let roll: RollResult<DxSegment>;
        if (thrower !== undefined) {
            const dieDefaults = await generate3dOptions();
            roll = await rollString(resolved, systems["3d"], { thrower, dieDefaults, d100Mode: 100 as const });
        } else {
            roll = await rollString(resolved, systems["2d"], { d100Mode: 100 as const });
        }

        if (shareWith !== "none") {
            sendDiceRollResult({
                player: coreStore.state.username,
                roll: JSON.stringify(roll),
                input: display,
                shareWith,
            });
        }

        diceSystem.addToHistory(roll, coreStore.state.username, { display, raw: input });
        diceState.mutableReactive.lastRoll = roll;

        return { roll, display, resolved, used3d: thrower !== undefined, shareWith };
    }
}

export const diceTool = new DiceTool();
