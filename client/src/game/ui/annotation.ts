import layerManager from "@/game/layers/manager";
import Rect from "@/game/shapes/rect";
import Text from "@/game/shapes/text";
import store from "@/game/store";

import { GlobalPoint, LocalPoint } from "@/game/geom";
import { Layer } from "@/game/layers/layer";
import { l2g } from "@/game/units";

class AnnotationManager {
    annotationText: Text;
    annotationRect: Rect;
    layer: Layer | undefined;
    shown: boolean = false;

    constructor() {
        const origin = new GlobalPoint(0, 0);
        this.annotationText = new Text(origin, "", "bold 20px serif", 0, "rgba(230, 230, 230, 1)");
        this.annotationRect = new Rect(origin, 0, 0, "rgba(0, 0, 0, 0.6)");
    }

    setActiveText(text: string) {
        if (this.layer === undefined) {
            if (layerManager.hasLayer("draw")) {
                this.layer = layerManager.getLayer("draw")!;
                this.layer.addShape(this.annotationRect, false);
                this.layer.addShape(this.annotationText, false);
            } else {
                console.warn("There is no draw layer to draw annotations on!");
                return;
            }
        }
        this.shown = text !== "";
        this.annotationText.refPoint = l2g(new LocalPoint(this.layer.canvas.width / 2, 50));
        this.annotationText.text = text;
        const width = this.shown ? this.annotationText.getMaxWidth(this.layer.ctx) + 10 : 0;
        const height = this.shown ? this.annotationText.getMaxHeight(this.layer.ctx) + 10 : 0;
        this.annotationRect.refPoint = l2g(new LocalPoint(this.layer.canvas.width / 2 - width / 2, 30));
        this.annotationRect.w = width / store.zoomFactor;
        this.annotationRect.h = height / store.zoomFactor;
        this.layer.invalidate(true);
    }
}

export default AnnotationManager;
