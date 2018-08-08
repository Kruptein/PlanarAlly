<template>
</template>

<script lang="ts">
import Vue from "vue";
import gameManager from "../planarally";
import { getMouse } from "../utils";
import { l2g, g2l } from "../units";
import { SelectOperations } from "./tools";
import { Ray, LocalPoint, Vector, GlobalPoint } from "../geom";
import Rect from "../shapes/rect";
import CircularToken from "../shapes/circulartoken";
import { SelectTool } from "./select";
import Settings from "../settings";
export default Vue.extend({
    data: () => {
        const start = new GlobalPoint(-1000, -1000);
        return {
            mode: SelectOperations.Noop,
            resizedir: "",
            deltaChanged: false,
            // Because we never drag from the asset's (0, 0) coord and want a smoother drag experience
            // we keep track of the actual offset within the asset.
            drag: new Ray<LocalPoint>(new LocalPoint(0, 0), new Vector(0, 0)),
            selectionStartPoint: start,
            selectionHelper: new Rect(start, 0, 0),
            dialog: $("#createtokendialog").dialog({
                autoOpen: false,
                buttons: {
                    "Create token": function () {
                        // *pukes*
                        const token = new CircularToken(
                            (<SelectTool>gameManager.tools.get("select")).selectionStartPoint,
                            Settings.gridSize / 2,
                            <string>$("#createtokendialog-name").val(),
                            "10px serif",
                            (<SelectTool>gameManager.tools.get("select")).dialog_fill.spectrum("get").toRgbString(),
                            (<SelectTool>gameManager.tools.get("select")).dialog_border.spectrum("get").toRgbString()
                        );
                        const layer = gameManager.layerManager.getLayer()!;
                        layer.addShape(token, true);
                        layer.invalidate(false);
                        $(this).dialog('close');
                    }
                }
            }),
            dialog_fill: $("#createtokendialog-fill").spectrum({
                showInput: true,
                showAlpha: true,
                color: "#fff",
            }),
            dialog_border: $("#createtokendialog-border").spectrum({
                showInput: true,
                showAlpha: true,
                color: "#000",
            })
        }
    },
    methods: {
        onMouseDown: function(e: MouseEvent) {
            if (gameManager.layerManager.getLayer() === undefined) {
                console.log("No active layer!");
                return;
            }
            const layer = gameManager.layerManager.getLayer()!;
            const mouse = getMouse(e);

            let hit = false;
            // The selectionStack allows for lower positioned objects that are selected to have precedence during overlap.
            let selectionStack;
            if (!layer.selection.length)
                selectionStack = layer.shapes;
            else
                selectionStack = layer.shapes.concat(layer.selection);
            for (let i = selectionStack.length - 1; i >= 0; i--) {
                const shape = selectionStack[i];
                const corn = shape.getBoundingBox().getCorner(l2g(mouse));
                if (corn !== undefined) {
                    if (!shape.ownedBy()) continue;
                    layer.selection = [shape];
                    shape.onSelection();
                    this.mode = SelectOperations.Resize;
                    this.resizedir = corn;
                    layer.invalidate(true);
                    hit = true;
                    break;
                } else if (shape.contains(l2g(mouse))) {
                    if (!shape.ownedBy()) continue;
                    const sel = shape;
                    const z = Settings.zoomFactor;
                    if (layer.selection.indexOf(sel) === -1) {
                        layer.selection = [sel];
                        sel.onSelection();
                    }
                    this.mode = SelectOperations.Drag;
                    const lref = g2l(sel.refPoint);
                    this.drag = new Ray<LocalPoint>(lref, mouse.subtract(lref));
                    // this.drag.origin = g2l(sel.refPoint);
                    // this.drag.direction = mouse.subtract(this.drag.origin);
                    layer.invalidate(true);
                    hit = true;
                    break;
                }
            }

            if (!hit) {
                layer.selection.forEach(function (sel) {
                    sel.onSelectionLoss();
                });
                this.mode = SelectOperations.GroupSelect;
                this.selectionStartPoint = l2g(getMouse(e));
                this.selectionHelper.refPoint = this.selectionStartPoint;
                this.selectionHelper.w = 0;
                this.selectionHelper.h = 0;
                layer.selection = [this.selectionHelper];
                layer.invalidate(true);
            }
        }
    }
})
</script>