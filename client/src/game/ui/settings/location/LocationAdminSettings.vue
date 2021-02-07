<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

import InputCopyElement from "@/core/components/inputCopy.vue";
import ConfirmDialog from "@/core/components/modals/confirm.vue";
import { gameStore } from "@/game/store";

@Component({
    components: {
        ConfirmDialog,
        InputCopyElement,
    },
})
export default class LocationAdminSettings extends Vue {
    @Prop() location!: number;
    $refs!: {
        confirm: ConfirmDialog;
    };

    get name(): string {
        return gameStore.activeLocations.find((l) => l.id === this.location)?.name ?? "";
    }

    set name(name: string) {
        gameStore.renameLocation({ location: this.location, name, sync: true });
    }

    get hasPlayers(): boolean {
        return gameStore.players.some((p) => p.location === this.location);
    }

    archiveLocation(): void {
        this.$emit("update:location", gameStore.activeLocations.find((l) => l.id !== this.location)!.id);
        gameStore.archiveLocation({ id: this.location, sync: true });
        this.$emit("close");
    }

    async deleteLocation(): Promise<void> {
        const remove = await this.$refs.confirm.open(
            this.$t("common.warning").toString(),
            this.$t("game.ui.settings.location.LocationAdminSettings.remove_location_msg_NAME", {
                name: this.name,
            }).toString(),
            {
                yes: this.$t("game.ui.settings.location.LocationAdminSettings.remove_location_yes").toString(),
                no: this.$t("game.ui.settings.location.LocationAdminSettings.remove_location_no").toString(),
            },
        );
        if (!remove) return;
        this.$emit("update:location", gameStore.activeLocations.find((l) => l.id !== this.location)!.id);
        gameStore.removeLocation({ id: this.location, sync: true });
        this.$emit("close");
    }
}
</script>

<template>
    <div class="panel">
        <ConfirmDialog ref="confirm"></ConfirmDialog>
        <div class="row">
            <div>
                <label :for="'rename-' + location" v-t="'common.name'"></label>
            </div>
            <div>
                <input :id="'rename-' + location" type="text" v-model="name" />
            </div>
        </div>
        <div class="row">
            <div>
                <button
                    class="danger"
                    @click="archiveLocation"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? $t('game.ui.settings.location.LocationAdminSettings.move_existing_pl')
                            : $t('game.ui.settings.location.LocationAdminSettings.archive_this_location')
                    "
                    v-t="'game.ui.settings.location.LocationAdminSettings.archive_this_location'"
                ></button>
            </div>
            <div>
                <button
                    class="danger"
                    @click="deleteLocation"
                    :disabled="hasPlayers"
                    :title="
                        hasPlayers
                            ? $t('game.ui.settings.location.LocationAdminSettings.move_existing_pl')
                            : $t('game.ui.settings.location.LocationAdminSettings.delete_this_location')
                    "
                    v-t="'game.ui.settings.location.LocationAdminSettings.delete_this_location'"
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
