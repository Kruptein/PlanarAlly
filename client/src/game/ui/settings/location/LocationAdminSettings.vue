<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import InputCopyElement from "@/core/components/inputCopy.vue";
import { socket } from "@/game/api/socket";
import { gameStore } from "@/game/store";
import { renameLocation } from "../../../api/events/location";

@Component({
    components: {
        InputCopyElement,
    },
})
export default class LocationAdminSettings extends Vue {
    @Prop() location!: number;

    get name(): string {
        return gameStore.locations.find(l => l.id === this.location)!.name;
    }

    set name(name: string) {
        renameLocation(this.location, name);
        socket.emit("Location.Rename", { id: this.location, new: name });
        // this.$emit("update:location", name);
        // try {
        //     renameLocation(this.location, name);
        //     socket.emit("Location.Rename", { old: this.location, new: name });
        //     this.$emit("update:location", name);
        // } catch {
        //     console.log("Something went wrong during location rename attempt");
        // }
    }
}
</script>

<template>
    <div class="panel">
        <div>
            <label :for="'rename-' + location">Name</label>
        </div>
        <div>
            <input :id="'rename-' + location" type="text" v-model="name" />
        </div>
    </div>
</template>
