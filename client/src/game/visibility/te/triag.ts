import { EdgeCirculator, Triangle, Vertex } from "./tds";

export function edgeInfo(va: Vertex, vb: Vertex) {
    const ec = new EdgeCirculator(va, null);
    if (ec.valid) {
        do {
            const indv = 3 - ec.t!.index(va) - ec.ri;
            const v = ec.t!.vertices[indv];
            if (!v.infinite) {
                if (v === vb) {
                    return { includes: true, vi: vb, fr: ec.t!, i: ec.ri };
                }
            }
        } while (ec.next());
    }
    return { includes: false };
}
