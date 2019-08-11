import { GlobalPoint } from "@/game/geom";
import { Rect } from "@/game/shapes/rect";
import { CDT } from "@/game/visibility/te/cdt";
import { addShapesToTriag, deleteShapeFromTriag, PA_CDT, TriangulationTarget } from "@/game/visibility/te/pa";
import { Shape } from "@/game/shapes/shape";

jest.mock("@/game/api/socket", () => ({
    get socket() {
        return jest.fn();
    },
}));

let cdt: CDT;

function expectRemoveSuccess(shape1: Shape, shape2: Shape): void {
    cdt = new CDT();
    PA_CDT.vision = cdt;
    shape1.removeTriagVertices(...shape1.triagVertices);
    shape2.removeTriagVertices(...shape2.triagVertices);
    addShapesToTriag(TriangulationTarget.VISION, shape1, shape2);
    deleteShapeFromTriag(TriangulationTarget.VISION, shape1);
    expect(cdt.tds.numberOfVertices(false)).toBe(4);
    for (const vertex of shape2.triagVertices) {
        expect(cdt.tds.vertices.includes(vertex));
    }
    expect(cdt.tds.numberOfEdges(true)).toBe(4);
    expect(cdt.tds.numberOfEdges(false)).toBe(5);
}

describe("PA test suite.", () => {
    describe("deleteShapeFromTriag", () => {
        it("0,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(15, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("0,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 25, 25);
            const shape2 = new Rect(new GlobalPoint(5, 5), 15, 15);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("1,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 10), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("1,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("1,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("1,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 20);
            const shape2 = new Rect(new GlobalPoint(10, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("1,4", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, -5), 10, 20);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("2,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("2,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("2,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 20);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("2,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, -5), 10, 20);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("3,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(-10, 0), 20, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("3,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("3,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(-5, 5), 15, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("3,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 15, 10);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("3,4", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 20);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("4,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("4,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 20);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
        it("4,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(5, -5), 10, 20);
            expectRemoveSuccess(shape, shape2);
            expectRemoveSuccess(shape2, shape);
        });
    });
});
