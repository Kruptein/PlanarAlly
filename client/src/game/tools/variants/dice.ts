// import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
// import { Vector3 } from "@babylonjs/core/Maths/math.vector";
// import type { Mesh } from "@babylonjs/core/Meshes/mesh";
// import type { Dice } from "@planarally/dice";
// import tinycolor from "tinycolor2";
import { reactive } from "vue";

// import { randomInterval } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { diceStore } from "../../dice/state";
import { ToolName } from "../../models/tools";
import type { ITool, ToolPermission } from "../../models/tools";
// import { playerSettingsState } from "../../systems/settings/players/state";
import { SelectFeatures } from "../models/select";
import { Tool } from "../tool";

class DiceTool extends Tool implements ITool {
    readonly toolName = ToolName.Dice;
    readonly toolTranslation = i18n.global.t("tool.Dice");

    state = reactive<{
        shareWithAll: boolean;
        autoRoll: boolean;
        history: { roll: string; result: string; player: string }[];
        timeouts: Record<string, number>;
    }>({
        shareWithAll: false,
        autoRoll: true,
        history: [],
        timeouts: {},
    });

    // constructor() {
    //     super();
    // watch(
    //     () => diceStore.state.showKey,
    //     async (showKey) => {
    //         if (showKey === undefined) {
    //             (await diceStore.getDiceThrower()).reset();
    //         }
    //     },
    // );
    // }

    async onSelect(): Promise<void> {
        if (!diceStore.state.loaded) {
            await diceStore.loadEnv();
        }
    }

    get permittedTools(): ToolPermission[] {
        return [{ name: ToolName.Select, features: { disabled: [SelectFeatures.Resize, SelectFeatures.Rotate] } }];
    }

    // async roll(
    //     inp: string,
    //     options?: { color?: string; startPosition?: [number, number]; throwKey: string },
    // ): Promise<string> {
    // return "";
    // if (options?.throwKey !== undefined && options.throwKey in this.state.timeouts) {
    //     clearTimeout(this.state.timeouts[options.throwKey]);
    //     delete this.state.timeouts[options.throwKey];
    // }

    // const xDir = Math.random();
    // const yDir = Math.random();
    // const side = Math.random() > 0.5 ? true : false;
    // const signX = Math.random() > 0.5 ? 1 : -1;
    // const signY = Math.random() > 0.5 ? 1 : -1;

    // const w = (diceStore.state.dimensions.width / 2) * 0.85;
    // const h = (diceStore.state.dimensions.height / 2) * 0.85;

    // const targetColor = options?.color ?? playerSettingsState.raw.rulerColour.value;
    // const color = tinycolor(targetColor).toHexString();

    // const position = new Vector3(signX * (side ? 0.9 * w : xDir * w), 4.5, signY * (side ? yDir * h : 0.9 * h));

    // // Aim from side to center
    // const linear = Vector3.Zero()
    //     .subtract(position)
    //     // Slightly deviate from center
    //     .add(new Vector3(randomInterval(0, 20) - 10, randomInterval(0, 5) - 2.5, randomInterval(0, 20) - 10))
    //     // Power up
    //     .multiplyByFloats(randomInterval(6, 9), 1, randomInterval(6, 9));
    // const dieOptions: Omit<DieOptions, "die"> = {
    //     position,
    //     linear,
    //     angular: new Vector3(linear.x / 2, 0, 0),
    //     color,
    // };

    // const parser = await diceStore.getDndParser();
    // const results = await parser.fromString(inp, dieOptions, {
    //     cb: (die, mesh) => this.addShadow(die, mesh),
    //     key: options?.throwKey,
    //     resetAllDice: false,
    // });
    // diceStore.setResults(results.key, results.data, options?.startPosition);

    // const timeoutId = window.setTimeout(() => {
    //     diceStore
    //         .getDiceThrower()
    //         .then((thrower) => {
    //             thrower.reset(results.key);
    //             delete this.state.timeouts[results.key];
    //         })
    //         .catch(() => {
    //             console.error("Failed to retrieve diceThrower instance");
    //             delete this.state.timeouts[results.key];
    //         });
    // }, 5_000);
    // this.state.timeouts[results.key] = timeoutId;

    // return results.key;
}

// addShadow(die: Dice, mesh: Mesh): void {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//     ((window as any).shadowGenerator as ShadowGenerator).addShadowCaster(mesh);
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//     ((window as any).shadowGenerator as ShadowGenerator).useCloseExponentialShadowMap = true;
// }
// }

export const diceTool = new DiceTool();
