import gameManager from "../planarally";
import { SelectTool } from "./select";
import { PanTool } from "./pan";
import { DrawTool } from "./draw";
import { RulerTool } from "./ruler";
import { FOWTool } from "./fow";
import { MapTool } from "./map";
import { Vector, GlobalPoint } from "../geom";
import Shape from "../shapes/shape";
import { capitalize } from "../utils";
import Settings from "../settings";

export enum SelectOperations {
    Noop,
    Resize,
    Drag,
    GroupSelect,
}

export function setupTools(): void {
    const toolselectDiv = $("#toolselect").find("ul");
    tools.forEach(function (tool) {
        if (!tool.playerTool && !Settings.IS_DM) return;

        const toolInstance = new tool.clz();
        gameManager.tools.set(tool.name, toolInstance);
        const extra = tool.defaultSelect ? " class='tool-selected'" : "";
        const toolLi = $("<li id='tool-" + tool.name + "'" + extra + "><a href='#'>" + capitalize(tool.name) + "</a></li>");
        toolselectDiv.append(toolLi);
        if (tool.hasDetail) {
            const div = toolInstance.detailDiv!;
            $('#tooldetail').append(div);
            div.hide();
        }
        toolLi.on("click", function () {
            const index = tools.indexOf(tool);
            if (index !== gameManager.selectedTool) {
                $('.tool-selected').removeClass("tool-selected");
                $(this).addClass("tool-selected");
                gameManager.selectedTool = index;
                const detail = $('#tooldetail');
                if (tool.hasDetail) {
                    $('#tooldetail').children().hide();
                    toolInstance.detailDiv!.show();
                    detail.show();
                } else {
                    detail.hide();
                }
            }
        });
    });
}

const tools = [
    { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, clz: SelectTool },
    { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, clz: PanTool },
    { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, clz: DrawTool },
    { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, clz: RulerTool },
    { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, clz: FOWTool },
    { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, clz: MapTool },
];


// First go through each shape in the selection and see if the delta has to be truncated due to movement blockers

// This is definitely super convoluted and inefficient but I was tired and really wanted the smooth wall sliding collision stuff to work
// And it does now, so hey ¯\_(ツ)_/¯
export function calculateDelta(delta: Vector<GlobalPoint>, sel: Shape, done?: string[]) {
    if (done === undefined) done = [];
    const ogSelBBox = sel.getBoundingBox();
    const newSelBBox = ogSelBBox.offset(delta);
    let refine = false;
    for (let mb = 0; mb < gameManager.movementblockers.length; mb++) {
        if (done.includes(gameManager.movementblockers[mb]))
            continue;
        const blocker = gameManager.layerManager.UUIDMap.get(gameManager.movementblockers[mb])!;
        const blockerBBox = blocker.getBoundingBox();
        // Check if the bounding box of our destination would intersect with the bounding box of the movementblocker
        if (blockerBBox.intersectsWith(newSelBBox) || blockerBBox.getIntersectWithLine({ start: ogSelBBox.topLeft.add(delta.normalize()), end: newSelBBox.topLeft }).intersect) {
            const bCenter = blockerBBox.center();
            const sCenter = ogSelBBox.center();

            const d = sCenter.subtract(bCenter);
            const ux = new Vector<GlobalPoint>({ x: 1, y: 0 });
            const uy = new Vector<GlobalPoint>({ x: 0, y: 1 });
            let dx = d.dot(ux);
            let dy = d.dot(uy);
            if (dx > blockerBBox.w / 2) dx = blockerBBox.w / 2;
            if (dx < -blockerBBox.w / 2) dx = -blockerBBox.w / 2;
            if (dy > blockerBBox.h / 2) dy = blockerBBox.h / 2;
            if (dy < -blockerBBox.h / 2) dy = -blockerBBox.h / 2;

            // Closest point / intersection point between the two bboxes.  Not the delta intersect!
            const p = bCenter.add(ux.multiply(dx)).add(uy.multiply(dy));

            if (p.x === ogSelBBox.topLeft.x || p.x === ogSelBBox.topRight.x)
                delta.direction.x = 0;
            else if (p.y === ogSelBBox.topLeft.y || p.y === ogSelBBox.botLeft.y)
                delta.direction.y = 0;
            else {
                if (p.x < ogSelBBox.topLeft.x)
                    delta.direction.x = p.x - ogSelBBox.topLeft.x;
                else if (p.x > ogSelBBox.topRight.x)
                    delta.direction.x = p.x - ogSelBBox.topRight.x;
                else if (p.y < ogSelBBox.topLeft.y)
                    delta.direction.y = p.y - ogSelBBox.topLeft.y;
                else if (p.y > ogSelBBox.botLeft.y)
                    delta.direction.y = p.y - ogSelBBox.botLeft.y;
            }
            refine = true;
            done.push(gameManager.movementblockers[mb]);
            break;
        }
    }
    if (refine)
        delta = calculateDelta(delta, sel, done);
    return delta;
}