<template>
    <modal :visible="visible" @close="visible = false">
        <div class='modal-header'>
            Edit asset
        </div>
        <div class='modal-body'>
            <label for="shapeselectiondialog-name">Name</label>
            <input type="text" id="shapeselectiondialog-name" :value="shape.name">
            <label>Colours</label>
            <div class='colours'>
                <span>Fill:</span>
                <color-picker :color.sync="fillColour" />
                <span>Border:</span>
                <color-picker :color.sync="borderColour" />
            </div>
            <canvas ref="canvas" width="100px" height="100px"></canvas>
        </div>
        <div class='modal-footer'>
            <button @click="submit">Submit</button>
        </div>
    </modal>
</template>

<script lang="ts">
import Vue from "vue";
import colorpicker from "../../vue/components/colorpicker.vue";
import modal from "../../vue/components/modals/modal.vue";

export default Vue.component('edit-dialog', {
    components: {
        modal,
        'color-picker': colorpicker
    },
    props: ["shape"],
    data: () => ({
        visible: false,        
    }),
    methods: {
        submit() {
        },
    }
})
</script>

<style scoped>
.modal-header {
    background-color: #FF7052;
    padding: 10px;
    font-size: 20px;
    font-weight: bold;
}

.modal-body {
    padding: 10px;
    display: grid;
    grid-template-columns: [label] 1fr [value] 1fr [end];
    grid-column-gap: 30px;
    grid-row-gap: 10px;
    align-items: center;
}

.modal-footer {
    padding-top: 0;
    padding: 10px;
    text-align: right;
}

.colours {
    display:flex;
    align-items: center;
    justify-content: space-between;
}
</style>