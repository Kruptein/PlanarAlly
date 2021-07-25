import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { DiceThrower, DndParser } from "@planarally/dice";

import { i18n } from "../../../i18n";
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

        const w = diceStore.state.dimensions.width / 2;
        const h = diceStore.state.dimensions.height / 2;

        const options = {
            position: new this.vector3(signX * (side ? w : w * xDir), 3, signY * (side ? h * yDir : h)),
            linear: new this.vector3(
                -signX * Math.max(5, Math.random() * 20),
                -1,
                -signY * Math.max(5, Math.random() * 20),
            ),
            angular: new this.vector3(5, -1, 5),
        };

        const results = await diceTool.dndParser.fromString(inp, options);
        diceStore.setResults(results);
        diceStore.setIsPending(false);
        diceStore.setShowDiceResults(true);
        return results[0].total;
    }
}

export const diceTool = new DiceTool();
