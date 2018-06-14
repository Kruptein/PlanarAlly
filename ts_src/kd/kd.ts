import BoundingRect from "../shapes/boundingrect";
import gameManager from "../planarally";

// class KD {
//     nextFreeNode = 0;
//     nAllocedNodes = 0;
//     nodes = [];
//     maxPrims = 1;
//     constructor(shapes: string[]) {
//         const maxDepth = Math.round(8 + 1.3 * Math.log(shapes.length));
//         let bounds;
//         const primBounds: BoundingRect[] = []
//         for(let i=0; i < shapes.length; i++) {
//             const bound = gameManager.layerManager.UUIDMap.get(shapes[i])!.getBoundingBox();
//             bounds = bounds === undefined ? bound : bounds.union(bound);
//             primBounds.push(bound);
//         }
//         const primNums = [...Array(shapes.length).keys()];
//         buildTree(0, bounds, primBounds, primNums, shapes.length, maxDepth, edges, prim0, prim1, 0);
//     }

//     buildTree(nodeNum: number, nodeBounds: BoundingRect, primBounds: BoundingRect[], primNums: number[], nPrimitives: number, depth: number, edges, prims0: number, prims1: number, badRefines: number) {
//         if (nPrimitives <= this.maxPrims || depth == 0) {
//             this.nodes[nodeNum] = this.initLeaf(primNums, nPrimitives);
//             return
//         }

//     }
// }