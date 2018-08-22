import { GlobalPoint } from "./geom";
import { g2l, l2g } from "./units";
import gameManager from "./planarally";
import { sendClientOptions, socket } from "./socket";
import { LocationOptions } from "./api_types";

class Settings {
    static angleSteps = 4;
    static drawAngleLines = false;
    static drawFirstLightHit = false;
    static skipPlayerFOW = false;
    static skipLightFOW = false;

    static tempFill: string = 'fog';
}

export default Settings