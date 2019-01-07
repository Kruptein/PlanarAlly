import { EdgeCirculator, Point, Sign, Vertex } from "./tds";

export function cw(index: number) {
    return (index + 2) % 3;
}

export function ccw(index: number) {
    return (index + 1) % 3;
}

export function edgeInfo(va: Vertex, vb: Vertex) {
    const ec = new EdgeCirculator(va, null);
    if (ec.valid) {
        do {
            const indv = 3 - ec.t!.indexV(va) - ec.ri;
            const v = ec.t!.vertices[indv];
            if (!v.infinite) {
                if (v === vb) {
                    return { includes: true, vi: vb, fr: ec.t!, i: ec.ri };
                } else {
                    const orient = orientation(va.point!, vb.point!, v.point!);
                    if (orient === Sign.COLLINEAR && collinearBetween(va.point!, v.point!, vb.point!)) {
                        return { includes: true, vi: v, fr: ec.t!, i: ec.ri };
                    }
                }
            }
        } while (ec.next());
    }
    return { includes: false };
}

export function collinearBetween(p: Point, q: Point, r: Point): boolean {
    let cPQ: Sign;
    let cQR: Sign;
    if (compare(0, p, r) === Sign.EQUAL) {
        cPQ = compare(1, p, q);
        cQR = compare(1, q, r);
    } else {
        cPQ = compare(0, p, q);
        cQR = compare(0, q, r);
    }
    return (cPQ === Sign.SMALLER && cQR === Sign.SMALLER) || (cPQ === Sign.LARGER && cQR === Sign.LARGER);
}

function compare(index: number, a: Point, b: Point): Sign {
    if (a[index] < b[index]) return Sign.SMALLER;
    if (a[index] > b[index]) return Sign.LARGER;
    return Sign.EQUAL;
}

export function orientation(p: Point, q: Point, r: Point) {
    const px = p[0];
    const py = p[1];
    const qx = q[0];
    const qy = q[1];
    const rx = r[0];
    const ry = r[1];
    const pqx = qx - px;
    const pqy = qy - py;
    const prx = rx - px;
    const pry = ry - py;
    const det = determinant(pqx, pqy, prx, pry);
    let maxX = Math.abs(pqx);
    let maxY = Math.abs(pqy);
    const aprX = Math.abs(prx);
    const aprY = Math.abs(pry);
    if (maxX < aprX) maxX = aprX;
    if (maxY < aprY) maxY = aprY;
    if (maxX > maxY) [maxX, maxY] = [maxY, maxX];
    // underflow proection in eps computation?? Math.sqrt(Number.MIN_VALUE, Number.EPSILON)
    if (maxX < 2e-162 && maxX === 0) {
        return Sign.ZERO;
    }
    // overflow protection in det computation
    if (maxY < 1e153) {
        const eps = Number.EPSILON * maxX * maxY;
        if (det > eps) return Sign.POSITIVE;
        if (det < -eps) return Sign.NEGATIVE;
    }
    console.error("CHECK DEZE SHIT???");
    return Sign.ZERO;
}

export function determinant(a00: number, a01: number, a10: number, a11: number) {
    return a00 * a11 - a01 * a10;
}

export function hasInexactNegativeOrientation(p: Point, q: Point, r: Point) {
    return determinant(q[0] - p[0], q[1] - p[1], r[0] - p[0], r[1] - p[1]) < 0;
}
