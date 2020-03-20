import { Shape } from "@/game/shapes/shape";
import { equalPoints } from "@/game/utils";
import { CDT } from "./cdt";
import { ccw, cw, orientation, sideOfOrientedCircleP, ulp } from "./triag";

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

    get center(): number[] {
        return [
            (this.vertices[0]!.point![0] + this.vertices[1]!.point![0] + this.vertices[2]!.point![0]) / 3,
            (this.vertices[0]!.point![1] + this.vertices[1]!.point![1] + this.vertices[2]!.point![1]) / 3,
        ];
    }

    get dimension(): number {
        return this.vertices.filter(v => v !== null).length - 1;
    }

    addVertex(vertex: Vertex): void {
        if (vertex === undefined) {
            console.log("UNDEFINED HIERE");
        }
        this.vertices.push(vertex);
        vertex.triangle = this;
    }

    isConstrained(index: number): boolean {
        return this.constraints[index];
    }

    reorient(): void {
        // If certain indices do not exist yet thay will append faulty undefined's, thus we slice them
        this.vertices = [this.vertices[1], this.vertices[0], this.vertices[2]].slice(0, this.vertices.length);
        this.neighbours = [this.neighbours[1], this.neighbours[0], this.neighbours[2]];
        this.constraints = [this.constraints[1], this.constraints[0], this.constraints[2]];
    }

    hasVertex(v: Vertex): boolean {
        return this.vertices.includes(v);
    }

    indexV(v: Vertex): number {
        return this.vertices.indexOf(v);
    }

    indexT(t: Triangle): number {
        return this.neighbours.indexOf(t);
    }

    isInfinite(index?: number): boolean {
        if (index === undefined) {
            // return this.vertices.includes(_INFINITE_VERTEX);
            return this.vertices.some(v => v!.infinite);
        } else {
            return this.vertices[ccw(index)]!.infinite || this.vertices[cw(index)]!.infinite;
        }
    }

    contains(point: Point): boolean {
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

    cwPermute(): void {
        this.vertices.push(this.vertices.shift()!);
        this.neighbours.push(this.neighbours.shift()!);
        this.constraints.push(this.constraints.shift()!);
    }

    ccwPermute(): void {
        this.vertices.unshift(this.vertices.pop()!);
        this.neighbours.unshift(this.neighbours.pop()!);
        this.constraints.unshift(this.constraints.pop()!);
    }
}

export class Vertex {
    infinite = false;
    private _point: Point | undefined;
    triangle: Triangle | undefined;
    shapes: Set<Shape> = new Set();

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

    getIncidentFaces(): Triangle[] {
        const faces: Triangle[] = [];
        const fc = new FaceCirculator(this, null);
        do {
            faces.push(fc.t!);
        } while (fc.next());
        return faces;
    }

    *getIncidentEdges(constrainedOnly = false): IterableIterator<Edge> {
        // const edges: Edge[] = [];
        const ec = new EdgeCirculator(this, null);
        do {
            if (!constrainedOnly || ec.t!.constraints[ec.ri]) yield new Edge(ec.t, ec.ri);
        } while (ec.valid && ec.next());
        // return edges;
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

    get valid(): boolean {
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
    es: number;
    tds: TDS;
    _es = 0;
    filterInfinite: boolean;
    constructor(tds: TDS, filterInfinite = true) {
        this.tds = tds;
        this.filterInfinite = filterInfinite;
        this.es = 0;
        if (tds.dimension <= 0) {
            this.pos = null;
            return;
        }
        this.pos = tds.triangles[0];
        if (tds.dimension === 1) this.es = 2;
        while (this.pos !== null && !this.associatedEdge()) {
            throw new Error("[poi");
        }

        if (tds.dimension === 1) this._es = 2;
    }

    get valid(): boolean {
        return (this.pos !== null || this._es !== this.es) && !this.predicate();
    }

    next(): void {
        do {
            do {
                this.increment();
            } while (this.pos !== null && !this.associatedEdge());
        } while (this.pos !== null && this.predicate());
    }

    // Returns true if the current element should be skipped
    predicate(): boolean {
        if (this.filterInfinite) {
            return this.pos!.isInfinite(this.es);
        }
        return false;
    }

    get edge(): Edge {
        return new Edge(this.pos, this.es);
    }

    associatedEdge(): boolean {
        if (this.tds.dimension === 1) return true;
        return this.tds.triangles.indexOf(this.pos!) < this.tds.triangles.indexOf(this.pos!.neighbours[this.es]!);
    }

    increment(): void {
        if (this.tds.dimension === 1) {
            this.i++;
            if (this.tds.triangles.length <= this.i) this.pos = null;
            else this.pos = this.tds.triangles[this.i];
        } else if (this.es === 2) {
            this.es = 0;
            this.i++;
            if (this.tds.triangles.length <= this.i) this.pos = null;
            else this.pos = this.tds.triangles[this.i];
        } else {
            this.es++;
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

    get valid(): boolean {
        return this.t !== null && this.v !== null;
    }

    get done(): boolean {
        return this.v === this._v && this.t === this._t;
    }

    setDone(): void {
        this._v = this.v;
        this._t = this.t;
    }

    prev(): void {
        const i = this.t!.indexV(this.v!);
        this.t = this.t!.neighbours[cw(i)];
    }

    next(): boolean {
        const i = this.t!.indexV(this.v!);
        this.t = this.t!.neighbours[ccw(i)];
        return !this.done;
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

    next(): void {
        this.increment();
    }

    increment(): void {
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

export class Edge {
    first: Triangle | null = null;
    second = 0;

    constructor(first: Triangle | null = null, second = 0) {
        this.first = first;
        this.second = second;
    }

    toString(): string {
        return `${this.first!.vertices[this.second === 1 ? 0 : 1]!.point} - ${
            this.first!.vertices[this.second === 1 ? 2 : 1]!.point
        }`;
    }

    vertices(): [Vertex | null, Vertex | null] {
        return [this.first!.vertices[this.second === 0 ? 1 : 0], this.first!.vertices[this.second === 2 ? 1 : 2]];
    }
}

export enum LocateType {
    VERTEX,
    EDGE,
    FACE,
    OUTSIDE_CONVEX_HULL,
    OUTSIDE_AFFINE_HULL,
}

export class TDS {
    private triagVertices: Map<string, Vertex[]> = new Map();
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
        const v = new Vertex(newPoint());
        v.infinite = true;
        this.vertices.push(v);
        return v;
    }

    deleteVertex(vertex: Vertex): void {
        this.vertices = this.vertices.filter(v => v !== vertex);
    }

    createTriangle(
        v0: Vertex | null,
        v1: Vertex | null,
        v2: Vertex | null,
        n0: Triangle | null,
        n1: Triangle | null,
        n2: Triangle | null,
    ): Triangle {
        const t = new Triangle(v0, v1, v2);
        t.neighbours[0] = n0;
        t.neighbours[1] = n1;
        t.neighbours[2] = n2;
        this.triangles.push(t);
        return t;
    }

    createTriangle2(
        f1: Triangle,
        i1: number,
        f2: Triangle,
        i2: number,
        f3: Triangle | null = null,
        i3: number | null = null,
    ): Triangle {
        const v3 = f3 === null || i3 === null ? f2.vertices[ccw(i2)] : f3.vertices[cw(i3)];
        const t = new Triangle(f1.vertices[cw(i1)], f2.vertices[cw(i2)], v3);
        f1.neighbours[i1] = t;
        f2.neighbours[i2] = t;
        if (f3 !== null && i3 !== null) f3.neighbours[i3] = t;
        t.neighbours[0] = f2;
        if (f3 !== null) t.neighbours[1] = f3;
        t.neighbours[2] = f1;
        this.triangles.push(t);
        return t;
    }

    createTriangle3(f1: Triangle, i1: number, v: Vertex): Triangle {
        const t = new Triangle(f1.vertices[cw(i1)], f1.vertices[ccw(i1)], v);
        t.neighbours[2] = f1;
        // not sure if I should create new Triangle() in the other neighbor spots or leave them as null
        f1.neighbours[i1] = t;
        this.triangles.push(t);
        return t;
    }

    deleteTriangle(trig: Triangle): void {
        this.triangles = this.triangles.filter(t => t !== trig);
    }

    setAdjacency(t0: Triangle, i0: number, t1: Triangle, i1: number): void {
        t0.neighbours[i0] = t1;
        t1.neighbours[i1] = t0;
    }

    get finiteVertex(): Vertex {
        return this.vertices[1];
    }

    get finiteEdge(): Edge {
        if (this.dimension < 1) throw new Error("aspo");
        const ei = new EdgeIterator(this, true);
        while (!ei.valid) ei.next();
        return ei.edge;
    }

    getEdges(onlyConstraint = false): Edge[] {
        const ei = new EdgeIterator(this);
        const edges: Edge[] = [];
        if (ei.edge.first === null) return edges;
        while (!ei.valid) ei.next();
        do {
            const edge = ei.edge;
            if (onlyConstraint) {
                if (edge.first!.constraints[edge.second]) {
                    edges.push(edge);
                }
            } else {
                edges.push(edge);
            }
            ei.next();
        } while (ei.valid);
        return edges;
    }

    numberOfEdges(onlyConstraint = false): number {
        let i = 0;
        let j = 0;
        const ei = new EdgeIterator(this);
        if (ei.edge.first === null) return 0;
        while (!ei.valid) ei.next();
        do {
            j++;
            const edge = ei.edge;
            if (edge.first!.constraints[edge.second]) {
                i++;
            }
            ei.next();
        } while (ei.valid);
        if (onlyConstraint) return i;
        return j;
    }

    numberOfVertices(includeInfinity: boolean): number {
        // -1 for the infinity vertex
        return this.vertices.length - (includeInfinity ? 0 : 1);
    }

    insertDimUp(w: Vertex = new Vertex(), orient = true): Vertex {
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

    insertInFace(t: Triangle): Vertex {
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

    flip(t: Triangle, i: number): void {
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

    insertInEdge(t: Triangle, i: number): Vertex {
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

    makeHole(v: Vertex, hole: [Triangle, number][]): void {
        const deleteList: Triangle[] = [];
        let f: Triangle;
        let fn: Triangle;
        let i: number;
        let inn: number;
        let vv: Vertex;
        const fc = new FaceCirculator(v, null);
        do {
            f = fc.t!;
            fc.next();
            i = f.indexV(v);
            fn = f.neighbours[i]!;
            inn = fn.indexT(f);
            vv = f.vertices[cw(i)]!;
            vv.triangle = fn;
            vv = f.vertices[ccw(i)]!;
            vv.triangle = fn;
            fn.neighbours[inn] = null;
            hole.push([fn, inn]);
            deleteList.push(f);
        } while (!fc.done);
        for (const t of deleteList) {
            this.deleteTriangle(t);
        }
    }

    fillHoleDelaunay(firstHole: [Triangle, number][]): void {
        let f: Triangle;
        let ff: Triangle;
        let fn: Triangle;
        let i: number;
        let ii: number;
        let inn: number;
        const holeList: [Triangle, number][][] = [];
        holeList.push(firstHole);
        while (holeList.length > 0) {
            const hole = holeList[0];
            let hit: number;

            if (hole.length === 3) {
                hit = 0;
                f = hole[hit][0];
                i = hole[hit][1];
                ff = hole[++hit][0];
                ii = hole[hit][1];
                fn = hole[++hit][0];
                inn = hole[hit][1];
                this.createTriangle2(f, i, ff, ii, fn, inn);
                holeList.shift();
                continue;
            }

            let finite = false;
            while (!finite) {
                ff = hole[0][0];
                ii = hole[0][1];
                if (ff.vertices[cw(ii)]!.infinite || ff.vertices[ccw(ii)]!.infinite) {
                    hole.push(hole.shift()!);
                } else {
                    finite = true;
                }
            }

            ff = hole[0][0];
            ii = hole[0][1];
            hole.shift();

            const v0 = ff.vertices[cw(ii)]!;
            const v1 = ff.vertices[ccw(ii)]!;
            let v2 = this._infinite;
            let v3: Vertex;

            const p0 = v0.point!;
            const p1 = v1.point!;
            hit = 0;
            let cutAfter = 0;

            while (hit !== hole.length - 1) {
                fn = hole[hit][0];
                inn = hole[hit][1];
                const vv = fn.vertices[ccw(inn)]!;
                if (vv.infinite && v2.infinite) cutAfter = hit;
                else {
                    const p = vv.point!;
                    if (orientation(p0, p1, p) === Sign.COUNTERCLOCKWISE) {
                        if (v2.infinite) {
                            v2 = vv;
                            v3 = vv;
                            cutAfter = hit;
                        } else if (sideOfOrientedCircleP(p0, p1, v3!.point!, p, true) === Sign.ON_POSITIVE_SIDE) {
                            v2 = vv;
                            v3 = vv;
                            cutAfter = hit;
                        }
                    }
                }
                hit++;
            }
            let newf: Triangle;

            fn = hole[0][0];
            inn = hole[0][1];
            if (fn.vertices[ccw(inn)] === v2) {
                newf = this.createTriangle2(ff, ii, fn, inn);
                hole.shift();
                hole.unshift([newf, 1]);
            } else {
                fn = hole[hole.length - 1][0];
                inn = hole[hole.length - 1][1];
                const indx = fn.indexV(v2);
                if (indx >= 0 && indx === cw(inn)) {
                    newf = this.createTriangle2(fn, inn, ff, ii);
                    hole.pop();
                    hole.push([newf, 1]);
                } else {
                    // split the hole in two holes
                    newf = this.createTriangle3(ff, ii, v2);
                    const newHole: [Triangle, number][] = [];
                    ++cutAfter;
                    // while (hole.begin !== cut_after)
                    while (hole[0] !== hole[cutAfter--]) {
                        newHole.push(hole.shift()!);
                    }

                    hole.unshift([newf, 1]);
                    newHole.unshift([newf, 0]);
                    holeList.unshift(newHole);
                }
            }
        }
    }

    removeDimDown(v: Vertex): void {
        let f: Triangle;
        switch (this.dimension) {
            case -1: {
                this.deleteTriangle(v.triangle!);
                break;
            }
            case 0: {
                f = v.triangle!;
                f.neighbours[0]!.neighbours[0] = null;
                this.deleteTriangle(v.triangle!);
                break;
            }
            case 1:
            case 2: {
                const toDelete: Triangle[] = [];
                const toDowngrade: Triangle[] = [];
                for (const triangle of this.triangles) {
                    if (!triangle.hasVertex(v)) toDelete.push(triangle);
                    else toDowngrade.push(triangle);
                }
                for (const down of toDowngrade) {
                    const j = down.indexV(v);
                    if (this.dimension === 1) {
                        if (j === 0) down.reorient();
                        down.vertices[1] = null;
                        down.neighbours[1] = null;
                    } else {
                        if (j === 0) down.cwPermute();
                        else if (j === 1) down.ccwPermute();
                        down.vertices[2] = null;
                        down.neighbours[2] = null;
                    }
                    down.vertices[0]!.triangle = down;
                }
                for (const del of toDelete) this.deleteTriangle(del);
            }
        }
        this.deleteVertex(v);
        this.dimension--;
    }

    addTriagVertices(shape: string, ...vertices: Vertex[]): void {
        const tv = this.triagVertices.get(shape) || this.triagVertices.set(shape, []).get(shape)!;
        for (const vertex of vertices) {
            if (tv.some(v => equalPoints(vertex.point!, v.point!))) continue;
            tv.push(vertex);
        }
    }

    getTriagVertices(shape: string): Vertex[] {
        const tv = this.triagVertices.get(shape);
        return tv === undefined ? [] : [...tv];
    }

    clearTriagVertices(shape: string): void {
        this.triagVertices.set(shape, []);
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

    dilate(dist: number): void {
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
