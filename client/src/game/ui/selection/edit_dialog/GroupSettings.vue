<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

import ConfirmDialog from "@/core/components/modals/confirm.vue";
import { Shape } from "@/game/shapes/shape";

import { SyncTo } from "../../../../core/models/types";
import { EventBus } from "../../../event-bus";
import {
    CHARACTER_SETS,
    createNewGroupForShapes,
    getBadgeCharacters,
    getGroup,
    getGroupMembers,
    removeGroup,
    removeGroupMember,
    setCharacterSet,
    setCreationOrder,
} from "../../../groups";
import { layerManager } from "../../../layers/manager";
import { gameManager } from "../../../manager";
import { CREATION_ORDER_OPTIONS, CREATION_ORDER_TYPES, Group } from "../../../models/groups";
import { ActiveShapeState, activeShapeStore } from "../../ActiveShapeStore";

@Component({ components: { ConfirmDialog } })
export default class GroupSettings extends Vue {
    $refs!: {
        confirmDialog: ConfirmDialog;
        toggleCheckbox: HTMLInputElement;
    };

    get owned(): boolean {
        return activeShapeStore.hasEditAccess;
    }

    get shape(): ActiveShapeState {
        return activeShapeStore;
    }

    mounted(): void {
        EventBus.$on("EditDialog.Group.Update", () => this.updateGroupToggleState());
        this.updateGroupToggleState();
    }

    beforeDestroy(): void {
        EventBus.$off("EditDialog.Group.Update");
    }

    characterSet = ["numbers", "latin characters", "custom"];

    // this is only used for shapes that have no group yet and might want to create one
    characterSetSelected = 0;
    customText: string[] = [];
    creationOrder: CREATION_ORDER_TYPES = "incrementing";

    invalidate(): void {
        const shape = layerManager.UUIDMap.get(activeShapeStore.uuid!)!;
        shape.invalidate(true);
    }

    updateGroupToggleState(): void {
        if (!this.owned) return;
        if (this.shape.groupId === undefined) return;

        const members = this.getGroupMembers();
        if (members.length === 0 || new Set(members.map((m) => m.showBadge)).size > 1) {
            this.$refs.toggleCheckbox.indeterminate = true;
        } else {
            this.$refs.toggleCheckbox.indeterminate = false;
            this.$refs.toggleCheckbox.checked = members[0].showBadge;
        }
        this.$forceUpdate();
    }

    getBadgeCharacters(shape: Shape): string {
        return getBadgeCharacters(shape);
    }

    getCreationOrderTypes(): CREATION_ORDER_TYPES[] {
        return CREATION_ORDER_OPTIONS;
    }

    getGroupMembers(): Shape[] {
        const group = this.getGroup();
        if (group === undefined) {
            return [];
        } else {
            return getGroupMembers(group.uuid).sort((a, b) => a.badge - b.badge);
        }
    }

    getGroup(): Group | undefined {
        if (this.shape.groupId) {
            return getGroup(this.shape.groupId);
        } else {
            return undefined;
        }
    }

    getCharacterSetSelected(): number | undefined {
        const group = this.getGroup();
        if (group === undefined) {
            return this.characterSetSelected;
        } else {
            const charset = group.characterSet;
            const index = CHARACTER_SETS.findIndex((cs) => cs.join(",") === charset.join(","));
            return index >= 0 ? index : 2;
        }
    }

    setCharacterSetSelected(characterSetSelected: number): void {
        if (!this.owned) return;
        const group = this.getGroup();
        if (group === undefined) {
            this.characterSetSelected = characterSetSelected;
        } else {
            if (characterSetSelected === 2) {
                setCharacterSet(group.uuid, []);
            } else {
                setCharacterSet(group.uuid, CHARACTER_SETS[characterSetSelected]);
                this.invalidate();
            }
        }
        this.$forceUpdate();
    }

    getCustomCharset(): string {
        const group = this.getGroup();
        if (group === undefined) {
            return this.customText.join(",");
        } else {
            return group.characterSet.join(",");
        }
    }

    setCustomCharset(characterSet: { target: HTMLInputElement }): void {
        if (!this.owned) return;
        const group = this.getGroup();
        const value = characterSet.target.value.split(",");
        if (group === undefined) {
            this.customText = value;
        } else {
            setCharacterSet(group.uuid, value);
            this.invalidate();
        }
    }

    getCreationOrder(): string {
        const group = this.getGroup();
        if (group === undefined) {
            return this.creationOrder;
        } else {
            return group.creationOrder;
        }
    }

    async setCreationOrder(creationOrder: CREATION_ORDER_TYPES): Promise<void> {
        if (!this.owned) return;
        const group = this.getGroup();
        if (group === undefined) {
            this.creationOrder = creationOrder;
        } else {
            const doChange = await this.$refs.confirmDialog.open(
                "Changing creation order",
                "Are you sure you wish to change the creation order? This will change all badges in this group.",
            );
            if (doChange) {
                setCreationOrder(group.uuid, creationOrder);
                this.invalidate();
            }
        }

        this.$forceUpdate();
    }

    centerMember(member: Shape): void {
        if (!this.owned) return;
        gameManager.setCenterPosition(member.center());
    }

    toggleHighlight(member: Shape, show: boolean): void {
        if (!this.owned) return;
        member.showHighlight = show;
        member.layer.invalidate(true);
    }

    createGroup(): void {
        if (!this.owned) return;
        if (this.shape.groupId !== undefined) return;
        createNewGroupForShapes([this.shape.uuid!]);
        this.$forceUpdate();
    }

    async deleteGroup(): Promise<void> {
        if (!this.owned) return;
        if (this.shape.groupId === undefined) return;
        const remove = await this.$refs.confirmDialog.open(
            "Removing group",
            "Are you sure you wish to remove this group. There might be shapes in other locations that are associated with this group as well.",
        );
        if (remove) {
            removeGroup(this.shape.groupId, true);
            this.$forceUpdate();
        }
    }

    updateToggles(checked: boolean): void {
        if (!this.owned) return;
        for (const member of this.getGroupMembers()) {
            if (member.showBadge !== checked) member.setShowBadge(checked, SyncTo.SERVER);
        }
    }

    removeMember(member: Shape): void {
        if (!this.owned) return;
        removeGroupMember(member.groupId!, member.uuid, true);
    }

    showBadge(member: Shape, checked: boolean): void {
        if (!this.owned) return;
        // This and Keyboard are the only places currently where we would need to update both UI and Server.
        // Might need to introduce a SyncTo.BOTH
        member.setShowBadge(checked, SyncTo.SERVER);
        if (member.uuid === activeShapeStore.uuid)
            activeShapeStore.setShowBadge({ showBadge: checked, syncTo: SyncTo.UI });
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <ConfirmDialog ref="confirmDialog"></ConfirmDialog>
        <div class="spanrow header">Rules</div>
        <div class="rule">Character set</div>
        <div class="selection-box">
            <template v-for="(cs, i) of characterSet">
                <div
                    :key="cs"
                    :class="{ 'selection-box-active': i === getCharacterSetSelected() }"
                    @click="setCharacterSetSelected(i)"
                >
                    {{ cs }}
                </div>
            </template>
        </div>
        <template v-if="getCharacterSetSelected() === 2">
            <div class="rule">Custom charset</div>
            <div style="grid-column: fill/end">
                <input type="text" :value="getCustomCharset()" @change="setCustomCharset" placeholder="α,β,γ,δ,ε" />
            </div>
        </template>
        <div class="rule">Creation order</div>
        <div class="selection-box">
            <template v-for="co of getCreationOrderTypes()">
                <div
                    :key="co"
                    :class="{ 'selection-box-active': co === getCreationOrder() }"
                    @click="setCreationOrder(co)"
                >
                    {{ co }}
                </div>
            </template>
        </div>
        <template v-if="shape.groupId !== undefined">
            <div class="spanrow header">Members</div>
            <label class="rule" style="grid-column: badge/toggle" for="toggleCheckbox">
                Show badge on all members:
            </label>
            <div>
                <input
                    id="toggleCheckbox"
                    type="checkbox"
                    ref="toggleCheckbox"
                    @click="updateToggles($event.target.checked)"
                />
            </div>
            <div></div>
            <div class="subheader">Badge</div>
            <div></div>
            <div class="subheader">Show Badge</div>
            <div class="subheader">Remove</div>
            <template v-for="member of getGroupMembers()">
                <div
                    class="badge"
                    :key="'name-' + member.uuid"
                    title="Center on this member"
                    @click="centerMember(member)"
                    @mouseenter="toggleHighlight(member, true)"
                    @mouseleave="toggleHighlight(member, false)"
                >
                    <template v-if="member.uuid === shape.uuid">> {{ getBadgeCharacters(member) }} &lt;</template>
                    <template v-else>
                        {{ getBadgeCharacters(member) }}
                    </template>
                </div>
                <div :key="'fill-' + member.uuid"></div>
                <div :key="'toggle-' + member.uuid">
                    <input
                        type="checkbox"
                        :checked="member.showBadge"
                        @click="showBadge(member, $event.target.checked)"
                    />
                </div>
                <div :key="'remove-' + member.uuid" :style="{ textAlign: 'center' }">
                    <font-awesome-icon icon="trash-alt" @click="removeMember(member)" />
                </div>
            </template>
        </template>
        <template v-if="shape.groupId === undefined">
            <div class="spanrow header">Actions</div>
            <div></div>
            <div></div>
            <div></div>
            <div style="grid-column: toggle/end">
                <button class="danger" @click="createGroup">Create new group</button>
            </div>
        </template>
        <template v-else>
            <div class="spanrow header">Danger Zone</div>
            <div></div>
            <div></div>
            <div style="grid-column: toggle/end"><button class="danger" @click="deleteGroup">Delete group</button></div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.panel {
    grid-template-columns: [badge] 1fr [fill] auto [toggle] 100px [remove] 50px [end];
    grid-column-gap: 10px;
    align-items: center;
    padding-bottom: 1em;
    justify-items: center;
    overflow: auto;
    max-height: 65vh;
}

input[type="text"] {
    padding: 2px;
}

.rule {
    justify-self: normal;
}

.subheader {
    text-decoration: underline;
}

.badge:hover {
    cursor: pointer;
}

.selection-box {
    display: flex;
    flex-direction: row;
    grid-column: fill / end;

    > div {
        border: solid 1px;
        border-left: 0;
        padding: 7px;

        &:first-child {
            border: solid 1px;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
        }

        &:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
        }
    }
}

.selection-box > div:hover,
.selection-box-active {
    background-color: #82c8a0;
    cursor: pointer;
}
</style>
