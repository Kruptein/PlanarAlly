import Vue from 'vue';
import SelectTool from "./select.vue";
import PanTool from "./pan.vue";

const app = new Vue({
    el: '#main',
    delimiters: ['[[', ']]'],
    components: {
        'select-tool': SelectTool,
        'pan-tool': PanTool
    },
    data: {
        toolsLoaded: false,
        currentTool: "select",
        tools: ["select", "pan"]
    },
    methods: {
        mousedown: function(event: MouseEvent) {
            this.$emit('mousedown', event, this.currentTool);
        },
        mouseup: function(event: MouseEvent) {
            this.$emit('mouseup', event, this.currentTool);
        },
        mousemove: function(event: MouseEvent) {
            this.$emit('mousemove', event, this.currentTool);
        }
    },
    computed: {
        currentTabComponent(): string {
            return `${this.currentTool.toLowerCase()}-tool`;
        }
    }
});

export function setupTools(): void {
    app.toolsLoaded = true;
    // console.log("setup");
    // app.$emit("loadTools");
    // const toolselectDiv = $("#toolselect").find("ul");
    // tools.forEach(function (tool) {
    //     if (!tool.playerTool && !Settings.IS_DM) return;

    //     const toolInstance = new tool.clz();
    //     gameManager.tools.set(tool.name, toolInstance);
    //     const extra = tool.defaultSelect ? " class='tool-selected'" : "";
    //     const toolLi = $("<li id='tool-" + tool.name + "'" + extra + "><a href='#'>" + capitalize(tool.name) + "</a></li>");
    //     toolselectDiv.append(toolLi);
    //     if (tool.hasDetail && toolInstance.detailDiv !== undefined) {
    //         const div = toolInstance.detailDiv;
    //         $('#tooldetail').append(div);
    //         div.hide();
    //     }
    //     toolLi.on("click", function () {
    //         const index = tools.indexOf(tool);
    //         if (index !== gameManager.selectedTool) {
    //             gameManager.tools.getIndexValue(gameManager.selectedTool).onDeselect();
    //             $('.tool-selected').removeClass("tool-selected");
    //             $(this).addClass("tool-selected");
    //             gameManager.selectedTool = index;
    //             const detail = $('#tooldetail');
    //             if (tool.hasDetail) {
    //                 $('#tooldetail').children().hide();
    //                 toolInstance.detailDiv!.show();
    //                 detail.show();
    //             } else {
    //                 detail.hide();
    //             }
    //             gameManager.tools.getIndexValue(gameManager.selectedTool).onSelect();
    //         }
    //     });
    // });
}

// const tools = [
//     { name: "select", playerTool: true, defaultSelect: true, hasDetail: false, clz: SelectTool },
//     { name: "pan", playerTool: true, defaultSelect: false, hasDetail: false, clz: PanTool },
//     { name: "draw", playerTool: true, defaultSelect: false, hasDetail: true, clz: DrawTool },
//     { name: "ruler", playerTool: true, defaultSelect: false, hasDetail: false, clz: RulerTool },
//     { name: "fow", playerTool: false, defaultSelect: false, hasDetail: true, clz: FOWTool },
//     { name: "brush", playerTool: false, defaultSelect: false, hasDetail: true, clz: BrushTool },
//     { name: "map", playerTool: false, defaultSelect: false, hasDetail: true, clz: MapTool },
// ];