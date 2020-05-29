import {
    BoundingBox,
    EdgeCirculator,
    FaceCirculator,
    LineFaceCirculator,
    LocateType,
    Point,
    Sign,
    TDS,
    Triangle,
    Vertex,
} from "./tds";
import {
    ccw,
    collinearBetween,
    cw,
    edgeInfo,
    hasInexactNegativeOrientation,
    intersection,
    orientation,
    sideOfOrientedCircle,
    xyEqual,
} from "./triag";

export type Edge = [Triangle, number];

export class CDT {
    tds: TDS;
    constructor() {
        this.tds = new TDS();
    }
    insertConstraint(a: Point, b: Point): { va: Vertex; vb: Vertex } {
        const va = this.insert(a);
        const vb = this.insert(b);
        if (va !== vb) this.insertConstraintV(va, vb);
        return { va, vb };
    }

    insertConstraintV(va: Vertex, vb: Vertex): void {
        const stack = [[va, vb]];
        while (stack.length > 0) {
            const v = stack.pop()!;
            const info = edgeInfo(v[0], v[1]);
            if (info.includes) {
                this.markConstraint(info.fr, info.i);
                if (info.vi !== v[1]) {
                    stack.push([info.vi, v[1]]);
                }
                continue;
            }
            const intersectionInfo = this.findIntersectedFaces(v[0], v[1]);
            if (intersectionInfo.found) {
                if (intersectionInfo.vi !== v[0] && intersectionInfo.vi !== v[1]) {
                    stack.push([v[0], intersectionInfo.vi]);
                    stack.push([intersectionInfo.vi, v[1]]);
                } else {
                    stack.push(v);
                }
                continue;
            }
            this.triangulateHole(intersectionInfo.intersectedFaces, intersectionInfo.listAB, intersectionInfo.listBA);
            if (intersectionInfo.vi !== v[1]) {
                stack.push([intersectionInfo.vi, v[1]]);
            }
        }
    }

    triangulateHole(intersectedFaces: Triangle[], listAB: Edge[], listBA: Edge[]): void {
        const edges: Edge[] = [];
        this.triangulateHole2(intersectedFaces, listAB, listBA, edges);
        this.propagatingFlipE(edges);
    }

    triangulateHole2(intersectedFaces: Triangle[], listAB: Edge[], listBA: Edge[], edges: Edge[]): void {
        if (listAB.length > 0) {
            this.triangulateHalfHole(listAB, edges);
            this.triangulateHalfHole(listBA, edges);
            const fl = listAB[0][0];
            const fr = listBA[0][0];
            fl.neighbours[2] = fr;
            fr.neighbours[2] = fl;
            fl.constraints[2] = true;
            fr.constraints[2] = true;

            while (intersectedFaces.length > 0) {
                this.tds.deleteTriangle(intersectedFaces.shift()!);
            }
        }
    }

    triangulateHalfHole(conflictBoundaries: Edge[], edges: Edge[]): void {
        let iC = 0;
        let iN: number;
        let iT: number;
        const current = (): [Triangle, number] => conflictBoundaries[iC];
        const next = (): [Triangle, number] => conflictBoundaries[iN];
        // const tempo = (): [Triangle, number] => conflictBoundaries[iT];

        const va = current()[0].vertices[ccw(current()[1])]!;
        iN = iC;
        ++iN;

        let n: Triangle;
        let n1: Triangle;
        let n2: Triangle;
        let ind: number;
        let ind1: number;
        let ind2: number;
        do {
            n1 = current()[0];
            ind1 = current()[1];
            if (n1.neighbours[ind1] !== null) {
                n = n1.neighbours[ind1]!;
                ind = cw(n.indexV(n1.vertices[cw(ind1)]!));
                n1 = n.neighbours[ind]!;
                ind1 = this.tds.mirrorIndex(n, ind);
            }
            n2 = next()[0];
            ind2 = next()[1];
            if (n2.neighbours[ind2] !== null) {
                n = n2.neighbours[ind2]!;
                ind = cw(n.indexV(n2.vertices[cw(ind2)]!));
                n2 = n.neighbours[ind]!;
                ind2 = this.tds.mirrorIndex(n, ind);
            }
            const v0 = n1.vertices[ccw(ind1)]!;
            const v1 = n1.vertices[cw(ind1)]!;
            const v2 = n2.vertices[cw(ind2)]!;
            const orient = orientation(v0.point!, v1.point!, v2.point!);
            switch (orient) {
                case Sign.RIGHT_TURN: {
                    const newlf = this.tds.createTriangle(v0, v2, v1, null, null, null);
                    edges.push([newlf, 2]);
                    newlf.neighbours[1] = n1;
                    newlf.neighbours[0] = n2;
                    n1.neighbours[ind1] = newlf;
                    n2.neighbours[ind2] = newlf;
                    if (n1.isConstrained(ind1)) newlf.constraints[1] = true;
                    if (n2.isConstrained(ind2)) newlf.constraints[0] = true;
                    v0.triangle = newlf;
                    v1.triangle = newlf;
                    v2.triangle = newlf;
                    iT = iC + 1;
                    conflictBoundaries.splice(iC, 0, [newlf, 2]);
                    conflictBoundaries.splice(Math.max(iT, iN), 1);
                    conflictBoundaries.splice(Math.min(iT, iN), 1);
                    iN = iC;
                    if (v0 !== va) --iC;
                    else ++iN;
                    break;
                }
                case Sign.LEFT_TURN:
                case Sign.COLLINEAR: {
                    ++iC;
                    ++iN;
                    break;
                }
            }
        } while (iN < conflictBoundaries.length);
    }

    findIntersectedFaces(
        vaa: Vertex,
        vbb: Vertex,
    ): { found: boolean; vi: Vertex; listAB: Edge[]; listBA: Edge[]; intersectedFaces: Triangle[] } {
        const aa = vaa.point!;
        const bb = vbb.point!;
        const listAB: Edge[] = [];
        const listBA: Edge[] = [];
        const intersectedFaces: Triangle[] = [];
        const lfc = new LineFaceCirculator(vaa, this, bb);
        let ind = lfc.pos!.indexV(vaa);
        let vi: Vertex;
        if (lfc.pos!.isConstrained(ind)) {
            vi = this.intersect(lfc.pos!, ind, vaa, vbb);
            return { found: true, vi, listAB, listBA, intersectedFaces };
        }
        let lf = lfc.pos!.neighbours[ccw(ind)]!;
        let rf = lfc.pos!.neighbours[cw(ind)]!;
        listAB.push([lf, lf.indexT(lfc.pos!)]);
        listBA.unshift([rf, rf.indexT(lfc.pos!)]);
        intersectedFaces.unshift(lfc.pos!);
        let previousFace = lfc.pos!;
        lfc.next();
        ind = lfc.pos!.indexT(previousFace);
        let currentVertex = lfc.pos!.vertices[ind]!;
        let done = false;
        while (currentVertex !== vbb && !done) {
            let i1: number;
            let i2: number;
            const orient = orientation(aa, bb, currentVertex.point!);
            switch (orient) {
                case Sign.COLLINEAR: {
                    done = true;
                    break;
                }
                case Sign.LEFT_TURN:
                case Sign.RIGHT_TURN: {
                    if (orient === Sign.LEFT_TURN) {
                        i1 = ccw(ind);
                        i2 = cw(ind);
                    } else {
                        i1 = cw(ind);
                        i2 = ccw(ind);
                    }
                    if (lfc.pos!.isConstrained(i1)) {
                        vi = this.intersect(lfc.pos!, i1, vaa, vbb);
                        return { found: true, vi, listAB, listBA, intersectedFaces };
                    } else {
                        lf = lfc.pos!.neighbours[i2]!;
                        intersectedFaces.unshift(lfc.pos!);
                        if (orient === Sign.LEFT_TURN) listAB.push([lf, lf.indexT(lfc.pos!)]);
                        else listBA.unshift([lf, lf.indexT(lfc.pos!)]);
                        previousFace = lfc.pos!;
                        lfc.next();
                        ind = lfc.pos!.indexT(previousFace);
                        currentVertex = lfc.pos!.vertices[ind]!;
                    }
                    break;
                }
            }
        }
        vi = currentVertex;
        intersectedFaces.unshift(lfc.pos!);
        lf = lfc.pos!.neighbours[cw(ind)]!;
        listAB.push([lf, lf.indexT(lfc.pos!)]);
        rf = lfc.pos!.neighbours[ccw(ind)]!;
        listBA.unshift([rf, rf.indexT(lfc.pos!)]);
        return { found: false, vi, listAB, listBA, intersectedFaces };
    }

    intersect(t: Triangle, i: number, vaa: Vertex, vbb: Vertex): Vertex {
        const vcc = t.vertices[cw(i)]!;
        const vdd = t.vertices[ccw(i)]!;
        const pa = vaa.point!;
        const pb = vbb.point!;
        const pc = vcc.point!;
        const pd = vdd.point!;
        let pi = intersection(pa, pb, pc, pd);
        let vi: Vertex;
        if (pi === null) {
            // CGAL limit_intersection returns 0 for exact intersections and no intersections, but has an implementation for exact predicates ?? unsure which path we would like to take
            const limitIntersection = 0;
            switch (limitIntersection) {
                case 0:
                    vi = vaa;
                    break;
                // case 1:
                //     vi = vbb;
                //     break;
                // case 2:
                //     vi = vcc;
                //     break;
                // case 3:
                //     vi = vdd;
                //     break;
                default:
                    throw new Error("limit_intersection should return 0 to 4");
            }
            if (vi === vaa || vi === vbb) this.removeConstrainedEdge(t, limitIntersection);
        } else {
            if (pi !== pa && pi !== pb && pi !== pc && pi !== pd) {
                // Try to snap to an existing point
                const bbox = new BoundingBox(pi);
                bbox.dilate(4);
                if (bbox.overlaps(new BoundingBox(pa))) pi = pa;
                if (bbox.overlaps(new BoundingBox(pb))) pi = pb;
                if (bbox.overlaps(new BoundingBox(pc))) pi = pc;
                if (bbox.overlaps(new BoundingBox(pd))) pi = pd;
            }
            this.removeConstrainedEdge(t, i);
            vi = this.insert(pi, t);
        }

        if (vi !== vcc && vi !== vdd) {
            this.insertConstraintV(vcc, vi);
            this.insertConstraintV(vi, vdd);
        } else {
            this.insertConstraintV(vcc, vdd);
        }
        return vi;
    }

    // This is the Constrained Delaunay version
    removeVertex(v: Vertex): void {
        if (this.tds.dimension <= 1) this.removeConstrainedVertex(v);
        else this.remove2D(v);
    }

    // This is the normal Constrained version
    private removeConstrainedVertex(v: Vertex): void {
        const vertexCount = this.tds.numberOfVertices(false);
        if (vertexCount === 1 || vertexCount === 2) this.tds.removeDimDown(v);
        else if (this.tds.dimension === 1) console.warn("NOT IMPLEMENTED.");
        // this.remove1D(v)
        else this.remove2D(v);
    }

    remove2D(v: Vertex): void {
        if (this.testDimDown(v)) this.tds.removeDimDown(v);
        else {
            const hole: Edge[] = [];
            this.tds.makeHole(v, hole);
            const shell: Edge[] = [...hole];
            this.tds.fillHoleDelaunay(hole);
            this.updateConstraints(shell);
            this.tds.deleteVertex(v);
        }
    }

    testDimDown(v: Vertex): boolean {
        let dim1 = true;
        for (const triangle of this.tds.triangles) {
            if (triangle.isInfinite()) continue;
            if (!triangle.hasVertex(v)) {
                dim1 = false;
                break;
            }
        }
        const fc = new FaceCirculator(v, null);
        while (fc.t!.isInfinite()) fc.next();
        fc.setDone();
        const start = fc.t!;
        let iv = start.indexV(v);
        const p = start.vertices[cw(iv)]!.point!;
        const q = start.vertices[ccw(iv)]!.point!;
        while (dim1 && fc.next()) {
            iv = fc.t!.indexV(v);
            if (fc.t!.vertices[ccw(iv)] !== this.tds._infinite) {
                dim1 = dim1 && orientation(p, q, fc.t!.vertices[ccw(iv)]!.point!) === Sign.COLLINEAR;
            }
        }
        return dim1;
    }

    updateConstraints(edgeList: Edge[]): void {
        let f: Triangle;
        let i: number;
        for (const edge of edgeList) {
            f = edge[0];
            i = edge[1];
            f.neighbours[i]!.constraints[this.tds.mirrorIndex(f, i)] = f.isConstrained(i);
        }
    }

    removeConstrainedEdge(t: Triangle, i: number): void {
        t.constraints[i] = false;
        if (this.tds.dimension === 2) t.neighbours[i]!.constraints[this.tds.mirrorIndex(t, i)] = false;
    }

    removeConstrainedEdgeDelaunay(t: Triangle, i: number): [Triangle, number, Triangle, number][] {
        this.removeConstrainedEdge(t, i);
        if (this.tds.dimension === 2) {
            const listEdges: Edge[] = [[t, i]];
            return this.propagatingFlipE(listEdges);
        }
        return [];
    }

    updateConstraintsOpposite(v: Vertex): void {
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

    markConstraint(t: Triangle, i: number): void {
        if (this.tds.dimension === 1) t.constraints[2] = true;
        else {
            t.constraints[i] = true;
            t.neighbours[i]!.constraints[this.tds.mirrorIndex(t, i)] = true;
        }
    }

    insert(p: Point, start: Triangle | null = null): Vertex {
        const locateInfo = this.locate(p, this.iLocate(p, start));
        const va = this.insertb(p, locateInfo.loc, locateInfo.lt, locateInfo.li);
        this.flipAround(va);
        return va;
    }

    flipAround(v: Vertex): void {
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

    propagatingFlip(t: Triangle, i: number, depth = 0): void {
        if (!this.isFlipable(t, i)) return;
        const maxDepth = 100;
        if (depth === maxDepth) {
            throw new Error("maxde");
        }
        const ni = t.neighbours[i]!;
        this.flip(t, i);
        this.propagatingFlip(t, i, depth + 1);
        i = ni.indexV(t.vertices[i]!);
        this.propagatingFlip(ni, i, depth + 1);
    }

    lessEdge(e1: Edge, e2: Edge): boolean {
        const ind1 = e1[1];
        const ind2 = e2[1];
        return e1[0].uid < e2[0].uid || (e1[0].uid === e2[0].uid && ind1 < ind2);
    }

    // Instead of only the affected triangles also send the indices around which the flip happened
    propagatingFlipE(edges: Edge[]): [Triangle, number, Triangle, number][] {
        const out: [Triangle, number, Triangle, number][] = [];
        let eI = 0;
        let t: Triangle;
        let i: number;
        let eni: Edge;
        const edgeSet: Edge[] = [];
        while (eI < edges.length) {
            t = edges[eI][0];
            i = edges[eI][1];
            if (this.isFlipable(t, i)) {
                eni = [t.neighbours[i]!, this.tds.mirrorIndex(t, i)];
                if (this.lessEdge(edges[eI], eni)) edgeSet.push(edges[eI]);
                else edgeSet.push(eni);
            }
            ++eI;
        }
        let indf: number;
        let ni: Triangle;
        let indn: number;
        let ei: Edge;
        const e: (Edge | null)[] = [null, null, null, null];
        while (edgeSet.length > 0) {
            t = edgeSet[0][0];
            indf = edgeSet[0][1];
            ni = t.neighbours[indf]!;
            indn = this.tds.mirrorIndex(t, indf);
            ei = [t, indf];
            edgeSet.splice(
                edgeSet.findIndex(ed => ed[0] === ei[0] && ed[1] === ei[1]),
                1,
            );
            e[0] = [t, cw(indf)];
            e[1] = [t, ccw(indf)];
            e[2] = [ni, cw(indn)];
            e[3] = [ni, ccw(indn)];

            for (const edge of e) {
                const tt = edge![0];
                const ii = edge![1];
                eni = [tt.neighbours[ii]!, this.tds.mirrorIndex(tt, ii)];
                if (this.lessEdge(edge!, eni))
                    edgeSet.splice(
                        edgeSet.findIndex(ed => ed[0] === edge![0] && ed[1] === edge![1]),
                        1,
                    );
                else
                    edgeSet.splice(
                        edgeSet.findIndex(ed => ed[0] === eni[0] && ed[1] === eni[1]),
                        1,
                    );
            }

            out.push([t, indf, t.neighbours[indf]!, this.tds.mirrorIndex(t, indf)]);
            this.flip(t, indf);

            e[0] = [t, indf];
            e[1] = [t, cw(indf)];
            e[2] = [ni, indn];
            e[3] = [ni, cw(indn)];

            for (const edge of e) {
                const tt = edge![0];
                const ii = edge![1];
                if (this.isFlipable(tt, ii)) {
                    eni = [tt.neighbours[ii]!, this.tds.mirrorIndex(tt, ii)];
                    if (this.lessEdge(edge!, eni)) edgeSet.push(edge!);
                    else edgeSet.push(eni);
                }
            }
        }
        return out;
    }

    flip(t: Triangle, i: number): void {
        const u = t.neighbours[i]!;
        const j = this.tds.mirrorIndex(t, i);
        const t1 = t.neighbours[cw(i)]!;
        const i1 = this.tds.mirrorIndex(t, cw(i));
        const t2 = t.neighbours[ccw(i)]!;
        const i2 = this.tds.mirrorIndex(t, ccw(i));
        const t3 = u.neighbours[cw(j)]!;
        const i3 = this.tds.mirrorIndex(u, cw(j));
        const t4 = u.neighbours[ccw(j)]!;
        const i4 = this.tds.mirrorIndex(u, ccw(j));
        this.tds.flip(t, i);
        t.constraints[t.indexT(u)] = false;
        u.constraints[u.indexT(t)] = false;
        t1.neighbours[i1]!.constraints[this.tds.mirrorIndex(t1, i1)] = t1.constraints[i1];
        t2.neighbours[i2]!.constraints[this.tds.mirrorIndex(t2, i2)] = t2.constraints[i2];
        t3.neighbours[i3]!.constraints[this.tds.mirrorIndex(t3, i3)] = t3.constraints[i3];
        t4.neighbours[i4]!.constraints[this.tds.mirrorIndex(t4, i4)] = t4.constraints[i4];
    }

    isFlipable(t: Triangle, i: number, perturb = true): boolean {
        const ni = t.neighbours[i]!;
        if (t.isInfinite() || ni.isInfinite()) return false;
        if (t.constraints[i]) return false;
        return sideOfOrientedCircle(ni, t.vertices[i]!.point!, perturb) === Sign.ON_POSITIVE_SIDE;
    }

    insertb(a: Point, loc: Triangle | null, lt: LocateType, li: number): Vertex {
        let insertInConstrainedEdge = false;
        let v1: Vertex;
        let v2: Vertex;
        if (lt === LocateType.EDGE && loc!.isConstrained(li)) {
            insertInConstrainedEdge = true;
            v1 = loc!.vertices[ccw(li)]!;
            v2 = loc!.vertices[cw(li)]!;
        }
        const va = this.insertc(a, loc, lt, li);
        if (insertInConstrainedEdge) this.updateConstraintsIncident(va, v1!, v2!);
        else if (lt !== LocateType.VERTEX) this.clearConstraintsIncident(va);
        if (this.tds.dimension === 2) this.updateConstraintsOpposite(va);
        return va;
    }

    updateConstraintsIncident(va: Vertex, c1: Vertex, c2: Vertex): void {
        if (this.tds.dimension === 0) return;
        if (this.tds.dimension === 1) {
            const ec = new EdgeCirculator(va, null);
            do {
                ec.t!.constraints[2] = true;
            } while (ec.next());
        } else {
            const fc = new FaceCirculator(va, null);
            do {
                const indf = fc.t!.indexV(va);
                const cwi = cw(indf);
                const ccwi = ccw(indf);
                if (fc.t!.vertices[cwi] === c1 || fc.t!.vertices[cwi] === c2) {
                    fc.t!.constraints[ccwi] = true;
                    fc.t!.constraints[cwi] = false;
                } else {
                    fc.t!.constraints[ccwi] = false;
                    fc.t!.constraints[cwi] = true;
                }
            } while (fc.next());
        }
    }

    clearConstraintsIncident(v: Vertex): void {
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
                return loc!.vertices[li]!;
            }
            case LocateType.OUTSIDE_AFFINE_HULL: {
                return this.insertOutsideAffineHull(p);
            }
            case LocateType.OUTSIDE_CONVEX_HULL: {
                return this.insertOutsideConvexHull(p, loc!);
            }
            case LocateType.EDGE: {
                return this.insertInEdge(p, loc!, li);
            }
            case LocateType.FACE: {
                return this.insertInFace(p, loc!);
            }
        }
        throw new Error("qwe");
    }

    insertInEdge(p: Point, loc: Triangle, li: number): Vertex {
        const v = this.tds.insertInEdge(loc, li);
        v.point = p;
        return v;
    }

    insertInFace(p: Point, loc: Triangle): Vertex {
        const v = this.tds.insertInFace(loc);
        v.point = p;
        return v;
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
            const orient = orientation(t.vertices[0]!.point!, t.vertices[1]!.point!, p);
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
            const q = fc.t!.vertices[ccw(li)]!.point!;
            const r = fc.t!.vertices[cw(li)]!.point!;
            if (orientation(p, q, r) === Sign.LEFT_TURN) ccwlist.push(fc.t!);
            else done = true;
        }
        fc = new FaceCirculator(this.tds._infinite, t);
        done = false;
        while (!done) {
            fc.next();
            li = fc.t!.indexV(this.tds._infinite);
            const q = fc.t!.vertices[ccw(li)]!.point!;
            const r = fc.t!.vertices[cw(li)]!.point!;
            if (orientation(p, q, r) === Sign.LEFT_TURN) cwlist.push(fc.t!);
            else done = true;
        }
        const v = this.tds.insertInFace(t);
        v.point = p;
        let th;
        while (ccwlist.length > 0) {
            th = ccwlist[0];
            li = ccw(th.indexV(this.tds._infinite));
            this.tds.flip(th, li);
            ccwlist.shift();
        }
        while (cwlist.length > 0) {
            th = cwlist[0];
            li = cw(th.indexV(this.tds._infinite));
            this.tds.flip(th, li);
            cwlist.shift();
        }
        fc = new FaceCirculator(v, null);
        while (!fc.t!.isInfinite()) fc.next();
        this.tds._infinite.triangle = fc.t!;
        return v;
    }

    locate(
        p: Point,
        start: Triangle | null,
    ): { loc: Triangle; lt: LocateType; li: number } | { loc: null; lt: number; li: number } {
        let lt = 0;
        let li = 0;
        if (this.tds.dimension < 0) {
            lt = LocateType.OUTSIDE_AFFINE_HULL;
            li = 4;
            return { loc: null, lt, li };
        } else if (this.tds.dimension === 0) {
            if (xyEqual(p, this.tds.finiteVertex.triangle!.vertices[0]!.point!)) {
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

    marchLocate1D(p: Point): { loc: Triangle; lt: LocateType; li: number } {
        let ff = this.tds._infinite.triangle!;
        let iv = ff.indexV(this.tds._infinite);
        let t = ff.neighbours[iv]!;
        const pqt = orientation(t.vertices[0]!.point!, t.vertices[1]!.point!, p);
        if (pqt === Sign.RIGHT_TURN || pqt === Sign.LEFT_TURN) {
            return { loc: new Triangle(), lt: LocateType.OUTSIDE_AFFINE_HULL, li: 4 };
        }
        let i = t.indexT(ff);
        if (collinearBetween(p, t.vertices[1 - i]!.point!, t.vertices[i]!.point!))
            return { loc: ff, lt: LocateType.OUTSIDE_CONVEX_HULL, li: iv };

        if (xyEqual(p, t.vertices[1 - i]!.point!)) return { loc: t, lt: LocateType.VERTEX, li: 1 - i };

        ff = ff.neighbours[1 - iv]!;
        iv = ff.indexV(this.tds._infinite);
        t = ff.neighbours[iv]!;
        i = t.indexT(ff);
        if (collinearBetween(p, t.vertices[1 - i]!.point!, t.vertices[i]!.point!))
            return { loc: ff, lt: LocateType.OUTSIDE_CONVEX_HULL, li: iv };
        if (xyEqual(p, t.vertices[1 - i]!.point!)) return { loc: t, lt: LocateType.VERTEX, li: 1 - i };
        throw new Error("sdfsdf");
    }

    marchLocate2D(c: Triangle, p: Point): { loc: Triangle; lt: LocateType; li: number } {
        let prev = null;
        let first = true;
        let lt: LocateType | undefined;
        let li: number | undefined;
        while (true) {
            if (c.isInfinite()) {
                return { loc: c, lt: LocateType.OUTSIDE_CONVEX_HULL, li: c.indexV(this.tds._infinite) };
            }
            const leftFirst = 0; // Math.round(Math.random());
            const p0 = c.vertices[0]!.point!;
            const p1 = c.vertices[1]!.point!;
            const p2 = c.vertices[2]!.point!;
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
                    o2 = orientation(p2, p0, p);
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

    iLocate(p: Point, start: Triangle | null): Triangle | null {
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
            const p0 = c.vertices[0]!.point!;
            const p1 = c.vertices[1]!.point!;
            const p2 = c.vertices[2]!.point!;
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
}
