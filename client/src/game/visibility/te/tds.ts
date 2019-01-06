export type Point = number[];

function newPoint(): Point {
    return [-7e-310, -7e-310];
}

export class Triangle {
    vertices: Vertex[] = [];
    neighbours: (Triangle | null)[] = [null, null, null];
    constraints = [false, false, false];

    constructor(...vertices: Vertex[]) {
        this.vertices = vertices;
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
        return false;
    }

    setNeighbour(index: number, neighbour: Triangle) {
        this.neighbours[index] = neighbour;
    }

    reorient() {
        // If certain indices do not exist yet thay will append faulty undefined's, thus we slice them
        this.vertices = [this.vertices[1], this.vertices[0], this.vertices[2]].slice(0, this.vertices.length);
        this.neighbours = [this.neighbours[1], this.neighbours[0], this.neighbours[2]];
        this.constraints = [this.constraints[1], this.constraints[0], this.constraints[2]];
    }

    index(v: Vertex): number {
        return this.vertices.indexOf(v);
    }
}

export class Vertex {
    infinite = false;
    _point: Point | undefined;
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
            const i = this.t.index(v!);
            if (this.t.dimension === 2) this.ri = 0;
            // this.ccw(i);
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
        let i = this.t!.index(this.v!);
        if (this.t!.dimension === 1) {
            this.t = this.t!.neighbours[i === 0 ? 1 : 0];
        } else {
            // this.t = this.t!.neighbours[] ccw
            i = this.t!.index(this.v!);
            // ri = ccw(i)
        }
        return this.ri !== this._ri || this.v !== this._v || this.t !== this._t;
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
    dimension = -1;
    vertices: Vertex[] = [];
    triangles: Triangle[] = [];
    _infinite: Vertex;

    constructor() {
        this._infinite = this.createVertex();
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

    setAdjacency(t0: Triangle, i0: number, t1: Triangle, i1: number) {
        t0.setNeighbour(i0, t1);
        t1.setNeighbour(i1, t0);
    }

    get finiteVertex(): Vertex {
        return this.vertices[1];
    }

    get infiniteVertex(): Vertex {
        const v = new Vertex(newPoint());
        v.infinite = true;
        return v;
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
                    const copy = new Triangle(...trig.vertices);
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
                    this.triangles = this.triangles.filter(t => t !== trig);
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
            const j = t.neighbours[i]!.index(t.vertices[i === 0 ? 1 : 0]);
            return j === 0 ? 1 : 0;
        }
        return 0;
    }
}
