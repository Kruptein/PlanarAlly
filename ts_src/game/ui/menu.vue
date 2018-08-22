<template>
    <div id="menu">
        <div style='width:100%;height:90%;overflow-y:auto;overflow-x:hidden;'>
            <template v-if="IS_DM">
                <button class="accordion">Assets</button>
                <div class="accordion-panel">
                    <a style="position:absolute;right:0;margin:20px;" href="/assets/" target='blank'><i class="fas fa-external-link-alt"></i></a>
                    <div class="directory" id="menu-tokens"></div>
                </div>
                <button class="accordion">Notes</button>
                <div class="accordion-panel">
                    <div class="accordion-subpanel" id="menu-notes">
                        <button id="createNote">Create new note</button>
                        <label>Notes</label>
                    </div>
                </div>
                <button class="accordion">DM Options</button>
                <div class="accordion-panel">
                    <div class="accordion-subpanel">
                        <label for="useGridInput">Use grid: </label><input type="checkbox" checked="checked"
                                                                            id="useGridInput">
                        <label for="useFOWInput">Fill entire canvas with FOW: </label><input type="checkbox"
                                                                            id="useFOWInput">
                        <label for="fowOpacity">FOW opacity: </label><input type="text" value="0.3"
                                                                            id="fowOpacity">
                        <label for="fowLOS">Only show lights in LoS: </label><input type="checkbox"
                                                                            id="fowLOS">
                        <label for="unitSizeInput">Unit Size (in ft.): </label><input type="text" value="5"
                                                                            id="unitSizeInput">
                        <label for="gridSizeInput">Grid Size (in pixels): </label><input type="text" value="50"
                                                                            id="gridSizeInput">
                        <label for="invitation">Invitation Code: </label><input type="text"
                                                                                :value="getInvitationCode()"
                                                                                readonly="readonly"
                                                                                id="invitation">
                    </div>
                </div>
            </template>
            <button class="accordion">Client Options</button>
            <div class="accordion-panel">
                <div class="accordion-subpanel">
                    <div><label for="gridColour">Grid Colour: </label><input type="text" id="gridColour"></div>
                    <div><label for="fowColour">FOW Colour: </label><input type="text" id="fowColour"></div>
                </div>
            </div>
        </div>
        <a href="/rooms" class="accordion" style='text-decoration:none;display:inline-block;position:absolute;bottom:0;'>Exit</a>
    </div>
</template>


<script lang="ts">
import Vue from 'vue'
import Settings from '../settings';

export default Vue.component("menu-bar", {
    methods: {
        getInvitationCode() {
            return this.$store.state.invitationCode;
        }
    }
});
</script>