import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { Dice, DiceThrower, DieOptions, DndParser } from "@planarally/dice";
import { watch } from "@vue/runtime-core";
import tinycolor from "tinycolor2";

import { randomInterval } from "../../../core/utils";
import { i18n } from "../../../i18n";
import { clientStore } from "../../../store/client";
import { diceStore } from "../../dice/state";
import { ToolName, ToolPermission } from "../../models/tools";
import { Tool } from "../tool";

import { SelectFeatures } from "./select";

// The following dynamic imports are used to prevent all dice code (@planarally/dice and babylon)
// from being loaded immediately
// Most users don't have a need for the dicethrower so it's just wasted resources to download

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const env = () => import("../../dice/environment");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const dice = () => import("@planarally/dice");
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const math = () => import("@babylonjs/core/Maths/math.vector");

class DiceTool extends Tool {
    readonly toolName = ToolName.Dice;
    readonly toolTranslation = i18n.global.t("tool.Dice");

    diceThrower!: DiceThrower;
    dndParser!: DndParser;
    vector3!: typeof Vector3;

    constructor() {
        super();
        watch(
            () => diceStore.state.showUi,
            (showUi) => {
                if (!showUi) {
                    this.diceThrower?.reset();
                }
            },
        );
    }

    async onSelect(): Promise<void> {
        if (this.diceThrower === undefined) {
            const e = await env();
            const { DndParser } = await dice();
            const { Vector3 } = await math();
            this.diceThrower = await e.loadDiceEnv();
            this.dndParser = new DndParser(this.diceThrower);
            this.vector3 = Vector3;
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

        const color = tinycolor(clientStore.state.rulerColour).toHexString();

        const position = new this.vector3(signX * (side ? w : xDir * w), 4.5, signY * (side ? yDir * h : h));

        // Aim from side to center
        const linear = this.vector3
            .Zero()
            .subtract(position)
            // Slightly deviate from center
            .add(new this.vector3(randomInterval(0, 20) - 10, randomInterval(0, 5) - 2.5, randomInterval(0, 20) - 10))
            // Power up
            .multiplyByFloats(randomInterval(3, 6), 1, randomInterval(3, 6));
        const options: Omit<DieOptions, "die"> = {
            position,
            linear,
            angular: new this.vector3(linear.x / 2, 0, 0),
            color,
        };

        console.log(options);

        const results = await diceTool.dndParser.fromString(inp, options, (die, mesh) => this.addShadow(die, mesh));
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
