import { GlobalPoint, LocalPoint } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { layerManager } from "@/game/layers/manager";
import { Rect } from "@/game/shapes/rect";
import { Text } from "@/game/shapes/text";
import { gameStore } from "@/game/store";
import { l2g } from "@/game/units";
import { SyncMode, InvalidationMode } from "@/core/comm/types";

export class AnnotationManager {
    annotationText: Text;
    annotationRect: Rect;
    layer: Layer | undefined;
    shown = false;

    constructor() {
        const origin = new GlobalPoint(0, 0);
        this.annotationText = new Text(origin, "", "bold 20px serif", 0, "rgba(230, 230, 230, 1)");
        this.annotationRect = new Rect(origin, 0, 0, "rgba(0, 0, 0, 0.6)");
    }

    setActiveText(text: string): void {
        if (layerManager.hasLayer(layerManager.floor!.name, "draw")) {
            this.layer = layerManager.getLayer(layerManager.floor!.name, "draw")!;
            this.layer.addShape(this.annotationRect, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
            this.layer.addShape(this.annotationText, SyncMode.NO_SYNC, InvalidationMode.NORMAL);
        } else {
            console.warn("There is no draw layer to draw annotations on!");
            return;
        }
        this.shown = text !== "";
        this.annotationText.refPoint = l2g(new LocalPoint(this.layer.canvas.width / 2, 50));
        this.annotationText.text = text;
        const width = this.shown ? this.annotationText.getMaxWidth(this.layer.ctx) + 10 : 0;
        const height = this.shown ? this.annotationText.getMaxHeight(this.layer.ctx) + 10 : 0;
        this.annotationRect.refPoint = l2g(new LocalPoint(this.layer.canvas.width / 2 - width / 2, 30));
        this.annotationRect.w = width / gameStore.zoomFactor;
        this.annotationRect.h = height / gameStore.zoomFactor;
        this.layer.invalidate(true);
    }
}
