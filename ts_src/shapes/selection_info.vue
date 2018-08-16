<template>
    <div id="selection-menu" v-if='shape !== null'>
        <div id='selection-edit-button' @click="test"><i class="fas fa-edit"></i></div>
        <div id="selection-name">{{ shape.name }}</div>
        <div id="selection-trackers">
            <template v-for="tracker in shape.trackers">
                <div 
                    id="selection-tracker-health-name"
                    :key="'name-' + tracker.uuid"
                >
                    {{ tracker.name }}
                </div>
                <div
                    id="selection-tracker-health-value"
                    class="selection-tracker-value"
                    :key="'value-' + tracker.uuid"
                >
                    {{ tracker.value }}
                </div>
            </template>
        </div>
        <div id="selection-auras">
            <div id="selection-aura-darkvision-name">Darkvision</div>
            <div id="selection-aura-darkvision-value" class="selection-aura-value">60</div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

import Shape from './shape';

export default Vue.extend({
    data: () => ({
        shape: <Shape|null> null,
    }),
    methods: {
        test() {
            console.log("!");
        }
    }
})
</script>

<style scoped>
#selection-menu {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 150px;
    right: 0;
    z-index: 10;
    opacity: 0.5;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border: #82c8a0 solid 1px;
    border-right: none;
    padding: 10px 35px 10px 10px;
    background-color: #eee;
}

#selection-menu:hover {
    background-color: #82c8a0;
    opacity: 1;
}

#selection-edit-button {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
}

#selection-trackers, #selection-auras {
    display: grid;
    grid-template-columns: [name] 1fr [value] 1fr;
}

.selection-tracker-value, .selection-aura-value {
    justify-self: center;
    padding: 2px;
}

.selection-tracker-value:hover, .selection-aura-value:hover {
    cursor: pointer;
    background-color: rgba(20, 20, 20, 0.2);
}

#selection-name {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
}
</style>
