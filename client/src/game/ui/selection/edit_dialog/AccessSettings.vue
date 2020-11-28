<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { ShapeOwner } from "../../../shapes/owners";

@Component
export default class AccessSettings extends Vue {
    @Prop() owned!: boolean;
    @Prop() shape!: Shape;

    $refs!: {
        accessDropdown: HTMLSelectElement;
    };

    get players(): { id: number; name: string }[] {
        return gameStore.players;
    }

    get playersWithoutAccess(): { id: number; name: string }[] {
        return gameStore.players.filter(p => !this.shape.hasOwner(p.name));
    }

    addOwner(): void {
        if (!this.owned) return;
        const dropdown = this.$refs.accessDropdown;
        const selectedUser = dropdown.options[dropdown.selectedIndex].value;
        if (selectedUser === "") return;
        this.shape.addOwner({ user: selectedUser, access: { edit: true, movement: true, vision: true } }, true);
    }

    removeOwner(value: string): void {
        if (!this.owned) return;
        this.shape.removeOwner(value, true);
    }

    toggleOwnerEditAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        this.shape.updateOwner({ ...owner, access: { ...owner.access, edit: !owner.access.edit } }, true);
    }
    toggleOwnerMovementAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        this.shape.updateOwner({ ...owner, access: { ...owner.access, movement: !owner.access.movement } }, true);
    }

    toggleOwnerVisionAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        this.shape.updateOwner({ ...owner, access: { ...owner.access, vision: !owner.access.vision } }, true);
    }

    toggleDefaultEditAccess(): void {
        if (!this.owned) return;
        this.shape.updateDefaultOwner({ ...this.shape.defaultAccess, edit: !this.shape.defaultAccess.edit }, true);
    }

    toggleDefaultMovementAccess(): void {
        if (!this.owned) return;
        this.shape.updateDefaultOwner(
            { ...this.shape.defaultAccess, movement: !this.shape.defaultAccess.movement },
            true,
        );
    }

    toggleDefaultVisionAccess(): void {
        if (!this.owned) return;
        this.shape.updateDefaultOwner({ ...this.shape.defaultAccess, vision: !this.shape.defaultAccess.vision }, true);
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header" v-t="'game.ui.selection.edit_dialog.access.access'"></div>
        <div class="owner"><em v-t="'game.ui.selection.edit_dialog.access.default'"></em></div>
        <div
            :style="{
                opacity: shape.defaultAccess.edit ? 1.0 : 0.3,
                textAlign: 'center',
            }"
            :disabled="!owned"
            @click="toggleDefaultEditAccess"
            :title="$t('game.ui.selection.edit_dialog.access.toggle_edit_access')"
        >
            <font-awesome-icon icon="pencil-alt" />
        </div>
        <div
            :style="{ opacity: shape.defaultAccess.movement ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultMovementAccess"
            :title="$t('game.ui.selection.edit_dialog.access.toggle_movement_access')"
        >
            <font-awesome-icon icon="arrows-alt" />
        </div>
        <div
            :style="{ opacity: shape.defaultAccess.vision ? 1.0 : 0.3, textAlign: 'center' }"
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
            <option v-for="player in playersWithoutAccess" :key="player.uuid" :disabled="!owned">
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
