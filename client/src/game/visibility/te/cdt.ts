import { EdgeCirculator, LocateType, Point, Sign, TDS, Triangle, Vertex, FaceCirculator } from "./tds";
import { collinearBetween, edgeInfo, ccw, orientation, hasInexactNegativeOrientation, cw } from "./triag";

export class CDT {
    tds: TDS;
    constructor() {
        this.tds = new TDS();
        (<any>window).TDS = this.tds;
    }
    insertConstraint(a: Point, b: Point) {
        const va = this.insert(a);
        const vb = this.insert(b);
        if (va !== vb) this.insertConstraintV(va, vb);
    }

    insertConstraintV(va: Vertex, vb: Vertex) {
        const stack = [[va, vb]];
        while (stack.length > 0) {
            const v = stack.pop()!;
            const info = edgeInfo(v[0], v[1]);
            if (info.includes) {
                this.markConstraint(info.fr!, info.i!);
                if (info.vi! !== v[1]) {
                    stack.push([info.vi!, v[1]]);
                }
                continue;
            }
        }
    }

    updateConstraintsOpposite(v: Vertex) {
        let t = v.triangle!;
        const start = t;
        let indf: number;
        do {
            indf = t.indexV(v);
            if (t.neighbours[indf]!.constraints[this.tds.mirrorIndex(t, indf)]) t.constraints[indf] = true;
            else t.constraints[indf] = false;
            t = t.neighbours[ccw(indf)]!;
        } while (t !== start);
    }

    markConstraint(t: Triangle, i: number) {
        if (this.tds.dimension === 1) t.constraints[2] = true;
        else {
            t.constraints[i] = true;
            t.neighbours[i]!.constraints[this.tds.mirrorIndex(t, i)] = true;
        }
    }

    insert(p: Point, start: Triangle | null = null) {
        const locateInfo = this.locate(p, this.iLocate(p, start));
        const va = this.insertb(p, locateInfo.loc, locateInfo.lt, locateInfo.li);
        this.flipAround(va);
        return va;
    }

    flipAround(v: Vertex) {
        if (this.tds.dimension <= 1) return;
        let t = v.triangle!;
        let i: number;
        let next: Triangle;
        const start = t;
        do {
            i = t.indexV(v);
            next = t.neighbours[ccw(i)]!;
            this.propagatingFlip(t, i);
            t = next;
        } while (next !== start);
    }

    propagatingFlip(t: Triangle, i: number, depth = 0) {
        if (!this.isFlipable(t, i)) return;
    }

    isFlipable(t: Triangle, i: number, perturb = true) {
        const ni = t.neighbours[i]!;
        if (t.isInfinite() || ni.isInfinite()) return false;
        if (t.constraints[i]) return false;
        throw new Error("Circle stuff");
    }

    insertb(a: Point, loc: Triangle | null, lt: LocateType, li: number): Vertex {
        let insertInConstrainedEdge = false;
        if (lt === LocateType.EDGE && loc!.isConstrained(li)) {
            insertInConstrainedEdge = true;
        }
        const va = this.insertc(a, loc, lt, li);
        if (insertInConstrainedEdge) console.log(0);
        else if (lt !== LocateType.VERTEX) this.clearConstraintsIncident(va);
        if (this.tds.dimension === 2) this.updateConstraintsOpposite(va);
        return va;
    }

    clearConstraintsIncident(v: Vertex) {
        const ec = new EdgeCirculator(v, null);
        if (ec.valid) {
            do {
                const t = ec.t!;
                const indf = ec.ri;
                t.constraints[indf] = false;
                if (this.tds.dimension === 2) t.neighbours[indf]!.constraints[this.tds.mirrorIndex(t, indf)] = false;
            } while (ec.next());
        }
    }

    insertc(p: Point, loc: Triangle | null, lt: LocateType, li: number): Vertex {
        if (this.tds.vertices.length === 1) {
            return this.insertFirst(p);
        } else if (this.tds.vertices.length === 2) {
            if (lt === LocateType.VERTEX) return this.tds.finiteVertex;
            else return this.insertSecond(p);
        }
        switch (lt) {
            case LocateType.VERTEX: {
                return loc!.vertices[li];
            }
            case LocateType.OUTSIDE_AFFINE_HULL: {
                return this.insertOutsideAffineHull(p);
            }
            case LocateType.OUTSIDE_CONVEX_HULL: {
                return this.insertOutsideConvexHull(p, loc!);
            }
        }
        throw new Error("qwe");
        return new Vertex();
    }

    insertFirst(p: Point): Vertex {
        const v = this.tds.insertDimUp();
        v.point = p;
        return v;
    }

    insertSecond(p: Point): Vertex {
        const v = this.tds.insertDimUp(this.tds._infinite, true);
        v.point = p;
        return v;
    }

    insertOutsideAffineHull(p: Point): Vertex {
        let conform = false;
        if (this.tds.dimension === 1) {
            const t = this.tds.finiteEdge.first!;
            const orient = orientation(t.vertices[0].point!, t.vertices[1].point!, p);
            conform = orient === Sign.COUNTERCLOCKWISE;
        }
        const v = this.tds.insertDimUp(this.tds._infinite, conform);
        v.point = p;
        return v;
    }

    insertOutsideConvexHull(p: Point, t: Triangle): Vertex {
        let v: Vertex;
        if (this.tds.dimension === 1) {
            throw new Error("sdfasdasd");
        } else {
            v = this.insertOutsideConvexHull2(p, t);
        }
        v.point = p;
        return v;
    }

    insertOutsideConvexHull2(p: Point, t: Triangle): Vertex {
        let li = t.indexV(this.tds._infinite);
        const ccwlist: Triangle[] = [];
        const cwlist: Triangle[] = [];
        let fc = new FaceCirculator(this.tds._infinite, t);
        let done = false;
        while (!done) {
            fc.prev();
            li = fc.t!.indexV(this.tds._infinite);
            const q = fc.t!.vertices[ccw(li)].point!;
            const r = fc.t!.vertices[cw(li)].point!;
            if (orientation(p, q, r) === Sign.LEFT_TURN) ccwlist.push(fc.t!);
            else done = true;
        }
        fc = new FaceCirculator(this.tds._infinite, t);
        done = false;
        while (!done) {
            fc.next();
            li = fc.t!.indexV(this.tds._infinite);
            const q = fc.t!.vertices[ccw(li)].point!;
            const r = fc.t!.vertices[cw(li)].point!;
            if (orientation(p, q, r) === Sign.LEFT_TURN) cwlist.push(fc.t!);
            else done = true;
        }
        const v = this.tds.insertInFace(t);
        v.point = p;
        let th;
        while (ccwlist.length > 0) {
            th = ccwlist[0];
            li = ccw(th.indexV(this.tds._infinite));
            throw new Error("flipi");
            // this.tds.flip(th, li);
            ccwlist.shift();
        }
        while (cwlist.length > 0) {
            th = cwlist[0];
            li = cw(th.indexV(this.tds._infinite));
            throw new Error("flipi");
            // this.tds.flip(th, li);
            cwlist.shift();
        }
        fc = new FaceCirculator(v, null);
        while (!fc.t!.isInfinite()) fc.next();
        this.tds._infinite.triangle = fc.t!;
        return v;
    }

    locate(p: Point, start: Triangle | null) {
        let lt = 0;
        let li = 0;
        if (this.tds.dimension < 0) {
            lt = LocateType.OUTSIDE_AFFINE_HULL;
            li = 4;
            return { loc: null, lt, li };
        } else if (this.tds.dimension === 0) {
            if (this.xyEqual(p, this.tds.finiteVertex.triangle!.vertices[0].point!)) {
                lt = LocateType.VERTEX;
            } else {
                lt = LocateType.OUTSIDE_AFFINE_HULL;
            }
            li = 4;
            return { loc: null, lt, li };
        } else if (this.tds.dimension === 1) {
            return this.marchLocate1D(p);
        }
        if (start === null) {
            const t = this.tds._infinite.triangle!;
            start = t.neighbours[t.indexV(this.tds._infinite)]!;
        } else if (start.isInfinite()) {
            start = start.neighbours[start.indexV(this.tds._infinite)]!;
        }
        return this.marchLocate2D(start, p);
    }

    marchLocate1D(p: Point) {
        const ff = this.tds._infinite.triangle!;
        const iv = ff.indexV(this.tds._infinite);
        const t = ff.neighbours[iv]!;
        const pqt = orientation(t.vertices[0].point!, t.vertices[1].point!, p);
        if (pqt === Sign.RIGHT_TURN || pqt === Sign.LEFT_TURN) {
            return { loc: new Triangle(), lt: LocateType.OUTSIDE_AFFINE_HULL, li: 4 };
        }
        const i = t.indexT(ff);
        if (collinearBetween(p, t.vertices[1 - i].point!, t.vertices[i].point!))
            return { loc: ff, lt: LocateType.OUTSIDE_CONVEX_HULL, li: iv };

        if (this.xyEqual(p, t.vertices[1 - i].point!)) return { loc: t, lt: LocateType.VERTEX, li: 1 - i };
        throw new Error("sdfsdf");
    }

    marchLocate2D(c: Triangle, p: Point) {
        let prev = null;
        let first = true;
        let lt: LocateType | undefined;
        let li: number | undefined;
        while (true) {
            if (c.isInfinite()) {
                return { loc: c, lt: LocateType.OUTSIDE_CONVEX_HULL, li: c.indexV(this.tds._infinite) };
            }
            const leftFirst = Math.round(Math.random());
            const p0 = c.vertices[0].point!;
            const p1 = c.vertices[1].point!;
            const p2 = c.vertices[2].point!;
            let o0: Sign;
            let o1: Sign;
            let o2: Sign;
            if (first) {
                prev = c;
                first = false;
                o0 = orientation(p0, p1, p);
                if (o0 === Sign.NEGATIVE) {
                    c = c.neighbours[2]!;
                    continue;
                }
                o1 = orientation(p1, p2, p);
                if (o1 === Sign.NEGATIVE) {
                    c = c.neighbours[0]!;
                    continue;
                }
                o2 = orientation(p2, p0, p);
                if (o2 === Sign.NEGATIVE) {
                    c = c.neighbours[1]!;
                    continue;
                }
            } else if (leftFirst) {
                if (c.neighbours[0]! === prev) {
                    prev = c;
                    o0 = orientation(p0, p1, p);
                    if (o0 === Sign.NEGATIVE) {
                        c = c.neighbours[2]!;
                        continue;
                    }
                    o2 = orientation(p2, p0, p);
                    if (o2 === Sign.NEGATIVE) {
                        c = c.neighbours[1]!;
                        continue;
                    }
                    o1 = Sign.POSITIVE;
                } else if (c.neighbours[1]! === prev) {
                    prev = c;
                    o1 = orientation(p1, p2, p);
                    if (o1 === Sign.NEGATIVE) {
                        c = c.neighbours[0]!;
                        continue;
                    }
                    o0 = orientation(p0, p1, p);
                    if (o0 === Sign.NEGATIVE) {
                        c = c.neighbours[2]!;
                        continue;
                    }
                    o2 = Sign.POSITIVE;
                } else {
                    prev = c;
                    o2 = orientation(p2, p0, p);
                    if (o2 === Sign.NEGATIVE) {
                        c = c.neighbours[1]!;
                        continue;
                    }
                    o1 = orientation(p1, p2, p);
                    if (o1 === Sign.NEGATIVE) {
                        c = c.neighbours[0]!;
                        continue;
                    }
                    o0 = Sign.POSITIVE;
                }
            } else {
                if (c.neighbours[0] === prev) {
                    prev = c;
                    o2 = orientation(p2, p0, p);
                    if (o2 === Sign.NEGATIVE) {
                        c = c.neighbours[1]!;
                        continue;
                    }
                    o0 = orientation(p0, p1, p);
                    if (o0 === Sign.NEGATIVE) {
                        c = c.neighbours[2]!;
                        continue;
                    }
                    o1 = Sign.POSITIVE;
                } else if (c.neighbours[1] === prev) {
                    prev = c;
                    o0 = orientation(p0, p1, p);
                    if (o0 === Sign.NEGATIVE) {
                        c = c.neighbours[2]!;
                        continue;
                    }
                    o1 = orientation(p1, p2, p);
                    if (o1 === Sign.NEGATIVE) {
                        c = c.neighbours[0]!;
                        continue;
                    }
                    o2 = Sign.POSITIVE;
                } else {
                    prev = c;
                    o1 = orientation(p1, p2, p);
                    if (o1 === Sign.NEGATIVE) {
                        c = c.neighbours[0]!;
                        continue;
                    }
                    o2 = orientation(p2, p1, p);
                    if (o2 === Sign.NEGATIVE) {
                        c = c.neighbours[1]!;
                        continue;
                    }
                    o0 = Sign.POSITIVE;
                }
            }
            const sum =
                (o0 === Sign.COLLINEAR ? 1 : 0) + (o1 === Sign.COLLINEAR ? 1 : 0) + (o2 === Sign.COLLINEAR ? 1 : 0);
            switch (sum) {
                case 0: {
                    lt = LocateType.FACE;
                    li = 4;
                    break;
                }
                case 1: {
                    lt = LocateType.EDGE;
                    li = o0 === Sign.COLLINEAR ? 2 : o1 === Sign.COLLINEAR ? 0 : 1;
                    break;
                }
                case 2: {
                    lt = LocateType.VERTEX;
                    li = o0 !== Sign.COLLINEAR ? 2 : o1 !== Sign.COLLINEAR ? 0 : 1;
                    break;
                }
            }
            if (lt === undefined || li === undefined) throw new Error("ert");
            return { loc: c, lt, li };
        }
    }

    iLocate(p: Point, start: Triangle | null) {
        if (this.tds.dimension < 2) return start;
        if (start === null) {
            const t = this.tds._infinite.triangle!;
            start = t.neighbours[t.indexV(this.tds._infinite)];
        } else if (start.isInfinite()) {
            start = start.neighbours[start.indexV(this.tds._infinite)];
        }
        let prev = null;
        let c = start!;
        let first = true;
        let nTurns = 2500;
        while (true) {
            if (!nTurns--) return c;
            if (c.isInfinite()) return c;
            const p0 = c.vertices[0].point!;
            const p1 = c.vertices[1].point!;
            const p2 = c.vertices[2].point!;
            if (first) {
                prev = c;
                first = false;
                if (hasInexactNegativeOrientation(p0, p1, p)) {
                    c = c.neighbours[2]!;
                    continue;
                }
                if (hasInexactNegativeOrientation(p1, p2, p)) {
                    c = c.neighbours[0]!;
                    continue;
                }
                if (hasInexactNegativeOrientation(p2, p0, p)) {
                    c = c.neighbours[1]!;
                    continue;
                }
            } else {
                if (c.neighbours[0] === prev) {
                    prev = c;
                    if (hasInexactNegativeOrientation(p0, p1, p)) {
                        c = c.neighbours[2]!;
                        continue;
                    }
                    if (hasInexactNegativeOrientation(p2, p0, p)) {
                        c = c.neighbours[1]!;
                        continue;
                    }
                } else if (c.neighbours[1] === prev) {
                    prev = c;
                    if (hasInexactNegativeOrientation(p0, p1, p)) {
                        c = c.neighbours[2]!;
                        continue;
                    }
                    if (hasInexactNegativeOrientation(p1, p2, p)) {
                        c = c.neighbours[0]!;
                        continue;
                    }
                } else {
                    prev = c;
                    if (hasInexactNegativeOrientation(p2, p0, p)) {
                        c = c.neighbours[1]!;
                        continue;
                    }
                    if (hasInexactNegativeOrientation(p1, p2, p)) {
                        c = c.neighbours[0]!;
                        continue;
                    }
                }
            }
            break;
        }
        return c;
    }

    xyEqual(p: Point, q: Point) {
        return p[0] === q[0] && p[1] === q[1];
    }
}
