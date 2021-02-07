<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { gameStore } from "@/game/store";

import { SyncTo } from "../../../../core/comm/types";
import { ShapeOwner } from "../../../shapes/owners";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component
export default class AccessSettings extends Vue {
    $refs!: {
        accessDropdown: HTMLSelectElement;
    };

    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    get players(): { id: number; name: string }[] {
        return gameStore.players;
    }

    get playersWithoutAccess(): { id: number; name: string }[] {
        return gameStore.players.filter((p) => !this.shape.owners.some((o) => o.user === p.name));
    }

    toggleDefaultEditAccess(): void {
        if (!this.owned) return;
        this.shape.setDefaultEditAccess({ editAccess: !this.shape.hasDefaultEditAccess, syncTo: SyncTo.SERVER });
    }

    toggleDefaultMovementAccess(): void {
        if (!this.owned) return;
        this.shape.setDefaultMovementAccess({
            movementAccess: !this.shape.hasDefaultMovementAccess,
            syncTo: SyncTo.SERVER,
        });
    }

    toggleDefaultVisionAccess(): void {
        if (!this.owned) return;
        this.shape.setDefaultVisionAccess({ visionAccess: !this.shape.hasDefaultVisionAccess, syncTo: SyncTo.SERVER });
    }

    addOwner(): void {
        if (!this.owned) return;
        const dropdown = this.$refs.accessDropdown;
        const selectedUser = dropdown.options[dropdown.selectedIndex].value;
        if (selectedUser === "") return;
        this.shape.addOwner({
            owner: {
                shape: this.shape.uuid!,
                user: selectedUser,
                access: { edit: true, movement: true, vision: true },
            },
            syncTo: SyncTo.SERVER,
        });
    }

    removeOwner(owner: string): void {
        if (!this.owned) return;
        this.shape.removeOwner({ owner, syncTo: SyncTo.SERVER });
    }

    toggleOwnerEditAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        // un-reactify it, because we want to check on access permissions in updateOwner
        // otherwise one would never be able to remove their edit access rights
        const copy = { ...owner, access: { ...owner.access } };
        copy.access.edit = !copy.access.edit;
        if (copy.access.edit) {
            copy.access.movement = true;
            copy.access.vision = true;
        }
        this.shape.updateOwner({
            owner: copy,
            syncTo: SyncTo.SERVER,
        });
    }
    toggleOwnerMovementAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        const copy = { ...owner, access: { ...owner.access } };
        copy.access.movement = !copy.access.movement;
        if (copy.access.movement) {
            copy.access.vision = true;
        } else {
            copy.access.edit = false;
        }
        this.shape.updateOwner({
            owner: copy,
            syncTo: SyncTo.SERVER,
        });
    }

    toggleOwnerVisionAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        const copy = { ...owner, access: { ...owner.access } };
        copy.access.vision = !copy.access.vision;
        if (!copy.access.vision) {
            copy.access.edit = false;
            copy.access.movement = false;
        }
        this.shape.updateOwner({
            owner: copy,
            syncTo: SyncTo.SERVER,
        });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header" v-t="'game.ui.selection.edit_dialog.access.access'"></div>
        <div class="owner"><em v-t="'game.ui.selection.edit_dialog.access.default'"></em></div>
        <div
            :style="{
                opacity: shape.hasDefaultEditAccess ? 1.0 : 0.3,
                textAlign: 'center',
            }"
            :disabled="!owned"
            @click="toggleDefaultEditAccess"
            :title="$t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
        >
            <font-awesome-icon icon="pencil-alt" />
        </div>
        <div
            :style="{ opacity: shape.hasDefaultMovementAccess ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultMovementAccess"
            :title="$t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
        >
            <font-awesome-icon icon="arrows-alt" />
        </div>
        <div
            :style="{ opacity: shape.hasDefaultVisionAccess ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultVisionAccess"
            :title="$t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
        >
            <font-awesome-icon icon="lightbulb" />
        </div>
        <template v-for="owner in shape.owners">
            <div class="owner" :key="owner.user">
                {{ owner.user }}
            </div>
            <div
                :key="'ownerEdit-' + owner.user"
                :style="{
                    opacity: owner.access.edit ? 1.0 : 0.3,
                    textAlign: 'center',
                }"
                :disabled="!owned"
                @click="toggleOwnerEditAccess(owner)"
                :title="$t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
            >
                <font-awesome-icon icon="pencil-alt" />
            </div>
            <div
                :key="'ownerMovement-' + owner.user"
                :style="{ opacity: owner.access.movement ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerMovementAccess(owner)"
                :title="$t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
            >
                <font-awesome-icon icon="arrows-alt" />
            </div>
            <div
                :key="'ownerVision-' + owner.user"
                :style="{ opacity: owner.access.vision ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerVisionAccess(owner)"
                :title="$t('game.ui.selection.edit_dialog.access.toggle_vision_access')"
            >
                <font-awesome-icon icon="lightbulb" />
            </div>
            <div
                :key="'remove-' + owner.user"
                @click="removeOwner(owner.user)"
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center', gridColumnStart: 'remove' }"
                :disabled="!owned"
                :title="$t('game.ui.selection.edit_dialog.access.remove_owner_access')"
            >
                <font-awesome-icon icon="trash-alt" />
            </div>
        </template>
        <select id="dropdown" ref="accessDropdown" v-show="playersWithoutAccess.length > 0 && owned">
            <option v-for="player in playersWithoutAccess" :key="player.id" :disabled="!owned">
                {{ player.name }}
            </option>
        </select>
        <button
            id="button"
            @click="addOwner"
            v-show="playersWithoutAccess.length > 0 && owned"
            v-t="'game.ui.selection.edit_dialog.access.add_access'"
        ></button>
    </div>
</template>

<style scoped>
.owner {
    grid-column-start: name;
    margin-bottom: 5px;
    margin-left: 5px;
}

.panel {
    grid-template-columns: [name] 1fr [edit] 30px [move] 30px [vision] 30px [remove] 30px [end];
    grid-column-gap: 5px;
    align-items: center;
    padding-bottom: 1em;
}

#button {
    grid-column: edit/end;
    margin-top: 5px;
    /* min-width: 4vw; */
}

#dropdown {
    grid-column: name/edit;
    margin-top: 5px;
    min-width: 7vw;
}
</style>
