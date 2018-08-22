import { uuidv4 } from "../../core/utils";
import gameManager from "../planarally";
import { g2l, g2lr, g2ly, g2lx, g2lz } from "../units";
import store from "../store";
export default class Shape {
    constructor(refPoint, uuid) {
        // Fill colour of the shape
        this.fill = '#000';
        //The optional name associated with the shape
        this.name = 'Unknown shape';
        // Associated trackers/auras/owners
        this.trackers = [];
        this.auras = [];
        this.owners = [];
        // Block light sources
        this.visionObstruction = false;
        // Prevent shapes from overlapping with this shape
        this.movementObstruction = false;
        // Does this shape represent a playable token
        this.isToken = false;
        // Show a highlight box
        this.showHighlight = false;
        // Mouseover annotation
        this.annotation = '';
        // Draw modus to use
        this.globalCompositeOperation = "source-over";
        // Additional options for specialized uses
        this.options = new Map();
        this.refPoint = refPoint;
        this.uuid = uuid || uuidv4();
    }
    invalidate(skipLightUpdate) {
        const l = gameManager.layerManager.getLayer(this.layer);
        if (l)
            l.invalidate(skipLightUpdate);
    }
    checkLightSources() {
        const self = this;
        const vo_i = gameManager.lightblockers.indexOf(this.uuid);
        let changeBV = false;
        if (this.visionObstruction && vo_i === -1) {
            gameManager.lightblockers.push(this.uuid);
            changeBV = true;
        }
        else if (!this.visionObstruction && vo_i >= 0) {
            gameManager.lightblockers.splice(vo_i, 1);
            changeBV = true;
        }
        if (changeBV)
            gameManager.recalculateBoundingVolume();
        // Check if the lightsource auras are in the gameManager
        this.auras.forEach(function (au) {
            const ls = gameManager.lightsources;
            const i = ls.findIndex(o => o.aura === au.uuid);
            if (au.lightSource && i === -1) {
                ls.push({ shape: self.uuid, aura: au.uuid });
            }
            else if (!au.lightSource && i >= 0) {
                ls.splice(i, 1);
            }
        });
        // Check if anything in the gameManager referencing this shape is in fact still a lightsource
        for (let i = gameManager.lightsources.length - 1; i >= 0; i--) {
            const ls = gameManager.lightsources[i];
            if (ls.shape === self.uuid) {
                if (!self.auras.some(a => a.uuid === ls.aura && a.lightSource))
                    gameManager.lightsources.splice(i, 1);
            }
        }
    }
    setMovementBlock(blocksMovement) {
        this.movementObstruction = blocksMovement || false;
        const vo_i = gameManager.movementblockers.indexOf(this.uuid);
        if (this.movementObstruction && vo_i === -1)
            gameManager.movementblockers.push(this.uuid);
        else if (!this.movementObstruction && vo_i >= 0)
            gameManager.movementblockers.splice(vo_i, 1);
    }
    setIsToken(isToken) {
        this.isToken = isToken;
        const i = gameManager.ownedtokens.indexOf(this.uuid);
        if (this.isToken && i === -1)
            gameManager.ownedtokens.push(this.uuid);
        else if (!this.isToken && i >= 0)
            gameManager.ownedtokens.splice(i, 1);
    }
    ownedBy(username) {
        if (username === undefined)
            username = store.state.username;
        return store.state.IS_DM || this.owners.includes(username);
    }
    getBaseDict() {
        return {
            type: this.type,
            uuid: this.uuid,
            x: this.refPoint.x,
            y: this.refPoint.y,
            layer: this.layer,
            globalCompositeOperation: this.globalCompositeOperation,
            movementObstruction: this.movementObstruction,
            visionObstruction: this.visionObstruction,
            auras: this.auras,
            trackers: this.trackers,
            owners: this.owners,
            fill: this.fill,
            name: this.name,
            annotation: this.annotation,
            isToken: this.isToken,
            options: JSON.stringify([...this.options])
        };
    }
    fromDict(data) {
        this.layer = data.layer;
        this.globalCompositeOperation = data.globalCompositeOperation;
        this.movementObstruction = data.movementObstruction;
        this.visionObstruction = data.visionObstruction;
        this.auras = data.auras;
        this.trackers = data.trackers;
        this.owners = data.owners;
        this.isToken = data.isToken;
        if (data.annotation)
            this.annotation = data.annotation;
        if (data.name)
            this.name = data.name;
        if (data.options)
            this.options = new Map(JSON.parse(data.options));
    }
    draw(ctx) {
        if (this.globalCompositeOperation !== undefined)
            ctx.globalCompositeOperation = this.globalCompositeOperation;
        else
            ctx.globalCompositeOperation = "source-over";
        if (this.showHighlight) {
            const bbox = this.getBoundingBox();
            ctx.strokeStyle = 'red';
            ctx.strokeRect(g2lx(bbox.topLeft.x) - 5, g2ly(bbox.topLeft.y) - 5, g2lz(bbox.w) + 10, g2lz(bbox.h) + 10);
        }
        this.drawAuras(ctx);
    }
    drawAuras(ctx) {
        for (let aura of this.auras) {
            if (aura.value === 0 && aura.dim === 0)
                return;
            ctx.beginPath();
            ctx.fillStyle = aura.colour;
            const loc = g2l(this.center());
            const innerRange = g2lr(aura.value);
            ctx.arc(loc.x, loc.y, innerRange, 0, 2 * Math.PI);
            ctx.fill();
            if (aura.dim) {
                ctx.beginPath();
                if (!aura.lightSource) {
                    const tc = tinycolor(aura.colour);
                    ctx.fillStyle = tc.setAlpha(tc.getAlpha() / 2).toRgbString();
                }
                ctx.fillStyle = aura.colour;
                ctx.arc(loc.x, loc.y, g2lr(aura.value + aura.dim), 0, 2 * Math.PI);
                ctx.arc(loc.x, loc.y, innerRange, 0, 2 * Math.PI, true); // This prevents double colours
                ctx.fill();
            }
        }
    }
    getInitiativeRepr() {
        return {
            uuid: this.uuid,
            visible: !store.state.IS_DM,
            group: false,
            src: this.name,
            owners: this.owners,
            has_img: false,
            effects: [],
        };
    }
    // Code to snap a shape to the grid
    // This is shape dependent as the shape refPoints are shape specific in
    snapToGrid() { }
    ;
    resizeToGrid() { }
    ;
    resize(resizeDir, point) { }
    ;
}
//# sourceMappingURL=shape.js.map