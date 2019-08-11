import { joinOverlap } from "@/game/visibility/te/triag";
import { Vertex } from "@/game/visibility/te/tds";
import { equalPoints } from "@/game/utils";

describe("triag test suite.", () => {
    describe("joinOverlap", () => {
        it("should return null if there is no overlap.", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([20, 0]), new Vertex([30, 0])];
            expect(joinOverlap(A, B)).toBeNull();
            expect(joinOverlap(B, A)).toBeNull();
        });
        it("should return null if there is only 1 intersection point and different slopes.", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([5, 0]), new Vertex([5, 10])];
            expect(joinOverlap(A, B)).toBeNull();
            expect(joinOverlap(B, A)).toBeNull();
        });
        it("should return a new edge if they both have partial overlapping", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([5, 0]), new Vertex([30, 0])];
            let overlap = joinOverlap(A, B);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [30, 0])).toBe(true);
            overlap = joinOverlap(B, A);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [30, 0])).toBe(true);
        });
        it("should return a new edge if they share 1 intersection point and the same slope.", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([10, 0]), new Vertex([30, 0])];
            let overlap = joinOverlap(A, B);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [30, 0])).toBe(true);
            overlap = joinOverlap(B, A);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [30, 0])).toBe(true);
        });
        it("should return a new edge if one edge includes the other fully.", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([5, 0]), new Vertex([8, 0])];
            let overlap = joinOverlap(A, B);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [10, 0])).toBe(true);
            overlap = joinOverlap(B, A);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [10, 0])).toBe(true);
        });
        it("should return a new edge if one edge includes the other with the same starting point.", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([0, 0]), new Vertex([8, 0])];
            let overlap = joinOverlap(A, B);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [10, 0])).toBe(true);
            overlap = joinOverlap(B, A);
            expect(overlap).not.toBeNull();
            expect(equalPoints(overlap![0].point!, [0, 0])).toBe(true);
            expect(equalPoints(overlap![1].point!, [10, 0])).toBe(true);
        });
        it("should return null if the two edges are parallel but not intersecting.", () => {
            const A = [new Vertex([0, 0]), new Vertex([10, 0])];
            const B = [new Vertex([0, 10]), new Vertex([10, 10])];
            let overlap = joinOverlap(A, B);
            expect(overlap).toBeNull();
            overlap = joinOverlap(B, A);
            expect(overlap).toBeNull();
        });
    });
});
