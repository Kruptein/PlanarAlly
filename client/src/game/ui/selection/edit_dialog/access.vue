<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import { Shape } from "@/game/shapes/shape";
import { gameStore } from "@/game/store";
import { ShapeOwner } from "../../../shapes/owners";

@Component
export default class EditDialogAccess extends Vue {
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
    <div style="display:contents">
        <div class="spanrow header">Access</div>
        <div class="owner"><em>Default</em></div>
        <div
            :style="{
                opacity: shape.defaultAccess.edit ? 1.0 : 0.3,
                textAlign: 'center',
                gridColumnStart: 'colour',
            }"
            :disabled="!owned"
            @click="toggleDefaultEditAccess"
            title="Toggle edit access"
        >
            <i aria-hidden="true" class="fas fa-pencil-alt"></i>
        </div>
        <div
            :style="{ opacity: shape.defaultAccess.movement ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultMovementAccess"
            title="Toggle movement access"
        >
            <i aria-hidden="true" class="fas fa-arrows-alt"></i>
        </div>
        <div
            :style="{ opacity: shape.defaultAccess.vision ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultVisionAccess"
            title="Toggle vision access"
        >
            <i aria-hidden="true" class="fas fa-lightbulb"></i>
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
                    gridColumnStart: 'colour',
                }"
                :disabled="!owned"
                @click="toggleOwnerEditAccess(owner)"
                title="Toggle edit access"
            >
                <i aria-hidden="true" class="fas fa-pencil-alt"></i>
            </div>
            <div
                :key="'ownerMovement-' + owner.user"
                :style="{ opacity: owner.access.movement ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerMovementAccess(owner)"
                title="Toggle movement access"
            >
                <i aria-hidden="true" class="fas fa-arrows-alt"></i>
            </div>
            <div
                :key="'ownerVision-' + owner.user"
                :style="{ opacity: owner.access.vision ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerVisionAccess(owner)"
                title="Toggle vision access"
            >
                <i aria-hidden="true" class="fas fa-lightbulb"></i>
            </div>
            <div
                :key="'remove-' + owner.user"
                @click="removeOwner(owner.user)"
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center', gridColumnStart: 'remove' }"
                :disabled="!owned"
                title="Remove owner access"
            >
                <i aria-hidden="true" class="fas fa-trash-alt"></i>
            </div>
        </template>
        <select
            style="grid-column: name/colour;margin-top:5px;"
            ref="accessDropdown"
            v-show="playersWithoutAccess.length > 0 && owned"
        >
            <option v-for="player in playersWithoutAccess" :key="player.uuid" :disabled="!owned">
                {{ player.name }}
            </option>
        </select>
        <button
            style="grid-column: visible/end;margin-top:5px;"
            @click="addOwner"
            v-show="playersWithoutAccess.length > 0 && owned"
        >
            Add access
        </button>
    </div>
</template>

<style scoped>
.owner {
    grid-column-start: name;
    margin-bottom: 5px;
    margin-left: 5px;
}
</style>
