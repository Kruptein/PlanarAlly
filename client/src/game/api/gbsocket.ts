import { l2g } from "../../core/conversions";
import type { GlobalPoint } from "../../core/geometry";
import { toLP } from "../../core/geometry";
import { lastGameboardStore } from "../../store/lastGameboard";
import type { TokMessage } from "../models/lg";

function fromLGtoPA(points: [number, number]): GlobalPoint {
    return l2g(toLP(points[0] * 2560, points[1] * 2560));
}

const TOK_SESSION: Map<number, TokMessage> = new Map();

(window as any).onTokMessageReceived = (data: any) => {
    const messages: TokMessage[] = JSON.parse(data);
    for (const msg of messages) {
        const sId = msg.sessionId;
        const tId = msg.typeId;
        const lastMsg = TOK_SESSION.get(sId);
        TOK_SESSION.set(sId, msg);
        lastGameboardStore.linkSession(sId, tId);
        const position = fromLGtoPA([msg.positionX, msg.positionY]);
        if (lastMsg === undefined) {
            const attachShape = lastGameboardStore.canAttach(position, tId);
            if (attachShape !== null) {
                lastGameboardStore.addLgShape(tId, attachShape.id, true);
                return;
            }
        }
        if (lastGameboardStore.isTokenShape(tId)) {
            if (
                lastMsg === undefined ||
                Math.round(100 * lastMsg.positionX) !== Math.round(100 * msg.positionX) ||
                Math.round(100 * lastMsg.positionY) !== Math.round(100 * msg.positionY)
            ) {
                lastGameboardStore.moveLgShape(sId, position);
            }
            if (lastMsg === undefined || Math.round(10 * lastMsg.angle) !== Math.round(10 * msg.angle)) {
                lastGameboardStore.rotateShape(sId, msg.angle);
            }
        }
        //  else if (lastGameboardStore.isSpawnToken(tId)) {
        //     lastGameboardStore.spawnShape(tId, position);
        // } else if (lastGameboardStore.isContourShape(tId)) {
        //     if (
        //         lastMsg === undefined ||
        //         Math.round(100 * lastMsg.positionX) !== Math.round(100 * msg.positionX) ||
        //         Math.round(100 * lastMsg.positionY) !== Math.round(100 * msg.positionY)
        //     ) {
        //         lastGameboardStore.moveLgShape(sId, position);
        //     }
        //     if (lastMsg === undefined || Math.round(10 * lastMsg.angle) !== Math.round(10 * msg.angle)) {
        //         lastGameboardStore.rotateShape(sId, msg.angle);
        //     }
        // } else {
        //     // ssts("Creating wall shape");
        //     lastGameboardStore.createContourShape(tId);
        // }
    }
};
