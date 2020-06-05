<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import InputCopyElement from "@/core/components/inputCopy.vue";
import Game from "@/game/game.vue";
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
    }

    get hasPlayers(): boolean {
        return gameStore.players.some(p => p.location === this.location);
    }

    async deleteLocation(): Promise<void> {
        const remove = await (<Game>this.$parent.$parent.$parent.$parent.$parent).$refs.confirm.open(
            "Warning",
            `Are you sure you wish to remove location ${this.name}`,
            { yes: "Yes, delete this location", no: "please no" },
        );
        if (!remove) return;
        socket.emit("Location.Delete", this.location);
        this.$emit("update:location", gameStore.locations.find(l => l.id !== this.location)!.id);
        gameStore.removeLocation(this.location);
        this.$emit("close");
    }
}
</script>

<template>
    <div class="panel">
        <div class="row">
            <div>
                <label :for="'rename-' + location" v-t="'Name'"></label>
            </div>
            <div>
                <input :id="'rename-' + location" type="text" v-model="name" />
            </div>
        </div>
        <div class="row">
            <div v-t="'Remove Location'"></div>
            <div>
                <button
                    class="danger"
                    @click="deleteLocation"
                    :disabled="hasPlayers"
                    :title="hasPlayers ? $t('Move existing players on this location') : $t('Delete this location')"
                    v-t="'Delete this Location'"
                ></button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.danger:hover:disabled {
    cursor: not-allowed;
}
</style>
