import { GlobalPoint } from "./geom";
import { g2l, l2g } from "./units";
import gameManager from "./planarally";
import { sendClientOptions, socket } from "./socket";
import { LocationOptions } from "./api_types";

class Settings {
    static gridSize = 50;
    static unitSize = 5;
    static useGrid = true;
    static fullFOW = false;
    static fowOpacity = 0.3;
    static fowLOS = false;
    
    static zoomFactor = 1;
    static panX = 0;
    static panY = 0;

    static angleSteps = 4;
    static drawAngleLines = false;
    static drawFirstLightHit = false;
    static skipPlayerFOW = false;
    static skipLightFOW = false;

    static IS_DM = false;
    static board_initialised = false;
    static roomName: string;
    static roomCreator: string;
    static locationName: string;
    static username: string;

    static tempFill: string = 'fog';

    static setOptions(options: LocationOptions): void {
        if ("unitSize" in options)
            this.setUnitSize(options.unitSize, false);
        if ("useGrid" in options)
            this.setUseGrid(options.useGrid, false);
        if ("fullFOW" in options)
            this.setFullFOW(options.fullFOW, false);
        if ('fowOpacity' in options)
            this.setFOWOpacity(options.fowOpacity, false);
        if ("fowColour" in options)
            gameManager.fowColour.spectrum("set", options.fowColour);
        if ("fowLOS" in options)
            this.setLineOfSight(options.fowLOS, false);
    }

    static setGridSize(gridSize: number, sync: boolean): void {
        if (this.gridSize !== gridSize) {
            this.gridSize = gridSize;
            if(gameManager.layerManager.getGridLayer() !== undefined)
                gameManager.layerManager.getGridLayer()!.drawGrid();
            $('#gridSizeInput').val(gridSize);
            if(sync)
                socket.emit("set gridsize", gridSize);
        }
    }

    static setUnitSize(unitSize: number, sync: boolean): void {
        if (unitSize !== this.unitSize) {
            this.unitSize = unitSize;
            if(gameManager.layerManager.getGridLayer() !== undefined)
                gameManager.layerManager.getGridLayer()!.drawGrid();
            $('#unitSizeInput').val(unitSize);
            if(sync)
                socket.emit("set locationOptions", { 'unitSize': unitSize });
        }
    }
    
    static setUseGrid(useGrid: boolean, sync: boolean): void {
        if (useGrid !== this.useGrid) {
            this.useGrid = useGrid;
            if (useGrid)
                $('#grid-layer').show();
            else
                $('#grid-layer').hide();
            $('#useGridInput').prop("checked", useGrid);
            if (sync)
                socket.emit("set locationOptions", { 'useGrid': useGrid });
        }
    }
    
    static setFullFOW(fullFOW: boolean, sync: boolean): void {
        if (fullFOW !== this.fullFOW) {
            this.fullFOW = fullFOW;
            gameManager.layerManager.invalidateLight();
            $('#useFOWInput').prop("checked", fullFOW);
            if (sync)
                socket.emit("set locationOptions", { 'fullFOW': fullFOW });
        }
    }
    
    static setFOWOpacity(fowOpacity: number, sync: boolean): void {
        this.fowOpacity = fowOpacity;
        gameManager.layerManager.invalidateLight();
        $('#fowOpacity').val(fowOpacity);
        if (sync)
            socket.emit("set locationOptions", { 'fowOpacity': fowOpacity });
    }
    
    static setLineOfSight(fowLOS: boolean, sync: boolean) {
        if (fowLOS !== this.fowLOS) {
            this.fowLOS = fowLOS;
            $('#fowLOS').prop("checked", fowLOS);
            gameManager.layerManager.invalidate();
            if (sync)
                socket.emit("set locationOptions", { 'fowLOS': fowLOS });
        }
    }
    
    static updateZoom(newZoomValue: number, zoomLocation: GlobalPoint) {
        if (newZoomValue <= 0.01)
            newZoomValue = 0.01;
    
        const oldLoc = g2l(zoomLocation);
        
        this.zoomFactor = newZoomValue;
    
        const newLoc = l2g(oldLoc);
    
        // Change the pan settings to keep the zoomLocation in the same exact location before and after the zoom.
        const diff = newLoc.subtract(zoomLocation);
        this.panX += diff.x;
        this.panY += diff.y;
    
        gameManager.layerManager.invalidate();
        sendClientOptions();
        $("#zoomer").slider({ value: newZoomValue });
    }
}

export default Settings