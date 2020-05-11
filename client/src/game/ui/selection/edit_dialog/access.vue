<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import { Prop } from "vue-property-decorator";

import { socket } from "@/game/api/socket";
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
        this.shape.addOwner({ user: selectedUser, editAccess: true, visionAccess: true }, true);
    }
    removeOwner(value: string): void {
        if (!this.owned) return;
        this.shape.removeOwner(value, true);
    }
    toggleOwnerEditAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        this.shape.updateOwner({ ...owner, editAccess: !owner.editAccess }, true);
    }
    toggleOwnerVisionAccess(owner: ShapeOwner): void {
        if (!this.owned) return;
        this.shape.updateOwner({ ...owner, visionAccess: !owner.visionAccess }, true);
    }
    toggleDefaultEditAccess(): void {
        if (!this.owned) return;
        this.shape.updateDefaultOwner({ editAccess: !this.shape.defaultEditAccess });
        socket.emit("Shape.Owner.Default.Update", {
            shape: this.shape.uuid,
            // eslint-disable-next-line @typescript-eslint/camelcase
            edit_access: this.shape.defaultEditAccess,
        });
    }
    toggleDefaultVisionAccess(): void {
        if (!this.owned) return;
        this.shape.updateDefaultOwner({ visionAccess: !this.shape.defaultVisionAccess });
        socket.emit("Shape.Owner.Default.Update", {
            shape: this.shape.uuid,
            // eslint-disable-next-line @typescript-eslint/camelcase
            vision_access: this.shape.defaultVisionAccess,
        });
    }
}
</script>

<template>
    <div style="display:contents">
        <div class="spanrow header">Access</div>
        <div class="owner"><i>Default</i></div>
        <div
            :style="{
                opacity: shape.defaultEditAccess ? 1.0 : 0.3,
                textAlign: 'center',
                gridColumnStart: 'visible',
            }"
            :disabled="!owned"
            @click="toggleDefaultEditAccess"
            title="Toggle edit access"
        >
            <i class="fas fa-pencil-alt"></i>
        </div>
        <div
            :style="{ opacity: shape.defaultVisionAccess ? 1.0 : 0.3, textAlign: 'center' }"
            :disabled="!owned"
            @click="toggleDefaultVisionAccess"
            title="Toggle vision access"
        >
            <i class="fas fa-lightbulb"></i>
        </div>
        <template v-for="owner in shape.owners">
            <div class="owner" :key="owner.user">
                {{ owner.user }}
            </div>
            <div
                :key="'ownerEdit-' + owner.user"
                :style="{
                    opacity: owner.editAccess ? 1.0 : 0.3,
                    textAlign: 'center',
                    gridColumnStart: 'visible',
                }"
                :disabled="!owned"
                @click="toggleOwnerEditAccess(owner)"
                title="Toggle edit access"
            >
                <i class="fas fa-pencil-alt"></i>
            </div>
            <div
                :key="'ownerVision-' + owner.user"
                :style="{ opacity: owner.visionAccess ? 1.0 : 0.3, textAlign: 'center' }"
                :disabled="!owned"
                @click="toggleOwnerVisionAccess(owner)"
                title="Toggle vision access"
            >
                <i class="fas fa-lightbulb"></i>
            </div>
            <div
                :key="'remove-' + owner.user"
                @click="removeOwner(owner.user)"
                :style="{ opacity: owned ? 1.0 : 0.3, textAlign: 'center', gridColumnStart: 'remove' }"
                :disabled="!owned"
                title="Remove owner access"
            >
                <i class="fas fa-trash-alt"></i>
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
