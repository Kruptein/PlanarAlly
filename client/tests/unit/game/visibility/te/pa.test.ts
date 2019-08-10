import { GlobalPoint } from "@/game/geom";
import { Rect } from "@/game/shapes/rect";
import { CDT } from "@/game/visibility/te/cdt";
import { addShapesToTriag, deleteShapeFromTriag, PA_CDT, TriangulationTarget } from "@/game/visibility/te/pa";

jest.mock("@/game/api/socket", () => ({
    get socket() {
        return jest.fn();
    },
}));

let cdt: CDT;

describe("PA test suite.", () => {
    beforeEach(() => {
        cdt = new CDT();
        PA_CDT.vision = cdt;
    });
    // describe("addShapesToTriag", () => {
    //     it("should correctly add a single shape.", () => {});
    // });
    describe("deleteShapeFromTriag", () => {
        it("should remove all triag related things if the last shape is removed.", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(0);
        });
        it("should handle case A.", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(20, 20), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case B", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, 5), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case C", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 10), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            expect(cdt.tds.numberOfVertices(false)).toBe(7);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case D", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 0), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case E", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(10, 5), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case F", () => {
            const shape = new Rect(new GlobalPoint(10, 0), 10, 30);
            const shape2 = new Rect(new GlobalPoint(0, 10), 30, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case G", () => {
            const shape = new Rect(new GlobalPoint(10, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(5, 0), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            cdt.tds.numberOfEdges();
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case H", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 50, 50);
            const shape2 = new Rect(new GlobalPoint(20, 20), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            cdt.tds.numberOfEdges();
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
        it("should handle case I", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 30, 30);
            const shape2 = new Rect(new GlobalPoint(20, 10), 30, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            cdt.tds.numberOfEdges();
            deleteShapeFromTriag(TriangulationTarget.VISION, shape.triagVertices);
            expect(cdt.tds.numberOfVertices(false)).toBe(4);
            for (const vertex of shape2.triagVertices) {
                expect(cdt.tds.vertices.includes(vertex));
            }
        });
    });
});
