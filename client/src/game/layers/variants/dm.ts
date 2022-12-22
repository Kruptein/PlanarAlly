import { getGameState } from "../../../store/_game";

import { Layer } from "./layer";

export class DmLayer extends Layer {
    draw(doClear = true): void {
        if (getGameState().isFakePlayer) {
            if (doClear) this.clear();
        } else {
            super.draw(doClear);
        }
    }
}
