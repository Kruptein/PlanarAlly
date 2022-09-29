import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Dice, DieOptions } from "@planarally/dice";
import tinycolor from "tinycolor2";
import { reactive, watch } from "vue";

import { randomInterval } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { coreStore } from "../../../store/core";
import { diceStore } from "../../dice/state";
import { ToolName } from "../../models/tools";
import type { ToolPermission } from "../../models/tools";
import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

const hasGameboard = coreStore.state.boardId !== undefined;

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
            () => diceStore.state.showKey,
            async (showKey) => {
                if (showKey === undefined) {
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

    async roll(
        inp: string,
        options?: { color?: string; startPosition?: [number, number]; throwKey: string },
    ): Promise<string> {
        if (!hasGameboard) diceStore.setIsPending(true);
        const xDir = Math.random();
        const yDir = Math.random();
        const side = Math.random() > 0.5 ? true : false;
        const signX = Math.random() > 0.5 ? 1 : -1;
        const signY = Math.random() > 0.5 ? 1 : -1;

        const w = (diceStore.state.dimensions.width / 2) * 0.85;
        const h = (diceStore.state.dimensions.height / 2) * 0.85;

        const targetColor = options?.color ?? playerSettingsState.raw.rulerColour.value;
        const color = tinycolor(targetColor).toHexString();

        let position = new Vector3(signX * (side ? 0.9 * w : xDir * w), 4.5, signY * (side ? yDir * h : 0.9 * h));
        /*
        babylon:
        (maxX, minY)   (minX, minY)
                    0,0
        (maxX, maxY)   (minX, maxY)

        gameboard:
        (0, 0)   (1, 0)
        (0, 1)   (1, 1)
        */
        if (hasGameboard && options?.startPosition !== undefined) {
            if (options.startPosition[0] === undefined || options.startPosition[1] === undefined) {
                console.error("DICE ROLL START_POSITION WAS PASSED BUT INVALID");
            } else {
                position = new Vector3(
                    2 * w * (0.5 - options.startPosition[0]),
                    4.5,
                    2 * h * (options.startPosition[1] - 0.5),
                );
            }
        }

        // Aim from side to center
        const linear = Vector3.Zero()
            .subtract(position)
            // Slightly deviate from center
            .add(new Vector3(randomInterval(0, 20) - 10, randomInterval(0, 5) - 2.5, randomInterval(0, 20) - 10))
            // Power up
            .multiplyByFloats(randomInterval(3, 6), 1, randomInterval(3, 6));
        const dieOptions: Omit<DieOptions, "die"> = {
            position,
            linear,
            angular: hasGameboard
                ? new Vector3(randomInterval(-3, 3), randomInterval(-3, 3), randomInterval(-3, 3))
                : new Vector3(linear.x / 2, 0, 0),
            color,
        };

        const parser = await diceStore.getDndParser();
        const results = await parser.fromString(inp, dieOptions, {
            cb: (die, mesh) => this.addShadow(die, mesh),
            key: options?.throwKey,
            resetAllDice: false,
        });
        window.GameboardAnalytics?.sendEvent("DICE_ROLL_RESULTS", JSON.stringify(results));
        diceStore.setResults(results.key, results.data, options?.startPosition);
        if (!hasGameboard) {
            diceStore.setIsPending(false);
            diceStore.setShowDiceResults(results.key);
        }
        setTimeout(async () => (await diceStore.getDiceThrower()).reset(results.key), 10_000);

        return results.key;
    }

    addShadow(die: Dice, mesh: Mesh): void {
        ((window as any).shadowGenerator as ShadowGenerator).addShadowCaster(mesh);
        ((window as any).shadowGenerator as ShadowGenerator).useExponentialShadowMap = true;
    }
}

export const diceTool = new DiceTool();
