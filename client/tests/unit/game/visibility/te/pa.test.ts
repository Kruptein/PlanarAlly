import { GlobalPoint } from "@/game/geom";
import { Shape } from "@/game/shapes/shape";
import { Polygon } from "@/game/shapes/polygon";
import { Rect } from "@/game/shapes/rect";
import { CDT } from "@/game/visibility/te/cdt";
import { addShapesToTriag, deleteShapeFromTriag, TriangulationTarget, setCDT } from "@/game/visibility/te/pa";
import { rotateAroundOrigin, xySmaller } from "@/game/visibility/te/triag";

jest.mock("@/game/api/socket", () => ({
    get socket() {
        return jest.fn();
    },
}));

let cdt: CDT;

function expectRemoveSuccess(shape1: Shape, shape2: Shape): void {
    _expectRemoveSuccess(shape1, shape2);
    _expectRemoveSuccess(shape2, shape1);
}

function _expectRemoveSuccess(shape1: Shape, shape2: Shape): void {
    _expectRemoveSuccessRotation(shape1, shape2, false);
    _expectRemoveSuccessRotation(shape1, shape2, true);
    _expectRemoveSuccessRotation(shape1, shape2, true);
    _expectRemoveSuccessRotation(shape1, shape2, true);
}
function _expectRemoveSuccessRotation(shape1: Shape, shape2: Shape, rotate: boolean): void {
    cdt = new CDT();
    setCDT(TriangulationTarget.VISION, shape1.floor, cdt);
    cdt.tds.clearTriagVertices(shape1.uuid);
    cdt.tds.clearTriagVertices(shape2.uuid);
    if (rotate) {
        _rotateShape(shape1);
        _rotateShape(shape2);
    }
    addShapesToTriag(TriangulationTarget.VISION, shape1, shape2);
    expect(cdt.tds.getTriagVertices(shape1.uuid)).toHaveLength(4);
    expect(cdt.tds.getTriagVertices(shape2.uuid)).toHaveLength(4);
    deleteShapeFromTriag(TriangulationTarget.VISION, shape1);
    expect(cdt.tds.getTriagVertices(shape1.uuid)).toHaveLength(0);
    expect(cdt.tds.getTriagVertices(shape2.uuid)).toHaveLength(4);
    expect(cdt.tds.numberOfVertices(false)).toBe(4);
    for (const vertex of cdt.tds.getTriagVertices(shape2.uuid)) {
        expect(cdt.tds.vertices.includes(vertex));
    }
    expect(cdt.tds.numberOfEdges(true)).toBe(4);
    expect(cdt.tds.numberOfEdges(false)).toBe(5);
}

function _rotateShape(shape: Shape): void {
    const points = shape.points
        .map(p => rotateAroundOrigin(p, Math.PI / 2).map(v => Math.round(v)))
        .sort((a: number[], b: number[]) => (xySmaller(a, b) ? -1 : 1));
    shape.refPoint = new GlobalPoint(points[0][0], points[0][1]);
    (<Rect>shape).w = points[3][0] - points[0][0];
    (<Rect>shape).h = points[3][1] - points[0][1];
}

describe("PA test suite.", () => {
    describe("deleteShapeFromTriag", () => {
        it("0,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(15, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("0,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 25, 25);
            const shape2 = new Rect(new GlobalPoint(5, 5), 15, 15);
            expectRemoveSuccess(shape, shape2);
        });
        it("1,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 10), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("1,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("1,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("1,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 20);
            const shape2 = new Rect(new GlobalPoint(10, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("1,4", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, -5), 10, 20);
            expectRemoveSuccess(shape, shape2);
        });
        it("2,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("2,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("2,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 20);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("2,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, -5), 10, 20);
            expectRemoveSuccess(shape, shape2);
        });
        it("3,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(-10, 0), 20, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("3,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("3,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(-5, 5), 15, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("3,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 15, 10);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("3,4", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 20);
            expectRemoveSuccess(shape, shape2);
        });
        it("4,0", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("4,1", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 20);
            expectRemoveSuccess(shape, shape2);
        });
        it("4,2", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 20, 10);
            const shape2 = new Rect(new GlobalPoint(5, -5), 10, 20);
            expectRemoveSuccess(shape, shape2);
        });
        it("4,3", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 20);
            const shape2 = new Rect(new GlobalPoint(0, 5), 20, 10);
            expectRemoveSuccess(shape, shape2);
        });
        it("self-crossing polygon", () => {
            const shape = new Rect(new GlobalPoint(-5, 2), 20, 6);
            const shape2 = new Polygon(new GlobalPoint(0, 0), [
                new GlobalPoint(0, 10),
                new GlobalPoint(10, 0),
                new GlobalPoint(10, 10),
            ]);
            cdt = new CDT();
            setCDT(TriangulationTarget.VISION, shape.floor, cdt);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape2);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            expect(cdt.tds.numberOfEdges(true)).toBe(4);
        });
    });
});
