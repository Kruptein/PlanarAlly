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
            cdt.tds.numberOfEdges();
            deleteShapeFromTriag(TriangulationTarget.VISION, shape);
            expect(cdt.tds.numberOfVertices(false)).toBe(0);
        });
        it("should handle two non intersecting shapes.", () => {
            const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
            const shape2 = new Rect(new GlobalPoint(20, 20), 10, 10);
            addShapesToTriag(TriangulationTarget.VISION, shape, shape2);
            cdt.tds.numberOfEdges();
            deleteShapeFromTriag(TriangulationTarget.VISION, shape);
            expect(cdt.tds.numberOfVertices(false)).toBe(0);
        });
    });
});
