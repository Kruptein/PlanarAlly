import { EdgeCirculator, LocateType, Point, TDS, Triangle, Vertex } from "./tds";
import { edgeInfo } from "./triag";

export class CDT {
    tds: TDS;
    constructor() {
        this.tds = new TDS();
        (<any>window).TDS = this.tds;
    }
    insertConstraint(a: Point, b: Point) {
        const va = this.insert(a, new Triangle());
        const vb = this.insert(b, new Triangle());
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

    markConstraint(t: Triangle, i: number) {
        if (this.tds.dimension === 1) t.constraints[2] = true;
        else {
            t.constraints[i] = true;
            t.neighbours[i]!.constraints[this.tds.mirrorIndex(t, i)] = true;
        }
    }

    insert(p: Point, start: Triangle) {
        const locateInfo = this.locate(p, this.iLocate(p, start));
        const va = this.insertb(p, locateInfo.loc, locateInfo.lt, locateInfo.li);
        this.flipAround(va);
        return va;
    }

    flipAround(v: Vertex) {
        if (this.tds.dimension <= 1) return;
    }

    insertb(a: Point, loc: Triangle, lt: LocateType, li: number): Vertex {
        let insertInConstrainedEdge = false;
        // & loc.is_constrained(li)
        if (lt === LocateType.EDGE && loc.isConstrained(li)) {
            insertInConstrainedEdge = true;
        }
        const va = this.insertc(a, loc, lt, li);
        if (insertInConstrainedEdge) console.log(0);
        else if (lt !== LocateType.VERTEX) this.clearConstraintsIncident(va);
        if (this.tds.dimension === 2) console.log(1);
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

    insertc(p: Point, loc: Triangle, lt: LocateType, li: number): Vertex {
        if (this.tds.vertices.length === 1) {
            return this.insertFirst(p);
        } else if (this.tds.vertices.length === 2) {
            if (lt === LocateType.VERTEX) return this.tds.finiteVertex;
            else return this.insertSecond(p);
        }
        throw new Error("insertc");
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

    locate(p: Point, start: Triangle) {
        let lt = 0;
        let li = 0;
        if (this.tds.dimension < 0) {
            lt = LocateType.OUTSIDE_AFFINE_HULL;
            li = 4;
        } else if (this.tds.dimension === 0) {
            if (this.xyEqual(p, this.tds.finiteVertex.triangle!.vertices[0].point!)) {
                lt = LocateType.VERTEX;
            } else {
                lt = LocateType.OUTSIDE_AFFINE_HULL;
            }
            li = 4;
        }
        return { loc: new Triangle(), lt, li };
    }

    iLocate(p: Point, start: Triangle) {
        if (this.tds.dimension < 2) return start;
        return start;
    }

    xyEqual(p: Point, q: Point) {
        return p[0] === q[0] && p[1] === q[1];
    }
}
