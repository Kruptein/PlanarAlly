import { CDT } from "./cdt";
import { ccw, cw, orientation, ulp } from "./triag";

export type Point = number[];

export const INFINITE = -7e310;

let _INFINITE_VERTEX: Vertex;

export enum Sign {
    NEGATIVE = -1,
    ZERO = 0,
    POSITIVE = 1,

    RIGHT_TURN = -1,
    LEFT_TURN = 1,

    SMALLER = -1,
    EQUAL = 0,
    LARGER = 1,

    CLOCKWISE = -1,
    COUNTERCLOCKWISE = 1,

    COLLINEAR = 0,
    COPLANAR = 0,
    DEGENERATE = 0,

    ON_NEGATIVE_SIDE = -1,
    ON_ORIENTED_BOUNDARY = 0,
    ON_POSITIVE_SIDE = 1,
}

enum LineFaceState {
    UNDEFINED = -1,
    VERTEX_VERTEX = 0,
    VERTEX_EDGE = 1,
    EDGE_VERTEX = 2,
    EDGE_EDGE = 3,
}

function newPoint(): Point {
    return [INFINITE, INFINITE];
}

export class Triangle {
    vertices: (Vertex | null)[] = [];
    neighbours: (Triangle | null)[] = [null, null, null];
    constraints = [false, false, false];
    static _counter = 0;
    uid = Triangle._counter++;

    constructor(...vertices: (Vertex | null)[]) {
        this.vertices = vertices;
    }

    from(t: Triangle): this {
        this.vertices = t.vertices.slice(0, t.vertices.length);
        this.neighbours = t.neighbours.slice(0, t.neighbours.length);
        this.constraints = t.constraints.slice(0, t.constraints.length);
        return this;
    }

    get dimension() {
        return this.vertices.length - 1;
    }

    addVertex(vertex: Vertex) {
        if (vertex === undefined) {
            console.log("UNDEFINED HIERE");
        }
        this.vertices.push(vertex);
        vertex.triangle = this;
    }

    isConstrained(index: number): boolean {
        return this.constraints[index];
    }

    reorient() {
        // If certain indices do not exist yet thay will append faulty undefined's, thus we slice them
        this.vertices = [this.vertices[1], this.vertices[0], this.vertices[2]].slice(0, this.vertices.length);
        this.neighbours = [this.neighbours[1], this.neighbours[0], this.neighbours[2]];
        this.constraints = [this.constraints[1], this.constraints[0], this.constraints[2]];
    }

    indexV(v: Vertex): number {
        return this.vertices.indexOf(v);
    }

    indexT(t: Triangle): number {
        return this.neighbours.indexOf(t);
    }

    isInfinite(index?: number): boolean {
        if (index === undefined) {
            return this.vertices.includes(_INFINITE_VERTEX);
        } else {
            return this.vertices[ccw(index)]!.infinite || this.vertices[cw(index)]!.infinite;
        }
    }

    contains(point: Point) {
        const A =
            -this.vertices[1]!.point![1] * this.vertices[2]!.point![0] +
            this.vertices[0]!.point![1] * (-this.vertices[1]!.point![0] + this.vertices[2]!.point![0]) +
            this.vertices[0]!.point![0] * (this.vertices[1]!.point![1] - this.vertices[2]!.point![1]) +
            this.vertices[1]!.point![0] * this.vertices[2]!.point![1];
        const sign = A < 0 ? -1 : 1;
        const s =
            (this.vertices[0]!.point![1] * this.vertices[2]!.point![0] -
                this.vertices[0]!.point![0] * this.vertices[2]!.point![1] +
                (this.vertices[2]!.point![1] - this.vertices[0]!.point![1]) * point[0] +
                (this.vertices[0]!.point![0] - this.vertices[2]!.point![0]) * point[1]) *
            sign;
        if (s < 0) return false;
        const t =
            (this.vertices[0]!.point![0] * this.vertices[1]!.point![1] -
                this.vertices[0]!.point![1] * this.vertices[1]!.point![0] +
                (this.vertices[0]!.point![1] - this.vertices[1]!.point![1]) * point[0] +
                (this.vertices[1]!.point![0] - this.vertices[0]!.point![0]) * point[1]) *
            sign;

        return t > 0 && s + t < A * sign;
    }
}

export class Vertex {
    infinite = false;
    private _point: Point | undefined;
    triangle: Triangle | undefined;

    constructor(point?: Point) {
        this._point = point;
    }

    get point(): Point | undefined {
        return this._point;
    }

    set point(point: Point | undefined) {
        this._point = point;
        this.infinite = false;
    }
}

export class EdgeCirculator {
    ri: number;
    v: Vertex | null;
    t: Triangle | null;
    _ri: number;
    _v: Vertex | null;
    _t: Triangle | null;

    constructor(v: Vertex | null, t: Triangle | null) {
        this.v = v;
        this.t = t;
        if (v === null) {
            this.t = null;
        } else if (t === null) {
            this.t = v.triangle!;
        }
        if (this.t == null || this.t.dimension < 1) {
            this.ri = 0;
            this.v = null;
            this.t = null;
        } else {
            const i = this.t.indexV(v!);
            if (this.t.dimension === 2) this.ri = ccw(i);
            else this.ri = 2;
        }
        this._ri = this.ri;
        this._v = this.v;
        this._t = this.t;
    }

    get valid() {
        return this.t !== null && this.v !== null;
    }

    next(): boolean {
        let i = this.t!.indexV(this.v!);
        if (this.t!.dimension === 1) {
            this.t = this.t!.neighbours[i === 0 ? 1 : 0];
        } else {
            this.t = this.t!.neighbours[ccw(i)];
            i = this.t!.indexV(this.v!);
            this.ri = ccw(i);
        }
        return this.ri !== this._ri || this.v !== this._v || this.t !== this._t;
    }
}

export class EdgeIterator {
    private i = 0;
    pos: Triangle | null;
    edge: Edge = new Edge();
    tds: TDS;
    _es = 0;
    constructor(tds: TDS) {
        this.tds = tds;
        this.edge.second = 0;
        if (tds.dimension <= 0) {
            this.pos = null;
            return;
        }
        this.pos = tds.triangles[0];
        if (tds.dimension === 1) this.edge.second = 2;
        while (this.pos !== null && !this.associatedEdge()) {
            throw new Error("[poi");
        }

        if (tds.dimension === 1) this._es = 2;
    }

    get valid(): boolean {
        return (this.pos !== null || this._es !== this.edge.second) && this.pos!.isInfinite(this.edge.second);
    }

    next() {
        do {
            this.increment();
        } while (this.pos !== null && !this.associatedEdge());
    }

    collect(): Edge {
        this.edge.first = this.pos;
        return this.edge;
    }

    associatedEdge(): boolean {
        if (this.tds.dimension === 1) return true;
        return (
            this.tds.triangles.indexOf(this.pos!) < this.tds.triangles.indexOf(this.pos!.neighbours[this.edge.second]!)
        );
    }

    increment() {
        if (this.tds.dimension === 1) {
            this.i++;
            if (this.tds.triangles.length <= this.i) this.pos = null;
            else this.pos = this.tds.triangles[this.i];
        } else if (this.edge.second === 2) {
            this.edge.second = 0;
            this.i++;
            if (this.tds.triangles.length <= this.i) this.pos = null;
            else this.pos = this.tds.triangles[this.i];
        } else {
            this.edge.second++;
        }
    }
}

export class FaceCirculator {
    v: Vertex | null;
    t: Triangle | null;
    _v: Vertex | null;
    _t: Triangle | null;

    constructor(v: Vertex | null, t: Triangle | null) {
        this.v = v;
        this.t = t;
        if (v === null) {
            this.t = null;
        } else if (t === null) {
            this.t = v.triangle!;
        }
        if (this.t == null || this.t.dimension < 2) {
            this.v = null;
            this.t = null;
        }
        this._v = this.v;
        this._t = this.t;
    }

    get valid() {
        return this.t !== null && this.v !== null;
    }

    prev() {
        const i = this.t!.indexV(this.v!);
        this.t = this.t!.neighbours[cw(i)];
    }

    next(): boolean {
        const i = this.t!.indexV(this.v!);
        this.t = this.t!.neighbours[ccw(i)];
        return this.v !== this._v || this.t !== this._t;
    }
}

export class LineFaceCirculator {
    private i = 0;
    pos: Triangle | null = null;
    _tr: CDT;
    s: LineFaceState = LineFaceState.UNDEFINED;
    p: Point;
    q: Point;

    constructor(v: Vertex, tr: CDT, dir: Point) {
        this._tr = tr;
        this.p = v.point!;
        this.q = dir;

        const fc = new FaceCirculator(v, null);
        let ic = fc.t!.indexV(v);
        let vt = fc.t!.vertices[cw(ic)]!;
        while (v === _INFINITE_VERTEX || orientation(this.p, this.q, vt.point!) !== Sign.LEFT_TURN) {
            fc.next();
            ic = fc.t!.indexV(v);
            vt = fc.t!.vertices[cw(ic)]!;
            if (!fc.valid) {
                return;
            }
        }

        let vr = fc.t!.vertices[ccw(ic)]!;
        let pqr: Sign = Sign.RIGHT_TURN;
        // tslint:disable:no-conditional-assignment
        while (vr !== _INFINITE_VERTEX && (pqr = orientation(this.p, this.q, vr.point!)) === Sign.LEFT_TURN) {
            fc.prev();
            ic = fc.t!.indexV(v);
            vr = fc.t!.vertices[ccw(ic)]!;
        }

        ic = fc.t!.indexV(v);
        vt = fc.t!.vertices[cw(ic)]!;

        if (vr === _INFINITE_VERTEX) {
            fc.prev();
            ic = fc.t!.indexV(v);
            vr = fc.t!.vertices[ccw(ic)]!;
            pqr = orientation(this.p, this.q, vr.point!);
            switch (pqr) {
                case Sign.RIGHT_TURN:
                case Sign.COLLINEAR: {
                    fc.next();
                    ic = fc.t!.indexV(_INFINITE_VERTEX);
                    this.pos = fc.t!;
                    this.s = LineFaceState.VERTEX_VERTEX;
                    this.i = ic;
                    break;
                }
                case Sign.LEFT_TURN: {
                    break;
                }
            }
        } else if (pqr === Sign.COLLINEAR) {
            this.pos = fc.t!;
            this.s = LineFaceState.VERTEX_VERTEX;
            this.i = ccw(ic);
        } else {
            this.pos = fc.t!;
            this.s = LineFaceState.VERTEX_EDGE;
            this.i = ic;
        }
    }

    next() {
        this.increment();
    }

    increment() {
        let o: Sign;
        if (this.s === LineFaceState.VERTEX_VERTEX || this.s === LineFaceState.EDGE_VERTEX) {
            do {
                const n = this.pos!.neighbours[cw(this.i)]!;
                this.i = n.indexT(this.pos!);
                this.pos = n;
                if (this.pos!.vertices[this.i] === _INFINITE_VERTEX) {
                    o = Sign.COLLINEAR;
                    this.i = cw(this.i);
                    break;
                }
                o = orientation(this.p, this.q, this.pos!.vertices[this.i]!.point!);
                this.i = cw(this.i);
            } while (o === Sign.LEFT_TURN);
            if (o === Sign.COLLINEAR) {
                this.s = LineFaceState.VERTEX_VERTEX;
                this.i = ccw(this.i);
            } else {
                this.s = LineFaceState.VERTEX_EDGE;
            }
        } else {
            const n = this.pos!.neighbours[this.i]!;
            const ni = n.indexT(this.pos!);
            this.pos = n;
            o =
                this.pos!.vertices[ni]! === _INFINITE_VERTEX
                    ? Sign.COLLINEAR
                    : orientation(this.p, this.q, this.pos!.vertices[ni]!.point!);
            switch (o) {
                case Sign.LEFT_TURN: {
                    this.s = LineFaceState.EDGE_EDGE;
                    this.i = ccw(ni);
                    break;
                }
                case Sign.RIGHT_TURN: {
                    this.s = LineFaceState.EDGE_EDGE;
                    this.i = cw(ni);
                    break;
                }
                default: {
                    this.s = LineFaceState.EDGE_VERTEX;
                    this.i = ni;
                }
            }
        }
    }
}

class Edge {
    first: Triangle | null = null;
    second: number = 0;
}

export enum LocateType {
    VERTEX,
    EDGE,
    FACE,
    OUTSIDE_CONVEX_HULL,
    OUTSIDE_AFFINE_HULL,
}

export class TDS {
    dimension = -1;
    vertices: Vertex[] = [];
    triangles: Triangle[] = [];
    _infinite: Vertex;

    constructor() {
        this._infinite = this.createVertex();
        _INFINITE_VERTEX = this._infinite;
        const t = new Triangle();
        t.addVertex(this._infinite);
        this.triangles.push(t);
    }

    createVertex(): Vertex {
        const v = this.infiniteVertex;
        if (v === undefined) {
            console.log("UNDEFINED HIERE");
        }
        this.vertices.push(v);
        return v;
    }

    createTriangle(
        v0: Vertex | null,
        v1: Vertex | null,
        v2: Vertex | null,
        n0: Triangle | null,
        n1: Triangle | null,
        n2: Triangle | null,
    ) {
        const t = new Triangle(v0, v1, v2);
        t.neighbours[0] = n0;
        t.neighbours[1] = n1;
        t.neighbours[2] = n2;
        this.triangles.push(t);
        return t;
    }

    deleteTriangle(trig: Triangle) {
        this.triangles = this.triangles.filter(t => t !== trig);
    }

    setAdjacency(t0: Triangle, i0: number, t1: Triangle, i1: number) {
        t0.neighbours[i0] = t1;
        t1.neighbours[i1] = t0;
    }

    get finiteVertex(): Vertex {
        return this.vertices[1];
    }

    get infiniteVertex(): Vertex {
        const v = new Vertex(newPoint());
        v.infinite = true;
        return v;
    }

    get finiteEdge(): Edge {
        if (this.dimension < 1) throw new Error("aspo");
        const ei = new EdgeIterator(this);
        while (ei.valid) ei.next();
        return ei.collect();
    }

    insertDimUp(w: Vertex = new Vertex(), orient: boolean = true): Vertex {
        const v = this.createVertex();
        this.dimension++;
        let t1: Triangle;
        let t2: Triangle;
        switch (this.dimension) {
            case 0: {
                t1 = this.triangles[0];
                t2 = new Triangle(v);
                this.triangles.push(t2);
                this.setAdjacency(t1, 0, t2, 0);
                v.triangle = t2;
                break;
            }
            case 1:
            case 2: {
                const deleteList: Triangle[] = [];
                const triangles = this.triangles.slice(0, this.triangles.length);
                for (const trig of triangles) {
                    const copy = new Triangle().from(trig);
                    this.triangles.push(copy);
                    trig.vertices[this.dimension] = v;
                    copy.vertices[this.dimension] = w;
                    this.setAdjacency(trig, this.dimension, copy, this.dimension);
                    if (trig.vertices.includes(w)) deleteList.push(copy);
                }
                for (const trig of triangles) {
                    const neighbour = trig.neighbours[this.dimension];
                    for (let j = 0; j < this.dimension; ++j) {
                        neighbour!.neighbours[j] = trig.neighbours[j]!.neighbours[this.dimension];
                    }
                }

                let lfit = 0;
                if (this.dimension === 1) {
                    if (orient) {
                        triangles[lfit].reorient();
                        lfit++;
                        triangles[lfit].neighbours[1]!.reorient();
                    } else {
                        triangles[lfit].neighbours[1]!.reorient();
                        lfit++;
                        triangles[lfit].reorient();
                    }
                } else {
                    for (const trig of triangles) {
                        if (orient) trig.neighbours[2]!.reorient();
                        else trig.reorient();
                    }
                }

                for (const trig of deleteList) {
                    let j = 1;
                    if (trig.vertices[0] === w) j = 0;
                    t1 = trig.neighbours[this.dimension]!;
                    const i1 = this.mirrorIndex(trig, this.dimension);
                    t2 = trig.neighbours[j]!;
                    const i2 = this.mirrorIndex(trig, j);
                    this.setAdjacency(t1, i1, t2, i2);
                    this.deleteTriangle(trig);
                }
                v.triangle = triangles[0];
                break;
            }
            default: {
                throw new Error("Dimension unknown");
            }
        }
        return v;
    }

    mirrorIndex(t: Triangle, i: number): number {
        if (t.dimension === 1) {
            const j = t.neighbours[i]!.indexV(t.vertices[i === 0 ? 1 : 0]!);
            return j === 0 ? 1 : 0;
        }
        return ccw(t.neighbours[i]!.indexV(t.vertices[ccw(i)]!));
    }

    insertInFace(t: Triangle) {
        const v = this.createVertex();
        const v0 = t.vertices[0]!;
        const v1 = t.vertices[1]!;
        const v2 = t.vertices[2]!;
        const n1 = t.neighbours[1]!;
        const n2 = t.neighbours[2]!;
        const t1 = this.createTriangle(v0, v, v2, t, n1, null);
        const t2 = this.createTriangle(v0, v1, v, t, null, n2);
        this.setAdjacency(t1, 2, t2, 1);
        if (n1 !== null) {
            const i1 = this.mirrorIndex(t, 1);
            n1.neighbours[i1] = t1;
        }
        if (n2 !== null) {
            const i2 = this.mirrorIndex(t, 2);
            n2.neighbours[i2] = t2;
        }
        t.vertices[0] = v;
        t.neighbours[1] = t1;
        t.neighbours[2] = t2;
        if (v0.triangle === t) v0.triangle = t2;
        v.triangle = t;
        return v;
    }

    flip(t: Triangle, i: number) {
        const n = t.neighbours[i]!;
        const ni = this.mirrorIndex(t, i);
        const vCW = t.vertices[cw(i)]!;
        const vCCW = t.vertices[ccw(i)]!;
        const tr = t.neighbours[ccw(i)]!;
        const tri = this.mirrorIndex(t, ccw(i));
        const bl = n.neighbours[ccw(ni)]!;
        const bli = this.mirrorIndex(n, ccw(ni));

        t.vertices[cw(i)] = n.vertices[ni]!;
        n.vertices[cw(ni)] = t.vertices[i]!;

        this.setAdjacency(t, i, bl, bli);
        this.setAdjacency(t, ccw(i), n, ccw(ni));
        this.setAdjacency(n, ni, tr, tri);

        if (vCW.triangle! === t) vCW.triangle = n;
        if (vCCW.triangle! === n) vCCW.triangle = t;
    }

    insertInEdge(t: Triangle, i: number) {
        let v: Vertex;
        if (this.dimension === 1) {
            v = this.createVertex();
            const ff = t.neighbours[0]!;
            const vv = t.vertices[1]!;
            const g = this.createTriangle(v, vv, null, ff, t, null);
            t.vertices[1] = v;
            t.neighbours[0] = g;
            ff.neighbours[1] = g;
            v.triangle = g;
            vv.triangle = ff;
        } else {
            const n = t.neighbours[i]!;
            const ni = this.mirrorIndex(t, i);
            v = this.insertInFace(t);
            this.flip(n, ni);
        }
        return v;
    }
}

export class BoundingBox {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    constructor(p: Point) {
        this.x1 = p[0];
        this.y1 = p[1];
        this.x2 = p[0];
        this.y2 = p[1];
    }

    dilate(dist: number) {
        this.x1 -= dist * ulp(this.x1);
        this.y1 -= dist * ulp(this.y1);
        this.x2 += dist * ulp(this.x2);
        this.y2 += dist * ulp(this.y2);
    }

    overlaps(other: BoundingBox): boolean {
        if (this.x2 < other.x1 || other.x2 < this.x1) return false;
        if (this.y2 < other.y1 || other.y2 < this.y1) return false;
        return true;
    }
}
