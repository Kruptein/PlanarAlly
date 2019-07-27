jest.mock("@/game/store");
jest.mock("@/game/api/socket", () => ({
    get socket() {
        return jest.fn();
    },
}));

import { GlobalPoint } from "@/game/geom";
import { Rect } from "@/game/shapes/rect";
import { Shape } from "@/game/shapes/shape";
import { CDT } from "@/game/visibility/te/cdt";
import { deleteShapeFromTriag, PA_CDT, TriangulationTarget } from "@/game/visibility/te/pa";
import { socket } from "@/game/api/socket";

function triangulate(cdt: CDT, ...shapes: Shape[]) {
    for (const shape of shapes) {
        for (let i = 0; i < shape.points.length; i++) {
            const pa = shape.points[i];
            const pb = shape.points[(i + 1) % shape.points.length];
            const { va, vb } = cdt.insertConstraint(pa, pb);
            va.shapes.add(shape);
            vb.shapes.add(shape);
            shape.addTriagVertices(va, vb);
        }
    }
}

describe("Remove TRIAG test suite.", () => {
    it("should remove all triag related things if the last shape is removed.", () => {
        const cdt = new CDT();
        PA_CDT.vision = cdt;
        const shape = new Rect(new GlobalPoint(0, 0), 10, 10);
        triangulate(cdt, shape);
        deleteShapeFromTriag(TriangulationTarget.VISION, shape);
        expect(cdt.tds.vertices).toHaveLength(0);
    });
});
