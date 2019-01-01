import { OrderedMap } from "@/core/utils";
import { GlobalPoint } from "../geom";
import { layerManager } from "../layers/manager";
import { g2lx, g2ly } from "../units";

export let dcel: DCEL;

export class Edge {
    from: number;
    to: number;
    triangleIndex: number = -1;
    constrained = false;

    constructor(from: number, to: number) {
        this.from = from;
        this.to = to;
    }

    get opposite() {
        return dcel.edges.get(`${this.to}-${this.from}`);
    }

    get triangle() {
        return dcel.triangles[this.triangleIndex];
    }

    get toVertex() {
        return [dcel.vertices[2 * this.to], dcel.vertices[2 * this.to + 1]];
    }

    get fromVertex() {
        return [dcel.vertices[2 * this.from], dcel.vertices[2 * this.from + 1]];
    }

    draw(colour = "black") {
        const ctx = layerManager.getLayer("draw")!.ctx;
        ctx.beginPath();
        ctx.strokeStyle = colour;
        ctx.moveTo(g2lx(dcel.vertices[2 * this.from]), g2ly(dcel.vertices[2 * this.from + 1]));
        ctx.lineTo(g2lx(dcel.vertices[2 * this.to]), g2ly(dcel.vertices[2 * this.to + 1]));

        ctx.closePath();
        ctx.stroke();
    }
}

export class Triangle {
    edges: number[] = [];
    constructor(edges: number[]) {
        this.edges = edges;
    }

    getEdges(): Edge[] {
        return this.edges.map(e => dcel.edges.getIndexValue(e));
    }

    edge(index: number): Edge {
        return dcel.edges.getIndexValue(this.edges[index]);
    }

    vertex(index: number): [number, number] {
        const idx = this.edge(this.ccw(index)).from;
        return [dcel.vertices[2 * idx], dcel.vertices[2 * idx + 1]];
    }

    index(edge: Edge) {
        for (let i = 0; i < this.edges.length; i++) {
            if (dcel.edges.getIndexValue(this.edges[i]) === edge) return i;
        }
        return -1;
    }

    ccw(edge: number) {
        return (edge + 2) % 3;
    }

    cw(edge: number) {
        return (edge + 1) % 3;
    }

    neighbour(index: number) {
        return this.edge(index).opposite.triangle;
    }

    contains(point: GlobalPoint) {
        const A =
            -this.vertex(1)[1] * this.vertex(2)[0] +
            this.vertex(0)[1] * (-this.vertex(1)[0] + this.vertex(2)[0]) +
            this.vertex(0)[0] * (this.vertex(1)[1] - this.vertex(2)[1]) +
            this.vertex(1)[0] * this.vertex(2)[1];
        const sign = A < 0 ? -1 : 1;
        const s =
            (this.vertex(0)[1] * this.vertex(2)[0] -
                this.vertex(0)[0] * this.vertex(2)[1] +
                (this.vertex(2)[1] - this.vertex(0)[1]) * point.x +
                (this.vertex(0)[0] - this.vertex(2)[0]) * point.y) *
            sign;
        if (s < 0) return false;
        const t =
            (this.vertex(0)[0] * this.vertex(1)[1] -
                this.vertex(0)[1] * this.vertex(1)[0] +
                (this.vertex(0)[1] - this.vertex(1)[1]) * point.x +
                (this.vertex(1)[0] - this.vertex(0)[0]) * point.y) *
            sign;

        return t > 0 && s + t < A * sign;
    }

    fill(colour = "rgba(0, 0, 0, 0.25)") {
        const ctx = layerManager.getLayer("draw")!.ctx;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        ctx.fillStyle = colour;
        ctx.lineJoin = "round";
        ctx.moveTo(g2lx(this.vertex(0)[0]), g2ly(this.vertex(0)[1]));
        ctx.lineTo(g2lx(this.vertex(1)[0]), g2ly(this.vertex(1)[1]));
        ctx.lineTo(g2lx(this.vertex(2)[0]), g2ly(this.vertex(2)[1]));
        ctx.lineTo(g2lx(this.vertex(0)[0]), g2ly(this.vertex(0)[1]));

        ctx.closePath();
        ctx.fill();
    }
}

export class DCEL {
    vertices: number[];
    triangles: Triangle[] = [];
    edges = new OrderedMap<string, Edge>();
    isolatedVertices: number[][][][] = [];
    constructor(vertices: number[] = [], holes: number[] = []) {
        this.vertices = vertices;
    }
    add_edge(edge: Edge) {
        const key = `${edge.from}-${edge.to}`;
        const revKey = `${edge.to}-${edge.from}`;
        this.edges.set(key, edge);
    }
    add_triangle(triangle: Triangle) {
        this.triangles.push(triangle);
        for (const edge of triangle.edges) this.edges.getIndexValue(edge).triangleIndex = this.triangles.length - 1;
    }

    locate(point: GlobalPoint): Triangle | undefined {
        for (const triangle of this.triangles) {
            if (triangle.contains(point)) return triangle;
        }
    }

    checkConstraints(start: number, end: number, holes: number[]) {
        // if (holes.length === 0) return;
        holes.unshift(0);
        for (let h = 0; h < holes.length; h++) {
            const i = start + holes[h];
            const j = h + 1 === holes.length ? end : start + holes[h + 1];
            for (let k = i + 1; k < j; k++) {
                this.edges.get(`${k - 1}-${k}`).constrained = true;
            }
            this.edges.get(`${j - 1}-${i}`).constrained = true;
        }
    }
}

export function createDCEL(vertices: number[] = []) {
    dcel = new DCEL(vertices);
}

createDCEL([]);
