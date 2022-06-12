<script setup lang="ts">
import { computed, toRef } from "vue";

import { SERVER_SYNC, UI_SYNC } from "../../../../core/models/types";
import { useModal } from "../../../../core/plugins/modals/plugin";
import { getChecked, getValue } from "../../../../core/utils";
import { activeShapeStore } from "../../../../store/activeShape";
import {
    CHARACTER_SETS,
    createNewGroupForShapes,
    getBadgeCharacters,
    groupMap,
    memberMap,
    removeGroup,
    removeGroupMember,
    setCharacterSet,
    setCreationOrder,
} from "../../../groups";
import { getShape } from "../../../id";
import type { CREATION_ORDER_TYPES } from "../../../models/groups";
import { CREATION_ORDER_OPTIONS } from "../../../models/groups";
import { setCenterPosition } from "../../../position";
import type { IShape } from "../../../shapes/interfaces";
import { accessSystem } from "../../../systems/access";

const groupId = toRef(activeShapeStore.state, "groupId");
const id = toRef(activeShapeStore.state, "id");

const modals = useModal();

const characterSet = ["numbers", "latin characters", "custom"];
let characterSetSelected = 0;
let customText: string[] = [];
let defaultCreationOrder: CREATION_ORDER_TYPES = "incrementing";

const owned = accessSystem.$.hasEditAccess;

const group = computed(() => {
    const groupId = activeShapeStore.state.groupId;
    if (groupId !== undefined) {
        return groupMap.value.get(groupId);
    } else {
        return undefined;
    }
});

const groupMembers = computed(() => {
    if (group.value === undefined) return [];

    const members = memberMap.value.get(group.value.uuid);
    if (members === undefined) return [];
    return [...members].map((m) => getShape(m)!).sort((a, b) => a.badge - b.badge);
});

function invalidate(): void {
    const shape = getShape(activeShapeStore.state.id!)!;
    shape.invalidate(true);
}

const selectedCharacterSet = computed({
    get() {
        if (group.value === undefined) {
            return characterSetSelected;
        } else {
            const charset = group.value.characterSet;
            const index = CHARACTER_SETS.findIndex((cs) => cs.join(",") === charset.join(","));
            return index >= 0 ? index : 2;
        }
    },
    set(index: number) {
        if (!owned.value) return;

        if (group.value === undefined) {
            characterSetSelected = index;
        } else {
            if (index === 2) {
                setCharacterSet(group.value.uuid, []);
            } else {
                setCharacterSet(group.value.uuid, CHARACTER_SETS[index]);
                invalidate();
            }
        }
    },
});

const customCharacterSet = computed({
    get() {
        if (group.value === undefined) {
            return customText.join(",");
        }
        return group.value.characterSet.join(",");
    },
    set(characterSet: string) {
        if (!owned.value) return;

        const value = characterSet.split(",");
        if (group.value === undefined) {
            customText = value;
        } else {
            setCharacterSet(group.value.uuid, value);
            invalidate();
        }
    },
});

const creationOrder = computed({
    get() {
        if (group.value === undefined) {
            return defaultCreationOrder;
        }
        return group.value.creationOrder;
    },
    async set(creationOrder: CREATION_ORDER_TYPES) {
        if (!owned.value) return;

        if (group.value === undefined) {
            defaultCreationOrder = creationOrder;
        } else {
            const doChange = await modals.confirm(
                "Changing creation order",
                "Are you sure you wish to change the creation order? This will change all badges in this group.",
            );
            if (doChange === true) {
                setCreationOrder(group.value.uuid, creationOrder);
                invalidate();
            }
        }
    },
});

function updateToggles(checked: boolean): void {
    if (!owned.value) return;
    for (const member of groupMembers.value) {
        if (member.showBadge !== checked) member.setShowBadge(checked, SERVER_SYNC);
    }
}

function centerMember(member: IShape): void {
    if (!owned.value) return;
    setCenterPosition(member.center());
}

function toggleHighlight(member: IShape, show: boolean): void {
    if (!owned.value) return;
    member.showHighlight = show;
    member.layer.invalidate(true);
}

function showBadge(member: IShape, checked: boolean): void {
    if (!owned.value) return;
    // This and Keyboard are the only places currently where we would need to update both UI and Server.
    // Might need to introduce a SyncTo.BOTH
    member.setShowBadge(checked, SERVER_SYNC);
    if (member.id === activeShapeStore.state.id) activeShapeStore.setShowBadge(checked, UI_SYNC);
}

function removeMember(member: IShape): void {
    if (!owned.value) return;
    removeGroupMember(member.groupId!, member.id, true);
}

function createGroup(): void {
    if (!owned.value) return;
    if (activeShapeStore.state.groupId !== undefined) return;
    createNewGroupForShapes([activeShapeStore.state.id!]);
}

async function deleteGroup(): Promise<void> {
    if (!owned.value) return;
    const groupId = activeShapeStore.state.groupId;
    if (groupId === undefined) return;
    const remove = await modals.confirm(
        "Removing group",
        "Are you sure you wish to remove this group. There might be shapes in other locations that are associated with this group as well.",
    );
    if (remove === true) {
        removeGroup(groupId, true);
    }
}
</script>

<template>
    <div class="panel restore-panel">
        <div class="spanrow header">Rules</div>
        <div class="rule">Character set</div>
        <div class="selection-box">
            <template v-for="(cs, i) of characterSet" :key="cs">
                <div :class="{ 'selection-box-active': i === selectedCharacterSet }" @click="selectedCharacterSet = i">
                    {{ cs }}
                </div>
            </template>
        </div>
        <template v-if="selectedCharacterSet === 2">
            <div class="rule">Custom charset</div>
            <div style="grid-column: fill/end">
                <input
                    type="text"
                    :value="customCharacterSet"
                    @change="customCharacterSet = getValue($event)"
                    placeholder="α,β,γ,δ,ε"
                />
            </div>
        </template>
        <div class="rule">Creation order</div>
        <div class="selection-box">
            <template v-for="co of CREATION_ORDER_OPTIONS" :key="co">
                <div :class="{ 'selection-box-active': co === creationOrder }" @click="creationOrder = co">
                    {{ co }}
                </div>
            </template>
        </div>
        <template v-if="groupId !== undefined">
            <div class="spanrow header">Members</div>
            <label class="rule" style="grid-column: badge/toggle" for="toggleCheckbox">
                Show badge on all members:
            </label>
            <div>
                <input
                    id="toggleCheckbox"
                    type="checkbox"
                    ref="toggleCheckbox"
                    @click="updateToggles(getChecked($event))"
                />
            </div>
            <div></div>
            <div class="subheader">Badge</div>
            <div></div>
            <div class="subheader">Show Badge</div>
            <div class="subheader">Remove</div>
            <template v-for="member of groupMembers" :key="member.uuid">
                <div
                    class="badge"
                    title="Center on this member"
                    @click="centerMember(member)"
                    @mouseenter="toggleHighlight(member, true)"
                    @mouseleave="toggleHighlight(member, false)"
                >
                    <template v-if="member.id === id">> {{ getBadgeCharacters(member) }} &lt;</template>
                    <template v-else>
                        {{ getBadgeCharacters(member) }}
                    </template>
                </div>
                <div></div>
                <div>
                    <input type="checkbox" :checked="member.showBadge" @click="showBadge(member, getChecked($event))" />
                </div>
                <div :style="{ textAlign: 'center' }">
                    <font-awesome-icon icon="trash-alt" @click="removeMember(member)" />
                </div>
            </template>
        </template>
        <template v-if="groupId === undefined">
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
