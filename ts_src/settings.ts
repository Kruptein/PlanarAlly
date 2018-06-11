import { GlobalPoint } from "./geom";
import { g2l, l2g } from "./units";
import gameManager from "./planarally";
import { sendClientOptions } from "./socket";

export class Settings {
    static gridSize = 50;
    static unitSize = 5;
    static useGrid = true;
    static fullFOW = false;
    static fowOpacity = 0.3;
    static fowLOS = false;
    
    static zoomFactor = 1;
    static panX = 0;
    static panY = 0;
}

export function updateZoom(newZoomValue: number, zoomLocation: GlobalPoint) {
    if (newZoomValue <= 0.01)
        newZoomValue = 0.01;

    const oldLoc = g2l(zoomLocation);
    
    Settings.zoomFactor = newZoomValue;

    const newLoc = l2g(oldLoc);

    // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
    const diff = newLoc.subtract(zoomLocation);
    Settings.panX += diff.direction.x;
    Settings.panY += diff.direction.y;

    gameManager.layerManager.invalidate();
    sendClientOptions();
    $("#zoomer").slider({ value: newZoomValue });
}