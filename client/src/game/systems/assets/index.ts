import type { AssetEntryId } from "../../../assets/models";
import { registerSystem } from "../../../core/systems";
import type { System } from "../../../core/systems/models";

import { sendAssetShortcutAdd, sendAssetShortcutRemove } from "./emits";
import { assetGameState } from "./state";

const { mutableReactive: $ } = assetGameState;

class AssetGameSystem implements System {
    clear(): void {
        $.managerOpen = false;
        $.shortcuts = [];
    }

    addShortcut(id: AssetEntryId): void {
        $.shortcuts.push(id);
        sendAssetShortcutAdd(id);
    }

    removeShortcut(id: AssetEntryId): void {
        $.shortcuts = $.shortcuts.filter((i) => i !== id);
        sendAssetShortcutRemove(id);
    }
}

export const assetGameSystem = new AssetGameSystem();
registerSystem("assetGame", assetGameSystem, false, assetGameState);
