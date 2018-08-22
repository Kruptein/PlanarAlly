import BaseRect from "./baserect";
import { g2lx, g2ly, g2lz } from "../units";
import store from "../store";
export default class Asset extends BaseRect {
    constructor(img, topleft, w, h, uuid) {
        super(topleft, w, h);
        this.type = "asset";
        this.src = '';
        if (uuid !== undefined)
            this.uuid = uuid;
        this.img = img;
    }
    asDict() {
        return Object.assign(this.getBaseDict(), {
            src: this.src
        });
    }
    fromDict(data) {
        super.fromDict(data);
        this.src = data.src;
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.drawImage(this.img, g2lx(this.refPoint.x), g2ly(this.refPoint.y), g2lz(this.w), g2lz(this.h));
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !store.state.IS_DM,
            group: false,
            src: this.src,
            owners: this.owners,
            has_img: true,
            effects: [],
        };
    }
}
//# sourceMappingURL=asset.js.map